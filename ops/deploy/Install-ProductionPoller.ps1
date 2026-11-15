[CmdletBinding()]
param(
    [string]$ServerRoot = 'C:\CELL\server',
    [string]$DeployHome = 'C:\CELL\autodeploy',
    [string]$Repository = 'C-E-L-L/DEV',
    [string]$TaskName = 'CELL-AutoDeploy',
    [ValidateRange(2, 30)][int]$PollMinutes = 2
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Deployment.Common.ps1')
$ServerRoot = (Resolve-Path -LiteralPath $ServerRoot).Path
$script:DeployHome = [IO.Path]::GetFullPath($DeployHome)
$script:DockerExe = (Get-Command docker.exe -ErrorAction Stop).Source
$script:Config = [pscustomobject]@{ server_root = $ServerRoot; repository = $Repository; docker_exe = $script:DockerExe }
foreach ($path in @('.env', 'ssl/cert.pem', 'ssl/key.pem', 'data', 'ai-server/weights')) {
    if (-not (Test-Path -LiteralPath (Join-Path $ServerRoot $path))) { throw ('Production file/directory missing: ' + $path) }
}
Assert-ProductionMounts
if (Test-Path -LiteralPath (Join-Path $DeployHome 'state.json')) {
    throw 'An installation already exists. Do not overwrite its state or rollback baseline.'
}

# Verify the existing SQL baseline using schema metadata only; never run SQL migrations here.
$sql = @'
SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='celldb' AND
((table_name='tasks' AND column_name IN ('deadline_at','animal_species_id','kind','class_labels','published_at','prepared_at','revision','require_labels','results_after_deadline'))
OR (table_name='student_roster' AND column_name IN ('name','section'))
OR (table_name='crop_issue_replies' AND column_name='message')
OR (table_name='cell_classes' AND column_name='code')
OR (table_name='task_attempts' AND column_name='finalized_at'));
'@
$check = $sql | & $script:DockerExe exec -i dev-mysql-1 sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql --user=root --batch --skip-column-names celldb'
if ($LASTEXITCODE -ne 0 -or ($check -join '').Trim() -ne '14') { throw 'Production migration baseline is incomplete. Install stopped.' }

New-Item -ItemType Directory -Path $DeployHome -Force | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
# Runtime logs/rollback metadata are local and readable by this account and administrators only.
& icacls.exe $DeployHome /inheritance:r /grant:r "${identity}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' 'BUILTIN\Administrators:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not protect deployment directory permissions.' }
foreach ($file in @('Deployment.Common.ps1', 'Poll-Production.ps1')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination (Join-Path $DeployHome $file)
}
Write-JsonFile $script:Config (Join-Path $DeployHome 'config.json')

$frontend = (Invoke-Docker @('inspect', 'dev-frontend-1') | ConvertFrom-Json)[0]
$files = $frontend.Config.Labels.'com.docker.compose.project.config_files'.Split(',')
$composeArgs = @('compose', '--project-name', 'dev', '--project-directory', $ServerRoot, '--env-file', (Join-Path $ServerRoot '.env'))
foreach ($file in $files) { $composeArgs += @('--file', $file) }
$baseline = Invoke-Docker ($composeArgs + @('config', '--no-interpolate', '--format', 'json')) | ConvertFrom-Json
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
foreach ($service in @('frontend', 'backend', 'ai-server', 'colorizer')) {
    $container = (Invoke-Docker @('inspect', ('dev-' + $service + '-1')) | ConvertFrom-Json)[0]
    $tag = 'cell-rollback/' + $service + ':' + $stamp
    Invoke-Docker @('image', 'tag', $container.Image, $tag) | Out-Null
    $baseline.services.$service.image = $tag
    $baseline.services.$service.PSObject.Properties.Remove('build')
}
Write-JsonFile $baseline (Join-Path $DeployHome 'baseline-compose.json')
$sourceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$migrations = [ordered]@{}
Get-ChildItem -LiteralPath (Join-Path $sourceRoot 'backend/sql') -Filter '*.sql' -File | Sort-Object Name | ForEach-Object {
    $bytes = [Text.Encoding]::UTF8.GetBytes(([IO.File]::ReadAllText($_.FullName)).Replace("`r`n", "`n"))
    $hash = [Security.Cryptography.SHA256]::Create()
    try { $migrations[$_.Name] = ([BitConverter]::ToString($hash.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $hash.Dispose() }
}
$sha = (& git -C $ServerRoot rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $sha -notmatch '^[0-9a-f]{40}$') { throw 'Cannot determine installation source commit.' }
Write-JsonFile @{
    sha = $sha; run_number = 0; run_attempt = 0; legacy = $true
    compose_path = (Join-Path $DeployHome 'baseline-compose.json'); migrations = $migrations
} (Join-Path $DeployHome 'state.json')

$powershell = Join-Path $PSHOME 'powershell.exe'
$action = New-ScheduledTaskAction -Execute $powershell -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + (Join-Path $DeployHome 'Poll-Production.ps1') + '"') -WorkingDirectory $DeployHome
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $PollMinutes)
$atLogon = New-ScheduledTaskTrigger -AtLogOn -User $identity
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($trigger, $atLogon) -Principal $principal -Settings $settings -Description 'Pull tested CELL production images. Uses existing Docker Desktop account and persistent data.' | Out-Null
Write-DeployLog ('Installed task ' + $TaskName + ', every ' + $PollMinutes + ' minutes while this Windows account is signed in.')
