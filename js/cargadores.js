/* ===== Cargadores: el de cada arma, puesto, en la mano y en el piso =====
 * Cada arma con cargador extraíble tiene acá su cargador: el mismo dibujo que se ve en el arma (el modelo lo llama
 * desde acá), así el que se saca, el que se lleva en la mano y el que cae al piso son ese cargador y de esa medida
 * (antes eran un palito genérico de 2 × 10 o tres cubitos apilados).
 *   dibujar(ctx, suelto, lleno)  en cm, en el marco del arma, en el lugar donde va puesto. suelto: fuera del arma (se
 *                                ve entero, también lo que queda dentro del pozo o de la empuñadura, sin la sombra de
 *                                contacto); lleno: con la bala de arriba asomando (el nuevo, no el que se tira).
 *   agarre  dónde lo agarra la mano (cm), cerca de la base, como en una recarga de verdad: así asoma por arriba
 *           del puño. La mano va ahí para sacarlo y para meterlo.
 *   eje     hacia dónde sale (unidad, en el marco del arma): la mano lo saca y lo mete a lo largo de ese eje.
 *   ejeLargo  el largo del cargador, si no es el eje (P90, Barrett): en el piso queda tendido sobre ese lado.
 *   encima  va sobre el arma y no adentro (P90): en la mano se dibuja después del arma.
 *   salida  cuánto lo aleja la mano antes de soltarlo (1: lo de siempre; la P90, menos, si no lo sube sobre la cabeza).
 * Las pistolas y la Uzi lo llevan dentro de la empuñadura: puesto se ve solo la base; suelto, el cuerpo entero
 * (chapa con los agujeros de control y la base), inclinado como la empuñadura.
 */
const cajaPuntos = pts => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, x1, y0, y1 }; };
const unidad = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };

// La bala de arriba del cargador nuevo, acostada y con la punta hacia la boca del arma
const BALAS_CM = { pistola: [1.9, 0.95, 0.9], bala: [3.9, 1.1, 2.4], escopeta: [6.6, 1.9, 0], grande: [9.9, 2.0, 5.4] };
function balaArriba(ctx, x, y, tipo) {
  if (Pincel.silueta) return;
  const [l, d, p] = BALAS_CM[tipo] || BALAS_CM.bala, x0 = x - (l + p) / 2, y0 = y - d;
  if (tipo === 'escopeta') { pintar(ctx, Rc(x0 + 1.3, y0, l - 1.3, d), '#b4251e', { brillo: 0.35 }); pintar(ctx, Rc(x0, y0 - 0.05, 1.4, d + 0.1), MAT.laton); return; }
  pintar(ctx, Rc(x0, y0, l, d), MAT.laton, { brillo: 0.5 });
  pintar(ctx, [[x0 + l, y0 + d * 0.1], [x0 + l + p * 0.6, y0 + d * 0.16], [x0 + l + p, y0 + d / 2], [x0 + l + p * 0.6, y0 + d * 0.84], [x0 + l, y0 + d * 0.9]], MAT.cobre, { brillo: 0.4 });
}

// Cuerpo entero de un cargador de pistola: de la base (abajo) hacia arriba, inclinado como la empuñadura
function cuerpoCargadorPistola(ctx, s) {
  const [bx, by] = s.abajo, ux = Math.sin(s.ang), uy = -Math.cos(s.ang), nx = -uy, ny = ux, w = s.ancho / 2;   // u: hacia arriba; n: hacia adelante
  const tx = bx + ux * s.largo, ty = by + uy * s.largo, p = (a, b) => [a, b];
  const cuerpo = [p(bx - nx * w, by - ny * w), p(bx + nx * w, by + ny * w), p(tx + nx * w - ux * 0.4, ty + ny * w - uy * 0.4), p(tx + nx * w * 0.6, ty + ny * w * 0.6), p(tx - nx * w, ty - ny * w)];
  pintar(ctx, cuerpo, s.cuerpo || '#2c2d31', { brillo: 0.4 });
  if (Pincel.silueta) return;
  trazo(ctx, 'rgba(255,255,255,0.14)', 0.14, [[bx - nx * (w - 0.25), by - ny * (w - 0.25)], [tx - nx * (w - 0.25), ty - ny * (w - 0.25)]]);   // lomo con luz
  for (let k = 1; k * 1.5 < s.largo - 1.5; k++) punto(ctx, bx + ux * k * 1.5 - nx * (w - 0.7), by + uy * k * 1.5 - ny * (w - 0.7), 0.22, '#0b0b0d');   // agujeros de control
  trazo(ctx, 'rgba(0,0,0,0.5)', 0.16, [[tx - nx * w, ty - ny * w], [tx + nx * w * 0.6, ty + ny * w * 0.6]]);   // labios
}

const CARGADORES = {
  /* ---------- Pistolas (dentro de la empuñadura) ---------- */
  glock: { agarre: [-2.2, 10.7], eje: unidad(-0.33, 1), bala: 'pistola', cuerpo: { abajo: [-2.0, 10.3], ang: 0.34, largo: 10.4, ancho: 3.2, cuerpo: '#26272b' },
    dibujar(ctx, suelto) { if (suelto) cuerpoCargadorPistola(ctx, this.cuerpo); pintar(ctx, GLOCK_FORMAS.base, GLOCK_TIERRA, { mate: true, brillo: 0.15 }); } },
  colt1911: { agarre: [-2.0, 9.6], eje: unidad(-0.32, 1), bala: 'pistola', cuerpo: { abajo: [-1.9, 9.6], ang: 0.31, largo: 9.6, ancho: 3.4, cuerpo: '#3a3d45' },
    dibujar(ctx, suelto) {
      if (!suelto) return;   // puesto no se ve: la base queda al ras de la empuñadura
      cuerpoCargadorPistola(ctx, this.cuerpo);
      pintar(ctx, suave([[-3.9, 9.4], [0.3, 9.4], [0.3, 10.1], [-3.9, 10.1]], 0.2, 2), '#2f3238', { brillo: 0.3 });
    } },
  beretta92: { agarre: [-0.3, 9.1], eje: unidad(-0.2, 1), bala: 'pistola', cuerpo: { abajo: [-0.25, 8.65], ang: 0.2, largo: 8.5, ancho: 3.2, cuerpo: '#2c2d31' },
    dibujar(ctx, suelto) { if (suelto) cuerpoCargadorPistola(ctx, this.cuerpo); pintar(ctx, B92_FORMAS.base, '#232427', { brillo: 0.3 }); } },
  ppk: { agarre: [-2.9, 8.3], eje: unidad(-0.27, 1), bala: 'pistola', cuerpo: { abajo: [-2.85, 7.8], ang: 0.27, largo: 7.6, ancho: 2.8, cuerpo: '#3a3d45' },
    dibujar(ctx, suelto) { if (suelto) cuerpoCargadorPistola(ctx, this.cuerpo); pintar(ctx, WP_FORMAS.base, '#1d1d1f', { brillo: 0.25 }); } },
  deagle: { agarre: [-2.9, 10.3], eje: unidad(-0.27, 1), bala: 'grande', cuerpo: { abajo: [-2.6, 9.95], ang: 0.27, largo: 9.8, ancho: 4.3, cuerpo: '#3a3d45' },
    dibujar(ctx, suelto) { if (suelto) cuerpoCargadorPistola(ctx, this.cuerpo); pintar(ctx, DE_FORMAS.base, '#c9c6bf', { brillo: 0.5 }); } },
  // Mauser C96 (el de diez, extraíble): delante del guardamonte; puesto, la parte de arriba queda en el cajón
  mauser: { agarre: [6.0, 10.8], eje: [0, 1], bala: 'pistola',
    dibujar(ctx, suelto) {
      if (suelto) { const b = cajaPuntos(MZ_FORMAS.cargador); pintar(ctx, Rc(b.x0 + 0.3, b.y0 - 2.2, b.x1 - b.x0 - 0.6, 2.6), '#4c4a47', { brillo: 0.3 }); }
      pintar(ctx, MZ_FORMAS.cargador, '#4c4a47', { brillo: 0.25 });
      trazo(ctx, 'rgba(0,0,0,0.45)', 0.12, [MZ(400, 214), MZ(400, 352)]);
    } },

  /* ---------- Metralletas ---------- */
  // Uzi: entra por la empuñadura; puesto asoma la parte de abajo, suelto se ve el largo entero
  uzi: { agarre: [0.7, 12.6], eje: [0, 1], bala: 'pistola',
    dibujar(ctx, suelto) {
      if (suelto) { const b = cajaPuntos(UZ_FORMAS.cargador); pintar(ctx, suave(Rc(b.x0 + 0.2, b.y0 - 10.6, b.x1 - b.x0 - 0.4, 11.2), 0.3, 2), MAT.pavonado, { brillo: 0.3 });
        for (let y = b.y0 - 9; y < b.y0; y += 1.6) punto(ctx, b.x0 + 0.8, y, 0.2, '#0b0b0d'); }
      pintar(ctx, UZ_FORMAS.cargador, MAT.pavonado, { brillo: 0.3 });
    } },
  ak47: { agarre: [21.0, 12.7], eje: unidad(0.39, 0.92), bala: 'bala',
    dibujar(ctx, suelto) {
      const carg = suave([[10.0, -0.4], [16.1, -0.4], [18.2, 4.6], [21.5, 8.7], [25.0, 11.6], [20.8, 16.9], [16.8, 12.1], [12.8, 6.0]], 0.6, 5);
      pintar(ctx, carg, '#2c2a38');
      if (!Pincel.silueta) for (const t of [0.2, 0.42, 0.64, 0.84]) {   // nervaduras: sombra de un lado, luz del otro
        const p0 = [10.5 + t * 5.0, 0.6], p1 = [12.8 + t * 5.4, 6.0 - t * 1.4], p2 = [16.9 + t * 4.6, 12.0 - t * 3.3];
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.38; ctx.beginPath(); ctx.moveTo(p0[0] + 0.14, p0[1]); ctx.quadraticCurveTo(p1[0] + 0.14, p1[1], p2[0] + 0.14, p2[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(190,190,220,0.22)'; ctx.lineWidth = 0.16; ctx.beginPath(); ctx.moveTo(p0[0] - 0.14, p0[1]); ctx.quadraticCurveTo(p1[0] - 0.14, p1[1], p2[0] - 0.14, p2[1]); ctx.stroke();
      }
      pintar(ctx, suave([[20.4, 16.4], [25.0, 10.9], [25.8, 11.6], [21.2, 17.4]], 0.3, 2), '#2c2b34');   // base
      if (!suelto) sombraContacto(ctx, carg, -0.4, 1.4, 0.7);
    } },
  m16: { agarre: M16(460, 278), eje: unidad(12, 96), bala: 'bala',
    dibujar(ctx) {
      pintar(ctx, M16_FORMAS.cargador, '#5d6268', { mate: true, brillo: 0.15 });
      if (!Pincel.silueta) for (const x of [428, 446, 464]) trazo(ctx, 'rgba(0,0,0,0.3)', 0.3, [M16(x, 196), M16(x + 12, 292)]);
    } },
  mp5: { agarre: [17.9, 13.4], eje: unidad(2.4, 11.6), bala: 'pistola',
    dibujar(ctx, suelto) {
      const carg = suave([[12.6, 0.2], [17.0, 0.2], [19.4, 11.8], [21.6, 17.0], [17.0, 17.9], [15.0, 11.8]], 0.6, 4);
      pintar(ctx, carg, '#3a3b39');
      if (!Pincel.silueta) { trazo(ctx, 'rgba(0,0,0,0.5)', 0.3, [[14.6, 1.0], [16.9, 11.8], [19.0, 16.8]]); trazo(ctx, 'rgba(255,255,255,0.12)', 0.12, [[14.3, 1.0], [16.6, 11.8], [18.7, 16.8]]); }
      pintar(ctx, suave([[16.6, 17.4], [21.8, 16.4], [22.2, 17.4], [16.9, 18.5]], 0.3, 2), '#2a2b2a');
      if (!suelto) sombraContacto(ctx, carg, 0.2, 1.6, 0.65);
    } },
  // Thompson: el tambor de 50
  thompson: { agarre: TH(230, 128), eje: [0, 1], bala: 'pistola',
    dibujar(ctx) { pintar(ctx, TH_FORMAS.tambor, '#1d1e21', { brillo: 0.4 }); trazo(ctx, 'rgba(255,255,255,0.12)', 0.3, [TH(230, 55), TH(230, 140)]); } },
  // Vector: usa cargadores de pistola; puesto asoma la parte de abajo del pozo
  vector: { agarre: [15.1, 21.4], eje: unidad(-1.0, 13.2), bala: 'pistola',
    dibujar(ctx, suelto) {
      pintar(ctx, suave(suelto ? [[14.3, 4.4], [18.6, 4.4], [18.2, 11.2], [17.2, 24.4], [12.6, 24.4]] : [[13.8, 11.2], [18.2, 11.2], [17.2, 24.4], [12.6, 24.4]], 0.5, 3), MAT.polimero);
      trazo(ctx, 'rgba(255,255,255,0.06)', 0.3, [[15.4, suelto ? 5.0 : 12.0], [14.8, 23.6]]);
      pintar(ctx, suave(Rc(12.3, 23.6, 5.2, 1.4), 0.4, 2), '#2a2b2f');
    } },
  // P90: el cargador va acostado arriba, transparente, con las balas cruzadas a la vista
  p90: { agarre: [-3.3, -4.4], eje: unidad(0.25, -1), ejeLargo: [1, 0], encima: true, salida: 0.45, bala: 'pistola',   // va sobre el arma: en la mano se dibuja después
    dibujar(ctx) {
      pintar(ctx, PN_FORMAS.cargador, '#8e877a', { brillo: 0.35 });
      if (!Pincel.silueta) {
        ctx.fillStyle = 'rgba(40,34,26,0.45)'; const [a, b] = PN(222, 936), [c, d] = PN(540, 948); ctx.fillRect(a, b, c - a, d - b);
        for (let x = 230; x < 536; x += 6.5) trazo(ctx, 'rgba(201,162,39,0.35)', 0.12, [PN(x, 937), PN(x, 947)]);
        trazo(ctx, 'rgba(255,255,255,0.3)', 0.2, [PN(220, 927), PN(542, 927)]);
      }
      pintar(ctx, PN_FORMAS.reten, '#2e3034', { brillo: 0.3 });
    } },

  /* ---------- Fusiles y escopetas ---------- */
  barrett: { agarre: BR(446, 795), ejeLargo: [1, 0], eje: unidad(BR(440, 800)[0] - BR(440, 752)[0], BR(440, 800)[1] - BR(440, 752)[1]), bala: 'grande',
    dibujar(ctx) {
      pintar(ctx, BR_FORMAS.cargador, '#202227', { brillo: 0.3 });
      if (!Pincel.silueta) for (const y of [775, 788]) trazo(ctx, 'rgba(255,255,255,0.08)', 0.4, [BR(412, y), BR(472, y + 9)]);
    } },
  svd: { agarre: [11.6, 7.0], eje: unidad(2.0, 10.0), bala: 'bala',
    dibujar(ctx) {
      pintar(ctx, suave([[6.8, -2.0], [12.8, -2.0], [13.4, 2.6], [14.8, 8.0], [14.6, 9.0], [9.2, 9.8], [8.6, 9.2], [7.6, 4.0], [6.8, 0.6]], 0.5, 3), MAT.pavonado);
      pintar(ctx, suave([[8.4, 0.2], [11.8, 0.2], [12.6, 4.0], [13.4, 7.8], [9.8, 8.4], [9.0, 4.2]], 0.5, 3), '#1b1c20', { mate: true });
      if (!Pincel.silueta) for (let k = 0; k < 5; k++) trazo(ctx, 'rgba(255,255,255,0.09)', 0.3, [[8.8 + k * 0.25, 1.0 + k * 1.5], [12.0 + k * 0.3, 1.0 + k * 1.5]]);
      pintar(ctx, suave([[8.8, 9.2], [14.8, 8.4], [15.0, 9.2], [9.2, 10.2]], 0.3, 2), MAT.acero);
    } },
  aa12: { agarre: AA(324, 197), eje: [0, 1], bala: 'escopeta',
    dibujar(ctx) {
      pintar(ctx, AA_FORMAS.cargador, '#6b6e72', { mate: true, brillo: 0.18 });
      if (!Pincel.silueta) for (const x of [312, 324, 336]) trazo(ctx, 'rgba(0,0,0,0.22)', 0.3, [AA(x, 112), AA(x, 222)]);
    } },
  saiga: { agarre: [12.1, 11.0], eje: unidad(1.8, 15.6), bala: 'escopeta',
    dibujar(ctx) {
      pintar(ctx, suave([[6.8, -2.0], [15.0, -2.0], [16.8, 13.6], [16.4, 14.6], [8.6, 15.4], [7.8, 14.4]], 0.6, 3), MAT.polimero, { mate: true });
      if (!Pincel.silueta) for (let k = 0; k < 6; k++) trazo(ctx, 'rgba(255,255,255,0.08)', 0.35, [[8.0 + k * 0.2, 1.5 + k * 2.1], [15.4 + k * 0.22, 0.8 + k * 2.1]]);
      pintar(ctx, suave([[7.8, 14.0], [16.6, 13.2], [16.8, 14.8], [8.2, 15.6]], 0.3, 2), '#2a2b2f');
    } },
};

// Dónde asoma la bala de arriba (el centro de la boca del cargador, en cm) y la del cargador suelto y lleno
for (const [id, M] of Object.entries(CARGADORES)) {
  M.id = id;
  M.boca = M.cuerpo ? [M.cuerpo.abajo[0] + Math.sin(M.cuerpo.ang) * M.cuerpo.largo, M.cuerpo.abajo[1] - Math.cos(M.cuerpo.ang) * M.cuerpo.largo] : null;
}
CARGADORES.ak47.boca = [13.05, -0.4]; CARGADORES.svd.boca = [9.8, -2.0]; CARGADORES.saiga.boca = [10.9, -2.0]; CARGADORES.mp5.boca = [14.8, 0.2];
CARGADORES.vector.boca = [16.4, 4.4]; CARGADORES.uzi.boca = null; CARGADORES.m16.boca = null; CARGADORES.barrett.boca = null; CARGADORES.aa12.boca = null;
CARGADORES.thompson.boca = null; CARGADORES.p90.boca = null; CARGADORES.mauser.boca = null;
// Cargador suelto (en la mano o en el piso), con la bala de arriba si está lleno
function dibujarCargadorSuelto(ctx, M, lleno) {
  M.dibujar(ctx, true);
  if (lleno && M.boca) balaArriba(ctx, M.boca[0], M.boca[1], M.bala);
}
const ES_CARGADOR = new Set(['cargador', 'cargador-curvo', 'cargador-plano', 'tambor-cargador']);
