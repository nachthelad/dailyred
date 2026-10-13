# All downloads, package files, compilers and temporary files stay in this project.
. "$PSScriptRoot/windows-env.ps1"

function Download([string]$Url, [string]$File) {
    & curl.exe -fL --retry 3 $Url -o $File
    if ($LASTEXITCODE) { throw "No se pudo descargar $Url" }
}
function Check-Sha([string]$File, [string]$Expected) {
    if ((Get-FileHash $File -Algorithm SHA256).Hash.ToLower() -ne $Expected.ToLower()) {
        throw "SHA-256 incorrecto: $File"
    }
}
if (!(Test-Path $Bash)) {
    $metadata = Join-Path $Toolchain 'downloads/msys-release.json'
    Download 'https://api.github.com/repos/msys2/msys2-installer/releases/latest' $metadata
    $release = Get-Content $metadata -Raw | ConvertFrom-Json
    $asset = $release.assets | Where-Object name -eq 'msys2-base-x86_64-latest.tar.xz'
    if (!$asset.digest.StartsWith('sha256:')) { throw 'MSYS2 no publicó SHA-256.' }
    $archive = Join-Path $Toolchain 'downloads/msys2.tar.xz'
    Download $asset.browser_download_url $archive
    Check-Sha $archive $asset.digest.Substring(7)
    & tar.exe -xf $archive -C $Toolchain
    if ($LASTEXITCODE) { throw 'Falló la extracción de MSYS2.' }
}
if (!(Test-Path "$Toolchain/arm-none-eabi/bin/arm-none-eabi-gcc.exe")) {
    $name = 'xpack-arm-none-eabi-gcc-14.2.1-1.1-win32-x64.zip'
    $url = "https://github.com/xpack-dev-tools/arm-none-eabi-gcc-xpack/releases/download/v14.2.1-1.1/$name"
    $archive = Join-Path $Toolchain "downloads/$name"
    Download $url $archive
    Download "$url.sha" "$archive.sha"
    Check-Sha $archive ((Get-Content "$archive.sha" -Raw).Trim() -split '\s+')[0]
    & tar.exe -xf $archive -C $Toolchain
    if ($LASTEXITCODE) { throw 'Falló la extracción de GCC ARM.' }
    Rename-Item "$Toolchain/xpack-arm-none-eabi-gcc-14.2.1-1.1" 'arm-none-eabi'
}
Invoke-DailyRedBash 'pacman -Sy --noconfirm --needed make gcc zlib-devel git perl unzip && gcc --version && .toolchain/arm-none-eabi/bin/arm-none-eabi-gcc --version'
Invoke-DailyRedBash 'bash scripts/setup-windows-libpng.sh'
if (!(Test-Path "$Root/pokefirered")) { Invoke-DailyRedBash 'bash scripts/get-pokefirered.sh' }
Invoke-DailyRedBash 'set -e; test "$(git -C pokefirered rev-parse HEAD)" = 037335f4c725d7c9aecdac87066f2002b4bd7e14; if [ ! -f pokefirered/include/dailyred.h ]; then git -C pokefirered apply --check ../patches/pokefirered-dailyred.patch; git -C pokefirered apply --whitespace=nowarn ../patches/pokefirered-dailyred.patch; fi'
# Original vendor script retains all pinned versions and SHA-256 checks.
Invoke-DailyRedBash 'bash scripts/fetch-vendor.sh'
Write-Host 'Preparación lista. Ejecutá scripts/build-windows.ps1.'
