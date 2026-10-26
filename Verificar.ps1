param([switch]$SinNavegador)
$ErrorActionPreference = 'Stop'
$env:NG_BUILD_MAX_WORKERS = '2'
Push-Location $PSScriptRoot
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) { npm ci; if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci.' } }
    foreach ($check in @('check:components','build','test','test:demo-api')) {
        npm run $check
        if ($LASTEXITCODE -ne 0) { throw "Falló $check." }
    }
    if (-not $SinNavegador) {
        foreach ($check in @('test:e2e','test:demo-ui')) {
            npm run $check
            if ($LASTEXITCODE -ne 0) { throw "Falló $check." }
        }
    }
} finally { Pop-Location }
