# Plan de implementación bilingüe

Diseño aprobado: `docs/superpowers/specs/2026-10-13-bilingual-design.md`. Ejecución autorizada por el usuario en este chat.

- [x] Auditar fuente de textos en español y mapear por símbolos, conservando IDs y código. Guardar diccionario/archivos de traducción en `localization/es/`, con procedencia y controles de cobertura.
- [x] Agregar `scripts/localize-rom.mjs`: preparar copia limpia de fuentes originales, aplicar sólo traducciones y producir informe. Adaptar `scripts/build-windows.ps1` para compilar EN y ES con objetos/ELF separados, conservar salida EN original y crear ROM ES.
- [x] Crear `web/i18n.js`, selector accesible y crédito en `web/index.html`; adaptar textos dinámicos de `web/app.js`, errores y caché por idioma en `web/game-files.js`. No modificar `daily.js` ni las reglas del desafío.
- [x] Agregar prueba bilingüe que seleccione ambos idiomas, verifique persistencia, créditos, igualdad del equipo y ROM diferentes, menú/ataque en español y bloqueo del selector en juego. Ejecutar smoke/site originales en inglés y verificar la versión española con ELF correspondiente.
- [x] Actualizar guía e informe con compilación bilingüe, evidencias y espacio. Dejar juego local abierto en español/práctica.

Revisión: impedir fallback silencioso a ROM inglesa; no modificar controles de texto ni identificadores; evitar recortes de nombres y desbordes de ventanas; mantener estadísticas compartidas; cambios de idioma sólo fuera de partida. Todo compilador, dependencia y temporal de trabajo sigue en D:.
