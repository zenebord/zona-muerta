/* ===== Último bastión: cámara con perspectiva, como en StarCraft 2 =====
 * El juego pasa en un plano: las coordenadas de siempre (x, y de la grilla) y las distancias medidas como hasta ahora
 * (con la fila de 34 que vale 44 de piso). La perspectiva es sólo la cámara: la fila de adelante queda del tamaño de
 * siempre y la de atrás al 80 %, los costados convergen hacia el centro del campo y las filas se achican hacia atrás.
 *   - Lo que está en el piso (pasto, terreno, campos, calles, el patio del campamento) se dibuja plano en un lienzo
 *     aparte y se lleva a la pantalla en trapecio, fila por fila, cada una a su escala.
 *   - Lo que está parado (unidades, zombies, obstáculos, edificios, árboles, el campamento) se dibuja en su punto
 *     proyectado, escalado según la distancia; las barras de vida y los carteles no se achican (son de interfaz).
 *   - El toque se convierte de vuelta al plano (desproyectar), así que construir, vender y reparar no cambian.
 * Todo lo quieto se arma una vez por nivel (capaQuietaBastion) y por cuadro sólo se copia.
 */
const CAMARA_BASTION = { atras: 0.8, adelante: 1 };   // escala de la fila de atrás; alto de la fila de adelante (1: como antes)

function camaraBastion(cols, filas) {
  const B = BASTION, [W, H] = B.celda, yF = B.arriba, yN = B.arriba + filas * H, clave = ANCHO + ':' + cols + ':' + filas;
  if (camaraBastion.ultima && camaraBastion.ultima.clave === clave) return camaraBastion.ultima;
  const k = (1 / CAMARA_BASTION.atras - 1) / (yN - yF);   // 1/escala crece parejo hacia atrás (como la distancia a la cámara)
  const YN = yN, YH = YN - CAMARA_BASTION.adelante / k, XV = B.baseX + cols * W / 2;   // YH: el horizonte, muy arriba de la pantalla
  const cam = {
    clave, yF, yN, XV, YN, YH, k,
    escala: y => 1 / (1 + k * (yN - y)),
    // Del plano a la pantalla; h: altura sobre el piso, que se achica igual que todo a esa distancia
    proyectar(x, y, h = 0) { const s = 1 / (1 + k * (yN - y)); return { x: XV + (x - XV) * s, y: YH + (YN - YH) * s - h * s, s }; },
    // De la pantalla al plano (al piso)
    desproyectar(X, Y) { const s = Math.max(0.05, (Y - YH) / (YN - YH)); return { x: XV + (X - XV) / s, y: yN - (1 / s - 1) / k, s }; },
  };
  camaraBastion.ultima = cam;
  return cam;
}
Juego.prototype.camaraBastion = function () { return camaraBastion(this.cols, this.filas); };

// Dibuja algo parado en (x, y) del plano: dibujar(ctx) usa las coordenadas de siempre, así que se lleva al punto
// proyectado y se escala alrededor de los pies
function enCamara(ctx, cam, x, y, dibujar) {
  const p = cam.proyectar(x, y);
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s); ctx.translate(-x, -y); dibujar(ctx); ctx.restore();
  return p;
}

// Capa quieta del escenario con la cámara, a la resolución e: el piso plano en trapecio y, encima, lo que está parado
// (lo de la meseta, el escalón, lo de adelante del escalón y el campamento), de atrás hacia adelante, y la niebla.
// g: la partida (o una de mentira para la vista chica de los niveles): cols, filas, terrenoEn, nivelBastion
function capaQuietaBastion(g, N, e, cam) {
  // 1) El piso, plano. El lienzo cubre todo lo que alcanza a ver la cámara (atrás se ve más ancho)
  const izq = cam.desproyectar(0, -4), der = cam.desproyectar(ANCHO, -4), abajo = cam.desproyectar(0, ALTO + 4);
  const x0 = Math.floor(izq.x - 30), x1 = Math.ceil(der.x + 30), y0 = Math.floor(izq.y - 20), y1 = Math.ceil(abajo.y + 10);
  const ep = Math.max(0.2, Math.min(e, 1.6)), plano = document.createElement('canvas');
  plano.width = Math.ceil((x1 - x0) * ep); plano.height = Math.ceil((y1 - y0) * ep);
  const p = plano.getContext('2d'); p.setTransform(ep, 0, 0, ep, -x0 * ep, -y0 * ep);
  const liv = Lienzo.liviano; Lienzo.liviano = false;   // se pinta una vez por nivel: con todo el detalle
  const L = document.createElement('canvas'); L.width = Math.ceil(ANCHO * e); L.height = Math.ceil(ALTO * e);
  const c = L.getContext('2d');
  try {
    const borde = PaisajeBastion.borde(N, cam);
    PaisajeBastion.suelo(p, N, [x0, y0, x1, y1]);
    borde.piso(p);
    PaisajeBastion.terreno(p, g, 0);
    if (g.campamentoPiso) g.campamentoPiso(p);
    // 2) Del plano a la pantalla, fila por fila: cada fila de pantalla toma su tira del plano, a su escala
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    const pend = (cam.YN - cam.YH) * cam.k;   // cuánto baja la pantalla por unidad del plano, a escala 1
    for (let j = 0; j < L.height; j++) {
      const q = cam.desproyectar(cam.XV, (j + 0.5) / e), s = q.s, tira = 1 / (e * pend * s * s);   // tira: cuánto plano cabe en un píxel
      const sy = (q.y - y0 - tira / 2) * ep, sh = Math.max(0.5, tira * ep);
      if (sy + sh <= 0 || sy >= plano.height) continue;
      c.drawImage(plano, 0, sy, plano.width, sh, (cam.XV + (x0 - cam.XV) * s) * e, j, (x1 - x0) * s * e, 1);
    }
    // 3) Lo que está parado, de atrás hacia adelante
    c.setTransform(e, 0, 0, e, 0, 0);
    const porY = (a, b) => a.y - b.y;
    for (const o of borde.atras.sort(porY)) enCamara(c, cam, o.x, o.y, o.dibujar);
    if (borde.trasAtras) borde.trasAtras(c);
    borde.escalon(c);
    for (const o of [...borde.adelante, ...(g.campamentoProps ? g.campamentoProps() : [])].sort(porY)) enCamara(c, cam, o.x, o.y, o.dibujar);
    // 4) Niebla de la derecha, por donde vienen los zombies: sigue el borde derecho del campo, que se inclina hacia atrás
    const B = BASTION, yN = B.arriba + g.filas * B.celda[1], xD = B.baseX + g.cols * B.celda[0];
    for (let k = 0, n = 16; k < n; k++) {
      const ya = B.arriba - 40 + k * (yN - B.arriba + 80) / n, yb = ya + (yN - B.arriba + 80) / n, a = cam.proyectar(xD - 40, ya), b = cam.proyectar(xD - 40, yb);
      const ng = c.createLinearGradient(a.x, 0, a.x + (ANCHO - a.x) * 0.85, 0); ng.addColorStop(0, 'rgba(40,36,40,0)'); ng.addColorStop(1, 'rgba(40,36,40,0.72)');
      c.fillStyle = ng; c.fillRect(Math.min(a.x, b.x), a.y, ANCHO - Math.min(a.x, b.x) + 2, (k === n - 1 ? ALTO : b.y) - a.y + 0.5);
    }
  } finally { Lienzo.liviano = liv; }
  return L;
}

// Capa quieta guardada (por nivel, grilla, resolución e idioma) y, por cuadro, lo que se mueve del escenario
const capaCamaraBastion = { lienzo: null, clave: '' };
Juego.prototype.dibujarFondoBastion = function (ctx, cam = this.camaraBastion()) {
  const N = this.nivelBastion, e = Math.round(Math.hypot(ctx.getTransform().a, ctx.getTransform().b) * 100) / 100 || 1;
  const clave = [N.id, this.cols, this.filas, e, ANCHO, typeof Idioma !== 'undefined' && Idioma.actual ? Idioma.actual() : ''].join(':');
  if (capaCamaraBastion.clave !== clave) { capaCamaraBastion.lienzo = capaQuietaBastion(this, N, e, cam); capaCamaraBastion.clave = clave; }
  ctx.drawImage(capaCamaraBastion.lienzo, 0, 0, ANCHO, ALTO);
  PaisajeBastion.fondoVivo(ctx, N, this.ahora, cam);
  PaisajeBastion.terrenoAnimado(ctx, this, this.ahora, cam);
};
