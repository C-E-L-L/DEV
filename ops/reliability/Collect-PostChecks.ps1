param([string]$Work)
$ErrorActionPreference='Stop'
$script:DeployHome='C:\CELL\autodeploy'
. (Join-Path $script:DeployHome 'Deployment.Common.ps1')
$script:DockerExe=(Get-Command docker.exe).Source
$meta=Read-JsonFile ($Work+'\metadata.json')
$project=$meta.project
if($project -cnotmatch '^cell-stability-[0-9]{8}-[0-9]{6}$'){throw 'Unexpected test project.'}
$load=(Invoke-Docker @('inspect',($project+'-k6'))|ConvertFrom-Json)[0]
if($load.State.Running){throw 'Load generation must finish before recovery checks.'}
Write-JsonFile $load.State ($Work+'\results\k6-exit.json')
Invoke-Docker @('logs',($project+'-k6'))|Set-Content -LiteralPath ($Work+'\results\k6-console.txt') -Encoding UTF8
$dbName=$project+'-mysql-1'
$db=(Invoke-Docker @('inspect',$dbName)|ConvertFrom-Json)[0]
if($db.Config.Labels.'com.docker.compose.project' -cne $project){throw 'Database isolation guard failed.'}
$storage=@($db.Mounts|Where-Object{$_.Destination -eq '/var/lib/mysql'})
if($storage.Count -ne 1 -or $storage[0].Type -ne 'volume' -or $storage[0].Name -cne ($project+'_mysql_data')){
    throw 'A dedicated persistent test volume is required for crash recovery validation.'
}
function Sql([string]$Text){
    $output=$Text|& $script:DockerExe exec -i $dbName sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql --user=root --batch --skip-column-names celldb'
    if($LASTEXITCODE -ne 0){throw 'Isolated database check failed.'}
    return ($output -join "`n").Trim()
}
$invalid=[int](Sql "SELECT COUNT(*) FROM submissions s LEFT JOIN users u ON s.student_id=u.username LEFT JOIN crops c ON c.id=s.crop_id WHERE u.id IS NULL OR c.id IS NULL OR u.username NOT LIKE 'stability-%' OR s.student_label IS NULL OR s.student_label NOT IN ('Band','Segment','Lymphocyte','Monocyte','Eosinophil','NucleatedRBC');")
$duplicates=[int](Sql 'SELECT COUNT(*) FROM (SELECT crop_id,student_id FROM submissions GROUP BY crop_id,student_id HAVING COUNT(*)>1) d;')
$answers=[int](Sql 'SELECT COUNT(*) FROM submissions;')
$checksumSql='CHECKSUM TABLE users,tasks,crops,submissions,task_attempts;'
$before=Sql $checksumSql
$result=[ordered]@{invalid_answers=$invalid;duplicate_answers=$duplicates;saved_answers=$answers;database_storage='dedicated Docker persistent volume';database_volume=$storage[0].Name;recovery_passed=$false;database_recovery_passed=$false;production_unchanged=$true}
Invoke-Docker @('stop',($project+'-backend-1'))|Out-Null
$timer=[Diagnostics.Stopwatch]::StartNew()
# Controlled process crash in the synthetic test DB only. The production DB is never targeted.
Invoke-Docker @('kill','--signal','KILL',$dbName)|Out-Null
Invoke-Docker @('start',$dbName)|Out-Null
$ready=$false
for($i=0;$i -lt 60;$i++){
    try{if((Sql 'SELECT 1;') -eq '1'){$ready=$true;break}}catch{}
    Start-Sleep -Seconds 1
}
if(-not $ready){throw 'Isolated DB did not recover after the controlled process crash.'}
$result.database_recovery_seconds=[math]::Round($timer.Elapsed.TotalSeconds,3)
$after=Sql $checksumSql
$result.database_recovery_passed=($before -ceq $after)
if(-not $result.database_recovery_passed){throw 'Committed synthetic data changed after DB crash recovery.'}
Invoke-Docker @('compose','--project-name',$project,'--file',($Work+'\runtime\compose.json'),'up','-d','--no-build','--pull','never','--no-recreate','--wait','--wait-timeout','180')|Out-Null
Invoke-Docker @('exec',($project+'-frontend-1'),'nginx','-s','reload')|Out-Null
$body=Invoke-Docker @('exec',($project+'-frontend-1'),'wget','--no-check-certificate','-q','-O','-','https://127.0.0.1/api/health')
$result.recovery_passed=(($body|ConvertFrom-Json).status -eq 'ok')
$result.full_recovery_seconds=[math]::Round($timer.Elapsed.TotalSeconds,3)
foreach($service in @('mysql','backend','frontend','ai-server','colorizer')){
    $container=(Invoke-Docker @('inspect',('dev-'+$service+'-1'))|ConvertFrom-Json)[0]
    if($container.Id -cne $meta.production_container_ids.$service -or -not $container.State.Running -or $container.State.OOMKilled){$result.production_unchanged=$false}
    $baseline=if($meta.PSObject.Properties['production_restart_counts']){$meta.production_restart_counts.$service}else{0}
    if($container.RestartCount -ne $baseline -or [DateTimeOffset]::Parse($container.State.StartedAt) -gt [DateTimeOffset]::Parse($meta.load_started_at)){$result.production_unchanged=$false}
}
Write-JsonFile $result ($Work+'\results\post-checks.json')
if(Test-Path 'C:\CELL\reliability\admin-result.json'){Copy-Item -LiteralPath 'C:\CELL\reliability\admin-result.json' -Destination ($Work+'\results\admin-settings.json') -Force}
Copy-Item -LiteralPath 'C:\CELL\reliability\service\status.json' -Destination ($Work+'\results\watchdog-status.json') -Force
$result|ConvertTo-Json -Depth 8
