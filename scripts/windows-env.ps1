$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
$Root = Split-Path $PSScriptRoot -Parent
$Toolchain = Join-Path $Root '.toolchain'
foreach ($dir in @('downloads', 'tmp', 'home', 'cache/npm', 'chrome-profile')) {
    New-Item -ItemType Directory -Force (Join-Path $Toolchain $dir) | Out-Null
}
# Process-local settings; never change the user's global environment.
$env:TEMP = Join-Path $Toolchain 'tmp'
$env:TMP = $env:TEMP
$env:HOME = Join-Path $Toolchain 'home'
$env:npm_config_cache = Join-Path $Toolchain 'cache/npm'
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
$env:DAILYRED_ROOT = $Root
$env:MSYSTEM = 'MSYS'
$env:CHERE_INVOKING = '1'
$Bash = Join-Path $Toolchain 'msys64/usr/bin/bash.exe'

function Invoke-DailyRedBash([string]$Command) {
    if (!(Test-Path $Bash)) { throw 'Primero ejecutá scripts/setup-windows.ps1.' }
    # A script file avoids PowerShell 5.1's native-command quote rewriting.
    $commandFile = Join-Path $Toolchain ('tmp/run-' + [guid]::NewGuid().ToString() + '.sh')
    $preamble = 'set -e; export PATH=/usr/bin:$PATH; cd "$(cygpath -u "$DAILYRED_ROOT")"; export PATH="$PWD/scripts/shims:$PATH"; export TMPDIR="$PWD/.toolchain/tmp"; export CPATH="$PWD/.toolchain/libpng/include" LIBRARY_PATH="$PWD/.toolchain/libpng/lib"; '
    [IO.File]::WriteAllText($commandFile, $preamble + $Command + "`n", (New-Object Text.UTF8Encoding($false)))
    try {
        & $Bash -l $commandFile.Replace('\', '/')
        if ($LASTEXITCODE -ne 0) { throw "Falló el comando MSYS2 (código $LASTEXITCODE)." }
    } finally {
        Remove-Item -LiteralPath $commandFile
    }
}
