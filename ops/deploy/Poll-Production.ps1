[CmdletBinding()]
param([string]$DeployHome = '', [switch]$CheckOnly, [switch]$RetryFailed)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($DeployHome)) { $DeployHome = $PSScriptRoot }
$script:DeployHome = [IO.Path]::GetFullPath($DeployHome)
. (Join-Path $PSScriptRoot 'Deployment.Common.ps1')
$lock = $null
try {
    # Also excludes a manual deployment while Task Scheduler is running one.
    try { $lock = [IO.File]::Open((Join-Path $DeployHome 'deploy.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
    catch [IO.IOException] { exit 0 }
    $script:Config = Read-JsonFile (Join-Path $DeployHome 'config.json')
    $script:DockerExe = $script:Config.docker_exe
    $env:CELL_SERVER_ROOT = $script:Config.server_root.Replace('\', '/')
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-ProductionPoll -CheckOnly:$CheckOnly -RetryFailed:$RetryFailed
} catch {
    Write-DeployLog ('ERROR ' + $_.Exception.Message)
    exit 1
} finally {
    if ($null -ne $lock) { $lock.Dispose() }
}
