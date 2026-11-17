[CmdletBinding()]
param([ValidateRange(1,100)][int]$Users=60,[ValidatePattern('^[0-9]+[smh]$')][string]$Hold='30m',[switch]$IncludeAi)
$ErrorActionPreference='Stop'
$work=$null
$completed=$false
$invoked=Get-Date
try{
    & (Join-Path $PSScriptRoot 'Prepare-StabilityTest.ps1') -Users $Users -DatabaseStorage volume
    $active=Get-Content -LiteralPath 'C:\CELL\reliability\active-run.json' -Raw -Encoding UTF8|ConvertFrom-Json
    $work=$active.work
    & (Join-Path $PSScriptRoot 'Capture-Environment.ps1') -Work $work
    $loadScript=Join-Path $PSScriptRoot 'Start-StabilityLoad.ps1'
    $shell=Join-Path $PSHOME 'powershell.exe'
    $load=Start-Process -FilePath $shell -ArgumentList @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',$loadScript,'-Work',$work,'-Hold',$Hold) -WindowStyle Hidden -PassThru -RedirectStandardOutput ($work+'\results\load-controller.txt') -RedirectStandardError ($work+'\results\load-controller-errors.txt')
    Start-Sleep -Seconds 8
    if($load.HasExited -and $load.ExitCode -ne 0){throw 'Load generator setup failed; inspect the controller log.'}
    $resources=Start-Process -FilePath $shell -ArgumentList @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',(Join-Path $PSScriptRoot 'Sample-ContainerResources.ps1'),'-Work',$work) -WindowStyle Hidden -PassThru
    if($IncludeAi){& (Join-Path $PSScriptRoot 'Run-AiBenchmark.ps1')}
    while(-not $load.HasExited){Start-Sleep -Seconds 15;$load.Refresh()}
    if($load.ExitCode -ne 0){throw 'Load controller failed; inspect the preserved log.'}
    [void]$resources.WaitForExit(35000)
    & (Join-Path $PSScriptRoot 'Collect-PostChecks.ps1') -Work $work
    $completed=$true
}finally{
    if(-not $work -and (Test-Path 'C:\CELL\reliability\active-run.json')){
        $candidate=Get-Content -LiteralPath 'C:\CELL\reliability\active-run.json' -Raw -Encoding UTF8|ConvertFrom-Json
        if((Test-Path ($candidate.work+'\metadata.json')) -and (Get-Item ($candidate.work+'\metadata.json')).CreationTime -ge $invoked){$work=$candidate.work}
    }
    if($work){
        $meta=Get-Content -LiteralPath ($work+'\metadata.json') -Raw -Encoding UTF8|ConvertFrom-Json
        $name=$meta.project+'-k6'
        $saved=$ErrorActionPreference
        try{
            $ErrorActionPreference='Continue'
            $inspection=& docker.exe inspect $name 2>$null
            if($LASTEXITCODE -eq 0){
                $container=($inspection|ConvertFrom-Json)[0]
                if($container.Config.Labels.'cell.reliability.run' -ceq $meta.project -and $container.State.Running){& docker.exe stop --time 15 $name|Out-Null}
            }
        }finally{$ErrorActionPreference=$saved}
        & (Join-Path $PSScriptRoot 'Complete-StabilityTest.ps1') -Work $work
    }
}
if($completed){
    & (Join-Path $PSScriptRoot 'Export-StabilityReport.ps1') -Work $work
    Write-Output ('Validation completed; evidence directory: '+$work+'\results')
}
