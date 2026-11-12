/* ===== Último bastión: niveles, escenarios, terreno, obstáculos y partida guardada =====
 * Cada nivel son 10 oleadas fijas: se gana llegando al final con el campamento en pie, y ganar abre el siguiente.
 * El escenario tiene su fondo y su suelo, obstáculos que bloquean (árboles, autos, rocas…) y terreno que no bloquea
 * pero cambia el paso de los zombies: el agua los frena a la mitad y ahí no se construye, el barro los frena un
 * cuarto y el hielo los hace resbalar más rápido. La grilla base es de 18 × 9 (con pantallas anchas hay más columnas
 * a la derecha, de terreno base y sin obstáculos).
 * La partida se guarda sola al terminar cada oleada (nivel, oleada, dinero, campamento y todo lo construido).
 */
const TERRENOS_BASTION = {
  pasto:       { color: '#5d7a36', paso: 1 },
  pastoOscuro: { color: '#34472b', paso: 1 },
  tierra:      { color: '#7a6340', paso: 1 },
  barro:       { color: '#4e3b26', paso: 0.75 },
  agua:        { color: '#2f6f8f', paso: 0.5, sinConstruir: true },
  asfalto:     { color: '#3d3d40', paso: 1 },
  banquina:    { color: '#5b5547', paso: 1 },
  arena:       { color: '#c9a86a', paso: 1 },
  nieve:       { color: '#dfe6ec', paso: 1 },
  hielo:       { color: '#a9d3e6', paso: 1.35 },
  madera:      { color: '#7a5532', paso: 1 },
};
// Rectángulos de terreno: [tipo, c0, f0, c1, f1] (inclusive). Obstáculos: [tipo, c, f]
const NIVELES_BASTION = [
  { id: 'granja', fondo: 'granja', base: 'pasto', dinero: 200, vida: 0.75,
    terreno: [['tierra', 0, 4, 17, 4], ['barro', 10, 0, 13, 2], ['agua', 6, 6, 7, 7]],
    obstaculos: [['arbol', 3, 0], ['arbol', 4, 8], ['arbol', 12, 6], ['arbol', 15, 1], ['fardo', 11, 7], ['fardo', 11, 8], ['tractor', 14, 4]] },
  { id: 'autopista', fondo: 'ciudad', base: 'banquina', dinero: 175, vida: 0.9,
    terreno: [['asfalto', 0, 2, 17, 6], ['agua', 8, 1, 8, 1], ['agua', 12, 7, 13, 7], ['barro', 3, 7, 4, 8]],
    obstaculos: [['auto', 5, 2], ['auto', 6, 6], ['auto', 10, 3], ['auto', 11, 5], ['auto', 14, 2], ['auto', 15, 6], ['contenedor', 8, 0], ['contenedor', 9, 8]] },
  { id: 'bosque', fondo: 'bosque', base: 'pastoOscuro', dinero: 175, vida: 1,
    terreno: [['agua', 9, 0, 9, 8], ['madera', 9, 4, 9, 4], ['barro', 10, 0, 11, 2], ['barro', 7, 7, 8, 8]],
    obstaculos: [['pino', 3, 1], ['pino', 4, 7], ['pino', 6, 3], ['pino', 12, 0], ['pino', 12, 5], ['pino', 13, 8], ['pino', 15, 3], ['roca', 7, 8], ['roca', 14, 6]] },
  { id: 'desierto', fondo: 'desierto', base: 'arena', dinero: 160, vida: 0.9,
    terreno: [['agua', 11, 3, 12, 5], ['pasto', 10, 3, 10, 5], ['pasto', 13, 3, 13, 5]],
    obstaculos: [['cactus', 4, 1], ['cactus', 6, 7], ['cactus', 9, 2], ['cactus', 13, 1], ['cactus', 15, 6], ['roca', 7, 4], ['roca', 10, 7], ['roca', 14, 4]] },
  { id: 'montana', fondo: 'montana', base: 'nieve', dinero: 160, vida: 1.05,
    terreno: [['hielo', 6, 2, 11, 6]],
    obstaculos: [['pinoNevado', 3, 0], ['pinoNevado', 4, 8], ['pinoNevado', 13, 1], ['pinoNevado', 13, 7], ['pinoNevado', 15, 4], ['roca', 8, 0], ['roca', 9, 8], ['cabana', 12, 4]] },
];
const OLAS_POR_NIVEL = 10;

/* ---------- Progreso y partida guardada (localStorage) ---------- */
const ProgresoBastion = {
  CLAVE: 'zonaMuerta.bastion.progreso', PARTIDA: 'zonaMuerta.bastion.partida',
  leer(clave, defecto) { try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; } },
  escribir(clave, valor) { try { if (valor === null) localStorage.removeItem(clave); else localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ } },
  progreso() { return this.leer(this.CLAVE, {}); },
  ganado(id) { return !!this.progreso()[id]; },
  abierto(i) { return i === 0 || this.ganado(NIVELES_BASTION[i - 1].id); },
  ganar(id, base, dificultad) {
    const p = this.progreso(), antes = p[id];
    p[id] = { base: Math.max(base, antes ? antes.base : 0), dificultad, fecha: Date.now() };
    this.escribir(this.CLAVE, p);
  },
  partida() { return this.leer(this.PARTIDA, null); },
  borrarPartida() { this.escribir(this.PARTIDA, null); },
};

/* ---------- La partida: nivel, terreno, obstáculos, guardar y seguir ---------- */
Object.assign(Juego.prototype, {
  prepararNivelBastion() {
    const op = typeof this.opcionesEstrategia === 'object' ? this.opcionesEstrategia : {};
    const N = NIVELES_BASTION.find(n => n.id === op.nivel) || NIVELES_BASTION[0];
    this.nivelBastion = N;
    this.terreno = Array.from({ length: this.filas }, () => new Array(this.cols).fill(N.base));
    for (const [tipo, c0, f0, c1, f1] of N.terreno) for (let f = f0; f <= f1; f++) for (let c = c0; c <= c1; c++) if (this.dentro(c, f)) this.terreno[f][c] = tipo;
    this.obstaculos = N.obstaculos.filter(([, c, f]) => this.dentro(c, f) && c < this.cols - 1).map(([tipo, c, f], i) => ({ tipo, c, f, ...this.centroCelda(c, f), semilla: i }));
    this.dinero = N.dinero;
  },
  terrenoEn(c, f) { return this.terreno && this.dentro(c, f) ? this.terreno[f][c] : null; },
  obstaculoEn(c, f) { return this.obstaculos ? this.obstaculos.find(o => o.c === c && o.f === f) || null : null; },
  // Factor de velocidad del zombie según lo que pisa
  pasoTerreno(x, y) { const { c, f } = this.celdaDe(x, y), t = this.terrenoEn(c, f); return t ? TERRENOS_BASTION[t].paso : 1; },

  // Se guarda al terminar cada oleada: lo que está en cola se devuelve en dinero (se vuelve a pedir al seguir)
  guardarPartidaBastion() {
    if (this.terminado) return;
    const enCola = [...this.colaCuartel, ...this.colaTaller].reduce((s, o) => s + o.costo, 0);
    ProgresoBastion.escribir(ProgresoBastion.PARTIDA, {
      nivel: this.nivelBastion.id, dificultad: this.dificultad.id, ronda: this.ronda, dinero: this.dinero + enCola, vidaBase: this.vidaBase,
      bajas: this.bajas || 0, construidas: this.construidas || 0, tiempo: Math.round(this.tiempoJugado), fecha: Date.now(),
      unidades: this.unidades.filter(u => !u.invisible && !(u.tipo === 'soldado' && u.destinoBunker)).map(u => ({ tipo: u.tipo, c: u.c, f: u.f, vida: Math.round(u.vida), listo: !!u.listo, obra: u.obra || 0, adentro: u.adentro || 0 })),
    });
  },
  restaurarPartidaBastion(d) {
    const B = BASTION;
    this.unidades = [];
    for (const s of d.unidades) {
      const U = B.unidades[s.tipo]; if (!U) continue;
      const p = this.centroCelda(s.c, s.f);
      if (s.tipo === 'soldado') { const u = this.nuevoSoldado(p.x, p.y, s.c, s.f); u.vida = Math.min(U.vida, s.vida); this.unidades.push(u); continue; }
      const u = { tipo: s.tipo, c: s.c, f: s.f, x: p.x, y: p.y, vida: Math.min(U.vida, s.vida), vidaMax: U.vida, listo: s.listo, obra: s.obra, bloquea: true, costo: U.costo, enfriado: 0, fuego: 0, apunta: 0, adentro: Math.min(s.adentro || 0, U.capacidad || 0), retroceso: 0 };
      this.unidades.push(u);
    }
    this.ronda = d.ronda; this.dinero = d.dinero; this.vidaBase = d.vidaBase; this.bajas = d.bajas || 0; this.construidas = d.construidas || 0;
    this.tiempoJugado = d.tiempo || 0; this.enDescanso = true; this.descansoHasta = this.tiempoJugado + B.descanso;
    this.rehacerCamino();
  },

  dibujarFondoBastion(ctx) { PaisajeBastion.fondo(ctx, this.nivelBastion, this.ahora); PaisajeBastion.suelo(ctx, this.nivelBastion); PaisajeBastion.terreno(ctx, this, this.ahora); },
});

/* ---------- Dibujo de escenarios (sirven también para las vistas chicas de la pantalla de niveles) ---------- */
const PaisajeBastion = {
  fondo(ctx, N, ms) {
    const B = BASTION, A = ANCHO, h = B.arriba;
    const cielo = (a, b) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(-20, -20, A + 40, h + 20); };
    const cerros = (color, base, alto, sal, n = 7) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-20, h); for (let k = 0; k <= n; k++) { const x = k * (A + 40) / n - 20; ctx.quadraticCurveTo(x - A / n / 2, base - alto * (0.5 + azar(k, sal)), x, base - alto * 0.3 * azar(k, sal + 1)); } ctx.lineTo(A + 20, h); ctx.closePath(); ctx.fill(); };
    switch (N.fondo) {
      case 'granja': {
        cielo('#6fa8d6', '#e9dcae');
        ctx.fillStyle = 'rgba(255,248,215,0.9)'; ctx.beginPath(); ctx.arc(A * 0.78, 52, 22, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; const x = (k * 260 + ms * 0.006) % (A + 160) - 80; ctx.beginPath(); ctx.ellipse(x, 40 + k * 14, 46, 12, 0, 0, Math.PI * 2); ctx.ellipse(x + 26, 34 + k * 14, 30, 12, 0, 0, Math.PI * 2); ctx.fill(); }
        cerros('#7c9a52', h - 30, 50, 11); cerros('#6a8a44', h - 12, 30, 21, 9);
        // Granero y molino a lo lejos
        const gx = A * 0.62;
        ctx.fillStyle = '#8e2f22'; ctx.fillRect(gx, h - 62, 52, 40); ctx.beginPath(); ctx.moveTo(gx - 4, h - 62); ctx.lineTo(gx + 26, h - 84); ctx.lineTo(gx + 56, h - 62); ctx.fill();
        ctx.fillStyle = '#f1e6d0'; ctx.fillRect(gx + 18, h - 44, 16, 22); ctx.strokeStyle = '#8e2f22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx + 18, h - 44); ctx.lineTo(gx + 34, h - 22); ctx.moveTo(gx + 34, h - 44); ctx.lineTo(gx + 18, h - 22); ctx.stroke();
        const mx = A * 0.3; ctx.strokeStyle = '#6b6b6b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx - 8, h - 20); ctx.lineTo(mx, h - 80); ctx.lineTo(mx + 8, h - 20); ctx.stroke();
        ctx.save(); ctx.translate(mx, h - 80); ctx.rotate(ms / 900); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 1.4; for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke(); } ctx.restore();
        break;
      }
      case 'ciudad': {
        cielo('#2a1f2e', '#8a4a32');
        for (let k = 0; k < 22; k++) { const x = k * (A / 20) - 20, hh = 30 + azar(k, 71) * 70, w = 26 + azar(k, 72) * 30; ctx.fillStyle = k % 2 ? '#2a2328' : '#332a2e'; ctx.fillRect(x, h - 20 - hh, w, hh + 20); if (azar(k, 73) > 0.5) { ctx.fillStyle = '#1a1518'; ctx.fillRect(x + w * 0.6, h - 20 - hh, w * 0.4, 8); } for (let v = 0; v < 4; v++) if (azar(k * 9 + v, 74) > 0.8) { ctx.fillStyle = 'rgba(255,190,90,0.5)'; ctx.fillRect(x + 4 + (v % 2) * 10, h - hh + Math.floor(v / 2) * 14, 4, 5); } }
        for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(60,50,50,0.35)'; ctx.beginPath(); ctx.ellipse((k * 211 + ms * 0.004) % (A + 200) - 100, h - 70 - k * 9, 90, 24, 0, 0, Math.PI * 2); ctx.fill(); }
        // Cartel de la autopista, torcido
        ctx.fillStyle = '#4a4a4c'; ctx.fillRect(A * 0.45, h - 70, 4, 50); ctx.fillRect(A * 0.45 + 70, h - 70, 4, 50);
        ctx.save(); ctx.translate(A * 0.45 - 4, h - 78); ctx.rotate(0.05); ctx.fillStyle = '#1f5a34'; ctx.fillRect(0, 0, 86, 20); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(8, 6, 40, 3); ctx.fillRect(8, 11, 28, 3); ctx.restore();
        break;
      }
      case 'bosque': {
        cielo('#0f1626', '#2c3a52');
        ctx.fillStyle = 'rgba(235,240,255,0.92)'; ctx.beginPath(); ctx.arc(A * 0.2, 48, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2c3a52'; ctx.beginPath(); ctx.arc(A * 0.2 + 7, 44, 14, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + azar(k, 91) * 0.5})`; ctx.fillRect(azar(k, 92) * A, azar(k, 93) * (h - 70), 1.2, 1.2); }
        for (const [color, base, alto, n] of [['#1b2636', h - 10, 70, 30], ['#141d2a', h + 4, 54, 38]]) for (let k = 0; k < n; k++) {
          const x = (k + azar(k, n)) * (A + 40) / n - 20, a = alto * (0.6 + azar(k, n + 7) * 0.5);
          ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, base - a); ctx.lineTo(x - a * 0.28, base); ctx.lineTo(x + a * 0.28, base); ctx.fill();
        }
        break;
      }
      case 'desierto': {
        cielo('#e7b25b', '#f6e2b0');
        ctx.fillStyle = 'rgba(255,250,225,0.95)'; ctx.beginPath(); ctx.arc(A * 0.7, 46, 28, 0, Math.PI * 2); ctx.fill();
        // Mesetas rojas
        for (const [x, w, a, col] of [[0.08, 150, 70, '#b5583a'], [0.42, 110, 52, '#c4673f'], [0.8, 180, 84, '#a94f35']]) {
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(A * x - w / 2 - 20, h); ctx.lineTo(A * x - w / 2, h - a); ctx.lineTo(A * x + w / 2, h - a); ctx.lineTo(A * x + w / 2 + 20, h); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(A * x, h - a, w / 2, a);
        }
        cerros('#d9b878', h - 4, 20, 31, 6);
        ctx.strokeStyle = 'rgba(255,240,200,0.25)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 0; x <= A; x += 20) ctx.lineTo(x, h - 30 - k * 12 + Math.sin(x / 30 + ms / 300 + k) * 1.5); ctx.stroke(); }   // calor
        break;
      }
      case 'montana': {
        cielo('#9fb6c9', '#e6edf2');
        for (const [col, nieveCol, base, alto, n, sal] of [['#7b8a99', '#f4f7fa', h - 20, 110, 5, 41], ['#66737f', '#e9eef3', h, 80, 7, 51]]) for (let k = 0; k <= n; k++) {
          const x = k * (A + 80) / n - 40, a = alto * (0.6 + azar(k, sal) * 0.5), w = a * 1.1;
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x, base - a); ctx.lineTo(x + w, base); ctx.fill();
          ctx.fillStyle = nieveCol; ctx.beginPath(); ctx.moveTo(x - w * 0.3, base - a * 0.7); ctx.lineTo(x, base - a); ctx.lineTo(x + w * 0.3, base - a * 0.7); ctx.lineTo(x + w * 0.1, base - a * 0.75); ctx.lineTo(x - w * 0.08, base - a * 0.68); ctx.fill();
        }
        for (let k = 0; k < 50; k++) { const y = (azar(k, 61) * h + ms * 0.02 * (0.5 + azar(k, 62))) % h; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect((azar(k, 63) * A + Math.sin(ms / 700 + k) * 6) % A, y, 1.6, 1.6); }   // nieve que cae
        break;
      }
    }
  },
  // Suelo fuera de la grilla (alrededor del campamento y abajo)
  suelo(ctx, N) {
    const B = BASTION, col = TERRENOS_BASTION[N.base].color;
    const piso = ctx.createLinearGradient(0, B.arriba - 22, 0, ALTO);
    piso.addColorStop(0, ajustarColor(col, -0.18)); piso.addColorStop(1, ajustarColor(col, -0.05));
    ctx.fillStyle = piso; ctx.fillRect(-20, B.arriba - 22, ANCHO + 40, ALTO - B.arriba + 40);
    for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 3 ? 'rgba(30,26,20,0.12)' : 'rgba(255,250,230,0.08)'; ctx.beginPath(); ctx.ellipse(azar(k, 81) * ANCHO, B.arriba + azar(k, 82) * (ALTO - B.arriba), 6 + azar(k, 83) * 16, 2 + azar(k, 84) * 4, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  // Celdas de terreno con su textura (g: algo con cols, filas, terrenoEn)
  terreno(ctx, g, ms) {
    const B = BASTION, [W, H] = B.celda;
    for (let f = 0; f < g.filas; f++) for (let c = 0; c < g.cols; c++) {
      const t = g.terrenoEn(c, f), T = TERRENOS_BASTION[t], x = B.baseX + c * W, y = B.arriba + f * H, k = f * 64 + c;
      ctx.fillStyle = ajustarColor(T.color, (azar(k, 5) - 0.5) * 0.08); ctx.fillRect(x, y, W + 0.5, H + 0.5);
      switch (t) {
        case 'pasto': case 'pastoOscuro':
          ctx.strokeStyle = ajustarColor(T.color, 0.18); ctx.lineWidth = 0.8;
          for (let j = 0; j < 7; j++) { const px = x + azar(k * 7 + j, 6) * W, py = y + 4 + azar(k * 7 + j, 7) * (H - 4); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 1, py - 4); ctx.moveTo(px + 1.5, py); ctx.lineTo(px + 2.5, py - 3.5); ctx.stroke(); }
          break;
        case 'tierra': case 'banquina': case 'arena':
          ctx.fillStyle = ajustarColor(T.color, -0.15); for (let j = 0; j < 6; j++) ctx.fillRect(x + azar(k * 6 + j, 8) * W, y + azar(k * 6 + j, 9) * H, 1.6, 1.2);
          if (t === 'arena') { ctx.strokeStyle = 'rgba(255,240,200,0.25)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 4, y + H * 0.6); ctx.quadraticCurveTo(x + W / 2, y + H * 0.45, x + W - 4, y + H * 0.62); ctx.stroke(); }
          break;
        case 'barro':
          ctx.fillStyle = 'rgba(20,12,6,0.35)'; ctx.beginPath(); ctx.ellipse(x + W * 0.4, y + H * 0.55, W * 0.28, H * 0.18, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(200,180,150,0.12)'; ctx.beginPath(); ctx.ellipse(x + W * 0.35, y + H * 0.5, W * 0.12, H * 0.06, 0, 0, Math.PI * 2); ctx.fill();
          break;
        case 'agua': {
          ctx.strokeStyle = 'rgba(200,235,255,0.35)'; ctx.lineWidth = 0.9;
          for (let j = 0; j < 3; j++) { const yy = y + 7 + j * 9, dx = Math.sin(ms / 500 + k + j) * 3; ctx.beginPath(); ctx.moveTo(x + 6 + dx, yy); ctx.quadraticCurveTo(x + W / 2 + dx, yy - 2, x + W - 6 + dx, yy); ctx.stroke(); }
          break;
        }
        case 'asfalto':
          if (f > 0 && g.terrenoEn(c, f - 1) === 'asfalto') { ctx.fillStyle = 'rgba(230,220,160,0.45)'; ctx.fillRect(x + 8, y - 1, 16, 2); }   // línea de carril
          if (azar(k, 10) > 0.75) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x + 10, y + 8); ctx.lineTo(x + 18, y + 16); ctx.lineTo(x + 15, y + 26); ctx.stroke(); }   // grieta
          break;
        case 'nieve':
          ctx.fillStyle = 'rgba(160,180,200,0.25)'; ctx.beginPath(); ctx.ellipse(x + azar(k, 11) * W, y + H * 0.7, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
          break;
        case 'hielo':
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 6, y + 6, 10, 2); ctx.fillRect(x + 9, y + 10, 5, 1.5);
          ctx.strokeStyle = 'rgba(80,130,160,0.35)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x + azar(k, 12) * W, y); ctx.lineTo(x + W * 0.5, y + H * 0.5); ctx.lineTo(x + azar(k, 13) * W, y + H); ctx.stroke();
          break;
        case 'madera':   // puente de tablones
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let j = 1; j < 5; j++) ctx.fillRect(x + j * W / 5, y, 1, H);
          break;
      }
    }
  },
  // Obstáculos, con los pies en (0, 0) del centro de la celda
  obstaculo(ctx, tipo, s) {
    ctx.scale(1.3, 1.3);   // dibujados chicos: a 1,3 llenan la celda
    sombraElipse(ctx, 0, 2, 18, 4, 0.25);
    switch (tipo) {
      case 'arbol':
        pieza(ctx, redondo(-3, -22, 6, 23, 2), '#5a3a22', -3, 3);
        for (const [x, y, r, col] of [[-8, -28, 10, '#3f6b2a'], [8, -28, 10, '#3a6327'], [0, -38, 13, '#4b7a31'], [0, -26, 11, '#447230']]) pieza(ctx, circulo(x, y, r), col, x - r, x + r);
        break;
      case 'pino': case 'pinoNevado':
        pieza(ctx, redondo(-2.5, -10, 5, 11, 1.5), '#4a3020', -2.5, 2.5);
        for (let k = 0; k < 3; k++) { const y = -8 - k * 11, w = 16 - k * 4; pieza(ctx, poli([[-w, y], [0, y - 18], [w, y]]), k % 2 ? '#24452f' : '#2a5236', -w, w); if (tipo === 'pinoNevado') pieza(ctx, poli([[-w * 0.55, y - 8], [0, y - 18], [w * 0.55, y - 8], [w * 0.2, y - 6], [-w * 0.2, y - 7]]), '#f1f5f8', -w, w, { contorno: false }); }
        break;
      case 'roca':
        pieza(ctx, poli([[-17, 0], [-14, -12], [-4, -19], [8, -16], [16, -6], [17, 0]]), '#7d7a74', -17, 17);
        linea(ctx, 'rgba(0,0,0,0.25)', 0.8, [[-4, -18], [-1, -8], [6, -4]]);
        break;
      case 'fardo':   // fardo redondo de pasto
        pieza(ctx, redondo(-16, -20, 32, 20, 8), '#c9a24e', -16, 16);
        for (let k = 0; k < 4; k++) linea(ctx, 'rgba(120,80,20,0.4)', 0.8, [[-12 + k * 8, -19], [-14 + k * 8, -1]]);
        pieza(ctx, elipse(13, -10, 4, 9.6), '#b18a3c', 9, 17);
        break;
      case 'tractor':
        pieza(ctx, redondo(-18, -22, 26, 12, 2), '#b3261e', -18, 8);
        pieza(ctx, redondo(-6, -36, 14, 15, 2), '#b3261e', -6, 8); detalle(ctx, 'rgba(180,220,255,0.6)', c => c.rect(-3, -33, 8, 7));
        linea(ctx, '#2a2a2a', 1.4, [[-14, -22], [-14, -32]]);
        pieza(ctx, circulo(-11, -7, 9), '#2a2826', -20, -2); pieza(ctx, circulo(-11, -7, 3.5), '#c9a24e', -14, -8);
        pieza(ctx, circulo(12, -5, 6), '#2a2826', 6, 18); pieza(ctx, circulo(12, -5, 2.4), '#c9a24e', 10, 14);
        break;
      case 'auto': {
        const col = ['#6b3a2e', '#3e5770', '#7a6a3a', '#4c5a3e'][s % 4];
        pieza(ctx, poli([[-19, -6], [-19, -14], [-11, -15], [-6, -23], [8, -23], [13, -15], [19, -13], [19, -6]]), col, -19, 19);
        detalle(ctx, 'rgba(30,40,50,0.8)', poli([[-5, -21], [-1, -21], [-1, -15], [-9, -15]])); detalle(ctx, 'rgba(30,40,50,0.8)', poli([[1, -21], [7, -21], [11, -15], [1, -15]]));
        detalle(ctx, 'rgba(90,50,30,0.5)', elipse(-12, -10, 4, 2.4)); detalle(ctx, 'rgba(90,50,30,0.5)', elipse(9, -9, 3, 2));   // óxido
        pieza(ctx, circulo(-11, -5, 4.6), '#1e1e20', -15, -7); pieza(ctx, circulo(11, -5, 4.6), '#1e1e20', 7, 15);
        break;
      }
      case 'contenedor':
        pieza(ctx, redondo(-20, -24, 40, 24, 1), s % 2 ? '#2f5f7a' : '#8a3a24', -20, 20);
        for (let k = -16; k < 20; k += 4) linea(ctx, 'rgba(0,0,0,0.25)', 0.8, [[k, -22], [k, -2]]);
        break;
      case 'cactus':
        pieza(ctx, redondo(-3.5, -34, 7, 34, 3.5), '#4f8a3a', -3.5, 3.5);
        pieza(ctx, redondo(-12, -24, 5, 12, 2.5), '#4a8236', -12, -7); pieza(ctx, redondo(-12, -16, 9, 4, 2), '#4a8236', -12, -3);
        pieza(ctx, redondo(7, -30, 5, 14, 2.5), '#4a8236', 7, 12); pieza(ctx, redondo(3, -20, 9, 4, 2), '#4a8236', 3, 12);
        for (let k = 0; k < 6; k++) linea(ctx, 'rgba(255,255,220,0.5)', 0.6, [[-1.5 + (k % 2) * 3, -30 + k * 5], [-3 + (k % 2) * 6, -31 + k * 5]]);
        break;
      case 'cabana':
        pieza(ctx, redondo(-18, -22, 36, 22, 1), '#6b4a2b', -18, 18);
        for (let k = 0; k < 4; k++) linea(ctx, 'rgba(0,0,0,0.3)', 0.8, [[-18, -18 + k * 5], [18, -18 + k * 5]]);
        pieza(ctx, poli([[-22, -21], [0, -38], [22, -21]]), '#4a3020', -22, 22);
        pieza(ctx, poli([[-16, -26], [0, -38], [16, -26], [6, -28], [-6, -27]]), '#f1f5f8', -16, 16, { contorno: false });
        detalle(ctx, '#ffd27a', c => c.rect(6, -16, 6, 6));
        break;
    }
  },
  // Vista chica de un nivel (para la pantalla de elegir): escena completa a escala
  vista(lienzo, N) {
    const ctx = lienzo.getContext('2d'), B = BASTION, e = lienzo.width / ANCHO;
    const cols = Math.max(8, Math.floor((ANCHO - B.baseX - B.margenDer) / B.celda[0])), filas = Math.floor((B.abajo - B.arriba) / B.celda[1]);
    const g = { cols, filas, dentro: (c, f) => c >= 0 && f >= 0 && c < cols && f < filas, terreno: Array.from({ length: filas }, () => new Array(cols).fill(N.base)) };
    for (const [tipo, c0, f0, c1, f1] of N.terreno) for (let f = f0; f <= f1; f++) for (let c = c0; c <= c1; c++) if (g.dentro(c, f)) g.terreno[f][c] = tipo;
    g.terrenoEn = (c, f) => g.dentro(c, f) ? g.terreno[f][c] : null;
    ctx.setTransform(e, 0, 0, e, 0, -60 * e);   // recorta arriba: se ve el horizonte y el campo
    this.fondo(ctx, N, 0); this.suelo(ctx, N); this.terreno(ctx, g, 0);
    N.obstaculos.forEach(([tipo, c, f], i) => { ctx.save(); ctx.translate(B.baseX + c * B.celda[0] + B.celda[0] / 2, B.arriba + f * B.celda[1] + B.celda[1] / 2 + 8); this.obstaculo(ctx, tipo, i); ctx.restore(); });
    ctx.fillStyle = 'rgba(70,55,40,0.9)'; ctx.fillRect(0, B.arriba - 10, B.baseX - 10, ALTO);   // el campamento, apenas sugerido
  },
};

/* ---------- Pantalla de niveles ---------- */
const NivelesBastionUI = {
  abrir(mostrar) {
    const lista = document.getElementById('lista-bastion'); if (!lista) return;
    lista.innerHTML = '';
    const guardada = ProgresoBastion.partida();
    const seguir = document.getElementById('bastion-continuar');
    const nGuardado = guardada && NIVELES_BASTION.find(n => n.id === guardada.nivel);
    seguir.classList.toggle('oculta', !nGuardado);
    if (nGuardado) seguir.textContent = t('bniv.continuar', { nivel: t('bniv.' + guardada.nivel), ola: guardada.ronda + 1, total: OLAS_POR_NIVEL });
    NIVELES_BASTION.forEach((N, i) => {
      const abierto = ProgresoBastion.abierto(i), ganado = ProgresoBastion.ganado(N.id);
      const b = document.createElement('button');
      b.className = 'tarjeta-mapa tarjeta-bastion' + (abierto ? '' : ' cerrada') + (ganado ? ' ganada' : '');
      b.disabled = !abierto;
      b.dataset.nivelBastion = N.id;
      const lienzo = document.createElement('canvas'); lienzo.width = 320; lienzo.height = 150; lienzo.className = 'vista';
      b.appendChild(lienzo);
      b.insertAdjacentHTML('beforeend', `<h3>${i + 1}. ${t('bniv.' + N.id)}</h3><p>${t('bniv.' + N.id + '.texto')}</p><span class="etiqueta">${!abierto ? t('bniv.cerrado') : ganado ? t('bniv.ganado') : t('bniv.olas', { n: OLAS_POR_NIVEL })}</span>`);
      lista.appendChild(b);
      try { PaisajeBastion.vista(lienzo, N); } catch { /* sin lienzo */ }
    });
    mostrar('panel-bastion-niveles');
  },
};
