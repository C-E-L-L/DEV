[CmdletBinding()]
param([ValidateRange(1,100)][int]$Users=60,[ValidateSet('volume','tmpfs')][string]$DatabaseStorage='volume')
$ErrorActionPreference='Stop'
$script:DeployHome='C:\CELL\autodeploy'
. (Join-Path $script:DeployHome 'Deployment.Common.ps1')
$script:Config=Read-JsonFile (Join-Path $script:DeployHome 'config.json')
$script:DockerExe=$script:Config.docker_exe
$sourceRoot=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$project='cell-stability-'+$stamp
$work='C:\CELL\reliability\runs\'+$stamp
New-Item -ItemType Directory -Path ($work+'\runtime'),($work+'\results') -Force|Out-Null
$identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $work /inheritance:r /grant:r "${identity}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F'|Out-Null
if($LASTEXITCODE -ne 0){throw 'Could not protect the test directory.'}
function New-TestSecret {
    $bytes=New-Object byte[] 48
    $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
    try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
    [Convert]::ToBase64String($bytes)
}
$ownedPause=-not(Test-Path (Join-Path $script:DeployHome 'paused'))
$lock=$null
try{
    if($ownedPause){[IO.File]::WriteAllText((Join-Path $script:DeployHome 'paused'),$project,[Text.UTF8Encoding]::new($false))}
    for($i=0;$i -lt 30;$i++){
        try{$lock=[IO.File]::Open((Join-Path $script:DeployHome 'deploy.lock'),'OpenOrCreate','ReadWrite','None');break}
        catch [IO.IOException]{Start-Sleep -Milliseconds 500}
    }
    if($null -eq $lock){throw 'A deployment is still running.'}
    $state=Read-JsonFile (Join-Path $script:DeployHome 'state.json')
    $images=@{}
    $containerIds=@{}
    $restartCounts=@{}
    $startedAt=@{}
    foreach($service in @('frontend','backend','ai-server','colorizer','mysql')){
        $container=(Invoke-Docker @('inspect',('dev-'+$service+'-1'))|ConvertFrom-Json)[0]
        $containerIds[$service]=$container.Id
        $restartCounts[$service]=$container.RestartCount
        $startedAt[$service]=$container.State.StartedAt
        $images[$service]=$container.Config.Image
    }
    # Schema only: no production user, answer, or image records are copied.
    Invoke-Docker @('exec','dev-mysql-1','sh','-c','MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysqldump --user=root --no-data --skip-comments --skip-triggers --single-transaction --skip-lock-tables --set-gtid-purged=OFF --databases celldb --result-file=/tmp/cell-stability-schema.sql')|Out-Null
    Invoke-Docker @('cp','dev-mysql-1:/tmp/cell-stability-schema.sql',($work+'\runtime\schema.sql'))|Out-Null
}catch{
    if($ownedPause -and (Test-Path (Join-Path $script:DeployHome 'paused'))){Remove-Item -LiteralPath (Join-Path $script:DeployHome 'paused')}
    throw
}finally{if($null -ne $lock){$lock.Dispose()}}
$metadata=[ordered]@{project=$project;work=$work;users=$Users;production_sha=$state.sha;images=$images;production_container_ids=$containerIds;production_restart_counts=$restartCounts;production_started_at=$startedAt;owned_pause=$ownedPause;mysql_storage=$DatabaseStorage;prepared_at=(Get-Date).ToString('o');status='preparing'}
Write-JsonFile $metadata ($work+'\metadata.json')
Write-JsonFile @{work=$work;project=$project} 'C:\CELL\reliability\active-run.json'
$testPassword=New-TestSecret
$dbPassword=New-TestSecret
$marker=$project
Write-JsonFile @{isolated=$true;marker=$marker;baseUrl='https://cell.cbnu.ac.kr';users=$Users;password=$testPassword} ($work+'\runtime\test-config.json')
Invoke-Docker @('cp','dev-frontend-1:/etc/nginx/conf.d/default.conf',($work+'\runtime\nginx.conf'))|Out-Null
$nginx=[IO.File]::ReadAllText($work+'\runtime\nginx.conf')
$nginx=$nginx.Replace('server_name cell.cbnu.ac.kr;',('server_name cell.cbnu.ac.kr;' + "`n" + '    add_header X-CELL-Test-Environment '+$marker+' always;'))
[IO.File]::WriteAllText(($work+'\runtime\nginx.conf'),$nginx,[Text.UTF8Encoding]::new($false))
$bindRoot=$work.Replace('\','/')
$fixtureSource=(Join-Path $PSScriptRoot 'make_fixture.py').Replace('\','/')
Invoke-Docker @('run','--rm','--network','none','--mount',('type=bind,source='+$bindRoot+',target=/work'),'--mount',('type=bind,source='+$fixtureSource+',target=/make_fixture.py,readonly'),'--entrypoint','python',$images.'ai-server','/make_fixture.py')|Out-Null
$compose=[ordered]@{
    name=$project
    services=[ordered]@{
        mysql=@{image='mysql:8.0.46';environment=@{MYSQL_ROOT_PASSWORD=$dbPassword;MYSQL_DATABASE='celldb'};mem_limit='1g';cpus=2;tmpfs=@('/var/lib/mysql:rw,size=512m');volumes=@(@{type='bind';source=$bindRoot+'/runtime/schema.sql';target='/docker-entrypoint-initdb.d/00-schema.sql';read_only=$true});healthcheck=@{test=@('CMD-SHELL','MYSQL_PWD=$$MYSQL_ROOT_PASSWORD mysql --host=127.0.0.1 --user=root -N -e "SELECT 1"');interval='3s';timeout='3s';retries=35;start_period='20s'}}
        backend=@{image=$images.backend;mem_limit='1536m';cpus=4;environment=@{SPRING_PROFILES_ACTIVE='prod';DB_URL='jdbc:mysql://mysql:3306/celldb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8';DB_USERNAME='root';DB_PASSWORD=$dbPassword;JWT_SECRET=(New-TestSecret);ADMIN_USERNAME='stability-admin';ADMIN_PASSWORD=$testPassword;AI_SERVER_URL='http://isolated-ai-not-in-this-test:8001';FILE_UPLOAD_DIR='/data/originals';FILE_CROP_DIR='/data/crops';FILE_THUMBNAIL_DIR='/data/thumbnails'};volumes=@(@{type='bind';source=$bindRoot+'/runtime/data';target='/data'});depends_on=@{mysql=@{condition='service_healthy'}};healthcheck=@{test=@('CMD','wget','-q','-O','/dev/null','http://127.0.0.1:8080/api/health');interval='3s';timeout='3s';retries=40;start_period='30s'}}
        frontend=@{image=$images.frontend;mem_limit='256m';cpus=1;ports=@('127.0.0.1:18443:443');volumes=@(@{type='bind';source='C:/CELL/server/ssl';target='/etc/nginx/ssl';read_only=$true},@{type='bind';source=$bindRoot+'/runtime/nginx.conf';target='/etc/nginx/conf.d/default.conf';read_only=$true});depends_on=@{backend=@{condition='service_healthy'}};networks=@{default=@{aliases=@('cell.cbnu.ac.kr')}};healthcheck=@{test=@('CMD','wget','--no-check-certificate','-q','-O','/dev/null','https://127.0.0.1/api/health');interval='3s';timeout='3s';retries=20;start_period='10s'}}
    }
    networks=@{default=@{internal=$true}}
}
$compose.services.backend.environment.JWT_EXPIRATION_HOURS='24'
if($DatabaseStorage -eq 'volume'){
    $compose.services.mysql.Remove('tmpfs')
    $compose.services.mysql.volumes+=@{type='volume';source='mysql_data';target='/var/lib/mysql'}
    $compose.volumes=@{mysql_data=@{}}
}
$compose.services.frontend.Remove('ports')
Write-JsonFile $compose ($work+'\runtime\compose.json')
Write-Output ('Test project: '+$project)
Write-Output ('Report directory: '+$work)
Write-Output 'Starting isolated MySQL, backend and HTTPS frontend using the running production images.'
Invoke-Docker @('compose','--file',($work+'\runtime\compose.json'),'up','-d','--no-build','--pull','never','--wait','--wait-timeout','240')|Out-Null
$dbContainer=$project+'-mysql-1'
$db=(Invoke-Docker @('inspect',$dbContainer)|ConvertFrom-Json)[0]
if($db.Config.Labels.'com.docker.compose.project' -cne $project){throw 'Isolation guard failed for the fixture database.'}
Invoke-Docker @('cp',($work+'\runtime\fixture.sql'),($dbContainer+':/tmp/fixture.sql'))|Out-Null
Invoke-Docker @('exec',$dbContainer,'sh','-c','MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql --user=root --default-character-set=utf8mb4 celldb < /tmp/fixture.sql')|Out-Null
$counts='SELECT ''synthetic_users'',COUNT(*) FROM users WHERE username LIKE ''stability-%''; SELECT ''tasks'',COUNT(*) FROM tasks; SELECT ''crops'',COUNT(*) FROM crops;'
$counts|& $script:DockerExe exec -i $dbContainer sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql --user=root --batch --skip-column-names celldb'
if($LASTEXITCODE -ne 0){throw 'Fixture verification failed.'}
Copy-Item -LiteralPath (Join-Path $sourceRoot 'load_test/stability.k6.js') -Destination ($work+'\runtime\stability.k6.js')
Invoke-Docker @('pull','grafana/k6:latest')|Out-Null
$k6=(Invoke-Docker @('image','inspect','grafana/k6:latest')|ConvertFrom-Json)[0]
$metadata.k6_image=$k6.RepoDigests[0]
$metadata.status='ready'
Write-JsonFile $metadata ($work+'\metadata.json')
Write-Output 'Isolated synthetic environment ready. Production deployment will remain paused until test cleanup.'
