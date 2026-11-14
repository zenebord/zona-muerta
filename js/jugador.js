/* ===== Jugador: movimiento, inventario, disparo, acción manual y recarga por fases ===== */
const VELOCIDAD_JUGADOR = 3.6, GRAVEDAD = 0.55, SALTO = -11.5;   // el salto llega a unos 120 px de alto
const ESCALON_MAX = 14;   // lo más alto que se sube caminando; más alto, hay que saltar
const ORIGEN_ARMA = { x: 12, y: -47 };   // mano del gatillo, respecto de los pies
// De dónde saca la mano de apoyo lo que carga. Todo queda por delante del cuerpo y cerca del arma: antes era un solo
// punto detrás de la cadera y el brazo cruzaba hasta la espalda en cada viaje (con las armas que cargan de a una, ocho
// veces seguidas), más atrás de lo que da el hombro.
const BOLSAS = {
  cargador: { x: 8.5, y: -38 },          // portacargadores del cinturón, adelante
  balas: { x: 10.5, y: -42 },            // canana del pecho: balas y cartuchos sueltos, peines y cargadores rápidos
  cohete: { x: 1, y: -33 },              // bolsa al costado
  granada: { x: 6, y: -36 },
  cinta: { x: 2, y: -32 },               // cajón de cintas de la M2, al pie del trípode
};
const BOLSA_DE = { 'cargador-pistola': 'cargador', cargador: 'cargador', ignicion: 'cargador', tambor: 'balas', 'tambor-rapido': 'balas', peine: 'balas', cerrojo: 'balas',
  palanca: 'balas', cartuchos: 'balas', quiebre: 'balas', cinta: 'cinta', cohete: 'cohete', granada: 'granada' };
const DETRAS_M2 = 20;                    // a cuánto detrás de la M2 se para el tirador
// El cuerpo se dibuja 16 % más grande que su esqueleto (proporciones reales sin quedar más bajo que los zombies):
// todo punto del dibujo que se lleva al mundo (boca del arma, cargador, pasador) se multiplica por esto
const ESCALA_JUGADOR = 1.16;
const BAJA_AGACHADO = 13;                // rodilla en tierra: cuánto bajan la cadera, el torso y el arma
// Fuerza del retroceso (1 = fusil): mueve el arma, las manos, el hombro y la cabeza
const FUERZA_RETROCESO = { pistola: 0.6, metralleta: 0.45, rifle: 1.0, escopeta: 1.3, ametralladora: 0.55, lanzagranadas: 1.2, bazuca: 0.35, granada: 0.15, lanzallamas: 0.12, laser: 0.3, cuerpo: 0, legendaria: 0 };
const FUERZA_RETROCESO_ARMA = { magnum: 1.0, deagle: 1.0, python: 0.9, uzi: 0.4, p90: 0.35, barrett: 1.7, mosin: 1.15, winchester1887: 1.4, recortada: 1.5, aa12: 1.0,
  ppk: 0.45, vector: 0.3, thompson: 0.5, svd: 1.1, garand: 1.05, mgl: 1.0 };
// Dónde queda la empuñadura según cómo se agarra el arma (respecto de los pies)
const POSTURAS = {
  hombro: d => ({ x: d.culataCm * CM - 1, y: -54 }),    // la cantonera apoyada en el hueco del hombro (x ≈ -1)
  pistola: () => ({ x: 23, y: -55 }),                    // dos manos, brazos estirados a la altura del pecho
  pecho: () => ({ x: 15, y: -51 }),
  mano: () => ({ x: 12, y: -48 }),
  cuerpo: () => ({ x: 13, y: -47 }),                     // machete, espada, hacha…: en guardia a la altura del pecho
};
/* Golpe cuerpo a cuerpo: dónde va la mano del gatillo y cuánto se inclina el arma (0 = parada hacia arriba)
 * en guardia, con el arma alzada atrás y al terminar el golpe adelante y abajo. */
const GOLPE = { guardia: { x: 13, y: -47, a: -0.15 }, guardiaUnaMano: { x: 14, y: -46, a: 0.35 }, alzada: { x: 2, y: -68, a: -2.1 }, golpe: { x: 25, y: -42, a: 1.85 }, lanzar: { x: 24, y: -56, a: 1.1 } };
const masSuave = t => t * t * t * (t * (t * 6 - 15) + 10);   // arranca y llega sin tirón (velocidad y aceleración cero en las puntas)
const mezclaPose = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, a: a.a + (b.a - a.a) * k });

// Armas de acción manual: después de cada tiro se acciona el mecanismo y recién ahí sale el casquillo
const CICLO_PISTOLA = 70;           // ms que tarda la corredera de la pistola en ir atrás y volver después de cada tiro
const PAUSA_MONTAR = 400;          // ms de más entre meter el cargador y tirar de la corredera o la manija (arma vacía)
const ACCION_MANUAL = { remington700: 'cerrojo', mosin: 'cerrojo', mossberg: 'bombeo', rem870: 'bombeo', winchester1894: 'palanca', winchester1887: 'palanca' };
// Las que se recargan solas (fusiles, metralletas, escopetas semiautomáticas): con cada tiro el cerrojo va atrás, la
// recámara queda abierta un instante (por ahí sale la vaina) y vuelve con otra bala. Nunca dura más que un tiro.
const CICLO_CERROJO = 130;          // ms del cerrojo atrás y adelante (js/armas-recamara.js dibuja la ventana)
const recargaSola = (arma, d) => !!(d && d.casquillo) && arma.recargaTipo !== 'cargador-pistola' && !ACCION_MANUAL[arma.id];
const cicloCerrojo = arma => Math.min((RECAMARAS[arma.id] && RECAMARAS[arma.id].ciclo) || CICLO_CERROJO, arma.cadencia * 0.75);

/* Línea de tiempo de una animación (recarga o acción). Cada fase dice:
 *   a        adónde va la mano de apoyo: 'arma' | 'cargador' | 'corredera' | 'cadera'
 *   llegada  fracción de la fase que tarda la mano en llegar; el resto es la acción
 *   ab, co   estado al terminar la fase del arma abierta (tambor, cerrojo, quiebre, tapa) y de la corredera trabada
 *   snap     si está, ab/co encastran de golpe en ese punto de la acción (en un quinto de la acción) en vez de gradualmente
 *   incl     inclinación del arma al terminar la fase (radianes, positivo = boca abajo)
 *   pulso    { que: corredera | bombeo | palanca, recorrido } va y vuelve durante la acción
 *   tiron, offset, presionar  desplazamientos extra de la mano
 *   mano     [[unidad, desde, hasta]] qué lleva en la mano y en qué tramo de la fase
 *   alInicio, alTerminar, eventos [[fracción, fn]]
 * Lo que una fase no define lo hereda de la anterior. */
class LineaTiempo {
  constructor(t0, inicial, tipo) { this.t = t0; this.inicio = t0; this.fases = []; this.inicial = inicial; this.tipo = tipo; }
  fase(nombre, dur, o = {}) {
    const prev = this.fases[this.fases.length - 1] || this.inicial;
    this.fases.push(Object.assign({ nombre, a: 'arma', ab: prev.ab, co: prev.co, incl: prev.incl, org: prev.org }, o, { desde: this.t, hasta: this.t + dur }));
    this.t += dur;
    return this;
  }
  ajustar(total) {   // estira o comprime todas las fases para que la animación dure `total`
    const k = total / Math.max(1, this.t - this.inicio);
    for (const f of this.fases) { f.desde = this.inicio + (f.desde - this.inicio) * k; f.hasta = this.inicio + (f.hasta - this.inicio) * k; }
    this.t = this.inicio + total;
    return this;
  }
  terminar() { return { tipo: this.tipo, fases: this.fases, inicial: this.inicial, inicio: this.inicio, fin: this.t }; }
}

class Jugador {
  constructor(x) {
    this.x = x; this.y = alturaSuelo(x);
    this.vx = 0; this.vy = 0;
    this.ancho = 26; this.alto = 62;
    this.direccion = 1;
    this.enSuelo = true;
    this.vida = this.vidaMax = AJUSTE.vidaJugador;
    this.muerto = false;
    this.inventario = [ARMA_INICIAL];
    this.indiceArma = 0;
    this.municion = { [ARMA_INICIAL]: ARMAS[ARMA_INICIAL].cargador };
    this.reserva = {};                 // solo las especiales tienen reserva finita
    this.recarga = null;               // línea de tiempo de la recarga en curso
    this.ciclo = null;                 // línea de tiempo del accionamiento después de un tiro
    this.sinCargador = false;          // el arma está sin cargador, a mitad de la recarga
    this.golpeEn = -1000;              // momento en que algo encastró: el arma rebota un poquito
    this.ultimoDisparo = -10000;       // bien atrás, para poder disparar desde el primer cuadro
    this.tiroEn = -10000;              // último tiro de verdad (el gatillo en vacío no mueve el cerrojo)
    this.vainaPendiente = null;        // la vaina del último tiro, que sale cuando el cerrojo llega atrás
    this.invulnerableHasta = 0;
    this.montada = null;               // ametralladora fija que está usando, si hay
    this.fase = 0; this.retroceso = 0; this.caminando = false;
    this.ahora = 0;
    this.protegido = false; this.cubierto = 0;
    this.golpeActual = null;           // golpe cuerpo a cuerpo en curso
    this.lanzado = null;               // Égida o Gungnir en el aire: vuelven solas a la mano
    this.agachado = 0;                 // 0 parado … 1 rodilla en tierra (↓ mantenida)
    this.veneno = 0;                   // segundos de envenenamiento por ácido de los zombies tóxicos
  }

  // Ácido de un zombie tóxico: quema de a poco mientras dure (no se acumula, se renueva)
  envenenar(segundos) { if (!this.muerto) this.veneno = Math.max(this.veneno, segundos); }

  arma() { return this.montada ? ARMA_FIJA : ARMAS[this.inventario[this.indiceArma]]; }
  // Qué pisa: piso de cemento en el galpón (suena como el asfalto), arena en el campo de pruebas y en las montañas, asfalto en la calle
  superficie() { if (Mundo.interior) return 'asfalto'; return Mundo.plano || alturaSuelo(this.x) < SUELO_BASE - 1 ? 'arena' : 'asfalto'; }
  municionActual() { return this.montada ? this.montada.municion : this.municion[this.arma().id]; }
  recargando() { return !!this.recarga; }

  actualizar(dt, entrada, juego) {
    const paso = dt * 60;
    this.ahora = juego.ahora;
    this.caminando = false;
    // La vaina del último tiro sale por la ventana cuando la corredera o el cerrojo llegaron atrás
    const vaina = this.vainaPendiente;
    if (vaina && this.ahora >= vaina.en) {
      this.vainaPendiente = null;
      if (!this.montada && this.arma().id === vaina.arma) { const p = this.puntoArma('expulsion'); juego.casquillos.push(new Casquillo(p.x, p.y, this.direccion, vaina.tipo)); }
    }
    // Golpe cuerpo a cuerpo en curso: pega en su momento y termina
    const g = this.golpeActual;
    if (g) {
      if (!g.hecho && this.ahora >= g.inicio + g.dur * g.impacto) { g.hecho = true; if (!this.muerto) juego.golpeCuerpo(this, g.arma); }
      if (this.ahora >= g.inicio + g.dur) this.golpeActual = null;
    }

    if (this.montada) {
      if (entrada.derecha) this.direccion = 1;
      if (entrada.izquierda) this.direccion = -1;
      const detras = this.montada.x - this.direccion * DETRAS_M2;          // parado detrás del arma, del lado contrario a donde apunta
      this.x += (detras - this.x) * Math.min(1, dt * 9); this.y = this.montada.y; this.vy = 0; this.enSuelo = true;
    } else if (!this.muerto) {
      this.vx = 0;
      // Agachado (rodilla en tierra): no camina ni salta, pero puede girar para tirar al otro lado
      const agachandose = entrada.abajo && this.enSuelo;
      if (entrada.derecha) { this.vx = VELOCIDAD_JUGADOR * AJUSTE.velocidadJugador; this.direccion = 1; }
      if (entrada.izquierda) { this.vx = -VELOCIDAD_JUGADOR * AJUSTE.velocidadJugador; this.direccion = -1; }
      if (agachandose) this.vx = 0;
      // Impulso al soltarse de una soga: lo lleva por el aire hasta que toca el piso (las flechas lo corrigen un poco)
      if (this.impulso && !this.enSuelo) { this.vx = this.impulso + this.vx * 0.3; this.direccion = Math.sign(this.impulso) || this.direccion; }
      this.caminando = this.vx !== 0 && this.enSuelo;
      if (entrada.saltarPulsado && this.enSuelo && !agachandose && this.agachado < 0.3) { this.vy = SALTO * AJUSTE.salto; this.enSuelo = false; }
      const nx = this.x + this.vx * paso;
      if (!(this.vx !== 0 && alturaSuelo(nx) < this.y - ESCALON_MAX)) this.x = nx;   // contra una pared alta: no avanza
      const suelo = alturaSuelo(this.x);
      if (this.enSuelo) {
        if (suelo > this.y + 6) { this.enSuelo = false; this.vy = 0; } else this.y = suelo;   // pegado al terreno
      }
      if (!this.enSuelo) {
        this.vy += GRAVEDAD * paso;
        this.y += this.vy * paso;
        if (this.y >= suelo) { if (this.vy > 4) Audio_.aterrizar(this.superficie()); this.y = suelo; this.vy = 0; this.enSuelo = true; this.impulso = 0; }
      }
    }
    entrada.saltarPulsado = false;

    this.cubierto += ((this.protegido ? 1 : 0) - this.cubierto) * Math.min(1, dt * 10);   // agacharse detrás del parapeto
    if (this.veneno > 0) {
      this.veneno = Math.max(0, this.veneno - dt);
      if (!this.muerto) {
        this.vida = Math.max(0, this.vida - 2.6 * dt);
        if (this.vida <= 0) { this.muerto = true; this.veneno = 0; this.desmontar(); Audio_.jugadorMuere(); }
      }
    }
    const meta = entrada.abajo && this.enSuelo && !this.montada && !this.muerto ? 1 : 0;
    if (meta && this.agachado < 0.05) Audio_.aterrizar(this.superficie());                   // la rodilla toca el piso
    this.agachado += (meta - this.agachado) * Math.min(1, dt * 14);
    if (this.agachado < 0.002) this.agachado = 0;
    if (this.caminando) {
      const antes = Math.sin(this.fase);
      this.fase += dt * 11;
      if (Math.sign(antes) !== Math.sign(Math.sin(this.fase))) Audio_.paso(this.superficie());
    }
    this.retroceso = Math.max(0, this.retroceso - dt * 8);

    for (const linea of [this.recarga, this.ciclo]) if (linea) this.procesarEventos(linea);
    if (this.recarga && this.ahora >= this.recarga.fin) { this.recarga = null; this.sinCargador = false; }
    if (this.ciclo && this.ahora >= this.ciclo.fin) { this.ciclo = null; this.granadaFuera = this.pasadorFuera = false; }
  }

  // Dispara los efectos de cada fase en su momento: sonidos, casquillos, munición
  procesarEventos(linea) {
    for (const f of linea.fases) {
      if (!f.iniciada && this.ahora >= f.desde) { f.iniciada = true; if (f.alInicio) f.alInicio(); }
      if (f.eventos) for (const ev of f.eventos) if (!ev.hecho && this.ahora >= f.desde + ev[0] * (f.hasta - f.desde)) { ev.hecho = true; ev[1](); }
      if (!f.terminada && this.ahora >= f.hasta) { f.terminada = true; if (f.alTerminar) f.alTerminar(); }
    }
  }

  // Posición en el mundo de un punto del arma (boca, expulsión, cargador), con la inclinación de la animación
  puntoArma(nombre) {
    const d = DIBUJO_ARMAS[this.arma().id];
    if (this.montada) return { x: this.montada.x + this.direccion * (nombre === 'boca' ? 64 : -2), y: this.montada.y - 46 };
    const K = ESCALA_JUGADOR;
    if (!d) return { x: this.x + this.direccion * K * (nombre === 'boca' ? 60 : -6), y: this.y - 44 * K };
    const e = this.estadoArma(), a = d[nombre], c = Math.cos(e.incl), s = Math.sin(e.incl);
    return { x: this.x + this.direccion * K * (e.origen.x + a.x * c - a.y * s), y: this.y + K * (e.origen.y + a.x * s + a.y * c + this.agachado * BAJA_AGACHADO) };
  }

  // Golpe cuerpo a cuerpo: alza, baja de golpe (ahí pega) y vuelve a la guardia
  golpear(juego) {
    const arma = this.arma(), ahora = juego.ahora;
    if (this.golpeActual || this.lanzado || ahora - this.ultimoDisparo < arma.cadencia) return false;
    this.ultimoDisparo = ahora;
    this.golpeActual = { inicio: ahora, dur: arma.golpe, impacto: 0.5, hecho: false, arma };
    Audio_.blandir(arma.dano >= 15 && !arma.filo ? 1.4 : arma.filo ? 0.8 : 1, arma.id);
    if (juego.entrenamiento) { juego.ent.disparos++; if (juego.ent.serieActual) juego.ent.serieActual.disparos++; }
    return true;
  }

  disparar(juego) {
    if (this.muerto) return false;
    const arma = this.arma(), ahora = juego.ahora;
    if (arma.cuerpo && !this.montada) return this.golpear(juego);
    if (this.recarga) {
      // Las que cargan por un tubo (bombeo, palanca) se pueden interrumpir si ya tienen algo adentro
      const interrumpible = (this.recarga.tipo === 'cartuchos' || this.recarga.tipo === 'palanca') && this.municionActual() > 0;
      if (interrumpible) this.cancelarRecarga(); else return false;
    }
    if (this.ciclo) return false;
    if (ahora - this.ultimoDisparo < arma.cadencia) return false;
    if (this.municionActual() <= 0) { Audio_.vacio(); this.ultimoDisparo = ahora; return false; }
    if (!this.montada && arma.categoria === 'granada') { this.ultimoDisparo = ahora; this.iniciarLanzamiento(juego, arma); return true; }
    if (this.montada) this.montada.municion--; else this.municion[arma.id]--;
    this.ultimoDisparo = ahora; this.tiroEn = ahora;
    this.retroceso = 1;
    const boca = this.puntoArma('boca'), expulsion = this.puntoArma('expulsion');
    const accion = this.montada ? null : ACCION_MANUAL[arma.id];
    const tipoCasquillo = this.montada ? 'grande' : DIBUJO_ARMAS[arma.id].casquillo;
    // La vaina no sale en el momento del tiro sino cuando la corredera (pistolas) o el cerrojo llegan atrás y la
    // recámara queda abierta; las de acción manual la escupen al accionar (iniciarCiclo); la M2, enseguida
    if (!this.montada && tipoCasquillo && !accion) {
      const retraso = arma.recargaTipo === 'cargador-pistola' ? 20 : cicloCerrojo(arma) * 0.3;
      this.vainaPendiente = { en: ahora + retraso, tipo: tipoCasquillo, arma: arma.id };
    }
    juego.dispararArma(arma, boca.x, boca.y, this.direccion, this.montada ? { x: expulsion.x, y: expulsion.y, tipo: tipoCasquillo } : null);
    Audio_.disparo(arma.categoria, arma.id);
    if (accion) this.iniciarCiclo(juego, arma, accion, tipoCasquillo);
    return true;
  }

  // Cerrojo atrás y adelante, bombeo o palanca después del tiro; el casquillo sale en la mitad
  iniciarCiclo(juego, arma, accion, tipoCasquillo) {
    const t0 = juego.ahora + 60, dur = arma.cadencia * 0.8 - 60;
    const llegada = accion === 'bombeo' ? 0.15 : accion === 'palanca' ? 0.1 : 0.35;
    const expulsar = () => { if (!tipoCasquillo) return; const p = this.puntoArma('expulsion'); juego.casquillos.push(new Casquillo(p.x, p.y, this.direccion, tipoCasquillo)); };
    const sonido = { cerrojo: 'cerrojo', bombeo: 'bombear', palanca: 'palanca' }[accion];
    const pulso = { cerrojo: { que: 'corredera', recorrido: 0 }, bombeo: { que: 'bombeo', recorrido: 0 }, palanca: { que: 'palanca', recorrido: 0 } }[accion];
    this.ciclo = new LineaTiempo(t0, { ab: 0, co: 0, incl: 0 }, 'ciclo')
      .fase('accionar', dur * 0.75, { a: accion === 'cerrojo' ? 'corredera' : 'arma', llegada, pulso, incl: accion === 'cerrojo' ? 0.06 : 0, eventos: accion === 'cerrojo'
        ? [[llegada, () => Audio_.recarga('cerrojo-abrir', arma.id)], [llegada + (1 - llegada) * 0.5, expulsar], [llegada + (1 - llegada) * 0.8, () => Audio_.recarga('cerrojo', arma.id)]]
        : [[llegada, () => Audio_.recarga(sonido, arma.id)], [llegada + (1 - llegada) * 0.5, expulsar]] })
      .fase('volver', dur * 0.25, { a: 'arma', incl: 0 })
      .terminar();
    this.ciclo.accion = accion;
  }

  // Granada M67: la mano de apoyo engancha la anilla y saca el pasador (se oye), el brazo va atrás, lanza (la
  // cuchara salta) y la mano abre los dedos: el pasador con su anilla cae al piso. La granada se gasta recién al
  // soltarla, así que cambiar de arma a mitad del gesto no la pierde.
  iniciarLanzamiento(juego, arma) {
    const soltar = () => {
      if (this.municionActual() <= 0) return;
      this.municion[arma.id]--; this.granadaFuera = true; this.retroceso = 1;
      const boca = this.puntoArma('boca');
      juego.dispararArma(arma, boca.x, boca.y, this.direccion, null);
      Audio_.disparo(arma.categoria, arma.id); Audio_.recarga('cuchara', arma.id);
    };
    const tirarPasador = () => {
      const m = this.estadoArma().mano;
      juego.casquillos.push(new Casquillo(this.x + this.direccion * m.x * ESCALA_JUGADOR, this.y + (m.y + this.agachado * BAJA_AGACHADO) * ESCALA_JUGADOR, this.direccion, 'pasador', true));
    };
    this.ciclo = new LineaTiempo(juego.ahora, { ab: 0, co: 0, incl: 0, org: { x: 0, y: 0 } }, 'ciclo')
      .fase('tomar', 170, { a: 'anilla' })
      .fase('tirar', 180, { a: 'anilla', offset: { x: -9, y: 3 }, llegada: 0.2, mano: [['pasador', 0.2, 1]], eventos: [[0.2, () => { this.pasadorFuera = true; Audio_.recarga('pasador', arma.id); }]] })
      .fase('atras', 280, { a: 'frente', incl: -1.6, org: { x: -22, y: -20 }, mano: [['pasador', 0, 1]] })
      .fase('lanzar', 130, { a: 'frente', incl: 0.6, org: { x: 12, y: -10 }, mano: [['pasador', 0, 1]], eventos: [[0.45, soltar]] })
      .fase('soltar', 230, { a: 'frente', offset: { x: 0, y: 4 }, incl: 0.3, org: { x: 6, y: -2 }, mano: [['pasador', 0, 0.3]], eventos: [[0.3, tirarPasador]] })
      .fase('volver', 260, { a: 'arma', incl: 0, org: { x: 0, y: 0 }, alInicio: () => { this.granadaFuera = this.pasadorFuera = false; } })
      .terminar();
    this.ciclo.accion = 'granada';
  }

  llenarCargador() {
    const a = this.arma();
    if (this.montada) { this.montada.municion = ARMA_FIJA.cargador; return; }
    const disponible = this.reserva[a.id] === undefined ? Infinity : this.reserva[a.id];
    const carga = Math.min(a.cargador, this.municion[a.id] + disponible);
    if (disponible !== Infinity) this.reserva[a.id] -= carga - this.municion[a.id];
    this.municion[a.id] = carga;
  }

  // Arma la línea de tiempo de la recarga según el mecanismo de cada arma
  recargar(juego) {
    if (this.muerto || this.recarga || (this.ciclo && this.ciclo.accion === 'granada')) return;
    const arma = this.arma();
    if (arma.cuerpo && !this.montada) return;   // no se recargan
    if (this.municionActual() >= arma.cargador) return;
    if (!this.montada && this.reserva[arma.id] !== undefined && this.reserva[arma.id] <= 0) {
      juego.aviso(t('aviso.sinMunicion') + arma.nombre.toUpperCase());
      return;
    }
    this.ciclo = null;
    const tipo = this.montada ? 'cinta' : arma.recargaTipo;
    const vacio = this.municionActual() === 0;
    const trabada = tipo === 'cargador-pistola' && vacio;   // la corredera quedó atrás con el último tiro
    const T = arma.recarga, unidad = arma.recargaUnidad;
    const l = new LineaTiempo(juego.ahora, { ab: 0, co: trabada ? 1 : 0, incl: 0 }, tipo);
    const s = nombre => () => Audio_.recarga(nombre, arma.id);
    const encastrar = sonido => () => { this.golpeEn = this.ahora; if (sonido) Audio_.recarga(sonido, arma.id); };
    const llenar = sonido => () => { this.llenarCargador(); this.sinCargador = false; encastrar(sonido)(); };
    const quitar = suelta => () => { this.sinCargador = true; Audio_.recarga(unidad === 'celda' ? 'celda' : 'cargador-sacar', arma.id); if (suelta) juego.soltarCargador(this, suelta); };
    // Suelta lo que tiene en la mano: cae al piso desde donde está la mano en ese momento
    const soltarDeLaMano = tipoCaida => () => {
      const e = this.estadoArma();
      juego.soltarCargador(this, tipoCaida, { x: this.x + this.direccion * e.mano.x * ESCALA_JUGADOR, y: this.y + (e.mano.y + this.agachado * BAJA_AGACHADO) * ESCALA_JUGADOR });
    };
    const meterUna = sonido => () => {
      if (this.reserva[arma.id] !== undefined) { if (this.reserva[arma.id] <= 0) return; this.reserva[arma.id]--; }
      this.municion[arma.id] = Math.min(arma.cargador, this.municion[arma.id] + 1);
      encastrar(sonido)();
    };
    // De a una: la mano va a la cadera, trae una unidad y la mete en el arma
    // De a una: la mano llega con la bala a la boca (el agujero de la recámara, la ventana, la boca del depósito) en el
    // primer 70 % y en el resto la mete; la bala se ve hasta que entró. (Antes llegaba recién al final y la bala se
    // borraba al 85 %, todavía en camino: parecía que la ponía lejos del agujero.) empuje: desde dónde la mete
    const deAUna = (cuantas, u, incl, objeto, sonido, empuje = null) => {
      for (let k = 0; k < cuantas; k++) {
        l.fase('cadera', u * 0.45, { a: 'cadera', incl, mano: [[objeto, 0.5, 1]] });
        l.fase('cargar', u * 0.55, Object.assign({ a: 'cargador', incl, llegada: 0.7, mano: [[objeto, 0, 0.95]], alTerminar: meterUna(sonido) }, empuje));
      }
    };
    const abrirTambor = (dur) => l.fase('abrir', dur, { a: 'cargador', llegada: 0.5, ab: 1, incl: -0.1, eventos: [[0.5, s('abrir')]] });
    // Boca arriba y empujar el vástago: caen los casquillos del tambor
    const vaciarTambor = (dur) => l.fase('vaciar', dur, { a: 'corredera', llegada: 0.4, incl: -0.75, tiron: -3, eventos: [[0.6, () => { juego.expulsarCasquillos(this, arma.cargador); this.municion[arma.id] = 0; }]] });

    switch (tipo) {
      case 'cargador-pistola':
        // Saca el vacío tirando hacia abajo, lo suelta (cae al piso), trae uno nuevo del portacargador y lo mete
        // El cargador sale y entra a lo largo de la empuñadura (eje: js/cargadores.js); la mano lo suelta recién puesto
        l.fase('sacar', 300, { a: 'agarreCargador', eje: true, llegada: 0.5, incl: -0.3, presionar: 8, mano: [['cargador', 0.55, 1]], eventos: [[0.55, quitar(null)]] });
        l.fase('soltar', 140, { a: 'agarreCargador', eje: true, offset: { x: 0, y: 9 }, alInicio: soltarDeLaMano('cargadorPistola') });
        l.fase('cadera', 340, { a: 'cadera', mano: [['cargador', 0.55, 1]] });
        l.fase('poner', 300, { a: 'agarreCargador', eje: true, llegada: 0.55, offset: { x: 0, y: 8 }, presionar: -8, mano: [['cargador', 0, 1]], alTerminar: llenar('cargador-poner') });
        let montar = false;
        if (trabada && arma.recargaFinal === 'liberar') l.fase('liberar', 170, { a: 'corredera', llegada: 0.6, co: 0, snap: 0, eventos: [[0.6, s('liberar')]] });
        else if (trabada) {   // pausa con la mano en el cargador recién puesto y después tira de la corredera
          montar = true;
          l.fase('esperar', 300, { a: 'agarreCargador' });
          l.fase('corredera', 380, { a: 'corredera', llegada: 0.45, co: 0, snap: 0.55, tiron: 1.9, incl: -0.1, eventos: [[0.55, s('corredera')]] });
        }
        l.fase('volver', 170, { a: 'arma', incl: 0 });
        l.ajustar(T + (montar ? PAUSA_MONTAR : 0));
        break;

      case 'cargador': case 'ignicion': {   // ignicion: el lanzallamas cambia el cilindro de ignición de la punta (no cae al piso)
        const suelta = unidad === 'celda' || unidad === 'ignicion' ? null : unidad === 'tambor-cargador' ? 'tambor' : 'cargador';
        if (arma.recargaFinal === 'palmada-hk') l.fase('trabar', 320, { a: 'corredera', llegada: 0.4, co: 1, eventos: [[0.5, s('cerrojo-abrir')]] });
        // Con su cargador (js/cargadores.js) la mano lo agarra donde corresponde y lo saca y lo mete a lo largo de su eje
        const conCargador = !!CARGADORES[arma.id], dondeAgarra = conCargador ? 'agarreCargador' : 'cargador', sal = conCargador ? CARGADORES[arma.id].salida ?? 1 : 1;
        if (suelta) {   // tira el cargador hacia abajo, lo suelta y cae al piso; la mano va vacía al portacargador
          l.fase('sacar', 320, { a: dondeAgarra, eje: conCargador, llegada: 0.5, incl: -0.2, presionar: 6 * sal, mano: [[unidad, 0.55, 1]], eventos: [[0.55, quitar(null)]] });
          l.fase('soltar', 140, { a: dondeAgarra, eje: conCargador, offset: { x: 0, y: 7 * sal }, alInicio: soltarDeLaMano(suelta) });
        } else l.fase('sacar', 300, { a: 'cargador', llegada: 0.55, incl: -0.2, eventos: [[0.8, quitar(null)]] });
        l.fase('cadera', 380, { a: 'cadera', mano: [[unidad, 0.5, 1]] });
        l.fase('poner', 360, conCargador
          ? { a: 'agarreCargador', eje: true, llegada: 0.55, offset: { x: 0, y: 7 }, presionar: -7, mano: [[unidad, 0, 1]], rotMano: arma.balanceo ? [0.5, 0] : null, alTerminar: llenar('cargador-poner') }
          : { a: 'cargador', mano: [[unidad, 0, 0.9]], alTerminar: llenar(unidad === 'celda' ? 'celda' : 'cargador-poner') });
        const fin = arma.recargaFinal;
        if (fin === 'palmada-hk') l.fase('palmada', 200, { a: 'corredera', llegada: 0.6, co: 0, snap: 0, eventos: [[0.6, s('palmada-hk')]] });
        else if (fin === 'palmada' && vacio) l.fase('palmada', 200, { a: 'corredera', llegada: 0.65, tiron: -2, eventos: [[0.65, s('palmada')]] });
        // Metralletas y fusiles vacíos: pausa con la mano en el cargador antes de tirar de la manija (más lento)
        const montar = fin === 'cerrojo' && vacio && (arma.categoria === 'metralleta' || arma.categoria === 'rifle');
        if (montar) l.fase('esperar', 300, { a: dondeAgarra });
        if (fin === 'cerrojo' && vacio) l.fase('cerrojo', montar ? 420 : 320, { a: 'corredera', llegada: 0.4, pulso: { que: 'corredera', recorrido: 0 }, eventos: [[0.45, s('cerrojo')]] });
        l.fase('volver', 200, { a: 'arma', incl: 0 });
        l.ajustar(T + (montar ? PAUSA_MONTAR : 0));
        break;
      }

      case 'tambor':   // revólver: abre, vuelca, bala por bala, cierra
        abrirTambor(300); vaciarTambor(320);
        deAUna(arma.cargador, (T - 880) / arma.cargador, 0.35, 'bala', 'bala');
        l.fase('cerrar', 260, { a: 'arma', llegada: 0.4, ab: 0, snap: 0.3, incl: 0, eventos: [[0.45, s('cerrar')]] });
        break;

      case 'tambor-rapido':   // revólver con cargador rápido: las seis de una vez
        abrirTambor(280); vaciarTambor(300);
        l.fase('cadera', 340, { a: 'cadera', incl: 0.35, mano: [['speedloader', 0.5, 1]] });
        l.fase('cargar', 400, { a: 'cargador', mano: [['speedloader', 0, 1]], eventos: [[0.75, llenar('speedloader')]] });
        l.fase('soltar', 220, { a: 'arma', alInicio: () => juego.soltarCargador(this, 'speedloader') });
        l.fase('cerrar', 240, { a: 'arma', llegada: 0.3, ab: 0, snap: 0.2, incl: 0, eventos: [[0.4, s('cerrar')]] });
        l.ajustar(T);
        break;

      case 'peine':   // vacío: cerrojo atrás, peine en la guía, se empujan todas, al cerrar salta el peine
        if (vacio) {
          l.fase('abrir', 320, { a: 'corredera', llegada: 0.45, ab: 1, incl: -0.15, eventos: [[0.5, s('cerrojo-abrir')]] });
          l.fase('cadera', 380, { a: 'cadera', mano: [['peine', 0.5, 1]] });
          l.fase('peine', 560, { a: 'cargador', llegada: 0.35, offset: { x: 0, y: -8 }, presionar: 8, peine: true, mano: [['peine', 0, 0.35]], eventos: [[0.4, s('peine')]], alTerminar: llenar(null) });
          l.fase('cerrar', 320, { a: 'corredera', llegada: 0.35, ab: 0, incl: 0, eventos: [[0.4, () => { juego.soltarCargador(this, 'peine'); Audio_.recarga('cerrojo', arma.id); }]] });
          l.fase('volver', 180, { a: 'arma' });
          l.ajustar(T);
        } else {      // a medias: se completa bala por bala
          l.fase('abrir', 300, { a: 'corredera', llegada: 0.45, ab: 1, incl: -0.1, eventos: [[0.5, s('cerrojo-abrir')]] });
          deAUna(arma.cargador - this.municionActual(), T / (arma.cargador + 3), -0.1, 'bala', 'bala');
          l.fase('cerrar', 300, { a: 'corredera', llegada: 0.35, ab: 0, incl: 0, eventos: [[0.4, s('cerrojo')]] });
          l.fase('volver', 180, { a: 'arma' });
        }
        break;

      case 'cerrojo':   // rifle de cerrojo con depósito interno: abre la recámara y pone bala por bala
        l.fase('abrir', 320, { a: 'corredera', llegada: 0.45, ab: 1, incl: -0.1, eventos: [[0.5, s('cerrojo-abrir')]] });
        deAUna(arma.cargador - this.municionActual(), (T - 820) / arma.cargador, 0.05, 'bala', 'bala', { offset: { x: 0, y: -2.6 }, presionar: 3.2 });   // desde arriba, hacia adentro de la ranura
        l.fase('cerrar', 320, { a: 'corredera', llegada: 0.35, ab: 0, incl: 0, eventos: [[0.4, s('cerrojo')]] });
        l.fase('volver', 180, { a: 'arma' });
        break;

      case 'palanca':   // por la ventana lateral, de a una; si estaba vacía, palanca para alimentar la recámara
        l.fase('girar', 220, { a: 'cadera', incl: -0.3 });   // mientras gira el arma, la mano ya va a la canana
        deAUna(arma.cargador - this.municionActual(), (T - 800) / arma.cargador, -0.3, unidad, unidad === 'cartucho' ? 'cartucho' : 'bala');
        if (vacio) l.fase('palanca', 400, { a: 'arma', llegada: 0.2, incl: 0, pulso: { que: 'palanca', recorrido: 0 }, eventos: [[0.25, s('palanca')]] });
        l.fase('volver', 180, { a: 'arma', incl: 0 });
        break;

      case 'cartuchos':   // escopeta de bombeo: se da vuelta, cartucho por cartucho por abajo, y bombea si estaba vacía
        l.fase('girar', 200, { a: 'cadera', incl: -0.3 });   // mientras gira el arma, la mano ya va a la canana
        deAUna(arma.cargador - this.municionActual(), (T - 680) / arma.cargador, -0.3, 'cartucho', 'cartucho');
        if (vacio) l.fase('bombear', 320, { a: 'arma', llegada: 0.4, incl: 0, pulso: { que: 'bombeo', recorrido: 0 }, eventos: [[0.45, s('bombear')]] });
        l.fase('volver', 160, { a: 'arma', incl: 0 });
        break;

      case 'quiebre': {   // se parte, boca arriba saltan los gastados, entran los nuevos y se cierra de un golpe
        const gastados = arma.cargador - this.municionActual();
        l.fase('abrir', 280, { a: 'arma', llegada: 0.4, ab: 1, incl: 0.3, eventos: [[0.45, s('abrir')]] });
        l.fase('vaciar', 240, { a: 'arma', incl: -0.35, eventos: [[0.45, () => juego.expulsarCasquillos(this, gastados)]] });
        deAUna(gastados, (T - 760) / arma.cargador, 0.3, unidad, unidad === 'granada40' ? 'cargador-poner' : 'cartucho');
        l.fase('cerrar', 240, { a: 'arma', llegada: 0.3, ab: 0, snap: 0.25, incl: 0, eventos: [[0.35, s('cerrar')]] });
        break;
      }

      case 'cinta':   // M2: tapa arriba, cinta nueva en la bandeja, tapa abajo y dos tirones a la manija
        l.fase('tapa', 420, { a: 'cargador', llegada: 0.45, ab: 1, eventos: [[0.5, s('tapa')]] });
        l.fase('cadera', 520, { a: 'cadera', mano: [['cinta', 0.5, 1]] });
        l.fase('tender', 560, { a: 'cargador', mano: [['cinta', 0, 0.8]], eventos: [[0.75, s('cinta')]], alTerminar: llenar(null) });
        l.fase('cerrar', 380, { a: 'cargador', llegada: 0.3, ab: 0, snap: 0.3, eventos: [[0.4, s('tapa')]] });
        l.fase('cerrojo', 480, { a: 'corredera', llegada: 0.35, pulso: { que: 'corredera', recorrido: 0 }, eventos: [[0.4, s('cerrojo')]] });
        l.fase('volver', 260, { a: 'arma' });
        l.ajustar(T);
        break;

      case 'cohete':   // bazuca: cohete de la espalda, se mete por la cola del tubo hasta que traba
        // La bazuca se carga por la cola: el tubo se corre hacia adelante y baja la boca, así la cola sube hasta detrás de
        // la oreja y la mano llega por arriba del hombro (antes el brazo iba recto hacia atrás, 89° de extensión: el hombro
        // da 60). El RPG-7 se carga por la boca: no hace falta
        const corre = arma.id === 'rpg7' ? { x: 0, y: 0 } : { x: 16, y: 6 }, baja = arma.id === 'rpg7' ? -0.05 : 0.5;
        l.fase('cadera', 700, { a: 'cadera', incl: baja, org: corre, mano: [[arma.id === 'rpg7' ? 'coheteRpg' : 'cohete', 0.5, 1]], alInicio: () => { this.sinCargador = true; } });
        l.fase('cargar', 900, { a: 'cargador', incl: baja, org: corre, mano: [[arma.id === 'rpg7' ? 'coheteRpg' : 'cohete', 0, 0.9]], eventos: [[0.85, llenar('cargador-poner')]] });
        l.fase('volver', 500, { a: 'arma', incl: 0, org: { x: 0, y: 0 } });
        l.ajustar(T);
        break;

      default:   // granada: saca otra del cinturón
        l.fase('cadera', T * 0.55, { a: 'cadera', mano: [['granada', 0.5, 1]], alInicio: () => { this.sinCargador = true; Audio_.recarga('granada', arma.id); } });
        l.fase('volver', T * 0.45, { a: 'arma', mano: [['granada', 0, 0.85]], alTerminar: llenar(null) });
    }
    this.recarga = l.terminar();
  }

  cancelarRecarga() { this.recarga = null; this.ciclo = null; this.sinCargador = false; this.golpeActual = null; this.granadaFuera = this.pasadorFuera = false; }

  // Agarra un arma: si es nueva se suma al inventario; si ya la tenía, le repone munición
  recoger(armaId) {
    const arma = ARMAS[armaId];
    const nueva = !this.inventario.includes(armaId);
    if (nueva) {
      this.inventario.push(armaId);
      this.inventario.sort((a, b) => ORDEN_INVENTARIO.indexOf(a) - ORDEN_INVENTARIO.indexOf(b));
      this.municion[armaId] = arma.cargador;
      if (arma.reservaInicial !== undefined) this.reserva[armaId] = arma.reservaInicial;
      if (!this.montada) { this.indiceArma = this.inventario.indexOf(armaId); this.cancelarRecarga(); }
    } else {
      this.municion[armaId] = arma.cargador;
      if (arma.reservaInicial !== undefined) this.reserva[armaId] = (this.reserva[armaId] || 0) + arma.reservaInicial;
    }
    return nueva;
  }

  cambiarArma(delta) {
    if (this.montada || this.inventario.length < 2) return;
    this.indiceArma = (this.indiceArma + delta + this.inventario.length) % this.inventario.length;
    this.cancelarRecarga();
  }

  // Ranura g (0..4): elige el grupo; si ya está en ese grupo, pasa a la siguiente arma del grupo.
  // Devuelve si había armas de ese grupo en el inventario.
  elegirGrupo(g) {
    if (this.montada || !GRUPOS_ARMAS[g]) return false;
    const ids = this.inventario.filter(id => GRUPOS_ARMAS[g].es(ARMAS[id]));
    if (!ids.length) return false;
    const k = ids.indexOf(this.arma().id);
    const siguiente = ids[(k + 1) % ids.length];
    if (siguiente !== this.arma().id) { this.indiceArma = this.inventario.indexOf(siguiente); this.cancelarRecarga(); }
    return true;
  }

  montar(ametralladora) { this.montada = ametralladora; ametralladora.ocupada = true; this.cancelarRecarga(); }
  desmontar() { if (this.montada) { this.montada.ocupada = false; this.montada = null; this.cancelarRecarga(); } }

  recibirDano(cantidad, juego) {
    if (this.muerto || this.protegido || juego.ahora < this.invulnerableHasta) return;
    this.vida = Math.max(0, this.vida - cantidad);
    this.invulnerableHasta = juego.ahora + 600;
    juego.salpicar(this.x, this.y - 35, '#b71c1c', 10, 3);
    if (this.vida <= 0) { this.muerto = true; this.desmontar(); Audio_.jugadorMuere(); } else Audio_.jugadorHerido();
  }

  /* Estado de la animación en este instante: dónde está el arma y cuánto se inclina, dónde va la mano
   * de apoyo, qué lleva, y cómo están las piezas (abierta, corredera, bombeo, palanca, tapa, peine). */
  // Fuerza del retroceso según el arma: suave en las metralletas, fuerte en escopetas y calibres grandes
  fuerzaRetroceso() {
    const a = this.arma();
    return FUERZA_RETROCESO_ARMA[a.id] ?? FUERZA_RETROCESO[a.categoria] ?? 0.6;
  }

  /* Estado de la animación en este instante. Primero se calcula cómo están las piezas del arma (abierta,
   * corredera, bomba, palanca, tapa) y recién después dónde van las manos: los puntos de agarre se mueven con
   * la pieza que sostienen, así la mano es la que arrastra el cerrojo, tira de la bomba o lleva la manija.
   * El retroceso empuja el arma entera y las manos la acompañan. */
  estadoArma() {
    const arma = this.arma(), d = DIBUJO_ARMAS[arma.id] || DIBUJO_ARMAS.glock, ahora = this.ahora;
    const postura = !this.montada && POSTURAS[d.agarre];
    const base = postura ? postura(d) : this.montada ? { x: ORIGEN_ARMA.x + (this.montada.x - this.x) * this.direccion, y: ORIGEN_ARMA.y } : ORIGEN_ARMA;
    const corta = d.agarre === 'pistola';
    const empuje = this.retroceso * this.fuerzaRetroceso();
    const retroX = empuje * (corta ? 2.4 : 3.2), retroY = empuje * (corta ? 1.6 : 0.4);
    const e = { origen: { x: base.x - retroX, y: base.y - retroY }, retroX, retroY, empuje, incl: 0, apunta: 0, apoyo: null, mano: null, manoGatillo: { x: 0, y: 0 },
      sinCargador: this.sinCargador, corredera: 0, cerrojo: 0, recamara: null, abierto: 0, bombeo: 0, palanca: 0, tapa: 0, peine: null, enMano: null, rotMano: 0, mirar: 0 };
    if (arma.cuerpo && !this.montada) {
      // Cuerpo a cuerpo: guardia → alzar (38 %) → bajar rápido (hasta el 55 %, ahí pega) → volver a la guardia
      const guardia = arma.unaMano ? GOLPE.guardiaUnaMano : GOLPE.guardia, fin = arma.poder === 'escudo' || arma.poder === 'lanza' ? GOLPE.lanzar : GOLPE.golpe;
      const g = this.golpeActual, p = g ? limitar((ahora - g.inicio) / g.dur, 0, 1) : 1;
      let k;
      if (g) {
        if (p < 0.38) k = mezclaPose(guardia, GOLPE.alzada, suavizar(p / 0.38));
        else if (p < 0.55) { const q = (p - 0.38) / 0.17; k = mezclaPose(GOLPE.alzada, fin, q * q); }
        else k = mezclaPose(fin, guardia, suavizar((p - 0.55) / 0.45));
      } else k = { ...guardia, a: guardia.a + Math.sin(ahora / 700) * 0.03 };   // respira con el arma en guardia
      e.origen = { x: k.x, y: k.y }; e.incl = k.a; e.retroX = e.retroY = e.empuje = 0;
      e.sinCargador = !!this.lanzado;
      const c = Math.cos(e.incl), s = Math.sin(e.incl), a = d.manoDelantera;
      e.apoyo = e.mano = e.reposoApoyo = { x: e.origen.x + a.x * c - a.y * s, y: e.origen.y + a.x * s + a.y * c };
      return e;
    }
    const municion = this.municionActual();
    if (!this.montada && arma.recargaTipo === 'cargador-pistola' && municion === 0) e.corredera = 1;   // corredera trabada atrás
    if (!this.montada && arma.recargaTipo === 'cargador-pistola' && !this.recarga) {                    // con cada tiro va atrás y escupe la vaina
      const t = ahora - this.ultimoDisparo;
      if (t >= 0 && t < CICLO_PISTOLA) {
        e.corredera = Math.max(e.corredera, t < 20 ? t / 20 : 1 - (t - 20) / (CICLO_PISTOLA - 20));
        e.recamara = t < 20 ? 'sale' : municion > 0 ? 'entra' : null;   // a los 20 ms la vaina sale (vainaPendiente)
      }
    }
    if (!this.montada && !this.recarga && recargaSola(arma, d)) {   // fusiles, metralletas y semiautomáticas: el cerrojo va y vuelve
      const t = ahora - this.tiroEn, dur = cicloCerrojo(arma);
      if (t >= 0 && t < dur) {
        const p = t / dur;   // abre rápido (con la vaina servida), queda atrás (ahí la escupe) y cierra con la bala nueva
        e.cerrojo = p < 0.28 ? suavizar(p / 0.28) : p < 0.5 ? 1 : 1 - suavizar((p - 0.5) / 0.5);
        e.recamara = p < 0.3 ? 'sale' : p >= 0.5 && municion > 0 ? 'entra' : null;
      }
    }
    if (!this.montada && arma.recargaTipo === 'granada' && (municion === 0 || this.granadaFuera)) e.sinCargador = true;
    e.sinPasador = !!this.pasadorFuera;
    if (!this.montada && arma.recargaTipo === 'cohete' && municion === 0) e.sinCargador = true;     // ya salió el cohete: el tubo queda vacío hasta recargar
    e.origen.y += 2 * Math.max(0, 1 - (ahora - this.golpeEn) / 120);                                    // rebote al encastrar

    // 1) Momento de la animación y estado de las piezas
    const linea = this.recarga || this.ciclo;
    let f = null, i = -1, p = 0, pm = 0, pAccion = 0, q = 0;
    if (linea) {
      i = linea.fases.findIndex(x => ahora < x.hasta); if (i < 0) i = linea.fases.length - 1;
      f = linea.fases[i];
      const previo = i > 0 ? linea.fases[i - 1] : linea.inicial;
      p = limitar((ahora - f.desde) / Math.max(1, f.hasta - f.desde), 0, 1);
      const llegada = f.llegada ?? 1;
      pm = masSuave(Math.min(1, p / llegada));
      pAccion = llegada >= 1 ? p : (p - llegada) / (1 - llegada);
      q = suavizar(limitar(pAccion, 0, 1));
      e.incl = previo.incl + (f.incl - previo.incl) * suavizar(p);
      if (previo.org || f.org) {                                         // el brazo entero se mueve (lanzar la granada)
        const a = previo.org || { x: 0, y: 0 }, b = f.org || a, k = suavizar(p);
        e.origen.x += a.x + (b.x - a.x) * k; e.origen.y += a.y + (b.y - a.y) * k;
      }
      // snap: la pieza encastra de golpe en ese punto de la acción; es rápido (un quinto de la acción) pero no un salto de un cuadro
      const valor = clave => previo[clave] + (f[clave] - previo[clave]) * (f.snap !== undefined ? suavizar(limitar((pAccion - f.snap) / 0.2, 0, 1)) : q);
      e.abierto = valor('ab');
      e.corredera = valor('co');
      if (f.pulso) {                                                     // cerrojo, bomba o palanca que va y vuelve
        const v = Math.sin(q * Math.PI);
        e[f.pulso.que] = Math.max(e[f.pulso.que] || 0, v);
        // Por la ventana: al accionar después de un tiro sale la vaina (hasta la mitad) y después entra otra bala;
        // al cargar la primera, la recámara estaba vacía y solo entra
        e.recamara = this.ciclo === linea && q < 0.5 ? 'sale' : q >= 0.5 && municion > 0 ? 'entra' : null;
        if (f.pulso.que === 'palanca') {   // la mano del gatillo va en el lazo de la palanca: baja y se adelanta con ella
          const lazo = d.moviles && d.moviles.gatillo, [mx, my] = lazo ? lazo(e) : [2 * v / CM, 5 * v / CM];
          e.manoGatillo = { x: mx * CM, y: my * CM };
        }
      }
      if (this.recarga) { const t = Math.min(ahora - linea.inicio, linea.fin - ahora); e.mirar = suavizar(limitar(t / 200, 0, 1)); }
    }
    if (this.montada) { e.incl = 0; e.tapa = e.abierto; }
    else if (corta && linea && (linea.tipo === 'tambor' || linea.tipo === 'tambor-rapido')) { e.origen.x -= 6 * e.mirar; e.origen.y += 8 * e.mirar; }   // el revólver baja a la altura de la canana
    else { e.origen.x -= 4 * e.mirar; e.origen.y += 3 * e.mirar; }     // durante la recarga el arma se acerca al cuerpo
    if (corta) e.incl -= empuje * 0.3;                                  // la pistola levanta la boca al disparar
    else if (!this.montada) e.incl -= empuje * 0.05;                    // el fusil, apenas
    if (d.agarre === 'hombro') e.apunta = 1 - e.mirar;                  // con el arma al hombro, la cabeza va a la culata

    // 2) Puntos de agarre: siguen a la pieza móvil que sostienen (definida en cm en cada modelo)
    const c = Math.cos(e.incl), s = Math.sin(e.incl);
    const enArma = pt => ({ x: e.origen.x + pt.x * c - pt.y * s, y: e.origen.y + pt.x * s + pt.y * c });
    const CLAVES = { arma: 'manoDelantera', cargador: 'cargador', corredera: 'corredera' };
    // Si el guardamanos queda lejos para el brazo, la mano de apoyo se toma más atrás sobre el arma (hasta 12 unidades),
    // así el codo queda doblado debajo y no con el brazo tieso. Se calcula acá y no al dibujar: ese es el lugar de donde
    // sale y adonde vuelve la mano en la recarga (antes saltaba hasta 8 unidades de un cuadro al otro al empezarla)
    let atrasApoyo = 0, adelantoHombro = 0;
    // (salvo que la mano tenga que estar justo ahí: una empuñadura vertical o la pieza que lleva, como el guardamanos de
    // bombeo; ahí el brazo se estira)
    const fijo = d.apoyoVertical || (d.moviles && d.moviles.manoDelantera);
    if (!this.montada && (d.agarre === 'hombro' || d.agarre === 'pecho')) {
      const q = enArma(d.manoDelantera), vx = q.x + retroX - (d.agarre === 'hombro' ? 6 : 3), vy = q.y + retroY + 2 + 52;   // desde el hombro, sin el retroceso
      const R = Math.sqrt(Math.pow((HUESOS.brazo + HUESOS.antebrazo) * 0.95, 2) - 25), va = vx * c + vy * s, falta = vx * vx + vy * vy - R * R;
      if (falta > 0) atrasApoyo = limitar(va * va >= falta ? va - Math.sqrt(va * va - falta) : va, 0, 12);
    }
    // Con la mano fija (empuñadura vertical, bomba) no se corre: el hombro de adelante se adelanta hasta 3 unidades (el
    // cuerpo se perfila hacia el arma) y el brazo se estira lo que falte
    if (fijo && atrasApoyo > 0) { adelantoHombro = Math.min(atrasApoyo, 3); atrasApoyo = 0; }
    const punto = nombre => {
      if (nombre === 'cadera') return BOLSAS[this.montada ? 'cinta' : BOLSA_DE[arma.recargaTipo] || 'cargador'];
      if (nombre === 'frente') return { x: 19, y: -58 };                 // brazo de apoyo estirado adelante, para el lanzamiento
      if (nombre === 'anilla') return enArma({ x: 0.3 * CM, y: -5.6 * CM });
      if (nombre === 'agarreCargador') {   // donde la mano agarra el cargador puesto (js/cargadores.js)
        const M = CARGADORES[arma.id];
        if (M) return enArma({ x: M.agarre[0] * CM, y: M.agarre[1] * CM });
        nombre = 'cargador';
      }
      const clave = CLAVES[nombre], ancla = d[clave], movil = d.moviles && d.moviles[clave], atras = nombre === 'arma' ? atrasApoyo : 0;
      if (!movil) return enArma({ x: ancla.x - atras, y: ancla.y });
      const [dx, dy] = movil(e);
      return enArma({ x: ancla.x + dx * CM - atras, y: ancla.y + dy * CM });
    };
    e.apoyo = punto('arma');
    e.adelantoHombro = adelantoHombro;
    e.reposoApoyo = { x: e.apoyo.x + retroX, y: e.apoyo.y + retroY };   // dónde estaría sin retroceso
    if (!linea) { e.mano = e.apoyo; return e; }

    // 3) La mano: sale de donde terminó la fase anterior, llega al destino y después hace la acción
    const ejeCargador = (() => { const M = CARGADORES[arma.id], [ex, ey] = M ? M.eje : [0, 1]; return [ex * c - ey * s, ex * s + ey * c]; })();
    const desplazamiento = (fase, avance) => {
      let x = fase.offset ? fase.offset.x : 0, y = (fase.offset ? fase.offset.y : 0) + (fase.presionar || 0) * avance;
      if (fase.eje) { const d = y; x = ejeCargador[0] * d; y = ejeCargador[1] * d; }   // el cargador sale y entra a lo largo de su eje
      if (fase.tiron) x -= fase.tiron * Math.sin(avance * Math.PI);
      if (fase.pulso && fase.pulso.recorrido) x -= fase.pulso.recorrido * Math.sin(avance * Math.PI);
      return { x, y };
    };
    const finDe = k => {
      if (k < 0) return punto('arma');
      const fk = linea.fases[k], b = punto(fk.a), o = desplazamiento(fk, 1);
      return { x: b.x + o.x, y: b.y + o.y };
    };
    const inicio = finDe(i - 1), destino = punto(f.a);
    // (o0 va por el mismo eje que oq: con el crudo, la mano saltaba al empezar a poner un cargador inclinado; con el de la P90, 14 unidades)
    const o0 = desplazamiento(f, 0), oq = desplazamiento(f, q);
    e.mano = { x: inicio.x + (destino.x + o0.x - inicio.x) * pm + (oq.x - o0.x), y: inicio.y + (destino.y + o0.y - inicio.y) * pm + (oq.y - o0.y) };
    // La mano no va en línea recta: el brazo gira desde el hombro y el codo, así que el recorrido hace una comba hacia abajo
    const tramoViaje = Math.hypot(destino.x + o0.x - inicio.x, destino.y + o0.y - inicio.y), comba = Math.sin(pm * Math.PI) * Math.min(3.2, tramoViaje * 0.13);
    e.mano.y += comba; e.mano.x -= comba * 0.3;

    if (f.mano) for (const [objeto, desde, hasta] of f.mano) if (p >= desde && (p < hasta || hasta >= 1)) { e.enMano = objeto; break; }
    e.cargadorNuevo = f.nombre !== 'sacar' && f.nombre !== 'soltar';   // el que se saca está vacío; el que se pone, lleno
    if (f.rotMano) e.rotMano = f.rotMano[0] + (f.rotMano[1] - f.rotMano[0]) * suavizar(limitar((p - 0.5) / 0.5, 0, 1));
    if (f.peine && pm >= 1) { const b = punto('cargador'); e.peine = { x: b.x, y: b.y, restante: 1 - q, incl: e.incl }; }

    // 4) Qué está haciendo la mano de apoyo (e.gesto) y cuánto cerró ya sobre lo que agarra (e.agarra, 0..1). La pose
    // la arma el dibujo con la anatomía (js/anatomia.js): cada gesto sigue al antebrazo dentro de lo que da la muñeca,
    // y la mano pasa de uno a otro girando y cerrando de a poco, no de golpe.
    const objeto = e.enMano, cerrando = k => suavizar(limitar(k, 0, 1));
    const CHICOS = { bala: 1, cartucho: 1, granada40: 1, speedloader: 1, peine: 1, pasador: 1 };
    e.agarra = 1;
    if (objeto) e.gesto = CHICOS[objeto] ? 'pinza' : ES_CARGADOR.has(objeto) ? 'cargador' : 'punio';
    else if (f.nombre === 'soltar' || f.nombre === 'lanzar' && p > 0.45) e.gesto = 'suelta';       // abre la mano: suelta el cargador o la granada
    else if (pm < 1 && tramoViaje > 1.5) { e.gesto = 'viaja'; e.agarra = pm; }                      // en camino, entreabierta
    else if (f.a === 'cadera') { e.gesto = 'bolsa'; e.agarra = cerrando((p - 0.35) / 0.15); }       // dedos hacia abajo, a la bolsa
    else if (f.a === 'corredera') {
      const palmea = /palmada|liberar/.test(f.nombre);
      e.gesto = palmea ? 'palmada' : corta ? 'corredera' : 'manija'; e.agarra = cerrando(pAccion / 0.25);
    } else if (f.a === 'cargador' || f.a === 'agarreCargador') { e.gesto = f.peine ? 'empuja' : 'cargador'; e.agarra = tramoViaje > 1.5 ? cerrando(pAccion / 0.3) : 1; }   // agarra el cargador o la boca del arma (si ya estaba ahí, lo sigue teniendo)
    else if (f.a === 'anilla') { e.gesto = 'pinza'; e.agarra = cerrando(pAccion / 0.3); }
    else e.gesto = f.a === 'arma' ? 'apoyo' : 'viaja';
    // Hacia dónde apunta lo que lleva (balas, cartuchos, peines, cohetes): en la bolsa sale con la punta hacia abajo y
    // en el camino gira hasta quedar en línea con el arma, que es como entra
    if (objeto && objeto !== 'granada' && objeto !== 'cinta' && objeto !== 'cajaMinigun' && objeto !== 'celda' && objeto !== 'pasador') {
      const haciaArma = e.incl + (linea.tipo === 'quiebre' ? e.abierto * 0.58 : 0), enBolsa = /cohete/.test(objeto) ? -Math.PI / 2 : 1.15;
      e.apuntaMano = f.a === 'cadera' ? enBolsa : enBolsa + (haciaArma - enBolsa) * suavizar(Math.min(1, pm * 1.25));
    }
    return e;
  }

}
