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
 * pie: 'garra' (camina sobre los dedos) o 'pezuna'; cintura: cuánto se recoge la panza (0 barril, 1 galgo);
 * fino: grosor de las patas respecto del cuerpo.
 * La caja de impacto nunca baja de 52 px de alto: si no, las balas pasarían por encima de un gato. */
const ESPECIES = {
  guanaco:     { vida: 1.0, vel: 1.5, largo: 30, pata: 27, grosor: 17, cuello: 23, angCuello: 1.25, grosorCuello: 6, cabeza: [8, 5], color: '#b9814a', panza: '#ecdcc0', cola: 'corta', orejas: 'largas', hocico: 3, pie: 'pezuna', cintura: 0.55, fino: 0.8, ancho: 44, alto: 70 },
  ciervo:      { vida: 1.2, vel: 1.4, largo: 32, pata: 28, grosor: 17, cuello: 15, angCuello: 0.95, grosorCuello: 7, cabeza: [8, 5], color: '#7a3e1e', panza: '#c9a07a', cola: 'corta', orejas: 'largas', astas: true, hocico: 4, pie: 'pezuna', cintura: 0.6, fino: 0.75, ancho: 46, alto: 70 },
  vaca:        { vida: 2.2, vel: 0.75, largo: 40, pata: 18, grosor: 24, cuello: 8, angCuello: 0.4, grosorCuello: 12, cabeza: [10, 7], color: '#f0ece2', panza: '#e2d8c8', manchas: '#1e1e22', cuernos: 'vaca', ubre: true, cola: 'larga', orejas: 'costado', hocico: 5, pie: 'pezuna', cintura: 0.05, fino: 0.8, ancho: 60, alto: 52 },
  perro:       { vida: 0.7, vel: 2.9, rapido: true, largo: 26, pata: 15, grosor: 12, cuello: 7, angCuello: 0.7, grosorCuello: 7, cabeza: [7, 5], color: '#8a6a44', panza: '#c8b08a', orejas: 'caidas', cola: 'levantada', hocico: 5, pie: 'garra', cintura: 0.9, fino: 1, ancho: 38, alto: 34 },
  gato:        { vida: 0.5, vel: 3.1, rapido: true, largo: 18, pata: 10, grosor: 8, cuello: 3, angCuello: 0.6, grosorCuello: 5, cabeza: [5, 4.4], color: '#3a3a40', panza: '#5a5a62', orejas: 'gato', cola: 'gato', hocico: 1.6, pie: 'garra', cintura: 0.7, fino: 1.05, ancho: 26, alto: 22 },
  nandu:       { vida: 0.8, vel: 2.6, rapido: true, bipedo: true, color: '#8a8070', panza: '#b8ae9a', ancho: 30, alto: 66 },
  // Jefes
  sanbernardo: { vida: 1, vel: 1, largo: 30, pata: 16, grosor: 16, cuello: 6, angCuello: 0.55, grosorCuello: 11, cabeza: [9, 7], color: '#f0e8da', panza: '#e6dccb', manchas: '#9a4a1e', orejas: 'caidas', cola: 'larga', hocico: 5, barril: true, pie: 'garra', cintura: 0.45, fino: 1.15, ancho: 44, alto: 40 },
  toro:        { vida: 1, vel: 1, largo: 40, pata: 19, grosor: 26, cuello: 7, angCuello: 0.22, grosorCuello: 15, cabeza: [11, 8], color: '#2a2622', panza: '#3a332c', cuernos: 'toro', cola: 'larga', orejas: 'costado', hocico: 5, argolla: true, joroba: true, pie: 'pezuna', cintura: 0.1, fino: 0.9, ancho: 60, alto: 54 },
};

// Pelaje podrido: el color del animal tirando a gris verdoso de carne muerta
function podrido(hex, k = 0.3) {
  const a = parseInt(hex.slice(1), 16), b = 0x56604a, m = (s, i) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return '#' + [16, 8, 0].map(s => m(s).toString(16).padStart(2, '0')).join('');
}

/* ---------- Anatomía de los animales ----------
 * Las patas doblan como las del animal de verdad, y cada una es una sola forma:
 *   adelante  baja derecha desde el codo (que va contra el pecho) y solo dobla en el carpo, con la caña yendo hacia
 *             atrás; cuando el cuerpo se agazapa el codo queda arriba, al costado del pecho, y no se arrodilla
 *   atrás     hace la zeta: el muslo va hacia adelante hasta la babilla, la pierna hacia atrás hasta el corvejón (la
 *             punta que mira para atrás) y la caña baja al pie
 * El pie se pone donde le toca en el paso (apoyado va hacia atrás; en el vuelo se levanta y vuelve) y de ahí salen
 * las articulaciones: no patina ni se hunde en el piso. Perros y gatos caminan sobre los dedos, con uñas; los demás,
 * sobre la pezuña hendida. El cuerpo deja de ser un óvalo: pecho hondo, cruz, lomo, grupa y la panza recogida de cada
 * especie, en una sola forma con el cuello. Antes cada pata eran dos rectángulos que doblaban todos para el mismo lado.
 *
 * Pintura: contorno por detrás y dos tonos planos (el claro es la misma forma un poco más chica, corrida hacia la
 * luz). Sin degradados ni recortes, que en este lienzo cuestan varias veces lo que un relleno plano: son manadas. */
function pielAnimal(ctx, hacer, color, op = {}) {
  ctx.beginPath(); hacer(0)(ctx);
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  const linea = op.linea ?? 0.9, k = op.mete ?? 1;
  // El contorno es el color de la pieza, bien oscuro: un negro traslúcido sobre un animal oscuro se ve como un halo claro
  if (linea) { ctx.strokeStyle = ajustarColor(color, -0.62); ctx.lineWidth = linea * 2; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.fillStyle = ajustarColor(color, op.oscuro ? -0.3 : -0.24); ctx.fill();
  ctx.save(); ctx.translate(-0.3 * k, -0.45 * k); ctx.beginPath(); hacer(k)(ctx); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
// Pieza chica de un solo tono (orejas, cuernos, pezuñas): relleno plano con su contorno por detrás
function plana(ctx, trazar, color, linea = 0.6) {
  ctx.beginPath(); trazar(ctx); ctx.closePath();
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  if (linea) { ctx.strokeStyle = ajustarColor(color, -0.62); ctx.lineWidth = linea * 2; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.fillStyle = color; ctx.fill();
}
// Curva cerrada y suave que pasa por todos los puntos
function curvaCerrada(c, P) {
  const n = P.length; c.moveTo(P[0][0], P[0][1]);
  for (let i = 0; i < n; i++) {
    const a = P[(i - 1 + n) % n], b = P[i], d = P[(i + 1) % n], e = P[(i + 2) % n];
    c.bezierCurveTo(b[0] + (d[0] - a[0]) / 6, b[1] + (d[1] - a[1]) / 6, d[0] - (e[0] - b[0]) / 6, d[1] - (e[1] - b[1]) / 6, d[0], d[1]);
  }
  c.closePath();
}
// Los mismos puntos, corridos k hacia el centro (la forma un poco más chica, para el tono claro)
function meter(P, k) {
  if (!k) return P;
  let cx = 0, cy = 0; for (const [x, y] of P) { cx += x; cy += y; } cx /= P.length; cy /= P.length;
  return P.map(([x, y]) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, q = Math.min(k, l * 0.45); return [x - dx / l * q, y - dy / l * q]; });
}
// Dos huesos de (ax, ay) a (bx, by): dónde queda la articulación del medio, que dobla hacia `lado` (+1: hacia adelante)
function dosHuesos(ax, ay, bx, by, L1, L2, lado = 1) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 0.001;
  const lejos = (L1 + L2) * 0.999, cerca = Math.abs(L1 - L2) + 0.05;
  if (d > lejos) { dx *= lejos / d; dy *= lejos / d; d = lejos; } else if (d < cerca) { dx *= cerca / d; dy *= cerca / d; d = cerca; }
  const t = (L1 * L1 - L2 * L2 + d * d) / (2 * d), alto = Math.sqrt(Math.max(0, L1 * L1 - t * t)), ux = dx / d, uy = dy / d;
  const s = uy * lado >= 0 ? 1 : -1;                                          // de las dos perpendiculares, la que mira hacia `lado`
  return { x: ax + ux * t + uy * s * alto, y: ay + uy * t - ux * s * alto, fx: ax + dx, fy: ay + dy };
}

// Cuadrúpedo mirando a la derecha con las patas en (0, 0), agazapado y con la cabeza baja para atacar: patas del
// lado lejano, cola, cuerpo y cuello con el lomo erizado, calvas de piel podrida y la herida con las costillas,
// cabeza con las orejas aplastadas hacia atrás, el hocico arrugado que muestra encías y colmillos, baba de sangre y
// ojos rojos encendidos bajo el ceño; patas del lado cercano con el hueso a la vista y garras o pezuñas.
function dibujarCuadrupedo(ctx, z, E, golpeado) {
  const col = c => golpeado ? ajustarColor(c, 0.7) : c, sil = Pincel.silueta;
  const anda = z.estado === 'camina' || z.estado === 'embiste', ataca = z.estado === 'ataca', carga = z.estado === 'carga', muerto = z.estado === 'muerto';
  const f = z.fase, R = z.recogido || 0, mitad = E.largo / 2, G = E.grosor, ahora = z.ahora, P = muerto ? z.pataleo : 0;
  const apagado = muerto && z.tiempoMuerto > 0.9;                       // se le apagan los ojos
  const bob = anda ? -Math.abs(Math.sin(f)) * 1.4 : carga ? Math.sin(ahora / 40) * 0.8 : 0;
  const yc = -E.pata * (1 - R * 0.55) - G * 0.42 + bob;
  const base = podrido(E.color, E.color === '#f0ece2' || E.color === '#f0e8da' ? 0.22 : 0.3);
  const piel = col(base), oscuro = col(ajustarColor(base, -0.32)), carne = col('#6a1414'), hueso = col('#ddd2b4');
  const garra = E.pie !== 'pezuna', fino = E.fino ?? 1, m = mitad + 3, h = G / 2, borde = limitar(G * 0.05, 0.5, 0.95), mete = limitar(G * 0.06, 0.5, 1.3);

  /* ----- Patas ----- */
  const L = E.pata, codo0 = L + G * 0.03, cadera0 = L + G * 0.445;                        // alto del codo y de la cadera, parado
  const zancada = L * (E.rapido ? 0.95 : 0.62), vuelo = L * (E.rapido ? 0.3 : 0.2), apoyo = E.rapido ? 0.5 : 0.62;
  const wf0 = Math.max(1.6, G * 0.34 * fino), wf1 = Math.max(1.2, G * 0.2 * fino), wf2 = Math.max(1.05, G * 0.165 * fino);
  const wt0 = Math.max(2.4, G * 0.62 * fino), wt1 = Math.max(1.7, G * 0.34 * fino), wt2 = Math.max(1.25, G * 0.21 * fino), wt3 = Math.max(1.05, G * 0.165 * fino);
  const pieL = garra ? wf2 * 1.75 : wf2 * 1.55, pieH = garra ? wf2 * 0.95 : wf2 * 1.15, empeine = pieH * 0.85;   // la caña entra al pie a esta altura
  // Los huesos miden lo que hace falta para que, parado, la mano quede casi derecha (1,5 % de sobra) y la pata de atrás
  // conserve su zeta
  const Lf1 = (codo0 - empeine) * 0.565, Lf2 = (codo0 - empeine) * 0.45;                  // antebrazo; caña y cuartilla
  const Lt3 = cadera0 * (garra ? 0.31 : 0.35), Lt1 = (cadera0 - Lt3 - empeine) * 0.535, Lt2 = (cadera0 - Lt3 - empeine) * 0.585;   // caña; muslo y pierna
  // Dónde va el pie de cada pata (x0: donde pisa quieta; arriba: la altura de su articulación, para cuando no hay piso)
  const pisada = (x0, desfase, adelante, cerca, arriba) => {
    if (muerto) {   // panza arriba: recogidas, pateando con espasmos
      const t = Math.sin(ahora / 38 + desfase * 2.3 + x0) * P;
      return [x0 + (adelante ? 0.18 : -0.05) * L + t * 0.42 * L, arriba + (adelante ? codo0 * 0.74 : cadera0 * 0.7) * (1 - 0.22 * Math.abs(t)), true];
    }
    if (anda) {
      const u = (((f + desfase) / (2 * Math.PI)) % 1 + 1) % 1;
      if (u < apoyo) return [x0 + zancada * (0.5 - u / apoyo), 0, false];
      const s = (u - apoyo) / (1 - apoyo);
      return [x0 + zancada * (s * s * (3 - 2 * s) - 0.5), -vuelo * Math.sin(Math.PI * s), true];
    }
    if (carga && adelante && cerca) { const t = ahora / 70, sube = Math.max(0, Math.cos(t)); return [x0 + Math.sin(t) * L * 0.32, -sube * L * 0.16, sube > 0.05]; }   // escarba el piso
    if (ataca) return [x0 + Math.sin(ahora / 90 + desfase) * L * 0.05, 0, false];
    return [x0, 0, false];
  };
  // El pie: la garra (almohadilla y dedos, con sus uñas) o la pezuña hendida. Gira con la caña cuando está en el aire
  const trazarPie = (c, fx, fy, giro, k) => {
    const cg = Math.cos(giro), sg = Math.sin(giro), Q = (x, y) => [fx + x * cg - y * sg, fy + x * sg + y * cg], l = pieL - k, a = pieH - k * 0.6;
    // (en el mismo sentido que tramoMusculo: van juntos en un solo trazado y, si no, donde se pisan queda un agujero)
    if (garra) { c.moveTo(...Q(-l * 0.38, -a * 0.1)); c.lineTo(...Q(-l * 0.3, 0)); c.lineTo(...Q(l * 0.45, 0)); c.quadraticCurveTo(...Q(l * 0.7, 0), ...Q(l * 0.7, -a * 0.25)); c.quadraticCurveTo(...Q(l * 0.68, -a * 0.95), ...Q(l * 0.05, -a)); c.quadraticCurveTo(...Q(-l * 0.45, -a), ...Q(-l * 0.38, -a * 0.1)); c.closePath(); }
    else { c.moveTo(...Q(-l * 0.34, -a)); c.lineTo(...Q(l * 0.3, -a)); c.lineTo(...Q(l * 0.62, -a * 0.12)); c.lineTo(...Q(l * 0.6, 0)); c.lineTo(...Q(-l * 0.42, 0)); c.closePath(); }
  };
  const detallesPie = ({ fx, fy, giro }) => {
    if (sil) return;
    const cg = Math.cos(giro), sg = Math.sin(giro), Q = (x, y) => [fx + x * cg - y * sg, fy + x * sg + y * cg];
    if (garra) for (let k = 0; k < 3; k++) linea(ctx, '#e8e0c8', Math.max(0.3, pieH * 0.2), [Q(pieL * (0.42 + k * 0.1), -pieH * (0.3 - k * 0.1)), Q(pieL * (0.62 + k * 0.1), -pieH * (0.02 - k * 0.04) + 0.25)]);
    else linea(ctx, 'rgba(0, 0, 0, 0.5)', Math.max(0.25, pieH * 0.12), [Q(pieL * 0.12, -pieH * 0.95), Q(pieL * 0.3, -0.1)]);   // la hendidura
  };
  const pataDelantera = (ex0, desfase, cerca) => {
    // El codo: pegado al pecho; si el cuerpo baja, queda arriba (no se arrodilla). Acompaña al pie en el paso
    const pegado = yc + h * 0.78, x0 = ex0 + L * 0.02;
    const [px, py, enAire] = pisada(x0, desfase, true, cerca, pegado);
    const ex = ex0 + (muerto ? 0 : (px - x0) * 0.55), ey = muerto ? pegado : Math.min(pegado, -codo0 * (1 - 0.18 * R) + bob * 0.4);
    const giro = enAire ? limitar(0.25 - Math.atan2(px - ex, py - ey) * 1.1, -0.3, 1.2) : 0;                      // en el aire la mano cuelga de la caña
    const cg = Math.cos(giro), sg = Math.sin(giro), nudo = [px - pieL * 0.1 * cg + pieH * 0.85 * sg, py - pieL * 0.1 * sg - pieH * 0.85 * cg];   // donde la cuartilla entra al pie
    const C = dosHuesos(ex, ey, nudo[0], nudo[1], Lf1, Lf2, 1), nx = C.fx, ny = C.fy, fx = px + (nx - nudo[0]), fy = py + (ny - nudo[1]);
    return { C, nx, ny, fx, fy, giro, trazar: k => c => {
      tramoMusculo(ex, ey, C.x, C.y, wf0 - k, wf1 - k * 0.8, 0.1, 0.04, 0.3, 0.3)(c); tramoMusculo(C.x, C.y, nx, ny, wf1 - k * 0.8, wf2 - k * 0.7)(c);
      if (garra) trazarPie(c, fx, fy, giro, k);
    } };
  };
  const pataTrasera = (hx, desfase, cerca) => {
    const hy = yc - h * 0.05, x0 = hx - cadera0 * 0.12;
    const [px, py, enAire] = pisada(x0, desfase, false, cerca, hy);
    // La caña: casi a plomo en el apoyo, inclinada con el paso; en el vuelo el pie queda atrás del corvejón
    const phi = muerto ? -0.55 - 0.3 * P : limitar(0.1 + (px - x0) / zancada * 0.75 - (enAire ? Math.min(1, -py / vuelo) * 0.7 : 0) - R * 0.3, -1.1, 0.7);
    const giro = enAire ? limitar(-phi * 0.9, -0.2, 1.1) : 0;
    const cg = Math.cos(giro), sg = Math.sin(giro), nudo = [px - pieL * 0.1 * cg + pieH * 0.85 * sg, py - pieL * 0.1 * sg - pieH * 0.85 * cg];
    const kx0 = nudo[0] - Math.sin(phi) * Lt3, ky0 = nudo[1] - Math.cos(phi) * Lt3;                // corvejón
    const S = dosHuesos(hx, hy, kx0, ky0, Lt1, Lt2, 1), dx = S.fx - kx0, dy = S.fy - ky0;       // babilla (si no llega, la pata entera se acerca)
    const kx = S.fx, ky = S.fy, nx = nudo[0] + dx, ny = nudo[1] + dy, fx = px + dx, fy = py + dy;
    return { S, kx, ky, nx, ny, fx, fy, giro, trazar: k => c => {
      tramoMusculo(hx, hy, S.x, S.y, wt0 - k * 1.4, wt1 - k, 0.26, 0.12, 0.35, 0.4)(c); tramoMusculo(S.x, S.y, kx, ky, wt1 - k, wt2 - k * 0.8, 0.1, 0.02)(c);
      tramoMusculo(kx, ky, nx, ny, wt2 * 0.92 - k * 0.8, wt3 - k * 0.7)(c);
      if (garra) trazarPie(c, fx, fy, giro, k);
    } };
  };
  const pezuna = q => { if (!garra) plana(ctx, c => trazarPie(c, q.fx, q.fy, q.giro, 0), col('#1e1a16'), borde * 0.8); };
  const xDel = m * 0.6, xTra = -m * 0.6, corr = G * 0.15;   // las del lado lejano, un poco corridas
  // Al paso las cuatro pisan de a una (atrás, adelante del mismo lado, y lo mismo del otro); al trote, de a dos en diagonal
  const mano = E.rapido ? Math.PI : -Math.PI / 2;
  for (const q of [pataTrasera(xTra - corr, Math.PI, false), pataDelantera(xDel - corr, mano + Math.PI, false)]) { pezuna(q); pielAnimal(ctx, q.trazar, oscuro, { linea: borde, mete: mete * 0.55 }); detallesPie(q); }
  const T = pataTrasera(xTra, 0, true), D = pataDelantera(xDel, mano, true);                 // las cercanas van con el cuerpo

  /* ----- Cola tiesa ----- */
  const cx = -m + 1.5, cy = yc - G * 0.16, mece = Math.sin(ahora / 140) * 1.4;
  if (E.cola === 'corta') plana(ctx, elipse(cx - 1.5, cy - 0.5, 2.4, 3.4, 0.7), piel, borde);
  else if (E.cola === 'larga') { linea(ctx, sil || oscuro, 1.6, [[cx, cy], [cx - 4 + mece * 0.4, cy + G * 0.35], [cx - 4 + mece, cy + G * 0.8]]); plana(ctx, elipse(cx - 4 + mece, cy + G * 0.85, 1.6, 2.6), col('#1a1816'), 0.4); }
  else if (E.cola === 'levantada') linea(ctx, sil || piel, 2.6, [[cx + 1, cy], [cx - 4, cy - 3 + mece * 0.4], [cx - 6 + mece * 0.5, cy - 7]]);
  else if (E.cola === 'gato') linea(ctx, sil || piel, 3, [[cx + 1, cy], [cx - 4, cy - 4], [cx - 5 + mece, cy - 10], [cx - 3 + mece, cy - 14]]);   // cola esponjada

  /* ----- Cuerpo, cuello y patas del lado cercano: una sola forma, así el muslo y el hombro salen del cuerpo sin una
   * bola en la cadera ni en el codo; el contorno queda solo en la silueta ----- */
  // Cuello estirado hacia adelante y la cabeza baja, a la altura de la presa
  const ang = muerto ? E.angCuello * 0.3 - 0.5 + Math.sin(ahora / 45) * 0.25 * z.pataleo : E.angCuello * 0.7 + (ataca ? -0.35 + Math.sin(ahora / 80) * 0.16 : carga ? -0.4 : Math.sin(f * 0.5) * 0.06 - 0.12) + (z.cabezaAtras || 0) * -0.6;
  const nx0 = mitad - 2, ny0 = yc - G * 0.15, nx = nx0 + Math.cos(ang) * E.cuello, ny = ny0 - Math.sin(ang) * E.cuello;
  const cintura = E.cintura ?? 0.5, cruz = E.joroba ? 1.46 : 1.06;      // cuánto se recoge la panza; la joroba del toro
  const lomo = [[-1, -0.22], [-0.97, 0.42], [-0.55, 0.86 - 0.36 * cintura], [-0.12, 1.05 - 0.33 * cintura], [0.36, 1.02], [0.8, 0.84], [1.01, 0.08], [0.93, -0.72], [0.6, -cruz], [0.22, E.joroba ? -1.02 : -0.9], [-0.22, -0.86], [-0.72, -0.93]]
    .map(([x, y]) => [x * m, yc + y * h]);   // de la cola, por abajo, hasta el pecho y de vuelta por el lomo
  const wc0 = E.grosorCuello * 1.55, wc1 = E.grosorCuello * 1.05;
  pezuna(T); pezuna(D);
  pielAnimal(ctx, k => c => { curvaCerrada(c, meter(lomo, k)); tramoMusculo(nx0, ny0, nx, ny, wc0 - k * 1.5, wc1 - k * 1.2, 0.12, 0.04)(c); T.trazar(k * 0.55)(c); D.trazar(k * 0.55)(c); }, piel, { linea: borde, mete });
  if (E.ubre) plana(ctx, elipse(-mitad * 0.35, yc + h * 0.98, 4.4, 3), col('#a87878'), borde * 0.8);
  // Lomo erizado: pelos parados desde la cruz hasta la grupa (la vaca no)
  if (!E.ubre) {
    const pts = [], alto = x => { const u = x / m; return yc - h * (u > 0.22 ? 0.9 + (cruz - 0.9) * Math.min(1, (u - 0.22) / 0.38) : u > -0.72 ? 0.88 : 0.93); };
    for (let k = 0; k <= 12; k++) { const u = k / 12, x = -mitad * 0.7 + u * mitad * 1.5, y = alto(x); pts.push([x, y + 0.9], [x + mitad * (0.04 + 0.05 * Math.abs(Math.sin(k * 1.9))), y - G * (0.1 + 0.1 * Math.sin(u * Math.PI) + 0.06 * Math.abs(Math.sin(k * 2.7))) - (ataca || carga ? G * 0.06 : 0)]); }   // pelos de largo desparejo
    pts.push([mitad * 0.82, alto(mitad * 0.82) + 0.9]);
    plana(ctx, poli(pts), oscuro, 0);
  }
  if (!sil) {
    // La panza, más clara: una franja que sigue la línea de abajo, entre las patas
    detalle(ctx, col(podrido(E.panza, 0.3)), c => curvaCerrada(c, [[-0.46, 0.8 - 0.35 * cintura], [-0.12, 0.95 - 0.33 * cintura], [0.32, 0.92], [0.3, 0.58], [-0.1, 0.62 - 0.33 * cintura], [-0.44, 0.52 - 0.35 * cintura]].map(([x, y]) => [x * m, yc + y * h])));
    // El hombro y el anca, apenas marcados: el borde de adelante del muslo y el de atrás de la paleta
    linea(ctx, 'rgba(20, 12, 8, 0.3)', borde * 0.9, [[m * 0.8, yc - h * 0.5], [m * 0.5, yc - h * 0.05], [D.C.x - wf0 * 0.75, yc + h * 0.72]]);
    linea(ctx, 'rgba(20, 12, 8, 0.3)', borde * 0.9, [[-m * 0.4, yc - h * 0.7], [T.S.x + wt1 * 0.5, T.S.y - wt1 * 0.9], [T.S.x + wt1 * 0.55, T.S.y - wt1 * 0.1]]);
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
      detalle(ctx, 'rgba(120,10,10,0.75)', elipse(nx - 1, ny + E.grosorCuello * 0.45, E.grosorCuello * 0.45, E.grosorCuello * 0.6));   // pecho manchado de sangre
    }
  }
  if (E.barril) {
    plana(ctx, redondo(nx - 4, ny + E.grosorCuello * 0.3, 8, 6, 1.4), col('#6a4420'), borde * 0.8);
    if (!sil) { linea(ctx, '#2a1e10', 0.6, [[nx - 2, ny + E.grosorCuello * 0.3], [nx - 2, ny + E.grosorCuello * 0.3 + 6]]); linea(ctx, '#2a1e10', 0.6, [[nx + 2, ny + E.grosorCuello * 0.3], [nx + 2, ny + E.grosorCuello * 0.3 + 6]]); linea(ctx, '#7a1a16', 1.4, [[nx - 4, ny + E.grosorCuello * 0.25], [nx + 4, ny + E.grosorCuello * 0.25]]); }
  }

  /* ----- Cabeza ----- */
  const [cw, ch] = E.cabeza, Hc = E.hocico, abre = muerto ? 0.8 : ataca ? 0.45 + Math.abs(Math.sin(ahora / 70)) * 0.35 : carga ? 0.4 : 0.28 + Math.sin(ahora / 300) * 0.05;
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(0.45 - (ataca ? 0.25 : 0));
  // Mandíbula abierta con los colmillos de abajo
  ctx.save(); ctx.translate(cw * 0.15, ch * 0.35); ctx.rotate(abre);
  plana(ctx, c => curvaCerrada(c, [[-cw * 0.12, ch * 0.02], [cw * 0.3, ch * 0.5], [cw * 1.25, ch * 0.5], [cw * 0.9 + Hc * 0.7, ch * 0.3], [cw * 0.9 + Hc * 0.72, ch * 0.02], [cw * 0.7, -ch * 0.08]]), oscuro, borde * 0.8);
  if (muerto) plana(ctx, elipse(cw * 1.5, ch * 0.45, cw * 0.55, ch * 0.2, 0.5), col('#b0566a'), 0.4);   // lengua afuera
  if (!sil) {
    detalle(ctx, '#3a0606', elipse(cw * 0.85, ch * 0.02, cw * 0.7, ch * 0.16));
    if (!golpeado) { ctx.fillStyle = '#e8dcbc'; for (const [x, a] of [[cw * 1.35, ch * 0.55], [cw * 0.7, ch * 0.3], [cw * 1.05, ch * 0.3]]) { ctx.beginPath(); ctx.moveTo(x - 0.5, ch * 0.05); ctx.lineTo(x, ch * 0.05 - a); ctx.lineTo(x + 0.6, ch * 0.05); ctx.fill(); } }
  }
  ctx.restore();
  // Orejas aplastadas hacia atrás, cuernos y astas
  if (E.orejas === 'largas') plana(ctx, poli([[-cw * 0.2, -ch * 0.55], [-cw * 1.3, -ch * 1.2], [-cw * 0.1, -ch * 0.85]]), piel, borde * 0.8);
  if (E.orejas === 'gato') plana(ctx, poli([[-cw * 0.3, -ch * 0.5], [-cw * 1.0, -ch * 1.25], [cw * 0.15, -ch * 0.75]]), piel, borde * 0.8);
  if (E.cuernos === 'toro') plana(ctx, poli([[-cw * 0.1, -ch * 0.6], [cw * 0.6, -ch * 1.1], [cw * 1.4, -ch * 2.2], [cw * 1.25, -ch * 1.3], [cw * 0.55, -ch * 0.4]]), col('#d8ccb0'), borde * 0.8);
  if (E.cuernos === 'vaca') plana(ctx, poli([[0, -ch * 0.7], [cw * 0.35, -ch * 1.6], [cw * 0.55, -ch * 1.5], [cw * 0.35, -ch * 0.6]]), col('#c8bea0'), borde * 0.8);
  if (E.astas) {
    const a = [[0, -ch * 0.7], [-cw * 0.1, -ch * 2.6], [-cw * 0.4, -ch * 3.8], [0, -ch * 5]];
    linea(ctx, sil || col('#b8a688'), 1.7, a);
    for (const [i, dx2, dy2] of [[1, cw * 0.75, -ch * 0.5], [2, cw * 0.65, -ch * 0.7], [2, -cw * 0.55, -ch * 0.3], [3, cw * 0.4, -ch * 0.3]]) linea(ctx, sil || col('#b8a688'), 1.2, [a[i], [a[i][0] + dx2, a[i][1] + dy2]]);
    if (!sil && !golpeado) linea(ctx, 'rgba(120,10,10,0.8)', 0.9, [a[2], a[3]]);   // asta ensangrentada
  }
  // Cráneo y hocico, una sola forma: nuca, frente, el quiebre de la frente, la caña de la nariz, la trufa y el belfo
  // arrugado (se le ven las encías y los colmillos de arriba)
  const perfil = [[-cw * 0.55, ch * 0.2], [-cw * 0.1, ch * 0.7], [cw * 0.55, ch * 0.6], [cw * 1.0 + Hc * 0.45, ch * 0.6], [cw * 1.05 + Hc * 0.9, ch * 0.45], [cw * 1.05 + Hc * 0.98, 0], [cw * 1.0 + Hc * 0.6, -ch * 0.3], [cw * 0.85, -ch * 0.5], [cw * 0.3, -ch * 0.78], [-cw * 0.35, -ch * 0.6]];
  pielAnimal(ctx, k => c => curvaCerrada(c, meter(perfil, k)), piel, { linea: borde, mete: mete * 0.7 });
  if (E.orejas === 'caidas') plana(ctx, poli([[-cw * 0.1, -ch * 0.6], [-cw * 0.9, -ch * 0.2], [-cw * 0.6, ch * 0.5], [cw * 0.2, -ch * 0.2]]), col(E.manchas ? podrido(E.manchas, 0.25) : ajustarColor(base, -0.25)), borde * 0.8);
  if (E.orejas === 'costado') plana(ctx, elipse(-cw * 0.45, -ch * 0.3, cw * 0.45, ch * 0.2, -0.7), piel, borde * 0.8);
  if (!sil) {
    detalle(ctx, col(ajustarColor(base, -0.1)), elipse(cw * 1.02 + Hc * 0.45, ch * 0.2, Hc * 0.62, ch * 0.3));          // el hocico, un tono más oscuro
    if (E.manchas && E.barril) detalle(ctx, col(podrido(E.manchas, 0.25)), elipse(cw * 0.1, -ch * 0.25, cw * 0.4, ch * 0.4));
    detalle(ctx, '#140c0a', elipse(cw * 1.05 + Hc * 0.8, ch * 0.0, 1.0, 0.8));                                  // nariz
    if (E.argolla) { ctx.beginPath(); ctx.arc(cw * 1.1 + Hc * 0.75, ch * 0.55, 1.6, 0, Math.PI * 2); ctx.strokeStyle = '#a89050'; ctx.lineWidth = 0.6; ctx.stroke(); }
    for (let k = 0; k < 3; k++) linea(ctx, 'rgba(20,10,8,0.55)', 0.35, [[cw * 0.75 + k * 0.9, -ch * 0.1], [cw * 0.95 + k * 0.9, ch * 0.2]]);   // arrugas del gruñido
    if (!golpeado) {
      detalle(ctx, '#7a2a2e', elipse(cw * 1.0, ch * 0.5, cw * 0.55, ch * 0.13));                                        // encía
      ctx.fillStyle = '#efe4c4';
      for (const [x, a] of [[cw * 1.35, ch * 0.65], [cw * 0.65, ch * 0.5], [cw * 0.85, ch * 0.22], [cw * 1.05, ch * 0.25], [cw * 1.2, ch * 0.22]]) { ctx.beginPath(); ctx.moveTo(x - 0.55, ch * 0.5); ctx.lineTo(x, ch * 0.5 + a); ctx.lineTo(x + 0.55, ch * 0.5); ctx.fill(); }
      ctx.fillStyle = '#9a1010'; ctx.fillRect(cw * 1.25, ch * 0.7, 0.8, 3 + abre * 6); ctx.beginPath(); ctx.arc(cw * 1.29, ch * 0.7 + 3 + abre * 6, 0.9, 0, Math.PI * 2); ctx.fill();   // baba de sangre
      ctx.fillRect(cw * 0.8, ch * 0.62, 0.6, 1.6 + abre * 3);
    }
    // Ojos rojos encendidos bajo el ceño
    const ox = cw * 0.55, oy = -ch * 0.22, r = Math.max(1, ch * 0.2);
    if (!apagado) { const g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 4); g2.addColorStop(0, 'rgba(255,40,20,0.75)'); g2.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(ox - r * 4, oy - r * 4, r * 8, r * 8); }
    detalle(ctx, apagado ? '#4a1a16' : '#ff2a1a', elipse(ox, oy, r * 1.1, r * 0.8));
    if (!apagado) detalle(ctx, '#ffd0a0', circulo(ox + r * 0.2, oy - r * 0.15, r * 0.3));
    detalle(ctx, '#140404', elipse(ox + r * 0.1, oy, r * 0.18, r * 0.65));                                              // pupila rasgada
    linea(ctx, 'rgba(15,8,6,0.9)', Math.max(0.6, ch * 0.12), [[ox - r * 1.4, oy - r * 1.6], [ox + r * 1.5, oy - r * 0.4]]);   // ceño
    detalle(ctx, 'rgba(70,8,8,0.8)', elipse(-cw * 0.1, ch * 0.25, cw * 0.2, ch * 0.18));                                // mordida en la cara
  }
  ctx.restore();

  /* ----- Uñas o hendidura de las patas cercanas, y la carne arrancada ----- */
  detallesPie(T); detallesPie(D);
  if (!sil && !golpeado) {   // carne arrancada y el hueso a la vista en la caña de adelante
    const a = [D.C.x + (D.nx - D.C.x) * 0.2, D.C.y + (D.ny - D.C.y) * 0.2], b = [D.C.x + (D.nx - D.C.x) * 0.8, D.C.y + (D.ny - D.C.y) * 0.8];
    detalle(ctx, carne, elipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, wf2 * 0.42, Lf2 * 0.32, -Math.atan2(b[0] - a[0], b[1] - a[1])));
    linea(ctx, hueso, Math.max(0.35, wf2 * 0.28), [a, b]);
  }
}

// Los puntos en el sentido en que traza tramoMusculo (para poder sumarlos a su mismo trazado sin que quede un agujero)
function sentido(P) {
  let area = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1]; }
  return area > 0 ? P.slice().reverse() : P;
}
// Cuello que se afina a lo largo de una curva: de a, pasando cerca de b, hasta c; ancho w0 al nacer y w1 al final.
// Devuelve el trazado en función de cuánto se mete hacia adentro (para el tono claro)
function cuelloCurvo(a, b, c, w0, w1, n = 8) {
  return k => q => {
    const izq = [], der = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t, x = u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], y = u * u * a[1] + 2 * u * t * b[1] + t * t * c[1];
      const dx = 2 * u * (b[0] - a[0]) + 2 * t * (c[0] - b[0]), dy = 2 * u * (b[1] - a[1]) + 2 * t * (c[1] - b[1]), l = Math.hypot(dx, dy) || 1, w = Math.max(0.2, (w0 + (w1 - w0) * t) / 2 - k);
      izq.push([x - dy / l * w, y + dx / l * w]); der.push([x + dy / l * w, y - dx / l * w]);
    }
    sentido(izq.concat(der.reverse())).forEach(([x, y], i) => i ? q.lineTo(x, y) : q.moveTo(x, y)); q.closePath();
  };
}

// Ñandú: ave grande de dos patas, desplumada a parches, cuello pelado y ensangrentado, pico entreabierto con el
// borde aserrado y ojos rojos; ataca a picotazos con el cuello estirado. Las patas son las de un ave corredora: el
// muslo, corto, va hacia adelante escondido entre las plumas; la pierna baja hasta el talón, que es la articulación
// que se ve a media pata y mira hacia atrás (no es una rodilla); de ahí la caña larga hasta los tres dedos. Antes
// era una línea quebrada que doblaba hacia adelante.
function dibujarNandu(ctx, z, E, golpeado) {
  const col = c => golpeado ? ajustarColor(c, 0.7) : c, sil = Pincel.silueta;
  const anda = z.estado === 'camina', ataca = z.estado === 'ataca', f = z.fase, R = z.recogido || 0, muerto = z.estado === 'muerto', P = muerto ? z.pataleo : 0, ahora = z.ahora;
  const piel = col(podrido(E.color, 0.25)), oscuro = col(ajustarColor(podrido(E.color, 0.25), -0.3)), patas = col('#7a6e56'), patasLejos = col('#5c5340'), pelado = col('#9a8478');
  const yc = -34 * (1 - R * 0.4) + (anda ? -Math.abs(Math.sin(f)) * 1.6 : 0);
  /* ----- Patas ----- */
  const Lt1 = 7.5, Lt2 = 11.5, Lt3 = 13, zancada = 17, vuelo = 8, apoyo = 0.5;
  const pata = (desfase, cerca) => {
    const hx = -1.5, hy = yc + 4, x0 = hx + 1.5;
    let px = x0 + (cerca ? 1.6 : -1.6), py = 0, enAire = false;
    if (muerto) { const t = Math.sin(ahora / 40 + desfase * 2) * P; px = x0 + 4 + t * 9; py = hy + 21 * (1 - 0.2 * Math.abs(t)); enAire = true; }
    else if (anda) {
      const u = (((f + desfase) / (2 * Math.PI)) % 1 + 1) % 1;
      if (u < apoyo) px = x0 + zancada * (0.5 - u / apoyo);
      else { const s = (u - apoyo) / (1 - apoyo); px = x0 + zancada * (s * s * (3 - 2 * s) - 0.5); py = -vuelo * Math.sin(Math.PI * s); enAire = true; }
    }
    // La caña: casi a plomo en el apoyo e inclinada con el paso; en el vuelo los dedos quedan atrás del talón
    const phi = muerto ? -0.5 - 0.3 * P : limitar(0.12 + (px - x0) / zancada * 0.8 - (enAire ? Math.min(1, -py / vuelo) * 0.8 : 0) - R * 0.35, -1.2, 0.75);
    const ax = px, ay = py - 0.8, tx0 = ax - Math.sin(phi) * Lt3, ty0 = ay - Math.cos(phi) * Lt3;          // talón
    const S = dosHuesos(hx, hy, tx0, ty0, Lt1, Lt2, 1), dx = S.fx - tx0, dy = S.fy - ty0;                 // la rodilla, entre las plumas
    const tx = S.fx, ty = S.fy, fx = ax + dx, fy = ay + dy, giro = enAire ? limitar(0.3 - phi * 0.9, -0.2, 1.3) : 0, cg = Math.cos(giro), sg = Math.sin(giro);
    const dedo = (l, baja) => [fx + l * cg - baja * sg, fy + l * sg + baja * cg];
    return { hx, hy, S, tx, ty, fx, fy, dedo,
      muslo: k => tramoMusculo(hx, hy, S.x, S.y, 9 - k * 1.6, 5.4 - k, 0.2, 0.12),
      trazar: k => c => {
        tramoMusculo(S.x, S.y, tx, ty, 4.6 - k, 2.1 - k * 0.5, 0.2, 0.02, 0.3, 0.3)(c); tramoMusculo(tx, ty, fx, fy, 2.0 - k * 0.5, 1.6 - k * 0.4)(c);
        tramoMusculo(fx, fy, ...dedo(6.4, 0.75), 1.6 - k * 0.4, 0.9 - k * 0.2)(c); tramoMusculo(fx, fy, ...dedo(4.4, 0.9), 1.5 - k * 0.4, 0.9 - k * 0.2)(c); tramoMusculo(fx, fy, ...dedo(-1.6, 0.7), 1.3 - k * 0.4, 0.8 - k * 0.2)(c);
      } };
  };
  const unas = q => { if (!sil) for (const [l, b] of [[6.4, 0.75], [4.4, 0.9]]) linea(ctx, '#e8e0c8', 0.6, [q.dedo(l - 0.4, b - 0.1), q.dedo(l + 1.1, b + 0.5)]); };
  const lejos = pata(Math.PI, false), cerca = pata(0, true);
  pielAnimal(ctx, k => c => { lejos.muslo(k)(c); }, oscuro, { linea: 0.7, mete: 0.6 });
  pielAnimal(ctx, lejos.trazar, patasLejos, { linea: 0.6, mete: 0.35 }); unas(lejos);
  pielAnimal(ctx, cerca.trazar, patas, { linea: 0.6, mete: 0.35 }); unas(cerca);                    // sale de debajo de las plumas del muslo
  /* ----- Cuello pelado y ensangrentado y la cabeza, una sola forma; al atacar se estira y pica.
   * Va antes que el cuerpo: nace de entre las plumas ----- */
  const pica = ataca ? Math.max(0, Math.sin(ahora / 70)) : 0;
  const cxp = muerto ? 22 + Math.sin(ahora / 50) * 2 * P : 12 + (ataca ? 6 + pica * 7 : 5), cyp = muerto ? yc - 4 : yc - 24 + (ataca ? 8 + pica * 6 : 2);   // muerto: el cuello cae flojo
  const c0 = [7.5, yc - 4.5], c1 = [11.5, yc - 15 + (muerto ? 8 : 0)], enCuello = t => [(1 - t) * (1 - t) * c0[0] + 2 * (1 - t) * t * c1[0] + t * t * cxp, (1 - t) * (1 - t) * c0[1] + 2 * (1 - t) * t * c1[1] + t * t * cyp];
  const cuello = cuelloCurvo(c0, c1, [cxp, cyp], 6, 3.1);
  const cabeza = [[cxp - 2.4, cyp + 0.8], [cxp - 0.2, cyp + 2.7], [cxp + 3.4, cyp + 2.2], [cxp + 4.7, cyp + 0.3], [cxp + 3.3, cyp - 2.2], [cxp - 0.2, cyp - 2.8]];
  pielAnimal(ctx, k => c => { cuello(k)(c); curvaCerrada(c, meter(cabeza, k * 0.7)); }, pelado, { linea: 0.7, mete: 0.6 });
  /* ----- Cuerpo con el muslo cercano: una sola forma ----- */
  const cuerpo = [[-17, 2], [-13, 7.6], [-4, 10.6], [7, 8.6], [12.6, 0], [9, -8], [-2, -11.6], [-12, -8.6]].map(([x, y]) => [x, yc + y]);
  pielAnimal(ctx, k => c => { curvaCerrada(c, meter(cuerpo, k)); cerca.muslo(k * 0.7)(c); }, piel, { linea: 0.8, mete: 0.9 });
  plana(ctx, poli([[-14, yc - 3], [-22, yc + 6], [-19, yc + 9], [-17, yc + 13], [-13, yc + 9], [-9, yc + 13], [-5, yc + 9], [-1, yc + 11], [2, yc + 6]]), oscuro, 0.6);   // alas desflecadas
  if (!sil && !golpeado) {
    for (let k = 0; k < 8; k++) linea(ctx, 'rgba(30,26,20,0.5)', 0.6, [[-14 + k * 3.2, yc - 7 + (k % 2)], [-16 + k * 3.2, yc + 4]]);
    detalle(ctx, pelado, elipse(-6, yc - 4, 4.4, 3));                                                                      // desplumado
    detalle(ctx, '#4a0808', elipse(3, yc + 1, 4.6, 3));
    for (let k = 0; k < 3; k++) linea(ctx, '#ddd2b4', 0.55, [[0.6 + k * 1.6, yc - 1], [1.2 + k * 1.6, yc + 2.8]]);
  }
  /* ----- Pico, ojo y sangre ----- */
  if (!sil && !golpeado) { linea(ctx, 'rgba(130,10,10,0.85)', 1.3, [enCuello(0.45), enCuello(0.56), enCuello(0.68)]); const g0 = enCuello(0.45); linea(ctx, 'rgba(130,10,10,0.7)', 0.6, [g0, [g0[0] - 0.2, g0[1] + 3.4]]); }   // sangre que le corre por el cuello
  const ab = ataca ? 0.5 + pica * 0.4 : 0.25;
  plana(ctx, poli([[cxp + 3.4, cyp - 0.8], [cxp + 9, cyp - 0.2 - ab], [cxp + 3.6, cyp + 0.6]]), col('#a89060'), 0.45);
  plana(ctx, poli([[cxp + 3.4, cyp + 0.8], [cxp + 8.4, cyp + 1.6 + ab * 2], [cxp + 3.6, cyp + 1.8]]), col('#8a7448'), 0.45);
  if (!sil) {
    detalle(ctx, '#3a0606', poli([[cxp + 3.6, cyp + 0.4], [cxp + 8.4, cyp + 0.2 - ab * 0.4], [cxp + 8, cyp + 1.4 + ab * 1.6]]));
    const g2 = ctx.createRadialGradient(cxp + 1.6, cyp - 0.8, 0, cxp + 1.6, cyp - 0.8, 4); g2.addColorStop(0, 'rgba(255,40,20,0.7)'); g2.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(cxp - 2.4, cyp - 4.8, 8, 8);
    detalle(ctx, '#ff2a1a', circulo(cxp + 1.6, cyp - 0.8, 1.05)); detalle(ctx, '#140404', circulo(cxp + 1.8, cyp - 0.8, 0.35));
    linea(ctx, 'rgba(15,8,6,0.9)', 0.6, [[cxp, cyp - 2.4], [cxp + 3, cyp - 1.4]]);
    if (!golpeado) { ctx.fillStyle = '#9a1010'; ctx.fillRect(cxp + 7, cyp + 1.6 + ab * 2, 0.6, 3); }
  }
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
    if (this.estado === 'muerto') { this.moverCadaver(dt, juego); return; }
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
  // Muerte aparatosa: el golpe lo despide hacia donde lo empujó (más fuerte si fue una explosión; los grandes
  // pesan y vuelan menos), da una vuelta en el aire, cae panza arriba, rebota, patalea con espasmos echando
  // chorros de sangre, saca la lengua, se le apagan los ojos y se desvanece en su charco
  sonidoMuerte() { Audio_.animalMuere(this.tamañoVoz()); }
  recibirDano(cantidad, direccion, arma, juego) {
    const vivo = this.estado !== 'muerto';
    super.recibirDano(cantidad, direccion, arma, juego);
    if (!vivo || this.estado !== 'muerto') return;
    const fuerza = arma && arma.explosivo ? 1.8 : 1, peso = this.jefe ? 0.35 : { vaca: 0.55, ciervo: 0.85, guanaco: 0.85 }[this.especie] || 1;
    const d = direccion || -this.direccion;
    this.muerte = { vx: d * (1.6 + Math.random() * 1.6) * fuerza * peso, vy: -(3.6 + Math.random() * 1.8) * fuerza * Math.sqrt(peso), altura: 0, giro: 0,
      vgiro: d * (0.15 + Math.random() * 0.07) * (fuerza > 1 ? 1.5 : 1), botes: 0, chorro: 0, quieto: false };
    juego.salpicar(this.x, this.y - this.alto * 0.5, this.colorSangre, 14, 6);
  }
  moverCadaver(dt, juego) {
    this.tiempoMuerto += dt;
    const M = this.muerte; if (!M) return;
    const paso = dt * 60, E = this.E, e = this.escala, apoyo = (E.bipedo ? 11 : E.grosor * 0.5) * e;
    if (!M.quieto) {
      M.vy += 0.45 * paso; M.altura -= M.vy * paso;
      const nx = this.x + M.vx * paso; if (alturaSuelo(nx) < SUELO_BASE + 100) this.x = nx; else M.vx = 0;
      if (M.altura <= 0) {
        M.altura = 0;
        if (M.vy > 1.4 && M.botes < 2) {   // rebota contra el piso
          const fuerte = M.botes === 0; M.vy = -M.vy * 0.3; M.vx *= 0.45; M.botes++;
          Audio_.cuerpoAnimalCae(this.tamañoVoz(), fuerte ? 1 : 0.5);
          if (fuerte) {
            juego.sacudida = Math.max(juego.sacudida, this.jefe ? 14 : 3 + this.tamañoVoz() * 2);
            juego.salpicar(this.x, this.y - apoyo, this.colorSangre, 10, 4);
            for (let k = 0; k < 10; k++) juego.particulas.push(new Particula(this.x + (Math.random() - 0.5) * this.ancho, this.y - 2, (Math.random() - 0.5) * 4, -Math.random() * 2, '#8a7e6a', 0.5 + Math.random() * 0.4, 3 + Math.random() * 4, true));
          }
        } else { M.vy = 0; M.vx *= Math.pow(0.8, paso); if (Math.abs(M.vx) < 0.08) M.quieto = true; }
      }
      if (M.botes === 0) M.giro += M.vgiro * paso;
    }
    if (M.botes > 0) {   // en el piso se acomoda panza arriba
      const meta = Math.round((M.giro - Math.PI) / (2 * Math.PI)) * 2 * Math.PI + Math.PI;
      M.giro += (meta - M.giro) * Math.min(1, dt * 9);
    }
    this.y = this.ySuelo !== undefined ? this.ySuelo : alturaSuelo(this.x);   // en el último bastión el piso es la fila
    // Chorros de sangre mientras patalea
    const T = this.tiempoMuerto;
    if (T < 1.9 && T >= M.chorro) {
      M.chorro = T + 0.18 + Math.random() * 0.12;
      const cy = this.y - M.altura - apoyo;
      for (let k = 0; k < 5; k++) juego.particulas.push(new Particula(this.x + (Math.random() - 0.5) * 6, cy, (Math.random() - 0.5) * 2.4, -(2.5 + Math.random() * 3), k % 2 ? this.colorSangre : '#5a0606', 0.5 + Math.random() * 0.4, 2 + Math.random() * 2.5, true));
    }
  }
  terminado() { return this.estado === 'muerto' && this.tiempoMuerto > 5; }
  dibujar(ctx, camaraX, ahora) {
    if (this.estado !== 'muerto') return super.dibujar(ctx, camaraX, ahora);
    this.ahora = ahora;
    const T = this.tiempoMuerto, e = this.escala, E = this.E, M = this.muerte || { altura: 0, giro: Math.PI, botes: 1 };
    this.pataleo = T < 0.4 ? 1 : limitar(1 - (T - 0.6) / 1.8, 0, 1) * (0.3 + 0.7 * Math.abs(Math.sin(T * 6.5)));
    const yc0 = (E.bipedo ? -34 : -(E.pata + E.grosor * 0.42)) * e, apoyo = (E.bipedo ? -11 : -E.grosor * 0.5) * e;
    const k = (1 - Math.cos(M.giro)) / 2;                                   // 0 parado, 1 panza arriba
    ctx.save(); ctx.translate(this.x - camaraX, this.y);
    ctx.globalAlpha = 1 - limitar((T - 3.3) / 1.7, 0, 1);
    if (M.botes > 0) {   // charco que crece debajo
      const charco = limitar((T - 0.5) / 1.4, 0, 1);
      ctx.fillStyle = this.colorCharco; ctx.beginPath(); ctx.ellipse(0, 3, (6 + charco * 20) * e * (this.jefe ? 1.6 : 1), (2 + charco * 4.5) * e, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.translate(0, -M.altura + yc0 + (apoyo - yc0) * k); ctx.rotate(M.giro); ctx.translate(0, -yc0);
    this.recogido = 0;
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
  // Los que embisten (hay que saltarlos por encima): 15 % más chicos y 30 % más rápidos que al principio, así pasan
  // por debajo del salto en menos tiempo
  avion:  { animal: 'sanbernardo', escala: 2.64, vida: 22, vel: 1.5, ataque: 'embestida' },
  ruta:   { animal: 'toro', escala: 1.7, vida: 30, vel: 1.24, ataque: 'embestida' },
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
    if (z.moverCadaver) { z.moverCadaver(dt, juego); return; }
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
        // Pega con la cabeza (cuernos u hocico): una vez que el salto pasó por encima de la cabeza, el lomo ya no lastima
        const delante = (j.x - z.x) * A.dir;
        if (!A.pego && !j.muerto && delante > -alcance * 0.15 && delante < alcance + 10 && j.y - z.y > -55) {
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
