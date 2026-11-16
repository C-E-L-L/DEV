param([string]$Work)
$ErrorActionPreference='Stop'
$script:DeployHome='C:\CELL\autodeploy'
. (Join-Path $script:DeployHome 'Deployment.Common.ps1')
$script:DockerExe=(Get-Command docker.exe).Source
$meta=Read-JsonFile ($Work+'\metadata.json')
$source=$PSScriptRoot.Replace('\','/')
$bind=$Work.Replace('\','/')
foreach($script in @('summarize_metrics.py','build_report.py')){
    Invoke-Docker @('run','--rm','--network','none','--memory','512m','--cpus','2','--mount',('type=bind,source='+$bind+',target=/work'),'--mount',('type=bind,source='+$source+'/'+$script+',target=/report-script.py,readonly'),'--entrypoint','python',$meta.images.'ai-server','/report-script.py')
}
$edge=@('C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe','C:\Program Files\Microsoft\Edge\Application\msedge.exe')|Where-Object{Test-Path -LiteralPath $_}|Select-Object -First 1
if($edge){
    $pdf=$Work+'\results\report.pdf'
    $profile=$Work+'\runtime\report-edge-profile'
    $url='file:///'+($Work+'\results\report.html').Replace('\','/')
    $process=Start-Process -FilePath $edge -ArgumentList @('--headless','--disable-gpu','--disable-background-networking','--no-first-run',('--user-data-dir='+$profile),('--print-to-pdf='+$pdf),'--no-pdf-header-footer',$url) -WindowStyle Hidden -PassThru
    for($i=0;$i -lt 30 -and -not(Test-Path -LiteralPath $pdf);$i++){Start-Sleep -Seconds 1}
    if(-not(Test-Path -LiteralPath $pdf)){throw 'PDF generation did not finish; HTML and measurement artifacts were preserved.'}
    $bytes=[IO.File]::ReadAllBytes($pdf)
    if($bytes.Length -lt 1024 -or [Text.Encoding]::ASCII.GetString($bytes,0,5) -ne '%PDF-'){throw 'PDF output did not validate.'}
}
$lines=@()
Get-ChildItem -LiteralPath ($Work+'\results') -File|Where-Object{$_.Name -ne 'SHA256SUMS.txt'}|Sort-Object Name|ForEach-Object{
    $lines+=((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()+'  '+$_.Name)
}
[IO.File]::WriteAllText(($Work+'\results\SHA256SUMS.txt'),($lines -join "`n")+"`n",[Text.UTF8Encoding]::new($false))
Write-Output ('Report and original measurement evidence: '+$Work+'\results')
