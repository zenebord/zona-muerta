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
    terreno: [['agua', 11, 3, 12, 5]],
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

  // dibujarFondoBastion, el paisaje y los obstáculos: js/bastion-dibujo.js
});

/* ---------- Vista chica de cada escenario (fondo, suelo, terreno y obstáculos se dibujan en js/bastion-dibujo.js) ---------- */
const PaisajeBastion = {
  // Vista chica de un nivel (para la pantalla de elegir): escena completa a escala
  vista(lienzo, N) {
    const ctx = lienzo.getContext('2d'), B = BASTION, e = lienzo.width / ANCHO;
    const cols = Math.max(8, Math.floor((ANCHO - B.baseX - B.margenDer) / B.celda[0])), filas = Math.floor((B.abajo - B.arriba) / B.celda[1]);
    const g = { cols, filas, dentro: (c, f) => c >= 0 && f >= 0 && c < cols && f < filas, terreno: Array.from({ length: filas }, () => new Array(cols).fill(N.base)) };
    for (const [tipo, c0, f0, c1, f1] of N.terreno) for (let f = f0; f <= f1; f++) for (let c = c0; c <= c1; c++) if (g.dentro(c, f)) g.terreno[f][c] = tipo;
    g.terrenoEn = (c, f) => g.dentro(c, f) ? g.terreno[f][c] : null;
    g.nivelBastion = N;
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
