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
      pb(ctx, rr(x, -alto - prof, w, prof, 0.4), P.arenaOsc, { sombra: 0.4, brillo: 0.3 });
      if (!Pincel.silueta) { ctx.fillStyle = 'rgba(255,240,200,0.18)'; ctx.beginPath(); ctx.ellipse(x + w / 2, -alto - prof / 2, w * 0.36, prof * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#5a5d60'; ctx.lineWidth = 0.6; ctx.strokeRect(x + 0.3, -alto - prof + 0.3, w - 0.6, prof - 0.6); }
      // Frente de malla con el geotextil
      pb(ctx, c => { c.moveTo(x, 0); c.lineTo(x, -alto); c.lineTo(x + w, -alto + (roto ? 2 : 0)); c.lineTo(x + w, 0); c.closePath(); }, '#b49d70', { sombra: 0.7, brillo: 0.25 });
      if (Pincel.silueta) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x, -alto - 2, w, alto + 2); ctx.clip();
      ctx.strokeStyle = 'rgba(70,72,74,0.55)'; ctx.lineWidth = 0.35;
      for (let gx = x + 3.2; gx < x + w; gx += 3.2) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + (roto ? 0.6 : 0), -alto); ctx.stroke(); }
      for (let gy = -3.2; gy > -alto; gy -= 3.2) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy + (roto ? 0.8 : 0)); ctx.stroke(); }
      ctx.restore();
      linea(ctx, '#5a5d60', 0.8, [[x + 0.3, 0], [x + 0.3, -alto]]); linea(ctx, '#5a5d60', 0.8, [[x + w - 0.3, 0], [x + w - 0.3, -alto + (roto ? 2 : 0)]]);
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

/* ---------- Campamento en 3/4: muro de cestones con portón, torre de guardia, carpas, cuartel y taller vistos desde arriba ---------- */
Juego.prototype.campamentoQuieto = function (ctx) {
  const B = BASTION, P = PAL_BASTION, alto = this.filas * B.celda[1], y0 = B.arriba, x = B.baseX;
  const puertaY = y0 + alto / 2 + 8, abajo = y0 + alto + 20;
  // Patio de tierra apisonada con ripio y huellas de orugas
  const piso = ctx.createLinearGradient(0, y0 - 40, 0, abajo);
  piso.addColorStop(0, '#514b3b'); piso.addColorStop(1, '#5a5442');
  ctx.fillStyle = piso; ctx.beginPath(); ctx.roundRect(-10, y0 - 34, x + 2, abajo - y0 + 34, 8); ctx.fill();
  for (let k = 0; k < 110; k++) { ctx.fillStyle = k % 2 ? 'rgba(30,26,18,0.25)' : 'rgba(170,160,130,0.2)'; ctx.fillRect(azar(k, 201) * (x - 8), y0 - 30 + azar(k, 202) * (abajo - y0 + 26), 1.4, 1); }
  ctx.strokeStyle = 'rgba(30,26,18,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([2, 1.4]);
  for (const dy of [-5, 5]) { ctx.beginPath(); ctx.moveTo(x - 8, puertaY + dy); ctx.quadraticCurveTo(70, puertaY + dy, 50, abajo - 40 + dy); ctx.stroke(); }
  ctx.setLineDash([]);
  // Torre de guardia: cuatro patas, plataforma de tablones con bolsas, techo y reflector
  const tx = 30, ty = y0 + 26;
  sombraCaja(ctx, tx - 13, tx + 13, ty, 12, 40, 0.28);
  for (const [px, py, col] of [[tx - 11, ty - 12, '#4a3c28'], [tx + 11, ty - 12, '#4a3c28'], [tx - 12, ty, '#5a4a32'], [tx + 12, ty, '#5a4a32']]) linea(ctx, col, 2, [[px, py], [px + (px < tx ? 2 : -2), py - 40]]);
  linea(ctx, '#4a3c28', 1, [[tx - 12, ty - 4], [tx + 10, ty - 30]]); linea(ctx, '#4a3c28', 1, [[tx + 12, ty - 4], [tx - 10, ty - 30]]);
  caja34(ctx, tx - 13, tx + 13, ty - 38, 13, 3, '#5a4630', '#7a6040');
  paredBolsas(ctx, tx - 13, tx + 13, ty - 41, 1, 6, 3.6, 5);
  for (const px of [tx - 12, tx + 12]) linea(ctx, '#3a3226', 1, [[px, ty - 44], [px, ty - 58]]);
  pb(ctx, c => { c.moveTo(tx - 16, ty - 58); c.lineTo(tx + 16, ty - 58); c.lineTo(tx + 13, ty - 74); c.lineTo(tx - 13, ty - 74); c.closePath(); }, '#55603e', { sombra: 0.5, brillo: 0.3 });
  pb(ctx, rr(tx + 8, ty - 50, 5, 4, 1), '#3a3c3e', { sombra: 0.3, linea: 0.35 });
  // Mástil de la bandera (la tela se pinta por cuadro)
  const mx = 74, my = y0 + 40;
  sombraPiso(ctx, 5, 2, 0.3, mx + 3, my);
  linea(ctx, '#8a8f94', 1.2, [[mx, my], [mx, my - 66]]);
  // Carpas de campaña: faldón de adelante, cumbrera y la entrada en la punta
  const carpa = (cx, cy, w, col) => {
    sombraCaja(ctx, cx - w / 2, cx + w / 2, cy, 14, 14, 0.26);
    pb(ctx, c => { c.moveTo(cx - w / 2, cy); c.lineTo(cx + w / 2, cy); c.lineTo(cx + w / 2 - 3, cy - 20); c.lineTo(cx - w / 2 + 3, cy - 20); c.closePath(); }, ajustarColor(col, -0.08), { sombra: 0.7, brillo: 0.2 });
    pb(ctx, c => { c.moveTo(cx - w / 2 + 3, cy - 20); c.lineTo(cx + w / 2 - 3, cy - 20); c.lineTo(cx + w / 2 - 5, cy - 25); c.lineTo(cx - w / 2 + 5, cy - 25); c.closePath(); }, ajustarColor(col, 0.12), { sombra: 0.3, brillo: 0.35, linea: 0.4 });
    for (const f of [-0.25, 0, 0.25]) linea(ctx, ajustarColor(col, -0.3), 0.5, [[cx + f * w, cy], [cx + f * w * 0.9, cy - 20]]);
    pb(ctx, c => { c.moveTo(cx + w / 2, cy); c.lineTo(cx + w / 2 - 3, cy - 20); c.lineTo(cx + w / 2 + 3, cy - 6); c.closePath(); }, ajustarColor(col, -0.25), { sombra: 0.3, linea: 0.4 });
    detalle(ctx, '#1e1c16', c => { c.moveTo(cx + w / 2 - 0.5, cy - 1); c.lineTo(cx + w / 2 - 2.4, cy - 12); c.lineTo(cx + w / 2 + 1.6, cy - 4); });
    linea(ctx, '#c9c0a6', 0.4, [[cx - w / 2 + 4, cy - 14], [cx - w / 2 - 4, cy + 2]]); linea(ctx, '#c9c0a6', 0.4, [[cx + w / 2 - 4, cy - 22], [cx + w / 2 + 6, cy - 16]]);
  };
  carpa(34, y0 + 96, 40, '#5d6440'); carpa(76, y0 + 128, 36, '#525a39');
  // Tambores de combustible y cajones
  const tambor = (bx, by) => { sombraPiso(ctx, 4, 1.6, 0.3, bx + 2, by); pb(ctx, rr(bx - 3, by - 8, 6, 8, 1), '#4d5a3a', { sombra: 0.4, linea: 0.35 }); pb(ctx, c => c.ellipse(bx, by - 8, 3, 1.4, 0, 0, Math.PI * 2), '#62704a', { sombra: 0.2, linea: 0.35, brillo: 0.4 }); };
  tambor(92, y0 + 62); tambor(99, y0 + 66); tambor(89, y0 + 70);
  caja34(ctx, 12, 24, abajo - 128, 8, 7, '#6e5030', '#8a6640'); caja34(ctx, 14, 22, abajo - 135, 6, 6, '#6e5030', '#8a6640');
  // Cuartel prefabricado: techo de chapa visto desde arriba, frente con ventanas encendidas, puerta y cartel
  const cy = y0 + alto - 80;
  sombraCaja(ctx, 14, 84, cy, 20, 16, 0.3);
  pb(ctx, rr(14, cy - 16, 70, 16, 0.8), '#7a7764', { sombra: 0.6, brillo: 0.2 });
  for (const wx of [20, 66]) { pb(ctx, rr(wx, cy - 13, 11, 7, 0.6), '#f2c96a', { sombra: 0.2, linea: 0.4, brillo: false }); linea(ctx, '#5a564a', 0.5, [[wx + 5.5, cy - 13], [wx + 5.5, cy - 6]]); }
  pb(ctx, rr(42, cy - 13, 11, 13, 0.6), '#4a4c4e', { sombra: 0.3, linea: 0.4 });
  pb(ctx, rr(12, cy - 38, 74, 22.4, 1), '#6b7076', { sombra: 0.5, brillo: 0.35 });
  for (let k = 1; k < 7; k++) linea(ctx, 'rgba(30,32,36,0.3)', 0.5, [[13, cy - 38 + k * 3.2], [85, cy - 38 + k * 3.2]]);
  caja34(ctx, 60, 72, cy - 22, 8, 4, '#8c9196', '#a7acb1');                                           // aire acondicionado
  pb(ctx, rr(30, cy - 21, 38, 7, 0.8), '#2e3a2a', { sombra: 0.2, linea: 0.4, brillo: 0.2 });
  ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('bastion.cuartel'), 49, cy - 15.6);
  // Taller: galpón de chapa en arco con el portón al frente y un blindado adentro
  const gy = y0 + alto - 16;
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
  // Muro de cestones a lo largo del frente: se ve el techo de arena; al pie, la sombra hacia la derecha; el portón al medio
  const wx = x - 14, hm = 10;
  ctx.fillStyle = 'rgba(10,8,6,0.28)'; ctx.fillRect(wx + 11, y0 - 24, 7, abajo - y0 + 18);
  for (let y = y0 - 26; y < abajo - 6; y += 12) {
    if (Math.abs(y + 6 - puertaY) < 16) continue;
    pb(ctx, rr(wx, y - hm, 12, 12, 0.4), P.arenaOsc, { sombra: 0.4, brillo: 0.3, linea: 0.45 });
    ctx.strokeStyle = '#5a5d60'; ctx.lineWidth = 0.5; ctx.strokeRect(wx + 0.3, y - hm + 0.3, 11.4, 11.4);
    const sigue = !(Math.abs(y + 18 - puertaY) < 16) && y + 12 < abajo - 6;
    if (!sigue) {   // frente del último cestón antes del portón (y del final)
      pb(ctx, rr(wx, y + 12 - hm, 12, hm, 0.4), '#b49d70', { sombra: 0.5, linea: 0.45 });
      ctx.strokeStyle = 'rgba(70,72,74,0.5)'; ctx.lineWidth = 0.3; for (let k = 3; k < 12; k += 3) { ctx.beginPath(); ctx.moveTo(wx + k, y + 2); ctx.lineTo(wx + k, y + 12); ctx.stroke(); }
    }
  }
  for (const s of [-1, 1]) caja34(ctx, wx - 1, wx + 13, puertaY + s * 16 + (s < 0 ? 0 : 4), 4, 6, P.concretoOsc, P.concreto);
  ctx.save(); ctx.translate(wx + 6, puertaY + 14); ctx.rotate(-1.3);   // barrera levantada, a rayas rojas y blancas
  for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#f2efe6' : '#c0392b'; ctx.fillRect(k * 4, -1, 4, 2); }
  ctx.restore();
};
// El campamento quieto sale de la caché; por cuadro: el haz del reflector, la bandera, el avance del cuartel y el taller y el daño
Juego.prototype.dibujarCampamento = function (ctx) {
  const B = BASTION, alto = this.filas * B.celda[1], y0 = B.arriba, x = B.baseX, ms = this.ahora;
  const tx = 30, ty = y0 + 26, mx = 74, my = y0 + 40, cy = y0 + alto - 80, gy = y0 + alto - 16;
  conSprite(ctx, 'campamento34-' + this.filas + 'x' + this.cols + (typeof Idioma !== 'undefined' && Idioma.actual ? Idioma.actual() : ''), [-10, y0 - 120, x + 8, y0 + alto + 24], g => this.campamentoQuieto(g));
  if (!Lienzo.liviano) {   // haz del reflector que barre el campo
    const a = Math.sin(ms / 2200) * 0.25;
    ctx.save(); ctx.translate(tx + 13, ty - 48); ctx.rotate(0.3 + a); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 240, 0); g.addColorStop(0, 'rgba(255,245,200,0.16)'); g.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -1.5); ctx.lineTo(240, -30); ctx.lineTo(240, 30); ctx.lineTo(0, 1.5); ctx.fill(); ctx.restore();
  }
  const ond = k => Math.sin(ms / 260 + k) * 1.6;
  pb(ctx, c => { c.moveTo(mx, my - 66); c.quadraticCurveTo(mx + 9, my - 67 + ond(0), mx + 20, my - 65 + ond(1)); c.lineTo(mx + 20, my - 55 + ond(1)); c.quadraticCurveTo(mx + 9, my - 57 + ond(0), mx, my - 56); c.closePath(); }, '#3a6fb0', { sombra: 0.4, linea: 0.4 });
  detalle(ctx, '#f2e9d4', c => c.rect(mx + 4, my - 63 + ond(0) * 0.5, 4, 4));
  for (const [cola, yb] of [[this.colaCuartel, cy - 46], [this.colaTaller, gy - 66]]) {
    const o = cola[0]; if (!o) continue;
    const f = Math.min(1, (o.hecho || 0) / B.unidades[o.tipo].tiempo);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(16, yb, 66, 5); ctx.fillStyle = '#ffd27a'; ctx.fillRect(17, yb + 1, 64 * f, 3);
    if (cola.length > 1) { ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+' + (cola.length - 1), 90, yb + 5); }
  }
  const golpe = 1 - this.vidaBase / BASTION.vidaBase;
  if (golpe > 0) { ctx.fillStyle = `rgba(160,20,20,${golpe * 0.25})`; ctx.fillRect(0, y0 - 30, x, alto + 50); }
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
PaisajeBastion.suelo = function (ctx, N) {
  const B = BASTION, col = COLOR_SUELO[N.base] || TERRENOS_BASTION[N.base].color;
  const piso = ctx.createLinearGradient(0, 0, 0, ALTO);
  piso.addColorStop(0, ajustarColor(col, -0.16)); piso.addColorStop(0.25, col); piso.addColorStop(1, ajustarColor(col, -0.08));
  ctx.fillStyle = piso; ctx.fillRect(-20, -20, ANCHO + 40, ALTO + 40);
  // Manchas grandes y suaves: rompen el color parejo
  for (let k = 0; k < 26; k++) {
    const x = azar(k, 401) * ANCHO, y = B.arriba - 10 + azar(k, 402) * (ALTO - B.arriba), r = 30 + azar(k, 403) * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); const claro = k % 2 === 0;
    g.addColorStop(0, claro ? 'rgba(255,250,220,0.07)' : 'rgba(20,18,10,0.09)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Detalle disperso según el suelo base
  const n = N.base === 'nieve' ? 70 : 520;
  for (let k = 0; k < n; k++) {
    const x = azar(k, 411) * ANCHO, y = B.arriba - 18 + azar(k, 412) * (ALTO - B.arriba + 10), v = azar(k, 413);
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
  const orden = ['banquina', 'tierra', 'pasto', 'pastoOscuro', 'arena', 'nieve', 'barro', 'asfalto', 'hielo', 'agua', 'madera'];
  for (const tipo of orden) {
    if (!tipos.has(tipo) || tipo === N.base) continue;
    const T = TERRENOS_BASTION[tipo], col = COLOR_SUELO[tipo] || T.color;
    switch (tipo) {
      case 'tierra': {   // camino de tierra con huellas de ruedas y piedritas
        rellenar(zona(tipo, 1.5), ajustarColor(col, -0.12)); rellenar(zona(tipo), col);
        recortar(zona(tipo), () => {
          celdas(tipo, (c, f, k) => {
            ctx.strokeStyle = 'rgba(60,40,20,0.3)'; ctx.lineWidth = 2.2;
            for (const d of [H * 0.32, H * 0.68]) { ctx.beginPath(); ctx.moveTo(X(c) - 1, Y(f) + d + Math.sin(c) * 0.8); ctx.lineTo(X(c) + W + 1, Y(f) + d + Math.sin(c + 1) * 0.8); ctx.stroke(); }
            for (let j = 0; j < 6; j++) { ctx.fillStyle = j % 2 ? 'rgba(160,140,110,0.6)' : 'rgba(50,35,20,0.4)'; ctx.fillRect(X(c) + azar(k * 6 + j, 421) * W, Y(f) + azar(k * 6 + j, 422) * H, 1.4, 1.1); }
          });
        });
        break;
      }
      case 'pasto': case 'pastoOscuro': {
        rellenar(zona(tipo, 1), col);
        recortar(zona(tipo, 1), () => celdas(tipo, (c, f, k) => { for (let j = 0; j < 10; j++) { const x = X(c) + azar(k * 10 + j, 431) * W, y = Y(f) + 4 + azar(k * 10 + j, 432) * (H - 4); ctx.strokeStyle = j % 2 ? ajustarColor(col, 0.25) : ajustarColor(col, -0.25); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1, y - 4); ctx.moveTo(x + 1.4, y); ctx.lineTo(x + 2.4, y - 4); ctx.stroke(); } }));
        break;
      }
      case 'barro': {   // barro o tierra arada: surcos con agua en el fondo y huellas
        rellenar(zona(tipo, 2), 'rgba(40,28,16,0.35)'); rellenar(zona(tipo), col);
        recortar(zona(tipo), () => {
          if (N.id !== 'granja') celdas(tipo, (c, f, k) => {   // barro común: manchas húmedas, huellas de ruedas y charcos
            for (let j = 0; j < 3; j++) { ctx.fillStyle = 'rgba(20,12,6,0.3)'; ctx.beginPath(); ctx.ellipse(X(c) + azar(k * 3 + j, 445) * W, Y(f) + azar(k * 3 + j, 446) * H, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
            ctx.strokeStyle = 'rgba(25,16,8,0.45)'; ctx.lineWidth = 2; for (const d of [H * 0.35, H * 0.6]) { ctx.beginPath(); ctx.moveTo(X(c) - 1, Y(f) + d); ctx.quadraticCurveTo(X(c) + W / 2, Y(f) + d + 3, X(c) + W + 1, Y(f) + d); ctx.stroke(); }
            if (azar(k, 447) > 0.4) { ctx.fillStyle = 'rgba(110,135,150,0.5)'; ctx.beginPath(); ctx.ellipse(X(c) + W * (0.3 + azar(k, 448) * 0.4), Y(f) + H * 0.72, 8, 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(220,235,245,0.35)'; ctx.fillRect(X(c) + W * 0.4, Y(f) + H * 0.7, 5, 0.8); }
          });
          else celdas(tipo, (c, f, k) => {   // tierra arada de la granja: surcos con agua en el fondo
            for (let j = 0; j < 4; j++) {
              const y = Y(f) + 5 + j * 8;
              ctx.strokeStyle = 'rgba(25,16,8,0.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(X(c) - 1, y + 1); ctx.lineTo(X(c) + W + 1, y + 1); ctx.stroke();
              ctx.strokeStyle = 'rgba(150,115,80,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(c) - 1, y - 1.4); ctx.lineTo(X(c) + W + 1, y - 1.4); ctx.stroke();
            }
            if (azar(k, 441) > 0.55) { ctx.fillStyle = 'rgba(120,150,170,0.45)'; ctx.beginPath(); ctx.ellipse(X(c) + W * azar(k, 442), Y(f) + H * 0.6, 6, 1.6, 0, 0, Math.PI * 2); ctx.fill(); }   // charquito
          });
        });
        break;
      }
      case 'asfalto': {   // ruta: asfalto con grietas y manchas, bordes blancos y líneas de carril
        rellenar(zona(tipo, 0, 2), col);
        recortar(zona(tipo, 0, 2), () => {
          celdas(tipo, (c, f, k) => {
            for (let j = 0; j < 14; j++) { ctx.fillStyle = j % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(X(c) + azar(k * 14 + j, 451) * W, Y(f) + azar(k * 14 + j, 452) * H, 1.2, 1); }
            if (azar(k, 453) > 0.7) { ctx.strokeStyle = 'rgba(15,15,15,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(X(c) + 8, Y(f) + 6); ctx.lineTo(X(c) + 16, Y(f) + 14); ctx.lineTo(X(c) + 13, Y(f) + 24); ctx.moveTo(X(c) + 16, Y(f) + 14); ctx.lineTo(X(c) + 26, Y(f) + 16); ctx.stroke(); }
            if (azar(k, 454) > 0.85) { ctx.fillStyle = 'rgba(10,10,12,0.35)'; ctx.beginPath(); ctx.ellipse(X(c) + 22, Y(f) + 20, 7, 3, 0.2, 0, Math.PI * 2); ctx.fill(); }   // mancha de aceite
            if (g.terrenoEn(c, f - 1) === tipo && c % 2 === 0) { ctx.fillStyle = 'rgba(235,225,170,0.75)'; ctx.fillRect(X(c) + 6, Y(f) - 1, 22, 2); }   // carril
          });
        });
        bordes(tipo, (c, f, dc, df) => { if (df) { ctx.fillStyle = 'rgba(240,240,235,0.8)'; ctx.fillRect(X(c), df < 0 ? Y(f) + 2 : Y(f) + H - 3.4, W, 1.4); } });
        break;
      }
      case 'hielo': {   // lago congelado: orilla de nieve, hielo con reflejos y grietas
        rellenar(zona(tipo, 3, 14), 'rgba(255,255,255,0.9)'); rellenar(zona(tipo, 0, 12), col);
        recortar(zona(tipo, 0, 12), () => {
          const g2 = ctx.createLinearGradient(0, B.arriba, 0, B.arriba + g.filas * H); g2.addColorStop(0, 'rgba(255,255,255,0.25)'); g2.addColorStop(1, 'rgba(60,120,160,0.2)');
          ctx.fillStyle = g2; ctx.fillRect(0, 0, ANCHO, ALTO);
          celdas(tipo, (c, f, k) => {
            ctx.strokeStyle = 'rgba(70,120,150,0.4)'; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(X(c) + azar(k, 461) * W, Y(f)); ctx.lineTo(X(c) + W * 0.5, Y(f) + H * 0.5); ctx.lineTo(X(c) + azar(k, 462) * W, Y(f) + H); ctx.moveTo(X(c) + W * 0.5, Y(f) + H * 0.5); ctx.lineTo(X(c) + W, Y(f) + azar(k, 463) * H); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.save(); ctx.translate(X(c) + W * 0.3, Y(f) + H * 0.3); ctx.rotate(-0.5); ctx.fillRect(-6, -0.8, 12, 1.6); ctx.fillRect(-2, 2.4, 6, 1); ctx.restore();
          });
        });
        break;
      }
      case 'agua': {   // agua: orilla (barro, pasto o arena), profundidad hacia el medio, ondas y, en la granja, camalotes
        const orilla = N.base === 'arena' ? '#d9c08a' : N.base === 'nieve' ? '#e8eef2' : '#5a4a30';
        rellenar(zona(tipo, 3.4, 14), orilla); rellenar(zona(tipo, 0.6, 11), ajustarColor(col, 0.12));
        recortar(zona(tipo, 0, 11), () => {
          const g2 = ctx.createLinearGradient(0, B.arriba, 0, B.arriba + g.filas * H); g2.addColorStop(0, '#3c86a8'); g2.addColorStop(1, '#22566f');
          ctx.fillStyle = g2; ctx.fillRect(0, 0, ANCHO, ALTO);
          bordes(tipo, (c, f, dc, df) => {   // agua clara contra la orilla
            const x = dc > 0 ? X(c) + W - 5 : X(c), y = df > 0 ? Y(f) + H - 5 : Y(f);
            ctx.fillStyle = 'rgba(140,200,220,0.35)'; ctx.fillRect(dc ? x : X(c), df ? y : Y(f), dc ? 5 : W, df ? 5 : H);
          });
          celdas(tipo, (c, f, k) => {
            if (N.id === 'granja' && azar(k, 471) > 0.4) { ctx.fillStyle = '#4f7d33'; ctx.beginPath(); ctx.ellipse(X(c) + 10 + azar(k, 472) * 20, Y(f) + 8 + azar(k, 473) * 18, 4, 2.2, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(X(c) + 10 + azar(k, 472) * 20, Y(f) + 8 + azar(k, 473) * 18); ctx.fill(); }
          });
        });
        bordes(tipo, (c, f, dc, df) => {   // barranca: la pared de la orilla de enfrente, que se ve desde la cámara alta
          if (df >= 0) return;
          const gb = ctx.createLinearGradient(0, Y(f), 0, Y(f) + 6); gb.addColorStop(0, N.base === 'arena' ? '#a9844f' : '#4a3a24'); gb.addColorStop(1, 'rgba(30,50,60,0)');
          ctx.fillStyle = gb; ctx.fillRect(X(c) - (g.terrenoEn(c - 1, f) === tipo ? 0.6 : -2), Y(f), W + (g.terrenoEn(c + 1, f) === tipo ? 1.2 : -4), 6);
        });
        bordes(tipo, (c, f, dc, df) => {   // juncos en las orillas del río y del estanque
          if (N.base === 'arena' || N.base === 'nieve') return;
          const k = f * 64 + c; if (azar(k + dc * 3 + df * 5, 481) > 0.5) return;
          const x = dc < 0 ? X(c) - 1 : dc > 0 ? X(c) + W + 1 : X(c) + W * azar(k, 482), y = df < 0 ? Y(f) : df > 0 ? Y(f) + H : Y(f) + H * azar(k, 483);
          ctx.strokeStyle = '#3d5a24'; ctx.lineWidth = 0.8; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x + j * 1.2 - 2, y + 2); ctx.lineTo(x + j * 1.6 - 3, y - 6 - j); ctx.stroke(); }
          ctx.fillStyle = '#6b4a24'; ctx.fillRect(x - 2.4, y - 7, 1.2, 3);
        });
        break;
      }
      case 'madera': {   // puente de tablones con barandas
        celdas(tipo, (c, f) => {
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X(c) - 4, Y(f) + 5, W + 8, H - 6);
          for (let j = 0; j < 9; j++) { ctx.fillStyle = j % 2 ? '#8a6238' : '#7a5530'; ctx.fillRect(X(c) - 4 + j * (W + 8) / 9, Y(f) + 3, (W + 8) / 9 - 0.6, H - 6); }
          for (const y of [Y(f) + 3, Y(f) + H - 4]) { ctx.fillStyle = '#5a3c1e'; ctx.fillRect(X(c) - 5, y - 1.4, W + 10, 2); for (const x of [X(c) - 4, X(c) + W / 2, X(c) + W + 3]) ctx.fillRect(x - 1, y - 5, 2, 5); }
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
PaisajeBastion.terrenoAnimado = function (ctx, g, ms) {
  if (Lienzo.liviano) return;
  const B = BASTION, [W, H] = B.celda;
  for (let f = 0; f < g.filas; f++) for (let c = 0; c < g.cols; c++) {
    const tipo = g.terrenoEn(c, f), x = B.baseX + c * W, y = B.arriba + f * H, k = f * 64 + c;
    if (tipo === 'agua') {
      ctx.strokeStyle = 'rgba(210,240,255,0.32)'; ctx.lineWidth = 0.8;
      for (let j = 0; j < 2; j++) { const yy = y + 9 + j * 13, dx = Math.sin(ms / 700 + k * 1.7 + j) * 4; ctx.beginPath(); ctx.moveTo(x + 8 + dx, yy); ctx.quadraticCurveTo(x + W / 2 + dx, yy - 2, x + W - 10 + dx, yy); ctx.stroke(); }
      const b = (ms / 900 + azar(k, 491) * 6) % 6; if (b < 1) { ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - b)})`; ctx.fillRect(x + azar(k, 492) * W, y + azar(k, 493) * H, 2, 1); }
    } else if (tipo === 'hielo') {
      const b = (ms / 1300 + azar(k, 494) * 8) % 8; if (b < 1) { ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - b)})`; const px = x + azar(k, 495) * W, py = y + azar(k, 496) * H; ctx.fillRect(px - 2, py - 0.3, 4, 0.6); ctx.fillRect(px - 0.3, py - 2, 0.6, 4); }
    }
  }
};
// Lo que se mueve en cada fondo (por cuadro, encima de la capa guardada): nubes, aspas, humo, luciérnagas, buitres, calor, nubes bajas y nieve
// Capa guardada (fondo quieto + suelo + terreno), lo que se mueve del fondo y los brillos del terreno
const capaSueloBastion = { lienzo: null, clave: '' };
Juego.prototype.dibujarFondoBastion = function (ctx) {
  const N = this.nivelBastion, e = ctx.getTransform().a || 1;
  const clave = N.id + ':' + this.cols + 'x' + this.filas + ':' + e + ':' + ANCHO;
  if (capaSueloBastion.clave !== clave) {
    const L = capaSueloBastion.lienzo || document.createElement('canvas');
    L.width = Math.ceil(ANCHO * e); L.height = Math.ceil(ALTO * e);
    const c2 = L.getContext('2d'); c2.setTransform(e, 0, 0, e, 0, 0); c2.clearRect(0, 0, ANCHO, ALTO);
    const liv = Lienzo.liviano; Lienzo.liviano = false;   // se pinta una vez por nivel: con todo el detalle
    try { PaisajeBastion.suelo(c2, N); PaisajeBastion.fondo(c2, N, 0, true); PaisajeBastion.terreno(c2, this, 0); } finally { Lienzo.liviano = liv; }
    capaSueloBastion.lienzo = L; capaSueloBastion.clave = clave;
  }
  ctx.drawImage(capaSueloBastion.lienzo, 0, 0, ANCHO, ALTO);
  PaisajeBastion.fondoVivo(ctx, N, this.ahora);
  PaisajeBastion.terrenoAnimado(ctx, this, this.ahora);
};

function aspasMolino(ctx, x, y, ms) { ctx.save(); ctx.translate(x, y); ctx.rotate(ms / 700); ctx.fillStyle = '#9a9a9a'; for (let k = 0; k < 12; k++) { ctx.rotate(Math.PI / 6); ctx.fillRect(-1, 2, 2, 12); } ctx.restore(); }
/* ---------- Borde del mapa en 3/4 (arriba del campo): lo que hay más allá, visto desde la misma cámara alta ----------
 * Sin cielo: desde arriba no se ve. Cada escenario pone su paisaje en la franja de arriba (de y 0 a ~150). */
PaisajeBastion.fondo = function (ctx, N, ms, quieto = false) {
  const B = BASTION, A = ANCHO, h = B.arriba - 26;   // h: dónde termina el borde y empieza el campo
  const arbolito = (x, y, r, col) => { sombraPiso(ctx, r * 1.1, r * 0.45, 0.3, x + r * 0.6, y); pb(ctx, rr(x - 1.2, y - r * 0.9, 2.4, r * 0.9, 0.6), '#5e4129', { sombra: 0.3, linea: 0.3 }); for (const [dx, dy, f] of [[-0.45, -1.1, 0.7], [0.45, -1.15, 0.7], [0, -1.6, 0.75]]) pb(ctx, c => c.arc(x + dx * r, y + dy * r, r * f, 0, Math.PI * 2), col, { sombra: r * 0.12, brillo: 0.2, linea: 0.4 }); };
  const pinito = (x, y, a, col, nieve) => { sombraPiso(ctx, a * 0.4, a * 0.16, 0.3, x + a * 0.25, y); for (let k = 0; k < 3; k++) { const yy = y - k * a * 0.28, w = a * (0.38 - k * 0.09); pb(ctx, c => { c.moveTo(x, yy - a * 0.42); c.lineTo(x + w, yy); c.lineTo(x - w, yy); c.closePath(); }, k % 2 ? col : ajustarColor(col, 0.08), { sombra: 0.6, brillo: 0.2, linea: 0.4 }); if (nieve) pb(ctx, c => { c.moveTo(x, yy - a * 0.42); c.lineTo(x + w * 0.5, yy - a * 0.2); c.lineTo(x - w * 0.5, yy - a * 0.2); c.closePath(); }, '#eef3f7', { sombra: 0.2, brillo: 0.3, linea: 0.3 }); } };
  // Edificio en 3/4: fachada (frente) y azotea vista desde arriba
  const edificio = (x, w, alto, prof, col, sal) => {
    const yF = h + 4;
    sombraCaja(ctx, x, x + w, yF, prof, alto, 0.3);
    pb(ctx, rr(x, yF - alto, w, alto, 0.4), col, { sombra: 0.6, brillo: 0.15 });
    for (let p = 0; p < Math.floor(alto / 11); p++) for (let v = 0; v < Math.floor(w / 9); v++) {
      const k = sal * 97 + p * 13 + v, prende = azar(k, 501);
      ctx.fillStyle = prende > 0.86 ? 'rgba(255,190,90,0.85)' : prende > 0.8 ? 'rgba(255,120,50,0.7)' : prende > 0.55 ? 'rgba(20,18,22,0.85)' : 'rgba(60,66,76,0.85)';
      ctx.fillRect(x + 3 + v * 9, yF - alto + 4 + p * 11, 5, 6);
    }
    pb(ctx, rr(x, yF - alto - prof, w, prof, 0.4), ajustarColor(col, 0.14), { sombra: 0.4, brillo: 0.3 });   // azotea
    if (azar(sal, 502) > 0.4) caja34(ctx, x + w * 0.2, x + w * 0.2 + 8, yF - alto - prof * 0.3, 5, 4, '#8b8f94', '#a9adb2');   // máquina de aire
    if (azar(sal, 503) > 0.5) { const tx = x + w * 0.7, ty = yF - alto - prof * 0.5; pb(ctx, rr(tx - 3.5, ty - 8, 7, 8, 1), '#6b5a48', { sombra: 0.3, linea: 0.35 }); pb(ctx, c => c.ellipse(tx, ty - 8, 3.5, 1.5, 0, 0, Math.PI * 2), '#7d6a56', { sombra: 0.2, linea: 0.35 }); }   // tanque de agua
    if (azar(sal, 504) > 0.6) { ctx.fillStyle = 'rgba(15,12,10,0.55)'; ctx.beginPath(); ctx.ellipse(x + w * 0.45, yF - alto - prof * 0.55, w * 0.18, prof * 0.2, 0, 0, Math.PI * 2); ctx.fill(); }   // agujero quemado
  };
  switch (N.fondo) {
    case 'granja': {
      // Parcelas sembradas con surcos y caminos de tierra entre medio
      const parcela = (x, y, w, alto, c1, c2) => { ctx.fillStyle = c1; ctx.fillRect(x, y, w, alto); ctx.strokeStyle = c2; ctx.lineWidth = 1.6; for (let yy = y + 3; yy < y + alto; yy += 4.4) { ctx.beginPath(); ctx.moveTo(x + 2, yy); ctx.lineTo(x + w - 2, yy); ctx.stroke(); } ctx.strokeStyle = 'rgba(80,60,30,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, alto); };
      ctx.fillStyle = '#7d6a48'; ctx.fillRect(-20, -20, A + 40, h - 30);
      parcela(140, -10, 230, 92, '#c9b35a', '#a8923e'); parcela(390, -10, 170, 70, '#8fae4c', '#6f8f36'); parcela(780, -10, 200, 110, '#6b4f30', '#4f3a22');
      parcela(-20, -10, 140, 60, '#a7c062', '#89a24a');
      ctx.fillStyle = '#8a7350'; ctx.fillRect(580, -20, 26, h + 10);   // camino que baja al campo
      // Casa, granero con techo a dos aguas y silo, en 3/4
      const casa = (x, yF, w, prof, alto, pared, techo) => { sombraCaja(ctx, x, x + w, yF, prof, alto + 10, 0.3); pb(ctx, rr(x, yF - alto, w, alto, 0.4), pared, { sombra: 0.6 }); pb(ctx, c => { c.moveTo(x - 3, yF - alto + 1); c.lineTo(x + w + 3, yF - alto + 1); c.lineTo(x + w + 1, yF - alto - prof * 0.6 - 8); c.lineTo(x - 1, yF - alto - prof * 0.6 - 8); c.closePath(); }, techo, { sombra: 0.6, brillo: 0.3 }); pb(ctx, c => { c.moveTo(x - 1, yF - alto - prof * 0.6 - 8); c.lineTo(x + w + 1, yF - alto - prof * 0.6 - 8); c.lineTo(x + w + 3, yF - alto - prof - 6); c.lineTo(x - 3, yF - alto - prof - 6); c.closePath(); }, ajustarColor(techo, 0.18), { sombra: 0.3, brillo: 0.35, linea: 0.4 }); };
      casa(430, h - 6, 60, 34, 22, '#9a2f22', '#5e2a22');
      ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 1.2; ctx.strokeRect(452, h - 22, 16, 16); ctx.beginPath(); ctx.moveTo(452, h - 22); ctx.lineTo(468, h - 6); ctx.moveTo(468, h - 22); ctx.lineTo(452, h - 6); ctx.stroke();
      sombraPiso(ctx, 14, 5, 0.3, 516, h - 6); pb(ctx, rr(500, h - 50, 18, 44, 1), '#c3c6ca', { sombra: 0.7, brillo: 0.3 }); pb(ctx, c => c.ellipse(509, h - 50, 9, 4, 0, 0, Math.PI * 2), '#d9dce0', { sombra: 0.3, brillo: 0.4 });
      casa(250, h - 10, 46, 26, 16, '#e8dcc0', '#6b4a36'); pb(ctx, rr(262, h - 22, 8, 8, 0.6), '#ffd98a', { sombra: 0.2, linea: 0.4, brillo: false });
      // Molino (las aspas giran por cuadro)
      const mx = A * 0.3; ctx.strokeStyle = '#7d7d7d'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(mx - 7, h - 4); ctx.lineTo(mx, h - 62); ctx.lineTo(mx + 7, h - 4); ctx.moveTo(mx - 5, h - 22); ctx.lineTo(mx + 5, h - 22); ctx.stroke();
      ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.moveTo(mx + 2, h - 63); ctx.lineTo(mx + 14, h - 66); ctx.lineTo(mx + 14, h - 59); ctx.fill();
      if (!quieto) aspasMolino(ctx, mx, h - 62, ms);
      for (const [x, y, r] of [[60, 40, 12], [110, 96, 10], [700, 70, 13], [900, 130, 11], [380, 110, 9], [650, 120, 10]]) arbolito(x, y, r, '#3f6d2b');
      for (const [x, y] of [[200, 60], [230, 64], [300, 30]]) { pb(ctx, rr(x - 6, y - 8, 12, 8, 4), '#c8a14c', { sombra: 0.5, linea: 0.35 }); }   // fardos
      // Alambrado en el límite con el campo
      for (let x = -10; x < A + 10; x += 20) { linea(ctx, '#6a5438', 1.4, [[x, h + 2], [x, h - 9]]); }
      linea(ctx, '#8a8f94', 0.6, [[-10, h - 7], [A + 10, h - 7]]); linea(ctx, '#8a8f94', 0.6, [[-10, h - 3], [A + 10, h - 3]]);
      break;
    }
    case 'ciudad': {
      ctx.fillStyle = '#3a3438'; ctx.fillRect(-20, -20, A + 40, h + 30);
      let x = -20, k = 0;
      while (x < A + 20) { const w = 46 + azar(k, 511) * 40, alto = 30 + azar(k, 512) * 60, col = ['#5b5452', '#4d4a50', '#6a5a4c', '#57544a'][k % 4]; edificio(x, w, alto, 60, col, k); x += w + 4 + azar(k, 513) * 10; k++; }
      // Vereda y cordón al pie de los edificios
      ctx.fillStyle = '#7a7670'; ctx.fillRect(-20, h + 4, A + 40, 8); ctx.fillStyle = '#5a5650'; ctx.fillRect(-20, h + 11, A + 40, 2);
      // Resplandor de los incendios en las azoteas (el humo sube por cuadro)
      for (const x0 of [A * 0.18, A * 0.55, A * 0.88]) { const g = ctx.createRadialGradient(x0, h - 70, 2, x0, h - 70, 40); g.addColorStop(0, 'rgba(255,140,50,0.55)'); g.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = g; ctx.fillRect(x0 - 40, h - 110, 80, 80); }
      // Autos abandonados en la calle, al pie de los edificios
      for (const [x, k] of [[A * 0.22, 1], [A * 0.63, 2]]) { ctx.save(); ctx.translate(x, h + 18); ctx.scale(0.8, 0.8); PaisajeBastion.obstaculoCuerpo(ctx, 'auto', k); ctx.restore(); }
      break;
    }
    case 'bosque': {
      ctx.fillStyle = '#1b2a1f'; ctx.fillRect(-20, -20, A + 40, h + 30);
      const lista = [];
      for (let k = 0; k < 140; k++) lista.push([azar(k, 521) * (A + 40) - 20, -10 + azar(k, 522) * (h + 4), 26 + azar(k, 523) * 16, k]);
      lista.sort((p, q) => p[1] - q[1]);
      for (const [x, y, a, k] of lista) pinito(x, y, a, k % 3 ? '#1f3b29' : '#26472f', false);
      // Troncos caídos y tocones en el borde
      for (const [x, y] of [[160, h + 2], [520, h], [820, h + 3]]) { pb(ctx, rr(x - 14, y - 5, 28, 5, 2.4), '#5a3c22', { sombra: 0.4, linea: 0.35 }); pb(ctx, c => c.ellipse(x + 14, y - 2.5, 1.6, 2.5, 0, 0, Math.PI * 2), '#8a6a44', { sombra: 0.2, linea: 0.3 }); }
      ctx.fillStyle = 'rgba(8,14,30,0.35)'; ctx.fillRect(-20, -20, A + 40, h + 30);   // noche
      const niebla = ctx.createLinearGradient(0, h - 30, 0, h + 10); niebla.addColorStop(0, 'rgba(140,160,190,0)'); niebla.addColorStop(1, 'rgba(140,160,190,0.22)'); ctx.fillStyle = niebla; ctx.fillRect(-20, h - 30, A + 40, 40);
      break;
    }
    case 'desierto': {
      // Meseta: techo plano rojizo arriba, acantilado con estratos y el talud de piedras al pie; un cañón por donde baja el camino
      const techo = '#c8774e', pared = '#a8563a', cx0 = 600, cx1 = 690, base = h - 4, alto = 46;
      ctx.fillStyle = techo; ctx.fillRect(-20, -20, A + 40, base - alto + 20);
      for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 2 ? 'rgba(90,40,20,0.25)' : 'rgba(255,220,180,0.18)'; ctx.beginPath(); ctx.ellipse(azar(k, 531) * A, azar(k, 532) * (base - alto), 6 + azar(k, 533) * 14, 2 + azar(k, 534) * 3, 0, 0, Math.PI * 2); ctx.fill(); }
      for (const [xa, xb] of [[-20, cx0], [cx1, A + 20]]) {
        ctx.fillStyle = pared; ctx.beginPath(); ctx.moveTo(xa, base - alto); ctx.lineTo(xb, base - alto); ctx.lineTo(xb + (xb === cx0 ? -14 : 14), base); ctx.lineTo(xa, base); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.clip();
        for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,200,160,0.18)' : 'rgba(80,30,15,0.2)'; ctx.fillRect(xa, base - alto + k * 8, xb - xa + 20, 4); }
        for (let k = 0; k < 20; k++) linea(ctx, 'rgba(70,25,10,0.35)', 0.8, [[xa + azar(k, 535) * (xb - xa), base - alto], [xa + azar(k, 535) * (xb - xa) + 4, base]]);
        ctx.restore();
        linea(ctx, 'rgba(255,220,190,0.4)', 1.2, [[xa, base - alto], [xb, base - alto]]);
      }
      ctx.fillStyle = '#d9b47a'; ctx.beginPath(); ctx.moveTo(cx0 - 14, base); ctx.lineTo(cx0, base - alto); ctx.lineTo(cx1, base - alto); ctx.lineTo(cx1 + 14, base); ctx.closePath(); ctx.fill();   // el cañón
      for (let k = 0; k < 40; k++) { const x = azar(k, 536) * A, r = 2 + azar(k, 537) * 4; if (x > cx0 - 16 && x < cx1 + 16) continue; pb(ctx, c => c.ellipse(x, base + 2 - azar(k, 538) * 4, r * 1.3, r, 0, 0, Math.PI * 2), '#9a6a4a', { sombra: 0.4, linea: 0.35 }); }   // talud
      for (const [x, y] of [[120, 40], [330, 80], [820, 30], [470, 20]]) { pb(ctx, rr(x - 2.4, y - 18, 4.8, 18, 2.4), '#4d8a3a', { sombra: 0.5, linea: 0.4 }); pb(ctx, rr(x + 2, y - 13, 5, 3, 1.4), '#4a8236', { sombra: 0.4, linea: 0.35 }); sombraPiso(ctx, 6, 2.4, 0.3, x + 6, y); }
      break;
    }
    case 'montana': {
      // Meseta nevada arriba, paredón de roca con vetas de nieve y pinos al pie
      const base = h - 2, alto = 50;
      ctx.fillStyle = '#e9eff4'; ctx.fillRect(-20, -20, A + 40, base - alto + 20);
      for (let k = 0; k < 40; k++) { ctx.fillStyle = 'rgba(150,175,200,0.3)'; ctx.beginPath(); ctx.ellipse(azar(k, 541) * A, azar(k, 542) * (base - alto), 18 + azar(k, 543) * 26, 4, 0, 0, Math.PI * 2); ctx.fill(); }
      for (let k = 0; k < 10; k++) { const x = azar(k, 544) * A, y = 10 + azar(k, 545) * (base - alto - 20); pb(ctx, c => { c.moveTo(x - 8, y); c.lineTo(x - 4, y - 7); c.lineTo(x + 5, y - 6); c.lineTo(x + 9, y); c.closePath(); }, '#8a8f96', { sombra: 0.5, linea: 0.35 }); }   // rocas asomando
      ctx.fillStyle = '#6f757d'; ctx.beginPath(); ctx.moveTo(-20, base - alto); for (let x = -20; x <= A + 20; x += 30) ctx.lineTo(x, base - alto + Math.sin(x * 0.05) * 3); ctx.lineTo(A + 20, base); ctx.lineTo(-20, base); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 26; k++) { const x = azar(k, 546) * A; ctx.fillStyle = 'rgba(240,245,250,0.75)'; ctx.beginPath(); ctx.moveTo(x, base - alto); ctx.lineTo(x + 6 + azar(k, 547) * 8, base - alto); ctx.lineTo(x + 3, base - alto + 10 + azar(k, 548) * 26); ctx.closePath(); ctx.fill(); }
      for (let k = 0; k < 30; k++) linea(ctx, 'rgba(40,44,50,0.35)', 0.8, [[azar(k, 549) * A, base - alto + 4], [azar(k, 549) * A + 6, base - 4]]);
      for (let k = 0; k < 26; k++) pinito(azar(k, 551) * (A + 20) - 10, base + 4 - azar(k, 552) * 6, 24 + azar(k, 553) * 10, '#2b4a38', true);
      for (let k = 0; k < 10; k++) pinito(azar(k, 554) * A, 20 + azar(k, 555) * (base - alto - 30), 20, '#2b4a38', true);
      break;
    }
  }
  // Transición: una franja de sombra suave del borde sobre el campo
  const g = ctx.createLinearGradient(0, h - 4, 0, h + 18); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-20, h - 4, A + 40, 22);
};
// Lo que se mueve en cada escenario, por cuadro: sombras de nubes, aspas, humo, luciérnagas, buitres y su sombra, calor, nieve
PaisajeBastion.fondoVivo = function (ctx, N, ms) {
  const A = ANCHO, h = BASTION.arriba - 26;
  if (N.fondo === 'granja') aspasMolino(ctx, A * 0.3, h - 62, ms);
  if (Lienzo.liviano) return;
  switch (N.fondo) {
    case 'granja': case 'desierto':
      for (let k = 0; k < 4; k++) { const x = (k * 300 + ms * 0.012) % (A + 400) - 200, y = 60 + k * 110; ctx.fillStyle = 'rgba(20,30,40,0.08)'; ctx.beginPath(); ctx.ellipse(x, y, 110, 46, 0.2, 0, Math.PI * 2); ctx.fill(); }   // sombras de nubes
      if (N.fondo === 'desierto') for (let k = 0; k < 3; k++) {
        const a = ms / 2500 + k * 2.1, x = A * 0.6 + Math.cos(a) * 60, y = 60 + Math.sin(a) * 30 + k * 10, b = Math.sin(ms / 200 + k) * 2;
        ctx.fillStyle = 'rgba(40,20,10,0.18)'; ctx.beginPath(); ctx.ellipse(x + 20, y + 40, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 8, y - b); ctx.quadraticCurveTo(x - 3, y - 2, x, y); ctx.quadraticCurveTo(x + 3, y - 2, x + 8, y - b); ctx.stroke();
      }
      break;
    case 'ciudad':
      for (const [x0, sal] of [[A * 0.18, 1], [A * 0.55, 2], [A * 0.88, 3]]) for (let k = 0; k < 9; k++) { const t = ((ms / 5000 + k / 9 + sal * 0.13) % 1), r = 8 + t * 26; ctx.fillStyle = `rgba(40,32,36,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(x0 + t * 50 + Math.sin(t * 6 + sal) * 6, h - 70 - t * 100, r, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'bosque':
      for (let k = 0; k < 22; k++) { const x = (azar(k, 121) * A + ms * 0.01 * (k % 2 ? 1 : -1) + A * 4) % A, y = h - 10 - azar(k, 122) * 120 + Math.sin(ms / 500 + k) * 3, b = 0.5 + 0.5 * Math.sin(ms / 300 + k * 2); ctx.fillStyle = `rgba(220,255,140,${0.7 * b})`; ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'montana':
      for (let k = 0; k < 90; k++) { const y = (azar(k, 61) * ALTO + ms * 0.03 * (0.5 + azar(k, 62))) % ALTO, x = (azar(k, 63) * A + Math.sin(ms / 700 + k) * 8 + A) % A; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x, y, 0.8 + azar(k, 64), 0, Math.PI * 2); ctx.fill(); }
      break;
  }
};
