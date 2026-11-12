/* ===== Herramientas de dibujo con volumen =====
 * El juego sigue siendo 2D, pero los cuerpos se pintan con degradados (luz de un lado, sombra del
 * otro), proyectan sombra en el piso y las cajas tienen cara superior y lateral. Eso es lo que da
 * la sensación de profundidad sin irse a un motor 3D.
 */
// Resolución real del lienzo: el juego dibuja en 960×540 lógicos y esto lo multiplica (hasta 2×)
const Lienzo = { escala: 1 };

const Pincel = {
  bisel: true,     // borde con luz arriba a la izquierda y sombra abajo a la derecha
  silueta: null,   // si tiene un color, todo se pinta plano de ese color: así se dibujan las sombras
  luz: 0.2,        // cuánto aclara el lado iluminado
  sombra: 0.32,    // cuánto oscurece el lado en sombra
};

// Aclara (factor > 0) u oscurece (factor < 0) un color '#rrggbb'
const cacheColores = new Map();
function ajustarColor(hex, factor) {
  const clave = hex + factor;
  let r = cacheColores.get(clave);
  if (r) return r;
  let rojo, verde, azul;
  if (hex[0] === '#') { const n = parseInt(hex.slice(1), 16); rojo = (n >> 16) & 255; verde = (n >> 8) & 255; azul = n & 255; }
  else [rojo, verde, azul] = (hex.match(/[\d.]+/g) || [0, 0, 0]).map(Number);   // 'rgb(r, g, b)': un color ya ajustado se puede volver a ajustar
  if (factor > 0) { rojo += (255 - rojo) * factor; verde += (255 - verde) * factor; azul += (255 - azul) * factor; }
  else { rojo *= 1 + factor; verde *= 1 + factor; azul *= 1 + factor; }
  r = `rgb(${Math.round(rojo)}, ${Math.round(verde)}, ${Math.round(azul)})`;
  cacheColores.set(clave, r);
  return r;
}

// Color a usar según el modo: el real o el de la silueta
function tinta(color) { return Pincel.silueta || color; }

// Rectángulo con volumen cilíndrico: iluminado a la izquierda, en sombra a la derecha
function bloque(ctx, x, y, w, h, color) {
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fillRect(x, y, w, h); return; }
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, ajustarColor(color, Pincel.luz));
  g.addColorStop(0.4, color);
  g.addColorStop(1, ajustarColor(color, -Pincel.sombra));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Esfera con brillo arriba a la izquierda
function esfera(ctx, x, y, r, color) {
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); return; }
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, ajustarColor(color, 0.35));
  g.addColorStop(1, ajustarColor(color, -0.4));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// Caja en perspectiva: cara frontal, cara superior más clara y cara lateral más oscura
function cubo(ctx, x, y, w, h, fondo, color) {
  const arriba = ajustarColor(color, 0.3), lado = ajustarColor(color, -0.35);
  ctx.fillStyle = tinta(color); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tinta(arriba);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + fondo, y - fondo * 0.6); ctx.lineTo(x + w + fondo, y - fondo * 0.6); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tinta(lado);
  ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + fondo, y - fondo * 0.6); ctx.lineTo(x + w + fondo, y + h - fondo * 0.6); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
}

// Cilindro vertical (postes, barriles): cuerpo con degradado y tapa elíptica
function cilindro(ctx, x, y, r, h, color) {
  bloque(ctx, x - r, y - h, r * 2, h, color);
  ctx.fillStyle = tinta(ajustarColor(color, 0.25));
  ctx.beginPath(); ctx.ellipse(x, y - h, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
}

// Dibuja un cuerpo dos veces: primero su sombra aplastada sobre el piso, después el cuerpo
// ySuelo: dónde está el piso debajo del cuerpo; si salta, la sombra queda en el piso, más chica y más clara
// Sombra pareja: la silueta se pinta opaca en una capa aparte del tamaño justo y se pega con la transparencia.
// Así las piezas que se superponen (brazo sobre torso, correas, bolsillos) no oscurecen más la sombra.
// La usa el jugador, que tiene muchas piezas encimadas; dibujarCuerpo recibe el contexto donde pintar.
const capaSombra = { lienzo: null, ctx: null };
function sombraPareja(ctx, x, ySuelo, altura, tamano, alfa, dibujarCuerpo) {
  const m = ctx.getTransform();
  // Caja que puede ocupar la sombra alrededor del pie, en unidades del dibujo (cae hacia adelante y abajo)
  const esquinas = [[-175, -14], [115, -14], [-175, 48], [115, 48]].map(([px, py]) => m.transformPoint(new DOMPoint(x + px, ySuelo + py)));
  const x0 = Math.floor(Math.min(...esquinas.map(q => q.x))), y0 = Math.floor(Math.min(...esquinas.map(q => q.y)));
  const w = Math.ceil(Math.max(...esquinas.map(q => q.x))) - x0, h = Math.ceil(Math.max(...esquinas.map(q => q.y))) - y0;
  if (w <= 0 || h <= 0 || w > 6000 || h > 3000) return false;
  if (!capaSombra.lienzo) { capaSombra.lienzo = document.createElement('canvas'); capaSombra.ctx = capaSombra.lienzo.getContext('2d'); }
  const L = capaSombra.lienzo, o = capaSombra.ctx;
  if (L.width < w || L.height < h) { L.width = Math.max(L.width, w); L.height = Math.max(L.height, h); }
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, w, h);
  o.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0);
  o.translate(x - altura * 0.12, ySuelo); o.scale(tamano, tamano); o.transform(1, 0, 0.55, -0.3, 0, 0);
  Pincel.silueta = '#000';
  dibujarCuerpo(o);
  Pincel.silueta = null;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= alfa;
  ctx.drawImage(L, 0, 0, w, h, x0, y0, w, h);
  ctx.restore();
  return true;
}
function conSombra(ctx, x, y, dibujarCuerpo, alfa = 0.32, ySuelo = y, pareja = false) {
  const altura = Math.max(0, ySuelo - y);
  const fuerza = Math.max(0, 1 - altura / 140), tamano = Math.max(0.55, 1 - altura / 260);
  if (fuerza > 0.02 && !(pareja && sombraPareja(ctx, x, ySuelo, altura, tamano, alfa * fuerza, dibujarCuerpo))) {
    ctx.save();
    ctx.translate(x - altura * 0.12, ySuelo);
    ctx.scale(tamano, tamano);
    ctx.transform(1, 0, 0.55, -0.3, 0, 0);     // la sombra cae hacia el frente y un poco a la izquierda
    Pincel.silueta = `rgba(0, 0, 0, ${alfa * fuerza})`;
    dibujarCuerpo();
    Pincel.silueta = null;
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  dibujarCuerpo();
  ctx.restore();
}

// Sombra elíptica simple para objetos chicos
function sombraElipse(ctx, x, y, rx, ry, alfa = 0.3) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alfa})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}


/* ===== Herramientas de ilustración =====
 * pieza: forma con degradado lateral, bisel (luz en el borde de arriba a la izquierda, sombra en el
 * de abajo a la derecha) y contorno fino. Es lo que hace que cada parte parezca tener volumen.
 */
function pieza(ctx, trazar, color, x0, x1, opciones = {}) {
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  const g = ctx.createLinearGradient(x0, 0, Math.max(x1, x0 + 1), 0);
  g.addColorStop(0, ajustarColor(color, opciones.luz ?? 0.16));
  g.addColorStop(0.45, color);
  g.addColorStop(1, ajustarColor(color, -(opciones.sombra ?? 0.3)));
  ctx.fillStyle = g; ctx.fill();
  if (Pincel.bisel && opciones.bisel !== false) {
    ctx.save(); ctx.clip();
    ctx.translate(0.8, 0.9); ctx.beginPath(); trazar(ctx); ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 238, 210, 0.3)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.translate(-1.6, -1.8); ctx.beginPath(); trazar(ctx); ctx.closePath();
    ctx.strokeStyle = 'rgba(10, 6, 4, 0.28)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.restore();
  }
  if (opciones.contorno !== false) { ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.strokeStyle = 'rgba(18, 12, 9, 0.62)'; ctx.lineWidth = 0.8; ctx.stroke(); }
}
function detalle(ctx, color, trazar) {
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  ctx.fillStyle = tinta(color); ctx.fill();
}
function sombraInterna(ctx, trazar, alfa) {
  if (Pincel.silueta) return;
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  ctx.fillStyle = `rgba(20, 12, 8, ${alfa})`; ctx.fill();
}
function linea(ctx, color, ancho, puntos) {
  if (Pincel.silueta) return;
  ctx.beginPath(); puntos.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
const poli = puntos => c => puntos.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
const redondo = (x, y, w, h, r) => c => { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); };
const circulo = (x, y, r) => c => c.arc(x, y, r, 0, Math.PI * 2);
const elipse = (x, y, rx, ry, rot = 0) => c => c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
// Cuatro esquinas de un tramo (hueso) con grosor, para brazos y piernas
function segmento(x0, y0, x1, y1, grosor, grosorFin = grosor) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return [[x0 + nx * grosor / 2, y0 + ny * grosor / 2], [x1 + nx * grosorFin / 2, y1 + ny * grosorFin / 2], [x1 - nx * grosorFin / 2, y1 - ny * grosorFin / 2], [x0 - nx * grosor / 2, y0 - ny * grosor / 2]];
}

/* ===== Piezas de armas =====
 * Las armas son horizontales: la luz viene de arriba. parte() pinta una barra con esquinas apenas
 * redondeadas, degradado vertical, un brillo especular en el filo de arriba, veta si es madera y contorno.
 */
const MADERAS = new Set(['#7a4a2a', '#5a3a1e', '#6a3f1f', '#6b4a2b', '#4a2a1a']);
function parte(ctx, x, y, w, h, color, opciones = {}) {
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fillRect(x, y, w, h); return; }
  const r = Math.min(opciones.r ?? 0.8, h / 2, w / 2);
  ctx.beginPath(); redondo(x, y, w, h, r)(ctx); ctx.closePath();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, ajustarColor(color, 0.38)); g.addColorStop(0.22, ajustarColor(color, 0.1));
  g.addColorStop(0.6, color); g.addColorStop(1, ajustarColor(color, -0.45));
  ctx.fillStyle = g; ctx.fill();
  if (MADERAS.has(color) && h >= 2.5) {   // veta de la madera
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(30, 14, 6, 0.28)'; ctx.lineWidth = 0.45;
    for (let k = 1; k < h / 1.7; k++) { ctx.beginPath(); ctx.moveTo(x, y + k * 1.7); ctx.bezierCurveTo(x + w * 0.3, y + k * 1.7 - 0.7, x + w * 0.6, y + k * 1.7 + 0.7, x + w, y + k * 1.7); ctx.stroke(); }
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.24)'; ctx.fillRect(x + r, y + 0.35, Math.max(0, w - 2 * r), Math.max(0.5, Math.min(1, h * 0.14)));
  ctx.strokeStyle = 'rgba(8, 6, 6, 0.6)'; ctx.lineWidth = 0.55; ctx.stroke();
}

// Culata con caída: lomo casi recto, panza que baja hacia el talón y cantonera de goma
function culata(ctx, xFin, yArriba, largo, alto, color, caida = 2) {
  const x0 = xFin - largo;
  const trazar = c => { c.moveTo(xFin, yArriba); c.lineTo(x0, yArriba + caida); c.lineTo(x0, yArriba + caida + alto + 1.5); c.quadraticCurveTo(xFin - largo * 0.45, yArriba + alto + 0.5, xFin - largo * 0.18, yArriba + alto * 0.62); c.lineTo(xFin, yArriba + alto * 0.62); };
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  const g = ctx.createLinearGradient(0, yArriba, 0, yArriba + alto + caida);
  g.addColorStop(0, ajustarColor(color, 0.32)); g.addColorStop(0.3, color); g.addColorStop(1, ajustarColor(color, -0.45));
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  if (MADERAS.has(color)) {
    ctx.strokeStyle = 'rgba(30, 14, 6, 0.3)'; ctx.lineWidth = 0.45;
    for (let k = 1; k < 7; k++) { const yy = yArriba + k * (alto + caida) / 7; ctx.beginPath(); ctx.moveTo(xFin, yy - caida * 0.5); ctx.bezierCurveTo(xFin - largo * 0.4, yy, xFin - largo * 0.7, yy + 1, x0, yy + caida * 0.4); ctx.stroke(); }
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(x0, yArriba - 1, largo, 1.3);
  ctx.restore();
  ctx.fillStyle = '#1a1716'; ctx.fillRect(x0 - 1.2, yArriba + caida - 0.2, 1.8, alto + 1.9);   // cantonera
  ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.strokeStyle = 'rgba(8, 6, 6, 0.6)'; ctx.lineWidth = 0.55; ctx.stroke();
}
