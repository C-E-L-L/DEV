param([string]$Work,[ValidatePattern('^[0-9]+[smh]$')][string]$Hold='30m')
$ErrorActionPreference='Stop'
$script:DeployHome='C:\CELL\autodeploy'
. (Join-Path $script:DeployHome 'Deployment.Common.ps1')
$script:DockerExe=(Get-Command docker.exe).Source
if(-not $Work){$Work=(Read-JsonFile 'C:\CELL\reliability\active-run.json').work}
$meta=Read-JsonFile ($Work+'\metadata.json')
$network=$meta.project+'_default'
$source=(Split-Path (Split-Path $PSScriptRoot -Parent) -Parent).Replace('\','/')
Copy-Item -LiteralPath ($source+'/load_test/stability.k6.js') -Destination ($Work+'\runtime\stability.k6.js') -Force
Invoke-Docker @('run','--rm','--network',$network,'--memory','256m','--cpus','1','--mount',('type=bind,source='+$Work.Replace('\','/')+',target=/work,readonly'),'--mount',('type=bind,source='+$source+'/ops/reliability/probe_sandbox.py,target=/probe.py,readonly'),'--entrypoint','python',$meta.images.'ai-server','/probe.py')|Out-Null
$meta.status='running'
$meta|Add-Member -NotePropertyName load_started_at -NotePropertyValue (Get-Date).ToString('o') -Force
$meta|Add-Member -NotePropertyName hold_duration -NotePropertyValue $Hold -Force
Write-JsonFile $meta ($Work+'\metadata.json')
Write-Output ('Starting isolated load: '+$meta.users+' users; steady duration '+$Hold)
Invoke-Docker @('run','--detach','--name',($meta.project+'-k6'),'--label',('cell.reliability.run='+$meta.project),'--network',$network,'--memory','512m','--cpus','2','--user','0:0','--env','K6_NO_USAGE_REPORT=true','--env',('CELL_HOLD='+$Hold),'--mount',('type=bind,source='+$Work.Replace('\','/')+',target=/work,readonly'),'--mount',('type=bind,source='+$Work.Replace('\','/')+'/results,target=/results'),$meta.k6_image,'run','--out','csv=/results/metrics.csv','/work/runtime/stability.k6.js')|Out-Null
& (Join-Path $PSHOME 'powershell.exe') -NoProfile -NonInteractive -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Monitor-StabilityTest.ps1') -Work $Work
if($LASTEXITCODE -ne 0){throw 'Host monitoring failed.'}
