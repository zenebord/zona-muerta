/* ===== Rama del jugador (temporal, sólo mientras se construye el juego) =====
 * Cada jugador juega «su rama»: la versión principal del juego más los parches de código que fue pidiendo al
 * asistente (js/asistente.js). Los parches se aplican al cargar, en orden, después de los datos, modelos y clases
 * del juego y antes de la interfaz (así un arma nueva ya aparece en los menús).
 * Dónde viven: con el servidor de construcción (servidor/servidor.mjs), en git, en la rama `rama/<jugador>` de la
 * Mac del dueño (un commit por cambio); el navegador guarda una copia y, al cargar, se combinan las dos por fecha
 * de cada cambio. Sin servidor (publicado en claude.ai), sólo en el navegador.
 * Cuando el dueño aprueba una rama, sus parches se pasan prolijos al código real (rama main) y sus ids se anotan
 * en PARCHES_FUSIONADOS: desde esa versión el juego los trae de fábrica y se borran solos de la rama.
 * Red de seguridad: un parche que falla al aplicarse no se guarda; uno que tira un error al jugar se apaga solo y
 * el juego se recarga; si la carga anterior se colgó aplicando parches, se apaga el último.
 */
const PARCHES_FUSIONADOS = [];   // ids de parches que ya están en main (lo completa quien fusiona)

const Rama = (() => {
  const CLAVE = 'zonaMuerta.rama', CLAVE_CARGA = 'zonaMuerta.rama.cargando';
  const conServidor = !!window.SERVIDOR_JUEGO;
  let rama = { id: null, parches: [], contador: 0, ajustes: {}, ajustesCambio: '' };
  try { Object.assign(rama, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch { /* sin almacenamiento */ }
  if (!rama.id) rama.id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const guardarLocal = () => { try { localStorage.setItem(CLAVE, JSON.stringify(rama)); } catch { /* ídem */ } };
  const ahora = () => new Date().toISOString();
  const avisos = [];
  let estadoServidor = conServidor ? 'pendiente' : 'sin servidor';

  /* ---------- Servidor ---------- */
  // Al cargar se pide la rama de forma sincrónica: los parches tienen que estar antes de que arranque la interfaz
  function traerDelServidor() {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', `/api/rama/${rama.id}`, false); x.send();
      return x.status === 200 ? JSON.parse(x.responseText) : null;
    } catch { return null; }
  }
  // Combina la copia del navegador con la del servidor: por cada parche gana el cambio más reciente
  function combinar(srv) {
    let difiere = false;
    const porId = new Map(rama.parches.map(p => [p.id, p]));
    for (const s of srv.parches || []) {
      const l = porId.get(s.id);
      if (!l || (s.cambio || '') > (l.cambio || '')) porId.set(s.id, s);
      else if ((l.cambio || '') > (s.cambio || '')) difiere = true;
    }
    for (const l of rama.parches) if (!(srv.parches || []).some(s => s.id === l.id)) difiere = true;   // nunca llegó al servidor
    rama.parches = [...porId.values()].sort((a, b) => Number(a.id.split('-').pop()) - Number(b.id.split('-').pop()));
    rama.contador = Math.max(rama.contador, ...rama.parches.map(p => Number(p.id.split('-').pop()) || 0));
    if ((srv.ajustesCambio || '') > (rama.ajustesCambio || '')) { rama.ajustes = srv.ajustes || {}; rama.ajustesCambio = srv.ajustesCambio; }
    else if ((rama.ajustesCambio || '') > (srv.ajustesCambio || '')) difiere = true;
    return difiere;
  }
  let subiendo = Promise.resolve();
  function subir(motivo, alSalir) {
    if (!conServidor) return;
    const cuerpo = JSON.stringify({ parches: rama.parches, ajustes: rama.ajustes, ajustesCambio: rama.ajustesCambio, motivo });
    if (alSalir && navigator.sendBeacon && cuerpo.length < 60000) { navigator.sendBeacon(`/api/rama/${rama.id}`, new Blob([cuerpo], { type: 'application/json' })); return; }
    estadoServidor = 'guardando';
    subiendo = subiendo.then(() => fetch(`/api/rama/${rama.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo }))
      .then(r => { estadoServidor = r.ok ? 'guardado' : 'error'; }, () => { estadoServidor = 'error'; })
      .then(() => window.dispatchEvent(new Event('rama-guardada')));
  }

  if (conServidor) {
    const srv = traerDelServidor();
    if (srv) { if (combinar(srv)) setTimeout(() => subir('Sincroniza la rama con el navegador'), 0); else estadoServidor = 'guardado'; }
    else estadoServidor = 'error';
  }

  // Los que ya están en main se van de la rama
  const fusionados = rama.parches.filter(p => PARCHES_FUSIONADOS.includes(p.id));
  if (fusionados.length) { rama.parches = rama.parches.filter(p => !PARCHES_FUSIONADOS.includes(p.id)); avisos.push({ clave: 'rama.fusionados', n: fusionados.length }); }

  const ejecutar = p => new Function(`${p.codigo}\n//# sourceURL=parche-${p.id}.js`)();
  const apagar = (p, motivo) => { p.activo = false; p.error = motivo; p.cambio = ahora(); };

  // Modo seguro: si la carga anterior no terminó con los parches puestos, el último activo es el sospechoso
  let colgada = false, cambioAlCargar = false;
  try { colgada = localStorage.getItem(CLAVE_CARGA) === '1'; } catch { /* ídem */ }
  if (colgada) {
    const ultimo = [...rama.parches].reverse().find(p => p.activo);
    if (ultimo) { apagar(ultimo, 'la carga anterior se colgó con este parche'); cambioAlCargar = true; avisos.push({ clave: 'rama.seguro', descripcion: ultimo.descripcion }); }
  }
  try { localStorage.setItem(CLAVE_CARGA, '1'); } catch { /* ídem */ }
  for (const p of rama.parches) {
    if (!p.activo) continue;
    try { ejecutar(p); p.error = null; }
    catch (e) { apagar(p, String((e && e.message) || e)); cambioAlCargar = true; avisos.push({ clave: 'rama.fallo', descripcion: p.descripcion }); }
  }
  guardarLocal();
  if (cambioAlCargar) setTimeout(() => subir('Apaga parches que fallaron al cargar'), 0);
  setTimeout(() => { try { localStorage.removeItem(CLAVE_CARGA); } catch { /* ídem */ } }, 1500);   // si llegó acá, la carga anduvo

  // Un parche que tira un error mientras se juega se apaga solo y el juego se recarga sin él (el primer error ya
  // corta el ciclo de dibujo, así que esperar a un segundo dejaría el juego congelado)
  window.addEventListener('error', ev => {
    const origen = `${ev.filename || ''}\n${(ev.error && ev.error.stack) || ''}`;
    const m = /parche-([a-z0-9-]+)\.js/.exec(origen);
    if (!m) return;
    const p = rama.parches.find(x => x.id === m[1]);
    if (!p || !p.activo) return;
    apagar(p, String(ev.message || 'error al jugar')); guardarLocal();
    subir(`Apaga «${p.descripcion}»: falló al jugar`, true);
    location.reload();
  });

  const cambiar = (motivo, f) => { f(); guardarLocal(); subir(motivo); };
  return {
    id: () => rama.id,
    conServidor: () => conServidor,
    estado: () => estadoServidor,
    parches: () => rama.parches.map(p => ({ ...p })),
    avisos: () => avisos.splice(0),
    ajustes: () => ({ ...rama.ajustes }),
    // Aplica un parche nuevo en el acto; si falla no se guarda y el error vuelve a quien lo pidió
    aplicar({ descripcion, pedido, codigo }) {
      const p = { id: `${rama.id}-${rama.contador + 1}`, descripcion: String(descripcion).slice(0, 300), pedido: String(pedido || '').slice(0, 600),
        codigo: String(codigo), fecha: ahora(), cambio: ahora(), activo: true, enviado: false, error: null };
      ejecutar(p);   // si tira, no se guarda nada
      rama.contador++;
      cambiar(`Parche ${p.id}: ${p.descripcion}`, () => rama.parches.push(p));
      return p;
    },
    // Encender, apagar o borrar un parche pide recargar: lo que ya corrió no se puede «descorrer»
    alternar(id, activo) {
      const p = rama.parches.find(x => x.id === id);
      if (p) cambiar(`${activo ? 'Enciende' : 'Apaga'} «${p.descripcion}»`, () => { p.activo = activo; p.cambio = ahora(); if (activo) p.error = null; });
    },
    borrar(id) {
      const p = rama.parches.find(x => x.id === id);
      if (p) cambiar(`Borra «${p.descripcion}»`, () => { rama.parches = rama.parches.filter(x => x.id !== id); });
    },
    guardarAjustes(ajustes, motivo) { cambiar(motivo || 'Ajustes', () => { rama.ajustes = { ...ajustes }; rama.ajustesCambio = ahora(); }); },
    // Pasar a otra rama (la misma persona en otro dispositivo): se recarga y la trae del servidor
    usarRama(id) {
      if (!/^r[a-z0-9]{6,20}$/.test(id) || id === rama.id) return false;
      rama = { id, parches: [], contador: 0, ajustes: {}, ajustesCambio: '' }; guardarLocal();
      location.reload(); return true;
    },
    marcarEnviados(ids) { for (const p of rama.parches) if (ids.includes(p.id)) p.enviado = true; guardarLocal(); },
    exportar: () => ({ rama: rama.id, fecha: ahora(), parches: rama.parches.filter(p => p.activo).map(({ id, descripcion, pedido, codigo, fecha }) => ({ id, descripcion, pedido, codigo, fecha })) }),
  };
})();
