param([string]$Work)
$ErrorActionPreference='Stop'
$script:DeployHome='C:\CELL\autodeploy'
. (Join-Path $script:DeployHome 'Deployment.Common.ps1')
$script:DockerExe=(Get-Command docker.exe).Source
$metadata=Read-JsonFile ($Work+'\metadata.json')
$project=$metadata.project
if($project -cnotmatch '^cell-stability-[0-9]{8}-[0-9]{6}$'){throw 'Unexpected test project; cleanup refused.'}
$k6=$project+'-k6'
$inspection=& docker.exe inspect $k6 2>$null
if($LASTEXITCODE -eq 0){
    $container=($inspection|ConvertFrom-Json)[0]
    if($container.Config.Labels.'cell.reliability.run' -cne $project){throw 'Unexpected load generator; cleanup refused.'}
    if($container.State.Running){throw 'The load test is still running; explicit stop is required before cleanup.'}
    Invoke-Docker @('logs',$k6)|Set-Content -LiteralPath ($Work+'\results\k6-console.txt') -Encoding UTF8
    $container.State|ConvertTo-Json -Depth 10|Set-Content -LiteralPath ($Work+'\results\k6-exit.json') -Encoding UTF8
    Invoke-Docker @('rm',$k6)|Out-Null
}
Invoke-Docker @('compose','--project-name',$project,'--file',($Work+'\runtime\compose.json'),'down','--timeout','15')|Out-Null
$volumeName=$project+'_mysql_data'
$saved=$ErrorActionPreference
try{$ErrorActionPreference='Continue';$volumeText=& docker.exe volume inspect $volumeName 2>$null;$volumeExit=$LASTEXITCODE}finally{$ErrorActionPreference=$saved}
if($volumeExit -eq 0){
    $volume=($volumeText|ConvertFrom-Json)[0]
    if($volume.Labels.'com.docker.compose.project' -cne $project){throw 'Unexpected database volume; removal refused.'}
    Invoke-Docker @('volume','rm',$volumeName)|Out-Null
}
$paused=Join-Path $script:DeployHome 'paused'
if($metadata.owned_pause -and (Test-Path $paused) -and [IO.File]::ReadAllText($paused) -ceq $project){
    Remove-Item -LiteralPath $paused
    Write-Output 'Production automatic deployment resumed.'
}elseif($metadata.owned_pause -and (Test-Path $paused)){
    Write-Output 'Pause marker ownership changed; it was preserved for the operator.'
}
$metadata.status='completed'
$metadata|Add-Member -NotePropertyName completed_at -NotePropertyValue (Get-Date).ToString('o') -Force
Write-JsonFile $metadata ($Work+'\metadata.json')
Write-JsonFile @{completed_at=(Get-Date).ToString('o');isolated_resources_removed=$true;production_pause_remaining=(Test-Path $paused)} ($Work+'\results\cleanup.json')
Write-Output 'Only the isolated test project was removed. Report files were preserved.'
