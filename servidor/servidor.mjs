/* ===== Servidor de la etapa de construcción de Zona Muerta =====
 * - Sirve el juego tal como está en la rama `main` de git (no la carpeta de trabajo: lo que se está editando
 *   y no se commiteó no le llega a nadie). Le agrega al index una marca para que el juego sepa que corre acá.
 * - Guarda la rama de cada jugador en git, en la rama `rama/<jugador>`, con un commit por cambio. Usa la
 *   «plomería» de git con un índice temporal: nunca toca la carpeta de trabajo ni la rama que está abierta.
 * - Hace de puente con la API de Claude para el asistente: la clave vive acá (servidor/.env) y nunca llega al
 *   navegador. El bucle de herramientas corre en el navegador del jugador (las herramientas tocan su juego);
 *   este servidor sólo reenvía cada vuelta, con topes por persona y por día.
 * Uso: node servidor/servidor.mjs   (lee servidor/.env: ANTHROPIC_API_KEY, PUERTO, topes opcionales)
 */
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
if (fs.existsSync(path.join(AQUI, '.env'))) process.loadEnvFile(path.join(AQUI, '.env'));

const PUERTO = Number(process.env.PUERTO || 8790);
const MODELO = 'claude-sonnet-5-5';
const TOPES = {
  pedidosPorPersona: Number(process.env.TOPE_PEDIDOS_DIA || 30),     // mensajes nuevos al asistente por día
  vueltasPorPersona: Number(process.env.TOPE_VUELTAS_DIA || 300),     // llamadas a la API por día (cada pedido usa varias)
  vueltasTotales: Number(process.env.TOPE_VUELTAS_TOTAL_DIA || 2000), // entre todos los jugadores
};
const ia = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const DIR_DATOS = path.join(AQUI, 'datos');
fs.mkdirSync(DIR_DATOS, { recursive: true });

const registrar = (...a) => console.log(new Date().toISOString(), ...a);

/* ---------- git ---------- */
function git(args, { entrada, env, buffer } = {}) {
  return new Promise((resolver, rechazar) => {
    const hijo = execFile('git', args, { cwd: RAIZ, env: { ...process.env, ...env }, encoding: buffer ? 'buffer' : 'utf8', maxBuffer: 64 * 1024 * 1024 },
      (error, salida, errores) => error ? rechazar(new Error(`git ${args[0]}: ${errores || error.message}`)) : resolver(buffer ? salida : salida.trim()));
    if (entrada !== undefined) { hijo.stdin.end(entrada); }
  });
}
// Una operación de git a la vez: las ramas se escriben en orden y sin pisarse
let cola = Promise.resolve();
const enCola = tarea => (cola = cola.then(tarea, tarea));

/* ---------- El juego, servido desde main ---------- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.ico': 'image/x-icon' };
const PERMITIDO = /^(index\.html|js\/[\w.-]+\.js|css\/[\w.-]+\.css|sonidos\/[\w./-]+\.(wav|mp3|ogg))$/;
let mainActual = { hash: null, hasta: 0 };
const cacheArchivos = new Map();
async function hashMain() {
  if (Date.now() < mainActual.hasta) return mainActual.hash;
  const hash = await git(['rev-parse', 'refs/heads/main']);
  if (hash !== mainActual.hash) cacheArchivos.clear();
  mainActual = { hash, hasta: Date.now() + 2000 };
  return hash;
}
async function archivoDeMain(ruta) {
  const hash = await hashMain();
  if (cacheArchivos.has(ruta)) return cacheArchivos.get(ruta);
  let datos = await git(['show', `${hash}:${ruta}`], { buffer: true });
  if (ruta === 'index.html') datos = Buffer.from(datos.toString('utf8').replace('<head>', '<head>\n<script>window.SERVIDOR_JUEGO = true;</script>'));
  cacheArchivos.set(ruta, datos);
  return datos;
}

/* ---------- Ramas de jugadores ---------- */
const ID_VALIDO = /^r[a-z0-9]{6,20}$/;
const rutaRama = id => `ramas/${id}/rama.json`;
async function leerRama(id) {
  try { return JSON.parse(await git(['show', `refs/heads/rama/${id}:${rutaRama(id)}`])); }
  catch { return null; }
}
// Escribe archivos (y borra los que vienen en null) en la rama del jugador, con un commit
function escribirEnRama(id, archivos, mensaje) {
  return enCola(async () => {
    const ref = `refs/heads/rama/${id}`;
    let padre, existia = true;
    try { padre = await git(['rev-parse', '--verify', ref]); } catch { padre = await git(['rev-parse', 'refs/heads/main']); existia = false; }   // rama nueva: sale de main
    const indice = path.join(DIR_DATOS, `indice-${id}`);
    const env = { GIT_INDEX_FILE: indice };
    try {
      await git(['read-tree', padre], { env });
      for (const [ruta, contenido] of Object.entries(archivos)) {
        if (contenido === null) { await git(['update-index', '--force-remove', ruta], { env }); continue; }
        const blob = await git(['hash-object', '-w', '--stdin'], { entrada: contenido });
        await git(['update-index', '--add', '--cacheinfo', `100644,${blob},${ruta}`], { env });
      }
      const arbol = await git(['write-tree'], { env });
      if (arbol === await git(['rev-parse', `${padre}^{tree}`])) return padre;   // nada cambió
      const commit = await git(['commit-tree', arbol, '-p', padre, '-m', mensaje], { env: { GIT_AUTHOR_NAME: `Jugador ${id}`, GIT_AUTHOR_EMAIL: `${id}@jugadores.zona-muerta`, GIT_COMMITTER_NAME: 'Servidor Zona Muerta', GIT_COMMITTER_EMAIL: 'servidor@zona-muerta' } });
      await git(['update-ref', ref, commit, existia ? padre : '0'.repeat(40)]);   // falla si alguien la movió en el medio
      return commit;
    } finally { fs.rmSync(indice, { force: true }); }
  });
}
const limpio = (txt, max) => String(txt ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, max);
function normalizarParche(p) {
  return { id: limpio(p.id, 40), descripcion: limpio(p.descripcion, 300), pedido: limpio(p.pedido, 600), codigo: limpio(p.codigo, 60000),
    fecha: limpio(p.fecha, 40), cambio: limpio(p.cambio, 40), activo: !!p.activo, error: p.error ? limpio(p.error, 300) : null };
}
async function guardarRama(id, cuerpo) {
  const anterior = (await leerRama(id)) || { parches: [], ajustes: {}, pedidos: [] };
  const parches = (Array.isArray(cuerpo.parches) ? cuerpo.parches : []).slice(0, 200).map(normalizarParche).filter(p => p.id.startsWith(id + '-'));
  const ajustes = cuerpo.ajustes && typeof cuerpo.ajustes === 'object' ? Object.fromEntries(Object.entries(cuerpo.ajustes).slice(0, 300).map(([k, v]) => [limpio(k, 80), typeof v === 'boolean' ? v : Number(v)])) : anterior.ajustes;
  const ajustesCambio = cuerpo.ajustes ? limpio(cuerpo.ajustesCambio, 40) : (anterior.ajustesCambio || '');
  const rama = { jugador: id, actualizada: new Date().toISOString(), parches, ajustes, ajustesCambio, pedidos: anterior.pedidos || [] };
  const archivos = { [rutaRama(id)]: JSON.stringify(rama, null, 2) + '\n' };
  // Cada parche también como archivo .js, para leerlo y fusionarlo cómodo; los borrados se van
  const vivos = new Set(parches.map(p => p.id));
  for (const p of parches) archivos[`ramas/${id}/parches/${p.id}.js`] = `// ${p.descripcion}\n// Pedido: ${p.pedido.replace(/\n/g, ' ')}\n// Estado: ${p.activo ? 'activo' : 'apagado'}${p.error ? ' · error: ' + p.error : ''}\n\n${p.codigo}\n`;
  for (const p of anterior.parches || []) if (!vivos.has(p.id)) archivos[`ramas/${id}/parches/${p.id}.js`] = null;
  const mensaje = limpio(cuerpo.motivo, 200) || 'Actualiza la rama';
  await escribirEnRama(id, archivos, `${mensaje}\n\nRama del jugador ${id}.`);
  return rama;
}
async function anotarPedido(id, cuerpo) {
  const rama = (await leerRama(id)) || { jugador: id, parches: [], ajustes: {}, pedidos: [] };
  rama.pedidos = [...(rama.pedidos || []), { resumen: limpio(cuerpo.resumen, 300), detalle: limpio(cuerpo.detalle, 2000), fecha: new Date().toISOString() }].slice(-200);
  rama.actualizada = new Date().toISOString();
  await escribirEnRama(id, { [rutaRama(id)]: JSON.stringify(rama, null, 2) + '\n' }, `Pedido: ${limpio(cuerpo.resumen, 150)}`);
}

/* ---------- Topes por día ---------- */
const ARCHIVO_TOPES = path.join(DIR_DATOS, 'topes.json');
let topes = { dia: '', personas: {}, total: 0 };
try { topes = JSON.parse(fs.readFileSync(ARCHIVO_TOPES, 'utf8')); } catch { /* primer arranque */ }
function contar(persona, esPedido) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (topes.dia !== hoy) topes = { dia: hoy, personas: {}, total: 0 };
  const p = topes.personas[persona] ||= { pedidos: 0, vueltas: 0 };
  if (esPedido && p.pedidos >= TOPES.pedidosPorPersona) return 'pedidos';
  if (p.vueltas >= TOPES.vueltasPorPersona || topes.total >= TOPES.vueltasTotales) return 'vueltas';
  if (esPedido) p.pedidos++;
  p.vueltas++; topes.total++;
  fs.writeFile(ARCHIVO_TOPES, JSON.stringify(topes), () => {});
  return null;
}

/* ---------- Puente con Claude ---------- */
const HERRAMIENTAS_PERMITIDAS = new Set(['cambiar_ajustes', 'leer_codigo', 'aplicar_parche', 'restaurar_ajustes', 'anotar_pedido']);
const PRESENTACION = 'Eres el asistente de construcción del videojuego «Zona Muerta». Sólo ayudas a mejorar este juego: si te piden otra cosa, lo dices amablemente en una frase y vuelves al juego.';
async function preguntarAClaude(cuerpo) {
  const herramientas = (Array.isArray(cuerpo.herramientas) ? cuerpo.herramientas : [])
    .filter(h => HERRAMIENTAS_PERMITIDAS.has(h?.name))
    .map(h => ({ name: h.name, description: limpio(h.description, 1000), input_schema: h.input_schema }));
  const respuesta = await ia.beta.messages.create({
    model: MODELO,
    max_tokens: 16000,
    output_config: { effort: 'medium' },                    // escribir parches es trabajo de código con herramientas
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',                                    // si este modelo declina por política, otro sigue el pedido
    cache_control: { type: 'ephemeral' },                    // cachea la conversación entre vueltas del mismo pedido
    system: [{ type: 'text', text: `${PRESENTACION}\n\n${limpio(cuerpo.sistema, 120000)}`, cache_control: { type: 'ephemeral' } }],
    tools: herramientas,
    messages: cuerpo.mensajes,
  });
  const u = respuesta.usage || {};
  registrar('ia', cuerpo.jugador, respuesta.stop_reason, `entrada ${u.input_tokens} (caché ${u.cache_read_input_tokens || 0}) salida ${u.output_tokens}`);
  return { content: respuesta.content, stop_reason: respuesta.stop_reason, stop_details: respuesta.stop_details ?? null };
}

/* ---------- HTTP ---------- */
function leerCuerpo(req, max = 1_500_000) {
  return new Promise((resolver, rechazar) => {
    let total = 0; const partes = [];
    req.on('data', c => { total += c.length; if (total > max) { rechazar(Object.assign(new Error('demasiado grande'), { estado: 413 })); req.destroy(); } else partes.push(c); });
    req.on('end', () => { try { resolver(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}')); } catch { rechazar(Object.assign(new Error('JSON inválido'), { estado: 400 })); } });
    req.on('error', rechazar);
  });
}
const responder = (res, estado, datos, tipo = 'application/json; charset=utf-8') => {
  res.writeHead(estado, { 'Content-Type': tipo, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof datos === 'string' || Buffer.isBuffer(datos) ? datos : JSON.stringify(datos));
};
// Detrás del túnel, la IP real viene en cf-connecting-ip (sólo se le cree si la conexión es local)
const persona = req => (['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) && req.headers['cf-connecting-ip']) || req.socket.remoteAddress;

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  try {
    if (url.pathname === '/api/estado') return responder(res, 200, { ia: !!ia, modelo: MODELO, topes: { pedidos: TOPES.pedidosPorPersona } });
    let m;
    if ((m = /^\/api\/rama\/([a-z0-9]+)$/.exec(url.pathname))) {
      const id = m[1];
      if (!ID_VALIDO.test(id)) return responder(res, 400, { error: 'id inválido' });
      if (req.method === 'GET') return responder(res, 200, (await leerRama(id)) || { jugador: id, parches: [], ajustes: {}, pedidos: [] });
      if (req.method === 'POST') { const rama = await guardarRama(id, await leerCuerpo(req)); registrar('rama', id, rama.parches.length, 'parches'); return responder(res, 200, { ok: true }); }
    }
    if ((m = /^\/api\/pedido\/([a-z0-9]+)$/.exec(url.pathname)) && req.method === 'POST') {
      if (!ID_VALIDO.test(m[1])) return responder(res, 400, { error: 'id inválido' });
      await anotarPedido(m[1], await leerCuerpo(req));
      return responder(res, 200, { ok: true });
    }
    if (url.pathname === '/api/ia' && req.method === 'POST') {
      if (!ia) return responder(res, 503, { error: 'sin_clave' });
      const cuerpo = await leerCuerpo(req);
      if (!Array.isArray(cuerpo.mensajes) || !cuerpo.mensajes.length || cuerpo.mensajes.length > 60) return responder(res, 400, { error: 'mensajes inválidos' });
      const ultimo = cuerpo.mensajes[cuerpo.mensajes.length - 1];
      const tope = contar(persona(req), ultimo.role === 'user' && typeof ultimo.content === 'string');
      if (tope) return responder(res, 429, { error: 'tope', cual: tope, tope: TOPES.pedidosPorPersona });
      try { return responder(res, 200, await preguntarAClaude(cuerpo)); }
      catch (e) {
        if (e instanceof Anthropic.RateLimitError) return responder(res, 429, { error: 'ocupado' });
        if (e instanceof Anthropic.BadRequestError) { registrar('ia 400', e.message); return responder(res, 400, { error: 'pedido_invalido' }); }
        if (e instanceof Anthropic.APIError) { registrar('ia', e.status, e.message); return responder(res, 502, { error: 'api' }); }
        throw e;
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, { error: 'método' });
    const ruta = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    if (!PERMITIDO.test(ruta) || ruta.includes('..')) return responder(res, 404, 'No existe', 'text/plain; charset=utf-8');
    let datos;
    try { datos = await archivoDeMain(ruta); } catch { return responder(res, 404, 'No existe', 'text/plain; charset=utf-8'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : datos);
  } catch (e) {
    registrar('error', req.method, url.pathname, e.message);
    responder(res, e.estado || 500, { error: e.estado ? e.message : 'interno' });
  }
});
servidor.listen(PUERTO, '127.0.0.1', () => registrar(`Zona Muerta en http://127.0.0.1:${PUERTO} · asistente ${ia ? 'con ' + MODELO : 'SIN CLAVE (servidor/.env)'}`));
