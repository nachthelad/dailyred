# Localización de Daily Red

Adaptación al español por **nachthelad** — https://nachthelad.com.ar.

El juego original es [Daily Red, de amoi-builds](https://github.com/amoi-builds/dailyred). Se conservan sus reglas, semilla, IDs y motor de combate.

## Procedencia

Los textos base de combate, nombres, habilidades, objetos, naturalezas, menús y once recursos gráficos proceden de [SomeRandomSponge/pokefireredlatino](https://github.com/SomeRandomSponge/pokefireredlatino), commit `24828c68b1d5a2a26a8232b623af5b43557823c6`. Su README permite reutilizarlos con atribución. Los créditos completos se conservan en [es/SOURCE-CREDITS.md](es/SOURCE-CREDITS.md) y se muestran desde la web en `translation-credits.txt`.

Se importan únicamente textos y gráficos, por símbolo/ID; no se importa código, lógica de combate ni ampliaciones de buffers de ese proyecto. Se usan las variantes cortas de nombres y abreviaturas compatibles con los límites originales.

Las descripciones españolas faltantes se basan en los datos de [PokéAPI](https://github.com/PokeAPI/pokeapi), commit `81d20919845b6a445969b9265aab5cec6b04cece`, CSV `move_flavor_text.csv`, idioma 7. Los datos españoles disponibles comienzan en X/Y. `es/overrides.json` adapta cambios de generaciones posteriores al comportamiento de FireRed y acorta textos para las ventanas originales. No modifica movimientos ni efectos.

## Archivos reproducibles

- `es/catalog.json`: textos asociados a sus símbolos y texto original esperado. Todos los movimientos tienen nombre/descripción; se revisan placeholders y tamaños.
- `es/overrides.json`: correcciones y textos propios de la adaptación.
- `es/summit.inc`: diálogos de Daily Red en español.
- `es/assets.json`: destino y SHA-256 de cada gráfico/mapa de mosaicos importado.
- `scripts/localize-rom.mjs`: valida y prepara `.toolchain/pokefirered-es`, sin modificar `pokefirered`.
- `scripts/rom-text.mjs`: anchos reales de la fuente GBA para ajustar las descripciones.

La compilación normal sólo necesita los archivos versionables de esta carpeta, las fuentes fijadas y las herramientas ya preparadas. No requiere volver a descargar datos de traducción.

Para regenerar el catálogo desde las referencias descargadas y fijadas en `.toolchain/downloads/es-source`, ejecutar en este orden:

```powershell
node scripts/import-spanish.mjs
node scripts/complete-spanish.mjs
node scripts/localize-rom.mjs --check
```

Para compilar ambas versiones: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-windows.ps1`. `-Language en` y `-Language es` permiten compilar sólo una. ROM y fuentes generadas permanecen ignoradas por Git.
