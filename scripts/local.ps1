param(
    [ValidateSet('Start','Stop','Status')][string]$Action = 'Start',
    [ValidateSet('H2','MySQL')][string]$Database = 'H2',
    [switch]$SkipAI,
    [switch]$WithColorizer
)
. "$PSScriptRoot/local-settings.ps1"
$statePath = Join-Path $runtimeDir 'processes.json'
$state = @()
if (Test-Path -LiteralPath $statePath) {
    $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
}
function Get-OwnedProcess($entry) {
    if (-not $entry -or -not $entry.id) { return $null }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($entry.id)" -ErrorAction SilentlyContinue
    $runner = Join-Path $PSScriptRoot 'run-local-service.ps1'
    if ($process -and $process.Name -eq 'powershell.exe' -and $process.CommandLine.Contains($runner) -and $process.CommandLine.Contains("-Service $($entry.service) ")) {
        return $process
    }
    return $null
}
if ($Action -eq 'Stop') {
    foreach ($entry in $state) {
        if (Get-OwnedProcess $entry) {
            & taskkill.exe /PID $entry.id /T /F | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Could not stop $($entry.service)." }
        }
    }
    Set-Content -LiteralPath $statePath -Value '[]' -Encoding UTF8
    Write-Host 'Local services stopped. Database and uploaded files are preserved.'
    exit
}
if ($Action -eq 'Status') {
    $rows = foreach ($entry in $state) {
        [pscustomobject]@{ Service = $entry.service; Running = [bool](Get-OwnedProcess $entry); PID = $entry.id }
    }
    $rows | Format-Table | Out-Host
    Write-Host 'URL: http://127.0.0.1:15173'
    Write-Host "Logs: $runtimeDir"
    exit
}
if (@($state | Where-Object { Get-OwnedProcess $_ }).Count -gt 0) {
    throw 'Local services are already running. Use Stop before starting again.'
}
$services = @('backend','frontend')
if (-not $SkipAI) { $services += 'ai' }
if ($WithColorizer) { $services += 'colorizer' }
$ports = @{ backend = 18080; frontend = 15173; ai = 18001; colorizer = 18501 }
foreach ($service in $services) {
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $ports[$service])
    try { $probe.Start() } catch { throw "Port $($ports[$service]) is occupied ($service)." }
    finally { $probe.Stop() }
}
if (-not (Test-Path (Join-Path $repoRoot 'frontend/node_modules/vite/bin/vite.js'))) {
    Push-Location (Join-Path $repoRoot 'frontend')
    try {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
    } finally { Pop-Location }
}
if (-not $SkipAI) {
    & $settings.python -c 'import fastapi, uvicorn, torch, torchvision, ultralytics, cv2, multipart, httpx'
    if ($LASTEXITCODE -ne 0) { throw 'Install ai-server/requirements.txt into your Python environment and set python in .local/settings.json.' }
}
if ($WithColorizer) {
    & $settings.python -c 'import flask, pydicom, matplotlib'
    if ($LASTEXITCODE -ne 0) { throw 'Install Flask, pydicom and matplotlib into the configured Python environment.' }
}
if ($Database -eq 'MySQL') {
    Push-Location $repoRoot
    try {
        & docker compose -f compose.local.yml up -d --wait
        if ($LASTEXITCODE -ne 0) { throw 'Local MySQL startup failed.' }
    } finally { Pop-Location }
}
$state = @()
Push-Location (Join-Path $repoRoot 'backend')
try {
    & .\gradlew.bat bootJar --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
} finally { Pop-Location }
try {
    foreach ($service in $services) {
        $arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Service {1} -Database {2}' -f (Join-Path $PSScriptRoot 'run-local-service.ps1'), $service, $Database
        $process = Start-Process powershell.exe -WindowStyle Hidden -PassThru -ArgumentList $arguments `
            -RedirectStandardOutput (Join-Path $runtimeDir "$service.log") `
            -RedirectStandardError (Join-Path $runtimeDir "$service.err.log")
        $state += [pscustomobject]@{ service = $service; id = $process.Id; started = $process.StartTime.ToUniversalTime().Ticks.ToString() }
        ConvertTo-Json -InputObject @($state) | Set-Content -Encoding UTF8 -LiteralPath $statePath
    }
} catch {
    foreach ($entry in $state) { if (Get-OwnedProcess $entry) { & taskkill.exe /PID $entry.id /T /F | Out-Null } }
    throw
}
Write-Host 'Services are starting. First backend build / AI load may take a few minutes.'
Write-Host 'Open http://127.0.0.1:15173/login after backend.log shows Started CellApplication.'
Write-Host "Login: local-admin (password: .local/settings.json -> adminPassword)"
Write-Host "Database: $Database | Logs: $runtimeDir"
