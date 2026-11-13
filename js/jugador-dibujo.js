/* ===== Dibujo del jugador =====
 * Un sobreviviente con chaleco táctico, mochila, gorra y mangas arremangadas. Cada pieza se pinta
 * con volumen (luz a la izquierda) y un contorno fino, y las piernas se articulan en la rodilla.
 * Todo se dibuja alrededor de los pies (0, 0) mirando a la derecha; el cuerpo se reutiliza para la sombra.
 */
const COLORES_JUGADOR = {
  piel: '#e2b48d', pelo: '#3b2a1c', gorra: '#2f3236', chaqueta: '#5e6a3d', chaleco: '#33363b', bolsillo: '#4a4e55',
  pantalon: '#6f6a52', rodillera: '#2e2b27', bota: '#2a211b', cinturon: '#4a3524', bolsa: '#3f4a30', funda: '#2e2a26',
  mochila: '#4d4a35', manta: '#6a7f8a', guante: '#2a2623', correa: '#26231f',
};

/* ---------- Pintura de ilustración para el personaje ----------
 * Sombreado de dos tonos con la luz arriba a la izquierda: la forma se rellena con el tono oscuro y encima la misma
 * forma corrida hacia la luz con el tono base (queda una franja de sombra abajo a la derecha), un brillo fino en el
 * borde iluminado y un contorno del mismo color, más oscuro (no negro). En la pasada de la sombra, solo la silueta. */
function pintura(ctx, trazar, color, op = {}) {
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  const corre = op.sombra ?? 1.3;
  ctx.save();
  ctx.fillStyle = ajustarColor(color, -(op.oscuro ?? 0.3)); ctx.fill();
  ctx.clip();
  ctx.translate(-corre * 0.7, -corre);
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  const g = ctx.createLinearGradient(0, op.y0 ?? -90, 0, op.y1 ?? 0);
  g.addColorStop(0, ajustarColor(color, 0.06)); g.addColorStop(1, ajustarColor(color, -0.06));
  ctx.fillStyle = op.plano ? color : g; ctx.fill();
  if (op.brillo !== false) {
    ctx.translate(corre * 0.7 + 0.55, corre + 0.55);
    ctx.beginPath(); trazar(ctx); ctx.closePath();
    ctx.strokeStyle = `rgba(255, 246, 225, ${op.brillo ?? 0.3})`; ctx.lineWidth = 0.7; ctx.lineCap = 'butt'; ctx.stroke();
  }
  ctx.restore();
  if (op.contorno !== false) { ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.strokeStyle = ajustarColor(color, -0.62); ctx.lineWidth = op.linea ?? 0.5; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.stroke(); }
}
// Tramo de brazo o pierna: más ancho al principio que al final, con los extremos redondeados y un bulto de músculo
// (abulta > 0 hacia un lado de la normal, < 0 hacia el otro)
function tramo(x0, y0, x1, y1, w0, w1, abulta = 0) {
  return c => {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    const m = (w0 + w1) / 4, tn = Math.atan2(ny, nx);
    const p = (k, s, w) => [x0 + dx * k + nx * s * w, y0 + dy * k + ny * s * w];
    c.moveTo(...p(0, 1, w0 / 2));
    c.quadraticCurveTo(...p(0.45, 1, m + Math.max(0, abulta)), ...p(1, 1, w1 / 2));
    c.arc(x1, y1, w1 / 2, tn, tn - Math.PI, true);
    c.quadraticCurveTo(...p(0.45, -1, m + Math.max(0, -abulta)), ...p(0, -1, w0 / 2));
    c.arc(x0, y0, w0 / 2, tn - Math.PI, tn - 2 * Math.PI, true);
  };
}
const raya = (ctx, color, ancho, pts) => { if (!Pincel.silueta) linea(ctx, color, ancho, pts); };

// Camuflaje multiterreno: manchas fijas a la tela (se mueven con la pierna) y encima una sombra de costado para no perder volumen
function camuflaje(ctx, trazar, colores, ox, oy, ang, ancho, largo, sal, oscuro = 0) {
  if (Pincel.silueta || !colores) return;
  ctx.save(); ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.clip();
  ctx.translate(ox, oy); ctx.rotate(ang);
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * 0.8;
  for (let k = 0; k < 16; k++) {
    const col = colores[k % colores.length];
    ctx.fillStyle = oscuro ? ajustarColor(col, -oscuro) : col;
    const x = (azar(k, sal) - 0.5) * ancho * 1.2, y = -2 + azar(k, sal + 1) * (largo + 4);
    ctx.beginPath(); ctx.ellipse(x, y, 0.9 + azar(k, sal + 2) * 1.8, 0.7 + azar(k, sal + 3) * 1.3, azar(k, sal + 4) * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = a0;
  const g = ctx.createLinearGradient(-ancho / 2, 0, ancho / 2, 0);
  g.addColorStop(0, 'rgba(255, 245, 220, 0.12)'); g.addColorStop(0.5, 'rgba(0, 0, 0, 0)'); g.addColorStop(1, 'rgba(15, 10, 5, 0.3)');
  ctx.fillStyle = g; ctx.fillRect(-ancho, -4, ancho * 2, largo + 8);
  ctx.restore();
}
const repasar = (ctx, trazar, color) => { if (Pincel.silueta) return; ctx.beginPath(); trazar(ctx); ctx.closePath(); ctx.strokeStyle = ajustarColor(color, -0.62); ctx.lineWidth = 0.5; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.stroke(); };

/* --- Partes del cuerpo --- */
// Pierna articulada: muslo desde la cadera, rodilla, canilla y bota. a = ángulo del muslo (adelante > 0), doblez = flexión de la rodilla.
// Proporciones de una persona real: muslo y canilla finos, rodillera dura, botamanga abolsada sobre la bota de caña alta.
function piernaArticulada(ctx, hx, hy, a, doblez, color, C) {
  const L1 = 13, L2 = 12;
  const kx = hx + Math.sin(a) * L1, ky = hy + Math.cos(a) * L1;
  const b = a - doblez;
  const px = kx + Math.sin(b) * L2, py = ky + Math.cos(b) * L2;
  const lejos = color !== C.pantalon ? 0.2 : 0;
  // Canilla con la pantorrilla atrás (va primero: el muslo tapa la unión)
  const canilla = tramo(kx, ky, px, py - 3, 7, 5.2, 1);
  pintura(ctx, canilla, color); camuflaje(ctx, canilla, C.camo, kx, ky, -b, 7, L2, 31, lejos); if (C.camo) repasar(ctx, canilla, color);
  // Muslo, más ancho arriba y con el cuádriceps adelante
  const muslo = tramo(hx, hy, kx, ky, 9, 7, -0.7);
  pintura(ctx, muslo, color); camuflaje(ctx, muslo, C.camo, hx, hy, -a, 9, L1, 11, lejos); if (C.camo) repasar(ctx, muslo, color);
  if (!Pincel.silueta) {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-a);
    if (C.rayaPierna) raya(ctx, C.rayaPierna, 0.7, [[0.6, 0.5], [0.8, 12.5]]);   // raya o costura a lo largo del pantalón
    if (!C.sinBolsillo) {   // bolsillo cargo con tapa y botón
    pintura(ctx, c => c.roundRect(-2.6, 4.6, 5.2, 5.4, 1), ajustarColor(color, -0.05), { sombra: 0.5, brillo: 0.18, linea: 0.35 });
    pintura(ctx, c => c.roundRect(-2.8, 4.2, 5.6, 1.9, 0.7), ajustarColor(color, -0.12), { sombra: 0.4, brillo: 0.16, linea: 0.35 });
    detalle(ctx, ajustarColor(color, -0.45), circulo(-0.1, 5.1, 0.4));
    raya(ctx, ajustarColor(color, -0.3), 0.35, [[2.4, 0.5], [2.6, 11]]);                                    // costura de adelante
    }
    ctx.restore();
    if (C.rayaPierna) { ctx.save(); ctx.translate(kx, ky); ctx.rotate(-b); raya(ctx, C.rayaPierna, 0.7, [[0.4, 0.5], [0.2, 9]]); ctx.restore(); }
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(-b);
    raya(ctx, ajustarColor(color, -0.3), 0.35, [[-1.8, 4], [-1.4, 8]]); raya(ctx, ajustarColor(color, -0.24), 0.3, [[1.8, 5.6], [1.4, 8.6]]);   // pliegues
    ctx.restore();
  }
  // Rodillera de casco duro con sus dos correas (no la llevan los que van de traje, de cuero o de tela)
  if (!C.sinRodillera) {
  ctx.save(); ctx.translate(kx, ky); ctx.rotate(-b);
  const R = C.rodillera;
  for (const yy of [-2.6, 2.4]) pintura(ctx, c => c.roundRect(-3.2, yy - 0.5, 4.6, 1, 0.3), ajustarColor(R, -0.35), { sombra: 0.2, brillo: false, linea: 0.25 });
  pintura(ctx, c => c.ellipse(2.6, 0.2, 2.9, 3.9, 0, 0, Math.PI * 2), R, { sombra: 0.8, brillo: 0.4, linea: 0.4 });
  raya(ctx, ajustarColor(R, -0.25), 0.35, [[3.4, -2.6], [4.4, 0.2], [3.4, 2.9]]);   // canto del casco
  ctx.restore();
  }
  // Bota de caña alta tipo desierto: caña, empeine, puntera, suela de goma con dibujo y taco
  const B = C.bota, S = C.suela || ajustarColor(B, -0.5);
  pintura(ctx, c => c.roundRect(px - 3.4, py - 6.6, 6.8, 9.8, 1.4), B, { sombra: 0.7 });
  pintura(ctx, c => { c.moveTo(px - 3.8, py + 1.2); c.lineTo(px + 2.4, py + 0.6); c.quadraticCurveTo(px + 7.4, py + 2, px + 8, py + 5.6); c.lineTo(px + 8, py + 7.4); c.lineTo(px - 3.8, py + 7.4); }, B, { sombra: 0.7, brillo: 0.35 });
  pintura(ctx, c => c.roundRect(px - 4.2, py + 7, 12.8, 2, 0.6), S, { sombra: 0.3, brillo: false, linea: 0.35 });   // suela
  if (!Pincel.silueta) {
    for (let k = 0; k < 6; k++) detalle(ctx, ajustarColor(S, -0.4), c2 => c2.rect(px - 3.6 + k * 2.1, py + 8.3, 1, 0.7));               // dibujo de la suela
    detalle(ctx, ajustarColor(S, 0.12), c2 => c2.rect(px - 4.2, py + 6.2, 4.2, 1));                                                    // taco
    raya(ctx, ajustarColor(B, -0.3), 0.4, [[px + 1.4, py + 2.2], [px + 3.6, py + 7.2]]);                                               // costura de la puntera
    for (let k = 0; k < 4; k++) raya(ctx, ajustarColor(B, -0.42), 0.45, [[px + 1.2, py - 5.4 + k * 1.9], [px + 3.4, py - 4.6 + k * 1.9]]);   // cordones
    raya(ctx, 'rgba(255,240,220,0.25)', 0.6, [[px + 4.6, py + 2.6], [px + 7.2, py + 4]]);                                               // brillo de la puntera
  }
  // Botamanga: el pantalón abolsado sobre la caña
  const bm = c => { c.moveTo(px - 3.4, py - 8); c.lineTo(px + 3.4, py - 8.2); c.quadraticCurveTo(px + 4.2, py - 6.6, px + 3.6, py - 5.4); c.quadraticCurveTo(px, py - 4.8, px - 3.6, py - 5.4); c.quadraticCurveTo(px - 4.2, py - 6.6, px - 3.4, py - 8); };
  pintura(ctx, bm, color, { sombra: 0.5, brillo: 0.18 }); camuflaje(ctx, bm, C.camo, px, py - 8, 0, 7, 4, 51, lejos); if (C.camo) repasar(ctx, bm, color);
}

// Brazo en dos tramos de largo fijo (cinemática inversa): el codo cae donde corresponde según dónde esté la mano.
// Con C.antebrazo, manga larga hasta el guante (camisa de combate) y parche en el hombro si hay C.parche; si no, arremangada.
// Dónde cae el codo para que la mano (muñeca) llegue a (mx, my), con el codo hacia abajo
function codoBrazo(hx, hy, mx, my, L1, L2) {
  const dx = mx - hx, dy = my - hy, d = Math.hypot(dx, dy) || 0.001;
  let l1 = L1, l2 = L2;
  if (d > (L1 + L2) * 0.995) { const k = d / ((L1 + L2) * 0.995); l1 *= k; l2 *= k; }   // si no llega, se estira apenas
  // Mano cerca del hombro (P90, Uzi, tubos al hombro): el brazo viene hacia el que mira y se ve más corto (escorzo).
  // Sin esto, el único modo de que entre es doblar el codo hasta el cinturón
  else if (d < (L1 + L2) * 0.8) { const k = Math.max(0.5, d / ((L1 + L2) * 0.8)); l1 *= k; l2 *= k; }
  const a = Math.acos(limitar((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), base = Math.atan2(dy, dx);
  const cx = hx + Math.cos(base + a) * l1, cy = hy + Math.sin(base + a) * l1;
  return { cx, cy, ante: Math.atan2(my - cy, mx - cx) };
}
function brazoDetallado(ctx, hx, hy, mx, my, C, L1 = 13.5, L2 = 13) {
  const { cx, cy, ante: angAnte } = codoBrazo(hx, hy, mx, my, L1, L2);
  const larga = !!C.antebrazo;
  // Antebrazo: más grueso cerca del codo
  const ante = tramo(cx, cy, mx, my, 5.2, 4.2, 0.5);
  pintura(ctx, ante, larga ? C.antebrazo : C.piel, { sombra: 0.8 });
  if (!Pincel.silueta) {
    const at = (k, s) => [cx + (mx - cx) * k, cy + (my - cy) * k + s];
    if (larga) { raya(ctx, ajustarColor(C.antebrazo, -0.3), 0.4, [at(0.3, -1.4), at(0.42, 0.4)]); raya(ctx, ajustarColor(C.antebrazo, -0.3), 0.4, [at(0.6, 1.6), at(0.7, -0.2)]); }   // pliegues
    else raya(ctx, ajustarColor(C.piel, -0.22), 0.45, [at(0.25, 1.1), at(0.65, 0.7)]);
  }
  if (C.brazal) {   // brazal: muñequera de metal o cuero con remaches
    ctx.save(); ctx.translate(mx, my); ctx.rotate(angAnte);
    pintura(ctx, c => c.roundRect(-6.4, -2.9, 4.8, 5.8, 1.4), C.brazal, { sombra: 0.5, brillo: 0.45, linea: 0.4 });
    if (!Pincel.silueta) { raya(ctx, ajustarColor(C.brazal, -0.35), 0.4, [[-4, -2.6], [-4, 2.6]]); for (const yy of [-1.6, 1.6]) detalle(ctx, ajustarColor(C.brazal, 0.35), circulo(-5.4, yy, 0.4)); }
    ctx.restore();
  }
  if (larga) {   // puño de la manga sobre el guante
    ctx.save(); ctx.translate(mx, my); ctx.rotate(angAnte);
    pintura(ctx, c => c.roundRect(-3.4, -2.5, 2.2, 5, 0.8), ajustarColor(C.antebrazo, -0.06), { sombra: 0.4, brillo: 0.2, linea: 0.35 });
    ctx.restore();
  }
  // Manga: ancha en el hombro, con dos pliegues
  const manga = tramo(hx, hy, cx, cy, 6.6, 5.4, -0.5);
  pintura(ctx, manga, C.chaqueta);
  if (!Pincel.silueta) {
    const pl = (k, w) => { const x = hx + (cx - hx) * k, y = hy + (cy - hy) * k, ang = Math.atan2(cy - hy, cx - hx) + Math.PI / 2; raya(ctx, ajustarColor(C.chaqueta, -0.32), 0.4, [[x - Math.cos(ang) * w, y - Math.sin(ang) * w], [x + Math.cos(ang) * w * 0.4, y + Math.sin(ang) * w * 0.4 + 0.5]]); };
    pl(0.5, 2); pl(0.74, 1.7);
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(angAnte);
  if (!larga) {   // rollo de la manga arremangada
    pintura(ctx, c => c.ellipse(0.3, 0, 1.9, 3.2, 0, 0, Math.PI * 2), ajustarColor(C.chaqueta, 0.08), { sombra: 0.6, brillo: 0.35 });
    raya(ctx, ajustarColor(C.chaqueta, -0.3), 0.4, [[0.5, -2.5], [0.3, 2.5]]);
  } else raya(ctx, ajustarColor(C.chaqueta, -0.34), 0.45, [[-0.6, -2.2], [1, -0.4], [-0.4, 1.8]]);   // pliegue del codo
  ctx.restore();
  if (C.parche) {   // parche de abrojo en el hombro
    ctx.save(); ctx.translate(hx + (cx - hx) * 0.3, hy + (cy - hy) * 0.3); ctx.rotate(Math.atan2(cy - hy, cx - hx) - Math.PI / 2);
    pintura(ctx, c => c.roundRect(-1.9, -1.7, 3.8, 3.4, 0.5), C.parche, { sombra: 0.4, brillo: 0.2, linea: 0.35 });
    if (!Pincel.silueta) for (let k = 0; k < 3; k++) detalle(ctx, ajustarColor(C.parche, -0.3), c => c.rect(-1.3, -1.1 + k * 1.1, 2.6, 0.4));
    ctx.restore();
  }
  pintura(ctx, c => c.arc(hx, hy, 3.6, 0, Math.PI * 2), C.chaqueta, { contorno: false, sombra: 0.7 });   // hombro redondo
  return { cx, cy, ante: angAnte };
}

/* ---------- Manos ----------
 * Todas las manos son la misma mano con guante, empuñe lo que empuñe: mismo color (C.guante), mismo trazo que el resto
 * del cuerpo (pintura), mismas medidas, el puño elastizado y la nudillera dura. Antes cada agarre tenía su dibujo, con
 * degradados y contornos distintos, y la mano cambiaba de color y de forma al pasar del arma a la recarga.
 * Mano libre: la palma en el origen, los dedos hacia +x y el lado de la palma hacia +y; la muñeca en (-MANO.muneca, 0).
 * Sigue al antebrazo (la muñeca dobla como mucho MANO.dobla: lo demás lo gira el brazo) y se abre o se cierra: abierta
 * (cierre 0) cuando llega a algo, suelta o palmea; a medias cuando sostiene algo; cerrada (1) cuando empuña un mango.
 */
const MANO = { muneca: 2.3, dobla: 0.85 };
const TRAZO_MANO = { sombra: 0.5, brillo: 0.25, linea: 0.4 };
const tonosGuante = G => ({ base: G, punio: ajustarColor(G, 0.12), nudillo: ajustarColor(G, 0.2), dedo: ajustarColor(G, 0.05), palma: ajustarColor(G, -0.1), pliegue: ajustarColor(G, -0.35) });
const normalizarAng = a => Math.atan2(Math.sin(a), Math.cos(a));

function manoLibre(ctx, x, y, ang, cierre, C, op = {}) {
  const T = tonosGuante(C.guante), k = limitar(cierre, 0, 1), m = MANO.muneca;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (op.espejo) ctx.scale(1, -1);
  // Dedos en dos tramos que se doblan hacia la palma: estirados, en C (sostienen algo) o en puño, con la punta abajo
  const a1 = k * 1.45, a2 = a1 + k * 1.8, bx = 1.3, by = -0.45;
  const x1 = bx + Math.cos(a1) * 2.1, y1 = by + Math.sin(a1) * 2.1, x2 = x1 + Math.cos(a2) * 2.2, y2 = y1 + Math.sin(a2) * 2.2;
  pintura(ctx, c => c.roundRect(-m - 2.2, -2.45, 2.5, 4.9, 0.9), T.punio, { sombra: 0.4, brillo: false, linea: 0.35 });   // puño elastizado
  pintura(ctx, c => c.roundRect(-m - 0.2, -2.55, m + 3.2, 4.9, 1.9), T.base, TRAZO_MANO);                                  // dorso y palma
  pintura(ctx, tramo(x1, y1, x2, y2, 2.2, 1.8), T.dedo, TRAZO_MANO);
  pintura(ctx, tramo(bx, by, x1, y1, 2.6, 2.2), T.dedo, TRAZO_MANO);
  if (!Pincel.silueta) for (const s of [-0.45, 0.45]) {   // los dedos de al lado, asomando
    const nx = -Math.sin(a1), ny = Math.cos(a1), mx = -Math.sin(a2), my = Math.cos(a2);
    raya(ctx, T.pliegue, 0.3, [[bx + 0.5 + nx * s, by + ny * s], [x1 + nx * s, y1 + ny * s], [x1 + (x2 - x1) * 0.8 + mx * s * 0.8, y1 + (y2 - y1) * 0.8 + my * s * 0.8]]);
  }
  pintura(ctx, c => c.roundRect(-0.9, -2.75, 2.9, 1.6, 0.7), T.nudillo, { sombra: 0.4, brillo: 0.3, linea: 0.35 });        // nudillera
  if (op.pulgar !== false) {   // pulgar de este lado: abierto se separa, cerrado cruza por delante de los dedos
    const p1 = 0.7 - k * 1.05, p2 = p1 - k * 0.45, px = -1.2, py = 1.35;
    const qx = px + Math.cos(p1) * 2.0, qy = py + Math.sin(p1) * 2.0;
    pintura(ctx, tramo(px, py, qx, qy, 1.9, 1.5), T.dedo, { sombra: 0.4, brillo: 0.25, linea: 0.35 });
    pintura(ctx, tramo(qx, qy, qx + Math.cos(p2) * 1.5, qy + Math.sin(p2) * 1.5, 1.5, 1.2), T.dedo, { sombra: 0.4, brillo: 0.25, linea: 0.35 });
  }
  ctx.restore();
}
// Brazo y mano libre: la palma en (px, py) apuntando a pose.dir (o siguiendo al antebrazo); el brazo llega a la muñeca.
// pose.antes(dir) dibuja lo que lleva en la mano, entre el brazo y los dedos
function brazoConMano(ctx, hx, hy, px, py, C, L = [13.5, 13], pose = {}) {
  const k0 = codoBrazo(hx, hy, px, py, L[0], L[1]);
  const quiere = pose.dir ?? k0.ante + 0.12;   // suelta, la mano cae un poco
  const dir = k0.ante + limitar(normalizarAng(quiere - k0.ante), -MANO.dobla, MANO.dobla);
  brazoDetallado(ctx, hx, hy, px - Math.cos(dir) * MANO.muneca, py - Math.sin(dir) * MANO.muneca, C, L[0], L[1]);
  if (pose.antes) pose.antes(dir);
  manoLibre(ctx, px, py, dir, pose.cierre ?? 0.9, C, pose);
  return dir;
}
// La mano de siempre, cerrada y con los dedos para arriba (escaleras, sogas, la M2): ahora es la misma mano libre
function manoConGuante(ctx, x, y, C, ang = -Math.PI / 2, cierre = 1) { manoLibre(ctx, x, y, ang, cierre, C); }

/* ---------- Manos que agarran el arma ----------
 * Mano del gatillo: la palma queda del otro lado de la empuñadura (se dibuja antes que el arma); de este lado
 * se ven el pulgar cruzando por arriba, los tres dedos envolviendo el frente y el índice en el disparador.
 * El eje de la empuñadura baja inclinado hacia atrás según `ang`. Mismo guante y mismo trazo que la mano libre. */
function manoGatilloPalma(ctx, x, y, ang, C) {
  const T = tonosGuante(C.guante);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  pintura(ctx, c => c.roundRect(-2.4, 2.6, 4.6, 2.3, 0.9), T.punio, { sombra: 0.4, brillo: false, linea: 0.35 });   // puño elastizado
  pintura(ctx, redondo(-2.0, -0.2, 3.9, 4.6, 1.6), T.palma, TRAZO_MANO);
  ctx.restore();
}
function manoGatilloDedos(ctx, x, y, ang, C) {
  const T = tonosGuante(C.guante);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  for (let k = 2; k >= 0; k--) pintura(ctx, redondo(0.5, 1.8 + k * 1.25, 2.2, 1.2, 0.55), T.dedo, { sombra: 0.35, brillo: 0.2, linea: 0.32 });   // dedos sobre el frente
  pintura(ctx, redondo(-2.1, -0.35, 3.5, 1.45, 0.65), T.dedo, { sombra: 0.4, brillo: 0.25, linea: 0.35 });               // pulgar por arriba
  ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang * 0.25);
  pintura(ctx, redondo(0.4, 0.5, 2.8, 1.0, 0.45), T.dedo, { sombra: 0.35, brillo: 0.2, linea: 0.32 });                // índice en el disparador
  ctx.restore();
}
// Mano de apoyo en un arma larga: la palma sostiene el guardamanos desde abajo y los dedos suben por este costado;
// el puño elastizado sigue al antebrazo (angAnte)
function manoGuardamanos(ctx, x, y, C, angAnte = -0.8) {
  const T = tonosGuante(C.guante);
  ctx.save(); ctx.translate(x - 2.4, y + 2.6); ctx.rotate(angAnte);
  pintura(ctx, c => c.roundRect(-2.6, -2.3, 2.6, 4.6, 0.9), T.punio, { sombra: 0.4, brillo: false, linea: 0.35 });
  ctx.restore();
  pintura(ctx, redondo(x - 2.9, y + 0.3, 5.8, 2.8, 1.2), T.palma, TRAZO_MANO);
  for (let k = 0; k < 4; k++) {
    const fx = x - 2.1 + k * 1.35;
    pintura(ctx, poli(segmento(fx - 0.3, y + 1.9, fx + 0.2, y - 1.3, 1.25, 1.05)), T.dedo, { sombra: 0.3, brillo: 0.2, linea: 0.32 });
  }
  pintura(ctx, c => c.roundRect(x - 2.4, y + 1.4, 5.1, 1.3, 0.6), T.nudillo, { sombra: 0.3, brillo: 0.25, linea: 0.32 });   // nudillera
}
// Mano de apoyo en una pistola: envuelve los dedos de la otra mano, con el pulgar estirado sobre el armazón
function manoEnvolvente(ctx, x, y, ang, C) {
  const T = tonosGuante(C.guante);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  pintura(ctx, c => c.roundRect(-2.4, 2.4, 4.4, 2.3, 0.9), T.punio, { sombra: 0.4, brillo: false, linea: 0.35 });
  pintura(ctx, redondo(-1.6, -1.8, 4.2, 4.9, 1.6), T.base, TRAZO_MANO);
  for (let k = 0; k < 3; k++) raya(ctx, T.pliegue, 0.3, [[0.4, -0.5 + k * 1.3], [2.3, -0.5 + k * 1.3]]);   // dedos
  pintura(ctx, c => c.roundRect(-1.2, -1.9, 2.6, 1.3, 0.6), T.nudillo, { sombra: 0.3, brillo: 0.25, linea: 0.32 });
  ctx.restore();
  pintura(ctx, redondo(x - 0.6, y - 2.9, 3.7, 1.25, 0.55), T.dedo, { sombra: 0.4, brillo: 0.25, linea: 0.35 });   // pulgar sobre el armazón
}

Jugador.prototype.dibujar = function (ctx, camaraX, ahora) {
  const sx = this.x - camaraX;
  const parpadeo = ahora < this.invulnerableHasta && Math.floor(ahora / 80) % 2 === 0;
  const cuerpo = (c = ctx) => this.cuerpo(c, parpadeo);
  if (this.muerto) {
    ctx.save();
    ctx.translate(sx, this.y);
    ctx.rotate(-Math.PI / 2 * this.direccion); ctx.translate(0, 20);
    cuerpo();
    ctx.restore();
    return;
  }
  if (this.aTierra && this.cubierto > 0.3) {   // cuerpo a tierra: sombra chata debajo, no proyectada
    sombraElipse(ctx, sx, this.y + 1, 44, 5, 0.35);
    ctx.save(); ctx.translate(sx, this.y); cuerpo(); ctx.restore();
    return;
  }
  conSombra(ctx, sx, this.y, cuerpo, 0.32, alturaSuelo(this.x), true);   // sombra pareja: el cuerpo tiene muchas piezas encimadas
};

Jugador.prototype.cuerpo = function (ctx, parpadeo) {
  ctx.scale(this.direccion * ESCALA_JUGADOR, ESCALA_JUGADOR);   // más grande que el esqueleto: a la altura de los zombies
  // Con parapeto (defensa zombie) baja detrás de las bolsas; sin parapeto (defensa ultra) se tira cuerpo a tierra:
  // el cuerpo gira hasta quedar boca abajo, con la cabeza hacia adelante y el pecho en el piso
  if (this.aTierra && this.cubierto > 0.01) { const p = this.cubierto; ctx.translate(-36 * p, -9 * p); ctx.rotate(p * Math.PI / 2); }
  else if (this.cubierto > 0.01) { ctx.beginPath(); ctx.rect(-80, -200, 160, 200); ctx.clip(); ctx.translate(0, this.cubierto * 26); }
  // Agachado: todo el cuerpo baja y las piernas se doblan para que las botas sigan en el piso
  const ag = this.montada ? 0 : this.agachado;
  if (ag > 0) ctx.translate(0, ag * BAJA_AGACHADO);
  if (parpadeo && !Pincel.silueta) ctx.globalAlpha = 0.45;
  const S = skinDe(this), C = S.colores ? { ...COLORES_JUGADOR, ...S.colores } : COLORES_JUGADOR;   // personaje elegido
  const s = this.caminando ? Math.sin(this.fase) : 0;
  const enAire = !this.enSuelo && !this.montada;
  const respiro = this.caminando || enAire ? 0 : Math.sin(this.ahora / 650) * 0.6;   // respira en reposo
  const ty = (this.caminando ? -Math.abs(Math.cos(this.fase)) * 1.4 : 0) + respiro;    // el torso sube en la mitad del paso

  // Capa o faldón (detrás de todo) y mochila con manta enrollada, según el personaje
  if (S.capa) dibujarCapa(ctx, S.capa, ty, this.ahora, this.caminando ? 1 : 0);
  if (S.faldon) dibujarCapa(ctx, C.chaqueta, ty, this.ahora, this.caminando ? 0.6 : 0, 0.45);
  if (S.mochila) {   // mochila de armazón: cuerpo, tapa, bolsillo lateral, correas de compresión y la manta enrollada arriba
    const M = C.mochila;
    pintura(ctx, c => { c.moveTo(-12, -58 + ty); c.lineTo(-20.5, -58.5 + ty); c.quadraticCurveTo(-25, -58 + ty, -25, -52 + ty); c.lineTo(-24.4, -38.5 + ty); c.quadraticCurveTo(-24, -35 + ty, -20, -35 + ty); c.lineTo(-12, -35.5 + ty); }, M);
    pintura(ctx, c => { c.moveTo(-12, -58.5 + ty); c.lineTo(-21, -59 + ty); c.quadraticCurveTo(-25.6, -58.4 + ty, -25.4, -53 + ty); c.lineTo(-21, -52.4 + ty); c.lineTo(-12, -53 + ty); }, ajustarColor(M, -0.06), { sombra: 0.6 });   // tapa
    pintura(ctx, c => c.roundRect(-23.6, -48 + ty, 7.4, 9.6, 1.8), ajustarColor(M, -0.1), { sombra: 0.7 });                 // bolsillo lateral
    if (!Pincel.silueta) {
      for (const y of [-50, -41]) pintura(ctx, c => c.roundRect(-25, y + ty, 13, 1.6, 0.5), C.correa, { sombra: 0.3, brillo: false, linea: 0.3 });   // correas de compresión
      for (const y of [-49.5, -40.5]) pintura(ctx, c => c.roundRect(-16.6, y - 0.4 + ty, 2.2, 2.4, 0.4), '#8a8f96', { sombra: 0.3, linea: 0.3 });   // hebillas
      raya(ctx, ajustarColor(M, -0.35), 0.4, [[-23.4, -46 + ty], [-16.6, -46 + ty]]);                                          // cierre del bolsillo
    }
    pintura(ctx, c => c.roundRect(-26, -64.6 + ty, 15.6, 6.6, 3.3), C.manta, { sombra: 0.9, brillo: 0.35 });                // manta enrollada
    if (!Pincel.silueta) {
      raya(ctx, ajustarColor(C.manta, -0.3), 0.45, [[-24, -63.6 + ty], [-12.5, -63.6 + ty]]);
      for (const x of [-22.6, -15.6]) pintura(ctx, c => c.roundRect(x, -65 + ty, 1.8, 7.4, 0.4), C.correa, { sombra: 0.3, brillo: false, linea: 0.3 });
    }
  }

  // Lanzallamas: la mochila con los tanques (el de combustible cercano, el de nitrógeno asomando arriba, el armazón)
  const dTanques = !this.montada && DIBUJO_ARMAS[this.arma().id];
  if (dTanques && dTanques.tanques) dibujarTanques(ctx, ty);

  // Trepando una escalera o colgado de una soga: pose propia, con el arma colgada a la espalda
  if ((this.trepa || this.soga) && !this.muerto) { dibujarColgado(ctx, this, S, C); return; }

  // Piernas: la de atrás más oscura. En el aire van recogidas
  if (enAire) {
    piernaArticulada(ctx, -4, -34, 0.15, 0.8, ajustarColor(C.pantalon, -0.18), C);
    piernaArticulada(ctx, 4, -34, 0.65, 1.15, C.pantalon, C);
  } else {
    // Rodilla en tierra: la de atrás apoya la rodilla con la pierna hacia atrás; la de adelante, muslo horizontal y canilla vertical
    const mezcla = (parado, rodilla) => parado + (rodilla - parado) * ag;
    piernaArticulada(ctx, -4, -34, mezcla(-s * 0.55, -0.25), mezcla(0.75 * Math.max(0, -s), 1.32), ajustarColor(C.pantalon, -0.18), C);
    piernaArticulada(ctx, 4, -34, mezcla(s * 0.55, 1.5), mezcla(0.75 * Math.max(0, s), 1.5), C.pantalon, C);
  }

  // Brazo lejano (el derecho, el del gatillo): va detrás del torso, así no se ve su hombro; solo asoma la mano en la empuñadura
  const e = this.estadoArma();
  const dArma = DIBUJO_ARMAS[this.arma().id] || DIBUJO_ARMAS.glock;
  const angMano = this.montada ? 0 : (dArma.anguloEmpunadura ?? 0.3) + e.incl;   // cuerpo a cuerpo: el mango sigue al arma
  // Con la M2: la mano del gatillo en la empuñadura de pala de abajo (16,5 detrás del cajón)
  const tapa = this.cubierto > 0.45;   // agachado, con las manos sobre la cabeza
  const gatillo = tapa ? { x: -2, y: -80 + ty } : this.montada ? { x: (e.origen.x - 12 - 16.5) / ESCALA_JUGADOR, y: -44 / ESCALA_JUGADOR } : { x: e.origen.x + e.manoGatillo.x, y: e.origen.y + e.manoGatillo.y };
  const muneca = this.montada ? gatillo : { x: gatillo.x - Math.sin(angMano) * 2.8, y: gatillo.y + Math.cos(angMano) * 2.8 };
  const Clejos = Object.assign({}, C, { chaqueta: ajustarColor(C.chaqueta, -0.28), piel: ajustarColor(C.piel, -0.25), guante: ajustarColor(C.guante, -0.05), antebrazo: C.antebrazo && ajustarColor(C.antebrazo, -0.28), parche: C.parche && ajustarColor(C.parche, -0.28), brazal: C.brazal && ajustarColor(C.brazal, -0.28) });
  if (dArma.tanques && dArma.manguera && !this.montada) {
    const m = dArma.manguera, c = Math.cos(e.incl), sn = Math.sin(e.incl);
    dibujarManguera(ctx, ty, e.origen.x + m.x * c - m.y * sn, e.origen.y + m.x * sn + m.y * c);
  }
  const golpe = (this.montada || dArma.agarre === 'hombro') ? e.empuje * 1.2 : e.empuje * 0.4;   // el hombro absorbe el retroceso
  brazoDetallado(ctx, -4 - golpe, -53 + ty, muneca.x, muneca.y, Clejos);

  // Cinturón con hebilla, cartucheras atrás y funda con pistola en el muslo (angosto como el torso de perfil)
  ctx.save(); ctx.scale(0.64, 1);
  pintura(ctx, c => c.roundRect(-12.4, -37.4, 24.6, 5.2, 1.4), C.cinturon, { sombra: 0.7 });
  pintura(ctx, c => c.roundRect(0.4, -37, 5, 4.4, 0.8), C.hebilla || '#7d8288', { sombra: 0.5, brillo: 0.5, linea: 0.35 });          // hebilla
  if (!C.sinCartucheras) for (const x of [-10.6, -4.4]) {   // portacargadores con tapa
    pintura(ctx, c => c.roundRect(x, -36.4, 5.4, 8, 1.2), C.bolsa, { sombra: 0.7 });
    pintura(ctx, c => c.roundRect(x - 0.2, -36.8, 5.8, 2.6, 0.8), ajustarColor(C.bolsa, -0.1), { sombra: 0.4, brillo: 0.2, linea: 0.35 });
  }
  // Funda de muslo: la empuñadura de la pistola asoma, y la correa abraza la pierna
  if (!C.sinFunda) {
    pintura(ctx, c => c.roundRect(6.6, -33.4, 6.8, 12.4, 1.8), C.funda, { sombra: 0.8 });
    pintura(ctx, c => c.roundRect(7.6, -36.6, 3.8, 4.6, 1), '#26272b', { sombra: 0.5, linea: 0.35 });
    pintura(ctx, c => c.roundRect(5.6, -25.6, 9, 1.8, 0.6), C.correa, { sombra: 0.3, brillo: false, linea: 0.3 });
  }
  ctx.restore();

  // Torso según el personaje (chaleco táctico, armadura, traje…)
  dibujarTorso(ctx, S, C, ty);

  // Cuello y cabeza; durante la recarga baja la mirada hacia el arma
  ctx.save();
  ctx.translate(1.4 * e.apunta - golpe * 0.8, -62 + ty + 0.9 * e.apunta); ctx.rotate(0.2 * e.mirar + 0.12 * e.apunta); ctx.translate(0, 62 - ty);
  dibujarCabeza(ctx, S, C, ty, e);
  ctx.restore();

  // Cuerpo a tierra: suelta el arma y se tapa la cabeza con las dos manos
  if (tapa && !this.montada) {
    manoLibre(ctx, gatillo.x, gatillo.y, -2.3, 0.55, Clejos);
    brazoConMano(ctx, 4, -52 + ty, 6, -81 + ty, C, undefined, { cierre: 0.55, dir: -2.3 });
    return;
  }

  if (this.montada) {
    // Mano del gatillo fija en las empuñaduras (su brazo va detrás del torso); el brazo izquierdo sigue la recarga de la cinta
    manoLibre(ctx, gatillo.x, gatillo.y, -Math.PI / 2, 0.95, Clejos);
    const apoyo = tapa ? { x: 4, y: -82 + ty } : { x: e.mano.x / ESCALA_JUGADOR, y: e.mano.y / ESCALA_JUGADOR };   // la M2 está en el mundo, sin agrandar
    const recargaM2 = !!this.recarga;
    brazoConMano(ctx, 4 - golpe, -52 + ty, apoyo.x, apoyo.y, C, undefined, { cierre: recargaM2 ? e.cierre ?? 0.8 : 0.95, dir: recargaM2 ? e.dirMano : -Math.PI / 2,
      antes: () => { if (e.enMano) dibujarUnidad(ctx, e.enMano, apoyo.x, apoyo.y, e.rotMano); } });
    return;
  }

  const arma = this.arma(), d = dArma;
  if (d.agarre === 'cuerpo') {
    // Cuerpo a cuerpo: el arma, encima el puño derecho cerrado en el mango; el izquierdo también en el mango
    // (dos manos) o en guardia delante del pecho (una mano)
    ctx.save(); ctx.translate(e.origen.x, e.origen.y); ctx.rotate(e.incl); d.dibujar(ctx, e); ctx.restore();
    manoLibre(ctx, gatillo.x, gatillo.y, e.incl - Math.PI / 2, 1, Clejos);   // el mango pasa por el puño
    const hombro = 3 - golpe;
    if (!arma.unaMano && !e.sinCargador) {
      brazoConMano(ctx, hombro, -52 + ty, e.mano.x, e.mano.y, C, undefined, { cierre: 1, dir: e.incl - Math.PI / 2 });
    } else {
      const g = this.golpeActual, p = g ? limitar((this.ahora - g.inicio) / g.dur, 0, 1) : 0;
      const guardia = { x: 9 - Math.sin(p * Math.PI) * 6, y: -42 + ty - Math.sin(p * Math.PI) * 4 };   // contrapeso del golpe
      brazoConMano(ctx, hombro, -52 + ty, guardia.x, guardia.y, C, undefined, { cierre: 0.85 });
    }
    return;
  }
  // Hombro izquierdo: con el arma al hombro el cuerpo se perfila y ese hombro va adelante (el codo cae bajo el arma);
  // con la pistola los hombros quedan de frente al blanco (posición isósceles)
  const hombroX = (d.agarre === 'hombro' ? 6 : d.agarre === 'pistola' ? -1 : 3) - golpe;
  const L = d.agarre === 'hombro' ? [16, 15.5] : [13.5, 13];
  // ¿La mano de apoyo está en su lugar? (no durante la recarga ni cuando va al cerrojo; sí al bombear o con la palanca)
  const agarrando = !this.recarga && (!this.ciclo || this.ciclo.accion === 'bombeo' || this.ciclo.accion === 'palanca');
  const estilo = d.agarre === 'pistola' ? 'envuelve' : d.agarre === 'mano' ? 'libre' : 'guardamanos';
  // Mano del gatillo: la palma va del otro lado de la empuñadura, detrás del arma
  if (d.agarre !== 'mano') manoGatilloPalma(ctx, gatillo.x, gatillo.y, angMano, Clejos);
  // El cargador que lleva la mano de apoyo es el de esta arma (js/cargadores.js), girado como el arma y con el agarre
  // en la mano: va antes que el arma, así el pozo o la empuñadura tapan lo que todavía está adentro
  const cargadorEnMano = e.enMano && ES_CARGADOR.has(e.enMano) && CARGADORES[arma.id];
  const dibujarCargadorEnMano = () => {
    ctx.save(); ctx.translate(e.mano.x, e.mano.y); ctx.rotate(e.incl + e.rotMano); ctx.scale(CM, CM); ctx.translate(-cargadorEnMano.agarre[0], -cargadorEnMano.agarre[1]);
    dibujarCargadorSuelto(ctx, cargadorEnMano, e.cargadorNuevo);
    ctx.restore();
  };
  if (cargadorEnMano && !cargadorEnMano.encima) dibujarCargadorEnMano();
  else manoLibre(ctx, gatillo.x, gatillo.y + 1, angMano - Math.PI / 2, 0.95, Clejos);
  ctx.save(); ctx.translate(e.origen.x, e.origen.y); ctx.rotate(e.incl); d.dibujar(ctx, e); ctx.restore();
  if (e.peine) dibujarPeineEnArma(ctx, e.peine);
  if (d.agarre !== 'mano') manoGatilloDedos(ctx, gatillo.x, gatillo.y, angMano, Clejos);
  // Brazo izquierdo (de apoyo): va por delante de todo y es el único hombro que se ve
  if (agarrando && estilo === 'guardamanos') {
    // Si el guardamanos queda lejos para el brazo, la mano se apoya más atrás sobre el arma (hasta 8 unidades),
    // así el codo queda doblado debajo y no con el brazo tieso
    const ax = Math.cos(e.incl), ay = Math.sin(e.incl), alcance = (L[0] + L[1]) * 0.9;
    const reposo = { x: e.mano.x + e.retroX, y: e.mano.y + e.retroY };
    let atras = 0;
    while (atras < 12 && Math.hypot(reposo.x - ax * atras - 2.4 - (hombroX + golpe), reposo.y - ay * atras + 2.6 - (-52 + ty)) > alcance) atras += 0.5;
    const mano = { x: e.mano.x - ax * atras, y: e.mano.y - ay * atras };   // mismo lugar del arma: se mueve con ella
    const b = brazoDetallado(ctx, hombroX, -52 + ty, mano.x - 2.4, mano.y + 2.6, C, ...L);
    manoGuardamanos(ctx, mano.x, mano.y, C, b.ante);
  } else if (agarrando && estilo === 'envuelve') {
    brazoDetallado(ctx, hombroX, -52 + ty, e.mano.x - Math.sin(angMano) * 1.4, e.mano.y + Math.cos(angMano) * 1.9, C, ...L);
    manoEnvolvente(ctx, e.mano.x, e.mano.y, angMano, C);
  } else {
    // Mano libre (recarga, cerrojo, granada): sigue al antebrazo, abierta o cerrada según lo que hace (estadoArma).
    // Lo que lleva va entre los dedos: se dibuja antes que la mano para que esta lo tape un poco
    brazoConMano(ctx, hombroX, -52 + ty, e.mano.x, e.mano.y, C, L, { cierre: e.cierre ?? 0.8, dir: e.dirMano,
      antes: () => { if (cargadorEnMano) { if (cargadorEnMano.encima) dibujarCargadorEnMano(); } else if (e.enMano) dibujarUnidad(ctx, e.enMano, e.mano.x, e.mano.y, e.rotMano, e.cajaNueva); } });
  }
};

/* Mochila del lanzallamas M2 en la espalda: dos tanques de combustible (de perfil se ve el cercano, con domos arriba y
 * abajo), el tanque esférico de nitrógeno que asoma arriba entre los dos, el armazón y las válvulas */
function dibujarTanques(ctx, ty) {
  const OD = '#4b5434';
  pintura(ctx, c => c.roundRect(-14.5, -63 + ty, 3.2, 28, 1), '#2f3322', { sombra: 0.4 });                                   // armazón contra la espalda
  pintura(ctx, c => c.arc(-20.5, -64.5 + ty, 5.2, 0, Math.PI * 2), ajustarColor(OD, -0.12), { sombra: 0.8, brillo: 0.3 });   // nitrógeno
  pintura(ctx, c => { c.moveTo(-27.5, -60 + ty); c.quadraticCurveTo(-27.5, -66 + ty, -21, -66 + ty); c.quadraticCurveTo(-14.5, -66 + ty, -14.5, -60 + ty);
    c.lineTo(-14.5, -39 + ty); c.quadraticCurveTo(-14.5, -33 + ty, -21, -33 + ty); c.quadraticCurveTo(-27.5, -33 + ty, -27.5, -39 + ty); }, OD, { sombra: 1.1, brillo: 0.35 });   // combustible
  if (!Pincel.silueta) {
    for (const y of [-58, -40]) raya(ctx, ajustarColor(OD, -0.35), 0.5, [[-27.3, y + ty], [-14.7, y + ty]]);                   // costuras de soldadura
    ctx.fillStyle = '#d8d0b0'; ctx.font = '700 2.6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M2', -21, -48 + ty); ctx.textAlign = 'start';
  }
  pintura(ctx, c => c.roundRect(-22.6, -69 + ty, 3.2, 3.4, 0.6), '#3a3c3e', { sombra: 0.4 });                               // válvula de arriba
  pintura(ctx, c => c.roundRect(-18.6, -34.4 + ty, 4, 2.6, 0.6), '#3a3c3e', { sombra: 0.4 });                               // salida de la manguera
}
// Manguera de goma: sale de abajo del tanque, baja por detrás de la cadera y sube a la válvula de la lanza (x, y)
function dibujarManguera(ctx, ty, x, y) {
  ctx.save(); ctx.lineCap = 'round';
  const trazado = () => { ctx.beginPath(); ctx.moveTo(-16.6, -32.6 + ty); ctx.bezierCurveTo(-17, -16 + ty, x - 16, y + 18, x, y); };
  trazado(); ctx.strokeStyle = tinta('#1c1d1b'); ctx.lineWidth = 2.6; ctx.stroke();
  if (!Pincel.silueta) { trazado(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.7; ctx.stroke(); }
  ctx.restore();
}

/* Lo que puede llevar la mano durante una recarga, con su forma propia (nueva: la que trae, no la que saca) */
function dibujarUnidad(ctx, tipo, x, y, rot = 0, nueva = false) {
  const laton = '#c9a227', cobre = '#b87333';
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  switch (tipo) {
    case 'cajaMinigun':   // la caja de munición de la minigun, apoyada en la palma (js/armas-especiales.js)
      ctx.scale(CM, CM); cajaMinigun(ctx, 0, 1.6, nueva); break;
    case 'cargador':
      parte(ctx, -2, 0, 5, 11, '#222'); ctx.fillStyle = tinta(laton); ctx.fillRect(-1.5, -1.5, 4, 1.8);
      ctx.fillStyle = tinta('#444'); ctx.fillRect(-2.5, 9, 6, 2); break;
    case 'cargador-curvo':
      parte(ctx, -2, 0, 5, 5, '#3a3a3a'); parte(ctx, -1, 4, 5, 4, '#3a3a3a'); parte(ctx, 0, 7, 5, 4, '#3a3a3a');
      ctx.fillStyle = tinta(laton); ctx.fillRect(-1.5, -1.5, 4, 1.8); break;
    case 'cargador-plano':
      parte(ctx, -12, -2, 24, 3.5, '#4a4f4a'); ctx.fillStyle = tinta(laton); for (let k = 0; k < 6; k++) ctx.fillRect(-10 + k * 4, -1.5, 2, 1); break;
    case 'tambor-cargador':
      esfera(ctx, 1, 4, 6.5, '#1e2226'); parte(ctx, -1.5, -2, 5, 4, '#2b2f33'); ctx.fillStyle = tinta('#3a3f44'); ctx.fillRect(-2, 3, 6, 1.5); break;
    case 'bala':
      parte(ctx, -1, -4, 3, 7, laton); ctx.fillStyle = tinta(cobre); ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(0.5, -7); ctx.lineTo(2, -4); ctx.fill(); break;
    case 'cartucho':
      parte(ctx, -1.5, -6, 4, 8, '#b4251e'); ctx.fillStyle = tinta(laton); ctx.fillRect(-1.5, 0, 4, 2.5); break;
    case 'peine':
      parte(ctx, -1, -7, 2, 14, '#7a7a7a');
      for (let k = 0; k < 5; k++) { parte(ctx, 0, -6 + k * 2.6, 6, 2, laton); ctx.fillStyle = tinta(cobre); ctx.fillRect(6, -5.6 + k * 2.6, 1.5, 1.2); }
      break;
    case 'speedloader':
      for (let k = 0; k < 3; k++) { parte(ctx, -3.5 + k * 2.5, 2, 2, 4, laton); ctx.fillStyle = tinta(cobre); ctx.fillRect(-3.5 + k * 2.5, 5.5, 2, 1.2); }
      esfera(ctx, 0, 0, 4.5, '#2a2a2e'); parte(ctx, -1.5, -6, 3, 3, '#4a4a52'); break;
    case 'cinta':
      for (let k = 0; k < 6; k++) { parte(ctx, -12 + k * 4, -1, 2.5, 7, laton); ctx.fillStyle = tinta(cobre); ctx.fillRect(-12 + k * 4, -2.5, 2.5, 1.6); ctx.fillStyle = tinta('#555'); ctx.fillRect(-12 + k * 4 - 0.5, 2, 4, 1.2); }
      break;
    case 'cohete':
      parte(ctx, -1.6, -4, 3.2, 9, '#4b5634'); ctx.fillStyle = tinta('#3a3a3a');
      ctx.beginPath(); ctx.moveTo(-1.6, -4); ctx.lineTo(0, -7.5); ctx.lineTo(1.6, -4); ctx.fill(); ctx.fillRect(-2.6, 4, 5.2, 1.6); break;
    case 'coheteRpg':   // granada PG-7V: motor oscuro abajo, cabeza de guerra verde con banda amarilla y espoleta arriba
      parte(ctx, -1.2, 2, 2.4, 9, '#2e302c'); ctx.fillStyle = tinta('#4a5532');
      ctx.beginPath(); ctx.moveTo(-1.2, 2); ctx.lineTo(-2.8, -0.4); ctx.lineTo(-2.8, -5.6); ctx.lineTo(-0.8, -10.4); ctx.lineTo(0.8, -10.4); ctx.lineTo(2.8, -5.6); ctx.lineTo(2.8, -0.4); ctx.lineTo(1.2, 2); ctx.fill();
      ctx.fillStyle = tinta('#d6c36a'); ctx.fillRect(-2.8, -3.4, 5.6, 0.7); ctx.fillStyle = tinta('#1d1e1c'); ctx.fillRect(-0.6, -12, 1.2, 1.8); break;
    case 'granada40':
      parte(ctx, -3, -2, 6, 6, laton); esfera(ctx, 0, -3, 3, '#4a5d23'); break;
    case 'pasador':     // anilla con el pasador recién sacado, colgando de un dedo
      if (!Pincel.silueta) { ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.strokeStyle = tinta('#b8b8b8'); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.strokeStyle = tinta('#9a9a9a'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(1.6, 1.4); ctx.lineTo(3.4, 5.4); ctx.lineTo(4.2, 5.0); ctx.stroke(); }
      break;
    case 'granada':
      esfera(ctx, 0, 0, 5, '#3d5a2a'); parte(ctx, -1.5, -7, 3, 3, '#999'); parte(ctx, 1, -6.5, 4, 1.5, '#777'); break;
    case 'ignicion':    // cilindro de ignición del lanzallamas, con los culotes de los cartuchos
      parte(ctx, -3, -2.6, 6, 5.2, '#4b5434');
      if (!Pincel.silueta) { ctx.fillStyle = '#c9a227'; for (const x of [-1.5, 0, 1.5]) { ctx.beginPath(); ctx.arc(x, -2.4, 0.5, 0, Math.PI * 2); ctx.fill(); } }
      break;
    case 'celda':
      if (!Pincel.silueta) { ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 8; }
      esfera(ctx, 0, 0, 3.5, '#39ff14'); break;
  }
  ctx.restore();
}

/* Peine apoyado en la guía del cajón: las balas van bajando a medida que el pulgar empuja */
function dibujarPeineEnArma(ctx, peine) {
  const n = Math.ceil(5 * peine.restante);
  parte(ctx, peine.x - 1, peine.y - 13, 2, 13, '#7a7a7a');
  for (let k = 0; k < n; k++) {
    const by = peine.y - 12 + (5 - n + k) * 2.4;
    parte(ctx, peine.x, by, 6, 2, '#c9a227'); ctx.fillStyle = tinta('#b87333'); ctx.fillRect(peine.x + 6, by + 0.4, 1.5, 1.2);
  }
}

/* Trepando una escalera de mano: de perfil contra la escalera, las manos se turnan en los barrotes de arriba y las
 * piernas suben de a un escalón (una rodilla arriba mientras la otra estira). Colgado de una soga: las dos manos
 * arriba, una sobre la otra, y las piernas juntas, balanceándose un poco. El arma va colgada a la espalda. */
function dibujarColgado(ctx, j, S, C) {
  const Clejos = Object.assign({}, C, { chaqueta: ajustarColor(C.chaqueta, -0.28), piel: ajustarColor(C.piel, -0.25), guante: ajustarColor(C.guante, -0.05), antebrazo: C.antebrazo && ajustarColor(C.antebrazo, -0.28), parche: C.parche && ajustarColor(C.parche, -0.28), brazal: C.brazal && ajustarColor(C.brazal, -0.28) });
  const pantalonLejos = ajustarColor(C.pantalon, -0.18);
  // Arma a la espalda, en diagonal
  ctx.save(); ctx.translate(-14, -50); ctx.rotate(-1.05);
  pieza(ctx, redondo(-20, -2.5, 40, 5, 2), '#26272b', -20, 20); detalle(ctx, '#3a3c42', c => c.rect(-6, -2.5, 10, 2));
  ctx.restore();
  if (j.trepa) {
    const T = j.trepa, peldanos = Math.abs(T.y1 - T.y0) / 12, c = Math.sin(T.f * peldanos * Math.PI);   // un ciclo cada dos barrotes
    const sube = Math.max(0, c), baja = Math.max(0, -c);
    piernaArticulada(ctx, -2, -34, 0.35 + 0.75 * baja, 0.45 + 1.1 * baja, pantalonLejos, C);
    brazoConMano(ctx, -3, -53, 7, -74 - 9 * baja, Clejos, undefined, { cierre: 0.95, dir: -Math.PI / 2 });
    dibujarTorso(ctx, S, C, 0);
    ctx.save(); ctx.translate(2, -62); ctx.rotate(-0.18); ctx.translate(0, 62);   // mira hacia arriba
    dibujarCabeza(ctx, S, C, 0, j.estadoArma()); ctx.restore();
    piernaArticulada(ctx, 3, -34, 0.35 + 0.75 * sube, 0.45 + 1.1 * sube, C.pantalon, C);
    brazoConMano(ctx, 4, -52, 8, -74 - 9 * sube, C, undefined, { cierre: 0.95, dir: -Math.PI / 2 });
    return;
  }
  // Colgado de la soga
  const vaiven = Math.sin(j.ahora / 260) * 0.12;
  piernaArticulada(ctx, -2, -34, 0.1 + vaiven, 0.35, pantalonLejos, C);
  brazoConMano(ctx, -3, -53, 0, -78, Clejos, undefined, { cierre: 0.95, dir: -Math.PI / 2 });
  dibujarTorso(ctx, S, C, 0);
  ctx.save(); ctx.translate(1, -62); ctx.rotate(-0.12); ctx.translate(0, 62); dibujarCabeza(ctx, S, C, 0, j.estadoArma()); ctx.restore();
  piernaArticulada(ctx, 3, -34, 0.25 + vaiven, 0.5, C.pantalon, C);
  brazoConMano(ctx, 4, -52, 1, -70, C, undefined, { cierre: 0.95, dir: -Math.PI / 2 });
}
