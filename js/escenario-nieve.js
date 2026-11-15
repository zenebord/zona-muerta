/* ===== Mapa de la nieve: bosque de pinos nevados, con colinas (pelea infinita) =====
 * Pedido: «un mapa de nieve con pinos nevados con nieve en las hojas, con los mismos zombies que la ciudad en ruinas y
 * un zombie congelado que tira bloques de hielo (js/zombie-congelado.js); colinas donde estén las M2 Browning y las
 * especiales». El terreno es el de la ciudad (js/terreno.js: trozos de 1200 px; cada tanto una colina con la M2 arriba
 * y la caja especial), pero todo se dibuja nevado, de atrás hacia adelante:
 *   cielo    invierno nublado, el sol pálido detrás de las nubes y dos cordilleras nevadas (paralaje 0,05 y 0,1)
 *   bosque   tres filas de pinos en lomas de nieve, cada vez más cerca y menos lavadas por la neblina (0,22, 0,38, 0,6)
 *   suelo    el camino tapado de nieve, con huellas y las huellas de las ruedas; las colinas, nieve arriba y una ladera
 *            con rocas, la cornisa y carámbanos al frente
 *   objetos  pinos grandes detrás del camino y en las laderas, rocas nevadas, troncos, carteles y autos enterrados
 *   adelante la nevada en tres profundidades, las ráfagas que levantan nieve al ras del piso y el primer plano
 *            (montículos, arbolitos y postes con su capucha de nieve)
 * Los pinos, que son lo caro, se dibujan una vez por variante, tamaño y distancia en un lienzo aparte y se estampan. */
const NEBLINA_NIEVE = '#c8d5e0';
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// Un color lavado por la neblina (k: 0 nada, 1 todo neblina)
function lavado(hex, k) {
  if (k <= 0) return hex;
  const a = hexRgb(hex), b = hexRgb(NEBLINA_NIEVE);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
}

/* ---------- Pinos nevados ----------
 * De perfil, con la base del tronco en (0, 0) y la punta en (0, -alto). Pisos de ramas de abajo hacia arriba, cada uno
 * con la punta de las ramas caída y desparejas; arriba de cada piso, la nieve que se juntó en las ramas (la «nieve en
 * las hojas»): blanca del lado del sol, celeste a la sombra, con el borde de abajo ondulado y gotas que cuelgan.
 * v: la variante (forma); tono: 0 cerca, 1 lejos (lavado). */
function trazarPino(c, alto, v, tono) {
  const az = s => azar(v * 7 + 3, s);
  const ancho = alto * (0.4 + az(1) * 0.14), tronco = alto * (0.09 + az(2) * 0.04), pisos = 5 + Math.floor(az(3) * 3);
  const verdeLuz = lavado('#36634c', tono), verde = lavado('#264a3b', tono), verdeOsc = lavado('#15302a', tono), bajo = lavado('#0e211c', tono);
  const nLuz = lavado('#ffffff', tono * 0.5), nMed = lavado('#e2ecf4', tono * 0.5), nSom = lavado('#b3c6d8', tono * 0.5), nBorde = lavado('#8ea6bd', tono * 0.6);
  const detalle = alto > 70 && tono < 0.5;
  // Tronco y la nieve amontonada al pie
  c.fillStyle = lavado('#4a3426', tono); c.fillRect(-alto * 0.03, -tronco - 6, alto * 0.06, tronco + 6);
  c.fillStyle = lavado('#2c1f17', tono); c.fillRect(alto * 0.006, -tronco - 6, alto * 0.024, tronco + 6);
  c.fillStyle = nMed; c.beginPath(); c.ellipse(0, 0, alto * 0.12, alto * 0.025 + 1, 0, Math.PI, 0); c.fill();
  const util = alto - tronco;
  for (let k = 0; k < pisos; k++) {
    const f = k / pisos, ultimo = k === pisos - 1;
    const yb = -tronco - util * f * 0.8, h = util * (0.34 - f * 0.08), yt = ultimo ? -alto : yb - h;
    const w = ancho * 0.5 * (1 - f * 0.8) * (0.94 + az(40 + k) * 0.12), caida = (yb - yt) * 0.17;
    // Borde de abajo: las puntas de las ramas, caídas hacia los costados y desparejas
    const n = 4 + Math.floor(w / 9), borde = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n * 2 - 1;
      borde.push([u * w * (i % 2 ? 0.95 : 1.02), yb + Math.abs(u) * caida + (i % 2 ? -(yb - yt) * 0.07 : (yb - yt) * 0.03) + (az(10 + k * 13 + i) - 0.5) * (yb - yt) * 0.06]);
    }
    const g = c.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, verdeLuz); g.addColorStop(0.5, verde); g.addColorStop(1, verdeOsc);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, yt);
    c.quadraticCurveTo(-w * 0.42, yt + (yb - yt) * 0.55, borde[0][0], borde[0][1]);
    for (const [x, y] of borde) c.lineTo(x, y);
    c.quadraticCurveTo(w * 0.42, yt + (yb - yt) * 0.55, 0, yt);
    c.fill();
    // La sombra de abajo de las ramas y, de cerca, las agujas
    c.strokeStyle = bajo; c.lineWidth = Math.max(0.6, (yb - yt) * 0.06); c.lineJoin = 'round';
    c.beginPath(); borde.forEach(([x, y], i) => i ? c.lineTo(x, y - 0.6) : c.moveTo(x, y - 0.6)); c.stroke();
    if (detalle) {
      c.strokeStyle = lavado('#0f2620', tono); c.lineWidth = 0.7;
      for (let i = 0; i < n * 3; i++) {
        const u = az(60 + k * 31 + i) * 2 - 1, yy = yb - (yb - yt) * (0.15 + az(90 + k * 17 + i) * 0.3), x = u * w * ((yy - yt) / (yb - yt)) * 0.9;
        c.beginPath(); c.moveTo(x, yy); c.lineTo(x + (u < 0 ? -1.6 : 1.6), yy + 2.2); c.stroke();
      }
    }
    // La nieve sobre el piso: de la punta hasta un poco más de la mitad, con el borde de abajo ondulado
    const hasta = (yb - yt) * (ultimo ? 0.78 : 0.52 + az(30 + k) * 0.16), lim = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n * 2 - 1, yy = yt + hasta + Math.abs(u) * (yb - yt) * 0.1 + (i % 2 ? (yb - yt) * 0.07 : -(yb - yt) * 0.02);
      lim.push([u * w * ((yy - yt) / (yb - yt)) * 0.97, yy]);
    }
    const gn = c.createLinearGradient(-w, 0, w, 0);
    gn.addColorStop(0, nLuz); gn.addColorStop(0.55, nMed); gn.addColorStop(1, nSom);
    c.fillStyle = gn;
    c.beginPath(); c.moveTo(0, yt - 0.8);
    c.quadraticCurveTo(-w * 0.44, yt + (yb - yt) * 0.5, lim[0][0] - 0.6, lim[0][1]);
    for (const [x, y] of lim) c.lineTo(x, y);
    c.quadraticCurveTo(w * 0.44, yt + (yb - yt) * 0.5, 0, yt - 0.8);
    c.fill();
    c.strokeStyle = nBorde; c.lineWidth = Math.max(0.5, (yb - yt) * 0.03);   // el canto de la nieve, en sombra
    c.beginPath(); lim.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.fillStyle = nMed;   // gotas de nieve que cuelgan del borde
    for (let i = 1; i < n; i += 2) { const [x, y] = lim[i]; c.beginPath(); c.ellipse(x, y + 0.6, Math.max(0.8, w * 0.05), Math.max(1, (yb - yt) * 0.07), 0, 0, Math.PI * 2); c.fill(); }
    if (detalle) {   // montoncitos sueltos en las puntas de abajo
      c.fillStyle = nLuz;
      for (let i = 0; i <= n; i += 2) if (az(120 + k * 7 + i) < 0.55) { const [x, y] = borde[i]; c.beginPath(); c.ellipse(x * 0.92, y - (yb - yt) * 0.1, 1.6 + w * 0.03, 1.1, 0, 0, Math.PI * 2); c.fill(); }
    }
  }
}
const PINOS_NIEVE = new Map();
// El pino ya dibujado (lienzo aparte, a la resolución del juego); se agrupan los tamaños para no dibujar de más
function spritePino(alto, v, tono) {
  const E = Lienzo.escala, paso = alto < 60 ? 6 : alto < 140 ? 12 : 24, a = Math.max(paso, Math.round(alto / paso) * paso);
  const variantes = alto < 60 ? 8 : alto < 140 ? 6 : 5, vv = ((v % variantes) + variantes) % variantes, tn = Math.round(tono * 20) / 20;
  const clave = a + '|' + vv + '|' + tn + '|' + E;
  let s = PINOS_NIEVE.get(clave);
  if (!s) {
    const ancho = a * 0.66 + 8, cv = document.createElement('canvas');
    cv.width = Math.ceil(ancho * E); cv.height = Math.ceil((a + 10) * E);
    const c = cv.getContext('2d'); c.scale(E, E); c.translate(ancho / 2, a + 6);
    trazarPino(c, a, vv, tn);
    s = { cv, ancho, alto: a + 10, dy: a + 6 };
    if (PINOS_NIEVE.size > 240) PINOS_NIEVE.delete(PINOS_NIEVE.keys().next().value);
    PINOS_NIEVE.set(clave, s);
  }
  return s;
}
function pinoNevado(ctx, x, y, alto, v, tono) { const s = spritePino(alto, v, tono); ctx.drawImage(s.cv, x - s.ancho / 2, y - s.dy, s.ancho, s.alto); }

/* ---------- Lo que hay en cada trozo ---------- */
// Cerca del camino: pinos grandes detrás, rocas, troncos caídos, carteles y autos enterrados; en las colinas, pinos en
// las laderas (arriba quedan la M2 y la caja especial) y rocas
function objetosNieveDeTrozo(i) {
  const x0 = i * TAMANO_TROZO, lista = [];
  if (esMontana(i)) {
    for (const [lx, s] of [[150, 0], [250, 1], [330, 2], [880, 3], [960, 4], [1060, 5]]) if (azar(i, 300 + s) < 0.75) lista.push({ tipo: 'pino', x: x0 + lx + (azar(i, 310 + s) - 0.5) * 50, alto: 120 + azar(i, 320 + s) * 90, v: Math.floor(azar(i, 330 + s) * 40) });
    lista.push({ tipo: 'pino', x: x0 + MONTANA.cimaInicio + 20 + azar(i, 340) * 40, alto: 150 + azar(i, 341) * 60, v: Math.floor(azar(i, 342) * 40) });   // uno al borde de la cima
    if (azar(i, 350) < 0.7) lista.push({ tipo: 'roca', x: x0 + 400 + azar(i, 351) * 60, r: 14 + azar(i, 352) * 10 });
    return lista;
  }
  for (let k = 0; k < 6; k++) if (azar(i, 200 + k) < 0.66) lista.push({ tipo: 'pino', x: x0 + 40 + k * 200 + azar(i, 210 + k) * 120, alto: 140 + azar(i, 220 + k) * 120, v: Math.floor(azar(i, 230 + k) * 40) });
  if (azar(i, 240) < 0.6) lista.push({ tipo: 'roca', x: x0 + 80 + azar(i, 241) * 1040, r: 10 + azar(i, 242) * 14 });
  if (azar(i, 245) < 0.4) lista.push({ tipo: 'tronco', x: x0 + 100 + azar(i, 246) * 900, largo: 50 + azar(i, 247) * 40 });
  if (i !== 0 && azar(i, 250) < 0.32) lista.push({ tipo: 'auto', x: x0 + 260 + azar(i, 251) * 680, color: ['#7a2a26', '#2f4a6e', '#5d6a3a', '#7a6a4a'][Math.floor(azar(i, 252) * 4)] });
  if (azar(i, 255) < 0.3) lista.push({ tipo: 'cartel', x: x0 + 150 + azar(i, 256) * 900, texto: ['REFUGIO 2 KM', 'PELIGRO', 'PASO CERRADO', 'RUTA 40', 'NO PASAR'][Math.floor(azar(i, 257) * 5)] });
  lista.sort((a, b) => (a.tipo === 'pino' ? 0 : 1) - (b.tipo === 'pino' ? 0 : 1));   // los pinos atrás de todo
  return lista;
}

Object.assign(Escenario, {
  /* ---------- Cielo y montañas ---------- */
  cieloNieve(ctx, camaraX, tiempo) {
    const g = ctx.createLinearGradient(0, 0, 0, SUELO_BASE);
    g.addColorStop(0, '#56697e'); g.addColorStop(0.42, '#8a9fb3'); g.addColorStop(0.78, '#c0cddb'); g.addColorStop(1, '#dde6ee');
    ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, ALTO);
    // El sol pálido, velado por las nubes
    const solX = ((640 - camaraX * 0.01) % 2000 + 2000) % 2000 - 300;
    const halo = ctx.createRadialGradient(solX, 150, 10, solX, 150, 190);
    halo.addColorStop(0, 'rgba(255, 252, 240, 0.55)'); halo.addColorStop(0.25, 'rgba(250, 248, 238, 0.22)'); halo.addColorStop(1, 'rgba(240, 244, 248, 0)');
    ctx.fillStyle = halo; ctx.fillRect(solX - 190, 0, 380, 340);
    ctx.fillStyle = 'rgba(255, 253, 245, 0.7)'; ctx.beginPath(); ctx.arc(solX, 150, 26, 0, Math.PI * 2); ctx.fill();
    // Bancos de nubes bajas, muy lentos
    for (let k = 0; k < 7; k++) {
      const x = ((k * 230 - camaraX * 0.02 - tiempo * 3) % 1700 + 1700) % 1700 - 350, y = 70 + k * 30 + (k % 2) * 12;
      ctx.fillStyle = `rgba(232, 238, 244, ${0.16 + (k % 3) * 0.05})`;
      ctx.beginPath(); ctx.ellipse(x, y, 180 + k * 18, 14 + (k % 3) * 5, 0, 0, Math.PI * 2); ctx.ellipse(x + 90, y - 8, 110, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
    this.cordilleraNevada(ctx, camaraX, 0.05, 330, 150, 170, 3);
    this.cordilleraNevada(ctx, camaraX, 0.1, 352, 105, 120, 11);
    const neblina = ctx.createLinearGradient(0, 250, 0, 372);
    neblina.addColorStop(0, 'rgba(214, 224, 234, 0)'); neblina.addColorStop(1, 'rgba(214, 224, 234, 0.75)');
    ctx.fillStyle = neblina; ctx.fillRect(0, 250, ANCHO, 122);
  },
  // Picos de montaña nevados: la cara iluminada casi blanca, la otra celeste con vetas de roca, y la base en la neblina
  cordilleraNevada(ctx, camaraX, factor, baseY, amplitud, paso, sal) {
    const desplaza = camaraX * factor, inicio = Math.floor(desplaza / paso) - 1, lejos = factor < 0.08;
    const luz = lejos ? '#e6edf3' : '#edf2f6', sombra = lejos ? '#a9bacb' : '#9cb0c4', roca = lejos ? 'rgba(96, 112, 130, 0.35)' : 'rgba(78, 92, 110, 0.45)';
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza, h = (0.4 + azar(k, sal) * 0.6) * amplitud, cima = x + paso * (0.35 + azar(k, sal + 1) * 0.3), ancho = paso * 0.9;
      const izq = cima - ancho * (0.7 + azar(k, sal + 2) * 0.3), der = cima + ancho * (0.7 + azar(k, sal + 3) * 0.3), top = baseY - h;
      ctx.fillStyle = luz;
      ctx.beginPath(); ctx.moveTo(izq, baseY); ctx.lineTo(cima - h * 0.08, top + h * 0.06); ctx.lineTo(cima, top); ctx.lineTo(cima, baseY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = sombra;
      ctx.beginPath(); ctx.moveTo(cima, top); ctx.lineTo(cima + h * 0.12, top + h * 0.18); ctx.lineTo(der, baseY); ctx.lineTo(cima, baseY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = roca; ctx.lineWidth = 1.4;   // vetas de roca que asoman en la cara de la sombra
      ctx.beginPath();
      for (let j = 0; j < 3; j++) { const t0 = 0.25 + j * 0.2, xa = cima + (der - cima) * t0 * 0.5, ya = top + h * t0; ctx.moveTo(xa, ya); ctx.lineTo(xa + h * 0.1, ya + h * 0.22); ctx.lineTo(xa + h * 0.06, ya + h * 0.34); }
      ctx.stroke();
    }
  },

  /* ---------- Bosques: lomas de nieve con filas de pinos, cada vez más cerca ----------
   * Cada fila se dibuja una vez en una tira de PERIODO_BOSQUE px que se repite sin costura (las ondas de la loma tienen
   * períodos que entran justo y los pinos del borde se dibujan de los dos lados), y en cada cuadro se estampa corrida
   * según su paralaje: dos o tres estampas en lugar de decenas de pinos. */
  bosqueNieve(ctx, camaraX, factor, base, onda, paso, altoMin, altoMax, tono, sal) {
    const t = tiraBosque(base, onda, paso, altoMin, altoMax, tono, sal), P = PERIODO_BOSQUE, E = t.cv.width / P;
    for (let x = -(((camaraX * factor) % P) + P) % P; x < ANCHO; x += P) {   // sólo el pedazo de la tira que se ve
      const a = Math.max(0, -x), b = Math.min(P, ANCHO + 2 - x);
      if (b > a) ctx.drawImage(t.cv, a * E, 0, (b - a) * E, t.cv.height, x + a, t.arriba, b - a, t.alto);
    }
  },

  // Todo el fondo de la nieve, hasta el camino (las colinas tapan lo de atrás)
  dibujarNieve(ctx, camaraX, tiempo) {
    this.cieloNieve(ctx, camaraX, tiempo);
    this.bosqueNieve(ctx, camaraX, 0.22, 352, 10, 15, 16, 34, 0.74, 21);
    ctx.fillStyle = 'rgba(214, 224, 234, 0.32)'; ctx.fillRect(0, 300, ANCHO, 90);
    this.bosqueNieve(ctx, camaraX, 0.38, 370, 9, 26, 30, 62, 0.52, 37);
    ctx.fillStyle = 'rgba(214, 224, 234, 0.22)'; ctx.fillRect(0, 290, ANCHO, 100);
    this.bosqueNieve(ctx, camaraX, 0.6, 384, 5, 52, 64, 132, 0.3, 53);
    this.sueloNieve(ctx, camaraX, tiempo);
    this.objetosNieve(ctx, camaraX, tiempo);
  },

  /* ---------- Suelo: el camino y las colinas ----------
   * Con formas continuas (no columnas, que dejaban rayas): la superficie que se pisa, entre el borde de atrás (y - 50)
   * y el de adelante (y + 100), clara atrás y en sombra adelante siguiendo el terreno; el lomo de nieve del borde de
   * atrás; en las colinas, la ladera de adelante con la cornisa, carámbanos, lomas de nieve y rocas; en el llano, las
   * huellas de las ruedas, montoncitos y pisadas. */
  sueloNieve(ctx, camaraX, tiempo) {
    const paso = 8, desde = Math.floor(camaraX / paso) * paso - paso * 2, hasta = camaraX + ANCHO + paso * 3, pts = [];
    for (let wx = desde; wx <= hasta; wx += paso) pts.push([wx - camaraX, alturaSuelo(wx), wx]);
    const banda = (lista, arriba, abajo) => {   // la franja entre y + arriba(wx) e y + abajo(wx), a lo largo del terreno
      ctx.beginPath();
      lista.forEach(([sx, y, wx], i) => i ? ctx.lineTo(sx, y + arriba(wx)) : ctx.moveTo(sx, y + arriba(wx)));
      for (let i = lista.length - 1; i >= 0; i--) { const [sx, y, wx] = lista[i]; ctx.lineTo(sx, Math.min(ALTO + 4, y + abajo(wx))); }
      ctx.closePath();
    };
    const c = v => () => v;
    // La superficie que se pisa
    ctx.fillStyle = '#e2eaf1'; banda(pts, c(-FONDO_CALLE), c(FRENTE_CALLE + 4)); ctx.fill();
    ctx.fillStyle = '#eef3f7'; banda(pts, c(-FONDO_CALLE), c(-FONDO_CALLE + 44)); ctx.fill();
    ctx.fillStyle = 'rgba(146, 170, 194, 0.24)'; banda(pts, c(FRENTE_CALLE - 56), c(FRENTE_CALLE + 4)); ctx.fill();
    ctx.fillStyle = 'rgba(146, 170, 194, 0.2)'; banda(pts, c(FRENTE_CALLE - 24), c(FRENTE_CALLE + 4)); ctx.fill();
    // Ventisqueros: manchones largos un poco más claros o más azules, para que la nieve no sea pareja
    for (let k = Math.floor(desde / 140); k <= hasta / 140; k++) {
      const wx = k * 140 + azar(k, 191) * 80, y = alturaSuelo(wx), dy = 8 + azar(k, 192) * 120;
      if (y + dy > y + FRENTE_CALLE - 6) continue;
      ctx.fillStyle = azar(k, 193) < 0.5 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(170, 192, 214, 0.18)';
      ctx.beginPath(); ctx.ellipse(wx - camaraX, y + dy, 50 + azar(k, 194) * 60, 4 + azar(k, 195) * 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    // El lomo de nieve del borde de atrás, con su sombra
    const lomo = wx => -FONDO_CALLE - 7 - Math.sin(wx * 0.05) * 2 - Math.sin(wx * 0.017) * 3;
    ctx.fillStyle = '#f8fbfd'; banda(pts, lomo, c(-FONDO_CALLE + 1)); ctx.fill();
    ctx.fillStyle = 'rgba(160, 182, 204, 0.75)'; banda(pts, c(-FONDO_CALLE - 0.5), c(-FONDO_CALLE + 2)); ctx.fill();
    // Colinas: la ladera de adelante, de a tramos seguidos
    let tramo = [];
    const cerrarTramo = () => {
      if (tramo.length > 1) {
        const lad = ctx.createLinearGradient(0, SUELO_BASE - ALTURA_MONTANA + FRENTE_CALLE, 0, ALTO);
        lad.addColorStop(0, '#dbe5ee'); lad.addColorStop(0.5, '#bccad8'); lad.addColorStop(1, '#94a6b9');
        ctx.fillStyle = lad; banda(tramo, c(FRENTE_CALLE), () => ALTO); ctx.fill();
        // Ventisqueros en la ladera: lomos redondeados más claros, con la sombra azulada debajo
        const a0 = tramo[0][2], a1 = tramo[tramo.length - 1][2];
        for (let k = Math.floor(a0 / 120); k <= a1 / 120; k++) {
          const wx = k * 120 + azar(k, 181) * 60, y = alturaSuelo(wx); if (y > SUELO_BASE - 12) continue;
          const sx = wx - camaraX, top = y + FRENTE_CALLE + 14, cy = top + azar(k, 182) * Math.max(0, ALTO - top - 24), rx = 22 + azar(k, 183) * 26, ry = 2.6 + azar(k, 184) * 2.4;
          ctx.fillStyle = 'rgba(96, 120, 146, 0.14)'; ctx.beginPath(); ctx.ellipse(sx + 2, cy + ry, rx, ry, 0, 0, Math.PI); ctx.fill();
          ctx.fillStyle = 'rgba(246, 249, 252, 0.4)'; ctx.beginPath(); ctx.ellipse(sx, cy, rx, ry, 0, Math.PI, 0); ctx.fill();
        }
        // La cornisa del borde, su sombra y los carámbanos
        ctx.fillStyle = '#ffffff'; banda(tramo, c(FRENTE_CALLE - 1.5), c(FRENTE_CALLE + 3)); ctx.fill();
        ctx.fillStyle = 'rgba(80, 104, 130, 0.42)'; banda(tramo, c(FRENTE_CALLE + 3), c(FRENTE_CALLE + 4.8)); ctx.fill();
        ctx.fillStyle = 'rgba(214, 238, 255, 0.9)';
        for (const [sx, y, wx] of tramo) {
          if (azar(Math.floor(wx / 8), 195) > 0.5 || y > SUELO_BASE - 8) continue;
          const l = 4 + azar(Math.floor(wx / 8), 194) * 9, yy = y + FRENTE_CALLE + 3;
          ctx.beginPath(); ctx.moveTo(sx + 1, yy); ctx.lineTo(sx + 5, yy); ctx.lineTo(sx + 3, yy + l); ctx.closePath(); ctx.fill();
        }
      }
      tramo = [];
    };
    for (const p of pts) { if (p[1] < SUELO_BASE - 0.5) tramo.push(p); else { if (tramo.length) { tramo.push(p); cerrarTramo(); } } }
    cerrarTramo();
    // Rocas que asoman en las laderas
    const i0 = indiceTrozo(camaraX) - 1, i1 = indiceTrozo(camaraX + ANCHO) + 1;
    for (let i = i0; i <= i1; i++) {
      if (!esMontana(i)) continue;
      for (let k = 0; k < 10; k++) {
        if (azar(i, 400 + k) > 0.68) continue;
        const wx = i * TAMANO_TROZO + MONTANA.subidaInicio + 30 + k * 86 + azar(i, 410 + k) * 40, y = alturaSuelo(wx);
        if (y > SUELO_BASE - 20) continue;
        const frente = y + FRENTE_CALLE, ry = frente + 22 + azar(i, 420 + k) * Math.max(0, ALTO - frente - 44), r = 8 + azar(i, 430 + k) * 11;
        if (ry > ALTO - 6) continue;
        rocaNevada(ctx, wx - camaraX, ry, r, i * 10 + k);
      }
      for (let k = 0; k < 5; k++) {   // arbolitos nevados en la cara de la colina
        if (azar(i, 440 + k) > 0.6) continue;
        const wx = i * TAMANO_TROZO + MONTANA.subidaInicio + 80 + k * 170 + azar(i, 450 + k) * 60, y = alturaSuelo(wx);
        if (y > SUELO_BASE - 30) continue;
        const frente = y + FRENTE_CALLE, py = frente + 30 + azar(i, 460 + k) * Math.max(0, ALTO - frente - 50);
        if (py < ALTO - 4) pinoNevado(ctx, wx - camaraX, py, 26 + azar(i, 470 + k) * 22, i * 5 + k, 0.12);
      }
    }
    // En el llano: las huellas de las ruedas, montoncitos y pisadas
    if (!Mundo.carriles) {
      let a = null;
      const surcos = (x0, x1) => { for (const yy of [SUELO_BASE + 14, SUELO_BASE + 52]) {
        ctx.fillStyle = 'rgba(146, 170, 194, 0.3)'; ctx.fillRect(x0, yy, x1 - x0, 7);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.fillRect(x0, yy - 1.2, x1 - x0, 1.4);
        ctx.fillStyle = 'rgba(120, 146, 172, 0.18)'; ctx.fillRect(x0, yy + 5.5, x1 - x0, 1.5);
      } };
      for (const [sx, y] of pts) { if (y >= SUELO_BASE - 0.5) { if (a === null) a = sx; } else if (a !== null) { surcos(a, sx); a = null; } }
      if (a !== null) surcos(a, pts[pts.length - 1][0]);
    }
    for (let k = Math.floor(desde / 16); k <= hasta / 16; k++) {
      const wx = k * 16, y = alturaSuelo(wx);
      if (y < SUELO_BASE - 0.5 || azar(k, 199) > 0.2) continue;
      const sx = wx - camaraX, py = y - FONDO_CALLE + 12 + azar(k, 198) * 120;
      if (azar(k, 189) < 0.3) {   // montoncito de nieve
        ctx.fillStyle = '#f7fafc'; ctx.beginPath(); ctx.ellipse(sx, py, 6, 2.6, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(146, 170, 194, 0.35)'; ctx.fillRect(sx - 6, py - 0.2, 12, 1);
      } else {                    // pisada
        ctx.fillStyle = 'rgba(140, 162, 186, 0.42)'; ctx.beginPath(); ctx.ellipse(sx + 4, py, 3, 1.5, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; ctx.fillRect(sx + 1.6, py - 1.7, 4.6, 0.8);
      }
    }
    // Destellos del sol en la nieve de las cimas
    for (let k = Math.floor(desde / 24); k <= hasta / 24; k++) {
      const wx = k * 24 + azar(k, 187) * 20, y = alturaSuelo(wx);
      if (y > SUELO_BASE - 20 || azar(k, 186) > 0.4) continue;
      const brillo = 0.5 + 0.5 * Math.sin(tiempo * 2.4 + k);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + brillo * 0.5})`; ctx.fillRect(wx - camaraX, y - FONDO_CALLE + 10 + azar(k, 185) * 80, 1.4, 1.4);
    }
  },

  /* ---------- Objetos cerca del camino ---------- */
  objetosNieve(ctx, camaraX, tiempo) {
    const desde = indiceTrozo(camaraX) - 1, hasta = indiceTrozo(camaraX + ANCHO) + 1;
    for (let i = desde; i <= hasta; i++) for (const o of objetosNieveDeTrozo(i)) {
      const sx = o.x - camaraX;
      if (sx < -200 || sx > ANCHO + 200) continue;
      const base = alturaSuelo(o.x) - FONDO_CALLE + 2;   // apoyado en el borde de atrás del camino (o de la cima)
      if (o.tipo === 'pino') pinoNevado(ctx, sx, base + 4, o.alto, o.v, 0.08);
      else if (o.tipo === 'roca') rocaNevada(ctx, sx, base + 6, o.r, Math.round(o.x));
      else if (o.tipo === 'tronco') troncoNevado(ctx, sx, base + 8, o.largo);
      else if (o.tipo === 'auto') autoEnterrado(ctx, sx, base + 10, o.color);
      else if (o.tipo === 'cartel') cartelNevado(ctx, sx, base + 4, o.texto);
    }
  },

  /* ---------- Adelante: nevada, ráfagas y primer plano ---------- */
  dibujarNieveFrente(ctx, camaraX, ambiente, tiempo) {
    // Primer plano: montículos, arbolitos y postes con capucha de nieve, más rápidos que el camino
    const factor = 1.35, desplaza = camaraX * factor, base = ALTO - 2;
    const inicio = Math.floor(desplaza / SEGMENTO_FRENTE) - 1;
    let anterior = null;
    for (let k = inicio; k < inicio + ANCHO / SEGMENTO_FRENTE + 3; k++) {
      for (const p of frenteDeSegmento(k)) {
        const sx = p.x - desplaza;
        if (p.tipo === 'poste') {
          ctx.fillStyle = '#3a3036'; ctx.fillRect(sx - 3, base - p.alto, 6, p.alto);
          ctx.fillStyle = '#f2f6f9'; ctx.beginPath(); ctx.ellipse(sx, base - p.alto, 5.2, 3, 0, Math.PI, 0); ctx.fill();   // capucha de nieve
          if (anterior) { ctx.strokeStyle = 'rgba(40, 34, 40, 0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(anterior.x, anterior.y); ctx.quadraticCurveTo((anterior.x + sx) / 2, anterior.y + 14, sx, base - p.alto + 8); ctx.stroke(); }
          anterior = { x: sx, y: base - p.alto + 8 };
        } else if (p.tipo === 'arbusto') {
          pinoNevado(ctx, sx, base + 6, p.r * 3.2, Math.round(p.x), 0);
        } else if (p.tipo === 'piedra') {
          ctx.fillStyle = '#d4dfe8'; ctx.beginPath(); ctx.ellipse(sx, base, p.r * 2.4, p.r * 1.1, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#f6f9fb'; ctx.beginPath(); ctx.ellipse(sx - p.r * 0.4, base - p.r * 0.2, p.r * 1.8, p.r * 0.8, 0, Math.PI, 0); ctx.fill();
        }
      }
    }
    // Ráfagas: la nieve que el viento levanta al ras del piso
    for (const r of ambiente.rafagas) {
      const a = Math.sin(Math.PI * Math.min(1, r.t / r.dura)) * 0.32;
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = `rgba(245, 249, 252, ${a * (0.6 + (j % 2) * 0.4)})`;
        ctx.beginPath(); ctx.ellipse(r.x + j * 46, r.y + Math.sin(r.t * 3 + j) * 4 - j * 3, 60 + j * 8, 3 + (j % 3), 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // La nevada: copos en tres profundidades (en pantalla), un solo trazado por profundidad
    const COLOR_COPO = ['rgba(245, 249, 252, 0.6)', 'rgba(250, 252, 255, 0.8)', 'rgba(255, 255, 255, 0.92)'];
    for (let capa = 0; capa < 3; capa++) {
      ctx.beginPath();
      for (const c of ambiente.copos) if (c.capa === capa) { ctx.moveTo(c.x + c.r, c.y); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); }
      ctx.fillStyle = COLOR_COPO[capa]; ctx.fill();
    }
  },

  // Vista chica para la tarjeta del mapa (el mismo dibujo, achicado, sobre una colina)
  vistaNieve(ancho, alto) {
    const cv = document.createElement('canvas'); cv.width = ancho; cv.height = alto;
    const ctx = cv.getContext('2d'), k = ancho / ANCHO, escalaAntes = Lienzo.escala;   // todo el ancho; del alto, la franja de las copas a la nieve
    let i = 2; while (!esMontana(i) && i < 60) i++;
    const cam = i * TAMANO_TROZO + 300 - ANCHO * 0.35;
    Lienzo.escala = k;   // los pinos se dibujan a la resolución de la tarjeta
    ctx.setTransform(k, 0, 0, k, 0, -Math.max(0, 470 - alto / k) * k);
    this.cieloNieve(ctx, cam, 0);
    this.bosqueNieve(ctx, cam, 0.22, 352, 10, 15, 16, 34, 0.74, 21);
    this.bosqueNieve(ctx, cam, 0.38, 370, 9, 26, 30, 62, 0.52, 37);
    this.bosqueNieve(ctx, cam, 0.6, 384, 5, 52, 64, 132, 0.3, 53);
    this.sueloNieve(ctx, cam, 0); this.objetosNieve(ctx, cam, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let n = 0; n < 140; n++) { const r = 0.8 + azar(n, 77) * 2; ctx.beginPath(); ctx.arc(azar(n, 78) * ANCHO, 60 + azar(n, 79) * ALTO, r, 0, Math.PI * 2); ctx.fill(); }
    Lienzo.escala = escalaAntes;
    return cv;
  },
});

const PERIODO_BOSQUE = 2048, TIRAS_BOSQUE = new Map();
function tiraBosque(base, onda, paso, altoMin, altoMax, tono, sal) {
  const E = Lienzo.escala, clave = [base, paso, tono, sal, E].join('|');
  let t = TIRAS_BOSQUE.get(clave);
  if (t) return t;
  const P = PERIODO_BOSQUE, arriba = base - onda - altoMax - 14, abajo = SUELO_BASE - FONDO_CALLE + 16, n = Math.round(P / paso), d = P / n;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(P * E); cv.height = Math.ceil((abajo - arriba) * E);
  const c = cv.getContext('2d'); c.scale(E, E); c.translate(0, -arriba);
  const loma = x => base + Math.sin(x * Math.PI * 2 / 1024 + sal) * onda * 0.6 + Math.sin(x * Math.PI * 2 / (P / 6) + sal * 2) * onda * 0.4;
  const vecinos = Math.ceil(altoMax * 0.4 / d) + 1;   // los pinos del borde, también del otro lado
  for (let k = -vecinos; k < n + vecinos; k++) {
    const kk = ((k % n) + n) % n;
    if (azar(kk, sal + 5) < 0.16) continue;   // claros
    const x = k * d + (azar(kk, sal + 6) - 0.5) * d * 0.8, alto = altoMin + azar(kk, sal + 7) * (altoMax - altoMin);
    pinoNevado(c, x, loma(x) + 4, alto, Math.floor(azar(kk, sal + 8) * 40), tono);
  }
  const g = c.createLinearGradient(0, base - onda, 0, base + 40);
  g.addColorStop(0, lavado('#f2f6f9', tono * 0.4)); g.addColorStop(1, lavado('#cbd8e3', tono * 0.4));
  c.fillStyle = g; c.beginPath(); c.moveTo(0, abajo);
  for (let x = 0; x <= P; x += 16) c.lineTo(x, loma(x));
  c.lineTo(P, abajo); c.closePath(); c.fill();
  t = { cv, arriba, alto: abajo - arriba };
  if (TIRAS_BOSQUE.size > 8) TIRAS_BOSQUE.delete(TIRAS_BOSQUE.keys().next().value);
  TIRAS_BOSQUE.set(clave, t);
  return t;
}

/* Roca con nieve encima: gris azulada, con la capucha blanca y la sombra en la base */
function rocaNevada(ctx, x, y, r, sal) {
  const a = (s) => azar(sal, s);
  ctx.fillStyle = 'rgba(70, 92, 116, 0.25)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 1, r * 1.3, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6c7886'; ctx.beginPath();
  ctx.moveTo(x - r * 1.2, y); ctx.lineTo(x - r * (0.9 + a(1) * 0.2), y - r * 0.7); ctx.lineTo(x - r * 0.2, y - r * (1 + a(2) * 0.2)); ctx.lineTo(x + r * 0.6, y - r * 0.8); ctx.lineTo(x + r * 1.15, y - r * 0.2); ctx.lineTo(x + r * 1.1, y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#525d6a'; ctx.beginPath(); ctx.moveTo(x + r * 0.15, y - r * 0.9); ctx.lineTo(x + r * 0.6, y - r * 0.8); ctx.lineTo(x + r * 1.15, y - r * 0.2); ctx.lineTo(x + r * 1.1, y); ctx.lineTo(x + r * 0.2, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f8fb'; ctx.beginPath();   // la nieve de arriba
  ctx.moveTo(x - r * 1.0, y - r * 0.55); ctx.lineTo(x - r * 0.85, y - r * 0.75); ctx.lineTo(x - r * 0.2, y - r * 1.08); ctx.lineTo(x + r * 0.62, y - r * 0.9); ctx.lineTo(x + r * 1.05, y - r * 0.32);
  ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.5, x + r * 0.1, y - r * 0.6); ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.42, x - r * 1.0, y - r * 0.55); ctx.fill();
  ctx.fillStyle = 'rgba(160, 182, 204, 0.8)'; ctx.fillRect(x - r * 0.1, y - r * 0.62, r * 0.9, 1);
}
/* Tronco caído, tapado de nieve, con el corte de los anillos a la vista */
function troncoNevado(ctx, x, y, largo) {
  ctx.fillStyle = 'rgba(70, 92, 116, 0.22)'; ctx.beginPath(); ctx.ellipse(x, y + 1, largo * 0.55, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a4030'; ctx.fillRect(x - largo / 2, y - 12, largo, 11);
  ctx.fillStyle = '#3e2c21'; ctx.fillRect(x - largo / 2, y - 4, largo, 3);
  ctx.fillStyle = '#b08a64'; ctx.beginPath(); ctx.ellipse(x + largo / 2, y - 6.5, 3.2, 5.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7a5a3e'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x + largo / 2, y - 6.5, 1.8, 3.2, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f4f8fb'; ctx.beginPath(); ctx.moveTo(x - largo / 2 - 1, y - 10);
  for (let k = 0; k <= 6; k++) ctx.lineTo(x - largo / 2 + largo * k / 6, y - 13.5 - (k % 2) * 1.6);
  ctx.lineTo(x + largo / 2 + 1, y - 9); ctx.quadraticCurveTo(x, y - 7.5, x - largo / 2 - 1, y - 10); ctx.fill();
}
/* Auto enterrado en la nieve: sólo asoman el techo, los vidrios y un poco de la puerta */
function autoEnterrado(ctx, x, y, color) {
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x - 48, y - 8); ctx.lineTo(x - 40, y - 24); ctx.lineTo(x - 24, y - 38); ctx.lineTo(x + 20, y - 38); ctx.lineTo(x + 36, y - 22); ctx.lineTo(x + 50, y - 16); ctx.lineTo(x + 52, y - 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#26323e'; ctx.beginPath(); ctx.moveTo(x - 20, y - 34); ctx.lineTo(x - 2, y - 34); ctx.lineTo(x - 2, y - 24); ctx.lineTo(x - 30, y - 24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 2, y - 34); ctx.lineTo(x + 18, y - 34); ctx.lineTo(x + 28, y - 24); ctx.lineTo(x + 2, y - 24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(200, 225, 245, 0.35)'; ctx.fillRect(x - 16, y - 33, 6, 8);
  ctx.fillStyle = '#f4f8fb';   // nieve en el techo y la que lo tapa hasta la mitad
  ctx.beginPath(); ctx.moveTo(x - 26, y - 37); ctx.quadraticCurveTo(x - 2, y - 46, x + 22, y - 37); ctx.lineTo(x + 18, y - 36); ctx.lineTo(x - 22, y - 36); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 60, y + 2); ctx.quadraticCurveTo(x - 50, y - 20, x - 30, y - 18); ctx.quadraticCurveTo(x, y - 10, x + 30, y - 16); ctx.quadraticCurveTo(x + 56, y - 20, x + 64, y + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(160, 182, 204, 0.7)'; ctx.fillRect(x - 30, y - 17, 60, 1.4);
}
/* Cartel de ruta de madera con nieve arriba */
function cartelNevado(ctx, x, y, texto) {
  ctx.fillStyle = '#4a3426'; ctx.fillRect(x - 2, y - 46, 4, 46);
  ctx.fillStyle = '#6a4a32'; ctx.fillRect(x - 30, y - 56, 60, 18);
  ctx.strokeStyle = '#3a281c'; ctx.lineWidth = 1; ctx.strokeRect(x - 30, y - 56, 60, 18);
  ctx.fillStyle = '#efe6d2'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(texto, x, y - 46.5, 54);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f4f8fb'; ctx.beginPath(); ctx.moveTo(x - 32, y - 56); ctx.quadraticCurveTo(x, y - 63, x + 32, y - 56); ctx.lineTo(x + 30, y - 55); ctx.lineTo(x - 30, y - 55); ctx.closePath(); ctx.fill();
}

/* ===== Nevada: copos en tres profundidades que bajan con el viento, y ráfagas que levantan nieve al ras del piso =====
 * Los copos están en pantalla y se corren al revés que la cámara según su profundidad (los de cerca, más). */
class AmbienteNieve {
  constructor() {
    this.copos = []; this.rafagas = []; this.tiempo = 0; this.viento = 0.6; this.proximaRafaga = 5; this.camAntes = null;
    for (let k = 0; k < 120; k++) this.copos.push(this.nuevoCopo(true));
  }
  nuevoCopo(enPantalla) {
    const capa = Math.random() < 0.45 ? 0 : Math.random() < 0.7 ? 1 : 2;
    return { x: Math.random() * ANCHO, y: enPantalla ? Math.random() * ALTO : -8 - Math.random() * 30, capa, r: [0.9, 1.5, 2.5][capa] * (0.8 + Math.random() * 0.4),
      v: [0.4, 0.75, 1.3][capa] * (0.8 + Math.random() * 0.5), fase: Math.random() * 6.28 };
  }
  actualizar(dt, camaraX) {
    this.tiempo += dt;
    const paso = dt * 60, dcam = this.camAntes === null ? 0 : camaraX - this.camAntes; this.camAntes = camaraX;
    this.viento = 0.55 + Math.sin(this.tiempo * 0.3) * 0.45 + Math.sin(this.tiempo * 1.3) * 0.15;
    for (const c of this.copos) {
      c.fase += dt * 2;
      c.y += c.v * paso;
      c.x += (this.viento * [0.35, 0.65, 1.05][c.capa] + Math.sin(c.fase) * 0.22) * paso - dcam * [0.3, 0.65, 1.15][c.capa];
      if (c.y > ALTO + 4) Object.assign(c, this.nuevoCopo(false));
      if (c.x > ANCHO + 12) c.x -= ANCHO + 24; else if (c.x < -12) c.x += ANCHO + 24;
    }
    if ((this.proximaRafaga -= dt) <= 0) {
      this.proximaRafaga = 7 + Math.random() * 8;
      this.rafagas.push({ x: -380, y: 410 + Math.random() * 70, t: 0, dura: 3.4 + Math.random() * 1.6, v: 4.5 + Math.random() * 2 });
    }
    for (const r of this.rafagas) { r.t += dt; r.x += (r.v + this.viento) * paso - dcam; }
    this.rafagas = this.rafagas.filter(r => r.t < r.dura);
  }
}
