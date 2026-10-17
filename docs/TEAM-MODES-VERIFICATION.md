# Modalidades de equipo — verificación local, 16/10/2026

## Comportamiento

Jugar abre una elección de Aleatorio, Fuego, Agua, Planta, Lucha, Eléctrico o
Roca. Aleatorio es la opción inicial; Comenzar inicia la partida y Volver/Escape
cancela sin consumir el intento. La interfaz está traducida a español e inglés.
Sigue existiendo una única batalla diaria compartida entre todas las opciones,
con el mismo almacenamiento y criterio de consumo al iniciar la batalla con RED.

Los equipos de tipo admiten cualquiera de los dos tipos de la especie. Cada
Pokémon recibe dos ataques legales distintos del tipo elegido; en Aleatorio se
admiten ambos tipos propios, dos ataques en total. Los otros movimientos siguen
siendo aleatorios y legales. Se excluyen del sorteo las especies que no pueden
cumplir la regla. Poder Oculto, Meteorobola, ataques sin tipo efectivo en Gen 3
y ataques que necesitan sueño o Reserva no cuentan para los dos garantizados.

Se mantienen seis especies diferentes, nivel 100, IV/EV/objetos y mínimo 2700
de estadísticas base. La probabilidad de legendario sigue siendo 1/8 entre los
legendarios elegibles. Lucha no tiene legendarios elegibles en generaciones 1–3.

## Auditoría independiente de las tablas de FireRed

| Modalidad | Especies comunes elegibles | Legendarias elegibles | Máximo BST de seis comunes |
| --- | ---: | ---: | ---: |
| Aleatorio | 339 | 19 | 3625 |
| Fuego | 25 | 3 | 3183 |
| Agua | 75 | 2 | 3220 |
| Planta | 40 | 1 | 3075 |
| Lucha | 18 | 0 | 2969 |
| Eléctrico | 19 | 2 | 2945 |
| Roca | 22 | 1 | 3095 |

También se verificó que cada legendario elegible puede completar un equipo con
cinco especies comunes que supere 2700. El sorteo tiene un máximo de 1000
intentos; su alternativa determinista completa los puestos comunes con las
especies elegibles más fuertes, sin cambiar tipo ni cantidad de legendarios.

## Validación

- Compilación Windows de ambas ROM con `scripts/build-windows.ps1`.
- `tests/team-modes.mjs`: matriz inglesa con semillas 1, 8, 42 y 31337;
  matriz española con 1, 14, 42 y 31337. Repetición de 42 en las siete opciones.
  Comprobación adicional inglesa con 14, repetida en las siete opciones para
  cubrir la rama con legendario. Total: 84 arranques de ROM validados.
- Comparación de los pools de especies presentes en RAM con un lector
  independiente de tipos y movimientos legales. Verificación de tipos, ataques,
  estadísticas, objetos, PP, especies únicas y determinismo de atributos de batalla.
- `tests/selection.mjs en` y `es`: selección, cancelación, valor inicial,
  reintento tras HTTP 503 conservando Agua, medianoche durante la elección,
  bloqueo compartido por resultado registrado desde otra pestaña y estadísticas
  previas intactas. Capturas y controles táctiles de al menos 44 px a 320/390 px.
- `tests/site.mjs`: victoria, derrota, abandono, rachas, bloqueo diario,
  práctica, controles móviles y recuperación después de HTTP 404.
- `tests/smoke.mjs`: 32 comprobaciones del juego real, incluidos equipos,
  menús, RED, victoria/derrota, generación posterior, cierre diario sin segunda
  batalla, bloqueo de soft reset y arranque sin semilla.
- `tests/security.mjs`: origen público simulado con CSP, restricción de semillas
  públicas y exclusión de archivos privados del staging local.
- `tests/toolbar.mjs`: sonido, pantalla completa y cierre de audio/emulador.
- `tests/pwa.mjs`: instalación, service worker v3 y arranque real offline.
- `git apply --reverse --check` confirma que el parche canónico reproduce los
  cambios del checkout de FireRed. `git diff --check` sin errores.

Capturas inspeccionadas: `tests/output/team-modes/selection-en-320.png` y
`selection-es-390.png`. Los registros de esta ejecución están en
`.toolchain/tmp/test-*.log` y los de compilación en
`.toolchain/tmp/build-team-modes-final.log`.

## Artefactos y alcance

- `web/game/dailyred.gba.gz`, SHA-256:
  `a474118e0294539a5bfb92d2ad06e658b4693fb633f92ab327a283a6fae0047b`.
- `web/game/dailyred-es.gba.gz`, SHA-256:
  `5db8ad197497d6332850e043344ee9664bde4878d17301cecdc98ae6538d8a2a`.
- Fuentes reproducibles de la ROM: `patches/pokefirered-dailyred.patch`.
- Configuración de ROM versionada a `DAILYRED-CONF-V3`; se rechazan ROM antiguas
  antes de iniciar con opciones que no soportan. Caché PWA versionada a v3.

Las pruebas se realizaron en emuladores y perfiles de navegador aislados contra
archivos locales. No se hizo push, despliegue ni publicación. La rama de
agotamiento de 1000 intentos no se forzó en ejecución: su viabilidad se auditó
exhaustivamente contra los pools reales y todos los legendarios elegibles.
