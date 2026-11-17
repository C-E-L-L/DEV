$ErrorActionPreference='Stop'
$script:DeployHome='C:\CELL\autodeploy'
. (Join-Path $script:DeployHome 'Deployment.Common.ps1')
$script:DockerExe=(Get-Command docker.exe).Source
$a=Read-JsonFile 'C:\CELL\reliability\active-run.json'
$m=Read-JsonFile ($a.work+'\metadata.json')
$name=$m.project+'-ai-benchmark'
$root=$a.work.Replace('\','/')
$source=(Split-Path (Split-Path $PSScriptRoot -Parent) -Parent).Replace('\','/')
New-Item -ItemType Directory -Path ($a.work+'\runtime\ai-data') -Force|Out-Null
Copy-Item -LiteralPath ($source+'/data/diagnostic_gt/raw/images/1000_99.jpg') -Destination ($a.work+'\runtime\ai-benchmark.jpg') -Force
try{
    Invoke-Docker @('run','--detach','--name',$name,'--label',('cell.reliability.run='+$m.project),'--network',($m.project+'_default'),'--network-alias','ai-benchmark','--memory','2g','--cpus','2','--mount','type=bind,source=C:/CELL/server/ai-server/weights,target=/app/weights,readonly','--mount',('type=bind,source='+$root+'/runtime/ai-data,target=/data'),$m.images.'ai-server')|Out-Null
    Invoke-Docker @('run','--rm','--network',($m.project+'_default'),'--memory','256m','--cpus','1','--mount',('type=bind,source='+$root+',target=/work'),'--mount',('type=bind,source='+$source+'/ops/reliability/benchmark_ai.py,target=/benchmark.py,readonly'),'--entrypoint','python',$m.images.'ai-server','/benchmark.py')
}finally{
    $container=(Invoke-Docker @('inspect',$name)|ConvertFrom-Json)[0]
    if($container.Config.Labels.'cell.reliability.run' -ceq $m.project){
        $container.State|ConvertTo-Json -Depth 8|Set-Content -LiteralPath ($a.work+'\results\ai-container-state.json') -Encoding UTF8
        Invoke-Docker @('logs',$name)|Set-Content -LiteralPath ($a.work+'\results\ai-console.txt') -Encoding UTF8
        Invoke-Docker @('rm','--force',$name)|Out-Null
    }
}
