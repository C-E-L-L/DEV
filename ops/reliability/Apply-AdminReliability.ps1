[CmdletBinding()]
param([ValidatePattern('^[0-9a-f-]{36}$')][string]$RequestId)
$ErrorActionPreference='Stop'
if(-not $RequestId){$RequestId=[guid]::NewGuid().ToString()}
$root='C:\CELL\reliability'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=New-Object Security.Principal.WindowsPrincipal($identity)
if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Administrator approval is required for these machine settings.'}
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$folder=Join-Path $root ('settings\'+$stamp)
New-Item -ItemType Directory -Path $folder -Force|Out-Null
$actions=[Collections.Generic.List[object]]::new()
function Power([string[]]$Arguments){
    $saved=$ErrorActionPreference
    try{$ErrorActionPreference='Continue';$output=& powercfg.exe @Arguments 2>&1;$code=$LASTEXITCODE}finally{$ErrorActionPreference=$saved}
    [pscustomobject]@{code=$code;text=($output -join "`n")}
}
$schemeText=(& powercfg.exe /getactivescheme)-join ' '
$guid=[regex]::Match($schemeText,'[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}').Value
if(-not $guid){throw 'Cannot identify active power scheme.'}
& powercfg.exe /qh $guid | Set-Content -LiteralPath ($folder+'\power-before.txt') -Encoding UTF8
& powercfg.exe /export ($folder+'\power-before.pow') $guid
if($LASTEXITCODE -ne 0){throw 'Power scheme backup failed.'}
$before=[ordered]@{
    recorded_at=(Get-Date).ToString('o');power_scheme=$guid
    update_settings=(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings' -ErrorAction SilentlyContinue|Select-Object ActiveHoursStart,ActiveHoursEnd,SmartActiveHoursState,IsExpedited)
    auto_reboot=(Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\CrashControl').AutoReboot
    hibernate_enabled=(Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Power').HibernateEnabled
}
[IO.File]::WriteAllText(($folder+'\before.json'),($before|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
$settings=@(
    @{label='Automatic sleep';sub='238c9fa8-0aad-41ed-83f4-97be242c8f20';setting='29f6c1db-86da-48c5-9fdb-f2b67b1f44da'},
    @{label='Automatic hibernate';sub='238c9fa8-0aad-41ed-83f4-97be242c8f20';setting='9d7815a6-7ee4-497e-8888-515a05f02364'},
    @{label='Unattended idle sleep';sub='238c9fa8-0aad-41ed-83f4-97be242c8f20';setting='7bc4a2f9-d8fc-4469-b07b-33eb785aaca0'},
    @{label='Disk idle power-off';sub='0012ee47-9041-4b5d-9b77-535fba8b1442';setting='6738e2c4-e8a5-4a42-b16a-e040e769756e'},
    @{label='Short power-button action';sub='4f971e89-eebd-4455-a8de-9e59040e7347';setting='7648efa3-dd9c-4e3e-b566-50f929386280'},
    @{label='Sleep-button action';sub='4f971e89-eebd-4455-a8de-9e59040e7347';setting='96996bc0-ad50-47ec-923b-6f41874dd9eb'}
)
foreach($setting in $settings){
    foreach($mode in @('ac','dc')){
        $changed=Power @(('/set'+$mode+'valueindex'),$guid,$setting.sub,$setting.setting,'0')
        $actions.Add([pscustomobject]@{action=$setting.label;mode=$mode;value=0;success=($changed.code -eq 0);message=if($changed.code -eq 0){''}else{$changed.text}})
    }
}
$changed=Power @('/setactive',$guid)
$actions.Add([pscustomobject]@{action='Apply active power scheme';success=($changed.code -eq 0)})
$changed=Power @('/hibernate','off')
$actions.Add([pscustomobject]@{action='Disable hibernation and Fast Startup';success=($changed.code -eq 0)})
# Preserve Windows Update. Home does not provide a reliable 24-hour no-restart policy.
# Existing active hours and update settings are recorded, not replaced with unsupported policy keys.
$networkResults=@()
foreach($adapter in Get-NetAdapter -Physical|Where-Object{$_.Status -eq 'Up'}){
    try{
        $power=Get-NetAdapterPowerManagement -Name $adapter.Name -ErrorAction Stop
        $networkResults+=@($power|Select-Object Name,SelectiveSuspend,DeviceSleepOnDisconnect,WakeOnMagicPacket)
        $changes=@{Name=$adapter.Name;NoRestart=$true;ErrorAction='Stop'}
        if([string]$power.SelectiveSuspend -eq 'Enabled'){$changes.SelectiveSuspend=$true}
        if([string]$power.DeviceSleepOnDisconnect -eq 'Enabled'){$changes.DeviceSleepOnDisconnect=$true}
        if($changes.Count -gt 3){
            Disable-NetAdapterPowerManagement @changes|Out-Null
            $actions.Add([pscustomobject]@{action='Network selective suspend/device sleep disabled';adapter=$adapter.Name;success=$true;restart_performed=$false;driver_restart_may_be_required=$true})
        }else{$actions.Add([pscustomobject]@{action='Network power management already disabled or unsupported';adapter=$adapter.Name;success=$true})}
    }catch{$actions.Add([pscustomobject]@{action='Network power management';adapter=$adapter.Name;success=$false;message=$_.Exception.Message})}
}
$networkResults|ConvertTo-Json -Depth 10|Set-Content -LiteralPath ($folder+'\network-before.json') -Encoding UTF8
& powercfg.exe /qh $guid | Set-Content -LiteralPath ($folder+'\power-after.txt') -Encoding UTF8
$result=[ordered]@{request_id=$RequestId;completed_at=(Get-Date).ToString('o');administrator=$true;backup_directory=$folder;actions=$actions;windows_update_disabled=$false;computer_restarted=$false;network_adapter_restarted=$false;active_hours=$before.update_settings}
$json=$result|ConvertTo-Json -Depth 20
[IO.File]::WriteAllText((Join-Path $root ('admin-result-'+$RequestId+'.json')),$json,[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $root 'admin-result.json'),$json,[Text.UTF8Encoding]::new($false))
