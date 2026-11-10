/* ===== Armas a escala real =====
 * Cada arma se dibuja de perfil a partir de sus medidas reales en centímetros, con el origen (0, 0) en
 * la parte de arriba de la empuñadura (donde apoya la mano del gatillo), x hacia la boca y y hacia abajo.
 * CM pasa centímetros a unidades del juego: el personaje mide 80 unidades (1,80 m) y las armas se
 * agrandan un 35 % para que se lean bien en pantalla.
 * Los puntos de anclaje (mano de apoyo, cargador, corredera, expulsión, boca) también van en cm y se
 * convierten, así la animación de recarga cae en el lugar real de cada arma.
 */
const CM = 0.6;
const MAT = {
  pavonado: '#232429', acero: '#3a3c43', aleacion: '#30333a', polimero: '#1c1d20', inox: '#b6bac2', niquel: '#8d939c',
  madera: '#6e3f22', maderaClara: '#8c5a33', nogal: '#4e2b17', oliva: '#4a5532', fde: '#8f7a5c', goma: '#141414',
  laton: '#c9a227', cobre: '#b87333', rojo: '#9e2a22', violeta: '#4f3f72', verde: '#39ff14',
};
const MATES = new Set([MAT.polimero, MAT.goma, MAT.oliva, MAT.fde]);
const VETAS = new Set([MAT.madera, MAT.maderaClara, MAT.nogal]);

/* ---------- Formas (en cm) ---------- */
const Rc = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function RRc(x, y, w, h, r) {   // rectángulo con esquinas redondeadas, como polígono
  const p = [], esq = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of esq) for (let k = 0; k <= 3; k++) { const a = a0 + k * Math.PI / 6; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return p;
}
const Cc = (cx, cy, r, n = 18) => Array.from({ length: n }, (_, k) => [cx + Math.cos(k / n * Math.PI * 2) * r, cy + Math.sin(k / n * Math.PI * 2) * r]);

/* Pinta una pieza: degradado vertical (luz de arriba), brillo especular, veta si es madera, contorno.
 * opciones: huecos (polígonos que se recortan), mate (sin brillo), brillo (0..1) */
function pintar(ctx, pts, color, op = {}) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  for (const h of op.huecos || []) { h.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill('evenodd'); return; }
  let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
  for (const [x, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const mate = op.mate ?? MATES.has(color);
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, ajustarColor(color, mate ? 0.2 : 0.42)); g.addColorStop(0.22, ajustarColor(color, mate ? 0.06 : 0.12));
  g.addColorStop(0.6, color); g.addColorStop(1, ajustarColor(color, -0.5));
  ctx.fillStyle = g; ctx.fill('evenodd');
  ctx.save(); ctx.clip('evenodd');
  if (VETAS.has(color)) {
    ctx.strokeStyle = 'rgba(28, 12, 4, 0.32)'; ctx.lineWidth = 0.28;
    for (let yy = y0 + 0.7; yy < y1; yy += 0.95) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.bezierCurveTo(x0 + (x1 - x0) * 0.33, yy - 0.5, x0 + (x1 - x0) * 0.66, yy + 0.6, x1, yy + 0.1); ctx.stroke(); }
  }
  const brillo = op.brillo ?? (mate ? 0.1 : 0.3);
  if (brillo) { ctx.fillStyle = `rgba(255, 255, 255, ${brillo})`; ctx.fillRect(x0, y0 + 0.12, x1 - x0, Math.min(0.55, (y1 - y0) * 0.16)); }
  ctx.restore();
  // El contorno va sobre el borde de la pieza: se rehace el trazado, porque la veta lo reemplazó
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  for (const h of op.huecos || []) { h.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
  ctx.strokeStyle = 'rgba(8, 7, 7, 0.5)'; ctx.lineWidth = 0.2;   // contorno fino: las líneas de detalle van aparte
  ctx.lineJoin = 'round'; ctx.stroke();
}
// Detalles finos: ranuras, estrías, tornillos, rayas (sin volumen)
function trazo(ctx, color, ancho, pts) { if (Pincel.silueta) return; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = 'round'; ctx.stroke(); }
function rayas(ctx, x0, x1, y0, y1, paso, color = 'rgba(0,0,0,0.45)', ancho = 0.3) { for (let x = x0; x <= x1; x += paso) trazo(ctx, color, ancho, [[x, y0], [x, y1]]); }
function punto(ctx, x, y, r, color) { if (Pincel.silueta) return; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
// Guardamonte: aro abierto arriba
function guardamonteC(ctx, x0, x1, y, alto, color = MAT.pavonado) {
  if (Pincel.silueta) return;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 0.4, y + alto - 0.6); ctx.quadraticCurveTo(x0 + 0.8, y + alto, x0 + 2, y + alto);
  ctx.lineTo(x1 - 0.8, y + alto); ctx.quadraticCurveTo(x1, y + alto, x1, y + alto - 1); ctx.lineTo(x1, y);
  ctx.strokeStyle = color; ctx.lineWidth = 0.75; ctx.stroke();
  trazo(ctx, '#111', 0.55, [[x0 + 1.4, y + 0.2], [x0 + 1.0, y + alto * 0.7]]);   // cola del disparador
}
// Mira telescópica: tubo, campanas, torreta y anillas
function miraTelescopica(ctx, x0, x1, eje, diam, campana, anillas, base) {
  for (const ax of anillas) pintar(ctx, Rc(ax, eje + diam / 2 - 0.2, 1.6, base - eje - diam / 2 + 0.2), MAT.pavonado);
  pintar(ctx, [[x0, eje - campana * 0.42], [x0 + 4, eje - campana * 0.42], [x0 + 5.5, eje - diam / 2], [x1 - 7, eje - diam / 2], [x1 - 4, eje - campana / 2], [x1, eje - campana / 2], [x1, eje + campana / 2], [x1 - 4, eje + campana / 2], [x1 - 7, eje + diam / 2], [x0 + 5.5, eje + diam / 2], [x0 + 4, eje + campana * 0.42], [x0, eje + campana * 0.42]], MAT.pavonado);
  const mx = (x0 + x1) / 2 - 2;
  pintar(ctx, Rc(mx, eje - diam / 2 - 1.6, 2.6, 1.6), MAT.acero);
  if (!Pincel.silueta) { ctx.fillStyle = '#6fb7e8'; ctx.fillRect(x1 - 0.35, eje - campana / 2 + 0.6, 0.35, campana - 1.2); }
}

// Redondea las esquinas de un polígono (r en cm): cada vértice se reemplaza por una curva suave.
// Sirve para las armas de polímero moldeado, que no tienen aristas vivas.
function suave(pts, r = 1.2, pasos = 4) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[(i - 1 + n) % n], [x, y] = pts[i], [nx, ny] = pts[(i + 1) % n];
    const d1 = Math.hypot(x - px, y - py) || 1, d2 = Math.hypot(nx - x, ny - y) || 1;
    const k1 = Math.min(r, d1 / 2), k2 = Math.min(r, d2 / 2);
    const a = [x - (x - px) / d1 * k1, y - (y - py) / d1 * k1], b = [x + (nx - x) / d2 * k2, y + (ny - y) / d2 * k2];
    for (let k = 0; k <= pasos; k++) { const t = k / pasos, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * x + t * t * b[0], u * u * a[1] + 2 * u * t * y + t * t * b[1]]); }
  }
  return out;
}

/* ---------- Construcción de cada modelo ---------- */
const PISTOLA = { x: 19, y: -50 };   // las armas cortas se sostienen con los brazos estirados
const ancla = (x, y) => ({ x: x * CM, y: y * CM });
function modelo(definicion) {
  const { anclas, dibujarCm, ...resto } = definicion;
  const d = { ...resto };
  for (const [k, [x, y]] of Object.entries(anclas)) d[k] = ancla(x, y);
  d.dibujar = (ctx, e) => { ctx.save(); ctx.scale(CM, CM); dibujarCm(ctx, e); ctx.restore(); };
  return d;
}
// Empuñadura de pistola en ángulo: desde arriba (x0..x1 en y=0) hacia abajo y atrás
function empunadura(ctx, x0, x1, largo, angulo, color, op = {}) {
  const dx = Math.tan(angulo) * largo;
  const pts = [[x0, op.y ?? 0], [x1, op.y ?? 0], [x1 - dx + 0.3, largo], [x0 - dx - 0.4, largo + 0.2]];
  pintar(ctx, pts, color, op);
  return dx;
}

const MODELOS = {
  /* ===== Pistolas ===== */
  glock: modelo({ casquillo: 'pistola', origen: PISTOLA,
    anclas: { manoDelantera: [1.0, 5.2], cargador: [-4.4, 10.2], corredera: [-2.6, -2.0], expulsion: [5.5, -3.5], boca: [15.3, -2.0] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-3.6, -0.2], [1.2, 0.8], [-2.0, 10.2], [-6.8, 10.2], [-5.2, 3], [-3.9, 0.8]], MAT.polimero);                 // empuñadura a 20°
      rayas(ctx, -4.6, -2.2, 3.5, 8.6, 0.8, 'rgba(255,255,255,0.06)');
      pintar(ctx, [[-3, -0.6], [14.5, -0.6], [14.5, 0.6], [6.8, 0.7], [5.6, 1.0], [-3, 1.0]], MAT.polimero);                     // armazón con riel
      guardamonteC(ctx, 1.4, 6.6, 0.8, 2.8, MAT.polimero);
      if (!e.sinCargador) pintar(ctx, Rc(-7.0, 10.0, 5.1, 0.9), MAT.polimero);                                                  // base del cargador
      pintar(ctx, Rc(3, -2.9, 12.2, 1.8), MAT.acero);                                                                          // cañón: se ve cuando la corredera va atrás
      ctx.save(); ctx.translate(-e.corredera * 3.6, 0);
      pintar(ctx, RRc(-3.6, -3.5, 18.6, 3.0, 0.45), MAT.pavonado);                                                              // corredera
      rayas(ctx, -3.0, -0.6, -3.1, -0.9, 0.55);
      pintar(ctx, Rc(13.6, -4.1, 0.7, 0.7), MAT.acero); pintar(ctx, Rc(-3.0, -4.1, 1.2, 0.7), MAT.acero);                      // miras
      if (!Pincel.silueta) { ctx.fillStyle = '#0c0c0e'; ctx.fillRect(4.2, -3.5, 3.6, 0.9); }                                     // ventana de expulsión
      ctx.restore();
    } }),
  colt1911: modelo({ casquillo: 'pistola', origen: PISTOLA,
    anclas: { manoDelantera: [0.6, 5.0], cargador: [-4.4, 9.8], corredera: [1.6, -0.6], expulsion: [5, -3.3], boca: [17.6, -1.9] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-4.6, -0.2], [1.0, 0.8], [-1.6, 9.6], [-6.6, 9.6], [-6.2, 1.2], [-6.9, -0.5]], MAT.acero);                   // armazón y empuñadura a 18°
      pintar(ctx, [[-0.4, 2.0], [-1.8, 8.6], [-5.5, 8.6], [-4.6, 2.0]], MAT.madera);                                            // cachas de nogal
      punto(ctx, -2.6, 3.4, 0.35, '#888'); punto(ctx, -3.3, 7.4, 0.35, '#888');
      pintar(ctx, [[-4, -0.6], [11.5, -0.6], [11.5, 0.5], [6, 0.6], [5.2, 0.9], [-4, 0.9]], MAT.acero);
      guardamonteC(ctx, 1.2, 6.0, 0.7, 2.6, MAT.acero);
      if (!e.sinCargador) pintar(ctx, Rc(-6.8, 9.5, 5.0, 0.6), MAT.acero);
      pintar(ctx, [[-5.4, -2.6], [-4.2, -3.3], [-4.0, -1.8]], MAT.acero);                                                         // martillo
      pintar(ctx, Rc(0.8, -1.0, 2.2, 0.8), MAT.pavonado);                                                                       // retén de la corredera
      pintar(ctx, Rc(4, -2.7, 13.4, 1.7), MAT.acero);                                                                          // cañón
      ctx.save(); ctx.translate(-e.corredera * 3.8, 0);
      pintar(ctx, RRc(-4.5, -3.3, 21.5, 2.9, 0.3), MAT.acero);
      rayas(ctx, -4.0, -1.6, -3.0, -0.8, 0.45);
      pintar(ctx, Rc(15.6, -3.9, 0.6, 0.6), MAT.acero); pintar(ctx, Rc(-3.8, -3.9, 1.2, 0.6), MAT.acero);
      if (!Pincel.silueta) { ctx.fillStyle = '#0c0c0e'; ctx.fillRect(3.6, -3.3, 3.4, 0.8); }
      ctx.restore();
    } }),
  deagle: modelo({ casquillo: 'grande', origen: PISTOLA,
    anclas: { manoDelantera: [1.4, 5.6], cargador: [-5, 10.6], corredera: [-4, -2.6], expulsion: [6, -4.5], boca: [22.6, -2.6] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-4.4, -0.2], [1.6, 0.9], [-1.0, 10.6], [-7.2, 10.6], [-6.4, 2.4], [-4.8, 0.6]], MAT.polimero);
      rayas(ctx, -5.6, -2.2, 3.6, 9.4, 0.7, 'rgba(255,255,255,0.05)');
      pintar(ctx, [[-4.4, -0.6], [20.5, -0.6], [20.5, 0.8], [7.4, 1.0], [6.2, 1.3], [-4.4, 1.3]], MAT.niquel);
      guardamonteC(ctx, 1.6, 7.4, 1.0, 3.2, MAT.niquel);
      if (!e.sinCargador) pintar(ctx, Rc(-7.4, 10.4, 5.8, 0.9), MAT.niquel);
      ctx.save(); ctx.translate(-e.corredera * 4.2, 0);
      pintar(ctx, [[-5, -0.5], [-5, -3.8], [-4, -4.6], [21.6, -4.6], [22.4, -3.7], [22.4, -0.5]], MAT.niquel);                // corredera prismática
      pintar(ctx, Rc(3, -5.3, 18.5, 0.7), MAT.niquel);                                                                         // riel superior
      rayas(ctx, -4.4, -1.6, -4.0, -1.0, 0.55);
      if (!Pincel.silueta) { ctx.fillStyle = '#0c0c0e'; ctx.fillRect(4.6, -4.6, 4.2, 1.1); }
      ctx.restore();
    } }),
  magnum: modelo({ casquillo: null, casquilloVaciado: 'pistola', origen: PISTOLA,
    anclas: { manoDelantera: [1.4, 5.2], cargador: [2.2, -1.6], corredera: [5, 1.4], expulsion: [2, -2], boca: [21.3, -2.5] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-1.4, 0.6], [1.6, 1.2], [0.4, 5], [-1.6, 9.4], [-5.2, 9.2], [-5.4, 4], [-3.6, 0.6]], MAT.nogal);              // cacha de culata redonda
      pintar(ctx, [[-2.0, -3.8], [4.6, -3.8], [4.6, 0.8], [2.2, 1.5], [-1.4, 1.2], [-3.6, 0.6], [-3.0, -2.2]], MAT.inox);        // armazón
      guardamonteC(ctx, 1.0, 5.2, 1.0, 2.6, MAT.inox);
      pintar(ctx, [[-3.6, -3.4], [-2.0, -4.6], [-1.4, -3.4]], MAT.inox);                                                        // martillo
      pintar(ctx, [[4.6, -3.7], [21, -3.7], [21, -1.4], [11, -1.4], [10, 0.1], [4.6, 0.1]], MAT.inox);                         // cañón 6,5" con funda del expulsor
      pintar(ctx, [[19.4, -3.7], [20.6, -4.6], [20.9, -3.7]], MAT.inox);                                                       // guion
      ctx.save(); ctx.translate(-e.abierto * 1.5, e.abierto * 4.2);                                                              // el tambor se vuelca hacia abajo
      pintar(ctx, RRc(0.2, -4.0, 4.2, 4.3, 0.5), MAT.inox);
      if (e.abierto > 0.5) { for (let k = 0; k < 3; k++) punto(ctx, 1.0 + k * 1.3, -1.9, 0.45, '#16161a'); pintar(ctx, Rc(4.4, -2.2, 3.2, 0.6), MAT.inox); }
      else rayas(ctx, 0.9, 3.9, -3.6, -2.6, 1.0, 'rgba(0,0,0,0.35)');
      ctx.restore();
    } }),
  python: modelo({ casquillo: null, casquilloVaciado: 'pistola', origen: PISTOLA,
    anclas: { manoDelantera: [1.4, 5.2], cargador: [2.2, -1.6], corredera: [5, 1.4], expulsion: [2, -2], boca: [20.3, -2.4] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-1.4, 0.6], [1.8, 1.2], [0.8, 5.5], [-0.8, 9.8], [-5.6, 9.6], [-5.6, 4], [-3.6, 0.6]], MAT.nogal);
      rayas(ctx, -4.6, -1.4, 3.8, 8.2, 0.6, 'rgba(0,0,0,0.18)');
      pintar(ctx, [[-2.0, -3.8], [4.6, -3.8], [4.6, 0.8], [2.2, 1.5], [-1.4, 1.2], [-3.6, 0.6], [-3.0, -2.2]], MAT.pavonado);
      guardamonteC(ctx, 1.0, 5.2, 1.0, 2.6);
      pintar(ctx, [[-3.6, -3.4], [-2.0, -4.6], [-1.4, -3.4]], MAT.pavonado);
      pintar(ctx, [[4.6, -3.7], [20, -3.7], [20, 0.2], [4.6, 0.2]], MAT.pavonado);                                               // cañón de 6" con lomo completo
      pintar(ctx, Rc(4.6, -4.7, 15.4, 1.0), MAT.pavonado);                                                                      // costilla ventilada
      for (let k = 0; k < 6; k++) if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(6 + k * 2.3, -4.5, 1.4, 0.55); }
      ctx.save(); ctx.translate(-e.abierto * 1.5, e.abierto * 4.2);
      pintar(ctx, RRc(0.2, -4.0, 4.2, 4.3, 0.5), MAT.pavonado);
      if (e.abierto > 0.5) { for (let k = 0; k < 3; k++) punto(ctx, 1.0 + k * 1.3, -1.9, 0.45, '#0a0a0c'); pintar(ctx, Rc(4.4, -2.2, 3.2, 0.6), MAT.pavonado); }
      else rayas(ctx, 0.9, 3.9, -3.6, -2.6, 1.0, 'rgba(255,255,255,0.12)');
      ctx.restore();
    } }),
  mauser: modelo({ casquillo: 'pistola', origen: PISTOLA,
    anclas: { manoDelantera: [0.4, 5.0], cargador: [1.4, -3.4], corredera: [-2.4, -3.0], expulsion: [2, -3.4], boca: [24.3, -1.8] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-2.6, 0], [0.2, 0.4], [-0.4, 9.4], [-1.4, 10.4], [-4.4, 10.4], [-4.4, 9.2], [-3.8, 0.4]], MAT.nogal);      // empuñadura de mango de escoba
      rayas(ctx, -3.6, -0.8, 1.6, 8.8, 0.55, 'rgba(0,0,0,0.3)');
      pintar(ctx, [[-3.4, -3.0], [10, -3.0], [10, 0.1], [-3.4, 0.1]], MAT.pavonado);                                           // armazón
      pintar(ctx, [[1.6, 0], [8.4, 0], [8.0, 3.0], [2.0, 3.0]], MAT.pavonado);                                                  // depósito fijo delante del gatillo
      guardamonteC(ctx, -1.6, 1.4, 0.1, 2.4);
      pintar(ctx, Rc(10, -2.7, 14.3, 1.7), MAT.pavonado);                                                                       // cañón largo y fino
      pintar(ctx, Rc(5.4, -3.9, 4.2, 0.9), MAT.pavonado);                                                                       // alza tangente
      punto(ctx, -4.0, -3.2, 0.8, MAT.pavonado); punto(ctx, -4.0, -3.2, 0.35, '#666');                                          // martillo de anillo
      const ab = Math.max(e.corredera, e.abierto);
      ctx.save(); ctx.translate(-ab * 3.4, 0);
      pintar(ctx, Rc(-2.8, -3.8, 5.6, 1.1), MAT.acero); pintar(ctx, Rc(-3.2, -4.3, 1.0, 1.6), MAT.acero);                     // cerrojo con orejas
      ctx.restore();
      if (ab > 0.3 && !Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0.2, -3.0, 4.6, 0.8); }
    } }),

  /* ===== Metralletas ===== */
  uzi: modelo({ casquillo: 'pistola',
    anclas: { manoDelantera: [12, 1.2], cargador: [-0.4, 9], corredera: [5.5, -7.6], expulsion: [6, -6], boca: [26.3, -3.7] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-14, -1.0], [-16.4, -0.6], [-16.4, 1.4], [12, 1.4], [12, -0.2]], MAT.pavonado);                            // culata plegada debajo
      pintar(ctx, [[-2.6, -0.5], [2.4, -0.5], [1.6, 9.2], [-2.8, 9.2]], MAT.polimero);                                         // empuñadura con el cargador adentro
      rayas(ctx, -2.2, 1.2, 1.4, 8.4, 0.7, 'rgba(255,255,255,0.05)');
      if (!e.sinCargador) pintar(ctx, [[-2.3, 9.2], [1.4, 9.2], [1.2, 16.6], [-2.6, 16.6]], MAT.pavonado);
      guardamonteC(ctx, 2.6, 8.4, -0.5, 4.2, MAT.pavonado);
      pintar(ctx, RRc(-14, -7.2, 36, 6.7, 0.6), MAT.pavonado);                                                                  // cajón de chapa
      rayas(ctx, -9, 16, -6.9, -6.3, 2.2, 'rgba(0,0,0,0.5)', 0.35);                                                            // nervaduras de la tapa
      pintar(ctx, Rc(22, -4.8, 4.3, 2.2), MAT.acero); pintar(ctx, Rc(21.4, -5.4, 1.4, 3.4), MAT.acero);                        // tuerca y cañón
      pintar(ctx, [[17.2, -7.2], [17.6, -9.0], [18.2, -9.0], [18.6, -7.2]], MAT.pavonado);                                     // guion con orejas
      pintar(ctx, Rc(-10.6, -8.3, 1.8, 1.1), MAT.pavonado);
      pintar(ctx, RRc(4.2 - e.corredera * 5, -8.4, 2.8, 1.3, 0.4), MAT.acero);                                                // perilla de carga arriba
    } }),
  ak47: modelo({ casquillo: 'bala',
    anclas: { manoDelantera: [34, -4.6], cargador: [10, -2.2], corredera: [19, -5.2], expulsion: [14, -7], boca: [58.5, -5.9] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-5, -6.8], [-40, -3.6], [-40.8, -3.6], [-40.8, 9.0], [-40, 9.0], [-8, 1.2], [-5, -2.2]], MAT.madera);     // culata de madera con caída
      pintar(ctx, Rc(-41.2, -3.8, 0.9, 13), MAT.acero);                                                                         // cantonera de chapa
      pintar(ctx, [[-1, -2.2], [3, -2.2], [1.6, 8], [-2.6, 8], [-2.8, 0]], MAT.maderaClara);                                   // pistolete
      guardamonteC(ctx, 3.2, 9.2, -2.2, 3.2, MAT.acero);
      if (!e.sinCargador) {                                                                                                     // cargador curvo de 30
        pintar(ctx, [[7, -2.2], [12.6, -2.2], [14.8, 6], [18.4, 15.4], [13.4, 17.2], [10.2, 8], [7, 0]], MAT.acero);
        trazo(ctx, 'rgba(0,0,0,0.4)', 0.3, [[9.4, 1], [12.4, 9.6], [14.8, 15]]);
      }
      pintar(ctx, [[-5, -2.2], [-5, -6.8], [-3.2, -8], [26, -8], [26, -2.2]], MAT.pavonado);                                   // cajón y tapa
      trazo(ctx, 'rgba(255,255,255,0.12)', 0.25, [[2, -4.4], [20, -4.4]]);                                                     // palanca del seguro
      pintar(ctx, [[26, -8], [32, -9.2], [32, -7.2], [26, -6.6]], MAT.pavonado);                                               // bloque del alza
      pintar(ctx, [[27, -7.6], [46, -7.4], [46, -4.6], [44, -3.2], [28, -3.0], [27, -4]], MAT.madera);                          // guardamanos inferior
      pintar(ctx, [[28, -10.2], [44, -10.0], [44, -7.8], [28, -7.8]], MAT.madera);                                              // guardamanos sobre el tubo de gases
      pintar(ctx, Rc(44, -9.8, 3.4, 2.6), MAT.pavonado);                                                                        // bloque de gases
      pintar(ctx, Rc(44, -6.6, 12.4, 1.4), MAT.pavonado);                                                                       // cañón
      pintar(ctx, [[50.4, -6.6], [51, -10.2], [52.4, -10.2], [53, -6.6]], MAT.pavonado);                                      // guion
      pintar(ctx, [[56.4, -6.9], [58.6, -6.6], [58.6, -5.0], [56.4, -5.0]], MAT.acero);
      pintar(ctx, RRc(17.4 - e.corredera * 8, -5.9, 3.4, 1.4, 0.5), MAT.acero);                                               // manija de carga
    } }),
  m16: modelo({ casquillo: 'bala',
    anclas: { manoDelantera: [32, -1.4], cargador: [9.6, 3.6], corredera: [2, -4.6], expulsion: [10, -7], boca: [71, -5] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-4, -8], [-37, -7.6], [-38.4, -7.6], [-38.4, 3.6], [-30, 2.6], [-12, -1.2], [-4, -1.8]], MAT.polimero);   // culata recta
      pintar(ctx, Rc(-38.8, -7.8, 0.9, 11.6), MAT.goma);
      pintar(ctx, [[-0.6, 1], [3, 1], [1.4, 10], [-2.8, 10], [-2.6, 4]], MAT.polimero);                                        // pistolete
      rayas(ctx, -1.8, 1.2, 3, 9, 0.9, 'rgba(255,255,255,0.05)');
      pintar(ctx, [[-4, -4.2], [14, -4.2], [14, 4.2], [6, 4.2], [4.4, 1.2], [-4, 1.2]], MAT.aleacion);                         // cajón inferior con alimentador
      guardamonteC(ctx, 3.2, 10, 1.2, 2.6, MAT.aleacion);
      if (!e.sinCargador) pintar(ctx, [[6.6, 4], [12.6, 4], [14.6, 16.4], [8.6, 17.4]], MAT.aleacion);                         // cargador recto de 30
      pintar(ctx, [[-4, -8.2], [19, -8.2], [19, -4.2], [-4, -4.2]], MAT.aleacion);                                             // cajón superior
      pintar(ctx, [[-2, -8.2], [-1.4, -13], [13, -13], [14, -8.2], [11.6, -8.2], [11, -11.6], [1, -11.6], [0.6, -8.2]], MAT.aleacion);   // asa de transporte
      pintar(ctx, Rc(-1.6, -14.4, 2.6, 1.6), MAT.aleacion);                                                                    // alza de tambor
      pintar(ctx, Rc(2.4, -5.4, 2.6, 1.4), MAT.pavonado);                                                                       // retén del cerrojo
      pintar(ctx, [[19, -8.4], [20.6, -8.4], [20.6, -1.3], [19, -1.3]], MAT.acero);                                            // anillo delta
      pintar(ctx, [[20.6, -8], [46, -7.4], [48, -6.6], [48, -2.4], [46, -1.8], [20.6, -1.4]], MAT.polimero);                    // guardamanos redondo
      rayas(ctx, 23, 45, -7.2, -2.0, 1.5, 'rgba(255,255,255,0.08)');
      pintar(ctx, Rc(48, -5.6, 19.6, 1.2), MAT.pavonado);                                                                       // cañón
      pintar(ctx, [[53.6, -4.4], [54.6, -12.4], [55.6, -12.4], [56.6, -4.4]], MAT.pavonado);                                  // poste del guion
      pintar(ctx, Rc(67.4, -6.0, 3.8, 2.2), MAT.pavonado); rayas(ctx, 68.4, 70.6, -5.8, -4.6, 0.7, '#000', 0.25);              // apagallamas
      pintar(ctx, [[-5.6 - e.corredera * 6, -8.8], [-2.4 - e.corredera * 6, -8.8], [-2.4 - e.corredera * 6, -8.0], [-5.6 - e.corredera * 6, -8.0]], MAT.aleacion);   // manija en T
    } }),
  mp5: modelo({ casquillo: 'pistola',
    anclas: { manoDelantera: [29, -1.8], cargador: [9, -1.5], corredera: [29, -8.8], expulsion: [12, -7.5], boca: [45.5, -4.3] },
    dibujarCm(ctx, e) {
      pintar(ctx, Rc(-24, -7.6, 20, 0.8), MAT.acero); pintar(ctx, Rc(-24, -3.6, 20, 0.8), MAT.acero);                         // culata retráctil: dos varillas
      pintar(ctx, RRc(-26.4, -9.2, 2.6, 8.8, 0.6), MAT.polimero);                                                               // cantonera
      pintar(ctx, [[-1, 1], [3, 1], [1.8, 10], [-2.4, 10], [-2.4, 4]], MAT.polimero);
      pintar(ctx, [[-4, -1.6], [9, -1.6], [9, 0.6], [7.8, 3.2], [1.8, 3.2], [1, 1], [-4, 1]], MAT.polimero);                   // caja de mecanismos y guardamonte
      if (!e.sinCargador) pintar(ctx, [[7, -1.5], [11, -1.5], [13.6, 6], [16.6, 13.4], [13, 14.6], [10.2, 7], [7, 1]], MAT.pavonado);   // cargador curvo
      pintar(ctx, RRc(-4, -8.2, 30.5, 6.8, 0.5), MAT.pavonado);                                                                 // cajón de chapa
      rayas(ctx, 2, 20, -7.8, -6.8, 3, 'rgba(0,0,0,0.5)', 0.4);
      pintar(ctx, Rc(26, -8.2, 12, 2.6), MAT.pavonado);                                                                         // tubo de la manija
      pintar(ctx, [[21, -5.6], [36, -5.4], [37.4, -3.6], [36, -1.0], [22, -0.8]], MAT.polimero);                               // guardamanos abultado
      pintar(ctx, Rc(37.6, -5.0, 7.8, 1.4), MAT.pavonado); pintar(ctx, Rc(43.4, -5.4, 2.2, 2.2), MAT.acero);
      pintar(ctx, [[35.2, -8.2], [35.2, -10.6], [37.6, -10.6], [37.6, -8.2]], MAT.pavonado);                                  // guion encapuchado
      pintar(ctx, RRc(-2.6, -10.4, 3.4, 2.4, 1.1), MAT.pavonado);                                                              // alza de tambor
      ctx.save(); ctx.translate(-e.corredera * 2.4, -e.corredera * 1.4);                                                        // manija: arriba y atrás cuando está trabada
      pintar(ctx, RRc(28.4, -9.8, 2.2, 1.6, 0.6), MAT.acero); ctx.restore();
    } }),
  /* FN P90 (50,5 cm de largo, ~14 cm de alto sin el visor), medida sobre fotos de perfil:
   *  - cuerpo bullpup recto y alto, culata trasera cuadrada, canto superior plano con el cargador al ras;
   *  - abajo dos aberturas: la trasera, grande y en gota, para el pulgar; la delantera, redondeada, con el
   *    disparador en su borde de atrás; entre las dos, la empuñadura casi vertical;
   *  - la panza tiene dos lóbulos con una muesca debajo de la empuñadura; el lóbulo de adelante (donde apoya
   *    la otra mano) termina en un frente vertical bajo el cañón;
   *  - ranura larga de la manija de carga a lo largo del costado, visor alto adelante y cañón a media altura. */
  p90: modelo({ casquillo: 'pistola',
    anclas: { manoDelantera: [12.6, 4.4], cargador: [-4, -5.8], corredera: [12, -2.4], expulsion: [1.6, 8.2], boca: [21.2, -1.2] },
    dibujarCm(ctx, e) {
      const CUERPO = '#26272b', OSCURO = '#141517', RANURA = '#09090a';
      const cuerpo = suave([[-29.4, -5.4], [-12, -5.4], [17.4, -5.4], [17.7, -4.4], [17.7, 0.2], [16.6, 0.7], [15.9, 1.8], [15.9, 7.4], [14.8, 8.7], [5.2, 8.8],
        [3.4, 8.4], [2.4, 7.8], [0.8, 7.8], [-0.4, 8.5], [-3, 9.0], [-8, 8.9], [-11.4, 8.3], [-28.2, 8.3], [-30.2, 7.2], [-30.4, -4.2]], 1.0, 4);
      pintar(ctx, cuerpo, CUERPO, {
        mate: true, brillo: 0.14,
        huecos: [
          suave([[-1.2, 0.9], [0.4, 4.4], [1.0, 6.6], [-0.6, 6.9], [-7.4, 6.5], [-9.8, 4.8], [-10.0, 2.2], [-8.4, 0.9]], 1.8, 6),   // hueco del pulgar: gota que baja en punta hacia adelante
          suave([[2.9, 0.9], [8.6, 0.9], [9.9, 2.4], [9.7, 5.2], [8.2, 6.4], [4.2, 6.4], [3.4, 5.2]], 2.0, 6),         // abertura del disparador
        ] });
      // Juntas del moldeado: la línea que separa la parte de arriba (cajón) de la de abajo, y la de la cantonera
      trazo(ctx, 'rgba(0,0,0,0.55)', 0.3, [[-29.6, -0.2], [-10.4, -0.2]]); trazo(ctx, 'rgba(0,0,0,0.55)', 0.3, [[9.8, -0.2], [17.5, -0.2]]);
      trazo(ctx, 'rgba(255,255,255,0.07)', 0.3, [[-29.6, 0.1], [-10.4, 0.1]]);
      trazo(ctx, 'rgba(0,0,0,0.5)', 0.3, [[-28.8, -5.2], [-28.8, 8.1]]);
      // Ranura larga de la manija de carga, con la manija adelante (corre hacia atrás al cargar)
      pintar(ctx, RRc(-14, -2.9, 29.6, 0.9, 0.45), RANURA, { mate: true, brillo: 0 });
      pintar(ctx, RRc(11.2 - e.corredera * 4, -3.4, 2.6, 1.9, 0.6), OSCURO);
      // Tornillos y pasadores
      for (const [x, y] of [[-26.4, 2.4], [-18, 5.8], [-13.2, 3.6], [-4, 8.0], [6.2, 7.6], [12.8, 7.6], [14.6, -3.9], [-22, -3.9]]) {
        punto(ctx, x, y, 0.42, '#3b3c41'); punto(ctx, x - 0.1, y - 0.1, 0.18, 'rgba(255,255,255,0.18)');
      }
      // Estrías de la empuñadura y ventana de expulsión hacia abajo (detrás de la empuñadura)
      for (const y of [2.4, 3.6, 4.8]) trazo(ctx, 'rgba(255,255,255,0.07)', 0.3, [[0.6 + y * 0.06, y], [2.4 + y * 0.12, y]]);
      if (!Pincel.silueta) { ctx.fillStyle = RANURA; ctx.fillRect(0.4, 8.0, 2.2, 0.5); }
      // Disparador en el borde trasero de la abertura delantera y selector de disco debajo
      pintar(ctx, [[3.2, 0.9], [4.3, 0.9], [4.6, 2.8], [3.9, 3.9], [3.3, 2.8]], '#8e1f1a');
      pintar(ctx, Cc(5.4, 7.5, 0.75, 12), OSCURO);
      // Cargador de 50 al ras del techo: banda traslúcida con los cartuchos atravesados a la vista
      if (!e.sinCargador) {
        pintar(ctx, RRc(-18.4, -5.8, 27.4, 2.9, 0.5), '#3e423f', { brillo: 0.4 });   // humo traslúcido
        if (!Pincel.silueta) {
          ctx.save(); ctx.beginPath(); ctx.rect(-17.8, -5.4, 26.2, 2.1); ctx.clip();
          for (let k = 0; k < 19; k++) { const x = -17.4 + k * 1.4; ctx.fillStyle = 'rgba(190,150,50,0.42)'; ctx.fillRect(x, -5.2, 0.8, 1.8); ctx.fillStyle = 'rgba(90,65,25,0.6)'; ctx.fillRect(x, -5.2, 0.8, 0.35); }
          ctx.restore();
        }
        pintar(ctx, RRc(-19.6, -5.9, 1.6, 2.6, 0.4), OSCURO);                                                              // retén del cargador
      } else if (!Pincel.silueta) { ctx.fillStyle = RANURA; ctx.fillRect(-18.4, -5.6, 27.4, 1.0); }                        // canal vacío
      // Visor integrado: caja alta adelante con la trasera inclinada, ventana y lente
      pintar(ctx, suave([[3.4, -5.4], [5.4, -9.4], [6.8, -10.2], [15.8, -10.2], [17.2, -9], [17.2, -5.4]], 0.7, 3), CUERPO, { mate: true, brillo: 0.22 });
      trazo(ctx, 'rgba(255,255,255,0.08)', 0.3, [[6.6, -9.6], [15.6, -9.6]]);
      pintar(ctx, RRc(7.2, -8.7, 7.4, 2.0, 0.5), RANURA, { mate: true, brillo: 0 });                                     // ventana lateral
      if (!Pincel.silueta) {
        ctx.fillStyle = 'rgba(80,130,160,0.55)'; ctx.fillRect(7.6, -8.4, 6.6, 1.4);
        ctx.fillStyle = '#4a86a8'; ctx.beginPath(); ctx.ellipse(17.1, -7.6, 0.35, 1.3, 0, 0, Math.PI * 2); ctx.fill();
      }
      for (const x of [5.4, 15.4]) pintar(ctx, Rc(x, -11.0, 1.0, 0.9), OSCURO);                                             // miras de emergencia
      // Cañón: collar y apagallamas ranurado que asoman por el frente, a media altura
      pintar(ctx, Rc(17.6, -2.1, 1.0, 1.8), OSCURO);
      pintar(ctx, RRc(18.4, -2.2, 3.0, 2.0, 0.5), MAT.pavonado);
      rayas(ctx, 19.0, 20.8, -2.0, -0.4, 0.6, 'rgba(0,0,0,0.65)', 0.22);
      // Anilla para la correa en la culata
      if (!Pincel.silueta) { ctx.beginPath(); ctx.ellipse(-27.4, -3.6, 0.8, 1.1, 0, 0, Math.PI * 2); ctx.strokeStyle = '#46474c'; ctx.lineWidth = 0.32; ctx.stroke(); }
    } }),

  /* ===== Rifles ===== */
  remington700: modelo({ casquillo: 'bala',
    anclas: { manoDelantera: [30, -0.6], cargador: [10, -6.6], corredera: [-1.4, -1.6], expulsion: [9, -6.5], boca: [66.3, -5.2] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-42, -6.2], [-10, -5.4], [-4, -4.0], [19, -3.6], [46, -3.2], [47.6, -1.6], [46, 0.6], [16, 1.2], [9, 1.4], [3.6, 1.6], [0.6, 7.4], [-3.2, 7.8], [-5.2, 3.6], [-14, 3.8], [-42, 7.6]], MAT.nogal);   // culata de una pieza
      pintar(ctx, Rc(-43, -6.4, 1.1, 14.2), MAT.goma);
      pintar(ctx, Rc(9, 0.8, 7.4, 0.7), MAT.pavonado);                                                                          // chapa del depósito
      guardamonteC(ctx, 3.0, 9.0, 1.4, 2.4);
      pintar(ctx, RRc(-4, -6.8, 23, 3.2, 1.4), MAT.pavonado);                                                                   // cajón redondo
      pintar(ctx, RRc(-7.4, -6.4, 3.6, 2.4, 0.9), MAT.pavonado);
      pintar(ctx, [[19, -6.3], [66, -5.8], [66, -4.6], [19, -4.1]], MAT.pavonado);                                              // cañón cónico
      miraTelescopica(ctx, -7, 28, -10.4, 2.5, 4.4, [0, 15.4], -6.8);
      const ab = Math.max(e.corredera, e.abierto);
      if (ab > 0.3 && !Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(6, -6.6, 6.5, 1.2); }
      ctx.save(); ctx.translate(-ab * 8.5, 0);
      trazo(ctx, MAT.acero, 0.9, [[1.2, -5.0], [-0.6, -2.2]]); punto(ctx, -1.2, -1.6, 0.95, '#4a4c52');                       // manija del cerrojo con bolita
      ctx.restore();
    } }),
  barrett: modelo({ casquillo: 'grande',
    anclas: { manoDelantera: [27, -3.4], cargador: [10, 1], corredera: [10, -8.2], expulsion: [14, -11], boca: [104.5, -8.2] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-12, -11.6], [-40, -11.6], [-41, -10.4], [-41, 5.4], [-36, 6.2], [-30, 1.6], [-12, -1.2]], MAT.pavonado);   // culata con cantonera alta
      pintar(ctx, Rc(-42.4, -11.8, 1.6, 17.6), MAT.goma);
      pintar(ctx, [[-0.6, 1], [3.6, 1], [2.2, 10.4], [-2.6, 10.4], [-2.4, 4]], MAT.polimero);
      guardamonteC(ctx, 3.6, 9.4, 1.0, 2.8);
      if (!e.sinCargador) pintar(ctx, RRc(5.6, 0.6, 9.6, 12.2, 0.6), MAT.pavonado);                                           // cargador de 10 (.50)
      pintar(ctx, [[-12, -5.6], [20, -5.6], [20, 1.2], [-12, 1.2]], MAT.pavonado);                                             // cajón inferior
      pintar(ctx, RRc(-10, -12, 56, 6.6, 0.6), MAT.pavonado);                                                                   // cajón superior
      rayas(ctx, 26, 44, -11.4, -6.4, 2.4, 'rgba(255,255,255,0.08)', 0.5);
      pintar(ctx, [[46, -10.2], [95, -10.0], [95, -6.6], [46, -6.4]], MAT.pavonado);                                           // cañón estriado
      rayas(ctx, 50, 92, -9.6, -7.0, 3, 'rgba(0,0,0,0.0)'); trazo(ctx, 'rgba(0,0,0,0.5)', 0.4, [[48, -8.3], [93, -8.3]]);
      pintar(ctx, RRc(95, -11.2, 9.6, 6, 0.8), MAT.acero);                                                                     // freno de boca
      if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; for (let k = 0; k < 3; k++) ctx.fillRect(96.6 + k * 2.6, -10.4, 1.2, 4.4); }
      trazo(ctx, MAT.pavonado, 1.2, [[44, -6], [36, 13]]); trazo(ctx, MAT.pavonado, 1.2, [[46, -6], [52, 13]]);                // bípode desplegado
      miraTelescopica(ctx, -6, 26, -17, 3.4, 5.6, [0, 16], -12);
      pintar(ctx, RRc(8 - e.corredera * 9, -9.2, 4, 1.6, 0.6), MAT.acero);
    } }),
  mosin: modelo({ casquillo: 'bala',
    anclas: { manoDelantera: [36, -1.4], cargador: [8, -7], corredera: [0, -1.2], expulsion: [8, -6.6], boca: [85.5, -5.8] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-38, -5.6], [-6, -4.6], [-2, -3.8], [18, -3.6], [66, -3.4], [67.4, -1.8], [66, -0.4], [18, 0.6], [14, 2.4], [4, 2.6], [1, 1.2], [-3, 2.2], [-8, 2.6], [-38, 8.0]], MAT.maderaClara);   // culata de cuello recto
      pintar(ctx, Rc(-39, -5.8, 1.0, 14), MAT.acero);
      pintar(ctx, Rc(3, 0.6, 11, 2.8), MAT.pavonado);                                                                           // depósito de 5
      guardamonteC(ctx, 1.6, 8.0, 0.6, 2.4);
      pintar(ctx, [[-2, -6.8], [18, -6.8], [18, -3.6], [-2, -3.6]], MAT.pavonado);                                             // cajón hexagonal
      pintar(ctx, [[20, -7.0], [60, -6.8], [60, -6.0], [20, -6.0]], MAT.maderaClara);                                          // guardamanos superior
      pintar(ctx, Rc(18, -6.6, 67.4, 1.6), MAT.pavonado);                                                                       // cañón largo
      for (const bx of [34, 59]) pintar(ctx, Rc(bx, -7.2, 1.2, 4.4), MAT.pavonado);                                            // abrazaderas
      pintar(ctx, Rc(21, -8.0, 5, 1.2), MAT.pavonado);                                                                          // alza
      pintar(ctx, [[82.6, -6.6], [82.6, -8.6], [84.6, -8.6], [84.6, -6.6]], MAT.pavonado);                                    // guion con capuchón
      const ab = Math.max(e.corredera, e.abierto);
      if (ab > 0.3 && !Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(4, -6.8, 7, 1.2); }
      ctx.save(); ctx.translate(-ab * 10, 0);
      pintar(ctx, RRc(-6.2, -6.4, 4.6, 2.4, 1), MAT.acero);                                                                     // perilla de amartillar
      trazo(ctx, MAT.acero, 0.85, [[0.4, -5.2], [0.2, -1.4]]); punto(ctx, 0.2, -1.0, 0.9, '#4a4c52');                         // manija recta
      ctx.restore();
    } }),
  winchester1894: modelo({ casquillo: 'bala',
    anclas: { manoDelantera: [28, -1.4], cargador: [11, -0.2], corredera: [-8, 4], expulsion: [9, -5.6], boca: [63.3, -4.2] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-37, -5.6], [-4, -4.2], [0, -4.4], [0, 1.4], [-6, 1.8], [-37, 8.2]], MAT.maderaClara);                     // culata de cuello recto
      pintar(ctx, [[-37.8, -5.8], [-37, -5.8], [-37, 8.4], [-37.8, 8.0], [-38.4, 1.2]], MAT.acero);                            // cantonera de media luna
      pintar(ctx, [[0, -5.6], [17, -5.6], [17, 0.8], [15.6, 2], [0, 2]], MAT.pavonado);                                       // cajón
      if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(9, -1.2, 4, 1.4); }                                         // ventana de carga
      pintar(ctx, [[-1.4, -5.0], [-2.6, -7.0], [-0.4, -6.8], [0.6, -5.2]], MAT.pavonado);                                    // martillo
      pintar(ctx, Rc(17, -5.0, 46.3, 1.6), MAT.pavonado);                                                                       // cañón
      pintar(ctx, Rc(17, -3.2, 41, 1.6), MAT.pavonado);                                                                         // tubo de balas
      pintar(ctx, [[17, -3.4], [38, -3.4], [38.6, -2.0], [38, -0.8], [17, -0.6]], MAT.maderaClara);                           // guardamanos
      for (const bx of [38.4, 56.4]) pintar(ctx, Rc(bx, -5.2, 1.0, 3.8), MAT.pavonado);
      pintar(ctx, Rc(60.6, -6.0, 1.0, 1.0), MAT.pavonado);
      ctx.save(); ctx.translate(13, 1.6); ctx.rotate(e.palanca * 0.95);                                                         // palanca: gira sobre su eje delantero
      if (!Pincel.silueta) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13, 0.4); ctx.quadraticCurveTo(-16, 0.6, -15.4, 3.4); ctx.quadraticCurveTo(-14.6, 6.4, -10, 6.2); ctx.quadraticCurveTo(-6, 6, -5.6, 2.6); ctx.strokeStyle = MAT.pavonado; ctx.lineWidth = 1.1; ctx.stroke(); }
      else { ctx.fillStyle = Pincel.silueta; ctx.fillRect(-15, 0, 13, 6); }
      ctx.restore();
    } }),

  /* ===== Escopetas ===== */
  recortada: modelo({ casquillo: null, casquilloVaciado: 'escopeta',
    anclas: { manoDelantera: [14, 0.6], cargador: [7.4, -3.2], corredera: [-0.5, -5.6], expulsion: [7, -3], boca: [37.4, -3.0] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-15, -4.6], [-2, -4.0], [0, -3.8], [0, 1.5], [-1.5, 1.8], [-3, 8.5], [-7, 8.8], [-8, 3.0], [-15, 4.6]], MAT.nogal);   // culata recortada a pistolete
      pintar(ctx, [[0, -5.2], [8, -5.2], [8, 0.6], [6.4, 1.8], [0, 1.8]], MAT.acero);                                          // báscula
      pintar(ctx, [[-1, -5.8], [2.4, -5.8], [2.4, -5.2], [-1, -5.2]], MAT.acero);                                             // palanca de apertura
      guardamonteC(ctx, 1.4, 6.4, 1.8, 2.4);
      ctx.save(); ctx.translate(7.6, 0.6); ctx.rotate(e.abierto * 0.6); ctx.translate(-7.6, -0.6);                             // los caños se quiebran hacia abajo
      pintar(ctx, RRc(7.2, -5.3, 30.2, 2.3, 1.1), MAT.pavonado); pintar(ctx, RRc(7.2, -3.0, 30.2, 2.3, 1.1), MAT.pavonado);   // dos caños
      pintar(ctx, Rc(7.2, -5.8, 30, 0.5), MAT.pavonado);                                                                       // banda
      pintar(ctx, [[8.6, -0.8], [21, -0.8], [21.6, 0.4], [20, 1.4], [8.6, 1.4]], MAT.nogal);                                  // delantera
      punto(ctx, 36.6, -6.0, 0.35, '#d8d8d8');
      if (e.abierto > 0.5) { punto(ctx, 7.6, -4.15, 0.75, '#0a0a0c'); punto(ctx, 7.6, -1.85, 0.75, '#0a0a0c'); }            // recámaras a la vista
      ctx.restore();
    } }),
  mossberg: modelo({ casquillo: 'escopeta',
    anclas: { manoDelantera: [34, -2.4], cargador: [12, 1.4], corredera: [34, -2.6], expulsion: [10, -5], boca: [67.3, -5.0] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-36, -5.2], [-4, -4.2], [0, -4.6], [0, 1.4], [-2, 2], [-5, 2.4], [-36, 8.2]], MAT.polimero);
      pintar(ctx, Rc(-37, -5.4, 1.1, 13.8), MAT.goma);
      pintar(ctx, [[0, -6.2], [20.6, -6.2], [20.6, 1.4], [0, 1.4]], MAT.aleacion);                                            // cajón de aluminio
      if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(6, -5.4, 7, 1.6); ctx.fillRect(6, 1.0, 11, 0.5); }        // ventana de expulsión y puerto de carga
      guardamonteC(ctx, 1.2, 8.0, 1.4, 2.4, MAT.polimero);
      pintar(ctx, Rc(20.6, -5.8, 46.7, 1.6), MAT.pavonado);                                                                     // cañón
      punto(ctx, 66.6, -6.4, 0.4, '#d8d8d8');
      pintar(ctx, Rc(20.6, -3.8, 36, 2.4), MAT.pavonado); pintar(ctx, Rc(56.6, -4.0, 1.8, 2.8), MAT.acero);                  // tubo y tapa
      ctx.save(); ctx.translate(-e.bombeo * 9, 0);
      pintar(ctx, RRc(25, -4.6, 19.6, 4.4, 1.2), MAT.polimero);                                                                 // bomba
      rayas(ctx, 27, 42, -4.2, -0.6, 1.3, 'rgba(255,255,255,0.08)', 0.45);
      ctx.restore();
    } }),
  spas12: modelo({ casquillo: 'escopeta',
    anclas: { manoDelantera: [33, -2.4], cargador: [11, 1.5], corredera: [33, -2.6], expulsion: [11, -6.5], boca: [60.5, -5.6] },
    dibujarCm(ctx, e) {
      pintar(ctx, Rc(-30, -6.8, 30, 1.0), MAT.pavonado); trazo(ctx, MAT.pavonado, 1.0, [[-29.4, 4.2], [-3, 0.6]]);              // culata de varillas
      pintar(ctx, [[-31.6, -8.2], [-29.4, -8.2], [-29.4, 5.4], [-31.6, 5.0]], MAT.pavonado);
      pintar(ctx, [[-0.6, 1.4], [3.4, 1.4], [2.0, 10.6], [-2.6, 10.6], [-2.4, 4]], MAT.polimero);
      pintar(ctx, [[-2, -7], [22, -7], [22, 1.6], [-2, 1.6]], MAT.pavonado);
      guardamonteC(ctx, 3.4, 9.2, 1.6, 2.6);
      pintar(ctx, Rc(22, -6.4, 38, 1.6), MAT.pavonado);                                                                         // cañón
      pintar(ctx, RRc(22, -8.2, 34, 4.0, 1.4), MAT.pavonado, { huecos: Array.from({ length: 8 }, (_, k) => Cc(25 + k * 4, -6.2, 0.9, 10)) });   // protector perforado
      pintar(ctx, Rc(22, -4.0, 32, 2.4), MAT.pavonado);
      pintar(ctx, [[57.2, -6.4], [57.6, -8.4], [58.6, -8.4], [59, -6.4]], MAT.pavonado);
      ctx.save(); ctx.translate(-e.bombeo * 8, 0);
      pintar(ctx, RRc(25, -4.8, 17, 4.6, 1.0), MAT.polimero); rayas(ctx, 27, 40, -4.4, -0.6, 1.6, 'rgba(255,255,255,0.08)', 0.5);
      ctx.restore();
    } }),
  aa12: modelo({ casquillo: 'escopeta',
    anclas: { manoDelantera: [40, -2], cargador: [9, 1], corredera: [0, -6.8], expulsion: [16, -7], boca: [62.4, -4.8] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-36, -8], [30, -8], [30, 0], [14, 0], [12.6, 2.4], [4.4, 2.4], [2, 0], [-6, 0], [-36, 3.6]], MAT.pavonado);  // cajón y culata en línea
      pintar(ctx, Rc(-37.2, -8.4, 1.4, 12.4), MAT.goma);
      pintar(ctx, [[-0.6, 0], [3.4, 0], [2.0, 9.6], [-2.6, 9.6], [-2.4, 3]], MAT.polimero);
      guardamonteC(ctx, 3.4, 9.2, 0, 2.6);
      if (!e.sinCargador) { pintar(ctx, Cc(9, 10.4, 8.6, 28), MAT.polimero); punto(ctx, 9, 10.4, 2.0, '#2a2c30'); }            // tambor de 20
      pintar(ctx, [[4, -11.2], [24, -11.2], [24, -8], [21, -8], [21, -10], [7, -10], [7, -8], [4, -8]], MAT.pavonado);        // asa
      pintar(ctx, RRc(30, -7.0, 28, 4.6, 0.8), MAT.pavonado, { huecos: Array.from({ length: 6 }, (_, k) => RRc(32.6 + k * 4.2, -6.2, 2.4, 1.2, 0.5)) });   // camisa con ventilaciones
      pintar(ctx, Rc(58, -5.6, 4.4, 1.6), MAT.acero);
      pintar(ctx, RRc(-2 - e.corredera * 6, -7.6, 4, 1.4, 0.5), MAT.acero);
    } }),
  saiga: modelo({ casquillo: 'escopeta',
    anclas: { manoDelantera: [36, -4.6], cargador: [10, -2.2], corredera: [19, -5.2], expulsion: [14, -7], boca: [64.5, -5.9] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-5, -6.8], [-38, -4.0], [-38.8, -4.0], [-38.8, 8.6], [-38, 8.6], [-8, 1.2], [-5, -2.2]], MAT.polimero);
      pintar(ctx, [[-1, -2.2], [3, -2.2], [1.6, 8], [-2.6, 8], [-2.8, 0]], MAT.polimero);
      guardamonteC(ctx, 3.2, 9.2, -2.2, 3.2, MAT.acero);
      if (!e.sinCargador) pintar(ctx, [[6.8, -2.2], [14, -2.2], [15.2, 12], [7.8, 12.8]], MAT.polimero);                        // cargador recto de 8 cartuchos
      pintar(ctx, [[-5, -2.2], [-5, -6.8], [-3.2, -8], [26, -8], [26, -2.2]], MAT.pavonado);
      pintar(ctx, [[27, -7.6], [46, -7.4], [46, -4.6], [44, -3.2], [28, -3.0], [27, -4]], MAT.polimero);
      pintar(ctx, [[28, -10.2], [44, -10.0], [44, -7.8], [28, -7.8]], MAT.polimero);
      pintar(ctx, Rc(44, -9.8, 3.4, 2.6), MAT.pavonado);
      pintar(ctx, Rc(44, -7.0, 20.5, 2.2), MAT.pavonado);                                                                       // cañón de calibre 12
      pintar(ctx, [[60.4, -7.0], [61, -9.8], [62.2, -9.8], [62.8, -7.0]], MAT.pavonado);
      pintar(ctx, RRc(17.4 - e.corredera * 8, -5.9, 3.4, 1.4, 0.5), MAT.acero);
    } }),
  winchester1887: modelo({ casquillo: 'escopeta',
    anclas: { manoDelantera: [30, -1.8], cargador: [14, -1], corredera: [-6, 4], expulsion: [10, -7], boca: [71.4, -5.5] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-36, -6.0], [-4, -5.0], [0, -5.0], [0, 2.0], [-6, 2.4], [-36, 8.6]], MAT.madera);
      pintar(ctx, Rc(-37, -6.2, 1.1, 15), MAT.acero);
      pintar(ctx, [[0, -5.4], [2.2, -7.2], [6, -7.6], [21, -7.6], [21, 2.6], [0, 2.6]], MAT.pavonado);                          // cajón grande con la culata del bloque redondeada
      if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(11, -1.8, 5, 1.6); }
      pintar(ctx, [[-1, -6.6], [-2.4, -8.6], [-0.2, -8.2], [1, -6.8]], MAT.pavonado);
      pintar(ctx, Rc(21, -6.4, 50.4, 1.8), MAT.pavonado);
      pintar(ctx, Rc(21, -4.4, 43, 2.0), MAT.pavonado);
      pintar(ctx, [[21, -4.6], [40, -4.6], [40.6, -3.0], [40, -1.6], [21, -1.4]], MAT.madera);
      punto(ctx, 70.8, -6.9, 0.4, '#d8d8d8');
      ctx.save(); ctx.translate(15, 2.4); ctx.rotate(e.palanca * 0.9);
      if (!Pincel.silueta) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, 0.4); ctx.quadraticCurveTo(-17.4, 0.8, -16.6, 3.8); ctx.quadraticCurveTo(-15.6, 7, -10.6, 6.8); ctx.quadraticCurveTo(-6.4, 6.6, -6, 2.8); ctx.strokeStyle = MAT.pavonado; ctx.lineWidth = 1.2; ctx.stroke(); }
      else { ctx.fillStyle = Pincel.silueta; ctx.fillRect(-16, 0, 14, 6.6); }
      ctx.restore();
    } }),

  /* ===== Especiales ===== */
  m79: modelo({ casquillo: null, casquilloVaciado: 'granada40',
    anclas: { manoDelantera: [16, 2.2], cargador: [8.2, -3.5], corredera: [-1, -5.6], expulsion: [8, -3.5], boca: [44.8, -3.5] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-30, -5.6], [-2, -4.6], [0, -4.6], [0, 2.4], [-2, 2.6], [-6, 9.2], [-11, 9.6], [-30, 10.4]], MAT.madera);   // culata gruesa
      pintar(ctx, Rc(-31.6, -5.8, 1.8, 16.4), MAT.goma);
      pintar(ctx, [[0, -5.2], [9, -5.2], [9, 2.0], [0, 2.0]], MAT.oliva);                                                      // báscula
      pintar(ctx, Rc(-1.4, -5.8, 3.6, 0.6), MAT.acero);
      guardamonteC(ctx, 1.2, 7.4, 2.0, 2.6);
      ctx.save(); ctx.translate(8.6, 2.0); ctx.rotate(e.abierto * 0.6); ctx.translate(-8.6, -2.0);
      pintar(ctx, RRc(8.4, -6.4, 36.4, 5.8, 1.0), MAT.oliva);                                                                   // cañón de 40 mm
      pintar(ctx, [[9.4, -0.6], [24, -0.6], [24, 2.0], [10, 2.4]], MAT.madera);                                                // delantera
      pintar(ctx, [[12, -6.4], [12.6, -9.6], [14.4, -9.6], [14.6, -6.4]], MAT.acero);                                         // alza de escalera levantada
      if (e.abierto > 0.5) punto(ctx, 8.8, -3.5, 2.0, '#0a0a0c');
      ctx.restore();
    } }),
  bazuca: modelo({ casquillo: null,
    anclas: { manoDelantera: [18, 3.4], cargador: [-72, -4], corredera: [-72, -4], expulsion: [-76, -4], boca: [80.5, -4] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-26, -1.0], [-6, -1.0], [-8, 4.2], [-24, 4.6]], MAT.madera);                                            // apoyo de hombro
      pintar(ctx, [[-0.6, -0.8], [3.2, -0.8], [2.0, 8.8], [-2.2, 8.8], [-2.0, 3]], MAT.madera);                             // empuñadura con el disparador
      guardamonteC(ctx, 3.2, 8.4, -0.8, 2.8);
      pintar(ctx, [[16.2, -0.8], [20.2, -0.8], [19.8, 8.2], [16.6, 8.2]], MAT.madera);                                     // empuñadura delantera
      pintar(ctx, RRc(-74, -7.4, 154, 6.6, 3.2), MAT.oliva);                                                                // tubo de 60 mm
      pintar(ctx, RRc(-77, -8.6, 4, 9.0, 1.4), MAT.acero);                                                                  // aro trasero (por acá entra el cohete)
      if (!e.sinCargador && !Pincel.silueta) { ctx.fillStyle = '#2b2d22'; ctx.fillRect(-77.4, -6.4, 1.4, 4.8); }           // aletas del cohete cargado
      pintar(ctx, Rc(-1.2, -8.0, 2.6, 7.8), MAT.acero);                                                                     // unión de los dos tramos
      pintar(ctx, RRc(76, -8.2, 4.5, 8.4, 1.2), MAT.oliva);                                                                 // refuerzo de la boca
      pintar(ctx, Rc(8, -11.2, 9, 3.8), MAT.oliva); pintar(ctx, Rc(16, -12.6, 1.2, 1.6), MAT.acero);                        // caja de la mira
      trazo(ctx, 'rgba(0,0,0,0.35)', 0.3, [[-70, -4.6], [74, -4.6]]);
    } }),
  granadas: modelo({ casquillo: null,
    anclas: { manoDelantera: [1, 1.5], cargador: [1, 1.5], corredera: [1, 1.5], expulsion: [0, 0], boca: [5, -2] },
    dibujarCm(ctx, e) {
      if (e.sinCargador) return;
      pintar(ctx, Cc(2.6, -0.6, 3.2, 22), MAT.oliva);                                                                           // cuerpo esférico de 6,4 cm
      pintar(ctx, Rc(1.4, -5.2, 2.4, 1.6), MAT.oliva);                                                                          // espoleta
      pintar(ctx, [[1.8, -4.8], [3.8, -4.8], [5.0, -3.0], [5.4, 1.2], [4.6, 1.4], [4.2, -2.6], [2.6, -3.6]], MAT.acero);       // cuchara
      if (!Pincel.silueta) { ctx.beginPath(); ctx.arc(0.4, -5.0, 1.0, 0, Math.PI * 2); ctx.strokeStyle = '#b8b8b8'; ctx.lineWidth = 0.35; ctx.stroke(); }   // anilla
    } }),
  laser: modelo({ casquillo: null,
    anclas: { manoDelantera: [22, 1.2], cargador: [8, 4.4], corredera: [2, -6], expulsion: [0, 0], boca: [36, -3] },
    dibujarCm(ctx, e) {
      pintar(ctx, [[-18, -6.4], [-2, -7.6], [-2, 1], [-6, 1], [-18, 3.6]], MAT.violeta);                                      // culata orgánica
      pintar(ctx, [[-0.6, 0.6], [3.4, 0.6], [2.0, 9], [-2.6, 9], [-2.4, 3]], ajustarColor(MAT.violeta, -0.2));
      pintar(ctx, [[-2, -8], [26, -8.4], [31, -6], [31, -0.4], [26, 1.6], [-2, 1.6]], MAT.violeta);                           // cuerpo
      pintar(ctx, [[31, -5.4], [36, -4.2], [36, -1.8], [31, -1.0]], ajustarColor(MAT.violeta, -0.25));                         // emisor
      if (!Pincel.silueta) {
        ctx.save(); ctx.shadowColor = MAT.verde; ctx.shadowBlur = 3;
        ctx.fillStyle = MAT.verde; ctx.fillRect(2, -6.4, 22, 0.6); ctx.fillRect(4, -2.6, 16, 0.5); ctx.fillRect(34.4, -3.4, 1.6, 1.0);
        if (!e.sinCargador) { ctx.beginPath(); ctx.arc(8, 4.4, 2.0, 0, Math.PI * 2); ctx.fill(); }                             // celda de energía
        ctx.restore();
      }
    } }),
};

/* Cómo se agarra cada arma: [postura, inclinación de la empuñadura en radianes, largo de culata en cm]
 *   hombro   culata en el hueco del hombro (el largo de la culata decide dónde queda la empuñadura)
 *   pistola  dos manos, brazos estirados          pecho  a la altura del pecho, sin culata al hombro
 * Las de cuello recto (Mosin, Winchester, Mossberg, M79) se agarran por la garganta de la culata: mano muy inclinada. */
const AGARRES = {
  glock: ['pistola', 0.35], colt1911: ['pistola', 0.3], deagle: ['pistola', 0.26], magnum: ['pistola', 0.32], python: ['pistola', 0.32], mauser: ['pistola', 0.06],
  uzi: ['pecho', 0.1], recortada: ['pecho', 0.42], granadas: ['mano', 0],
  ak47: ['hombro', 0.3, 41], m16: ['hombro', 0.33, 38.8], mp5: ['hombro', 0.3, 26.4], p90: ['hombro', 0.08, 30.4], saiga: ['hombro', 0.3, 38.8],
  remington700: ['hombro', 0.45, 43], barrett: ['hombro', 0.3, 42.4], mosin: ['hombro', 1.0, 39], winchester1894: ['hombro', 1.1, 38.4],
  mossberg: ['hombro', 0.85, 37], spas12: ['hombro', 0.33, 31.6], aa12: ['hombro', 0.33, 37.2], winchester1887: ['hombro', 1.05, 37],
  m79: ['hombro', 0.9, 31.6], laser: ['hombro', 0.3, 18], bazuca: ['hombro', 0.15, 16],
};
for (const [id, [agarre, angulo, culata]] of Object.entries(AGARRES)) Object.assign(MODELOS[id], { agarre, anguloEmpunadura: angulo, culataCm: culata });

/* Puntos de agarre que se mueven con su pieza (desplazamiento en cm según el estado del arma). Son los mismos
 * recorridos con que se dibujan las piezas, así la mano arrastra el cerrojo, la bomba o la manija de verdad. */
const girarCm = (px, py, hx, hy, ang) => { const c = Math.cos(ang), s = Math.sin(ang), x = px - hx, y = py - hy; return [hx + x * c - y * s - px, hy + x * s + y * c - py]; };
const MOVILES = {
  ak47: { corredera: e => [-e.corredera * 8, 0] },              // manija de carga
  saiga: { corredera: e => [-e.corredera * 8, 0] },
  uzi: { corredera: e => [-e.corredera * 5, 0] },
  p90: { corredera: e => [-e.corredera * 4, 0] },
  barrett: { corredera: e => [-e.corredera * 9, 0] },
  aa12: { corredera: e => [-e.corredera * 6, 0] },
  mp5: { corredera: e => [-e.corredera * 2.4, -e.corredera * 1.4] },   // manija que se traba arriba
  remington700: { corredera: e => [-Math.max(e.corredera, e.abierto) * 8.5, 0] },   // cerrojo
  mosin: { corredera: e => [-Math.max(e.corredera, e.abierto) * 10, 0] },
  mauser: { corredera: e => [-Math.max(e.corredera, e.abierto) * 3.4, 0] },
  mossberg: { corredera: e => [-e.bombeo * 9, 0], manoDelantera: e => [-e.bombeo * 9, 0] },   // la mano de apoyo vive sobre la bomba
  spas12: { corredera: e => [-e.bombeo * 8, 0], manoDelantera: e => [-e.bombeo * 8, 0] },
  magnum: { cargador: e => [-e.abierto * 1.5, e.abierto * 4.2], corredera: e => [-e.abierto * 1.5, e.abierto * 4.2] },   // tambor volcado
  python: { cargador: e => [-e.abierto * 1.5, e.abierto * 4.2], corredera: e => [-e.abierto * 1.5, e.abierto * 4.2] },
  recortada: { manoDelantera: e => girarCm(14, 0.6, 7.6, 0.6, e.abierto * 0.6), cargador: e => girarCm(7.4, -3.2, 7.6, 0.6, e.abierto * 0.6) },   // caños que se quiebran
  m79: { manoDelantera: e => girarCm(16, 2.2, 8.6, 2.0, e.abierto * 0.6), cargador: e => girarCm(8.2, -3.5, 8.6, 2.0, e.abierto * 0.6) },
};
for (const [id, moviles] of Object.entries(MOVILES)) MODELOS[id].moviles = moviles;
// La M2 (anclas en unidades): la manija de carga recorre 8 unidades
DIBUJO_ARMAS.m2.moviles = { corredera: e => [-e.corredera * 8 / CM, 0] };

// Reemplaza los dibujos anteriores. La M2 la dibuja su emplazamiento: acá quedan solo sus anclas (en unidades)
Object.assign(DIBUJO_ARMAS, MODELOS);
