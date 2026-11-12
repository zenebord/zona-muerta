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
      conSprite(ctx, 'sc' + cuadro, [-11, -42, 26, 3], g => DibujoBastion.soldadoCuerpo(g, { caminando: true, fase: (cuadro + 0.5) / 8 * 2 * Math.PI }, 0));
      return;
    }
    const ang = cuant(s.apunta, 0.04);
    conSprite(ctx, 'sa' + ang.toFixed(2), [-11, -42, 26, 3], g => DibujoBastion.soldadoCuerpo(g, { apunta: ang }, 0));
    if (s.fuego > 0) fogonazoB(ctx, 0.8 + 20.6 * Math.cos(ang) + 0.2 * Math.sin(ang), -23.6 + 20.6 * Math.sin(ang) - 0.2 * Math.cos(ang), s.fuego, 0.7, ang);
  },
  torreta(ctx, u, t) {
    const ang = cuant(u.apunta, 0.04), roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.4;
    conSprite(ctx, 't' + ang.toFixed(2) + (roto ? 'r' : ''), [-25, -32, 34, 4], g => DibujoBastion.torretaCuerpo(g, { apunta: ang, vida: roto ? 0 : 1, vidaMax: 1 }, 0));
    fogonazoB(ctx, Math.cos(ang) * 28.8, -15.5 + Math.sin(ang) * 28.8, u.fuego || 0, 1.1, ang);
  },
  bunker(ctx, u, t) {
    const d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), nivel = d > 0.55 ? 2 : d > 0.25 ? 1 : 0, n = Math.min(u.adentro || 0, 4);
    conSprite(ctx, 'b' + n + 'd' + nivel, [-29, -47, 30, 4], g => DibujoBastion.bunkerCuerpo(g, { adentro: n, vida: [1, 0.6, 0.3][nivel], vidaMax: 1 }, 0));
    if (u.fuegoK) for (let k = 0; k < n; k++) if (u.fuegoK[k] > 0) fogonazoB(ctx, -7.6 + k * 7.4 + 6.6, -15.6, u.fuegoK[k], 0.55);
  },
  tanque(ctx, u, t) {
    const ang = cuant(u.apunta, 0.04), r = Math.round((u.retroceso || 0) * 4) / 4, d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.35;
    const cuadro = u.enCamino ? Math.floor((t || 0) / 60) % 4 : 0;
    conSprite(ctx, 'k' + ang.toFixed(2) + 'r' + r + 'g' + cuadro + (d ? 'd' : ''), [-32, -45, 52, 4], g => DibujoBastion.tanqueCuerpo(g, { apunta: ang, retroceso: r, enCamino: !!u.enCamino, vida: d ? 0.4 : 1, vidaMax: 1 }, cuadro * 60));
    const largo = 34 - r * 4, bx = 14.6 - r * 1.5 + Math.cos(ang) * largo, by = -22.2 + Math.sin(ang) * largo;
    fogonazoB(ctx, bx, by, u.fuego || 0, 1.6, ang);
    if (!Lienzo.liviano && (u.fuego || 0) > 0.2) for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(200,195,180,${0.25 * u.fuego})`; ctx.beginPath(); ctx.arc(bx - 4 - k * 4, by - 2 - k * 2.4, 3 + k * 1.6, 0, Math.PI * 2); ctx.fill(); }
    if (u.enCamino && !Lienzo.liviano) for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgba(160,140,100,0.22)'; ctx.beginPath(); ctx.arc(-28 - k * 4, -2 - k * 1.5, 2.4 + k, 0, Math.PI * 2); ctx.fill(); }   // polvo
  },
  muro(ctx, u, t) {
    const d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), nivel = d > 0.6 ? 3 : d > 0.45 ? 2 : d > 0.3 ? 1 : 0;
    conSprite(ctx, 'm' + nivel, [-25, -27, 25, 4], g => DibujoBastion.muroCuerpo(g, { vida: 1 - [0, 0.35, 0.5, 0.7][nivel], vidaMax: 1 }, 0));
  },
  obra(ctx, f, t) {
    conSprite(ctx, 'obra', [-25, -32, 25, 2], g => DibujoBastion.obraCuerpo(g, f, 0));
    if (!Pincel.silueta && Math.sin(t / 60) > 0.4) {   // chispas de soldadura
      for (let k = 0; k < 4; k++) { const a = azar(Math.floor(t / 60) * 4 + k, 51) * Math.PI, d = 2 + azar(Math.floor(t / 60) * 4 + k, 52) * 5; ctx.fillStyle = k % 2 ? '#fff4c0' : '#ffb84a'; ctx.fillRect(2 + Math.cos(a) * d, -18 - Math.sin(a) * d, 1, 1); }
      fogonazoB(ctx, 2, -18, Math.max(0, Math.sin(t / 60)) * 0.5, 0.35);
    }
  },
});

Object.assign(DibujoBastion, {
  /* ---------- Soldado: casco con funda, chaleco, mochila chica y fusil con mira; camina o apunta y dispara ---------- */
  soldadoCuerpo(ctx, s, t) {
    const P = PAL_BASTION, paso = s.caminando ? Math.sin(s.fase || 0) : 0, sube = s.caminando ? Math.abs(Math.cos(s.fase || 0)) * 0.8 : 0;
    sombraPiso(ctx, 8.5, 2.2);
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

  /* ---------- Torreta: ametralladora pesada en trípode, nido de bolsas de arena y el tirador agachado ---------- */
  torretaCuerpo(ctx, u, t) {
    const P = PAL_BASTION, ang = u.apunta || 0, dano = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1);
    sombraPiso(ctx, 23, 5);
    paredBolsas(ctx, -21, -4, 0, 2, 7, 4.2, 3);                                                         // hilera de atrás
    // Tirador agachado: espalda, hombros, casco, las dos manos en las empuñaduras
    pb(ctx, c => { c.moveTo(-14, -6); c.quadraticCurveTo(-15, -16, -10, -18.6); c.lineTo(-6, -18.6); c.quadraticCurveTo(-3.4, -16, -4, -6); c.closePath(); }, P.od);
    pb(ctx, rr(-15, -17.6, 5, 8, 1.6), P.coyote, { sombra: 0.5 });
    pb(ctx, c => c.ellipse(-7.4, -21.8, 3, 3.3, 0, 0, Math.PI * 2), P.piel, { sombra: 0.5, linea: 0.4 });
    pb(ctx, c => { c.moveTo(-11.4, -21.6); c.quadraticCurveTo(-11.6, -27.4, -7, -27.6); c.quadraticCurveTo(-2.6, -27.4, -2.8, -22.6); c.lineTo(-2.2, -22); c.lineTo(-11.8, -21.2); c.closePath(); }, P.odClaro, { sombra: 0.7, brillo: 0.3 });
    // Trípode
    if (!Pincel.silueta) { linea(ctx, P.aceroOsc, 1.3, [[0, -14], [-6, -2]]); linea(ctx, P.aceroOsc, 1.3, [[0, -14], [7, -2]]); linea(ctx, ajustarColor(P.aceroOsc, 0.2), 1.1, [[0, -14], [1, -3]]); }
    // Ametralladora (gira en el pivote): cajón, empuñaduras de pala, camisa perforada, caño y apagallamas; la caja de munición con la cinta
    ctx.save(); ctx.translate(0, -15.5); ctx.rotate(ang);
    pb(ctx, rr(-11, -1.6, 3, 3.6, 0.8), '#2a2b2d', { sombra: 0.3, linea: 0.35 });                        // empuñaduras
    pb(ctx, rr(-8, -3.2, 13, 6.2, 1), '#34373b', { sombra: 0.5, brillo: 0.3 });                           // cajón
    if (!Pincel.silueta) { linea(ctx, '#202224', 0.4, [[-6.4, -1.4], [3.6, -1.4]]); detalle(ctx, '#5f646a', c => c.rect(-5, -3.2, 6, 0.8)); }
    pb(ctx, rr(5, -1.9, 9, 3.6, 0.8), '#3e4145', { sombra: 0.4, brillo: 0.25 });                          // camisa
    if (!Pincel.silueta) for (let k = 0; k < 4; k++) detalle(ctx, '#151617', circulo(6.6 + k * 2, -0.1, 0.55));
    pb(ctx, rr(14, -1, 12.5, 1.9, 0.4), '#232425', { sombra: 0.2, linea: 0.3, brillo: 0.2 });           // caño
    pb(ctx, rr(25.6, -1.6, 3, 3.1, 0.5), '#2a2b2c', { sombra: 0.2, linea: 0.3 });                        // apagallamas
    pb(ctx, rr(-6, 3.2, 6.4, 5, 0.8), P.odOsc, { sombra: 0.4, linea: 0.35 });                            // caja de munición
    if (!Pincel.silueta) { ctx.strokeStyle = '#b08a3c'; ctx.lineWidth = 0.9; ctx.setLineDash([0.8, 0.5]); ctx.beginPath(); ctx.moveTo(-2, 3.2); ctx.quadraticCurveTo(0, 1, 2, 0.6); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    brazoB(ctx, -8.6, -15.4, -9.8 * Math.cos(ang), -15.5 - 9.8 * Math.sin(ang) + 0.6, P.od, 4.6);       // manos en las empuñaduras
    // Nido: pared de bolsas de adelante, más alta, con las rotas si está dañado
    paredBolsas(ctx, -6, 21, 0, 3, 8, 4.6, 7);
    if (dano > 0.4 && !Pincel.silueta) { detalle(ctx, 'rgba(60,45,25,0.55)', elipse(10, -9, 3.2, 1.6)); detalle(ctx, ajustarColor(P.arena, -0.1), elipse(14, -0.4, 5, 1.4)); }
  },

  /* ---------- Búnker: casamata de hormigón con red de camuflaje, tronera con los de adentro y bolsas al pie ---------- */
  bunkerCuerpo(ctx, u, t) {
    const P = PAL_BASTION, dano = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), C = P.concreto;
    sombraPiso(ctx, 27, 6);
    // Cuerpo con el frente en talud, losa del techo y la puerta de chapa de atrás
    pb(ctx, c => { c.moveTo(-23, 0); c.lineTo(-22, -21); c.lineTo(15, -21); c.quadraticCurveTo(20, -20, 23.6, -8); c.lineTo(25, 0); c.closePath(); }, C, { sombra: 1.1, brillo: 0.3 });
    if (!Pincel.silueta) {   // juntas del encofrado
      for (const y of [-14.6, -7.6]) linea(ctx, 'rgba(60,55,45,0.28)', 0.45, [[-22, y], [21, y]]);
      for (const x of [-12, 2]) linea(ctx, 'rgba(60,55,45,0.2)', 0.45, [[x, -21], [x, 0]]);
    }
    pb(ctx, rr(-21, -17.8, 6.4, 15, 0.6), P.acero, { sombra: 0.5, linea: 0.4 });                         // puerta
    if (!Pincel.silueta) for (const y of [-15.8, -5]) detalle(ctx, '#2a2c2f', c => c.rect(-20.2, y, 4.8, 0.6));
    // Tronera: los cascos de los de adentro, sus caños asomando y los fogonazos
    pb(ctx, rr(-11, -18.4, 31, 5, 1.4), '#121314', { sombra: 0.2, linea: 0.4, brillo: false });
    const n = Math.min(u.adentro || 0, 4);
    for (let k = 0; k < n; k++) {
      const x = -7.6 + k * 7.4;
      if (!Pincel.silueta) { ctx.fillStyle = ajustarColor(P.odClaro, -0.2); ctx.beginPath(); ctx.arc(x, -14.2, 2.4, Math.PI, 0); ctx.fill(); linea(ctx, '#0c0c0d', 1, [[x + 1.6, -15.6], [x + 6.2, -15.6]]); }
    }
    pb(ctx, rr(-25, -25.4, 46, 5, 1.8), ajustarColor(C, 0.08), { sombra: 0.6, brillo: 0.4 });            // losa del techo
    // Red de camuflaje sobre el techo, con hojas y los bordes que cuelgan
    if (!Pincel.silueta) {
      const red = c => { c.moveTo(-24, -25); c.quadraticCurveTo(-18, -29.6, -6, -28.6); c.quadraticCurveTo(6, -30, 18, -27.4); c.lineTo(20.6, -24.6); c.lineTo(17, -21.6); c.lineTo(12, -23.4); c.lineTo(4, -21.4); c.lineTo(-4, -23.6); c.lineTo(-12, -21.6); c.lineTo(-19, -23.4); c.lineTo(-24.6, -21.8); c.closePath(); };
      pb(ctx, red, '#4f5a35', { sombra: 0.5, brillo: 0.2 });
      ctx.save(); ctx.beginPath(); red(ctx); ctx.clip();
      for (let k = 0; k < 14; k++) { ctx.fillStyle = ['#6b6a40', '#3d4729', '#7a6a45'][k % 3]; ctx.beginPath(); ctx.ellipse(-22 + azar(k, 41) * 42, -29 + azar(k, 42) * 7, 2.6, 1.4, azar(k, 43) * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,30,20,0.35)'; ctx.lineWidth = 0.3;
      for (let x = -26; x < 24; x += 2.4) { ctx.beginPath(); ctx.moveTo(x, -31); ctx.lineTo(x + 6, -20); ctx.moveTo(x + 6, -31); ctx.lineTo(x, -20); ctx.stroke(); }
      ctx.restore();
      // Antena de la radio
      linea(ctx, '#2a2b2c', 0.7, [[-17, -28], [-19, -44]]); detalle(ctx, '#d84a3a', circulo(-19, -44, 0.8));
    }
    // Daño: grietas, una esquina rota con los hierros
    if (!Pincel.silueta && dano > 0.25) { linea(ctx, '#3e3a33', 0.6, [[6, -21], [8.4, -15], [6.6, -10], [9.6, -4]]); linea(ctx, '#3e3a33', 0.5, [[8.4, -15], [12, -13]]); }
    if (!Pincel.silueta && dano > 0.55) {
      detalle(ctx, ajustarColor(C, -0.35), poli([[15, -21], [21, -17], [18, -15.4], [15.6, -17.6]]));
      linea(ctx, '#6b3a22', 0.6, [[16, -19.6], [19, -21.6]]); linea(ctx, '#6b3a22', 0.6, [[17.4, -18.4], [20.6, -19.4]]);
      linea(ctx, '#3e3a33', 0.6, [[-6, -21], [-8, -13], [-5, -6]]);
    }
    paredBolsas(ctx, -4, 27, 0, 2, 8, 4.4, 11);                                                         // bolsas al pie del frente
  },

  /* ---------- Tanque: casco con faldones, orugas con ruedas, torre con escotilla, ametralladora y cañón largo ---------- */
  tanqueCuerpo(ctx, u, t) {
    const P = PAL_BASTION, r = u.retroceso || 0, ang = u.apunta || 0, dano = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1);
    const giro = (u.enCamino ? (t || 0) / 90 : 0), V = '#5f6a42';
    sombraPiso(ctx, 30, 5.6);
    // Oruga: banda con eslabones, rueda motriz atrás, tensora adelante y seis ruedas de camino
    const banda = c => { c.moveTo(-23, -10); c.lineTo(21, -10); c.quadraticCurveTo(27, -9.4, 26, -4.6); c.quadraticCurveTo(23, 0.4, 18, 0.4); c.lineTo(-19, 0.4); c.quadraticCurveTo(-26, 0.4, -26.6, -4.8); c.quadraticCurveTo(-27, -9.6, -23, -10); };
    pb(ctx, banda, '#2b2b28', { sombra: 0.5, brillo: 0.15 });
    if (!Pincel.silueta) {
      ctx.save(); ctx.beginPath(); banda(ctx); ctx.clip(); ctx.fillStyle = '#18181a';
      const corre = (giro * 3) % 3;
      for (let x = -28 + corre; x < 28; x += 3) { ctx.fillRect(x, -10.2, 1.1, 1.1); ctx.fillRect(x, -0.8, 1.1, 1.3); }
      ctx.restore();
    }
    const rueda = (x, y, rad) => {
      pb(ctx, c => c.arc(x, y, rad, 0, Math.PI * 2), '#3c4030', { sombra: 0.5, linea: 0.4, brillo: 0.2 });
      pb(ctx, c => c.arc(x, y, rad * 0.45, 0, Math.PI * 2), '#6a7052', { sombra: 0.3, linea: 0.3, brillo: 0.3 });
      if (!Pincel.silueta && !Lienzo.liviano) for (let k = 0; k < 4; k++) { const a = giro + k * Math.PI / 2; detalle(ctx, '#23251c', circulo(x + Math.cos(a) * rad * 0.72, y + Math.sin(a) * rad * 0.72, 0.42)); }
    };
    rueda(-22.6, -5, 3.6); rueda(22.4, -5.4, 3.2);
    for (let k = 0; k < 6; k++) rueda(-15.6 + k * 6.3, -3.6, 3.1);
    // Faldón lateral con paneles y bulones
    pb(ctx, c => { c.moveTo(-25.4, -12.6); c.lineTo(23.6, -12.6); c.lineTo(25.4, -9.2); c.lineTo(-24.4, -6.8); c.closePath(); }, V, { sombra: 0.6, brillo: 0.3 });
    if (!Pincel.silueta) for (let k = 0; k < 5; k++) { linea(ctx, 'rgba(30,34,18,0.45)', 0.4, [[-14.6 + k * 9.6, -12.4], [-14.8 + k * 9.6, -7.6]]); detalle(ctx, '#3a4026', circulo(-19.6 + k * 9.6, -11.4, 0.45)); }
    // Casco: placa delantera inclinada y la trasera
    pb(ctx, c => { c.moveTo(-26.6, -12.6); c.lineTo(-25.4, -17.6); c.lineTo(15, -17.6); c.lineTo(27.2, -13.2); c.lineTo(26.4, -12.4); c.closePath(); }, ajustarColor(V, 0.06), { sombra: 0.7, brillo: 0.35 });
    if (!Pincel.silueta) { detalle(ctx, '#ffe9a8', c => c.rect(24.2, -14.4, 1.6, 1.2)); linea(ctx, 'rgba(30,34,18,0.4)', 0.4, [[15, -17.4], [26, -13.4]]); }   // faro
    // Torre (retrocede apenas al disparar): canasto atrás, escotilla, ametralladora, lanzahumos y antena
    ctx.save(); ctx.translate(-r * 1.5, 0);
    pb(ctx, rr(-19.6, -24.4, 6, 5.6, 0.8), '#3d4229', { sombra: 0.4, linea: 0.35 });                     // canasto
    if (!Pincel.silueta) for (let k = 0; k < 3; k++) linea(ctx, 'rgba(20,22,12,0.6)', 0.35, [[-19 + k * 2, -24], [-19 + k * 2, -19]]);
    const torre = c => { c.moveTo(-14.6, -17.6); c.lineTo(-14, -24.2); c.lineTo(-8, -27.8); c.lineTo(9.6, -27.8); c.lineTo(15.4, -23.4); c.lineTo(14.6, -17.6); c.closePath(); };
    pb(ctx, torre, ajustarColor(V, 0.1), { sombra: 0.9, brillo: 0.4 });
    if (!Pincel.silueta) {
      ctx.save(); ctx.beginPath(); torre(ctx); ctx.clip();   // camuflaje de manchas
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(60,50,30,0.35)' : 'rgba(30,38,20,0.35)'; ctx.beginPath(); ctx.ellipse(-10 + k * 7, -22 + (k % 2) * 3, 3.4, 1.8, 0.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      linea(ctx, 'rgba(30,34,18,0.45)', 0.45, [[-13.6, -21.8], [14.6, -21.8]]);
      detalle(ctx, '#e8e2c8', c => c.rect(-9.4, -21, 4.6, 2.2));                                          // número
    }
    pb(ctx, rr(-6.4, -30, 7, 2.6, 1), ajustarColor(V, 0.02), { sombra: 0.4, linea: 0.4 });               // escotilla
    if (!Pincel.silueta) {
      linea(ctx, '#222', 0.9, [[-1, -30.6], [5, -31.2]]); linea(ctx, '#222', 0.6, [[-2, -30], [-1.4, -31.4]]);   // ametralladora de la escotilla
      linea(ctx, '#26281c', 0.6, [[-12.6, -27.6], [-15.4, -42]]);                                         // antena
      for (let k = 0; k < 3; k++) detalle(ctx, '#3a3f26', c => c.rect(9 + k * 1.6, -27.4, 1.2, 2));       // lanzahumos
    }
    // Cañón: mantelete, tubo con evacuador de humos y freno de boca
    ctx.save(); ctx.translate(14.6, -22.2); ctx.rotate(ang);
    pb(ctx, rr(-1.6, -2.8, 5, 5.6, 1.2), ajustarColor(V, -0.05), { sombra: 0.5, linea: 0.4 });
    const largo = 26 - r * 4;
    pb(ctx, rr(3, -1.15, largo, 2.3, 0.5), '#4f5838', { sombra: 0.4, linea: 0.35, brillo: 0.3 });
    pb(ctx, rr(3 + largo * 0.5, -1.8, 4.4, 3.6, 1.2), '#4a5234', { sombra: 0.3, linea: 0.35, brillo: 0.3 });
    pb(ctx, rr(1 + largo, -1.7, 3.2, 3.4, 0.6), '#3a3f2a', { sombra: 0.3, linea: 0.35 });
    ctx.restore();
    ctx.restore();
    // Daño: hollín y una abolladura
    if (!Pincel.silueta && dano > 0.35) { detalle(ctx, 'rgba(20,18,14,0.45)', elipse(4, -15, 6, 2)); detalle(ctx, 'rgba(20,18,14,0.35)', elipse(-6, -24, 4, 1.6)); }
  },

  /* ---------- Muro: dos cestones de malla rellenos de arena con concertina arriba; con el daño se abollan y pierden arena ---------- */
  muroCuerpo(ctx, u, t) {
    const P = PAL_BASTION, dano = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1);
    sombraPiso(ctx, 23, 4.6);
    const cesto = (x, w, alto, roto) => {
      pb(ctx, c => { c.moveTo(x, 0); c.lineTo(x, -alto); c.lineTo(x + w, -alto + (roto ? 2.4 : 0)); c.lineTo(x + w, 0); c.closePath(); }, '#b49d70', { sombra: 0.9, brillo: 0.3 });
      if (Pincel.silueta) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x, -alto - 3, w, alto + 3); ctx.clip();
      ctx.strokeStyle = 'rgba(70,72,74,0.55)'; ctx.lineWidth = 0.35;
      for (let gx = x + 3.2; gx < x + w; gx += 3.2) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + (roto ? 0.6 : 0), -alto); ctx.stroke(); }
      for (let gy = -3.2; gy > -alto; gy -= 3.2) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy + (roto ? 0.8 : 0)); ctx.stroke(); }
      ctx.restore();
      linea(ctx, '#5a5d60', 0.8, [[x + 0.3, 0], [x + 0.3, -alto]]); linea(ctx, '#5a5d60', 0.8, [[x + w - 0.3, 0], [x + w - 0.3, -alto + (roto ? 2.4 : 0)]]);   // parantes
      pb(ctx, c => { c.moveTo(x, -alto); c.quadraticCurveTo(x + w / 2, -alto - 2.6, x + w, -alto + (roto ? 2.4 : 0)); c.closePath(); }, P.arenaOsc, { sombra: 0.3, linea: 0.35, brillo: 0.25 });   // arena que asoma
    };
    cesto(-20, 19.6, 19, dano > 0.6);
    cesto(0.4, 19.6, 19, false);
    // Concertina: rollos de alambre de púas encima
    if (!Pincel.silueta) {
      ctx.strokeStyle = P.alambre; ctx.lineWidth = 0.45;
      const rota = dano > 0.45 ? 8 : 99;
      for (let k = 0; k < 9; k++) { const x = -18 + k * 4.4; if (k === rota) continue; ctx.beginPath(); ctx.ellipse(x, -22, 2.8, 2.2, 0.3, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = '#6e7378'; for (let k = 0; k < 18; k++) { const x = -19 + k * 2.2; ctx.beginPath(); ctx.moveTo(x, -23.6 + (k % 2)); ctx.lineTo(x + 0.8, -22.4 + (k % 2)); ctx.stroke(); }
    }
    // Daño: abolladura, agujero en la malla y arena derramada al pie
    if (!Pincel.silueta && dano > 0.3) { detalle(ctx, 'rgba(50,40,25,0.55)', elipse(8, -9, 3.4, 2.6)); detalle(ctx, P.arenaOsc, elipse(10, -0.2, 6.6, 1.6)); }
    if (!Pincel.silueta && dano > 0.6) { detalle(ctx, 'rgba(50,40,25,0.55)', elipse(-11, -6, 4, 3)); detalle(ctx, P.arenaOsc, elipse(-12, 0, 8, 2.2)); }
  },

  /* ---------- Obra: andamio de caños con tablón de seguridad, materiales al pie y chispas de soldadura ---------- */
  obraCuerpo(ctx, f, t) {
    const P = PAL_BASTION, alto = 28;
    if (!Pincel.silueta) {
      pb(ctx, rr(-21, -4.6, 9, 4.6, 0.8), ajustarColor(P.arena, -0.05), { sombra: 0.4, linea: 0.35 });   // bolsas apiladas
      pb(ctx, rr(13, -6, 8, 6, 0.6), '#7a5a36', { sombra: 0.4, linea: 0.35 });                              // cajón de herramientas
      linea(ctx, 'rgba(0,0,0,0.3)', 0.4, [[13, -3.4], [21, -3.4]]);
    }
    const cano = (pts, w = 1.1) => { if (!Pincel.silueta) { linea(ctx, '#53585e', w + 0.5, pts); linea(ctx, '#a7adb3', w * 0.55, pts); } };
    cano([[-16, 0], [-16, -alto]]); cano([[16, 0], [16, -alto]]); cano([[-16, -alto], [16, -alto]]);
    cano([[-16, -alto / 2], [16, -alto / 2]]); cano([[-16, 0], [16, -alto / 2]], 0.8); cano([[-16, -alto / 2], [16, -alto]], 0.8);
    // Tablón con franjas amarillas y negras a media altura
    if (!Pincel.silueta) {
      ctx.save(); ctx.beginPath(); ctx.rect(-17, -alto / 2 - 1.6, 34, 3); ctx.clip();
      ctx.fillStyle = '#e8b830'; ctx.fillRect(-17, -alto / 2 - 1.6, 34, 3); ctx.fillStyle = '#1e1e1e';
      for (let x = -20; x < 18; x += 4) { ctx.beginPath(); ctx.moveTo(x, -alto / 2 + 1.4); ctx.lineTo(x + 2, -alto / 2 + 1.4); ctx.lineTo(x + 4, -alto / 2 - 1.6); ctx.lineTo(x + 2, -alto / 2 - 1.6); ctx.fill(); }
      ctx.restore();
    }
  },
});

/* ---------- Campamento: base de avanzada con muro de cestones, portón, torre de guardia, carpas, cuartel y taller ---------- */
Juego.prototype.campamentoQuieto = function (ctx) {
  const B = BASTION, P = PAL_BASTION, alto = this.filas * B.celda[1], y0 = B.arriba, x = B.baseX, ms = this.ahora;
  const puertaY = y0 + alto / 2 + 8, abajo = y0 + alto + 20;
  // Piso de tierra apisonada con ripio y huellas de orugas
  const piso = ctx.createLinearGradient(0, y0 - 20, 0, abajo);
  piso.addColorStop(0, '#4d4839'); piso.addColorStop(1, '#5a5442');
  ctx.fillStyle = piso; ctx.fillRect(0, y0 - 20, x - 6, abajo - y0 + 20);
  if (!Pincel.silueta) {
    for (let k = 0; k < 90; k++) { ctx.fillStyle = k % 2 ? 'rgba(30,26,18,0.25)' : 'rgba(170,160,130,0.2)'; ctx.fillRect(azar(k, 201) * (x - 8), y0 - 18 + azar(k, 202) * (abajo - y0 + 16), 1.4, 1); }
    ctx.strokeStyle = 'rgba(30,26,18,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([2, 1.4]);
    for (const dy of [-5, 5]) { ctx.beginPath(); ctx.moveTo(x - 8, puertaY + dy); ctx.quadraticCurveTo(70, puertaY + dy, 50, abajo - 40 + dy); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  // Torre de guardia con reflector
  const tx = 30, ty = y0 + 22;
  if (!Pincel.silueta) for (const [a, b] of [[-11, -7], [11, 7]]) { linea(ctx, '#5a4a32', 2, [[tx + a, ty], [tx + b, ty - 46]]); }
  if (!Pincel.silueta) { linea(ctx, '#4a3c28', 1, [[tx - 10, ty - 6], [tx + 8, ty - 30]]); linea(ctx, '#4a3c28', 1, [[tx + 10, ty - 6], [tx - 8, ty - 30]]); }
  pb(ctx, rr(tx - 12, ty - 50, 24, 4, 0.6), '#6b5636', { sombra: 0.4 });
  paredBolsas(ctx, tx - 12, tx + 12, ty - 50, 2, 6, 3.6, 5);
  pb(ctx, c => { c.moveTo(tx - 14, ty - 66); c.lineTo(tx, ty - 72); c.lineTo(tx + 14, ty - 66); c.lineTo(tx + 13, ty - 64); c.lineTo(tx - 13, ty - 64); c.closePath(); }, '#4d5436', { sombra: 0.5 });
  if (!Pincel.silueta) { linea(ctx, '#3a3226', 1, [[tx - 11, ty - 64], [tx - 11, ty - 57]]); linea(ctx, '#3a3226', 1, [[tx + 11, ty - 64], [tx + 11, ty - 57]]); }
  pb(ctx, rr(tx + 6, ty - 62, 5, 4, 1), '#3a3c3e', { sombra: 0.3, linea: 0.35 });
  // Mástil con la bandera que flamea
  const mx = 74, my = y0 + 34;
  if (!Pincel.silueta) linea(ctx, '#8a8f94', 1.2, [[mx, my], [mx, my - 66]]);
  // Carpas de campaña con vientos y estacas
  const carpa = (cx, cy, w, col) => {
    sombraPiso(ctx, w * 0.6, 4, 0.3, cx, cy + 1);
    pb(ctx, c => { c.moveTo(cx - w / 2, cy); c.quadraticCurveTo(cx - w / 2 + 2, cy - 18, cx, cy - 20); c.quadraticCurveTo(cx + w / 2 - 2, cy - 18, cx + w / 2, cy); c.closePath(); }, col, { sombra: 1, brillo: 0.3 });
    if (Pincel.silueta) return;
    for (const f of [-0.25, 0.25]) linea(ctx, ajustarColor(col, -0.3), 0.5, [[cx + f * w, cy], [cx + f * w * 0.9, cy - 17.6]]);
    detalle(ctx, '#1e1c16', c => { c.moveTo(cx - 4, cy); c.quadraticCurveTo(cx, cy - 13, cx + 4, cy); });
    linea(ctx, '#c9c0a6', 0.4, [[cx - w / 2 + 3, cy - 12], [cx - w / 2 - 5, cy + 2]]); linea(ctx, '#c9c0a6', 0.4, [[cx + w / 2 - 3, cy - 12], [cx + w / 2 + 5, cy + 2]]);
  };
  carpa(32, y0 + 92, 38, '#5d6440'); carpa(78, y0 + 120, 34, '#525a39');
  // Tambores de combustible y cajones
  for (const [bx, by] of [[96, y0 + 66], [102, y0 + 70], [90, y0 + 72]]) { pb(ctx, rr(bx - 3, by - 9, 6, 9, 1.2), '#4d5a3a', { sombra: 0.5, linea: 0.35 }); if (!Pincel.silueta) linea(ctx, 'rgba(0,0,0,0.35)', 0.4, [[bx - 3, by - 5], [bx + 3, by - 5]]); }
  for (const [bx, by, w] of [[14, abajo - 132, 12], [16, abajo - 140, 9]]) { pb(ctx, rr(bx, by - 8, w, 8, 0.6), '#7a5a36', { sombra: 0.5, linea: 0.35 }); if (!Pincel.silueta) linea(ctx, 'rgba(0,0,0,0.3)', 0.4, [[bx, by - 4], [bx + w, by - 4]]); }
  // Cuartel: módulo prefabricado con techo de chapa, ventanas iluminadas, puerta y cartel
  const cy = y0 + alto - 80;
  sombraPiso(ctx, 42, 5, 0.32, 49, cy + 1);
  pb(ctx, rr(14, cy - 34, 70, 34, 1.2), '#7d7a66', { sombra: 0.9, brillo: 0.3 });
  pb(ctx, c => { c.moveTo(11, cy - 33); c.lineTo(87, cy - 33); c.lineTo(85, cy - 39); c.lineTo(13, cy - 39); c.closePath(); }, '#5d6166', { sombra: 0.4, brillo: 0.35 });
  if (!Pincel.silueta) {
    for (let k = 0; k < 18; k++) linea(ctx, 'rgba(30,32,36,0.35)', 0.4, [[13 + k * 4.2, cy - 39], [12 + k * 4.2, cy - 33]]);
    for (const wx of [20, 64]) { pb(ctx, rr(wx, cy - 26, 12, 8, 0.6), '#f2c96a', { sombra: 0.2, linea: 0.4, brillo: false }); linea(ctx, '#5a564a', 0.5, [[wx + 6, cy - 26], [wx + 6, cy - 18]]); }
    pb(ctx, rr(40, cy - 22, 14, 22, 0.6), '#4a4c4e', { sombra: 0.4, linea: 0.4 });
    pb(ctx, rr(30, cy - 33, 38, 7, 0.8), '#2e3a2a', { sombra: 0.2, linea: 0.4, brillo: 0.2 });
    ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('bastion.cuartel'), 49, cy - 27.6);
    pb(ctx, rr(36, cy - 2, 22, 2, 0.4), '#8a8579', { sombra: 0.2, linea: 0.3, brillo: false });   // escalón
  }
  // Taller: galpón de chapa en arco con el portón abierto y un vehículo adentro
  const gy = y0 + alto - 16;
  sombraPiso(ctx, 46, 5, 0.32, 50, gy + 1);
  const arco = c => { c.moveTo(8, gy); c.lineTo(8, gy - 22); c.quadraticCurveTo(10, gy - 46, 50, gy - 46); c.quadraticCurveTo(90, gy - 46, 92, gy - 22); c.lineTo(92, gy); c.closePath(); };
  pb(ctx, arco, '#666a62', { sombra: 1, brillo: 0.35 });
  if (!Pincel.silueta) {
    ctx.save(); ctx.beginPath(); arco(ctx); ctx.clip();
    for (let k = 0; k < 22; k++) linea(ctx, 'rgba(30,32,30,0.25)', 0.5, [[8 + k * 4, gy - 50], [8 + k * 4, gy]]);
    ctx.restore();
    pb(ctx, c => { c.moveTo(26, gy); c.lineTo(26, gy - 22); c.quadraticCurveTo(28, gy - 30, 50, gy - 30); c.quadraticCurveTo(72, gy - 30, 74, gy - 22); c.lineTo(74, gy); c.closePath(); }, '#1d1d1c', { sombra: 0.2, linea: 0.5, brillo: false });
    pb(ctx, rr(32, gy - 12, 34, 9, 2), '#3d4429', { sombra: 0.3, linea: 0.35, brillo: 0.15 });   // un blindado adentro, en sombra
    pb(ctx, rr(42, gy - 17, 14, 6, 1.4), '#3d4429', { sombra: 0.3, linea: 0.35, brillo: 0.15 });
    for (let k = 0; k < 5; k++) detalle(ctx, '#121212', circulo(35 + k * 7, gy - 3, 2.2));
    pb(ctx, rr(30, gy - 41, 40, 7, 0.8), '#2e3a2a', { sombra: 0.2, linea: 0.4, brillo: 0.2 });
    ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('bastion.taller'), 50, gy - 35.6);
  }
  // Muro de cestones a lo largo del frente, con el portón y la barrera
  const wx = x - 14;
  for (let y = y0 - 16; y < y0 + alto + 14; y += 12) {
    if (Math.abs(y + 6 - puertaY) < 16) continue;
    pb(ctx, rr(wx, y, 12, 12, 0.4), '#b49d70', { sombra: 0.6, brillo: 0.25, linea: 0.45 });
    if (!Pincel.silueta && !Lienzo.liviano) {
      ctx.strokeStyle = 'rgba(70,72,74,0.5)'; ctx.lineWidth = 0.3;
      for (let k = 3; k < 12; k += 3) { ctx.beginPath(); ctx.moveTo(wx + k, y); ctx.lineTo(wx + k, y + 12); ctx.moveTo(wx, y + k); ctx.lineTo(wx + 12, y + k); ctx.stroke(); }
    }
  }
  for (const s of [-1, 1]) pb(ctx, rr(wx - 1, puertaY + s * 16 - (s < 0 ? 4 : 0), 14, 4, 0.6), P.concretoOsc, { sombra: 0.4, linea: 0.4 });
  if (!Pincel.silueta) {   // barrera levantada, a rayas rojas y blancas
    ctx.save(); ctx.translate(wx + 6, puertaY + 14); ctx.rotate(-1.3);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#f2efe6' : '#c0392b'; ctx.fillRect(k * 4, -1, 4, 2); }
    ctx.restore();
  }
};

// El campamento quieto sale de la caché; por cuadro: el haz del reflector, la bandera, el avance del cuartel y el taller y el daño
Juego.prototype.dibujarCampamento = function (ctx) {
  const B = BASTION, alto = this.filas * B.celda[1], y0 = B.arriba, x = B.baseX, ms = this.ahora;
  const tx = 30, ty = y0 + 22, mx = 74, my = y0 + 34, cy = y0 + alto - 80, gy = y0 + alto - 16;
  conSprite(ctx, 'campamento' + this.filas + 'x' + this.cols + (typeof Idioma !== 'undefined' && Idioma.actual ? Idioma.actual() : ''), [0, y0 - 80, x, y0 + alto + 22], g => this.campamentoQuieto(g));
  if (!Pincel.silueta && !Lienzo.liviano) {   // haz del reflector que barre el campo
    const a = Math.sin(ms / 2200) * 0.25;
    ctx.save(); ctx.translate(tx + 11, ty - 60); ctx.rotate(0.35 + a); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 220, 0); g.addColorStop(0, 'rgba(255,245,200,0.16)'); g.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -1.5); ctx.lineTo(220, -26); ctx.lineTo(220, 26); ctx.lineTo(0, 1.5); ctx.fill(); ctx.restore();
  }
  const ond = k => Math.sin(ms / 260 + k) * 1.6;
  pb(ctx, c => { c.moveTo(mx, my - 66); c.quadraticCurveTo(mx + 9, my - 67 + ond(0), mx + 20, my - 65 + ond(1)); c.lineTo(mx + 20, my - 55 + ond(1)); c.quadraticCurveTo(mx + 9, my - 57 + ond(0), mx, my - 56); c.closePath(); }, '#3a6fb0', { sombra: 0.4, linea: 0.4 });
  if (!Pincel.silueta) detalle(ctx, '#f2e9d4', c => c.rect(mx + 4, my - 63 + ond(0) * 0.5, 4, 4));
  // Avance de lo que se forma (sobre el cuartel y el taller)
  for (const [cola, yb] of [[this.colaCuartel, cy - 46], [this.colaTaller, gy - 54]]) {
    const o = cola[0]; if (!o) continue;
    const f = Math.min(1, (o.hecho || 0) / B.unidades[o.tipo].tiempo);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(16, yb, 66, 5); ctx.fillStyle = '#ffd27a'; ctx.fillRect(17, yb + 1, 64 * f, 3);
    if (cola.length > 1) { ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+' + (cola.length - 1), 90, yb + 5); }
  }
  // Daño al campamento: un velo rojo
  const golpe = 1 - this.vidaBase / BASTION.vidaBase;
  if (golpe > 0) { ctx.fillStyle = `rgba(160,20,20,${golpe * 0.25})`; ctx.fillRect(0, y0 - 20, x, alto + 40); }
};

/* ---------- Obstáculos de los escenarios (pies en el centro de la celda) ---------- */
PaisajeBastion.obstaculo = function (ctx, tipo, s) {
  conSprite(ctx, 'ob' + tipo + (s % 4), [-30, -62, 30, 8], g => PaisajeBastion.obstaculoCuerpo(g, tipo, s % 4));
  if (tipo === 'cabana' && !Lienzo.liviano) for (let k = 0; k < 3; k++) { const f = (Date.now() / 1400 + k / 3) % 1; ctx.fillStyle = `rgba(220,225,230,${0.45 * (1 - f)})`; ctx.beginPath(); ctx.arc(13 + f * 6, -42 - f * 16, 2 + f * 4, 0, Math.PI * 2); ctx.fill(); }
};
PaisajeBastion.obstaculoCuerpo = function (ctx, tipo, s) {
  const P = PAL_BASTION, sin = !Pincel.silueta && !Lienzo.liviano;
  // Copa de árbol hecha de matas: cada mata con dos tonos y brillo; las de adelante más claras
  const matas = (lista, col) => lista.forEach(([x, y, r], i) => pb(ctx, c => c.arc(x, y, r, 0, Math.PI * 2), ajustarColor(col, (i / lista.length - 0.5) * 0.18), { sombra: r * 0.18, brillo: 0.2, linea: 0.45 }));
  switch (tipo) {
    case 'arbol': {
      sombraPiso(ctx, 20, 5, 0.38);
      pb(ctx, c => { c.moveTo(-4.4, 0); c.quadraticCurveTo(-2.4, -6, -2.6, -20); c.lineTo(2.6, -20); c.quadraticCurveTo(2.4, -6, 4.6, 0); c.closePath(); }, '#5e4129', { sombra: 0.8 });
      if (sin) { linea(ctx, 'rgba(30,18,8,0.5)', 0.4, [[-0.8, -2], [-1, -17]]); linea(ctx, 'rgba(30,18,8,0.4)', 0.4, [[1.4, -4], [1.2, -14]]); linea(ctx, '#5e4129', 1.4, [[1.6, -16], [7, -24]]); }
      matas([[-11, -26, 8], [11, -27, 8.4], [-5, -36, 9.6], [7, -37, 9], [0, -45, 8.6], [-2, -26, 9], [5, -28, 8.4]], '#3f6d2b');
      if (sin) for (let k = 0; k < 8; k++) detalle(ctx, 'rgba(190,230,120,0.35)', elipse(-9 + azar(k + s * 9, 301) * 14, -44 + azar(k + s * 9, 302) * 18, 1.8, 1.1));
      break;
    }
    case 'pino': case 'pinoNevado': {
      sombraPiso(ctx, 17, 4.4, 0.36);
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
      sombraPiso(ctx, 20, 4.4, 0.38);
      const col = '#858178';
      pb(ctx, c => { c.moveTo(-19, 0); c.lineTo(-17, -10); c.lineTo(-9, -19); c.lineTo(3, -21); c.lineTo(13, -15); c.lineTo(19, -6); c.lineTo(20, 0); c.closePath(); }, col, { sombra: 1.2, brillo: 0.3 });
      if (!Pincel.silueta) {
        detalle(ctx, ajustarColor(col, 0.16), poli([[-9, -19], [3, -21], [5, -13], [-6, -11]]));                    // cara de arriba, iluminada
        detalle(ctx, ajustarColor(col, -0.22), poli([[5, -13], [13, -15], [19, -6], [20, 0], [8, 0]]));             // cara en sombra
        linea(ctx, 'rgba(40,36,30,0.5)', 0.5, [[-6, -11], [-8, -3]]); linea(ctx, 'rgba(40,36,30,0.4)', 0.5, [[5, -13], [8, 0]]);
        detalle(ctx, 'rgba(90,120,60,0.45)', elipse(-12, -2, 5, 1.6));                                                // musgo
      }
      break;
    }
    case 'fardo': {
      sombraPiso(ctx, 18, 4, 0.36);
      pb(ctx, rr(-16, -20, 28, 20, 9), '#c8a14c', { sombra: 1, brillo: 0.35 });
      if (sin) { for (let k = 0; k < 6; k++) linea(ctx, 'rgba(130,90,25,0.45)', 0.45, [[-13 + k * 4.4, -19], [-14.6 + k * 4.4, -1]]); linea(ctx, 'rgba(250,240,220,0.5)', 0.4, [[-14, -10], [10, -10]]); }
      pb(ctx, c => c.ellipse(12, -10, 5, 10, 0, 0, Math.PI * 2), '#b48d3c', { sombra: 0.6 });
      if (sin) { ctx.strokeStyle = 'rgba(110,75,20,0.6)'; ctx.lineWidth = 0.45; for (let r = 1.5; r < 5; r += 1.3) { ctx.beginPath(); ctx.ellipse(12, -10, r * 0.95, r * 2, 0, 0, Math.PI * 2); ctx.stroke(); } }
      break;
    }
    case 'tractor': {
      sombraPiso(ctx, 22, 4.6, 0.38);
      const R = '#b5291f';
      pb(ctx, rr(-8, -28, 4, 12, 1), '#2b2b2b', { sombra: 0.3, linea: 0.35 });                                       // caño de escape
      pb(ctx, c => { c.moveTo(-6, -17); c.lineTo(-6, -24); c.lineTo(14, -24); c.quadraticCurveTo(19, -23, 19, -18); c.lineTo(19, -12); c.lineTo(-6, -12); c.closePath(); }, R, { sombra: 0.9, brillo: 0.4 });   // capó
      if (sin) for (let k = 0; k < 4; k++) linea(ctx, '#5a1510', 0.5, [[16 + k * 0.8, -22], [16 + k * 0.8, -14]]);    // parrilla
      pb(ctx, rr(-17, -37, 13, 20, 1.6), R, { sombra: 0.8, brillo: 0.35 });                                         // cabina
      pb(ctx, rr(-15, -35, 9, 9, 0.8), 'rgba(170,210,235,0.85)', { sombra: 0.2, linea: 0.4, brillo: 0.5 });
      pb(ctx, c => { c.moveTo(-22, -14); c.quadraticCurveTo(-21, -30, -9, -30); c.quadraticCurveTo(2, -28, 2, -14); c.closePath(); }, ajustarColor(R, -0.08), { sombra: 0.6 });   // guardabarros
      const rueda = (x, y, r) => {
        pb(ctx, c => c.arc(x, y, r, 0, Math.PI * 2), '#242322', { sombra: 0.6, brillo: 0.15 });
        if (sin) { ctx.strokeStyle = '#121212'; ctx.lineWidth = 1.1; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); ctx.lineTo(x + Math.cos(a + 0.2) * r, y + Math.sin(a + 0.2) * r); ctx.stroke(); } }
        pb(ctx, c => c.arc(x, y, r * 0.5, 0, Math.PI * 2), '#d9b23a', { sombra: 0.4, linea: 0.4, brillo: 0.35 });
        if (sin) detalle(ctx, '#7a5a1a', circulo(x, y, r * 0.16));
      };
      rueda(-10, -10.4, 10.4); rueda(13, -5.6, 5.6);
      break;
    }
    case 'auto': {
      sombraPiso(ctx, 22, 4.4, 0.4);
      const col = ['#7a3b2c', '#3f5a72', '#7c6c3c', '#55603f'][s % 4];
      const carroceria = c => { c.moveTo(-22, -7); c.lineTo(-22, -13); c.quadraticCurveTo(-21.4, -15.4, -17, -15.6); c.lineTo(-11, -16); c.lineTo(-6.4, -23.4); c.quadraticCurveTo(-5.6, -24.4, -4, -24.4); c.lineTo(8.4, -24.4); c.quadraticCurveTo(10, -24.4, 11, -23); c.lineTo(15, -16.4); c.lineTo(20.6, -15.2); c.quadraticCurveTo(22.6, -14.2, 22.6, -11); c.lineTo(22.6, -7); c.closePath(); };
      pb(ctx, carroceria, col, { sombra: 1, brillo: 0.4 });
      if (!Pincel.silueta) {
        ctx.save(); ctx.beginPath(); carroceria(ctx); ctx.clip();
        for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(120,60,25,0.45)'; ctx.beginPath(); ctx.ellipse(-18 + azar(k + s * 5, 311) * 38, -9 - azar(k + s * 5, 312) * 8, 2 + azar(k, 313) * 3, 1.2 + azar(k, 314) * 1.4, 0, 0, Math.PI * 2); ctx.fill(); }   // óxido
        ctx.restore();
        // Ventanillas rotas, puertas, manijas, faros y paragolpes
        for (const v of [[-5.2, -22.6, -0.6, -22.6, -0.6, -16.6, -9.4, -16.6], [0.8, -22.6, 8.4, -22.6, 12, -16.6, 0.8, -16.6]]) {
          detalle(ctx, 'rgba(35,48,58,0.9)', poli([[v[0], v[1]], [v[2], v[3]], [v[4], v[5]], [v[6], v[7]]]));
          linea(ctx, 'rgba(200,225,240,0.45)', 0.4, [[v[0] + 1, v[1] + 1], [v[0] + 3.2, v[5] - 1]]);
        }
        linea(ctx, 'rgba(220,235,245,0.6)', 0.35, [[2.5, -22], [4.5, -19.5], [3, -17.5]]);
        linea(ctx, ajustarColor(col, -0.45), 0.5, [[-0.2, -16.4], [-0.6, -7.6]]); linea(ctx, ajustarColor(col, -0.45), 0.5, [[-10.6, -15.6], [-11.4, -7.6]]);
        detalle(ctx, '#d6d2c6', c => c.rect(-7.6, -14, 2.4, 0.8)); detalle(ctx, '#d6d2c6', c => c.rect(3, -14, 2.4, 0.8));
        detalle(ctx, '#f3e6b0', c => c.rect(20.6, -13.6, 2, 2)); detalle(ctx, '#a52a1f', c => c.rect(-22, -13.6, 1.6, 2.4));
        pb(ctx, rr(-23, -8.4, 3.4, 2, 0.6), '#4a4a4a', { sombra: 0.2, linea: 0.3, brillo: false }); pb(ctx, rr(20, -8.4, 3.4, 2, 0.6), '#4a4a4a', { sombra: 0.2, linea: 0.3, brillo: false });
      }
      for (const [x, chata] of [[-13, s % 2], [13, 0]]) {
        pb(ctx, c => c.ellipse(x, -4.8 + chata * 1, 5, 4.8 - chata * 1, 0, 0, Math.PI * 2), '#1f1f20', { sombra: 0.5, brillo: 0.15 });
        pb(ctx, c => c.arc(x, -4.8 + chata, 2.2, 0, Math.PI * 2), '#7d7f80', { sombra: 0.3, linea: 0.35, brillo: 0.35 });
      }
      break;
    }
    case 'contenedor': {
      sombraPiso(ctx, 24, 4.6, 0.4);
      const col = ['#2f5f7a', '#8a3a24', '#5c6b3a'][s % 3];
      pb(ctx, rr(-22, -28, 44, 28, 1), col, { sombra: 1.2, brillo: 0.35 });
      if (!Pincel.silueta) {
        for (let x = -19; x < 14; x += 2.6) { linea(ctx, ajustarColor(col, -0.3), 0.6, [[x, -26.4], [x, -1.6]]); linea(ctx, ajustarColor(col, 0.15), 0.35, [[x + 1, -26.4], [x + 1, -1.6]]); }
        pb(ctx, rr(-22, -28, 44, 2.4, 0.4), ajustarColor(col, -0.15), { sombra: 0.2, linea: 0.35, brillo: 0.3 });
        pb(ctx, rr(-22, -2.4, 44, 2.4, 0.4), ajustarColor(col, -0.2), { sombra: 0.2, linea: 0.35 });
        for (const x of [15.4, 18.6]) { linea(ctx, '#bfc3c6', 0.7, [[x, -25.4], [x, -2.6]]); detalle(ctx, '#8d9296', c => c.rect(x - 1, -15, 2, 2.4)); }   // barras de cierre de la puerta
        for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(110,55,25,0.35)'; ctx.fillRect(-20 + azar(k + s, 321) * 30, -26, 1.4, 6 + azar(k, 322) * 10); }   // chorreado de óxido
        detalle(ctx, 'rgba(240,235,220,0.75)', c => c.rect(-16, -21, 14, 3));
      }
      break;
    }
    case 'cactus': {
      sombraPiso(ctx, 12, 3.4, 0.36);
      const V = '#4d8a3a';
      pb(ctx, c => { c.moveTo(-6, -16); c.quadraticCurveTo(-11, -16, -11, -22); c.lineTo(-11, -30); c.quadraticCurveTo(-11, -33, -8.6, -33); c.quadraticCurveTo(-6.4, -33, -6.4, -30); c.lineTo(-6.4, -22.6); c.lineTo(-4, -21); c.closePath(); }, ajustarColor(V, -0.06), { sombra: 0.6 });
      pb(ctx, c => { c.moveTo(5, -22); c.quadraticCurveTo(10.6, -22, 10.6, -28); c.lineTo(10.6, -36); c.quadraticCurveTo(10.6, -39, 8.2, -39); c.quadraticCurveTo(6, -39, 6, -36); c.lineTo(6, -28); c.lineTo(4, -27); c.closePath(); }, ajustarColor(V, -0.03), { sombra: 0.6 });
      pb(ctx, c => { c.moveTo(-4.4, 0); c.lineTo(-4.4, -38); c.quadraticCurveTo(-4.4, -43, 0, -43); c.quadraticCurveTo(4.4, -43, 4.4, -38); c.lineTo(4.4, 0); c.closePath(); }, V, { sombra: 1, brillo: 0.35 });
      if (sin) {
        for (const x of [-2.2, 0, 2.2]) linea(ctx, 'rgba(30,70,25,0.6)', 0.45, [[x, -41], [x, -1]]);
        for (let k = 0; k < 14; k++) detalle(ctx, 'rgba(255,250,220,0.7)', c => c.rect(-4 + (k % 4) * 2.6, -40 + k * 2.8, 0.5, 0.5));
        detalle(ctx, '#e8d26a', circulo(0, -43.6, 1.3)); detalle(ctx, '#d9644a', circulo(-1.4, -43.2, 0.9));
      }
      break;
    }
    case 'cabana': {
      sombraPiso(ctx, 24, 4.6, 0.38);
      const M = '#7a5432';
      pb(ctx, rr(10, -40, 6, 18, 0.6), '#7f7b74', { sombra: 0.5, linea: 0.4 });   // chimenea de piedra (el humo sale por cuadro)
      pb(ctx, rr(-20, -22, 40, 22, 0.6), M, { sombra: 1, brillo: 0.3 });
      if (!Pincel.silueta) for (let k = 0; k < 5; k++) { linea(ctx, 'rgba(40,24,10,0.55)', 0.6, [[-20, -18 + k * 4.4], [20, -18 + k * 4.4]]); detalle(ctx, ajustarColor(M, 0.15), circulo(-20, -20 + k * 4.4, 1.6)); detalle(ctx, ajustarColor(M, 0.15), circulo(20, -20 + k * 4.4, 1.6)); }
      pb(ctx, rr(-14, -16, 9, 8, 0.6), '#ffd27a', { sombra: 0.2, linea: 0.45, brillo: false });                       // ventana encendida
      if (!Pincel.silueta) { linea(ctx, '#5a3a1e', 0.6, [[-9.5, -16], [-9.5, -8]]); linea(ctx, '#5a3a1e', 0.6, [[-14, -12], [-5, -12]]); }
      pb(ctx, rr(4, -15, 8, 15, 0.6), '#5a3a1e', { sombra: 0.4, linea: 0.45 });                                     // puerta
      pb(ctx, c => { c.moveTo(-24, -21); c.lineTo(0, -38); c.lineTo(24, -21); c.lineTo(22, -19.6); c.lineTo(-22, -19.6); c.closePath(); }, '#4a3020', { sombra: 0.8 });
      pb(ctx, c => { c.moveTo(-23, -21.4); c.lineTo(0, -38); c.lineTo(23, -21.4); c.quadraticCurveTo(12, -24, 6, -22.6); c.quadraticCurveTo(0, -25, -8, -22.4); c.quadraticCurveTo(-16, -24.4, -23, -21.4); }, '#f1f5f8', { sombra: 0.5, brillo: 0.4, linea: 0.4 });
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
  const piso = ctx.createLinearGradient(0, B.arriba - 22, 0, ALTO);
  piso.addColorStop(0, ajustarColor(col, -0.16)); piso.addColorStop(0.25, col); piso.addColorStop(1, ajustarColor(col, -0.08));
  ctx.fillStyle = piso; ctx.fillRect(-20, B.arriba - 22, ANCHO + 40, ALTO - B.arriba + 40);
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
PaisajeBastion.fondoVivo = function (ctx, N, ms) {
  if (Lienzo.liviano) { if (N.fondo === 'granja') aspasMolino(ctx, ANCHO * 0.3, BASTION.arriba - 82, ms); return; }
  const A = ANCHO, h = BASTION.arriba - 20;
  switch (N.fondo) {
    case 'granja':
      for (let k = 0; k < 5; k++) {
        const x = (k * 230 + ms * 0.006) % (A + 200) - 100, y = 34 + (k % 3) * 16, sc = 0.8 + (k % 2) * 0.3;
        for (const [col, dy0] of [['rgba(170,190,215,0.6)', 3], ['#ffffff', 0]]) for (const [dx, dy, r] of [[-18, 2, 10], [-6, -4, 14], [10, -2, 12], [22, 3, 9], [0, 4, 12]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + dx * sc, y + (dy + dy0) * sc, r * sc, 0, Math.PI * 2); ctx.fill(); }
      }
      aspasMolino(ctx, A * 0.3, h - 62, ms);
      break;
    case 'ciudad':
      for (const [x0, sal] of [[A * 0.18, 1], [A * 0.55, 2], [A * 0.88, 3]]) {
        const fuego = ctx.createRadialGradient(x0, h - 6, 2, x0, h - 6, 30); fuego.addColorStop(0, 'rgba(255,140,50,0.5)'); fuego.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = fuego; ctx.fillRect(x0 - 30, h - 36, 60, 40);
        for (let k = 0; k < 9; k++) { const t = ((ms / 5000 + k / 9 + sal * 0.13) % 1), r = 8 + t * 26; ctx.fillStyle = `rgba(40,32,36,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(x0 + t * 40 + Math.sin(t * 6 + sal) * 6, h - 10 - t * 120, r, 0, Math.PI * 2); ctx.fill(); }
      }
      break;
    case 'bosque':
      for (let k = 0; k < 14; k++) { const x = (azar(k, 121) * A + ms * 0.01 * (k % 2 ? 1 : -1)) % A, y = h - 10 - azar(k, 122) * 30 + Math.sin(ms / 500 + k) * 3, b = 0.5 + 0.5 * Math.sin(ms / 300 + k * 2); ctx.fillStyle = `rgba(220,255,140,${0.7 * b})`; ctx.beginPath(); ctx.arc((x + A) % A, y, 1.2, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'desierto':
      for (let k = 0; k < 3; k++) { const a = ms / 2500 + k * 2.1, x = A * 0.66 + Math.cos(a) * 40, y = 70 + Math.sin(a) * 12 + k * 6, b = Math.sin(ms / 200 + k) * 2; ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 7, y - b); ctx.quadraticCurveTo(x - 3, y - 2, x, y); ctx.quadraticCurveTo(x + 3, y - 2, x + 7, y - b); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,245,215,0.22)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let x = 0; x <= A; x += 16) ctx.lineTo(x, h - 12 - k * 9 + Math.sin(x / 26 + ms / 260 + k) * 1.4); ctx.stroke(); }
      break;
    case 'montana':
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.ellipse((k * 150 + ms * 0.004) % (A + 200) - 100, h - 44 + (k % 3) * 5, 70, 9, 0, 0, Math.PI * 2); ctx.fill(); }
      for (let k = 0; k < 70; k++) { const y = (azar(k, 61) * (h + 30) + ms * 0.025 * (0.5 + azar(k, 62))) % (h + 30), x = (azar(k, 63) * A + Math.sin(ms / 700 + k) * 8 + A) % A; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x, y, 0.8 + azar(k, 64), 0, Math.PI * 2); ctx.fill(); }
      break;
  }
};
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
    try { PaisajeBastion.fondo(c2, N, 0, true); PaisajeBastion.suelo(c2, N); PaisajeBastion.terreno(c2, this, 0); } finally { Lienzo.liviano = liv; }
    capaSueloBastion.lienzo = L; capaSueloBastion.clave = clave;
  }
  ctx.drawImage(capaSueloBastion.lienzo, 0, 0, ANCHO, ALTO);
  PaisajeBastion.fondoVivo(ctx, N, this.ahora);
  PaisajeBastion.terrenoAnimado(ctx, this, this.ahora);
};

function aspasMolino(ctx, x, y, ms) { ctx.save(); ctx.translate(x, y); ctx.rotate(ms / 700); ctx.fillStyle = '#9a9a9a'; for (let k = 0; k < 12; k++) { ctx.rotate(Math.PI / 6); ctx.fillRect(-1, 2, 2, 12); } ctx.restore(); }
/* ---------- Fondos: cielo, astro, nubes y paisaje en capas (lejos más claro), con bruma en el horizonte ---------- */
PaisajeBastion.fondo = function (ctx, N, ms, quieto = false) {   // quieto: sin lo que se mueve (eso lo pinta fondoVivo por cuadro)
  const B = BASTION, A = ANCHO, h = B.arriba - 20, liv = Lienzo.liviano;
  const cielo = paradas => { const g = ctx.createLinearGradient(0, 0, 0, h); paradas.forEach((c, i) => g.addColorStop(i / (paradas.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(-20, -20, A + 40, h + 24); };
  const astro = (x, y, r, col, halo) => { const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 4); g.addColorStop(0, halo); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  const nube = (x, y, s, col, sombra) => {
    for (const [dx, dy, r] of [[-18, 2, 10], [-6, -4, 14], [10, -2, 12], [22, 3, 9], [0, 4, 12]]) { ctx.fillStyle = sombra; ctx.beginPath(); ctx.arc(x + dx * s, y + (dy + 3) * s, r * s, 0, Math.PI * 2); ctx.fill(); }
    for (const [dx, dy, r] of [[-18, 2, 10], [-6, -4, 14], [10, -2, 12], [22, 3, 9], [0, 4, 12]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill(); }
  };
  // Cordón de cerros suaves (base, alto, semilla, cantidad de lomas)
  const lomas = (col, base, alto, sal, n) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-20, h + 4); ctx.lineTo(-20, base); for (let k = 0; k <= n; k++) { const x = -20 + k * (A + 40) / n, y = base - alto * (0.35 + 0.65 * azar(k, sal)); ctx.quadraticCurveTo(x - (A + 40) / n / 2, y - alto * 0.3, x, base - alto * 0.25 * azar(k, sal + 1)); } ctx.lineTo(A + 20, h + 4); ctx.closePath(); ctx.fill(); };
  // Cordón de picos (montañas o mesetas)
  const picos = (col, base, alto, sal, n, nieve) => {
    for (let k = 0; k <= n; k++) {
      const x = -30 + (k + azar(k, sal) * 0.5) * (A + 60) / n, a = alto * (0.55 + azar(k, sal + 1) * 0.45), w = a * (0.9 + azar(k, sal + 2) * 0.5);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x - w * 0.15, base - a * 0.92); ctx.lineTo(x, base - a); ctx.lineTo(x + w, base); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(x, base - a); ctx.lineTo(x + w, base); ctx.lineTo(x + w * 0.2, base); ctx.fill();   // ladera en sombra
      if (nieve) { ctx.fillStyle = nieve; ctx.beginPath(); ctx.moveTo(x - w * 0.15, base - a * 0.92); ctx.lineTo(x, base - a); ctx.lineTo(x + w * 0.34, base - a * 0.66); ctx.lineTo(x + w * 0.16, base - a * 0.7); ctx.lineTo(x + w * 0.02, base - a * 0.62); ctx.lineTo(x - w * 0.12, base - a * 0.72); ctx.lineTo(x - w * 0.28, base - a * 0.68); ctx.closePath(); ctx.fill(); }
    }
  };
  const pinos = (col, base, alto, n, sal) => { ctx.fillStyle = col; for (let k = 0; k < n; k++) { const x = (k + azar(k, sal)) * (A + 40) / n - 20, a = alto * (0.6 + azar(k, sal + 1) * 0.5); ctx.beginPath(); ctx.moveTo(x, base - a); for (let j = 1; j <= 4; j++) { ctx.lineTo(x - a * 0.08 * j - 1.5, base - a + a * j / 4.4); ctx.lineTo(x - a * 0.05 * j, base - a + a * j / 4.4 - 1.2); } ctx.lineTo(x - a * 0.3, base); ctx.lineTo(x + a * 0.3, base); for (let j = 4; j >= 1; j--) { ctx.lineTo(x + a * 0.05 * j, base - a + a * j / 4.4 - 1.2); ctx.lineTo(x + a * 0.08 * j + 1.5, base - a + a * j / 4.4); } ctx.closePath(); ctx.fill(); } };
  const bruma = (col, alto = 34) => { const g = ctx.createLinearGradient(0, h - alto, 0, h + 4); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col); ctx.fillStyle = g; ctx.fillRect(-20, h - alto, A + 40, alto + 6); };
  switch (N.fondo) {
    case 'granja': {
      cielo(['#4f93cf', '#9cc6e4', '#efe2b6']);
      astro(A * 0.8, 46, 18, '#fff7da', 'rgba(255,240,190,0.55)');
      if (!quieto) for (let k = 0; k < 5; k++) nube((k * 230 + ms * 0.006) % (A + 200) - 100, 34 + (k % 3) * 16, 0.8 + (k % 2) * 0.3, '#ffffff', 'rgba(170,190,215,0.6)');
      lomas('#a9c39a', h - 40, 34, 11, 6);                                                  // lejos
      lomas('#86a65c', h - 18, 30, 21, 8);
      // Parcelas sembradas en la loma del fondo, en franjas que siguen la pendiente
      for (const [x0, w, a, c1, c2] of [[A * 0.08, 150, 16, '#b9b05a', '#93ab52'], [A * 0.78, 120, 12, '#a7c062', '#c4a44e']]) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(x0, h - 20); ctx.lineTo(x0 + w * 0.15, h - 20 - a); ctx.lineTo(x0 + w * 0.85, h - 20 - a); ctx.lineTo(x0 + w, h - 20); ctx.closePath(); ctx.clip();
        for (let k = 0; k < 14; k++) { ctx.fillStyle = k % 2 ? c1 : c2; ctx.fillRect(x0 + k * w / 14, h - 22 - a, w / 14 + 0.5, a + 4); }
        ctx.restore();
      }
      // Granero con silo, molino y alambrado
      const gx = A * 0.6, gb = h - 6;
      ctx.fillStyle = '#9a2f22'; ctx.fillRect(gx, gb - 30, 46, 30);
      ctx.fillStyle = '#7a2218'; ctx.beginPath(); ctx.moveTo(gx - 4, gb - 30); ctx.lineTo(gx + 8, gb - 44); ctx.lineTo(gx + 38, gb - 44); ctx.lineTo(gx + 50, gb - 30); ctx.fill();
      ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 1.2; ctx.strokeRect(gx + 16, gb - 20, 14, 20); ctx.beginPath(); ctx.moveTo(gx + 16, gb - 20); ctx.lineTo(gx + 30, gb); ctx.moveTo(gx + 30, gb - 20); ctx.lineTo(gx + 16, gb); ctx.stroke();
      ctx.fillStyle = '#c9ccd0'; ctx.fillRect(gx + 52, gb - 44, 14, 44); ctx.beginPath(); ctx.arc(gx + 59, gb - 44, 7, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(gx + 60, gb - 44, 6, 44);
      const mx = A * 0.3; ctx.strokeStyle = '#7d7d7d'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(mx - 7, h - 4); ctx.lineTo(mx, h - 62); ctx.lineTo(mx + 7, h - 4); ctx.moveTo(mx - 5, h - 22); ctx.lineTo(mx + 5, h - 22); ctx.stroke();
      if (!quieto) aspasMolino(ctx, mx, h - 62, ms);
      ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.moveTo(mx + 2, h - 63); ctx.lineTo(mx + 14, h - 66); ctx.lineTo(mx + 14, h - 59); ctx.fill();
      ctx.strokeStyle = '#7a6448'; ctx.lineWidth = 1; for (let x = -10; x < A + 10; x += 22) { ctx.beginPath(); ctx.moveTo(x, h + 2); ctx.lineTo(x, h - 8); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-10, h - 6); ctx.lineTo(A + 10, h - 6); ctx.moveTo(-10, h - 2); ctx.lineTo(A + 10, h - 2); ctx.stroke();
      bruma('rgba(200,220,170,0.55)');
      break;
    }
    case 'ciudad': {
      cielo(['#1c1626', '#4a2a35', '#b4553a']);
      astro(A * 0.72, h - 34, 20, 'rgba(255,180,110,0.9)', 'rgba(255,140,70,0.45)');
      // Skyline lejano y el cercano con ventanas encendidas y techos rotos
      for (const [col, alt, sal, ancho, ventanas] of [['#4a3540', 90, 71, 34, false], ['#241c22', 70, 81, 30, true]]) {
        for (let k = 0; k < 26; k++) {
          const x = k * (A / 22) - 30 + azar(k, sal) * 10, hh = alt * (0.45 + azar(k, sal + 1) * 0.6), w = ancho * (0.7 + azar(k, sal + 2) * 0.6);
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, h + 2); ctx.lineTo(x, h - hh); if (azar(k, sal + 3) > 0.6) { ctx.lineTo(x + w * 0.4, h - hh); ctx.lineTo(x + w * 0.55, h - hh + 9); ctx.lineTo(x + w * 0.7, h - hh + 3); } ctx.lineTo(x + w, h - hh); ctx.lineTo(x + w, h + 2); ctx.fill();
          if (azar(k, sal + 4) > 0.75) { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w / 2, h - hh); ctx.lineTo(x + w / 2, h - hh - 12); ctx.stroke(); }
          if (ventanas) for (let v = 0; v < 10; v++) if (azar(k * 13 + v, sal + 5) > 0.82) { ctx.fillStyle = azar(v, k) > 0.5 ? 'rgba(255,190,90,0.75)' : 'rgba(255,120,50,0.6)'; ctx.fillRect(x + 3 + (v % 3) * (w / 3.2), h - hh + 6 + Math.floor(v / 3) * 10, 3, 4); }
        }
      }
      // Columnas de humo de los incendios
      if (!liv && !quieto) for (const [x0, sal] of [[A * 0.18, 1], [A * 0.55, 2], [A * 0.88, 3]]) {
        const fuego = ctx.createRadialGradient(x0, h - 6, 2, x0, h - 6, 30); fuego.addColorStop(0, 'rgba(255,140,50,0.5)'); fuego.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = fuego; ctx.fillRect(x0 - 30, h - 36, 60, 40);
        for (let k = 0; k < 9; k++) { const t = ((ms / 5000 + k / 9 + sal * 0.13) % 1), r = 8 + t * 26; ctx.fillStyle = `rgba(40,32,36,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(x0 + t * 40 + Math.sin(t * 6 + sal) * 6, h - 10 - t * 120, r, 0, Math.PI * 2); ctx.fill(); }
      }
      // Autopista elevada cortada, con pilares
      ctx.fillStyle = '#3a2f33'; ctx.fillRect(A * 0.28, h - 34, A * 0.2, 6); ctx.beginPath(); ctx.moveTo(A * 0.48, h - 34); ctx.lineTo(A * 0.5, h - 30); ctx.lineTo(A * 0.47, h - 28); ctx.fill();
      for (const x of [A * 0.31, A * 0.41]) ctx.fillRect(x, h - 28, 5, 28);
      ctx.fillStyle = '#1f5a34'; ctx.save(); ctx.translate(A * 0.33, h - 48); ctx.rotate(0.06); ctx.fillRect(0, 0, 40, 12); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(4, 3, 20, 2); ctx.fillRect(4, 7, 14, 2); ctx.restore();
      bruma('rgba(140,80,60,0.6)', 40);
      break;
    }
    case 'bosque': {
      cielo(['#070b16', '#16223a', '#2c3c58']);
      for (let k = 0; k < 70; k++) { const tw = 0.4 + 0.6 * Math.abs(Math.sin(ms / 600 + k)); ctx.fillStyle = `rgba(255,255,255,${(0.25 + azar(k, 91) * 0.5) * tw})`; ctx.fillRect(azar(k, 92) * A, azar(k, 93) * (h - 60), 1.2, 1.2); }
      astro(A * 0.2, 44, 13, '#eef2ff', 'rgba(170,190,255,0.35)');
      ctx.fillStyle = '#16223a'; ctx.beginPath(); ctx.arc(A * 0.2 + 6, 41, 11.5, 0, Math.PI * 2); ctx.fill();
      picos('#24324a', h - 20, 70, 61, 5, null);
      pinos('#1b273b', h - 6, 58, 40, 101);
      if (!liv) { const g = ctx.createLinearGradient(0, h - 40, 0, h - 10); g.addColorStop(0, 'rgba(120,140,170,0)'); g.addColorStop(1, 'rgba(120,140,170,0.25)'); ctx.fillStyle = g; ctx.fillRect(-20, h - 40 + Math.sin(ms / 3000) * 3, A + 40, 30); }
      pinos('#121b29', h + 4, 50, 52, 111);
      if (!liv && !quieto) for (let k = 0; k < 14; k++) { const x = (azar(k, 121) * A + ms * 0.01 * (k % 2 ? 1 : -1)) % A, y = h - 10 - azar(k, 122) * 30 + Math.sin(ms / 500 + k) * 3, b = 0.5 + 0.5 * Math.sin(ms / 300 + k * 2); ctx.fillStyle = `rgba(220,255,140,${0.7 * b})`; ctx.beginPath(); ctx.arc((x + A) % A, y, 1.2, 0, Math.PI * 2); ctx.fill(); }   // luciérnagas
      bruma('rgba(40,58,50,0.6)', 30);
      break;
    }
    case 'desierto': {
      cielo(['#e9a54d', '#f4cf86', '#fbecc6']);
      astro(A * 0.7, 40, 22, '#fffbe8', 'rgba(255,240,190,0.6)');
      const meseta = (x, w, a, col, sal) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w / 2 - 22, h + 2); ctx.lineTo(x - w / 2, h - a); ctx.lineTo(x + w / 2, h - a); ctx.lineTo(x + w / 2 + 26, h + 2); ctx.fill();
        ctx.fillStyle = 'rgba(80,30,10,0.22)'; ctx.beginPath(); ctx.moveTo(x + w * 0.1, h - a); ctx.lineTo(x + w / 2, h - a); ctx.lineTo(x + w / 2 + 26, h + 2); ctx.lineTo(x + w * 0.2, h + 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,180,0.25)'; ctx.lineWidth = 1.2; for (let k = 1; k < 4; k++) { const y = h - a + k * a / 4; ctx.beginPath(); ctx.moveTo(x - w / 2 - k * 4, y); ctx.lineTo(x + w / 2 + k * 5, y + azar(k, sal)); ctx.stroke(); }
      };
      meseta(A * 0.3, 90, 46, '#d9a985', 1); meseta(A * 0.86, 120, 54, '#d4a07d', 2);   // lejos
      meseta(A * 0.08, 150, 72, '#b55a3b', 3); meseta(A * 0.58, 100, 52, '#c2663f', 4);
      lomas('#ddb878', h - 4, 16, 31, 6);
      // Tanque de agua lejano y buitres que planean
      ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = 1; const tx = A * 0.44; ctx.beginPath(); ctx.moveTo(tx - 6, h - 4); ctx.lineTo(tx - 4, h - 30); ctx.moveTo(tx + 6, h - 4); ctx.lineTo(tx + 4, h - 30); ctx.stroke(); ctx.fillStyle = '#7a6650'; ctx.fillRect(tx - 8, h - 40, 16, 10);
      if (!liv && !quieto) for (let k = 0; k < 3; k++) { const a = ms / 2500 + k * 2.1, x = A * 0.66 + Math.cos(a) * 40, y = 70 + Math.sin(a) * 12 + k * 6, b = Math.sin(ms / 200 + k) * 2; ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 7, y - b); ctx.quadraticCurveTo(x - 3, y - 2, x, y); ctx.quadraticCurveTo(x + 3, y - 2, x + 7, y - b); ctx.stroke(); }
      if (!liv && !quieto) { ctx.strokeStyle = 'rgba(255,245,215,0.22)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let x = 0; x <= A; x += 16) ctx.lineTo(x, h - 12 - k * 9 + Math.sin(x / 26 + ms / 260 + k) * 1.4); ctx.stroke(); } }   // calor
      bruma('rgba(240,210,150,0.65)', 30);
      break;
    }
    case 'montana': {
      cielo(['#7f9bb3', '#b9c9d6', '#e9eff3']);
      astro(A * 0.86, 40, 12, 'rgba(255,255,250,0.85)', 'rgba(255,255,255,0.4)');
      picos('#c3d0dc', h - 30, 120, 41, 4, '#f6f9fb');                                      // lejos, casi del color del cielo
      picos('#8696a6', h - 12, 92, 51, 6, '#eef3f7');
      if (!liv && !quieto) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.ellipse((k * 150 + ms * 0.004) % (A + 200) - 100, h - 44 + (k % 3) * 5, 70, 9, 0, 0, Math.PI * 2); ctx.fill(); } }   // nubes bajas
      pinos('#4e5f5a', h + 2, 34, 46, 131);
      if (!liv && !quieto) for (let k = 0; k < 70; k++) { const y = (azar(k, 61) * (h + 30) + ms * 0.025 * (0.5 + azar(k, 62))) % (h + 30), x = (azar(k, 63) * A + Math.sin(ms / 700 + k) * 8 + A) % A; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x, y, 0.8 + azar(k, 64), 0, Math.PI * 2); ctx.fill(); }
      bruma('rgba(230,238,244,0.7)', 30);
      break;
    }
  }
};
