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
  if (Rama.conServidor()) personal = Rama.ajustes();   // con el servidor, los ajustes viven en la rama del jugador (git)
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
    if (Rama.conServidor()) Rama.guardarAjustes(personal, `Ajuste ${clave}: ${fmt(antes)} → ${fmt(ahora)}`);
    return { clave, antes, ahora, ajustadoAlLimite: !p.booleano && Number(valor) !== ahora };
  }
  function restaurar(claves) {
    const lista = claves && claves.length ? claves : Object.keys(personal);
    for (const k of lista) delete personal[k];
    guardarLocal(); reaplicar();
    if (Rama.conServidor() && lista.length) Rama.guardarAjustes(personal, `Restaura ${lista.join(', ')}`);
    return lista;
  }
  /* ---------- Capacidades de claude.ai (todas opcionales) ---------- */
  let sample = null, db = null, usuario = null, esDueno = false, conTools = false;
  const usar = nombre => (window.claude && typeof window.claude.use === 'function') ? window.claude.use(nombre).catch(() => null) : Promise.resolve(null);
  let servidorIA = false;   // con el servidor de construcción, el asistente pasa por /api/ia
  if (Rama.conServidor()) fetch('/api/estado').then(r => r.json()).then(d => { servidorIA = !!d.ia; pintarEstado(); }, () => {});
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
    if (Rama.conServidor()) {
      try { const r = await fetch(`/api/pedido/${Rama.id()}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pedido) }); if (r.ok) return 'guardado en la rama del jugador para el desarrollador'; } catch { /* queda local */ }
    }
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
  /* ---------- Código fuente, para que el asistente lea antes de parchear ---------- */
  // Se lee de los mismos archivos que cargó la página; si no se puede, del paquete js/codigo-fuente.js
  const fuentes = {};
  let paquete = null, mapaCodigo = null;
  const archivosDeCodigo = () => [...document.scripts].map(s => s.getAttribute('src') || '').filter(src => /^js\/.+\.js$/.test(src) && !/sonidos-|codigo-fuente|asistente|rama\.js/.test(src)).map(src => src.slice(3));
  function cargarPaquete() {
    if (!paquete) paquete = new Promise(listo => {
      const s = document.createElement('script'); s.src = 'js/codigo-fuente.js';
      s.onload = () => listo(window.CODIGO_FUENTE || {}); s.onerror = () => listo({});
      document.head.appendChild(s);
    });
    return paquete;
  }
  async function fuente(archivo) {
    if (fuentes[archivo] !== undefined) return fuentes[archivo];
    try { const r = await fetch('js/' + archivo); if (r.ok) return (fuentes[archivo] = await r.text()); } catch { /* sin acceso: paquete */ }
    return (fuentes[archivo] = (await cargarPaquete())[archivo] ?? null);
  }
  // Mapa breve: en qué línea está cada declaración de cada archivo
  async function mapa() {
    if (mapaCodigo) return mapaCodigo;
    const lineas = [];
    for (const f of archivosDeCodigo()) {
      const txt = await fuente(f);
      if (txt == null) continue;
      const decl = [];
      txt.split('\n').forEach((l, i) => {
        let m = /^(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+)|(?:const|let|var)\s+(\w+))/.exec(l);
        if (m) return decl.push(`${i + 1}:${m[1] || m[2] || m[3]}`);
        if ((m = /^\s*reemplazar\('(\w+)'/.exec(l)) || (m = /^  (\w+): modelo\(/.exec(l))) return decl.push(`${i + 1}:modelo ${m[1]}`);
        if ((m = /^  (?:async\s+|static\s+)?(\w+)\s*\([^)]*\)\s*\{/.exec(l)) && !/^(if|for|while|switch|return|catch|dibujarCm|dibujar)$/.test(m[1])) decl.push(`${i + 1}:.${m[1]}`);
      });
      lineas.push(`${f} (${txt.split('\n').length} líneas): ${decl.join(' ')}`);
    }
    return (mapaCodigo = lineas.join('\n'));
  }
  async function leerCodigo(lecturas) {
    const partes = [];
    let total = 0;
    for (const l of (Array.isArray(lecturas) ? lecturas : []).slice(0, 8)) {
      let bloque;
      if (l.buscar) {
        const que = String(l.buscar), archivos = l.archivo ? [String(l.archivo)] : archivosDeCodigo(), hallados = [];
        for (const f of archivos) { const txt = await fuente(f); if (txt == null) continue; txt.split('\n').forEach((x, i) => { if (x.includes(que) && hallados.length < 40) hallados.push(`${f}:${i + 1}: ${x.slice(0, 220)}`); }); }
        bloque = `BUSCAR «${que}»:\n` + (hallados.join('\n') || '(sin resultados)');
      } else {
        const f = String(l.archivo || ''), txt = await fuente(f);
        if (txt == null) { bloque = `${f}: no existe o no se pudo leer`; }
        else {
          const ls = txt.split('\n'), desde = Math.max(1, Number(l.desde) || 1), hasta = Math.min(ls.length, Number(l.hasta) || desde + 120, desde + 249);
          bloque = `${f} líneas ${desde}-${hasta} de ${ls.length}:\n` + ls.slice(desde - 1, hasta).map((x, i) => `${desde + i}: ${x}`).join('\n');
        }
      }
      if (total + bloque.length > 28000) { partes.push('(se cortó: pide menos líneas por vez)'); break; }
      total += bloque.length; partes.push(bloque);
    }
    return partes.join('\n\n');
  }

  // Lo fijo (instrucciones y mapa del código) va primero y se cachea; el estado del juego cambia en cada pedido
  async function reglasFijas() {
    const idioma = { es: 'español (tuteo)', pt: 'portugués de Brasil', en: 'inglés' }[Idioma.actual()] || 'español';
    return [
      'Eres el asistente de construcción del juego «Zona Muerta» (zombies, vista lateral, armas reales a escala, canvas 2D en JavaScript sin librerías). Quien te escribe juega su propia «rama» del juego: lo que cambies se aplica en vivo en su juego, y el dueño después decide si lo pasa a la versión principal.',
      `Responde en ${idioma}, breve (1 a 4 frases), sin markdown.`,
      'HERRAMIENTAS:',
      '1) cambiar_ajustes: mueve valores del juego (daño, cargador, cadencia, recarga, alcance, retroceso; velocidad, salto y vida del jugador; vida, velocidad, daño y cantidad de zombies; cajas). Es lo más rápido y seguro: úsalo siempre que alcance con un valor. Si el pedido es vago, elige un cambio razonable (25 % a 60 %) y dilo. Sólo claves de la lista.',
      '2) leer_codigo: lee el código del juego por archivo y rango de líneas, o buscando un texto. Pide varias lecturas en una sola llamada. Antes de escribir un parche, lee lo que vas a tocar.',
      '3) aplicar_parche: agrega a la rama de este jugador un parche de JavaScript que cambia el juego (armas nuevas, dibujos, comportamientos, efectos, reglas). Se ejecuta ahora y cada vez que el juego carga. Si tira error no se guarda: corrígelo y reintenta una sola vez.',
      '4) restaurar_ajustes: deshace ajustes de valores. Para deshacer un parche, dile al jugador que lo apague en «Mi rama».',
      '5) anotar_pedido: para lo que no puedas hacer con un parche (menús y botones de la interfaz, sonidos grabados nuevos, cambios enormes) o si no estás seguro de hacerlo bien.',
      'REGLAS DE LOS PARCHES:',
      '- JavaScript de navegador en el ámbito global, después de cargar armas, modelos, escenario, jugador, zombies, objetos, juego y poderes, y antes de la interfaz. Ves ARMAS, ARMAS_COMUNES, ARMAS_ESPECIALES, ARMAS_LEGENDARIAS, ORDEN_INVENTARIO, GRUPOS_ARMAS, DIBUJO_ARMAS, FICHAS, DIFICULTADES, AJUSTE, MAT, pintar, suave, Rc, RRc, Cc, Ec, trazo, rayas, punto, remache, rebaje, sombraContacto, modelo, reemplazar, Audio_, t, Idioma y las clases Juego, Jugador, Zombie, ZombieToxico, Proyectil, Caja, Explosion, etc.',
      '- No puedes reasignar constantes (const, class); sí cambiar propiedades de objetos, agregar elementos a listas y reemplazar métodos de prototipo. Si envuelves un método, guarda el original: const orig = Zombie.prototype.actualizar; Zombie.prototype.actualizar = function (...a) { /* ... */ return orig.apply(this, a); };',
      '- Tiene que correr bien una vez sobre el juego recién cargado. Sin red, sin almacenamiento, sin eval, sin timers sueltos, sin tocar el asistente ni la rama. Escribe código prolijo con comentarios cortos en español: puede terminar en la versión principal.',
      '- Las armas se dibujan en centímetros reales (x hacia la boca, y hacia abajo, origen arriba de la empuñadura) con los ayudantes de armas-modelos.js; copia el estilo de un modelo parecido. Un arma nueva necesita: entrada en ARMAS (copia los campos de una parecida), modelo en DIBUJO_ARMAS (modelo({...}) con agarre, anguloEmpunadura y culataCm), sumarla a ORDEN_INVENTARIO y a la lista de su tipo (ARMAS_COMUNES, ARMAS_ESPECIALES...). Revisa armas.js y cómo se usan esas listas antes.',
      '- Lo que el juego arma al cargar (menús de armas, catálogo) sólo cambia al recargar: dile al jugador que toque «Recargar el juego» en «Mi rama» cuando haga falta.',
      '',
      'MAPA DEL CÓDIGO (archivo: línea:declaración; «.x» es un método):',
      await mapa(),
    ].join('\n');
  }
  function estadoDelJuego() {
    const j = window.ZonaMuerta?.juego();
    const parches = Rama.parches();
    return [
      'PARCHES DE ESTA RAMA: ' + (parches.length ? '' : 'ninguno'),
      ...parches.slice(-10).map(p => `- ${p.id} [${p.activo ? 'activo' : 'apagado'}${p.error ? ', error: ' + p.error : ''}] ${p.descripcion}\n${p.codigo.slice(0, 1500)}`),
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
  const reglas = async () => `${await reglasFijas()}\n\n${estadoDelJuego()}`;
  let ultimoPedido = '';
  const HERRAMIENTAS = [
    { name: 'cambiar_ajustes', description: 'Aplica uno o varios cambios de valores al juego en el acto. Devuelve, por cada uno, el valor anterior y el nuevo (ya recortado a sus límites), o el error si la clave no existe.',
      inputSchema: { type: 'object', properties: { cambios: { type: 'array', items: { type: 'object', properties: { clave: { type: 'string' }, valor: {} }, required: ['clave', 'valor'] } } }, required: ['cambios'] },
      execute(input) {
        const cambios = Array.isArray(input.cambios) ? input.cambios.slice(0, 20) : [];
        return cambios.map(c => { try { const r = cambiar(String(c.clave), c.valor); agregarChip(r); return r; } catch (e) { return { clave: c.clave, error: e.message }; } });
      } },
    { name: 'leer_codigo', description: 'Lee el código fuente del juego. Pasa una lista de lecturas: {archivo, desde, hasta} para un rango de líneas (hasta 250 por lectura) o {buscar} para encontrar un texto en todos los archivos (o en uno, con archivo). Devuelve las líneas numeradas.',
      inputSchema: { type: 'object', properties: { lecturas: { type: 'array', items: { type: 'object', properties: { archivo: { type: 'string', description: 'p. ej. armas.js' }, desde: { type: 'number' }, hasta: { type: 'number' }, buscar: { type: 'string' } } } } }, required: ['lecturas'] },
      async execute(input) { agregarNota('🔎 ' + t('rama.leyendo')); return leerCodigo(input.lecturas); } },
    { name: 'aplicar_parche', description: 'Agrega a la rama de este jugador un parche de JavaScript y lo ejecuta ahora. Devuelve el id del parche y si conviene recargar, o el error (en ese caso no se guardó nada).',
      inputSchema: { type: 'object', properties: { descripcion: { type: 'string', description: 'qué cambia, en una línea, para el jugador y el desarrollador' }, codigo: { type: 'string', description: 'el JavaScript del parche' }, requiereRecarga: { type: 'boolean', description: 'true si el cambio sólo se ve después de recargar el juego' } }, required: ['descripcion', 'codigo'] },
      execute(input) {
        try {
          const p = Rama.aplicar({ descripcion: input.descripcion, pedido: ultimoPedido, codigo: input.codigo });
          agregarNota('🧩 ' + p.descripcion); if (input.requiereRecarga) marcarRecarga(); pintarRama();
          return { ok: true, id: p.id };
        } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
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
    if (Rama.conServidor() ? !servidorIA : (!sample || !conTools)) { nota.textContent = t(Rama.conServidor() ? 'asist.sinClave' : sample ? 'asist.sinTools' : 'asist.noDisponible'); nota.hidden = false; texto.disabled = enviarBtn.disabled = true; }
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
    $('asist-fijar').hidden = !(esDueno && db) || Rama.conServidor();
    $('asist-fijar').disabled = !Object.keys(personal).length;
    $('asist-quitar').hidden = !(esDueno && db && Object.keys(compartido).length);
  }
  function pintarPedidos() {
    const p = $('asist-pedidos-locales');
    if (!p) return;
    p.hidden = !pedidosLocales.length;
    $('asist-pedidos-n').textContent = t('asist.pedidosLocales', { n: pedidosLocales.length });
  }

  /* ---------- Con el servidor de construcción ---------- */
  // El bucle de herramientas corre acá (las herramientas tocan este juego); cada vuelta pasa por /api/ia, que
  // agrega la clave y los topes. Cada pedido es una conversación nueva que sólo crece: la charla anterior va como
  // texto y las respuestas se devuelven tal cual (con sus bloques de razonamiento) dentro del mismo pedido.
  const definiciones = () => HERRAMIENTAS.map(h => ({ name: h.name, description: h.description, input_schema: h.inputSchema || { type: 'object', properties: {} } }));
  async function preguntarServidor(msj, alEscribir, signal) {
    const charla = turnos.slice(0, -1).slice(-8).map(x => `${x.role === 'user' ? 'Jugador' : 'Asistente'}: ${x.content}`).join('\n');
    const mensajes = [{ role: 'user', content: `${estadoDelJuego()}\n\n${charla ? `CONVERSACIÓN RECIENTE:\n${charla}\n\n` : ''}PEDIDO DEL JUGADOR:\n${msj}` }];
    const sistema = await reglasFijas();
    let escrito = '';
    for (let vuelta = 0; vuelta < 12; vuelta++) {
      const r = await fetch('/api/ia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
        body: JSON.stringify({ jugador: Rama.id(), sistema, mensajes, herramientas: definiciones() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw { code: r.status === 429 ? (d.error === 'tope' ? 'tope' : 'rate_limited') : d.error === 'sin_clave' ? 'sin_clave' : 'upstream_error', text: escrito || undefined };
      mensajes.push({ role: 'assistant', content: d.content });
      for (const b of d.content || []) if (b.type === 'text' && b.text.trim()) { escrito += (escrito ? '\n\n' : '') + b.text.trim(); alEscribir({ text: escrito }); }
      if (d.stop_reason === 'refusal') throw { code: 'refused', text: escrito || undefined };
      if (d.stop_reason === 'pause_turn') continue;
      if (d.stop_reason !== 'tool_use') break;
      const resultados = [];
      for (const b of d.content) {
        if (b.type !== 'tool_use') continue;
        const h = HERRAMIENTAS.find(x => x.name === b.name);
        try {
          const salida = h ? await h.execute(b.input || {}, { signal }) : 'herramienta desconocida';
          resultados.push({ type: 'tool_result', tool_use_id: b.id, content: typeof salida === 'string' ? salida : JSON.stringify(salida) });
        } catch (e) { resultados.push({ type: 'tool_result', tool_use_id: b.id, content: String((e && e.message) || e), is_error: true }); }
      }
      mensajes.push({ role: 'user', content: resultados });
    }
    return escrito || '…';
  }

  async function enviar() {
    const msj = texto.value.trim();
    if (!msj || ocupado || deshabilitado || (Rama.conServidor() ? !servidorIA : !sample)) return;
    texto.value = '';
    burbuja('yo', msj); ultimoPedido = msj;
    turnos.push({ role: 'user', content: msj });
    turnos = turnos.slice(-MAX_TURNOS);
    while (turnos.length && turnos[0].role !== 'user') turnos.shift();
    const resp = burbuja('claude', t('asist.pensando'));
    resp.classList.add('pensando');
    ocupado = true; pintarEstado(); pararBtn.hidden = false;
    control = new AbortController();
    try {
      const alEscribir = ({ text }) => { resp.classList.remove('pensando'); resp.textContent = text; lista.scrollTop = lista.scrollHeight; };
      const { text } = Rama.conServidor()
        ? { text: await preguntarServidor(msj, alEscribir, control.signal) }
        : await sample([{ role: 'user', content: await reglas() }, ...turnos], {
          model: 'claude-sonnet-5-5', modelTier: 'default',   // Sonnet; si a quien juega no le está disponible, responde el modelo estándar
          signal: control.signal, tools: HERRAMIENTAS, onText: alEscribir,
        });
      resp.textContent = text;
      turnos.push({ role: 'assistant', content: text });
    } catch (e) {
      resp.classList.remove('pensando');
      if (e && e.text) resp.textContent = e.text; else resp.remove();
      const codigo = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'tools_unavailable'].includes(codigo)) { deshabilitado = true; }
      else if (codigo === 'tope') agregarNota(t('asist.topeDiario', { n: 30 }));
      else if (codigo === 'sin_clave') { servidorIA = false; }
      else if (codigo !== 'cancelled' && !(e && e.name === 'AbortError')) agregarNota(t(codigo === 'rate_limited' ? 'asist.limite' : codigo === 'refused' ? 'asist.rechazado' : codigo === 'session_expired' ? 'asist.sesion' : 'asist.error'));
      turnos.pop();   // el pedido sin respuesta no queda en la conversación
    } finally {
      ocupado = false; control = null; pararBtn.hidden = true; pintarEstado();
      if (!texto.disabled) texto.focus();
    }
  }

  reaplicar();   // los ajustes guardados en este navegador valen desde que carga el juego
  /* ---------- Mi rama ---------- */
  let hayQueRecargar = false;
  function marcarRecarga() { hayQueRecargar = true; $('rama-recargar').classList.add('resaltado'); }
  function pintarRama() {
    const ul = $('rama-parches');
    if (!ul) return;
    ul.textContent = '';
    const parches = Rama.parches();
    if (!parches.length) { const li = document.createElement('li'); li.className = 'vacio'; li.textContent = t('rama.sinParches'); ul.appendChild(li); }
    for (const p of parches) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = p.descripcion + (p.error ? ` · ${t('rama.conError')}` : !p.activo ? ` · ${t('rama.apagado')}` : p.enviado ? ` · ${t('rama.enviadoEstado')}` : '');
      if (p.error) span.title = p.error;
      li.appendChild(span);
      const acciones = document.createElement('span'); acciones.className = 'acciones';
      const alt = document.createElement('button'); alt.type = 'button'; alt.className = 'boton mini'; alt.textContent = t(p.activo ? 'rama.apagar' : 'rama.encender');
      alt.onclick = () => { Rama.alternar(p.id, !p.activo); marcarRecarga(); pintarRama(); };
      const borrar = document.createElement('button'); borrar.type = 'button'; borrar.className = 'boton mini peligro'; borrar.textContent = t('rama.borrar');
      borrar.onclick = () => { Rama.borrar(p.id); marcarRecarga(); pintarRama(); };
      acciones.append(alt, borrar); li.appendChild(acciones); ul.appendChild(li);
    }
    $('rama-enviar').disabled = !parches.some(p => p.activo);
    // Con el servidor todo se guarda solo en git: no hace falta enviar; se muestra el código para usarlo en otro lado
    $('rama-enviar').hidden = Rama.conServidor();
    $('rama-otra').hidden = !Rama.conServidor();
    const est = $('rama-estado');
    est.hidden = !Rama.conServidor();
    if (Rama.conServidor()) {
      est.textContent = t({ guardado: 'rama.guardada', guardando: 'rama.guardando', error: 'rama.errorGuardar', pendiente: 'rama.guardando' }[Rama.estado()] || 'rama.guardada', { codigo: Rama.id() });
      $('rama-codigo').placeholder = t('rama.otraPlaceholder');
    }
  }
  async function enviarRama() {
    const datos = Rama.exportar();
    if (!datos.parches.length) return;
    if (db) {
      try { await db.doc('ramas/' + datos.rama).set({ ...datos, idioma: Idioma.actual(), estado: 'en revisión' }); Rama.marcarEnviados(datos.parches.map(p => p.id)); pintarRama(); agregarNota(t('rama.enviada')); return; }
      catch { /* sin permiso de escritura: archivo o portapapeles */ }
    }
    const json = JSON.stringify(datos, null, 2), descargas = await usar('downloads');
    if (descargas) { try { await descargas.save({ filename: `rama-zona-muerta-${datos.rama}.json`, data: json }); agregarNota(t('rama.descargada')); return; } catch { /* rechazada: portapapeles */ } }
    try { await navigator.clipboard.writeText(json); agregarNota(t('rama.copiada')); } catch { agregarNota(t('rama.noEnviada')); }
  }
  $('rama-recargar').addEventListener('click', () => location.reload());
  $('rama-usar').addEventListener('click', () => { const c = $('rama-codigo').value.trim().toLowerCase(); if (!Rama.usarRama(c)) agregarNota(t('rama.codigoInvalido')); });
  window.addEventListener('rama-guardada', () => { if (abierto) pintarRama(); });
  $('rama-enviar').addEventListener('click', enviarRama);

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
      pintarEstado(); pintarAjustes(); pintarPedidos(); pintarRama();
      for (const a of Rama.avisos()) agregarNota('⚠ ' + t(a.clave, a));
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
    _cambiar: cambiar, _restaurar: restaurar, _reglas: reglas, _herramientas: HERRAMIENTAS, _leerCodigo: leerCodigo, _mapa: mapa, _preguntarServidor: preguntarServidor,
  };
})();
