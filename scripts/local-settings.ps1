$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.local'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$settingsPath = Join-Path $runtimeDir 'settings.json'
if (-not (Test-Path -LiteralPath $settingsPath)) {
    $settings = [ordered]@{
        adminPassword = 'Local-' + [guid]::NewGuid().ToString('N').Substring(0, 12) + '!'
        jwtSecret = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
        dbPassword = [guid]::NewGuid().ToString('N')
        python = $(if (Test-Path (Join-Path $repoRoot '.venv/Scripts/python.exe')) { Join-Path $repoRoot '.venv/Scripts/python.exe' } else { 'python' })
    }
    $settings | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath $settingsPath
}
$settings = Get-Content -Raw -Encoding UTF8 -LiteralPath $settingsPath | ConvertFrom-Json
$env:LOCAL_ADMIN_PASSWORD = $settings.adminPassword
$env:LOCAL_JWT_SECRET = $settings.jwtSecret
$env:LOCAL_DB_PASSWORD = $settings.dbPassword
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONUNBUFFERED = '1'
$env:COLORIZER_DATA_DIR = Join-Path $runtimeDir 'colorizer'
$env:COLORIZER_SECRET_KEY = $settings.jwtSecret
$env:COLORIZER_SECURE_COOKIE = '0'
