param(
    [Parameter(Mandatory)][ValidateSet('backend','frontend','ai','colorizer')][string]$Service,
    [ValidateSet('H2','MySQL')][string]$Database = 'H2'
)
. "$PSScriptRoot/local-settings.ps1"
switch ($Service) {
    backend {
        Set-Location -LiteralPath (Join-Path $repoRoot 'backend')
        $profile = if ($Database -eq 'MySQL') { 'local,local-mysql' } else { 'local' }
        $jar = Get-ChildItem build/libs/*.jar | Where-Object Name -NotLike '*-plain.jar' | Select-Object -First 1
        if (-not $jar) { throw 'Backend jar is missing. Run scripts/local.ps1 Start.' }
        & java.exe -jar $jar.FullName "--spring.profiles.active=$profile"
    }
    frontend {
        Set-Location -LiteralPath (Join-Path $repoRoot 'frontend')
        & npm.cmd run dev:local
    }
    ai {
        Set-Location -LiteralPath (Join-Path $repoRoot 'ai-server')
        & $settings.python -m uvicorn main:app --host 127.0.0.1 --port 18001
    }
    colorizer {
        Set-Location -LiteralPath (Join-Path $repoRoot '컬러화POC')
        & $settings.python -m flask --app app run --host 127.0.0.1 --port 18501 --no-reload
    }
}
exit $LASTEXITCODE
