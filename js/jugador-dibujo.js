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

/* --- Partes del cuerpo --- */
// Pierna articulada: muslo desde la cadera, rodilla, canilla y bota. a = ángulo del muslo (adelante > 0), doblez = flexión de la rodilla.
// Pantalón cargo con bolsillo en el muslo, rodillera de casco duro con su correa y bota de caña alta con cordones y suela con dibujo.
function piernaArticulada(ctx, hx, hy, a, doblez, color, C) {
  const L1 = 13, L2 = 12;
  const kx = hx + Math.sin(a) * L1, ky = hy + Math.cos(a) * L1;
  const b = a - doblez;
  const px = kx + Math.sin(b) * L2, py = ky + Math.cos(b) * L2;
  // Canilla con la pantorrilla atrás (va primero: el muslo tapa la unión)
  pintura(ctx, tramo(kx, ky, px, py - 2, 7.6, 6, 1), color);
  // Muslo, más ancho arriba y con el cuádriceps adelante
  pintura(ctx, tramo(hx, hy, kx, ky, 9.2, 7.6, -0.8), color);
  if (!Pincel.silueta) {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-a);
    // Bolsillo cargo con tapa y botón
    pintura(ctx, c => c.roundRect(-3.6, 4.2, 6.8, 6.2, 1.2), ajustarColor(color, -0.04), { sombra: 0.6, brillo: 0.2, linea: 0.4 });
    pintura(ctx, c => c.roundRect(-3.8, 3.8, 7.2, 2.2, 0.8), ajustarColor(color, -0.12), { sombra: 0.4, brillo: 0.18, linea: 0.4 });
    detalle(ctx, ajustarColor(color, -0.45), circulo(-0.2, 5.1, 0.45));
    raya(ctx, ajustarColor(color, -0.3), 0.35, [[2.8, 0.5], [3.2, 11]]);                                    // costura de adelante
    ctx.restore();
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(-b);
    raya(ctx, ajustarColor(color, -0.28), 0.35, [[-2.6, 3], [-2, 9]]); raya(ctx, ajustarColor(color, -0.22), 0.3, [[2.6, 6], [2, 10]]);   // pliegues
    ctx.restore();
  }
  // Rodillera: casco duro sobre la rodilla, con la correa
  ctx.save(); ctx.translate(kx, ky); ctx.rotate(-b);
  pintura(ctx, c => { c.moveTo(1.2, -3.3); c.quadraticCurveTo(5.7, -3, 5.5, 0.2); c.quadraticCurveTo(5.3, 3.3, 1.2, 3.5); c.quadraticCurveTo(2.6, 0.1, 1.2, -3.3); }, ajustarColor(C.rodillera, 0.12), { sombra: 0.7, brillo: 0.4, linea: 0.4 });
  raya(ctx, ajustarColor(C.rodillera, 0.35), 0.35, [[3.4, -2.2], [4.3, 0.2]]);   // reflejo del casco
  ctx.restore();
  // Bota de caña alta: caña, empeine redondeado, cordones, puntera, suela con dibujo y taco
  const B = C.bota;
  pintura(ctx, c => c.roundRect(px - 4.4, py - 5.4, 8.6, 9.6, 1.6), B, { sombra: 0.8 });
  pintura(ctx, c => { c.moveTo(px - 4.8, py + 1.4); c.lineTo(px + 2.6, py + 1.2); c.quadraticCurveTo(px + 9.2, py + 2.4, px + 9.8, py + 6.2); c.lineTo(px + 9.8, py + 7.8); c.lineTo(px - 4.8, py + 7.8); }, B, { sombra: 0.8, brillo: 0.35 });
  pintura(ctx, c => c.roundRect(px - 5.2, py + 7.2, 15.4, 1.9, 0.6), ajustarColor(B, -0.45), { sombra: 0.3, brillo: false, linea: 0.35 });   // suela
  if (!Pincel.silueta) {
    for (let k = 0; k < 6; k++) detalle(ctx, ajustarColor(B, -0.65), c2 => c2.rect(px - 4.4 + k * 2.4, py + 8.4, 1.1, 0.7));                // dibujo de la suela
    detalle(ctx, ajustarColor(B, -0.35), c2 => c2.rect(px - 5.2, py + 6.2, 4.6, 1.2));                                                   // taco
    for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(B, 0.55), 0.45, [[px + 0.4, py - 3.6 + k * 2.2], [px + 3.4, py - 2.6 + k * 2.2]]);   // cordones
    raya(ctx, 'rgba(255,240,220,0.28)', 0.6, [[px + 5, py + 2.8], [px + 8, py + 4.2]]);                                                   // brillo de la puntera
    raya(ctx, ajustarColor(B, -0.4), 0.4, [[px - 4.2, py - 3.6], [px + 4, py - 3.6]]);                                                    // borde de la caña
  }
}

// Brazo en dos tramos de largo fijo (cinemática inversa): el codo cae donde corresponde según dónde esté la mano.
// Manga con pliegues, arremangada en un rollo grueso sobre el codo, y antebrazo con el músculo marcado.
function brazoDetallado(ctx, hx, hy, mx, my, C, L1 = 13.5, L2 = 13) {
  const dx = mx - hx, dy = my - hy, d = Math.hypot(dx, dy) || 0.001;
  let l1 = L1, l2 = L2;
  if (d > (L1 + L2) * 0.995) { const k = d / ((L1 + L2) * 0.995); l1 *= k; l2 *= k; }   // si no llega, se estira apenas
  // Mano cerca del hombro (P90, Uzi, tubos al hombro): el brazo viene hacia el que mira y se ve más corto (escorzo).
  // Sin esto, el único modo de que entre es doblar el codo hasta el cinturón
  else if (d < (L1 + L2) * 0.8) { const k = Math.max(0.5, d / ((L1 + L2) * 0.8)); l1 *= k; l2 *= k; }
  const a = Math.acos(limitar((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), base = Math.atan2(dy, dx);
  const cx = hx + Math.cos(base + a) * l1, cy = hy + Math.sin(base + a) * l1;                // codo hacia abajo
  // Antebrazo: más grueso cerca del codo
  pintura(ctx, tramo(cx, cy, mx, my, 5.8, 4.5, 0.5), C.piel, { sombra: 0.8 });
  if (!Pincel.silueta) raya(ctx, ajustarColor(C.piel, -0.22), 0.45, [[cx + (mx - cx) * 0.25, cy + (my - cy) * 0.25 + 1.2], [cx + (mx - cx) * 0.65, cy + (my - cy) * 0.65 + 0.8]]);
  // Manga: ancha en el hombro, con dos pliegues
  pintura(ctx, tramo(hx, hy, cx, cy, 7.6, 6.2, -0.5), C.chaqueta);
  if (!Pincel.silueta) {
    const pl = (k, w) => { const x = hx + (cx - hx) * k, y = hy + (cy - hy) * k, ang = Math.atan2(cy - hy, cx - hx) + Math.PI / 2; raya(ctx, ajustarColor(C.chaqueta, -0.32), 0.45, [[x - Math.cos(ang) * w, y - Math.sin(ang) * w], [x + Math.cos(ang) * w * 0.4, y + Math.sin(ang) * w * 0.4 + 0.6]]); };
    pl(0.45, 2.3); pl(0.7, 1.9);
  }
  // Rollo de la manga arremangada
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(my - cy, mx - cx));
  pintura(ctx, c => c.ellipse(0.3, 0, 2.1, 3.8, 0, 0, Math.PI * 2), ajustarColor(C.chaqueta, 0.08), { sombra: 0.7, brillo: 0.35 });
  raya(ctx, ajustarColor(C.chaqueta, -0.3), 0.4, [[0.5, -2.9], [0.3, 2.9]]);
  ctx.restore();
  pintura(ctx, c => c.arc(hx, hy, 4.3, 0, Math.PI * 2), C.chaqueta, { contorno: false, sombra: 0.8 });   // hombro redondo
}

// Mano con guante táctico: dedos cerrados, pulgar, nudillera dura y puño elastizado
function manoConGuante(ctx, x, y, C) {
  const G = C.guante;
  pintura(ctx, c => c.roundRect(x - 3.6, y + 2, 7.2, 2.2, 0.8), ajustarColor(G, 0.12), { sombra: 0.4, brillo: false, linea: 0.35 });   // puño
  pintura(ctx, c => c.roundRect(x - 3.6, y - 3.2, 7.4, 6.4, 2.4), G, { sombra: 0.8, brillo: 0.3 });
  pintura(ctx, c => c.ellipse(x - 2.9, y - 1.4, 1.7, 2.5, -0.5, 0, Math.PI * 2), ajustarColor(G, 0.06), { sombra: 0.4, brillo: 0.25, linea: 0.35 });   // pulgar
  pintura(ctx, c => c.roundRect(x - 1.8, y - 2.6, 4.6, 2, 0.8), ajustarColor(G, 0.2), { sombra: 0.4, brillo: 0.3, linea: 0.35 });   // nudillera
  if (!Pincel.silueta) for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(G, -0.35), 0.35, [[x - 1.4 + k * 1.6, y + 0.2], [x - 1.2 + k * 1.6, y + 2.2]]);   // dedos
}

/* ---------- Manos que agarran el arma ----------
 * Mano del gatillo: la palma queda del otro lado de la empuñadura (se dibuja antes que el arma); de este lado
 * se ven el pulgar cruzando por arriba, los tres dedos envolviendo el frente y el índice en el disparador.
 * El eje de la empuñadura baja inclinado hacia atrás según `ang`. */
function manoGatilloPalma(ctx, x, y, ang, C) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  pieza(ctx, redondo(-2.0, 0.2, 3.9, 5.0, 1.6), ajustarColor(C.guante, -0.18), -2, 1.9);
  ctx.restore();
}
function manoGatilloDedos(ctx, x, y, ang, C) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  pieza(ctx, redondo(-2.0, -0.3, 3.4, 1.35, 0.6), C.guante, -2, 1.4);                                     // pulgar por arriba
  for (let k = 0; k < 3; k++) pieza(ctx, redondo(0.5, 1.8 + k * 1.25, 2.1, 1.15, 0.55), ajustarColor(C.guante, 0.04 * k), 0.5, 2.6);   // dedos sobre el frente
  ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang * 0.25);
  pieza(ctx, redondo(0.4, 0.5, 2.7, 0.95, 0.45), ajustarColor(C.guante, 0.06), 0.4, 3.1);               // índice en el disparador
  ctx.restore();
}
// Mano de apoyo en un arma larga: la palma sostiene el guardamanos desde abajo y los dedos suben por este costado
function manoGuardamanos(ctx, x, y, C) {
  pieza(ctx, redondo(x - 2.7, y + 0.5, 5.4, 2.5, 1.1), ajustarColor(C.guante, -0.08), x - 2.7, x + 2.7);
  for (let k = 0; k < 4; k++) {
    const fx = x - 2.0 + k * 1.3;
    pieza(ctx, poli(segmento(fx - 0.3, y + 1.7, fx + 0.2, y - 1.3, 1.15, 1.0)), ajustarColor(C.guante, 0.05), fx - 0.9, fx + 0.8);
  }
}
// Mano de apoyo en una pistola: envuelve los dedos de la otra mano, con el pulgar estirado sobre el armazón
function manoEnvolvente(ctx, x, y, ang, C) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  pieza(ctx, redondo(-1.5, -1.8, 4.1, 4.8, 1.6), C.guante, -1.5, 2.6);
  for (let k = 0; k < 3; k++) detalle(ctx, ajustarColor(C.guante, 0.32), c => c.rect(0.3, -0.7 + k * 1.3, 2.1, 0.35));
  ctx.restore();
  pieza(ctx, redondo(x - 0.6, y - 2.9, 3.6, 1.15, 0.5), ajustarColor(C.guante, 0.08), x - 0.6, x + 3);
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
  ctx.scale(this.direccion, 1);
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
  const gatillo = tapa ? { x: -2, y: -80 + ty } : this.montada ? { x: e.origen.x - 12 - 16.5, y: -44 } : { x: e.origen.x + e.manoGatillo.x, y: e.origen.y + e.manoGatillo.y };
  const muneca = this.montada ? gatillo : { x: gatillo.x - Math.sin(angMano) * 2.8, y: gatillo.y + Math.cos(angMano) * 2.8 };
  const Clejos = Object.assign({}, C, { chaqueta: ajustarColor(C.chaqueta, -0.28), piel: ajustarColor(C.piel, -0.25), guante: ajustarColor(C.guante, -0.05) });
  const golpe = (this.montada || dArma.agarre === 'hombro') ? e.empuje * 1.2 : e.empuje * 0.4;   // el hombro absorbe el retroceso
  brazoDetallado(ctx, -4 - golpe, -53 + ty, muneca.x, muneca.y, Clejos);

  // Cinturón con hebilla, cartucheras atrás y funda con pistola en el muslo (al 88 % de ancho, como el torso)
  ctx.save(); ctx.scale(0.88, 1);
  pintura(ctx, c => c.roundRect(-12.4, -37.4, 24.6, 5.2, 1.4), C.cinturon, { sombra: 0.7 });
  pintura(ctx, c => c.roundRect(0.4, -37, 5, 4.4, 0.8), '#7d8288', { sombra: 0.5, brillo: 0.5, linea: 0.35 });          // hebilla de cierre rápido
  for (const x of [-10.6, -4.4]) {   // portacargadores con tapa
    pintura(ctx, c => c.roundRect(x, -36.4, 5.4, 8, 1.2), C.bolsa, { sombra: 0.7 });
    pintura(ctx, c => c.roundRect(x - 0.2, -36.8, 5.8, 2.6, 0.8), ajustarColor(C.bolsa, -0.1), { sombra: 0.4, brillo: 0.2, linea: 0.35 });
  }
  // Funda de muslo: la empuñadura de la pistola asoma, y la correa abraza la pierna
  pintura(ctx, c => c.roundRect(6.6, -33.4, 6.8, 12.4, 1.8), C.funda, { sombra: 0.8 });
  pintura(ctx, c => c.roundRect(7.6, -36.6, 3.8, 4.6, 1), '#26272b', { sombra: 0.5, linea: 0.35 });
  pintura(ctx, c => c.roundRect(5.6, -25.6, 9, 1.8, 0.6), C.correa, { sombra: 0.3, brillo: false, linea: 0.3 });
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
    manoConGuante(ctx, gatillo.x, gatillo.y, Clejos);
    brazoDetallado(ctx, 4, -52 + ty, 6, -81 + ty, C);
    manoConGuante(ctx, 6, -81 + ty, C);
    return;
  }

  if (this.montada) {
    // Mano del gatillo fija en las empuñaduras (su brazo va detrás del torso); el brazo izquierdo sigue la recarga de la cinta
    manoConGuante(ctx, gatillo.x, gatillo.y, Clejos);
    const apoyo = tapa ? { x: 4, y: -82 + ty } : e.mano;
    brazoDetallado(ctx, 4 - golpe, -52 + ty, apoyo.x, apoyo.y, C);
    manoConGuante(ctx, apoyo.x, apoyo.y, C);
    if (e.enMano) dibujarUnidad(ctx, e.enMano, e.mano.x, e.mano.y, e.rotMano);
    return;
  }

  const arma = this.arma(), d = dArma;
  if (d.agarre === 'cuerpo') {
    // Cuerpo a cuerpo: el arma, encima el puño derecho cerrado en el mango; el izquierdo también en el mango
    // (dos manos) o en guardia delante del pecho (una mano)
    ctx.save(); ctx.translate(e.origen.x, e.origen.y); ctx.rotate(e.incl); d.dibujar(ctx, e); ctx.restore();
    manoConGuante(ctx, gatillo.x, gatillo.y, Clejos);
    const hombro = 3 - golpe;
    if (!arma.unaMano && !e.sinCargador) {
      brazoDetallado(ctx, hombro, -52 + ty, e.mano.x, e.mano.y, C);
      manoConGuante(ctx, e.mano.x, e.mano.y, C);
    } else {
      const g = this.golpeActual, p = g ? limitar((this.ahora - g.inicio) / g.dur, 0, 1) : 0;
      const guardia = { x: 9 - Math.sin(p * Math.PI) * 6, y: -42 + ty - Math.sin(p * Math.PI) * 4 };   // contrapeso del golpe
      brazoDetallado(ctx, hombro, -52 + ty, guardia.x, guardia.y, C);
      manoConGuante(ctx, guardia.x, guardia.y, C);
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
  else manoConGuante(ctx, gatillo.x, gatillo.y + 1, Clejos);
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
    brazoDetallado(ctx, hombroX, -52 + ty, mano.x - 2.4, mano.y + 2.6, C, ...L);
    manoGuardamanos(ctx, mano.x, mano.y, C);
  } else if (agarrando && estilo === 'envuelve') {
    brazoDetallado(ctx, hombroX, -52 + ty, e.mano.x - Math.sin(angMano) * 1.4, e.mano.y + Math.cos(angMano) * 1.9, C, ...L);
    manoEnvolvente(ctx, e.mano.x, e.mano.y, angMano, C);
  } else {
    brazoDetallado(ctx, hombroX, -52 + ty, e.mano.x, e.mano.y, C, ...L);
    // Lo que lleva en la mano va entre los dedos: se dibuja antes que la mano para que esta lo tape un poco
    if (e.enMano) dibujarUnidad(ctx, e.enMano, e.mano.x, e.mano.y, e.rotMano);
    manoConGuante(ctx, e.mano.x, e.mano.y, C);
  }
};

/* Lo que puede llevar la mano durante una recarga, con su forma propia */
function dibujarUnidad(ctx, tipo, x, y, rot = 0) {
  const laton = '#c9a227', cobre = '#b87333';
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  switch (tipo) {
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
  const Clejos = Object.assign({}, C, { chaqueta: ajustarColor(C.chaqueta, -0.28), piel: ajustarColor(C.piel, -0.25), guante: ajustarColor(C.guante, -0.05) });
  const pantalonLejos = ajustarColor(C.pantalon, -0.18);
  // Arma a la espalda, en diagonal
  ctx.save(); ctx.translate(-14, -50); ctx.rotate(-1.05);
  pieza(ctx, redondo(-20, -2.5, 40, 5, 2), '#26272b', -20, 20); detalle(ctx, '#3a3c42', c => c.rect(-6, -2.5, 10, 2));
  ctx.restore();
  if (j.trepa) {
    const T = j.trepa, peldanos = Math.abs(T.y1 - T.y0) / 12, c = Math.sin(T.f * peldanos * Math.PI);   // un ciclo cada dos barrotes
    const sube = Math.max(0, c), baja = Math.max(0, -c);
    piernaArticulada(ctx, -2, -34, 0.35 + 0.75 * baja, 0.45 + 1.1 * baja, pantalonLejos, C);
    brazoDetallado(ctx, -3, -53, 7, -74 - 9 * baja, Clejos); manoConGuante(ctx, 7, -74 - 9 * baja, Clejos);
    dibujarTorso(ctx, S, C, 0);
    ctx.save(); ctx.translate(2, -62); ctx.rotate(-0.18); ctx.translate(0, 62);   // mira hacia arriba
    dibujarCabeza(ctx, S, C, 0, j.estadoArma()); ctx.restore();
    piernaArticulada(ctx, 3, -34, 0.35 + 0.75 * sube, 0.45 + 1.1 * sube, C.pantalon, C);
    brazoDetallado(ctx, 4, -52, 8, -74 - 9 * sube, C); manoConGuante(ctx, 8, -74 - 9 * sube, C);
    return;
  }
  // Colgado de la soga
  const vaiven = Math.sin(j.ahora / 260) * 0.12;
  piernaArticulada(ctx, -2, -34, 0.1 + vaiven, 0.35, pantalonLejos, C);
  brazoDetallado(ctx, -3, -53, 0, -78, Clejos); manoConGuante(ctx, 0, -78, Clejos);
  dibujarTorso(ctx, S, C, 0);
  ctx.save(); ctx.translate(1, -62); ctx.rotate(-0.12); ctx.translate(0, 62); dibujarCabeza(ctx, S, C, 0, j.estadoArma()); ctx.restore();
  piernaArticulada(ctx, 3, -34, 0.25 + vaiven, 0.5, C.pantalon, C);
  brazoDetallado(ctx, 4, -52, 1, -70, C); manoConGuante(ctx, 1, -70, C);
}
