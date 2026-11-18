/* ===== Teclas: cada acción del juego con su tecla, que se puede cambiar en la configuración =====
 * Pedido: «que se pueda cambiar cualquier control a otra letra del teclado, también los números, las flechas, Control,
 * Alt y Alt Gr». El resto del juego sigue hablando en las teclas originales: Teclas.traducir(e) convierte la tecla que
 * se apretó en la original de la acción que tiene asignada (KeyF para disparar aunque ahora sea la L), o en null si no
 * tiene ninguna. Los botones táctiles mandan teclas sintéticas con la original (js/tactil.js): no vienen del teclado
 * (isTrusted falso) y pasan sin traducir.
 * Se guardan en la configuración por código físico (KeyboardEvent.code, el mismo con cualquier distribución) junto con
 * el nombre que tenía en el teclado de quien la eligió (KeyboardEvent.key: en un teclado español la Ñ es «Semicolon»).
 * Una tecla tiene una sola acción: si se elige una que ya era de otra, se intercambian. Escape no se asigna (siempre
 * pausa, cierra y cancela), ni las teclas del sistema (Windows, Comando). Las teclas del Último bastión son aparte. */
const ACCIONES_TECLADO = [
  { id: 'derecha', teclas: ['ArrowRight'] },
  { id: 'izquierda', teclas: ['ArrowLeft'] },
  { id: 'saltar', teclas: ['ArrowUp'] },
  { id: 'abajo', teclas: ['ArrowDown'] },
  { id: 'girar', teclas: ['KeyW'] },
  { id: 'disparar', teclas: ['KeyF'] },
  { id: 'recargar', teclas: ['KeyS'] },
  { id: 'mira', teclas: ['KeyD'] },
  { id: 'armaAnterior', teclas: ['KeyQ', 'KeyG'] },
  { id: 'armaSiguiente', teclas: ['KeyE', 'KeyH'] },
  ...[1, 2, 3, 4, 5, 6, 7].map(n => ({ id: 'grupo' + n, teclas: ['Digit' + n, 'Numpad' + n], grupo: n - 1 })),
  { id: 'ataqueAereo', teclas: ['KeyA'] },
  { id: 'pausa', teclas: ['KeyP'] },
  { id: 'tienda', teclas: ['KeyB'] },
  { id: 'botiquin', teclas: ['KeyV'] },
  { id: 'torreta', teclas: ['KeyT'] },
  { id: 'menuPruebas', teclas: ['KeyC'] },
  { id: 'zombie', teclas: ['KeyZ'] },
  { id: 'camaraLenta', teclas: ['KeyL'] },
  { id: 'borrar', teclas: ['KeyX'] },
];
// Cómo se agrupan en la configuración
const SECCIONES_TECLADO = [
  ['mover', ['derecha', 'izquierda', 'saltar', 'abajo', 'girar']],
  ['armas', ['disparar', 'recargar', 'mira', 'armaAnterior', 'armaSiguiente', 'grupo1', 'grupo2', 'grupo3', 'grupo4', 'grupo5', 'grupo6', 'grupo7']],
  ['modos', ['ataqueAereo', 'pausa', 'tienda', 'botiquin', 'torreta', 'menuPruebas', 'zombie', 'camaraLenta', 'borrar']],
];
const TECLAS_PROHIBIDAS = new Set(['Escape', 'MetaLeft', 'MetaRight', 'OSLeft', 'OSRight', 'ContextMenu']);

const Teclas = (() => {
  const porId = Object.fromEntries(ACCIONES_TECLADO.map(a => [a.id, a]));
  let asignadas = {}, porCodigo = new Map(), nombres = {};
  // Lo guardado, sin teclas repetidas (si una quedó en dos acciones, se la queda la primera) ni prohibidas
  function cargar() {
    const guardadas = Config.get('teclas') || {};
    nombres = Object.assign({}, Config.get('teclasNombres') || {});
    asignadas = {}; porCodigo = new Map();
    for (const a of ACCIONES_TECLADO) {
      const g = guardadas[a.id], lista = Array.isArray(g) && g.length === a.teclas.length ? g : a.teclas;
      asignadas[a.id] = lista.map(c => (typeof c === 'string' && c && !TECLAS_PROHIBIDAS.has(c) && !porCodigo.has(c) ? (porCodigo.set(c, a), c) : null));
    }
  }
  cargar();
  Config.alCambiar(clave => { if (clave === 'teclas' || clave === 'teclasNombres') { cargar(); refrescar(); } });
  Idioma.alCambiar(() => { const l = document.getElementById('lista-teclas'); if (l && l.childElementCount) dibujarLista(l); });

  /* ---- Nombres de las teclas ---- */
  const SIMBOLOS = { Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Backquote: '`', Comma: ',', Period: '.', Slash: '/', IntlBackslash: '‹', IntlRo: 'Ro', IntlYen: '¥' };
  const NUMERICO = { NumpadAdd: '+', NumpadSubtract: '-', NumpadMultiply: '*', NumpadDivide: '/', NumpadDecimal: '.', NumpadComma: ',', NumpadEqual: '=' };
  // Sin < > & en los nombres: van adentro de textos con HTML (data-t-html) y de textos planos a la vez
  const seguro = s => s.replace(/</g, '‹').replace(/>/g, '›').replace(/&/g, '＆');
  function nombreDeCodigo(c) {
    if (!c) return '—';
    if (/^Key[A-Z]$/.test(c)) return nombres[c] || c.slice(3);
    if (/^Digit\d$/.test(c)) return c.slice(5);
    if (/^Numpad\d$/.test(c)) return 'Num ' + c.slice(6);
    if (/^F\d{1,2}$/.test(c)) return c;
    const fijos = {
      ArrowRight: '→', ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓',
      ControlLeft: 'Ctrl', ControlRight: t('tecla.derecha', { tecla: 'Ctrl' }), AltLeft: 'Alt', AltRight: 'Alt Gr',
      ShiftLeft: 'Shift', ShiftRight: t('tecla.derecha', { tecla: 'Shift' }), Space: t('tecla.espacio'), Enter: 'Enter', NumpadEnter: 'Enter Num',
      Tab: 'Tab', Backspace: '⌫', CapsLock: t('tecla.mayus'), Insert: 'Insert', Delete: t('tecla.supr'), Home: t('tecla.inicio'), End: t('tecla.fin'), PageUp: t('tecla.rePag'), PageDown: t('tecla.avPag'),
    };
    if (fijos[c]) return fijos[c];
    if (NUMERICO[c]) return 'Num ' + NUMERICO[c];
    return seguro(nombres[c] || SIMBOLOS[c] || c);
  }
  // El nombre que se ve en el teclado de quien la elige (la Ñ, la Ç, los acentos); para letras y signos sueltos
  function etiquetaDe(e) {
    const k = e.key;
    if (!k || k.length !== 1 || k === ' ' || /^(Digit|Numpad)/.test(e.code)) return null;
    return k.toUpperCase();
  }

  /* ---- Cambiar una ---- */
  // La ranura «r» de la acción pasa a ser «codigo». Si la tenía otra acción, esa se queda con la que había acá
  function asignar(id, r, codigo, etiqueta) {
    const a = porId[id];
    if (!a || TECLAS_PROHIBIDAS.has(codigo)) return null;
    const nuevas = {}; for (const x of ACCIONES_TECLADO) nuevas[x.id] = asignadas[x.id].slice();
    const vieja = nuevas[id][r], otra = porCodigo.get(codigo);
    let cambio = null;
    if (otra && !(otra.id === id && nuevas[id][r] === codigo)) {
      const ro = nuevas[otra.id].indexOf(codigo);
      nuevas[otra.id][ro] = otra.id === id ? null : vieja;   // dentro de la misma acción, la otra ranura queda libre
      if (otra.id === id) nuevas[id][ro] = vieja;
      cambio = { accion: otra.id, tecla: nuevas[otra.id][ro] };
    }
    nuevas[id][r] = codigo;
    if (etiqueta) Config.set('teclasNombres', Object.assign({}, nombres, { [codigo]: etiqueta }));
    Config.set('teclas', nuevas);
    return cambio;
  }

  /* ---- Lo que se ve ---- */
  // Los textos con {k:acción} y las <kbd data-tecla-de="acción" data-ranura="n"> de la pantalla de controles (las pone
  // Idioma.aplicar) y la lista de la configuración, si está a la vista
  function refrescar() {
    if (document.readyState !== 'loading') Idioma.aplicar();
    const lista = document.getElementById('lista-teclas');
    if (lista && lista.childElementCount) dibujarLista(lista);
  }
  const nombreAccion = id => porId[id].grupo !== undefined ? t('accion.grupo', { n: porId[id].grupo + 1, nombre: GRUPOS_ARMAS[porId[id].grupo].nombre }) : t('accion.' + id);
  // La lista de la configuración: cada acción con sus teclas como botones; se toca uno y se aprieta la tecla nueva
  let esperando = null;   // { id, r, boton }
  function dibujarLista(contenedor) {
    contenedor.innerHTML = SECCIONES_TECLADO.map(([sec, ids]) => `<h4>${t('teclas.' + sec)}</h4>` + ids.map(id => {
      const botones = asignadas[id].map((c, r) => {
        const cambiada = c !== porId[id].teclas[r];
        return `<button type="button" class="tecla-boton${cambiada ? ' cambiada' : ''}" data-cambiar-tecla="${id}" data-ranura="${r}" aria-label="${nombreAccion(id)}: ${nombreDeCodigo(c)}">${nombreDeCodigo(c)}</button>`;
      }).join('');
      return `<div class="fila-tecla"><span>${nombreAccion(id)}</span><span class="teclas-accion">${botones}</span></div>`;
    }).join('')).join('');
    if (esperando) { const b = contenedor.querySelector(`[data-cambiar-tecla="${esperando.id}"][data-ranura="${esperando.r}"]`); if (b) { esperando.boton = b; b.classList.add('esperando'); b.textContent = t('teclas.presiona'); } }
  }
  function avisar(txt) { const el = document.getElementById('teclas-aviso'); if (el) el.textContent = txt; }
  function empezarEspera(boton) {
    terminarEspera();
    esperando = { id: boton.dataset.cambiarTecla, r: +boton.dataset.ranura, boton };
    boton.classList.add('esperando'); boton.textContent = t('teclas.presiona');
    avisar(t('teclas.ayudaEspera', { accion: nombreAccion(esperando.id) }));
  }
  function terminarEspera() {
    if (!esperando) return;
    const { id, r, boton } = esperando; esperando = null; clearTimeout(controlEspera);
    if (boton.isConnected) { boton.classList.remove('esperando'); boton.textContent = nombreDeCodigo(asignadas[id][r]); }
  }
  function elegida(codigo, etiqueta) {
    const { id, r } = esperando; terminarEspera();
    if (TECLAS_PROHIBIDAS.has(codigo)) { avisar(t('teclas.prohibida')); return; }
    const cambio = asignar(id, r, codigo, etiqueta);
    avisar(cambio ? t('teclas.intercambio', { tecla: nombreDeCodigo(codigo), otra: nombreAccion(cambio.accion), nueva: nombreDeCodigo(cambio.tecla) }) : t('teclas.lista', { accion: nombreAccion(id), tecla: nombreDeCodigo(codigo) }));
  }
  // Alt Gr en Windows llega como un Control izquierdo falso y enseguida el Alt derecho: se espera un instante
  let controlEspera = 0;
  document.addEventListener('keydown', e => {
    if (!esperando || !e.isTrusted) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    if (e.code === 'Escape') { terminarEspera(); avisar(''); return; }
    if (e.code === 'ControlLeft') { clearTimeout(controlEspera); controlEspera = setTimeout(() => { if (esperando) elegida('ControlLeft', null); }, 40); return; }
    if (e.code === 'AltRight') clearTimeout(controlEspera);
    elegida(e.code, etiquetaDe(e));
  }, true);
  document.addEventListener('keyup', e => { if (esperando && e.isTrusted) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cambiar-tecla]');
    if (b) { e.preventDefault(); empezarEspera(b); return; }
    if (esperando && !e.target.closest('#lista-teclas')) terminarEspera();
    if (e.target.closest('[data-accion="teclas-originales"]')) { terminarEspera(); Config.set('teclas', null); Config.set('teclasNombres', {}); avisar(t('teclas.originales')); }
  });

  return {
    // La tecla original de la acción que tiene la tecla apretada (o la misma, si viene de un botón táctil)
    traducir: e => { if (!e.isTrusted) return e.code; const a = porCodigo.get(e.code); return a ? a.teclas[0] : null; },
    accion: codigo => (porCodigo.get(codigo) || {}).id || null,
    // Nombre de la tecla de una acción (la primera, o la de la ranura r), para los textos y la pantalla de controles
    nombre: (id, r = 0) => nombreDeCodigo((asignadas[id] || [])[r]),
    nombreDeCodigo,
    esperando: () => !!esperando,
    cancelar: terminarEspera,
    dibujarLista, refrescar, asignar,
  };
})();
