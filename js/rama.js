/* ===== Rama del jugador (temporal, sólo mientras se construye el juego) =====
 * Cada jugador juega «su rama»: la versión principal del juego más los parches de código que fue pidiendo al
 * asistente (js/asistente.js). Los parches viven en su navegador y se aplican al cargar, en orden, después de los
 * datos, modelos y clases del juego y antes de la interfaz (así un arma nueva ya aparece en los menús).
 * Cuando el dueño aprueba una rama, sus parches se pasan prolijos al código real (git, rama main) y sus ids se
 * anotan en PARCHES_FUSIONADOS: desde esa versión el juego los trae de fábrica y se borran solos de la rama.
 * Red de seguridad: un parche que falla al aplicarse no se guarda; uno que después tira errores seguidos se
 * desactiva solo y el juego se recarga; si la carga anterior se colgó aplicando parches, se apaga el último.
 */
const PARCHES_FUSIONADOS = [];   // ids de parches que ya están en main (lo completa quien fusiona)

const Rama = (() => {
  const CLAVE = 'zonaMuerta.rama', CLAVE_CARGA = 'zonaMuerta.rama.cargando';
  let rama = { id: null, parches: [], contador: 0 };
  try { Object.assign(rama, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch { /* sin almacenamiento */ }
  if (!rama.id) rama.id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(rama)); } catch { /* ídem */ } };
  const avisos = [];

  // Los que ya están en main se van de la rama
  const fusionados = rama.parches.filter(p => PARCHES_FUSIONADOS.includes(p.id));
  if (fusionados.length) { rama.parches = rama.parches.filter(p => !PARCHES_FUSIONADOS.includes(p.id)); avisos.push({ clave: 'rama.fusionados', n: fusionados.length }); }

  const ejecutar = p => new Function(`${p.codigo}\n//# sourceURL=parche-${p.id}.js`)();

  // Modo seguro: si la carga anterior no terminó con los parches puestos, el último activo es el sospechoso
  let colgada = false;
  try { colgada = localStorage.getItem(CLAVE_CARGA) === '1'; } catch { /* ídem */ }
  if (colgada) {
    const ultimo = [...rama.parches].reverse().find(p => p.activo);
    if (ultimo) { ultimo.activo = false; ultimo.error = 'la carga anterior se colgó con este parche'; avisos.push({ clave: 'rama.seguro', descripcion: ultimo.descripcion }); }
  }
  try { localStorage.setItem(CLAVE_CARGA, '1'); } catch { /* ídem */ }
  for (const p of rama.parches) {
    if (!p.activo) continue;
    try { ejecutar(p); p.error = null; }
    catch (e) { p.activo = false; p.error = String((e && e.message) || e); avisos.push({ clave: 'rama.fallo', descripcion: p.descripcion }); }
  }
  guardar();
  setTimeout(() => { try { localStorage.removeItem(CLAVE_CARGA); } catch { /* ídem */ } }, 1500);   // si llegó acá, la carga anduvo

  // Un parche que tira un error mientras se juega se apaga solo y el juego se recarga sin él (el primer error ya
  // corta el ciclo de dibujo, así que esperar a un segundo dejaría el juego congelado)
  window.addEventListener('error', ev => {
    const origen = `${ev.filename || ''}\n${(ev.error && ev.error.stack) || ''}`;
    const m = /parche-([a-z0-9-]+)\.js/.exec(origen);
    if (!m) return;
    const p = rama.parches.find(x => x.id === m[1]);
    if (!p || !p.activo) return;
    p.activo = false; p.error = String(ev.message || 'error al jugar'); guardar();
    location.reload();
  });

  return {
    id: () => rama.id,
    parches: () => rama.parches.map(p => ({ ...p })),
    avisos: () => avisos.splice(0),
    // Aplica un parche nuevo en el acto; si falla no se guarda y el error vuelve a quien lo pidió
    aplicar({ descripcion, pedido, codigo }) {
      const p = { id: `${rama.id}-${++rama.contador}`, descripcion: String(descripcion).slice(0, 300), pedido: String(pedido || '').slice(0, 600),
        codigo: String(codigo), fecha: new Date().toISOString(), activo: true, enviado: false, error: null };
      try { ejecutar(p); } catch (e) { rama.contador--; throw e; }
      rama.parches.push(p); guardar();
      return p;
    },
    // Encender, apagar o borrar un parche pide recargar: lo que ya corrió no se puede «descorrer»
    alternar(id, activo) { const p = rama.parches.find(x => x.id === id); if (p) { p.activo = activo; if (activo) p.error = null; guardar(); } },
    borrar(id) { rama.parches = rama.parches.filter(x => x.id !== id); guardar(); },
    marcarEnviados(ids) { for (const p of rama.parches) if (ids.includes(p.id)) p.enviado = true; guardar(); },
    exportar: () => ({ rama: rama.id, fecha: new Date().toISOString(), parches: rama.parches.filter(p => p.activo).map(({ id, descripcion, pedido, codigo, fecha }) => ({ id, descripcion, pedido, codigo, fecha })) }),
  };
})();
