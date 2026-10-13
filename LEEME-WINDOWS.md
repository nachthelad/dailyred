# Daily Red en Windows

Todo el entorno de trabajo está dentro de `D:\Cosas\Dev\daily-red`. Requiere el Node y Chrome ya instalados.

## Español e inglés

El selector **Español / English** cambia la página y la versión del juego antes de empezar. Detecta el idioma del navegador y recuerda tu elección. Mientras juegas queda bloqueado para no reiniciar la partida. Ambos idiomas comparten el equipo del día y las estadísticas: cambiar de idioma no da otro intento.

Créditos visibles: Daily Red, creado por **amoi-builds**; **Adaptación al español por nachthelad · nachthelad.com.ar**, con enlaces a ambos. La procedencia de los textos y recursos está en `localization/README.md` y en “Créditos de traducción” en la web.

## Jugar y detener

Doble clic en **Jugar.cmd**. Abre Chrome con perfil y caché propios en D: y sirve el juego en <http://localhost:8080/>.

Para práctica, sin consumir el desafío diario:

```powershell
cd D:\Cosas\Dev\daily-red
.\Jugar.cmd -Practice
```

También podés abrir <http://localhost:8080/?seed=42> en la ventana de Chrome del juego.

Flechas: moverse. **X**: hablar/confirmar. **Z**: volver. **Enter**: menú y equipo. Subí las escaleras y hablá con RED.

Para detener: doble clic en **Detener.cmd**, o **Ctrl+C** en la ventana del servidor. Después cerrá Chrome. Cerrar sólo Chrome deja el servidor funcionando. Si el puerto está ocupado, detené primero el servidor anterior. `Detener.cmd` valida que el PID guardado todavía corresponda al servidor Node de este proyecto antes de detenerlo.

Las estadísticas quedan en `.toolchain/chrome-profile`, por dirección y puerto. Borrar ese perfil las elimina. Usar tu Chrome habitual también funciona, pero su perfil/caché podrían escribir en C:.

## Recompilar

Desde PowerShell en el proyecto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-windows.ps1
```

Actualizá la página después. No requiere volver a descargar las herramientas.

El comando compila **ambos idiomas**. Para uno solo, añadí `-Language en` o `-Language es`. El español se prepara en `.toolchain/pokefirered-es`; el checkout y la ROM ingleses se conservan. La web elige `web/game/dailyred.gba.gz` o `web/game/dailyred-es.gba.gz` según el selector.

Para limpiar antes de recompilar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-windows.ps1 -Clean
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-windows.ps1
```

Para preparar de nuevo las herramientas o vendor:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

Se usan MSYS2 local, GCC host, zlib, libpng 1.6.44 y xPack ARM GCC 14.2.1-1.1 para `MODERN=1`. Fuentes pret fijadas en `037335f4c725d7c9aecdac87066f2002b4bd7e14`, parche original y checksums originales del emulador/fuente. `.gitattributes` conserva LF en parches/scripts para que Git Windows no rompa los bloques binarios del parche. No se usa WSL, Docker ni VM.

La preparación conserva fuentes existentes; exige el commit fijado y no sobreescribe una fuente ya parcheada. Si interrumpís una descarga/checkout o modificás fuentes, revisá su estado antes de reintentar.

`windows-cpp.sh` convierte a LF la salida CRLF del preprocesador GCC nativo antes de pasarla a las herramientas de pret. Esto evita el error `empty enum is invalid` sin modificar las fuentes del juego.

## Pruebas

```powershell
cd D:\Cosas\Dev\daily-red
. .\scripts\windows-env.ps1
npm.cmd ci --prefix tests --ignore-scripts --no-audit --no-fund
npm.cmd test --prefix tests
node tests\teams.mjs 1 42 424242
npm.cmd run localization --prefix tests
npm.cmd run bilingual:es --prefix tests
npm.cmd run bilingual:en --prefix tests
```

`CHROME_PATH` permite elegir otro Chrome. No se descargan navegadores. Los temporales de las pruebas y la caché npm se redirigen a `.toolchain` en D:; salidas en `tests/output`.

Con el servidor en 8080 y el Chrome del juego cerrado, `node tests\verify-windows.mjs` abre una práctica visible en inglés, comprueba el equipo, camina hasta RED e intenta un turno normal. Guarda capturas y un JSON en `output/playwright`; deja Chrome abierto hasta que lo cierres.

Para la prueba visible bilingüe se puede usar `node tests\bilingual.mjs es --headed`: prepara su propio servidor y usa un perfil temporal en D:. Las capturas quedan en `tests/output/bilingual-es`. También valida la versión inglesa, la igualdad del equipo de semilla 42, los límites diarios y errores de descarga traducidos.

Las pruebas originales `smoke`/`site` fuerzan algunos resultados modificando RAM para verificar el cierre y las estadísticas. La comprobación visible `verify-windows` sólo lee RAM y usa botones normales.

## Archivos y espacio

- `.toolchain`: compiladores, MSYS2, descargas, cachés, temporales y perfil Chrome.
- `pokefirered`: fuente fijada, parche y compilación.
- `web/vendor` y `web/game`: archivos locales del emulador y juego.
- `output/playwright` y `tests/output`: evidencias.

Los archivos generados están ignorados por Git. No se publican ni se suben ROM, fuentes descargadas o herramientas. La copia previa en C: se conserva.

Los scripts sólo cambian variables de entorno de su propio proceso. `ExecutionPolicy Bypass` se aplica a esa ejecución, sin modificar la política global. Node y Chrome siguen usando sus instalaciones existentes en C:; Windows, antivirus y componentes del sistema pueden mantener registros/cachés propios fuera del proyecto.

El resultado medido de esta ejecución se registra en `VERIFICACION-WINDOWS.md`.

Referencias: [Daily Red](https://github.com/amoi-builds/dailyred), [instalación de pret en el commit fijado](https://github.com/pret/pokefirered/blob/037335f4c725d7c9aecdac87066f2002b4bd7e14/INSTALL.md), [MSYS2](https://www.msys2.org/docs/installer/).
