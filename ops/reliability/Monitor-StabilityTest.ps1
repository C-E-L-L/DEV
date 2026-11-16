param([string]$Work)
$ErrorActionPreference='Stop'
$metadata=Get-Content -LiteralPath ($Work+'\metadata.json') -Raw|ConvertFrom-Json
$project=$metadata.project
$container=$project+'-k6'
$path=$Work+'\results\host-samples.csv'
$failures=0
$lowMemory=0
$seen=$false
$started=Get-Date
while($true){
    $os=Get-CimInstance Win32_OperatingSystem
    $cpu=Get-CimInstance Win32_Processor
    $freeMB=[math]::Round($os.FreePhysicalMemory/1024,1)
    $status=& curl.exe --silent --show-error --output NUL --write-out '%{http_code},%{time_total}' --max-time 5 --resolve cell.cbnu.ac.kr:443:127.0.0.1 'https://cell.cbnu.ac.kr/api/health' 2>$null
    $httpExit=$LASTEXITCODE
    $parts=($status -join '').Split(',')
    $healthy=($httpExit -eq 0 -and $parts[0] -eq '200')
    if($healthy){$failures=0}else{$failures++}
    if($freeMB -lt 1024){$lowMemory++}else{$lowMemory=0}
    $stateText=& docker.exe inspect $container --format '{{json .State}}' 2>$null
    $exists=($LASTEXITCODE -eq 0)
    $running=$false
    if($exists){$state=$stateText|ConvertFrom-Json;$running=$state.Running;$seen=$true}
    $sample=[pscustomobject]@{time=(Get-Date).ToString('o');cpu_percent=$cpu.LoadPercentage;free_memory_mb=$freeMB;production_http=if($parts.Count){$parts[0]}else{'000'};production_seconds=if($parts.Count -gt 1){$parts[1]}else{''};test_running=$running}
    $sample|Export-Csv -LiteralPath $path -NoTypeInformation -Append -Encoding UTF8
    if($running -and ($failures -ge 3 -or $lowMemory -ge 3)){
        $details=& docker.exe inspect $container|ConvertFrom-Json
        if($details[0].Config.Labels.'cell.reliability.run' -ceq $project){
            & docker.exe stop --time 10 $container|Out-Null
            [IO.File]::WriteAllText(($Work+'\results\safety-abort.txt'),('Test stopped to protect production. Consecutive health failures: '+$failures+'; low-memory samples: '+$lowMemory))
        }
    }
    if($seen -and -not $running){break}
    if(-not $seen -and ((Get-Date)-$started).TotalSeconds -gt 60){break}
    Start-Sleep -Seconds 15
}
Write-Output 'Host and production availability monitoring finished.'
