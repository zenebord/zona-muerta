/* ===== Administrar los pedidos (tickets) desde la terminal =====
 *   node servidor/pedidos.mjs                      lista todos
 *   node servidor/pedidos.mjs estado 3 cerrado     abierto | en curso | listo | cerrado
 *   node servidor/pedidos.mjs ver 3                el texto completo de uno
 * Lee y escribe servidor/datos/pedidos.json (el mismo archivo que usa el servidor: los cambios se ven al instante). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ARCHIVO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'datos', 'pedidos.json');
const ESTADOS = ['abierto', 'en curso', 'listo', 'cerrado'];
const leer = () => { try { return JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); } catch { return { siguiente: 1, pedidos: [] }; } };
const [, , orden = 'lista', a, ...resto] = process.argv, d = leer();
if (orden === 'lista') {
  if (!d.pedidos.length) console.log('No hay pedidos.');
  for (const p of d.pedidos) console.log(`#${p.numero} [${p.estado}] (${p.prioridad}) ${p.seccion} — ${p.titulo}`);
} else if (orden === 'ver') {
  const p = d.pedidos.find(x => x.numero === Number(a));
  if (!p) { console.error('No existe ese pedido.'); process.exit(1); }
  console.log(`#${p.numero} ${p.titulo}\nEstado: ${p.estado} · Prioridad: ${p.prioridad} · Sección: ${p.seccion} · ${p.fecha}\n\n${p.texto || '(sin descripción)'}`);
} else if (orden === 'estado') {
  const estado = resto.join(' '), p = d.pedidos.find(x => x.numero === Number(a));
  if (!p || !ESTADOS.includes(estado)) { console.error(`Uso: estado <número> <${ESTADOS.join('|')}>`); process.exit(1); }
  p.estado = estado; fs.writeFileSync(ARCHIVO + '.tmp', JSON.stringify(d, null, 2)); fs.renameSync(ARCHIVO + '.tmp', ARCHIVO);
  console.log(`#${p.numero} → ${estado}`);
} else { console.error('Órdenes: lista | ver <n> | estado <n> <estado>'); process.exit(1); }
