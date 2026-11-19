/* ===== Administrar los pedidos (tickets) desde la terminal =====
 *   node servidor/pedidos.mjs                      lista todos
 *   node servidor/pedidos.mjs estado 3 cerrado     abierto | en curso | listo | esperando | cerrado
 *   node servidor/pedidos.mjs ver 3                el texto completo de uno
 *   node servidor/pedidos.mjs nota 3 "texto"       responde en el pedido (queda como nota del desarrollo)
 *   node servidor/pedidos.mjs borrar 3             lo borra para siempre (el número no se vuelve a usar)
 * Lee y escribe servidor/datos/pedidos.json (el mismo archivo que usa el servidor: los cambios se ven al instante). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ARCHIVO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'datos', 'pedidos.json');
const ESTADOS = ['abierto', 'en curso', 'listo', 'esperando', 'cerrado'];   // esperando = hecho, falta la confirmación de quien lo pidió
const leer = () => { try { return JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); } catch { return { siguiente: 1, pedidos: [] }; } };
const [, , orden = 'lista', a, ...resto] = process.argv, d = leer();
if (orden === 'lista') {
  if (!d.pedidos.length) console.log('No hay pedidos.');
  for (const p of d.pedidos) console.log(`#${p.numero} [${p.estado}] (${p.prioridad}) ${p.seccion} — ${p.titulo}`);
} else if (orden === 'ver') {
  const p = d.pedidos.find(x => x.numero === Number(a));
  if (!p) { console.error('No existe ese pedido.'); process.exit(1); }
  console.log(`#${p.numero} ${p.titulo}\nEstado: ${p.estado} · Prioridad: ${p.prioridad} · Sección: ${p.seccion} · ${p.fecha}\n\n${p.texto || '(sin descripción)'}`);
  for (const n of p.notas || []) console.log(`\n— ${n.de === 'desarrollo' ? 'Desarrollo' : 'Quien lo pidió'} (${n.tipo}, ${n.fecha}): ${n.texto}`);
} else if (orden === 'estado') {
  const estado = resto.join(' '), p = d.pedidos.find(x => x.numero === Number(a));
  if (!p || !ESTADOS.includes(estado)) { console.error(`Uso: estado <número> <${ESTADOS.join('|')}>`); process.exit(1); }
  p.estado = estado; fs.writeFileSync(ARCHIVO + '.tmp', JSON.stringify(d, null, 2)); fs.renameSync(ARCHIVO + '.tmp', ARCHIVO);
  console.log(`#${p.numero} → ${estado}`);
} else if (orden === 'nota') {
  const p = d.pedidos.find(x => x.numero === Number(a)), texto = resto.join(' ').trim();
  if (!p || !texto) { console.error('Uso: nota <número> "texto"'); process.exit(1); }
  (p.notas ||= []).push({ de: 'desarrollo', tipo: 'nota', texto: texto.slice(0, 500), fecha: new Date().toISOString() });
  fs.writeFileSync(ARCHIVO + '.tmp', JSON.stringify(d, null, 2)); fs.renameSync(ARCHIVO + '.tmp', ARCHIVO);
  console.log(`#${p.numero}: nota agregada`);
} else if (orden === 'borrar') {
  const i = d.pedidos.findIndex(x => x.numero === Number(a));
  if (i < 0) { console.error('No existe ese pedido.'); process.exit(1); }
  const [p] = d.pedidos.splice(i, 1);   // d.siguiente no cambia: los números no se reutilizan
  fs.writeFileSync(ARCHIVO + '.tmp', JSON.stringify(d, null, 2)); fs.renameSync(ARCHIVO + '.tmp', ARCHIVO);
  console.log(`#${p.numero} borrado: ${p.titulo}`);
} else { console.error('Órdenes: lista | ver <n> | estado <n> <estado> | nota <n> "texto" | borrar <n>'); process.exit(1); }
