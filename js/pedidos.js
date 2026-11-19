/* ===== Pedidos: un gestor de tickets sencillo dentro del juego (pedido de Leandro, para enseñarle a Enzo) =====
 * Lista los tickets (issues) del repositorio público zenebord/zona-muerta-pedidos, que se leen sin iniciar sesión (API de
 * GitHub, sin clave), con su número, estado, etiquetas y texto; se filtran por estado y por sección del juego. El
 * botón NUEVO PEDIDO arma el ticket con un formulario (sección, prioridad, título y qué se pide) y abre GitHub con todo
 * ya escrito: ahí, con la cuenta de GitHub, se toca «Submit new issue». Crear un ticket necesita esa cuenta (no hay forma
 * de hacerlo sin una clave o un servidor que la guarde); verlos, no. El juego no guarda ninguna clave.
 * Todo lo que llega de GitHub se muestra como texto (textContent), nunca como HTML.
 */
const PEDIDOS = {
  repo: 'zenebord/zona-muerta-pedidos',
  secciones: ['Pelea infinita', 'Camino a casa', 'Misiones', 'Defensa zombie', 'Defensa zombie ultra', 'Último bastión', 'Entrenamiento', 'Campo de pruebas', 'Tutorial', 'VR', 'Menú y configuración', 'Armas', 'Sonido y música', 'Gráficos', 'Zombies', 'Controles y celular'],
  prioridades: ['alta', 'media', 'baja'],
  vigenciaMs: 60000,   // cuánto se reutiliza la lista antes de volver a pedirla
};

Object.assign(TEXTOS.es, {
  'pedidos.titulo': 'PEDIDOS', 'pedidos.ayuda': 'Los pedidos de mejoras y errores del juego, como tickets: cada uno tiene su número, su estado y sus etiquetas.',
  'pedidos.abiertos': 'ABIERTOS', 'pedidos.cerrados': 'CERRADOS', 'pedidos.todos': 'TODOS', 'pedidos.todasSecciones': 'Todas las secciones',
  'pedidos.nuevo': 'NUEVO PEDIDO', 'pedidos.actualizar': 'ACTUALIZAR', 'pedidos.cargando': 'Cargando los pedidos…', 'pedidos.vacio': 'No hay pedidos con ese filtro.',
  'pedidos.error': 'No se pudieron cargar los pedidos (¿sin internet?). Prueba de nuevo.', 'pedidos.limite': 'GitHub pidió esperar un rato. Prueba en unos minutos.',
  'pedidos.abierto': 'Abierto', 'pedidos.cerrado': 'Cerrado', 'pedidos.comentarios': v => `${v.n} comentario${v.n === 1 ? '' : 's'}`, 'pedidos.verEnGithub': 'Ver y comentar en GitHub',
  'pedidos.sinTexto': '(sin descripción)', 'pedidos.formTitulo': 'NUEVO PEDIDO', 'pedidos.seccion': 'Sección del juego', 'pedidos.prioridad': '¿Qué tan importante es?',
  'pedidos.prioAlta': 'Alta: el juego falla o no se puede jugar bien', 'pedidos.prioMedia': 'Media: lo quiero pronto', 'pedidos.prioBaja': 'Baja: sería lindo tenerlo algún día',
  'pedidos.titulo.campo': 'Título corto', 'pedidos.titulo.ejemplo': 'Ej.: Que el comerciante venda granadas', 'pedidos.texto': 'Qué quieres que cambie o qué falla',
  'pedidos.crear': 'CREAR EN GITHUB', 'pedidos.cancelar': 'CANCELAR', 'pedidos.faltaTitulo': 'Escribe un título corto.',
  'pedidos.nota': 'Se abre GitHub con el pedido ya escrito: ahí toca «Submit new issue». Necesitas una cuenta gratis (la guía te explica cómo).', 'pedidos.guia': 'Guía rápida',
  'pedidos.cuerpo': v => `**Sección:** ${v.seccion}\n**Prioridad:** ${v.prioridad}\n\n${v.texto}\n\n_Creado desde el juego (versión ${v.version})_`,
});
Object.assign(TEXTOS.pt, {
  'pedidos.titulo': 'PEDIDOS', 'pedidos.ayuda': 'Os pedidos de melhorias e erros do jogo, como tickets: cada um tem seu número, seu estado e suas etiquetas.',
  'pedidos.abiertos': 'ABERTOS', 'pedidos.cerrados': 'FECHADOS', 'pedidos.todos': 'TODOS', 'pedidos.todasSecciones': 'Todas as seções',
  'pedidos.nuevo': 'NOVO PEDIDO', 'pedidos.actualizar': 'ATUALIZAR', 'pedidos.cargando': 'Carregando os pedidos…', 'pedidos.vacio': 'Não há pedidos com esse filtro.',
  'pedidos.error': 'Não foi possível carregar os pedidos (sem internet?). Tente de novo.', 'pedidos.limite': 'O GitHub pediu para esperar um pouco. Tente em alguns minutos.',
  'pedidos.abierto': 'Aberto', 'pedidos.cerrado': 'Fechado', 'pedidos.comentarios': v => `${v.n} comentário${v.n === 1 ? '' : 's'}`, 'pedidos.verEnGithub': 'Ver e comentar no GitHub',
  'pedidos.sinTexto': '(sem descrição)', 'pedidos.formTitulo': 'NOVO PEDIDO', 'pedidos.seccion': 'Seção do jogo', 'pedidos.prioridad': 'Qual a importância?',
  'pedidos.prioAlta': 'Alta: o jogo falha ou não dá para jogar bem', 'pedidos.prioMedia': 'Média: quero logo', 'pedidos.prioBaja': 'Baixa: seria legal ter algum dia',
  'pedidos.titulo.campo': 'Título curto', 'pedidos.titulo.ejemplo': 'Ex.: Que o comerciante venda granadas', 'pedidos.texto': 'O que você quer que mude ou o que falha',
  'pedidos.crear': 'CRIAR NO GITHUB', 'pedidos.cancelar': 'CANCELAR', 'pedidos.faltaTitulo': 'Escreva um título curto.',
  'pedidos.nota': 'O GitHub abre com o pedido já escrito: lá toque em «Submit new issue». Você precisa de uma conta grátis (o guia explica como).', 'pedidos.guia': 'Guia rápido',
  'pedidos.cuerpo': v => `**Seção:** ${v.seccion}\n**Prioridade:** ${v.prioridad}\n\n${v.texto}\n\n_Criado pelo jogo (versão ${v.version})_`,
});
Object.assign(TEXTOS.en, {
  'pedidos.titulo': 'REQUESTS', 'pedidos.ayuda': 'Requests for improvements and bug reports, as tickets: each one has its number, status and labels.',
  'pedidos.abiertos': 'OPEN', 'pedidos.cerrados': 'CLOSED', 'pedidos.todos': 'ALL', 'pedidos.todasSecciones': 'All sections',
  'pedidos.nuevo': 'NEW REQUEST', 'pedidos.actualizar': 'REFRESH', 'pedidos.cargando': 'Loading requests…', 'pedidos.vacio': 'No requests match that filter.',
  'pedidos.error': 'Could not load the requests (offline?). Try again.', 'pedidos.limite': 'GitHub asked to wait a bit. Try again in a few minutes.',
  'pedidos.abierto': 'Open', 'pedidos.cerrado': 'Closed', 'pedidos.comentarios': v => `${v.n} comment${v.n === 1 ? '' : 's'}`, 'pedidos.verEnGithub': 'View and comment on GitHub',
  'pedidos.sinTexto': '(no description)', 'pedidos.formTitulo': 'NEW REQUEST', 'pedidos.seccion': 'Game section', 'pedidos.prioridad': 'How important is it?',
  'pedidos.prioAlta': 'High: the game breaks or can\'t be played well', 'pedidos.prioMedia': 'Medium: I want it soon', 'pedidos.prioBaja': 'Low: it would be nice someday',
  'pedidos.titulo.campo': 'Short title', 'pedidos.titulo.ejemplo': 'E.g.: Let the merchant sell grenades', 'pedidos.texto': 'What do you want changed, or what is broken',
  'pedidos.crear': 'CREATE ON GITHUB', 'pedidos.cancelar': 'CANCEL', 'pedidos.faltaTitulo': 'Write a short title.',
  'pedidos.nota': 'GitHub opens with the request already written: tap «Submit new issue» there. You need a free account (the guide explains how).', 'pedidos.guia': 'Quick guide',
  'pedidos.cuerpo': v => `**Section:** ${v.seccion}\n**Priority:** ${v.prioridad}\n\n${v.texto}\n\n_Created from the game (version ${v.version})_`,
});

const PedidosUI = (() => {
  let lista = null, cargadoEn = 0, cargando = false, estado = 'open', seccion = '';
  const $ = id => document.getElementById(id);
  const hex = c => /^[0-9a-fA-F]{6}$/.test(c) ? '#' + c : '#888888';
  const texto = (el, s) => { el.textContent = s; return el; };
  const hijo = (padre, tag, clase, s) => { const e = document.createElement(tag); if (clase) e.className = clase; if (s !== undefined) e.textContent = s; padre.appendChild(e); return e; };

  async function cargar(forzar = false) {
    if (cargando) return;
    if (lista && !forzar && Date.now() - cargadoEn < PEDIDOS.vigenciaMs) { pintar(); return; }
    cargando = true; texto($('pedidos-estado'), t('pedidos.cargando')); $('pedidos-lista').replaceChildren();
    try {
      const r = await fetch(`https://api.github.com/repos/${PEDIDOS.repo}/issues?state=all&per_page=100&sort=created&direction=desc`, { headers: { Accept: 'application/vnd.github+json' } });
      if (r.status === 403 || r.status === 429) throw new Error('limite');
      if (!r.ok) throw new Error('http ' + r.status);
      lista = (await r.json()).filter(i => !i.pull_request); cargadoEn = Date.now();
      $('pedidos-estado').textContent = '';
    } catch (e) { lista = null; texto($('pedidos-estado'), t(e.message === 'limite' ? 'pedidos.limite' : 'pedidos.error')); }
    cargando = false; pintar();
  }

  function pintar() {
    const cont = $('pedidos-lista'); cont.replaceChildren();
    if (!lista) return;
    const visibles = lista.filter(i => (estado === 'all' || i.state === estado) && (!seccion || i.labels.some(l => l.name === seccion)));
    if (!visibles.length) { texto($('pedidos-estado'), t('pedidos.vacio')); return; }
    $('pedidos-estado').textContent = '';
    for (const i of visibles) {
      const caja = hijo(cont, 'div', 'pedido' + (i.state === 'closed' ? ' cerrado' : ''));
      const cab = hijo(caja, 'button', 'pedido-cab'); cab.type = 'button'; cab.setAttribute('aria-expanded', 'false');
      hijo(cab, 'span', 'pedido-num', '#' + i.number);
      hijo(cab, 'span', 'pedido-tit', i.title);
      hijo(cab, 'span', 'pedido-estado ' + i.state, t(i.state === 'open' ? 'pedidos.abierto' : 'pedidos.cerrado'));
      const etiquetas = hijo(caja, 'div', 'pedido-etiquetas');
      for (const l of i.labels) { const e = hijo(etiquetas, 'span', 'pedido-etiqueta', l.name); e.style.borderColor = hex(l.color); e.style.color = hex(l.color); }
      const det = hijo(caja, 'div', 'pedido-detalle'); det.hidden = true;
      hijo(det, 'p', 'pedido-cuerpo', (i.body || '').trim() || t('pedidos.sinTexto'));
      hijo(det, 'small', '', t('pedidos.comentarios', { n: i.comments }));
      const a = hijo(det, 'a', 'pedido-enlace', t('pedidos.verEnGithub')); a.href = i.html_url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      cab.addEventListener('click', () => { det.hidden = !det.hidden; cab.setAttribute('aria-expanded', String(!det.hidden)); });
    }
  }

  function armarFormulario() {
    const sel = $('pedidos-f-seccion'), prio = $('pedidos-f-prioridad');
    if (!sel.options.length) for (const s of PEDIDOS.secciones) sel.add(new Option(s, s));
    prio.replaceChildren(); [['alta', 'pedidos.prioAlta'], ['media', 'pedidos.prioMedia'], ['baja', 'pedidos.prioBaja']].forEach(([v, k], n) => { const o = new Option(t(k), v); o.selected = n === 1; prio.add(o); });
    $('pedidos-f-titulo').placeholder = t('pedidos.titulo.ejemplo');
  }
  // Abre GitHub con el ticket escrito (título y texto; las etiquetas las pone quien lo atiende)
  function crear() {
    const titulo = $('pedidos-f-titulo').value.trim(), que = $('pedidos-f-texto').value.trim();
    if (!titulo) { texto($('pedidos-f-aviso'), t('pedidos.faltaTitulo')); return; }
    const seccionElegida = $('pedidos-f-seccion').value, prioridad = $('pedidos-f-prioridad').value;
    const cuerpo = TEXTOS.es['pedidos.cuerpo']({   // siempre en español: lo lee quien atiende los pedidos
       seccion: seccionElegida, prioridad, texto: que, version: (typeof VERSION_JUEGO !== 'undefined' ? VERSION_JUEGO : '?') });
    const url = `https://github.com/${PEDIDOS.repo}/issues/new?title=${encodeURIComponent(`[${seccionElegida}] ${titulo}`)}&body=${encodeURIComponent(cuerpo)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    $('pedidos-f-aviso').textContent = '';
  }
  function verFormulario(si) { $('pedidos-form').hidden = !si; $('pedidos-vista').hidden = si; if (si) { armarFormulario(); $('pedidos-f-titulo').focus(); } }

  function iniciar() {
    const sec = $('pedidos-seccion'); sec.add(new Option(t('pedidos.todasSecciones'), '')); for (const s of PEDIDOS.secciones) sec.add(new Option(s, s));
    sec.addEventListener('change', () => { seccion = sec.value; pintar(); });
    document.querySelectorAll('#pedidos-estados button').forEach(b => b.addEventListener('click', () => {
      estado = b.dataset.estado; document.querySelectorAll('#pedidos-estados button').forEach(x => x.classList.toggle('elegida', x === b)); pintar();
    }));
    $('pedidos-nuevo').addEventListener('click', () => verFormulario(true));
    $('pedidos-cancelar').addEventListener('click', () => verFormulario(false));
    $('pedidos-crear').addEventListener('click', crear);
    $('pedidos-actualizar').addEventListener('click', () => cargar(true));
    Idioma.alCambiar(() => { sec.options[0].textContent = t('pedidos.todasSecciones'); if (lista) pintar(); });
  }
  if (document.getElementById('panel-pedidos')) iniciar();
  return { abrir() { verFormulario(false); cargar(); }, datos: () => lista };
})();
