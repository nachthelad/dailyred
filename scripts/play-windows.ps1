param([switch]$Practice)
. "$PSScriptRoot/windows-env.ps1"
if (!(Test-Path "$Root/web/game/dailyred.gba.gz") -or !(Test-Path "$Root/web/vendor/mgba_libretro.wasm")) {
    throw 'Faltan archivos: ejecutá setup-windows.ps1 y build-windows.ps1.'
}
$env:DAILYRED_PRACTICE = if ($Practice) { '1' } else { '0' }
& node "$PSScriptRoot/play-windows.mjs"
if ($LASTEXITCODE) { throw 'El servidor terminó con error.' }
