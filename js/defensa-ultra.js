/* ===== Defensa Zombie Ultra =====
 * El tirador defiende su sector, a la izquierda de la pantalla, con la cara a la derecha. Los zombies llegan desde la
 * derecha por 4 carriles; con ↑ y ↓ el tirador cambia de carril. Arranca con una pistola y poca munición; si se queda
 * sin balas le queda el cuchillo. Durante las olas, y siempre al terminar una, cae en paracaídas una caja con un arma
 * o munición en algún carril de su columna: hay que ir a buscarla antes de que se vaya. Cada zombie muerto da dinero,
 * que se gasta en la tienda (B o el botón TIENDA, pausa la partida): armas, munición y torretas automáticas que
 * disparan solas en su carril (T compra una directo). El ataque aéreo se recarga con el tiempo. Si pasan más de 5
 * zombies, se pierde.
 * Cuelga de Juego (js/juego.js) con `this.ultra`; las balas, los golpes y las cajas respetan el carril.
 */
const ULTRA = {
  carriles: [434, 462, 490, 518],          // y de los pies en cada carril (0 = el del fondo)
  escala: [0.9, 0.95, 1, 1.05],            // los del fondo se ven un poco más chicos
  tiradorX: 300,                           // x en pantalla del tirador
  lineaX: 210,                             // x en pantalla del límite del sector: el zombie que la cruza, pasó
  torretaX: 250,                           // x en pantalla de las torretas (entre la línea y el tirador)
  maxPasados: 5,                           // si pasan más, se pierde
  costoTorreta: [300, 500, 800, 1200],     // cada torreta cuesta más que la anterior (una por carril)
  dineroZombie: 10, dineroCorredor: 15, dineroPorOla: 2,   // lo que paga cada zombie (más en las olas altas)
  recargaAereo: 25,                        // segundos entre ataques aéreos
};
// Armas que pueden caer en las cajas, de menos a más: cada dos olas se abre el nivel siguiente
const ARMAS_ULTRA = [
  ['beretta92', 'colt1911', 'ppk', 'uzi', 'mp5'],
  ['magnum', 'deagle', 'thompson', 'vector', 'p90', 'recortada', 'mossberg'],
  ['ak47', 'm16', 'saiga', 'spas12', 'benelli', 'rem870', 'garand', 'granadas'],
  ['aa12', 'barrett', 'svd', 'm79', 'mgl'],
];
// Precios de la tienda (las armas se van habilitando con las olas, igual que en las cajas)
const PRECIOS_ULTRA = { glock: 100, beretta92: 150, colt1911: 150, ppk: 120, uzi: 350, mp5: 400, magnum: 300, deagle: 350, thompson: 500,
  vector: 550, p90: 600, recortada: 400, mossberg: 450, ak47: 650, m16: 650, saiga: 700, spas12: 650, benelli: 700, rem870: 550,
  garand: 600, granadas: 500, aa12: 1100, barrett: 1300, svd: 900, m79: 800, mgl: 1400 };
const precioArmaUltra = id => PRECIOS_ULTRA[id] ?? 500;
const precioMunicionUltra = id => Math.max(30, Math.round(precioArmaUltra(id) * 0.15 / 10) * 10);   // dos cargadores
const municionQueDa = a => a.reservaInicial !== undefined ? Math.max(1, Math.ceil(a.reservaInicial / 2)) : a.cargador * 2;
// La bala de las torretas: liviana y rápida
const ARMA_TORRETA = { id: 'torreta', nombre: 'Torreta', categoria: 'metralleta', dano: 4, velocidad: 16, alcance: 1500, cargador: 1 };

/* ---------- El cuchillo: lo único que queda sin balas ---------- */
ARMAS.cuchillo = { id: 'cuchillo', nombre: 'Cuchillo', categoria: 'cuerpo', cuerpo: true, unaMano: true, dano: 7, cadencia: 300, golpe: 280,
  alcance: 46, objetivos: 1, empuje: 1.4, filo: true, cargador: 1, automatica: true, color: '#9aa0a8' };
// Cuchillo de combate (30 cm): hoja de 19 cm con filo y canal, guarda de acero, mango estriado y pomo
DIBUJO_ARMAS.cuchillo = modelo({ casquillo: null,
  anclas: { manoDelantera: [0, 6], cargador: [0, 3], corredera: [0, 3], expulsion: [0, 0], boca: [0.5, -20] },
  dibujarCm(ctx) {
    pintar(ctx, RRc(-1.6, -0.6, 3.2, 11.4, 1.2), '#2a2b2f');                                                   // mango
    for (let y = 1; y < 10; y += 1.4) trazo(ctx, 'rgba(255,255,255,0.08)', 0.35, [[-1.4, y], [1.4, y]]);      // estrías
    pintar(ctx, Cc(0, 11.2, 1.0, 10), MAT.acero);                                                               // pomo
    pintar(ctx, RRc(-3.0, -1.8, 6.0, 1.3, 0.5), MAT.acero);                                                     // guarda
    pintar(ctx, [[-1.3, -1.8], [1.5, -1.8], [1.8, -12], [1.2, -17], [0, -19.8], [-1.0, -16.5], [-1.3, -10]], MAT.inox, { brillo: 0.5 });   // hoja
    trazo(ctx, 'rgba(255,255,255,0.6)', 0.3, [[1.5, -3], [1.7, -12], [1.1, -16.6]]);                            // filo
    trazo(ctx, 'rgba(0,0,0,0.35)', 0.25, [[-0.2, -2.5], [-0.2, -13]]);                                          // canal
  } });
Object.assign(DIBUJO_ARMAS.cuchillo, { agarre: 'cuerpo', anguloEmpunadura: 0 });

/* ---------- Zombie de carril: camina derecho hacia el sector ---------- */
class ZombieCarril extends Zombie {
  constructor(x, carril, corredor, dificultad) {
    super(x, corredor, dificultad);
    this.carril = carril;
    this.escala *= ULTRA.escala[carril];
    this.ancho = 26 * this.escala; this.alto = 64 * this.escala;
    this.y = ULTRA.carriles[carril];
    this.direccion = -1;
  }
  actualizar(dt, jugador, juego) {
    const paso = dt * 60, ahora = juego.ahora;
    this.ahora = ahora;
    if (this.estado === 'muerto') { this.tiempoMuerto += dt; return; }
    // Si el tirador está en su carril, se le tira encima y lo muerde; si no, sigue de largo hacia el sector
    const dx = this.x - jugador.x;
    const alcanza = !this.paso && jugador.carril === this.carril && !jugador.muerto && dx > -12 && dx < 34;
    this.direccion = -1;
    if (alcanza) {
      this.estado = 'ataca';
      this.fase += dt * 4;
      if (ahora >= this.ataqueEn) { this.ataqueEn = ahora + 900; jugador.recibirDano(this.mordida, juego); Audio_.zombieGolpea(); }
    } else {
      this.estado = 'camina';
      const tiron = this.corredor ? 1 : 0.55 + Math.max(0, Math.sin(this.fase)) * 0.9;
      this.x -= this.velocidad * tiron * paso;
      this.fase += dt * (this.corredor ? 14 : 6);
    }
    if (Math.abs(this.empuje) > 0.05) { this.x += this.empuje * paso; this.empuje *= Math.pow(0.8, paso); }
    this.y = ULTRA.carriles[this.carril];
    if (Math.abs(dx) < 500 && ahora >= this.gemidoEn) { this.gemidoEn = ahora + 2500 + Math.random() * 5000; if (Math.random() < 0.6) Audio_.gemido(false, Math.abs(dx)); }
    juego.revisarPaso(this);
  }
}

/* ---------- Torreta automática: dispara al primer zombie de su carril ---------- */
class TorretaCarril {
  constructor(x, carril) { this.x = x; this.carril = carril; this.y = ULTRA.carriles[carril]; this.proximo = 0.5; this.retro = 0; this.vivo = true; this.apuntando = false; }
  actualizar(dt, juego) {
    this.retro = Math.max(0, this.retro - dt * 8);
    this.proximo -= dt;
    const objetivo = juego.zombies.some(z => z.carril === this.carril && z.estado !== 'muerto' && !z.paso && z.x > this.x && z.x < juego.camaraX + ANCHO);
    this.apuntando = objetivo;
    if (!objetivo || this.proximo > 0) return;
    this.proximo = 0.34;
    const s = ULTRA.escala[this.carril], bocaX = this.x + 34 * s, bocaY = this.y - 27 * s;
    const p = new Proyectil(ARMA_TORRETA, bocaX, bocaY, ARMA_TORRETA.velocidad, 0);
    p.carril = this.carril; p.pisoY = this.y; p.desdeX = this.x;
    juego.proyectiles.push(p);
    juego.explosiones.push(new Fogonazo(bocaX, bocaY, 1, 5, 'fuego'));
    this.retro = 1;
    Audio_.disparo('metralleta', 'uzi');
  }
  dibujar(ctx, camaraX) {
    const s = ULTRA.escala[this.carril];
    ctx.save(); ctx.translate(this.x - camaraX, this.y); ctx.scale(s, s);
    sombraElipse(ctx, 0, 1, 20, 4, 0.35);
    ctx.strokeStyle = tinta('#24262b'); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(0, -16); ctx.lineTo(13, 0); ctx.moveTo(0, -16); ctx.lineTo(-2, 0); ctx.stroke();   // trípode
    parte(ctx, -13, -27, 12, 9, '#4a5532');                                    // caja de munición
    parte(ctx, -7 - this.retro * 2, -33, 22, 11, '#3a3c43');                  // cajón
    parte(ctx, 15 - this.retro * 3, -29.5, 19, 4, '#232429');                 // cañón
    parte(ctx, 32 - this.retro * 3, -30.5, 3, 6, '#3a3c43');                  // bocacha
    ctx.fillStyle = tinta(this.apuntando ? '#ff6b3c' : '#7ee081'); ctx.fillRect(-3, -31, 3, 3);   // luz: verde espera, roja tira
    ctx.restore();
  }
}

/* ---------- Caja en paracaídas: arma o munición, para un carril ---------- */
class CajaCarril extends Caja {
  constructor(x, carril, contenido) {
    super(x, contenido.armaId || ARMA_INICIAL, false);
    this.carril = carril; this.contenido = contenido;
    this.destinoY = ULTRA.carriles[carril]; this.y = -40; this.aterrizada = false; this.resta = 13;
  }
  actualizar(dt) {
    this.t += dt;
    if (!this.aterrizada) { this.y += 140 * dt; if (this.y >= this.destinoY) { this.y = this.destinoY; this.aterrizada = true; } }
    else { this.resta -= dt; if (this.resta <= 0) this.vivo = false; }
  }
  tocaA(jugador) { return this.aterrizada && jugador.carril === this.carril && Math.abs(jugador.x - this.x) < 50; }
  alRecoger(juego) { juego.recogerCajaUltra(this); }
  dibujar(ctx, camaraX) {
    if (this.aterrizada && this.resta < 3 && Math.floor(this.resta * 6) % 2) return;   // titila antes de irse
    const sx = this.x - camaraX, s = ULTRA.escala[this.carril], municion = this.contenido.tipo === 'municion';
    if (this.aterrizada) sombraElipse(ctx, sx + 6 * s, this.y + 2, 22 * s, 6 * s, 0.3);
    ctx.save(); ctx.translate(sx, this.y - 14 * s); ctx.scale(s, s);
    if (!this.aterrizada) {   // paracaídas
      ctx.strokeStyle = tinta('rgba(230,225,210,0.7)'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-15, -12); ctx.lineTo(-26, -58); ctx.moveTo(14, -12); ctx.lineTo(26, -58); ctx.moveTo(0, -12); ctx.lineTo(0, -62); ctx.stroke();
      ctx.fillStyle = tinta(municion ? '#c9a96e' : '#b83a2a');
      ctx.beginPath(); ctx.moveTo(-32, -56); ctx.quadraticCurveTo(0, -92, 32, -56); ctx.quadraticCurveTo(16, -62, 0, -58); ctx.quadraticCurveTo(-16, -62, -32, -56); ctx.fill();
    }
    cubo(ctx, -16, -12, 30, 26, 10, municion ? '#4a5532' : '#8a5a2b');
    ctx.strokeStyle = tinta(municion ? '#2a3020' : '#5a3a18'); ctx.lineWidth = 2; ctx.strokeRect(-16, -12, 30, 26);
    ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(14, 14); ctx.moveTo(14, -12); ctx.lineTo(-16, 14); ctx.stroke();
    if (!Pincel.silueta) {
      const etiqueta = municion ? t('ultra.municion') : ARMAS[this.contenido.armaId].nombre;
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      const w = Math.max(70, ctx.measureText(etiqueta).width + 14);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-w / 2, -44, w, 16);
      ctx.fillStyle = municion ? '#c9e08a' : '#ffd27a'; ctx.fillText(etiqueta, 0, -32);
    }
    ctx.restore();
  }
}

/* ---------- Lo que se agrega a la partida ---------- */
Object.assign(Juego.prototype, {
  prepararUltra() {
    const j = this.jugador;
    j.carril = 1; j.direccion = 1; this.yTirador = ULTRA.carriles[1]; j.y = this.yTirador;
    // Una pistola con un cargador de repuesto, y el cuchillo
    j.inventario = ['cuchillo', ARMA_INICIAL];
    j.municion = { cuchillo: 1, [ARMA_INICIAL]: ARMAS[ARMA_INICIAL].cargador };
    j.reserva = { [ARMA_INICIAL]: ARMAS[ARMA_INICIAL].cargador };
    j.indiceArma = 1;
    this.pasados = 0; this.dinero = 0; this.torretas = []; this.proximaCaja = 15; this.enTienda = false;
    this.camaraX = j.x - ULTRA.tiradorX;
    this.aereo.recarga = ULTRA.recargaAereo;
  },

  // El tirador queda fijo en su columna: ↑ y ↓ cambian de carril; nada de caminar, saltar ni agacharse
  actualizarJugadorUltra(dt, e) {
    const j = this.jugador;
    if (!j.muerto) {
      if (e.saltarPulsado) this.cambiarCarril(-1);
      if (e.abajoPulsado) this.cambiarCarril(1);
    }
    e.saltarPulsado = false; e.abajoPulsado = false;
    j.actualizar(dt, { derecha: false, izquierda: false, abajo: false, saltarPulsado: false }, this);
    this.yTirador += (ULTRA.carriles[j.carril] - this.yTirador) * Math.min(1, dt * 16);
    j.x = this.camaraX + ULTRA.tiradorX; j.y = this.yTirador; j.vx = 0; j.vy = 0; j.enSuelo = true; j.caminando = false;
    if (!j.muerto) j.direccion = 1;
    this.revisarMunicionUltra();
  },
  cambiarCarril(delta) {
    const j = this.jugador, nuevo = Math.max(0, Math.min(ULTRA.carriles.length - 1, j.carril + delta));
    if (nuevo !== j.carril) j.carril = nuevo;
  },
  // Sin balas en el arma de la mano: pasa a otra que tenga, o al cuchillo
  revisarMunicionUltra() {
    const j = this.jugador, a = j.arma();
    if (j.muerto || a.cuerpo || j.recargando()) return;
    const vacia = id => (j.municion[id] || 0) <= 0 && (j.reserva[id] ?? Infinity) <= 0;
    if (!vacia(a.id)) return;
    const otra = j.inventario.find(id => !ARMAS[id].cuerpo && !vacia(id));
    j.indiceArma = j.inventario.indexOf(otra || 'cuchillo');
    j.cancelarRecarga();
    this.aviso(otra ? t('ultra.cambiaArma', { arma: ARMAS[otra].nombre.toUpperCase() }) : t('ultra.cuchillo'), 1800);
  },

  // Olas desde la derecha, repartidas en los carriles; cada ola es peor (las mismas reglas que la defensa clásica)
  aparecerOlaUltra(dt) {
    const d = this.dificultad, ola = this.ajustesDeOla(this.ronda);
    this.proximoZombie -= dt;
    if (this.proximoZombie > 0 || this.zombiesVivos() >= ola.maxVivos) return;
    this.proximoZombie = ola.intervalo * 1.6 * (0.7 + Math.random() * 0.6);
    const grupo = Math.min(this.porAparecer, 1 + Math.floor(Math.random() * Math.min(4, 1 + this.ronda / 3)));
    const carriles = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    for (let k = 0; k < grupo; k++) {
      const z = new ZombieCarril(this.camaraX + ANCHO + 40 + Math.random() * 160, carriles[k % 4], Math.random() < ola.corredores, d);
      z.velocidad *= ola.velocidad * 0.85;
      z.vidaMax = z.vida = Math.max(1, Math.round(d.vidaZombie * ola.vida * AJUSTE.vidaZombie));
      this.zombies.push(z);
      this.porAparecer--;
    }
  },
  // El que cruza la línea del sector, pasó: más de 5 y se pierde. Sigue caminando hasta salir de la pantalla.
  revisarPaso(z) {
    const sx = z.x - this.camaraX;
    if (!z.paso && sx < ULTRA.lineaX) {
      z.paso = true; this.pasados++;
      this.aviso(t('ultra.paso', { n: this.pasados, max: ULTRA.maxPasados }), 1800);
      Audio_.zombieGolpea();
      this.sacudida = Math.max(this.sacudida, 6);
      if (this.pasados > ULTRA.maxPasados && !this.terminado) { this.terminado = true; this.resultado = 'invadido'; }
    }
    if (z.paso && sx < -60) { z.estado = 'muerto'; z.tiempoMuerto = 99; }
  },
  // Dinero por zombie: más por los corredores y por las olas altas
  cobrarZombieUltra(z) {
    const paga = (z.corredor ? ULTRA.dineroCorredor : ULTRA.dineroZombie) + Math.max(0, this.ronda - 1) * ULTRA.dineroPorOla;
    this.dinero += paga;
    this.explosiones.push(new TextoFlotante(z.x, z.y - z.alto - 14, `+$${paga}`, '#8fe07a'));
  },

  /* Torretas */
  costoTorreta() { return ULTRA.costoTorreta[this.torretas.length] ?? null; },
  comprarTorreta() {
    if (!this.ultra || this.terminado || this.jugador.muerto) return;
    const carril = this.jugador.carril, costo = this.costoTorreta();
    if (costo === null) { this.aviso(t('ultra.todasTorretas'), 1400); return; }
    if (this.torretas.some(tt => tt.carril === carril)) { this.aviso(t('ultra.carrilConTorreta'), 1400); return; }
    if (this.dinero < costo) { this.aviso(t('ultra.faltaDinero', { n: costo - this.dinero }), 1400); return; }
    this.dinero -= costo;
    this.torretas.push(new TorretaCarril(this.camaraX + ULTRA.torretaX, carril));
    this.aviso(t('ultra.torretaPuesta'), 1400);
    Audio_.recoger();
  },

  /* Cajas */
  cajasUltra(dt) {
    if (this.ronda === 0) return;   // antes de la primera ola, nada
    this.proximaCaja -= dt;
    if (this.proximaCaja > 0) return;
    this.proximaCaja = (13 + Math.random() * 7) / AJUSTE.cajas;
    if (this.cajas.length < 2) this.soltarCajaUltra(false);
  },
  // Cae en un carril que no es el del tirador: hay que ir a buscarla
  soltarCajaUltra(soloArma) {
    const j = this.jugador, otros = [0, 1, 2, 3].filter(c => c !== j.carril && !this.cajas.some(k => k.carril === c));
    if (!otros.length) return;
    const carril = otros[Math.floor(Math.random() * otros.length)];
    const municion = !soloArma && Math.random() < 0.45;
    this.cajas.push(new CajaCarril(j.x + 34, carril, municion ? { tipo: 'municion' } : { tipo: 'arma', armaId: this.armaParaCaja() }));
    this.aviso(t('ultra.cajaCae'), 1400);
  },
  // Le da el arma con el cargador lleno y munición de repuesto; si ya la tenía, le suma munición
  darArmaUltra(id) {
    const j = this.jugador, a = ARMAS[id], nueva = !j.inventario.includes(id), previa = j.reserva[id] || 0;
    j.recoger(id);   // llena el cargador y, si es nueva, la pone en la mano
    if (a.reservaInicial === undefined) j.reserva[id] = (nueva ? 0 : previa) + a.cargador * (a.cargador <= 8 ? 3 : 2);
    return nueva;
  },
  nivelArmasUltra() { return Math.min(ARMAS_ULTRA.length - 1, Math.floor((Math.max(1, this.ronda) - 1) / 2)); },
  armaParaCaja() {
    const nivel = this.nivelArmasUltra();
    const lista = Math.random() < 0.7 ? ARMAS_ULTRA[nivel] : ARMAS_ULTRA[Math.floor(Math.random() * (nivel + 1))];
    return lista[Math.floor(Math.random() * lista.length)];
  },
  recogerCajaUltra(c) {
    const j = this.jugador;
    if (c.contenido.tipo === 'municion') {
      for (const id of j.inventario) { const a = ARMAS[id]; if (!a.cuerpo) j.reserva[id] = (j.reserva[id] || 0) + municionQueDa(a); }
      this.aviso(t('ultra.municionRecogida'), 1600);
    } else {
      const id = c.contenido.armaId, nueva = this.darArmaUltra(id);
      this.aviso(t(nueva ? 'aviso.nueva' : 'aviso.municion') + ARMAS[id].nombre.toUpperCase(), 1800);
    }
    Audio_.recoger();
  },

  /* Dibujo: carriles, línea del sector, y todo ordenado por profundidad */
  dibujarCarrilesUltra(ctx, cam) {
    const c = ULTRA.carriles, j = this.jugador, x0 = ULTRA.lineaX;
    // Carril del tirador, apenas iluminado
    const yj = c[j.carril];
    ctx.fillStyle = 'rgba(255, 210, 122, 0.07)'; ctx.fillRect(x0, yj - 14, ANCHO - x0, 22);
    // Divisiones entre carriles: líneas blancas cortadas
    ctx.fillStyle = 'rgba(230, 225, 210, 0.3)';
    const desfase = ((cam % 48) + 48) % 48;
    for (let k = 0; k < c.length - 1; k++) {
      const y = (c[k] + c[k + 1]) / 2 + 3;
      for (let x = x0 - desfase; x < ANCHO; x += 48) if (x + 26 > x0) ctx.fillRect(Math.max(x0, x), y, 26, 2);
    }
    // El sector: zona sombreada detrás de la línea, y la línea con franjas de peligro
    ctx.fillStyle = 'rgba(160, 30, 20, 0.12)'; ctx.fillRect(0, c[0] - 18, x0, c[c.length - 1] - c[0] + 30);
    for (let y = c[0] - 18; y < c[c.length - 1] + 12; y += 8) {
      ctx.fillStyle = Math.floor(y / 8) % 2 ? '#e2bf2f' : '#1a1a1a';
      ctx.fillRect(x0 - 3, y, 6, 8);
    }
  },
  dibujarEntidadesUltra(ctx, cam) {
    const j = this.jugador, cosas = [];
    for (const c of this.cajas) cosas.push([c.aterrizada ? c.y - 0.2 : 9999, () => c.dibujar(ctx, cam)]);   // las que caen, encima de todo
    for (const tt of this.torretas) cosas.push([tt.y - 0.1, () => tt.dibujar(ctx, cam)]);
    for (const z of this.zombies) cosas.push([z.y, () => z.dibujar(ctx, cam, this.ahora)]);
    cosas.push([j.y + 0.1, () => j.dibujar(ctx, cam, this.ahora)]);
    cosas.sort((a, b) => a[0] - b[0]);
    Pincel.bisel = this.zombies.length <= 25;
    for (const [, dibujar] of cosas) dibujar();
    Pincel.bisel = true;
  },
  hudUltra() {
    const h = this.hud, tactil = document.body.classList.contains('tactil');
    h.mision.classList.add('activa');
    h.mision.innerHTML = `<span class="dinero">$${this.dinero}</span> · ${t('ultra.hudTienda', { tecla: tactil ? '' : ' (B)' })}` +
      ` · <span class="${this.pasados >= ULTRA.maxPasados - 1 ? 'cuenta' : ''}">${t('ultra.hudPasaron', { n: this.pasados, max: ULTRA.maxPasados })}</span>`;
  },

  /* ---------- Tienda: se abre con B (o el botón TIENDA) y pausa la partida ---------- */
  alternarTienda() {
    if (!this.ultra || this.terminado || this.jugador.muerto) return;
    this.enTienda = !this.enTienda;
    const capa = document.getElementById('tienda-ultra');
    capa.classList.toggle('oculta', !this.enTienda);
    Object.assign(this.entrada, { derecha: false, izquierda: false, abajo: false, disparar: false, dispararPulsado: false, saltarPulsado: false, abajoPulsado: false });
    if (this.enTienda) { this.pintarTienda(); capa.querySelector('button:not([disabled])')?.focus(); }
  },
  pintarTienda() {
    const j = this.jugador, nivel = this.nivelArmasUltra(), dinero = this.dinero;
    document.getElementById('tienda-dinero').textContent = `$${dinero}`;
    const boton = (accion, titulo, detalle, precio, extra = '') => {
      const caro = precio !== null && precio > dinero;
      return `<button type="button" class="tienda-item${caro ? ' caro' : ''}" data-comprar="${accion}"${caro || precio === null ? ' disabled' : ''}>` +
        `<span class="nombre">${titulo}</span><span class="detalle">${detalle}</span>${precio !== null ? `<span class="precio">$${precio}</span>` : ''}${extra}</button>`;
    };
    // Torreta para el carril donde está el tirador
    const costo = this.costoTorreta(), ocupado = this.torretas.some(tt => tt.carril === j.carril);
    let html = `<section><h3>${t('tienda.torreta')}</h3><div class="tienda-fila">` +
      (costo === null ? boton('nada', t('tienda.torretaNombre'), t('ultra.todasTorretas'), null)
        : ocupado ? boton('nada', t('tienda.torretaNombre'), t('ultra.carrilConTorreta'), null)
        : boton('torreta', t('tienda.torretaNombre'), t('tienda.torretaDetalle', { carril: j.carril + 1, n: this.torretas.length + 1 }), costo)) +
      `</div></section>`;
    // Munición para las armas que tiene
    const propias = j.inventario.filter(id => !ARMAS[id].cuerpo);
    html += `<section><h3>${t('tienda.municion')}</h3><div class="tienda-fila">` +
      propias.map(id => boton('municion:' + id, ARMAS[id].nombre, t('tienda.balas', { n: municionQueDa(ARMAS[id]), tienes: (j.municion[id] || 0) + (j.reserva[id] || 0) }), precioMunicionUltra(id))).join('') +
      `</div></section>`;
    // Armas: las del nivel de esta ola y las anteriores; las que vienen, bloqueadas
    html += `<section><h3>${t('tienda.armas')}</h3><div class="tienda-fila">`;
    ARMAS_ULTRA.forEach((lista, n) => lista.forEach(id => {
      if (j.inventario.includes(id)) html += boton('nada', ARMAS[id].nombre, t('tienda.laTienes'), null);
      else if (n > nivel) html += boton('nada', ARMAS[id].nombre, t('tienda.desdeOla', { ola: n * 2 + 1 }), null, '<span class="candado">🔒</span>');
      else html += boton('arma:' + id, ARMAS[id].nombre, t('tienda.conBalas', { n: ARMAS[id].reservaInicial ?? ARMAS[id].cargador * (ARMAS[id].cargador <= 8 ? 4 : 3) }), precioArmaUltra(id));
    }));
    html += `</div></section>`;
    document.getElementById('tienda-contenido').innerHTML = html;
  },
  comprarEnTienda(accion) {
    const j = this.jugador;
    if (accion === 'cerrar') return this.alternarTienda();
    if (accion === 'torreta') { this.comprarTorreta(); }
    else if (accion.startsWith('municion:')) {
      const id = accion.slice(9), precio = precioMunicionUltra(id);
      if (this.dinero < precio || !j.inventario.includes(id)) return;
      this.dinero -= precio; j.reserva[id] = (j.reserva[id] || 0) + municionQueDa(ARMAS[id]);
      Audio_.recoger();
    } else if (accion.startsWith('arma:')) {
      const id = accion.slice(5), precio = precioArmaUltra(id);
      if (this.dinero < precio || j.inventario.includes(id)) return;
      this.dinero -= precio; this.darArmaUltra(id);
      Audio_.recoger();
    }
    this.pintarTienda();
  },
});

// Botones de la tienda (delegación: el contenido se rearma después de cada compra)
document.getElementById('tienda-ultra').addEventListener('click', e => {
  const b = e.target.closest('[data-comprar]'), juego = window.ZonaMuerta && ZonaMuerta.juego();
  if (b && juego && juego.ultra && !b.disabled) juego.comprarEnTienda(b.dataset.comprar);
});
