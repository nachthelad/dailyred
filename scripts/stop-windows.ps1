. "$PSScriptRoot/windows-env.ps1"
$record = Join-Path $Toolchain 'server.json'
if (!(Test-Path $record)) { Write-Host 'No hay un servidor iniciado por Jugar.cmd.'; exit 0 }
$saved = Get-Content $record -Raw | ConvertFrom-Json
$serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$saved.server)"
$expectedScript = Join-Path $Root 'scripts/serve.mjs'
if ($serverProcess) {
    if ($serverProcess.Name -ne 'node.exe' -or !$serverProcess.CommandLine.Contains($expectedScript)) {
        throw 'El PID ya pertenece a otro proceso. No se detuvo nada.'
    }
    $saved | Add-Member -NotePropertyName stopRequested -NotePropertyValue $true -Force
    [IO.File]::WriteAllText($record, ($saved | ConvertTo-Json -Compress), (New-Object Text.UTF8Encoding($false)))
    Stop-Process -Id $serverProcess.ProcessId
}
Write-Host 'Servidor Daily Red detenido. Podés cerrar la pestaña del juego.'
