/* ===== Asistente de construcción (temporal, sólo mientras se arma el juego) =====
 * Un chat con Claude dentro del juego: quien lo prueba pide cambios en las armas o en la jugabilidad y el
 * asistente los aplica al instante moviendo «perillas» con límites (nunca escribe ni ejecuta código).
 * Lo que necesita código nuevo (un arma nueva, un dibujo, una mecánica, un mapa) queda anotado como pedido en
 * la base del artefacto, para programarlo después desde Claude Code.
 *   - Ajustes personales: en el navegador de cada uno (localStorage).
 *   - Ajustes para todos: el dueño del artefacto puede fijarlos en la base (documento ajustes/compartidos).
 *   - Pedidos: colección «pedidos» de la base; si quien juega no puede escribir ahí, quedan en su navegador
 *     con un botón para copiarlos.
 * Para retirarlo: borrar este archivo, su <script>, la capa #capa-asistente del index, la sección del panel de
 * configuración, los casos «asist-*» de interfaz.js y las claves «asist.*» de idioma.js. AJUSTE (config.js)
 * puede quedar: vale 1 sin el asistente.
 */
const Asistente = (() => {
  const CLAVE_LOCAL = 'zonaMuerta.asistente';
  const MAX_TURNOS = 12;

  /* ---------- Perillas ---------- */
  // De cada arma (se aplican sobre ARMAS[id]; la de retroceso sobre FUERZA_RETROCESO_ARMA)
  const CAMPOS_ARMA = {
    dano:       { min: 0.5, max: 300, desc: 'daño por bala o por perdigón (un zombie medio tiene 15 de vida)' },
    cargador:   { min: 1, max: 500, entero: true, desc: 'balas por cargador (vale desde la próxima recarga)' },
    cadencia:   { min: 30, max: 3000, entero: true, desc: 'milisegundos entre disparos: menos es más rápido' },
    recarga:    { min: 200, max: 8000, entero: true, desc: 'milisegundos que dura la recarga' },
    velocidad:  { min: 3, max: 40, desc: 'velocidad del proyectil' },
    alcance:    { min: 80, max: 2500, entero: true, desc: 'distancia máxima del proyectil en píxeles' },
    automatica: { booleano: true, desc: 'true: dispara mientras se mantiene apretado' },
    perdigones: { min: 1, max: 20, entero: true, soloSi: a => a.categoria === 'escopeta', desc: 'perdigones por disparo (sólo escopetas)' },
    dispersion: { min: 0, max: 1.2, soloSi: a => a.categoria === 'escopeta', desc: 'apertura de los perdigones en radianes (sólo escopetas)' },
    radio:      { min: 30, max: 400, entero: true, soloSi: a => a.explosivo, desc: 'radio de la explosión (sólo explosivos)' },
    retroceso:  { min: 0, max: 3, desc: 'cuánto patea el arma en la animación (0 = nada)' },
  };
  // De la jugabilidad (multiplicadores de AJUSTE, en config.js)
  const GLOBALES = {
    'jugador.velocidad': { campo: 'velocidadJugador', min: 0.4, max: 2.5, desc: 'multiplica la velocidad al caminar (1 = normal)' },
    'jugador.salto':     { campo: 'salto', min: 0.5, max: 1.8, desc: 'multiplica la fuerza del salto (1 = normal)' },
    'jugador.vida':      { campo: 'vidaJugador', min: 10, max: 2000, entero: true, desc: 'vida máxima del protagonista (100 = normal)' },
    'zombies.velocidad': { campo: 'velocidadZombie', min: 0.2, max: 3, desc: 'multiplica la velocidad de los zombies nuevos' },
    'zombies.vida':      { campo: 'vidaZombie', min: 0.1, max: 10, desc: 'multiplica la vida de los zombies nuevos' },
    'zombies.mordida':   { campo: 'mordida', min: 0, max: 5, desc: 'multiplica el daño que hacen (0 = no lastiman)' },
    'zombies.cantidad':  { campo: 'cantidadZombies', min: 0.2, max: 5, desc: 'multiplica cuántos zombies trae cada ronda (desde la próxima)' },
    'cajas.frecuencia':  { campo: 'cajas', min: 0.2, max: 6, desc: 'multiplica qué tan seguido caen cajas de armas' },
  };

  // Cada perilla tiene una clave de texto: «arma.<id>.<campo>» o una de GLOBALES
  function perilla(clave) {
    if (GLOBALES[clave]) {
      const g = GLOBALES[clave];
      return { ...g, leer: () => AJUSTE[g.campo], escribir: v => { AJUSTE[g.campo] = v; if (clave === 'jugador.vida') ajustarVidaEnPartida(v); } };
    }
    const m = /^arma\.([a-z0-9]+)\.([a-z]+)$/.exec(clave);
    if (!m) return null;
    const [, id, campo] = m, a = ARMAS[id], c = CAMPOS_ARMA[campo];
    if (!a || !c || (c.soloSi && !c.soloSi(a))) return null;
    if (campo === 'retroceso') return { ...c, leer: () => FUERZA_RETROCESO_ARMA[id] ?? FUERZA_RETROCESO[a.categoria] ?? 0.6, escribir: v => { FUERZA_RETROCESO_ARMA[id] = v; } };
    if (a[campo] === undefined) return null;
    return { ...c, leer: () => a[campo], escribir: v => { a[campo] = v; } };
  }
  function ajustarVidaEnPartida(v) {
    const j = window.ZonaMuerta?.juego()?.jugador;
    if (!j || j.muerto) return;
    const parte = j.vida / j.vidaMax;
    j.vidaMax = v; j.vida = Math.max(1, Math.round(v * parte));
  }
  function normalizar(p, valor) {
    if (p.booleano) return valor === true || valor === 'true' || valor === 1;
    let v = Number(valor);
    if (!Number.isFinite(v)) throw new Error('valor no numérico');
    v = Math.min(p.max, Math.max(p.min, v));
    return p.entero ? Math.round(v) : Math.round(v * 1000) / 1000;
  }

  /* ---------- Estado: originales, personales y compartidos ---------- */
  const original = {};            // valor de fábrica de cada perilla tocada
  let personal = {};              // { clave: valor } de este navegador
  let compartido = {};            // { clave: valor } fijado por el dueño para todos
  let pedidosLocales = [];        // pedidos que no se pudieron guardar en la base
  try { const d = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || '{}'); personal = d.personal || {}; pedidosLocales = d.pedidos || []; } catch { /* sin almacenamiento */ }
  const guardarLocal = () => { try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ personal, pedidos: pedidosLocales })); } catch { /* ídem */ } };

  // Vuelve a poner cada perilla tocada en su valor efectivo: personal, si no el compartido, si no el original
  function reaplicar() {
    for (const clave of new Set([...Object.keys(original), ...Object.keys(personal), ...Object.keys(compartido)])) {
      const p = perilla(clave);
      if (!p) continue;
      if (!(clave in original)) original[clave] = p.leer();
      p.escribir(clave in personal ? personal[clave] : clave in compartido ? compartido[clave] : original[clave]);
    }
    pintarAjustes();
  }
  function cambiar(clave, valor) {
    const p = perilla(clave);
    if (!p) throw new Error('perilla inexistente: ' + clave);
    if (!(clave in original)) original[clave] = p.leer();
    const antes = p.leer(), ahora = normalizar(p, valor);
    personal[clave] = ahora; guardarLocal(); reaplicar();
    return { clave, antes, ahora, ajustadoAlLimite: !p.booleano && Number(valor) !== ahora };
  }
  function restaurar(claves) {
    const lista = claves && claves.length ? claves : Object.keys(personal);
    for (const k of lista) delete personal[k];
    guardarLocal(); reaplicar();
    return lista;
  }
  /* ---------- Capacidades de claude.ai (todas opcionales) ---------- */
  let sample = null, db = null, usuario = null, esDueno = false, conTools = false;
  const usar = nombre => (window.claude && typeof window.claude.use === 'function') ? window.claude.use(nombre).catch(() => null) : Promise.resolve(null);
  usar('sample').then(async s => {
    sample = s;
    if (s) { const lim = await s.limits().catch(() => null); conTools = !!lim?.tools; }
    pintarEstado();
  });
  usar('user').then(async u => {
    usuario = u;
    if (u) { const [duenio, editor] = await Promise.all([u.isOwner().catch(() => false), u.canEdit().catch(() => false)]); esDueno = !!(duenio || editor); }
    pintarAjustes();
  });
  usar('db').then(d => {
    db = d;
    if (!d) return;
    d.doc('ajustes/compartidos').onSnapshot(s => { compartido = (s.exists && s.data().valores) || {}; reaplicar(); }, () => { /* sin acceso: sólo ajustes personales */ });
  });

  async function anotarPedido(resumen, detalle) {
    const pedido = { resumen: String(resumen).slice(0, 300), detalle: String(detalle || '').slice(0, 2000), idioma: Idioma.actual(), fecha: new Date().toISOString(), estado: 'nuevo' };
    if (db) {
      try { await db.collection('pedidos').add(pedido); pintarPedidos(); return 'guardado en la lista del desarrollador'; } catch { /* sin permiso de escritura: queda local */ }
    }
    pedidosLocales.push(pedido); guardarLocal(); pintarPedidos();
    return 'guardado en este navegador (el jugador puede copiarlo y mandárselo al desarrollador)';
  }
  async function fijarParaTodos() {
    if (!db || !esDueno) return;
    const valores = { ...compartido, ...personal };
    try { await db.doc('ajustes/compartidos').set({ valores, fecha: new Date().toISOString() }); personal = {}; guardarLocal(); reaplicar(); agregarNota(t('asist.fijados')); }
    catch { agregarNota(t('asist.errorFijar')); }
  }
  async function quitarParaTodos() {
    if (!db || !esDueno) return;
    try { await db.doc('ajustes/compartidos').set({ valores: {}, fecha: new Date().toISOString() }); agregarNota(t('asist.quitados')); }
    catch { agregarNota(t('asist.errorFijar')); }
  }

  /* ---------- Lo que lee Claude ---------- */
  const fmt = v => typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : String(v);
  function catalogo() {
    const filas = [];
    for (const a of Object.values(ARMAS)) {
      const campos = Object.keys(CAMPOS_ARMA).filter(c => perilla(`arma.${a.id}.${c}`)).map(c => `${c}=${fmt(perilla(`arma.${a.id}.${c}`).leer())}`);
      filas.push(`${a.id} (${a.nombre}, ${a.categoria}): ${campos.join(' ')}`);
    }
    return filas.join('\n');
  }
  function reglas() {
    const j = window.ZonaMuerta?.juego();
    const idioma = { es: 'español (tuteo)', pt: 'portugués de Brasil', en: 'inglés' }[Idioma.actual()] || 'español';
    return [
      'Eres el asistente de construcción del juego «Zona Muerta» (zombies, vista lateral, armas reales a escala). Quien te escribe está probando el juego mientras se desarrolla y te pide mejoras.',
      `Responde en ${idioma}, breve (1 a 3 frases), sin listas largas ni markdown.`,
      'Tienes dos herramientas:',
      '1) cambiar_ajustes: cambia al instante valores del juego. Úsala cuando el pedido se resuelve moviendo valores (daño, cargador, cadencia, recarga, alcance, retroceso, velocidad o salto del jugador, vida y velocidad de los zombies, etc.). Si el pedido es vago («más fuerte», «más rápido»), elige un cambio razonable (entre 25 % y 60 %) y dilo. No inventes claves: usa sólo las de la lista. Si un valor se recorta al límite, avísalo.',
      '2) anotar_pedido: para todo lo que necesita programación nueva (armas nuevas, dibujos o diseño de un arma, animaciones, sonidos, música, mapas, enemigos, modos, menús, errores). Anótalo con un resumen claro para el desarrollador y avisa que quedó anotado; no prometas fechas.',
      'Si te piden deshacer, usa restaurar_ajustes. Los cambios valen sólo para quien juega, hasta que el dueño los fije para todos.',
      'Si el mensaje no es un pedido sobre el juego, responde amable y en una frase.',
      '',
      'CLAVES DE ARMAS: arma.<id>.<campo>. Campos: ' + Object.entries(CAMPOS_ARMA).map(([k, c]) => `${k} (${c.desc}${c.booleano ? '' : `; ${c.min} a ${c.max}`})`).join('; ') + '.',
      'CLAVES DE JUGABILIDAD: ' + Object.entries(GLOBALES).map(([k, g]) => `${k} = ${fmt(AJUSTE[g.campo])} (${g.desc}; ${g.min} a ${g.max})`).join('; ') + '.',
      '',
      'ARMAS Y VALORES ACTUALES:',
      catalogo(),
      '',
      'AJUSTES PERSONALES ACTIVOS: ' + (Object.keys(personal).length ? Object.entries(personal).map(([k, v]) => `${k}=${fmt(v)} (original ${fmt(original[k])})`).join(', ') : 'ninguno'),
      j ? `PARTIDA EN CURSO: arma en mano ${j.jugador.arma().id}, modo ${j.torreta ? 'defensa zombie' : j.entrenamiento ? 'entrenamiento' : j.pruebas ? 'campo de pruebas' : j.cloaca ? 'cloaca' : 'ciudad'}.` : 'Ahora está en el menú principal.',
    ].join('\n');
  }
  const HERRAMIENTAS = [
    { name: 'cambiar_ajustes', description: 'Aplica uno o varios cambios al juego en el acto. Devuelve, por cada uno, el valor anterior y el nuevo (ya recortado a sus límites), o el error si la clave no existe.',
      inputSchema: { type: 'object', properties: { cambios: { type: 'array', items: { type: 'object', properties: { clave: { type: 'string' }, valor: {} }, required: ['clave', 'valor'] } } }, required: ['cambios'] },
      execute(input) {
        const cambios = Array.isArray(input.cambios) ? input.cambios.slice(0, 20) : [];
        return cambios.map(c => { try { const r = cambiar(String(c.clave), c.valor); agregarChip(r); return r; } catch (e) { return { clave: c.clave, error: e.message }; } });
      } },
    { name: 'anotar_pedido', description: 'Anota para el desarrollador un pedido que necesita programación nueva. Devuelve dónde quedó guardado.',
      inputSchema: { type: 'object', properties: { resumen: { type: 'string', description: 'una línea, qué hay que hacer' }, detalle: { type: 'string', description: 'detalles útiles del pedido' } }, required: ['resumen'] },
      async execute(input) { const donde = await anotarPedido(input.resumen, input.detalle); agregarNota('📝 ' + String(input.resumen)); return donde; } },
    { name: 'restaurar_ajustes', description: 'Deshace ajustes personales y vuelve a los valores anteriores. Sin claves, deshace todos. Devuelve las claves restauradas.',
      inputSchema: { type: 'object', properties: { claves: { type: 'array', items: { type: 'string' } } } },
      execute(input) { const r = restaurar(Array.isArray(input.claves) ? input.claves.map(String) : null); if (r.length) agregarNota(t('asist.restaurados', { n: r.length })); return r; } },
  ];

  /* ---------- Interfaz ---------- */
  const $ = id => document.getElementById(id);
  const capa = $('capa-asistente'), lista = $('asist-mensajes'), texto = $('asist-texto'), enviarBtn = $('asist-enviar'), pararBtn = $('asist-parar');
  let turnos = [], control = null, ocupado = false, abierto = false, capaAnterior = null, deshabilitado = false, saludo = false;
  // Nombre legible de cada perilla de jugabilidad, en el idioma del juego
  const NOMBRES = {
    es: { 'jugador.velocidad': 'Velocidad del jugador', 'jugador.salto': 'Salto', 'jugador.vida': 'Vida del jugador', 'zombies.velocidad': 'Velocidad de los zombies', 'zombies.vida': 'Vida de los zombies', 'zombies.mordida': 'Daño de los zombies', 'zombies.cantidad': 'Cantidad de zombies', 'cajas.frecuencia': 'Frecuencia de cajas' },
    pt: { 'jugador.velocidad': 'Velocidade do jogador', 'jugador.salto': 'Pulo', 'jugador.vida': 'Vida do jogador', 'zombies.velocidad': 'Velocidade dos zumbis', 'zombies.vida': 'Vida dos zumbis', 'zombies.mordida': 'Dano dos zumbis', 'zombies.cantidad': 'Quantidade de zumbis', 'cajas.frecuencia': 'Frequência de caixas' },
    en: { 'jugador.velocidad': 'Player speed', 'jugador.salto': 'Jump', 'jugador.vida': 'Player health', 'zombies.velocidad': 'Zombie speed', 'zombies.vida': 'Zombie health', 'zombies.mordida': 'Zombie damage', 'zombies.cantidad': 'Zombie count', 'cajas.frecuencia': 'Crate frequency' },
  };
  const nombrePerilla = k => k.startsWith('arma.') ? `${ARMAS[k.split('.')[1]]?.nombre} · ${k.split('.')[2]}` : ((NOMBRES[Idioma.actual()] || NOMBRES.es)[k] || k);

  function burbuja(rol, contenido) {
    const el = document.createElement('div');
    el.className = 'asist-msj ' + rol;
    el.textContent = contenido;
    lista.appendChild(el); lista.scrollTop = lista.scrollHeight;
    return el;
  }
  function agregarNota(txt) { const el = burbuja('nota', txt); return el; }
  function agregarChip(r) {
    agregarNota(`⚙ ${nombrePerilla(r.clave)}: ${fmt(r.antes)} → ${fmt(r.ahora)}`);
  }
  function pintarEstado() {
    const nota = $('asist-estado');
    if (!nota) return;
    if (!sample || !conTools) { nota.textContent = t(sample ? 'asist.sinTools' : 'asist.noDisponible'); nota.hidden = false; texto.disabled = enviarBtn.disabled = true; }
    else if (deshabilitado) { nota.textContent = t('asist.sinPermiso'); nota.hidden = false; texto.disabled = enviarBtn.disabled = true; }
    else { nota.hidden = true; texto.disabled = enviarBtn.disabled = ocupado; }
  }
  function pintarAjustes() {
    const ul = $('asist-ajustes');
    if (!ul) return;
    ul.textContent = '';
    const claves = new Set([...Object.keys(personal), ...Object.keys(compartido)]);
    if (!claves.size) { const li = document.createElement('li'); li.className = 'vacio'; li.textContent = t('asist.sinAjustes'); ul.appendChild(li); }
    for (const k of claves) {
      const li = document.createElement('li');
      const valor = k in personal ? personal[k] : compartido[k];
      const span = document.createElement('span'); span.textContent = `${nombrePerilla(k)}: ${fmt(original[k])} → ${fmt(valor)}` + (k in personal ? '' : ' · ' + t('asist.paraTodos'));
      li.appendChild(span);
      if (k in personal) { const b = document.createElement('button'); b.type = 'button'; b.className = 'boton mini'; b.textContent = t('asist.deshacer'); b.onclick = () => restaurar([k]); li.appendChild(b); }
      ul.appendChild(li);
    }
    $('asist-restaurar').disabled = !Object.keys(personal).length;
    $('asist-fijar').hidden = !(esDueno && db);
    $('asist-fijar').disabled = !Object.keys(personal).length;
    $('asist-quitar').hidden = !(esDueno && db && Object.keys(compartido).length);
  }
  function pintarPedidos() {
    const p = $('asist-pedidos-locales');
    if (!p) return;
    p.hidden = !pedidosLocales.length;
    $('asist-pedidos-n').textContent = t('asist.pedidosLocales', { n: pedidosLocales.length });
  }

  async function enviar() {
    const msj = texto.value.trim();
    if (!msj || ocupado || !sample || deshabilitado) return;
    texto.value = '';
    burbuja('yo', msj);
    turnos.push({ role: 'user', content: msj });
    turnos = turnos.slice(-MAX_TURNOS);
    while (turnos.length && turnos[0].role !== 'user') turnos.shift();
    const resp = burbuja('claude', t('asist.pensando'));
    resp.classList.add('pensando');
    ocupado = true; pintarEstado(); pararBtn.hidden = false;
    control = new AbortController();
    try {
      const { text } = await sample([{ role: 'user', content: reglas() }, ...turnos], {
        modelTier: 'quick', signal: control.signal, tools: HERRAMIENTAS,
        onText: ({ text }) => { resp.classList.remove('pensando'); resp.textContent = text; lista.scrollTop = lista.scrollHeight; },
      });
      resp.textContent = text;
      turnos.push({ role: 'assistant', content: text });
    } catch (e) {
      resp.classList.remove('pensando');
      if (e && e.text) resp.textContent = e.text; else resp.remove();
      const codigo = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'tools_unavailable'].includes(codigo)) { deshabilitado = true; }
      else if (codigo !== 'cancelled') agregarNota(t(codigo === 'rate_limited' ? 'asist.limite' : codigo === 'refused' ? 'asist.rechazado' : codigo === 'session_expired' ? 'asist.sesion' : 'asist.error'));
      turnos.pop();   // el pedido sin respuesta no queda en la conversación
    } finally {
      ocupado = false; control = null; pararBtn.hidden = true; pintarEstado();
      if (!texto.disabled) texto.focus();
    }
  }

  reaplicar();   // los ajustes guardados en este navegador valen desde que carga el juego
  $('asist-form').addEventListener('submit', e => { e.preventDefault(); enviar(); });
  texto.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });
  pararBtn.addEventListener('click', () => control?.abort());
  $('asist-restaurar').addEventListener('click', () => { const r = restaurar(); if (r.length) agregarNota(t('asist.restaurados', { n: r.length })); });
  $('asist-fijar').addEventListener('click', fijarParaTodos);
  $('asist-quitar').addEventListener('click', quitarParaTodos);
  $('asist-copiar').addEventListener('click', async () => {
    const txt = pedidosLocales.map((p, i) => `${i + 1}. ${p.resumen}${p.detalle ? ' — ' + p.detalle : ''}`).join('\n');
    try { await navigator.clipboard.writeText(txt); agregarNota(t('asist.copiados')); } catch { agregarNota(txt); }
  });

  return {
    abrir(desde) {
      if (abierto) return;
      abierto = true; capaAnterior = desde || null;
      if (capaAnterior) capaAnterior.classList.add('oculta');
      capa.classList.remove('oculta');
      texto.placeholder = t('asist.placeholder');
      if (!saludo) { saludo = true; lista.prepend(Object.assign(document.createElement('div'), { className: 'asist-msj claude', textContent: t('asist.bienvenida') })); }
      pintarEstado(); pintarAjustes(); pintarPedidos();
      (texto.disabled ? $('asist-volver') : texto).focus();
    },
    cerrar() {
      if (!abierto) return;
      control?.abort();
      abierto = false; capa.classList.add('oculta');
      if (capaAnterior) { capaAnterior.classList.remove('oculta'); capaAnterior.querySelector('button')?.focus(); }
    },
    abierto: () => abierto,
    // Para probar sin claude.ai (consola): Asistente._cambiar('arma.ak47.dano', 9)
    _cambiar: cambiar, _restaurar: restaurar, _reglas: reglas, _herramientas: HERRAMIENTAS,
  };
})();
