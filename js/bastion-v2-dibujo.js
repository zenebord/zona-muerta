/* ===== Último bastión v2: el dibujo de lo nuevo =====
 * Unidades (como las demás de js/bastion-dibujo.js: pies en (0, 0), el centro de la celda, mirando a la derecha y con
 * la pose quieta guardada como imagen): francotirador, lanzallamas, médico, mortero, antiaérea, alambrado, señuelo y
 * el soldado caído. Zombies: lo que se le suma al zombie de siempre (js/zombie.js) para el acorazado (casco con visor
 * y escudo), el gritón (megáfono), el hinchado (panza con pústulas) y el dinamitero (cartuchos a la espalda con la
 * mecha prendida), el topo (casco de minero con su lámpara; enterrado es un montículo que avanza) y el escupidor (el
 * buche lleno de ácido), y las aves, que son nuevas: cuervo y buitre. La torre de vigía. Al final, lo que se pinta
 * sobre la escena en cada cuadro: fuego, gas, ácido, granadas, lo que arroja la horda, estelas, gritos, avisos,
 * anillos y cursores.
 */
/* ---------- Infantería: el mismo cuerpo, con el equipo de cada oficio ---------- */
const TRAJES_BASTION = {
  soldado:       { tela: '#5b6340', chaleco: '#8f7d57', casco: '#6f7850' },
  francotirador: { tela: '#5a5c36', chaleco: '#6a6a40', casco: '#6e6a40', hilachas: ['#8a8250', '#4f5a30', '#77703f'] },
  lanzallamas:   { tela: '#4b4a42', chaleco: '#3a3a35', casco: '#3f423a', tanque: '#b5462a', banda: '#e2d9c2' },
  medico:        { tela: '#5b6340', chaleco: '#e6e3d6', casco: '#eceadf', cruz: '#c0282a', bolso: '#d8d0b8' },
};
const CAJA_INFANTE = [-15, -46, 35, 6];
function infanteCuerpo(ctx, tipo, s) {
  const P = PAL_BASTION, T = TRAJES_BASTION[tipo] || TRAJES_BASTION.soldado;
  const paso = s.caminando ? Math.sin(s.fase || 0) : 0, sube = s.caminando ? Math.abs(Math.cos(s.fase || 0)) * 0.8 : 0;
  const rodilla = tipo === 'francotirador' && !s.caminando;   // el tirador espera con una rodilla en tierra
  sombraPiso(ctx, rodilla ? 12 : 9, 2.8, 0.32, 4, 1.2);
  const bota = c => { c.moveTo(-2, 10.6); c.lineTo(2.2, 10.6); c.quadraticCurveTo(5, 11.6, 5.1, 14.2); c.lineTo(-2.3, 14.2); c.closePath(); };
  const pierna = (x, ang, col) => {
    ctx.save(); ctx.translate(x, -14.6); ctx.rotate(ang);
    pb(ctx, tramo(0, 0, 0.4, 11.8, 4.4, 3.4, 0.4), col, { sombra: 0.5, linea: 0.4 });
    pb(ctx, bota, P.bota, { sombra: 0.4, linea: 0.4 });
    ctx.restore();
  };
  const baja = rodilla ? 6.4 : 0;
  if (rodilla) {   // pierna de atrás: rodilla al piso y la canilla tendida hacia atrás
    pb(ctx, tramo(-0.6, -8.4, 1.6, -1.6, 4.4, 3.8), ajustarColor(T.tela, -0.2), { sombra: 0.5, linea: 0.4 });
    pb(ctx, tramo(1.6, -1.6, -8, -1.4, 3.6, 3), ajustarColor(T.tela, -0.2), { sombra: 0.5, linea: 0.4 });
    pb(ctx, rr(-12.6, -3.4, 5, 3.6, 1.2), P.bota, { sombra: 0.4, linea: 0.4 });
  } else pierna(-0.6, -paso * 0.5, ajustarColor(T.tela, -0.2));
  ctx.save(); ctx.translate(0, baja - sube);
  const ang = s.apunta || 0, hom = tipo === 'lanzallamas' ? { x: 1.2, y: -20.6 } : { x: 0.8, y: -23.6 };
  const enArma = (x, y) => ({ x: hom.x + x * Math.cos(ang) - y * Math.sin(ang), y: hom.y + x * Math.sin(ang) + y * Math.cos(ang) });
  // Lo que lleva a la espalda
  if (tipo === 'lanzallamas') {   // dos tanques de combustible y la botella de presión
    pb(ctx, rr(-11.6, -29.6, 4, 14, 1.8), ajustarColor(T.tanque, -0.12), { sombra: 0.5, brillo: 0.35 });
    pb(ctx, rr(-8.2, -30.4, 4.2, 14.8, 1.9), T.tanque, { sombra: 0.5, brillo: 0.4 });
    pb(ctx, rr(-11.8, -24.6, 8, 1.8, 0.6), T.banda, { sombra: 0.3, linea: 0.35, brillo: false });
    pb(ctx, rr(-10.2, -15.4, 6, 2.6, 1.2), P.acero, { sombra: 0.3, linea: 0.35, brillo: 0.3 });
    if (!Pincel.silueta) { linea(ctx, P.aceroOsc, 0.8, [[-6, -30.6], [-6, -32.4]]); linea(ctx, P.aceroOsc, 0.8, [[-9.6, -29.8], [-9.6, -31.4]]); }
  } else if (tipo === 'medico') {
    pb(ctx, rr(-8, -27.4, 4.8, 9.6, 1.6), T.bolso, { sombra: 0.5 });
    if (!Pincel.silueta) { detalle(ctx, T.cruz, c => { c.rect(-6.4, -24.6, 1.5, 4.4); c.rect(-7.8, -23.2, 4.3, 1.5); }); }
  } else if (tipo !== 'francotirador') pb(ctx, rr(-7.4, -27.6, 4.2, 9.2, 1.6), P.odOsc, { sombra: 0.5 });
  // Brazo de atrás
  if (tipo === 'medico') brazoB(ctx, -0.4, -24.4, 4.6, -15.4, ajustarColor(T.tela, -0.22));
  else { const apoyo = enArma(tipo === 'lanzallamas' ? 9 : tipo === 'francotirador' ? 13 : 11, 1.1); brazoB(ctx, -0.4, -24.4, apoyo.x, apoyo.y, ajustarColor(T.tela, -0.22), tipo === 'francotirador' ? 6.6 : 5.6); }
  if (rodilla) {   // pierna de adelante: el muslo hacia adelante y la canilla derecha
    pb(ctx, tramo(0.8, -14.6, 7.4, -14.4, 4.6, 4), T.tela, { sombra: 0.5, linea: 0.4 });
    pb(ctx, tramo(7.4, -14.4, 7.8, -8.6, 3.8, 3.2), T.tela, { sombra: 0.5, linea: 0.4 });
    ctx.save(); ctx.translate(7.6, -20.6 + 0.2); pb(ctx, bota, P.bota, { sombra: 0.4, linea: 0.4 }); ctx.restore();
  } else pierna(0.8, paso * 0.5, T.tela);
  // Torso, chaleco y cinturón
  pb(ctx, c => { c.moveTo(-4, -14); c.lineTo(-4.4, -25); c.quadraticCurveTo(-4, -27.6, -1.4, -27.8); c.lineTo(2.2, -27.8); c.quadraticCurveTo(4.6, -27.4, 4.6, -24.8); c.lineTo(4, -14); c.closePath(); }, T.tela);
  pb(ctx, rr(-3.8, -26.4, 8.2, 9.6, 1.4), T.chaleco, { sombra: 0.6 });
  if (!Pincel.silueta) {
    if (tipo === 'medico') detalle(ctx, T.cruz, c => { c.rect(-0.6, -24.6, 1.8, 5.6); c.rect(-2.5, -22.7, 5.6, 1.8); });   // la cruz roja en el pecho
    else {
      pb(ctx, rr(3.2, -23.4, 2.4, 4.2, 0.6), ajustarColor(T.chaleco, -0.12), { sombra: 0.3, linea: 0.35, brillo: 0.2 });
      linea(ctx, ajustarColor(T.chaleco, -0.35), 0.4, [[-3.6, -22.6], [3, -22.6]]); linea(ctx, ajustarColor(T.chaleco, -0.35), 0.4, [[-3.6, -20.4], [3, -20.4]]);
    }
  }
  pb(ctx, rr(-4.4, -15.8, 8.8, 2, 0.6), P.correa, { sombra: 0.3, linea: 0.35, brillo: false });
  if (tipo === 'medico') {   // el botiquín, colgado adelante
    pb(ctx, rr(1.6, -17.2, 7.4, 6, 1), T.bolso, { sombra: 0.4, linea: 0.4, brillo: 0.3 });
    if (!Pincel.silueta) { detalle(ctx, T.cruz, c => { c.rect(4.6, -16.2, 1.4, 4); c.rect(3.3, -14.9, 4, 1.4); }); linea(ctx, P.correa, 0.7, [[2.4, -17.2], [-1, -27]]); }
  }
  // Cabeza: cuello, cara de perfil y lo que lleva puesto
  pb(ctx, rr(-0.6, -29.4, 3, 2.4, 0.6), ajustarColor(P.piel, -0.1), { sombra: 0.3, linea: 0.3, brillo: false });
  pb(ctx, c => { c.moveTo(-2.4, -31); c.quadraticCurveTo(-2.6, -34.6, 0.6, -34.8); c.quadraticCurveTo(3.8, -34.8, 4.2, -32.4); c.lineTo(4.9, -31.2); c.lineTo(4.3, -30.6); c.quadraticCurveTo(4.2, -28.6, 1.6, -28.4); c.quadraticCurveTo(-1.8, -28.4, -2.4, -31); }, P.piel, { sombra: 0.5, linea: 0.4 });
  if (tipo === 'francotirador') {   // capucha de camuflaje con hilachas que le caen por la espalda y sobre la cara
    pb(ctx, c => { c.moveTo(-5.4, -29.6); c.quadraticCurveTo(-6.2, -38.6, 1, -38.4); c.quadraticCurveTo(6.4, -38, 6.2, -32.6); c.lineTo(4.4, -33); c.quadraticCurveTo(1, -34.4, -1.2, -31.6); c.lineTo(-2, -27); c.lineTo(-5.6, -17.4); c.lineTo(-8.4, -19); c.closePath(); }, T.casco, { sombra: 0.7, brillo: 0.2 });
    if (!Pincel.silueta) {
      for (let k = 0; k < 9; k++) {
        const x = -7.6 + azar(k, 71) * 12.6, y = -37.4 + azar(k, 72) * 10, l = 2.4 + azar(k, 73) * 3.4;
        linea(ctx, T.hilachas[k % 3], 0.7, [[x, y], [x - 0.8 + azar(k, 74) * 1.2, y + l]]);
      }
      detalle(ctx, '#1e1a16', circulo(2.6, -31.5, 0.42));
    }
  } else {
    pb(ctx, c => { c.moveTo(-3.6, -31.4); c.quadraticCurveTo(-3.8, -37.4, 1, -37.6); c.quadraticCurveTo(5.6, -37.4, 5.4, -32.6); c.lineTo(6, -32); c.lineTo(-3.9, -31); c.closePath(); }, T.casco, { sombra: 0.7, brillo: 0.3 });
    if (!Pincel.silueta) {
      linea(ctx, ajustarColor(T.casco, -0.35), 0.5, [[-3.4, -33.2], [5.2, -33.4]]);
      if (tipo === 'medico') detalle(ctx, T.cruz, c => { c.rect(0.2, -37, 1.5, 3.4); c.rect(-0.8, -36, 3.5, 1.4); });   // cruz en el casco
      if (tipo === 'lanzallamas') {   // antiparras ámbar y máscara
        pb(ctx, rr(1, -32.9, 3.9, 2.4, 1), '#e0a030', { sombra: 0.3, linea: 0.4, brillo: 0.5 });
        pb(ctx, c => { c.moveTo(1.8, -30.6); c.lineTo(5.4, -30.8); c.lineTo(5.8, -28.6); c.lineTo(3, -27.6); c.lineTo(1.4, -28.4); c.closePath(); }, '#26272a', { sombra: 0.3, linea: 0.35, brillo: 0.2 });
        detalle(ctx, '#4a4c50', circulo(4.9, -28.9, 0.9));
      } else { detalle(ctx, '#1e1a16', circulo(2.6, -31.5, 0.42)); linea(ctx, '#2a2620', 0.35, [[-1.6, -31], [-0.6, -28.6]]); }
    }
  }
  // El arma (gira desde el hombro)
  if (tipo !== 'medico') {
    ctx.save(); ctx.translate(hom.x, hom.y); ctx.rotate(ang);
    if (tipo === 'francotirador') {   // fusil largo envuelto en arpillera, con la mira grande, el bípode y el freno de boca
      pb(ctx, c => { c.moveTo(-6.4, -1.4); c.lineTo(-0.6, -1.7); c.lineTo(-0.4, 1.3); c.lineTo(-6, 2.6); c.closePath(); }, '#6f6844', { sombra: 0.3, linea: 0.35, brillo: 0.2 });
      pb(ctx, rr(-0.6, -1.8, 10, 3.2, 0.5), '#7d7550', { sombra: 0.4, linea: 0.35, brillo: 0.25 });
      pb(ctx, c => { c.moveTo(4, 1.2); c.lineTo(5.6, 1.2); c.lineTo(5.9, 3.6); c.lineTo(4.6, 3.8); c.closePath(); }, '#2a2b28', { sombra: 0.3, linea: 0.3, brillo: false });
      pb(ctx, rr(1, -4.9, 9.4, 2.5, 1.1), '#202122', { sombra: 0.2, linea: 0.3, brillo: 0.4 });
      if (!Pincel.silueta) { detalle(ctx, '#6fa8c8', elipse(10.4, -3.65, 0.5, 1)); linea(ctx, '#202122', 0.6, [[3.4, -2.6], [3.4, -1.8]]); linea(ctx, '#202122', 0.6, [[8, -2.6], [8, -1.8]]); }
      pb(ctx, rr(9.2, -1.3, 7.4, 2.4, 0.6), '#756d4a', { sombra: 0.3, linea: 0.35, brillo: 0.2 });
      pb(ctx, rr(16.4, -0.7, 11, 1.2, 0.3), '#1f201e', { sombra: 0.2, linea: 0.3, brillo: false });
      pb(ctx, rr(26.6, -1.2, 2.8, 2.2, 0.4), '#2a2b2c', { sombra: 0.2, linea: 0.3 });
      if (rodilla && !Pincel.silueta) { linea(ctx, '#2a2b2c', 0.7, [[15.4, 1], [13.6, 7.6]]); linea(ctx, '#2a2b2c', 0.7, [[15.4, 1], [17.6, 7.6]]); }
    } else if (tipo === 'lanzallamas') {   // lanza: caño con funda perforada, la boquilla y la manguera a los tanques
      if (!Pincel.silueta) { ctx.strokeStyle = '#1c1d1f'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-1.6, 0.8); ctx.quadraticCurveTo(-7, 6, -9, -1); ctx.stroke(); }
      pb(ctx, rr(-2.4, -1.5, 5.4, 3.4, 0.8), '#3a3c40', { sombra: 0.3, linea: 0.35, brillo: 0.25 });
      pb(ctx, c => { c.moveTo(0.4, 1.6); c.lineTo(2.4, 1.6); c.lineTo(1.8, 4.8); c.lineTo(0.2, 4.6); c.closePath(); }, '#2a2b28', { sombra: 0.3, linea: 0.3, brillo: false });
      pb(ctx, rr(3, -1, 11, 2.2, 0.6), '#55595e', { sombra: 0.3, linea: 0.35, brillo: 0.35 });
      if (!Pincel.silueta) for (let k = 0; k < 4; k++) detalle(ctx, '#17181a', circulo(5 + k * 2.2, 0.1, 0.45));
      pb(ctx, c => { c.moveTo(13.6, -1.6); c.lineTo(17.6, -2.2); c.lineTo(17.6, 2.4); c.lineTo(13.6, 1.8); c.closePath(); }, '#2b2c2e', { sombra: 0.3, linea: 0.35, brillo: 0.3 });
      pb(ctx, rr(8, 1.2, 2, 3.2, 0.6), '#2a2b28', { sombra: 0.3, linea: 0.3, brillo: false });
    } else {
      pb(ctx, c => { c.moveTo(-5.4, -1.4); c.lineTo(-0.6, -1.6); c.lineTo(-0.4, 1.4); c.lineTo(-5, 2.4); c.closePath(); }, '#2b2c2a', { sombra: 0.3, linea: 0.35, brillo: 0.2 });
      pb(ctx, rr(-0.6, -1.8, 9, 3.2, 0.5), '#33352f', { sombra: 0.4, linea: 0.35, brillo: 0.25 });
      pb(ctx, c => { c.moveTo(4, 1.2); c.lineTo(5.8, 1.2); c.lineTo(6.4, 4.8); c.lineTo(4.9, 5); c.closePath(); }, '#2a2b28', { sombra: 0.3, linea: 0.3, brillo: false });
      pb(ctx, rr(2, -3.6, 3.6, 1.8, 0.5), '#202122', { sombra: 0.2, linea: 0.3, brillo: 0.3 });
      pb(ctx, rr(8.2, -1.5, 6, 2.6, 0.6), '#3b3d36', { sombra: 0.3, linea: 0.35, brillo: 0.2 });
      pb(ctx, rr(14, -0.8, 6.4, 1.2, 0.3), '#1f201e', { sombra: 0.2, linea: 0.3, brillo: false });
    }
    ctx.restore();
  }
  // Brazo de adelante
  if (tipo === 'medico') {
    brazoB(ctx, 1.6, -25.2, 6.6, -17.4, T.tela);
    if (!Pincel.silueta) { pb(ctx, rr(0.2, -24.2, 3.6, 2.8, 0.6), '#f0eee4', { sombra: 0.2, linea: 0.3, brillo: false }); detalle(ctx, T.cruz, c => { c.rect(1.6, -23.8, 0.8, 2); c.rect(1, -23.2, 2, 0.8); }); }   // brazalete
  } else { const gatillo = enArma(tipo === 'lanzallamas' ? 1.2 : 4, tipo === 'lanzallamas' ? 3 : 1.3); brazoB(ctx, 1.6, -25.2, gatillo.x, gatillo.y, T.tela); }
  ctx.restore();
}
// Cada oficio: caminando (8 cuadros), quieto apuntando o tendido en el piso si lo derribaron
function infanteBastion(tipo) {
  return function (ctx, s, t) {
    if (s.aturdidoHasta > t) {
      ctx.save(); ctx.translate(3, -2.6); ctx.rotate(-Math.PI / 2 + 0.07);
      conSprite(ctx, 'i' + tipo + 'c1', CAJA_INFANTE, g => infanteCuerpo(g, tipo, { caminando: true, fase: 1.5 / 8 * 2 * Math.PI }));
      ctx.restore(); return;
    }
    if (s.caminando) {
      const cuadro = Math.floor((((s.fase || 0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * 8);
      conSprite(ctx, 'i' + tipo + 'c' + cuadro, CAJA_INFANTE, g => infanteCuerpo(g, tipo, { caminando: true, fase: (cuadro + 0.5) / 8 * 2 * Math.PI }));
      return;
    }
    const ang = tipo === 'medico' ? 0 : cuant(s.apunta, 0.04);
    conSprite(ctx, 'i' + tipo + 'a' + ang.toFixed(2), CAJA_INFANTE, g => infanteCuerpo(g, tipo, { apunta: ang }));
    if (Pincel.silueta) return;
    if (tipo === 'francotirador' && s.fuego > 0) fogonazoB(ctx, 0.8 + 29.6 * Math.cos(ang), -17.2 + 29.6 * Math.sin(ang), s.fuego, 0.9, ang);
    if (tipo === 'lanzallamas') {   // la llama piloto, siempre prendida
      const x = 1.2 + 18.6 * Math.cos(ang), y = -20.6 + 18.6 * Math.sin(ang);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; Fuego.lengua(ctx, x + 1, y + 1.2, 1.3, 3.4 + Math.sin((t || 0) / 60) * 1, Math.sin((t || 0) / 80) * 0.8, 0.9); ctx.restore();
    }
    if (tipo === 'medico' && s.curando > 0) {   // curando: la cruz late
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0.4, -21.8, 0, 0.4, -21.8, 9); g.addColorStop(0, `rgba(140,255,150,${0.5 * s.curando * (0.6 + 0.4 * Math.sin((t || 0) / 110))})`); g.addColorStop(1, 'rgba(140,255,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0.4, -21.8, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  };
}

Object.assign(DibujoBastion, {
  francotirador: infanteBastion('francotirador'), lanzallamas: infanteBastion('lanzallamas'), medico: infanteBastion('medico'),

  /* Mortero: pozo con media vuelta de bolsas, el tubo apoyado en su placa y su bípode, el servidor agachado con una
   * granada en la mano y el cajón de munición */
  mortero(ctx, u, t) {
    const r = Math.round((u.retroceso || 0) * 3) / 3, roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.4;
    conSprite(ctx, 'mo' + r.toFixed(2) + (roto ? 'r' : ''), [-27, -42, 30, 8], g => DibujoBastion.morteroCuerpo(g, { retroceso: r, vida: roto ? 0 : 1, vidaMax: 1 }));
    if (Pincel.silueta || !(u.fuego > 0)) return;
    fogonazoB(ctx, 10.4, -33.4, u.fuego, 1.1, -1.25);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(210,205,190,${0.3 * u.fuego})`; ctx.beginPath(); ctx.arc(11 + k * 2, -37 - k * 4, 3 + k * 1.6, 0, Math.PI * 2); ctx.fill(); }
  },
  morteroCuerpo(ctx, u) {
    const P = PAL_BASTION, r = u.retroceso || 0, roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.4;
    sombraPiso(ctx, 22, 7.6, 0.34, 4, -6);
    const cy = -10, rx = 18, ry = 8;
    const bolsas = delante => {
      const lista = [];
      for (let capa = 0; capa < 2; capa++) for (let k = 0; k < 15; k++) {
        const a = Math.PI * 2 * k / 15 + capa * 0.21;
        if ((Math.sin(a) > 0) !== delante || (capa === 1 && (delante ? Math.cos(a) < -0.2 : Math.cos(a) < 0.35))) continue;   // la segunda hilera, sólo del lado del campo
        lista.push([rx * Math.cos(a), cy + ry * Math.sin(a) - capa * 3.8, capa, k]);
      }
      lista.sort((p, q) => p[1] + p[2] * 10 - (q[1] + q[2] * 10));
      for (const [x, y, capa, k] of lista) bolsaArena(ctx, x - 4.2, y - 2.3, 8.4, 4.6, ajustarColor(P.arena, (azar(k * 3 + capa, 83) - 0.5) * 0.16 - (roto && k % 4 === 0 ? 0.25 : 0)));
    };
    bolsas(false);
    pb(ctx, c => c.ellipse(0, cy, rx - 3, ry - 2.4, 0, 0, Math.PI * 2), '#4d4636', { sombra: 0.2, brillo: false, contorno: false });
    caja34(ctx, -17, -9.4, -9, 3.4, 4, P.odOsc, ajustarColor(P.odOsc, 0.15));   // cajón de munición
    if (!Pincel.silueta) for (const x of [-15.6, -13.2, -10.8]) { pb(ctx, rr(x, -18.6, 1.9, 5.4, 0.9), '#6f7850', { sombra: 0.3, linea: 0.3, brillo: 0.3 }); detalle(ctx, '#c9a03a', c => c.rect(x, -14.6, 1.9, 0.8)); }
    // Servidor: espalda y casco, agachado junto al tubo
    pb(ctx, rr(-9.4, -21.6, 9, 10.6, 3), P.od, { sombra: 0.6 });
    pb(ctx, rr(-8.8, -20.6, 4, 7.4, 1.4), P.coyote, { sombra: 0.4, linea: 0.35 });
    pb(ctx, c => c.ellipse(-4.4, -24.2, 3.7, 3.1, 0, 0, Math.PI * 2), P.odClaro, { sombra: 0.6, brillo: 0.4 });
    // Placa base, bípode y tubo (retrocede al disparar)
    pb(ctx, c => c.ellipse(4, -8.6, 6.4, 2.6, 0, 0, Math.PI * 2), P.aceroOsc, { sombra: 0.3, brillo: 0.25, linea: 0.4 });
    if (!Pincel.silueta) { linea(ctx, P.aceroOsc, 1.1, [[8.4, -25], [14.4, -7.6]]); linea(ctx, ajustarColor(P.aceroOsc, 0.15), 1.1, [[8.4, -25], [6.4, -6.4]]); linea(ctx, P.acero, 0.7, [[7, -15], [13, -12.6]]); }
    const k = r * 1.8, bx = 4 + 0.3 * k, by = -9 + k, mx = 10.4 + 0.3 * k, my = -32.4 + k;
    pb(ctx, tramo(bx, by, mx, my, 5, 4.2), '#3a3d42', { sombra: 0.5, brillo: 0.4, linea: 0.45 });
    pb(ctx, tramo(bx + (mx - bx) * 0.86, by + (my - by) * 0.86, mx, my, 5.2, 5), '#55595f', { sombra: 0.4, brillo: 0.4, linea: 0.4 });
    if (!Pincel.silueta) { ctx.fillStyle = '#0d0d0e'; ctx.beginPath(); ctx.ellipse(mx + 0.3, my - 0.8, 2.1, 1, -0.28, 0, Math.PI * 2); ctx.fill(); }
    brazoB(ctx, -3.6, -19.6, 3.4, -21.4, P.od, 4.6);
    if (!Pincel.silueta) { pb(ctx, rr(2.6, -24.8, 2.1, 5, 1), '#6f7850', { sombra: 0.3, linea: 0.3, brillo: 0.3 }); detalle(ctx, '#c9a03a', c => c.rect(2.6, -21.4, 2.1, 0.8)); }   // la granada lista
    bolsas(true);
    if (roto && !Pincel.silueta) detalle(ctx, ajustarColor(P.arena, -0.1), elipse(12, 1, 6, 1.6));
  },

  /* Antiaérea: plataforma con tres patas, afuste que gira, dos cañones automáticos que apuntan al cielo, los
   * tambores de munición y el artillero en su asiento detrás del escudo */
  antiaerea(ctx, u, t) {
    const ang = cuant(u.apunta ?? -0.8, 0.08), lado = u.rumbo === -1 ? -1 : 1, roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.4;
    conSprite(ctx, 'aa' + ang.toFixed(2) + lado + (roto ? 'r' : ''), [-30, -56, 30, 8], g => DibujoBastion.antiaereaCuerpo(g, { apunta: ang, rumbo: lado, vida: roto ? 0 : 1, vidaMax: 1 }));
    if (Pincel.silueta || !(u.fuego > 0)) return;
    const k = Math.floor((t || 0) / 70) % 2;   // un cañón por vez
    fogonazoB(ctx, lado * (1 + Math.cos(ang) * 27), -24 + Math.sin(ang) * 27 - (k ? 2.6 : 0), u.fuego, 0.9, lado === 1 ? ang : Math.PI - ang);
  },
  antiaereaCuerpo(ctx, u) {
    const P = PAL_BASTION, ang = u.apunta ?? -0.8, lado = u.rumbo === -1 ? -1 : 1, roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.4;
    sombraPiso(ctx, 22, 7, 0.34, 4, -4);
    // Plataforma y patas con sus platos
    for (const [x, y] of [[-17, -4], [17, -5], [1, 3]]) {
      if (!Pincel.silueta) linea(ctx, P.aceroOsc, 2, [[0, -7], [x, y]]);
      pb(ctx, c => c.ellipse(x, y, 4, 1.7, 0, 0, Math.PI * 2), P.acero, { sombra: 0.3, brillo: 0.3, linea: 0.4 });
    }
    pb(ctx, c => c.ellipse(0, -8, 11.6, 4.8, 0, 0, Math.PI * 2), ajustarColor(P.od, -0.1), { sombra: 0.4, brillo: 0.3 });
    pb(ctx, rr(-4, -19, 8, 11, 1.4), P.odOsc, { sombra: 0.5, brillo: 0.25 });   // pedestal
    ctx.save(); ctx.scale(lado, 1);
    // Artillero en su asiento, detrás del afuste
    pb(ctx, rr(-14.6, -22.4, 8.6, 9.6, 2.6), P.od, { sombra: 0.6 });
    pb(ctx, rr(-14, -21.4, 3.8, 6.8, 1.3), P.coyote, { sombra: 0.4, linea: 0.35 });
    pb(ctx, c => c.ellipse(-10.4, -25.4, 3.6, 3.1, 0, 0, Math.PI * 2), P.odClaro, { sombra: 0.6, brillo: 0.4 });
    pb(ctx, rr(-16.4, -13.6, 9, 2.4, 0.8), P.aceroOsc, { sombra: 0.3, linea: 0.35 });
    // Afuste con los dos cañones (gira hacia arriba)
    ctx.save(); ctx.translate(1, -24); ctx.rotate(ang);
    for (const dy of [1.5, -1.5]) {
      pb(ctx, rr(4, dy - 0.75, 21, 1.5, 0.4), dy > 0 ? '#27282a' : '#34363a', { sombra: 0.2, linea: 0.3, brillo: 0.3 });
      pb(ctx, rr(24, dy - 1.2, 3.4, 2.4, 0.5), '#2a2b2c', { sombra: 0.2, linea: 0.3 });
      pb(ctx, rr(5, dy - 1.2, 6, 2.4, 0.6), '#474b50', { sombra: 0.2, linea: 0.3, brillo: 0.35 });
    }
    pb(ctx, rr(-7, -4.2, 12.6, 8.4, 1.4), '#3d4138', { sombra: 0.5, brillo: 0.3 });
    pb(ctx, c => c.ellipse(-2.6, 5.4, 4, 3.4, 0, 0, Math.PI * 2), ajustarColor(P.od, -0.05), { sombra: 0.4, brillo: 0.35, linea: 0.4 });   // tambor de munición
    if (!Pincel.silueta) { detalle(ctx, '#23261c', circulo(-2.6, 5.4, 1.1)); linea(ctx, '#b08a3c', 0.7, [[-0.6, 3], [2.4, 1.4]]); }
    ctx.restore();
    // Escudo con la mira de anillo, del lado del artillero
    pb(ctx, c => { c.moveTo(-6.4, -33.6); c.lineTo(-3.4, -34.4); c.lineTo(-2.4, -20.4); c.lineTo(-5.8, -19.6); c.closePath(); }, ajustarColor(P.od, 0.05), { sombra: 0.5, brillo: 0.35 });
    if (!Pincel.silueta) { ctx.strokeStyle = '#1d1e1f'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(-1.2, -36.4, 2.2, 0, Math.PI * 2); ctx.moveTo(-3.4, -36.4); ctx.lineTo(1, -36.4); ctx.moveTo(-1.2, -38.6); ctx.lineTo(-1.2, -34.2); ctx.stroke(); }
    brazoB(ctx, -9, -21.6, -4.6, -22.6, P.od, 3.4);
    ctx.restore();
    if (roto && !Pincel.silueta) { linea(ctx, '#2a2620', 0.6, [[-6, -10], [-2, -6], [-4, -3]]); detalle(ctx, 'rgba(20,18,14,0.5)', elipse(6, -9, 3, 1.4)); }
  },

  /* Alambrado: tres caballetes de madera en X unidos por un travesaño, hilos de púas tensados y dos rollos de
   * concertina. No bloquea: los zombies lo cruzan despacio y lo van rompiendo (se cae un caballete, se cortan hilos) */
  alambrado(ctx, u) {
    const d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), nivel = d > 0.65 ? 2 : d > 0.35 ? 1 : 0;
    conSprite(ctx, 'al' + nivel, [-25, -19, 26, 8], g => DibujoBastion.alambradoCuerpo(g, nivel));
  },
  alambradoCuerpo(ctx, nivel = 0) {
    const madera = '#5f4226';
    sombraPiso(ctx, 23, 4.6, 0.26, 0, 2);
    // Rollo de concertina: vueltas de alambre con sus púas; salta: las vueltas que ya arrancaron
    const rollo = (y, alto, x0, x1, alfa, salta) => {
      if (Pincel.silueta) return;
      ctx.lineWidth = 0.55;
      for (let k = 0, n = 11; k < n; k++) {
        if (salta && salta(k)) continue;
        const x = x0 + (x1 - x0) * k / (n - 1);
        ctx.strokeStyle = `rgba(150,157,164,${alfa})`; ctx.beginPath(); ctx.ellipse(x, y, 3.4, alto, 0.22, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(222,227,232,${alfa})`; ctx.fillRect(x - 0.5, y - alto - 0.6, 1, 1.2); ctx.fillRect(x + 2.7, y - 0.5, 1.2, 1);
      }
    };
    rollo(-9, 6.2, -20, 20, 0.5, nivel === 2 ? k => k > 2 && k < 6 : null);                               // el de atrás
    pb(ctx, tramo(-17, -7.5, 17, -7.5, 1.7, 1.7), ajustarColor(madera, -0.14), { sombra: 0.3, linea: 0.35, brillo: 0.15 });   // travesaño
    [-17, 0, 17].forEach((x, i) => {
      if ((nivel >= 1 && i === 2) || (nivel === 2 && i === 0)) {   // caballete partido: queda en el piso
        pb(ctx, tramo(x - 6, 2.2, x + 6, 0.8, 2.1, 1.9), madera, { sombra: 0.3, linea: 0.4 }); return;
      }
      pb(ctx, tramo(x - 5.5, 3, x + 4.5, -16.5, 2.9, 2.3), madera, { sombra: 0.4, linea: 0.45, brillo: 0.2 });
      pb(ctx, tramo(x + 5.5, 3, x - 4.5, -16.5, 2.9, 2.3), ajustarColor(madera, 0.12), { sombra: 0.4, linea: 0.45, brillo: 0.25 });
    });
    if (!Pincel.silueta) for (const y of nivel === 0 ? [-14, -10, -5] : nivel === 1 ? [-14, -5] : [-5]) {   // hilos tensados, con púas
      ctx.strokeStyle = '#8e959c'; ctx.lineWidth = 0.55; ctx.beginPath();
      ctx.moveTo(-20, y + 0.6); ctx.quadraticCurveTo(-8.5, y + 2.2, 0, y + 0.4); ctx.quadraticCurveTo(8.5, y + 2.2, 20, y + 0.6); ctx.stroke();
      for (let x = -17; x <= 17; x += 4.25) {
        const yy = y + 0.5 + 1.3 * Math.sin((x + 20) / 20 * Math.PI) ** 2;
        linea(ctx, '#dde2e7', 0.45, [[x - 0.8, yy - 0.9], [x + 0.8, yy + 0.9]]); linea(ctx, '#dde2e7', 0.45, [[x - 0.8, yy + 0.9], [x + 0.8, yy - 0.9]]);
      }
    }
    rollo(-3.4, 5.2, -21, 21, 0.7, nivel >= 1 ? k => k === 7 || k === 8 : null);                          // el de adelante
  },

  /* Señuelo: trípode con dos bocinas, el amplificador, la luz de sirena y la batería al pie. La luz y las ondas de
   * sonido se pintan por cuadro; el resto, de la caché. Roto (a media vida) queda con la cabeza torcida */
  senuelo(ctx, u, t) {
    const roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.5, ms = t || 0;
    conSprite(ctx, 'se' + (roto ? 'r' : ''), [-18, -45, 20, 8], g => DibujoBastion.senueloCuerpo(g, roto));
    if (Pincel.silueta) return;
    if (Math.sin(ms / 160) > 0) {   // luz de la sirena
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -38, 0, 0, -38, 7); g.addColorStop(0, 'rgba(255,90,70,0.85)'); g.addColorStop(1, 'rgba(255,60,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -38, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    for (let k = 0; k < 3; k++) {   // ondas de sonido que salen de las dos bocinas
      const f = (ms / 900 + k / 3) % 1, r = 5 + f * 15;
      ctx.strokeStyle = `rgba(255,236,170,${0.55 * (1 - f)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(15, -34, r, -0.7, 0.7); ctx.stroke();
      ctx.beginPath(); ctx.arc(-11, -34, r * 0.7, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
    }
  },
  senueloCuerpo(ctx, roto) {
    const P = PAL_BASTION;
    sombraPiso(ctx, 13, 3.4, 0.3, 1, 2);
    caja34(ctx, -10, -2, 4, 4.5, 5.5, '#2b2e32', '#3e4247');   // batería
    if (!Pincel.silueta) { detalle(ctx, '#c0392b', circulo(-8, -6.6, 0.8)); detalle(ctx, '#17181a', circulo(-4.2, -6.6, 0.8)); linea(ctx, '#17181a', 0.6, [[-8, -6.6], [-5.4, -13], [-0.6, -19]]); }
    for (const [px, py, col] of [[-8.5, 1, P.aceroOsc], [8.5, 1, P.aceroOsc], [1, 4.4, P.acero]]) pb(ctx, tramo(0, -27, px, py, 1.3, 1.5), col, { sombra: 0.3, linea: 0.35, brillo: 0.3 });   // trípode
    pb(ctx, tramo(0, -26, 0, -33, 1.6, 1.6), P.acero, { sombra: 0.3, linea: 0.35 });   // mástil
    ctx.save(); ctx.translate(0, -34); if (roto) ctx.rotate(-0.3);
    // Bocinas: la grande mira al campo y la chica, hacia el campamento
    const bocina = (s, largo, boca) => {
      pb(ctx, c => { c.moveTo(s * 3, -1.8); c.lineTo(s * (3 + largo), -boca); c.quadraticCurveTo(s * (4.8 + largo), 0, s * (3 + largo), boca); c.lineTo(s * 3, 1.6); c.closePath(); }, '#8d939a', { sombra: 0.5, brillo: 0.45, linea: 0.4 });
      if (!Pincel.silueta) { ctx.fillStyle = '#26282c'; ctx.beginPath(); ctx.ellipse(s * (3.4 + largo), 0, 1.3, boca * 0.82, 0, 0, Math.PI * 2); ctx.fill(); }
    };
    bocina(-1, 6.5, 3.8); bocina(1, 10, 5.6);
    pb(ctx, rr(-3.4, -3, 6.8, 5.4, 1), P.od, { sombra: 0.4, linea: 0.4, brillo: 0.25 });                       // amplificador
    pb(ctx, c => { c.arc(0, -3, 1.8, Math.PI, 0); c.closePath(); }, '#8a211b', { sombra: 0.2, linea: 0.35, brillo: 0.45 });   // luz de sirena, apagada
    if (roto && !Pincel.silueta) linea(ctx, 'rgba(20,20,22,0.7)', 0.5, [[5, -3], [8, 0.4], [7, 3.4]]);            // abolladura
    ctx.restore();
  },

  /* Torre de vigía: cuatro patas de madera con crucetas, la plataforma con baranda y techo de chapa, y el reflector
   * que barre el piso buscando la tierra removida. No tiene gente ni armas: sólo descubre a los topos */
  vigia(ctx, u, t) {
    const roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.45, ms = t || 0;
    if (!Pincel.silueta && u.listo !== false) {   // el haz, sobre el piso, detrás de la torre
      const R = BASTION2.unidades.vigia.detecta * BASTION2.celda, a = ms / 900;
      ctx.save(); ctx.scale(1, 1 / 1.3); ctx.rotate(a);
      const g = ctx.createRadialGradient(0, 0, 8, 0, 0, R); g.addColorStop(0, 'rgba(255,244,190,0.26)'); g.addColorStop(1, 'rgba(255,244,190,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -0.2, 0.2); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    conSprite(ctx, 'vi' + (roto ? 'r' : ''), [-22, -60, 24, 8], g => DibujoBastion.vigiaCuerpo(g, roto));
    if (Pincel.silueta) return;
    const a = ms / 900, lx = 1 + Math.cos(a) * 3.2;   // el reflector gira
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const h = ctx.createRadialGradient(lx, -37, 0, lx, -37, 7); h.addColorStop(0, `rgba(255,246,200,${0.5 + 0.4 * Math.max(0, Math.sin(a))})`); h.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(lx, -37, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  },
  vigiaCuerpo(ctx, roto) {
    const P = PAL_BASTION, madera = '#6b4b2a', clara = '#8a6638';
    sombraPiso(ctx, 17, 5, 0.3, 4, 1);
    // Patas de atrás y crucetas
    for (const x of [-7.5, 7.5]) pb(ctx, tramo(x, -5, x * 0.8, -31, 2.2, 2), ajustarColor(madera, -0.2), { sombra: 0.4, linea: 0.4 });
    if (!Pincel.silueta) { linea(ctx, ajustarColor(madera, -0.3), 0.9, [[-7.5, -7], [6, -29]]); linea(ctx, ajustarColor(madera, -0.3), 0.9, [[7.5, -7], [-6, -29]]); }
    // Patas de adelante
    for (const x of [-10, 10]) pb(ctx, tramo(x, 1, x * 0.82, -31, 2.8, 2.4), madera, { sombra: 0.4, linea: 0.45, brillo: 0.2 });
    if (!Pincel.silueta) { linea(ctx, clara, 1, [[-10, -2], [8.4, -15]]); linea(ctx, clara, 1, [[10, -2], [-8.4, -15]]); linea(ctx, clara, 1, [[-9, -16], [8, -29]]); linea(ctx, clara, 1, [[9, -16], [-8, -29]]); }
    // Escalera de mano
    if (!Pincel.silueta) { linea(ctx, '#3d2c18', 0.7, [[12.4, 1], [10.4, -30]]); linea(ctx, '#3d2c18', 0.7, [[15, 1], [13, -30]]); for (let k = 0; k < 7; k++) linea(ctx, '#3d2c18', 0.6, [[12.3 - k * 0.3, -3 - k * 4.2], [14.9 - k * 0.3, -3 - k * 4.2]]); }
    // Plataforma, baranda y techo
    caja34(ctx, -11.5, 11.5, -29, 5.6, 2.6, ajustarColor(madera, -0.1), clara);
    if (!Pincel.silueta) for (const x of [-11, -3.6, 3.6, 11]) linea(ctx, madera, 0.9, [[x, -31.6], [x, -39.4]]);
    pb(ctx, rr(-11.8, -40.6, 23.6, 1.6, 0.5), madera, { sombra: 0.3, linea: 0.35, brillo: 0.2 });
    // Reflector sobre su horquilla
    pb(ctx, rr(-0.6, -36, 1.6, 4.6, 0.4), P.aceroOsc, { sombra: 0.2, linea: 0.3, brillo: false });
    pb(ctx, c => c.ellipse(1, -37, 3.6, 3, 0, 0, Math.PI * 2), '#4a4d52', { sombra: 0.4, brillo: 0.4, linea: 0.4 });
    if (!Pincel.silueta) detalle(ctx, roto ? '#55504a' : '#fff3c4', circulo(1.6, -37, 1.9));
    for (const x of [-10.6, 10.6]) pb(ctx, tramo(x, -40, x, -47.4, 1.5, 1.5), madera, { sombra: 0.3, linea: 0.35 });
    pb(ctx, c => { c.moveTo(-14.4, -46.4); c.lineTo(14.4, -46.4); c.lineTo(11.4, -52.6); c.lineTo(-11.4, -52.6); c.closePath(); }, '#7d8388', { sombra: 0.5, brillo: 0.35 });
    if (!Pincel.silueta) { for (let x = -10; x <= 10; x += 4) linea(ctx, 'rgba(40,44,48,0.4)', 0.4, [[x * 1.18, -46.6], [x * 0.98, -52.4]]); linea(ctx, '#2a2b2c', 0.6, [[9, -52.6], [9, -58.6]]); detalle(ctx, '#d84a3a', circulo(9, -58.6, 0.8)); }
    if (roto && !Pincel.silueta) { linea(ctx, '#2a2018', 0.7, [[-9.4, -20], [-6, -17], [-9, -13]]); detalle(ctx, 'rgba(20,16,12,0.5)', poli([[4, -52.6], [9, -52.6], [7.6, -48.6], [3, -49.6]])); }
  },

  /* Soldado caído: tendido boca arriba en su charco, con el resplandor del contagio que late cada vez más fuerte y
   * el reloj que se va llenando; cuando se completa, se levanta en contra */
  caido(ctx, u, t) {
    const f = Math.min(1, (u.t || 0) / BASTION2.contagio), pulso = 0.5 + 0.5 * Math.sin((t || 0) / 110);
    if (!Pincel.silueta) { ctx.fillStyle = 'rgba(90,8,8,0.55)'; ctx.beginPath(); ctx.ellipse(-13, 1.5, 16, 3.8, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(3, -2.6); ctx.rotate(-Math.PI / 2 + 0.07);
    conSprite(ctx, '34' + 'sa0.00', [-11, -42, 26, 3], g => DibujoBastion.soldadoCuerpo(g, { apunta: 0 }, 0));
    ctx.restore();
    if (Pincel.silueta) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(-14, -4, 0, -14, -4, 24); g.addColorStop(0, `rgba(150,255,90,${0.14 + 0.3 * f * pulso})`); g.addColorStop(1, 'rgba(150,255,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-14, -4, 26, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(10,8,6,0.65)'; ctx.beginPath(); ctx.arc(-14, -18, 4.6, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#b6ff5c'; ctx.beginPath(); ctx.arc(-14, -18, 4.6, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
  },
});
// El soldado de siempre, tendido si lo derribaron; y el búnker, con una marca por cada uno de los de adentro
(() => {
  const soldadoV1 = DibujoBastion.soldado, bunkerV1 = DibujoBastion.bunker;
  DibujoBastion.soldado = function (ctx, s, t) {
    if (!(s.aturdidoHasta > t)) return soldadoV1(ctx, s, t);
    ctx.save(); ctx.translate(3, -2.6); ctx.rotate(-Math.PI / 2 + 0.07);
    conSprite(ctx, '34' + 'sa0.00', [-11, -42, 26, 3], g => DibujoBastion.soldadoCuerpo(g, { apunta: 0 }, 0));
    ctx.restore();
  };
  const MARCA = { soldado: '#8f9a62', francotirador: '#d8c98a', lanzallamas: '#e8672c', medico: '#f4f2ea' };
  DibujoBastion.bunker = function (ctx, u, t) {
    bunkerV1(ctx, u, t);
    if (Pincel.silueta || !u.dentro || !u.dentro.length) return;
    const n = u.dentro.length, x0 = -(n * 6.4 - 1.4) / 2;
    u.dentro.forEach((d, k) => {
      const x = x0 + k * 6.4;
      ctx.fillStyle = 'rgba(10,8,6,0.7)'; ctx.fillRect(x - 0.8, -50.8, 6.6, 6.6);
      ctx.fillStyle = MARCA[d.tipo] || MARCA.soldado; ctx.fillRect(x, -50, 5, 5);
      if (d.tipo === 'medico') { ctx.fillStyle = '#c0282a'; ctx.fillRect(x + 1.9, -49.2, 1.2, 3.4); ctx.fillRect(x + 0.8, -48.1, 3.4, 1.2); }
      else if (d.tipo === 'francotirador') { ctx.strokeStyle = '#3a3420'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x + 2.5, -47.5, 1.5, 0, Math.PI * 2); ctx.moveTo(x + 0.4, -47.5); ctx.lineTo(x + 4.6, -47.5); ctx.moveTo(x + 2.5, -49.6); ctx.lineTo(x + 2.5, -45.4); ctx.stroke(); }
      else if (d.tipo === 'lanzallamas') { ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(x + 2.5, -49.4); ctx.quadraticCurveTo(x + 4.4, -47, x + 2.5, -45.6); ctx.quadraticCurveTo(x + 0.6, -47, x + 2.5, -49.4); ctx.fill(); }
    });
  };
})();

/* ---------- Zombies: lo que se suma al de siempre ---------- */
(() => {
  const accesorioV1 = Zombie.prototype.accesorio, cuerpoV1 = Zombie.prototype.cuerpo;
  Zombie.prototype.accesorio = function (ctx, est, golpeado) {
    const hy = -79, c = col => golpeado ? ajustarColor(col, 0.7) : col;
    if (est.accesorio === 'casco-antimotin') {   // casco de policía antidisturbios: cubrenuca y el visor levantado a medias, rajado
      pieza(ctx, k => { k.moveTo(-10.4, hy + 13.6); k.lineTo(-10.2, hy + 2); k.quadraticCurveTo(-10.4, hy - 7.6, 0.6, hy - 7.8); k.quadraticCurveTo(10.6, hy - 7.4, 10.8, hy + 2.4); k.lineTo(10.6, hy + 4); k.quadraticCurveTo(0, hy + 2.4, -5.4, hy + 5); k.lineTo(-5, hy + 13.4); }, c('#1b2030'), -10.4, 10.8);
      pieza(ctx, redondo(-10.4, hy - 1, 21.4, 2, 0.9), c('#e8e6dc'), -10.4, 11);
      if (!Pincel.silueta) {
        ctx.fillStyle = golpeado ? 'rgba(255,255,255,0.7)' : 'rgba(150,200,225,0.42)'; ctx.beginPath(); ctx.moveTo(4.6, hy + 1.6); ctx.lineTo(13, hy + 0.6); ctx.quadraticCurveTo(15.4, hy + 6, 13.6, hy + 11.6); ctx.lineTo(7, hy + 11); ctx.closePath(); ctx.fill();
        if (!golpeado) { linea(ctx, 'rgba(235,245,250,0.75)', 0.5, [[5.6, hy + 2.4], [12.4, hy + 1.6]]); linea(ctx, 'rgba(20,30,40,0.6)', 0.45, [[9, hy + 3], [10.6, hy + 6.4], [9.4, hy + 9.6]]); linea(ctx, 'rgba(20,30,40,0.6)', 0.4, [[10.6, hy + 6.4], [12.8, hy + 7.4]]); }
      }
    } else if (est.accesorio === 'megafono') {   // megáfono rojo pegado a la boca
      pieza(ctx, k => { k.moveTo(8.6, hy + 9.4); k.lineTo(20.4, hy + 4); k.quadraticCurveTo(22.6, hy + 11.4, 20.8, hy + 18.4); k.lineTo(8.8, hy + 14); k.closePath(); }, c('#c8322a'), 8.6, 22.6);
      pieza(ctx, k => { k.ellipse(20.8, hy + 11.2, 1.7, 7.3, 0.06, 0, Math.PI * 2); }, c('#ece8dc'), 19, 22.6);
      pieza(ctx, redondo(11, hy + 14.2, 2.6, 5.4, 1), c('#2a2b2e'), 11, 13.6);
      if (!Pincel.silueta && !golpeado) { detalle(ctx, '#26221e', elipse(20.9, hy + 11.2, 0.9, 5.4, 0.06)); linea(ctx, 'rgba(255,240,230,0.5)', 0.5, [[10.4, hy + 10], [18.6, hy + 6.2]]); }
    } else if (est.accesorio === 'casco-minero') {   // casco de minero abollado, con la lámpara prendida al frente
      pieza(ctx, k => { k.moveTo(-9.4, hy + 3.4); k.quadraticCurveTo(-9.6, hy - 7.2, 1, hy - 7.4); k.quadraticCurveTo(10.6, hy - 7, 10.8, hy + 3); }, c('#c9742a'), -9.6, 10.8);
      pieza(ctx, redondo(-10.4, hy + 1.8, 23, 1.9, 0.8), c('#a85c1c'), -10.4, 12.6);
      pieza(ctx, redondo(7.4, hy - 4.6, 4.2, 4, 1), c('#3a3c40'), 7.4, 11.6);
      if (!Pincel.silueta && !golpeado) {
        linea(ctx, 'rgba(60,30,10,0.5)', 0.5, [[-5, hy - 4], [-1, hy - 6.4], [3, hy - 5]]);
        detalle(ctx, '#fff3b0', circulo(10.4, hy - 2.6, 1.5));
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(11, hy - 2.6, 0, 11, hy - 2.6, 9); g.addColorStop(0, 'rgba(255,240,170,0.55)'); g.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(11, hy - 2.6, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    } else accesorioV1.call(this, ctx, est, golpeado);
  };
  Zombie.prototype.cuerpo = function (ctx, golpeado) {
    cuerpoV1.call(this, ctx, golpeado);
    const est = this.estilo;
    if (!est || !(est.escudo || est.hinchado || est.dinamita || est.buche)) return;
    // Lo de arriba va inclinado igual que el torso
    const camina = this.estado === 'camina', s = camina ? Math.sin(this.fase) : 0;
    const col = c => golpeado ? ajustarColor(c, 0.7) : c, ms = this.ahora || 0;
    ctx.save(); ctx.translate(0, -34); ctx.rotate((this.corredor ? 0.32 : 0.16) + Math.abs(s) * 0.04); ctx.translate(0, 34 + (camina ? -Math.abs(Math.cos(this.fase)) * 1.2 : 0));
    if (est.dinamita) {   // cartuchos atados a la espalda, con la mecha prendida
      for (let k = 0; k < 4; k++) pieza(ctx, redondo(-15.6 + k * 2.3, -57 + (k % 2) * 1.2, 2.6, 15.4, 1), col(k % 2 ? '#b8322a' : '#cf4034'), -15.6 + k * 2.3, -13 + k * 2.3);
      pieza(ctx, redondo(-16.2, -51, 10.6, 2.2, 0.8), col('#2a2622'), -16.2, -5.6);
      pieza(ctx, redondo(-16.2, -45.4, 10.6, 2.2, 0.8), col('#2a2622'), -16.2, -5.6);
      if (!Pincel.silueta) {
        ctx.strokeStyle = '#3a3026'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-11, -57); ctx.quadraticCurveTo(-15, -63, -10.4, -66.4); ctx.stroke();
        const ch = 0.6 + 0.4 * Math.sin(ms / 45);   // la chispa de la mecha
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(-10.4, -66.4, 0, -10.4, -66.4, 6 * ch); g.addColorStop(0, 'rgba(255,240,170,0.95)'); g.addColorStop(0.4, 'rgba(255,150,40,0.6)'); g.addColorStop(1, 'rgba(255,90,20,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-10.4, -66.4, 6 * ch, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        for (let k = 0; k < 3; k++) { const a = azar(Math.floor(ms / 50) * 3 + k, 91) * Math.PI * 2, d = 2 + azar(Math.floor(ms / 50) * 3 + k, 92) * 4; ctx.fillStyle = '#fff2b0'; ctx.fillRect(-10.4 + Math.cos(a) * d, -66.4 + Math.sin(a) * d, 0.9, 0.9); }
      }
    }
    if (est.hinchado) {   // panza hinchada a punto de reventar: piel tirante, venas y pústulas que laten
      const late = 1 + 0.035 * Math.sin(ms / (260 - 140 * (this.hincha || 0)));
      pieza(ctx, elipse(3.4, -43.4, 14.6 * late, 15 * late), col(this.piel), -11, 18);
      pieza(ctx, elipse(-7.4, -51, 7, 6), col(this.piel), -14.4, -0.4, { contorno: false });
      if (!Pincel.silueta && !golpeado) {
        ctx.fillStyle = 'rgba(232,240,130,0.32)'; ctx.beginPath(); ctx.ellipse(6, -47, 7.4, 8, 0.3, 0, Math.PI * 2); ctx.fill();   // la piel tirante brilla
        for (const [a, b, c2] of [[[-6, -52], [-1, -46], [-4, -38]], [[10, -54], [12, -47], [9, -40]], [[2, -32], [6, -36], [12, -34]], [[-8, -42], [-3, -40], [0, -34]]]) linea(ctx, 'rgba(60,80,20,0.6)', 0.6, [a, b, c2]);
        detalle(ctx, 'rgba(90,8,8,0.75)', elipse(-1.4, -45, 2.6, 1.5, 0.4));
        detalle(ctx, 'rgba(30,40,10,0.8)', elipse(11.4, -40.6, 0.9, 1.3));
        const P = this.pustulas || [];
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const p of P) {
          const b = 0.45 + 0.4 * Math.sin(ms / 190 + p.fase) + 0.4 * (this.hincha || 0);
          const g = ctx.createRadialGradient(p.x, p.y + 6, 0, p.x, p.y + 6, p.r * 2.6); g.addColorStop(0, `rgba(240,255,120,${0.75 * b})`); g.addColorStop(1, 'rgba(200,255,60,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y + 6, p.r * 2.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        for (const p of P) { detalle(ctx, '#e6ef7a', circulo(p.x, p.y + 6, p.r)); detalle(ctx, 'rgba(255,255,230,0.8)', circulo(p.x - p.r * 0.3, p.y + 6 - p.r * 0.3, p.r * 0.35)); }
      }
    }
    if (est.buche) {   // el buche del escupidor: una bolsa de ácido bajo la mandíbula, que se hincha antes de escupir
      const lleno = 1 + 0.3 * (this.bocaAbierta || 0) + 0.06 * Math.sin(ms / 240);
      pieza(ctx, elipse(7.6, -57.4, 5.2 * lleno, 4.6 * lleno), col('#d9912a'), 2, 13.4);
      if (!Pincel.silueta && !golpeado) {
        detalle(ctx, 'rgba(255,236,150,0.75)', elipse(6.4, -58.6, 2 * lleno, 1.5 * lleno));
        linea(ctx, 'rgba(110,60,10,0.6)', 0.5, [[4, -55.4], [7.6, -53.4], [11.4, -55.6]]);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(7.6, -57.4, 0, 7.6, -57.4, 11 * lleno); g.addColorStop(0, `rgba(255,190,70,${0.3 + 0.3 * (this.bocaAbierta || 0)})`); g.addColorStop(1, 'rgba(255,150,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(7.6, -57.4, 11 * lleno, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        detalle(ctx, 'rgba(200,230,70,0.85)', elipse(11.4, -66, 1, 2.2, 0.3));   // la baba ácida
      }
    }
    if (est.escudoGrande) {   // El Escudo: un pavés que lo tapa de los ojos a los tobillos, con franjas de obra y la ventana enrejada
      pieza(ctx, elipse(6.6, -56.4, 6.6, 4.8), col('#1b2030'), 0.4, 13.2);
      pieza(ctx, k => { k.moveTo(12.6, -72); k.quadraticCurveTo(24, -74.6, 26.6, -69); k.lineTo(28, -12); k.quadraticCurveTo(21, -6.4, 13.4, -9.6); k.closePath(); }, col('#2a3146'), 12.6, 28);
      if (!Pincel.silueta) {
        ctx.fillStyle = golpeado ? 'rgba(255,255,255,0.75)' : 'rgba(150,200,225,0.42)'; ctx.beginPath(); ctx.moveTo(15, -67); ctx.lineTo(24.6, -67.6); ctx.lineTo(25, -57); ctx.lineTo(15.2, -56.4); ctx.closePath(); ctx.fill();
        if (!golpeado) {
          for (const x of [17.4, 20, 22.6]) linea(ctx, 'rgba(20,24,34,0.85)', 0.6, [[x, -67.2], [x + 0.2, -56.8]]);
          for (const [y0, y1] of [[-53.6, -48.6], [-21, -16]]) {   // franjas amarillas y negras, arriba y abajo
            detalle(ctx, '#e8c23a', k => k.rect(13.8, y0, 13.4, y1 - y0));
            for (let x = 14.2; x < 25.4; x += 4.4) detalle(ctx, '#1a1c22', k => { k.moveTo(x, y1); k.lineTo(x + 2.2, y1); k.lineTo(x + 4.2, y0); k.lineTo(x + 2, y0); k.closePath(); });
          }
          detalle(ctx, 'rgba(110,11,11,0.8)', elipse(21, -36, 3.2, 5, 0.3));
          linea(ctx, 'rgba(12,14,22,0.7)', 0.6, [[16.4, -44], [20.4, -40], [18.2, -31], [22, -26]]);
          for (const [x, y] of [[14.6, -70], [25, -70.6], [15, -11.8], [26, -13]]) detalle(ctx, '#8a8e9a', circulo(x, y, 0.9));
          linea(ctx, 'rgba(255,255,255,0.18)', 0.7, [[13.6, -71], [14.2, -10.4]]);
        }
      }
    } else if (est.escudo) {   // hombrera y escudo antidisturbios, con la ventana y las abolladuras
      pieza(ctx, elipse(6.6, -56.4, 6.2, 4.4), col('#1b2030'), 0.4, 12.8);
      pieza(ctx, k => { k.moveTo(13.4, -62); k.quadraticCurveTo(22.6, -63, 23.4, -58); k.lineTo(24.4, -27); k.quadraticCurveTo(19.4, -22.6, 14, -25.4); k.closePath(); }, col('#262d40'), 13.4, 24.4);
      if (!Pincel.silueta) {
        ctx.fillStyle = golpeado ? 'rgba(255,255,255,0.75)' : 'rgba(150,200,225,0.4)'; ctx.beginPath(); ctx.moveTo(15, -59.6); ctx.lineTo(21.8, -60); ctx.lineTo(22.2, -50.4); ctx.lineTo(15.2, -50); ctx.closePath(); ctx.fill();
        if (!golpeado) {
          linea(ctx, 'rgba(235,245,250,0.6)', 0.5, [[15.6, -59], [21.4, -59.4]]);
          detalle(ctx, '#e8e6dc', k => k.rect(15, -46.4, 7.6, 2.2));
          detalle(ctx, 'rgba(110,11,11,0.8)', elipse(19, -38, 2.4, 3.4, 0.3));
          linea(ctx, 'rgba(12,14,22,0.7)', 0.5, [[16, -34], [19, -31.4], [17.6, -28.4]]);
          linea(ctx, 'rgba(255,255,255,0.18)', 0.6, [[14.4, -61], [14.9, -26.4]]);
        }
      }
    }
    ctx.restore();
  };
})();

/* ---------- El topo: bajo tierra sólo se ve la tierra que remueve; al salir asoma de a poco por el pozo ---------- */
function dibujarTopo(ctx, camaraX, ahora) {
  if (this.estado === 'muerto' || (!this.enterrado && !(this.saliendo > 0))) return Zombie.prototype.dibujar.call(this, ctx, camaraX, ahora);
  const x = this.x - camaraX, y = this.y;
  ctx.save(); ctx.translate(x, y);
  // Montículo y grietas (tenue mientras avanza enterrado: se nota si uno mira)
  const fuerza = this.enterrado ? 0.62 : 1;
  ctx.globalAlpha = fuerza;
  ctx.fillStyle = 'rgba(40,28,16,0.55)'; ctx.beginPath(); ctx.ellipse(0, 1, 13, 4.4, 0, 0, Math.PI * 2); ctx.fill();
  for (const [dx, dy, r, col] of [[-6, -1.4, 5.4, '#6a5338'], [5, -1, 4.8, '#5c482f'], [0, -3, 6.4, '#7a6142'], [-2, 0.6, 4, '#5c482f']]) {
    const bx = dx + Math.sin(ahora / 130 + dx) * (this.enterrado ? 1.2 : 0.3);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, dy, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(30,20,10,0.6)'; ctx.lineWidth = 0.7; ctx.beginPath();
  for (const a of [0.3, 1.5, 2.6, 3.9, 5.2]) { ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 3); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 5.2); }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
  if (this.enterrado) return;
  // Saliendo: el cuerpo sube recortado por el borde del pozo
  const f = 1 - this.saliendo / (this.saleEn || 1), alto = 92 * this.escala;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 60, y - alto - 40, 120, alto + 40); ctx.clip();
  ctx.translate(0, alto * (1 - f) * 0.92);
  Zombie.prototype.dibujar.call(this, ctx, camaraX, ahora);
  ctx.restore();
}

/* ---------- Aves: cuervo y buitre, de perfil, aleteando; mueren cayendo del cielo ---------- */
const AVES_BASTION = { cuervo: { ancho: 22, alto: 14 }, buitre: { ancho: 40, alto: 24 } };
// Ala desde el hombro (x, y), de largo L. a: de -1 (abajo) a 1 (arriba)
function alaAve(ctx, x, y, L, a, color, dedos) {
  const ty = -a * L * 0.92, tx = -L * (0.3 + 0.12 * Math.abs(a));
  pieza(ctx, c => {
    c.moveTo(x + L * 0.24, y);
    c.quadraticCurveTo(x + L * 0.12 + tx * 0.2, y + ty * 0.8, x + tx, y + ty);
    c.quadraticCurveTo(x + tx - L * 0.3, y + ty * 0.5 + L * 0.12, x - L * 0.46, y + 1.4);
    c.closePath();
  }, color, x - L * 0.8, x + L * 0.26);
  if (Pincel.silueta) return;
  // Plumas: del borde de ataque al de fuga, y el borde de ataque con luz
  for (let k = 1; k <= (dedos ? 5 : 3); k++) {
    const f = k / (dedos ? 6 : 4);
    linea(ctx, ajustarColor(color, -0.4), 0.45, [[x + L * 0.2 + (tx - L * 0.2) * f, y + ty * f * 0.92], [x - L * 0.42 + (tx + L * 0.2) * f * 0.75, y + 1.2 + (ty * 0.62 + L * 0.1) * f]]);
  }
  linea(ctx, ajustarColor(color, 0.35), 0.5, [[x + L * 0.22, y - 0.3], [x + L * 0.14 + tx * 0.35, y + ty * 0.62], [x + tx, y + ty]]);
}
function dibujarAve(ctx, z, golpeado) {
  const col = c => golpeado ? ajustarColor(c, 0.7) : c, sil = Pincel.silueta, muerto = z.estado === 'muerto';
  const a = muerto ? 0.85 : Math.sin(z.fase);
  if (z.especie === 'cuervo') {
    const negro = col('#23252e'), azul = col('#3b4159');
    alaAve(ctx, -0.6, -2.6, 13, a * 0.9 + 0.1, col('#15161b'));
    pieza(ctx, poli([[-5.6, -1.8], [-13.6, -4], [-14, -1], [-12.6, 1.2], [-5.6, 2]]), negro, -14, -5.6);
    pieza(ctx, elipse(0, 0, 7.6, 4.2, -0.12), negro, -7.6, 7.6);
    pieza(ctx, circulo(6.6, -2.8, 3.2), negro, 3.4, 9.8);
    pieza(ctx, poli([[8.8, -4], [15, -1.6], [8.8, -0.8]]), col('#5a5440'), 8.8, 15);
    if (!sil) {
      detalle(ctx, golpeado ? '#fff' : '#ff3b2e', circulo(7.6, -3.4, 0.8));
      if (!golpeado) { for (let k = 0; k < 3; k++) linea(ctx, 'rgba(225,215,195,0.75)', 0.45, [[-2.4 + k * 1.9, -0.6], [-1.8 + k * 1.9, 2.4]]); detalle(ctx, 'rgba(110,11,11,0.8)', elipse(-0.4, 1, 2.6, 1.4)); }
      linea(ctx, '#5a5440', 0.6, [[-1, 3.6], [-2.2, 6.8]]); linea(ctx, '#5a5440', 0.6, [[1.6, 3.6], [0.8, 6.8]]);
    }
    alaAve(ctx, 0.6, -2, 14, a, azul);
  } else {
    const pardo = col('#3b3026'), claro = col('#57483a'), carne = col('#b89088');
    alaAve(ctx, -1, -4, 27, a * 0.9 + 0.1, col('#241d17'), true);
    pieza(ctx, poli([[-9, -3], [-21, -5.4], [-22.4, -1], [-20, 3], [-9, 3.4]]), pardo, -22.4, -9);
    pieza(ctx, elipse(0, 0, 12.4, 7.2, -0.1), pardo, -12.4, 12.4);
    if (!sil && !golpeado) { for (let k = 0; k < 4; k++) linea(ctx, 'rgba(225,215,195,0.7)', 0.5, [[-4 + k * 2.6, -1], [-3 + k * 2.6, 4]]); detalle(ctx, 'rgba(110,11,11,0.8)', elipse(-0.6, 1.6, 4.4, 2.2)); }
    // Patas con las garras abiertas
    if (!sil) for (const x of [-2, 3]) { linea(ctx, '#8a7a56', 1, [[x, 6], [x + 1, 11.4]]); for (const d of [-2, 0, 2]) linea(ctx, '#2a2620', 0.7, [[x + 1, 11.4], [x + 1 + d, 14.4]]); }
    pieza(ctx, poli(segmento(9.4, -3.4, 15.6, -9.4, 4.6, 3.4)), carne, 8, 17);   // cuello pelado
    pieza(ctx, elipse(9.6, -3, 4.6, 3.6), col('#ddd6c6'), 5, 14.2);               // gola
    pieza(ctx, circulo(17, -10.4, 3.5), carne, 13.5, 20.5);
    pieza(ctx, k => { k.moveTo(19.6, -12); k.lineTo(24.6, -10.4); k.quadraticCurveTo(25.2, -8, 23.4, -6.6); k.lineTo(22.8, -8.6); k.lineTo(19.6, -8.4); k.closePath(); }, col('#d8cfae'), 19.6, 25.2);
    if (!sil) { detalle(ctx, golpeado ? '#fff' : '#ff3b2e', circulo(18.2, -11.2, 0.85)); detalle(ctx, '#2a2620', poli([[23.6, -9.6], [25, -8.6], [23.4, -6.6], [23, -8.4]])); }
    alaAve(ctx, 0.6, -3.4, 28, a, claro, true);
  }
}
class AveBastion extends Zombie {
  constructor(especie, dificultad) {
    super(0, true, dificultad);
    this.ave = true; this.animal = true; this.especie = especie; this.E = AVES_BASTION[especie];
    this.colorSangre = '#7a0d0d'; this.colorCharco = 'rgba(80, 6, 6, 0.7)'; this.fase = Math.random() * 6;
  }
  caja() { const w = this.ancho, h = Math.max(this.alto, 16); return { x: this.x - w / 2, y: this.y - this.altura - h / 2 - 2, w, h }; }
  tamañoVoz() { return this.especie === 'buitre' ? 1 : 0.4; }
  sonidoMuerte() { Audio_.animalMuere(this.tamañoVoz()); }
  cuerpo(ctx, golpeado) { ctx.scale(this.direccion * this.escala, this.escala); dibujarAve(ctx, this, golpeado); }
  recibirDano(cantidad, direccion, arma, juego) {
    const vivo = this.estado !== 'muerto';
    super.recibirDano(cantidad, direccion, arma, juego);
    if (!vivo || this.estado !== 'muerto') return;
    const d = direccion || -this.direccion;
    this.muerte = { vx: d * (0.6 + Math.random() * 1.2), vy: -(1 + Math.random() * 1.2), giro: 0, vgiro: d * (0.12 + Math.random() * 0.1), quieto: false };
    for (let k = 0; k < (this.especie === 'buitre' ? 9 : 5); k++) juego.particulas.push(new Particula(this.x + (Math.random() - 0.5) * 8, this.y - this.altura, (Math.random() - 0.5) * 2.4, -Math.random() * 1.6, k % 2 ? '#2a2b34' : '#4a4038', 0.9 + Math.random() * 0.6, 2 + Math.random() * 1.6, true, this.ySuelo));   // plumas
  }
  moverCadaver(dt, juego) {
    this.tiempoMuerto += dt;
    const M = this.muerte; if (!M || M.quieto) return;
    const paso = dt * 60;
    M.vy += 0.35 * paso; this.altura -= M.vy * paso; this.x += M.vx * paso; M.giro += M.vgiro * paso;
    if (this.altura <= 0) { this.altura = 0; M.quieto = true; M.giro = Math.PI * (M.vgiro > 0 ? 1 : -1); juego.salpicar(this.x, this.y - 3, this.colorSangre, 6, 3, this.ySuelo); Audio_.cuerpoAnimalCae(this.tamañoVoz(), 0.6); }
  }
  terminado() { return this.estado === 'muerto' && this.tiempoMuerto > 3.6; }
  dibujar(ctx, camaraX, ahora) {
    if (this.estado !== 'muerto') return super.dibujar(ctx, camaraX, ahora);
    this.ahora = ahora;
    const M = this.muerte || { giro: Math.PI, quieto: true };
    ctx.save(); ctx.translate(this.x - camaraX, this.y);
    ctx.globalAlpha = 1 - limitar((this.tiempoMuerto - 2.2) / 1.4, 0, 1);
    if (M.quieto) { ctx.fillStyle = this.colorCharco; ctx.beginPath(); ctx.ellipse(0, 2, 9 * this.escala, 2.6 * this.escala, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.translate(0, -this.altura - 4 * this.escala); ctx.rotate(M.giro);
    this.cuerpo(ctx, false);
    ctx.restore();
  }
}

/* ---------- Retratos y lo que se pinta sobre la escena en cada cuadro ---------- */
const BastionV2Dibujo = {
  // Caja de cada unidad para retratarla: [x0, y0, x1, y1] alrededor de sus pies
  CAJAS: { soldado: [-13, -43, 27, 4], francotirador: [-15, -40, 33, 6], lanzallamas: [-15, -44, 30, 4], medico: [-13, -43, 22, 4], torreta: [-27, -39, 37, 8], tanque: [-30, -52, 58, 8],
    mortero: [-27, -42, 30, 8], antiaerea: [-30, -56, 30, 8], muro: [-26, -35, 31, 8], alambrado: [-25, -21, 26, 8], bunker: [-29, -57, 35, 8], senuelo: [-22, -46, 26, 8], vigia: [-24, -60, 26, 8] },
  posar(g, tipo) {
    if (tipo === 'soldado') DibujoBastion.soldadoCuerpo(g, { apunta: 0 }, 0);
    else if (TRAJES_BASTION[tipo]) infanteCuerpo(g, tipo, { apunta: 0 });
    else if (tipo === 'alambrado') DibujoBastion.alambradoCuerpo(g, 0);
    else if (tipo === 'senuelo') DibujoBastion.senueloCuerpo(g, false);
    else if (tipo === 'antiaerea') DibujoBastion.antiaereaCuerpo(g, { apunta: -0.8, rumbo: 1, vida: 1, vidaMax: 1 });
    else if (tipo === 'mortero') DibujoBastion.morteroCuerpo(g, { retroceso: 0, vida: 1, vidaMax: 1 });
    else if (tipo === 'vigia') DibujoBastion.vigiaCuerpo(g, false);
    else DibujoBastion[tipo + 'Cuerpo'](g, { adentro: 2, vida: 1, vidaMax: 1, apunta: 0 }, 0);
  },
  // Chorro del lanzallamas: lenguas que crecen desde la boquilla hasta donde llega, en la dirección en que tira
  chorro(ctx, cam, u, ahora) {
    const inf = u.clase === 'inf', ang = u.anguloLlama || 0, co = Math.cos(ang), se = Math.sin(ang);
    const largo = (u.alcanceFuego || 88) / Math.hypot(co, se * 1.3) * Math.min(1, u.llama * 1.6);
    const x0 = u.x + (inf ? 18 * co : 20 * co), y0 = u.y + (inf ? 3 * se : 10 * se), alto0 = inf ? 20 : 9;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 13; k++) {
      const f = (k + ((ahora / 60) % 1)) / 13, P = cam.proyectar(x0 + co * largo * f, y0 + se * largo * f, alto0 * (1 - f * 0.75) + Math.sin(ahora / 50 + k) * 1.5);
      const r = (4.5 + 12 * f) * P.s * (0.85 + 0.3 * azar(k + Math.floor(ahora / 45), 17)), a = (1 - f * 0.7) * u.llama;
      const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, r);
      g.addColorStop(0, `rgba(255,240,170,${0.7 * a})`); g.addColorStop(0.45, `rgba(255,140,40,${0.5 * a})`); g.addColorStop(1, 'rgba(200,50,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },
  encima(j) {
    const ctx = j.ctx, cam = j.camaraBastion(), ahora = j.ahora, B = BASTION, [W, H] = B.celda, CELDA = BASTION2.celda;
    ctx.save(); ctx.setTransform(Lienzo.escala, 0, 0, Lienzo.escala, 0, 0);
    ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Círculo sobre el piso alrededor de (x, y) (en el plano la fila vale 1,3)
    const anillo = (x, y, radio, color, guion, grosor = 1.3) => {
      ctx.strokeStyle = color; ctx.lineWidth = grosor; ctx.setLineDash(guion || []); ctx.beginPath();
      for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, q = cam.proyectar(x + Math.cos(a) * radio, y + Math.sin(a) * radio / 1.3); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
      ctx.stroke(); ctx.setLineDash([]);
    };
    const cartel = (texto, x, y, color, px = 9) => {
      ctx.font = `bold ${px}px "Trebuchet MS", sans-serif`; ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(20,8,6,0.8)'; ctx.strokeText(texto, x, y); ctx.fillStyle = color; ctx.fillText(texto, x, y);
    };
    const celda = (c, f) => [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, k]) => cam.proyectar(B.baseX + (c + i) * W, B.arriba + (f + k) * H));
    const pintarCelda = (c, f, relleno, borde) => {
      const q = celda(c, f); ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      if (relleno) { ctx.fillStyle = relleno; ctx.fill(); } if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = 1.2; ctx.stroke(); }
      return q;
    };
    // Hasta dónde llega una unidad de ese tipo parada en (x, y). op.tiro: también el alcance del arma (por op.factor si
    // tira desde un búnker); op.teVen: desde dónde la ve un zombie común
    const radios = (tipo, x, y, op = {}) => {
      const U = B.unidades[tipo]; if (!U) return;
      if (op.teVen && (U.clase === 'inf' || U.clase === 'mec' || tipo === 'bunker')) {
        const radio = BASTION2.zombies.caminante.vista * CELDA;
        anillo(x, y, radio, 'rgba(255,120,95,0.8)', [2, 4]);
        const arriba = cam.proyectar(x, y - radio / 1.3), abajo = cam.proyectar(x, y + radio / 1.3);
        cartel(t('b2.teVen'), arriba.x, arriba.y > 46 ? arriba.y - 5 : abajo.y + 11, '#ff9c88');
      }
      if (op.tiro && U.alcance) anillo(x, y, U.alcance * (op.factor || 1), U.soloAire ? 'rgba(150,215,255,0.9)' : 'rgba(255,230,170,0.9)', [6, 5], 1.6);   // el arma (celeste: sólo le tira a lo que vuela)
      if (U.minimo) anillo(x, y, U.minimo, 'rgba(255,190,90,0.75)', [3, 3]);          // el mortero no tira más cerca que esto
      if (U.cura) anillo(x, y, U.radio, 'rgba(140,255,150,0.7)', [5, 4]);              // hasta dónde cura el médico
      if (U.atrae) anillo(x, y, U.atrae * CELDA, 'rgba(255,230,170,0.6)', [5, 5]);     // hasta dónde llama el señuelo
      if (U.detecta) anillo(x, y, U.detecta * CELDA, 'rgba(255,244,190,0.75)', [6, 4]);  // hasta dónde descubre la torre de vigía
      if (tipo === 'tanque') anillo(x, y, BASTION2.zombies.topo.topo.tanque * CELDA, 'rgba(255,244,190,0.5)', [2, 5]);   // por su peso, ningún topo pasa por debajo
    };

    // Gas del tóxico: nubes verdes que giran sobre el piso, y el borde hasta donde daña
    for (const n of j.nubesV2) {
      const f = n.t / n.dura, a = Math.min(1, n.t * 3) * (1 - Math.max(0, f - 0.7) / 0.3);
      for (let k = 0; k < 7; k++) {
        const ang = k / 7 * Math.PI * 2 + ahora / 2400 * (k % 2 ? 1 : -1), d = n.radio * (0.2 + 0.5 * azar(k, 5));
        const P = cam.proyectar(n.x + Math.cos(ang) * d, n.y + Math.sin(ang) * d / 1.3, 8 + azar(k, 6) * 12), r = n.radio * (0.45 + 0.25 * azar(k, 7)) * P.s;
        const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, r); g.addColorStop(0, `rgba(175,235,70,${0.36 * a})`); g.addColorStop(1, 'rgba(120,200,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, Math.PI * 2); ctx.fill();
      }
      anillo(n.x, n.y, n.radio, `rgba(195,255,95,${0.55 * a})`, [3, 4]);
    }
    // Charcos de ácido del escupidor: una mancha que burbujea y se va apagando
    for (const c of j.charcosV2) {
      const a = Math.min(1, c.t * 4) * (1 - Math.max(0, c.t / c.dura - 0.7) / 0.3), P = cam.proyectar(c.x, c.y), rx = c.radio * P.s, ry = rx / 1.3 * 0.62;
      const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, rx); g.addColorStop(0, `rgba(215,235,70,${0.6 * a})`); g.addColorStop(0.7, `rgba(150,200,40,${0.45 * a})`); g.addColorStop(1, 'rgba(120,170,30,0)');
      ctx.save(); ctx.translate(P.x, P.y); ctx.scale(1, ry / rx); ctx.translate(-P.x, -P.y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (let k = 0; k < 4; k++) { const f = ((ahora / 500 + k * 0.27 + c.x * 0.01) % 1), bx = P.x + (azar(k, 21) - 0.5) * rx * 1.3, by = P.y + (azar(k, 22) - 0.5) * ry * 1.2 - f * 5 * P.s; ctx.fillStyle = `rgba(235,250,150,${0.7 * a * (1 - f)})`; ctx.beginPath(); ctx.arc(bx, by, (1 + f * 1.6) * P.s, 0, Math.PI * 2); ctx.fill(); }
    }
    // Lo prendido fuego y los chorros de los lanzallamas
    for (const z of j.zombies) if (z.estado !== 'muerto' && z.quemaHasta > ahora) enCamara(ctx, cam, z.x, z.y, g => Fuego.cuerpo(g, 0, z, ahora));
    for (const u of j.unidades) if (u.llama > 0.05 && !u.quitada) this.chorro(ctx, cam, u, ahora);
    // Granadas del mortero: dónde va a caer, la sombra y la granada en su arco
    for (const g of j.granadasV2) {
      const f = Math.min(1, g.t / g.dur), x = g.x0 + (g.x - g.x0) * f, piso = g.y0 + (g.y - g.y0) * f, alto = (g.alto0 || 0) * (1 - f) + Math.sin(f * Math.PI) * 120;
      anillo(g.x, g.y, g.radio, `rgba(255,120,80,${0.25 + 0.5 * f})`, [4, 4], 1.2);
      const S = cam.proyectar(x, piso), P = cam.proyectar(x, piso, alto);
      ctx.fillStyle = 'rgba(10,8,6,0.3)'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 3.4 * S.s, 1.3 * S.s, 0, 0, Math.PI * 2); ctx.fill();
      const f2 = Math.min(1, f + 0.03), P2 = cam.proyectar(g.x0 + (g.x - g.x0) * f2, g.y0 + (g.y - g.y0) * f2, (g.alto0 || 0) * (1 - f2) + Math.sin(f2 * Math.PI) * 120);
      ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(Math.atan2(P2.y - P.y, P2.x - P.x));
      ctx.fillStyle = '#3d4138'; ctx.beginPath(); ctx.ellipse(0, 0, 3.6 * P.s, 1.5 * P.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9a03a'; ctx.fillRect(-3.8 * P.s, -1.5 * P.s, 1.2 * P.s, 3 * P.s);
      ctx.restore();
    }
    // Lo que arroja la horda, en su arco: escupitajos, cascotes del lanzador y fardos del Coloso; y dónde va a caer
    for (const p of j.arrojadosV2) {
      const f = Math.min(1, p.t / p.dur), x = p.x0 + (p.x - p.x0) * f, piso = p.y0 + (p.y - p.y0) * f, alto = (p.alto0 || 0) * (1 - f) + Math.sin(f * Math.PI) * (p.alto || 60);
      const acido = p.tipo === 'escupitajo';
      anillo(p.x, p.y, p.radio, acido ? `rgba(200,240,90,${0.25 + 0.45 * f})` : `rgba(255,170,90,${0.25 + 0.45 * f})`, [3, 4], 1.1);
      const S = cam.proyectar(x, piso), P = cam.proyectar(x, piso, alto);
      ctx.fillStyle = 'rgba(10,8,6,0.28)'; ctx.beginPath(); ctx.ellipse(S.x, S.y, (acido ? 3 : p.tipo === 'fardo' ? 8 : 5) * S.s, (acido ? 1.2 : 2.4) * S.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(f * (acido ? 2 : 7) * (p.x < p.x0 ? -1 : 1)); ctx.scale(P.s, P.s);
      if (acido) {
        ctx.fillStyle = 'rgba(190,230,60,0.95)'; ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(240,255,170,0.9)'; ctx.beginPath(); ctx.arc(-1, -0.8, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(190,230,60,0.5)'; ctx.beginPath(); ctx.arc(5, 1.4, 1.6, 0, Math.PI * 2); ctx.arc(8, 2.4, 1, 0, Math.PI * 2); ctx.fill();
      } else if (p.tipo === 'fardo') {   // fardo de pasto atado
        ctx.fillStyle = '#c9a646'; ctx.strokeStyle = '#6b5420'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.roundRect(-9, -6, 18, 12, 3); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#8a6c28'; ctx.lineWidth = 0.6; ctx.beginPath(); for (const xx of [-5, 0, 5]) { ctx.moveTo(xx, -6); ctx.lineTo(xx, 6); } ctx.stroke();
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(9, -2); ctx.moveTo(-9, 2.4); ctx.lineTo(9, 2.4); ctx.stroke();
      } else {   // cascote
        ctx.fillStyle = '#8a8478'; ctx.strokeStyle = '#3a362e'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(-1.6, -5); ctx.lineTo(4, -3.6); ctx.lineTo(5.4, 1); ctx.lineTo(1.6, 4.6); ctx.lineTo(-4, 3.4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,250,235,0.3)'; ctx.beginPath(); ctx.moveTo(-3.4, -2.2); ctx.lineTo(-1, -4); ctx.lineTo(2, -3); ctx.lineTo(-1, -1); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // Estelas del francotirador y del cañón
    for (const r of j.rayosV2) {
      const a = cam.proyectar(r.x0, r.b0, r.b0 - r.y0), b = cam.proyectar(r.x1, r.b1, r.b1 - r.y1), k = r.t / r.dura;
      ctx.strokeStyle = `rgba(255,200,120,${0.35 * k})`; ctx.lineWidth = r.grueso * 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,250,225,${k})`; ctx.lineWidth = r.grueso; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // Estallidos de la antiaérea
    for (const x of j.flakV2) {
      const f = x.t / x.dura, P = cam.proyectar(x.x, x.y, x.alto), r = (4 + 9 * f) * P.s;
      if (f < 0.25) { ctx.fillStyle = `rgba(255,210,120,${1 - f * 4})`; ctx.beginPath(); ctx.arc(P.x, P.y, r * 0.7, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = `rgba(40,38,36,${0.6 * (1 - f)})`; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, Math.PI * 2); ctx.arc(P.x + r * 0.7, P.y - r * 0.3, r * 0.7, 0, Math.PI * 2); ctx.fill();
    }
    // El grito: anillos que se abren sobre el piso hasta donde lo oyen
    for (const o of j.ondasV2) {
      const f = o.t / o.dura;
      for (const d of [0, 0.22]) { const g = f - d; if (g > 0) anillo(o.x, o.y, o.radio * g, `rgba(225,150,255,${0.8 * (1 - g)})`, null, 2.2 * (1 - g) + 0.6); }
    }
    // Avisos sobre los zombies: «!» del que acaba de ver a alguien, y por dónde va a embestir el toro
    for (const z of j.zombies) {
      if (z.estado === 'muerto') continue;
      if (z.alerta > ahora && z.presa) {
        const P = cam.proyectar(z.x, z.y), y = P.y - ((z.barraAlto ?? 88 * z.escala) + 12) * P.s;
        ctx.globalAlpha = Math.min(1, (z.alerta - ahora) / 300); cartel('!', P.x, y, '#ffd23a', 14); ctx.globalAlpha = 1;
      }
      if (z.tipoBastion === 'rabioso' && z.estado === 'camina') {   // las rayas de la velocidad
        const P = cam.proyectar(z.x, z.y); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); for (const h of [14, 22, 30]) { const yy = P.y - h * z.escala * P.s * 1.6; ctx.moveTo(P.x + 7 * P.s, yy); ctx.lineTo(P.x + (16 + (h % 9)) * P.s, yy); } ctx.stroke();
      }
      if (z.descubierto > ahora) {   // el topo que descubrieron la torre de vigía o el tanque
        const P = cam.proyectar(z.x, z.y); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(ahora / 80); cartel('!', P.x, P.y - 34 * P.s, '#fff3b0', 15); ctx.globalAlpha = 1;
      }
      if (z.modo === 'aviso' || z.modo === 'carga') {
        const L = BASTION2.zombies.toro.embestida.largo * CELDA, x0 = z.modo === 'carga' ? z.cargaX0 : z.x, y0 = z.modo === 'carga' ? z.cargaY0 : z.y;
        const a = cam.proyectar(z.x, z.y), b = cam.proyectar(x0 + z.cargaDx * L, y0 + z.cargaDy * L);
        ctx.strokeStyle = `rgba(255,90,70,${z.modo === 'aviso' ? 0.45 + 0.4 * Math.sin(ahora / 70) : 0.3})`; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // Avisos sobre lo propio: derribados, curados y delatados por un grito
    for (const u of j.unidades) {
      if (u.invisible || u.quitada || u.tipo === 'caido') continue;
      const P = cam.proyectar(u.x, u.y, u.techoVisto || 0);   // (arriba de un contenedor, a su altura)
      if (u.aturdidoHasta > ahora) for (let k = 0; k < 3; k++) {   // estrellitas dando vueltas
        const a = ahora / 220 + k * 2.1, x = P.x + (Math.cos(a) * 8 - 8) * P.s, y = P.y - (16 + Math.sin(a) * 2.4) * P.s;
        ctx.fillStyle = '#ffe36a'; ctx.beginPath();
        for (let i = 0; i < 10; i++) { const r = (i % 2 ? 1.1 : 2.6) * P.s, b = i / 10 * Math.PI * 2 - Math.PI / 2; i ? ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r) : ctx.moveTo(x + Math.cos(b) * r, y + Math.sin(b) * r); }
        ctx.closePath(); ctx.fill();
      }
      if (u.curadoEn > ahora - 450) { const f = ((ahora / 700) + u.x * 0.01) % 1; ctx.globalAlpha = 1 - f; cartel('+', P.x + 7 * P.s, P.y - (38 + f * 12) * P.s, '#8cff9a', 12); ctx.globalAlpha = 1; }
      if (u.delatadoHasta > ahora) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(ahora / 90); cartel('!', P.x, P.y - (u.bloquea ? 62 : 46) * P.s, '#e9a0ff', 13); ctx.globalAlpha = 1; }
    }

    // El Escudo: detrás de él, la zona donde no entra una bala tirada desde el piso
    for (const z of j.zombies) {
      const C = z.estado !== 'muerto' && BASTION2.zombies[z.tipoBastion] && BASTION2.zombies[z.tipoBastion].cubre; if (!C) continue;
      const R = C.radio * CELDA, lat = 0.5 + 0.2 * Math.sin(ahora / 300);
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + i / 24 * Math.PI, q = cam.proyectar(z.x - 4 + Math.cos(a) * R, z.y + Math.sin(a) * R / 1.3); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
      ctx.closePath(); ctx.fillStyle = `rgba(120,170,230,${0.1 + 0.05 * lat})`; ctx.fill();
      ctx.strokeStyle = `rgba(160,205,255,${lat})`; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      const arriba = cam.proyectar(z.x + R * 0.45, z.y - R / 1.3);
      cartel(t('b2.aCubierto'), arriba.x, arriba.y - 4, '#bcd9ff');
    }
    // Lo que se tiene en la mano (por poner o por mover): dónde entra según el suelo y, si es gente, los puestos altos libres
    const enMano = j.colocando === 'mover' ? j.moviendo && (j.moviendo.tipo === 'bunker' ? j.moviendo.dentro[j.moviendo.dentro.length - 1] : j.moviendo) : null;
    const tipoEnMano = enMano ? enMano.tipo : j.colocando, UM = !j.terminado && B.unidades[tipoEnMano];
    if (UM) {
      const no = [], si = [];
      for (let f = 0; f < j.filas; f++) for (let c = 0; c < j.cols; c++) {
        const suelo = j.terrenoEn(c, f), porte = (BASTION2.suelos[suelo] || {}).porte;
        if (suelo === 'agua' || porte === 'pared' || porte === 'alto' || j.obstaculoEn(c, f)) continue;   // ahí no va nada (los puestos altos se marcan aparte)
        (BastionV2.noAguanta(suelo, tipoEnMano) ? no : si).push([c, f]);
      }
      // Si casi ningún suelo lo aguanta (una torreta en la arena), se marcan las celdas donde sí entra; si no, se tachan las que no
      if (no.length > si.length) for (const [c, f] of si) pintarCelda(c, f, 'rgba(120,230,120,0.2)', 'rgba(180,245,180,0.6)');
      else for (const [c, f] of no) {
        const q = pintarCelda(c, f, 'rgba(240,80,70,0.2)');
        ctx.strokeStyle = 'rgba(240,80,70,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); ctx.lineTo(q[2].x, q[2].y); ctx.moveTo(q[1].x, q[1].y); ctx.lineTo(q[3].x, q[3].y); ctx.stroke();
      }
      // Puestos altos libres (el techo de un contenedor, una cornisa): sólo para la gente a pie
      const mueve = j.colocando === 'mover' && j.moviendo && j.moviendo.tipo !== 'bunker' ? j.moviendo : null;
      if (UM.clase === 'inf') for (const a of j.altosV2 || []) {
        if (j.motivoNoColocar(tipoEnMano, a.c, a.f, true, mueve)) continue;
        const q = a.techo ? [[-21, -7], [21, -7], [21, 7], [-21, 7]].map(([dx, dy]) => cam.proyectar(a.x + dx, a.y + dy / 1.3, a.alto))
          : [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, k]) => cam.proyectar(B.baseX + (a.c + i) * W, B.arriba + (a.f + k) * H, a.alto));
        const m = cam.proyectar(a.x, a.y - (a.techo ? 0 : 8), a.alto + 9 + 3 * Math.sin(ahora / 200));
        ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
        ctx.fillStyle = 'rgba(120,230,120,0.3)'; ctx.fill(); ctx.strokeStyle = 'rgba(190,255,190,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#c8ffc8'; ctx.beginPath(); ctx.moveTo(m.x, m.y - 5 * m.s); ctx.lineTo(m.x + 4.5 * m.s, m.y + 1.5 * m.s); ctx.lineTo(m.x - 4.5 * m.s, m.y + 1.5 * m.s); ctx.closePath(); ctx.fill();
      }
    }

    const U = j.colocando && B.unidades[j.colocando];
    if (U && j.puntero && !j.terminado) {
      const { c, f } = j.celdaDe(j.puntero.x, j.puntero.y);
      if (j.dentro(c, f)) {   // (el alcance de tiro en el piso lo pinta el modo de siempre)
        const p = j.centroCelda(c, f), arriba = U.clase === 'inf' && j.alturaEn(c, f);
        radios(j.colocando, p.x, p.y, arriba ? { tiro: true, factor: BASTION2.altura.alcance } : { teVen: true });
      }
    }
    // La unidad elegida en el campo: una marca a sus pies y hasta dónde llega desde donde está
    const elegida = j.elegidaVivaV2(), moviendo = j.colocando === 'mover' ? j.moviendo : null;
    if (elegida && elegida !== moviendo && !j.terminado) {
      const late = 0.55 + 0.35 * Math.sin(ahora / 160);
      if (elegida.bloquea && !elegida.enCamino) pintarCelda(elegida.c, elegida.f, 'rgba(255,255,255,0.1)', `rgba(255,255,255,${late})`);   // lo que ocupa su celda: la celda
      else if (elegida.techo) pintarCelda(elegida.c, elegida.f, null, `rgba(255,255,255,${late})`);                                      // arriba de un contenedor: su celda
      else anillo(elegida.x, elegida.y, 15, `rgba(255,255,255,${late})`, null, 2);                                                      // quien camina: a sus pies
      if (elegida.tipo === 'bunker') for (const tipo of new Set(elegida.dentro.map(d => d.tipo))) radios(tipo, elegida.x, elegida.y, { tiro: true, factor: B.unidades.bunker.masAlcance });   // desde adentro tiran más lejos
      else if (elegida.listo) radios(elegida.tipo, elegida.x, elegida.y, { tiro: true, factor: elegida.techo ? BASTION2.altura.alcance : 1 });
    }
    // Mover: a quién se eligió, si puede ir adonde está el puntero y hasta dónde llegaría desde ahí
    if (j.colocando === 'mover' && !j.terminado) {
      const u = j.moviendo, pc = j.puntero ? j.celdaDe(j.puntero.x, j.puntero.y) : null;
      if (u && !u.quitada) {
        anillo(u.x, u.y, u.bloquea ? 23 : 15, `rgba(255,255,255,${0.6 + 0.4 * Math.sin(ahora / 120)})`, null, 2);
        if (pc && j.dentro(pc.c, pc.f) && !(pc.c === u.c && pc.f === u.f)) {
          const tipo = u.tipo === 'bunker' ? u.dentro[u.dentro.length - 1].tipo : u.tipo, ok = !j.motivoNoColocar(tipo, pc.c, pc.f, true, u.tipo === 'bunker' ? null : u);
          pintarCelda(pc.c, pc.f, ok ? 'rgba(120,230,120,0.28)' : 'rgba(240,80,70,0.3)');
          const a = cam.proyectar(u.x, u.y), d = j.centroCelda(pc.c, pc.f), b = cam.proyectar(d.x, d.y);
          ctx.strokeStyle = ok ? 'rgba(200,255,200,0.7)' : 'rgba(255,150,140,0.6)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
          if (ok) {
            const alBunker = (j.ocupadaPor(pc.c, pc.f) || {}).tipo === 'bunker', alTecho = !!j.alturaEn(pc.c, pc.f);   // en un búnker o arriba de un contenedor se tira más lejos y no se queda a mano
            radios(tipo, d.x, d.y, { tiro: true, teVen: !alBunker && !alTecho, factor: alBunker ? B.unidades.bunker.masAlcance : alTecho ? BASTION2.altura.alcance : 1 });
          }
        }
      } else if (pc && j.dentro(pc.c, pc.f)) pintarCelda(pc.c, pc.f, j.movibleEnV2(pc.c, pc.f) ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.4)');
    }
    ctx.restore();
  },
};
