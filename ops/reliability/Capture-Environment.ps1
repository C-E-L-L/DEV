param([string]$Work)
$ErrorActionPreference='Stop'
$os=Get-CimInstance Win32_OperatingSystem
$machine=Get-CimInstance Win32_ComputerSystem
$cpu=Get-CimInstance Win32_Processor
$eventStart=(Get-Date).AddDays(-7)
$events=@()
foreach($spec in @(
    @{provider='Microsoft-Windows-Kernel-Power';ids=@(41)},
    @{provider='EventLog';ids=@(6008)},
    @{provider='Microsoft-Windows-WHEA-Logger';ids=@(17,18,19)},
    @{provider='disk';ids=@(7,51,153)},
    @{provider='stornvme';ids=@(129)},
    @{provider='Ntfs';ids=@(55)}
)){
    $found=@(Get-WinEvent -FilterHashtable @{LogName='System';ProviderName=$spec.provider;Id=$spec.ids;StartTime=$eventStart} -ErrorAction SilentlyContinue)
    $events+=[pscustomobject]@{provider=$spec.provider;event_ids=$spec.ids;count=$found.Count;latest=if($found.Count){$found[0].TimeCreated.ToString('o')}else{$null}}
}
$data=[ordered]@{
    captured_at=(Get-Date).ToString('o')
    os=@{caption=$os.Caption;version=$os.Version;build=$os.BuildNumber;last_boot=$os.LastBootUpTime.ToString('o')}
    cpu=@{name=$cpu.Name;cores=$cpu.NumberOfCores;logical_processors=$cpu.NumberOfLogicalProcessors}
    memory_gib=[math]::Round($machine.TotalPhysicalMemory/1GB,2)
    free_memory_mb=[math]::Round($os.FreePhysicalMemory/1024,1)
    network=@(Get-NetAdapter -Physical|Select-Object Name,Status,LinkSpeed,InterfaceDescription)
    disks=@(Get-PhysicalDisk|Select-Object FriendlyName,MediaType,HealthStatus,OperationalStatus,Size)
    system_drive_free_gib=[math]::Round((Get-PSDrive C).Free/1GB,2)
    recent_events=$events
    reboot_pending=((Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending') -or (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired'))
    update_active_hours=(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings' -ErrorAction SilentlyContinue|Select-Object ActiveHoursStart,ActiveHoursEnd,SmartActiveHoursState,IsExpedited)
    crash_auto_reboot=(Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\CrashControl').AutoReboot
}
[IO.File]::WriteAllText(($Work+'\results\environment.json'),($data|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
& powercfg.exe /qh SCHEME_CURRENT | Set-Content -LiteralPath ($Work+'\results\power-settings.txt') -Encoding UTF8
Get-ScheduledTask -TaskName CELL-AutoDeploy,CELL-ServerWatchdog|Select-Object TaskName,State,Description|ConvertTo-Json|Set-Content -LiteralPath ($Work+'\results\scheduled-tasks.json') -Encoding UTF8
Write-Output 'Captured hardware, OS, power settings, task status and provider-specific seven-day hardware/shutdown event counts.'
