param([string]$Work)
$ErrorActionPreference='Stop'
$meta=Get-Content -LiteralPath ($Work+'\metadata.json') -Raw|ConvertFrom-Json
while($true){
    $text=& docker.exe inspect ($meta.project+'-k6') --format '{{json .State}}'
    if($LASTEXITCODE -ne 0){break}
    $state=$text|ConvertFrom-Json
    if(-not $state.Running){break}
    $time=(Get-Date).ToString('o')
    $rows=& docker.exe stats --no-stream --format '{{json .}}'
    foreach($row in $rows){
        $data=$row|ConvertFrom-Json
        [pscustomobject]@{time=$time;container=$data.Name;cpu=$data.CPUPerc;memory=$data.MemUsage;memory_percent=$data.MemPerc;network=$data.NetIO;block_io=$data.BlockIO;pids=$data.PIDs}|Export-Csv -LiteralPath ($Work+'\results\container-samples.csv') -Append -NoTypeInformation -Encoding UTF8
    }
    Start-Sleep -Seconds 30
}
