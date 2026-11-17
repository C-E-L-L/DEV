$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT'){Write-Output 'Windows watchdog integration fixtures skipped on this OS.';exit 0}
$source=Join-Path (Split-Path $PSScriptRoot -Parent) 'Watch-Server.ps1'
$folder=Join-Path ([IO.Path]::GetTempPath()) ('cell-watchdog-test-'+[guid]::NewGuid())
New-Item -ItemType Directory -Path $folder,($folder+'\deploy')|Out-Null
function Json($Value,$Path){[IO.File]::WriteAllText($Path,($Value|ConvertTo-Json -Depth 15),[Text.UTF8Encoding]::new($false))}
$fake=@'
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$CommandArgs)
$case=Get-Content -Raw ($PSScriptRoot+'\case.json')|ConvertFrom-Json
[IO.File]::AppendAllText(($PSScriptRoot+'\calls.txt'),(($CommandArgs -join ' ') + "`n"))
if($CommandArgs[0] -eq 'info'){Write-Output 'test-engine';exit 0}
if($CommandArgs[0] -eq 'inspect'){
 $names=@('mysql','backend','frontend','ai-server','colorizer')
 $result=@($names|ForEach-Object{@{Name=('/dev-'+$_+'-1');State=@{Running= -not ($case.stopped -and $_ -eq 'backend');Health=@{Status='healthy'}};RestartCount=0}})
 $result|ConvertTo-Json -Depth 8;exit 0
}
if($CommandArgs[0] -eq 'volume'){if($case.missingVolume){exit 1};Write-Output '[]';exit 0}
if($CommandArgs[0] -eq 'compose'){Write-Output 'fixture operation accepted';exit 0}
throw 'Unexpected fake Docker command'
'@
[IO.File]::WriteAllText(($folder+'\docker-fixture.ps1'),$fake,[Text.UTF8Encoding]::new($false))
Json @{docker=($folder+'\docker-fixture.ps1');desktop='unused.exe';deploy_home=($folder+'\deploy')} ($folder+'\config.json')
Json @{compose_path=($folder+'\deploy\compose.json')} ($folder+'\deploy\state.json')
Json @{server_root=$folder} ($folder+'\deploy\config.json')
function Case([string]$Name,[bool]$Stopped,[bool]$Missing,[bool]$Paused,[bool]$ExpectRecovery){
    Json @{stopped=$Stopped;missingVolume=$Missing} ($folder+'\case.json')
    [IO.File]::WriteAllText(($folder+'\calls.txt'),'')
    $pause=$folder+'\deploy\paused'
    if($Paused){[IO.File]::WriteAllText($pause,'test')}elseif(Test-Path $pause){Remove-Item -LiteralPath $pause}
    & (Join-Path $PSHOME 'powershell.exe') -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $source -ServiceHome $folder -Once -SkipHttpProbe
    if($LASTEXITCODE -ne 0){throw ('Watchdog fixture failed: '+$Name)}
    $calls=[IO.File]::ReadAllText($folder+'\calls.txt')
    $recovered=$calls -match 'compose .* up '
    if($recovered -ne $ExpectRecovery){throw ('Unexpected recovery decision: '+$Name)}
    if($recovered -and ($calls -notmatch '--no-build --pull never --no-recreate --wait' -or $calls -notmatch 'nginx -s reload')){throw 'Recovery must preserve current images and reload the proxy.'}
    if($calls -match ' down|prune|volume rm'){throw 'Watchdog must never remove data.'}
    Write-Output ('PASS '+$Name)
}
Case 'Healthy server remains untouched' $false $false $false $false
Case 'Maintenance pause blocks recovery' $true $false $true $false
Case 'Missing persistent volume blocks recreation' $true $true $false $false
Case 'Stopped service resumes pinned images and reloads Nginx' $true $false $false $true
