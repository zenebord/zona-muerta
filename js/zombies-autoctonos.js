/* ===== Zombies autóctonos y jefes del modo historia =====
 * En cada nivel la mitad de los zombies que aparecen son del lugar: animales o personajes típicos.
 *   Bariloche: guanacos, ciervos colorados y esquiadores
 *   La Pampa:  vacas, ñandúes y paisanos de boina, faja y pañuelo
 *   Zona sur:  perros callejeros, hinchas con la camiseta a rayas y colectiveros
 *   Padua:     gatos, perros, abuelas con ruleros y el vecino del asado
 * Antes de la meta espera un jefe grandote que tiene que ver con el lugar: el San Bernardo del Centro Cívico,
 * el toro de la pampa, el hincha del bombo y el coloso verde. Mientras viva, la meta queda cerrada.
 */

/* ---------- Personajes del lugar: variantes de ropa para el zombie de siempre ---------- */
const VARIANTES_AUTOCTONAS = {
  esquiador:   { id: 'esquiador', torso: 'remera', franja: '#f2f2ea', camiseta: '#c8262a', piernas: 'largo', pantalon: '#23262e', accesorio: 'gorro-pompon', gorro: '#2a5fb0', antiparras: true, escala: [0.95, 1.08] },
  gaucho:      { id: 'gaucho', torso: 'abierta', estampado: 'lisa', camiseta: '#e6e0cc', piernas: 'largo', pantalon: '#b5a17a', accesorio: 'boina', panuelo: '#b3261e', faja: '#23264a', escala: [0.98, 1.1] },
  colectivero: { id: 'colectivero', torso: 'uniforme', camiseta: '#9cc3df', piernas: 'largo', pantalon: '#2e3a55', escala: [1.0, 1.12] },
  abuela:      { id: 'abuela', torso: 'remera', camiseta: '#a77cc4', lunares: '#efe6f4', piernas: 'largo', pantalon: '#a77cc4', accesorio: 'ruleros', escala: [0.84, 0.92] },
  parrillero:  { id: 'parrillero', torso: 'musculosa', sinDorsal: true, camiseta: '#ece8dc', delantal: '#7a2a22', piernas: 'short', pantalon: '#3e5578', escala: [1.1, 1.2] },
};
// Hinchas de los clubes de la zona: camiseta blanca con rayas celestes, verdes o granates (sin escudos)
const RAYAS_HINCHA = ['#5fa8dc', '#1f7a3a', '#7a1f2a'];
const varianteHincha = () => ({ id: 'hincha', torso: 'remera', camiseta: '#f2f2ea', rayas: RAYAS_HINCHA[Math.floor(Math.random() * RAYAS_HINCHA.length)], piernas: 'short', pantalon: '#1e1f24', escala: [0.95, 1.08] });

function zombieConEstilo(x, est, dificultad) {
  const z = new Zombie(x, false, dificultad);
  z.estilo = est; z.escala = azarEntre(...est.escala); z.ancho = 26 * z.escala; z.alto = 64 * z.escala;
  z.colores = { ...COLORES_ZOMBIE, camiseta: variarColor(est.camiseta), pantalon: variarColor(est.pantalon) };
  z.variante.rotoIzq = est.piernas === 'largo' ? azarEntre(0.5, 0.9) : azarEntre(0, 0.18);
  z.variante.rotoDer = est.piernas === 'largo' ? azarEntre(0.55, 0.95) : azarEntre(0, 0.22);
  if (est.accesorio) z.variante.pelo = 'calvo';
  return z;
}

/* ---------- Animales ----------
 * Medidas en px con los pies en el piso: largo y alto del cuerpo, largo de las patas, cuello, cabeza.
 * La caja de impacto nunca baja de 52 px de alto: si no, las balas pasarían por encima de un gato. */
const ESPECIES = {
  guanaco:     { vida: 1.0, vel: 1.5, largo: 30, pata: 27, grosor: 17, cuello: 23, angCuello: 1.25, grosorCuello: 6, cabeza: [8, 5], color: '#b9814a', panza: '#ecdcc0', cola: 'corta', orejas: 'largas', hocico: 3, ancho: 44, alto: 70 },
  ciervo:      { vida: 1.2, vel: 1.4, largo: 32, pata: 28, grosor: 17, cuello: 15, angCuello: 0.95, grosorCuello: 7, cabeza: [8, 5], color: '#7a3e1e', panza: '#c9a07a', cola: 'corta', orejas: 'largas', astas: true, hocico: 4, ancho: 46, alto: 70 },
  vaca:        { vida: 2.2, vel: 0.75, largo: 40, pata: 18, grosor: 24, cuello: 8, angCuello: 0.4, grosorCuello: 12, cabeza: [10, 7], color: '#f0ece2', panza: '#e2d8c8', manchas: '#1e1e22', cuernos: 'vaca', ubre: true, cola: 'larga', orejas: 'costado', hocico: 5, ancho: 60, alto: 52 },
  perro:       { vida: 0.7, vel: 2.9, rapido: true, largo: 26, pata: 15, grosor: 12, cuello: 7, angCuello: 0.7, grosorCuello: 7, cabeza: [7, 5], color: '#8a6a44', panza: '#c8b08a', orejas: 'caidas', cola: 'levantada', hocico: 5, ancho: 38, alto: 34 },
  gato:        { vida: 0.5, vel: 3.1, rapido: true, largo: 18, pata: 10, grosor: 8, cuello: 3, angCuello: 0.6, grosorCuello: 5, cabeza: [5, 4.4], color: '#3a3a40', panza: '#5a5a62', orejas: 'gato', cola: 'gato', hocico: 1.6, ancho: 26, alto: 22 },
  nandu:       { vida: 0.8, vel: 2.6, rapido: true, bipedo: true, color: '#8a8070', panza: '#b8ae9a', ancho: 30, alto: 66 },
  // Jefes
  sanbernardo: { vida: 1, vel: 1, largo: 30, pata: 16, grosor: 16, cuello: 6, angCuello: 0.55, grosorCuello: 11, cabeza: [9, 7], color: '#f0e8da', panza: '#e6dccb', manchas: '#9a4a1e', orejas: 'caidas', cola: 'larga', hocico: 5, barril: true, ancho: 44, alto: 40 },
  toro:        { vida: 1, vel: 1, largo: 40, pata: 19, grosor: 26, cuello: 7, angCuello: 0.22, grosorCuello: 15, cabeza: [11, 8], color: '#2a2622', panza: '#3a332c', cuernos: 'toro', cola: 'larga', orejas: 'costado', hocico: 5, argolla: true, joroba: true, ancho: 60, alto: 54 },
};

// Pelaje podrido: el color del animal tirando a gris verdoso de carne muerta
function podrido(hex, k = 0.3) {
  const a = parseInt(hex.slice(1), 16), b = 0x56604a, m = (s, i) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return '#' + [16, 8, 0].map(s => m(s).toString(16).padStart(2, '0')).join('');
}

// Cuadrúpedo mirando a la derecha con las patas en (0, 0), agazapado y con la cabeza baja para atacar: patas del
// lado lejano, cola, cuerpo con el lomo erizado, calvas de piel podrida y la herida con las costillas, cuello y
// cabeza con las orejas aplastadas hacia atrás, el hocico arrugado que muestra encías y colmillos, baba de sangre y
// ojos rojos encendidos bajo el ceño; patas del lado cercano con el hueso a la vista y garras.
function dibujarCuadrupedo(ctx, z, E, golpeado) {
  const col = c => golpeado ? ajustarColor(c, 0.7) : c, sil = Pincel.silueta;
  const anda = z.estado === 'camina' || z.estado === 'embiste', ataca = z.estado === 'ataca', carga = z.estado === 'carga';
  const f = z.fase, R = z.recogido || 0, mitad = E.largo / 2, G = E.grosor, ahora = z.ahora;
  const bob = anda ? -Math.abs(Math.sin(f)) * 1.4 : carga ? Math.sin(ahora / 40) * 0.8 : 0;
  const yc = -E.pata * (1 - R * 0.55) - G * 0.42 + bob;
  const base = podrido(E.color, E.color === '#f0ece2' || E.color === '#f0e8da' ? 0.22 : 0.3);
  const piel = col(base), oscuro = col(ajustarColor(base, -0.32)), carne = col('#6a1414'), hueso = col('#ddd2b4');
  const garras = E.orejas === 'caidas' || E.orejas === 'gato';
  const pata = (x0, desfase, tono, adelante, cerca) => {
    const a = anda ? Math.sin(f + desfase) * 0.55 : carga && adelante ? Math.sin(ahora / 70) * 0.5 : ataca ? Math.sin(ahora / 90 + desfase) * 0.25 : 0;
    const L1 = E.pata * 0.54, L2 = E.pata * 0.52, y0 = yc + G * 0.25;
    const dobla = (adelante ? -1 : 1) * (0.25 + (anda ? Math.max(0, Math.sin(f + desfase + 1.2)) * 0.7 : 0) + R * 1.7);
    const kx = x0 + Math.sin(a) * L1, ky = y0 + Math.cos(a) * L1;
    const b = a + dobla, px = kx + Math.sin(b) * L2, py = Math.min(0, ky + Math.cos(b) * L2);
    const g = G * 0.36;
    pieza(ctx, poli(segmento(x0, y0, kx, ky, g, g * 0.75)), tono, Math.min(x0, kx) - g, Math.max(x0, kx) + g);
    pieza(ctx, poli(segmento(kx, ky, px, py, g * 0.7, g * 0.5)), tono, Math.min(kx, px) - g, Math.max(kx, px) + g);
    if (cerca && !sil && !golpeado && desfase === 0) {   // carne arrancada y el hueso a la vista en la canilla
      detalle(ctx, carne, elipse((kx + px) / 2, (ky + py) / 2, g * 0.32, g * 0.75, b));
      linea(ctx, hueso, g * 0.18, [[kx + (px - kx) * 0.2, ky + (py - ky) * 0.2], [kx + (px - kx) * 0.8, ky + (py - ky) * 0.8]]);
    }
    pieza(ctx, elipse(px + 0.8, py - 0.6, g * 0.45, g * 0.3), col('#1e1a16'), px - g, px + g);
    if (garras && !sil) for (let k = 0; k < 3; k++) linea(ctx, '#e8e0c8', Math.max(0.35, g * 0.08), [[px + g * 0.2 + k * g * 0.18, py - 0.4], [px + g * 0.55 + k * g * 0.18, py + 0.2]]);
  };
  pata(-mitad + 4, Math.PI, oscuro, false, false); pata(mitad - 4, 0, oscuro, true, false);
  // Cola tiesa
  const cx = -mitad - 1, cy = yc - G * 0.2, mece = Math.sin(ahora / 140) * 1.4;
  if (E.cola === 'corta') pieza(ctx, elipse(cx - 1.5, cy - 0.5, 2.4, 3.4, 0.7), piel, cx - 4, cx + 2);
  else if (E.cola === 'larga') { linea(ctx, sil || oscuro, 1.6, [[cx, cy], [cx - 4 + mece * 0.4, cy + G * 0.35], [cx - 4 + mece, cy + G * 0.8]]); pieza(ctx, elipse(cx - 4 + mece, cy + G * 0.85, 1.6, 2.6), col('#1a1816'), cx - 6, cx - 1); }
  else if (E.cola === 'levantada') linea(ctx, sil || piel, 2.6, [[cx + 1, cy], [cx - 4, cy - 3 + mece * 0.4], [cx - 6 + mece * 0.5, cy - 7]]);
  else if (E.cola === 'gato') { linea(ctx, sil || piel, 3, [[cx + 1, cy], [cx - 4, cy - 4], [cx - 5 + mece, cy - 10], [cx - 3 + mece, cy - 14]]); }   // cola esponjada
  // Cuerpo con la joroba del toro y la ubre de la vaca
  if (E.joroba) pieza(ctx, elipse(mitad * 0.45, yc - G * 0.38, mitad * 0.55, G * 0.32), piel, 0, mitad);
  pieza(ctx, elipse(0, yc, mitad + 3, G / 2), piel, -mitad - 3, mitad + 3);
  if (E.ubre) pieza(ctx, elipse(-mitad * 0.35, yc + G * 0.5, 4.4, 3), col('#a87878'), -mitad * 0.35 - 4, -mitad * 0.35 + 4);
  // Lomo erizado: pelos parados desde la nuca hasta la cadera (la vaca no)
  if (!E.ubre) {
    const pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12, x = -mitad * 0.7 + u * mitad * 1.5, y = yc - G * 0.5 * Math.sqrt(Math.max(0, 1 - (x / (mitad + 3)) ** 2)); pts.push([x, y + 0.6], [x + mitad * (0.04 + 0.05 * Math.abs(Math.sin(k * 1.9))), y - G * (0.1 + 0.1 * Math.sin(u * Math.PI) + 0.06 * Math.abs(Math.sin(k * 2.7))) - (ataca || carga ? G * 0.06 : 0)]); }   // pelos de largo desparejo
    pts.push([mitad * 0.8, yc - G * 0.2]);
    pieza(ctx, poli(pts), oscuro, -mitad, mitad);
  }
  if (!sil) {
    detalle(ctx, col(podrido(E.panza, 0.3)), elipse(0, yc + G * 0.3, mitad * 0.75, G * 0.16));
    if (E.manchas && !golpeado) for (const [mx, my, r] of [[-mitad * 0.5, -0.2, 0.32], [mitad * 0.25, -0.15, 0.26], [-mitad * 0.05, 0.12, 0.18]]) detalle(ctx, E.manchas, elipse(mx, yc + my * G, G * r * 1.3, G * r, 0.3));
    if (!golpeado) {
      // Calvas de piel podrida, gris verdosa, con bordes oscuros
      for (const [mx, my, r] of [[mitad * 0.55, 0.05, 0.2], [-mitad * 0.6, 0.12, 0.16], [mitad * 0.15, 0.22, 0.12]]) { detalle(ctx, 'rgba(30,26,20,0.55)', elipse(mx, yc + my * G, G * r + 0.6, G * r * 0.75 + 0.6, 0.4)); detalle(ctx, '#6d7656', elipse(mx, yc + my * G, G * r, G * r * 0.75, 0.4)); }
      // Herida abierta con las costillas
      const hx = -mitad * 0.1, hy = yc - G * 0.05;
      detalle(ctx, '#4a0808', poli([[hx - G * 0.34, hy - G * 0.1], [hx - G * 0.12, hy - G * 0.24], [hx + G * 0.24, hy - G * 0.16], [hx + G * 0.34, hy + G * 0.08], [hx + G * 0.06, hy + G * 0.22], [hx - G * 0.28, hy + G * 0.14]]));
      detalle(ctx, '#8a1414', elipse(hx, hy, G * 0.2, G * 0.12));
      for (let k = 0; k < 4; k++) linea(ctx, hueso, G * 0.045, [[hx - G * 0.22 + k * G * 0.14, hy - G * 0.16], [hx - G * 0.17 + k * G * 0.14, hy + G * 0.13]]);
      linea(ctx, 'rgba(110,10,10,0.8)', G * 0.04, [[hx + G * 0.1, hy + G * 0.2], [hx + G * 0.12, hy + G * 0.38]]);   // chorrea
    }
  }
  // Cuello estirado hacia adelante y la cabeza baja, a la altura de la presa
  const ang = E.angCuello * 0.7 + (ataca ? -0.35 + Math.sin(ahora / 80) * 0.16 : carga ? -0.4 : Math.sin(f * 0.5) * 0.06 - 0.12) + (z.cabezaAtras || 0) * -0.6;
  const nx0 = mitad - 2, ny0 = yc - G * 0.15, nx = nx0 + Math.cos(ang) * E.cuello, ny = ny0 - Math.sin(ang) * E.cuello;
  pieza(ctx, poli(segmento(nx0, ny0, nx, ny, E.grosorCuello * 1.5, E.grosorCuello)), piel, Math.min(nx0, nx) - 4, Math.max(nx0, nx) + 4);
  if (!sil && !golpeado) detalle(ctx, 'rgba(120,10,10,0.75)', elipse(nx - 1, ny + E.grosorCuello * 0.45, E.grosorCuello * 0.45, E.grosorCuello * 0.6));   // pecho manchado de sangre
  if (E.barril) {
    pieza(ctx, redondo(nx - 4, ny + E.grosorCuello * 0.3, 8, 6, 1.4), col('#6a4420'), nx - 4, nx + 4);
    if (!sil) { linea(ctx, '#2a1e10', 0.6, [[nx - 2, ny + E.grosorCuello * 0.3], [nx - 2, ny + E.grosorCuello * 0.3 + 6]]); linea(ctx, '#2a1e10', 0.6, [[nx + 2, ny + E.grosorCuello * 0.3], [nx + 2, ny + E.grosorCuello * 0.3 + 6]]); linea(ctx, '#7a1a16', 1.4, [[nx - 4, ny + E.grosorCuello * 0.25], [nx + 4, ny + E.grosorCuello * 0.25]]); }
  }
  const [cw, ch] = E.cabeza, abre = ataca ? 0.45 + Math.abs(Math.sin(ahora / 70)) * 0.35 : carga ? 0.4 : 0.28 + Math.sin(ahora / 300) * 0.05;
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(0.45 - (ataca ? 0.25 : 0));
  // Mandíbula abierta con los colmillos de abajo
  ctx.save(); ctx.translate(cw * 0.15, ch * 0.35); ctx.rotate(abre);
  pieza(ctx, elipse(cw * 0.75, ch * 0.2, cw * 0.9, ch * 0.32), oscuro, -1, cw * 1.6);
  if (!sil) {
    detalle(ctx, '#3a0606', elipse(cw * 0.85, ch * 0.02, cw * 0.7, ch * 0.16));
    if (!golpeado) { ctx.fillStyle = '#e8dcbc'; for (const [x, h] of [[cw * 1.35, ch * 0.55], [cw * 0.7, ch * 0.3], [cw * 1.05, ch * 0.3]]) { ctx.beginPath(); ctx.moveTo(x - 0.5, ch * 0.05); ctx.lineTo(x, ch * 0.05 - h); ctx.lineTo(x + 0.6, ch * 0.05); ctx.fill(); } }
  }
  ctx.restore();
  // Orejas aplastadas hacia atrás, cuernos y astas
  if (E.orejas === 'largas') pieza(ctx, poli([[-cw * 0.2, -ch * 0.55], [-cw * 1.3, -ch * 1.2], [-cw * 0.1, -ch * 0.85]]), piel, -cw * 1.3, 0);
  if (E.orejas === 'gato') pieza(ctx, poli([[-cw * 0.3, -ch * 0.5], [-cw * 1.0, -ch * 1.25], [cw * 0.15, -ch * 0.75]]), piel, -cw, cw * 0.2);
  if (E.cuernos === 'toro') pieza(ctx, poli([[-cw * 0.1, -ch * 0.6], [cw * 0.6, -ch * 1.1], [cw * 1.4, -ch * 2.2], [cw * 1.25, -ch * 1.3], [cw * 0.55, -ch * 0.4]]), col('#d8ccb0'), -cw * 0.1, cw * 1.4);
  if (E.cuernos === 'vaca') pieza(ctx, poli([[0, -ch * 0.7], [cw * 0.35, -ch * 1.6], [cw * 0.55, -ch * 1.5], [cw * 0.35, -ch * 0.6]]), col('#c8bea0'), 0, cw * 0.55);
  if (E.astas) {
    const a = [[0, -ch * 0.7], [-cw * 0.1, -ch * 2.6], [-cw * 0.4, -ch * 3.8], [0, -ch * 5]];
    linea(ctx, sil || col('#b8a688'), 1.7, a);
    for (const [i, dx2, dy2] of [[1, cw * 0.75, -ch * 0.5], [2, cw * 0.65, -ch * 0.7], [2, -cw * 0.55, -ch * 0.3], [3, cw * 0.4, -ch * 0.3]]) linea(ctx, sil || col('#b8a688'), 1.2, [a[i], [a[i][0] + dx2, a[i][1] + dy2]]);
    if (!sil && !golpeado) linea(ctx, 'rgba(120,10,10,0.8)', 0.9, [a[2], a[3]]);   // asta ensangrentada
  }
  // Cráneo y hocico arrugado (se le ven las encías y los colmillos de arriba)
  pieza(ctx, elipse(cw * 0.3, 0, cw * 0.85, ch * 0.75), piel, -cw * 0.6, cw * 1.2);
  pieza(ctx, elipse(cw * 1.05, ch * 0.15, E.hocico * 0.95, ch * 0.48), col(ajustarColor(base, -0.06)), cw * 0.4, cw * 1.05 + E.hocico);
  if (E.orejas === 'caidas') pieza(ctx, poli([[-cw * 0.1, -ch * 0.6], [-cw * 0.9, -ch * 0.2], [-cw * 0.6, ch * 0.5], [cw * 0.2, -ch * 0.2]]), col(E.manchas ? podrido(E.manchas, 0.25) : ajustarColor(base, -0.25)), -cw * 0.9, cw * 0.2);
  if (E.orejas === 'costado') pieza(ctx, elipse(-cw * 0.45, -ch * 0.3, cw * 0.45, ch * 0.2, -0.7), piel, -cw * 0.9, 0);
  if (!sil) {
    if (E.manchas && E.barril) detalle(ctx, col(podrido(E.manchas, 0.25)), elipse(cw * 0.1, -ch * 0.25, cw * 0.4, ch * 0.4));
    detalle(ctx, '#140c0a', elipse(cw * 1.05 + E.hocico * 0.8, ch * 0.0, 1.0, 0.8));                                  // nariz
    if (E.argolla) { ctx.beginPath(); ctx.arc(cw * 1.1 + E.hocico * 0.75, ch * 0.55, 1.6, 0, Math.PI * 2); ctx.strokeStyle = '#a89050'; ctx.lineWidth = 0.6; ctx.stroke(); }
    for (let k = 0; k < 3; k++) linea(ctx, 'rgba(20,10,8,0.55)', 0.35, [[cw * 0.75 + k * 0.9, -ch * 0.1], [cw * 0.95 + k * 0.9, ch * 0.2]]);   // arrugas del gruñido
    if (!golpeado) {
      detalle(ctx, '#7a2a2e', elipse(cw * 1.0, ch * 0.5, cw * 0.55, ch * 0.13));                                        // encía
      ctx.fillStyle = '#efe4c4';
      for (const [x, h] of [[cw * 1.35, ch * 0.65], [cw * 0.65, ch * 0.5], [cw * 0.85, ch * 0.22], [cw * 1.05, ch * 0.25], [cw * 1.2, ch * 0.22]]) { ctx.beginPath(); ctx.moveTo(x - 0.55, ch * 0.5); ctx.lineTo(x, ch * 0.5 + h); ctx.lineTo(x + 0.55, ch * 0.5); ctx.fill(); }
      ctx.fillStyle = '#9a1010'; ctx.fillRect(cw * 1.25, ch * 0.7, 0.8, 3 + abre * 6); ctx.beginPath(); ctx.arc(cw * 1.29, ch * 0.7 + 3 + abre * 6, 0.9, 0, Math.PI * 2); ctx.fill();   // baba de sangre
      ctx.fillRect(cw * 0.8, ch * 0.62, 0.6, 1.6 + abre * 3);
    }
    // Ojos rojos encendidos bajo el ceño
    const ox = cw * 0.55, oy = -ch * 0.22, r = Math.max(1, ch * 0.2);
    const g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 4); g2.addColorStop(0, 'rgba(255,40,20,0.75)'); g2.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(ox - r * 4, oy - r * 4, r * 8, r * 8);
    detalle(ctx, '#ff2a1a', elipse(ox, oy, r * 1.1, r * 0.8));
    detalle(ctx, '#ffd0a0', circulo(ox + r * 0.2, oy - r * 0.15, r * 0.3));
    detalle(ctx, '#140404', elipse(ox + r * 0.1, oy, r * 0.18, r * 0.65));                                              // pupila rasgada
    linea(ctx, 'rgba(15,8,6,0.9)', Math.max(0.6, ch * 0.12), [[ox - r * 1.4, oy - r * 1.6], [ox + r * 1.5, oy - r * 0.4]]);   // ceño
    detalle(ctx, 'rgba(70,8,8,0.8)', elipse(-cw * 0.1, ch * 0.25, cw * 0.2, ch * 0.18));                                // mordida en la cara
  }
  ctx.restore();
  pata(-mitad + 6, 0, piel, false, true); pata(mitad - 2, Math.PI, piel, true, true);
}

// Ñandú: ave grande de dos patas, desplumada a parches, cuello pelado y ensangrentado, pico entreabierto con el
// borde aserrado y ojos rojos; ataca a picotazos con el cuello estirado
function dibujarNandu(ctx, z, E, golpeado) {
  const col = c => golpeado ? ajustarColor(c, 0.7) : c, sil = Pincel.silueta;
  const anda = z.estado === 'camina', ataca = z.estado === 'ataca', f = z.fase, R = z.recogido || 0;
  const piel = col(podrido(E.color, 0.25)), oscuro = col(ajustarColor(podrido(E.color, 0.25), -0.3)), patas = col('#7a6e56'), pelado = col('#9a8478');
  const yc = -34 * (1 - R * 0.4) + (anda ? -Math.abs(Math.sin(f)) * 1.6 : 0);
  const pata = (desfase, tono) => {
    const a = anda ? Math.sin(f + desfase) * 0.6 : 0, hx = 0, hy = yc + 6;
    const kx = hx + Math.sin(a) * 13 + 2, ky = hy + 13 * (1 - R * 0.5);
    const px = kx - Math.sin(a) * 4 - 3 - (anda ? Math.max(0, Math.sin(f + desfase + 1)) * 4 : 0), py = Math.min(0, ky + 15);
    linea(ctx, sil || tono, 2.6, [[hx, hy], [kx, ky], [px, py]]);
    linea(ctx, sil || tono, 1.4, [[px, py], [px + 5, py], [px + 6.5, py + 0.6]]);
    if (!sil) linea(ctx, '#e8e0c8', 0.6, [[px + 5.6, py], [px + 7.2, py + 1]]);                                         // uña
  };
  pata(Math.PI, oscuro);
  pieza(ctx, elipse(-2, yc, 15, 11, -0.08), piel, -17, 13);
  pieza(ctx, poli([[-14, yc - 3], [-22, yc + 6], [-19, yc + 9], [-17, yc + 13], [-13, yc + 9], [-9, yc + 13], [-5, yc + 9], [-1, yc + 11], [2, yc + 6]]), oscuro, -22, 2);   // alas desflecadas
  if (!sil && !golpeado) {
    for (let k = 0; k < 8; k++) linea(ctx, 'rgba(30,26,20,0.5)', 0.6, [[-14 + k * 3.2, yc - 7 + (k % 2)], [-16 + k * 3.2, yc + 4]]);
    detalle(ctx, pelado, elipse(-6, yc - 4, 4.4, 3));                                                                      // desplumado
    detalle(ctx, '#4a0808', elipse(3, yc + 1, 4.6, 3));
    for (let k = 0; k < 3; k++) linea(ctx, '#ddd2b4', 0.55, [[0.6 + k * 1.6, yc - 1], [1.2 + k * 1.6, yc + 2.8]]);
  }
  // Cuello pelado y ensangrentado; al atacar se estira y pica
  const pica = ataca ? Math.max(0, Math.sin(z.ahora / 70)) : 0;
  const cxp = 12 + (ataca ? 6 + pica * 7 : 5), cyp = yc - 24 + (ataca ? 8 + pica * 6 : 2);
  linea(ctx, sil || pelado, 3.6, [[8, yc - 5], [12, yc - 15], [cxp, cyp]]);
  if (!sil && !golpeado) { linea(ctx, 'rgba(130,10,10,0.85)', 1.4, [[10, yc - 9], [12, yc - 15]]); linea(ctx, 'rgba(130,10,10,0.7)', 0.6, [[10.5, yc - 9], [10.2, yc - 4]]); }
  pieza(ctx, elipse(cxp + 1, cyp, 3.6, 2.8), pelado, cxp - 3, cxp + 5);
  const ab = ataca ? 0.5 + pica * 0.4 : 0.25;
  pieza(ctx, poli([[cxp + 3.4, cyp - 0.8], [cxp + 9, cyp - 0.2 - ab], [cxp + 3.6, cyp + 0.6]]), col('#a89060'), cxp + 3, cxp + 9);
  pieza(ctx, poli([[cxp + 3.4, cyp + 0.8], [cxp + 8.4, cyp + 1.6 + ab * 2], [cxp + 3.6, cyp + 1.8]]), col('#8a7448'), cxp + 3, cxp + 9);
  if (!sil) {
    detalle(ctx, '#3a0606', poli([[cxp + 3.6, cyp + 0.4], [cxp + 8.4, cyp + 0.2 - ab * 0.4], [cxp + 8, cyp + 1.4 + ab * 1.6]]));
    const g2 = ctx.createRadialGradient(cxp + 1.6, cyp - 0.8, 0, cxp + 1.6, cyp - 0.8, 4); g2.addColorStop(0, 'rgba(255,40,20,0.7)'); g2.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(cxp - 2.4, cyp - 4.8, 8, 8);
    detalle(ctx, '#ff2a1a', circulo(cxp + 1.6, cyp - 0.8, 1.05)); detalle(ctx, '#140404', circulo(cxp + 1.8, cyp - 0.8, 0.35));
    linea(ctx, 'rgba(15,8,6,0.9)', 0.6, [[cxp, cyp - 2.4], [cxp + 3, cyp - 1.4]]);
    if (!golpeado) { ctx.fillStyle = '#9a1010'; ctx.fillRect(cxp + 7, cyp + 1.6 + ab * 2, 0.6, 3); }
  }
  pata(0, patas);
}

class ZombieAnimal extends Zombie {
  constructor(x, especie, dificultad) {
    const E = ESPECIES[especie];
    super(x, !!E.rapido, dificultad);
    this.animal = true; this.especie = especie; this.E = E;
    this.vidaMax = this.vida = Math.max(1, Math.round(dificultad.vidaZombie * E.vida * AJUSTE.vidaZombie));
    this.velocidad = E.vel * (0.9 + Math.random() * 0.2) * dificultad.velocidad * AJUSTE.velocidadZombie;
    this.escala = 0.94 + Math.random() * 0.12;
    this.ancho = E.ancho * this.escala; this.alto = E.alto * this.escala;
  }
  caja() { const w = this.ancho, h = Math.max(this.alto, 52); return { x: this.x - w / 2 + this.direccion * 4, y: this.y - this.altura - h, w, h }; }
  // Agresivo: cuando ve al jugador a menos de 260 px se lanza un 50 % más rápido, muerde cada 0,6 s (no 0,9) y
  // gruñe en vez de gemir; al morder, ladra o brama
  actualizar(dt, jugador, juego) {
    const lejos = Math.abs(jugador.x - this.x), base = this.velocidad;
    this.gemidoEn = Infinity;                                       // el gemido humano no va
    if (!this.dormido && lejos < 260 && this.estado !== 'muerto') this.velocidad = base * 1.5;
    const antes = this.ataqueEn;
    super.actualizar(dt, jugador, juego);
    this.velocidad = base;
    if (this.ataqueEn !== antes) { this.ataqueEn = juego.ahora + 600; Audio_.gruñido(lejos, this.tamañoVoz(), true); }
    if (this.estado !== 'muerto' && !this.dormido && lejos < 600 && juego.ahora >= (this.gruñeEn || 0)) {
      this.gruñeEn = juego.ahora + 1800 + Math.random() * 2600;
      if (this.gruñeEn && Math.random() < 0.75) Audio_.gruñido(lejos, this.tamañoVoz(), false);
    }
  }
  tamañoVoz() { return { gato: 0.45, perro: 0.9, nandu: 0.7, guanaco: 1, ciervo: 1.1, vaca: 1.8, sanbernardo: 1.6, toro: 2.2 }[this.especie] || 1; }
  cuerpo(ctx, golpeado) {
    if (this.estado === 'ataca') ctx.translate(this.direccion * Math.max(0, Math.sin(this.ahora / 70)) * 3 * this.escala, 0);   // embiste con el cuerpo al morder
    ctx.scale(this.direccion * this.escala, this.escala);
    if (this.E.bipedo) dibujarNandu(ctx, this, this.E, golpeado); else dibujarCuadrupedo(ctx, this, this.E, golpeado);
  }
  // Muerto: se le doblan las patas, se desploma de costado y se desvanece
  dibujar(ctx, camaraX, ahora) {
    if (this.estado !== 'muerto') return super.dibujar(ctx, camaraX, ahora);
    this.ahora = ahora;
    const T = this.tiempoMuerto, cae = suavizar(limitar(T / 0.6, 0, 1)), e = this.escala;
    ctx.save(); ctx.translate(this.x - camaraX, this.y);
    ctx.globalAlpha = 1 - limitar((T - 1.45) / (MUERTE.fin - 1.45), 0, 1);
    const charco = limitar((T - 0.4) / 1.2, 0, 1);
    if (charco > 0) { ctx.fillStyle = this.colorCharco; ctx.beginPath(); ctx.ellipse(0, 3, (6 + charco * 18) * e * (this.jefe ? 2 : 1), (2 + charco * 4) * e, 0, 0, Math.PI * 2); ctx.fill(); }
    this.recogido = cae; this.estado = 'muerto';
    ctx.rotate(this.direccion * 0.1 * cae); ctx.scale(1, 1 - 0.22 * cae);
    this.cuerpo(ctx, false);
    ctx.restore();
  }
}

/* ---------- Qué aparece en cada nivel ---------- */
const AUTOCTONOS = {
  avion:  [{ animal: 'guanaco' }, { animal: 'ciervo' }, { estilo: () => VARIANTES_AUTOCTONAS.esquiador }],
  ruta:   [{ animal: 'vaca' }, { animal: 'nandu' }, { estilo: () => VARIANTES_AUTOCTONAS.gaucho }],
  ciudad: [{ animal: 'perro' }, { estilo: varianteHincha }, { estilo: () => VARIANTES_AUTOCTONAS.colectivero }],
  barrio: [{ animal: 'gato' }, { animal: 'perro' }, { estilo: () => VARIANTES_AUTOCTONAS.abuela }, { estilo: () => VARIANTES_AUTOCTONAS.parrillero }],
};

/* ---------- Jefes ----------
 * vida: veces la vida de un zombie común. Ningún golpe le saca más del 8 % de la vida (ni una explosión
 * ni un ataque aéreo lo matan de una). Ataques especiales cada 3,5 a 6 s:
 *   embestida  escarba el piso 0,8 s y sale disparado; si lo toca, le saca mucho y lo empuja (saltar lo esquiva)
 *   bombo      levanta el mazo y golpea el bombo: una onda corre por el piso (saltar la esquiva)
 *   salto      se agazapa, salta hacia el jugador y cae con una onda expansiva */
const JEFES = {
  avion:  { animal: 'sanbernardo', escala: 3.1, vida: 22, vel: 1.15, ataque: 'embestida' },
  ruta:   { animal: 'toro', escala: 2.0, vida: 30, vel: 0.95, ataque: 'embestida' },
  ciudad: { estilo: () => ({ ...varianteHincha(), id: 'hincha-jefe', bombo: true, escala: [2.25, 2.25] }), vida: 40, vel: 0.8, ataque: 'bombo', brazos: 1.4, piernas: 1.2 },
  barrio: { estilo: () => ({ id: 'coloso', torso: 'desnudo', camiseta: '#4fae2e', piernas: 'short', pantalon: '#363a5e', accesorio: 'pelo-revuelto', escala: [2.5, 2.5] }), piel: '#4fae2e', vida: 55, vel: 1.05, ataque: 'salto', brazos: 2.0, piernas: 1.6 },
};

function crearJefe(clave, x, dificultad) {
  const J = JEFES[clave];
  let z;
  if (J.animal) { z = new ZombieAnimal(x, J.animal, dificultad); z.escala = J.escala; z.ancho = z.E.ancho * J.escala; z.alto = z.E.alto * J.escala; }
  else {
    z = zombieConEstilo(x, J.estilo(), dificultad);
    z.grosorBrazos = J.brazos; z.grosorPiernas = J.piernas; z.variante.brazoColgando = false;
    if (J.piel) z.piel = J.piel;
  }
  z.jefe = true; z.clave = clave; z.ataque = J.ataque;
  z.vidaMax = z.vida = Math.round(dificultad.vidaZombie * J.vida * AJUSTE.vidaZombie);
  z.velocidad = J.vel * dificultad.velocidad * AJUSTE.velocidadZombie;
  z.mordida = dificultad.danoMordida * AJUSTE.mordida;
  z.corredor = false; z.direccion = -1;
  // Comportamiento propio: reemplaza el del zombie común
  z.actualizar = (dt, jugador, juego) => actualizarJefe(z, dt, jugador, juego);
  const recibir = z.recibirDano.bind(z);
  z.recibirDano = (cantidad, direccion, arma, juego) => {
    if (z.estado === 'muerto') return;
    recibir(Math.min(cantidad, z.vidaMax * 0.08), direccion, arma, juego);
    z.empuje *= 0.15;
    if (z.estado === 'muerto') { juego.sacudida = 16; juego.avisoRonda(t('hist.aviso.jefeVencido'), t('hist.jefe.' + clave)); Audio_.rondaSuperada(); }
  };
  return z;
}

// Mueve al jefe pisando los desniveles (es grande: sube cualquier escalón), sin tirarse a un precipicio
function moverJefe(z, d, juego) {
  const nx = z.x + d, H = juego.historia;
  if (alturaSuelo(nx) > SUELO_BASE + 100) return false;
  if (H && (nx < H.inicio + 200 || nx > H.meta - 40)) return false;
  z.x = nx; z.y = alturaSuelo(nx); return true;
}

// Onda expansiva por el piso: polvo, temblor y daño si el jugador está parado cerca
function ondaJefe(z, juego, radio) {
  const j = juego.jugador;
  juego.sacudida = 14; Audio_.explosion();
  for (let k = 0; k < 26; k++) { const lado = k % 2 ? 1 : -1; juego.particulas.push(new Particula(z.x + lado * Math.random() * 40, z.y - 2, lado * (2 + Math.random() * 5), -Math.random() * 2.5, k % 3 ? '#a89a82' : '#6e6252', 0.6 + Math.random() * 0.5, 4 + Math.random() * 6, true)); }
  if (!j.muerto && j.enSuelo && Math.abs(j.x - z.x) < radio && Math.abs(j.y - z.y) < 80) { j.recibirDano(Math.round(z.mordida * 1.4), juego); juego.aviso(t('hist.aviso.onda'), 1600); }
}

// Los jefes animales gruñen y braman (más grave que los comunes); los humanos gimen
function vozJefe(z, dist, fuerte) { if (z.animal) Audio_.gruñido(dist, z.tamañoVoz() * 1.4, fuerte); else Audio_.gemido(true, dist); }

function actualizarJefe(z, dt, j, juego) {
  const ahora = juego.ahora, paso = dt * 60;
  z.ahora = ahora;
  if (z.estado === 'muerto') {
    z.tiempoMuerto += dt;
    if (z.altura > 0) { z.altura = Math.max(0, z.altura - 6 * paso); }
    return;
  }
  if (z.proximoEspecial === undefined) { z.proximoEspecial = ahora + 2500; z.gemidoEn = ahora + 800; }
  const dx = j.x - z.x, dist = Math.abs(dx), alcance = 18 + 13 * z.escala;
  const A = z.accion;
  if (A) {
    const t2 = ahora - A.desde;
    if (A.tipo === 'embestida') {
      if (t2 < 800) { z.estado = 'carga'; z.direccion = A.dir; if (!A.bufido && t2 > 300) { A.bufido = true; vozJefe(z, 0, true); } }
      else if (t2 < 2100 && !A.fin) {
        z.estado = 'embiste'; z.fase += dt * 18;
        if (!moverJefe(z, A.dir * z.velocidad * 4.4 * paso, juego)) A.fin = true;
        if (!A.pego && !j.muerto && Math.abs(j.x - z.x) < alcance + 10 && j.y > z.y - 60 * z.escala * 0.5 && j.y - z.y > -55) {
          A.pego = true; j.recibirDano(Math.round(z.mordida * 2), juego); j.x += A.dir * 70; juego.sacudida = 12; Audio_.zombieGolpea();
        }
        if (Math.sign(j.x - z.x) !== A.dir && Math.abs(j.x - z.x) > 140) A.fin = true;   // ya lo pasó de largo
      } else A.fin = true;
    } else if (A.tipo === 'bombo') {
      z.estado = t2 < 700 ? 'ataca' : 'camina'; z.bocaAbierta = t2 < 700 ? 1 : Math.max(0, z.bocaAbierta - dt * 2);
      if (!A.golpe && t2 >= 700) { A.golpe = true; ondaJefe(z, juego, 250); }
      if (t2 > 1150) A.fin = true;
    } else if (A.tipo === 'salto') {
      if (t2 < 450) { z.estado = 'ataca'; z.recogido = Math.min(1, t2 / 450); }
      else if (t2 < 1250) {
        const f = (t2 - 450) / 800; z.recogido = 0.6; z.estado = 'ataca';
        z.altura = Math.sin(f * Math.PI) * 110;
        moverJefe(z, (A.destino - A.x0) * (dt * 1000 / 800), juego);
      } else if (!A.golpe) { A.golpe = true; z.altura = 0; z.recogido = 0; ondaJefe(z, juego, 230); }
      if (t2 > 1600) A.fin = true;
    }
    if (A.fin) { z.accion = null; z.estado = 'camina'; z.altura = 0; z.recogido = 0; z.bocaAbierta = 0; z.proximoEspecial = ahora + 3500 + Math.random() * 2500; }
    return;
  }
  z.direccion = dx >= 0 ? 1 : -1;
  if (dist < alcance && Math.abs(j.y - z.y) < 70 && !j.muerto) {
    z.estado = 'ataca'; z.fase += dt * 4;
    if (ahora >= z.ataqueEn) { z.ataqueEn = ahora + 1000; j.recibirDano(Math.round(z.mordida * 1.5), juego); Audio_.zombieGolpea(); }
    return;
  }
  if (ahora >= z.proximoEspecial && dist < 560 && !j.muerto) {
    z.accion = { tipo: z.ataque, desde: ahora, dir: z.direccion, x0: z.x, destino: j.x - z.direccion * alcance * 0.6 };
    if (z.ataque !== 'embestida') Audio_.gemido(true, 0);
    return;
  }
  z.estado = 'camina';
  moverJefe(z, z.direccion * z.velocidad * paso, juego);
  z.fase += dt * (z.animal ? 7 : 4.5);
  if (ahora >= z.gemidoEn) { z.gemidoEn = ahora + 2200 + Math.random() * 2500; vozJefe(z, dist, false); }
}

/* ---------- Enganche con la partida ---------- */
Object.assign(Juego.prototype, {
  // Zombie para la historia: la mitad exacta son del lugar (animales o personajes típicos). Van por pares: en
  // cada par, uno común y uno del lugar, en orden al azar.
  zombieHistoria(x, corredor) {
    const H = this.historia, tipos = AUTOCTONOS[H.def.clave];
    if (!H.par || !H.par.length) H.par = Math.random() < 0.5 ? [true, false] : [false, true];
    const delLugar = H.par.shift();
    if (!tipos || !delLugar) return new Zombie(x, corredor, this.dificultad);
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    return tipo.animal ? new ZombieAnimal(x, tipo.animal, this.dificultad) : zombieConEstilo(x, tipo.estilo(), this.dificultad);
  },

  // A 700 px de la meta aparece el jefe entre el jugador y la casa; hasta que muera, la meta queda cerrada
  jefeHistoria() {
    const H = this.historia, j = this.jugador;
    if (!JEFES[H.def.clave]) return;
    if (!H.jefe && j.x > H.meta - 700) {
      let x = H.meta - 160;
      while (alturaSuelo(x) > SUELO_BASE + 100 && x > H.meta - 600) x -= 40;
      H.jefe = crearJefe(H.def.clave, x, this.dificultad);
      this.zombies.push(H.jefe);
      this.avisoRonda(t('hist.aviso.jefe'), t('hist.jefe.' + H.def.clave), 3200); Audio_.sirena();
    }
    if (H.jefe && H.jefe.estado !== 'muerto' && j.x > H.meta - 70) {
      j.x = H.meta - 70;
      if (this.ahora > (H.avisoJefeHasta || 0)) { this.aviso(t('hist.aviso.jefeBloquea'), 1500); H.avisoJefeHasta = this.ahora + 2500; }
    }
  },
  jefeVivo() { const J = this.historia && this.historia.jefe; return !!J && J.estado !== 'muerto'; },

  // Barra de vida del jefe abajo, en el centro
  barraJefe(ctx) {
    const J = this.historia && this.historia.jefe;
    if (!J || (J.estado === 'muerto' && J.tiempoMuerto > 1.5)) return;
    const w = Math.min(420, ANCHO * 0.5), x = (ANCHO - w) / 2, y = ALTO - 46, f = Math.max(0, J.vida / J.vidaMax);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 4, y - 20, w + 8, 34);
    ctx.fillStyle = '#f2e6c8'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('hist.jefe.' + J.clave), ANCHO / 2, y - 6);
    ctx.fillStyle = '#3a0c0c'; ctx.fillRect(x, y, w, 10);
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ff5a2a'); g.addColorStop(1, '#b3121a');
    ctx.fillStyle = g; ctx.fillRect(x, y, w * f, 10);
    ctx.strokeStyle = '#f2e6c8'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, 10);
    ctx.restore();
  },
});
