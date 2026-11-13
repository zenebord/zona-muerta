/* ===== Último bastión v2: los zombies ven, cazan y contagian =====
 * Versión de prueba del diseño nuevo (nivel 1: La granja), al lado del modo de siempre, que no cambia. Se juega
 * sobre la misma grilla, con la misma cámara y el mismo campamento. Lo que cambia:
 *   - Los zombies se comportan como zombies. Cada uno mira (radio de vista según el tipo), caza al primer humano
 *     que ve, rompe lo que lo protege y, si no ve a nadie, marcha al campamento por el camino abierto.
 *       común     ve a 3 celdas; va por su presa por el camino si es corto y, si no, derecho, rompiendo lo que la tapa
 *       corredor  ve a 4; rodea buscando el hueco y nunca rompe (si no hay hueco, sigue de largo)
 *       gordo     ve a 2; nunca rodea: va derecho y rompe toda construcción que encuentre. Aplasta el alambrado
 *       coloso    jefe de las oleadas 5 y 10; como el gordo
 *   - Cuenta como humano el soldado a pie, la torreta (por su artillero) y el búnker con gente adentro. Muros y
 *     alambrado no atraen. El señuelo es un imán sin gente: llama a los que no están cazando.
 *   - Contagio: el soldado que cae se levanta a los 3 s como soldado zombie (casco y chaleco: blindaje 1).
 *   - Unidades nuevas: alambrado (no bloquea; frena al 45 % y a cada zombie que lo cruza le saca hasta un quinto de
 *     la vida; aguanta unas 20 pisadas y el gordo lo aplasta) y señuelo (un altavoz: comunes y corredores a 5 celdas
 *     dejan lo que estaban haciendo, también de morder, y se quedan 5 s golpeándolo; a cada zombie lo engaña una sola
 *     vez y aguanta a unos 20). La torreta rota deja a su artillero a pie. El tanque no está en este nivel.
 *   - Terreno por clase: en el barro sólo van soldados, alambrado y señuelo; el estanque es agua profunda (nadie
 *     pasa ni construye).
 *   - Oleadas escritas (no sorteadas) y parte de la próxima oleada durante el descanso. Vender devuelve 75 % en el
 *     descanso y 50 % con la oleada en marcha.
 *   - La partida se guarda al empezar cada oleada, aparte de la del modo de siempre. Si se pierde, se puede repetir
 *     esa oleada con todo como estaba al empezarla (y el descanso previo para cambiar lo que haga falta).
 *   - El búnker cuesta menos y los de adentro tiran más seguido: es el ancla que aguanta, no la que más pega.
 * Cuelga de Juego con this.v2: envuelve los métodos de js/estrategia.js y deja el modo anterior intacto.
 * El dibujo de lo nuevo, la pantalla previa y los textos: js/bastion-v2-ui.js.
 */
BASTION.unidades.alambrado = { costo: 15, tiempo: 1.5, vida: 40, donde: 'obra', frena: 0.45, raspa: 0.2, liviano: true };   // raspa: parte de la vida que le saca a cada zombie que lo cruza
BASTION.unidades.senuelo = { costo: 50, tiempo: 2, vida: 100, donde: 'obra', atrae: 5, entretiene: 5, liviano: true };
BASTION.zombies.soldadoZombie = { vida: 1.5, vel: 24, paga: 8, dano: 1, escala: 0.6 };

const BASTION2 = {
  // Lo que cambia de las unidades de siempre mientras se juega la v2
  ajustes: { bunker: { costo: 120, cadencia: 0.45 } },
  celda: 44,            // una celda de vista o de alcance, en px del plano
  contagio: 3,          // segundos entre que cae un soldado y se levanta en contra
  desgaste: 2,          // vida que le saca al alambrado cada zombie que lo pisa (aguanta 20 pisadas; el gordo lo aplasta)
  topeRaspado: 0.5,     // el alambrado lastima pero no mata solo: entre todos le sacan hasta la mitad de la vida
  vender: { descanso: 0.75, oleada: 0.5 },
  orden: ['soldado', 'torreta', 'bunker', 'muro', 'alambrado', 'senuelo'],   // botones del panel, teclas 1 a 6
  // vista: en celdas. llega: 'derecho' (va por su presa y rompe lo que la tapa), 'rodea' (busca el hueco; nunca
  // rompe) o 'rompe' (nunca rodea). aplasta: gasta el alambrado de una pisada
  zombies: {
    caminante:     { vista: 3, llega: 'derecho' },
    corredor:      { vista: 4, llega: 'rodea' },
    gordo:         { vista: 2, llega: 'rompe', aplasta: true },
    jefe:          { vista: 3, llega: 'rompe', aplasta: true },
    soldadoZombie: { vista: 3, llega: 'derecho', blindaje: 1 },
  },
  // Cada oleada dice cuántos de cada tipo; el orden en que salen lo arma ordenOleada (siempre igual)
  // Lo que paga cada zombie muerto (un poco menos que en el modo de siempre: acá la horda se frena contra la defensa)
  paga: { caminante: 5, corredor: 6, gordo: 12, jefe: 72, soldadoZombie: 6 },
  niveles: {
    granja: {
      dinero: 200, vida: 1,
      oleadas: [
        { caminante: 12 },
        { caminante: 18 },
        { caminante: 21, corredor: 5 },
        { caminante: 23, corredor: 7, gordo: 4 },
        { caminante: 26, corredor: 10, gordo: 5, jefe: 1 },
        { caminante: 32, corredor: 12, gordo: 8 },
        { caminante: 36, corredor: 14, gordo: 10 },
        { caminante: 40, corredor: 17, gordo: 13 },
        { caminante: 44, corredor: 20, gordo: 16 },
        { caminante: 48, corredor: 22, gordo: 18, jefe: 1 },
      ],
    },
  },
};
const ARMA_ALAMBRE = { categoria: 'cuerpo', fuego: true };   // raspa de a poco: sin destello ni empujón en cada cuadro
const ESTILO_SOLDADO_ZOMBIE = { id: 'soldado-zombie', torso: 'chaleco', sinBandas: true, cartucheras: true, camiseta: '#5d6248', chaleco: '#9a8262', piernas: 'largo', pantalon: '#7c7a5e', accesorio: 'casco-soldado', escala: [1.02, 1.08] };
const ESTILO_COLOSO = { id: 'coloso', torso: 'desnudo', camiseta: '#4fae2e', piernas: 'short', pantalon: '#363a5e', accesorio: 'pelo-revuelto', escala: [1, 1] };

/* ---------- Partida guardada, récord y pantalla de fin (aparte del modo de siempre) ---------- */
const BastionV2 = {
  PARTIDA: 'zonaMuerta.bastion2.partida', GANADO: 'zonaMuerta.bastion2.ganado',
  partida() { return ProgresoBastion.leer(this.PARTIDA, null); },
  borrar() { ProgresoBastion.escribir(this.PARTIDA, null); },
  // Orden en que sale una oleada: los comunes parejos, los corredores en dos tandas, los gordos en la segunda mitad
  // y el jefe al final. Sin azar: la misma oleada sale siempre igual
  ordenOleada(def) {
    const puestos = [], poner = (tipo, f) => puestos.push([f, tipo]);
    const n = tipo => def[tipo] || 0;
    for (let k = 0; k < n('caminante'); k++) poner('caminante', (k + 0.5) / n('caminante'));
    for (let k = 0; k < n('gordo'); k++) poner('gordo', 0.4 + 0.6 * (k + 0.5) / n('gordo'));
    for (let k = 0; k < n('corredor'); k++) poner('corredor', (k < n('corredor') / 2 ? 0.3 : 0.72) + k * 0.0005);
    for (let k = 0; k < n('jefe'); k++) poner('jefe', 2 + k);
    return puestos.sort((a, b) => a[0] - b[0]).map(p => p[1]);
  },
  total(def) { return Object.values(def).reduce((s, v) => s + v, 0); },
  // Pone o saca los números de la v2 en las unidades compartidas con el modo de siempre
  ajustarUnidades(v2) {
    this.originales = this.originales || Object.fromEntries(Object.keys(BASTION2.ajustes).map(k => [k, { ...BASTION.unidades[k] }]));
    for (const k in BASTION2.ajustes) Object.assign(BASTION.unidades[k], this.originales[k], v2 ? BASTION2.ajustes[k] : {});
  },
  // Teclas de los botones del panel: en la v2 hay seis unidades (1 a 6), vender es 7 y reparar 8
  teclasDelPanel(v2) {
    const panel = document.getElementById('panel-bastion'); if (!panel) return;
    const orden = v2 ? [...BASTION2.orden, 'vender', 'reparar'] : ['soldado', 'torreta', 'bunker', 'tanque', 'muro', 'vender', 'reparar'];
    orden.forEach((tipo, i) => { const k = panel.querySelector(`[data-unidad="${tipo}"] kbd`); if (k) k.textContent = String(i + 1); });
  },
  // Texto de la pantalla de fin: si se perdió, quiénes entraron al campamento y con qué se frena al que más entró
  fin(juego, v) {
    const nivel = t('bniv.' + juego.nivelBastion.id), total = BASTION2.niveles.granja.oleadas.length;
    if (juego.resultado === 'victoria') {
      return { titulo: t('fin.bastionGanado'), color: '#6ad06a',
        detalle: t('b2.finGanado', { nivel, olas: total, base: juego.vidaBase, max: BASTION.vidaBase, bajas: juego.bajas, contagiados: juego.contagiados, tiempo: v.tiempo }) };
    }
    const E = juego.entraron || {}, tipos = Object.keys(E).sort((a, b) => E[b] - E[a]);
    const lista = tipos.map(k => `${E[k]} × ${t('b2.z.' + k)}`).join(', ');
    return { titulo: t('fin.bastionTitulo'), color: '',
      detalle: t('b2.finPerdido', { nivel, ola: Math.max(1, juego.ronda), total, lista, contagiados: juego.contagiados, tiempo: v.tiempo }) + (tipos.length ? ' ' + t('b2.tip.' + tipos[0]) : '') };
  },
};

(() => {
  const P = Juego.prototype, v1 = {};
  const distPlano = (ax, ay, bx, by) => Math.hypot(ax - bx, (ay - by) * 1.3);   // en el plano la fila vale 1,3 (como los alcances)
  const VECINAS = [[-1, 0], [0, -1], [0, 1], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
  // Un método de la v1 pasa a elegir: en una partida v2 corre el nuevo; en las demás, el de siempre
  const envolver = (nombre, nuevo) => { v1[nombre] = P[nombre]; P[nombre] = function (...a) { return this.v2 ? nuevo.apply(this, a) : v1[nombre].apply(this, a); }; };

  /* ---------- Armar la partida ---------- */
  v1.prepararBastion = P.prepararBastion;
  P.prepararBastion = function () {
    this.v2 = !!(this.opcionesEstrategia && this.opcionesEstrategia.v2);
    document.body.classList.toggle('bastion-v2', this.v2);
    BastionV2.teclasDelPanel(this.v2); BastionV2.ajustarUnidades(this.v2);
    if (!this.v2) return v1.prepararBastion.call(this);
    const B = BASTION;
    Mundo.plano = true; Mundo.carriles = false; Mundo.perfil = null;
    this.cols = columnasBastion();
    this.filas = Math.floor((B.abajo - B.arriba) / B.celda[1]);
    this.vidaBase = B.vidaBase;
    this.unidades = []; this.colaCuartel = []; this.colaTaller = []; this.colaOleada = [];
    this.ronda = 0; this.porAparecer = 0; this.enDescanso = true; this.descansoHasta = B.primerDescanso; this.proximoZombie = 0;
    this.colocando = null; this.puntero = null; this.trazos = []; this.balasBastion = [];
    this.velocidad = 1; this.construidas = 0; this.contagiados = 0; this.entraron = {};
    this.camposLibres = new Map(); this.camposCrudos = new Map();
    this.prepararNivelBastion();   // escenario, terreno y obstáculos de La granja (js/bastion-niveles.js)
    this.nivelV2 = BASTION2.niveles[this.nivelBastion.id] || BASTION2.niveles.granja;
    this.dinero = this.nivelV2.dinero;
    // Lo que no deja pasar a nadie que camine, haya o no construcciones: obstáculos del mapa y agua profunda
    this.crudasV2 = new Set((this.obstaculos || []).map(o => o.c + ',' + o.f));
    for (let f = 0; f < this.filas; f++) for (let c = 0; c < this.cols; c++) if (this.terrenoEn(c, f) === 'agua') this.crudasV2.add(c + ',' + f);
    const guardada = this.opcionesEstrategia.continuar && BastionV2.partida();
    if (guardada) this.restaurarPartidaV2(guardada); else this.ejercitoInicial();
    this.rehacerCamino();
    document.getElementById('hud-aereo').classList.add('oculta');
    document.getElementById('panel-bastion').classList.remove('oculta');
    this.panelBastion();
  };

  envolver('alMorirZombie', function (zombie) { this.bajas++; this.dinero += BASTION2.paga[zombie.tipoBastion] ?? BASTION2.paga.caminante; });

  /* ---------- Caminos: el de siempre (libre), hacia una presa y «crudo» (como si no hubiera construcciones) ---------- */
  envolver('bloqueadas', function (extra) {
    const s = v1.bloqueadas.call(this, extra);
    for (const k of this.crudasV2) s.add(k);   // el estanque también corta el paso
    return s;
  });
  envolver('rehacerCamino', function () {
    this.bloqV2 = this.bloqueadas();
    this.distBastion = this.distancias(this.bloqV2);
    this.camposLibres.clear();
  });
  // Distancias por celda desde las fuentes, sin pisar las bloqueadas
  P.bfsV2 = function (fuentes, bloqueadas) {
    const d = Array.from({ length: this.filas }, () => new Array(this.cols).fill(Infinity)), cola = [];
    for (const [c, f] of fuentes) if (this.dentro(c, f) && !bloqueadas.has(c + ',' + f) && d[f][c] === Infinity) { d[f][c] = 1; cola.push([c, f]); }
    for (let i = 0; i < cola.length; i++) {
      const [c, f] = cola[i];
      for (const [dc, df] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nf = f + df;
        if (this.dentro(nc, nf) && d[nf][nc] === Infinity && !bloqueadas.has(nc + ',' + nf)) { d[nf][nc] = d[f][c] + 1; cola.push([nc, nf]); }
      }
    }
    return d;
  };
  // Hacia una celda por el camino abierto. Si la celda es una construcción (búnker, torreta), hasta sus vecinas
  P.campoLibre = function (c, f) {
    const k = c + ',' + f; let d = this.camposLibres.get(k);
    if (!d) { d = this.bfsV2(this.bloqV2.has(k) ? [[c + 1, f], [c - 1, f], [c, f + 1], [c, f - 1]] : [[c, f]], this.bloqV2); this.camposLibres.set(k, d); }
    return d;
  };
  // Hacia una celda (o hacia el campamento) en línea lo más recta posible: sólo estorban los obstáculos del mapa
  P.campoCrudo = function (c, f) {
    const k = c + ',' + f; let d = this.camposCrudos.get(k);
    if (!d) { d = this.bfsV2([[c, f]], this.crudasV2); this.camposCrudos.set(k, d); }
    return d;
  };
  P.campoCrudoBase = function () {
    let d = this.camposCrudos.get('base');
    if (!d) { d = this.bfsV2(Array.from({ length: this.filas }, (_, f) => [0, f]), this.crudasV2); this.camposCrudos.set('base', d); }
    return d;
  };
  // La celda vecina que más acerca (sin cortar esquinas); null si ya no hay ninguna mejor
  P.siguienteCeldaV2 = function (c, f, campo, crudo) {
    let mejor = null, dm = campo[f][c];
    for (const [dc, df] of VECINAS) {
      const nc = c + dc, nf = f + df;
      if (!this.dentro(nc, nf) || !(campo[nf][nc] < dm)) continue;
      if (dc && df) {
        if (campo[f][nc] === Infinity || campo[nf][c] === Infinity) continue;
        if (crudo && (this.bloqV2.has(nc + ',' + f) || this.bloqV2.has(c + ',' + nf))) continue;
      }
      dm = campo[nf][nc]; mejor = [nc, nf];
    }
    return mejor;
  };

  /* ---------- Colocar y vender ---------- */
  envolver('motivoNoColocar', function (tipo, c, f) {
    const U = BASTION.unidades[tipo];
    if (!this.dentro(c, f)) return 'bastion.fuera';
    if (this.obstaculoEn(c, f)) return 'bastion.obstaculo';
    const suelo = this.terrenoEn(c, f);
    if (suelo === 'agua') return 'bastion.agua';
    if (suelo === 'barro' && tipo !== 'soldado' && !U.liviano) return 'b2.blando';   // en el barro: sólo gente a pie, alambrado y señuelo
    if (this.dinero < U.costo) return 'bastion.sinDinero';
    const ocupa = this.ocupadaPor(c, f);
    const suelta = this.unidades.find(u => !u.bloquea && !u.invisible && u.c === c && u.f === f && (u.tipo !== 'soldado' || u.listo));   // alambrado, señuelo, un caído o un soldado en su puesto
    if (tipo === 'soldado') {
      if (ocupa) return ocupa.tipo !== 'bunker' ? 'bastion.ocupado' : ocupa.adentro + this.vanAlBunker(ocupa) >= BASTION.unidades.bunker.capacidad ? 'bastion.lleno' : null;
      return suelta && suelta.tipo !== 'soldado' ? 'bastion.ocupado' : null;
    }
    if (ocupa || suelta) return 'bastion.ocupado';
    if (this.zombies.some(z => { if (z.estado === 'muerto') return false; const k = this.celdaDe(z.x, z.y); return k.c === c && k.f === f; })) return 'bastion.ocupado';
    if (!U.liviano) {   // lo que bloquea no puede cerrar del todo el paso al campamento
      const d = this.distancias(this.bloqueadas(c + ',' + f));
      if (!d.some(fila => fila[this.cols - 1] < Infinity)) return 'bastion.bloquea';
    }
    return null;
  });
  envolver('colocar', function (c, f) {
    const tipo = this.colocando, U = BASTION.unidades[tipo];
    if (!U || !U.liviano) return v1.colocar.call(this, c, f);   // lo de siempre (valida con las reglas de la v2)
    const motivo = this.motivoNoColocar(tipo, c, f);
    if (motivo) { this.aviso(t(motivo), 1400); Audio_.vacio(); return false; }
    this.dinero -= U.costo;
    const p = this.centroCelda(c, f);   // alambrado y señuelo se arman en el lugar y no cierran el paso
    this.unidades.push({ tipo, c, f, x: p.x, y: p.y, vida: U.vida * 0.25, vidaMax: U.vida, listo: false, obra: 0, bloquea: false, costo: U.costo, enfriado: 0, fuego: 0, apunta: 0, adentro: 0 });
    Audio_.recarga('cartucho');
    this.panelBastion();
    return true;
  });
  envolver('vender', function (x, y) {
    const { c, f } = this.celdaDe(x, y);
    const u = this.unidades.find(u => u.c === c && u.f === f && !u.invisible && u.tipo !== 'caido' && (u.bloquea || u.listo || BASTION.unidades[u.tipo].liviano));
    if (!u) return false;
    const devuelve = u.listo ? Math.round(u.costo * (this.enDescanso ? BASTION2.vender.descanso : BASTION2.vender.oleada)) : u.costo;
    this.quitarUnidad(u); this.dinero += devuelve;
    this.aviso(t('bastion.vendido', { d: devuelve }), 1200); Audio_.recarga('tapa');
    return true;
  });
  envolver('quitarUnidad', function (u, destruida) {
    u.quitada = true;   // los zombies que la tenían de presa la sueltan
    v1.quitarUnidad.call(this, u, destruida);
  });
  // Lo que un zombie termina de romper o de matar
  P.perderUnidadV2 = function (u) {
    if (u.tipo === 'soldado') {   // cae y queda contagiado: a los 3 s se levanta en contra
      u.quitada = true; this.unidades = this.unidades.filter(x => x !== u);
      this.unidades.push({ tipo: 'caido', c: u.c, f: u.f, x: u.x, y: u.y, vida: 1, vidaMax: 1, listo: true, bloquea: false, costo: 0, t: 0 });
      this.salpicar(u.x, u.y - 14, '#8b0f0f', 12, 3, u.y);
      this.contagiados++; this.aviso(t('b2.contagiado'), 1500); Audio_.jugadorHerido();
      return;
    }
    if (u.tipo === 'alambrado' || u.tipo === 'senuelo') {   // sin estallido: se desarma
      this.quitarUnidad(u);
      this.salpicar(u.x, u.y - 8, u.tipo === 'senuelo' ? '#ffd27a' : '#9aa0a6', 10, 3, u.y);
      if (u.tipo === 'senuelo') { this.explosiones.push(new Explosion(u.x, u.y - 18, 12)); Audio_.recarga('tapa'); }
      return;
    }
    this.quitarUnidad(u, true);   // estalla; los que estaban en el búnker salen a pie
    if (u.tipo === 'torreta') {   // el artillero queda a pie, herido
      const s = this.nuevoSoldado(u.x - 4, u.y + 2, u.c, u.f); s.vida = s.vidaMax / 2;
      this.unidades.push(s);
    }
  };

  /* ---------- Oleadas escritas ---------- */
  envolver('oleadas', function (dt) {
    const B = BASTION, total = this.nivelV2.oleadas.length;
    if (this.terminado) return;
    if (this.enDescanso) { if (this.tiempoJugado >= this.descansoHasta) this.empezarOleadaV2(); return; }
    if (this.colaOleada.length) {
      this.proximoZombie -= dt;
      if (this.proximoZombie <= 0) {
        const tipo = this.colaOleada.shift(), sigue = this.colaOleada[0];
        this.aparecerZombieV2(tipo);
        const k = this.colaOleada.length;   // los corredores salen en tanda, pegados
        this.proximoZombie = Math.max(0.35, 1.5 - this.ronda * 0.1) * (tipo === 'corredor' && sigue === 'corredor' ? 0.45 : 1) * (0.8 + azar(k, this.ronda) * 0.4);
        this.porAparecer = k;
      }
    } else if (!this.zombies.some(z => z.estado !== 'muerto') && !this.unidades.some(u => u.tipo === 'caido')) {
      if (this.ronda >= total) {
        this.terminado = true; this.resultado = 'victoria';
        ProgresoBastion.escribir(BastionV2.GANADO, { base: this.vidaBase, dificultad: this.dificultad.id, fecha: Date.now() }); BastionV2.borrar();
        Audio_.rondaSuperada(); return;
      }
      const bono = 30 + 5 * this.ronda;
      this.dinero += bono; this.enDescanso = true; this.descansoHasta = this.tiempoJugado + B.descanso;
      this.avisoRonda(t('bastion.oleadaSuperada', { n: this.ronda }), t('bastion.bonus', { d: bono }), 2600); Audio_.rondaSuperada();
      this.guardarPartidaV2();
    }
  });
  P.empezarOleadaV2 = function () {
    this.guardarPartidaV2();   // la foto de cómo estaba todo al empezar la oleada: si se pierde, se repite desde acá
    this.ronda++; this.enDescanso = false; this.sinPremioPorAdelantar = false;
    this.colaOleada = BastionV2.ordenOleada(this.nivelV2.oleadas[this.ronda - 1]);
    this.porAparecer = this.colaOleada.length; this.proximoZombie = 0.5;
    this.avisoRonda(t('bastion.ola', { n: this.ronda }), t('bastion.vienen', { n: this.porAparecer }), 2200); Audio_.sirena();
  };
  // Vida, velocidad y forma de portarse de un zombie de la v2
  P.vestirZombieV2 = function (z, tipo) {
    const B = BASTION, Z = B.zombies[tipo];
    z.tipoBastion = tipo;
    z.escala = Z.escala * (tipo === 'jefe' ? 1 : 0.94 + Math.random() * 0.12);
    z.ancho = 26 * z.escala; z.alto = 64 * z.escala;
    z.vidaMax = z.vida = Math.max(1, Math.round(this.dificultad.vidaZombie * Z.vida * AJUSTE.vidaZombie * Math.pow(B.crecimientoVida, Math.max(1, this.ronda) - 1) * this.nivelV2.vida));
    z.vel = Z.vel * this.dificultad.velocidad * AJUSTE.velocidadZombie * (0.9 + Math.random() * 0.2);
    z.blindaje = BASTION2.zombies[tipo].blindaje || 0;
    z.desvio = (Math.random() - 0.5) * 12; z.direccion = -1; z.mordiscoEn = 0; z.presa = null; z.miraEn = 0;
    z.quietoEn = this.ahora + 1500; z.quietoX = 1e9; z.quietoY = 0;
  };
  P.aparecerZombieV2 = function (tipo) {
    const B = BASTION;
    const filas = []; for (let f = 0; f < this.filas; f++) if (this.distBastion[f][this.cols - 1] < Infinity) filas.push(f);
    const f = filas[Math.floor(Math.random() * filas.length)] ?? 0, p = this.centroCelda(this.cols - 1, f);
    let z;
    if (tipo === 'jefe') { z = zombieConEstilo(0, ESTILO_COLOSO, this.dificultad); z.piel = '#4fae2e'; z.grosorBrazos = 2; z.grosorPiernas = 1.6; z.jefe = true; }
    else z = new Zombie(0, tipo === 'corredor', this.dificultad);
    if (tipo === 'gordo') { z.estilo = VARIANTES_CAMINANTE.find(v => v.id === 'gordo'); z.colores.camiseta = variarColor(z.estilo.camiseta); }
    this.vestirZombieV2(z, tipo);
    z.x = B.baseX + this.cols * B.celda[0] + 14 + Math.random() * 20; z.y = z.ySuelo = p.y + (Math.random() - 0.5) * 10;
    this.zombies.push(z);
  };
  // El soldado caído se levanta en contra, con el uniforme puesto
  P.levantarContagiado = function (caido) {
    const z = zombieConEstilo(0, ESTILO_SOLDADO_ZOMBIE, this.dificultad);
    z.piel = '#8fa672';
    this.vestirZombieV2(z, 'soldadoZombie');
    z.x = caido.x; z.y = z.ySuelo = caido.y; z.cabezaAtras = -0.9; z.levanta = 0.7;
    this.zombies.push(z);
    Audio_.gemido(true, 120);
  };

  /* ---------- Zombies: miran, cazan, rompen lo que protege a su presa y, si no ven a nadie, marchan ---------- */
  // ¿A quién va? Si lo llama un señuelo (una sola vez en su vida, y no al gordo ni al jefe), deja lo que esté
  // haciendo y va; si no, al humano más cercano dentro de su vista
  P.mirarV2 = function (z, Z2, humanos, senuelos) {
    const ahora = this.ahora; let mejor = null, dm;
    if (!z.fueLlamado && !Z2.aplasta && senuelos.length) {
      dm = BASTION.unidades.senuelo.atrae * BASTION2.celda;
      for (const u of senuelos) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; mejor = u; } }
      if (mejor) { z.presa = mejor; z.fueLlamado = true; z.entretenido = 0; return; }
    }
    if (z.presa) return;   // sigue con la que tenía
    dm = Z2.vista * BASTION2.celda;
    for (const u of humanos) {
      if (z.inalcanzable && z.inalcanzable.get(u) > ahora) continue;
      const d = distPlano(z.x, z.y, u.x, u.y);
      if (d < dm) { dm = d; mejor = u; }
    }
    if (mejor) { z.presa = mejor; z.alerta = ahora + 900; }
  };
  P.alAlcanceV2 = function (z, u) {
    const k = z.tipoBastion === 'jefe' ? 1.5 : 1;
    if (u.bloquea) return Math.abs(z.x - u.x) < 36 * k && Math.abs(z.y - u.y) < 26 * k;   // pegado a la celda que ocupa
    return distPlano(z.x, z.y, u.x, u.y) < (u.tipo === 'soldado' ? 20 : 16) * k;
  };
  P.morderV2 = function (z, u, dt) {
    z.estado = 'ataca'; z.direccion = u.x < z.x ? -1 : 1; z.fase += dt * 4;
    if (this.ahora < z.mordiscoEn) return;
    z.mordiscoEn = this.ahora + 900;
    u.vida -= this.dificultad.danoMordida * AJUSTE.mordida * (z.tipoBastion === 'jefe' ? 3 : z.tipoBastion === 'gordo' ? 1.5 : 1);
    Audio_.zombieGolpea();
    if (u.vida <= 0) this.perderUnidadV2(u);
  };
  envolver('moverZombiesBastion', function (dt) {
    const B = BASTION, ahora = this.ahora, [W] = B.celda;
    const vivos = this.zombies.filter(z => z.estado !== 'muerto');
    const humanos = [], senuelos = [], alambres = new Map();
    for (const u of this.unidades) {
      if (!u.listo || u.invisible) continue;
      if (u.tipo === 'soldado' || u.tipo === 'torreta' || (u.tipo === 'bunker' && u.adentro > 0)) humanos.push(u);
      else if (u.tipo === 'senuelo') senuelos.push(u);
      else if (u.tipo === 'alambrado') alambres.set(u.c + ',' + u.f, u);
    }
    for (const z of this.zombies) {
      z.ahora = ahora;
      if (z.estado === 'muerto') { if (z.muerte) z.moverCadaver(dt, this); else z.tiempoMuerto += dt; continue; }
      if (z.cabezaAtras < 0) z.cabezaAtras = Math.min(0, z.cabezaAtras + dt * 1.4);
      if (z.levanta > 0) { z.levanta -= dt; z.estado = 'camina'; z.fase += dt * 2; continue; }   // recién contagiado: se incorpora
      const Z2 = BASTION2.zombies[z.tipoBastion] || BASTION2.zombies.caminante;
      // 1) Mira: suelta la presa que ya no está y busca otra
      if (z.presa && (z.presa.quitada || (z.presa.tipo === 'bunker' && !z.presa.adentro))) z.presa = null;
      if (ahora >= z.miraEn && (!z.presa || (!z.fueLlamado && senuelos.length))) { z.miraEn = ahora + 180 + Math.random() * 120; this.mirarV2(z, Z2, humanos, senuelos); }
      const { c, f } = this.celdaDe(z.x, z.y), cc = limitar(c, 0, this.cols - 1), ff = limitar(f, 0, this.filas - 1);
      const enojado = Z2.llega === 'rompe' || ahora < (z.furia || 0);   // va derecho, rompiendo
      // 2) Caza: si la alcanza, la muerde; si no, elige por dónde ir
      let campo = this.distBastion, crudo = false, u = z.presa;
      if (u && u.tipo === 'senuelo') {   // lo llama el altavoz: va, lo golpea unos segundos buscando a alguien y sigue viaje
        if (distPlano(z.x, z.y, u.x, u.y) < 26) {
          z.estado = 'ataca'; z.direccion = u.x < z.x ? -1 : 1; z.fase += dt * 3;
          z.entretenido = (z.entretenido || 0) + dt; u.vida -= dt * u.vidaMax / (20 * BASTION.unidades.senuelo.entretiene);   // aguanta a unos 20
          if (u.vida <= 0) this.perderUnidadV2(u);
          if (z.entretenido >= BASTION.unidades.senuelo.entretiene || u.quitada) z.presa = null;
          continue;
        }
      }
      if (u) {
        if (u.tipo !== 'senuelo' && this.alAlcanceV2(z, u)) { this.morderV2(z, u, dt); continue; }
        const k = u.enCamino ? this.celdaDe(u.x, u.y) : u, uc = limitar(k.c, 0, this.cols - 1), uf = limitar(k.f, 0, this.filas - 1);
        const libre = this.campoLibre(uc, uf), dl = libre[ff][cc];
        if (enojado) { campo = this.campoCrudo(uc, uf); crudo = true; }
        else if (dl < Infinity && (Z2.llega === 'rodea' || dl <= 2 * (Math.abs(cc - uc) + Math.abs(ff - uf)) + 5)) campo = libre;
        else if (Z2.llega === 'rodea') { (z.inalcanzable || (z.inalcanzable = new Map())).set(u, ahora + 4000); z.presa = u = null; }   // sin hueco: sigue de largo
        else { campo = this.campoCrudo(uc, uf); crudo = true; }   // está tapada: derecho, rompiendo lo que la tapa
      }
      if (!u && enojado) { campo = this.campoCrudoBase(); crudo = true; }
      // 3) Hacia la celda vecina que acerca. En el campo crudo, la que viene puede ser una construcción: la rompe
      let tx = B.baseX - 40, ty = z.y;
      if (c >= this.cols) { tx = B.baseX + this.cols * W - 12; }   // recién llega: entra al campo por su fila
      else {
        const sig = this.siguienteCeldaV2(cc, ff, campo, crudo);
        const traba = crudo && sig ? this.ocupadaPor(sig[0], sig[1]) : null;
        if (traba && !traba.invisible) {
          if (this.alAlcanceV2(z, traba)) { this.morderV2(z, traba, dt); continue; }
          tx = traba.x; ty = traba.y;
        } else if (sig) { const p = this.centroCelda(sig[0], sig[1]); tx = p.x; ty = p.y + z.desvio * 0.5; }
        else if (u) { tx = u.x; ty = u.y; }   // ya está al lado: derecho a la presa
        else if (cc > 0) { tx = z.x - 30; }   // quedó en un rincón sin salida: hacia el campamento igual
        else ty = this.centroCelda(0, ff).y;
      }
      z.estado = 'camina'; z.direccion = tx < z.x - 2 ? -1 : tx > z.x + 2 ? 1 : z.direccion;
      // Amontonamiento: cuantos más alrededor, más lento; y se empujan para no encimarse
      let cerca = 0, ex = 0, ey = 0;
      for (const o of vivos) {
        if (o === z || o.estado === 'muerto') continue;
        const dx = z.x - o.x, dy = (z.y - o.y) * 1.6, d2 = dx * dx + dy * dy;
        if (d2 < 22 * 22 && d2 > 0.01) { cerca++; const d = Math.sqrt(d2); ex += dx / d * (22 - d); ey += dy / d * (22 - d) / 1.6; }
      }
      // Alambrado: lo cruza a menos de la mitad de velocidad. Cada zombie que lo pisa lo gasta un poco (una vez por
      // alambrado); el gordo le saca la mitad de una pisada
      let paso = this.pasoTerreno(z.x, z.y);
      const alambre = alambres.get(c + ',' + f);
      if (alambre && !alambre.quitada) {
        paso *= BASTION.unidades.alambrado.frena;
        if (z.pisado !== alambre) { z.pisado = alambre; z.raspado = 0; alambre.vida -= Z2.aplasta ? alambre.vidaMax : BASTION2.desgaste; if (alambre.vida <= 0) this.perderUnidadV2(alambre); }
        if (!Z2.aplasta && z.raspado < z.vidaMax * BASTION.unidades.alambrado.raspa && (z.raspadoTotal || 0) < z.vidaMax * BASTION2.topeRaspado) {   // las púas: hasta un quinto de su vida por alambrado, y entre todos, la mitad
          const d = Math.min(z.vidaMax * 0.1 * dt, z.vidaMax * BASTION.unidades.alambrado.raspa - z.raspado);
          z.raspado += d; z.raspadoTotal = (z.raspadoTotal || 0) + d; z.recibirDano(d, 0, ARMA_ALAMBRE, this);
          if (Math.random() < dt * 2.5) this.salpicar(z.x, z.y - 8, z.colorSangre, 2, 2, z.ySuelo);
          if (z.estado === 'muerto') continue;
        }
      }
      if (Z2.aplasta) for (const su of senuelos) if (!su.quitada && su.c === c && su.f === f) this.perderUnidadV2(su);   // el gordo pisa el señuelo
      let vx = tx - z.x, vy = ty - z.y; const l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
      const v = z.vel / (1 + 0.32 * cerca) * (z.tipoBastion === 'corredor' ? 1 : 0.55 + Math.max(0, Math.sin(z.fase)) * 0.9) * paso;
      const mx = (vx * v + ex * 1.2) * dt, my = (vy * v + ey * 1.2) * dt;
      z.x += mx; z.y += my;
      // No meterse en celdas cerradas (si lo empujaron, vuelve)
      const k = this.celdaDe(z.x, z.y);
      if (this.dentro(k.c, k.f) && this.bloqV2.has(k.c + ',' + k.f)) { z.x -= mx; z.y -= my; }
      z.y = limitar(z.y, B.arriba + 10, B.arriba + this.filas * B.celda[1] + 6); z.ySuelo = z.y;
      z.fase += dt * (z.tipoBastion === 'corredor' ? 14 : 6);
      // Frenado mucho rato sin avanzar (amontonado contra un muro): se enoja y rompe lo que tenga adelante
      if (ahora >= z.quietoEn) {
        if (Math.hypot(z.x - z.quietoX, z.y - z.quietoY) < 5 && Z2.llega === 'derecho') z.furia = ahora + 3500;
        z.quietoEn = ahora + 1800; z.quietoX = z.x; z.quietoY = z.y;
      }
      // Llegó al campamento
      if (z.x < B.baseX - 30) {
        this.vidaBase = Math.max(0, this.vidaBase - B.zombies[z.tipoBastion].dano); z.estado = 'muerto'; z.tiempoMuerto = 99;
        this.entraron[z.tipoBastion] = (this.entraron[z.tipoBastion] || 0) + 1;
        this.aviso(t('bastion.baseGolpeada'), 1200); this.sacudida = 6; Audio_.jugadorHerido();
        this.salpicar(B.baseX - 20, z.y - 10, '#8b0f0f', 8, 3, z.y);
        if (this.vidaBase <= 0 && !this.terminado) { this.terminado = true; this.resultado = 'invadido'; Audio_.jugadorMuere(); }   // la partida guardada queda: se puede repetir la oleada
      }
      if (ahora >= (z.gemidoEn || 0)) { z.gemidoEn = ahora + 4000 + Math.random() * 9000; if (Math.random() < 0.3) Audio_.gemido(false, 300); }
    }
    this.zombies = this.zombies.filter(z => !z.terminado());
  });

  /* ---------- Lo propio: obras, soldados que van a su puesto, contagio y disparos (al zombie más cercano) ---------- */
  envolver('moverUnidades', function (dt) {
    const B = BASTION, vivos = this.zombies.filter(z => z.estado !== 'muerto');
    for (const u of [...this.unidades]) {
      u.fuego = Math.max(0, (u.fuego || 0) - dt * 8);
      if (u.invisible || u.quitada) continue;
      if (u.tipo === 'caido') {   // el contagio avanza: a los 3 s se levanta
        u.t += dt;
        if (u.t >= BASTION2.contagio) { u.quitada = true; this.unidades = this.unidades.filter(x => x !== u); this.levantarContagiado(u); }
        continue;
      }
      const U = B.unidades[u.tipo];
      if (!u.listo) {   // en obra
        u.obra += dt / U.tiempo; u.vida = Math.min(u.vidaMax, u.vida + u.vidaMax * 0.75 * dt / U.tiempo);
        if (u.obra >= 1) { u.listo = true; u.vida = u.vidaMax; this.construidas++; Audio_.recarga('cerrar'); }
        continue;
      }
      if (u.enCamino) {   // caminando hasta su lugar
        const dx = u.destino.x - u.x, dy = u.destino.y - u.y, d = Math.hypot(dx, dy);
        u.caminando = true; u.fase = (u.fase || 0) + dt * 10;
        if (d < 2) {
          u.enCamino = false; u.caminando = false; u.x = u.destino.x; u.y = u.destino.y;
          if (u.destinoBunker && this.unidades.includes(u.destinoBunker)) {
            const b = u.destinoBunker;
            if (b.listo && b.adentro < B.unidades.bunker.capacidad) { b.adentro++; u.quitada = true; this.unidades = this.unidades.filter(x => x !== u); Audio_.recarga('cerrar'); continue; }
            u.esperaBunker = b;   // espera al lado a que lo terminen
          }
        } else { u.x += dx / d * Math.min(d, 62 * dt); u.y += dy / d * Math.min(d, 62 * dt); }
      }
      if (u.esperaBunker && u.esperaBunker.listo && u.esperaBunker.adentro < B.unidades.bunker.capacidad && this.unidades.includes(u.esperaBunker)) {
        u.esperaBunker.adentro++; u.quitada = true; this.unidades = this.unidades.filter(x => x !== u); continue;
      }
      if (!U.alcance || (u.tipo === 'bunker' && !u.adentro)) continue;   // muro, alambrado, señuelo y búnker vacío no disparan
      u.enfriado -= dt;
      const enAlcance = [];
      for (const z of vivos) { if (z.estado === 'muerto') continue; const d = distPlano(z.x, z.y, u.x, u.y); if (d <= U.alcance) enAlcance.push([d, z]); }
      if (!enAlcance.length) continue;
      enAlcance.sort((a, b) => a[0] - b[0]);
      const blanco = enAlcance[0][1];
      if (u.tipo === 'soldado') u.mira = blanco.x < u.x - 4 ? -1 : 1;   // el soldado gira hacia el que tiene más cerca
      const lado = u.tipo === 'soldado' ? u.mira : 1;
      u.apunta = limitar(Math.atan2((blanco.y - 20 * blanco.escala) - (u.y - 20), Math.max(20, (blanco.x - u.x) * lado)), -0.5, 0.5);
      if (u.enfriado > 0) continue;
      const disparos = u.tipo === 'bunker' ? u.adentro : 1;
      u.enfriado = U.cadencia * (0.85 + Math.random() * 0.3);
      u.fuego = 1;
      for (let k = 0; k < disparos; k++) {
        const z = enAlcance[Math.min(k, enAlcance.length - 1)][1];
        if (z.estado === 'muerto') continue;
        z.recibirDano(Math.max(1, U.dano - (z.blindaje || 0)), z.x >= u.x ? 1 : -1, ARMA_BASTION, this);   // el blindaje le resta a cada bala
        const sale = u.tipo === 'bunker' ? { x: u.x - 9 + k * 6, y: u.y - 17 } : u.tipo === 'torreta' ? { x: u.x + 30, y: u.y - 12 } : { x: u.x + 20 * lado, y: u.y - 22 };
        this.trazos.push({ x0: sale.x, y0: sale.y, x1: z.x + (Math.random() - 0.5) * 4, y1: z.y - 22 * z.escala, b0: u.y, b1: z.y, t: 0.06 });
        if (u.tipo === 'bunker') { u.fuegoK = u.fuegoK || []; u.fuegoK[k] = 1; }
      }
      if (Math.random() < (u.tipo === 'torreta' ? 0.35 : 0.8)) Audio_.disparo(u.tipo === 'torreta' ? 'ametralladora' : 'rifle', u.tipo === 'torreta' ? 'm2' : 'm16');
    }
    for (const u of this.unidades) if (u.fuegoK) u.fuegoK = u.fuegoK.map(v => Math.max(0, v - dt * 8));
    for (const tr of this.trazos) tr.t -= dt;
    this.trazos = this.trazos.filter(tr => tr.t > 0);
  });

  /* ---------- Guardar y seguir ---------- */
  // Foto de la partida: todo lo construido y la gente, cada uno en su puesto (el soldado que está formándose o en
  // camino se guarda ya llegado: en su celda o dentro de su búnker)
  P.fotoV2 = function () {
    const B = BASTION, us = [], alBunker = new Map();
    const llega = (c, f, bunker) => { if (bunker && !bunker.quitada) alBunker.set(bunker, (alBunker.get(bunker) || 0) + 1); else us.push({ tipo: 'soldado', c, f, vida: B.unidades.soldado.vida, listo: true, obra: 1, adentro: 0 }); };
    for (const o of this.colaCuartel) llega(o.c, o.f, o.bunker);
    for (const u of this.unidades) {
      if (u.invisible || u.tipo === 'caido') continue;
      if (u.tipo === 'soldado' && (u.destinoBunker || u.esperaBunker)) { llega(u.c, u.f, u.destinoBunker || u.esperaBunker); continue; }
      us.push({ tipo: u.tipo, c: u.c, f: u.f, vida: Math.round(u.vida), listo: !!u.listo, obra: u.obra || 0, adentro: u.adentro || 0, de: u });
    }
    for (const s of us) { if (s.tipo === 'bunker') s.adentro = Math.min(B.unidades.bunker.capacidad, s.adentro + (alBunker.get(s.de) || 0)); delete s.de; }
    return { nivel: this.nivelBastion.id, dificultad: this.dificultad.id, ronda: this.ronda, dinero: this.dinero, vidaBase: this.vidaBase,
      bajas: this.bajas || 0, construidas: this.construidas || 0, contagiados: this.contagiados || 0, tiempo: Math.round(this.tiempoJugado), fecha: Date.now(), unidades: us };
  };
  P.guardarPartidaV2 = function () { if (!this.terminado) ProgresoBastion.escribir(BastionV2.PARTIDA, this.fotoV2()); };
  P.restaurarPartidaV2 = function (d) {
    const B = BASTION;
    this.unidades = [];
    for (const s of d.unidades) {
      const U = B.unidades[s.tipo]; if (!U || !this.dentro(s.c, s.f)) continue;
      const p = this.centroCelda(s.c, s.f);
      if (s.tipo === 'soldado') { const u = this.nuevoSoldado(p.x, p.y, s.c, s.f); u.vida = Math.min(U.vida, s.vida); this.unidades.push(u); continue; }
      this.unidades.push({ tipo: s.tipo, c: s.c, f: s.f, x: p.x, y: p.y, vida: Math.min(U.vida, s.vida), vidaMax: U.vida, listo: s.listo, obra: s.obra, bloquea: !U.liviano, costo: U.costo, enfriado: 0, fuego: 0, apunta: 0, adentro: Math.min(s.adentro || 0, U.capacidad || 0) });
    }
    this.ronda = d.ronda; this.dinero = d.dinero; this.vidaBase = d.vidaBase; this.bajas = d.bajas || 0; this.construidas = d.construidas || 0; this.contagiados = d.contagiados || 0;
    this.tiempoJugado = d.tiempo || 0; this.enDescanso = true; this.descansoHasta = this.tiempoJugado + B.descanso;
    this.sinPremioPorAdelantar = true;   // al repetir una oleada, adelantarla no vuelve a pagar (si no, perder a propósito daría plata)
  };
  envolver('oleadaYa', function () {
    if (this.enDescanso && this.sinPremioPorAdelantar) { this.descansoHasta = this.tiempoJugado; return; }
    v1.oleadaYa.call(this);
  });

  /* ---------- Panel, teclas y dibujo ---------- */
  envolver('panelBastion', function () {
    v1.panelBastion.call(this);
    const vender = document.querySelector('#panel-bastion [data-unidad="vender"] small');
    if (vender) vender.textContent = this.enDescanso ? '¾' : '½';
    if (typeof BastionV2UI !== 'undefined') BastionV2UI.parte(this);
  });
  envolver('teclaBastion', function (codigo) {
    const n = /^(Digit|Numpad)([1-8])$/.exec(codigo);
    if (n) { this.elegirUnidad([...BASTION2.orden, 'vender', 'reparar'][+n[2] - 1]); return true; }
    return v1.teclaBastion.call(this, codigo);   // espacio: oleada ya; V: velocidad
  });
  envolver('dibujarUnidad', function (ctx, u) {
    if (u.tipo === 'soldado' && u.mira === -1 && u.listo && !u.caminando) { ctx.save(); ctx.scale(-1, 1); v1.dibujarUnidad.call(this, ctx, u); ctx.restore(); return; }   // mira al que tiene a la espalda
    v1.dibujarUnidad.call(this, ctx, u);
  });
  envolver('dibujarBastion', function () {
    v1.dibujarBastion.call(this);
    if (typeof BastionV2UI !== 'undefined') BastionV2UI.encima(this);   // lo que va sobre la escena: vista, avisos de «te vi», celdas prohibidas
  });
})();
