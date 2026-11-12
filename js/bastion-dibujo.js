/* ===== Último bastión: dibujo de unidades, obras y campamento =====
 * Vista de estratega: todo mira a la derecha (de donde vienen los zombies) con los pies en (0, 0), el centro de la
 * celda de 44 × 34. Mismo estilo de ilustración que el jugador (pintura: dos tonos con la luz arriba a la
 * izquierda, brillo de borde y contorno del color de la pieza, más oscuro). Con calidad baja se pinta plano.
 */
const PAL_BASTION = {
  od: '#5b6340', odOsc: '#454c30', odClaro: '#6f7850', coyote: '#8f7d57', arena: '#b9a273', arenaOsc: '#9b845a',
  acero: '#5a5e63', aceroOsc: '#34373b', negro: '#1d1e1f', concreto: '#9c988c', concretoOsc: '#7c786d',
  piel: '#d29d76', bota: '#3a3125', correa: '#3b3a2c', alambre: '#9aa0a6',
};
// pintura() del jugador, o plano con contorno si la calidad es baja (muchas unidades en pantalla)
function pb(ctx, trazar, color, op = {}) {
  if (Lienzo.liviano || Pincel.silueta) {
    ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.fillStyle = Pincel.silueta || color; ctx.fill();
    if (!Pincel.silueta && op.contorno !== false) { ctx.strokeStyle = ajustarColor(color, -0.6); ctx.lineWidth = op.linea ?? 0.5; ctx.stroke(); }
    return;
  }
  pintura(ctx, trazar, color, { sombra: 0.7, y0: -40, y1: 0, ...op });
}
const rr = (x, y, w, h, r) => c => c.roundRect(x, y, w, h, r);
// Sombra de contacto en el piso, difusa
function sombraPiso(ctx, rx, ry = rx * 0.24, a = 0.32, x = 0, y = 1) {
  if (Pincel.silueta) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx);
  g.addColorStop(0, `rgba(10,8,6,${a})`); g.addColorStop(1, 'rgba(10,8,6,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// Caja vista en 3/4: el frente (de yF−alto a yF) y el techo (la planta corrida hacia arriba por la altura)
function caja34(ctx, x0, x1, yF, prof, alto, colFrente, colTecho, op = {}) {
  pb(ctx, rr(x0, yF - alto, x1 - x0, alto, op.r ?? 0.5), colFrente, { sombra: 0.6, brillo: 0.15, linea: 0.4 });
  pb(ctx, rr(x0, yF - alto - prof, x1 - x0, prof, op.r ?? 0.5), colTecho, { sombra: 0.4, brillo: 0.35, linea: 0.4 });
}
// Sombra proyectada de una caja: la luz viene de arriba a la izquierda y la sombra cae abajo a la derecha
function sombraCaja(ctx, x0, x1, yF, prof, alto, a = 0.3) {
  if (Pincel.silueta) return;
  const sx = alto * 0.55, sy = alto * 0.22;
  ctx.fillStyle = `rgba(10,8,6,${a})`; ctx.beginPath();
  ctx.moveTo(x0, yF - prof); ctx.lineTo(x1, yF - prof); ctx.lineTo(x1 + sx, yF - prof + sy); ctx.lineTo(x1 + sx, yF + sy); ctx.lineTo(x0 + sx, yF + sy); ctx.lineTo(x0, yF); ctx.closePath(); ctx.fill();
}
/* ---------- Relieve en 3/4: pozos y escalones vistos desde la cámara alta ----------
 * La cámara mira al norte desde arriba y de costado (unos 50°), como en los juegos de estrategia clásicos. De un pozo
 * (agua, barro, la ruta entre los cordones) se ve la pared de enfrente, la del norte, y el fondo corrido hacia abajo;
 * de un escalón (barranca, paredón, muro de contención) se ve el frente que mira al sur. La luz viene del noroeste:
 * arriba claro, los frentes en sombra, las caras que miran al suroeste más claras que las que miran al sureste, y las
 * sombras caen abajo a la derecha. */
// Pozo: trazar es el borde y prof cuánto baja en pantalla. pared() pinta todo lo de adentro del borde (queda a la
// vista la franja de arriba: la pared de enfrente) y fondo() el fondo, que es el mismo borde corrido hacia abajo
function pozo34(ctx, trazar, prof, pared, fondo) {
  ctx.save();
  ctx.beginPath(); trazar(ctx); ctx.clip(); pared();
  ctx.translate(0, prof); ctx.beginPath(); trazar(ctx); ctx.translate(0, -prof); ctx.clip(); fondo();
  ctx.restore();
}
const corrida = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
const polilinea = (c, pts) => pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
// Línea donde un escalón toca el campo: tramos en diagonal que suben y bajan (salto: cuánto se apartan de y)
function lineaEscalon(desde, hasta, y, salto, sal) {
  const pts = []; let x = desde, k = 0, sube = azar(sal, 7) > 0.5;
  while (x < hasta) { pts.push([x, y + (sube ? -1 : 1) * salto * (0.35 + 0.65 * azar(k, sal))]); x += 28 + azar(k, sal + 1) * 48; sube = !sube; k++; }
  pts.push([hasta, y]);
  return pts;
}
// En qué y pasa una polilínea por x
function yEn(pts, x) {
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if (x >= x0 && x <= x1) return y0 + (y1 - y0) * (x - x0) / Math.max(1e-6, x1 - x0); }
  return x < pts[0][0] ? pts[0][1] : pts[pts.length - 1][1];
}
// Escalón entre la meseta del borde (más alta) y el campo. base: la línea donde toca el campo, de izquierda a derecha;
// alto: cuánto sube en pantalla. Pinta la sombra que tira sobre el campo, el frente (cada tramo según hacia dónde
// mira) con su material, la oclusión al pie y el canto de arriba. M: { cara, labio, vetas, vetasClaras, grietas,
// piedras, raices, paneles, nieve, matas }
function escalon34(ctx, base, alto, M) {
  const arriba = corrida(base, 0, -alto), x0 = base[0][0], x1 = base[base.length - 1][0];
  const cara = c => { polilinea(c, arriba); for (let i = base.length - 1; i >= 0; i--) c.lineTo(base[i][0], base[i][1] + 0.8); c.closePath(); };
  ctx.lineJoin = 'round'; ctx.lineWidth = 2.4;
  for (let k = 0; k < 14; k++) { ctx.strokeStyle = `rgba(12,10,8,${0.3 * Math.pow(1 - k / 14, 1.6)})`; ctx.beginPath(); polilinea(ctx, corrida(base, 1 + k * 0.7, 1 + k * 1.5)); ctx.stroke(); }   // sombra sobre el campo
  for (let i = 0; i < base.length - 1; i++) {   // los tramos que bajan hacia la derecha miran al suroeste: más claros
    const [a, ya] = base[i], [b, yb] = base[i + 1], pend = (yb - ya) / Math.max(1, b - a);
    ctx.fillStyle = ajustarColor(M.cara, limitar(pend * 0.9, -0.2, 0.2));
    ctx.beginPath(); ctx.moveTo(a, ya - alto); ctx.lineTo(b, yb - alto); ctx.lineTo(b + 0.6, yb + 0.8); ctx.lineTo(a, ya + 0.8); ctx.closePath(); ctx.fill();
  }
  ctx.save(); ctx.beginPath(); cara(ctx); ctx.clip();
  if (M.vetas) {   // estratos que siguen el canto, más juntos abajo
    const n = Math.max(3, Math.round(alto / 3.6));
    for (let k = 1; k < n; k++) {
      const d = alto * Math.pow(k / n, 0.85);
      ctx.strokeStyle = k % 2 ? M.vetas : (M.vetasClaras || 'rgba(255,240,215,0.12)'); ctx.lineWidth = k % 2 ? 1 + alto / 40 : 0.8;
      ctx.beginPath(); polilinea(ctx, arriba.map(([x, y], i) => [x, y + d + Math.sin(i * 1.7 + k) * 0.9])); ctx.stroke();
    }
  }
  if (M.paneles) {   // muro de contención: paneles con juntas, chorreaduras y un caño de desagüe
    for (let x = x0 + 18; x < x1; x += 44) { ctx.fillStyle = 'rgba(40,38,34,0.35)'; ctx.fillRect(x, yEn(arriba, x), 1, alto + 2); ctx.fillStyle = 'rgba(255,255,250,0.12)'; ctx.fillRect(x + 1, yEn(arriba, x), 0.6, alto + 2); }
    ctx.strokeStyle = 'rgba(40,38,34,0.25)'; ctx.lineWidth = 0.7; ctx.beginPath(); polilinea(ctx, corrida(arriba, 0, alto * 0.5)); ctx.stroke();
    for (let k = 0; k < 40; k++) { const x = x0 + azar(k, 621) * (x1 - x0), y = yEn(arriba, x) + 2; ctx.fillStyle = k % 3 ? 'rgba(60,55,45,0.22)' : 'rgba(95,70,40,0.25)'; ctx.fillRect(x, y, 1 + azar(k, 622) * 2, 3 + azar(k, 623) * (alto - 4)); }
  }
  if (M.grietas) for (let k = 0; k < (x1 - x0) / 18; k++) {
    const x = x0 + azar(k, 631) * (x1 - x0), y = yEn(arriba, x);
    ctx.strokeStyle = M.grietas; ctx.lineWidth = 0.7 + azar(k, 632) * 0.7; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + 2 - azar(k, 633) * 4, y + alto * 0.45); ctx.lineTo(x + 1 - azar(k, 634) * 2, y + alto * (0.7 + azar(k, 635) * 0.3)); ctx.stroke();
  }
  if (M.nieve) for (let k = 0; k < (x1 - x0) / 22; k++) {   // vetas de nieve que bajan del canto
    const x = x0 + azar(k, 641) * (x1 - x0), y = yEn(arriba, x), l = alto * (0.25 + azar(k, 642) * 0.55), w = 3 + azar(k, 643) * 6;
    ctx.fillStyle = 'rgba(236,242,247,0.8)'; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); ctx.lineTo(x + 1, y + l); ctx.closePath(); ctx.fill();
  }
  if (M.piedras) for (let k = 0; k < (x1 - x0) / 9; k++) {
    const x = x0 + azar(k, 651) * (x1 - x0), y = yEn(arriba, x) + 3 + azar(k, 652) * (alto - 5), r = 1 + azar(k, 653) * (1 + alto / 22);
    ctx.fillStyle = 'rgba(10,8,6,0.35)'; ctx.beginPath(); ctx.ellipse(x + 0.6, y + 0.7, r, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ajustarColor(M.piedras, (azar(k, 654) - 0.5) * 0.2); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,235,0.3)'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (M.raices) for (let k = 0; k < (x1 - x0) / 26; k++) {   // raíces que asoman del canto
    const x = x0 + azar(k, 661) * (x1 - x0), y = yEn(arriba, x);
    ctx.strokeStyle = M.raices; ctx.lineWidth = 0.6 + azar(k, 662) * 0.6; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.quadraticCurveTo(x + 3, y + alto * 0.3, x + 1 - azar(k, 663) * 4, y + alto * (0.4 + azar(k, 664) * 0.4)); ctx.stroke();
  }
  // Oclusión al pie y canto de arriba con luz
  ctx.strokeStyle = 'rgba(10,8,6,0.38)'; ctx.lineWidth = 3; ctx.beginPath(); polilinea(ctx, corrida(base, 0, 0.8)); ctx.stroke();
  ctx.strokeStyle = 'rgba(10,8,6,0.16)'; ctx.lineWidth = 8; ctx.beginPath(); polilinea(ctx, corrida(base, 0, 1)); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,248,230,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); polilinea(ctx, corrida(arriba, 0, 1.4)); ctx.stroke();
  ctx.restore();
  // Labio: lo que asoma por el canto (pasto, nieve, vereda)
  ctx.strokeStyle = M.labio; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.beginPath(); polilinea(ctx, corrida(arriba, 0, 0.4)); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,252,240,0.3)'; ctx.lineWidth = 0.8; ctx.beginPath(); polilinea(ctx, corrida(arriba, 0, -0.6)); ctx.stroke();
  if (M.matas) for (let k = 0; k < (x1 - x0) / 7; k++) {   // matas colgando del canto
    const x = x0 + azar(k, 671) * (x1 - x0), y = yEn(arriba, x) + 0.8;
    ctx.strokeStyle = ajustarColor(M.matas, (azar(k, 672) - 0.5) * 0.3); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x - 0.8, y + 2.4 + azar(k, 673) * 2); ctx.moveTo(x + 1.2, y - 1); ctx.lineTo(x + 1.6, y + 1.8 + azar(k, 674) * 2.4); ctx.stroke();
  }
  return arriba;
}
// Prisma con el techo corrido (dx, -alto): se ven el techo, el frente sur y el costado este (dx < 0) u oeste (dx > 0).
// Sirve para lo que está cerca de los bordes de la pantalla, donde la cámara lo ve un poco de costado
function prisma34(ctx, x0, x1, yN, yS, alto, dx, cTecho, cFrente, cCostado) {
  const xc = dx < 0 ? x1 : x0;
  if (dx) pb(ctx, c => { c.moveTo(xc, yN); c.lineTo(xc, yS); c.lineTo(xc + dx, yS - alto); c.lineTo(xc + dx, yN - alto); c.closePath(); }, cCostado, { sombra: 0.3, brillo: 0.1, linea: 0.45 });
  pb(ctx, c => { c.moveTo(x0, yS); c.lineTo(x1, yS); c.lineTo(x1 + dx, yS - alto); c.lineTo(x0 + dx, yS - alto); c.closePath(); }, cFrente, { sombra: 0.5, brillo: 0.15, linea: 0.45 });
  pb(ctx, c => { c.moveTo(x0 + dx, yN - alto); c.lineTo(x1 + dx, yN - alto); c.lineTo(x1 + dx, yS - alto); c.lineTo(x0 + dx, yS - alto); c.closePath(); }, cTecho, { sombra: 0.3, brillo: 0.4, linea: 0.45 });
}
// Fogonazo con resplandor: estrella de puntas y halo (f: 0…1)
function fogonazoB(ctx, x, y, f, tam = 1, ang = 0) {
  if (f <= 0 || Pincel.silueta) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter';
  const h = ctx.createRadialGradient(0, 0, 0, 0, 0, 9 * tam);
  h.addColorStop(0, `rgba(255,230,160,${0.7 * f})`); h.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, 0, 9 * tam, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,236,170,${f})`; ctx.beginPath();
  ctx.moveTo(0, -2.2 * tam); ctx.lineTo(7 * tam, -0.6 * tam); ctx.lineTo(12 * tam, 0); ctx.lineTo(7 * tam, 0.6 * tam); ctx.lineTo(0, 2.2 * tam);
  ctx.lineTo(3 * tam, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(255,255,240,${f})`; ctx.beginPath(); ctx.ellipse(1.5 * tam, 0, 2.6 * tam, 1.2 * tam, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// Bolsa de arena: almohadón con la costura y el atado
function bolsaArena(ctx, x, y, w, h, col) {
  pb(ctx, c => { c.moveTo(x + h * 0.45, y); c.lineTo(x + w - h * 0.45, y); c.quadraticCurveTo(x + w + 0.6, y + h / 2, x + w - h * 0.45, y + h); c.lineTo(x + h * 0.45, y + h); c.quadraticCurveTo(x - 0.6, y + h / 2, x + h * 0.45, y); }, col, { sombra: 0.5, brillo: 0.22, linea: 0.4 });
  if (!Pincel.silueta && !Lienzo.liviano) { linea(ctx, ajustarColor(col, -0.25), 0.35, [[x + w * 0.2, y + h * 0.35], [x + w * 0.8, y + h * 0.35]]); linea(ctx, ajustarColor(col, -0.35), 0.5, [[x + w - h * 0.3, y + h * 0.15], [x + w - h * 0.25, y + h * 0.85]]); }
}
// Pared de bolsas en hileras trabadas (de abajo hacia arriba), de x0 a x1
function paredBolsas(ctx, x0, x1, yBase, hileras, w = 8, h = 4.6, semilla = 0) {
  for (let f = 0; f < hileras; f++) {
    const y = yBase - h * (f + 1) + f * 0.6, desfase = (f % 2) * w / 2, a = x0 + f * 1.2, b = x1 - f * 1.2;
    for (let x = a - desfase; x < b - 1; x += w - 0.4) {
      const xi = Math.max(a, x), wi = Math.min(w, b - xi); if (wi < 3) continue;
      const k = Math.floor(x * 7 + f * 13 + semilla);
      bolsaArena(ctx, xi, y, wi, h, ajustarColor(PAL_BASTION.arena, (azar(k, 31) - 0.5) * 0.14));
    }
  }
}
// Brazo de dos tramos (hombro → mano) con el codo hacia abajo
function brazoB(ctx, hx, hy, mx, my, col, L = 5.6) {
  const dx = mx - hx, dy = my - hy, d = Math.min(Math.hypot(dx, dy), L * 1.98) || 0.01;
  const a = Math.acos(limitar(d / (2 * L), -1, 1)), base = Math.atan2(dy, dx);
  const cx = hx + Math.cos(base + a) * L, cy = hy + Math.sin(base + a) * L;
  pb(ctx, tramo(hx, hy, cx, cy, 2.9, 2.5), col, { sombra: 0.4, linea: 0.4 });
  pb(ctx, tramo(cx, cy, mx, my, 2.5, 2.1), col, { sombra: 0.4, linea: 0.4 });
  pb(ctx, c => c.arc(mx, my, 1.25, 0, Math.PI * 2), '#4a4130', { sombra: 0.3, linea: 0.35 });   // guante
}

// Caché de imágenes: cada pose se dibuja una vez (a la resolución en que se ve) y después se copia.
// caja: [x0, y0, x1, y1] alrededor del origen, en unidades del juego
const SpritesBastion = new Map();
function conSprite(ctx, clave, caja, dibujar) {
  const m = ctx.getTransform(), e = Math.round(Math.hypot(m.a, m.b) * 100) / 100 || 1, k = clave + '@' + e;
  let sp = SpritesBastion.get(k);
  if (!sp) {
    const [x0, y0, x1, y1] = caja, c = document.createElement('canvas');
    c.width = Math.ceil((x1 - x0) * e); c.height = Math.ceil((y1 - y0) * e);
    const g = c.getContext('2d'); g.setTransform(e, 0, 0, e, -x0 * e, -y0 * e);
    const liv = Lienzo.liviano; Lienzo.liviano = false;   // se dibuja una sola vez: siempre con todo el detalle
    try { dibujar(g); } finally { Lienzo.liviano = liv; }
    sp = { c, x0, y0, e }; SpritesBastion.set(k, sp);
    if (SpritesBastion.size > 900) SpritesBastion.delete(SpritesBastion.keys().next().value);
  }
  ctx.drawImage(sp.c, sp.x0, sp.y0, sp.c.width / sp.e, sp.c.height / sp.e);
}
const cuant = (v, paso) => Math.round((v || 0) / paso) * paso;

Object.assign(DibujoBastion, {
  // Cada unidad: la pose (cuantizada) sale de la caché; los fogonazos, el humo y el polvo se pintan por cuadro
  soldado(ctx, s, t) {
    if (s.caminando) {
      const cuadro = Math.floor((((s.fase || 0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * 8);
      conSprite(ctx, '34' + 'sc' + cuadro, [-11, -42, 26, 3], g => DibujoBastion.soldadoCuerpo(g, { caminando: true, fase: (cuadro + 0.5) / 8 * 2 * Math.PI }, 0));
      return;
    }
    const ang = cuant(s.apunta, 0.04);
    conSprite(ctx, '34' + 'sa' + ang.toFixed(2), [-11, -42, 26, 3], g => DibujoBastion.soldadoCuerpo(g, { apunta: ang }, 0));
    if (s.fuego > 0) fogonazoB(ctx, 0.8 + 20.6 * Math.cos(ang) + 0.2 * Math.sin(ang), -23.6 + 20.6 * Math.sin(ang) - 0.2 * Math.cos(ang), s.fuego, 0.7, ang);
  },
  torreta(ctx, u, t) {
    const ang = cuant(u.apunta, 0.04), roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.4;
    conSprite(ctx, 't' + ang.toFixed(2) + (roto ? 'r' : ''), [-26, -38, 36, 8], g => DibujoBastion.torretaCuerpo(g, { apunta: ang, vida: roto ? 0 : 1, vidaMax: 1 }, 0));
    fogonazoB(ctx, 2 + Math.cos(ang) * 29.6, -18 + Math.sin(ang) * 29.6, u.fuego || 0, 1.1, ang);
  },
  bunker(ctx, u, t) {
    const d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), nivel = d > 0.55 ? 2 : d > 0.25 ? 1 : 0, n = Math.min(u.adentro || 0, 4);
    conSprite(ctx, 'b' + n + 'd' + nivel, [-28, -58, 34, 8], g => DibujoBastion.bunkerCuerpo(g, { adentro: n, vida: [1, 0.6, 0.3][nivel], vidaMax: 1 }, 0));
    if (u.fuegoK) for (let k = 0; k < n; k++) if (u.fuegoK[k] > 0) fogonazoB(ctx, -8.4 + k * 7.2 + 5.8, -8.7, u.fuegoK[k], 0.55);
  },
  tanque(ctx, u, t) {
    const ang = cuant(u.apunta, 0.04), r = Math.round((u.retroceso || 0) * 4) / 4, d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.35;
    const cuadro = u.enCamino ? Math.floor((t || 0) / 60) % 4 : 0;
    conSprite(ctx, 'k' + ang.toFixed(2) + 'r' + r + 'g' + cuadro + (d ? 'd' : ''), [-30, -52, 58, 8], g => DibujoBastion.tanqueCuerpo(g, { apunta: ang, retroceso: r, enCamino: !!u.enCamino, vida: d ? 0.4 : 1, vidaMax: 1 }, cuadro * 60));
    const largo = 30.2 - r * 4, bx = 14 - r * 1.5 + Math.cos(ang) * largo, by = -23 + Math.sin(ang) * largo;
    fogonazoB(ctx, bx, by, u.fuego || 0, 1.6, ang);
    if (!Lienzo.liviano && (u.fuego || 0) > 0.2) for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(200,195,180,${0.25 * u.fuego})`; ctx.beginPath(); ctx.arc(bx - 4 - k * 4, by - 2 - k * 2.4, 3 + k * 1.6, 0, Math.PI * 2); ctx.fill(); }
    if (u.enCamino && !Lienzo.liviano) for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgba(160,140,100,0.22)'; ctx.beginPath(); ctx.arc(-28 - k * 4, -2 - k * 1.5, 2.4 + k, 0, Math.PI * 2); ctx.fill(); }   // polvo
  },
  muro(ctx, u, t) {
    const d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), nivel = d > 0.6 ? 3 : d > 0.45 ? 2 : d > 0.3 ? 1 : 0;
    conSprite(ctx, 'm' + nivel, [-25, -34, 30, 8], g => DibujoBastion.muroCuerpo(g, { vida: 1 - [0, 0.35, 0.5, 0.7][nivel], vidaMax: 1 }, 0));
  },
  obra(ctx, f, t) {
    conSprite(ctx, 'obra', [-25, -46, 26, 6], g => DibujoBastion.obraCuerpo(g, f, 0));
    if (!Pincel.silueta && Math.sin(t / 60) > 0.4) {   // chispas de soldadura
      for (let k = 0; k < 4; k++) { const a = azar(Math.floor(t / 60) * 4 + k, 51) * Math.PI, d = 2 + azar(Math.floor(t / 60) * 4 + k, 52) * 5; ctx.fillStyle = k % 2 ? '#fff4c0' : '#ffb84a'; ctx.fillRect(2 + Math.cos(a) * d, -30 - Math.sin(a) * d, 1, 1); }
      fogonazoB(ctx, 2, -30, Math.max(0, Math.sin(t / 60)) * 0.5, 0.35);
    }
  },
});

Object.assign(DibujoBastion, {
  /* ---------- Soldado: casco con funda, chaleco, mochila chica y fusil con mira; camina o apunta y dispara ---------- */
  soldadoCuerpo(ctx, s, t) {
    const P = PAL_BASTION, paso = s.caminando ? Math.sin(s.fase || 0) : 0, sube = s.caminando ? Math.abs(Math.cos(s.fase || 0)) * 0.8 : 0;
    sombraPiso(ctx, 9, 2.8, 0.32, 4, 1.2);
    const pierna = (x, ang, col) => {
      ctx.save(); ctx.translate(x, -14.6); ctx.rotate(ang);
      pb(ctx, tramo(0, 0, 0.4, 11.8, 4.4, 3.4, 0.4), col, { sombra: 0.5, linea: 0.4 });
      pb(ctx, c => { c.moveTo(-2, 10.6); c.lineTo(2.2, 10.6); c.quadraticCurveTo(5, 11.6, 5.1, 14.2); c.lineTo(-2.3, 14.2); c.closePath(); }, P.bota, { sombra: 0.4, linea: 0.4 });
      ctx.restore();
    };
    pierna(-0.6, -paso * 0.5, ajustarColor(P.od, -0.2));
    ctx.save(); ctx.translate(0, -sube);
    const ang = s.apunta || 0, hom = { x: 0.8, y: -23.6 };
    const enFusil = (x, y) => ({ x: hom.x + x * Math.cos(ang) - y * Math.sin(ang), y: hom.y + x * Math.sin(ang) + y * Math.cos(ang) });
    const apoyo = enFusil(11, 1.1), gatillo = enFusil(4, 1.3);
    brazoB(ctx, -0.4, -24.4, apoyo.x, apoyo.y, ajustarColor(P.od, -0.22));                       // brazo de atrás, al guardamanos
    pb(ctx, rr(-7.4, -27.6, 4.2, 9.2, 1.6), P.odOsc, { sombra: 0.5 });                                  // mochila
    pierna(0.8, paso * 0.5, P.od);
    pb(ctx, c => { c.moveTo(-4, -14); c.lineTo(-4.4, -25); c.quadraticCurveTo(-4, -27.6, -1.4, -27.8); c.lineTo(2.2, -27.8); c.quadraticCurveTo(4.6, -27.4, 4.6, -24.8); c.lineTo(4, -14); c.closePath(); }, P.od);   // camisa
    pb(ctx, rr(-3.8, -26.4, 8.2, 9.6, 1.4), P.coyote, { sombra: 0.6 });                                 // chaleco
    if (!Pincel.silueta) {
      pb(ctx, rr(3.2, -23.4, 2.4, 4.2, 0.6), ajustarColor(P.coyote, -0.12), { sombra: 0.3, linea: 0.35, brillo: 0.2 });   // portacargador
      linea(ctx, ajustarColor(P.coyote, -0.35), 0.4, [[-3.6, -22.6], [3, -22.6]]); linea(ctx, ajustarColor(P.coyote, -0.35), 0.4, [[-3.6, -20.4], [3, -20.4]]);
    }
    pb(ctx, rr(-4.4, -15.8, 8.8, 2, 0.6), P.correa, { sombra: 0.3, linea: 0.35, brillo: false });     // cinturón
    // Cabeza: cuello, cara de perfil, casco con funda y la cinta
    pb(ctx, rr(-0.6, -29.4, 3, 2.4, 0.6), ajustarColor(P.piel, -0.1), { sombra: 0.3, linea: 0.3, brillo: false });
    pb(ctx, c => { c.moveTo(-2.4, -31); c.quadraticCurveTo(-2.6, -34.6, 0.6, -34.8); c.quadraticCurveTo(3.8, -34.8, 4.2, -32.4); c.lineTo(4.9, -31.2); c.lineTo(4.3, -30.6); c.quadraticCurveTo(4.2, -28.6, 1.6, -28.4); c.quadraticCurveTo(-1.8, -28.4, -2.4, -31); }, P.piel, { sombra: 0.5, linea: 0.4 });
    pb(ctx, c => { c.moveTo(-3.6, -31.4); c.quadraticCurveTo(-3.8, -37.4, 1, -37.6); c.quadraticCurveTo(5.6, -37.4, 5.4, -32.6); c.lineTo(6, -32); c.lineTo(-3.9, -31); c.closePath(); }, P.odClaro, { sombra: 0.7, brillo: 0.3 });
    if (!Pincel.silueta) {
      linea(ctx, ajustarColor(P.odClaro, -0.35), 0.5, [[-3.4, -33.2], [5.2, -33.4]]);                // cinta del casco
      detalle(ctx, '#1e1a16', circulo(2.6, -31.5, 0.42));                                              // ojo
      linea(ctx, '#2a2620', 0.35, [[-1.6, -31], [-0.6, -28.6]]);                                       // barbijo
    }
    // Fusil (gira desde el hombro): culata, cajón, cargador, mira, guardamanos y caño
    ctx.save(); ctx.translate(hom.x, hom.y); ctx.rotate(ang);
    pb(ctx, c => { c.moveTo(-5.4, -1.4); c.lineTo(-0.6, -1.6); c.lineTo(-0.4, 1.4); c.lineTo(-5, 2.4); c.closePath(); }, '#2b2c2a', { sombra: 0.3, linea: 0.35, brillo: 0.2 });
    pb(ctx, rr(-0.6, -1.8, 9, 3.2, 0.5), '#33352f', { sombra: 0.4, linea: 0.35, brillo: 0.25 });
    pb(ctx, c => { c.moveTo(4, 1.2); c.lineTo(5.8, 1.2); c.lineTo(6.4, 4.8); c.lineTo(4.9, 5); c.closePath(); }, '#2a2b28', { sombra: 0.3, linea: 0.3, brillo: false });
    pb(ctx, rr(2, -3.6, 3.6, 1.8, 0.5), '#202122', { sombra: 0.2, linea: 0.3, brillo: 0.3 });
    pb(ctx, rr(8.2, -1.5, 6, 2.6, 0.6), '#3b3d36', { sombra: 0.3, linea: 0.35, brillo: 0.2 });
    pb(ctx, rr(14, -0.8, 6.4, 1.2, 0.3), '#1f201e', { sombra: 0.2, linea: 0.3, brillo: false });
    ctx.restore();
    brazoB(ctx, 1.6, -25.2, gatillo.x, gatillo.y, P.od);                                                // brazo de adelante, al pistolete
    ctx.restore();
  },

  /* ---------- Torreta en 3/4: anillo de bolsas de arena visto desde arriba, ametralladora en trípode y el tirador ---------- */
  torretaCuerpo(ctx, u, t) {
    const P = PAL_BASTION, ang = u.apunta || 0, roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.4;
    sombraPiso(ctx, 23, 8, 0.34, 5, -7);
    const cy = -11, rx = 19, ry = 8.6;
    const bolsas = (delante) => {
      const lista = [];
      for (let capa = 0; capa < 2; capa++) for (let k = 0; k < 16; k++) {
        const a = Math.PI * 2 * k / 16 + capa * 0.2, y = cy + ry * Math.sin(a);
        if ((Math.sin(a) > 0) !== delante) continue;
        if (delante && Math.cos(a) > 0.82 && capa === 1) continue;   // tronera: hueco arriba del caño
        lista.push([rx * Math.cos(a), y - capa * 3.8, capa, k]);
      }
      lista.sort((p, q) => p[1] + p[2] * 10 - (q[1] + q[2] * 10));
      for (const [x, y, capa, k] of lista) bolsaArena(ctx, x - 4.2, y - 2.3, 8.4, 4.6, ajustarColor(PAL_BASTION.arena, (azar(k * 3 + capa, 33) - 0.5) * 0.16 - (roto && k % 5 === 0 ? 0.25 : 0)));
    };
    bolsas(false);
    pb(ctx, c => c.ellipse(0, cy, rx - 3, ry - 2.4, 0, 0, Math.PI * 2), '#4d4636', { sombra: 0.2, brillo: false, contorno: false });   // piso del nido
    // Tirador: espalda y casco vistos desde arriba y atrás
    pb(ctx, rr(-13, -22, 9.4, 11, 3), P.od, { sombra: 0.6 });
    pb(ctx, rr(-12.4, -21, 4, 7.6, 1.4), P.coyote, { sombra: 0.4, linea: 0.35 });
    pb(ctx, c => c.ellipse(-8, -24.6, 3.8, 3.2, 0, 0, Math.PI * 2), P.odClaro, { sombra: 0.6, brillo: 0.4 });
    // Trípode y caja de munición
    if (!Pincel.silueta) { linea(ctx, P.aceroOsc, 1.2, [[2, -17], [-5, -10]]); linea(ctx, P.aceroOsc, 1.2, [[2, -17], [9, -10]]); linea(ctx, ajustarColor(P.aceroOsc, 0.2), 1, [[2, -17], [3, -22]]); }
    caja34(ctx, -4, 2, -10, 3, 4, P.odOsc, ajustarColor(P.odOsc, 0.15));
    // Ametralladora (gira en el pivote): techo del cajón más claro, camisa perforada, caño y apagallamas
    ctx.save(); ctx.translate(2, -18); ctx.rotate(ang);
    if (!Pincel.silueta) { ctx.fillStyle = 'rgba(10,8,6,0.25)'; ctx.fillRect(4, 5, 24, 1.6); }   // sombra del caño
    pb(ctx, rr(-9, -1.4, 3, 3.6, 0.8), '#2a2b2d', { sombra: 0.3, linea: 0.35 });
    pb(ctx, rr(-6, -2.6, 13, 5.4, 1), '#33363a', { sombra: 0.4 });
    pb(ctx, rr(-6, -3.6, 13, 2.2, 0.8), '#5a5f65', { sombra: 0.2, linea: 0.35, brillo: 0.4 });
    pb(ctx, rr(7, -1.8, 9, 3.6, 0.8), '#3e4145', { sombra: 0.3, brillo: 0.25 });
    if (!Pincel.silueta) for (let k = 0; k < 4; k++) detalle(ctx, '#151617', circulo(8.6 + k * 2, 0, 0.55));
    pb(ctx, rr(16, -1, 11, 1.9, 0.4), '#232425', { sombra: 0.2, linea: 0.3, brillo: 0.3 });
    pb(ctx, rr(26.6, -1.6, 3, 3.1, 0.5), '#2a2b2c', { sombra: 0.2, linea: 0.3 });
    if (!Pincel.silueta) { ctx.strokeStyle = '#b08a3c'; ctx.lineWidth = 0.9; ctx.setLineDash([0.8, 0.5]); ctx.beginPath(); ctx.moveTo(-1, 2.4); ctx.quadraticCurveTo(-2, 5, -3, 7); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    brazoB(ctx, -6, -21, -7 * Math.cos(ang) + 2, -18 - 7 * Math.sin(ang) + 0.6, P.od, 4.6);
    bolsas(true);
    if (roto && !Pincel.silueta) detalle(ctx, ajustarColor(P.arena, -0.1), elipse(12, 1, 6, 1.6));
  },

  /* ---------- Búnker en 3/4: frente con tronera y puerta, losa del techo vista desde arriba con la red de camuflaje ---------- */
  bunkerCuerpo(ctx, u, t) {
    const P = PAL_BASTION, dano = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), C = P.concreto;
    sombraCaja(ctx, -23, 23, 0, 26, 13, 0.34);
    // Frente de hormigón con juntas, puerta de chapa y tronera con los de adentro
    pb(ctx, rr(-23, -13, 46, 13, 0.8), ajustarColor(C, -0.08), { sombra: 0.6, brillo: 0.2 });
    if (!Pincel.silueta) { linea(ctx, 'rgba(60,55,45,0.3)', 0.45, [[-23, -6.4], [23, -6.4]]); for (const x of [-8, 8]) linea(ctx, 'rgba(60,55,45,0.22)', 0.45, [[x, -13], [x, 0]]); }
    pb(ctx, rr(-21, -11.6, 6, 11, 0.5), P.acero, { sombra: 0.4, linea: 0.4 });
    pb(ctx, rr(-11.6, -10.6, 30, 4.6, 1.2), '#121314', { sombra: 0.2, linea: 0.4, brillo: false });
    const n = Math.min(u.adentro || 0, 4);
    for (let k = 0; k < n; k++) {
      const x = -8.4 + k * 7.2;
      if (!Pincel.silueta) { ctx.fillStyle = ajustarColor(P.odClaro, -0.15); ctx.beginPath(); ctx.arc(x, -7, 2.2, Math.PI, 0); ctx.fill(); linea(ctx, '#0c0c0d', 0.9, [[x + 1.2, -8.2], [x + 5.4, -8.6]]); }
    }
    // Losa del techo (se ve desde arriba), con la red de camuflaje, una escotilla y la antena
    pb(ctx, rr(-25, -41, 50, 28.6, 1.6), ajustarColor(C, 0.1), { sombra: 0.5, brillo: 0.35 });
    if (!Pincel.silueta) {
      const red = c => { c.moveTo(-22, -38); c.quadraticCurveTo(-8, -41, 6, -39); c.quadraticCurveTo(18, -40, 22, -35); c.lineTo(20.6, -24); c.quadraticCurveTo(22, -17, 16, -15.4); c.lineTo(8, -16.6); c.lineTo(0, -14.8); c.lineTo(-9, -16.4); c.lineTo(-17, -15); c.quadraticCurveTo(-23, -18, -22.4, -26); c.closePath(); };
      pb(ctx, red, '#4f5a35', { sombra: 0.5, brillo: 0.2 });
      ctx.save(); ctx.beginPath(); red(ctx); ctx.clip();
      for (let k = 0; k < 22; k++) { ctx.fillStyle = ['#6b6a40', '#3d4729', '#7a6a45'][k % 3]; ctx.beginPath(); ctx.ellipse(-22 + azar(k, 41) * 44, -40 + azar(k, 42) * 26, 3, 1.8, azar(k, 43) * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,30,20,0.35)'; ctx.lineWidth = 0.3;
      for (let x = -30; x < 30; x += 2.6) { ctx.beginPath(); ctx.moveTo(x, -42); ctx.lineTo(x + 26, -14); ctx.moveTo(x + 26, -42); ctx.lineTo(x, -14); ctx.stroke(); }
      ctx.restore();
      pb(ctx, c => c.ellipse(13, -21, 3.4, 2.2, 0, 0, Math.PI * 2), P.acero, { sombra: 0.3, linea: 0.4, brillo: 0.3 });   // escotilla
      linea(ctx, '#2a2b2c', 0.7, [[-18, -34], [-20, -54]]); detalle(ctx, '#d84a3a', circulo(-20, -54, 0.8));
    }
    if (!Pincel.silueta && dano > 0.25) { linea(ctx, '#3e3a33', 0.6, [[4, -13], [6, -8], [4.4, -3], [7, 0]]); linea(ctx, '#3e3a33', 0.5, [[6, -8], [10, -6]]); }
    if (!Pincel.silueta && dano > 0.55) {
      detalle(ctx, ajustarColor(C, -0.35), poli([[16, -41], [25, -41], [25, -33], [20, -35]]));
      linea(ctx, '#6b3a22', 0.6, [[19, -38], [24, -40]]); linea(ctx, '#6b3a22', 0.6, [[20, -36], [24.6, -37]]);
      linea(ctx, '#3e3a33', 0.6, [[-6, -13], [-8, -6], [-5, 0]]);
    }
    paredBolsas(ctx, -4, 25, 3, 1, 8, 4.4, 11);                                                         // bolsas al pie del frente
  },

  /* ---------- Tanque en 3/4: oruga de atrás asomando, cubierta del casco vista desde arriba, torre, cañón y la oruga de adelante ---------- */
  tanqueCuerpo(ctx, u, t) {
    const P = PAL_BASTION, r = u.retroceso || 0, ang = u.apunta || 0, dano = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1);
    const giro = (u.enCamino ? (t || 0) / 90 : 0), V = '#5f6a42';
    sombraCaja(ctx, -26, 27, 0, 24, 14, 0.34);
    // Oruga de atrás: solo se ve su borde de arriba
    pb(ctx, rr(-25, -31, 50, 6, 2.4), '#2b2b28', { sombra: 0.3, brillo: 0.15, linea: 0.4 });
    // Cubierta del casco (techo), con la placa delantera inclinada y la rejilla del motor atrás
    const cubierta = c => { c.moveTo(-26, -28); c.lineTo(16, -28); c.lineTo(27, -22); c.lineTo(27, -12); c.lineTo(-26, -12); c.closePath(); };
    pb(ctx, cubierta, ajustarColor(V, 0.12), { sombra: 0.7, brillo: 0.35 });
    if (!Pincel.silueta) {
      ctx.save(); ctx.beginPath(); cubierta(ctx); ctx.clip();
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? 'rgba(60,50,30,0.3)' : 'rgba(30,38,20,0.3)'; ctx.beginPath(); ctx.ellipse(-18 + k * 9, -20 + (k % 2) * 4, 4.4, 2.4, 0.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      linea(ctx, 'rgba(30,34,18,0.45)', 0.45, [[16, -28], [16, -12]]);
      for (let k = 0; k < 5; k++) linea(ctx, 'rgba(20,22,12,0.55)', 0.5, [[-24 + k * 2, -26], [-24 + k * 2, -14]]);   // rejilla del motor
      detalle(ctx, '#ffe9a8', c => c.rect(24.6, -15, 1.6, 1.4)); detalle(ctx, '#ffe9a8', c => c.rect(24.6, -25, 1.6, 1.4));   // faros
    }
    // Torre (retrocede apenas al disparar): frente, techo con escotilla y ametralladora, canasto atrás, lanzahumos, antena
    ctx.save(); ctx.translate(-r * 1.5, 0);
    pb(ctx, rr(-19, -29, 5, 9, 0.8), '#3d4229', { sombra: 0.3, linea: 0.35 });
    if (!Pincel.silueta) { ctx.fillStyle = 'rgba(10,8,6,0.25)'; ctx.beginPath(); ctx.ellipse(1, -14, 15, 3, 0, 0, Math.PI * 2); ctx.fill(); }   // sombra de la torre en la cubierta
    pb(ctx, c => { c.moveTo(-15, -20.4); c.lineTo(10, -20.4); c.lineTo(14, -18); c.lineTo(14, -15); c.lineTo(-15, -15); c.closePath(); }, ajustarColor(V, -0.02), { sombra: 0.5 });
    const techo = c => { c.moveTo(-15, -29); c.lineTo(-11, -32); c.lineTo(6, -32); c.lineTo(12, -28.6); c.lineTo(14, -21); c.lineTo(10, -20.4); c.lineTo(-15, -20.4); c.closePath(); };
    pb(ctx, techo, ajustarColor(V, 0.18), { sombra: 0.6, brillo: 0.4 });
    if (!Pincel.silueta) {
      ctx.save(); ctx.beginPath(); techo(ctx); ctx.clip();
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? 'rgba(60,50,30,0.32)' : 'rgba(30,38,20,0.32)'; ctx.beginPath(); ctx.ellipse(-9 + k * 7, -26 + (k % 2) * 2, 3.4, 1.8, 0.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      detalle(ctx, '#e8e2c8', c => c.rect(-11, -19.4, 4.6, 2.6));                                         // número
    }
    pb(ctx, c => c.ellipse(-5, -27, 3.4, 2.2, 0, 0, Math.PI * 2), ajustarColor(V, 0.05), { sombra: 0.3, linea: 0.4, brillo: 0.3 });   // escotilla
    if (!Pincel.silueta) {
      linea(ctx, '#222', 0.9, [[-3, -28], [3.4, -29.4]]);
      linea(ctx, '#26281c', 0.6, [[-12, -31], [-14, -48]]);
      for (let k = 0; k < 3; k++) detalle(ctx, '#3a3f26', c => c.rect(8 + k * 1.5, -31.4 + k * 0.6, 1.2, 2));
    }
    // Cañón: mantelete, tubo con evacuador de humos y freno de boca (con su sombra sobre el piso)
    ctx.save(); ctx.translate(14, -23); ctx.rotate(ang);
    const largo = 26 - r * 4;
    if (!Pincel.silueta) { ctx.fillStyle = 'rgba(10,8,6,0.22)'; ctx.fillRect(4, 9, largo, 2); }
    pb(ctx, rr(-2, -2.8, 5, 5.6, 1.2), ajustarColor(V, -0.05), { sombra: 0.4, linea: 0.4 });
    pb(ctx, rr(3, -1.15, largo, 2.3, 0.5), '#4f5838', { sombra: 0.3, linea: 0.35, brillo: 0.35 });
    pb(ctx, rr(3 + largo * 0.5, -1.8, 4.4, 3.6, 1.2), '#4a5234', { sombra: 0.3, linea: 0.35, brillo: 0.3 });
    pb(ctx, rr(1 + largo, -1.7, 3.2, 3.4, 0.6), '#3a3f2a', { sombra: 0.3, linea: 0.35 });
    ctx.restore(); ctx.restore();
    // Faldón y oruga de adelante: ruedas, rueda motriz, tensora y eslabones
    pb(ctx, rr(-26, -13, 53, 5, 1), V, { sombra: 0.5, brillo: 0.25 });
    if (!Pincel.silueta) for (let k = 0; k < 6; k++) detalle(ctx, '#3a4026', circulo(-21 + k * 9, -10.4, 0.45));
    const banda = c => { c.moveTo(-23, -8.6); c.lineTo(22, -8.6); c.quadraticCurveTo(27.6, -8, 26.6, -3.6); c.quadraticCurveTo(24, 0.4, 19, 0.4); c.lineTo(-20, 0.4); c.quadraticCurveTo(-26.6, 0.4, -27, -4); c.quadraticCurveTo(-27, -8.4, -23, -8.6); };
    pb(ctx, banda, '#2b2b28', { sombra: 0.4, brillo: 0.15 });
    if (!Pincel.silueta) { ctx.save(); ctx.beginPath(); banda(ctx); ctx.clip(); ctx.fillStyle = '#18181a'; const corre = (giro * 3) % 3; for (let x = -28 + corre; x < 28; x += 3) ctx.fillRect(x, -0.9, 1.1, 1.3); ctx.restore(); }
    const rueda = (x, y, rad) => {
      pb(ctx, c => c.arc(x, y, rad, 0, Math.PI * 2), '#3c4030', { sombra: 0.4, linea: 0.4, brillo: 0.2 });
      pb(ctx, c => c.arc(x, y, rad * 0.45, 0, Math.PI * 2), '#6a7052', { sombra: 0.3, linea: 0.3, brillo: 0.3 });
      if (!Pincel.silueta) for (let k = 0; k < 4; k++) { const a = giro + k * Math.PI / 2; detalle(ctx, '#23251c', circulo(x + Math.cos(a) * rad * 0.72, y + Math.sin(a) * rad * 0.72, 0.4)); }
    };
    rueda(-22.6, -4.2, 3.4); rueda(22.6, -4.4, 3);
    for (let k = 0; k < 6; k++) rueda(-15.4 + k * 6.2, -3.6, 2.9);
    if (!Pincel.silueta && dano > 0.35) { detalle(ctx, 'rgba(20,18,14,0.45)', elipse(4, -18, 7, 2.4)); detalle(ctx, 'rgba(20,18,14,0.35)', elipse(-6, -27, 4, 1.4)); }
  },

  /* ---------- Muro en 3/4: dos cestones de malla con el relleno de arena arriba y la concertina sobre el borde de atrás ---------- */
  muroCuerpo(ctx, u, t) {
    const P = PAL_BASTION, dano = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1);
    sombraCaja(ctx, -20, 20, 0, 14, 14, 0.32);
    const cesto = (x, w, alto, roto) => {
      const prof = 14;
      // Techo: la arena que llena el cestón, con el marco de malla
      pb(ctx, rr(x, -alto - prof, w, prof, 0.4), '#cdb487', { sombra: 0.4, brillo: 0.4 });
      if (!Pincel.silueta) { ctx.fillStyle = 'rgba(255,245,215,0.24)'; ctx.beginPath(); ctx.ellipse(x + w / 2 - 1, -alto - prof / 2 - 1, w * 0.34, prof * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7c8086'; ctx.lineWidth = 0.6; ctx.strokeRect(x + 0.3, -alto - prof + 0.3, w - 0.6, prof - 0.6); }
      // Frente de malla con el geotextil: mira al sur, en sombra
      pb(ctx, c => { c.moveTo(x, 0); c.lineTo(x, -alto); c.lineTo(x + w, -alto + (roto ? 2 : 0)); c.lineTo(x + w, 0); c.closePath(); }, '#87734f', { sombra: 0.7, brillo: 0.12 });
      if (Pincel.silueta) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x, -alto - 2, w, alto + 2); ctx.clip();
      ctx.strokeStyle = 'rgba(185,190,196,0.42)'; ctx.lineWidth = 0.35;
      for (let gx = x + 3.2; gx < x + w; gx += 3.2) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + (roto ? 0.6 : 0), -alto); ctx.stroke(); }
      for (let gy = -3.2; gy > -alto; gy -= 3.2) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy + (roto ? 0.8 : 0)); ctx.stroke(); }
      const oc = ctx.createLinearGradient(0, -5, 0, 0); oc.addColorStop(0, 'rgba(15,10,5,0)'); oc.addColorStop(1, 'rgba(15,10,5,0.38)'); ctx.fillStyle = oc; ctx.fillRect(x, -5, w, 5);   // oclusión al pie
      ctx.restore();
      linea(ctx, '#6b6f74', 0.8, [[x + 0.3, 0], [x + 0.3, -alto]]); linea(ctx, '#6b6f74', 0.8, [[x + w - 0.3, 0], [x + w - 0.3, -alto + (roto ? 2 : 0)]]);
    };
    cesto(-20, 19.6, dano > 0.6 ? 10 : 14, dano > 0.6);
    cesto(0.4, 19.6, 14, false);
    if (!Pincel.silueta) {   // concertina sobre el borde de atrás
      ctx.strokeStyle = P.alambre; ctx.lineWidth = 0.45;
      const rota = dano > 0.45 ? 8 : 99;
      for (let k = 0; k < 9; k++) { const x = -18 + k * 4.4; if (k === rota) continue; ctx.beginPath(); ctx.ellipse(x, -28.4, 2.8, 2.1, 0.3, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = '#6e7378'; for (let k = 0; k < 18; k++) { const x = -19 + k * 2.2; ctx.beginPath(); ctx.moveTo(x, -30 + (k % 2)); ctx.lineTo(x + 0.8, -28.8 + (k % 2)); ctx.stroke(); }
    }
    if (!Pincel.silueta && dano > 0.3) { detalle(ctx, 'rgba(50,40,25,0.55)', elipse(8, -7, 3.4, 2.6)); detalle(ctx, P.arenaOsc, elipse(10, 1.4, 6.6, 1.8)); }
    if (!Pincel.silueta && dano > 0.6) { detalle(ctx, P.arenaOsc, elipse(-12, 1.6, 8, 2.4)); }
  },

  /* ---------- Obra en 3/4: andamio de caños (cuatro parantes), plataforma de tablones, tablón de seguridad y materiales ---------- */
  obraCuerpo(ctx, f, t) {
    const P = PAL_BASTION, alto = 26, prof = 16;
    if (!Pincel.silueta) {
      caja34(ctx, -22, -12, 1, 6, 4.6, ajustarColor(P.arena, -0.1), P.arena);                           // bolsas apiladas
      caja34(ctx, 13, 22, 1, 5, 6, '#6e5030', '#8a6640');                                                // cajón de herramientas
    }
    const cano = (pts, w = 1.1) => { if (!Pincel.silueta) { linea(ctx, '#53585e', w + 0.5, pts); linea(ctx, '#a7adb3', w * 0.55, pts); } };
    cano([[-16, -prof], [-16, -prof - alto]], 0.9); cano([[16, -prof], [16, -prof - alto]], 0.9);                   // parantes de atrás
    if (!Pincel.silueta) {   // plataforma de tablones arriba
      ctx.fillStyle = 'rgba(120,90,50,0.85)'; ctx.fillRect(-16, -prof - alto, 32, prof);
      ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 0.5; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-16, -prof - alto + k * prof / 6); ctx.lineTo(16, -prof - alto + k * prof / 6); ctx.stroke(); }
    }
    cano([[-16, -prof - alto], [16, -prof - alto]]); cano([[-16, -prof - alto], [-16, -alto]]); cano([[16, -prof - alto], [16, -alto]]);
    cano([[-16, 0], [-16, -alto]]); cano([[16, 0], [16, -alto]]); cano([[-16, -alto], [16, -alto]]); cano([[-16, 0], [16, -alto / 2]], 0.8);
    if (!Pincel.silueta) {   // tablón con franjas amarillas y negras a media altura
      ctx.save(); ctx.beginPath(); ctx.rect(-17, -alto / 2 - 1.6, 34, 3); ctx.clip();
      ctx.fillStyle = '#e8b830'; ctx.fillRect(-17, -alto / 2 - 1.6, 34, 3); ctx.fillStyle = '#1e1e1e';
      for (let x = -20; x < 18; x += 4) { ctx.beginPath(); ctx.moveTo(x, -alto / 2 + 1.4); ctx.lineTo(x + 2, -alto / 2 + 1.4); ctx.lineTo(x + 4, -alto / 2 - 1.6); ctx.lineTo(x + 2, -alto / 2 - 1.6); ctx.fill(); }
      ctx.restore();
    }
  },
});

/* ---------- Campamento con la cámara: el piso va plano (en trapecio con el resto) y cada cosa parada en su lugar ---------- */
Juego.prototype.medidasCampamento = function () {
  const B = BASTION, alto = this.filas * B.celda[1], y0 = B.arriba, x = B.baseX;
  return { B, alto, y0, x, puertaY: y0 + alto / 2 + 8, abajo: y0 + alto + 20, tx: 30, ty: y0 + 26, mx: 74, my: y0 + 40, cy: y0 + alto - 80, gy: y0 + alto - 16, wx: x - 14 };
};
// Patio de tierra apisonada con ripio y huellas de orugas: llega hasta el borde izquierdo de todo lo que se ve
Juego.prototype.campamentoPiso = function (ctx) {
  const { y0, x, puertaY, abajo } = this.medidasCampamento();
  const piso = ctx.createLinearGradient(0, y0 - 40, 0, abajo);
  piso.addColorStop(0, '#514b3b'); piso.addColorStop(1, '#5a5442');
  ctx.fillStyle = piso; ctx.beginPath(); ctx.roundRect(-600, y0 - 34, x + 592, abajo - y0 + 120, 8); ctx.fill();
  for (let k = 0; k < 220; k++) { ctx.fillStyle = k % 2 ? 'rgba(30,26,18,0.25)' : 'rgba(170,160,130,0.2)'; ctx.fillRect(-380 + azar(k, 201) * (x + 372), y0 - 30 + azar(k, 202) * (abajo - y0 + 26), 1.4, 1); }
  ctx.strokeStyle = 'rgba(30,26,18,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([2, 1.4]);
  for (const dy of [-5, 5]) { ctx.beginPath(); ctx.moveTo(x - 8, puertaY + dy); ctx.quadraticCurveTo(70, puertaY + dy, 50, abajo - 40 + dy); ctx.stroke(); }
  ctx.setLineDash([]);
  // Sombra del muro de cestones sobre el campo (la luz viene del noroeste): una franja pareja a lo largo del costado este
  const { wx } = this.medidasCampamento(), gs = ctx.createLinearGradient(wx + 12, 0, wx + 28, 0);
  gs.addColorStop(0, 'rgba(10,8,6,0.34)'); gs.addColorStop(1, 'rgba(10,8,6,0)');
  ctx.fillStyle = gs; ctx.fillRect(wx + 12, y0 - 24, 16, abajo - y0 + 22);
};
// Lo que está parado en el campamento, cada cosa con su punto de apoyo (x, y) en el plano
Juego.prototype.campamentoProps = function () {
  const { y0, x, puertaY, abajo, tx, ty, mx, my, cy, gy, wx } = this.medidasCampamento(), P = PAL_BASTION, lista = [];
  const poner = (px, py, dibujar) => lista.push({ x: px, y: py, dibujar });
  // Torre de guardia: cuatro patas, plataforma de tablones con bolsas, techo y reflector
  poner(tx, ty, ctx => {
    sombraCaja(ctx, tx - 13, tx + 13, ty, 12, 40, 0.28);
    for (const [px, py, col] of [[tx - 11, ty - 12, '#4a3c28'], [tx + 11, ty - 12, '#4a3c28'], [tx - 12, ty, '#5a4a32'], [tx + 12, ty, '#5a4a32']]) linea(ctx, col, 2, [[px, py], [px + (px < tx ? 2 : -2), py - 40]]);
    linea(ctx, '#4a3c28', 1, [[tx - 12, ty - 4], [tx + 10, ty - 30]]); linea(ctx, '#4a3c28', 1, [[tx + 12, ty - 4], [tx - 10, ty - 30]]);
    caja34(ctx, tx - 13, tx + 13, ty - 38, 13, 3, '#5a4630', '#7a6040');
    paredBolsas(ctx, tx - 13, tx + 13, ty - 41, 1, 6, 3.6, 5);
    for (const px of [tx - 12, tx + 12]) linea(ctx, '#3a3226', 1, [[px, ty - 44], [px, ty - 58]]);
    pb(ctx, c => { c.moveTo(tx - 16, ty - 58); c.lineTo(tx + 16, ty - 58); c.lineTo(tx + 13, ty - 74); c.lineTo(tx - 13, ty - 74); c.closePath(); }, '#55603e', { sombra: 0.5, brillo: 0.3 });
    pb(ctx, rr(tx + 8, ty - 50, 5, 4, 1), '#3a3c3e', { sombra: 0.3, linea: 0.35 });
  });
  // Mástil de la bandera (la tela se pinta por cuadro)
  poner(mx, my, ctx => { sombraPiso(ctx, 5, 2, 0.3, mx + 3, my); linea(ctx, '#8a8f94', 1.2, [[mx, my], [mx, my - 66]]); });
  // Carpas de campaña: faldón de adelante, cumbrera y la entrada en la punta
  for (const [cx, cy2, w, col] of [[34, y0 + 96, 40, '#5d6440'], [76, y0 + 128, 36, '#525a39']]) poner(cx, cy2, ctx => {
    sombraCaja(ctx, cx - w / 2, cx + w / 2, cy2, 14, 14, 0.26);
    pb(ctx, c => { c.moveTo(cx - w / 2, cy2); c.lineTo(cx + w / 2, cy2); c.lineTo(cx + w / 2 - 3, cy2 - 20); c.lineTo(cx - w / 2 + 3, cy2 - 20); c.closePath(); }, ajustarColor(col, -0.08), { sombra: 0.7, brillo: 0.2 });
    pb(ctx, c => { c.moveTo(cx - w / 2 + 3, cy2 - 20); c.lineTo(cx + w / 2 - 3, cy2 - 20); c.lineTo(cx + w / 2 - 5, cy2 - 25); c.lineTo(cx - w / 2 + 5, cy2 - 25); c.closePath(); }, ajustarColor(col, 0.12), { sombra: 0.3, brillo: 0.35, linea: 0.4 });
    for (const f of [-0.25, 0, 0.25]) linea(ctx, ajustarColor(col, -0.3), 0.5, [[cx + f * w, cy2], [cx + f * w * 0.9, cy2 - 20]]);
    pb(ctx, c => { c.moveTo(cx + w / 2, cy2); c.lineTo(cx + w / 2 - 3, cy2 - 20); c.lineTo(cx + w / 2 + 3, cy2 - 6); c.closePath(); }, ajustarColor(col, -0.25), { sombra: 0.3, linea: 0.4 });
    detalle(ctx, '#1e1c16', c => { c.moveTo(cx + w / 2 - 0.5, cy2 - 1); c.lineTo(cx + w / 2 - 2.4, cy2 - 12); c.lineTo(cx + w / 2 + 1.6, cy2 - 4); });
    linea(ctx, '#c9c0a6', 0.4, [[cx - w / 2 + 4, cy2 - 14], [cx - w / 2 - 4, cy2 + 2]]); linea(ctx, '#c9c0a6', 0.4, [[cx + w / 2 - 4, cy2 - 22], [cx + w / 2 + 6, cy2 - 16]]);
  });
  // Tambores de combustible y cajones
  for (const [bx, by] of [[92, y0 + 62], [99, y0 + 66], [89, y0 + 70]]) poner(bx, by, ctx => { sombraPiso(ctx, 4, 1.6, 0.3, bx + 2, by); pb(ctx, rr(bx - 3, by - 8, 6, 8, 1), '#4d5a3a', { sombra: 0.4, linea: 0.35 }); pb(ctx, c => c.ellipse(bx, by - 8, 3, 1.4, 0, 0, Math.PI * 2), '#62704a', { sombra: 0.2, linea: 0.35, brillo: 0.4 }); });
  poner(18, abajo - 135, ctx => caja34(ctx, 14, 22, abajo - 135, 6, 6, '#6e5030', '#8a6640'));
  poner(18, abajo - 128, ctx => caja34(ctx, 12, 24, abajo - 128, 8, 7, '#6e5030', '#8a6640'));
  // Cuartel prefabricado: techo de chapa, frente con ventanas encendidas, puerta y cartel
  poner(49, cy, ctx => {
    sombraCaja(ctx, 14, 84, cy, 20, 16, 0.3);
    pb(ctx, rr(14, cy - 16, 70, 16, 0.8), '#7a7764', { sombra: 0.6, brillo: 0.2 });
    for (const vx of [20, 66]) { pb(ctx, rr(vx, cy - 13, 11, 7, 0.6), '#f2c96a', { sombra: 0.2, linea: 0.4, brillo: false }); linea(ctx, '#5a564a', 0.5, [[vx + 5.5, cy - 13], [vx + 5.5, cy - 6]]); }
    pb(ctx, rr(42, cy - 13, 11, 13, 0.6), '#4a4c4e', { sombra: 0.3, linea: 0.4 });
    pb(ctx, rr(12, cy - 38, 74, 22.4, 1), '#6b7076', { sombra: 0.5, brillo: 0.35 });
    for (let k = 1; k < 7; k++) linea(ctx, 'rgba(30,32,36,0.3)', 0.5, [[13, cy - 38 + k * 3.2], [85, cy - 38 + k * 3.2]]);
    caja34(ctx, 60, 72, cy - 22, 8, 4, '#8c9196', '#a7acb1');                                           // aire acondicionado
    pb(ctx, rr(30, cy - 21, 38, 7, 0.8), '#2e3a2a', { sombra: 0.2, linea: 0.4, brillo: 0.2 });
    ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('bastion.cuartel'), 49, cy - 15.6);
  });
  // Taller: galpón de chapa en arco con el portón al frente y un blindado adentro
  poner(50, gy, ctx => {
    sombraCaja(ctx, 10, 90, gy, 30, 26, 0.3);
    const lomo = ctx.createLinearGradient(0, gy - 58, 0, gy - 24); lomo.addColorStop(0, '#5e625b'); lomo.addColorStop(0.45, '#8b9089'); lomo.addColorStop(1, '#5c605a');
    ctx.fillStyle = lomo; ctx.beginPath(); ctx.roundRect(10, gy - 58, 80, 34, 6); ctx.fill(); ctx.strokeStyle = 'rgba(30,32,30,0.6)'; ctx.lineWidth = 0.5; ctx.stroke();
    for (let k = 1; k < 9; k++) linea(ctx, 'rgba(30,32,30,0.25)', 0.5, [[11, gy - 58 + k * 3.8], [89, gy - 58 + k * 3.8]]);
    const arco = c => { c.moveTo(10, gy); c.lineTo(10, gy - 12); c.quadraticCurveTo(12, gy - 28, 50, gy - 28); c.quadraticCurveTo(88, gy - 28, 90, gy - 12); c.lineTo(90, gy); c.closePath(); };
    pb(ctx, arco, '#6a6e66', { sombra: 0.6, brillo: 0.25 });
    pb(ctx, c => { c.moveTo(28, gy); c.lineTo(28, gy - 12); c.quadraticCurveTo(30, gy - 20, 50, gy - 20); c.quadraticCurveTo(70, gy - 20, 72, gy - 12); c.lineTo(72, gy); c.closePath(); }, '#1d1d1c', { sombra: 0.2, linea: 0.5, brillo: false });
    pb(ctx, rr(34, gy - 9, 30, 7, 2), '#3d4429', { sombra: 0.3, linea: 0.35, brillo: 0.15 }); pb(ctx, rr(42, gy - 13, 13, 5, 1.4), '#454c2f', { sombra: 0.3, linea: 0.35, brillo: 0.15 });
    for (let k = 0; k < 5; k++) detalle(ctx, '#121212', circulo(37 + k * 6, gy - 2, 1.8));
    pb(ctx, rr(31, gy - 27, 38, 6.4, 0.8), '#2e3a2a', { sombra: 0.2, linea: 0.4, brillo: 0.2 });
    ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('bastion.taller'), 50, gy - 22);
  });
  // Muro de cestones a lo largo del frente, cestón por cestón (así se achica hacia atrás con la cámara): el techo de
  // arena, el costado que mira al campo (la cámara lo ve de costado, sobre el borde izquierdo) y el frente al sur; la
  // sombra cae sobre el campo. El portón al medio, entre dos pilares de hormigón
  const hm = 12, ld = -4;
  for (let y = y0 - 26; y < abajo - 6; y += 12) {
    if (Math.abs(y + 6 - puertaY) < 16) continue;
    const ya = y, yb = y + 12;
    poner(wx + 6, yb, ctx => {
      prisma34(ctx, wx, wx + 12, ya, yb, hm, ld, '#c9b083', '#98845c', '#7a6747');
      if (Pincel.silueta) return;
      const este = c => { c.moveTo(wx + 12, ya); c.lineTo(wx + 12, yb); c.lineTo(wx + 12 + ld, yb - hm); c.lineTo(wx + 12 + ld, ya - hm); c.closePath(); };
      ctx.save(); ctx.beginPath(); este(ctx); ctx.clip();   // malla del costado: hilos, alambres y el parante
      ctx.strokeStyle = 'rgba(185,190,196,0.4)'; ctx.lineWidth = 0.35;
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(wx + 12 + ld * k / 4, ya - hm * k / 4); ctx.lineTo(wx + 12 + ld * k / 4, yb - hm * k / 4); ctx.stroke(); }
      for (let yy = ya + 3; yy < yb; yy += 3) { ctx.beginPath(); ctx.moveTo(wx + 12, yy); ctx.lineTo(wx + 12 + ld, yy - hm); ctx.stroke(); }
      ctx.strokeStyle = '#6b6f74'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(wx + 12, ya); ctx.lineTo(wx + 12 + ld, ya - hm); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#80858a'; ctx.lineWidth = 0.5; ctx.strokeRect(wx + ld + 0.3, ya - hm + 0.3, 11.4, 11.4);   // marco de malla del techo
      ctx.fillStyle = 'rgba(255,245,215,0.22)'; ctx.beginPath(); ctx.ellipse(wx + ld + 5.5, ya - hm + 5.5, 3.6, 3, 0, 0, Math.PI * 2); ctx.fill();
      const sur = c => { c.moveTo(wx, yb); c.lineTo(wx + 12, yb); c.lineTo(wx + 12 + ld, yb - hm); c.lineTo(wx + ld, yb - hm); c.closePath(); };
      ctx.save(); ctx.beginPath(); sur(ctx); ctx.clip(); ctx.strokeStyle = 'rgba(185,190,196,0.4)'; ctx.lineWidth = 0.35;
      for (let k = 3; k < 12; k += 3) { ctx.beginPath(); ctx.moveTo(wx + k, yb); ctx.lineTo(wx + k + ld, yb - hm); ctx.stroke(); }
      for (let k = 3; k < hm; k += 3) { ctx.beginPath(); ctx.moveTo(wx + ld * k / hm, yb - k); ctx.lineTo(wx + 12 + ld * k / hm, yb - k); ctx.stroke(); }
      ctx.restore();
    });
  }
  for (const s of [-1, 1]) { const yS = puertaY + s * 16 + (s < 0 ? 0 : 4); poner(wx + 6, yS, ctx => prisma34(ctx, wx - 1, wx + 13, yS - 4, yS, 16, -5, P.concreto, P.concretoOsc, ajustarColor(P.concretoOsc, -0.12))); }   // pilares del portón
  poner(wx + 6, puertaY + 14, ctx => {   // barrera levantada, a rayas rojas y blancas
    ctx.save(); ctx.translate(wx + 6, puertaY + 14); ctx.rotate(-1.3);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#f2efe6' : '#c0392b'; ctx.fillRect(k * 4, -1, 4, 2); }
    ctx.restore();
  });
  return lista;
};
// Por cuadro: el haz del reflector, la bandera, el avance del cuartel y del taller y el golpe al campamento
Juego.prototype.dibujarCampamento = function (ctx, cam = this.camaraBastion()) {
  const { B, alto, y0, x, tx, ty, mx, my, cy, gy } = this.medidasCampamento(), ms = this.ahora;
  if (!Lienzo.liviano) {   // haz del reflector que barre el campo
    const T = cam.proyectar(tx, ty), a = Math.sin(ms / 2200) * 0.25, largo = 260 * T.s;
    ctx.save(); ctx.translate(T.x + 13 * T.s, T.y - 48 * T.s); ctx.rotate(0.3 + a); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, largo, 0); g.addColorStop(0, 'rgba(255,245,200,0.16)'); g.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -1.5); ctx.lineTo(largo, -30 * T.s); ctx.lineTo(largo, 30 * T.s); ctx.lineTo(0, 1.5); ctx.fill(); ctx.restore();
  }
  const ond = k => Math.sin(ms / 260 + k) * 1.6;
  enCamara(ctx, cam, mx, my, g => {
    pb(g, c => { c.moveTo(mx, my - 66); c.quadraticCurveTo(mx + 9, my - 67 + ond(0), mx + 20, my - 65 + ond(1)); c.lineTo(mx + 20, my - 55 + ond(1)); c.quadraticCurveTo(mx + 9, my - 57 + ond(0), mx, my - 56); c.closePath(); }, '#3a6fb0', { sombra: 0.4, linea: 0.4 });
    detalle(g, '#f2e9d4', c => c.rect(mx + 4, my - 63 + ond(0) * 0.5, 4, 4));
  });
  for (const [cola, ax, ay, sube] of [[this.colaCuartel, 49, cy, 46], [this.colaTaller, 50, gy, 66]]) {   // la barra de avance, arriba del edificio (no se achica)
    const o = cola[0]; if (!o) continue;
    const f = Math.min(1, (o.hecho || 0) / B.unidades[o.tipo].tiempo), P = cam.proyectar(ax, ay), yb = P.y - sube * P.s;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(P.x - 33, yb, 66, 5); ctx.fillStyle = '#ffd27a'; ctx.fillRect(P.x - 32, yb + 1, 64 * f, 3);
    if (cola.length > 1) { ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+' + (cola.length - 1), P.x + 41, yb + 5); }
  }
  const golpe = 1 - this.vidaBase / BASTION.vidaBase;
  if (golpe > 0) {   // el campamento se tiñe de rojo con cada mordida que recibe
    const q = [[-600, y0 - 30], [x, y0 - 30], [x, y0 + alto + 20], [-600, y0 + alto + 20]].map(([a, b]) => cam.proyectar(a, b));
    ctx.fillStyle = `rgba(160,20,20,${golpe * 0.25})`; ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
  }
};

/* ---------- Obstáculos en 3/4 (pies adelante, al centro de la celda) ---------- */
PaisajeBastion.obstaculo = function (ctx, tipo, s) {
  conSprite(ctx, 'ob34' + tipo + (s % 4), [-34, -66, 40, 12], g => PaisajeBastion.obstaculoCuerpo(g, tipo, s % 4));
  if (tipo === 'cabana' && !Lienzo.liviano) for (let k = 0; k < 3; k++) { const f = (Date.now() / 1400 + k / 3) % 1; ctx.fillStyle = `rgba(220,225,230,${0.45 * (1 - f)})`; ctx.beginPath(); ctx.arc(12 + f * 6, -48 - f * 16, 2 + f * 4, 0, Math.PI * 2); ctx.fill(); }
};
PaisajeBastion.obstaculoCuerpo = function (ctx, tipo, s) {
  const P = PAL_BASTION;
  const matas = (lista, col) => lista.forEach(([x, y, r], i) => pb(ctx, c => c.arc(x, y, r, 0, Math.PI * 2), ajustarColor(col, (i / lista.length - 0.5) * 0.18), { sombra: r * 0.18, brillo: 0.2, linea: 0.45 }));
  switch (tipo) {
    case 'arbol': {
      sombraPiso(ctx, 21, 8, 0.36, 12, -2);
      pb(ctx, c => { c.moveTo(-4.4, 0); c.quadraticCurveTo(-2.4, -6, -2.6, -18); c.lineTo(2.6, -18); c.quadraticCurveTo(2.4, -6, 4.6, 0); c.closePath(); }, '#5e4129', { sombra: 0.8 });
      matas([[-11, -24, 8], [11, -25, 8.4], [-5, -34, 9.6], [7, -35, 9], [0, -43, 8.6], [-2, -24, 9], [5, -26, 8.4]], '#3f6d2b');
      for (let k = 0; k < 8; k++) detalle(ctx, 'rgba(190,230,120,0.35)', elipse(-9 + azar(k + s * 9, 301) * 14, -42 + azar(k + s * 9, 302) * 18, 1.8, 1.1));
      break;
    }
    case 'pino': case 'pinoNevado': {
      sombraPiso(ctx, 17, 7, 0.34, 10, -2);
      pb(ctx, rr(-2.2, -9, 4.4, 9, 1), '#4d3220', { sombra: 0.5 });
      for (let k = 0; k < 4; k++) {
        const y = -6 - k * 10.5, w = 17 - k * 3.6, tope = y - 15;
        const capa = c => { c.moveTo(0, tope); for (let j = 0; j <= 6; j++) { const f = j / 6, px = -w + f * 2 * w, py = y + (j % 2 ? -1.6 : 0.8); if (j === 0) c.lineTo(-w, y); else c.lineTo(px, py); } c.lineTo(w, y); c.closePath(); };
        pb(ctx, capa, k % 2 ? '#24472f' : '#2b5236', { sombra: 1, brillo: 0.22 });
        if (tipo === 'pinoNevado') pb(ctx, c => { c.moveTo(0, tope); c.lineTo(-w * 0.62, y - 4); c.quadraticCurveTo(-w * 0.3, y - 2, 0, y - 4.6); c.quadraticCurveTo(w * 0.3, y - 2.4, w * 0.62, y - 4.4); c.closePath(); }, '#eef3f7', { sombra: 0.4, brillo: 0.4, linea: 0.35 });
      }
      break;
    }
    case 'roca': {
      sombraPiso(ctx, 20, 6, 0.36, 7, -1);
      const col = '#858178';
      pb(ctx, c => { c.moveTo(-19, 0); c.lineTo(-18, -8); c.lineTo(-12, -18); c.lineTo(2, -22); c.lineTo(14, -17); c.lineTo(19, -7); c.lineTo(20, 0); c.closePath(); }, col, { sombra: 1.2, brillo: 0.3 });
      detalle(ctx, ajustarColor(col, 0.2), poli([[-12, -18], [2, -22], [14, -17], [8, -12], [-8, -11]]));            // techo, al sol
      detalle(ctx, ajustarColor(col, -0.2), poli([[8, -12], [14, -17], [19, -7], [20, 0], [9, 0]]));
      linea(ctx, 'rgba(40,36,30,0.5)', 0.5, [[-8, -11], [-9, -2]]); linea(ctx, 'rgba(40,36,30,0.4)', 0.5, [[8, -12], [9, 0]]);
      detalle(ctx, 'rgba(90,120,60,0.45)', elipse(-12, -2, 5, 1.6));
      break;
    }
    case 'fardo': {   // fardo redondo acostado: la panza de frente, el lomo iluminado arriba y la tapa en espiral a la derecha
      sombraPiso(ctx, 18, 6, 0.34, 6, -2);
      pb(ctx, rr(-16, -24, 26, 24, 10), '#c8a14c', { sombra: 1, brillo: 0.35 });
      ctx.fillStyle = 'rgba(255,240,190,0.3)'; ctx.beginPath(); ctx.ellipse(-3, -19, 11, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 6; k++) linea(ctx, 'rgba(130,90,25,0.45)', 0.45, [[-13 + k * 4.2, -22], [-14 + k * 4.2, -2]]);
      pb(ctx, c => c.ellipse(11, -12, 5.4, 12, 0, 0, Math.PI * 2), '#b48d3c', { sombra: 0.6 });
      ctx.strokeStyle = 'rgba(110,75,20,0.6)'; ctx.lineWidth = 0.45; for (let r = 1.5; r < 5.4; r += 1.3) { ctx.beginPath(); ctx.ellipse(11, -12, r, r * 2.2, 0, 0, Math.PI * 2); ctx.stroke(); }
      break;
    }
    case 'tractor': {   // en 3/4: capó y cabina con techo, ruedas de este lado y las del otro asomando
      sombraCaja(ctx, -20, 20, 0, 14, 22, 0.32);
      const R = '#b5291f';
      for (const [x, y, r] of [[-10, -18, 9], [13, -14, 5]]) pb(ctx, c => c.arc(x, y, r, 0, Math.PI * 2), '#1c1b1a', { sombra: 0.3, brillo: false });   // ruedas del otro lado
      caja34(ctx, -6, 20, -8, 10, 9, R, ajustarColor(R, 0.15));                                            // capó
      for (let k = 0; k < 4; k++) linea(ctx, '#5a1510', 0.5, [[19.5, -16 + k * 2], [19.5, -15 + k * 2]]);
      pb(ctx, rr(-8, -36, 4, 14, 1), '#2b2b2b', { sombra: 0.3, linea: 0.35 });                                  // escape
      caja34(ctx, -18, -4, -8, 12, 18, ajustarColor(R, -0.05), '#d8d6d0');                                   // cabina con techo claro
      pb(ctx, rr(-16, -22, 10, 9, 0.8), 'rgba(170,210,235,0.85)', { sombra: 0.2, linea: 0.4, brillo: 0.5 });
      const rueda = (x, y, r) => {
        pb(ctx, c => c.arc(x, y, r, 0, Math.PI * 2), '#242322', { sombra: 0.6, brillo: 0.15 });
        ctx.strokeStyle = '#121212'; ctx.lineWidth = 1.1; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); ctx.lineTo(x + Math.cos(a + 0.2) * r, y + Math.sin(a + 0.2) * r); ctx.stroke(); }
        pb(ctx, c => c.arc(x, y, r * 0.5, 0, Math.PI * 2), '#d9b23a', { sombra: 0.4, linea: 0.4, brillo: 0.35 });
      };
      rueda(-10, -9, 9.4); rueda(13, -5, 5.2);
      break;
    }
    case 'auto': {   // auto abandonado en 3/4: la carrocería de arriba en una pieza, la cabina elevada con sus vidrios y el costado de frente
      sombraCaja(ctx, -22, 22, 0, 14, 16, 0.36);
      const col = ['#7a3b2c', '#3f5a72', '#7c6c3c', '#55603f'][s % 4], claro = ajustarColor(col, 0.16);
      for (const x of [-13, 13]) pb(ctx, c => c.ellipse(x, -14, 4, 4.2, 0, 0, Math.PI * 2), '#151516', { sombra: 0.2, brillo: false });   // ruedas del otro lado
      pb(ctx, c => { c.moveTo(-20, -26); c.lineTo(19, -26); c.quadraticCurveTo(23, -25, 23, -21); c.lineTo(23, -15); c.quadraticCurveTo(23, -12, 20, -12); c.lineTo(-20, -12); c.quadraticCurveTo(-23, -12, -23, -15); c.lineTo(-23, -22); c.quadraticCurveTo(-23, -26, -20, -26); c.closePath(); }, claro, { sombra: 0.4, brillo: 0.35 });   // capó, cintura y baúl
      if (!Pincel.silueta) { linea(ctx, ajustarColor(col, -0.25), 0.5, [[12, -25], [12, -13]]); linea(ctx, ajustarColor(col, -0.25), 0.5, [[-13, -25], [-13, -13]]); }
      // Cabina: parabrisas, luneta, vidrios del costado y el techo, más alta que el resto
      pb(ctx, c => { c.moveTo(-12.6, -13); c.lineTo(-9, -19); c.lineTo(7, -19); c.lineTo(11.4, -13); c.closePath(); }, 'rgba(35,48,58,0.95)', { sombra: 0.2, linea: 0.4, brillo: 0.3 });   // ventanillas
      pb(ctx, c => { c.moveTo(11.4, -13); c.lineTo(11.4, -25); c.lineTo(7, -31); c.lineTo(7, -19); c.closePath(); }, 'rgba(40,55,68,0.95)', { sombra: 0.2, linea: 0.4, brillo: 0.45 });   // parabrisas
      pb(ctx, c => { c.moveTo(-12.6, -13); c.lineTo(-12.6, -25); c.lineTo(-9, -31); c.lineTo(-9, -19); c.closePath(); }, 'rgba(40,55,68,0.95)', { sombra: 0.2, linea: 0.4, brillo: 0.3 });   // luneta
      pb(ctx, rr(-9, -31, 16, 12, 1.6), ajustarColor(col, 0.24), { sombra: 0.4, brillo: 0.4 });                    // techo
      if (!Pincel.silueta) { linea(ctx, col, 1, [[-1, -19], [-1, -13]]); linea(ctx, 'rgba(220,235,245,0.6)', 0.35, [[2, -18.4], [4, -16], [2.6, -13.6]]); linea(ctx, 'rgba(220,235,245,0.5)', 0.35, [[10, -24], [9, -20]]); }
      pb(ctx, c => { c.moveTo(-23, -12); c.lineTo(23, -12); c.quadraticCurveTo(24, -8, 23, -4); c.lineTo(-23, -4); c.quadraticCurveTo(-24, -8, -23, -12); c.closePath(); }, col, { sombra: 0.6, brillo: 0.2 });   // costado
      if (!Pincel.silueta) {
        ctx.save(); ctx.beginPath(); ctx.rect(-24, -32, 48, 30); ctx.clip();
        for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(120,60,25,0.45)'; ctx.beginPath(); ctx.ellipse(-18 + azar(k + s * 5, 311) * 38, -8 - azar(k + s * 5, 312) * 16, 2 + azar(k, 313) * 3, 1.2 + azar(k, 314) * 1.4, 0, 0, Math.PI * 2); ctx.fill(); }   // óxido
        ctx.restore();
        linea(ctx, ajustarColor(col, -0.45), 0.5, [[-1, -12], [-1, -5]]); detalle(ctx, '#d6d2c6', c => c.rect(-6, -10.6, 2.4, 0.8)); detalle(ctx, '#d6d2c6', c => c.rect(4, -10.6, 2.4, 0.8));
        detalle(ctx, '#f3e6b0', c => c.rect(21.8, -11, 1.6, 2)); detalle(ctx, '#a52a1f', c => c.rect(-23.4, -11, 1.4, 2.2));
      }
      for (const [x, chata] of [[-13, s % 2], [13, 0]]) {
        pb(ctx, c => c.ellipse(x, -4 + chata, 4.6, 4.4 - chata, 0, 0, Math.PI * 2), '#1f1f20', { sombra: 0.5, brillo: 0.15 });
        pb(ctx, c => c.arc(x, -4 + chata, 2, 0, Math.PI * 2), '#7d7f80', { sombra: 0.3, linea: 0.35, brillo: 0.35 });
      }
      break;
    }
    case 'contenedor': {   // contenedor en 3/4: costado corrugado de frente y el techo con nervios
      sombraCaja(ctx, -22, 22, 0, 16, 22, 0.36);
      const col = ['#2f5f7a', '#8a3a24', '#5c6b3a'][s % 3];
      pb(ctx, rr(-22, -38, 44, 16.4, 0.8), ajustarColor(col, 0.18), { sombra: 0.4, brillo: 0.35 });
      for (let x = -19; x < 22; x += 4.4) linea(ctx, ajustarColor(col, -0.1), 0.6, [[x, -37.4], [x, -22.6]]);
      pb(ctx, rr(-22, -22, 44, 22, 0.8), col, { sombra: 0.8, brillo: 0.25 });
      for (let x = -19; x < 20; x += 2.6) { linea(ctx, ajustarColor(col, -0.3), 0.6, [[x, -20.6], [x, -1.6]]); linea(ctx, ajustarColor(col, 0.15), 0.35, [[x + 1, -20.6], [x + 1, -1.6]]); }
      for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(110,55,25,0.35)'; ctx.fillRect(-20 + azar(k + s, 321) * 36, -21, 1.4, 5 + azar(k, 322) * 9); }
      detalle(ctx, 'rgba(240,235,220,0.75)', c => c.rect(-16, -16, 14, 3));
      break;
    }
    case 'cactus': {
      sombraPiso(ctx, 12, 5, 0.34, 8, -1);
      const V = '#4d8a3a';
      pb(ctx, c => { c.moveTo(-6, -16); c.quadraticCurveTo(-11, -16, -11, -22); c.lineTo(-11, -30); c.quadraticCurveTo(-11, -33, -8.6, -33); c.quadraticCurveTo(-6.4, -33, -6.4, -30); c.lineTo(-6.4, -22.6); c.lineTo(-4, -21); c.closePath(); }, ajustarColor(V, -0.06), { sombra: 0.6 });
      pb(ctx, c => { c.moveTo(5, -22); c.quadraticCurveTo(10.6, -22, 10.6, -28); c.lineTo(10.6, -36); c.quadraticCurveTo(10.6, -39, 8.2, -39); c.quadraticCurveTo(6, -39, 6, -36); c.lineTo(6, -28); c.lineTo(4, -27); c.closePath(); }, ajustarColor(V, -0.03), { sombra: 0.6 });
      pb(ctx, c => { c.moveTo(-4.4, 0); c.lineTo(-4.4, -38); c.quadraticCurveTo(-4.4, -43, 0, -43); c.quadraticCurveTo(4.4, -43, 4.4, -38); c.lineTo(4.4, 0); c.closePath(); }, V, { sombra: 1, brillo: 0.35 });
      for (const x of [-2.2, 0, 2.2]) linea(ctx, 'rgba(30,70,25,0.6)', 0.45, [[x, -41], [x, -1]]);
      for (let k = 0; k < 14; k++) detalle(ctx, 'rgba(255,250,220,0.7)', c => c.rect(-4 + (k % 4) * 2.6, -40 + k * 2.8, 0.5, 0.5));
      detalle(ctx, '#e8d26a', circulo(0, -43.6, 1.3)); detalle(ctx, '#d9644a', circulo(-1.4, -43.2, 0.9));
      break;
    }
    case 'cabana': {   // cabaña en 3/4: pared de troncos al frente y el techo a dos aguas visto desde arriba, nevado
      sombraCaja(ctx, -20, 20, 0, 18, 30, 0.34);
      const M = '#7a5432';
      pb(ctx, rr(-20, -18, 40, 18, 0.6), M, { sombra: 0.8, brillo: 0.25 });
      for (let k = 0; k < 4; k++) { linea(ctx, 'rgba(40,24,10,0.55)', 0.6, [[-20, -14 + k * 4.4], [20, -14 + k * 4.4]]); detalle(ctx, ajustarColor(M, 0.15), circulo(-20, -16 + k * 4.4, 1.6)); detalle(ctx, ajustarColor(M, 0.15), circulo(20, -16 + k * 4.4, 1.6)); }
      pb(ctx, rr(-14, -14, 9, 7, 0.6), '#ffd27a', { sombra: 0.2, linea: 0.45, brillo: false });
      linea(ctx, '#5a3a1e', 0.6, [[-9.5, -14], [-9.5, -7]]); linea(ctx, '#5a3a1e', 0.6, [[-14, -10.5], [-5, -10.5]]);
      pb(ctx, rr(4, -14, 8, 14, 0.6), '#5a3a1e', { sombra: 0.4, linea: 0.45 });
      pb(ctx, rr(9, -46, 6, 14, 0.6), '#7f7b74', { sombra: 0.5, linea: 0.4 });                                       // chimenea
      pb(ctx, c => { c.moveTo(-23, -40); c.lineTo(23, -40); c.lineTo(22, -33); c.lineTo(-22, -33); c.closePath(); }, '#dfe7ee', { sombra: 0.3, brillo: 0.4, linea: 0.4 });   // faldón de atrás
      pb(ctx, c => { c.moveTo(-24, -17); c.lineTo(24, -17); c.lineTo(22, -33); c.lineTo(-22, -33); c.closePath(); }, '#f1f5f8', { sombra: 0.6, brillo: 0.4 });                // faldón de adelante
      linea(ctx, '#b9c4cc', 0.6, [[-22, -33], [22, -33]]);
      pb(ctx, rr(-24, -18.4, 48, 2, 0.6), '#4a3020', { sombra: 0.2, linea: 0.35 });
      break;
    }
  }
};

/* ---------- Suelo y terreno: base continua con textura, zonas de terreno con bordes redondeados, orillas y detalles ----------
 * Todo lo quieto se pinta una sola vez en una capa (por nivel, ancho de grilla y resolución); por cuadro solo se suman
 * los brillos del agua y el hielo. */
const COLOR_SUELO = { pasto: '#5f7c37', pastoOscuro: '#36492c', banquina: '#5d5748', arena: '#cdab6b', nieve: '#dfe7ee' };
PaisajeBastion.suelo = function (ctx, N, region = [-20, -20, ANCHO + 20, ALTO + 20]) {
  const B = BASTION, col = COLOR_SUELO[N.base] || TERRENOS_BASTION[N.base].color, [rx0, ry0, rx1, ry1] = region;
  const ya = Math.max(ry0, B.arriba - 60), area = (rx1 - rx0) * (ry1 - ya) / (ANCHO * (ALTO - B.arriba)), n0 = Math.max(1, area);
  const piso = ctx.createLinearGradient(0, B.arriba - 40, 0, ALTO);
  piso.addColorStop(0, ajustarColor(col, -0.16)); piso.addColorStop(0.25, col); piso.addColorStop(1, ajustarColor(col, -0.08));
  ctx.fillStyle = piso; ctx.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
  const X = v => rx0 + v * (rx1 - rx0), Y = v => ya + v * (ry1 - ya);
  // Manchas grandes y suaves: rompen el color parejo
  for (let k = 0; k < 26 * n0; k++) {
    const x = X(azar(k, 401)), y = Y(azar(k, 402)), r = 30 + azar(k, 403) * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); const claro = k % 2 === 0;
    g.addColorStop(0, claro ? 'rgba(255,250,220,0.07)' : 'rgba(20,18,10,0.09)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Piedritas con su sombra abajo a la derecha (la misma luz que todo lo demás)
  if (N.base !== 'nieve') for (let k = 0; k < 130 * n0; k++) {
    const x = X(azar(k, 415)), y = Y(azar(k, 416)), r = 0.8 + azar(k, 417) * 1.4;
    ctx.fillStyle = 'rgba(15,12,8,0.35)'; ctx.beginPath(); ctx.ellipse(x + r * 0.7, y + r * 0.5, r * 1.1, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ajustarColor(col, 0.28); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.65, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Detalle disperso según el suelo base
  const n = (N.base === 'nieve' ? 70 : 520) * n0;
  for (let k = 0; k < n; k++) {
    const x = X(azar(k, 411)), y = Y(azar(k, 412)), v = azar(k, 413);
    switch (N.base) {
      case 'pasto': case 'pastoOscuro': {
        ctx.strokeStyle = ajustarColor(col, v > 0.5 ? 0.22 : -0.22); ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1.2, y - 3.6); ctx.moveTo(x + 1, y); ctx.lineTo(x + 1.4, y - 4.2); ctx.moveTo(x + 2, y); ctx.lineTo(x + 3.4, y - 3); ctx.stroke();
        if (N.base === 'pasto' && k % 23 === 0) { ctx.fillStyle = ['#f4e9a8', '#f2f2f2', '#d98ad0'][k % 3]; ctx.beginPath(); ctx.arc(x + 1, y - 4.6, 0.9, 0, Math.PI * 2); ctx.fill(); }   // flores
        if (N.base === 'pastoOscuro' && k % 17 === 0) { ctx.fillStyle = 'rgba(140,90,40,0.6)'; ctx.beginPath(); ctx.ellipse(x, y, 1.6, 0.8, v * 3, 0, Math.PI * 2); ctx.fill(); }   // hojas secas
        break;
      }
      case 'banquina': ctx.fillStyle = v > 0.5 ? 'rgba(200,190,170,0.35)' : 'rgba(30,26,20,0.35)'; ctx.fillRect(x, y, 1.4, 1.1); break;
      case 'arena':
        if (k % 4 === 0) { ctx.strokeStyle = 'rgba(255,240,205,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x, y - 2.4, x + 8, y); ctx.stroke(); ctx.strokeStyle = 'rgba(150,110,60,0.25)'; ctx.beginPath(); ctx.moveTo(x - 8, y + 1); ctx.quadraticCurveTo(x, y - 1.4, x + 8, y + 1); ctx.stroke(); }
        else if (k % 9 === 0) { ctx.fillStyle = 'rgba(120,95,60,0.5)'; ctx.beginPath(); ctx.ellipse(x, y, 1.4, 0.9, 0, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'nieve': {
        ctx.fillStyle = 'rgba(150,175,200,0.28)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 14 + v * 14, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - 2, y, 12 + v * 12, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        break;
      }
    }
  }
};
PaisajeBastion.terreno = function (ctx, g, ms) {
  const B = BASTION, [W, H] = B.celda, N = g.nivelBastion || {};
  const X = c => B.baseX + c * W, Y = f => B.arriba + f * H;
  const tipos = new Set(); for (let f = 0; f < g.filas; f++) for (let c = 0; c < g.cols; c++) tipos.add(g.terrenoEn(c, f));
  // Silueta de todas las celdas de un tipo, con las esquinas de afuera redondeadas (crece = cuánto se agranda)
  const zona = (tipo, crece = 0, radio = 12) => c2 => {
    for (let f = 0; f < g.filas; f++) for (let c = 0; c < g.cols; c++) {
      if (g.terrenoEn(c, f) !== tipo) continue;
      const igual = (dc, df) => g.terrenoEn(c + dc, f + df) === tipo;
      const r = (a, b) => (igual(a, 0) || igual(0, b)) ? 0 : radio + crece;
      const iz = igual(-1, 0) ? 0.6 : crece, de = igual(1, 0) ? 0.6 : crece, ar = igual(0, -1) ? 0.6 : crece, ab = igual(0, 1) ? 0.6 : crece;
      c2.roundRect(X(c) - iz, Y(f) - ar, W + iz + de, H + ar + ab, [r(-1, -1), r(1, -1), r(1, 1), r(-1, 1)]);
    }
  };
  // Lados de borde (donde el vecino es de otro tipo), para orillas y líneas de borde
  const bordes = (tipo, fn) => { for (let f = 0; f < g.filas; f++) for (let c = 0; c < g.cols; c++) if (g.terrenoEn(c, f) === tipo) for (const [dc, df] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (g.terrenoEn(c + dc, f + df) !== tipo && g.terrenoEn(c + dc, f + df) !== null) fn(c, f, dc, df); };
  const rellenar = (trazar, estilo) => { ctx.beginPath(); trazar(ctx); ctx.fillStyle = estilo; ctx.fill(); };
  const recortar = (trazar, fn) => { ctx.save(); ctx.beginPath(); trazar(ctx); ctx.clip(); fn(); ctx.restore(); };
  const celdas = (tipo, fn) => { for (let f = 0; f < g.filas; f++) for (let c = 0; c < g.cols; c++) if (g.terrenoEn(c, f) === tipo) fn(c, f, f * 64 + c); };
  // Dentro de un pozo, la orilla oeste tapa la luz del noroeste: una franja de sombra contra ese borde
  // Ancho de la franja del borde norte de una celda: se estira 3 por los costados sólo donde el vecino es de otro tipo (así no se pisan)
  const tramoNorte = (tipo, c, f) => { const iz = g.terrenoEn(c - 1, f) === tipo && g.terrenoEn(c - 1, f - 1) !== tipo ? 0 : 3, de = g.terrenoEn(c + 1, f) === tipo && g.terrenoEn(c + 1, f - 1) !== tipo ? 0 : 3; return [X(c) - iz, W + iz + de]; };
  const sombraOeste = (c, f, ancho = 7, a = 0.35) => { const gr = ctx.createLinearGradient(X(c), 0, X(c) + ancho, 0); gr.addColorStop(0, `rgba(8,14,18,${a})`); gr.addColorStop(1, 'rgba(8,14,18,0)'); ctx.fillStyle = gr; ctx.fillRect(X(c) - 2, Y(f), ancho + 2, H); };
  const orden = ['banquina', 'tierra', 'pasto', 'pastoOscuro', 'arena', 'nieve', 'barro', 'asfalto', 'hielo', 'agua', 'madera'];
  for (const tipo of orden) {
    if (!tipos.has(tipo) || tipo === N.base) continue;
    const T = TERRENOS_BASTION[tipo], col = COLOR_SUELO[tipo] || T.color;
    switch (tipo) {
      case 'tierra': {   // camino de tierra apenas hundido por el paso: el bordecito de enfrente, huellas con su lomo y piedritas
        rellenar(zona(tipo, 1.6), ajustarColor(col, -0.1));
        pozo34(ctx, zona(tipo), 2.2, () => { ctx.fillStyle = ajustarColor(col, -0.32); ctx.fillRect(0, 0, ANCHO, ALTO); }, () => {
          ctx.fillStyle = col; ctx.fillRect(0, 0, ANCHO, ALTO);
          celdas(tipo, (c, f, k) => {
            for (const d of [H * 0.34, H * 0.7]) {   // huella: la pared de enfrente oscura, el fondo y el lomo de adelante con luz
              const y0 = Y(f) + d + Math.sin(c) * 0.8, y1 = Y(f) + d + Math.sin(c + 1) * 0.8;
              linea(ctx, 'rgba(45,30,14,0.45)', 1.1, [[X(c) - 1, y0 - 0.9], [X(c) + W + 1, y1 - 0.9]]);
              linea(ctx, 'rgba(85,60,32,0.4)', 1.6, [[X(c) - 1, y0 + 0.5], [X(c) + W + 1, y1 + 0.5]]);
              linea(ctx, 'rgba(210,185,145,0.38)', 0.7, [[X(c) - 1, y0 + 1.9], [X(c) + W + 1, y1 + 1.9]]);
            }
            for (let j = 0; j < 5; j++) { const x = X(c) + azar(k * 6 + j, 421) * W, y = Y(f) + 3 + azar(k * 6 + j, 422) * (H - 4); ctx.fillStyle = 'rgba(40,26,12,0.4)'; ctx.fillRect(x + 0.6, y + 0.5, 1.5, 1); ctx.fillStyle = 'rgba(190,170,135,0.7)'; ctx.fillRect(x, y, 1.4, 1); }
          });
        });
        break;
      }
      case 'pasto': case 'pastoOscuro': {
        rellenar(zona(tipo, 1), col);
        recortar(zona(tipo, 1), () => celdas(tipo, (c, f, k) => { for (let j = 0; j < 10; j++) { const x = X(c) + azar(k * 10 + j, 431) * W, y = Y(f) + 4 + azar(k * 10 + j, 432) * (H - 4); ctx.strokeStyle = j % 2 ? ajustarColor(col, 0.25) : ajustarColor(col, -0.25); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1, y - 4); ctx.moveTo(x + 1.4, y); ctx.lineTo(x + 2.4, y - 4); ctx.stroke(); } }));
        break;
      }
      case 'barro': {   // barro hundido: la pared de enfrente, mojada; adentro, en la granja, tierra arada con los surcos en relieve
        rellenar(zona(tipo, 2.4), 'rgba(40,28,16,0.35)');
        pozo34(ctx, zona(tipo), 5, () => {
          ctx.fillStyle = ajustarColor(col, -0.3); ctx.fillRect(0, 0, ANCHO, ALTO);
          bordes(tipo, (c, f, dc, df) => { if (df < 0) { ctx.fillStyle = 'rgba(160,130,95,0.3)'; ctx.fillRect(X(c) - 2, Y(f) + 0.4, W + 4, 0.8); } });
        }, () => {
          ctx.fillStyle = col; ctx.fillRect(0, 0, ANCHO, ALTO);
          if (N.id !== 'granja') celdas(tipo, (c, f, k) => {   // barro común: manchas húmedas, huellas de ruedas en relieve y charcos que reflejan
            for (let j = 0; j < 3; j++) { ctx.fillStyle = 'rgba(20,12,6,0.3)'; ctx.beginPath(); ctx.ellipse(X(c) + azar(k * 3 + j, 445) * W, Y(f) + azar(k * 3 + j, 446) * H, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
            for (const d of [H * 0.38, H * 0.64]) { linea(ctx, 'rgba(20,12,6,0.5)', 1.6, [[X(c) - 1, Y(f) + d], [X(c) + W + 1, Y(f) + d + 1]]); linea(ctx, 'rgba(150,120,85,0.3)', 0.8, [[X(c) - 1, Y(f) + d + 1.6], [X(c) + W + 1, Y(f) + d + 2.6]]); }
            if (azar(k, 447) > 0.4) { const px = X(c) + W * (0.3 + azar(k, 448) * 0.4), py = Y(f) + H * 0.74; ctx.fillStyle = 'rgba(30,22,14,0.6)'; ctx.beginPath(); ctx.ellipse(px, py - 0.8, 8.4, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(110,140,160,0.6)'; ctx.beginPath(); ctx.ellipse(px, py, 8, 2.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(225,238,245,0.45)'; ctx.fillRect(px - 2, py - 1, 6, 0.8); }
          });
          else celdas(tipo, (c, f, k) => {   // tierra arada: cada surco con el lomo con luz, la ladera de adelante en sombra y agua en el fondo
            for (let j = 0; j < 5; j++) {
              const y = Y(f) + 4 + j * 6.6;
              ctx.fillStyle = '#8a6a44'; ctx.fillRect(X(c) - 1, y - 1.2, W + 2, 1.6);
              ctx.fillStyle = '#3a2a17'; ctx.fillRect(X(c) - 1, y + 0.4, W + 2, 2.4);
              ctx.fillStyle = 'rgba(15,10,5,0.55)'; ctx.fillRect(X(c) - 1, y + 2.8, W + 2, 0.9);
              if (azar(k * 5 + j, 441) > 0.72) { ctx.fillStyle = 'rgba(120,150,170,0.55)'; ctx.fillRect(X(c) + azar(k * 5 + j, 442) * (W - 10), y + 2.6, 6 + azar(j, 443) * 6, 1); }
              for (let t = 0; t < 4; t++) { const tx = X(c) + azar(k * 20 + j * 4 + t, 444) * W; ctx.fillStyle = 'rgba(20,12,6,0.45)'; ctx.fillRect(tx + 0.5, y - 0.6, 1.6, 1); ctx.fillStyle = '#9a7a52'; ctx.fillRect(tx, y - 1.2, 1.4, 0.9); }   // terrones con luz sobre el lomo
            }
          });
          bordes(tipo, (c, f, dc, df) => { if (dc < 0) sombraOeste(c, f, 6, 0.32); });
        });
        break;
      }
      case 'asfalto': {   // ruta hundida entre los cordones: del cordón de enfrente se ve la cara; asfalto con grietas, manchas y carriles
        pozo34(ctx, zona(tipo, 0, 2), 3.4, () => {
          ctx.fillStyle = '#8e8c86'; ctx.fillRect(0, 0, ANCHO, ALTO);
          bordes(tipo, (c, f, dc, df) => { if (df < 0) { ctx.fillStyle = 'rgba(255,255,250,0.25)'; ctx.fillRect(X(c), Y(f), W, 0.8); for (let x = X(c) + 10; x < X(c) + W; x += 22) { ctx.fillStyle = 'rgba(40,40,38,0.35)'; ctx.fillRect(x, Y(f), 0.8, 3.4); } } });
        }, () => {
          ctx.fillStyle = col; ctx.fillRect(0, 0, ANCHO, ALTO);
          celdas(tipo, (c, f, k) => {
            for (let j = 0; j < 14; j++) { ctx.fillStyle = j % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(X(c) + azar(k * 14 + j, 451) * W, Y(f) + azar(k * 14 + j, 452) * H, 1.2, 1); }
            if (azar(k, 453) > 0.7) { ctx.strokeStyle = 'rgba(15,15,15,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(X(c) + 8, Y(f) + 6); ctx.lineTo(X(c) + 16, Y(f) + 14); ctx.lineTo(X(c) + 13, Y(f) + 24); ctx.moveTo(X(c) + 16, Y(f) + 14); ctx.lineTo(X(c) + 26, Y(f) + 16); ctx.stroke(); }
            if (azar(k, 454) > 0.85) { ctx.fillStyle = 'rgba(10,10,12,0.35)'; ctx.beginPath(); ctx.ellipse(X(c) + 22, Y(f) + 20, 7, 3, 0.2, 0, Math.PI * 2); ctx.fill(); }   // mancha de aceite
            if (g.terrenoEn(c, f - 1) === tipo && c % 2 === 0) { ctx.fillStyle = 'rgba(235,225,170,0.75)'; ctx.fillRect(X(c) + 6, Y(f) - 1, 22, 2); }   // carril
          });
          bordes(tipo, (c, f, dc, df) => { if (df) { ctx.fillStyle = 'rgba(240,240,235,0.8)'; ctx.fillRect(X(c), df < 0 ? Y(f) + 5.6 : Y(f) + H - 3.4, W, 1.4); } });
        });
        break;
      }
      case 'hielo': {   // laguna congelada, hundida: orilla de nieve, la barranca de enfrente y el hielo con reflejos y grietas
        rellenar(zona(tipo, 1.6, 13), 'rgba(250,252,255,0.9)');
        pozo34(ctx, zona(tipo, 0, 12), 9, () => {
          ctx.fillStyle = '#6c8196'; ctx.fillRect(0, 0, ANCHO, ALTO);
          bordes(tipo, (c, f, dc, df) => {
            if (df >= 0) return;
            const [x0, w] = tramoNorte(tipo, c, f);
            for (let j = 1; j < 4; j++) { ctx.fillStyle = j % 2 ? 'rgba(240,248,255,0.45)' : 'rgba(30,45,60,0.35)'; ctx.fillRect(x0, Y(f) + j * 2.2, w, 0.8); }   // capas de nieve y hielo
            const gm = ctx.createLinearGradient(0, Y(f) + 3, 0, Y(f) + 10); gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(1, 'rgba(25,40,55,0.45)'); ctx.fillStyle = gm; ctx.fillRect(x0, Y(f), w, 10);
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x0, Y(f) + 0.2, w, 1);   // canto de nieve
          });
        }, () => {
          ctx.fillStyle = ajustarColor(col, -0.12); ctx.fillRect(0, 0, ANCHO, ALTO);   // el hielo, un poco más oscuro que la nieve de alrededor
          const g2 = ctx.createLinearGradient(0, B.arriba, 0, B.arriba + g.filas * H); g2.addColorStop(0, 'rgba(255,255,255,0.18)'); g2.addColorStop(1, 'rgba(60,120,160,0.2)');
          ctx.fillStyle = g2; ctx.fillRect(0, 0, ANCHO, ALTO);
          bordes(tipo, (c, f, dc, df) => { if (dc < 0) sombraOeste(c, f, 9, 0.3); if (df < 0) { const [x0, w] = tramoNorte(tipo, c, f), gr = ctx.createLinearGradient(0, Y(f) + 9, 0, Y(f) + 21); gr.addColorStop(0, 'rgba(40,70,95,0.45)'); gr.addColorStop(1, 'rgba(40,70,95,0)'); ctx.fillStyle = gr; ctx.fillRect(x0, Y(f) + 9, w, 12); } });   // reflejo de la barranca y sombra de la orilla oeste
          celdas(tipo, (c, f, k) => {
            ctx.strokeStyle = 'rgba(70,120,150,0.4)'; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(X(c) + azar(k, 461) * W, Y(f)); ctx.lineTo(X(c) + W * 0.5, Y(f) + H * 0.5); ctx.lineTo(X(c) + azar(k, 462) * W, Y(f) + H); ctx.moveTo(X(c) + W * 0.5, Y(f) + H * 0.5); ctx.lineTo(X(c) + W, Y(f) + azar(k, 463) * H); ctx.stroke();
            if (azar(k, 464) > 0.55) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.save(); ctx.translate(X(c) + W * (0.15 + azar(k, 465) * 0.7), Y(f) + H * (0.3 + azar(k, 466) * 0.5)); ctx.rotate(-0.5); ctx.fillRect(-6, -0.8, 12, 1.6); ctx.fillRect(-2, 2.4, 6, 1); ctx.restore(); }   // brillos sueltos
          });
        });
        break;
      }
      case 'agua': {   // agua hundida: la barranca de enfrente (tierra con vetas, mojada abajo) y el agua corrida hacia abajo
        const orilla = N.base === 'arena' ? '#d9c08a' : N.base === 'nieve' ? '#e8eef2' : '#5a4a30';
        const pared = N.base === 'arena' ? '#a9844f' : N.base === 'nieve' ? '#8e9aa6' : '#5c4630', prof = 11;
        rellenar(zona(tipo, 3.4, 14), orilla);
        pozo34(ctx, zona(tipo, 0.6, 11), prof, () => {
          ctx.fillStyle = pared; ctx.fillRect(0, 0, ANCHO, ALTO);
          bordes(tipo, (c, f, dc, df) => {
            if (df >= 0) return;
            const [x0, w] = tramoNorte(tipo, c, f), y = Y(f), k = f * 64 + c;
            for (let j = 1; j < 4; j++) { ctx.fillStyle = j % 2 ? 'rgba(255,230,190,0.13)' : 'rgba(20,12,6,0.28)'; ctx.fillRect(x0, y + j * 2.3, w, 0.8); }   // vetas
            const gm = ctx.createLinearGradient(0, y + 3, 0, y + prof + 1); gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(1, 'rgba(10,14,18,0.55)');
            ctx.fillStyle = gm; ctx.fillRect(x0, y, w, prof + 1);                                                              // mojada abajo
            for (let j = 0; j < 3; j++) { if (azar(k * 3 + j, 475) > 0.6) continue; const px = x0 + azar(k * 3 + j, 476) * w, py = y + 2 + azar(k * 3 + j, 477) * (prof - 4); ctx.fillStyle = 'rgba(150,140,120,0.7)'; ctx.beginPath(); ctx.ellipse(px, py, 1.6, 1.1, 0, 0, Math.PI * 2); ctx.fill(); }   // piedras
            ctx.fillStyle = 'rgba(255,245,220,0.25)'; ctx.fillRect(x0, y + 0.3, w, 0.8);                                     // canto de arriba
          });
        }, () => {
          const g2 = ctx.createLinearGradient(0, B.arriba, 0, B.arriba + g.filas * H); g2.addColorStop(0, '#2f6f8c'); g2.addColorStop(1, '#22566f');
          ctx.fillStyle = g2; ctx.fillRect(0, 0, ANCHO, ALTO);
          bordes(tipo, (c, f, dc, df) => {   // contra la barranca: el reflejo oscuro de la pared y la línea del agua; contra la orilla oeste, su sombra
            if (dc < 0) sombraOeste(c, f, 8, 0.4);
            if (df >= 0) return;
            const [x0, w] = tramoNorte(tipo, c, f), y = Y(f) + prof, gr = ctx.createLinearGradient(0, y, 0, y + 11); gr.addColorStop(0, 'rgba(12,28,34,0.55)'); gr.addColorStop(1, 'rgba(12,28,34,0)');
            ctx.fillStyle = gr; ctx.fillRect(x0, y, w, 11);
            ctx.fillStyle = 'rgba(210,240,250,0.45)'; ctx.fillRect(x0, y - 0.2, w, 0.8);
          });
          celdas(tipo, (c, f, k) => {   // reflejo del cielo en diagonal y, en la granja, camalotes
            if (azar(k, 478) > 0.55) { const rx = X(c) + W * azar(k, 479), ry = Y(f) + prof + 4 + azar(k, 480) * (H - prof - 4), l = 8 + azar(k, 484) * 16; ctx.fillStyle = 'rgba(175,220,238,0.13)'; ctx.beginPath(); ctx.ellipse(rx, ry, l, 1.6, -0.12, 0, Math.PI * 2); ctx.fill(); }   // reflejos del cielo, sueltos
            if (N.id === 'granja' && azar(k, 471) > 0.4) { const px = X(c) + 10 + azar(k, 472) * 20, py = Y(f) + 12 + azar(k, 473) * 16; ctx.fillStyle = 'rgba(10,20,10,0.35)'; ctx.beginPath(); ctx.ellipse(px + 0.8, py + 0.8, 4, 2.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4f7d33'; ctx.beginPath(); ctx.ellipse(px, py, 4, 2.2, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(px, py); ctx.fill(); }
          });
        });
        bordes(tipo, (c, f, dc, df) => {   // juncos en las orillas
          if (N.base === 'arena' || N.base === 'nieve') return;
          const k = f * 64 + c; if (azar(k + dc * 3 + df * 5, 481) > 0.5) return;
          const x = dc < 0 ? X(c) - 1 : dc > 0 ? X(c) + W + 1 : X(c) + W * azar(k, 482), y = df < 0 ? Y(f) : df > 0 ? Y(f) + H : Y(f) + H * azar(k, 483);
          ctx.strokeStyle = '#3d5a24'; ctx.lineWidth = 0.8; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x + j * 1.2 - 2, y + 2); ctx.lineTo(x + j * 1.6 - 3, y - 6 - j); ctx.stroke(); }
          ctx.fillStyle = '#6b4a24'; ctx.fillRect(x - 2.4, y - 7, 1.2, 3);
        });
        break;
      }
      case 'madera': {   // puente de tablones levantado sobre el agua: la sombra en el agua, los pilotes, el canto y las barandas
        celdas(tipo, (c, f) => {
          const sube = 4.5, x0 = X(c) - 7, w = W + 14, yN = Y(f) + 4 - sube, yS = Y(f) + H - 4 - sube;
          ctx.fillStyle = 'rgba(5,15,20,0.4)'; ctx.fillRect(x0 + 5, yS + sube - 1, w, 7);                                   // sombra en el agua
          for (const x of [x0 + 4, x0 + w / 2, x0 + w - 6]) { ctx.fillStyle = '#3e2a14'; ctx.fillRect(x, yS, 2.6, sube + 6); ctx.fillStyle = 'rgba(200,230,240,0.35)'; ctx.fillRect(x - 1, yS + sube + 5, 4.6, 0.8); }   // pilotes
          for (const x of [x0 + 2, x0 + w / 2 - 1, x0 + w - 4]) { ctx.fillStyle = '#4a3018'; ctx.fillRect(x, yN - 6, 1.8, 6); }   // postes de la baranda de atrás
          ctx.fillStyle = '#6e4a24'; ctx.fillRect(x0, yN - 6, w, 1.6);
          for (let j = 0; j < 10; j++) { ctx.fillStyle = j % 2 ? '#8e6639' : '#7d5830'; ctx.fillRect(x0 + j * w / 10, yN, w / 10 - 0.5, yS - yN); }   // tablones
          ctx.fillStyle = 'rgba(255,240,210,0.2)'; ctx.fillRect(x0, yN, w, 0.8);
          ctx.fillStyle = '#4e3418'; ctx.fillRect(x0, yS, w, sube);                                                        // canto del tablero
          for (const x of [x0 + 2, x0 + w / 2 - 1, x0 + w - 4]) { ctx.fillStyle = '#5a3a1c'; ctx.fillRect(x, yS - 7, 1.8, 7); }   // baranda de adelante
          ctx.fillStyle = '#7a5530'; ctx.fillRect(x0, yS - 7, w, 1.8); ctx.fillStyle = 'rgba(255,240,210,0.25)'; ctx.fillRect(x0, yS - 7, w, 0.6);
        });
        break;
      }
      default: rellenar(zona(tipo), col);
    }
  }
  // Muy tenue, el dibujo de la grilla sobre todo el campo (para leer dónde se construye)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
  for (let c = 0; c <= g.cols; c++) { ctx.beginPath(); ctx.moveTo(X(c), B.arriba); ctx.lineTo(X(c), B.arriba + g.filas * H); ctx.stroke(); }
  for (let f = 0; f <= g.filas; f++) { ctx.beginPath(); ctx.moveTo(B.baseX, Y(f)); ctx.lineTo(B.baseX + g.cols * W, Y(f)); ctx.stroke(); }
};
// Lo que se mueve sobre el terreno: destellos en el agua y el hielo
PaisajeBastion.terrenoAnimado = function (ctx, g, ms, cam) {
  if (Lienzo.liviano) return;
  const B = BASTION, [W, H] = B.celda, P = (x, y) => cam.proyectar(x, y);
  for (let f = 0; f < g.filas; f++) for (let c = 0; c < g.cols; c++) {
    const tipo = g.terrenoEn(c, f), x = B.baseX + c * W, y = B.arriba + f * H, k = f * 64 + c;
    if (tipo === 'agua') {   // ondas que van y vienen, acostadas sobre el agua
      ctx.strokeStyle = 'rgba(210,240,255,0.32)'; ctx.lineWidth = 0.8;
      for (let j = 0; j < 2; j++) {
        const yy = y + 13 + j * 12, dx = Math.sin(ms / 700 + k * 1.7 + j) * 4, a = P(x + 8 + dx, yy), m = P(x + W / 2 + dx, yy - 2), b = P(x + W - 10 + dx, yy);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(m.x, m.y, b.x, b.y); ctx.stroke();
      }
      const t = (ms / 900 + azar(k, 491) * 6) % 6; if (t < 1) { const q = P(x + azar(k, 492) * W, y + 12 + azar(k, 493) * (H - 12)); ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - t)})`; ctx.fillRect(q.x, q.y, 2 * q.s, 1); }
    } else if (tipo === 'hielo') {   // destellos
      const t = (ms / 1300 + azar(k, 494) * 8) % 8; if (t < 1) { const q = P(x + azar(k, 495) * W, y + 10 + azar(k, 496) * (H - 10)), r = 2 * q.s; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - t)})`; ctx.fillRect(q.x - r, q.y - 0.3, r * 2, 0.6); ctx.fillRect(q.x - 0.3, q.y - r, 0.6, r * 2); }
    }
  }
};
function aspasMolino(ctx, x, y, ms, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(ms / 700); ctx.fillStyle = '#9a9a9a'; for (let k = 0; k < 12; k++) { ctx.rotate(Math.PI / 6); ctx.fillRect(-1, 2, 2, 12); } ctx.restore(); }

/* ---------- Borde del mapa con la cámara: la meseta de más allá del campo ----------
 * Todo está en el plano, más allá de la fila de atrás y más arriba que el campo: el piso de la meseta va plano (en
 * trapecio, con el resto) y lo que está parado (casas, edificios, árboles, el molino) se dibuja en su lugar, más chico
 * cuanto más lejos. Del escalón que separa la meseta del campo se ve el frente, en tramos diagonales: los que miran al
 * suroeste más claros. La luz viene del noroeste y las sombras caen abajo a la derecha. */
const ESCALON_BASTION = {
  granja:   { alto: 24, salto: 6,  cara: '#6c5234', labio: '#6f9a3c', vetas: 'rgba(35,22,10,0.32)', piedras: '#8c7d64', raices: '#3d2a18', matas: '#6f9a3c', piso: '#7c9a45' },
  ciudad:   { alto: 20, salto: 0,  cara: '#8e897d', labio: '#a9a498', paneles: true, piso: '#67635e' },
  bosque:   { alto: 26, salto: 7,  cara: '#4b3a27', labio: '#34522f', vetas: 'rgba(20,12,6,0.4)', piedras: '#6c6a62', raices: '#2a1c10', matas: '#3b5f33', piso: '#1f2e1d' },
  desierto: { alto: 46, salto: 9,  cara: '#a8563a', labio: '#dc9a6c', vetas: 'rgba(80,30,15,0.3)', vetasClaras: 'rgba(255,205,165,0.22)', grietas: 'rgba(70,25,10,0.4)', piedras: '#9a6a4a', piso: '#c8774e' },
  montana:  { alto: 50, salto: 10, cara: '#6f757d', labio: '#eef3f7', vetas: 'rgba(40,44,50,0.28)', grietas: 'rgba(30,34,40,0.45)', nieve: true, piedras: '#8a8f96', piso: '#e9eff4' },
};
// Casa con techo a dos aguas (cumbrera de este a oeste) en 3/4: frente, faldón de adelante (mira al sur, en sombra),
// cumbrera y la franja del faldón de atrás (mira al norte, con luz); aleros que sobresalen y la sombra abajo a la derecha
function casa34(ctx, x, yF, w, prof, alto, pared, techo, op = {}) {
  const yA = yF - alto, yC = yA - prof * 0.62, yT = yA - prof - 1;
  sombraCaja(ctx, x, x + w, yF, prof, alto + prof * 0.35, 0.3);
  pb(ctx, rr(x, yA, w, alto, 0.4), pared, { sombra: 0.6, brillo: 0.15 });
  if (!Pincel.silueta) {
    if (op.granero) {   // portón con la cruz blanca y los marcos
      const pw = w * 0.32, px = x + w / 2 - pw / 2, py = yF - alto * 0.8;
      pb(ctx, rr(px, py, pw, yF - py, 0.4), ajustarColor(pared, -0.15), { sombra: 0.4, linea: 0.4 });
      ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 1; ctx.strokeRect(px, py, pw, yF - py);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + pw, yF); ctx.moveTo(px + pw, py); ctx.lineTo(px, yF); ctx.stroke();
      for (const xx of [x + 0.5, x + w - 0.5]) linea(ctx, '#f2ead8', 0.8, [[xx, yA], [xx, yF]]);
    }
    for (const [fx, prende] of op.ventanas || []) {
      const vx = x + w * fx, vy = yA + alto * 0.26;
      pb(ctx, rr(vx - 3, vy, 6, 5.6, 0.4), prende ? '#ffd98a' : '#33414a', { sombra: 0.2, linea: 0.4, brillo: false });
      linea(ctx, ajustarColor(pared, -0.35), 0.45, [[vx, vy], [vx, vy + 5.6]]);
    }
    if (op.puerta) pb(ctx, rr(x + w * op.puerta - 3, yF - alto * 0.64, 6, alto * 0.64, 0.4), '#5a3a22', { sombra: 0.3, linea: 0.4 });
  }
  const adelante = c => { c.moveTo(x - 3, yA + 1.4); c.lineTo(x + w + 3, yA + 1.4); c.lineTo(x + w + 2, yC); c.lineTo(x - 2, yC); c.closePath(); };
  pb(ctx, adelante, techo, { sombra: 0.5, brillo: 0.18 });
  if (!Pincel.silueta) { ctx.save(); ctx.beginPath(); adelante(ctx); ctx.clip(); ctx.strokeStyle = ajustarColor(techo, -0.28); ctx.lineWidth = 0.45; for (let y = yA - 1; y > yC; y -= 2.3) { ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + w + 3, y); ctx.stroke(); } ctx.restore(); }   // chapas o tejas
  pb(ctx, c => { c.moveTo(x - 2, yC); c.lineTo(x + w + 2, yC); c.lineTo(x + w + 1, yT); c.lineTo(x - 1, yT); c.closePath(); }, ajustarColor(techo, 0.24), { sombra: 0.2, brillo: 0.4, linea: 0.4 });
  linea(ctx, ajustarColor(techo, 0.42), 0.8, [[x - 2, yC], [x + w + 2, yC]]);   // cumbrera
  if (op.chimenea) caja34(ctx, x + w * op.chimenea, x + w * op.chimenea + 5, yC + 3, 4, 7, '#7f7468', '#9a8f82');
}
// Cilindro parado (silo, tanque de agua): costado con la luz a la izquierda, zunchos y la tapa vista desde arriba
function cilindro34(ctx, x, yF, r, alto, col) {
  sombraPiso(ctx, r * 1.7, r * 0.6, 0.3, x + r * 1.1, yF);
  const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, ajustarColor(col, 0.22)); g.addColorStop(0.4, ajustarColor(col, 0.08)); g.addColorStop(1, ajustarColor(col, -0.38));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - r, yF - alto); ctx.lineTo(x - r, yF); ctx.ellipse(x, yF, r, r * 0.42, 0, Math.PI, 0, true); ctx.lineTo(x + r, yF - alto); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = ajustarColor(col, -0.5); ctx.lineWidth = 0.5; ctx.stroke();
  ctx.strokeStyle = ajustarColor(col, -0.25);
  for (let y = yF - 5; y > yF - alto + 3; y -= 5.5) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0.12, Math.PI - 0.12); ctx.stroke(); }
  const d = ctx.createRadialGradient(x - r * 0.35, yF - alto - r * 0.2, 0, x, yF - alto, r * 1.1);
  d.addColorStop(0, ajustarColor(col, 0.36)); d.addColorStop(1, ajustarColor(col, -0.08));
  ctx.fillStyle = d; ctx.beginPath(); ctx.ellipse(x, yF - alto, r, r * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = ajustarColor(col, -0.5); ctx.stroke();
  ctx.fillStyle = ajustarColor(col, -0.22); ctx.beginPath(); ctx.ellipse(x, yF - alto - 0.6, r * 0.28, r * 0.13, 0, 0, Math.PI * 2); ctx.fill();
}
// Árbol de copa redonda: la copa con luz arriba a la izquierda y la sombra en el piso, abajo a la derecha
function arbol34(ctx, x, y, r, col) {
  sombraPiso(ctx, r * 1.3, r * 0.5, 0.32, x + r * 0.8, y);
  pb(ctx, rr(x - 1.3, y - r * 0.75, 2.6, r * 0.75, 0.6), '#5e4129', { sombra: 0.3, linea: 0.3 });
  for (const [dx, dy, f] of [[-0.5, -1.05, 0.62], [0.5, -1.1, 0.6], [-0.1, -0.92, 0.55], [0, -1.5, 0.7]]) pb(ctx, c => c.arc(x + dx * r, y + dy * r, r * f, 0, Math.PI * 2), ajustarColor(col, dy < -1.3 ? 0.08 : -0.05), { sombra: r * 0.16, brillo: 0.22, linea: 0.4 });
  if (!Pincel.silueta) for (let k = 0; k < 4; k++) detalle(ctx, 'rgba(200,235,140,0.3)', elipse(x - r * 0.45 + azar((k + x) | 0, 681) * r * 0.6, y - r * 1.85 + azar((k + x) | 0, 682) * r * 0.6, r * 0.18, r * 0.11));
}
// Pino visto desde la cámara alta: cuatro capas de ramas, la mitad de la derecha en sombra; con nieve, si va
function pino34(ctx, x, y, a, col, nieve) {
  sombraPiso(ctx, a * 0.45, a * 0.17, 0.3, x + a * 0.32, y);
  pb(ctx, rr(x - 1.2, y - a * 0.14, 2.4, a * 0.14, 0.5), '#4a3220', { sombra: 0.3, linea: 0.3 });
  for (let k = 0; k < 4; k++) {
    const yy = y - a * 0.1 - k * a * 0.19, w = a * (0.36 - k * 0.075), tope = yy - a * 0.33;
    const capa = c => { c.moveTo(x, tope); c.lineTo(x + w, yy); c.quadraticCurveTo(x, yy + a * 0.07, x - w, yy); c.closePath(); };
    pb(ctx, capa, k % 2 ? col : ajustarColor(col, 0.07), { sombra: 0.6, brillo: 0.22, linea: 0.4 });
    if (!Pincel.silueta) detalle(ctx, 'rgba(0,0,0,0.2)', c => { c.moveTo(x, tope); c.lineTo(x + w, yy); c.quadraticCurveTo(x + w * 0.45, yy + a * 0.05, x + 0.4, yy + a * 0.035); c.closePath(); });
    if (nieve) pb(ctx, c => { c.moveTo(x, tope); c.lineTo(x - w * 0.62, yy - a * 0.1); c.quadraticCurveTo(x - w * 0.2, yy - a * 0.06, x + w * 0.3, yy - a * 0.13); c.closePath(); }, '#eef3f7', { sombra: 0.3, brillo: 0.35, linea: 0.3 });
  }
}
// Parcela en 3/4: el sembrado tiene altura (el techo de las plantas, corrido hacia arriba, con sus hileras, y al sur el
// frente de las plantas de costado); el arado, surcos con el lomo con luz y la ladera de adelante en sombra
function parcela34(ctx, x, y, w, d, tipo) {
  const [c1, c2, alto] = { trigo: ['#cdb75c', '#9c8636', 5], maiz: ['#6f9440', '#46682a', 8], verde: ['#93b24e', '#6f8f36', 2.5], arado: ['#6e5233', '#3e2c18', 0] }[tipo];
  ctx.fillStyle = '#8a7350'; ctx.fillRect(x - 3, y - alto - 3, w + 6, d + alto + 6);   // camino de tierra alrededor
  if (alto) { ctx.fillStyle = 'rgba(12,10,6,0.25)'; ctx.fillRect(x + alto * 0.6, y + d - 1, w, alto * 0.5 + 2.4); }   // sombra del sembrado
  ctx.save(); ctx.beginPath(); ctx.rect(x, y - alto, w, d); ctx.clip();
  ctx.fillStyle = c1; ctx.fillRect(x, y - alto, w, d);
  if (tipo === 'arado') for (let yy = y + 1; yy < y + d; yy += 4.2) { ctx.fillStyle = '#8f6e47'; ctx.fillRect(x, yy, w, 1.3); ctx.fillStyle = c2; ctx.fillRect(x, yy + 1.3, w, 1.7); }
  else if (tipo === 'maiz') for (let yy = y - alto + 3; yy < y - alto + d; yy += 4.6) for (let xx = x + 2 + (yy % 2); xx < x + w; xx += 3.6) { ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(xx + 0.5, yy + 0.6, 1.9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = ajustarColor(c1, 0.12); ctx.beginPath(); ctx.arc(xx, yy, 1.6, 0, Math.PI * 2); ctx.fill(); }
  else for (let yy = y - alto + 2; yy < y - alto + d; yy += 3.4) { ctx.fillStyle = ajustarColor(c1, 0.14); ctx.fillRect(x, yy, w, 1.2); ctx.fillStyle = ajustarColor(c1, -0.14); ctx.fillRect(x, yy + 1.2, w, 1); }
  ctx.restore();
  if (alto) {   // el frente: las plantas de costado, más oscuras abajo
    const g = ctx.createLinearGradient(0, y + d - alto, 0, y + d); g.addColorStop(0, c2); g.addColorStop(1, ajustarColor(c2, -0.35));
    ctx.fillStyle = g; ctx.fillRect(x, y + d - alto, w, alto);
    ctx.strokeStyle = ajustarColor(c2, -0.4); ctx.lineWidth = 0.5;
    for (let xx = x + 1; xx < x + w; xx += 1.6) { ctx.beginPath(); ctx.moveTo(xx, y + d); ctx.lineTo(xx + 0.5, y + d - alto + 0.6); ctx.stroke(); }
    linea(ctx, ajustarColor(c1, 0.25), 0.7, [[x, y + d - alto], [x + w, y + d - alto]]);
  }
}
// Rampa que baja del borde al campo cortando el escalón (por ahí baja el camino o el cañón)
function rampa34(ctx, base, alto, xa, xb, col) {
  const ya = yEn(base, xa), yb = yEn(base, xb);
  const sup = c => { c.moveTo(xa + 3, ya - alto); c.lineTo(xb - 3, yb - alto); c.lineTo(xb + 7, yb + 1); c.lineTo(xa - 7, ya + 1); c.closePath(); };
  const g = ctx.createLinearGradient(0, Math.min(ya, yb) - alto, 0, Math.max(ya, yb)); g.addColorStop(0, ajustarColor(col, 0.14)); g.addColorStop(1, ajustarColor(col, -0.04));
  ctx.fillStyle = g; ctx.beginPath(); sup(ctx); ctx.fill();
  linea(ctx, 'rgba(20,14,8,0.4)', 1, [[xa + 3, ya - alto], [xa - 7, ya + 1]]); linea(ctx, 'rgba(20,14,8,0.55)', 1.3, [[xb - 3, yb - alto], [xb + 7, yb + 1]]);
  for (const f of [0.3, 0.7]) linea(ctx, 'rgba(60,40,20,0.35)', 1.4, [[xa + 3 + (xb - xa - 6) * f, ya - alto + 1], [xa - 7 + (xb - xa + 14) * f, ya + 1]]);
}
// Edificio en 3/4: fachada con ventanas y locales, azotea con el pretil (de atrás se ve la cara de adentro), máquinas,
// tanque de agua, casilla de la escalera y, si se incendia, el agujero quemado con el resplandor
function edificio34(ctx, b) {
  const { x, yF, w, prof, alto, col, k } = b, yR = yF - alto;
  sombraCaja(ctx, x, x + w, yF, prof, alto, 0.32);
  pb(ctx, rr(x, yR, w, alto, 0.4), col, { sombra: 0.6, brillo: 0.12 });
  if (!Pincel.silueta) {
    for (let p = 0; p < Math.floor((alto - 10) / 9); p++) for (let v = 0; v < Math.floor((w - 4) / 8); v++) {
      const q = azar(k * 97 + p * 13 + v, 501);
      ctx.fillStyle = q > 0.9 ? 'rgba(255,190,90,0.9)' : q > 0.84 ? 'rgba(255,120,50,0.75)' : q > 0.55 ? 'rgba(18,16,20,0.9)' : 'rgba(64,72,84,0.9)';
      ctx.fillRect(x + 3 + v * 8, yR + 3 + p * 9, 4.4, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(x + 3 + v * 8, yR + 3 + p * 9, 4.4, 0.7);
    }
    ctx.fillStyle = 'rgba(20,18,22,0.85)'; ctx.fillRect(x + 2, yF - 8, w - 4, 7);   // locales con la persiana baja
    ctx.strokeStyle = 'rgba(120,118,112,0.45)'; ctx.lineWidth = 0.4; for (let y = yF - 7; y < yF - 1; y += 1.4) { ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + w - 2, y); ctx.stroke(); }
    if (azar(k, 506) > 0.5) { ctx.fillStyle = ['#7a2e26', '#2f5a6a', '#6a6a2a'][k % 3]; ctx.beginPath(); ctx.moveTo(x + 4, yF - 9); ctx.lineTo(x + w * 0.6, yF - 9); ctx.lineTo(x + w * 0.6 + 2, yF - 6.2); ctx.lineTo(x + 6, yF - 6.2); ctx.closePath(); ctx.fill(); }   // toldo
  }
  pb(ctx, rr(x, yR - prof, w, prof, 0.4), ajustarColor(col, 0.18), { sombra: 0.3, brillo: 0.35 });   // pretil
  if (Pincel.silueta) return;
  ctx.fillStyle = '#56534e'; ctx.fillRect(x + 2.2, yR - prof + 2, w - 4.4, prof - 3.6);                 // membrana del techo
  ctx.fillStyle = ajustarColor(col, -0.22); ctx.fillRect(x + 2.2, yR - prof + 2, w - 4.4, 2.6);          // cara de adentro del pretil de atrás
  for (let j = 0; j < 10; j++) { ctx.fillStyle = j % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 3 + azar(k * 10 + j, 507) * (w - 8), yR - prof + 5 + azar(k * 10 + j, 508) * (prof - 9), 3 + azar(j, 509) * 6, 1); }
  if (azar(k, 502) > 0.3) caja34(ctx, x + w * 0.14, x + w * 0.14 + 9, yR - prof * 0.3, 5, 4, '#7c8085', '#a3a7ac');   // máquina de aire
  if (azar(k, 505) > 0.35) caja34(ctx, x + w * 0.4, x + w * 0.4 + 10, yR - prof * 0.6, 7, 7, '#69655f', '#837f78');    // casilla de la escalera
  if (azar(k, 503) > 0.45) { const tx = x + w * 0.76, ty = yR - prof * 0.42; linea(ctx, '#3a3530', 0.7, [[tx - 3, ty], [tx - 3, ty - 4]]); linea(ctx, '#3a3530', 0.7, [[tx + 3, ty], [tx + 3, ty - 4]]); cilindro34(ctx, tx, ty - 4, 4, 7, '#6b5a48'); }
  if (b.fuego || azar(k, 504) > 0.62) {   // agujero quemado en la membrana
    const ax = x + w * 0.5, ay = yR - prof * 0.55;
    ctx.fillStyle = 'rgba(30,24,20,0.55)'; ctx.beginPath(); ctx.ellipse(ax, ay, w * 0.2, prof * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(8,6,6,0.85)'; ctx.beginPath(); ctx.ellipse(ax, ay, w * 0.12, prof * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (b.fuego) {   // fuego en la azotea: resplandor y lenguas (el humo sube por cuadro)
    const fx = x + w * 0.5, fy = yR - prof * 0.55;
    const g = ctx.createRadialGradient(fx, fy, 1, fx, fy, 30); g.addColorStop(0, 'rgba(255,150,60,0.6)'); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g; ctx.fillRect(fx - 30, fy - 30, 60, 60);
    for (let j = 0; j < 4; j++) { const lx = fx - 6 + j * 4, la = 6 + azar(k * 4 + j, 512) * 7; ctx.fillStyle = j % 2 ? '#ffb347' : '#ff7a2a'; ctx.beginPath(); ctx.moveTo(lx - 2.2, fy + 1); ctx.quadraticCurveTo(lx - 2, fy - la * 0.5, lx + 0.6, fy - la); ctx.quadraticCurveTo(lx + 2.4, fy - la * 0.5, lx + 2.2, fy + 1); ctx.closePath(); ctx.fill(); }
  }
}

// Rollo de pasto acostado, visto desde la cámara alta: el lomo con luz y la tapa en espiral
function cilindroAcostado(ctx, x, y) {
  sombraPiso(ctx, 8, 2.6, 0.3, x + 4, y);
  pb(ctx, rr(x - 7, y - 9, 12, 9, 4), '#c8a14c', { sombra: 0.6, brillo: 0.35, linea: 0.35 });
  pb(ctx, c => c.ellipse(x + 5, y - 4.5, 2.6, 4.5, 0, 0, Math.PI * 2), '#b08a3a', { sombra: 0.3, linea: 0.35 });
  if (!Pincel.silueta) { ctx.strokeStyle = 'rgba(110,75,20,0.55)'; ctx.lineWidth = 0.4; for (let r = 0.8; r < 2.6; r += 0.9) { ctx.beginPath(); ctx.ellipse(x + 5, y - 4.5, r, r * 1.7, 0, 0, Math.PI * 2); ctx.stroke(); } }
}
// Alambrado sobre el canto (en pantalla): postes con su sombra y dos hilos; s: escala a esa distancia; hueco: [x0, x1]
function alambrado34(ctx, arriba, desde, hasta, hueco, s = 1) {
  const postes = [];
  for (let x = desde; x < hasta; x += 19 * s) { if (hueco && x > hueco[0] - 4 && x < hueco[1] + 4) { postes.push(null); continue; } postes.push([x, yEn(arriba, x) + 0.4]); }
  ctx.strokeStyle = 'rgba(160,165,170,0.75)'; ctx.lineWidth = 0.5;
  for (const dz of [3.4 * s, 7 * s]) { ctx.beginPath(); for (let i = 1; i < postes.length; i++) { const a = postes[i - 1], b = postes[i]; if (!a || !b) continue; ctx.moveTo(a[0], a[1] - dz); ctx.lineTo(b[0], b[1] - dz); } ctx.stroke(); }
  for (const p of postes) { if (!p) continue; ctx.fillStyle = 'rgba(10,8,6,0.3)'; ctx.fillRect(p[0] + s, p[1] - 0.6, 3.4 * s, 1.2); pb(ctx, rr(p[0] - 0.9 * s, p[1] - 9 * s, 1.8 * s, 9 * s, 0.4), '#6a5438', { sombra: 0.3, linea: 0.35, brillo: 0.2 }); }
}
// Piedra suelta en 3/4 (cara de arriba con luz, la de la derecha en sombra) con su sombra
function piedra34(ctx, x, y, r, col = '#9a6a4a') {
  sombraPiso(ctx, r * 1.3, r * 0.5, 0.3, x + r * 0.8, y + 1);
  pb(ctx, c => { c.moveTo(x - r, y); c.lineTo(x - r * 0.7, y - r * 0.8); c.lineTo(x + r * 0.3, y - r); c.lineTo(x + r, y - r * 0.4); c.lineTo(x + r, y); c.closePath(); }, col, { sombra: 0.5, brillo: 0.3, linea: 0.4 });
}
// Peñasco nevado del fondo de la montaña: roca grande con la cara de la izquierda al sol y nieve en lo alto
function penasco34(ctx, x, y, r) {
  sombraPiso(ctx, r * 1.2, r * 0.4, 0.3, x + r * 0.6, y + 1);
  pb(ctx, c => { c.moveTo(x - r, y); c.lineTo(x - r * 0.55, y - r * 0.9); c.lineTo(x - r * 0.1, y - r * 1.3); c.lineTo(x + r * 0.45, y - r * 0.85); c.lineTo(x + r, y); c.closePath(); }, '#7d838b', { sombra: 0.8, brillo: 0.3, linea: 0.45 });
  detalle(ctx, 'rgba(0,0,0,0.2)', c => { c.moveTo(x - r * 0.1, y - r * 1.3); c.lineTo(x + r * 0.45, y - r * 0.85); c.lineTo(x + r, y); c.lineTo(x + r * 0.1, y); c.closePath(); });
  pb(ctx, c => { c.moveTo(x - r * 0.1, y - r * 1.3); c.lineTo(x - r * 0.42, y - r * 0.95); c.quadraticCurveTo(x - r * 0.1, y - r * 0.85, x + r * 0.32, y - r * 0.92); c.closePath(); }, '#f1f5f8', { sombra: 0.3, brillo: 0.4, linea: 0.35 });
}

PaisajeBastion.borde = function (N, cam) {
  const A = ANCHO, h = BASTION.arriba - 26, E = ESCALON_BASTION[N.fondo] || ESCALON_BASTION.granja;
  const sal = { granja: 11, ciudad: 12, bosque: 13, desierto: 14, montana: 15 }[N.fondo] || 11;
  const izq = cam.desproyectar(0, -6), der = cam.desproyectar(A, -6);
  const X0 = izq.x - 40, X1 = der.x + 40, Y0 = izq.y - 30;   // lo que alcanza a verse de la meseta
  const base = lineaEscalon(X0 - 60, X1 + 60, h, E.salto, sal * 31);
  // Hasta dónde se ve el piso de la meseta en cada x: lo que queda justo detrás del canto del escalón
  const canto = x => { const P = cam.proyectar(x, yEn(base, x)); return cam.desproyectar(P.x, P.y - E.alto * P.s).y; };
  const yf = canto(cam.XV), sp = y => cam.escala(y);
  const atras = [], adelante = [], anclas = { focos: [] };
  const poner = (lista, x, y, dibujar) => lista.push({ x, y, dibujar });
  let pisoNivel = () => {}, trasAtras = null, sobreEscalon = () => {};
  switch (N.fondo) {
    case 'granja': {
      // Campos en dos franjas con un camino de este a oeste entre medio; el camino que baja por la rampa; la granja
      // adelante (casa, molino, granero, silo y rollos de pasto) y cortinas de árboles que se pierden a lo lejos
      const xr = Math.round(A * 0.6), xr1 = xr + 30, eo = [-150, -134];
      anclas.rampa = [xr, xr1];
      const parcelas = [];
      for (const [ya, yb, s2] of [[Y0, eo[0] - 4, 701], [eo[1] + 6, yf - 66, 711]]) {
        for (let x = X0, k = 0; x < X1; k++) {
          const w = 110 + azar(k, s2) * 130;
          if (!(x < xr1 + 18 && x + w > xr - 18)) parcelas.push([x, ya + azar(k, s2 + 1) * 8, w, yb - ya - azar(k, s2 + 2) * 14, ['trigo', 'maiz', 'arado', 'verde', 'trigo'][(k + s2) % 5]]);
          x += w + 16;
        }
      }
      pisoNivel = ctx => {
        ctx.fillStyle = '#8a7350'; ctx.fillRect(xr + 3, Y0 - 100, xr1 - xr - 6, h - Y0 + 130); ctx.fillRect(X0 - 100, eo[0], X1 - X0 + 200, eo[1] - eo[0]);
        for (const f of [0.3, 0.7]) linea(ctx, 'rgba(60,40,20,0.3)', 1.4, [[xr + 3 + (xr1 - xr - 6) * f, Y0 - 100], [xr + 3 + (xr1 - xr - 6) * f, h + 10]]);
        for (const [x, y, w, d, tipo] of parcelas) parcela34(ctx, x, y, w, d, tipo);
      };
      const yC = yf - 8;
      poner(atras, 270, yC, ctx => casa34(ctx, 246, yC, 48, 24 * sp(yC), 15, '#e8dcc0', '#6b4a36', { ventanas: [[0.25, true], [0.75, false]], puerta: 0.52, chimenea: 0.78 }));
      const mx = Math.round(A * 0.3), my = yC + 3; anclas.molino = [mx, my];
      poner(atras, mx, my, ctx => {
        sombraPiso(ctx, 10, 3, 0.25, mx + 9, my);
        ctx.strokeStyle = '#7d7d7d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx - 7, my); ctx.lineTo(mx, my - 58); ctx.lineTo(mx + 7, my); ctx.moveTo(mx - 5, my - 18); ctx.lineTo(mx + 5, my - 18); ctx.moveTo(mx - 3.4, my - 36); ctx.lineTo(mx + 3.4, my - 36); ctx.stroke();
        ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.moveTo(mx + 2, my - 59); ctx.lineTo(mx + 14, my - 62); ctx.lineTo(mx + 14, my - 55); ctx.fill();   // cola
      });
      poner(atras, 457, yC + 2, ctx => casa34(ctx, 426, yC + 2, 62, 32 * sp(yC), 21, '#9a2f22', '#4e4a48', { granero: true }));
      poner(atras, 504, yC + 1, ctx => cilindro34(ctx, 504, yC + 1, 9, 42, '#c3c6ca'));
      for (const [x, dy] of [[196, -30], [214, -24], [232, -32], [316, -40], [560, -26]]) { const y = yC + dy; poner(atras, x, y, ctx => cilindroAcostado(ctx, x, y)); }
      // Cortinas de árboles: a lo largo del camino de este a oeste y a los dos lados del camino que baja
      for (let x = X0 + 10, k = 0; x < X1; x += 52 + azar(k, 721) * 40, k++) { if (x > xr - 24 && x < xr1 + 24) continue; const y = eo[0] - 5 - azar(k, 722) * 4, r = 9 + azar(k, 723) * 4; poner(atras, x, y, ctx => arbol34(ctx, x, y, r, '#3f6d2b')); }
      for (let y = Y0 + 10, k = 0; y < yf - 70; y += 40 + azar(k, 727) * 16, k++) for (const x of [xr - 10, xr1 + 10]) { const r = 8 + azar(k * 2 + (x > xr ? 1 : 0), 728) * 3; poner(atras, x, y, ctx => arbol34(ctx, x, y, r, '#3a6528')); }
      for (const [x, dy, r] of [[62, -50, 12], [112, -18, 10], [380, -14, 9], [xr - 34, -10, 11], [xr + 90, -26, 13], [xr + 296, -4, 11], [xr + 420, -34, 12], [-90, -30, 12], [-260, -40, 13], [A + 110, -20, 12], [A + 280, -46, 13]]) { const y = yf + dy; poner(atras, x, y, ctx => arbol34(ctx, x, y, r, '#3f6d2b')); }
      sobreEscalon = (ctx, Bp, arribaP, alto, s) => {
        const XA = cam.proyectar(xr, yEn(base, xr)).x, XB = cam.proyectar(xr1, yEn(base, xr1)).x;
        rampa34(ctx, Bp, alto, XA, XB, '#8a7350');
        alambrado34(ctx, arribaP, Bp[0][0], Bp[Bp.length - 1][0], [XA, XB], s);
      };
      break;
    }
    case 'ciudad': {
      // Manzanas en filas con una calle de este a oeste delante de cada una y avenidas de norte a sur; en cada manzana
      // los edificios pegados a la vereda, cada vez más lejos; tres azoteas incendiadas; autos y faroles en la de adelante
      const calles = [[yf - 28, yf - 9], [yf - 156, yf - 137], [yf - 284, yf - 265], [yf - 412, yf - 393]];
      const avenidas = []; for (let x = Math.floor(X0 / 280) * 280 + 140; x < X1 + 280; x += 280) avenidas.push(x);
      pisoNivel = ctx => {
        for (const ax of avenidas) { ctx.fillStyle = '#3c3b3e'; ctx.fillRect(ax - 12, Y0 - 100, 24, h - Y0 + 120); ctx.fillStyle = '#9a968e'; ctx.fillRect(ax - 14, Y0 - 100, 2, h - Y0 + 120); ctx.fillRect(ax + 12, Y0 - 100, 2, h - Y0 + 120); for (let y = Y0 - 100; y < h; y += 30) { ctx.fillStyle = 'rgba(235,225,170,0.5)'; ctx.fillRect(ax - 0.7, y, 1.4, 14); } }
        for (const [a, b] of calles) {
          ctx.fillStyle = '#3c3b3e'; ctx.fillRect(X0 - 100, a, X1 - X0 + 200, b - a);
          ctx.fillStyle = '#9a968e'; ctx.fillRect(X0 - 100, a - 2, X1 - X0 + 200, 2); ctx.fillRect(X0 - 100, b, X1 - X0 + 200, 2);
          for (let x = X0; x < X1; x += 46) { ctx.fillStyle = 'rgba(235,225,170,0.55)'; ctx.fillRect(x, (a + b) / 2 - 0.7, 20, 1.4); }
          for (const ax of avenidas) for (let x = ax - 11; x < ax + 11; x += 3.4) { ctx.fillStyle = 'rgba(235,235,230,0.6)'; ctx.fillRect(x, b + 3, 1.8, 7); }   // cruce peatonal
        }
      };
      const colores = ['#5b5452', '#4d4a50', '#6a5a4c', '#57544a', '#625c58', '#4f4b47'];
      calles.forEach(([a], fila) => {
        const yF = a - 3, fondoMz = fila + 1 < calles.length ? calles[fila + 1][1] + 3 : Y0 - 60, profMax = yF - fondoMz, s = sp(yF);
        for (let x = X0, k = fila * 61; x < X1; k++) {
          const w = 44 + azar(k, 561) * 58, choca = avenidas.find(ax => x < ax + 18 && x + w > ax - 18);
          if (choca !== undefined) { x = choca + 18; continue; }
          const b = { x, yF, w, prof: Math.min(profMax - 8, 46 + azar(k, 572) * 50) * s, alto: 24 + azar(k, 573) * 40 + fila * 6, col: colores[k % 6], k, fuego: fila < 3 && azar(k, 574) > 0.82 };
          poner(atras, x + w / 2, yF, ctx => edificio34(ctx, b));
          if (b.fuego) anclas.focos.push([b.x + b.w / 2, yF, b.alto + b.prof * 0.55]);
          x += w + 6 + azar(k, 575) * 12;
        }
      });
      for (const [fx, k] of [[0.24, 1], [0.66, 2], [0.43, 3]]) { const x = A * fx, y = calles[0][1] - 4; poner(atras, x, y, ctx => { ctx.save(); ctx.translate(x, y); ctx.scale(0.72, 0.72); PaisajeBastion.obstaculoCuerpo(ctx, 'auto', k); ctx.restore(); }); }
      for (let x = X0 + 40; x < X1; x += 120) { const y = yf - 4; poner(atras, x, y, ctx => { linea(ctx, '#3a3c40', 1, [[x, y], [x, y - 27]]); linea(ctx, '#3a3c40', 1, [[x, y - 27], [x + 6, y - 28]]); ctx.fillStyle = 'rgba(255,230,160,0.55)'; ctx.fillRect(x + 4, y - 27, 3, 1.4); }); }   // faroles
      sobreEscalon = (ctx, Bp, arribaP, alto, s) => {   // baranda de defensa sobre el muro de contención
        for (let x = Bp[0][0]; x < Bp[Bp.length - 1][0]; x += 16 * s) { const y = yEn(arribaP, x); ctx.fillStyle = 'rgba(10,8,6,0.3)'; ctx.fillRect(x + 1, y + 0.4, 2.6 * s, 1); pb(ctx, rr(x - 0.8 * s, y - 6 * s, 1.6 * s, 6 * s, 0.3), '#6d7175', { sombra: 0.2, linea: 0.3, brillo: 0.2 }); }
        ctx.fillStyle = '#9da2a7'; ctx.beginPath(); polilinea(ctx, corrida(arribaP, 0, -6 * s)); polilinea(ctx, corrida(arribaP, 0, -3.4 * s).reverse()); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#5c6064'; ctx.lineWidth = 0.5; ctx.beginPath(); polilinea(ctx, corrida(arribaP, 0, -3.4 * s)); ctx.stroke();
      };
      break;
    }
    case 'bosque': {
      // Bosque cerrado de pinos que se pierde a lo lejos, la orilla tupida sobre la barranca y la noche encima
      pisoNivel = ctx => { for (let k = 0; k < 500; k++) { const x = X0 + azar(k, 527) * (X1 - X0), y = Y0 + azar(k, 528) * (h - Y0); ctx.fillStyle = k % 2 ? 'rgba(90,70,40,0.35)' : 'rgba(10,18,10,0.35)'; ctx.fillRect(x, y, 2 + azar(k, 529) * 3, 0.8); } };
      const n = Math.round((X1 - X0) * (yf - Y0) / 1100);
      for (let k = 0; k < n; k++) { const x = X0 + azar(k, 521) * (X1 - X0), y = Y0 + azar(k, 522) * (yf - 6 - Y0), a = 26 + azar(k, 523) * 16, col = k % 3 ? '#1f3b29' : '#26472f'; poner(atras, x, y, ctx => pino34(ctx, x, y, a, col, false)); }
      for (let x = X0; x < X1; x += 20) { const xx = x + azar(x | 0, 524) * 8, y = canto(xx) - 3 - azar(x | 0, 525) * 5, a = 24 + azar(x | 0, 526) * 12; poner(atras, xx, y, ctx => pino34(ctx, xx, y, a, '#26472f', false)); }
      trasAtras = ctx => {
        const arriba = base.map(([x, y]) => { const P = cam.proyectar(x, y); return [P.x, P.y - E.alto * P.s]; });
        ctx.save(); ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(A + 20, -20); ctx.lineTo(A + 20, arriba[arriba.length - 1][1]); for (let i = arriba.length - 1; i >= 0; i--) ctx.lineTo(arriba[i][0], arriba[i][1] + 1); ctx.lineTo(-20, arriba[0][1]); ctx.closePath(); ctx.clip();
        ctx.fillStyle = 'rgba(8,14,30,0.32)'; ctx.fillRect(-20, -20, A + 40, ALTO);   // noche
        const yc = yEn(arriba, A / 2), niebla = ctx.createLinearGradient(0, yc - 34, 0, yc + 4); niebla.addColorStop(0, 'rgba(140,160,190,0)'); niebla.addColorStop(1, 'rgba(140,160,190,0.2)');
        ctx.fillStyle = niebla; ctx.fillRect(-20, yc - 34, A + 40, 40);
        ctx.restore();
      };
      for (const fx of [0.17, 0.54, 0.85]) { const x = A * fx, y = yEn(base, x) + 7; poner(adelante, x, y, ctx => { sombraPiso(ctx, 16, 3, 0.3, x + 4, y + 1); pb(ctx, rr(x - 14, y - 5, 28, 5, 2.4), '#5a3c22', { sombra: 0.4, linea: 0.35 }); pb(ctx, c => c.ellipse(x + 14, y - 2.5, 1.6, 2.5, 0, 0, Math.PI * 2), '#8a6a44', { sombra: 0.2, linea: 0.3 }); }); }   // troncos caídos al pie
      break;
    }
    case 'desierto': {
      // Meseta con piedras y cactus, el cañón que la corta y baja por una rampa, y el talud de piedras al pie
      const ca = Math.round(A * 0.62), cb = Math.round(A * 0.71);
      pisoNivel = ctx => {
        for (let k = 0; k < 160; k++) { ctx.fillStyle = k % 2 ? 'rgba(90,40,20,0.2)' : 'rgba(255,220,180,0.15)'; ctx.beginPath(); ctx.ellipse(X0 + azar(k, 531) * (X1 - X0), Y0 + azar(k, 532) * (h - Y0), 6 + azar(k, 533) * 18, 2 + azar(k, 534) * 4, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#d9b47a'; ctx.fillRect(ca + 3, Y0 - 100, cb - ca - 6, h - Y0 + 130);
        for (let y = Y0; y < h; y += 9) { ctx.strokeStyle = 'rgba(150,110,60,0.25)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(ca + 5, y); ctx.quadraticCurveTo((ca + cb) / 2, y - 3, cb - 5, y); ctx.stroke(); }   // ondas de arena en el cañón
      };
      for (let k = 0; k < 50; k++) { const x = X0 + azar(k, 536) * (X1 - X0), y = Y0 + 10 + azar(k, 537) * (yf - 16 - Y0), r = 3 + azar(k, 538) * 7; if (x > ca - 12 && x < cb + 12) continue; poner(atras, x, y, ctx => piedra34(ctx, x, y, r)); }
      for (let k = 0; k < 18; k++) { const x = X0 + azar(k, 539) * (X1 - X0), y = Y0 + 20 + azar(k, 540) * (yf - 30 - Y0); if (x > ca - 12 && x < cb + 12) continue; poner(atras, x, y, ctx => { ctx.save(); ctx.translate(x, y); ctx.scale(0.6, 0.6); PaisajeBastion.obstaculoCuerpo(ctx, 'cactus', 0); ctx.restore(); }); }
      for (let k = 0; k < 70; k++) { const x = X0 + azar(k, 541) * (X1 - X0), r = 1.6 + azar(k, 542) * 3.6; if (x > ca - 14 && x < cb + 14) continue; const y = yEn(base, x) + 2 + azar(k, 543) * 4; poner(adelante, x, y, ctx => piedra34(ctx, x, y, r)); }   // talud
      sobreEscalon = (ctx, Bp, arribaP, alto) => rampa34(ctx, Bp, alto, cam.proyectar(ca, yEn(base, ca)).x, cam.proyectar(cb, yEn(base, cb)).x, '#d9b47a');
      break;
    }
    case 'montana': {
      // Meseta nevada con montículos, piedras, pinos y peñascos al fondo; pinos al pie del paredón
      pisoNivel = ctx => { for (let k = 0; k < 90; k++) { ctx.fillStyle = k % 3 ? 'rgba(150,175,200,0.28)' : 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(X0 + azar(k, 541) * (X1 - X0), Y0 + azar(k, 542) * (h - Y0), 18 + azar(k, 543) * 30, 4 + azar(k, 544) * 3, 0, 0, Math.PI * 2); ctx.fill(); } };
      for (let k = 0; k < 7; k++) { const x = X0 + (k + 0.5) / 7 * (X1 - X0) + (azar(k, 545) - 0.5) * 120, y = Y0 + 110 + azar(k, 546) * 70, r = 34 + azar(k, 547) * 26; poner(atras, x, y, ctx => penasco34(ctx, x, y, r)); }
      for (let k = 0; k < 18; k++) { const x = X0 + azar(k, 548) * (X1 - X0), y = Y0 + 60 + azar(k, 549) * (yf - 70 - Y0), r = 4 + azar(k, 550) * 6; poner(atras, x, y, ctx => piedra34(ctx, x, y, r, '#8a8f96')); }
      for (let k = 0; k < 46; k++) { const x = X0 + azar(k, 554) * (X1 - X0), y = Y0 + 40 + azar(k, 555) * (yf - 46 - Y0), a = 20 + azar(k, 556) * 9; poner(atras, x, y, ctx => pino34(ctx, x, y, a, '#2b4a38', true)); }
      for (let k = 0; k < 26; k++) { const x = X0 + azar(k, 551) * (X1 - X0), y = yEn(base, x) + 5 + azar(k, 552) * 6, a = 22 + azar(k, 553) * 10; poner(adelante, x, y, ctx => pino34(ctx, x, y, a, '#2b4a38', true)); }
      break;
    }
  }
  PaisajeBastion.anclas = Object.assign(anclas, { X0, X1, Y0, yf, base });
  const recorte = ctx => { ctx.beginPath(); ctx.moveTo(X0 - 100, Y0 - 100); ctx.lineTo(X1 + 100, Y0 - 100); ctx.lineTo(X1 + 100, base[base.length - 1][1] + 0.5); for (let i = base.length - 1; i >= 0; i--) ctx.lineTo(base[i][0], base[i][1] + 0.5); ctx.lineTo(X0 - 100, base[0][1] + 0.5); ctx.closePath(); };
  return {
    atras, adelante, trasAtras,
    // El piso de la meseta (plano): el color de base, manchas grandes y lo propio de cada escenario
    piso(ctx) {
      ctx.save(); recorte(ctx); ctx.clip();
      ctx.fillStyle = E.piso; ctx.fillRect(X0 - 100, Y0 - 100, X1 - X0 + 200, h - Y0 + 140);
      for (let k = 0; k < 90; k++) {
        const x = X0 + azar(k, 691) * (X1 - X0), y = Y0 + azar(k, 692) * (h - Y0), r = 24 + azar(k, 693) * 60, g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, k % 2 ? 'rgba(255,250,220,0.08)' : 'rgba(10,8,4,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      }
      pisoNivel(ctx);
      ctx.restore();
    },
    // El escalón, en pantalla: la línea donde toca el campo proyectada y la altura a esa distancia
    escalon(ctx) {
      const Bp = base.map(([x, y]) => { const P = cam.proyectar(x, y); return [P.x, P.y]; }), s = cam.escala(h), alto = E.alto * s;
      const arribaP = escalon34(ctx, Bp, alto, E);
      sobreEscalon(ctx, Bp, arribaP, alto, s);
    },
  };
};

// Lo que se mueve en cada escenario, por cuadro y con la cámara: aspas, sombras de nubes, buitres, humo, luciérnagas, nieve
PaisajeBastion.fondoVivo = function (ctx, N, ms, cam) {
  const An = PaisajeBastion.anclas || {}, A = ANCHO, X0 = An.X0 ?? -300, X1 = An.X1 ?? A + 300, Y0 = An.Y0 ?? -300, yf = An.yf ?? 120;
  if (N.fondo === 'granja' && An.molino) { const P = cam.proyectar(An.molino[0], An.molino[1]); aspasMolino(ctx, P.x, P.y - 58 * P.s, ms, P.s); }
  if (Lienzo.liviano) return;
  switch (N.fondo) {
    case 'granja': case 'desierto':
      for (let k = 0; k < 5; k++) {   // sombras de nubes que pasan por el piso
        const x = X0 - 200 + (k * 460 + ms * 0.02) % (X1 - X0 + 400), y = Y0 + 60 + k * 120, P = cam.proyectar(x, y);
        ctx.fillStyle = 'rgba(20,30,40,0.08)'; ctx.beginPath(); ctx.ellipse(P.x, P.y, 130 * P.s, 54 * P.s * P.s, 0.1, 0, Math.PI * 2); ctx.fill();
      }
      if (N.fondo === 'desierto') for (let k = 0; k < 3; k++) {   // buitres en ronda, con su sombra en el piso
        const a = ms / 2500 + k * 2.1, x = A * 0.6 + Math.cos(a) * 80, y = -60 + Math.sin(a) * 40 + k * 14, S = cam.proyectar(x, y), P = cam.proyectar(x, y, 80), b = Math.sin(ms / 200 + k) * 2;
        ctx.fillStyle = 'rgba(40,20,10,0.18)'; ctx.beginPath(); ctx.ellipse(S.x + 12 * S.s, S.y, 7 * S.s, 2 * S.s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(P.x, P.y); ctx.scale(P.s, P.s); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-8, -b); ctx.quadraticCurveTo(-3, -2, 0, 0); ctx.quadraticCurveTo(3, -2, 8, -b); ctx.stroke(); ctx.restore();
      }
      break;
    case 'ciudad':
      (An.focos || []).forEach(([x0, y0, alto], sal) => {   // humo de los incendios de las azoteas
        const P = cam.proyectar(x0, y0, alto);
        for (let k = 0; k < 9; k++) { const t = ((ms / 5000 + k / 9 + sal * 0.13) % 1), r = (6 + t * 24) * P.s; ctx.fillStyle = `rgba(40,32,36,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(P.x + (t * 46 + Math.sin(t * 6 + sal) * 6) * P.s, P.y - (6 + t * 90) * P.s, r, 0, Math.PI * 2); ctx.fill(); }
      });
      break;
    case 'bosque':
      for (let k = 0; k < 30; k++) {   // luciérnagas entre los pinos
        const x = X0 + ((azar(k, 121) * (X1 - X0) + ms * 0.01 * (k % 2 ? 1 : -1)) % (X1 - X0) + (X1 - X0)) % (X1 - X0), y = Y0 + 40 + azar(k, 122) * (yf - Y0 - 40);
        const P = cam.proyectar(x, y, 8 + 10 * Math.sin(ms / 500 + k)), b = 0.5 + 0.5 * Math.sin(ms / 300 + k * 2);
        ctx.fillStyle = `rgba(220,255,140,${0.7 * b})`; ctx.beginPath(); ctx.arc(P.x, P.y, 1.2 * Math.max(0.6, P.s), 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'montana':
      for (let k = 0; k < 90; k++) { const y = (azar(k, 61) * ALTO + ms * 0.03 * (0.5 + azar(k, 62))) % ALTO, x = (azar(k, 63) * A + Math.sin(ms / 700 + k) * 8 + A) % A; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x, y, 0.8 + azar(k, 64), 0, Math.PI * 2); ctx.fill(); }
      break;
  }
};
