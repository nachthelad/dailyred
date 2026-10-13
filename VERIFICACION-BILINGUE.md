# Daily Red en español e inglés — 13/10/2026

## Entrega

Selector **Español / English** para la página y la ROM. Idioma inicial según el navegador, preferencia recordada y enlaces opcionales `?lang=es` / `?lang=en`. Si se cambia el selector en uno de esos enlaces, se actualiza el parámetro para que la elección sobreviva a una recarga.

Créditos visibles con enlaces:

- **Daily Red, creado por amoi-builds** → https://github.com/amoi-builds/dailyred
- **Adaptación al español por nachthelad · nachthelad.com.ar** → https://nachthelad.com.ar
- Créditos comunitarios y procedencia accesibles desde la web.

Se mantienen la semilla, el desafío del día y la misma clave de estadísticas. El selector queda bloqueado durante la carga y la partida; una modificación programática tampoco reinicia el emulador. Cambiar de idioma al terminar no concede otro intento diario.

## Juego traducido

Menús, selección de equipo, fichas, naturalezas, tipos, habilidades, objetos, nombres/descripciones de los 354 movimientos, textos de combate y diálogos de la cumbre. Se conservan nombres de especies e identificadores. Gráficos de estadísticas, tipos, estados y barras **PS** traducidos; colores originales conservados.

La traducción se prepara en `.toolchain/pokefirered-es`, separada de `pokefirered`. El catálogo contiene más de 2.000 entradas aplicadas por símbolo/ID, con comprobación del texto original, placeholders, límites de nombres y cuatro líneas de descripción ajustadas mediante los anchos reales de la fuente GBA. Once recursos gráficos/mapas de mosaicos llevan SHA-256.

Se reutilizaron textos y gráficos de **SomeRandomSponge/pokefireredlatino**, con todos sus créditos, y datos españoles de **PokéAPI** para completar descripciones. Las correcciones a efectos de generaciones posteriores y abreviaturas están en `localization/es/overrides.json`; la procedencia exacta y los commits están en `localization/README.md`.

La cobertura es el juego Daily Red. No se traduce la campaña original de FireRed que este desafío no expone. La ayuda de campaña está deshabilitada en el juego original y se conserva así; los controles están traducidos en la página.

## Integridad y compilación

- Checkout/parche ingleses conservados. ROM inglesa comprimida: SHA-256 `d3cfecb6b475d43a31ec3a2f82eb07a4dcc0d1dfa1f261d77d82839b99ab42a7`, idéntica a la primera entrega.
- ROM española: `web/game/dailyred-es.gba.gz`, 5.471.554 bytes; SHA-256 `b47ac3d9e51999af57b8275fd53060d6e15d8451e9396da921263ac444527bb4`.
- `dailyred.c`, generador de equipo, equipo de RED, comandos de combate, tabla de movimientos y código de ayuda: iguales byte por byte entre ambas fuentes.
- Todos los campos mecánicos de los objetos coinciden; sólo cambian nombre y descripción. Las estadísticas y reglas web siguen en el `daily.js` original.
- Las siete paletas originales de la ficha se verifican también dentro de cada ROM; se corrigió la paleta de vista previa de los recursos importados.
- `node scripts/localize-rom.mjs --check` y `git diff --check`: aprobados.

Compilar ambos idiomas:

```powershell
cd D:\Cosas\Dev\daily-red
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-windows.ps1
```

Opcionales: `-Language en` o `-Language es`. Herramientas y temporales siguen en D:, sin dependencias nuevas ni instalaciones adicionales en C:.

## Pruebas y evidencia

- `smoke` inglés: 32 comprobaciones.
- `site` inglés con locale explícito: 29 comprobaciones.
- Bilingüe inglés: 22 comprobaciones.
- Bilingüe español: 25 comprobaciones, incluida la conservación de la ayuda deshabilitada.
- `smoke` español sobre la ROM definitiva: 32 comprobaciones.

**Total: 140 comprobaciones aprobadas, cero fallos en los registros finales.** La recompilación incremental de ambos idiomas también pasó (`make: Nothing to be done`); los hashes de ambas ROM comprimidas se conservaron.

La prueba bilingüe comprobó equipo válido, apertura real de menú/ficha, nombres en la ROM, descarga del archivo correcto, misma semilla con idénticas especies/movimientos/IV/EV/estadísticas, batalla contra RED con botones normales, persistencia de idioma, estadísticas compartidas, límite diario, errores traducidos y ausencia de desbordamiento horizontal móvil. Se ejecutó también en Chrome visible para revisar los gráficos y una partida.

Los resultados forzados de victoria/derrota corresponden a las pruebas originales smoke/site. Las partidas de la prueba bilingüe no escriben RAM ni fuerzan resultados. No se realizó una evaluación auditiva del audio ni una revisión humana de todas las combinaciones de mensajes de combate.

Capturas finales:

- `tests/output/bilingual-es/title.png`: selector, página y crédito solicitado.
- `tests/output/bilingual-es/party.png`: equipo español.
- `tests/output/bilingual-es/summary-info.png`: ficha y naturaleza.
- `tests/output/bilingual-es/summary-stats.png`: estadísticas, habilidad y PS.
- `tests/output/bilingual-es/move-description.png`: TERREMOTO y su descripción.
- `tests/output/bilingual-es/red-battle.png` y `turn.png`: batalla real contra RED.
- `tests/output/bilingual-es/mobile.png`: página española en tamaño móvil.
- Equivalentes en `tests/output/bilingual-en/`; ambos `result.json` conservan el equipo comparado.

Registros aprobados: `.toolchain/tests-smoke-en-final.log`, `tests-site-en-final.log`, `tests-en-final.log`, `tests-es-verified.log`, `tests-smoke-es-verified.log`. Los registros anteriores con fallos documentan el diagnóstico de escapes, paletas, esperas de entrada y locale de pruebas; no representan la entrega final.

## Espacio y publicación

Medición durante el cierre: aproximadamente **3,98 GB / 3,71 GiB lógicos en D:**, incluidos todos los compiladores previos, las dos fuentes/ROM, cachés, descargas y pruebas. El nuevo trabajo agregó aproximadamente 0,34 GB lógicos respecto de la primera entrega.

C: sigue usando únicamente las instalaciones existentes de Node y Chrome. No se instaló ninguna herramienta nueva allí. Espacio libre observado: 9.625.575.424 bytes, unos 2,1 MiB menos que en el cierre anterior; es una variación del volumen completo y no puede atribuirse con precisión al proyecto. Perfiles, caché npm, descargas y temporales controlados por los scripts siguen en D:.

Se dejó Chrome abierto en práctica española (`http://localhost:8080/?seed=42&lang=es`), con perfil/caché en D:. Página y ROM españolas respondieron HTTP 200. Para iniciar y detener siguen disponibles **Jugar.cmd** y **Detener.cmd**.

No se publicó, desplegó ni subió la ROM, el juego o las herramientas. La copia anterior en C: se conserva.
