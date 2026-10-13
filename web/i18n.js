const messages = {
  en: {
    language: 'Language', languageHint: 'Choose before playing. The game language stays fixed during a run.',
    wins: 'Wins', losses: 'Losses', winStreak: 'Win streak', dayStreak: 'Day streak', play: 'Play', retry: 'Try again',
    practice: "Practice run: results aren't saved.", game: 'Game', downloading: 'Downloading the game',
    starting: 'Starting the emulator', failed: "The game didn't start", soundOff: 'Mute', soundOn: 'Unmute',
    fullScreen: 'Full screen', exitFullScreen: 'Exit full screen', won: 'You beat RED today!', lost: 'RED won today.',
    next: 'Next battle in {time}', progress: '{loaded} of {total} MB', keyboard: 'Keyboard',
    walk: 'Walk, move the cursor', confirm: 'A button: talk, confirm', back: 'B button: back, cancel',
    menu: 'Start: open the menu', select: 'Select', rightShift: 'Right Shift', touch: 'On a phone or tablet, use the buttons under the screen.',
    touchControls: 'Touch controls', dpad: 'Directional pad',
    disclaimer: "Daily Red is a free, unofficial fan project. It isn't affiliated with or endorsed by Nintendo, Creatures Inc., GAME FREAK inc. or The Pokémon Company. Pokémon and all game content are © Nintendo, Creatures Inc. and GAME FREAK inc.",
    licenses: 'Licenses', source: 'Source', creator: 'Daily Red created by', adaptation: 'Spanish adaptation by', credits: 'Translation credits',
    browser: "This browser can't run the game. Use a recent version of Chrome, Edge, Firefox or Safari.",
    connection: ' Check your connection and try again.', downloadError: "Couldn't download {file} (HTTP {status}).",
    startupError: "The game couldn't start. Reload the page and try again.",
    description: 'One Pokémon battle a day: six random level 100 Pokémon against RED at the top of the mountain.',
  },
  es: {
    language: 'Idioma', languageHint: 'Elige antes de jugar. El idioma del juego se mantiene durante la partida.',
    wins: 'Victorias', losses: 'Derrotas', winStreak: 'Racha de victorias', dayStreak: 'Días seguidos', play: 'Jugar', retry: 'Reintentar',
    practice: 'Modo práctica: los resultados no se guardan.', game: 'Juego', downloading: 'Descargando el juego',
    starting: 'Iniciando el emulador', failed: 'El juego no pudo iniciarse', soundOff: 'Silenciar', soundOn: 'Activar sonido',
    fullScreen: 'Pantalla completa', exitFullScreen: 'Salir de pantalla completa', won: '¡Hoy venciste a RED!', lost: 'Hoy ganó RED.',
    next: 'Próxima batalla en {time}', progress: '{loaded} de {total} MB', keyboard: 'Teclado',
    walk: 'Caminar y mover el cursor', confirm: 'Botón A: hablar y confirmar', back: 'Botón B: volver y cancelar',
    menu: 'Start: abrir el menú', select: 'Select', rightShift: 'Shift der.', touch: 'En un celular o una tablet, usa los botones debajo de la pantalla.',
    touchControls: 'Controles táctiles', dpad: 'Control direccional',
    disclaimer: 'Daily Red es un proyecto de fans gratuito y no oficial. No está afiliado ni cuenta con el respaldo de Nintendo, Creatures Inc., GAME FREAK inc. o The Pokémon Company. Pokémon y todo el contenido del juego son © Nintendo, Creatures Inc. y GAME FREAK inc.',
    licenses: 'Licencias', source: 'Código fuente', creator: 'Daily Red, creado por', adaptation: 'Adaptación al español por', credits: 'Créditos de traducción',
    browser: 'Este navegador no puede ejecutar el juego. Usa una versión reciente de Chrome, Edge, Firefox o Safari.',
    connection: ' Revisa tu conexión e inténtalo de nuevo.', downloadError: 'No se pudo descargar {file} (HTTP {status}).',
    startupError: 'No se pudo iniciar el juego. Recarga la página e inténtalo de nuevo.',
    description: 'Una batalla Pokémon por día: seis Pokémon aleatorios de nivel 100 contra RED en la cima de la montaña.',
  },
};
const valid = (value) => Object.hasOwn(messages, value);
let saved;
try { saved = localStorage.getItem('dailyred-language'); } catch {}
const requested = new URLSearchParams(location.search).get('lang');
let language = valid(requested) ? requested : valid(saved) ? saved
  : (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
export const getLanguage = () => language;
export function t(key, values = {}, lang = language) {
  const text = messages[lang]?.[key];
  if (text === undefined) throw new Error(`Missing translation: ${lang}/${key}`);
  return text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
}
export function setLanguage(value) {
  if (!valid(value)) return;
  language = value;
  try { localStorage.setItem('dailyred-language', value); } catch {}
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) { url.searchParams.set('lang', value); history.replaceState(null, '', url); }
  applyLanguage();
}
export function applyLanguage() {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
  for (const element of document.querySelectorAll('[data-i18n-aria]')) element.setAttribute('aria-label', t(element.dataset.i18nAria));
  document.querySelector('meta[name="description"]').content = t('description');
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  }
}
