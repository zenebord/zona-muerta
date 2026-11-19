/* ===== Pedidos: un gestor de tickets sencillo dentro del juego (pedido de Leandro, para enseñarle a Enzo) =====
 * Botón PEDIDOS del menú: la lista de tickets (número, título, estado, sección y prioridad, con el texto al tocarlos),
 * filtrada por estado y por sección, y NUEVO PEDIDO → CREAR, que lo guarda y listo.
 * Dónde se guardan: si el juego corre en el servidor de construcción (servidor/servidor.mjs, window.SERVIDOR_JUEGO), en su
 * base de datos sencilla (servidor/datos/pedidos.json), que se puede leer y editar (servidor/pedidos.mjs); si no, en este
 * mismo navegador (localStorage), y entonces sólo los ve quien los creó en este dispositivo.
 * Todo lo guardado se muestra como texto (textContent), nunca como HTML.
 */
const PEDIDOS = {
  secciones: ['Pelea infinita', 'Camino a casa', 'Misiones', 'Defensa zombie', 'Defensa zombie ultra', 'Último bastión', 'Entrenamiento', 'Campo de pruebas', 'Tutorial', 'VR', 'Menú y configuración', 'Armas', 'Sonido y música', 'Gráficos', 'Zombies', 'Controles y celular', 'Otra cosa'],
  // Un color para cada sección: se ve en su etiqueta y en la raya de la izquierda de cada pedido
  colores: { 'Pelea infinita': '#5aa9ff', 'Camino a casa': '#5fd38d', 'Misiones': '#b58cff', 'Defensa zombie': '#ff7a6b', 'Defensa zombie ultra': '#ff9a4d', 'Último bastión': '#a3c45a',
    'Entrenamiento': '#6fd3d9', 'Campo de pruebas': '#e0b04a', 'Tutorial': '#ffd23a', 'VR': '#ff7ac8', 'Menú y configuración': '#a9a9d9', 'Armas': '#c98b5a',
    'Sonido y música': '#4dc3b0', 'Gráficos': '#f08aa5', 'Zombies': '#8fcf4a', 'Controles y celular': '#7a8cff', 'Otra cosa': '#9a9a9a' },
  // Un color para cada persona que abre pedidos: su etiqueta «Abierto por…» (fondo lleno, para no confundirla con las de sección) y sus notas
  personas: { 'tio-lea': '#4fd1e8', 'francisco': '#b6e35a', 'claude': '#d97757' },
  estados: ['abierto', 'en curso', 'listo', 'esperando', 'cerrado'],   // «esperando» = hecho, falta que quien lo pidió confirme; «cerrado» = confirmado; los otros son «abiertos»
  publicados: 'pedidos.json',   // copia de los pedidos que se publica con el juego (sin servidor, sólo se leen)
  clave: 'zonaMuerta.pedidos',
  yo: 'zonaMuerta.pedidosYo',   // quién eligió ser la última vez en este dispositivo
  claves: 'zonaMuerta.pedidosClaves',   // número → clave con la que su creador lo puede borrar del servidor
};

Object.assign(TEXTOS.es, {
  'pedidos.titulo': 'PEDIDOS', 'pedidos.ayuda': 'Pide mejoras o avisa de errores del juego. Cada pedido es un ticket: tiene su número, su estado y su prioridad.',
  'pedidos.abiertos': 'ABIERTOS', 'pedidos.cerrados': 'CERRADOS', 'pedidos.todos': 'TODOS', 'pedidos.todasSecciones': 'Todas las secciones',
  'pedidos.nuevo': 'NUEVO PEDIDO', 'pedidos.actualizar': 'ACTUALIZAR', 'pedidos.cargando': 'Cargando los pedidos…', 'pedidos.vacio': 'No hay pedidos con ese filtro.',
  'pedidos.error': 'No se pudieron cargar los pedidos. Prueba de nuevo.', 'pedidos.local': 'Los pedidos que crees aquí se guardan en este dispositivo.',
  'pedidos.e.abierto': 'Abierto', 'pedidos.e.en curso': 'En curso', 'pedidos.e.listo': 'Listo', 'pedidos.e.esperando': 'Esperando confirmación', 'pedidos.e.cerrado': 'Cerrado',
  'pedidos.p.alta': 'Prioridad alta', 'pedidos.p.media': 'Prioridad media', 'pedidos.p.baja': 'Prioridad baja', 'pedidos.sinTexto': '(sin descripción)',
  'pedidos.formTitulo': 'NUEVO PEDIDO', 'pedidos.seccion': 'Sección del juego', 'pedidos.prioridad': '¿Qué tan importante es?',
  'pedidos.prioAlta': 'Alta: el juego falla o no se puede jugar bien', 'pedidos.prioMedia': 'Media: lo quiero pronto', 'pedidos.prioBaja': 'Baja: sería lindo tenerlo algún día',
  'pedidos.titulo.campo': 'Título corto', 'pedidos.titulo.ejemplo': 'Ej.: Que el comerciante venda granadas', 'pedidos.texto': 'Qué quieres que cambie o qué falla',
  'pedidos.crear': 'CREAR', 'pedidos.cancelar': 'CANCELAR', 'pedidos.faltaTitulo': 'Escribe un título corto.', 'pedidos.creado': v => `¡Listo! Tu pedido es el #${v.n}.`,
  'pedidos.errorCrear': 'No se pudo crear el pedido. Prueba de nuevo.', 'pedidos.tope': 'Hiciste muchos pedidos hoy. Vuelve mañana.',
  'pedidos.cambiarEstado': 'Estado', 'pedidos.errorEstado': 'No se pudo cambiar el estado.',
  'pedidos.quien': '¿Quién eres?', 'pedidos.elige': 'Elige…', 'pedidos.faltaQuien': 'Elige quién eres.', 'pedidos.abiertoPor': v => `Abierto por ${v.quien}`, 'pedidos.e.esperandoDe': v => `Esperando confirmación de ${v.quien}`,
  'pedidos.c.tio-lea': 'Tío Lea', 'pedidos.c.francisco': 'Francisco', 'pedidos.c.claude': 'Claude',
  'pedidos.borrar': 'BORRAR', 'pedidos.seguro': '¿SEGURO? TOCA OTRA VEZ', 'pedidos.borrado': v => `Pedido #${v.n} borrado.`, 'pedidos.errorBorrar': 'No se pudo borrar el pedido.',
  'pedidos.yo': 'Tú', 'pedidos.quienPidio': 'Quien lo pidió', 'pedidos.desarrollo': 'Desarrollo',
  'pedidos.n.confirmo': 'confirmó que quedó bien', 'pedidos.n.rechazo': 'dijo que todavía no', 'pedidos.n.reabrio': 'reabrió el pedido', 'pedidos.n.nota': 'escribió',
  'pedidos.quedoBien': '¿Quedó como lo pediste?', 'pedidos.si': 'SÍ, QUEDÓ BIEN', 'pedidos.no': 'NO, TODAVÍA NO', 'pedidos.reabrir': 'REABRIR', 'pedidos.aclarar': 'AGREGAR UNA ACLARACIÓN', 'pedidos.responder': 'RESPONDER',
  'pedidos.enviar': 'ENVIAR', 'pedidos.cancelarNota': 'CANCELAR', 'pedidos.queFalta': '¿Qué falta o qué falla?', 'pedidos.quePaso': '¿Qué pasó? Cuéntanos', 'pedidos.escribe': 'Escribe aquí', 'pedidos.tuTurno': '¿Quedó bien?',
  'pedidos.faltaTexto': 'Cuéntanos con unas palabras.', 'pedidos.errorResponder': 'No se pudo enviar. Prueba de nuevo.', 'pedidos.gracias': 'Anotado, gracias.',
});
Object.assign(TEXTOS.pt, {
  'pedidos.titulo': 'PEDIDOS', 'pedidos.ayuda': 'Peça melhorias ou avise de erros do jogo. Cada pedido é um ticket: tem seu número, seu estado e sua prioridade.',
  'pedidos.abiertos': 'ABERTOS', 'pedidos.cerrados': 'FECHADOS', 'pedidos.todos': 'TODOS', 'pedidos.todasSecciones': 'Todas as seções',
  'pedidos.nuevo': 'NOVO PEDIDO', 'pedidos.actualizar': 'ATUALIZAR', 'pedidos.cargando': 'Carregando os pedidos…', 'pedidos.vacio': 'Não há pedidos com esse filtro.',
  'pedidos.error': 'Não foi possível carregar os pedidos. Tente de novo.', 'pedidos.local': 'Os pedidos que você criar aqui ficam salvos neste dispositivo.',
  'pedidos.e.abierto': 'Aberto', 'pedidos.e.en curso': 'Em andamento', 'pedidos.e.listo': 'Pronto', 'pedidos.e.esperando': 'Aguardando confirmação', 'pedidos.e.cerrado': 'Fechado',
  'pedidos.p.alta': 'Prioridade alta', 'pedidos.p.media': 'Prioridade média', 'pedidos.p.baja': 'Prioridade baixa', 'pedidos.sinTexto': '(sem descrição)',
  'pedidos.formTitulo': 'NOVO PEDIDO', 'pedidos.seccion': 'Seção do jogo', 'pedidos.prioridad': 'Qual a importância?',
  'pedidos.prioAlta': 'Alta: o jogo falha ou não dá para jogar bem', 'pedidos.prioMedia': 'Média: quero logo', 'pedidos.prioBaja': 'Baixa: seria legal ter algum dia',
  'pedidos.titulo.campo': 'Título curto', 'pedidos.titulo.ejemplo': 'Ex.: Que o comerciante venda granadas', 'pedidos.texto': 'O que você quer que mude ou o que falha',
  'pedidos.crear': 'CRIAR', 'pedidos.cancelar': 'CANCELAR', 'pedidos.faltaTitulo': 'Escreva um título curto.', 'pedidos.creado': v => `Pronto! Seu pedido é o #${v.n}.`,
  'pedidos.errorCrear': 'Não foi possível criar o pedido. Tente de novo.', 'pedidos.tope': 'Você fez muitos pedidos hoje. Volte amanhã.',
  'pedidos.cambiarEstado': 'Estado', 'pedidos.errorEstado': 'Não foi possível mudar o estado.',
  'pedidos.quien': 'Quem é você?', 'pedidos.elige': 'Escolha…', 'pedidos.faltaQuien': 'Escolha quem você é.', 'pedidos.abiertoPor': v => `Aberto por ${v.quien}`, 'pedidos.e.esperandoDe': v => `Aguardando confirmação de ${v.quien}`,
  'pedidos.c.tio-lea': 'Tio Lea', 'pedidos.c.francisco': 'Francisco', 'pedidos.c.claude': 'Claude',
  'pedidos.borrar': 'APAGAR', 'pedidos.seguro': 'TEM CERTEZA? TOQUE DE NOVO', 'pedidos.borrado': v => `Pedido #${v.n} apagado.`, 'pedidos.errorBorrar': 'Não foi possível apagar o pedido.',
  'pedidos.yo': 'Você', 'pedidos.quienPidio': 'Quem pediu', 'pedidos.desarrollo': 'Desenvolvimento',
  'pedidos.n.confirmo': 'confirmou que ficou bom', 'pedidos.n.rechazo': 'disse que ainda não', 'pedidos.n.reabrio': 'reabriu o pedido', 'pedidos.n.nota': 'escreveu',
  'pedidos.quedoBien': 'Ficou como você pediu?', 'pedidos.si': 'SIM, FICOU BOM', 'pedidos.no': 'NÃO, AINDA NÃO', 'pedidos.reabrir': 'REABRIR', 'pedidos.aclarar': 'ADICIONAR UM ESCLARECIMENTO', 'pedidos.responder': 'RESPONDER',
  'pedidos.enviar': 'ENVIAR', 'pedidos.cancelarNota': 'CANCELAR', 'pedidos.queFalta': 'O que falta ou o que falha?', 'pedidos.quePaso': 'O que aconteceu? Conte', 'pedidos.escribe': 'Escreva aqui', 'pedidos.tuTurno': 'Ficou bom?',
  'pedidos.faltaTexto': 'Conte com poucas palavras.', 'pedidos.errorResponder': 'Não foi possível enviar. Tente de novo.', 'pedidos.gracias': 'Anotado, obrigado.',
});
Object.assign(TEXTOS.en, {
  'pedidos.titulo': 'REQUESTS', 'pedidos.ayuda': 'Ask for improvements or report bugs. Each request is a ticket: it has its number, status and priority.',
  'pedidos.abiertos': 'OPEN', 'pedidos.cerrados': 'CLOSED', 'pedidos.todos': 'ALL', 'pedidos.todasSecciones': 'All sections',
  'pedidos.nuevo': 'NEW REQUEST', 'pedidos.actualizar': 'REFRESH', 'pedidos.cargando': 'Loading requests…', 'pedidos.vacio': 'No requests match that filter.',
  'pedidos.error': 'Could not load the requests. Try again.', 'pedidos.local': 'Requests you create here are saved on this device.',
  'pedidos.e.abierto': 'Open', 'pedidos.e.en curso': 'In progress', 'pedidos.e.listo': 'Done', 'pedidos.e.esperando': 'Awaiting confirmation', 'pedidos.e.cerrado': 'Closed',
  'pedidos.p.alta': 'High priority', 'pedidos.p.media': 'Medium priority', 'pedidos.p.baja': 'Low priority', 'pedidos.sinTexto': '(no description)',
  'pedidos.formTitulo': 'NEW REQUEST', 'pedidos.seccion': 'Game section', 'pedidos.prioridad': 'How important is it?',
  'pedidos.prioAlta': 'High: the game breaks or can\'t be played well', 'pedidos.prioMedia': 'Medium: I want it soon', 'pedidos.prioBaja': 'Low: it would be nice someday',
  'pedidos.titulo.campo': 'Short title', 'pedidos.titulo.ejemplo': 'E.g.: Let the merchant sell grenades', 'pedidos.texto': 'What do you want changed, or what is broken',
  'pedidos.crear': 'CREATE', 'pedidos.cancelar': 'CANCEL', 'pedidos.faltaTitulo': 'Write a short title.', 'pedidos.creado': v => `Done! Your request is #${v.n}.`,
  'pedidos.errorCrear': 'Could not create the request. Try again.', 'pedidos.tope': 'You made a lot of requests today. Come back tomorrow.',
  'pedidos.cambiarEstado': 'Status', 'pedidos.errorEstado': 'Could not change the status.',
  'pedidos.quien': 'Who are you?', 'pedidos.elige': 'Choose…', 'pedidos.faltaQuien': 'Choose who you are.', 'pedidos.abiertoPor': v => `Opened by ${v.quien}`, 'pedidos.e.esperandoDe': v => `Awaiting confirmation from ${v.quien}`,
  'pedidos.c.tio-lea': 'Uncle Lea', 'pedidos.c.francisco': 'Francisco', 'pedidos.c.claude': 'Claude',
  'pedidos.borrar': 'DELETE', 'pedidos.seguro': 'SURE? TAP AGAIN', 'pedidos.borrado': v => `Request #${v.n} deleted.`, 'pedidos.errorBorrar': 'Could not delete the request.',
  'pedidos.yo': 'You', 'pedidos.quienPidio': 'Requester', 'pedidos.desarrollo': 'Development',
  'pedidos.n.confirmo': 'confirmed it\'s good', 'pedidos.n.rechazo': 'said not yet', 'pedidos.n.reabrio': 'reopened the request', 'pedidos.n.nota': 'wrote',
  'pedidos.quedoBien': 'Is it the way you asked?', 'pedidos.si': 'YES, IT\'S GOOD', 'pedidos.no': 'NO, NOT YET', 'pedidos.reabrir': 'REOPEN', 'pedidos.aclarar': 'ADD A NOTE', 'pedidos.responder': 'REPLY',
  'pedidos.enviar': 'SEND', 'pedidos.cancelarNota': 'CANCEL', 'pedidos.queFalta': 'What is missing or broken?', 'pedidos.quePaso': 'What happened? Tell us', 'pedidos.escribe': 'Write here', 'pedidos.tuTurno': 'Is it good?',
  'pedidos.faltaTexto': 'Tell us in a few words.', 'pedidos.errorResponder': 'Could not send. Try again.', 'pedidos.gracias': 'Noted, thanks.',
});

const PedidosUI = (() => {
  let lista = null, cargando = false, estado = 'abiertos', seccion = '', dueno = false;
  const abiertos = new Set();   // pedidos con el detalle desplegado: al repintar, siguen desplegados
  const $ = id => document.getElementById(id);
  const conServidor = () => !!window.SERVIDOR_JUEGO;
  const hijo = (padre, tag, clase, s) => { const e = document.createElement(tag); if (clase) e.className = clase; if (s !== undefined) e.textContent = s; padre.appendChild(e); return e; };

  // La base local de este navegador (sin servidor): la misma forma que la del servidor
  const leerLocal = () => { try { const d = JSON.parse(localStorage.getItem(PEDIDOS.clave) || '{}'); return { siguiente: d.siguiente || 1, pedidos: Array.isArray(d.pedidos) ? d.pedidos : [] }; } catch { return { siguiente: 1, pedidos: [] }; } };
  const guardarLocal = d => { try { localStorage.setItem(PEDIDOS.clave, JSON.stringify(d)); return true; } catch { return false; } };

  // Las claves de borrado de los pedidos que se crearon desde este navegador (sólo con servidor)
  const leerClaves = () => { try { return JSON.parse(localStorage.getItem(PEDIDOS.claves) || '{}'); } catch { return {}; } };
  const guardarClave = (numero, clave) => { try { const c = leerClaves(); c[numero] = clave; localStorage.setItem(PEDIDOS.claves, JSON.stringify(c)); } catch { /* sin almacenamiento */ } };
  const esLocal = p => typeof p.numero === 'string';   // creado en este navegador sin servidor («L1»…); los publicados son de sólo lectura
  const puedeBorrar = p => conServidor() ? (dueno || !!leerClaves()[p.numero]) : esLocal(p);
  async function traer() {
    if (conServidor()) { const r = await fetch('/api/pedidos', { cache: 'no-store' }); if (!r.ok) throw new Error('http ' + r.status); const d = await r.json(); dueno = !!d.dueno; return d.pedidos; }
    // Sin servidor: los publicados con el juego (pedidos.json, si se pudo leer) y los creados en este navegador
    dueno = false; let publicados = [];
    try { const r = await fetch(PEDIDOS.publicados, { cache: 'no-store' }); if (r.ok) publicados = (await r.json()).pedidos || []; } catch { /* sin copia publicada: sólo los locales */ }
    const locales = leerLocal().pedidos;
    return locales.concat(publicados).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }
  async function cambiarEstado(p, estadoNuevo) {
    try {
      if (conServidor()) { const r = await fetch('/api/pedidos/' + p.numero, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: estadoNuevo }) }); if (!r.ok) throw new Error('http ' + r.status); }
      else if (esLocal(p)) { const d = leerLocal(), x = d.pedidos.find(y => y.numero === p.numero); if (x) { x.estado = estadoNuevo; guardarLocal(d); } }
      p.estado = estadoNuevo; $('pedidos-estado').textContent = ''; abiertos.add(p.numero); pintar();
    } catch { $('pedidos-estado').textContent = t('pedidos.errorEstado'); $('pedidos-estado').classList.remove('bien'); }
  }
  async function borrar(p) {
    try {
      if (conServidor()) {
        const r = await fetch('/api/pedidos/' + p.numero, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clave: leerClaves()[p.numero] || '' }) });
        if (!r.ok) throw new Error('http ' + r.status);
        const c = leerClaves(); delete c[p.numero]; try { localStorage.setItem(PEDIDOS.claves, JSON.stringify(c)); } catch { /* ídem */ }
      } else { const d = leerLocal(); d.pedidos = d.pedidos.filter(x => x.numero !== p.numero); guardarLocal(d); }
      await cargar(); $('pedidos-estado').textContent = t('pedidos.borrado', { n: p.numero }); $('pedidos-estado').classList.add('bien');
    } catch { $('pedidos-estado').textContent = t('pedidos.errorBorrar'); $('pedidos-estado').classList.remove('bien'); }
  }
  // silencioso: el refresco automático (no borra la lista ni muestra «Cargando»; si falla, deja lo que había)
  async function cargar(silencioso = false) {
    if (cargando) return;
    cargando = true;
    if (!silencioso) { $('pedidos-estado').textContent = t('pedidos.cargando'); $('pedidos-lista').replaceChildren(); }
    try { lista = await traer(); if (!silencioso) $('pedidos-estado').textContent = ''; }
    catch { if (!silencioso) { lista = null; $('pedidos-estado').textContent = t('pedidos.error'); } }
    cargando = false; if (!silencioso || lista) pintar();
  }

  const esAbierto = p => p.estado !== 'cerrado';
  // La confirmación la da quien abrió el pedido: si lo abrió Claude (el desarrollo), espera la confirmación de Claude
  const CREADORES = ['tio-lea', 'francisco', 'claude'];   // quienes abren pedidos (el servidor deja elegir sólo a los dos primeros desde la pantalla)
  const nombreDe = c => CREADORES.includes(c) ? t('pedidos.c.' + c) : '';
  const textoEstado = p => p.estado === 'esperando' && nombreDe(p.creador) ? t('pedidos.e.esperandoDe', { quien: nombreDe(p.creador) }) : t('pedidos.e.' + p.estado);
  function pintar() {
    const cont = $('pedidos-lista'); cont.replaceChildren();
    $('pedidos-local').hidden = conServidor();
    if (!lista) return;
    const visibles = lista.filter(p => (estado === 'todos' || (estado === 'abiertos') === esAbierto(p)) && (!seccion || p.seccion === seccion));
    $('pedidos-estado').textContent = visibles.length ? '' : t('pedidos.vacio');
    for (const p of visibles) {
      const color = PEDIDOS.colores[p.seccion] || '#9a9a9a';
      const caja = hijo(cont, 'div', 'pedido' + (esAbierto(p) ? '' : ' cerrado')); caja.style.borderLeft = `4px solid ${color}`;
      const cab = hijo(caja, 'button', 'pedido-cab'); cab.type = 'button'; cab.setAttribute('aria-expanded', 'false');
      // Todo el encabezado del pedido (título, estado, etiquetas y fecha) es un solo botón: se toca en cualquier parte
      const fila1 = hijo(cab, 'span', 'pedido-fila');
      hijo(fila1, 'span', 'pedido-num', '#' + p.numero);
      hijo(fila1, 'span', 'pedido-tit', p.titulo);
      hijo(fila1, 'span', 'pedido-estado e-' + String(p.estado).replace(' ', '-'), textoEstado(p));
      const etiquetas = hijo(cab, 'span', 'pedido-etiquetas');
      const sec = hijo(etiquetas, 'span', 'pedido-etiqueta seccion', p.seccion); sec.style.color = color; sec.style.borderColor = color; sec.style.background = color + '22';
      hijo(etiquetas, 'span', 'pedido-etiqueta prio-' + p.prioridad, t('pedidos.p.' + p.prioridad));
      if (nombreDe(p.creador)) { const q = hijo(etiquetas, 'span', 'pedido-etiqueta quien', t('pedidos.abiertoPor', { quien: nombreDe(p.creador) })); q.style.background = PEDIDOS.personas[p.creador]; q.style.borderColor = PEDIDOS.personas[p.creador]; }
      hijo(etiquetas, 'span', 'pedido-fecha', new Date(p.fecha).toLocaleDateString(Idioma.actual()));
      const det = hijo(caja, 'div', 'pedido-detalle'); det.hidden = !abiertos.has(p.numero); cab.setAttribute('aria-expanded', String(!det.hidden));
      hijo(det, 'p', 'pedido-cuerpo', (p.texto || '').trim() || t('pedidos.sinTexto'));
      armarConversacion(det, p, cab, etiquetas);
      cab.addEventListener('click', () => { det.hidden = !det.hidden; if (det.hidden) abiertos.delete(p.numero); else abiertos.add(p.numero); cab.setAttribute('aria-expanded', String(!det.hidden)); });
    }
  }

  /* ---------- Conversación: lo que cada uno puede hacer con un pedido, según su estado ----------
   * Quien lo pidió (con servidor, la clave que guarda su navegador; sin servidor, los «L1»):
   *   abierto o en curso → agregar una aclaración;  listo o esperando → «sí, quedó bien» (→ cerrado) o «no, todavía no»
   *   con el motivo (→ abierto);  cerrado → reabrir con el motivo (→ abierto);  siempre → borrarlo.
   * El dueño (desde la Mac del servidor): cambia el estado, responde y borra cualquiera. Los demás pedidos, sólo se leen.
   * Cada respuesta queda como una nota del pedido (quién, qué y cuándo). */
  const esMio = p => conServidor() ? !!leerClaves()[p.numero] : esLocal(p);
  async function responder(p, accion, texto) {
    if (conServidor()) {
      const r = await fetch(`/api/pedidos/${p.numero}/accion`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion, texto, clave: leerClaves()[p.numero] || '' }) });
      if (!r.ok) throw new Error('http ' + r.status);
      Object.assign(p, (await r.json()).pedido);
    } else {   // sin servidor, las mismas reglas sobre el pedido guardado en este navegador
      const d = leerLocal(), x = d.pedidos.find(y => y.numero === p.numero); if (!x) throw new Error('no existe');
      const tipo = accion === 'confirmar' ? 'confirmo' : accion === 'rechazar' ? (x.estado === 'cerrado' ? 'reabrio' : 'rechazo') : 'nota';
      if (accion === 'confirmar') x.estado = 'cerrado'; else if (accion === 'rechazar') x.estado = 'abierto';
      (x.notas ||= []).push({ de: 'pedido', tipo, texto, fecha: new Date().toISOString() }); guardarLocal(d); Object.assign(p, x);
    }
  }
  // Después de responder, el pedido no tiene que esfumarse: si ya no encaja en el filtro (por ejemplo, se cerró estando en ABIERTOS), la lista pasa a TODOS
  function mantenerVisible(p) {
    if (estado === 'todos' || (estado === 'abiertos') === esAbierto(p)) return;
    estado = 'todos'; document.querySelectorAll('#pedidos-estados button').forEach(x => x.classList.toggle('elegida', x.dataset.estado === 'todos'));
  }
  const gracias = () => { $('pedidos-estado').textContent = t('pedidos.gracias'); $('pedidos-estado').classList.add('bien'); };
  function armarConversacion(det, p, cab, etiquetas) {
    const mio = esMio(p), jefe = conServidor() && dueno;
    // Las notas: una conversación debajo del texto
    if ((p.notas || []).length) {
      const lista = hijo(det, 'div', 'pedido-notas');
      for (const n of p.notas) {
        const nota = hijo(lista, 'div', 'pedido-nota ' + (n.de === 'desarrollo' ? 'desarrollo' : 'pedido'));
        const quien = n.de === 'desarrollo' ? t('pedidos.desarrollo') : (mio && !jefe ? t('pedidos.yo') : (nombreDe(p.creador) || t('pedidos.quienPidio')));
        const autor = hijo(nota, 'b', '', `${quien} · ${t('pedidos.n.' + n.tipo)} · ${new Date(n.fecha).toLocaleDateString(Idioma.actual())}`);
        if (n.de !== 'desarrollo' && PEDIDOS.personas[p.creador]) { nota.style.borderLeftColor = PEDIDOS.personas[p.creador]; autor.style.color = PEDIDOS.personas[p.creador]; }   // la nota de quien abrió el pedido, con su color
        if (n.texto) hijo(nota, 'span', '', n.texto);
      }
    }
    const esperaRespuesta = mio && !jefe && (p.estado === 'listo' || p.estado === 'esperando');
    if (esperaRespuesta) {   // se nota en la lista que le toca a quien lo pidió
      const chip = document.createElement('span'); chip.className = 'pedido-etiqueta tu-turno'; chip.textContent = '● ' + t('pedidos.tuTurno');
      etiquetas.insertBefore(chip, etiquetas.querySelector('.pedido-fecha'));
    }
    const barra = hijo(det, 'div', 'pedido-acciones');
    const izq = hijo(barra, 'div', 'pedido-acciones-izq');
    // El cuadro para escribir (motivo o aclaración): se abre con el botón que corresponde
    const redactar = hijo(det, 'div', 'pedido-redactar'); redactar.hidden = true;
    const campo = hijo(redactar, 'textarea'); campo.rows = 3; campo.maxLength = 500;
    const aviso = hijo(redactar, 'p', 'pedidos-aviso');
    const fila = hijo(redactar, 'div', 'pedido-redactar-botones');
    const enviar = hijo(fila, 'button', 'boton mini boton-usar', t('pedidos.enviar')); enviar.type = 'button';
    const cancelar = hijo(fila, 'button', 'boton mini', t('pedidos.cancelarNota')); cancelar.type = 'button';
    let accionPendiente = null;
    const abrirRedactar = (accion, rotulo, obligatorio) => { accionPendiente = { accion, obligatorio }; campo.placeholder = rotulo; campo.value = ''; aviso.textContent = ''; redactar.hidden = false; campo.focus(); };
    cancelar.addEventListener('click', () => { redactar.hidden = true; accionPendiente = null; });
    enviar.addEventListener('click', async () => {
      if (!accionPendiente) return;
      const texto = campo.value.trim();
      if (accionPendiente.obligatorio && !texto) { aviso.textContent = t('pedidos.faltaTexto'); return; }
      enviar.disabled = true;
      try { await responder(p, accionPendiente.accion, texto); abiertos.add(p.numero); mantenerVisible(p); pintar(); gracias(); }
      catch { aviso.textContent = t('pedidos.errorResponder'); enviar.disabled = false; }
    });
    const boton = (clase, rotulo, alTocar) => { const b = hijo(izq, 'button', 'boton mini ' + clase, rotulo); b.type = 'button'; b.addEventListener('click', alTocar); return b; };
    const sin = async (accion, texto) => { try { await responder(p, accion, texto); abiertos.add(p.numero); mantenerVisible(p); pintar(); gracias(); } catch { aviso.textContent = t('pedidos.errorResponder'); redactar.hidden = false; } };
    if (jefe || (!conServidor() && esLocal(p))) {   // el dueño (y, sin servidor, quien lo creó en este navegador): cambia el estado
      const f = hijo(izq, 'label', 'pedido-estado-fila'); hijo(f, 'span', '', t('pedidos.cambiarEstado'));
      const sel = hijo(f, 'select'); for (const e of PEDIDOS.estados) sel.add(new Option(e === 'esperando' ? textoEstado({ estado: 'esperando', creador: p.creador }) : t('pedidos.e.' + e), e)); sel.value = p.estado;
      sel.addEventListener('change', () => cambiarEstado(p, sel.value));
    }
    if (jefe) boton('', t('pedidos.responder'), () => abrirRedactar('nota', t('pedidos.escribe'), true));
    else if (mio) {
      if (esperaRespuesta) {
        hijo(izq, 'span', 'pedido-pregunta', t('pedidos.quedoBien'));
        boton('bien', t('pedidos.si'), () => sin('confirmar', ''));
        boton('mal', t('pedidos.no'), () => abrirRedactar('rechazar', t('pedidos.queFalta'), true));
      } else if (p.estado === 'cerrado') boton('', t('pedidos.reabrir'), () => abrirRedactar('rechazar', t('pedidos.quePaso'), true));
      else boton('', t('pedidos.aclarar'), () => abrirRedactar('nota', t('pedidos.escribe'), true));
    }
    if (puedeBorrar(p)) {   // BORRAR: dos toques seguidos (el primero pide confirmar)
      const b = hijo(barra, 'button', 'boton mini peligro pedido-borrar', t('pedidos.borrar')); b.type = 'button';
      b.addEventListener('click', () => {
        if (b.dataset.seguro === '1') { b.disabled = true; borrar(p); return; }
        b.dataset.seguro = '1'; b.textContent = t('pedidos.seguro');
        setTimeout(() => { if (b.isConnected && !b.disabled) { b.dataset.seguro = ''; b.textContent = t('pedidos.borrar'); } }, 3000);
      });
    }
    if (!izq.childElementCount && !barra.querySelector('.pedido-borrar')) { barra.remove(); redactar.remove(); }   // un pedido ajeno: sólo se lee
  }

  function armarFormulario() {
    const sel = $('pedidos-f-seccion'), prio = $('pedidos-f-prioridad'), quien = $('pedidos-f-quien');
    if (!sel.options.length) for (const s of PEDIDOS.secciones) sel.add(new Option(s, s));
    quien.replaceChildren(new Option(t('pedidos.elige'), '')); for (const c of ['tio-lea', 'francisco']) quien.add(new Option(t('pedidos.c.' + c), c));
    try { quien.value = localStorage.getItem(PEDIDOS.yo) || ''; } catch { /* sin almacenamiento */ }   // la última persona que eligió en este dispositivo
    prio.replaceChildren(); [['alta', 'pedidos.prioAlta'], ['media', 'pedidos.prioMedia'], ['baja', 'pedidos.prioBaja']].forEach(([v, k]) => { const o = new Option(t(k), v); o.selected = v === 'media'; prio.add(o); });
    $('pedidos-f-titulo').placeholder = t('pedidos.titulo.ejemplo');
    $('pedidos-f-titulo').value = $('pedidos-f-texto').value = $('pedidos-f-aviso').textContent = '';
  }
  async function crear() {
    const titulo = $('pedidos-f-titulo').value.trim(), aviso = $('pedidos-f-aviso');
    if (!$('pedidos-f-quien').value) { aviso.textContent = t('pedidos.faltaQuien'); return; }
    if (!titulo) { aviso.textContent = t('pedidos.faltaTitulo'); return; }
    try { localStorage.setItem(PEDIDOS.yo, $('pedidos-f-quien').value); } catch { /* ídem */ }
    const pedido = { creador: $('pedidos-f-quien').value, titulo: titulo.slice(0, 100), texto: $('pedidos-f-texto').value.trim().slice(0, 2000), seccion: $('pedidos-f-seccion').value, prioridad: $('pedidos-f-prioridad').value };
    const boton = $('pedidos-crear'); boton.disabled = true;
    try {
      let numero;
      if (conServidor()) {
        const r = await fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pedido) });
        if (r.status === 429) { aviso.textContent = t('pedidos.tope'); return; }
        if (!r.ok) throw new Error('http ' + r.status);
        const creado = (await r.json()).pedido; numero = creado.numero; if (creado.clave) guardarClave(numero, creado.clave);
      } else {
        const d = leerLocal(); numero = 'L' + d.siguiente++;
        d.pedidos.push({ numero, ...pedido, estado: 'abierto', fecha: new Date().toISOString() });
        if (!guardarLocal(d)) throw new Error('sin almacenamiento');
      }
      estado = 'abiertos'; seccion = ''; $('pedidos-seccion').value = '';
      document.querySelectorAll('#pedidos-estados button').forEach(x => x.classList.toggle('elegida', x.dataset.estado === 'abiertos'));
      verFormulario(false); await cargar();
      $('pedidos-estado').textContent = t('pedidos.creado', { n: numero }); $('pedidos-estado').classList.add('bien');
    } catch { aviso.textContent = t('pedidos.errorCrear'); }
    finally { boton.disabled = false; }
  }
  function verFormulario(si) { $('pedidos-form').hidden = !si; $('pedidos-vista').hidden = si; $('pedidos-nuevo').hidden = si; if (si) { armarFormulario(); $('pedidos-f-titulo').focus(); } }

  function iniciar() {
    const sec = $('pedidos-seccion'); sec.add(new Option(t('pedidos.todasSecciones'), '')); for (const s of PEDIDOS.secciones) sec.add(new Option(s, s));
    sec.addEventListener('change', () => { seccion = sec.value; pintar(); });
    document.querySelectorAll('#pedidos-estados button').forEach(b => b.addEventListener('click', () => {
      estado = b.dataset.estado; document.querySelectorAll('#pedidos-estados button').forEach(x => x.classList.toggle('elegida', x === b)); pintar();
    }));
    $('pedidos-nuevo').addEventListener('click', () => verFormulario(true));
    $('pedidos-cancelar').addEventListener('click', () => verFormulario(false));
    $('pedidos-crear').addEventListener('click', crear);
    // La lista se renueva sola cada 20 s mientras se ve (con servidor: pueden llegar pedidos o cambiar estados)
    setInterval(() => { if (conServidor() && $('panel-pedidos').classList.contains('visible') && $('pedidos-form').hidden && !document.hidden) cargar(true); }, 20000);
    Idioma.alCambiar(() => { sec.options[0].textContent = t('pedidos.todasSecciones'); if (lista) pintar(); });
  }
  if (document.getElementById('panel-pedidos')) iniciar();
  return { abrir() { verFormulario(false); $('pedidos-estado').classList.remove('bien'); cargar(); }, datos: () => lista };
})();
