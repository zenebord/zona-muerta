/* ===== Partida: estado, rondas, actualización y dibujo ===== */
class Juego {
  constructor(lienzo, mision, dificultad, opciones = {}) {
    this.ctx = lienzo.getContext('2d');
    this.dificultad = dificultad || DIFICULTADES.medio;
    this.pruebas = !!opciones.pruebas;    // campo de pruebas: planicie, sin rondas, todas las armas
    this.torreta = !!opciones.torreta;    // torreta: fijo en una M2, olas por los dos lados, cada una peor
    this.entrenamiento = !!opciones.entrenamiento;   // entrenamiento: polígono de tiro con blancos en movimiento
    this.ultra = !!opciones.ultra;        // defensa ultra: 4 carriles, el sector a la izquierda (js/defensa-ultra.js)
    this.estrategia = !!opciones.estrategia;   // último bastión: defensa con estrategia sobre una grilla (js/estrategia.js)
    // Mapa de la pelea infinita: la ciudad en ruinas o la cloaca (canal subterráneo con zombies tóxicos)
    this.mapa = opciones.mapa === 'cloaca' && !this.pruebas && !this.torreta && !this.entrenamiento && !this.ultra && !mision ? 'cloaca' : 'ciudad';
    this.cloaca = this.mapa === 'cloaca';
    Mundo.plano = this.pruebas || this.entrenamiento || this.cloaca || this.ultra;
    Mundo.carriles = this.ultra;   // la calle se pinta con carriles en vez de la doble amarilla
    Mundo.perfil = null;           // desniveles propios: solo en la historia (js/historia.js)
    Mundo.interior = this.entrenamiento || this.cloaca;   // el polígono y la cloaca son lugares cerrados
    Audio_.lugar(this.entrenamiento ? 'galpon' : this.cloaca ? 'cloaca' : 'aire');
    this.mision = mision ? new SeguimientoMision(mision) : null;
    this.jugador = new Jugador(600);
    this.zombies = []; this.proyectiles = []; this.explosiones = []; this.cajas = []; this.particulas = []; this.casquillos = [];
    this.escupitajos = []; this.charcos = [];   // ácido de los zombies tóxicos
    this.ametralladoras = new Map();          // índice de trozo → AmetralladoraFija
    this.especialesTomadas = new Map();       // índice de trozo → momento en que se agarró la caja especial
    this.ambiente = new Ambiente();
    this.camaraX = this.jugador.x - ANCHO / 2;
    this.sacudida = 0;
    this.ahora = 0; this.tiempoJugado = 0;
    this.bajas = 0;
    // Rondas: arranca con un respiro corto y después la ronda 1
    this.ronda = 0; this.porAparecer = 0; this.enDescanso = true; this.descansoHasta = 3;
    this.proximoZombie = 0; this.proximaCaja = 6;
    this.avisoHasta = 0; this.avisoRondaHasta = 0;
    this.terminado = false; this.resultado = null;   // muerto | mision-cumplida | mision-fallida
    this.tiempoMuerte = 0;
    this.entrada = { derecha: false, izquierda: false, abajo: false, saltarPulsado: false, disparar: false, dispararPulsado: false };
    this.hud = {
      vida: document.getElementById('vida-relleno'), vidaTexto: document.getElementById('vida-texto'),
      arma: document.getElementById('hud-arma'), mision: document.getElementById('hud-mision'),
      bajas: document.getElementById('hud-bajas'), tiempo: document.getElementById('hud-tiempo'),
      ronda: document.getElementById('hud-ronda'), dificultad: document.getElementById('hud-dificultad'),
      aviso: document.getElementById('aviso'), avisoRonda: document.getElementById('aviso-ronda'),
    };
    document.getElementById('hud-aereo').classList.toggle('oculta', !(this.torreta || this.ultra));   // el ataque aéreo es de las defensas
    this.textoModo = '';   // lo pone actualizarHud (cambia si se cambia el idioma en plena partida)
    if (this.torreta || this.ultra) {
      this.aereo = { listoEn: 0, activo: null, recarga: 20 };   // se puede pedir desde el arranque
      this.misiles = []; this.aviones = [];
      this.hud.aereo = document.getElementById('hud-aereo');
    }
    if (this.torreta) {
      const m2 = new AmetralladoraFija(this.jugador.x);
      this.ametralladoras.set('torreta', m2);
      this.jugador.montar(m2);
      this.camaraX = m2.x - ANCHO / 2;
      this.proximaCaja = Infinity;
    }
    this.proximoLatido = 0; this.proximoGemidoLejano = 6000;
    Audio_.ambiente(this.cloaca ? 0 : this.entrenamiento ? 0.012 : this.pruebas ? 0.04 : 0.07);   // viento de fondo (en el galpón, apenas el de afuera)
    Audio_.agua(this.cloaca ? 0.09 : 0);   // en la cloaca, el agua del canal
    this.proximaGota = 0;
    if (this.entrenamiento) {
      this.blancos = []; this.inicioX = this.jugador.x;
      let record = 0; try { record = parseInt(localStorage.getItem('zonaMuerta.recordEntrenamiento') || '0', 10) || 0; } catch { /* sin almacenamiento */ }
      this.ent = { serie: 1, porSerie: 15, aparecidos: 0, proximo: 0, entreSeries: 2.2, puntos: 0, disparos: 0, aciertos: 0, racha: 0, mejorRacha: 0,
        reacciones: [], record, serieActual: null, disparosAcertados: new Set(), alturaTiro: {} };
    }
    if (this.ultra) this.prepararUltra();
    if (opciones.historia) this.prepararHistoria(opciones.historia);
    if (this.estrategia) this.prepararBastion();
    if (this.pruebas || this.entrenamiento) {
      for (const id of ORDEN_INVENTARIO) this.jugador.recoger(id);
      for (const id of ARMAS_ESPECIALES) this.jugador.reserva[id] = 999;
      this.jugador.indiceArma = 0;
      this.descansoHasta = Infinity;     // nunca arranca una ronda
      this.proximaCaja = Infinity;
      this.generados = 0;
    }
  }

  /* ---------- Campo de pruebas ---------- */
  // Campo de pruebas: el arma elegida en el menú va directo a la mano, con el cargador lleno
  equiparArma(armaId) {
    const j = this.jugador;
    if (j.muerto) return;
    j.desmontar();
    j.recoger(armaId);                                   // si ya la tenía, le repone la munición
    if (ARMAS_ESPECIALES.includes(armaId)) j.reserva[armaId] = 999;
    j.indiceArma = j.inventario.indexOf(armaId);
    j.cancelarRecarga();
    j.ultimoDisparo = -1e9;                              // lista para tirar: no hereda la espera del arma anterior
    Audio_.recoger();
    this.aviso(t('aviso.enMano') + ARMAS[armaId].nombre.toUpperCase(), 1300);
  }

  ponerCaja(armaId) {
    const j = this.jugador;
    this.cajas.push(new Caja(j.x + j.direccion * 90, armaId, ARMAS_ESPECIALES.includes(armaId)));
    this.aviso(t('aviso.caja') + ARMAS[armaId].nombre.toUpperCase(), 1200);
  }
  ponerAmetralladora() {
    const j = this.jugador;
    this.ametralladoras.set('prueba-' + (this.generados++), new AmetralladoraFija(j.x + j.direccion * 110));
    this.aviso(t('aviso.m2Puesta'), 1600);
  }
  quitarAmetralladora() {
    const j = this.jugador;
    let mejor = null, distancia = Infinity;
    for (const [clave, a] of this.ametralladoras) { const d = Math.abs(a.x - j.x); if (d < distancia) { distancia = d; mejor = clave; } }
    if (mejor === null) return;
    if (j.montada === this.ametralladoras.get(mejor)) j.desmontar();
    this.ametralladoras.delete(mejor);
    this.aviso(t('aviso.m2Quitada'), 1200);
  }
  ponerZombiePrueba() {
    const j = this.jugador;
    const z = new Zombie(j.x + j.direccion * 220, false, this.dificultad);
    z.maniqui = true;   // se queda quieto y no muerde: solo recibe tiros
    this.zombies.push(z);
  }
  borrarGenerado() {
    this.jugador.desmontar();
    this.cajas = []; this.ametralladoras.clear(); this.zombies = []; this.casquillos = [];
    this.aviso(t('aviso.borrado'), 1200);
  }

  // Casquillos que caen del arma al abrirla (tambor del revólver, recámaras de la recortada)
  expulsarCasquillos(jugador, cuantos) {
    const p = jugador.puntoArma('cargador');
    const tipo = DIBUJO_ARMAS[jugador.arma().id].casquilloVaciado || 'bala';
    for (let k = 0; k < cuantos; k++) this.casquillos.push(new Casquillo(p.x + (Math.random() - 0.5) * 4, p.y, jugador.direccion, tipo, true));
  }

  /* ---------- Avisos ---------- */
  aviso(texto, duracion = 2000) {
    this.hud.aviso.textContent = texto;
    this.hud.aviso.classList.add('mostrar');
    this.avisoHasta = this.ahora + duracion;
  }
  avisoRonda(titulo, detalle, duracion = 2600) {
    this.hud.avisoRonda.innerHTML = `${titulo}<small>${detalle}</small>`;
    this.hud.avisoRonda.classList.add('mostrar');
    this.avisoRondaHasta = this.ahora + duracion;
  }

  salpicar(x, y, color, cantidad, fuerza) {
    for (let k = 0; k < cantidad; k++) {
      const a = Math.random() * Math.PI * 2, v = Math.random() * fuerza;
      this.particulas.push(new Particula(x, y, Math.cos(a) * v, Math.sin(a) * v - 1, color, 0.5 + Math.random() * 0.6, 2 + Math.random() * 3, true));
    }
  }

  /* ---------- Armas ---------- */
  dispararArma(arma, x, y, direccion, casquillo) {
    if (this.historia) this.historia.disparos++;
    const v = arma.velocidad;
    const antes = this.proyectiles.length;
    this.disparoId = (this.disparoId || 0) + 1;
    if (this.entrenamiento) {
      this.ent.disparos++; if (this.ent.serieActual) this.ent.serieActual.disparos++;
      // Altura real de la boca al tirar parado, por arma: los blancos bajos se ubican con eso
      const j = this.jugador, h = y - j.y - j.agachado * BAJA_AGACHADO, previa = this.ent.alturaTiro[arma.id];
      this.ent.alturaTiro[arma.id] = previa === undefined ? h : Math.max(previa, h);   // la más baja: el retroceso sube la boca
    }
    if (arma.categoria === 'escopeta') {
      for (let k = 0; k < arma.perdigones; k++) {
        const ang = (Math.random() - 0.5) * arma.dispersion;
        this.proyectiles.push(new Proyectil(arma, x, y, Math.cos(ang) * v * direccion, Math.sin(ang) * v));
      }
      this.sacudida = 6;
    } else if (arma.categoria === 'granada') {
      this.proyectiles.push(new Proyectil(arma, x, y - 10, v * direccion, -7));
    } else if (arma.categoria === 'lanzagranadas') {
      this.proyectiles.push(new Proyectil(arma, x, y, v * direccion, -3));
      this.sacudida = 4;
    } else if (arma.categoria === 'bazuca') {
      this.proyectiles.push(new Proyectil(arma, x, y, v * direccion, 0));
      this.sacudida = 7;
      // Fogonazo de gases por la cola del tubo: el arma no tiene casi retroceso porque los gases salen por atrás
      const cola = x - direccion * (arma.colaCm || 157) * CM;   // la cola del tubo (RPG-7 más corto)
      this.explosiones.push(new Fogonazo(cola, y, -direccion, 12, 'fuego'));
      for (let k = 0; k < 14; k++) this.particulas.push(new Particula(cola, y + (Math.random() - 0.5) * 6, -direccion * (2 + Math.random() * 4), (Math.random() - 0.6) * 1.6, k % 3 ? '#b1a89c' : '#ffcf6a', 0.5 + Math.random() * 0.6, 4 + Math.random() * 5, false));
    } else {
      const desvio = arma.categoria === 'metralleta' ? (Math.random() - 0.5) * 1.2 : arma.categoria === 'ametralladora' ? (Math.random() - 0.5) * 0.8 : 0;
      this.proyectiles.push(new Proyectil(arma, x, y, v * direccion, desvio));
      if (arma.categoria === 'rifle') this.sacudida = 3;
    }
    if (arma.categoria !== 'granada') {
      const tam = { pistola: 6, metralleta: 6.5, rifle: 9, escopeta: 10, ametralladora: 10, lanzagranadas: 8, laser: 6 }[arma.categoria] || 6;
      this.explosiones.push(new Fogonazo(x, y, direccion, tam * (0.85 + Math.random() * 0.3), arma.categoria === 'laser' ? 'laser' : 'fuego'));
    }
    for (let k = antes; k < this.proyectiles.length; k++) {
      const p = this.proyectiles[k];
      p.desdeX = this.jugador.x; p.disparoId = this.disparoId;   // barrido desde el cuerpo
      if (this.ultra) {   // la bala va por su carril, apuntada al pecho del zombie más cercano
        p.carril = this.jugador.carril; p.pisoY = this.jugador.y;
        if (!p.arma.explosivo) p.vy += this.apuntarUltra(p);
      }
    }
    // El casquillo sale por la ventana de expulsión, vuela, rebota y se esfuma
    if (casquillo) this.casquillos.push(new Casquillo(casquillo.x, casquillo.y, direccion, casquillo.tipo));
  }

  // Cargador vacío que el jugador tira al piso a mitad de la recarga
  soltarCargador(jugador, tipo = 'cargador', desde = null) {   // desde: dónde cae (la mano); si no, el pozo del cargador
    if (!tipo) return;
    const p = desde || jugador.puntoArma('cargador');
    this.casquillos.push(new Casquillo(p.x, p.y, jugador.direccion, tipo));
  }

  explotar(x, y, arma) {
    this.explosiones.push(new Explosion(x, y, arma.radio));
    this.salpicar(x, y, '#555', 14, 6);
    for (const z of this.zombies) {
      if (z.estado === 'muerto') continue;
      if (Math.hypot(z.x - x, (z.y - z.alto / 2) - y) < arma.radio) z.recibirDano(z.vidaMax, Math.sign(z.x - x) || 1, arma, this);
    }
    // Al jugador lo lastima solo si explota a menos de 1 m del cuerpo (60 px): de 10 (pegado) a 5 (a 1 m);
    // si cae justo encima, la mitad de la vida
    const j = this.jugador, dx = Math.max(0, Math.abs(j.x - x) - 8), dy = Math.max(0, (j.y - 56) - y, y - j.y), d = Math.hypot(dx, dy);
    if (d < 6) j.recibirDano(j.vidaMax / 2, this);
    else if (d < 60) j.recibirDano(Math.round(10 - 5 * (d - 6) / 54), this);
    this.sacudida = 12;
    Audio_.explosion();
  }

  alMorirZombie(zombie, arma) {
    this.bajas++;
    if (this.estrategia) this.dinero += (BASTION.zombies[zombie.tipoBastion] || BASTION.zombies.caminante).paga;
    if (this.ultra) this.cobrarZombieUltra(zombie);
    if (this.mision) this.mision.alMatar(arma);
  }

  alternarMontar() {
    const j = this.jugador;
    if (j.muerto || this.torreta || this.ultra) return;
    if (j.montada) { j.desmontar(); this.aviso(t('aviso.bajaste'), 1200); return; }
    for (const a of this.ametralladoras.values()) {
      if (a.cercaDe(j)) { j.montar(a); this.aviso(t('aviso.m2Montada'), 2200); return; }
    }
  }

  /* ---------- Mundo ---------- */
  prepararMontanas() {
    const desde = indiceTrozo(this.camaraX) - 1, hasta = indiceTrozo(this.camaraX + ANCHO) + 1;
    for (let i = desde; i <= hasta; i++) {
      const info = infoMontana(i);
      if (!info) continue;
      if (!this.ametralladoras.has(i)) this.ametralladoras.set(i, new AmetralladoraFija(info.ametralladoraX));
      if (!info.tieneCaja) continue;
      const tomada = this.especialesTomadas.get(i);
      const yaHay = this.cajas.some(c => c.especial && c.indiceMontana === i);
      if (!yaHay && (tomada === undefined || this.tiempoJugado - tomada > 90)) {
        const caja = new Caja(info.cajaX, info.armaEspecial, true);
        caja.indiceMontana = i;
        this.cajas.push(caja);
        this.especialesTomadas.delete(i);
      }
    }
  }

  /* ---------- Rondas ---------- */
  zombiesVivos() { return this.zombies.filter(z => z.estado !== 'muerto').length; }

  iniciarRonda() {
    this.ronda++;
    this.porAparecer = this.torreta || this.ultra ? this.zombiesDeOla(this.ronda) : Dificultad.zombiesDeRonda(this.dificultad, this.ronda);
    this.enDescanso = false;
    this.proximoZombie = 0.5;
    if (this.torreta || this.ultra) {
      const novedades = [this.ronda >= 2 ? t('ronda.rapidos') : '', this.ronda >= 3 ? t('ronda.corredores') : '', this.ronda >= 4 ? t('ronda.resistentes') : ''].filter(Boolean);
      this.avisoRonda(`${t('ronda.ola')} ${this.ronda}`, t('ronda.olaZombies', { n: this.porAparecer }) + (novedades.length ? ' · ' + novedades.join(', ') : ''));
    } else this.avisoRonda(`${t('ronda.ronda')} ${this.ronda}`, t('ronda.zombies', { n: this.porAparecer }) + (this.cloaca && this.ronda === 1 ? t('ronda.toxicos') : ''));
    Audio_.sirena();
  }

  terminarRonda() {
    this.enDescanso = true;
    this.descansoHasta = this.tiempoJugado + this.dificultad.descanso;
    const j = this.jugador;
    if (!j.muerto && j.vida < j.vidaMax) j.vida = Math.min(j.vidaMax, j.vida + 20);
    Audio_.rondaSuperada();
    if (this.ultra) this.soltarCajaUltra(true);   // al terminar cada ola, siempre cae un arma
    if (this.torreta || this.ultra) this.avisoRonda(t('ronda.olaSuperada'), t('ronda.olaLlega', { n: this.ronda + 1, s: this.dificultad.descanso }));
    else this.avisoRonda(t('ronda.superada'), t('ronda.llega', { n: this.ronda + 1, s: this.dificultad.descanso }));
  }

  /* ---------- Ataque aéreo (modo torreta) ----------
   * Siete misiles repartidos por la pantalla (ninguno sobre el parapeto); al terminar no queda ningún zombie a la vista.
   * Mientras dura, el tirador se agacha detrás de las bolsas de arena y no recibe daño. */
  pedirAtaqueAereo() {
    if (!this.aereo || this.terminado || this.jugador.muerto) return;
    const a = this.aereo;
    if (a.activo) return;
    if (this.historia) {   // en la historia, cada radio es un pedido
      if (a.cargas <= 0) { this.aviso(t('hist.aviso.sinRadio'), 1800); return; }
      a.cargas--; this.historia.aereos++;
    } else {
      if (this.tiempoJugado < a.listoEn) { this.aviso(t('aviso.aereoEn', { s: Math.ceil(a.listoEn - this.tiempoJugado) }), 1200); return; }
      a.listoEn = this.tiempoJugado + a.recarga;
    }
    a.activo = { t: 0, duracion: 3.4 };
    this.jugador.protegido = true;
    Audio_.radioAereo();
    this.aviso(t('aviso.aereo'), 2400);
    const centro = this.jugador.x;
    this.aviones.push(new Avion(this.camaraX * 0.4 - 120, 70, 1, 0.45), new Avion(this.camaraX * 0.4 - 220, 104, 1, 0.62));
    setTimeout(() => Audio_.avionPasa(), 450);
    const n = 7;
    for (let k = 0; k < n; k++) {
      let x = this.camaraX + (k + 0.5) * ANCHO / n + (Math.random() - 0.5) * 50;
      if (Math.abs(x - centro) < 75) x = centro + Math.sign(x - centro || 1) * 75;   // nunca encima del parapeto
      this.misiles.push(new Misil(x, 1.0 + k * 0.17 + Math.random() * 0.08, this));
    }
  }
  impactoMisil(x, y) {
    this.explosiones.push(new Explosion(x, y, 120));
    this.salpicar(x, y, '#5a5048', 22, 7); this.salpicar(x, y - 10, '#ffb327', 10, 5);
    const pseudoArma = { id: 'aereo', categoria: 'aereo', explosivo: true, dano: 999 };
    for (const z of this.zombies) if (z.estado !== 'muerto' && Math.abs(z.x - x) < 120) z.recibirDano(999, Math.sign(z.x - x) || 1, pseudoArma, this);
    this.sacudida = 16;
    Audio_.explosion();
  }
  actualizarAereo(dt) {
    for (const m of this.misiles) m.actualizar(dt);
    for (const v of this.aviones) v.actualizar(dt);
    this.misiles = this.misiles.filter(m => m.vivo); this.aviones = this.aviones.filter(v => v.vivo);
    const a = this.aereo.activo;
    if (!a) return;
    a.t += dt;
    if (a.t >= a.duracion) {
      // Remate: ningún zombie a la vista queda en pie
      const pseudoArma = { id: 'aereo', categoria: 'aereo', explosivo: true, dano: 999 };
      for (const z of this.zombies) if (z.estado !== 'muerto' && z.x > this.camaraX - 20 && z.x < this.camaraX + ANCHO + 20) z.recibirDano(999, 1, pseudoArma, this);
      this.aereo.activo = null;
      setTimeout(() => { if (this.jugador) this.jugador.protegido = false; }, 500);
    }
  }
  actualizarHudAereo() {
    const el = this.hud.aereo; if (!el) return;
    el.classList.remove('oculta');
    const a = this.aereo, falta = Math.max(0, a.listoEn - this.tiempoJugado);
    if (this.historia) {   // radios juntadas: cuántos pedidos le quedan
      const estado = a.activo ? 'en-curso' : a.cargas > 0 ? 'listo' : 'sin-radio', clave = estado + a.cargas;
      if (el.dataset.estado === clave) return;
      el.dataset.estado = clave;
      el.classList.toggle('listo', estado === 'listo'); el.classList.toggle('en-curso', estado === 'en-curso');
      const tecla = t(document.body.classList.contains('tactil') ? 'aereo.tocar' : 'aereo.tecla');
      const texto = estado === 'en-curso' ? t('aereo.curso') : estado === 'listo' ? t('hist.aereo.cargas', { n: a.cargas, tecla }) : t('hist.aereo.busca');
      el.innerHTML = `<span class="nombre">${t('aereo.nombre')}</span><span class="estado">${texto}</span><span class="barra" style="width:${a.cargas > 0 ? 100 : 0}%"></span>`;
      return;
    }
    const estado = a.activo ? 'en-curso' : falta <= 0 ? 'listo' : 'recargando';
    if (el.dataset.estado !== estado || estado === 'recargando') {
      el.dataset.estado = estado;
      el.classList.toggle('listo', estado === 'listo'); el.classList.toggle('en-curso', estado === 'en-curso');
      const tecla = t(document.body.classList.contains('tactil') ? 'aereo.tocar' : 'aereo.tecla');
      const texto = estado === 'listo' ? t('aereo.listo', { tecla }) : estado === 'en-curso' ? t('aereo.curso') : t('aereo.recargando', { s: Math.ceil(falta) });
      const avance = estado === 'recargando' ? Math.round((1 - falta / a.recarga) * 100) : 100;
      el.innerHTML = `<span class="nombre">${t('aereo.nombre')}</span><span class="estado">${texto}</span><span class="barra" style="width:${avance}%"></span>`;
    }
  }

  /* ---------- Entrenamiento: series de 15 blancos en movimiento ---------- */
  actualizarEntrenamiento(dt) {
    const E = this.ent;
    for (const b of this.blancos) b.actualizar(dt, this);
    this.blancos = this.blancos.filter(b => b.vivo);
    if (E.entreSeries > 0) { E.entreSeries -= dt; if (E.entreSeries <= 0) this.empezarSerie(); return; }
    if (E.aparecidos >= E.porSerie) { if (!this.blancos.length) this.terminarSerie(); return; }
    E.proximo -= dt;
    if (E.proximo <= 0) {
      this.nuevoBlanco();
      if (E.serie >= 3 && Math.random() < 0.25 && E.aparecidos < E.porSerie) this.nuevoBlanco();   // a veces de a dos
      E.proximo = Math.max(0.6, 1.7 - (E.serie - 1) * 0.15) * (0.75 + Math.random() * 0.5);
    }
  }
  empezarSerie() {
    const E = this.ent, n = E.serie;
    E.aparecidos = 0; E.proximo = 0.4;
    E.serieActual = { puntos: 0, disparos: 0, aciertos: 0, blancos: 0, reacciones: [] };
    const novedades = t('serie.nov' + Math.min(4, n));
    this.avisoRonda(t('serie.titulo', { n }), t('serie.blancos', { nov: novedades }), 2200);
  }
  terminarSerie() {
    const E = this.ent, S = E.serieActual;
    const precision = S.disparos ? Math.round(S.aciertos / S.disparos * 100) : 0;
    const reaccion = S.reacciones.length ? (S.reacciones.reduce((a, b) => a + b, 0) / S.reacciones.length).toFixed(2) : '–';
    const nuevo = S.puntos > E.record;
    if (nuevo) { E.record = S.puntos; try { localStorage.setItem('zonaMuerta.recordEntrenamiento', String(S.puntos)); } catch { /* ídem */ } }
    this.avisoRonda(t('serie.terminada', { n: E.serie }), t('serie.resumen', { puntos: S.puntos, blancos: S.blancos, precision, reaccion, nuevo, record: E.record }), 4200);
    Audio_.rondaSuperada();
    E.serie++; E.entreSeries = 4.6; E.serieActual = null;
  }
  // Altura de la boca (respecto de los pies) con el tirador parado y el arma actual. Al tirar, las armas al hombro
  // suben hasta 6 unidades sobre la posición de reposo; si todavía no disparó con esta arma, se estima.
  alturaTiroParado() {
    const j = this.jugador, id = j.arma().id;
    return this.ent.alturaTiro[id] ?? (j.puntoArma('boca').y - j.y - j.agachado * BAJA_AGACHADO - 4);
  }
  // Un blanco nuevo: tipo, lado, distancia y movimiento según la serie
  nuevoBlanco() {
    const E = this.ent, n = E.serie, j = this.jugador;
    const tipos = ['diana', 'diana', 'movil', 'bajo'];
    if (n >= 2) tipos.push('silueta', 'movil', 'silueta', 'bajo');
    if (n >= 3) tipos.push('alto', 'plato');
    if (n >= 4) tipos.push('movil', 'alto', 'plato');
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const lado = n >= 3 && Math.random() < 0.3 ? -1 : 1;
    // Siempre dentro de la pantalla (la cámara está centrada: ±480), con lugar para el riel
    let x = j.x + lado * (140 + Math.random() * 250);
    for (let k = 0; k < 10 && this.blancos.some(b => Math.abs(b.x - x) < 70); k++) x = j.x + lado * (140 + Math.random() * 250);
    const lineaTiro = alturaSuelo(x) - 56.5;                       // altura del cañón con el tirador parado
    const vida = Math.max(1.6, 3.6 - (n - 1) * 0.3);
    // Todo blanco se mueve: vaivén vertical (cruza la línea de tiro) y, si tiene riel, también de lado
    const oscila = { amp: Math.min(30, 7 + n * 4 + Math.random() * 5), frec: Math.min(4.5, 1.4 + n * 0.45 + Math.random() * 0.6), fase: Math.random() * Math.PI * 2 };
    const rielCorto = { riel: [x - 25 - n * 6, x + 25 + n * 6], vel: 0.35 + n * 0.12 };
    let b;
    switch (tipo) {
      case 'diana':   b = new Blanco('diana', x, lineaTiro + (Math.random() - 0.5) * 8, { vida, oscila, ...(n >= 2 ? rielCorto : {}) }); break;
      case 'silueta': b = new Blanco('silueta', x, lineaTiro, { vida: vida * 1.1, oscila: { ...oscila, amp: oscila.amp * 0.7 }, ...rielCorto }); break;
      case 'movil':   b = new Blanco('diana', x, lineaTiro, { r: 10, vida: vida * 1.3, mult: 1.5, oscila: { ...oscila, amp: oscila.amp * 0.8 }, riel: [x - 80, x + 80], vel: 1.0 + n * 0.3 }); break;
      // Bajo: queda por debajo de la boca del arma con el tirador parado; agachado (↓) le pega de frente
      case 'bajo':    b = new Blanco('diana', x, alturaSuelo(x) + this.alturaTiroParado() + BAJA_AGACHADO + 2, { r: 10, vida, mult: 1.5, bajo: true, oscila: { ...oscila, amp: Math.min(3, oscila.amp * 0.2) }, ...(n >= 3 ? rielCorto : {}) }); break;
      case 'alto':    b = new Blanco('diana', x, lineaTiro - 50 - Math.random() * 40, { r: 11, vida: vida * 1.3, mult: 2, alto: true, oscila: { ...oscila, amp: oscila.amp * 0.6 }, ...rielCorto }); break;
      case 'plato':   b = new Blanco('plato', j.x + lado * 500, alturaSuelo(j.x) - 30, { r: 5, mult: 2, vx: -lado * (3 + Math.random() * 1.5), vy: -(6 + Math.random() * 2.2) }); break;
    }
    E.aparecidos++;
    this.blancos.push(b);
  }
  blancoAcertado(b, res, disparoId) {
    const E = this.ent, S = E.serieActual;
    if (!E || b.cuenta) return;
    b.cuenta = true;
    const reaccion = b.arribaDesde !== null ? (this.ahora - b.arribaDesde) / 1000 : 1;
    const bono = Math.max(0, Math.round((1.6 - reaccion) * 3));         // reacción rápida: puntos extra
    const puntos = Math.round((res.puntos + bono) * b.mult);
    E.puntos += puntos; E.racha++; E.mejorRacha = Math.max(E.mejorRacha, E.racha); E.reacciones.push(reaccion);
    if (!E.disparosAcertados.has(disparoId)) { E.disparosAcertados.add(disparoId); E.aciertos++; if (S) S.aciertos++; }
    if (S) { S.puntos += puntos; S.blancos++; S.reacciones.push(reaccion); }
    const etiqueta = res.cabeza ? t('blanco.cabeza') : res.centro ? t('blanco.centro') : res.plato ? t('blanco.plato') : '';
    this.explosiones.push(new TextoFlotante(b.x, b.cy - b.r - 8, `+${puntos}${etiqueta}`, res.cabeza || res.centro || res.plato ? '#ffd27a' : '#f1e6d0'));
    Audio_.blanco(res.centro || res.cabeza ? 'acero' : res.plato ? 'plato' : 'papel');
  }
  blancoPerdido(b) {
    if (b.cuenta || !this.ent) return;
    b.cuenta = true; this.ent.racha = 0;
    this.explosiones.push(new TextoFlotante(b.x, b.cy - b.r - 8, t('blanco.fallado'), '#9a8f86'));
  }
  // Estacas con carteles cada 5 metros (1 m ≈ 44 unidades) a los dos lados del punto de partida
  dibujarDistancias(ctx, cam) {
    for (let k = -12; k <= 12; k++) {
      if (!k) continue;
      const x = this.inicioX + k * 220, sx = x - cam;
      if (sx < -30 || sx > ANCHO + 30) continue;
      const piso = alturaSuelo(x);
      // Pie metálico con cartel amarillo, como en un polígono
      ctx.fillStyle = '#2a2d31'; ctx.fillRect(sx - 7, piso - 1.5, 14, 2);
      ctx.fillStyle = '#5b6168'; ctx.fillRect(sx - 1.2, piso - 26, 2.4, 25);
      ctx.fillStyle = '#e2bf2f'; ctx.fillRect(sx - 11, piso - 34, 22, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx - 11, piso - 25, 22, 1);
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${Math.abs(k) * 5} m`, sx, piso - 26.5);
    }
  }

  /* ---------- Olas del modo torreta ---------- */
  zombiesDeOla(n) { const d = this.dificultad; return Math.max(1, Math.round((d.zombiesBase * 1.2 + (n - 1) * (d.zombiesPorRonda + 2.5)) * AJUSTE.cantidadZombies)); }
  // Cuánto empeora cada ola: velocidad, resistencia, corredores, ritmo de aparición y cuántos a la vez
  ajustesDeOla(n) {
    const d = this.dificultad;
    return {
      velocidad: Math.min(1.9, 1 + (n - 1) * 0.07),
      vida: n >= 4 ? 1 + (n - 3) * 0.15 : 1,                  // desde la cuarta ya no caen de un tiro de la M2
      corredores: n >= 2 ? Math.min(0.6, d.probCorredor + (n - 1) * 0.05) : 0,
      intervalo: Math.max(0.22, d.intervalo * (1 - (n - 1) * 0.07)),
      maxVivos: Math.min(70, d.maxVivos + n * 3),
    };
  }
  aparecerOla(dt) {
    const d = this.dificultad, ola = this.ajustesDeOla(this.ronda);
    this.proximoZombie -= dt;
    if (this.proximoZombie > 0 || this.zombiesVivos() >= ola.maxVivos) return;
    this.proximoZombie = ola.intervalo * (0.7 + Math.random() * 0.6);
    // Grupos por los dos costados a la vez; más grandes en las olas altas
    const grupo = Math.min(this.porAparecer, 1 + Math.floor(Math.random() * Math.min(5, 1 + this.ronda / 2)));
    for (let k = 0; k < grupo; k++) {
      const lado = k % 2 ? -1 : 1;
      const x = this.jugador.x + lado * (ANCHO / 2 + 60 + Math.random() * 260);
      const z = new Zombie(x, Math.random() < ola.corredores, d);
      z.velocidad *= ola.velocidad;
      z.vidaMax = z.vida = Math.max(1, Math.round(d.vidaZombie * ola.vida * AJUSTE.vidaZombie));
      this.zombies.push(z);
      this.porAparecer--;
    }
  }

  aparecerZombies(dt) {
    const d = this.dificultad;
    if (this.pruebas || this.entrenamiento) return;
    if (this.aereo && this.aereo.activo) return;   // mientras caen los misiles no entra nadie: la pantalla queda limpia
    if (this.historia) return this.aparecerZombiesHistoria(dt);
    if (this.ultra && !this.enDescanso && this.porAparecer > 0) return this.aparecerOlaUltra(dt);
    if (this.torreta && !this.enDescanso && this.porAparecer > 0) return this.aparecerOla(dt);
    if (this.enDescanso) { if (this.tiempoJugado >= this.descansoHasta) this.iniciarRonda(); return; }
    if (this.porAparecer <= 0) { if (this.zombiesVivos() === 0) this.terminarRonda(); return; }
    this.proximoZombie -= dt;
    if (this.proximoZombie > 0 || this.zombiesVivos() >= d.maxVivos) return;
    this.proximoZombie = d.intervalo * (0.7 + Math.random() * 0.6);
    const grupo = Math.min(this.porAparecer, 1 + Math.floor(Math.random() * Math.min(3, 1 + this.ronda / 3)));
    const lado = Math.random() < 0.5 ? -1 : 1;
    for (let k = 0; k < grupo; k++) {
      const x = this.camaraX + ANCHO / 2 + (grupo > 1 && k % 2 ? -lado : lado) * (ANCHO / 2 + 80 + Math.random() * 240);
      const corredor = this.ronda >= d.rondaCorredores && Math.random() < d.probCorredor;
      // En la cloaca se mezclan los tóxicos: uno de cada cinco al principio, hasta la mitad en las rondas altas
      const toxico = this.cloaca && Math.random() < Math.min(0.5, 0.2 + (this.ronda - 1) * 0.05);
      this.zombies.push(toxico ? new ZombieToxico(x, d) : new Zombie(x, corredor, d));
      this.porAparecer--;
    }
  }

  aparecerCajas(dt) {
    if (this.ultra) return this.cajasUltra(dt);
    if (this.pruebas || this.torreta || this.entrenamiento || this.historia) return;
    this.proximaCaja -= dt;
    if (this.proximaCaja > 0) return;
    this.proximaCaja = (10 + Math.random() * 6) / AJUSTE.cajas;
    if (this.cajas.filter(c => !c.especial).length >= 3) return;
    const j = this.jugador;
    let x = j.x + j.direccion * (350 + Math.random() * 400);
    if (esMontana(indiceTrozo(x))) x = (indiceTrozo(x) + j.direccion) * TAMANO_TROZO + 100;   // nunca sobre la montaña
    const faltantes = ARMAS_COMUNES.filter(id => !j.inventario.includes(id));
    const opciones = faltantes.length ? faltantes : ARMAS_COMUNES;
    this.cajas.push(new Caja(x, opciones[Math.floor(Math.random() * opciones.length)], false));
  }

  /* ---------- Actualización por cuadro ---------- */
  actualizar(dt) {
    if (this.estrategia) { this.ahora += dt * 1000; this.tiempoJugado += dt; this.actualizarBastion(dt); return; }
    if (this.enTienda) { this.actualizarHud(); return; }   // defensa ultra: con la tienda abierta, todo queda quieto
    this.ahora += dt * 1000;
    this.tiempoJugado += dt;
    const j = this.jugador, e = this.entrada;

    if (this.ultra) this.actualizarJugadorUltra(dt, e);
    else if (this.historia) this.moverJugadorHistoria(dt, e);   // escaleras, sogas y cuerpo a tierra (js/historia.js)
    else if (this.pruebas) j.actualizar(dt, { ...e, derecha: false, izquierda: false, saltarPulsado: false }, this);   // en la vitrina no camina ni salta
    else j.actualizar(dt, e, this);
    if (!j.muerto && !(j.aTierra && j.protegido) && !j.trepa && (e.dispararPulsado || (e.disparar && j.arma().automatica))) j.disparar(this);   // cuerpo a tierra no dispara
    e.dispararPulsado = false;

    this.prepararMontanas();
    this.aparecerZombies(dt);
    this.aparecerCajas(dt);

    for (const z of this.zombies) z.actualizar(dt, j, this);
    for (const p of this.proyectiles) p.actualizar(dt, this);
    for (const x of this.explosiones) x.actualizar(dt);
    for (const p of this.particulas) p.actualizar(dt);
    for (const c of this.casquillos) c.actualizar(dt);
    if (this.aereo) this.actualizarAereo(dt);
    if (this.ultra) for (const tt of this.torretas) tt.actualizar(dt, this);
    if (this.entrenamiento) this.actualizarEntrenamiento(dt);
    for (const e2 of this.escupitajos) e2.actualizar(dt, this);
    for (const c of this.charcos) c.actualizar(dt, this);
    if (this.cloaca && this.ahora >= this.proximaGota) { Audio_.gota(Math.random()); this.proximaGota = this.ahora + 400 + Math.random() * 1800; }
    for (const c of this.cajas) {
      c.actualizar(dt);
      if (!j.muerto && c.tocaA(j) && c.alRecoger) { c.alRecoger(this); c.vivo = false; }
      else if (!j.muerto && c.tocaA(j)) {
        const nueva = j.recoger(c.armaId), a = ARMAS[c.armaId];
        this.aviso(t(nueva ? 'aviso.nueva' : 'aviso.municion') + a.nombre.toUpperCase(), 1800);
        Audio_.recoger();
        if (this.mision) this.mision.alRecoger(a);
        if (c.especial) this.especialesTomadas.set(c.indiceMontana, this.tiempoJugado);
        if (this.historia && c.historia && nueva) this.historia.armas.push(c.armaId);
        c.vivo = false;
      }
      if (Math.abs(c.x - j.x) > 2600 && !c.especial && !c.historia) c.vivo = false;   // las cajas de la historia esperan en su lugar
    }

    // Zombies que el jugador dejó atrás (fuera de pantalla, del lado contrario a donde avanza): desaparecen y
    // reaparecen adelante, así no hay que volver a buscarlos. El que quedó lejísimos de cualquier lado, también.
    if (Math.abs(j.vx) > 0.5) this.avance = Math.sign(j.vx);
    const avance = this.avance || j.direccion;
    if (!this.torreta && !this.ultra) for (const z of this.zombies) {
      if (z.estado === 'muerto' || z.maniqui || z.dormido || z.jefe) continue;
      const dx = z.x - j.x, atras = Math.sign(dx) === -avance && Math.abs(dx) > ANCHO / 2 + 160;
      if (atras || Math.abs(dx) > 2600) {
        let nx = j.x + avance * (ANCHO / 2 + 80 + Math.random() * 220);
        if (Mundo.perfil && alturaSuelo(nx) > SUELO_BASE + 100) nx += avance * 340;   // nunca dentro de un precipicio
        z.x = nx; z.y = alturaSuelo(z.x);
      }
    }
    this.zombies = this.zombies.filter(z => !z.terminado());
    this.proyectiles = this.proyectiles.filter(p => p.vivo);
    this.explosiones = this.explosiones.filter(x => x.vivo);
    this.particulas = this.particulas.filter(p => p.vivo);
    this.casquillos = this.casquillos.filter(c => c.vivo);
    this.cajas = this.cajas.filter(c => c.vivo);
    this.escupitajos = this.escupitajos.filter(e2 => e2.vivo);
    this.charcos = this.charcos.filter(c => c.vivo);

    const objetivo = this.ultra ? j.x - ULTRA.tiradorX : this.torreta || this.entrenamiento ? j.x - ANCHO / 2 : j.x - ANCHO / 2 + j.direccion * 110;   // centrada: se ven los dos lados
    this.camaraX += (objetivo - this.camaraX) * Math.min(1, dt * 4);
    if (this.historia) this.actualizarHistoria();
    this.sacudida = Math.max(0, this.sacudida - dt * 40);
    this.destello = Math.max(0, (this.destello || 0) - dt);
    this.ambiente.actualizar(dt, this.camaraX);

    if (this.mision && !this.terminado) {
      this.mision.tick(dt);
      if (this.mision.estado === 'cumplida') { this.terminado = true; this.resultado = 'mision-cumplida'; ProgresoMisiones.marcar(this.mision.mision.id); Audio_.mision(); }
      else if (this.mision.estado === 'fallida') { this.terminado = true; this.resultado = 'mision-fallida'; }
    }
    if (j.muerto) { this.tiempoMuerte += dt; if (this.tiempoMuerte > 1.3 && !this.terminado) { this.terminado = true; this.resultado = 'muerto'; } }
    // Latido con poca vida y algún gemido lejano de fondo
    if (!j.muerto && j.vida < j.vidaMax * 0.3 && this.ahora >= this.proximoLatido) {
      const apuro = 1 - j.vida / (j.vidaMax * 0.3);
      Audio_.latido(0.6 + apuro * 0.4); this.proximoLatido = this.ahora + 950 - apuro * 350;
    }
    if (!this.pruebas && !this.entrenamiento && this.ahora >= this.proximoGemidoLejano) { Audio_.gemidoLejano(); this.proximoGemidoLejano = this.ahora + 7000 + Math.random() * 9000; }   // en el galpón y en pruebas no hay zombies
    // La música sube de capas con la cantidad de zombies vivos; en el descanso queda tranquila
    if (!this.pruebas && !this.entrenamiento) Musica.intensidad(j.muerto ? 0 : this.enDescanso ? 0.12 : Math.min(1, 0.3 + this.zombiesVivos() / 10));
    if (this.ahora > this.avisoHasta) this.hud.aviso.classList.remove('mostrar');
    if (this.ahora > this.avisoRondaHasta) this.hud.avisoRonda.classList.remove('mostrar');
    this.actualizarHud();
  }

  actualizarHud() {
    const j = this.jugador, h = this.hud, arma = j.arma();
    h.vida.style.width = (j.vida / j.vidaMax * 100) + '%';
    h.vidaTexto.textContent = Math.ceil(j.vida);
    document.body.classList.toggle('envenenado', j.veneno > 0);
    const reserva = j.montada ? '∞' : (j.reserva[arma.id] === undefined ? '∞' : j.reserva[arma.id]);
    const mun = j.municionActual();
    const vidaActual = this.torreta || this.ultra ? Math.round(this.dificultad.vidaZombie * this.ajustesDeOla(Math.max(1, this.ronda)).vida) : this.dificultad.vidaZombie;
    const tiros = disparosParaMatar(arma, vidaActual);
    const estado = j.recargando() ? `<span class="recargando">${t('hud.recargando')}</span>`
      : mun <= 0 ? `<span class="recargando">${t('hud.recargaS')}</span>` : '';
    const modo = this.entrenamiento ? t('hud.entrenamiento') : this.pruebas ? t('hud.pruebasModo') : (this.historia ? t('hist.hud.modo') : this.ultra ? t('hud.ultra') : this.torreta ? t('hud.torreta') : this.cloaca ? t('hud.cloaca') : '') + this.dificultad.nombre.toUpperCase();
    if (modo !== this.textoModo) { this.textoModo = modo; h.dificultad.textContent = modo; }
    if (arma.cuerpo && !j.montada) {
      h.arma.innerHTML = `${arma.nombre} <small>${t('hud.golpesPor', { n: tiros })}</small><br><span class="municion">${arma.legendaria ? '✦ ' + t('poder.' + arma.poder) : '⚔'}</span>` +
        `<br><small>${t('hud.armas', { n: j.inventario.length })} · ${t(document.body.classList.contains('tactil') ? 'hud.cambiaTactil' : 'hud.cambiaTeclado')}</small>`;
    } else h.arma.innerHTML = `${arma.nombre} <small>${t('hud.tiros', { n: tiros })}</small><br>` +
      `<span class="municion ${mun <= 0 ? 'vacio' : ''}">${mun}</span> / ${reserva} ${estado}` +
      (j.montada ? '' : `<br><small>${t('hud.armas', { n: j.inventario.length })} · ${t(document.body.classList.contains('tactil') ? 'hud.cambiaTactil' : 'hud.cambiaTeclado')}</small>`);
    h.bajas.textContent = '☠ ' + this.bajas;
    if (this.aereo) this.actualizarHudAereo();
    h.tiempo.textContent = formatearTiempo(this.tiempoJugado);
    const palabra = t(this.torreta || this.ultra ? 'ronda.ola' : 'ronda.ronda');
    if (this.pruebas) h.ronda.innerHTML = `${t('hud.pruebas')}<small>${t(document.body.classList.contains('tactil') ? 'hud.pruebasTactil' : 'hud.pruebasTeclado')}</small>`;
    else if (this.enDescanso) h.ronda.innerHTML = `${palabra} ${this.ronda + 1}<small>${t('hud.en', { s: Math.max(0, Math.ceil(this.descansoHasta - this.tiempoJugado)) })}</small>`;
    else h.ronda.innerHTML = `${palabra} ${this.ronda}<small>${t('hud.quedan', { n: this.porAparecer + this.zombiesVivos() })}</small>`;
    if (this.ultra) this.hudUltra();
    else if (this.historia) this.hudHistoria();
    else if (this.mision) {
      const m = this.mision, resto = m.tiempoRestante();
      h.mision.classList.add('activa');
      h.mision.innerHTML = `${m.mision.nombre} · <span class="progreso">${m.progresoTexto()}</span>` +
        (resto !== null ? ` · <span class="cuenta">⏱ ${formatearTiempo(resto)}</span>` : '');
    } else h.mision.classList.remove('activa');
    // Entrenamiento: va al final para pisar la ronda y el recuadro de misión con sus propios datos
    if (this.entrenamiento) {
      const E = this.ent, pct = E.disparos ? Math.round(E.aciertos / E.disparos * 100) : 0;
      const reac = E.reacciones.length ? (E.reacciones.reduce((a, b) => a + b, 0) / E.reacciones.length).toFixed(2) + ' s' : '–';
      h.bajas.textContent = '◎ ' + E.puntos;
      h.ronda.innerHTML = t('serie.titulo', { n: E.serie }) + `<small>${E.serieActual ? t('serie.hud', { n: Math.min(E.aparecidos, E.porSerie), total: E.porSerie }) : t('serie.arranca', { s: Math.max(0, Math.ceil(E.entreSeries)) })}</small>`;
      h.mision.classList.add('activa');
      h.mision.innerHTML = t('serie.estado', { puntos: E.puntos, pct, racha: E.racha, reac });
    }
  }

  /* ---------- Dibujo, de atrás hacia adelante ---------- */
  dibujar() {
    if (this.estrategia) return this.dibujarBastion();
    const ctx = this.ctx, j = this.jugador;
    ctx.setTransform(Lienzo.escala, 0, 0, Lienzo.escala, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    const cam = this.camaraX + (this.sacudida ? (Math.random() - 0.5) * this.sacudida : 0);
    // Campo de pruebas: vitrina. La cámara se acerca 2,6 veces al personaje (quieto, a un tercio de la pantalla) para
    // ver el arma, el disparo, los casquillos y la recarga de cerca; lo de la pantalla (viñeta) se dibuja sin acercar
    if (this.pruebas) {   // más cerca con las armas chicas: pistolas 3,3×, metralletas y cuerpo a cuerpo 2,9×, el resto 2,6× (cambia suave)
      const cat = j.montada ? 'ametralladora' : j.arma().categoria, meta = cat === 'pistola' ? 3.3 : cat === 'metralleta' || cat === 'cuerpo' ? 2.9 : 2.6;
      this.zoomVitrina = this.zoomVitrina ? this.zoomVitrina + (meta - this.zoomVitrina) * 0.12 : meta;
      const Z = this.zoomVitrina, E = Lienzo.escala; ctx.setTransform(E * Z, 0, 0, E * Z, E * (ANCHO * 0.3 - Z * (j.x - cam)), E * (ALTO * 0.86 - Z * j.y));
    }
    if (this.entrenamiento) Escenario.dibujarGalpon(ctx, cam, this.tiempoJugado);
    else if (this.cloaca) Escenario.dibujarCloaca(ctx, cam, this.tiempoJugado);
    else if (this.pruebas) Escenario.dibujarCampo(ctx, cam);
    else if (this.historia) { EscenarioHistoria.fondo(ctx, cam, this.tiempoJugado, this.historia); EscenarioHistoria.sogas(ctx, cam, this); if (this.aviones) for (const v of this.aviones) v.dibujar(ctx, cam); }
    else {
      Escenario.dibujarCielo(ctx, cam, this.tiempoJugado);
      if (this.aviones) for (const v of this.aviones) v.dibujar(ctx, cam);
      Escenario.dibujarRuinas(ctx, cam, this.tiempoJugado);   // antes del suelo: las montañas las tapan
      Escenario.dibujarSuelo(ctx, cam);
      Escenario.dibujarFondoDelMundo(ctx, cam, this.tiempoJugado);
      if (this.ultra) this.dibujarCarrilesUltra(ctx, cam);
    }
    if (this.entrenamiento) { this.dibujarDistancias(ctx, cam); for (const b of this.blancos) b.dibujar(ctx, cam); }
    if (j.montada) j.dibujar(ctx, cam, this.ahora);
    const eM2 = j.montada ? j.estadoArma() : null;
    for (const a of this.ametralladoras.values()) a.dibujar(ctx, cam, j.direccion, a.cercaDe(j), j.montada === a ? eM2.tapa : 0, j.montada === a ? eM2.retroX : 0, j.montada === a ? eM2.corredera : 0);
    if (this.ultra) this.dibujarEntidadesUltra(ctx, cam);   // cajas, torretas, zombies y tirador, del carril del fondo al de adelante
    else {
      for (const c of this.cajas) c.dibujar(ctx, cam);
      for (const c of this.charcos) c.dibujar(ctx, cam, this.tiempoJugado);
      Pincel.bisel = !Lienzo.liviano && this.zombies.length <= 25;   // con hordas grandes (o calidad baja) se aliviana el dibujo de los zombies
      for (const z of this.zombies) z.dibujar(ctx, cam, this.ahora);
      Pincel.bisel = !Lienzo.liviano;
      if (!j.montada) j.dibujar(ctx, cam, this.ahora);
    }
    for (const p of this.proyectiles) p.dibujar(ctx, cam);
    for (const e2 of this.escupitajos) e2.dibujar(ctx, cam);
    for (const c of this.casquillos) c.dibujar(ctx, cam);
    if (this.misiles) { for (const m of this.misiles) m.dibujar(ctx, cam); }
    for (const x of this.explosiones) x.dibujar(ctx, cam);
    for (const p of this.particulas) p.dibujar(ctx, cam);
    if (this.cloaca) Escenario.dibujarCloacaFrente(ctx, cam, this.tiempoJugado);
    else if (this.historia) { Escenario.dibujarAmbiente(ctx, cam, this.ambiente); EscenarioHistoria.frente(ctx, cam, this.tiempoJugado, this.historia, this); }
    else if (!this.pruebas && !this.entrenamiento) { Escenario.dibujarAmbiente(ctx, cam, this.ambiente); if (!this.ultra) Escenario.dibujarFrente(ctx, cam); }   // con carriles, sin alambrado adelante
    if (this.pruebas) ctx.setTransform(Lienzo.escala, 0, 0, Lienzo.escala, 0, 0);
    const v = ctx.createRadialGradient(ANCHO / 2, ALTO / 2, ALTO * 0.45, ANCHO / 2, ALTO / 2, ALTO * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, ANCHO, ALTO);
    if (this.historia) this.barraJefe(ctx);
    if (this.destello > 0) { ctx.fillStyle = `rgba(225,240,255,${this.destello * 2.2})`; ctx.fillRect(0, 0, ANCHO, ALTO); }   // rayo de Mjölnir
    if (j.vida < 35) { ctx.fillStyle = `rgba(140,0,0,${(35 - j.vida) / 35 * 0.35})`; ctx.fillRect(0, 0, ANCHO, ALTO); }
    if (j.veneno > 0) {   // envenenado: bordes verdes que laten
      const pulso = 0.5 + Math.sin(this.ahora / 140) * 0.5, fuerza = Math.min(1, j.veneno / 1.2);
      const vv = ctx.createRadialGradient(ANCHO / 2, ALTO / 2, ALTO * 0.55, ANCHO / 2, ALTO / 2, ALTO * 1.0);
      vv.addColorStop(0, 'rgba(80,200,30,0)'); vv.addColorStop(1, `rgba(80,200,30,${(0.14 + pulso * 0.12) * fuerza})`);
      ctx.fillStyle = vv; ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  }
}
