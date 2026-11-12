/* ===== Último bastión: defensa con estrategia =====
 * Vista de estratega sobre un campo con grilla. A la izquierda, el campamento; los zombies llegan por la derecha y
 * buscan el camino más corto hasta él (un mapa de distancias por celda que se rehace cada vez que algo cambia).
 * El jugador no dispara: gasta el dinero que dan los zombies muertos en
 *   soldados   se forman en el cuartel del campamento (4 s cada uno, de a uno) y caminan hasta su lugar; si su lugar
 *              es un búnker, se meten adentro (hasta 4)
 *   torretas   ametralladora con su tirador detrás de bolsas de arena; se construye en el lugar (8 s)
 *   búnkeres   hormigón con una tronera; disparan los soldados que tenga adentro, protegidos y con más alcance
 *   tanques    se fabrican en el taller (15 s) y van hasta su lugar; disparan muy lejos con daño en área, pero no a
 *              los que tienen pegados
 *   muros      barreras de hormigón: no se puede cerrar el paso del todo, pero sí obligar a los zombies a rodear y
 *              a pasar de a muchos por huecos angostos, donde se amontonan y van más lento
 * Torretas, búnkeres, tanques y muros ocupan su celda (los zombies los rodean); los soldados no. Los zombies muerden
 * lo que tengan adelante y, si se trancan, rompen lo que los traba. El que llega al campamento le saca vida; si llega
 * a cero, se pierde. Clic derecho sobre algo propio lo vende a mitad de precio (o lo cancela entero si no estaba listo).
 * Cuelga de Juego (js/juego.js) con `this.estrategia`.
 */
const BASTION = {
  celda: [44, 34], arriba: 178, abajo: 490, baseX: 120, margenDer: 26,
  // Economía ajustada: se arranca con un ejército mínimo ya armado y poca plata; cada zombie paga poco y la vida crece 11 % por oleada
  dineroInicial: 150, vidaBase: 15, descanso: 25, primerDescanso: 40, crecimientoVida: 1.21, adelantoPorSegundo: 1,
  // Reparar cuesta 75 % de lo que vale la parte rota; 60 % de los comunes son impacientes y rompen muros del laberinto
  reparacion: 0.75, impacientes: 0.6,
  unidades: {
    soldado: { costo: 50,  tiempo: 4,  vida: 30,  alcance: 175, dano: 3,  cadencia: 0.65, donde: 'cuartel', tecla: 1 },
    torreta: { costo: 150, tiempo: 8,  vida: 90,  alcance: 195, dano: 2,  cadencia: 0.13, donde: 'obra', bloquea: true, tecla: 2 },
    bunker:  { costo: 150, tiempo: 12, vida: 280, alcance: 210, dano: 3,  cadencia: 0.65, donde: 'obra', bloquea: true, capacidad: 4, tecla: 3 },
    tanque:  { costo: 375, tiempo: 15, vida: 170, alcance: 420, minimo: 70, dano: 18, radio: 32, cadencia: 2.6, donde: 'taller', bloquea: true, tecla: 4 },
    muro:    { costo: 35,  tiempo: 2,  vida: 150, donde: 'obra', bloquea: true, tecla: 5 },
  },
  zombies: {
    caminante: { vida: 1,   vel: 24, paga: 6,   dano: 1,  escala: 0.58 },
    corredor:  { vida: 0.8, vel: 46, paga: 7,   dano: 1,  escala: 0.5 },
    gordo:     { vida: 3.2, vel: 16, paga: 15, dano: 3,  escala: 0.66 },
    jefe:      { vida: 22,  vel: 14, paga: 90,  dano: 8,  escala: 1.25 },
  },
};
const ARMA_BASTION = { categoria: 'rifle', explosivo: false };
const ARMA_BASTION_TANQUE = { categoria: 'bazuca', explosivo: true };

/* ---------- Dibujos chicos (vista de estratega), mirando a la derecha con los pies en (0, 0) ---------- */
const DibujoBastion = {
  soldado(ctx, s, t) {   // s: { fuego, apunta, muerto, caminando, fase }
    const col = (c) => c;
    const paso = s.caminando ? Math.sin(s.fase) * 3 : 0;
    pieza(ctx, poli(segmento(-2, -14, -3 - paso, 0, 4.2, 3.6)), col('#3f4a2e'), -6, 2);
    pieza(ctx, poli(segmento(2, -14, 3 + paso, 0, 4.2, 3.6)), col('#4b5636'), -1, 6);
    pieza(ctx, elipse(-3 - paso, 0, 2.8, 1.4), '#1d1a16', -6, 0); pieza(ctx, elipse(3 + paso, 0, 2.8, 1.4), '#1d1a16', 0, 6);
    pieza(ctx, redondo(-5, -27, 10, 14, 3), col('#55613d'), -5, 5);                                       // chaleco
    detalle(ctx, '#3a4228', c => c.rect(-4, -22, 8, 2));
    pieza(ctx, circulo(1, -31, 4.2), '#d9a67a', -3, 5);                                                   // cara
    pieza(ctx, k => { k.moveTo(-4.6, -31); k.quadraticCurveTo(-4.4, -37.5, 1.4, -37.6); k.quadraticCurveTo(6.6, -37.4, 6, -31); k.lineTo(-4.6, -31); }, '#4a5634', -5, 6);   // casco
    // Fusil apuntando (sube un poco si el blanco está más arriba)
    ctx.save(); ctx.translate(2, -22); ctx.rotate(s.apunta || 0);
    pieza(ctx, redondo(-4, -1.6, 18, 3.2, 1), '#22231f', -4, 14);
    pieza(ctx, redondo(-6, -1, 4, 4, 1), '#5a3a22', -6, -2);
    if (s.fuego > 0) { ctx.fillStyle = `rgba(255,220,120,${s.fuego})`; ctx.beginPath(); ctx.moveTo(14, -2.4); ctx.lineTo(21, 0); ctx.lineTo(14, 2.4); ctx.fill(); }
    ctx.restore();
    pieza(ctx, circulo(5, -21, 2), '#d9a67a', 3, 7);                                                      // mano
  },
  bolsas(ctx, x0, x1, y, filas) {   // bolsas de arena apiladas
    for (let f = 0; f < filas; f++) for (let x = x0 + (f % 2) * 4; x < x1 - 2; x += 8) pieza(ctx, redondo(x, y - 5 * (f + 1), 8.4, 5.4, 2.4), f % 2 ? '#a08a5c' : '#b29a68', x, x + 8);
  },
  torreta(ctx, u, t) {
    DibujoBastion.soldado(ctx, { fuego: 0, apunta: u.apunta * 0.5 }, t);
    ctx.save(); ctx.translate(6, -12); ctx.rotate(u.apunta || 0);
    pieza(ctx, redondo(-8, -3, 22, 6, 2), '#2a2c2e', -8, 14);                                             // cajón de la ametralladora
    pieza(ctx, redondo(13, -1.3, 14, 2.6, 1), '#1c1d1f', 13, 27);                                         // caño
    if (u.fuego > 0) { ctx.fillStyle = `rgba(255,220,120,${u.fuego})`; ctx.beginPath(); ctx.moveTo(27, -3.4); ctx.lineTo(36, 0); ctx.lineTo(27, 3.4); ctx.fill(); }
    ctx.restore();
    linea(ctx, '#3a3c40', 1.4, [[6, -12], [0, 0]]); linea(ctx, '#3a3c40', 1.4, [[6, -12], [12, 0]]);   // trípode
    DibujoBastion.bolsas(ctx, -14, 22, 2, 2);
  },
  bunker(ctx, u, t) {
    pieza(ctx, k => { k.moveTo(-22, 0); k.lineTo(-20, -22); k.quadraticCurveTo(0, -32, 20, -22); k.lineTo(22, 0); k.closePath(); }, '#8e8c86', -22, 22);
    if (!Pincel.silueta) {
      detalle(ctx, '#151517', c => c.rect(-12, -18, 24, 4));                                               // tronera
      for (let k = 0; k < Math.min(u.adentro || 0, 4); k++) detalle(ctx, u.fuegoK && u.fuegoK[k] > 0 ? '#ffdd88' : '#4a5634', c => c.rect(-10 + k * 6, -17.4, 3.6, 2.8));
      linea(ctx, 'rgba(0,0,0,0.25)', 0.6, [[-14, -8], [-6, -6]]); linea(ctx, 'rgba(0,0,0,0.25)', 0.6, [[8, -12], [14, -6]]);
    }
    DibujoBastion.bolsas(ctx, -24, 24, 2, 1);
    linea(ctx, '#3a3226', 1, [[14, -26], [14, -38]]); pieza(ctx, poli([[14, -38], [24, -35], [14, -32]]), '#b3261e', 14, 24);   // banderín
  },
  tanque(ctx, u, t) {
    const r = u.retroceso || 0;
    pieza(ctx, redondo(-24, -10, 48, 10, 4), '#2c2e26', -24, 24);                                         // orugas
    if (!Pincel.silueta) for (let k = 0; k < 6; k++) detalle(ctx, '#55574c', circulo(-19 + k * 7.6, -5, 2.6));
    pieza(ctx, poli([[-22, -10], [-18, -17], [20, -17], [25, -10]]), '#5d6640', -22, 25);                 // casco
    ctx.save(); ctx.translate(-2 - r * 2, -20);
    pieza(ctx, redondo(-10, -5, 20, 9, 3), '#6a744a', -10, 10);                                            // torreta
    ctx.save(); ctx.rotate(u.apunta || 0);
    pieza(ctx, redondo(8, -1.6, 28 - r * 4, 3.2, 1), '#3a3f2a', 8, 36);                                   // cañón largo
    if (u.fuego > 0) { ctx.fillStyle = `rgba(255,200,90,${u.fuego})`; ctx.beginPath(); ctx.moveTo(36, -5); ctx.lineTo(50, 0); ctx.lineTo(36, 5); ctx.fill(); }
    ctx.restore(); ctx.restore();
    if (!Pincel.silueta) detalle(ctx, '#e8e2c8', c => c.rect(-14, -15, 6, 3));                           // número
  },
  muro(ctx, u, t) {
    const dano = 1 - u.vida / u.vidaMax;
    pieza(ctx, poli([[-20, 0], [-17, -16], [-9, -18], [9, -18], [17, -16], [20, 0]]), '#a9a69e', -20, 20);
    if (!Pincel.silueta) {
      linea(ctx, 'rgba(0,0,0,0.2)', 0.8, [[0, -18], [0, 0]]);
      if (dano > 0.3) linea(ctx, '#3a3834', 0.7, [[-8, -16], [-5, -9], [-9, -3]]);
      if (dano > 0.6) linea(ctx, '#3a3834', 0.7, [[6, -17], [9, -10], [5, -5], [8, -1]]);
      for (let x = -18; x < 18; x += 5) linea(ctx, '#5a5650', 0.5, [[x, -20], [x + 2.5, -22], [x + 5, -20]]);   // alambre de púas
    }
  },
  obra(ctx, f, t) {   // andamio mientras se construye, con la barra de avance
    linea(ctx, '#c9a25a', 1, [[-16, 0], [-16, -26]]); linea(ctx, '#c9a25a', 1, [[16, 0], [16, -26]]);
    linea(ctx, '#c9a25a', 1, [[-16, -13], [16, -13]]); linea(ctx, '#c9a25a', 1, [[-16, -26], [16, -26]]);
    linea(ctx, '#c9a25a', 0.8, [[-16, 0], [16, -26]]);
    if (!Pincel.silueta && Math.sin(t / 60) > 0.6) { ctx.fillStyle = '#ffe28a'; ctx.fillRect(-2 + Math.sin(t / 37) * 8, -12, 2, 2); }   // chispas
  },
};

/* ---------- La partida ---------- */
Object.assign(Juego.prototype, {
  prepararBastion() {
    const B = BASTION;
    Mundo.plano = true; Mundo.carriles = false; Mundo.perfil = null;
    this.cols = Math.max(8, Math.floor((ANCHO - B.baseX - B.margenDer) / B.celda[0]));
    this.filas = Math.floor((B.abajo - B.arriba) / B.celda[1]);
    this.dinero = B.dineroInicial; this.vidaBase = B.vidaBase;
    this.unidades = []; this.colaCuartel = []; this.colaTaller = [];
    this.ronda = 0; this.porAparecer = 0; this.enDescanso = true; this.descansoHasta = B.primerDescanso; this.proximoZombie = 0;
    this.colocando = null; this.puntero = null; this.trazos = [];
    this.velocidad = 1;   // 1×, 2×, 5× o 10× (el bucle de interfaz.js hace tantos pasos por cuadro)
    this.construidas = 0;
    this.ejercitoInicial();
    this.rehacerCamino();
    document.getElementById('hud-aereo').classList.add('oculta');
    document.getElementById('panel-bastion').classList.remove('oculta');
    this.panelBastion();
  },

  // Ejército mínimo al empezar, para mostrar lo básico: tres soldados y cuatro muros que dejan un pasillo en el medio
  // (los muros desvían a los zombies, no los frenan del todo). Solo no alcanza: hay que construir desde la primera oleada
  ejercitoInicial() {
    const B = BASTION, medio = Math.floor(this.filas / 2);
    const obra = (tipo, c, f) => {
      if (!this.dentro(c, f) || this.ocupadaPor(c, f)) return;
      const U = B.unidades[tipo], p = this.centroCelda(c, f);
      this.unidades.push({ tipo, c, f, x: p.x, y: p.y, vida: U.vida, vidaMax: U.vida, listo: true, obra: 1, bloquea: true, costo: U.costo, enfriado: 0, fuego: 0, apunta: 0, adentro: 0 });
    };
    for (const df of [-2, -1, 1, 2]) obra('muro', 7, medio + df);
    for (const df of [-1, 0, 1]) { const p = this.centroCelda(4, medio + df); this.unidades.push(this.nuevoSoldado(p.x, p.y, 4, medio + df)); }
  },

  // Celdas: centro y a qué celda cae un punto
  centroCelda(c, f) { const B = BASTION; return { x: B.baseX + c * B.celda[0] + B.celda[0] / 2, y: B.arriba + f * B.celda[1] + B.celda[1] / 2 + 8 }; },
  celdaDe(x, y) { const B = BASTION; return { c: Math.floor((x - B.baseX) / B.celda[0]), f: Math.floor((y - 8 - B.arriba) / B.celda[1]) }; },
  dentro(c, f) { return c >= 0 && f >= 0 && c < this.cols && f < this.filas; },
  ocupadaPor(c, f) { return this.unidades.find(u => u.bloquea && u.c === c && u.f === f) || null; },

  // Mapa de distancias hasta el campamento (la columna 0 da al campamento). bloqueadas: Set de "c,f"
  distancias(bloqueadas) {
    const d = Array.from({ length: this.filas }, () => new Array(this.cols).fill(Infinity)), cola = [];
    for (let f = 0; f < this.filas; f++) if (!bloqueadas.has('0,' + f)) { d[f][0] = 1; cola.push([0, f]); }
    for (let i = 0; i < cola.length; i++) {
      const [c, f] = cola[i];
      for (const [dc, df] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nf = f + df;
        if (this.dentro(nc, nf) && d[nf][nc] === Infinity && !bloqueadas.has(nc + ',' + nf)) { d[nf][nc] = d[f][c] + 1; cola.push([nc, nf]); }
      }
    }
    return d;
  },
  bloqueadas(extra) {
    const s = new Set(this.unidades.filter(u => u.bloquea).map(u => u.c + ',' + u.f));
    if (extra) s.add(extra);
    return s;
  },
  rehacerCamino() { this.distBastion = this.distancias(this.bloqueadas()); },

  /* ---------- Colocar, vender, formar ---------- */
  elegirUnidad(tipo) {
    if (tipo === 'vender' || tipo === 'reparar') { this.colocando = this.colocando === tipo ? null : tipo; this.panelBastion(); return; }
    const U = BASTION.unidades[tipo]; if (!U) return;
    this.colocando = this.colocando === tipo ? null : tipo;
    if (this.colocando && this.dinero < U.costo) this.aviso(t('bastion.sinDinero'), 1200);
    this.panelBastion();
  },
  cancelarColocacion() { if (!this.colocando) return false; this.colocando = null; this.panelBastion(); return true; },
  // ¿Se puede poner `tipo` en (c, f)? Devuelve null si sí, o la clave del motivo si no
  motivoNoColocar(tipo, c, f) {
    const U = BASTION.unidades[tipo];
    if (!this.dentro(c, f)) return 'bastion.fuera';
    if (this.dinero < U.costo) return 'bastion.sinDinero';
    const ocupa = this.ocupadaPor(c, f);
    if (tipo === 'soldado') return ocupa && !(ocupa.tipo === 'bunker') ? 'bastion.ocupado' : (ocupa && ocupa.tipo === 'bunker' && ocupa.adentro + this.vanAlBunker(ocupa) >= BASTION.unidades.bunker.capacidad ? 'bastion.lleno' : null);
    if (ocupa || this.unidades.some(u => !u.bloquea && u.c === c && u.f === f && u.listo)) return 'bastion.ocupado';
    if (this.zombies.some(z => z.estado !== 'muerto' && (() => { const k = this.celdaDe(z.x, z.y); return k.c === c && k.f === f; })())) return 'bastion.ocupado';
    const d = this.distancias(this.bloqueadas(c + ',' + f));
    if (!d.some(fila => fila[this.cols - 1] < Infinity)) return 'bastion.bloquea';
    return null;
  },
  vanAlBunker(b) { return this.unidades.filter(u => u.tipo === 'soldado' && u.destinoBunker === b).length + this.colaCuartel.filter(o => o.bunker === b).length; },
  colocar(c, f) {
    const tipo = this.colocando, U = BASTION.unidades[tipo];
    const motivo = this.motivoNoColocar(tipo, c, f);
    if (motivo) { this.aviso(t(motivo), 1400); Audio_.vacio(); return false; }
    this.dinero -= U.costo;
    const p = this.centroCelda(c, f);
    if (U.donde === 'obra') {
      this.unidades.push({ tipo, c, f, x: p.x, y: p.y, vida: U.vida * 0.25, vidaMax: U.vida, listo: false, obra: 0, bloquea: true, costo: U.costo, enfriado: 0, fuego: 0, apunta: 0, adentro: 0 });
      this.rehacerCamino(); Audio_.recarga('cartucho');
    } else {
      const bunker = this.ocupadaPor(c, f);
      const orden = { tipo, c, f, costo: U.costo, bunker: bunker && bunker.tipo === 'bunker' ? bunker : null };
      if (tipo === 'tanque') {   // el lugar del tanque queda reservado desde ya, así nadie lo bloquea
        orden.reserva = { tipo: 'reserva', c, f, x: p.x, y: p.y, bloquea: true, listo: false, vida: 1, vidaMax: 1, costo: 0, invisible: true };
        this.unidades.push(orden.reserva); this.rehacerCamino();
      }
      (U.donde === 'cuartel' ? this.colaCuartel : this.colaTaller).push(orden);
      Audio_.recarga('tapa');
    }
    this.panelBastion();
    return true;
  },
  vender(x, y) {
    const { c, f } = this.celdaDe(x, y);
    const u = this.unidades.find(u => u.c === c && u.f === f && !u.invisible && (u.bloquea || u.listo));
    if (!u) return false;
    const devuelve = u.listo ? Math.round(u.costo / 2) : u.costo;
    this.quitarUnidad(u); this.dinero += devuelve;
    this.aviso(t('bastion.vendido', { d: devuelve }), 1200); Audio_.recarga('tapa');
    return true;
  },
  // Reparar: lo construido y dañado vuelve a vida completa; cuesta el 75 % de lo que vale la parte rota
  // (un muro a media vida, $14). Si no alcanza, se arregla lo que se pueda pagar
  aReparar(c, f) { return this.unidades.find(u => u.c === c && u.f === f && !u.invisible && u.listo && u.vida < u.vidaMax - 0.5 && BASTION.unidades[u.tipo] && u.tipo !== 'soldado') || null; },
  costoReparar(u) { return Math.max(1, Math.ceil(BASTION.unidades[u.tipo].costo * (1 - u.vida / u.vidaMax) * BASTION.reparacion)); },
  reparar(c, f) {
    const u = this.aReparar(c, f);
    if (!u) { this.aviso(t('bastion.nadaQueReparar'), 1100); Audio_.vacio(); return false; }
    const costo = this.costoReparar(u), paga = Math.min(costo, this.dinero);
    if (paga <= 0) { this.aviso(t('bastion.sinDinero'), 1200); Audio_.vacio(); return false; }
    u.vida = paga >= costo ? u.vidaMax : u.vida + (u.vidaMax - u.vida) * paga / costo;
    this.dinero -= paga; this.reparaciones = (this.reparaciones || 0) + 1;
    this.aviso(t('bastion.reparado', { d: paga }), 1000); Audio_.recarga('cerrar');
    this.panelBastion();
    return true;
  },
  quitarUnidad(u, destruida) {
    this.unidades = this.unidades.filter(x => x !== u);
    if (u.tipo === 'bunker' && u.adentro) for (let k = 0; k < u.adentro; k++) {   // los de adentro salen
      this.unidades.push(this.nuevoSoldado(u.x - 10 + k * 6, u.y + 6, u.c, u.f));
    }
    for (const s of this.unidades) if (s.destinoBunker === u) s.destinoBunker = null;
    if (destruida) {
      this.explosiones.push(new Explosion(u.x, u.y - 10, u.tipo === 'soldado' ? 16 : 34));
      if (u.tipo === 'soldado') this.salpicar(u.x, u.y - 14, '#8b0f0f', 10, 3); else { this.salpicar(u.x, u.y - 10, '#7a7468', 16, 4); Audio_.explosion(); this.sacudida = 4; }
    }
    if (u.bloquea) this.rehacerCamino();
  },
  nuevoSoldado(x, y, c, f) {
    const U = BASTION.unidades.soldado;
    return { tipo: 'soldado', c, f, x, y, vida: U.vida, vidaMax: U.vida, listo: true, bloquea: false, costo: U.costo, enfriado: Math.random() * 0.4, fuego: 0, apunta: 0, fase: 0 };
  },

  // Cuartel y taller: forman de a uno; lo formado sale del campamento y va hasta su lugar
  formar(dt) {
    const B = BASTION, puerta = { x: B.baseX - 18, y: B.arriba + (this.filas * B.celda[1]) / 2 + 8 };
    for (const cola of [this.colaCuartel, this.colaTaller]) {
      const o = cola[0]; if (!o) continue;
      o.hecho = (o.hecho || 0) + dt;
      if (o.hecho < B.unidades[o.tipo].tiempo) continue;
      cola.shift();
      const destino = this.centroCelda(o.c, o.f);
      let u;
      if (o.tipo === 'soldado') { u = this.nuevoSoldado(puerta.x, puerta.y, o.c, o.f); u.destinoBunker = o.bunker; }
      else {
        const U = B.unidades.tanque;
        if (o.reserva) this.unidades = this.unidades.filter(x => x !== o.reserva);
        u = { tipo: 'tanque', c: o.c, f: o.f, x: puerta.x, y: puerta.y, vida: U.vida, vidaMax: U.vida, listo: true, bloquea: true, costo: U.costo, enfriado: 0, fuego: 0, apunta: 0, retroceso: 0 };
      }
      u.destino = destino; u.enCamino = true;
      this.unidades.push(u); if (u.bloquea) this.rehacerCamino();
      this.aviso(t('bastion.listo', { que: t('bastion.' + o.tipo) }), 1100);
      Audio_.recarga(o.tipo === 'tanque' ? 'tapa' : 'cerrojo');
    }
  },

  /* ---------- Oleadas ---------- */
  oleadas(dt) {
    const B = BASTION;
    if (this.enDescanso) {
      if (this.tiempoJugado >= this.descansoHasta) this.empezarOleada();
      return;
    }
    if (this.porAparecer > 0) {
      this.proximoZombie -= dt;
      if (this.proximoZombie <= 0) {
        this.proximoZombie = Math.max(0.35, 1.5 - this.ronda * 0.1) * (0.7 + Math.random() * 0.6);
        this.aparecerZombieBastion(this.porAparecer === 1 && this.ronda % 5 === 0 ? 'jefe' : this.tipoAlAzar());
        this.porAparecer--;
      }
    } else if (!this.zombies.some(z => z.estado !== 'muerto')) {
      const bono = 30 + 5 * this.ronda;
      this.dinero += bono; this.enDescanso = true; this.descansoHasta = this.tiempoJugado + B.descanso;
      this.avisoRonda(t('bastion.oleadaSuperada', { n: this.ronda }), t('bastion.bonus', { d: bono }), 2600); Audio_.rondaSuperada();
    }
  },
  empezarOleada() {
    this.ronda++; this.enDescanso = false;
    this.porAparecer = 8 + 4 * (this.ronda - 1) + Math.floor(Math.pow(this.ronda, 1.4));
    this.proximoZombie = 0.5;
    this.avisoRonda(t('bastion.ola', { n: this.ronda }), t('bastion.vienen', { n: this.porAparecer }), 2200); Audio_.sirena();
  },
  tipoAlAzar() {
    const n = this.ronda, r = Math.random();
    const corredor = n >= 3 ? Math.min(0.35, 0.1 + 0.03 * n) : 0, gordo = n >= 4 ? Math.min(0.25, 0.05 + 0.02 * n) : 0;
    return r < gordo ? 'gordo' : r < gordo + corredor ? 'corredor' : 'caminante';
  },
  aparecerZombieBastion(tipo) {
    const B = BASTION, Z = B.zombies[tipo];
    const filas = []; for (let f = 0; f < this.filas; f++) if (this.distBastion[f][this.cols - 1] < Infinity) filas.push(f);
    const f = filas[Math.floor(Math.random() * filas.length)] ?? 0, p = this.centroCelda(this.cols - 1, f);
    let z;
    if (tipo === 'jefe') z = zombieConEstilo(0, { id: 'coloso', torso: 'desnudo', camiseta: '#4fae2e', piernas: 'short', pantalon: '#363a5e', accesorio: 'pelo-revuelto', escala: [1, 1] }, this.dificultad);
    else z = new Zombie(0, tipo === 'corredor', this.dificultad);
    if (tipo === 'gordo') { z.estilo = VARIANTES_CAMINANTE.find(v => v.id === 'gordo'); z.colores.camiseta = variarColor(z.estilo.camiseta); }
    if (tipo === 'jefe') { z.piel = '#4fae2e'; z.grosorBrazos = 2; z.grosorPiernas = 1.6; z.jefe = true; }
    z.tipoBastion = tipo;
    z.escala = Z.escala * (tipo === 'jefe' ? 1 : (0.94 + Math.random() * 0.12));
    z.ancho = 26 * z.escala; z.alto = 64 * z.escala;
    z.x = B.baseX + this.cols * B.celda[0] + 14 + Math.random() * 20; z.y = z.ySuelo = p.y + (Math.random() - 0.5) * 10;
    z.vidaMax = z.vida = Math.max(1, Math.round(this.dificultad.vidaZombie * Z.vida * AJUSTE.vidaZombie * Math.pow(B.crecimientoVida, this.ronda - 1)));
    z.vel = Z.vel * this.dificultad.velocidad * AJUSTE.velocidadZombie * (0.9 + Math.random() * 0.2);
    z.impaciente = tipo !== 'caminante' && tipo !== 'corredor' || Math.random() < B.impacientes;
    z.desvio = (Math.random() - 0.5) * 12; z.direccion = -1; z.mordiscoEn = 0; z.trabado = 0; z.ultimaX = z.x;
    this.zombies.push(z);
  },

  /* ---------- Zombies: siguen el mapa de distancias, se amontonan en los huecos y muerden lo que tienen adelante ---------- */
  moverZombiesBastion(dt) {
    const B = BASTION, vivos = this.zombies.filter(z => z.estado !== 'muerto');
    for (const z of this.zombies) {
      z.ahora = this.ahora;
      if (z.estado === 'muerto') { if (z.muerte) z.moverCadaver(dt, this); else z.tiempoMuerto += dt; continue; }
      // ¿Algo propio adelante? Lo muerde
      const presa = this.unidades.find(u => !u.invisible && !u.enBunker && u.y - z.y < 20 && z.y - u.y < 20 && z.x - u.x > -6 && z.x - u.x < (u.bloquea ? 30 : 22) * (z.tipoBastion === 'jefe' ? 1.6 : 1));
      if (presa) {
        z.estado = 'ataca'; z.direccion = presa.x < z.x ? -1 : 1; z.fase += dt * 4;
        if (this.ahora >= z.mordiscoEn) { z.mordiscoEn = this.ahora + 900; presa.vida -= this.dificultad.danoMordida * AJUSTE.mordida * (z.tipoBastion === 'jefe' ? 3 : z.tipoBastion === 'gordo' ? 1.5 : 1); Audio_.zombieGolpea(); if (presa.vida <= 0) this.quitarUnidad(presa, true); }
        continue;
      }
      // Impacientes (un tercio de los comunes, todos los gordos y el coloso): si el laberinto los hace dar una vuelta
      // larga y tienen una construcción justo del lado del campamento, la rompen para acortar en vez de rodear
      const { c, f } = this.celdaDe(z.x, z.y);
      if (z.impaciente && this.dentro(c, f) && this.distBastion[f][c] > c + 4) {
        const atajo = this.unidades.find(u => u.bloquea && !u.invisible && u.c === c - 1 && u.f === f);
        if (atajo && Math.abs(atajo.y - z.y) < 16 && z.x - atajo.x < 34) {
          z.estado = 'ataca'; z.direccion = -1; z.fase += dt * 4;
          if (this.ahora >= z.mordiscoEn) { z.mordiscoEn = this.ahora + 900; atajo.vida -= this.dificultad.danoMordida * AJUSTE.mordida * (z.tipoBastion === 'jefe' ? 3 : z.tipoBastion === 'gordo' ? 1.5 : 1); Audio_.zombieGolpea(); if (atajo.vida <= 0) this.quitarUnidad(atajo, true); }
          continue;
        }
      }
      z.estado = 'camina'; z.direccion = -1;
      // Hacia la celda vecina más cerca del campamento
      let tx = B.baseX - 40, ty = z.y;
      if (c >= 0) {
        const cc = Math.min(c, this.cols - 1), ff = limitar(f, 0, this.filas - 1);
        let mejor = null, dm = this.dentro(cc, ff) ? this.distBastion[ff][cc] : Infinity;
        for (const [dc, df] of [[-1, 0], [0, -1], [0, 1], [1, 0], [-1, -1], [-1, 1]]) {
          const nc = cc + dc, nf = ff + df;
          if (!this.dentro(nc, nf) || this.distBastion[nf][nc] >= dm) continue;
          if (dc && df && (this.distBastion[ff][nc] === Infinity || this.distBastion[nf][cc] === Infinity)) continue;   // sin cortar esquinas
          dm = this.distBastion[nf][nc]; mejor = [nc, nf];
        }
        if (mejor) { const p = this.centroCelda(...mejor); tx = mejor[0] === 0 && cc === 0 ? B.baseX - 40 : p.x; ty = p.y + z.desvio * 0.5; }
        else if (cc === 0) { tx = B.baseX - 40; ty = this.centroCelda(0, ff).y; }
      }
      // Amontonamiento: cuantos más alrededor, más lento; y se empujan para no encimarse
      let cerca = 0, ex = 0, ey = 0;
      for (const o of vivos) {
        if (o === z) continue;
        const dx = z.x - o.x, dy = (z.y - o.y) * 1.6, d2 = dx * dx + dy * dy;
        if (d2 < 22 * 22 && d2 > 0.01) { cerca++; const d = Math.sqrt(d2); ex += dx / d * (22 - d); ey += dy / d * (22 - d) / 1.6; }
      }
      let vx = tx - z.x, vy = ty - z.y; const l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
      const v = z.vel / (1 + 0.32 * cerca) * (z.tipoBastion === 'corredor' ? 1 : 0.55 + Math.max(0, Math.sin(z.fase)) * 0.9);
      z.x += (vx * v + ex * 1.2) * dt; z.y += (vy * v + ey * 1.2) * dt;
      // No meterse en celdas bloqueadas (si lo empujaron, vuelve)
      const k = this.celdaDe(z.x, z.y);
      if (this.dentro(k.c, k.f) && this.distBastion[k.f][k.c] === Infinity) { z.x -= (vx * v + ex * 1.2) * dt; z.y -= (vy * v + ey * 1.2) * dt; }
      z.y = limitar(z.y, B.arriba + 10, B.arriba + this.filas * B.celda[1] + 6); z.ySuelo = z.y;
      z.fase += dt * (z.tipoBastion === 'corredor' ? 14 : 6);
      // Trabado más de 2 s sin avanzar: rompe lo que tenga al lado
      z.trabado = Math.abs(z.x - z.ultimaX) < 0.3 ? z.trabado + dt : 0; z.ultimaX = z.x;
      if (z.trabado > 2) {
        const traba = this.unidades.filter(u => u.bloquea && !u.invisible).sort((a, b) => Math.hypot(a.x - z.x, a.y - z.y) - Math.hypot(b.x - z.x, b.y - z.y))[0];
        if (traba && Math.hypot(traba.x - z.x, traba.y - z.y) < 50) { z.x = traba.x + 24; z.y = traba.y; }
      }
      // Llegó al campamento
      if (z.x < B.baseX - 30) {
        const dano = B.zombies[z.tipoBastion].dano;
        this.vidaBase = Math.max(0, this.vidaBase - dano); z.estado = 'muerto'; z.tiempoMuerto = 99;
        this.aviso(t('bastion.baseGolpeada'), 1200); this.sacudida = 6; Audio_.jugadorHerido();
        this.salpicar(B.baseX - 20, z.y - 10, '#8b0f0f', 8, 3);
        if (this.vidaBase <= 0 && !this.terminado) { this.terminado = true; this.resultado = 'invadido'; Audio_.jugadorMuere(); }
      }
      if (this.ahora >= (z.gemidoEn || 0)) { z.gemidoEn = this.ahora + 4000 + Math.random() * 9000; if (Math.random() < 0.3) Audio_.gemido(false, 300); }
    }
    this.zombies = this.zombies.filter(z => !z.terminado());
  },

  /* ---------- Lo propio: caminar a su lugar, construir y disparar ---------- */
  moverUnidades(dt) {
    const vivos = this.zombies.filter(z => z.estado !== 'muerto');
    for (const u of [...this.unidades]) {
      u.fuego = Math.max(0, (u.fuego || 0) - dt * 8); u.retroceso = Math.max(0, (u.retroceso || 0) - dt * 3);
      if (u.invisible) continue;
      if (!u.listo) {   // en obra
        const U = BASTION.unidades[u.tipo];
        u.obra += dt / U.tiempo; u.vida = Math.min(u.vidaMax, u.vida + u.vidaMax * 0.75 * dt / U.tiempo);
        if (u.obra >= 1) { u.listo = true; u.vida = u.vidaMax; this.construidas++; Audio_.recarga('cerrar'); }
        continue;
      }
      if (u.enCamino) {   // caminando (o manejando) hasta su lugar
        const vel = u.tipo === 'tanque' ? 38 : 62, dx = u.destino.x - u.x, dy = u.destino.y - u.y, d = Math.hypot(dx, dy);
        u.caminando = true; u.fase = (u.fase || 0) + dt * 10;
        if (d < 2) {
          u.enCamino = false; u.caminando = false; u.x = u.destino.x; u.y = u.destino.y;
          if (u.destinoBunker && this.unidades.includes(u.destinoBunker)) {
            const b = u.destinoBunker;
            if (b.listo && b.adentro < BASTION.unidades.bunker.capacidad) { b.adentro++; this.unidades = this.unidades.filter(x => x !== u); Audio_.recarga('cerrar'); continue; }
            u.esperaBunker = b;   // espera al lado a que lo terminen
          }
        } else { u.x += dx / d * Math.min(d, vel * dt); u.y += dy / d * Math.min(d, vel * dt); }
      }
      if (u.esperaBunker && u.esperaBunker.listo && u.esperaBunker.adentro < BASTION.unidades.bunker.capacidad && this.unidades.includes(u.esperaBunker)) {
        u.esperaBunker.adentro++; this.unidades = this.unidades.filter(x => x !== u); continue;
      }
      if (u.tipo === 'muro') continue;
      if (u.tipo === 'bunker' && !u.adentro) continue;
      // Disparar al zombie en alcance más cerca del campamento
      const U = BASTION.unidades[u.tipo];
      u.enfriado -= dt;
      const alcance = U.alcance, minimo = U.minimo || 0;
      let blanco = null, mejor = Infinity;
      for (const z of vivos) {
        const d = Math.hypot(z.x - u.x, (z.y - u.y) * 1.3);
        if (d > alcance || d < minimo) continue;
        const prioridad = z.x - (z.tipoBastion === 'jefe' ? 60 : 0);
        if (prioridad < mejor) { mejor = prioridad; blanco = z; }
      }
      if (!blanco) continue;
      u.apunta = limitar(Math.atan2((blanco.y - 20 * blanco.escala) - (u.y - 20), Math.max(20, blanco.x - u.x)), -0.5, 0.5);
      if (u.enfriado > 0) continue;
      const disparos = u.tipo === 'bunker' ? u.adentro : 1;
      u.enfriado = U.cadencia * (0.85 + Math.random() * 0.3) / (u.tipo === 'bunker' ? 1 : 1);
      u.fuego = 1;
      if (u.tipo === 'tanque') {
        u.retroceso = 1;
        this.balasBastion.push({ x: u.x + 34, y: u.y - 20, tx: blanco.x, ty: blanco.y - 6, t: 0, dur: Math.max(0.25, Math.hypot(blanco.x - u.x, blanco.y - u.y) / 520), dano: U.dano, radio: U.radio });
        this.explosiones.push(new Fogonazo(u.x + 36, u.y - 20, 1, 14, 'fuego')); Audio_.disparo('bazuca', 'tanque');
        continue;
      }
      for (let k = 0; k < disparos; k++) {
        const z = k === 0 ? blanco : (vivos.filter(o => Math.hypot(o.x - u.x, o.y - u.y) < alcance)[k] || blanco);
        z.recibirDano(U.dano, 1, ARMA_BASTION, this);
        const sale = u.tipo === 'bunker' ? { x: u.x - 9 + k * 6, y: u.y - 17 } : u.tipo === 'torreta' ? { x: u.x + 30, y: u.y - 12 } : { x: u.x + 20, y: u.y - 22 };
        this.trazos.push({ x0: sale.x, y0: sale.y, x1: z.x + (Math.random() - 0.5) * 4, y1: z.y - 22 * z.escala, t: 0.06 });
        if (u.tipo === 'bunker') { u.fuegoK = u.fuegoK || []; u.fuegoK[k] = 1; }
      }
      if (Math.random() < (u.tipo === 'torreta' ? 0.35 : 0.8)) Audio_.disparo(u.tipo === 'torreta' ? 'ametralladora' : 'rifle', u.tipo === 'torreta' ? 'm2' : 'm16');
    }
    for (const u of this.unidades) if (u.fuegoK) u.fuegoK = u.fuegoK.map(v => Math.max(0, v - dt * 8));
    // Proyectiles del tanque: vuelan en arco y explotan con daño en área
    for (const b of this.balasBastion) {
      b.t += dt;
      if (b.t >= b.dur) {
        b.fin = true;
        this.explosiones.push(new Explosion(b.tx, b.ty, b.radio)); this.sacudida = Math.max(this.sacudida, 4); Audio_.explosion();
        for (const z of this.zombies) if (z.estado !== 'muerto' && Math.hypot(z.x - b.tx, (z.y - b.ty) * 1.3) < b.radio) z.recibirDano(b.dano, z.x >= b.tx ? 1 : -1, ARMA_BASTION_TANQUE, this);
      }
    }
    this.balasBastion = this.balasBastion.filter(b => !b.fin);
    for (const tr of this.trazos) tr.t -= dt;
    this.trazos = this.trazos.filter(tr => tr.t > 0);
  },

  actualizarBastion(dt) {
    if (!this.balasBastion) this.balasBastion = [];
    this.oleadas(dt);
    this.formar(dt);
    this.moverZombiesBastion(dt);
    this.moverUnidades(dt);
    for (const x of this.explosiones) x.actualizar(dt);
    for (const p of this.particulas) p.actualizar(dt);
    this.explosiones = this.explosiones.filter(x => x.vivo); this.particulas = this.particulas.filter(p => p.vivo);
    this.sacudida = Math.max(0, this.sacudida - dt * 40);
    if (this.avisoHasta && this.ahora > this.avisoHasta) { this.hud.aviso.classList.remove('mostrar'); this.avisoHasta = 0; }
    if (this.avisoRondaHasta && this.ahora > this.avisoRondaHasta) { this.hud.avisoRonda.classList.remove('mostrar'); this.avisoRondaHasta = 0; }
    if ((this.ultimoPanel || 0) + 150 < this.ahora) { this.ultimoPanel = this.ahora; this.panelBastion(); }
  },

  /* ---------- Dibujo ---------- */
  dibujarBastion() {
    const ctx = this.ctx, B = BASTION, ms = this.ahora;
    ctx.setTransform(Lienzo.escala, 0, 0, Lienzo.escala, 0, 0);
    if (this.sacudida) ctx.translate((Math.random() - 0.5) * this.sacudida, (Math.random() - 0.5) * this.sacudida * 0.6);
    // Cielo y ciudad en ruinas al fondo
    const cielo = ctx.createLinearGradient(0, 0, 0, B.arriba);
    cielo.addColorStop(0, '#2a1f2e'); cielo.addColorStop(1, '#8a4a32');
    ctx.fillStyle = cielo; ctx.fillRect(-20, -20, ANCHO + 40, B.arriba + 20);
    for (let k = 0; k < 22; k++) { const x = k * (ANCHO / 20) - 20, h = 30 + azar(k, 71) * 70, w = 26 + azar(k, 72) * 30; ctx.fillStyle = k % 2 ? '#2a2328' : '#332a2e'; ctx.fillRect(x, B.arriba - 20 - h, w, h + 20); if (azar(k, 73) > 0.5) { ctx.fillStyle = '#1a1518'; ctx.fillRect(x + w * 0.6, B.arriba - 20 - h, w * 0.4, 8); } }
    for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(60,50,50,0.35)'; ctx.beginPath(); ctx.ellipse((k * 211 + ms * 0.004) % (ANCHO + 200) - 100, B.arriba - 70 - k * 9, 90, 24, 0, 0, Math.PI * 2); ctx.fill(); }   // humo
    // Campo
    const piso = ctx.createLinearGradient(0, B.arriba - 22, 0, ALTO);
    piso.addColorStop(0, '#4a4438'); piso.addColorStop(1, '#5e5546');
    ctx.fillStyle = piso; ctx.fillRect(-20, B.arriba - 22, ANCHO + 40, ALTO - B.arriba + 40);
    for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 3 ? 'rgba(30,26,20,0.18)' : 'rgba(120,110,90,0.15)'; ctx.beginPath(); ctx.ellipse(azar(k, 81) * ANCHO, B.arriba + azar(k, 82) * (ALTO - B.arriba), 6 + azar(k, 83) * 16, 2 + azar(k, 84) * 4, 0, 0, Math.PI * 2); ctx.fill(); }
    // Grilla: tenue siempre, marcada al construir
    ctx.strokeStyle = this.colocando ? 'rgba(255,230,170,0.16)' : 'rgba(255,230,170,0.05)'; ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) { const x = B.baseX + c * B.celda[0]; ctx.beginPath(); ctx.moveTo(x, B.arriba); ctx.lineTo(x, B.arriba + this.filas * B.celda[1]); ctx.stroke(); }
    for (let f = 0; f <= this.filas; f++) { const y = B.arriba + f * B.celda[1]; ctx.beginPath(); ctx.moveTo(B.baseX, y); ctx.lineTo(B.baseX + this.cols * B.celda[0], y); ctx.stroke(); }
    // Niebla de la derecha, por donde vienen
    const niebla = ctx.createLinearGradient(ANCHO - 90, 0, ANCHO, 0); niebla.addColorStop(0, 'rgba(40,36,40,0)'); niebla.addColorStop(1, 'rgba(40,36,40,0.7)');
    ctx.fillStyle = niebla; ctx.fillRect(ANCHO - 90, B.arriba - 22, 90, ALTO);
    this.dibujarCampamento(ctx);
    // Fantasma de lo que se va a poner
    if (this.colocando && this.puntero) {
      const { c, f } = this.celdaDe(this.puntero.x, this.puntero.y);
      if (this.dentro(c, f)) {
        const herr = this.colocando === 'vender' || this.colocando === 'reparar';
        const ok = this.colocando === 'vender' ? !!this.unidades.find(u => u.c === c && u.f === f && !u.invisible) : this.colocando === 'reparar' ? !!this.aReparar(c, f) : !this.motivoNoColocar(this.colocando, c, f);
        ctx.fillStyle = this.colocando === 'vender' ? 'rgba(255,190,80,0.25)' : this.colocando === 'reparar' ? (ok ? 'rgba(110,190,255,0.3)' : 'rgba(255,255,255,0.08)') : ok ? 'rgba(120,230,120,0.25)' : 'rgba(240,80,70,0.28)';
        ctx.fillRect(B.baseX + c * B.celda[0] + 1, B.arriba + f * B.celda[1] + 1, B.celda[0] - 2, B.celda[1] - 2);
        if (herr && this.colocando === 'reparar' && ok) {   // cuánto cuesta arreglar lo que está abajo del puntero
          const u = this.aReparar(c, f), p = this.centroCelda(c, f);
          ctx.fillStyle = this.dinero >= this.costoReparar(u) ? '#bfe3ff' : '#ff9a8a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$' + this.costoReparar(u), p.x, p.y - 30);
        }
        if (!herr) {
          const p = this.centroCelda(c, f), U = BASTION.unidades[this.colocando];
          if (U.alcance) { ctx.strokeStyle = 'rgba(255,230,170,0.35)'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.ellipse(p.x, p.y - 10, U.alcance, U.alcance / 1.3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
          ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(p.x, p.y); this.dibujarUnidad(ctx, { tipo: this.colocando, listo: true, vida: 1, vidaMax: 1, apunta: 0, adentro: 0 }); ctx.restore();
        }
      }
    }
    // Todo lo que hay en el campo, de atrás hacia adelante
    const cosas = [];
    for (const u of this.unidades) if (!u.invisible) cosas.push([u.y, () => { ctx.save(); ctx.translate(u.x, u.y); this.dibujarUnidad(ctx, u); ctx.restore(); }]);
    for (const z of this.zombies) cosas.push([z.y, () => z.dibujar(ctx, 0, ms)]);
    cosas.sort((a, b) => a[0] - b[0]);
    Pincel.bisel = !Lienzo.liviano && this.zombies.length <= 25;   // con muchos zombies se aliviana el dibujo
    for (const [, d] of cosas) d();
    Pincel.bisel = !Lienzo.liviano;
    // Lugares reservados (soldados y tanques en formación): un cartel con la cuenta
    for (const o of [...this.colaCuartel, ...this.colaTaller]) {
      const p = this.centroCelda(o.c, o.f);
      ctx.strokeStyle = 'rgba(255,230,170,0.5)'; ctx.setLineDash([3, 3]); ctx.strokeRect(p.x - 18, p.y - 24, 36, 26); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,230,170,0.8)'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('bastion.' + o.tipo), p.x, p.y - 8);
    }
    // Barras de vida de lo dañado y de las obras
    for (const u of this.unidades) {
      if (u.invisible) continue;
      const lleno = u.listo ? u.vida / u.vidaMax : u.obra;
      if (u.listo && lleno >= 0.999) continue;
      const w = u.tipo === 'soldado' ? 18 : 30;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(u.x - w / 2 - 1, u.y + 4, w + 2, 4);
      ctx.fillStyle = !u.listo ? '#e8c45a' : lleno > 0.5 ? '#6ad06a' : lleno > 0.25 ? '#e8c45a' : '#e05a4a'; ctx.fillRect(u.x - w / 2, u.y + 5, w * lleno, 2);
    }
    for (const z of this.zombies) if (z.estado !== 'muerto' && z.vida < z.vidaMax) { const w = 16 * Math.max(1, z.escala * 1.6); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(z.x - w / 2, z.y - 70 * z.escala - 6, w, 3); ctx.fillStyle = '#c0392b'; ctx.fillRect(z.x - w / 2, z.y - 70 * z.escala - 6, w * z.vida / z.vidaMax, 3); }
    // Trazadoras, proyectiles del tanque, explosiones y partículas
    for (const tr of this.trazos) { ctx.strokeStyle = `rgba(255,230,150,${tr.t / 0.06})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tr.x0, tr.y0); ctx.lineTo(tr.x1, tr.y1); ctx.stroke(); }
    for (const b of this.balasBastion) {
      const f = b.t / b.dur, x = b.x + (b.tx - b.x) * f, y = b.y + (b.ty - b.y) * f - Math.sin(f * Math.PI) * 40;
      ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    for (const x of this.explosiones) x.dibujar(ctx, 0);
    for (const p of this.particulas) p.dibujar(ctx, 0);
    const v = ctx.createRadialGradient(ANCHO / 2, ALTO / 2, ALTO * 0.5, ANCHO / 2, ALTO / 2, ALTO);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, ANCHO, ALTO);
  },
  dibujarUnidad(ctx, u) {
    const ms = this.ahora;
    if (!u.listo) {   // obra: lo que se está levantando, a medio hacer, con el andamio encima
      ctx.save(); ctx.beginPath(); ctx.rect(-30, -60 * (u.obra || 0), 60, 70); ctx.clip();
      ctx.globalAlpha *= 0.85; (DibujoBastion[u.tipo] || DibujoBastion.muro)(ctx, u, ms); ctx.restore();
      DibujoBastion.obra(ctx, u.obra, ms); return;
    }
    if (u.tipo === 'soldado') DibujoBastion.soldado(ctx, u, ms); else DibujoBastion[u.tipo](ctx, u, ms);
  },
  dibujarCampamento(ctx) {
    const B = BASTION, alto = this.filas * B.celda[1], y0 = B.arriba, x = B.baseX;
    // Patio del campamento
    ctx.fillStyle = '#3d3a30'; ctx.fillRect(0, y0 - 20, x - 6, alto + 40);
    // Carpas, el cuartel y el taller
    const carpa = (cx, cy, col) => { pieza(ctx, poli([[cx - 18, cy], [cx, cy - 20], [cx + 18, cy]]), col, cx - 18, cx + 18); detalle(ctx, '#1a1814', poli([[cx - 4, cy], [cx, cy - 9], [cx + 4, cy]])); };
    carpa(36, y0 + 40, '#5a6040'); carpa(70, y0 + 74, '#4e5638');
    pieza(ctx, redondo(14, y0 + alto - 120, 70, 40, 4), '#6e6a5e', 14, 84); detalle(ctx, '#2a2824', c => c.rect(38, y0 + alto - 100, 22, 20));
    ctx.fillStyle = '#e8dcc0'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('bastion.cuartel'), 49, y0 + alto - 106);
    pieza(ctx, redondo(10, y0 + alto - 60, 80, 44, 4), '#5c5a50', 10, 90); detalle(ctx, '#262420', c => c.rect(30, y0 + alto - 44, 40, 28));
    ctx.fillStyle = '#e8dcc0'; ctx.fillText(t('bastion.taller'), 50, y0 + alto - 48);
    // Avance de lo que se forma (sobre el cuartel y el taller)
    for (const [cola, yb] of [[this.colaCuartel, y0 + alto - 126], [this.colaTaller, y0 + alto - 66]]) {
      const o = cola[0]; if (!o) continue;
      const f = Math.min(1, (o.hecho || 0) / B.unidades[o.tipo].tiempo);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(16, yb, 66, 5); ctx.fillStyle = '#ffd27a'; ctx.fillRect(17, yb + 1, 64 * f, 3);
      if (cola.length > 1) { ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('+' + (cola.length - 1), 90, yb + 5); }
    }
    // Bandera y empalizada con la puerta
    linea(ctx, '#3a3226', 1.6, [[20, y0 + 10], [20, y0 - 30]]); pieza(ctx, poli([[20, y0 - 30], [44, y0 - 24 + Math.sin(this.ahora / 300) * 2], [20, y0 - 18]]), '#3a6fb0', 20, 44);
    for (let y = y0 - 14; y < y0 + alto + 14; y += 9) pieza(ctx, redondo(x - 12, y, 10, 10, 3), (y / 9) % 2 > 1 ? '#7a5a36' : '#6a4e2e', x - 12, x - 2);
    const golpe = 1 - this.vidaBase / BASTION.vidaBase;
    if (golpe > 0) { ctx.fillStyle = `rgba(160,20,20,${golpe * 0.25})`; ctx.fillRect(0, y0 - 20, x, alto + 40); }
  },

  /* ---------- Panel de abajo (botones) y arriba (dinero, oleada, base) ---------- */
  panelBastion() {
    const panel = document.getElementById('panel-bastion'); if (!panel) return;
    const B = BASTION;
    document.getElementById('bastion-dinero').textContent = '$ ' + this.dinero;
    document.getElementById('bastion-ola').textContent = t('bastion.ola', { n: Math.max(1, this.ronda) });
    const base = document.getElementById('bastion-base');
    base.textContent = t('bastion.base', { v: this.vidaBase, max: B.vidaBase }); base.classList.toggle('peligro', this.vidaBase <= B.vidaBase * 0.3);
    for (const b of panel.querySelectorAll('[data-unidad]')) {
      const tipo = b.dataset.unidad, U = B.unidades[tipo];
      b.classList.toggle('elegida', this.colocando === tipo);
      if (!U) continue;
      b.querySelector('small').textContent = `$${U.costo} · ${U.tiempo} s`;
      b.classList.toggle('caro', this.dinero < U.costo);
      const cola = U.donde === 'cuartel' ? this.colaCuartel : U.donde === 'taller' ? this.colaTaller : null;
      const enCola = cola ? cola.filter(o => o.tipo === tipo).length : 0;
      b.querySelector('.cola').textContent = enCola ? t('bastion.cola', { n: enCola }) : '';
      const avance = cola && cola[0] && cola[0].tipo === tipo ? Math.min(1, cola[0].hecho / U.tiempo) : 0;
      b.querySelector('.avance').style.width = Math.round(avance * 100) + '%';
    }
    for (const b of panel.querySelectorAll('[data-velocidad]')) b.classList.toggle('elegida', +b.dataset.velocidad === this.velocidad);
    const ola = document.getElementById('bastion-oleada');
    if (this.enDescanso) { ola.disabled = false; ola.textContent = t('bastion.proxima', { n: this.ronda + 1, s: Math.max(0, Math.ceil(this.descansoHasta - this.tiempoJugado)) }); }
    else { ola.disabled = true; ola.textContent = t('bastion.enCurso', { n: this.ronda, q: this.porAparecer + this.zombies.filter(z => z.estado !== 'muerto').length }); }
  },
  cambiarVelocidad(v) { this.velocidad = v; this.panelBastion(); },
  oleadaYa() { if (this.enDescanso) { this.dinero += Math.max(0, Math.round((this.descansoHasta - this.tiempoJugado) * BASTION.adelantoPorSegundo)); this.descansoHasta = this.tiempoJugado; } },   // adelantarla paga por segundo ahorrado

  // Puntero sobre el lienzo (x, y en coordenadas del juego); boton: 0 izquierdo, 2 derecho
  punteroBastion(x, y, tipo, boton) {
    this.puntero = { x, y };
    if (tipo !== 'down' || this.terminado) return;
    if (boton === 2) { if (!this.cancelarColocacion()) this.vender(x, y); return; }
    if (!this.colocando) return;
    const { c, f } = this.celdaDe(x, y);
    if (!this.dentro(c, f)) return;
    if (this.colocando === 'vender') { this.vender(x, y); return; }
    if (this.colocando === 'reparar') { this.reparar(c, f); return; }
    this.colocar(c, f);
  },
  teclaBastion(codigo) {
    const n = /^(Digit|Numpad)([1-7])$/.exec(codigo);
    if (n) { const tipo = n[2] === '6' ? 'vender' : n[2] === '7' ? 'reparar' : Object.keys(BASTION.unidades).find(k => BASTION.unidades[k].tecla === +n[2]); if (tipo) this.elegirUnidad(tipo); return true; }
    if (codigo === 'Space' || codigo === 'Enter') { this.oleadaYa(); return true; }
    if (codigo === 'KeyV') { const v = [1, 2, 5, 10]; this.cambiarVelocidad(v[(v.indexOf(this.velocidad) + 1) % v.length]); return true; }   // V: siguiente velocidad
    return false;
  },
});

// Botones del panel (se enganchan una sola vez)
document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('panel-bastion'); if (!panel) return;
  panel.addEventListener('click', e => {
    const juego = window.ZonaMuerta && ZonaMuerta.juego(); if (!juego || !juego.estrategia) return;
    const b = e.target.closest('[data-unidad]'); if (b) { juego.elegirUnidad(b.dataset.unidad); return; }
    if (e.target.closest('#bastion-oleada')) juego.oleadaYa();
    const v = e.target.closest('[data-velocidad]'); if (v) juego.cambiarVelocidad(+v.dataset.velocidad);
  });
});
