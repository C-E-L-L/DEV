$ErrorActionPreference='Stop'
$homePath='C:\CELL\reliability\service'
New-Item -ItemType Directory -Path $homePath -Force|Out-Null
$identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $homePath /inheritance:r /grant:r "${identity}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F'|Out-Null
if($LASTEXITCODE -ne 0){throw 'Could not protect the watchdog directory.'}
$docker=(Get-Command docker.exe).Source
$desktop=Join-Path (Split-Path (Split-Path (Split-Path $docker -Parent) -Parent) -Parent) 'Docker Desktop.exe'
if(-not(Test-Path -LiteralPath $desktop)){throw 'Docker Desktop executable not found.'}
$config=@{docker=$docker;desktop=$desktop;deploy_home='C:\CELL\autodeploy'}
[IO.File]::WriteAllText(($homePath+'\config.json'),($config|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Watch-Server.ps1') -Destination ($homePath+'\Watch-Server.ps1') -Force
$exe=Join-Path $PSHOME 'powershell.exe'
$action=New-ScheduledTaskAction -Execute $exe -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$homePath+'\Watch-Server.ps1"') -WorkingDirectory $homePath
$principal=New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $identity
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 20 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'CELL-ServerWatchdog' -Action $action -Principal $principal -Trigger $trigger -Settings $settings -Description 'Prevent idle sleep and recover Docker/current CELL containers after user sign-in; honor maintenance pause and deployment lock.' -Force|Out-Null
Start-ScheduledTask -TaskName 'CELL-ServerWatchdog'
Write-Output 'Installed CELL-ServerWatchdog for the existing Docker Desktop account.'
