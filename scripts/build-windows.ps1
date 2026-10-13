param([switch]$Clean, [ValidateSet('all', 'en', 'es')][string]$Language = 'all')
. "$PSScriptRoot/windows-env.ps1"
if ($Clean) {
    Invoke-DailyRedBash 'make -C pokefirered TOOLCHAIN="$PWD/.toolchain/arm-none-eabi" MODERN=1 clean'
    if (Test-Path "$Root/.toolchain/pokefirered-es") {
        Invoke-DailyRedBash 'make -C .toolchain/pokefirered-es TOOLCHAIN="$PWD/.toolchain/arm-none-eabi" MODERN=1 clean'
    }
} else {
  if ($Language -ne 'es') {
    Invoke-DailyRedBash 'set -e; make -C pokefirered -j8 TOOLCHAIN="$PWD/.toolchain/arm-none-eabi" CPP="bash $PWD/scripts/windows-cpp.sh" MODERN=1; mkdir -p web/game; gzip -9 -n -c pokefirered/pokefirered_modern.gba > web/game/dailyred.gba.gz; cp pokefirered/graphics/trainers/front_pics/red_front_pic.png web/game/red.png; ls -lh web/game/'
  }
  if ($Language -ne 'en') {
    & node "$PSScriptRoot/localize-rom.mjs"
    if ($LASTEXITCODE) { throw 'Falló la preparación de textos en español.' }
    Invoke-DailyRedBash 'set -e; make -C .toolchain/pokefirered-es -j8 TOOLCHAIN="$PWD/.toolchain/arm-none-eabi" CPP="bash $PWD/scripts/windows-cpp.sh" MODERN=1; mkdir -p web/game; gzip -9 -n -c .toolchain/pokefirered-es/pokefirered_modern.gba > web/game/dailyred-es.gba.gz; ls -lh web/game/'
  }
}
