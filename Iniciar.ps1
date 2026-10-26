param([ValidateSet('Front','Demo')][string]$Servicio = 'Front')
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) { npm ci; if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci.' } }
    if ($Servicio -eq 'Demo') { npm run demo } else { npm start }
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar el frontend.' }
} finally { Pop-Location }
