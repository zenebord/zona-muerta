/* ===== Personajes (skins) =====
 * El sobreviviente de siempre y ocho personajes inspirados en arquetipos conocidos, con diseños propios
 * (sin nombres, logos ni emblemas de marcas registradas). Cada skin cambia colores, si lleva mochila o capa,
 * cómo es el torso y qué tiene en la cabeza. Se elige en el menú principal y queda guardada.
 */
const SKINS = {
  // Soldado de proporciones reales: camisa de combate oliva con parche, portaplacas coyote, pantalón camuflado,
  // rodilleras, botas de desierto, guantes arena, barba corta y pañuelo shemagh al cuello
  sobreviviente: { torso: 'soldado', cabeza: 'soldado', shemagh: '#a68b66',
    colores: { piel: '#d39d76', pelo: '#2f2219', chaqueta: '#5d6248', antebrazo: '#5d6248', parche: '#7a7258', chaleco: '#9a8262', bolsillo: '#8d7555',
      pantalon: '#7c7a5e', camo: ['#56633f', '#9a8a64', '#4c3f30', '#b6a47e'], rodillera: '#a88d66', bota: '#8f714f', suela: '#4b3d2e',
      guante: '#a3885f', cinturon: '#86704f', bolsa: '#8d7555', funda: '#7a6548', correa: '#7a6548' } },
  // Dios del trueno: cota de malla, peto de acero, brazales y rodilleras de acero, cinturón de cuero con hebilla de oro
  trueno: { torso: 'placas', cabeza: 'casco-alado', capa: '#a3221c', barba: '#c99a3f', trenza: true,
    colores: { chaqueta: '#3b3e46', antebrazo: '#3b3e46', chaleco: '#6f7680', bolsillo: '#b9c0ca', pantalon: '#2b2d34', rodillera: '#8f98a3', bota: '#4a3322', suela: '#2a1c12',
      cinturon: '#5a3d24', guante: '#4a3322', pelo: '#d6ae55', bolsa: '#3b3e46', funda: '#3b3e46', brazal: '#8f98a3', hebilla: '#c9a24e', rayaPierna: '#1e2026',
      sinBolsillo: true, sinCartucheras: true, sinFunda: true } },
  // Armadura de combate: traje gris acero, guantes, brazales y rodilleras naranjas, una franja naranja por la pierna
  armadura: { torso: 'armadura', cabeza: 'casco-armadura',
    colores: { piel: '#c0c4ca', chaqueta: '#5b616b', antebrazo: '#5b616b', chaleco: '#626873', bolsillo: '#c8641c', pantalon: '#4b5058', rodillera: '#c8641c', bota: '#3b3f46', suela: '#1e2024',
      guante: '#c8641c', cinturon: '#3b3f46', bolsa: '#4b5058', funda: '#3b3f46', brazal: '#c8641c', hebilla: '#9aa2ad', rayaPierna: '#c8641c',
      sinBolsillo: true, sinCartucheras: true, sinFunda: true } },
  // Cazador: campera de trabajo con manga larga, pantalón cargo oscuro, sin rodilleras; el cuchillo en la funda
  cazador: { torso: 'chaqueta', cabeza: 'mascara',
    colores: { chaqueta: '#4c5138', antebrazo: '#4c5138', pantalon: '#2e2f34', bota: '#1e1a16', guante: '#4a3b2c', piel: '#c9a58a', bolsa: '#3a3b30', funda: '#2a2622', cinturon: '#2a1e14',
      rodillera: '#2e2f34', hebilla: '#6a6e72', sinRodillera: true, sinCartucheras: true } },
  // Centinela: traje azul con la franja plateada por la pierna, guantes y botas rojas, cinturón de cuero con bolsas
  centinela: { torso: 'traje', cabeza: 'casco-centinela',
    colores: { chaqueta: '#25365f', antebrazo: '#25365f', chaleco: '#2d4173', pantalon: '#25365f', rodillera: '#25365f', bota: '#8e2620', suela: '#3a0f0c', guante: '#8e2620', cinturon: '#6c5a3a',
      bolsa: '#6c5a3a', funda: '#25365f', gorra: '#25365f', hebilla: '#d8dce3', rayaPierna: '#d8dce3', sinBolsillo: true, sinRodillera: true, sinFunda: true } },
  // Bufón: traje violeta a rayas finas, manga larga, zapatos oscuros
  bufon: { torso: 'bufon', cabeza: 'payaso', faldon: true,
    colores: { chaqueta: '#5c2a7c', antebrazo: '#5c2a7c', chaleco: '#3f8a3c', bolsillo: '#e39a22', pantalon: '#5c2a7c', rodillera: '#5c2a7c', bota: '#2a1e2a', guante: '#5c2a7c', piel: '#eeeae2',
      pelo: '#3fa04a', cinturon: '#2a1e2a', bolsa: '#5c2a7c', funda: '#2a1e2a', hebilla: '#d9c06a', rayaPierna: '#7a46a0', sinBolsillo: true, sinRodillera: true, sinCartucheras: true, sinFunda: true } },
  // Rey de los mares: escamas con manga larga, brazales y cinturón de oro, guantes anaranjados
  mares: { torso: 'escamas', cabeza: 'pelo-largo', barba: '#8a6430',
    colores: { chaqueta: '#1d7c6c', antebrazo: '#1d7c6c', chaleco: '#27a089', pantalon: '#205c3c', rodillera: '#205c3c', bota: '#205c3c', suela: '#0f2e1e', guante: '#c48a2a', cinturon: '#c9a227',
      pelo: '#a07a3c', bolsa: '#205c3c', funda: '#205c3c', brazal: '#c9a227', hebilla: '#ead07a', sinBolsillo: true, sinRodillera: true, sinCartucheras: true, sinFunda: true } },
  // Vaquero: camisa arremangada, vaquero azul con la costura clara, revólver en la funda de cuero
  vaquero: { torso: 'cuero', cabeza: 'sombrero', panuelo: '#a8261e',
    colores: { chaqueta: '#9a7a52', chaleco: '#4b3221', pantalon: '#3d4f6e', rodillera: '#3d4f6e', bota: '#5a3a22', suela: '#2a1a10', guante: '#6b4a2b', cinturon: '#3a2414', bolsa: '#5a3a22',
      funda: '#5a3a22', correa: '#3a2414', gorra: '#6b4a2b', hebilla: '#c9ccd0', rayaPierna: '#7a8ca8', sinBolsillo: true, sinRodillera: true, sinCartucheras: true } },
  // Ninja: todo negro, vendas en los antebrazos, faja roja
  ninja: { torso: 'ninja', cabeza: 'ninja',
    colores: { chaqueta: '#1e1f26', antebrazo: '#1e1f26', chaleco: '#282a32', pantalon: '#1e1f26', rodillera: '#1e1f26', bota: '#16171c', guante: '#16171c', cinturon: '#7a1e1e', bolsa: '#1e1f26',
      funda: '#16171c', gorra: '#1e1f26', brazal: '#33353f', hebilla: '#7a1e1e', sinBolsillo: true, sinRodillera: true, sinCartucheras: true, sinFunda: true } },
};
const ORDEN_SKINS = Object.keys(SKINS);
// La skin del jugador: la suya si tiene (vista previa) o la elegida en la configuración
const skinDe = j => SKINS[j && j.skin] || SKINS[Config.get('skin')] || SKINS.sobreviviente;

/* ---------- Detrás del cuerpo: capa y faldón ----------
 * Tela pesada que cae del hombro: el borde de afuera ondea al caminar, el ruedo hace ondas, adentro se ve el forro
 * más oscuro y los pliegues bajan del hombro abriéndose. Con largo < 1 es el faldón del saco (más corto, abierto atrás). */
function dibujarCapa(ctx, color, ty, t, mov, largo = 1) {
  const ond = Math.sin(t / 220) * 1.5 + mov * 3;
  const fin = -12 - (1 - largo) * 24;
  const ruedo = largo < 1
    ? [[-17.4 - ond * 1.6, fin + 0.6], [-15.6 - ond * 1.4, fin - 3], [-13.8 - ond * 1.2, fin + 0.4], [-11.4 - ond, fin - 0.4]]   // faldón: abierto en dos colas
    : [[-19.8 - ond * 1.8, fin + 1.8], [-17.2 - ond * 1.5, fin - 0.4], [-14.6 - ond * 1.2, fin + 1.4], [-11.8 - ond, fin - 0.2]];
  const forma = c => {
    c.moveTo(-1.2, -59.8 + ty); c.quadraticCurveTo(-8.4, -60.6 + ty, -10.6, -55 + ty);         // sobre el hombro, desde el broche
    c.quadraticCurveTo(-16.4 - ond, -36 + ty, -22 - ond * 2, fin);                             // borde de afuera
    for (const [x, y] of ruedo) c.lineTo(x, y);                                                  // ruedo
    c.quadraticCurveTo(-7.6, -32 + ty, -1.4, -57.4 + ty);                                        // borde de adentro, pegado a la espalda
  };
  ctx.save();
  if (largo < 1) { ctx.translate(-6, 0); ctx.scale(0.62, 1); ctx.translate(6, 0); }   // faldón: más angosto que una capa
  pintura(ctx, forma, color, { sombra: 1.1, brillo: 0.3, y0: -60 + ty, y1: fin });
  if (Pincel.silueta) { ctx.restore(); return; }
  dentroDe(ctx, forma, () => {
    // Forro: la franja de adentro, en sombra, y la sombra del cuerpo arriba
    ctx.fillStyle = ajustarColor(color, -0.42); ctx.beginPath();
    ctx.moveTo(-7.4, -54 + ty); ctx.quadraticCurveTo(-9.6, -34 + ty, -11.8 - ond, fin); ctx.lineTo(-9, fin); ctx.quadraticCurveTo(-6, -36 + ty, -3, -57 + ty); ctx.fill();
    const g = ctx.createLinearGradient(0, -60 + ty, 0, -40 + ty); g.addColorStop(0, 'rgba(20,10,8,0.35)'); g.addColorStop(1, 'rgba(20,10,8,0)');
    ctx.fillStyle = g; ctx.fillRect(-30, -62 + ty, 32, 24);
    // Pliegues: bajan del hombro y se abren hacia el ruedo; al lado de cada uno, el filo que agarra la luz
    for (let k = 0; k < 3; k++) {
      const x1 = -13.4 - k * 2.6 - ond * (1 + k * 0.3), y1 = fin + (k === 1 ? -0.4 : 1);
      raya(ctx, ajustarColor(color, -0.4), 0.7, curvaPts(-9.6 - k * 0.4, -53 + ty, -12.4 - k * 1.4 - ond * 0.6, -38 + ty, x1, y1));
      raya(ctx, ajustarColor(color, 0.22), 0.4, curvaPts(-10.4 - k * 0.4, -52 + ty, -13.4 - k * 1.4 - ond * 0.6, -38 + ty, x1 - 1, y1 - 0.6));
    }
  });
  raya(ctx, ajustarColor(color, -0.5), 0.5, ruedo);   // canto del ruedo
  ctx.restore();
}

/* ---------- Torso de cada skin ---------- */
// Torso del soldado, dibujado de perfil con su ancho real (sin el estiramiento de los otros torsos):
// camisa de combate oliva, portaplacas coyote con placa adelante y atrás, faja, portacargadores, radio y bolsa de granada
function torsoSoldado(ctx, C, ty) {
  const V = C.chaleco, y = v => v + ty;
  pintura(ctx, c => { c.moveTo(-6.4, y(-33.6)); c.quadraticCurveTo(-8.4, y(-44), -7.8, y(-53)); c.quadraticCurveTo(-7, y(-58.6), -2.6, y(-59.4)); c.lineTo(3, y(-59.2));
    c.quadraticCurveTo(7.4, y(-57.6), 7.6, y(-50)); c.quadraticCurveTo(7.6, y(-41), 5.8, y(-33.6)); }, C.chaqueta);
  pintura(ctx, c => c.roundRect(-12.6, y(-52), 2.8, 7.4, 0.8), '#3a3b36', { sombra: 0.5, linea: 0.35 });          // radio en la espalda
  raya(ctx, '#1e1f1c', 0.8, [[-11.6, y(-52)], [-12.6, y(-63)]]);                                                  // antena
  pintura(ctx, c => c.roundRect(-10.4, y(-56.4), 4.4, 18.6, 1.4), V, { sombra: 0.8 });                            // placa de atrás
  pintura(ctx, c => c.roundRect(-8.6, y(-45), 16.4, 7.4, 1.2), ajustarColor(V, -0.05), { sombra: 0.6 });          // faja
  pintura(ctx, c => c.roundRect(4.4, y(-56.6), 4.8, 17.2, 1.4), V, { sombra: 0.8 });                              // placa de adelante
  // Hombrera acolchada que pasa por arriba del hombro y une las dos placas
  pintura(ctx, c => { c.moveTo(-9.6, y(-55.6)); c.quadraticCurveTo(-8, y(-60.8), -1, y(-60.4)); c.quadraticCurveTo(5.6, y(-60.2), 8, y(-55.4)); c.lineTo(5.2, y(-55));
    c.quadraticCurveTo(3.4, y(-57.8), -1, y(-58)); c.quadraticCurveTo(-6.2, y(-58.2), -7, y(-55.2)); }, ajustarColor(V, 0.05), { sombra: 0.5, linea: 0.4 });
  if (!Pincel.silueta) {   // cintas para enganchar (MOLLE) en las placas y en la faja
    for (let k = 0; k < 4; k++) { const yy = y(-53 + k * 3.4); raya(ctx, ajustarColor(V, -0.3), 0.45, [[-10.2, yy], [-6.2, yy]]); raya(ctx, ajustarColor(V, -0.3), 0.45, [[4.6, yy], [9, yy]]); }
    for (let k = 0; k < 2; k++) raya(ctx, ajustarColor(V, -0.28), 0.45, [[-8.2, y(-42.8 + k * 2.8)], [7.4, y(-42.8 + k * 2.8)]]);
  }
  pintura(ctx, c => c.roundRect(-3, y(-44.6), 4.2, 5.8, 1.6), C.bolsillo, { sombra: 0.5, linea: 0.35 });          // bolsa de granada
  pintura(ctx, c => c.roundRect(-3.2, y(-45), 4.6, 1.8, 0.6), ajustarColor(C.bolsillo, -0.1), { sombra: 0.3, brillo: 0.2, linea: 0.3 });
  // Portacargadores sobre el pecho: los cargadores asoman arriba y la tapa lleva abrojo
  pintura(ctx, c => c.roundRect(9.6, y(-53), 2.4, 3, 0.5), '#2c2c2e', { sombra: 0.3, linea: 0.3 });
  pintura(ctx, c => c.roundRect(8.8, y(-51), 4.4, 10, 1.1), C.bolsillo, { sombra: 0.6 });
  pintura(ctx, c => c.roundRect(8.6, y(-51.4), 4.8, 3, 0.8), ajustarColor(C.bolsillo, -0.08), { sombra: 0.4, brillo: 0.25, linea: 0.35 });
  detalle(ctx, ajustarColor(C.bolsillo, 0.25), c => c.rect(9.6, y(-50.6), 2.8, 0.8));
  pintura(ctx, c => c.roundRect(4.8, y(-57.2), 4, 4.4, 0.9), ajustarColor(V, 0.08), { sombra: 0.4, linea: 0.35 });   // bolsillo de mapas
}
// Barba corta y tupida: patilla, bigote, mentón con volumen y la boca entre el bigote y la barba
function barbaCorta(ctx, color, hy) {
  pintura(ctx, c => { c.moveTo(-2.6, hy + 7.2); c.lineTo(-1.2, hy + 7.4); c.quadraticCurveTo(-0.4, hy + 10.6, 3.2, hy + 11.2); c.quadraticCurveTo(5.6, hy + 11.4, 6.8, hy + 10.2);
    c.quadraticCurveTo(8.6, hy + 9.8, 9.6, hy + 10.6); c.lineTo(9.7, hy + 11.3); c.lineTo(8.4, hy + 11.7); c.lineTo(9.3, hy + 12.4);
    c.quadraticCurveTo(10.2, hy + 15.6, 8, hy + 17.4); c.quadraticCurveTo(3.6, hy + 19.2, -0.6, hy + 17.4); c.quadraticCurveTo(-3.6, hy + 16.6, -4.2, hy + 13); c.quadraticCurveTo(-3.6, hy + 10, -2.6, hy + 7.2); },
  color, { sombra: 0.6, brillo: 0.16, linea: 0.4 });
  if (!Pincel.silueta) {
    for (let k = 0; k < 12; k++) { const x = -2.4 + azar(k, 501) * 10.6, yy = hy + 12 + azar(k, 502) * 5; raya(ctx, ajustarColor(color, 0.22), 0.35, [[x, yy], [x + 0.4, yy + 1.2]]); }
    detalle(ctx, '#8a4f40', elipse(8.7, hy + 12, 0.8, 0.42));   // labio de abajo
  }
}
// Los torsos de los personajes, de perfil con su profundidad real (como el del soldado): base de camisa o traje y
// encima lo propio de cada uno. pintura() da los dos tonos, el brillo de borde y el contorno del color de cada pieza
function dibujarTorso(ctx, S, C, ty) {
  if (S.torso === 'soldado') { torsoSoldado(ctx, C, ty); return; }
  const dibujo = TORSOS_SKIN[S.torso];
  if (dibujo) dibujo(ctx, C, v => v + ty, S);
}
// Silueta del torso de perfil: espalda curva, hombros, pecho y la cintura más angosta (la de la camisa del soldado)
const torsoPerfil = y => c => { c.moveTo(-6.4, y(-33.6)); c.quadraticCurveTo(-8.4, y(-44), -7.8, y(-53)); c.quadraticCurveTo(-7, y(-58.6), -2.6, y(-59.4)); c.lineTo(3, y(-59.2)); c.quadraticCurveTo(7.4, y(-57.6), 7.6, y(-50)); c.quadraticCurveTo(7.6, y(-41), 5.8, y(-33.6)); };
// Algo dibujado solo adentro de una forma (texturas: malla, escamas, manchas)
function dentroDe(ctx, forma, fn) { if (Pincel.silueta) return; ctx.save(); ctx.beginPath(); forma(ctx); ctx.clip(); fn(); ctx.restore(); }
const TORSOS_SKIN = {
  /* Dios del trueno: cota de malla, faldón de cuero, peto de acero con discos, hombrera con remaches y tahalí */
  placas(ctx, C, y) {
    const T = torsoPerfil(y), acero = '#8f98a3';
    pintura(ctx, T, C.chaqueta);
    dentroDe(ctx, T, () => {   // anillos de la malla
      ctx.strokeStyle = 'rgba(200,210,222,0.22)'; ctx.lineWidth = 0.35;
      for (let f = 0; f < 18; f++) for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.arc(-8 + k * 1.8 + (f % 2) * 0.9, y(-59) + f * 1.5, 0.7, 0, Math.PI); ctx.stroke(); }
    });
    pintura(ctx, c => { c.moveTo(-7, y(-37.6)); c.lineTo(6.4, y(-37.6)); c.lineTo(7.6, y(-30)); c.lineTo(-7.8, y(-30)); c.closePath(); }, '#5a3d24', { sombra: 0.6 });   // faldón de cuero
    if (!Pincel.silueta) for (let k = 0; k < 5; k++) raya(ctx, '#3a2614', 0.5, [[-5 + k * 2.8, y(-36.4)], [-5.4 + k * 2.8, y(-30.4)]]);
    pintura(ctx, c => { c.moveTo(-1, y(-58.8)); c.quadraticCurveTo(6.4, y(-58.6), 8.4, y(-51.6)); c.quadraticCurveTo(9, y(-44.6), 6.6, y(-40)); c.lineTo(-0.6, y(-40)); c.closePath(); }, acero, { sombra: 0.9, brillo: 0.5 });   // peto
    for (let f = 0; f < 3; f++) for (let k = 0; k < 2; k++) {   // discos del peto
      const dx = 2.6 + k * 3.3, dy = y(-54.6 + f * 4.8);
      pintura(ctx, c => c.ellipse(dx, dy, 1.45, 1.7, 0, 0, Math.PI * 2), '#c9d0d8', { sombra: 0.4, brillo: 0.6, linea: 0.35 });
      detalle(ctx, 'rgba(60,66,76,0.5)', circulo(dx + 0.2, dy + 0.2, 0.5));
    }
    raya(ctx, '#5a3d24', 1.7, [[-6.6, y(-55)], [6.6, y(-39.6)]]);                                             // tahalí de cuero
    pintura(ctx, c => c.ellipse(-1.4, y(-55.6), 5.8, 4.4, -0.2, 0, Math.PI * 2), ajustarColor(acero, 0.05), { sombra: 0.9, brillo: 0.5 });   // hombrera
    if (!Pincel.silueta) { raya(ctx, ajustarColor(acero, -0.35), 0.45, [[-6.4, y(-54.4)], [3.6, y(-57)]]); for (const [px, py] of [[-5, -53.8], [-1.4, -52], [2.4, -54]]) detalle(ctx, '#e8ecf0', circulo(px, y(py), 0.45)); }
    pintura(ctx, c => c.arc(2.4, y(-58.6), 1.5, 0, Math.PI * 2), '#c9a24e', { sombra: 0.4, brillo: 0.5, linea: 0.35 });   // broche de la capa
  },
  /* Armadura de combate: traje oscuro, placas de pecho y vientre articuladas, núcleo de luz y hombrera naranja */
  armadura(ctx, C, y) {
    const T = torsoPerfil(y), placa = '#6a717c', naranja = C.bolsillo;
    pintura(ctx, T, '#3a3e45');
    pintura(ctx, c => c.roundRect(-8.6, y(-57), 5, 17, 1.6), '#5b616b', { sombra: 0.6, brillo: 0.3 });   // espaldar
    pintura(ctx, c => { c.moveTo(-0.6, y(-59)); c.quadraticCurveTo(6.6, y(-58.8), 8.4, y(-51.4)); c.lineTo(8, y(-46)); c.lineTo(-0.4, y(-46)); c.closePath(); }, placa, { sombra: 0.9, brillo: 0.55 });   // pecho
    for (let k = 0; k < 3; k++) pintura(ctx, c => c.roundRect(-0.6 + k * 0.2, y(-45.4 + k * 3.2), 7.8 - k * 0.5, 2.8, 1), ajustarColor(placa, -0.08 * k), { sombra: 0.4, brillo: 0.4, linea: 0.4 });   // vientre articulado
    raya(ctx, naranja, 0.9, [[1, y(-58.4)], [7.4, y(-53.6)]]); raya(ctx, naranja, 0.9, [[0.4, y(-47)], [7.8, y(-47)]]);   // filetes naranjas
    // Núcleo de luz en el pecho: anillo de metal y el resplandor
    pintura(ctx, c => c.arc(5.6, y(-52.4), 2.4, 0, Math.PI * 2), '#9aa2ad', { sombra: 0.3, brillo: 0.6, linea: 0.4 });
    if (!Pincel.silueta) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(5.6, y(-52.4), 0, 5.6, y(-52.4), 6); g.addColorStop(0, 'rgba(160,250,255,0.9)'); g.addColorStop(0.35, 'rgba(90,220,255,0.45)'); g.addColorStop(1, 'rgba(60,180,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(5.6, y(-52.4), 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      detalle(ctx, '#e8ffff', circulo(5.6, y(-52.4), 1.3));
    }
    pintura(ctx, c => c.ellipse(-1.2, y(-55.6), 6.2, 4.8, -0.15, 0, Math.PI * 2), naranja, { sombra: 1, brillo: 0.5 });   // hombrera
    if (!Pincel.silueta) { raya(ctx, ajustarColor(naranja, -0.35), 0.5, [[-6.6, y(-55)], [4.6, y(-56.6)]]); raya(ctx, ajustarColor(naranja, -0.35), 0.5, [[-6, y(-53)], [4, y(-54.4)]]); }
  },
  /* Cazador: campera de trabajo gastada, cuello levantado, cierre, bolsillo con tapa, manchas y el ruedo roto */
  chaqueta(ctx, C, y) {
    const T = torsoPerfil(y), J = C.chaqueta;
    pintura(ctx, T, J);
    dentroDe(ctx, T, () => {
      for (const [x, yy, rx, ry, col] of [[-3, -46, 3, 2, 'rgba(70,20,15,0.5)'], [4, -40, 2.4, 1.6, 'rgba(40,30,20,0.45)'], [-5, -54, 1.8, 1.2, 'rgba(40,30,20,0.35)']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y(yy), rx, ry, 0.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = ajustarColor(J, -0.3); ctx.lineWidth = 0.4; for (const [a, b] of [[-6, -48], [-5, -42], [-6.4, -38]]) { ctx.beginPath(); ctx.moveTo(a, y(b)); ctx.quadraticCurveTo(a + 3, y(b) - 0.8, a + 6, y(b) + 0.4); ctx.stroke(); }   // arrugas
    });
    raya(ctx, '#2a2a24', 0.9, [[5.8, y(-58.4)], [5.2, y(-34)]]);                                                   // cierre
    if (!Pincel.silueta) for (let k = 0; k < 12; k++) detalle(ctx, '#8a8a80', c => c.rect(5.7 - k * 0.05, y(-57.6 + k * 2), 0.5, 0.5));
    pintura(ctx, c => c.roundRect(-0.6, y(-52), 5, 6, 0.8), ajustarColor(J, -0.06), { sombra: 0.4, brillo: 0.2, linea: 0.4 });   // bolsillo
    pintura(ctx, c => c.roundRect(-0.8, y(-52.4), 5.4, 2, 0.6), ajustarColor(J, -0.14), { sombra: 0.3, brillo: 0.2, linea: 0.35 });
    pintura(ctx, c => { c.moveTo(-5.6, y(-58)); c.lineTo(-4.4, y(-62.6)); c.lineTo(3.4, y(-63)); c.lineTo(4.8, y(-58.6)); c.quadraticCurveTo(0, y(-57.6), -5.6, y(-58)); }, ajustarColor(J, 0.08), { sombra: 0.5, brillo: 0.3 });   // cuello levantado
    if (!Pincel.silueta) { raya(ctx, ajustarColor(J, -0.35), 0.5, [[-6.2, y(-35)], [-4.6, y(-33.4)], [-3, y(-35.2)], [-1.2, y(-33.6)]]); detalle(ctx, 'rgba(110,30,20,0.6)', elipse(2, y(-44), 1.1, 0.7)); }   // ruedo roto y una gota
  },
  /* Centinela: traje azul de combate con galón plateado, arnés de cuero, hombros acolchados y cuello alto */
  traje(ctx, C, y) {
    const T = torsoPerfil(y), A = C.chaqueta;
    pintura(ctx, T, A);
    dentroDe(ctx, T, () => { ctx.strokeStyle = ajustarColor(A, -0.3); ctx.lineWidth = 0.4; for (const x of [-3, 2.4]) { ctx.beginPath(); ctx.moveTo(x, y(-59)); ctx.lineTo(x + 0.6, y(-34)); ctx.stroke(); } });   // costuras
    for (let k = 0; k < 2; k++) pintura(ctx, c => { const yy = y(-56 + k * 3.2); c.moveTo(1.6, yy); c.lineTo(5, yy + 3.4); c.lineTo(8, yy); c.lineTo(8, yy + 1.6); c.lineTo(5, yy + 5); c.lineTo(1.6, yy + 1.6); c.closePath(); }, '#d8dce3', { sombra: 0.3, brillo: 0.5, linea: 0.35 });   // galón
    raya(ctx, '#6c4a2a', 1.6, [[-1.4, y(-59)], [-1, y(-38)]]); raya(ctx, '#6c4a2a', 1.4, [[-6.8, y(-50)], [6.8, y(-44)]]);   // arnés
    pintura(ctx, c => c.roundRect(-2.6, y(-46.6), 3.2, 3.2, 0.6), '#a7acb2', { sombra: 0.3, brillo: 0.5, linea: 0.35 });   // argolla del arnés
    pintura(ctx, c => c.ellipse(-1.4, y(-55.8), 5.4, 4, -0.15, 0, Math.PI * 2), ajustarColor(A, 0.1), { sombra: 0.8, brillo: 0.35 });   // hombro acolchado
    if (!Pincel.silueta) for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(A, -0.3), 0.4, [[-5.4 + k * 2.8, y(-58.6)], [-5.8 + k * 2.8, y(-52.8)]]);
    pintura(ctx, c => { c.moveTo(-4.6, y(-58.4)); c.lineTo(-3.8, y(-61.6)); c.lineTo(3, y(-62)); c.lineTo(4.2, y(-58.8)); c.closePath(); }, ajustarColor(A, -0.05), { sombra: 0.4, brillo: 0.3 });   // cuello alto
  },
  /* Bufón: saco violeta con solapa y flor, chaleco verde con botones, camisa naranja y corbata */
  bufon(ctx, C, y) {
    const T = torsoPerfil(y), saco = C.chaqueta;
    pintura(ctx, T, saco);
    pintura(ctx, c => { c.moveTo(1.4, y(-58.6)); c.quadraticCurveTo(7, y(-57.8), 7.6, y(-50)); c.quadraticCurveTo(7.6, y(-42), 6, y(-36)); c.lineTo(1.6, y(-36)); c.closePath(); }, C.chaleco, { sombra: 0.7, brillo: 0.3 });   // chaleco
    for (let k = 0; k < 4; k++) pintura(ctx, c => c.arc(6.2 - k * 0.05, y(-52 + k * 4), 0.6, 0, Math.PI * 2), '#d9c06a', { sombra: 0.2, brillo: 0.6, linea: 0.3 });
    pintura(ctx, c => { c.moveTo(2.4, y(-59)); c.lineTo(6, y(-58.4)); c.lineTo(5.4, y(-55)); c.lineTo(3, y(-55.6)); c.closePath(); }, C.bolsillo, { sombra: 0.3, brillo: 0.3, linea: 0.35 });   // camisa naranja
    pintura(ctx, c => { c.moveTo(4.2, y(-56.6)); c.lineTo(5.4, y(-56.6)); c.lineTo(6.6, y(-47)); c.lineTo(5.6, y(-45.6)); c.lineTo(4.4, y(-47)); c.closePath(); }, '#2a1e2a', { sombra: 0.3, brillo: 0.25, linea: 0.35 });   // corbata
    pintura(ctx, c => { c.moveTo(0.6, y(-59)); c.lineTo(3, y(-58.4)); c.lineTo(4.4, y(-47)); c.lineTo(2.6, y(-43)); c.lineTo(1, y(-45)); c.closePath(); }, ajustarColor(saco, 0.12), { sombra: 0.4, brillo: 0.4, linea: 0.4 });   // solapa
    pintura(ctx, c => c.arc(2.6, y(-53.4), 1.1, 0, Math.PI * 2), '#e8e2f0', { sombra: 0.2, brillo: 0.4, linea: 0.3 });   // flor del ojal
    detalle(ctx, '#f2c94c', circulo(2.6, y(-53.4), 0.4));
  },
  /* Rey de los mares: camisa de escamas verdeagua con bordes dorados y el cuello de oro */
  escamas(ctx, C, y) {
    const T = torsoPerfil(y), oro = '#c9a227';
    pintura(ctx, T, C.chaqueta);
    dentroDe(ctx, T, () => {
      for (let f = 0; f < 15; f++) for (let k = 0; k < 9; k++) {
        const x = -8.4 + k * 2.1 + (f % 2) * 1.05, yy = y(-59.5) + f * 1.75;
        ctx.fillStyle = (k + f) % 3 ? 'rgba(80,220,190,0.22)' : 'rgba(255,210,120,0.18)'; ctx.beginPath(); ctx.arc(x, yy, 1.05, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(10,60,50,0.45)'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.arc(x, yy, 1.05, 0, Math.PI); ctx.stroke();
      }
    });
    pintura(ctx, c => { c.moveTo(-5.4, y(-58.2)); c.quadraticCurveTo(0, y(-60.6), 5.6, y(-58.6)); c.lineTo(5, y(-56.6)); c.quadraticCurveTo(0, y(-58.2), -5, y(-56.2)); c.closePath(); }, oro, { sombra: 0.4, brillo: 0.6, linea: 0.4 });   // cuello de oro
    pintura(ctx, c => c.ellipse(-1.4, y(-55.4), 5, 3.8, -0.15, 0, Math.PI * 2), ajustarColor(C.chaqueta, 0.1), { sombra: 0.7, brillo: 0.4 });   // hombro
  },
  /* Vaquero: camisa con botones y bolsillo, chaleco de cuero abierto con costuras y una estrella de lata */
  cuero(ctx, C, y) {
    const T = torsoPerfil(y), cuero = C.chaleco;
    pintura(ctx, T, C.chaqueta);
    for (let k = 0; k < 4; k++) detalle(ctx, '#efe6d2', circulo(5.6, y(-55 + k * 5), 0.45));                      // botones
    pintura(ctx, c => { c.moveTo(-6.6, y(-36)); c.quadraticCurveTo(-8.6, y(-46), -8, y(-53)); c.quadraticCurveTo(-7, y(-58.6), -3, y(-59.2)); c.lineTo(-0.2, y(-59)); c.lineTo(0.6, y(-36)); c.closePath(); }, cuero, { sombra: 0.8, brillo: 0.3 });   // chaleco: espalda
    pintura(ctx, c => { c.moveTo(3.2, y(-58.6)); c.quadraticCurveTo(7.6, y(-57), 7.8, y(-50)); c.quadraticCurveTo(7.8, y(-42), 6.4, y(-36.6)); c.lineTo(3.8, y(-36.6)); c.quadraticCurveTo(4.8, y(-48), 3.2, y(-58.6)); }, cuero, { sombra: 0.7, brillo: 0.3 });   // chaleco: frente
    if (!Pincel.silueta) {
      ctx.save(); ctx.setLineDash([0.8, 0.7]); raya(ctx, ajustarColor(cuero, 0.3), 0.35, [[-0.6, y(-58)], [0, y(-37)]]); raya(ctx, ajustarColor(cuero, 0.3), 0.35, [[4, y(-57.4)], [4.6, y(-38)]]); ctx.restore();   // costuras
      // Estrella de lata
      ctx.fillStyle = '#c9ccd0'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.8 : 1.9; ctx.lineTo(6 + Math.cos(a) * r, y(-51) + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#6a6e74'; ctx.lineWidth = 0.3; ctx.stroke();
    }
  },
  /* Ninja: traje cruzado con el borde del cruce, faja roja anudada atrás con las puntas colgando */
  ninja(ctx, C, y) {
    const T = torsoPerfil(y), N = C.chaqueta;
    pintura(ctx, T, N);
    dentroDe(ctx, T, () => { ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5; for (const [a, b] of [[-6, -50], [-5, -45], [-6.4, -55]]) { ctx.beginPath(); ctx.moveTo(a, y(b)); ctx.quadraticCurveTo(a + 3, y(b) + 1, a + 6, y(b) - 0.4); ctx.stroke(); } });
    pintura(ctx, c => { c.moveTo(-2.6, y(-59.2)); c.lineTo(0.2, y(-59.2)); c.lineTo(7.6, y(-44)); c.lineTo(6.8, y(-41.6)); c.closePath(); }, C.chaleco, { sombra: 0.4, brillo: 0.3, linea: 0.4 });   // borde del cruce
    raya(ctx, ajustarColor(N, -0.4), 0.5, [[1.4, y(-59)], [7.4, y(-47)]]);
    pintura(ctx, c => { c.moveTo(-7, y(-42.6)); c.lineTo(6.8, y(-42.6)); c.lineTo(6.2, y(-35.6)); c.lineTo(-6.6, y(-35.6)); c.closePath(); }, C.cinturon, { sombra: 0.6, brillo: 0.3 });   // faja
    if (!Pincel.silueta) for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(C.cinturon, -0.3), 0.4, [[-6.4, y(-41 + k * 2)], [6.2, y(-41 + k * 2)]]);
    pintura(ctx, c => c.ellipse(-7.6, y(-39.4), 1.8, 2, 0, 0, Math.PI * 2), C.cinturon, { sombra: 0.4, brillo: 0.3, linea: 0.4 });   // nudo
    pintura(ctx, c => { c.moveTo(-8.4, y(-38.6)); c.quadraticCurveTo(-10.4, y(-33), -9.6, y(-28)); c.lineTo(-8, y(-28.6)); c.quadraticCurveTo(-8.6, y(-33), -7, y(-38)); c.closePath(); }, ajustarColor(C.cinturon, -0.08), { sombra: 0.4, linea: 0.4 });   // puntas
  },
};

/* ---------- Cabeza de cada skin ---------- */
// Puntos de una curva cuadrática, para pasarle a raya() mechones, pliegues y vetas
const curvaPts = (x0, y0, cx, cy, x1, y1, n = 6) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]; });
// Pelo largo que cae por la espalda hasta los hombros (va antes que el cuello y la cara): mechones con puntas y vetas
function peloAtras(ctx, C, hy) {
  const P = C.pelo;
  pintura(ctx, c => {
    c.moveTo(-3, hy - 0.4); c.quadraticCurveTo(-10.6, hy + 0.4, -11.2, hy + 8.4); c.quadraticCurveTo(-11.6, hy + 15.4, -14, hy + 21.4);   // nuca y espalda
    c.lineTo(-11.8, hy + 20.2); c.lineTo(-12.6, hy + 23.6); c.lineTo(-10, hy + 20.6); c.lineTo(-9.8, hy + 23.4);                            // puntas
    c.quadraticCurveTo(-7.8, hy + 20, -7.4, hy + 17); c.lineTo(-6, hy + 19.4); c.quadraticCurveTo(-4.4, hy + 15.4, -4.6, hy + 11.6);
    c.lineTo(-1.6, hy + 4);
  }, P, { sombra: 0.9, brillo: 0.3, linea: 0.45 });
  if (Pincel.silueta) return;
  for (let k = 0; k < 4; k++) raya(ctx, ajustarColor(P, -0.32), 0.4, curvaPts(-5 - k * 1.4, hy + 1.6, -10 - k * 0.5, hy + 8, -8.6 - k * 1.3, hy + 18 + k * 0.8));   // vetas oscuras
  for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(P, 0.28), 0.35, curvaPts(-5.6 - k * 1.5, hy + 2.6, -9.8 - k * 0.4, hy + 8.6, -8 - k * 1.6, hy + 15.6));   // brillo del pelo
}
// Barba larga y llena: patilla, mejilla, bigote caído sobre la boca, mentón con volumen y, si va, la trenza con su anillo
function barbaLlena(ctx, color, hy, trenza) {
  const B = color;
  if (trenza) {   // trenza bajo el mentón: tres nudos que se achican, anillo de oro y la punta suelta
    for (let k = 0; k < 3; k++) pintura(ctx, c => c.ellipse(5.6 + k * 0.2, hy + 21.4 + k * 2.1, 1.7 - k * 0.15, 1.3, (k % 2 ? 0.5 : -0.5), 0, Math.PI * 2), ajustarColor(B, -0.04 * k), { sombra: 0.4, brillo: 0.3, linea: 0.4 });
    pintura(ctx, c => c.roundRect(4.6, hy + 26.6, 2.4, 1.3, 0.5), '#c9a24e', { sombra: 0.3, brillo: 0.6, linea: 0.35 });
    pintura(ctx, c => { c.moveTo(4.8, hy + 27.8); c.lineTo(6.8, hy + 27.8); c.lineTo(7.2, hy + 30.4); c.lineTo(6, hy + 29.4); c.lineTo(4.6, hy + 30.6); c.closePath(); }, B, { sombra: 0.3, brillo: 0.2, linea: 0.4 });
  }
  pintura(ctx, c => {
    c.moveTo(-1.8, hy + 5.6); c.lineTo(0.6, hy + 5.8);                                        // patilla
    c.quadraticCurveTo(0.8, hy + 9.4, 3.6, hy + 10.2); c.quadraticCurveTo(6.4, hy + 10.3, 7.8, hy + 9.8);   // mejilla
    c.quadraticCurveTo(9.6, hy + 9.6, 10.2, hy + 11);                                         // bigote
    c.lineTo(9.4, hy + 11.7); c.lineTo(8.6, hy + 11.9); c.lineTo(9.6, hy + 12.5);              // boca
    c.quadraticCurveTo(11, hy + 16.6, 9, hy + 19.6); c.quadraticCurveTo(6.8, hy + 22.6, 3.4, hy + 21.8);   // barba adelante y la punta
    c.lineTo(2.4, hy + 22.8); c.quadraticCurveTo(-1.6, hy + 20.6, -3.8, hy + 16.6);
    c.quadraticCurveTo(-4.8, hy + 12.4, -3, hy + 9.8); c.quadraticCurveTo(-1.8, hy + 8, -1.8, hy + 5.6);
  }, B, { sombra: 0.8, brillo: 0.22, linea: 0.45 });
  if (Pincel.silueta) return;
  for (let k = 0; k < 6; k++) raya(ctx, ajustarColor(B, -0.3), 0.38, curvaPts(-1.6 + k * 1.8, hy + 11 + (k > 3 ? 1.6 : 0), 0 + k * 1.7, hy + 16, 1.4 + k * 1.3, hy + 20.4 - Math.abs(k - 3) * 0.6));   // vetas
  for (let k = 0; k < 4; k++) raya(ctx, ajustarColor(B, 0.25), 0.32, curvaPts(-0.6 + k * 2.2, hy + 12.4, 0.8 + k * 2, hy + 16, 1.8 + k * 1.8, hy + 19));
  // Bigote: cae sobre el labio de arriba y se abre a los costados
  pintura(ctx, c => { c.moveTo(5.4, hy + 10.8); c.quadraticCurveTo(8.2, hy + 9.4, 10.3, hy + 10.6); c.quadraticCurveTo(10.6, hy + 12.2, 9.4, hy + 13.2); c.quadraticCurveTo(8.6, hy + 11.6, 5.4, hy + 11.8); c.closePath(); }, ajustarColor(B, 0.06), { sombra: 0.4, brillo: 0.3, linea: 0.4 });
  detalle(ctx, '#8a4f40', elipse(8.9, hy + 12.4, 0.7, 0.36));   // labio de abajo
}
// Lo de arriba de la cabeza de cada personaje. cara: el trazo del perfil de la cara (para sombrear adentro de ella)
const CABEZAS_SKIN = {
  /* Dios del trueno: casco de acero con banda y remaches, nasal, y dos alas de plumas a los costados */
  'casco-alado'(ctx, C, hy) {
    const acero = '#9aa2ad';
    pintura(ctx, c => { c.moveTo(-9.8, hy + 6); c.quadraticCurveTo(-10.8, hy - 6.8, 0, hy - 7.4); c.quadraticCurveTo(8.8, hy - 7, 9.3, hy + 3.4); c.lineTo(9.5, hy + 4.6); c.quadraticCurveTo(0, hy + 3.6, -9.8, hy + 6); }, acero, { sombra: 1, brillo: 0.55, oscuro: 0.34 });
    if (!Pincel.silueta) {   // reflejo del domo
      raya(ctx, 'rgba(255,255,255,0.45)', 0.8, curvaPts(-6.4, hy - 1.6, -4.6, hy - 5.4, 0.4, hy - 6));
      detalle(ctx, 'rgba(30,36,46,0.25)', c => { c.moveTo(3, hy - 6.4); c.quadraticCurveTo(8.4, hy - 5.4, 9, hy + 3.4); c.lineTo(5.6, hy + 3.6); c.quadraticCurveTo(6, hy - 2, 3, hy - 6.4); });
    }
    // Banda que cruza el domo de oreja a oreja, con remaches
    pintura(ctx, c => { c.moveTo(-1.8, hy - 7.2); c.quadraticCurveTo(-2.8, hy - 1, -2.6, hy + 4.8); c.lineTo(1.2, hy + 4.2); c.quadraticCurveTo(1.6, hy - 1.6, 1.8, hy - 7.3); c.closePath(); }, ajustarColor(acero, -0.06), { sombra: 0.5, brillo: 0.4, linea: 0.4 });
    // Aro de la base con remaches
    pintura(ctx, c => { c.moveTo(-10, hy + 3.6); c.quadraticCurveTo(0, hy + 1.2, 9.6, hy + 2.4); c.lineTo(9.8, hy + 4.8); c.quadraticCurveTo(0, hy + 3.8, -10, hy + 6.4); c.closePath(); }, ajustarColor(acero, -0.1), { sombra: 0.5, brillo: 0.45, linea: 0.4 });
    if (!Pincel.silueta) {
      for (const [x, yy] of [[-7.6, 4.6], [-4, 3.6], [3.4, 3.2], [7, 3.4]]) detalle(ctx, '#e4e8ec', circulo(x, hy + yy, 0.45));
      for (const yy of [-4.6, -1.6, 1.4]) detalle(ctx, '#e4e8ec', circulo(-0.4, hy + yy, 0.45));
    }
    // Nasal sobre el puente de la nariz
    pintura(ctx, c => { c.moveTo(7.6, hy + 3.4); c.lineTo(9.6, hy + 3.4); c.lineTo(9.8, hy + 9.4); c.quadraticCurveTo(9.2, hy + 10.6, 8.6, hy + 9.6); c.closePath(); }, acero, { sombra: 0.4, brillo: 0.5, linea: 0.4 });
    // Ala de plumas: base de metal y cinco plumas que se abren hacia atrás y arriba, de la más baja a la más alta
    const plumas = [[0.2, 13.6], [0.5, 16.2], [0.82, 16.8], [1.12, 15], [1.38, 11.8]];
    plumas.forEach(([a, largo], k) => {
      ctx.save(); ctx.translate(-4.4, hy - 1.4); ctx.rotate(Math.PI + a);
      const col = ajustarColor('#eceef2', -0.05 * (plumas.length - 1 - k));
      pintura(ctx, c => { c.moveTo(0, -1); c.quadraticCurveTo(largo * 0.5, -2.6, largo, -0.4); c.quadraticCurveTo(largo * 0.55, 1.6, 0, 1); c.closePath(); }, col, { sombra: 0.4, brillo: 0.5, linea: 0.38 });
      raya(ctx, ajustarColor(col, -0.3), 0.3, [[0.6, 0], [largo * 0.55, -0.6], [largo - 0.8, -0.4]]);   // cañón
      if (!Pincel.silueta) for (let r = 0; r < 3; r++) raya(ctx, ajustarColor(col, -0.2), 0.25, [[largo * (0.35 + r * 0.18), -0.5], [largo * (0.42 + r * 0.18), -1.6]]);   // barbas de la pluma
      ctx.restore();
    });
    pintura(ctx, c => c.ellipse(-4.2, hy - 1.2, 2.6, 2.2, -0.3, 0, Math.PI * 2), '#c9a24e', { sombra: 0.4, brillo: 0.6, linea: 0.4 });   // base de oro
    if (!Pincel.silueta) detalle(ctx, '#8a6a2a', circulo(-4.2, hy - 1.2, 0.8));
  },
  /* Armadura: casco cerrado de acero oscuro con la cara de placa naranja, el visor de luz, rejillas y el disco de la oreja */
  'casco-armadura'(ctx, C, hy) {
    const casco = '#5b616b', placa = C.bolsillo;
    pintura(ctx, c => { c.moveTo(-9.4, hy + 13.6); c.quadraticCurveTo(-10.6, hy + 4, -7.4, hy - 2.6); c.quadraticCurveTo(-3, hy - 6.8, 3, hy - 6); c.quadraticCurveTo(8.6, hy - 4.6, 9.8, hy + 2);
      c.lineTo(10.6, hy + 8.6); c.quadraticCurveTo(11, hy + 12.6, 9.6, hy + 15); c.quadraticCurveTo(8.4, hy + 17.4, 5, hy + 17.8); c.lineTo(-1.6, hy + 17.6); c.quadraticCurveTo(-6, hy + 17, -9.4, hy + 13.6); }, casco, { sombra: 1.1, brillo: 0.5 });
    // Cresta y líneas de paneles del casco
    pintura(ctx, c => { c.moveTo(-8.4, hy - 0.4); c.quadraticCurveTo(-3.6, hy - 6.4, 3, hy - 5.8); c.quadraticCurveTo(6.6, hy - 5.2, 8.4, hy - 2); c.lineTo(6.6, hy - 1.6); c.quadraticCurveTo(4.6, hy - 4, 1.2, hy - 4); c.quadraticCurveTo(-4.6, hy - 4, -6.8, hy + 0.4); c.closePath(); }, ajustarColor(casco, 0.12), { sombra: 0.4, brillo: 0.55, linea: 0.4 });
    raya(ctx, ajustarColor(casco, -0.4), 0.45, curvaPts(-9.8, hy + 6.6, -5, hy + 1.6, 2.8, hy + 1));
    raya(ctx, ajustarColor(casco, -0.4), 0.45, curvaPts(-9, hy + 13.4, -5, hy + 14.6, -1.4, hy + 17.4, 4));
    // Cara de placa naranja: frente, pómulo y mandíbula, separada del casco por una ranura
    pintura(ctx, c => { c.moveTo(2.8, hy + 1); c.quadraticCurveTo(7.6, hy - 1, 9.8, hy + 2); c.lineTo(10.6, hy + 8.6); c.quadraticCurveTo(11, hy + 12.6, 9.6, hy + 15); c.quadraticCurveTo(8.4, hy + 17.4, 5, hy + 17.8);
      c.lineTo(3.4, hy + 17.6); c.quadraticCurveTo(1.8, hy + 12.4, 3.8, hy + 9.6); c.quadraticCurveTo(1.6, hy + 5, 2.8, hy + 1); }, placa, { sombra: 0.9, brillo: 0.55 });
    raya(ctx, ajustarColor(placa, -0.4), 0.4, curvaPts(4, hy + 9.6, 7.4, hy + 10.6, 10.8, hy + 10));   // línea del pómulo
    // Visor: ranura oscura y la luz celeste que brilla
    pintura(ctx, c => { c.moveTo(4.4, hy + 5.4); c.lineTo(10.4, hy + 4.8); c.lineTo(10.6, hy + 6.8); c.lineTo(4.8, hy + 7.2); c.closePath(); }, '#16181c', { sombra: 0.2, brillo: false, linea: 0.35 });
    if (!Pincel.silueta) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(8, hy + 6, 0, 8, hy + 6, 6.5); g.addColorStop(0, 'rgba(150,245,255,0.75)'); g.addColorStop(0.4, 'rgba(70,200,255,0.3)'); g.addColorStop(1, 'rgba(40,160,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(8, hy + 6, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#d8feff'; ctx.beginPath(); ctx.moveTo(5.4, hy + 5.9); ctx.lineTo(10.2, hy + 5.4); ctx.lineTo(10.3, hy + 6.2); ctx.lineTo(5.6, hy + 6.6); ctx.closePath(); ctx.fill();
    }
    // Rejillas de la boca
    if (!Pincel.silueta) for (let k = 0; k < 3; k++) raya(ctx, '#2a1a10', 0.5, [[8.2 + k * 0.4, hy + 12.4 + k * 1.1], [10.2, hy + 12.2 + k * 1.1]]);
    // Disco de la oreja: anillo, centro y una luz chica
    pintura(ctx, c => c.arc(-2.8, hy + 8.4, 2.8, 0, Math.PI * 2), ajustarColor(casco, 0.18), { sombra: 0.4, brillo: 0.55, linea: 0.4 });
    pintura(ctx, c => c.arc(-2.8, hy + 8.4, 1.5, 0, Math.PI * 2), ajustarColor(casco, -0.1), { sombra: 0.3, brillo: 0.3, linea: 0.35 });
    if (!Pincel.silueta) detalle(ctx, '#9ff8ff', circulo(-2.8, hy + 8.4, 0.5));
  },
  /* Cazador: cabeza rapada con una cicatriz cosida y la máscara blanca gastada, con agujeros, una grieta y las correas */
  mascara(ctx, C, hy, e, cara) {
    dentroDe(ctx, cara, () => {   // pelo rapado: sombra azulada sobre el cráneo
      ctx.fillStyle = 'rgba(40,36,40,0.28)'; ctx.beginPath(); ctx.moveTo(-9, hy + 10); ctx.quadraticCurveTo(-10, hy - 1.6, -1, hy - 1.6); ctx.quadraticCurveTo(5.6, hy - 1.6, 6, hy + 1.6);
      ctx.quadraticCurveTo(0, hy + 1, -1.6, hy + 5.6); ctx.lineTo(-5, hy + 6); ctx.quadraticCurveTo(-6.4, hy + 8.4, -9, hy + 10); ctx.fill();
    });
    raya(ctx, '#9a5a50', 0.6, curvaPts(-7, hy + 1.6, -4.4, hy - 1, -0.4, hy + 0.4));   // cicatriz
    if (!Pincel.silueta) for (let k = 0; k < 4; k++) { const [x, yy] = curvaPts(-7, hy + 1.6, -4.4, hy - 1, -0.4, hy + 0.4, 5)[k + 1]; raya(ctx, '#5a2e28', 0.3, [[x - 0.3, yy - 0.7], [x + 0.3, yy + 0.7]]); }
    // Correas: de la máscara a la nuca, con la hebilla atrás
    for (const [y0, y1] of [[3.4, 2.4], [12, 11.4]]) pintura(ctx, c => { c.moveTo(2.4, hy + y0 - 0.7); c.lineTo(-8.8, hy + y1 - 0.7); c.lineTo(-8.9, hy + y1 + 0.7); c.lineTo(2.4, hy + y0 + 0.7); c.closePath(); }, '#3a2a20', { sombra: 0.3, brillo: 0.2, linea: 0.3 });
    pintura(ctx, c => c.roundRect(-8.6, hy + 1.4, 1.8, 2, 0.4), '#8a8f96', { sombra: 0.3, brillo: 0.5, linea: 0.3 });
    // Máscara: cubre de la frente al mentón, un poco separada de la cara
    const M = '#e6e0cf', mascara = c => { c.moveTo(1.6, hy + 0.2); c.quadraticCurveTo(7.8, hy - 0.4, 9.2, hy + 4.4); c.lineTo(9.6, hy + 7); c.quadraticCurveTo(11, hy + 9.4, 10, hy + 11.4);
      c.quadraticCurveTo(10, hy + 15.2, 7.4, hy + 16.8); c.quadraticCurveTo(4, hy + 18, 2.2, hy + 15.8); c.quadraticCurveTo(0.4, hy + 8, 1.6, hy + 0.2); };
    pintura(ctx, mascara, M, { sombra: 0.9, brillo: 0.6, oscuro: 0.24 });
    dentroDe(ctx, mascara, () => {   // mugre, grieta y una salpicadura vieja
      for (const [x, yy, rx, ry, col] of [[3, 14, 2.4, 1.6, 'rgba(90,70,50,0.22)'], [8.4, 3.4, 1.8, 1.2, 'rgba(90,70,50,0.2)'], [6.4, 15.2, 1.2, 0.8, 'rgba(120,30,24,0.4)']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, hy + yy, rx, ry, 0.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(60,50,40,0.6)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(3.6, hy + 0.6); ctx.lineTo(4.8, hy + 2.8); ctx.lineTo(4.2, hy + 4.2); ctx.lineTo(5.4, hy + 5); ctx.stroke();
    });
    if (!Pincel.silueta) {
      // Agujero del ojo con el ojo que brilla adentro y los agujeros para respirar
      ctx.fillStyle = '#15110e'; ctx.beginPath(); ctx.ellipse(5.8, hy + 6.4, 1.9, 1.3, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(240,235,220,0.85)'; ctx.fillRect(6.2, hy + 6.1 + e.mirar * 0.4, 0.6, 0.5);
      ctx.fillStyle = '#1a1612';
      for (const [x, yy] of [[4.2, 10], [6.2, 10.4], [8.2, 10.2], [3.6, 12.4], [5.6, 12.8], [7.6, 12.6], [4.8, 14.8], [6.8, 14.8], [6.6, 2.6], [4, 2.8]]) { ctx.beginPath(); ctx.arc(x, hy + yy, 0.42, 0, Math.PI * 2); ctx.fill(); }
      raya(ctx, 'rgba(255,255,255,0.55)', 0.4, curvaPts(2.6, hy + 2, 2, hy + 8, 2.8, hy + 14));   // canto iluminado
    }
  },
  /* Centinela: capucha azul brillante con franja plateada, el disco de la oreja con su alita y la correa del mentón */
  'casco-centinela'(ctx, C, hy) {
    const A = C.gorra;
    pintura(ctx, c => { c.moveTo(-9.2, hy + 15); c.quadraticCurveTo(-10.6, hy + 3, -6.6, hy - 3); c.quadraticCurveTo(-1, hy - 6.8, 4.6, hy - 4.6); c.quadraticCurveTo(8.6, hy - 2.4, 8.8, hy + 3.4);
      c.lineTo(8.6, hy + 4.6); c.quadraticCurveTo(5, hy + 3.4, 2.6, hy + 4.6); c.quadraticCurveTo(0.8, hy + 6.4, 1.6, hy + 9.6); c.quadraticCurveTo(2.4, hy + 13, 4.2, hy + 16.6);
      c.quadraticCurveTo(0, hy + 17.6, -3.6, hy + 17); c.quadraticCurveTo(-7, hy + 16.4, -9.2, hy + 15); }, A, { sombra: 1, brillo: 0.55 });
    if (!Pincel.silueta) raya(ctx, 'rgba(255,255,255,0.4)', 0.7, curvaPts(-7.4, hy + 2, -6, hy - 3.4, -1, hy - 4.6));   // brillo de la tela
    // Franja plateada que va de la frente a la nuca
    pintura(ctx, c => { c.moveTo(7.2, hy - 2); c.quadraticCurveTo(0.4, hy - 7.6, -7, hy - 2.4); c.lineTo(-6.4, hy - 0.6); c.quadraticCurveTo(0, hy - 5.2, 6.2, hy - 0.2); c.closePath(); }, '#d8dce3', { sombra: 0.4, brillo: 0.6, linea: 0.4 });
    raya(ctx, ajustarColor(A, -0.4), 0.4, curvaPts(2.6, hy + 4.6, 0.8, hy + 6.4, 1.6, hy + 9.6, 3));   // costura del borde de la cara
    // Correa del mentón y disco de la oreja con una alita plateada
    raya(ctx, '#1e2a48', 0.9, curvaPts(-2.6, hy + 10.4, -0.6, hy + 15, 3.4, hy + 16.6, 4));
    pintura(ctx, c => c.arc(-2.6, hy + 8.4, 2.6, 0, Math.PI * 2), '#d8dce3', { sombra: 0.4, brillo: 0.6, linea: 0.4 });
    pintura(ctx, c => c.arc(-2.6, hy + 8.4, 1.6, 0, Math.PI * 2), ajustarColor(A, 0.1), { sombra: 0.3, brillo: 0.3, linea: 0.35 });
    pintura(ctx, c => { c.moveTo(-4.8, hy + 7); c.lineTo(-9.4, hy + 4.4); c.lineTo(-8.2, hy + 6.4); c.lineTo(-10, hy + 6.2); c.lineTo(-7.8, hy + 7.8); c.lineTo(-5, hy + 8.6); c.closePath(); }, '#d8dce3', { sombra: 0.3, brillo: 0.5, linea: 0.35 });
  },
  /* Bufón: pelo verde engominado hacia atrás con un rulo suelto, ojeras pintadas y la sonrisa roja de oreja a oreja */
  payaso(ctx, C, hy) {
    const P = C.pelo;
    if (!Pincel.silueta) {   // sonrisa pintada: labios rojos que suben hasta el pómulo, corridos en los bordes
      ctx.save(); ctx.globalAlpha *= 0.35; raya(ctx, '#b3201c', 2.2, curvaPts(1.6, hy + 8.8, 4.6, hy + 14.4, 9.4, hy + 11.2)); ctx.restore();
      ctx.fillStyle = '#b3201c'; ctx.beginPath(); ctx.moveTo(9.6, hy + 11); ctx.quadraticCurveTo(5.4, hy + 15.2, 1.8, hy + 9.2); ctx.quadraticCurveTo(5.6, hy + 12.6, 9, hy + 10.4); ctx.closePath(); ctx.fill();
      raya(ctx, '#5a0c0a', 0.4, curvaPts(8.8, hy + 11.2, 5.4, hy + 13.4, 2.4, hy + 9.8));   // comisura
    }
    pintura(ctx, c => { c.moveTo(-6.8, hy + 11); c.quadraticCurveTo(-10, hy + 6, -9.6, hy + 1.6); c.quadraticCurveTo(-8.4, hy - 4.6, -1, hy - 4.6); c.quadraticCurveTo(5.8, hy - 4.8, 8.6, hy - 1.2);
      c.quadraticCurveTo(9.2, hy + 0.8, 7.8, hy + 1.6); c.quadraticCurveTo(4.8, hy + 0.2, 1.4, hy + 1); c.quadraticCurveTo(-1.6, hy + 1.8, -2, hy + 5.6); c.lineTo(-4.4, hy + 6.2);
      c.quadraticCurveTo(-5.4, hy + 8.6, -6.8, hy + 11); }, P, { sombra: 0.7, brillo: 0.45, linea: 0.45 });
    if (!Pincel.silueta) {   // peinado hacia atrás: vetas largas de la frente a la nuca
      for (let k = 0; k < 5; k++) raya(ctx, ajustarColor(P, -0.32), 0.38, curvaPts(7 - k * 0.8, hy - 1.4 + k * 0.6, -1, hy - 4 + k * 1.3, -8.4 + k * 0.4, hy + 2 + k * 1.6));
      for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(P, 0.32), 0.32, curvaPts(5.6 - k, hy - 2.6 + k * 0.8, -1, hy - 3.6 + k * 1.2, -7 + k * 0.6, hy + 0.4 + k * 1.6));
    }
    pintura(ctx, c => { c.moveTo(6.4, hy + 0.8); c.quadraticCurveTo(8.8, hy + 1.4, 8, hy + 3.8); c.quadraticCurveTo(7.4, hy + 2.4, 6, hy + 1.8); c.closePath(); }, P, { sombra: 0.3, brillo: 0.4, linea: 0.35 });   // rulo suelto
  },
  /* Rey de los mares: melena ondulada con mechones que caen sobre la frente y la oreja */
  'pelo-largo'(ctx, C, hy) {
    const P = C.pelo;
    pintura(ctx, c => { c.moveTo(-8.8, hy + 9.6); c.quadraticCurveTo(-10.6, hy + 1, -5.4, hy - 3.8); c.quadraticCurveTo(0, hy - 6.2, 5.6, hy - 3.8); c.quadraticCurveTo(9.2, hy - 1.6, 8.8, hy + 2.8);
      c.quadraticCurveTo(7.8, hy + 4.6, 6.6, hy + 3.4); c.quadraticCurveTo(5.6, hy + 1.6, 3.6, hy + 1.8); c.quadraticCurveTo(2.8, hy + 3.8, 1.8, hy + 4.4); c.quadraticCurveTo(0.6, hy + 2.4, -0.6, hy + 3.4);
      c.quadraticCurveTo(-1.6, hy + 5.4, -1.6, hy + 7.8); c.lineTo(-4.6, hy + 8.4); c.quadraticCurveTo(-6.4, hy + 10.8, -8.8, hy + 9.6); }, P, { sombra: 0.9, brillo: 0.35, linea: 0.45 });
    if (Pincel.silueta) return;
    for (let k = 0; k < 5; k++) raya(ctx, ajustarColor(P, -0.3), 0.38, curvaPts(6 - k * 1.6, hy - 2.6 + k * 0.3, -1 - k, hy - 4 + k * 1.8, -7.6 + k * 0.6, hy + 4 + k * 1.2));   // ondas
    for (let k = 0; k < 3; k++) raya(ctx, ajustarColor(P, 0.3), 0.32, curvaPts(4.6 - k * 2, hy - 3.4 + k * 0.6, -1.4 - k, hy - 3.6 + k * 1.6, -6.4 + k * 0.6, hy + 1.6 + k * 1.6));
    raya(ctx, ajustarColor(P, -0.35), 0.4, curvaPts(7.6, hy + 0.2, 7.2, hy + 2.6, 6.6, hy + 3.4, 3));   // mechón de la frente
  },
  /* Vaquero: sombrero de ala ancha, copa con el pellizco adelante, cinta de cuero con la hebilla y la sombra sobre la cara */
  sombrero(ctx, C, hy, e, cara) {
    const G = C.gorra;
    dentroDe(ctx, cara, () => { ctx.fillStyle = 'rgba(30,16,6,0.28)'; ctx.fillRect(-10, hy + 0.6, 22, 5); });   // sombra del ala sobre la frente y los ojos
    // Copa: atrás redondeada, la hendidura del medio y el pellizco adelante
    pintura(ctx, c => { c.moveTo(-7.6, hy + 1); c.lineTo(-7.3, hy - 6.6); c.quadraticCurveTo(-6.8, hy - 10, -3.4, hy - 9.6); c.quadraticCurveTo(-1.2, hy - 8, 0.6, hy - 8.8);
      c.quadraticCurveTo(4.2, hy - 10.2, 6.4, hy - 8.8); c.quadraticCurveTo(7.9, hy - 7.2, 7.7, hy - 4); c.lineTo(7.9, hy + 1); }, G, { sombra: 0.9, brillo: 0.35 });
    raya(ctx, ajustarColor(G, -0.38), 0.45, curvaPts(-3.4, hy - 9.4, -1.4, hy - 6.6, 0.4, hy - 8.6, 3));   // hendidura
    raya(ctx, ajustarColor(G, -0.38), 0.45, curvaPts(5.4, hy - 8.8, 4.2, hy - 6.4, 5, hy - 3.6, 3));       // pellizco
    if (!Pincel.silueta) detalle(ctx, 'rgba(255,240,215,0.14)', c => { c.moveTo(-6.4, hy - 2.6); c.lineTo(-6.2, hy - 7); c.quadraticCurveTo(-5.4, hy - 8.8, -3.6, hy - 8.4); c.lineTo(-4.4, hy - 2.6); });
    // Cinta de cuero con la hebilla plateada
    pintura(ctx, c => { c.moveTo(-7.6, hy - 2.6); c.quadraticCurveTo(0, hy - 3.4, 7.8, hy - 2.6); c.lineTo(7.9, hy + 0.2); c.quadraticCurveTo(0, hy - 0.4, -7.6, hy + 0.2); c.closePath(); }, '#2e1c10', { sombra: 0.3, brillo: 0.2, linea: 0.35 });
    pintura(ctx, c => c.roundRect(-6.4, hy - 2.8, 2.4, 2.8, 0.5), '#c9ccd0', { sombra: 0.3, brillo: 0.6, linea: 0.35 });
    // Ala: se levanta atrás y adelante baja un poco antes de la punta; arriba la cara iluminada, abajo el espesor
    pintura(ctx, c => { c.moveTo(-15, hy - 2.2); c.quadraticCurveTo(-12, hy + 1.4, 0.6, hy + 1.2); c.quadraticCurveTo(11.4, hy + 1.2, 15.8, hy + 0.2); c.lineTo(16, hy + 1.4);
      c.quadraticCurveTo(12, hy + 3.2, 0.6, hy + 3.2); c.quadraticCurveTo(-12.2, hy + 3.4, -15.2, hy - 1.2); c.closePath(); }, ajustarColor(G, -0.04), { sombra: 0.6, brillo: 0.4 });
    raya(ctx, ajustarColor(G, -0.4), 0.4, curvaPts(-14.6, hy - 0.9, -10, hy + 2.6, 0.6, hy + 2.4));
    raya(ctx, ajustarColor(G, -0.4), 0.4, curvaPts(0.6, hy + 2.4, 10, hy + 2.4, 15.6, hy + 1));
  },
  /* Ninja: capucha cerrada que deja ver solo la franja de los ojos, pliegues de la tela, vincha roja y el nudo con las puntas al viento */
  ninja(ctx, C, hy, e) {
    const N = C.gorra, R = C.cinturon;
    // Capucha: un solo contorno con la muesca de la franja de los ojos (se ven los ojos de la cara)
    pintura(ctx, c => { c.moveTo(-9.6, hy + 12.6); c.quadraticCurveTo(-10.8, hy + 2, -7, hy - 3); c.quadraticCurveTo(-2, hy - 7, 4, hy - 5.4); c.quadraticCurveTo(8.8, hy - 3.4, 9.3, hy + 2.4); c.lineTo(9.7, hy + 4.6);
      c.quadraticCurveTo(5.6, hy + 4, 2.2, hy + 4.6); c.quadraticCurveTo(1, hy + 6.6, 1.6, hy + 9); c.quadraticCurveTo(6, hy + 9.6, 10.7, hy + 9.2);
      c.quadraticCurveTo(10.6, hy + 13, 9.3, hy + 15.4); c.quadraticCurveTo(7.6, hy + 17.9, 3.6, hy + 18); c.lineTo(-2, hy + 17.7); c.quadraticCurveTo(-7, hy + 16.6, -9.6, hy + 12.6); }, N, { sombra: 0.9, brillo: 0.3, oscuro: 0.4 });
    if (!Pincel.silueta) {
      detalle(ctx, 'rgba(0,0,0,0.3)', c => { c.moveTo(2.2, hy + 4.6); c.quadraticCurveTo(5.6, hy + 4, 9.7, hy + 4.6); c.lineTo(9.6, hy + 5.6); c.quadraticCurveTo(5.6, hy + 5, 2.2, hy + 5.6); });   // sombra bajo el borde
      for (let k = 0; k < 3; k++) raya(ctx, 'rgba(255,255,255,0.1)', 0.45, curvaPts(-8 + k * 1.4, hy + 9 + k * 2, -3, hy + 12 + k * 1.4, 1.6 + k * 1.6, hy + 11 + k * 2.4));   // pliegues de la tela
      raya(ctx, ajustarColor(N, -0.5), 0.4, curvaPts(10.6, hy + 10.4, 7, hy + 12.6, 3, hy + 11.6, 4));
      raya(ctx, 'rgba(255,255,255,0.12)', 0.5, curvaPts(-8.4, hy + 1, -5.6, hy - 4.6, 2, hy - 5));
    }
    // Vincha roja sobre la frente y el nudo atrás con las dos puntas que flamean
    pintura(ctx, c => { c.moveTo(-9.9, hy + 2.4); c.quadraticCurveTo(0, hy - 1.4, 9.2, hy + 0.2); c.lineTo(9.4, hy + 2.6); c.quadraticCurveTo(0, hy + 1.2, -10, hy + 5); c.closePath(); }, R, { sombra: 0.4, brillo: 0.35, linea: 0.4 });
    const ond = Math.sin(performance.now() / 180) * 0.8;
    pintura(ctx, c => { c.moveTo(-9.4, hy + 3); c.quadraticCurveTo(-13, hy + 1.6 + ond, -17, hy + 3.6 + ond); c.lineTo(-16, hy + 5.4 + ond); c.quadraticCurveTo(-12.6, hy + 4 + ond, -9.6, hy + 4.8); c.closePath(); }, ajustarColor(R, -0.06), { sombra: 0.4, brillo: 0.3, linea: 0.4 });
    pintura(ctx, c => { c.moveTo(-9.6, hy + 4.4); c.quadraticCurveTo(-12.4, hy + 7 - ond, -14.6, hy + 11 - ond); c.lineTo(-12.8, hy + 11.6 - ond); c.quadraticCurveTo(-11.6, hy + 8 - ond, -9.2, hy + 5.8); c.closePath(); }, ajustarColor(R, -0.12), { sombra: 0.4, brillo: 0.25, linea: 0.4 });
    pintura(ctx, c => c.ellipse(-9.8, hy + 3.8, 1.7, 1.5, 0, 0, Math.PI * 2), R, { sombra: 0.4, brillo: 0.4, linea: 0.4 });   // nudo
  },
};
function dibujarCabeza(ctx, S, C, ty, e) {
  const hy = -78 + ty, tipo = S.cabeza;
  // Cabeza de tamaño real (72 % del dibujo, unas 6,5 cabezas de alto en total) con el mentón arriba del cuello como pivote
  const cabezaArriba = () => { ctx.translate(1, hy + 13.2); ctx.scale(0.72, 0.72); ctx.translate(-1, -(hy + 16.4)); };
  if (tipo === 'casco-alado' || tipo === 'pelo-largo') { ctx.save(); cabezaArriba(); peloAtras(ctx, C, hy); ctx.restore(); }
  // Cuello largo y fino, con el trapecio que baja al hombro, la nuez y el tendón
  const piel = C.piel, cuelloColor = tipo === 'ninja' || tipo === 'casco-armadura' ? C.chaqueta : piel;
  pintura(ctx, c => { c.moveTo(-4, -57.4 + ty); c.quadraticCurveTo(-2.4, -59 + ty, -2.4, -62 + ty); c.lineTo(-2.2, -66.4 + ty); c.lineTo(3, -66.2 + ty);
    c.quadraticCurveTo(2.8, -63.4 + ty, 3.6, -61 + ty); c.quadraticCurveTo(4.2, -58.6 + ty, 5.4, -57.4 + ty); }, ajustarColor(cuelloColor, -0.04), { sombra: 0.6 });
  if (!Pincel.silueta && cuelloColor === piel) {
    detalle(ctx, 'rgba(60, 30, 20, 0.22)', c => { c.moveTo(-2.2, -66 + ty); c.lineTo(3, -65.8 + ty); c.lineTo(2.9, -63.8 + ty); c.quadraticCurveTo(0.4, -63.4 + ty, -2.3, -64.2 + ty); });   // sombra de la mandíbula
    raya(ctx, ajustarColor(piel, -0.28), 0.4, [[-0.4, -63.6 + ty], [1.4, -58.6 + ty]]);   // tendón
    detalle(ctx, ajustarColor(piel, -0.1), elipse(3, -61.6 + ty, 0.6, 1));                 // nuez
  }
  if (tipo === 'casco-armadura') for (let k = 0; k < 3; k++) {   // gola: anillos de metal articulados alrededor del cuello
    pintura(ctx, c => c.roundRect(-3.6 + k * 0.3, -66.2 + k * 2.6 + ty, 7.6 - k * 0.1, 2.4, 1), ajustarColor(C.chaqueta, 0.06 - k * 0.04), { sombra: 0.4, brillo: 0.4, linea: 0.4 });
  }
  if (S.shemagh) {   // shemagh: pañuelo grueso enrollado al cuello, con los pliegues, la trama y una punta que cae sobre el pecho
    const Sh = S.shemagh;
    pintura(ctx, c => { c.moveTo(3.4, -58.6 + ty); c.quadraticCurveTo(7.4, -57 + ty, 7.6, -52.6 + ty); c.lineTo(5.4, -53.4 + ty); c.quadraticCurveTo(4.4, -56 + ty, 2.4, -57.4 + ty); }, ajustarColor(Sh, -0.08), { sombra: 0.5 });
    pintura(ctx, c => { c.moveTo(-5.6, -57.2 + ty); c.quadraticCurveTo(-6.8, -61 + ty, -3.4, -63.4 + ty); c.quadraticCurveTo(0.6, -64.6 + ty, 4.4, -63 + ty);
      c.quadraticCurveTo(6.6, -60.4 + ty, 5.8, -57.4 + ty); c.quadraticCurveTo(0, -55.6 + ty, -5.6, -57.2 + ty); }, Sh, { sombra: 0.9, brillo: 0.3 });
    if (!Pincel.silueta) {
      for (const [y0, y1] of [[-61.8, -61], [-59.6, -58.8]]) raya(ctx, ajustarColor(Sh, -0.3), 0.45, [[-4.8, y0 + ty], [0.4, y0 - 0.9 + ty], [5, y1 + ty]]);   // vueltas
      for (let k = 0; k < 9; k++) detalle(ctx, ajustarColor(Sh, -0.22), c => c.rect(-4 + (k % 3) * 3.2 + (k > 5 ? 1.2 : 0), -62.4 + Math.floor(k / 3) * 1.9 + ty, 0.6, 0.6));   // trama
    }
  }
  if (S.panuelo) {   // pañuelo anudado en la base del cuello, con las puntas cayendo atrás
    pintura(ctx, c => { c.moveTo(-5.8, -59.4 + ty); c.quadraticCurveTo(0, -61 + ty, 6.4, -59.6 + ty); c.quadraticCurveTo(7.2, -57.8 + ty, 6.2, -56.8 + ty); c.quadraticCurveTo(0.6, -55.2 + ty, -5.4, -56.6 + ty); c.quadraticCurveTo(-6.6, -58 + ty, -5.8, -59.4 + ty); }, S.panuelo, { sombra: 0.7 });
    pintura(ctx, c => { c.moveTo(-4.6, -58.4 + ty); c.quadraticCurveTo(-8.4, -57 + ty, -10, -53 + ty); c.lineTo(-7.8, -52.4 + ty); c.quadraticCurveTo(-7, -55.4 + ty, -3.6, -56.8 + ty); }, ajustarColor(S.panuelo, -0.1), { sombra: 0.6 });
    pintura(ctx, c => c.ellipse(-4.4, -57.8 + ty, 1.5, 1.3, 0, 0, Math.PI * 2), ajustarColor(S.panuelo, -0.05), { sombra: 0.5, linea: 0.35 });   // nudo
    if (!Pincel.silueta) raya(ctx, ajustarColor(S.panuelo, -0.35), 0.4, [[-2, -58.4 + ty], [4, -57.8 + ty]]);
  }
  ctx.save(); cabezaArriba();
  // Cara de perfil: nuca y cráneo, frente, cejas, nariz, labios, mentón y la mandíbula
  const cara = c => {
    c.moveTo(-4.6, hy + 16.4); c.quadraticCurveTo(-8.8, hy + 13, -8.8, hy + 7); c.quadraticCurveTo(-8.6, hy - 0.6, -1, hy - 0.8);
    c.quadraticCurveTo(6.4, hy - 0.8, 7.6, hy + 3.6); c.lineTo(8.2, hy + 5.2);                    // frente y arco de la ceja
    c.quadraticCurveTo(8.4, hy + 6.6, 9.6, hy + 8.4); c.quadraticCurveTo(10.8, hy + 9.6, 9.6, hy + 10);   // nariz
    c.lineTo(8.8, hy + 10.2); c.quadraticCurveTo(9.4, hy + 10.8, 9, hy + 11.6);                       // labio de arriba
    c.lineTo(8.4, hy + 11.9); c.quadraticCurveTo(9.2, hy + 12.4, 8.8, hy + 13.1);                     // labio de abajo
    c.quadraticCurveTo(9.2, hy + 15, 7.6, hy + 15.8); c.quadraticCurveTo(4, hy + 17.4, 0.4, hy + 16.2);   // mentón y mandíbula
    c.quadraticCurveTo(-2.4, hy + 16.6, -4.6, hy + 16.4);
  };
  pintura(ctx, cara, piel, { sombra: 1.1, oscuro: 0.22, brillo: 0.35 });
  if (tipo === 'soldado') barbaCorta(ctx, C.pelo, hy);
  else if (S.barba) barbaLlena(ctx, S.barba, hy, S.trenza);
  else if (tipo !== 'payaso' && tipo !== 'mascara' && !Pincel.silueta) {   // barba de tres días: sombra sobre la mandíbula y el bigote, con puntitos
    ctx.save(); ctx.beginPath(); cara(ctx); ctx.clip();
    ctx.fillStyle = 'rgba(60, 40, 30, 0.2)'; ctx.beginPath(); ctx.moveTo(-1, hy + 11.4); ctx.quadraticCurveTo(4, hy + 12.4, 8, hy + 10.6); ctx.lineTo(11, hy + 12); ctx.lineTo(10, hy + 18); ctx.lineTo(-2, hy + 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(50, 32, 24, 0.35)'; for (let k = 0; k < 26; k++) { ctx.fillRect(azar(k, 401) * 10, hy + 11.6 + azar(k, 402) * 5, 0.3, 0.3); }
    ctx.restore();
  }
  if ((tipo === 'gorra' || tipo === 'sombrero') && !Pincel.silueta) {   // pelo corto bajo la gorra y la patilla
    pintura(ctx, c => { c.moveTo(-8.6, hy + 7); c.quadraticCurveTo(-8.8, hy + 1, -3, hy + 0.4); c.lineTo(-1.6, hy + 3); c.quadraticCurveTo(-4.4, hy + 3.6, -4.6, hy + 9.6); c.lineTo(-6.4, hy + 10.2); }, C.pelo, { sombra: 0.5, brillo: 0.15, linea: 0.35 });
    pintura(ctx, c => c.roundRect(-0.8, hy + 3.2, 1.6, 5.2, 0.6), C.pelo, { sombra: 0.3, brillo: false, linea: 0.3 });
  }
  // Oreja con su pliegue
  pintura(ctx, c => { c.moveTo(-1.4, hy + 6.2); c.quadraticCurveTo(-4.8, hy + 5.4, -4.6, hy + 8.6); c.quadraticCurveTo(-4.6, hy + 11.6, -1.2, hy + 11.4); c.quadraticCurveTo(-2.2, hy + 8.8, -1.4, hy + 6.2); }, ajustarColor(piel, -0.04), { sombra: 0.6, linea: 0.4 });
  raya(ctx, ajustarColor(piel, -0.35), 0.4, [[-2.2, hy + 7.4], [-3.4, hy + 8.6], [-2.4, hy + 10.2]]);
  if (tipo === 'payaso') detalle(ctx, 'rgba(40,30,60,0.75)', elipse(5.2, hy + 6.8, 3.2, 2.6));          // ojeras pintadas
  if (!Pincel.silueta) {
    // Ojo almendrado: blanco, iris, pupila y el brillo; el párpado de arriba marcado (baja la mirada al recargar)
    const ox = 5.6, oy = hy + 6.6, baja = e.mirar;
    ctx.save(); ctx.beginPath(); ctx.moveTo(ox - 2.4, oy); ctx.quadraticCurveTo(ox, oy - 1.9 + baja * 0.8, ox + 2.2, oy - 0.2); ctx.quadraticCurveTo(ox, oy + 1.5, ox - 2.4, oy); ctx.closePath();
    ctx.fillStyle = '#f2ede4'; ctx.fill(); ctx.clip();
    ctx.fillStyle = '#4a3322'; ctx.beginPath(); ctx.arc(ox + 0.7, oy + baja * 0.5, 1.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.arc(ox + 0.8, oy + baja * 0.5, 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(ox + 0.2, oy - 0.6 + baja * 0.5, 0.5, 0.5);
    ctx.restore();
    raya(ctx, '#2a1a12', 0.7, [[ox - 2.5, oy - 0.1], [ox, oy - 1.9 + baja * 0.8], [ox + 2.3, oy - 0.3]]);                   // párpado
    raya(ctx, ajustarColor(piel, -0.25), 0.35, [[ox - 1.6, oy + 1.3], [ox + 1.4, oy + 1.1]]);                                // ojera suave
    raya(ctx, tipo === 'payaso' ? '#2a3a20' : C.pelo, 1.1, [[ox - 3, oy - 3], [ox + 2.6, oy - 3.4]]);                       // ceja
    if (!S.barba && tipo !== 'payaso' && tipo !== 'soldado') raya(ctx, 'rgba(110, 50, 40, 0.75)', 0.5, [[7.4, hy + 11.9], [8.6, hy + 11.8]]);    // boca
    raya(ctx, ajustarColor(piel, -0.25), 0.4, [[7.8, hy + 9.8], [7, hy + 11.2]]);                                             // surco de la nariz
    detalle(ctx, 'rgba(200, 90, 70, 0.12)', elipse(4.6, hy + 9.6, 2.2, 1.4));                                                 // mejilla
  }
  // Lo de arriba de la cabeza
  switch (tipo) {
    case 'soldado': {   // pelo corto con volumen arriba, entradas en la frente y la nuca rebajada
      const P = C.pelo;
      pintura(ctx, c => { c.moveTo(-6.8, hy + 11); c.quadraticCurveTo(-9.6, hy + 7, -9.2, hy + 2.6); c.quadraticCurveTo(-8.4, hy - 2.8, -2, hy - 3.2); c.quadraticCurveTo(4.4, hy - 3.6, 7.2, hy - 0.6);
        c.quadraticCurveTo(8.6, hy + 1.2, 7.8, hy + 2.8); c.quadraticCurveTo(5, hy + 1, 1.4, hy + 1.6); c.quadraticCurveTo(-1.4, hy + 2.4, -1.8, hy + 5.8); c.lineTo(-4.8, hy + 6);
        c.quadraticCurveTo(-5.6, hy + 8.6, -6.8, hy + 11); }, P, { sombra: 0.6, brillo: 0.22, linea: 0.4 });
      if (!Pincel.silueta) for (let k = 0; k < 7; k++) { const x = -7 + k * 2.2; raya(ctx, ajustarColor(P, 0.2), 0.4, [[x, hy - 0.4 + Math.abs(k - 3) * 0.4], [x + 1.6, hy - 2.2 + Math.abs(k - 3) * 0.3]]); }
      break;
    }
    case 'gorra': {   // gorra táctica: copa con gajos y costuras, botón, parche, visera con espesor y las antiparras arriba
      const G = C.gorra;
      pintura(ctx, c => { c.moveTo(-9.4, hy + 3.6); c.quadraticCurveTo(-10, hy - 6.6, 0.4, hy - 6.8); c.quadraticCurveTo(9.6, hy - 6.4, 9.6, hy + 2.6); c.lineTo(9.6, hy + 3.8); c.lineTo(-9.4, hy + 4.4); }, G, { sombra: 1 });
      if (!Pincel.silueta) {
        raya(ctx, ajustarColor(G, -0.35), 0.45, [[0.4, hy - 6.6], [-3.4, hy - 2], [-5, hy + 4]]); raya(ctx, ajustarColor(G, -0.35), 0.45, [[0.4, hy - 6.6], [4.6, hy - 2.4], [5.4, hy + 3.6]]);   // gajos
        raya(ctx, ajustarColor(G, -0.4), 0.5, [[-9.2, hy + 2.6], [9.4, hy + 2]]);                                                                // cinta de la base
        pintura(ctx, c => c.roundRect(-7.4, hy - 2.6, 4.6, 3.2, 0.6), '#4f5536', { sombra: 0.3, brillo: 0.2, linea: 0.3 });                      // parche
      }
      pintura(ctx, c => c.ellipse(0.4, hy - 6.8, 1.4, 0.8, 0, 0, Math.PI * 2), ajustarColor(G, 0.1), { sombra: 0.3, linea: 0.3 });             // botón
      // Visera: arriba la cara iluminada, abajo el espesor en sombra
      pintura(ctx, c => { c.moveTo(4, hy + 1.6); c.quadraticCurveTo(13, hy + 0.6, 18.6, hy + 2.6); c.quadraticCurveTo(19.6, hy + 3.6, 18, hy + 4.4); c.quadraticCurveTo(12, hy + 3.6, 4, hy + 4.6); }, ajustarColor(G, -0.08), { sombra: 0.7, brillo: 0.4 });
      if (!Pincel.silueta) raya(ctx, ajustarColor(G, -0.45), 0.4, [[5, hy + 3.4], [17.6, hy + 3.6]]);
      linea(ctx, tinta('#4a3a26'), 1.5, [[-9, hy + 0.8], [-2, hy - 3.6], [4, hy - 3.2]]);                                                         // correa de las antiparras
      pieza(ctx, redondo(1.5, hy - 5.8, 7, 4.2, 1.8), '#3a3a3e', 1.5, 8.5);
      if (!Pincel.silueta) {
        const vidrio = ctx.createLinearGradient(2, hy - 5, 8, hy - 2);
        vidrio.addColorStop(0, '#d9a85a'); vidrio.addColorStop(0.5, '#7a4e22'); vidrio.addColorStop(1, '#2a1a0e');
        ctx.fillStyle = vidrio; ctx.beginPath(); ctx.ellipse(5, hy - 3.7, 2.6, 1.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.fillRect(3.6, hy - 4.6, 1.2, 0.6);
      }
      break;
    }
    default:   // los demás personajes: casco, máscara, capucha, peinado o sombrero, cada uno con su dibujo
      if (CABEZAS_SKIN[tipo]) CABEZAS_SKIN[tipo](ctx, C, hy, e, cara);
  }
  ctx.restore();   // fin de la cabeza achicada
}
