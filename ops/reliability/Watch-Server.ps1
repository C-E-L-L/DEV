[CmdletBinding()]
param([string]$ServiceHome=$PSScriptRoot,[switch]$Once,[switch]$SkipHttpProbe)
$ErrorActionPreference='Stop'
if(-not $ServiceHome){$ServiceHome=$PSScriptRoot}
$lock=$null
try{$lock=[IO.File]::Open((Join-Path $ServiceHome 'watchdog.lock'),'OpenOrCreate','ReadWrite','None')}catch [IO.IOException]{exit 0}
Add-Type @'
using System.Runtime.InteropServices;
public static class CellPowerGuard {
 [DllImport("kernel32.dll", SetLastError=true)] public static extern uint SetThreadExecutionState(uint flags);
}
'@
$config=Get-Content -Raw (Join-Path $ServiceHome 'config.json')|ConvertFrom-Json
function Native([string[]]$Arguments){
    $saved=$ErrorActionPreference
    try{$ErrorActionPreference='Continue';$output=& $config.docker @Arguments 2>&1;$code=$LASTEXITCODE}finally{$ErrorActionPreference=$saved}
    [pscustomobject]@{code=$code;text=($output -join "`n")}
}
function Save-Status($Value){
    $temp=Join-Path $ServiceHome 'status.json.tmp'
    [IO.File]::WriteAllText($temp,($Value|ConvertTo-Json -Depth 15),[Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temp -Destination (Join-Path $ServiceHome 'status.json') -Force
}
try{
    while($true){
        $status=[ordered]@{time=(Get-Date).ToString('o');power_guard=$false;docker='unknown';maintenance=$false;containers=@();api_status='not_checked';action='none';errors=@()}
        try{
            # Prevent idle sleep while this signed-in server session is active. This does not veto shutdown.
            $status.power_guard=([CellPowerGuard]::SetThreadExecutionState([uint32]2147483649) -ne 0)
            $deployHome=$config.deploy_home
            $status.maintenance=Test-Path (Join-Path $deployHome 'paused')
            $engine=Native @('info','--format','{{.ServerVersion}}')
            if($engine.code -ne 0){
                $status.docker='unavailable'
                if(-not $status.maintenance -and -not (Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue)){
                    Start-Process -FilePath $config.desktop -ArgumentList '--autostart' -WindowStyle Hidden
                    $status.action='started Docker Desktop for the signed-in account'
                }
            }else{
                $status.docker=$engine.text
                $expected=@('dev-mysql-1','dev-backend-1','dev-frontend-1','dev-ai-server-1','dev-colorizer-1')
                $inspection=Native (@('inspect')+$expected)
                $needsRecovery=$inspection.code -ne 0
                if($inspection.code -eq 0){
                    $containers=$inspection.text|ConvertFrom-Json
                    $status.containers=@($containers|ForEach-Object{[pscustomobject]@{name=$_.Name;running=$_.State.Running;health=if($_.State.PSObject.Properties['Health']){$_.State.Health.Status}else{'none'};restarts=$_.RestartCount}})
                    $needsRecovery=@($containers|Where-Object{-not $_.State.Running}).Count -gt 0
                }
                if($needsRecovery -and -not $status.maintenance){
                    $deployLock=$null
                    try{
                        $deployLock=[IO.File]::Open((Join-Path $deployHome 'deploy.lock'),'OpenOrCreate','ReadWrite','None')
                        foreach($volume in @('dev_mysql-data','dev_colorizer-data')){
                            if((Native @('volume','inspect',$volume)).code -ne 0){throw 'Expected persistent volume missing; automatic recreation blocked.'}
                        }
                        $state=Get-Content -Raw (Join-Path $deployHome 'state.json')|ConvertFrom-Json
                        $deployment=Get-Content -Raw (Join-Path $deployHome 'config.json')|ConvertFrom-Json
                        $env:CELL_SERVER_ROOT=$deployment.server_root.Replace('\','/')
                        $compose=@('compose','--project-name','dev','--project-directory',$deployment.server_root,'--env-file',(Join-Path $deployment.server_root '.env'),'--file',$state.compose_path)
                        $restore=Native ($compose+@('up','-d','--no-build','--pull','never','--no-recreate','--wait','--wait-timeout','180'))
                        if($restore.code -ne 0){throw 'Container recovery failed; review server logs.'}
                        if((Native ($compose+@('exec','-T','frontend','nginx','-s','reload'))).code -ne 0){throw 'Recovered containers but proxy reload failed.'}
                        $status.action='started missing/stopped containers from current pinned deployment'
                    }catch [IO.IOException]{$status.action='deployment in progress; recovery skipped'}
                    finally{if($null -ne $deployLock){$deployLock.Dispose()}}
                }
            }
            $os=Get-CimInstance Win32_OperatingSystem
            $status.free_memory_mb=[math]::Round($os.FreePhysicalMemory/1024,1)
            if(-not $SkipHttpProbe){
                $saved=$ErrorActionPreference
                try{
                    $ErrorActionPreference='Continue'
                    $http=& curl.exe --silent --show-error --output NUL --write-out '%{http_code}' --max-time 5 --resolve cell.cbnu.ac.kr:443:127.0.0.1 'https://cell.cbnu.ac.kr/api/health' 2>$null
                    $code=$LASTEXITCODE
                }finally{$ErrorActionPreference=$saved}
                $status.api_status=if($code -eq 0){($http -join '').Trim()}else{'000'}
                if($status.api_status -ne '200'){$status.errors+=('Verified HTTPS API probe returned '+$status.api_status)}
            }
        }catch{$status.errors=@($_.Exception.Message)}
        Save-Status $status
        [pscustomobject]@{time=$status.time;docker=$status.docker;power_guard=$status.power_guard;maintenance=$status.maintenance;api_status=$status.api_status;action=$status.action;errors=($status.errors -join '; ')}|Export-Csv -LiteralPath (Join-Path $ServiceHome ('watchdog-v2-'+(Get-Date -Format 'yyyyMMdd')+'.csv')) -Append -NoTypeInformation -Encoding UTF8
        if($Once){break}
        Start-Sleep -Seconds 30
    }
}finally{
    [void][CellPowerGuard]::SetThreadExecutionState([uint32]2147483648)
    if($null -ne $lock){$lock.Dispose()}
}
