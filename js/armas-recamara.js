/* ===== Recámara a la vista: con cada tiro el cerrojo va atrás y la vaina sale por la ventana =====
 * En las armas que se recargan solas (fusiles, metralletas, escopetas semiautomáticas) el cerrojo va atrás con cada
 * tiro. La ventana de expulsión, que en reposo muestra el costado del cerrojo, queda abierta un instante: se ve la
 * recámara (hueco oscuro con el canto del cañón), la vaina tomada de la uña del extractor y, al volver el cerrojo,
 * la bala nueva que entra. La vaina que vuela sale del medio de la ventana cuando el cerrojo llegó atrás.
 * El ciclo lo calcula el jugador (Jugador.estadoArma): e.cerrojo (0 adelante … 1 atrás) y e.recamara ('sale' mientras
 * se abre con la vaina servida, 'entra' mientras cierra con otra bala, null si no hay nada en la ventana).
 * La manija de carga también abre la recámara (e.corredera), y la bomba de las escopetas (e.bombeo).
 * Cada arma dice dónde tiene la ventana (cm, en el marco del modelo), cuánto corre el cerrojo y de qué color es.
 * Las que tienen la manija pegada al portacerrojo (AK, SVD, Saiga, SPAS-12, Benelli) llaman a ventanaRecamara desde
 * su propio dibujo, antes de la manija, para que la manija pase por encima; al resto se le dibuja encima del modelo.
 */
const RECAMARAS = {
  ak47:     { x: 10.2, y: -5.25, w: 6.2, h: 1.45, recorrido: 8, enModelo: true },
  svd:      { x: 9.4, y: -6.6, w: 7.8, h: 1.2, recorrido: 8, enModelo: true },
  saiga:    { x: 9.6, y: -6.4, w: 8.2, h: 1.2, recorrido: 8, enModelo: true },
  spas12:   { x: 10.6, y: -5.2, w: 7.3, h: 1.8, recorrido: 8, color: '#b9c0c8', abre: e => Math.max(e.cerrojo || 0, e.bombeo || 0), enModelo: true },
  benelli:  { x: 12.0, y: -5.25, w: 7.4, h: 1.5, recorrido: 7, enModelo: true },
  m16:      { x: 6.15, y: -5.95, w: 6.7, h: 1.5, recorrido: 7 },
  mp5:      { x: 9.4, y: -10.7, w: 5.4, h: 1.5, recorrido: 6 },
  uzi:      { x: 3.8, y: -5.0, w: 4.6, h: 1.4, recorrido: 5 },
  thompson: { x: 2.0, y: -6.0, w: 4.6, h: 1.4, recorrido: 6 },
  vector:   { x: 9.6, y: -5.6, w: 5.0, h: 1.4, recorrido: 5 },
  barrett:  { x: 6.0, y: -8.9, w: 8.0, h: 1.9, recorrido: 9, ciclo: 160 },
  aa12:     { x: 15.4, y: -9.3, w: 7.0, h: 2.0, recorrido: 8 },
  // Bomba y palanca: el cerrojo va atrás al accionar (después de cada tiro y al cargar la primera)
  mossberg: { x: 9.5, y: -4.7, w: 7.0, h: 1.8, recorrido: 8, abre: e => Math.max(e.cerrojo || 0, e.bombeo || 0) },
  rem870:   { x: 10.1, y: -4.9, w: 6.8, h: 1.5, recorrido: 8, abre: e => Math.max(e.cerrojo || 0, e.bombeo || 0) },
  winchester1894: { x: 2.6, y: -5.7, w: 6.0, h: 1.2, recorrido: 6, abre: e => e.palanca || 0 },
  winchester1887: { x: 5.5, y: -7.5, w: 7.0, h: 1.8, recorrido: 6, abre: e => e.palanca || 0 },
  // Pistolas: con la corredera atrás se ve la recámara por la ventana (y queda abierta si se vació)
  glock:    { x: 1.6, y: -3.0, w: 3.0, h: 1.0, recorrido: 3.6, abre: e => e.corredera || 0 },
  colt1911: { x: 4.4, y: -3.0, w: 3.4, h: 1.0, recorrido: 3, abre: e => e.corredera || 0 },
  ppk:      { x: 1.2, y: -2.7, w: 2.6, h: 0.8, recorrido: 2.4, abre: e => e.corredera || 0 },
  deagle:   { x: -3.2, y: -4.7, w: 3.8, h: 1.2, recorrido: 4.2, abre: e => e.corredera || 0 },
};

// Medidas de la vaina en cm: largo, diámetro y largo de la punta de la bala nueva
const VAINAS_CM = { pistola: [1.9, 0.95, 0.8], bala: [3.9, 1.1, 2.4], escopeta: [6.6, 1.9, 0], grande: [9.9, 2.0, 5.4] };

function vainaEnVentana(ctx, tipo, cara, cy, h, nueva) {
  const [largo, d0, punta] = VAINAS_CM[tipo] || VAINAS_CM.bala, d = Math.min(d0, h * 0.82), y0 = cy - d / 2;
  if (tipo === 'escopeta') {   // vaina de plástico rojo con el culote de latón
    pintar(ctx, Rc(cara + 1.3, y0, largo - 1.3, d), '#b4251e', { brillo: 0.35 });
    pintar(ctx, Rc(cara, y0 - 0.06, 1.4, d + 0.12), MAT.laton, { brillo: 0.5 });
    return;
  }
  const cuello = tipo === 'pistola' ? largo : largo * 0.78;   // las de fusil se angostan en el cuello
  pintar(ctx, [[cara, y0], [cara + cuello, y0], [cara + largo, y0 + d * 0.2], [cara + largo, y0 + d * 0.8], [cara + cuello, y0 + d], [cara, y0 + d]], MAT.laton, { brillo: 0.5 });
  ctx.fillStyle = 'rgba(60,40,0,0.55)'; ctx.fillRect(cara + 0.22, y0, 0.12, d);                    // ranura del culote
  if (nueva && punta) {                                                                             // la bala que entra: punta de cobre
    const yb = tipo === 'pistola' ? 0.08 : 0.2;
    pintar(ctx, [[cara + largo, y0 + d * yb], [cara + largo + punta * 0.6, y0 + d * (yb + 0.04)], [cara + largo + punta, cy], [cara + largo + punta * 0.6, y0 + d * (1 - yb - 0.04)], [cara + largo, y0 + d * (1 - yb)]], MAT.cobre, { brillo: 0.5 });
  }
}

// La ventana con el cerrojo adentro, en cm. ab: cuánto está atrás el cerrojo
function ventanaRecamara(ctx, v, e) {
  if (Pincel.silueta) return;   // la sombra del arma no cambia
  const ab = v.abre ? v.abre(e) : Math.max(e.cerrojo || 0, e.corredera || 0);
  const { x, y, w, h } = v, cara = x + w - ab * v.recorrido;
  // El hueco: oscuro, con la sombra del canto de arriba del cajón
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#020203'); g.addColorStop(0.65, '#121316'); g.addColorStop(1, '#25272c');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = 'rgba(150,155,165,0.3)'; ctx.fillRect(x + w - 0.3, y + h * 0.18, 0.3, h * 0.64);   // canto de la recámara
  if (e.recamara && ab > 0.02) vainaEnVentana(ctx, ARMA_VAINA[v.id] || 'bala', cara, y + h * 0.52, h, e.recamara === 'entra');
  // El cerrojo, de la cara hacia atrás: costado con luz, la cara oscura, la uña del extractor y el surco
  const largo = Math.max(w, v.recorrido) + w + 1;
  pintar(ctx, Rc(cara - largo, y + h * 0.06, largo, h * 0.88), v.color || '#5d6169', { brillo: 0.5 });
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(cara - 0.2, y + h * 0.06, 0.2, h * 0.88);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(cara - 1.0, y + h * 0.2, 0.55, h * 0.16);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cara - largo, y + h * 0.62, largo - 1.4, h * 0.08);
  ctx.restore();
  // Bordes: el de arriba en sombra (tapa el cerrojo), el de abajo con luz
  trazo(ctx, 'rgba(0,0,0,0.65)', 0.14, [[x, y + 0.04], [x + w, y + 0.04]]);
  trazo(ctx, 'rgba(255,255,255,0.16)', 0.08, [[x, y + h], [x + w, y + h]]);
  trazo(ctx, 'rgba(0,0,0,0.5)', 0.1, [[x, y], [x, y + h]]);
}

// Tipo de vaina de cada arma (el mismo que la que vuela)
const ARMA_VAINA = {};
for (const [id, v] of Object.entries(RECAMARAS)) {
  const d = DIBUJO_ARMAS[id];
  if (!d) continue;
  v.id = id; ARMA_VAINA[id] = d.casquillo || 'bala';
  d.expulsion = { x: (v.x + v.w * 0.55) * CM, y: (v.y + v.h * 0.5) * CM };   // la vaina sale de la ventana
  if (v.enModelo) continue;
  const dibujar = d.dibujar;
  d.dibujar = (ctx, e) => { dibujar(ctx, e); ctx.save(); ctx.scale(CM, CM); ventanaRecamara(ctx, v, e); ctx.restore(); };
}
