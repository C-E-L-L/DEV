Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-JsonFile($Value, [string]$Path) {
    $temporary = $Path + '.tmp'
    [IO.File]::WriteAllText($temporary, ($Value | ConvertTo-Json -Depth 40), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporary -Destination $Path -Force
}

function Read-JsonFile([string]$Path) {
    Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Write-DeployLog([string]$Message) {
    $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK'), $Message
    Write-Output $line
    Add-Content -LiteralPath (Join-Path $script:DeployHome 'deploy.log') -Value $line -Encoding UTF8
}

function Invoke-Docker([string[]]$DockerArgs) {
    # Windows PowerShell 5 treats native progress on stderr as ErrorRecords.
    $savedPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = & $script:DockerExe @DockerArgs 2>&1
        $exitCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $savedPreference }
    if ($exitCode -ne 0) {
        throw ('Docker failed ({0}): {1}' -f $exitCode, (($output | Select-Object -Last 8) -join "`n"))
    }
    return ($output -join "`n")
}

function Get-ComposeArgs([string]$ComposePath) {
    @('compose', '--project-name', 'dev', '--project-directory', $script:Config.server_root,
      '--env-file', (Join-Path $script:Config.server_root '.env'), '--file', $ComposePath)
}

function Get-MigrationSignature($Migrations) {
    (@($Migrations.PSObject.Properties | Sort-Object Name | ForEach-Object { $_.Name + '=' + $_.Value }) -join "`n")
}

function Assert-Manifest($Manifest, $Release, $State) {
    if ($Manifest.schema -ne 1 -or $Manifest.repository -cne $script:Config.repository) {
        throw 'Unrecognized deployment manifest or repository.'
    }
    if ($Manifest.sha -cnotmatch '^[0-9a-f]{40}$' -or $Manifest.compose_sha256 -cnotmatch '^[0-9a-f]{64}$') {
        throw 'Invalid source or compose checksum.'
    }
    $expectedTag = 'production-{0}-{1}-{2}' -f $Manifest.run_number, $Manifest.run_attempt, $Manifest.sha.Substring(0, 12)
    if ($Release.tag_name -cne $expectedTag -or $Release.author.login -cne 'github-actions[bot]' -or
        $Release.draft -or $Release.prerelease -or $Release.target_commitish -cne $Manifest.sha) {
        throw 'Release must be a complete production release published by GitHub Actions.'
    }
    $names = @($Manifest.images.PSObject.Properties.Name | Sort-Object)
    if (($names -join ',') -ne 'ai-server,backend,colorizer,frontend') {
        throw 'Deployment requires exactly four application images.'
    }
    foreach ($name in $names) {
        $prefix = 'ghcr.io/' + $script:Config.repository.ToLowerInvariant() + '-' + $name
        if ($Manifest.images.$name -cnotmatch ('^' + [regex]::Escape($prefix) + '@sha256:[0-9a-f]{64}$')) {
            throw ('Unexpected image for ' + $name)
        }
    }
    foreach ($migration in $Manifest.migrations.PSObject.Properties) {
        if ($migration.Name -cnotmatch '^[0-9]{8}_[A-Za-z0-9_]+\.sql$' -or $migration.Value -cnotmatch '^[0-9a-f]{64}$') {
            throw 'Invalid migration metadata.'
        }
    }
    if ((Get-MigrationSignature $Manifest.migrations) -cne (Get-MigrationSignature $State.migrations)) {
        throw 'SQL files changed. Deployment stopped before touching containers. Back up and apply the migration, then explicitly update the migration baseline. See AUTO_DEPLOY.md.'
    }
}

function Test-NewerRelease($Manifest, $State) {
    ([long]$Manifest.run_number -gt [long]$State.run_number) -or
    ([long]$Manifest.run_number -eq [long]$State.run_number -and [long]$Manifest.run_attempt -gt [long]$State.run_attempt)
}

function Get-ProductionRelease {
    # Public read only: no repository token or production secret is given to CI.
    try {
        Invoke-RestMethod -Uri ('https://api.github.com/repos/' + $script:Config.repository + '/releases/latest') `
            -Headers @{ Accept = 'application/vnd.github+json'; 'User-Agent' = 'CELL-production-poller' } -TimeoutSec 30
    } catch {
        if ($null -ne $_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 404) { return $null }
        throw
    }
}

function Save-ReleaseAsset($Release, [string]$Name, [string]$Destination) {
    $assets = @($Release.assets | Where-Object { $_.name -ceq $Name -and $_.state -eq 'uploaded' })
    if ($assets.Count -ne 1) { throw ('Missing/duplicate release asset: ' + $Name) }
    $expected = 'https://github.com/' + $script:Config.repository + '/releases/download/' + $Release.tag_name + '/' + $Name
    if ($assets[0].browser_download_url -cne $expected -or $assets[0].size -gt 1048576) {
        throw 'Unexpected release asset URL or size.'
    }
    # curl handles GitHub's release-asset CDN redirects reliably on Windows PowerShell 5.
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($null -eq $curl) { $curl = Get-Command curl -CommandType Application -ErrorAction Stop }
    $savedPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $downloadError = & $curl.Source --fail --silent --show-error --location --connect-timeout 10 --max-time 60 --output ($Destination + '.download') $expected 2>&1
        $downloadExit = $LASTEXITCODE
    } finally { $ErrorActionPreference = $savedPreference }
    if ($downloadExit -ne 0) { throw ('Release download failed: ' + ($downloadError -join ' ')) }
    Move-Item -LiteralPath ($Destination + '.download') -Destination $Destination -Force
}

function Assert-ProductionMounts {
    $backend = (Invoke-Docker @('inspect', 'dev-backend-1') | ConvertFrom-Json)[0]
    $actual = @($backend.Mounts | Where-Object { $_.Destination -eq '/data' })
    $expected = [IO.Path]::GetFullPath((Join-Path $script:Config.server_root 'data')).TrimEnd('\', '/')
    if ($actual.Count -ne 1 -or $actual[0].Source.TrimEnd('\', '/') -ine $expected) {
        throw 'The running backend data mount does not match the configured production root.'
    }
    $db = (Invoke-Docker @('inspect', 'dev-mysql-1') | ConvertFrom-Json)[0]
    $volume = @($db.Mounts | Where-Object { $_.Destination -eq '/var/lib/mysql' })
    if ($volume.Count -ne 1 -or $volume[0].Name -ne 'dev_mysql-data' -or $db.State.Health.Status -ne 'healthy') {
        throw 'The existing production MySQL volume/health check did not match.'
    }
    $colorizer = (Invoke-Docker @('inspect', 'dev-colorizer-1') | ConvertFrom-Json)[0]
    $volume = @($colorizer.Mounts | Where-Object { $_.Destination -eq '/data' })
    if ($volume.Count -ne 1 -or $volume[0].Name -ne 'dev_colorizer-data') {
        throw 'The existing colorizer volume did not match.'
    }
}

function Test-Application([string]$ComposePath, [switch]$Legacy) {
    $compose = Get-ComposeArgs $ComposePath
    # Nginx must re-resolve the backend name after a backend container replacement.
    Invoke-Docker ($compose + @('exec', '-T', 'frontend', 'nginx', '-s', 'reload')) | Out-Null
    if (-not $Legacy) {
        $body = Invoke-Docker ($compose + @('exec', '-T', 'frontend', 'wget', '--no-check-certificate', '-q', '-O', '-', 'https://127.0.0.1/api/health'))
        if (($body | ConvertFrom-Json).status -ne 'ok') { throw 'The public API proxy health check failed.' }
    }
}

function Apply-Candidate($Manifest, [string]$ComposePath, $State) {
    $compose = Get-ComposeArgs $ComposePath
    Assert-ProductionMounts
    Invoke-Docker ($compose + @('config', '--quiet')) | Out-Null
    # Every download finishes first. A registry/network error leaves production untouched.
    foreach ($property in $Manifest.images.PSObject.Properties) {
        Invoke-Docker @('pull', $property.Value) | Out-Null
    }
    Write-DeployLog ('Applying ' + $Manifest.sha)
    try {
        Invoke-Docker ($compose + @('up', '-d', '--no-deps', '--no-build', '--pull', 'never', '--wait', '--wait-timeout', '300',
            'ai-server', 'colorizer', 'backend', 'frontend')) | Out-Null
        Test-Application $ComposePath
        $next = [ordered]@{
            sha = $Manifest.sha; run_number = $Manifest.run_number; run_attempt = $Manifest.run_attempt
            compose_path = $ComposePath; previous_compose_path = $State.compose_path
            migrations = $Manifest.migrations; legacy = $false; deployed_at = (Get-Date).ToUniversalTime().ToString('o')
        }
        Write-JsonFile $next (Join-Path $script:DeployHome 'state.json')
        Write-DeployLog ('DEPLOYED ' + $Manifest.sha)
    } catch {
        $failure = $_.Exception.Message
        Write-DeployLog ('Deployment failed; restoring previous application images. ' + $failure)
        $rollback = Get-ComposeArgs $State.compose_path
        try {
            Invoke-Docker ($rollback + @('up', '-d', '--no-deps', '--no-build', '--pull', 'never', '--wait', '--wait-timeout', '300',
                'ai-server', 'colorizer', 'backend', 'frontend')) | Out-Null
            Test-Application $State.compose_path -Legacy:([bool]$State.legacy)
            Write-DeployLog 'ROLLED_BACK. Database and persistent volumes were not restored or modified by the deployer.'
        } catch {
            Write-DeployLog ('ROLLBACK_FAILED: ' + $_.Exception.Message)
        }
        Write-JsonFile @{ sha = $Manifest.sha; error = $failure; at = (Get-Date).ToString('o') } (Join-Path $script:DeployHome 'failed.json')
        throw $failure
    }
}

function Invoke-ProductionPoll([switch]$CheckOnly, [switch]$RetryFailed) {
    if (Test-Path -LiteralPath (Join-Path $script:DeployHome 'paused')) { return }
    $state = Read-JsonFile (Join-Path $script:DeployHome 'state.json')
    $release = Get-ProductionRelease
    if ($null -eq $release -or $release.tag_name -cnotmatch '^production-[0-9]+-[0-9]+-[0-9a-f]{12}$') { return }
    # Avoid downloading unchanged metadata every two minutes.
    if ($release.tag_name -ceq ('production-{0}-{1}-{2}' -f $state.run_number, $state.run_attempt, $state.sha.Substring(0, 12))) { return }
    $candidate = Join-Path $script:DeployHome ('releases/' + $release.tag_name)
    New-Item -ItemType Directory -Path $candidate -Force | Out-Null
    $manifestPath = Join-Path $candidate 'deploy.json'
    Save-ReleaseAsset $release 'deploy.json' $manifestPath
    $manifest = Read-JsonFile $manifestPath
    Assert-Manifest $manifest $release $state
    if (-not (Test-NewerRelease $manifest $state)) { return }
    $failedPath = Join-Path $script:DeployHome 'failed.json'
    if (-not $RetryFailed -and (Test-Path -LiteralPath $failedPath) -and (Read-JsonFile $failedPath).sha -ceq $manifest.sha) { return }
    $composePath = Join-Path $candidate 'compose.json'
    Save-ReleaseAsset $release 'compose.json' $composePath
    if ((Get-FileHash -LiteralPath $composePath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $manifest.compose_sha256) {
        throw 'Compose checksum mismatch. Production was not changed.'
    }
    if ($CheckOnly) {
        Assert-ProductionMounts
        Invoke-Docker ((Get-ComposeArgs $composePath) + @('config', '--quiet')) | Out-Null
        Write-DeployLog ('READY ' + $manifest.sha + ' (validation only; no containers changed)')
        return
    }
    Apply-Candidate $manifest $composePath $state
}
