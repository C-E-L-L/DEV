[CmdletBinding()]
param([string]$ConfigPath='',[switch]$DryRun)
$ErrorActionPreference='Stop'
if(-not $ConfigPath){$ConfigPath=Join-Path $PSScriptRoot 'config.json'}
$config=Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8|ConvertFrom-Json
$script:DeployHome=$config.deploy_home
. (Join-Path $script:DeployHome 'Deployment.Common.ps1')
$deployment=Read-JsonFile (Join-Path $script:DeployHome 'config.json')
$script:DockerExe=$config.docker
$root=$deployment.server_root
$image='certbot/certbot@sha256:c5698da859429ccee0fcc299a8000368198222d1f9e789ab6e388b491e8ce06d'
$statusPath=Join-Path $PSScriptRoot 'certificate-status.json'
$result=[ordered]@{time=(Get-Date).ToString('o');dry_run=[bool]$DryRun;success=$false;skipped=$false;frontend_stopped=$false}
$lock=$null
$probe=$null
try {
    try{$lock=[IO.File]::Open((Join-Path $script:DeployHome 'deploy.lock'),'OpenOrCreate','ReadWrite','None')}
    catch [IO.IOException]{$result.skipped=$true;$result.reason='Deployment lock is held';return}
    if(Test-Path -LiteralPath (Join-Path $script:DeployHome 'paused')){$result.skipped=$true;$result.reason='Maintenance pause';return}
    # Never create a new account/store or fall back to standalone port binding.
    Invoke-Docker @('volume','inspect','dev_letsencrypt')|Out-Null
    Invoke-Docker @('image','inspect',$image)|Out-Null
    $webroot=Join-Path $root 'acme-webroot'
    $ssl=Join-Path $root 'ssl'
    $frontend=(Invoke-Docker @('inspect','dev-frontend-1')|ConvertFrom-Json)[0]
    $mount=@($frontend.Mounts|Where-Object{$_.Destination -eq '/var/www/certbot' -and -not $_.RW})
    if($mount.Count -ne 1 -or $mount[0].Source.Replace('/','\').TrimEnd('\') -ine $webroot.TrimEnd('\')){throw 'Expected read-only production ACME webroot mount missing.'}
    $token=[guid]::NewGuid().ToString('N')
    $challenge=Join-Path $webroot '.well-known\acme-challenge'
    New-Item -ItemType Directory -Path $challenge -Force|Out-Null
    $probe=Join-Path $challenge $token
    [IO.File]::WriteAllText($probe,$token,[Text.Encoding]::ASCII)
    $reply=& curl.exe --silent --show-error --fail --max-time 15 --resolve 'cell.cbnu.ac.kr:80:127.0.0.1' ('http://cell.cbnu.ac.kr/.well-known/acme-challenge/'+$token)
    if($LASTEXITCODE -ne 0 -or ($reply -join '') -cne $token){throw 'ACME HTTP path preflight failed.'}
    $mounts=@('--mount','type=volume,source=dev_letsencrypt,target=/etc/letsencrypt','--mount',('type=bind,source='+$webroot+',target=/var/www/certbot'))
    $arguments=@('run','--rm')+$mounts+@($image,'renew','--webroot','--webroot-path','/var/www/certbot','--cert-name','cell.cbnu.ac.kr','--non-interactive','--no-random-sleep-on-renew')
    if($DryRun){$arguments+='--dry-run'}
    $output=Invoke-Docker $arguments
    Add-Content -LiteralPath (Join-Path $PSScriptRoot 'certificate.log') -Value ((Get-Date -Format o)+"`n"+$output) -Encoding UTF8
    if($DryRun){$result.success=$true;return}
    $export=Join-Path $PSScriptRoot 'export_certificate.py'
    $certificate=Invoke-Docker (@('run','--rm','--network','none','--mount','type=volume,source=dev_letsencrypt,target=/etc/letsencrypt,readonly','--mount',('type=bind,source='+$ssl+',target=/out'),'--mount',('type=bind,source='+$export+',target=/export.py,readonly'),'--entrypoint','python',$image,'/export.py'))
    $result.certificate=$certificate|ConvertFrom-Json
    $changed=(Get-FileHash ($ssl+'\cert.pem')).Hash -ne (Get-FileHash ($ssl+'\cert.pem.next')).Hash -or (Get-FileHash ($ssl+'\key.pem')).Hash -ne (Get-FileHash ($ssl+'\key.pem.next')).Hash
    $result.certificate_changed=$changed
    if($changed){
        $backup=Join-Path $PSScriptRoot 'certificate-backup'
        New-Item -ItemType Directory -Path $backup -Force|Out-Null
        $identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
        & icacls.exe $backup /inheritance:r /grant:r "${identity}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F'|Out-Null
        if($LASTEXITCODE -ne 0){throw 'Cannot protect certificate backup.'}
        foreach($name in @('cert.pem','key.pem')){Copy-Item -LiteralPath ($ssl+'\'+$name) -Destination ($backup+'\'+$name) -Force}
        try{
            foreach($name in @('cert.pem','key.pem')){Move-Item -LiteralPath ($ssl+'\'+$name+'.next') -Destination ($ssl+'\'+$name) -Force}
            Invoke-Docker @('exec','dev-frontend-1','nginx','-t')|Out-Null
            Invoke-Docker @('exec','dev-frontend-1','nginx','-s','reload')|Out-Null
            Start-Sleep -Seconds 2
            $health=& curl.exe --silent --show-error --fail --max-time 20 --resolve 'cell.cbnu.ac.kr:443:127.0.0.1' 'https://cell.cbnu.ac.kr/api/health'
            if($LASTEXITCODE -ne 0 -or ($health|ConvertFrom-Json).status -ne 'ok'){throw 'HTTPS verification failed after certificate reload.'}
        }catch{
            foreach($name in @('cert.pem','key.pem')){Copy-Item -LiteralPath ($backup+'\'+$name) -Destination ($ssl+'\'+$name) -Force}
            Invoke-Docker @('exec','dev-frontend-1','nginx','-t')|Out-Null
            Invoke-Docker @('exec','dev-frontend-1','nginx','-s','reload')|Out-Null
            throw
        }
    }
    $result.success=$true
}catch{$result.error=$_.Exception.Message;throw}
finally{
    if($probe -and (Test-Path -LiteralPath $probe)){Remove-Item -LiteralPath $probe}
    if($null -ne $lock){$lock.Dispose()}
    $file=if($DryRun){Join-Path $PSScriptRoot 'certificate-dryrun.json'}else{$statusPath}
    Write-JsonFile $result $file
    $result|ConvertTo-Json -Depth 8|Write-Output
}
