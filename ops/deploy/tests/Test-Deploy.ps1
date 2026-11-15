$ErrorActionPreference = 'Stop'
. (Join-Path (Split-Path $PSScriptRoot -Parent) 'Deployment.Common.ps1')

function Assert($Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function Assert-Throws([scriptblock]$Action, [string]$Pattern) {
    $threw = $false
    try { & $Action | Out-Null } catch {
        $threw = $true
        if ($_.Exception.Message -notmatch $Pattern) { throw }
    }
    Assert $threw ('Expected rejection: ' + $Pattern)
}

$script:DeployHome = Join-Path ([IO.Path]::GetTempPath()) ('cell-deploy-test-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $script:DeployHome | Out-Null
$script:Config = [pscustomobject]@{repository='C-E-L-L/DEV'; server_root=$script:DeployHome}
$images = [ordered]@{}
foreach ($service in @('frontend','backend','ai-server','colorizer')) {
    $images[$service] = 'ghcr.io/c-e-l-l/dev-' + $service + '@sha256:' + ('a' * 64)
}
$manifest = [pscustomobject]@{
    schema=1; repository='C-E-L-L/DEV'; sha=('b' * 40); compose_sha256=('c' * 64)
    run_number=2; run_attempt=1; images=[pscustomobject]$images
    migrations=[pscustomobject]@{'20261116_example.sql'=('d' * 64)}
}
$release = [pscustomobject]@{
    tag_name=('production-2-1-' + ('b' * 12)); target_commitish=('b' * 40)
    author=[pscustomobject]@{login='github-actions[bot]'}; draft=$false; prerelease=$false
}
$state = [pscustomobject]@{
    sha=('e' * 40); run_number=1; run_attempt=1; compose_path='previous.json'; legacy=$false
    migrations=$manifest.migrations
}
Assert-Manifest $manifest $release $state
Assert (Test-NewerRelease $manifest $state) 'New release should be eligible'
Assert (-not (Test-NewerRelease $state $manifest)) 'Old release must not overwrite a newer deployment'
$state.migrations = [pscustomobject]@{}
Assert-Throws { Assert-Manifest $manifest $release $state } 'SQL files changed'
$state.migrations = $manifest.migrations
$release.author.login = 'someone-else'
Assert-Throws { Assert-Manifest $manifest $release $state } 'published by GitHub Actions'
$release.author.login = 'github-actions[bot]'
$manifest.images.backend = 'ghcr.io/c-e-l-l/dev-backend:latest'
Assert-Throws { Assert-Manifest $manifest $release $state } 'Unexpected image'
$manifest.images.backend = 'ghcr.io/c-e-l-l/dev-backend@sha256:' + ('a' * 64)

# Simulate native Docker failures: no production Docker daemon is used by these tests.
$script:Commands = [Collections.Generic.List[string]]::new()
$script:FailPull = $false
$script:FailReplacement = $false
$script:FailSmoke = $false
function Assert-ProductionMounts { }
function Invoke-Docker([string[]]$DockerArgs) {
    $command = $DockerArgs -join ' '
    $script:Commands.Add($command)
    if ($script:FailPull -and $DockerArgs[0] -eq 'pull') { throw 'simulated download failure' }
    if ($script:FailReplacement -and $command -match 'candidate.json.* up ') { throw 'simulated startup failure' }
    return ''
}
function Test-Application([string]$ComposePath, [switch]$Legacy) {
    if ($script:FailSmoke -and $ComposePath -eq 'candidate.json') { throw 'simulated proxy failure' }
}
Write-JsonFile $state (Join-Path $script:DeployHome 'state.json')
$script:FailPull = $true
Assert-Throws { Apply-Candidate $manifest 'candidate.json' $state } 'download failure'
Assert (@($script:Commands | Where-Object { $_ -match ' up ' }).Count -eq 0) 'A pull failure must not replace any container'
Assert ((Read-JsonFile (Join-Path $script:DeployHome 'state.json')).sha -eq $state.sha) 'Failed pull must not advance state'
$script:FailPull = $false
$script:Commands.Clear()
$script:FailReplacement = $true
Assert-Throws { Apply-Candidate $manifest 'candidate.json' $state } 'startup failure'
Assert (@($script:Commands | Where-Object { $_ -match 'previous.json.* up ' }).Count -eq 1) 'Startup failure must roll back'
Assert ((Read-JsonFile (Join-Path $script:DeployHome 'state.json')).sha -eq $state.sha) 'Rollback must preserve previous state'
$script:FailReplacement = $false
$script:Commands.Clear()
$script:FailSmoke = $true
Assert-Throws { Apply-Candidate $manifest 'candidate.json' $state } 'proxy failure'
Assert (@($script:Commands | Where-Object { $_ -match 'previous.json.* up ' }).Count -eq 1) 'Proxy failure must roll back'
$script:FailSmoke = $false
Apply-Candidate $manifest 'candidate.json' $state | Out-Null
Assert ((Read-JsonFile (Join-Path $script:DeployHome 'state.json')).sha -eq $manifest.sha) 'Only a healthy deployment advances state'
Assert (@($script:Commands | Where-Object { $_ -match ' down|prune|mysql.* up|volume rm' }).Count -eq 0) 'Deployment must never remove persistent data'
Write-Output 'Deployment tests passed: release trust, SQL gate, version ordering, pull failure, startup rollback, proxy rollback, successful state commit.'
# Preserve the tiny fixture directory for inspection; it contains no secrets.
