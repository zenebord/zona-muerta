/* ===== Personajes (skins) =====
 * El sobreviviente de siempre y ocho personajes inspirados en arquetipos conocidos, con diseños propios
 * (sin nombres, logos ni emblemas de marcas registradas). Cada skin cambia colores, si lleva mochila o capa,
 * cómo es el torso y qué tiene en la cabeza. Se elige en el menú principal y queda guardada.
 */
const SKINS = {
  sobreviviente: { colores: {}, mochila: true, torso: 'tactico', cabeza: 'gorra', panuelo: '#8c3b2b' },
  trueno: { torso: 'placas', cabeza: 'casco-alado', capa: '#a3221c', barba: '#c99a3f',
    colores: { chaqueta: '#3b3e46', chaleco: '#6f7680', bolsillo: '#b9c0ca', pantalon: '#2b2d34', rodillera: '#6f7680', bota: '#4a3322', cinturon: '#5a3d24', guante: '#4a3322', pelo: '#d6ae55', bolsa: '#3b3e46', funda: '#3b3e46' } },
  armadura: { torso: 'armadura', cabeza: 'casco-armadura',
    colores: { piel: '#c0c4ca', chaqueta: '#4b5058', chaleco: '#626873', bolsillo: '#c8641c', pantalon: '#4b5058', rodillera: '#c8641c', bota: '#3b3f46', guante: '#c8641c', cinturon: '#3b3f46', bolsa: '#4b5058', funda: '#3b3f46' } },
  cazador: { torso: 'chaqueta', cabeza: 'mascara',
    colores: { chaqueta: '#4c5138', pantalon: '#2e2f34', bota: '#1e1a16', guante: '#4a3b2c', piel: '#c9a58a', bolsa: '#3a3b30', funda: '#2a2622', cinturon: '#2a1e14', rodillera: '#2e2f34' } },
  centinela: { torso: 'traje', cabeza: 'casco-centinela',
    colores: { chaqueta: '#25365f', chaleco: '#2d4173', pantalon: '#25365f', rodillera: '#25365f', bota: '#8e2620', guante: '#8e2620', cinturon: '#6c5a3a', bolsa: '#6c5a3a', funda: '#25365f', gorra: '#25365f' } },
  bufon: { torso: 'bufon', cabeza: 'payaso', faldon: true,
    colores: { chaqueta: '#5c2a7c', chaleco: '#3f8a3c', bolsillo: '#e39a22', pantalon: '#5c2a7c', rodillera: '#5c2a7c', bota: '#2a1e2a', guante: '#5c2a7c', piel: '#eeeae2', pelo: '#3fa04a', cinturon: '#2a1e2a', bolsa: '#5c2a7c', funda: '#2a1e2a' } },
  mares: { torso: 'escamas', cabeza: 'pelo-largo', barba: '#8a6430',
    colores: { chaqueta: '#1d7c6c', chaleco: '#27a089', pantalon: '#205c3c', rodillera: '#205c3c', bota: '#205c3c', guante: '#c9a227', cinturon: '#c9a227', pelo: '#a07a3c', bolsa: '#205c3c', funda: '#205c3c' } },
  vaquero: { torso: 'cuero', cabeza: 'sombrero', panuelo: '#a8261e',
    colores: { chaqueta: '#9a7a52', chaleco: '#4b3221', pantalon: '#3d4f6e', rodillera: '#3d4f6e', bota: '#5a3a22', guante: '#6b4a2b', cinturon: '#3a2414', bolsa: '#5a3a22', funda: '#5a3a22', gorra: '#6b4a2b' } },
  ninja: { torso: 'ninja', cabeza: 'ninja',
    colores: { chaqueta: '#1e1f26', chaleco: '#282a32', pantalon: '#1e1f26', rodillera: '#1e1f26', bota: '#16171c', guante: '#16171c', cinturon: '#7a1e1e', bolsa: '#1e1f26', funda: '#16171c', gorra: '#1e1f26' } },
};
const ORDEN_SKINS = Object.keys(SKINS);
// La skin del jugador: la suya si tiene (vista previa) o la elegida en la configuración
const skinDe = j => SKINS[j && j.skin] || SKINS[Config.get('skin')] || SKINS.sobreviviente;

/* ---------- Detrás del cuerpo: capa y faldón ---------- */
function dibujarCapa(ctx, color, ty, t, mov, largo = 1) {
  const ond = Math.sin(t / 220) * 1.5 + mov * 3;
  const fin = -12 - (1 - largo) * 24;   // largo < 1: faldón del saco, más corto que una capa
  pieza(ctx, c => {
    c.moveTo(-9, -59 + ty); c.quadraticCurveTo(-15 - ond, -40 + ty, -21 - ond * 2, fin);
    c.lineTo(-17 - ond * 1.5, fin + 2); c.lineTo(-13 - ond, fin - 1); c.quadraticCurveTo(-8, -32 + ty, -2, -58 + ty); c.closePath();
  }, color, -24, 0);
  sombraInterna(ctx, c => { c.moveTo(-9, -58 + ty); c.quadraticCurveTo(-12, -40 + ty, -14 - ond, fin); c.lineTo(-11, fin); c.quadraticCurveTo(-7, -36 + ty, -5, -58 + ty); }, 0.22);
}

/* ---------- Torso de cada skin ---------- */
// Torso más angosto que el dibujo original (88 % de ancho): figura más esbelta sin tocar cada traje
function dibujarTorso(ctx, S, C, ty) { ctx.save(); ctx.scale(0.88, 1); torsoCompleto(ctx, S, C, ty); ctx.restore(); }
function torsoCompleto(ctx, S, C, ty) {
  const trapecio = poli([[-13, -36 + ty], [-15, -58 + ty], [15, -58 + ty], [12, -36 + ty]]);
  const solapas = color => {
    pieza(ctx, poli([[-6, -58 + ty], [-8, -63 + ty], [-1, -59 + ty]]), color, -8, -1);
    pieza(ctx, poli([[6, -58 + ty], [8, -63 + ty], [1, -59 + ty]]), color, 1, 8);
  };
  // Torso con forma: espalda curva, hombros redondeados, pecho y la cintura más angosta
  pintura(ctx, c => { c.moveTo(-12.6, -36 + ty); c.quadraticCurveTo(-15.6, -47 + ty, -14.4, -56 + ty); c.quadraticCurveTo(-13.4, -59.6 + ty, -8, -59.6 + ty);
    c.lineTo(8.6, -59.6 + ty); c.quadraticCurveTo(14.4, -59.4 + ty, 14.6, -55 + ty); c.quadraticCurveTo(15.4, -46 + ty, 11.8, -36 + ty); }, C.chaqueta);
  switch (S.torso) {
    case 'tactico': {   // chaleco portaplacas: placa con cintas, tres portacargadores con los cargadores asomando, radio y hombreras
      const V = C.chaleco;
      pintura(ctx, c => c.roundRect(-14.6, -57.6 + ty, 5, 21, 1.6), C.correa, { sombra: 0.6, brillo: 0.2 });                              // correa de la mochila
      pintura(ctx, c => { c.moveTo(-9.6, -37 + ty); c.lineTo(-10.6, -56 + ty); c.quadraticCurveTo(-10, -58.6 + ty, -6.6, -58.4 + ty); c.lineTo(7.6, -58.4 + ty);
        c.quadraticCurveTo(11, -58.2 + ty, 11, -55.4 + ty); c.lineTo(10.4, -37 + ty); }, V);                                              // placa
      if (!Pincel.silueta) for (let k = 0; k < 4; k++) raya(ctx, ajustarColor(V, -0.35), 0.5, [[-9.4, -55 + k * 4.4 + ty], [10, -55 + k * 4.4 + ty]]);   // cintas para enganchar
      for (let k = 0; k < 3; k++) {   // portacargadores: cargador que asoma, cuerpo y tapa con abrojo
        const bx = -8.4 + k * 6.2, by = -48.6 + ty;
        pintura(ctx, c => c.roundRect(bx + 1, by - 2.6, 3.6, 3.4, 0.6), '#2a2b2e', { sombra: 0.4, linea: 0.3 });
        pintura(ctx, c => c.roundRect(bx, by, 5.6, 9.6, 1.2), C.bolsillo, { sombra: 0.7 });
        pintura(ctx, c => c.roundRect(bx - 0.2, by - 0.4, 6, 3, 0.9), ajustarColor(C.bolsillo, -0.1), { sombra: 0.4, brillo: 0.25, linea: 0.35 });
        detalle(ctx, ajustarColor(C.bolsillo, 0.3), c => c.rect(bx + 1.4, by + 0.7, 2.8, 0.9));
      }
      pintura(ctx, c => c.roundRect(-6.6, -57 + ty, 9.4, 5.6, 1.2), ajustarColor(V, 0.08), { sombra: 0.5, brillo: 0.25, linea: 0.4 });   // bolsillo de mapas
      pintura(ctx, c => c.roundRect(-5.4, -56 + ty, 4.4, 2.6, 0.5), '#5a5f3a', { sombra: 0.3, brillo: 0.2, linea: 0.3 });                // parche de abrojo
      // Hombreras acolchadas y la radio con su antena y la luz verde
      pintura(ctx, c => c.roundRect(-8.6, -60.4 + ty, 6, 3.6, 1.6), ajustarColor(V, 0.05), { sombra: 0.5, linea: 0.4 });
      pintura(ctx, c => c.roundRect(3.4, -60.4 + ty, 6, 3.6, 1.6), ajustarColor(V, 0.05), { sombra: 0.5, linea: 0.4 });
      pintura(ctx, c => c.roundRect(9.6, -57.2 + ty, 4.6, 7.4, 1.2), '#2b2d30', { sombra: 0.5, linea: 0.4 });
      raya(ctx, '#1a1a1c', 0.9, [[12.6, -57 + ty], [13.4, -66 + ty]]);
      detalle(ctx, '#7fd36a', c => c.rect(10.6, -55.6 + ty, 1.4, 1));
      if (!Pincel.silueta) for (let k = 0; k < 3; k++) detalle(ctx, '#1a1b1e', c => c.rect(10.4, -53.4 + k * 1.3 + ty, 3, 0.5));         // rejilla del parlante
      break;
    }
    case 'placas':    // cota de malla oscura y peto de acero con dos filas de discos
      if (!Pincel.silueta) for (let y = -56; y < -38; y += 2.4) linea(ctx, 'rgba(255,255,255,0.08)', 0.5, [[-13, y + ty], [13, y + ty]]);
      pieza(ctx, poli([[-9, -38 + ty], [-10.5, -57 + ty], [10.5, -57 + ty], [9, -38 + ty]]), C.chaleco, -10, 10);
      for (let fila = 0; fila < 2; fila++) for (let col = 0; col < 3; col++) pieza(ctx, circulo(-5.5 + col * 5.5, -52 + fila * 6 + ty, 2.2), C.bolsillo, -8, 8);
      pieza(ctx, circulo(-11, -56 + ty, 4.4), C.chaleco, -15, -7);   // hombrera
      break;
    case 'armadura':  // placas articuladas gris acero con detalles naranjas y una línea de luz
      pieza(ctx, poli([[-10, -40 + ty], [-11, -57 + ty], [11, -57 + ty], [10, -40 + ty]]), C.chaleco, -11, 11);
      pieza(ctx, poli([[-4, -57 + ty], [4, -57 + ty], [3, -50 + ty], [-3, -50 + ty]]), C.bolsillo, -4, 4);
      for (let k = 0; k < 3; k++) linea(ctx, 'rgba(0,0,0,0.4)', 0.6, [[-9, -48 + k * 3.2 + ty], [9, -48 + k * 3.2 + ty]]);
      pieza(ctx, circulo(-11.5, -56 + ty, 4.6), C.bolsillo, -16, -7);
      if (!Pincel.silueta) { ctx.save(); ctx.shadowColor = '#5ff3ff'; ctx.shadowBlur = 4; ctx.fillStyle = '#9ff8ff'; ctx.fillRect(-6, -53.5 + ty, 12, 1.1); ctx.restore(); }
      break;
    case 'chaqueta':  // campera de trabajo gastada, cierre abierto y manchas
      solapas(ajustarColor(C.chaqueta, 0.1));
      linea(ctx, 'rgba(0,0,0,0.45)', 0.7, [[4, -58 + ty], [3, -37 + ty]]);
      pieza(ctx, redondo(5.5, -48 + ty, 5, 5, 0.8), ajustarColor(C.chaqueta, -0.1), 5, 11);
      detalle(ctx, 'rgba(70,20,15,0.55)', elipse(-4, -46 + ty, 3, 2));
      detalle(ctx, 'rgba(40,30,20,0.4)', elipse(7, -41 + ty, 2.4, 1.6));
      break;
    case 'traje':     // traje azul de combate con galón plateado en el pecho
      pieza(ctx, poli([[-9, -40 + ty], [-10, -57 + ty], [10, -57 + ty], [9, -40 + ty]]), C.chaleco, -10, 10);
      pieza(ctx, poli([[-5.5, -54 + ty], [0, -49 + ty], [5.5, -54 + ty], [5.5, -51.5 + ty], [0, -46.5 + ty], [-5.5, -51.5 + ty]]), '#d8dce3', -5.5, 5.5);
      for (const y of [-43, -40.5]) linea(ctx, 'rgba(255,255,255,0.18)', 0.6, [[-9, y + ty], [9, y + ty]]);
      solapas(ajustarColor(C.chaqueta, 0.1));
      break;
    case 'bufon':     // saco violeta, chaleco verde, camisa naranja y corbata
      pieza(ctx, poli([[-4, -38 + ty], [-5, -57 + ty], [8, -57 + ty], [8, -38 + ty]]), C.chaleco, -5, 8);
      pieza(ctx, poli([[-1, -58 + ty], [5, -58 + ty], [3, -52 + ty], [1, -52 + ty]]), C.bolsillo, -1, 5);
      pieza(ctx, poli([[1.4, -53 + ty], [2.6, -53 + ty], [3.2, -44 + ty], [2, -42.5 + ty], [0.8, -44 + ty]]), '#2a1e2a', 0.8, 3.2);
      for (const y of [-49, -45, -41]) detalle(ctx, '#d8c070', circulo(6, y + ty, 0.5));
      solapas(ajustarColor(C.chaqueta, 0.15));
      break;
    case 'escamas':   // camisa de escamas verdeagua y cuello dorado
      if (!Pincel.silueta) {
        ctx.save(); ctx.beginPath(); trapecio(ctx); ctx.clip();
        ctx.strokeStyle = 'rgba(160,255,220,0.35)'; ctx.lineWidth = 0.5;
        for (let f = 0; f < 9; f++) for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(-14 + k * 3.4 + (f % 2) * 1.7, -57 + f * 2.5 + ty, 1.7, 0, Math.PI); ctx.stroke(); }
        ctx.restore();
      }
      pieza(ctx, poli([[-8, -58 + ty], [8, -58 + ty], [5, -55 + ty], [-5, -55 + ty]]), C.cinturon, -8, 8);
      break;
    case 'cuero':     // camisa clara con botones y chaleco de cuero abierto
      pieza(ctx, poli([[-13, -37 + ty], [-14.5, -57.5 + ty], [-2, -57.5 + ty], [-3, -37 + ty]]), C.chaleco, -14, -2);
      pieza(ctx, poli([[7, -37 + ty], [8.5, -57.5 + ty], [14.5, -57.5 + ty], [12, -37 + ty]]), C.chaleco, 7, 14);
      for (const y of [-53, -48, -43]) detalle(ctx, '#e8dcc0', circulo(2.5, y + ty, 0.55));
      detalle(ctx, 'rgba(0,0,0,0.25)', c => c.rect(9, -49 + ty, 3.5, 3));
      break;
    case 'ninja':     // traje negro cruzado y faja roja
      linea(ctx, tinta(C.chaleco), 2.2, [[-10, -57 + ty], [8, -40 + ty]]);
      linea(ctx, tinta(C.chaleco), 2.2, [[10, -57 + ty], [-8, -40 + ty]]);
      pieza(ctx, redondo(-13, -41 + ty, 25, 5, 1), C.cinturon, -13, 12);
      break;
  }
}

/* ---------- Cabeza de cada skin ---------- */
// Pelo largo que cae por la espalda (va antes que la cara)
function peloAtras(ctx, C, hy) {
  pieza(ctx, poli([[-8, hy + 1], [-3, hy - 2], [-2, hy + 6], [-6, hy + 16], [-9, hy + 22], [-13, hy + 21], [-11.5, hy + 10], [-10, hy + 4]]), C.pelo, -13, -2);
}
function barbaLlena(ctx, color, hy) {
  pieza(ctx, poli([[-7.5, hy + 9], [8.2, hy + 9.5], [8.6, hy + 13], [5.4, hy + 18.5], [-2.5, hy + 19], [-7.6, hy + 14]]), color, -8, 9);
  detalle(ctx, ajustarColor(color, -0.35), c => c.rect(4, hy + 12.4, 3.4, 0.9));   // boca entre la barba
}
function dibujarCabeza(ctx, S, C, ty, e) {
  const hy = -78 + ty, tipo = S.cabeza;
  // La cabeza va un poco más chica (88 %) y 4 más arriba, con el mentón como pivote: deja ver el cuello y estiliza la figura
  const cabezaArriba = () => { ctx.translate(1, hy + 16.4 - 4); ctx.scale(0.88, 0.88); ctx.translate(-1, -(hy + 16.4)); };
  if (tipo === 'casco-alado' || tipo === 'pelo-largo') { ctx.save(); cabezaArriba(); peloAtras(ctx, C, hy); ctx.restore(); }
  // Cuello largo y fino, con el trapecio que baja al hombro, la nuez y el tendón
  const piel = C.piel, cuelloColor = tipo === 'ninja' || tipo === 'casco-armadura' ? C.chaqueta : piel;
  pintura(ctx, c => { c.moveTo(-4.8, -57.4 + ty); c.quadraticCurveTo(-2.6, -59.4 + ty, -2.6, -63 + ty); c.lineTo(-2.4, -68.6 + ty); c.lineTo(3.6, -68.4 + ty);
    c.quadraticCurveTo(3.4, -64.8 + ty, 4.4, -61.4 + ty); c.quadraticCurveTo(5, -58.6 + ty, 6.2, -57.4 + ty); }, ajustarColor(cuelloColor, -0.04), { sombra: 0.7 });
  if (!Pincel.silueta && cuelloColor === piel) {
    detalle(ctx, 'rgba(60, 30, 20, 0.22)', c => { c.moveTo(-2.4, -67.6 + ty); c.lineTo(3.6, -67.4 + ty); c.lineTo(3.4, -64.6 + ty); c.quadraticCurveTo(0.4, -64 + ty, -2.5, -65 + ty); });   // sombra de la mandíbula
    raya(ctx, ajustarColor(piel, -0.28), 0.4, [[-0.6, -64.4 + ty], [1.6, -58.6 + ty]]);   // tendón
    detalle(ctx, ajustarColor(piel, -0.1), elipse(3.6, -62.4 + ty, 0.7, 1.1));            // nuez
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
  if (S.barba) barbaLlena(ctx, S.barba, hy);
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
    if (!S.barba && tipo !== 'payaso') raya(ctx, 'rgba(110, 50, 40, 0.75)', 0.5, [[7.4, hy + 11.9], [8.6, hy + 11.8]]);    // boca
    raya(ctx, ajustarColor(piel, -0.25), 0.4, [[7.8, hy + 9.8], [7, hy + 11.2]]);                                             // surco de la nariz
    detalle(ctx, 'rgba(200, 90, 70, 0.12)', elipse(4.6, hy + 9.6, 2.2, 1.4));                                                 // mejilla
  }
  // Lo de arriba de la cabeza
  switch (tipo) {
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
    case 'casco-alado':   // casco de acero con alas a los costados
      pieza(ctx, c => { c.moveTo(-9, hy + 4); c.quadraticCurveTo(-9, hy - 7, 0, hy - 7); c.quadraticCurveTo(9, hy - 7, 9.4, hy + 4); c.lineTo(9.4, hy + 5); c.lineTo(-9, hy + 5); }, '#9aa2ad', -9, 9);
      pieza(ctx, poli([[6.6, hy + 4], [8.4, hy + 4], [8.4, hy + 10], [7.2, hy + 10]]), '#9aa2ad', 6.6, 8.4);   // nasal
      for (const s of [0, 1]) pieza(ctx, poli([[-5 + s, hy - 1 - s * 2], [-13, hy - 9 - s * 3], [-11.5, hy - 5 - s * 2], [-16, hy - 6 - s * 3], [-12, hy - 1 - s], [-15, hy], [-7, hy + 2]]), s ? '#d8dade' : '#eef0f2', -16, -4);
      break;
    case 'casco-armadura':   // casco cerrado con visor de luz
      pieza(ctx, poli([[-9, hy + 2], [-7, hy - 4], [0, hy - 6], [7, hy - 4], [10, hy + 3], [10.5, hy + 12], [7, hy + 17], [-4, hy + 17.5], [-9, hy + 13]]), C.chaqueta, -9, 10.5);
      pieza(ctx, poli([[3, hy + 1], [10, hy + 2], [10.5, hy + 12], [7, hy + 16.4], [3, hy + 15]]), C.bolsillo, 3, 10.5);
      if (!Pincel.silueta) { ctx.save(); ctx.shadowColor = '#5ff3ff'; ctx.shadowBlur = 5; ctx.fillStyle = '#c4fbff'; ctx.fillRect(4.4, hy + 6, 5.6, 1.3); ctx.restore(); }
      linea(ctx, 'rgba(0,0,0,0.5)', 0.5, [[5, hy + 12.6], [9, hy + 12.6]]);
      break;
    case 'mascara':   // cabeza rapada y máscara blanca con agujeros
      detalle(ctx, 'rgba(80,40,40,0.45)', c => c.rect(-5, hy + 1, 5, 0.8));                                   // cicatriz
      pieza(ctx, poli([[1.4, hy + 0.6], [8.4, hy + 1.6], [9.6, hy + 8.4], [8.2, hy + 15], [3, hy + 16.2], [1, hy + 9]]), '#e8e3d4', 1, 9.6);
      if (!Pincel.silueta) {
        ctx.fillStyle = '#1a1612';
        ctx.beginPath(); ctx.ellipse(5.4, hy + 6.4, 1.8, 1.3, 0, 0, Math.PI * 2); ctx.fill();
        for (const [x, y] of [[4, hy + 10], [6, hy + 10.5], [7.4, hy + 12.4], [5, hy + 13], [3.4, hy + 12.4], [7.6, hy + 9], [6.4, hy + 3.4], [3.4, hy + 3.4]]) { ctx.beginPath(); ctx.arc(x, y, 0.45, 0, Math.PI * 2); ctx.fill(); }
      }
      linea(ctx, tinta('#3a2a20'), 0.9, [[1.4, hy + 4], [-7, hy + 3.2]]); linea(ctx, tinta('#3a2a20'), 0.9, [[1.4, hy + 12], [-7, hy + 11]]);
      break;
    case 'casco-centinela':   // casco azul con una franja plateada y barbijo
      pieza(ctx, poli([[-9, hy + 12], [-9.5, hy + 2], [-6, hy - 5], [3, hy - 5.5], [8.6, hy - 1], [9.2, hy + 4], [3, hy + 4.4], [2, hy + 8], [-3, hy + 12]]), C.gorra, -9.5, 9.2);
      linea(ctx, '#d8dce3', 1, [[-6, hy - 3.6], [3, hy - 4], [8, hy]]);
      linea(ctx, tinta('#1a1a1a'), 0.6, [[-2, hy + 11], [4, hy + 15.5]]);
      break;
    case 'payaso':   // sonrisa pintada de oreja a oreja y pelo verde peinado hacia atrás
      if (!Pincel.silueta) {
        ctx.strokeStyle = '#b3201c'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(1.6, hy + 9.6); ctx.quadraticCurveTo(5, hy + 14.5, 9.6, hy + 10.8); ctx.stroke();
      }
      pieza(ctx, poli([[-9, hy + 6], [-9.6, hy - 1], [-6, hy - 5.5], [-2, hy - 4], [1, hy - 6.5], [4, hy - 4.6], [8.4, hy - 3], [8.8, hy + 1], [4, hy - 0.4], [-2, hy - 0.6], [-6, hy + 2.4]]), C.pelo, -9.6, 8.8);
      break;
    case 'pelo-largo':   // melena ondulada
      pieza(ctx, poli([[-9, hy + 6], [-9.6, hy - 1], [-5, hy - 5], [3, hy - 5.6], [8.4, hy - 2.6], [8.8, hy + 1.6], [4, hy + 0.4], [-1, hy + 1.2], [-4, hy + 5]]), C.pelo, -9.6, 8.8);
      break;
    case 'sombrero':   // sombrero de ala ancha con la copa hundida
      pieza(ctx, elipse(0.6, hy + 0.6, 15, 2.4), C.gorra, -14.4, 15.6);
      pieza(ctx, poli([[-7.4, hy], [-6.6, hy - 9], [-1, hy - 7.4], [6.4, hy - 9.2], [7.4, hy]]), C.gorra, -7.4, 7.4);
      pieza(ctx, poli([[-7.2, hy - 0.4], [7.2, hy - 0.4], [7, hy - 2.4], [-7, hy - 2.4]]), ajustarColor(C.gorra, -0.35), -7.2, 7.2);
      break;
    case 'ninja':   // capucha cerrada: solo se ven los ojos; las puntas del nudo atrás
      pieza(ctx, poli([[-9, hy + 3], [-6.5, hy - 1.5], [6.5, hy - 1.5], [9.2, hy + 3], [9.2, hy + 12], [6.5, hy + 16.4], [-4, hy + 17], [-9, hy + 12.4]]), C.gorra, -9, 9.2);
      pieza(ctx, poli([[2, hy + 4.4], [9.4, hy + 4.4], [9.6, hy + 8.6], [2, hy + 8.6]]), C.piel, 2, 9.6, { contorno: false });   // franja de los ojos
      detalle(ctx, '#f4f1ea', c => c.rect(2.5, hy + 5.5, 3.5, 2.5));
      detalle(ctx, '#1d1a17', c => c.rect(4.6, hy + 5.5 + e.mirar, 1.5, 2.5 - e.mirar));
      detalle(ctx, '#2a1e14', c => c.rect(2, hy + 4.6, 5, 0.9));
      pieza(ctx, poli([[-8, hy + 4], [-15, hy + 7.4], [-14, hy + 9.4], [-8, hy + 6.4]]), C.gorra, -15, -8);
      pieza(ctx, poli([[-8, hy + 5.4], [-13.4, hy + 11.6], [-12, hy + 12.8], [-7.6, hy + 7.2]]), C.gorra, -13.4, -7.6);
      break;
  }
  ctx.restore();   // fin de la cabeza achicada
}
