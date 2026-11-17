$ErrorActionPreference='Stop'
$service='C:\CELL\reliability\service'
if(-not(Test-Path -LiteralPath ($service+'\config.json'))){throw 'Install the server watchdog first.'}
$deployment=Get-Content C:\CELL\autodeploy\config.json -Raw -Encoding UTF8|ConvertFrom-Json
New-Item -ItemType Directory -Path ($deployment.server_root+'\acme-webroot') -Force|Out-Null
foreach($name in @('Renew-ServerCertificate.ps1','export_certificate.py')){Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination ($service+'\'+$name) -Force}
$identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$action=New-ScheduledTaskAction -Execute (Join-Path $PSHOME 'powershell.exe') -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$service+'\Renew-ServerCertificate.ps1"') -WorkingDirectory $service
$principal=New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$triggers=@((New-ScheduledTaskTrigger -Daily -At '09:15'),(New-ScheduledTaskTrigger -Daily -At '21:15'))
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 10) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'CELL-CertificateRenewal' -Action $action -Principal $principal -Trigger $triggers -Settings $settings -Description 'Renew the existing CELL certificate through webroot and reload Nginx without stopping the frontend; honor deployment lock and maintenance pause.' -Force|Out-Null
Write-Output 'Certificate renewal scheduled daily at 09:15 and 21:15 under the existing Docker account.'
