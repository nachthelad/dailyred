$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$recordPath = Join-Path $projectRoot '.toolchain/public-server.json'
if (!(Test-Path $recordPath)) { Write-Output 'El acceso publico ya esta cerrado.'; exit 0 }
$record = Get-Content $recordPath -Raw | ConvertFrom-Json
foreach ($role in @('tunnel', 'server')) {
    $processId = $record.$role
    if (!$processId) { continue }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId"
    if (!$process) { continue }
    $expectedPath = if ($role -eq 'tunnel') { Join-Path $projectRoot '.toolchain/cloudflared/cloudflared.exe' } else { Join-Path $projectRoot 'scripts/serve.mjs' }
    $matchesProject = if ($role -eq 'tunnel') { $process.ExecutablePath -eq $expectedPath } else { $process.Name -eq 'node.exe' -and $process.CommandLine.Contains($expectedPath) -and $process.CommandLine -match '\s8081(?:\s|$)' }
    if (!$matchesProject) { throw "El PID $processId no corresponde al acceso publico de este proyecto. No se detuvo." }
    Stop-Process -Id $processId
}
Remove-Item -LiteralPath $recordPath
Write-Output 'Acceso publico cerrado. El servidor local de Jugar.cmd sigue disponible.'
