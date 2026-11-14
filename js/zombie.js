/* ===== Zombie =====
 * Piel verde, camiseta azul manchada de sangre y mugre, pantalón marrón desgarrado.
 * Vida, velocidad y mordida dependen de la dificultad. Cada uno sale con variaciones (pelo, heridas,
 * un brazo colgando, manchas) y se pinta con las mismas herramientas de ilustración que el protagonista.
 */
const COLORES_ZOMBIE = { pantalon: '#6b4a2b', camiseta: '#2c58b8', sangre: '#6e0b0b', sangreFresca: '#9a1010', dientes: '#d9d2b0', boca: '#2a0606' };
const azarEntre = (a, b) => a + Math.random() * (b - a);

/* 15 variantes: ropa, colores, tamaño y accesorio. Los caminantes usan las 10 primeras, los corredores
 * (más chicos y rápidos) las 5 últimas. Encima cada zombie varía un poco el tono de la ropa y de la piel.
 *   torso     abierta (camisa sin abrochar, se ve la panza) | musculosa | remera | chaleco | uniforme | capucha | overol
 *   piernas   short (a la rodilla) | largo (pantalón roto) | corto (short deportivo) */
const VARIANTES_CAMINANTE = [
  { id: 'leñador',     torso: 'abierta', estampado: 'cuadros', camiseta: '#2c58b8', piernas: 'short', pantalon: '#6b4a2b', escala: [0.95, 1.1] },
  { id: 'camisa-roja', torso: 'abierta', estampado: 'cuadros', camiseta: '#9e2a26', piernas: 'short', pantalon: '#3e5578', escala: [0.95, 1.08] },
  { id: 'oficinista',  torso: 'abierta', estampado: 'lisa', camiseta: '#e2ded2', corbata: '#3a2a6a', piernas: 'largo', pantalon: '#4a4c52', escala: [0.95, 1.06] },
  { id: 'obrero',      torso: 'chaleco', camiseta: '#6d6f73', chaleco: '#e8761c', piernas: 'largo', pantalon: '#3e5578', accesorio: 'casco-obra', escala: [1.0, 1.12] },
  { id: 'enfermero',   torso: 'remera', camiseta: '#7fb7c9', piernas: 'largo', pantalon: '#6ea6b8', accesorio: 'barbijo', escala: [0.92, 1.04] },
  { id: 'policia',     torso: 'uniforme', placa: true, camiseta: '#2a3858', piernas: 'largo', pantalon: '#1e2333', accesorio: 'gorra-policia', escala: [0.98, 1.1] },
  { id: 'turista',     torso: 'abierta', estampado: 'floral', camiseta: '#e0662a', camara: true, piernas: 'short', pantalon: '#b9a57a', escala: [0.95, 1.08] },
  { id: 'chef',        torso: 'uniforme', botonesDobles: true, camiseta: '#e6e2d8', piernas: 'largo', pantalon: '#3a3a3a', accesorio: 'gorro-chef', escala: [0.98, 1.1] },
  { id: 'granjero',    torso: 'overol', camiseta: '#9e2a26', overol: '#3e5578', piernas: 'largo', pantalon: '#3e5578', accesorio: 'sombrero-paja', escala: [1.0, 1.12] },
  { id: 'gordo',       torso: 'abierta', estampado: 'lisa', camiseta: '#d8c05a', panza: true, piernas: 'short', pantalon: '#5a5a2a', escala: [1.12, 1.22] },
];
const VARIANTES_CORREDOR = [
  { id: 'maratonista', torso: 'musculosa', camiseta: '#8c2a26', dorsal: true, piernas: 'corto', pantalon: '#24252a', zapatilla: true, escala: [0.78, 0.83] },
  { id: 'basquet',     torso: 'musculosa', camiseta: '#e2b81e', numero: '#5a2a8a', piernas: 'short', pantalon: '#5a2a8a', accesorio: 'vincha', escala: [0.8, 0.86] },
  { id: 'capucha',     torso: 'capucha', camiseta: '#5d6066', piernas: 'largo', pantalon: '#2e3034', accesorio: 'capucha', escala: [0.76, 0.82] },
  { id: 'ciclista',    torso: 'remera', franja: '#f2f2ea', camiseta: '#3fbf3a', piernas: 'corto', pantalon: '#1d1d22', zapatilla: true, accesorio: 'casco-ciclista', escala: [0.78, 0.84] },
  { id: 'adolescente', torso: 'remera', estampa: '#f2d24a', camiseta: '#3a6fd8', piernas: 'short', pantalon: '#2e3a55', accesorio: 'gorra-atras', escala: [0.68, 0.74] },
];
const PIELES_ZOMBIE = ['#6aa641', '#5a9436', '#7bb352', '#6f9c4a', '#7d9a62', '#8aa86a', '#5f8a4e', '#86a24c'];
// Elige una variante distinta de la última que salió (así dos seguidos nunca son iguales)
const ultimaVariante = { caminante: -1, corredor: -1 };
function elegirVariante(corredor) {
  const lista = corredor ? VARIANTES_CORREDOR : VARIANTES_CAMINANTE, clave = corredor ? 'corredor' : 'caminante';
  let k; do { k = Math.floor(Math.random() * lista.length); } while (lista.length > 1 && k === ultimaVariante[clave]);
  ultimaVariante[clave] = k;
  return lista[k];
}
const variarColor = c => ajustarColor(c, (Math.random() - 0.5) * 0.18);

/* Brazo o pierna de un zombie: varias piezas en un solo trazado (js/anatomia.js) con el contorno por detrás (queda solo
 * en la silueta del conjunto, sin círculos en las articulaciones) y dos tonos planos: la forma en sombra y, encima,
 * la misma más fina y corrida hacia la luz. Hace lo que `forma`, la pintura del jugador, pero sin recortar: en una
 * horda de 60 (480 miembros por cuadro) el recorte costaba 7 de los 17 ms, y un degradado, casi lo mismo.
 * hacer(menos): el trazado del miembro con `menos` de ancho de menos. */
function miembroZombie(ctx, hacer, color) {
  ctx.beginPath(); hacer(0)(ctx);
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fill(); return; }
  ctx.strokeStyle = 'rgba(18, 12, 9, 0.7)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = ajustarColor(color, -0.22); ctx.fill();
  ctx.save(); ctx.translate(-0.3, -0.45); ctx.beginPath(); hacer(1.25)(ctx); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
// La pose de la garra (se reusa: una horda no arma un objeto por mano y por cuadro)
const GARRA = { cierre: [0, 0, 0, 0], nudillo: 0.6, abre: 1, pulgar: { suelto: 1, largo: 0, cierra: 0, arriba: 0, sube: 0 } };
// Muerte: segundos hasta quedar de rodillas, hasta desplomarse, lo que tarda en caer y cuándo termina de desvanecerse
const MUERTE = { rodillas: 0.35, desploma: 1.0, caida: 0.45, fin: 4.45 };

class Zombie {
  constructor(x, corredor, dificultad) {
    this.x = x; this.y = alturaSuelo(x);
    this.vidaMax = Math.max(1, Math.round(dificultad.vidaZombie * AJUSTE.vidaZombie));
    this.vida = this.vidaMax;
    this.mordida = dificultad.danoMordida * AJUSTE.mordida;
    this.corredor = !!corredor;
    this.velocidad = (corredor ? 2.3 + Math.random() * 0.5 : 0.9 + Math.random() * 0.6) * dificultad.velocidad * AJUSTE.velocidadZombie;
    // Variante de ropa y tamaño: el corredor es más chico y flaco (y más difícil de acertar)
    this.estilo = elegirVariante(corredor);
    this.escala = azarEntre(...this.estilo.escala);
    this.ropa = corredor ? 'corredor' : 'comun';
    this.piel = PIELES_ZOMBIE[Math.floor(Math.random() * PIELES_ZOMBIE.length)];
    this.variante = {
      pelo: ['ralo', 'calvo', 'largo', 'ralo'][Math.floor(Math.random() * 4)],
      brazoColgando: !corredor && Math.random() < 0.25,          // un brazo cuelga inerte
      // hasta dónde llega la tela en la canilla: short a la rodilla (casi nada) o pantalón largo roto a distinta altura
      rotoIzq: this.estilo.piernas === 'largo' ? azarEntre(0.35, 0.8) : azarEntre(0, 0.18), rotoDer: this.estilo.piernas === 'largo' ? azarEntre(0.45, 0.9) : azarEntre(0, 0.22),
      dorsal: 10 + Math.floor(Math.random() * 890),                // número del dorsal del corredor
      zapatilla: Math.random() < 0.7,                               // al corredor le quedó una zapatilla puesta
      agujeroRodilla: Math.random() < 0.6,
      desgarroCamiseta: Math.random() < 0.65,
      heridaCabeza: Math.random() < 0.4,
      manchas: Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => ({ x: azarEntre(-10, 9), y: azarEntre(-54, -38), r: azarEntre(1.8, 4.2), sangre: Math.random() < 0.6, gotas: Math.floor(Math.random() * 3) })),
    };
    this.direccion = -1;
    this.estado = 'camina';          // camina | ataca | muerto
    this.fase = Math.random() * 6;
    this.ataqueEn = 0;
    this.golpeadoHasta = 0;
    this.empuje = 0;
    this.tiempoMuerto = 0;
    this.gemidoEn = 0;
    this.ahora = 0;
    this.ancho = 26 * this.escala; this.alto = 64 * this.escala;
    // Lo que cambia en las variantes (el tóxico): colores, sangre, altura sobre el piso, giro y piernas recogidas
    this.colores = { ...COLORES_ZOMBIE, camiseta: variarColor(this.estilo.camiseta), pantalon: variarColor(this.estilo.pantalon) }; this.colorSangre = '#8b0f0f'; this.colorCharco = 'rgba(80, 6, 6, 0.75)';
    this.altura = 0; this.giro = 0; this.recogido = 0; this.bocaAbierta = 0; this.cabezaAtras = 0;
  }

  actualizar(dt, jugador, juego) {
    const paso = dt * 60, ahora = juego.ahora;
    this.ahora = ahora;
    if (this.estado === 'muerto') { if (this.muerte) this.moverCadaver(dt, juego); else this.tiempoMuerto += dt; return; }
    if (this.maniqui) {   // blanco del campo de pruebas: mira al jugador, acusa los tiros y nada más
      this.direccion = jugador.x >= this.x ? 1 : -1;
      this.fase += dt * 1.5;
      if (Math.abs(this.empuje) > 0.05) { this.x += this.empuje * paso; this.empuje *= Math.pow(0.8, paso); }
      this.y = alturaSuelo(this.x);
      return;
    }

    if (this.cabezaAtras < 0) this.cabezaAtras = Math.min(0, this.cabezaAtras + dt * 1.8);   // levanta la cabeza al despertar
    // Trepando un escalón: el cuerpo sube de a poco hasta quedar arriba; mientras tanto no muerde
    if (this.trepa) {
      const T = this.trepa; T.t += dt; const f = Math.min(1, T.t / T.dur), s = f * f * (3 - 2 * f);
      this.x = T.x0 + (T.x1 - T.x0) * Math.max(0, (f - 0.55) / 0.45); this.y = T.y0 + (T.y1 - T.y0) * s; this.recogido = 0.8 * Math.sin(f * Math.PI);
      this.fase += dt * 3;
      if (f >= 1) { this.trepa = null; this.recogido = 0; this.y = alturaSuelo(this.x); }
      return;
    }
    if (this.dormido) {
      this.fase += dt * 0.6; this.apoyar(dt);
      if (!jugador.muerto && Math.abs(jugador.x - this.x) < 300 && Math.abs(jugador.y - this.y) < 170) this.despertar(juego, jugador);
      return;
    }
    if (ahora < (this.despiertaHasta || 0)) { this.apoyar(dt); return; }   // se está incorporando
    const dx = jugador.x - this.x;
    this.direccion = dx >= 0 ? 1 : -1;
    const distancia = Math.abs(dx);
    const dy = Math.abs(jugador.y - this.y);
    const alcanza = distancia < 34 && dy < (Mundo.perfil ? 40 : 70) && !jugador.muerto && !this.vyCaida;   // con desniveles, no muerde desde abajo de una plataforma

    if (alcanza) {
      this.estado = 'ataca';
      this.fase += dt * 4;
      if (ahora >= this.ataqueEn) {
        this.ataqueEn = ahora + 900;
        jugador.recibirDano(this.mordida, juego);
        Audio_.zombieGolpea();
      }
    } else {
      this.estado = 'camina';
      // Andar a tirones: avanza más cuando apoya la pierna buena
      const tiron = this.corredor ? 1 : 0.55 + Math.max(0, Math.sin(this.fase)) * 0.9;
      const nx = this.x + this.direccion * this.velocidad * tiron * paso;
      if (!Mundo.perfil) this.x = nx;
      else {
        const sueloN = alturaSuelo(nx), sube = this.y - sueloN;
        if (sueloN > SUELO_BASE + 100) { /* precipicio: no se tira, espera en el borde */ }
        else if (sube > 14 && !this.vyCaida) {
          // Escalón alto: si no pasa de 75 px lo trepa de a poco (apoya las manos, sube el cuerpo); más alto, no puede
          if (sube <= 75) this.trepa = { x0: this.x, x1: nx + this.direccion * 8, y0: this.y, y1: sueloN, t: 0, dur: 0.5 + sube / 60 };
        } else this.x = nx;
      }
      this.fase += dt * (this.corredor ? 14 : 6);
    }
    if (Math.abs(this.empuje) > 0.05) { this.x += this.empuje * paso; this.empuje *= Math.pow(0.8, paso); }
    this.apoyar(dt);

    if (distancia < 500 && ahora >= this.gemidoEn) {
      this.gemidoEn = ahora + 2500 + Math.random() * 5000;
      if (Math.random() < 0.6) Audio_.gemido(false, distancia);
    }
  }

  // Pies en el piso: en los niveles con desniveles, si el piso quedó más abajo cae con gravedad (no aparece abajo de golpe)
  apoyar(dt) {
    const suelo = alturaSuelo(this.x);
    if (!Mundo.perfil) { this.y = suelo; return; }
    if (this.y < suelo - 2 || this.vyCaida) {
      this.vyCaida = (this.vyCaida || 0) + 0.5 * dt * 60; this.y += this.vyCaida * dt * 60;
      if (this.y >= suelo) { this.y = suelo; this.vyCaida = 0; this.golpeadoHasta = Math.max(this.golpeadoHasta, 0); this.aterrizoEn = this.ahora; }
    } else this.y = suelo;
  }

  // Zombie dormido (modo historia): queda quieto, encorvado, hasta que ve al jugador
  dormir() { this.dormido = true; this.cabezaAtras = -0.9; this.recogido = 0.2; return this; }
  despertar(juego, jugador) {
    if (!this.dormido) return;
    this.dormido = false; this.recogido = 0; this.despiertaHasta = juego.ahora + 550;
    if (jugador) this.direccion = jugador.x >= this.x ? 1 : -1;
    Audio_.gemido(true, jugador ? Math.abs(jugador.x - this.x) : 200);
  }

  recibirDano(cantidad, direccion, arma, juego) {
    if (this.estado === 'muerto') return;
    if (this.dormido) this.despertar(juego, juego.jugador);
    this.vida -= cantidad;
    // El fuego pega muchas veces por segundo con poco daño: sin destello, ruido de impacto, empujón ni sangre en cada llama
    const fuego = arma && arma.fuego;
    if (!fuego) this.golpeadoHasta = juego.ahora + 90;
    if (!arma || (!arma.explosivo && !fuego)) Audio_.impactoCarne();
    this.empuje = direccion * (fuego ? 0.2 : cantidad >= this.vidaMax ? 4 : 1.5);
    if (!fuego) juego.salpicar(this.x, this.y - this.altura - 40 * this.escala, this.colorSangre, 6, 3, this.ySuelo);
    if (this.vida <= 0) {
      this.estado = 'muerto';
      juego.salpicar(this.x, this.y - this.altura - 30 * this.escala, this.colorSangre, 18, 5, this.ySuelo);
      const despedido = !this.toxico && !this.animal;
      if (this.sonidoMuerte) this.sonidoMuerte(); else Audio_.zombieMuere(!despedido);
      if (despedido) this.lanzarCadaver(direccion, arma, juego);
      juego.alMorirZombie(this, arma);
    }
  }

  // Prendido fuego: sigue quemándose `seg` segundos (el juego le descuenta la quema por segundo)
  quemar(juego, seg) { if (this.estado !== 'muerto') this.quemaHasta = Math.max(this.quemaHasta || 0, juego.ahora + seg * 1000); }
  quemandose(ahora) { return this.estado !== 'muerto' && this.quemaHasta > ahora; }

  // Caja de impacto: el cuerpo más los brazos estirados hacia donde mira
  caja() { const w = this.ancho + 8 * this.escala; return { x: this.x - w / 2 + this.direccion * 3, y: this.y - this.altura - this.alto - 4, w, h: this.alto + 4 }; }
  terminado() { return this.estado === 'muerto' && this.tiempoMuerto > (this.muerte ? 5 : MUERTE.fin); }

  /* Muerte aparatosa: el golpe lo despide de espaldas según el arma (pistola: trastabilla y cae; escopeta o
   * rifle: vuela hacia atrás; explosión: sale por el aire dando vueltas), pega contra el piso y rebota, queda
   * tendido pataleando y manoteando con espasmos mientras echa chorros de sangre, se le apagan los ojos y se
   * desvanece en su charco a los 5 s. (El tóxico de la cloaca conserva su caída de rodillas.) */
  lanzarCadaver(direccion, arma, juego) {
    const F = arma && arma.explosivo ? 2.6 : ({ pistola: 1, metralleta: 0.9, rifle: 1.6, escopeta: 1.9, ametralladora: 1.4, laser: 1.3, cuerpo: 1.1 })[arma && arma.categoria] || 1.2;
    const peso = this.jefe ? 0.35 : this.corredor ? 1.15 : 1, d = direccion || -this.direccion;
    this.muerte = { d, vx: d * (1.0 + Math.random() * 0.8) * F * peso, vy: -(2.0 + Math.random() * 1.2) * (0.55 + 0.45 * F) * Math.sqrt(peso), altura: 0, giro: 0,
      vgiro: d * (0.05 + 0.025 * F) * (F > 2 ? 2.2 : 1), vueltas: F > 2 && !this.jefe, botes: 0, chorro: 0.15, quieto: false };
    this.bocaAbierta = 1;
  }
  moverCadaver(dt, juego) {
    this.tiempoMuerto += dt;
    const M = this.muerte, paso = dt * 60, e = this.escala;
    this.fase += dt * 22 * (this.pataleo || 0);
    if (!M.quieto) {
      M.vy += 0.4 * paso; M.altura -= M.vy * paso;
      const nx = this.x + M.vx * paso; if (alturaSuelo(nx) < SUELO_BASE + 100) this.x = nx; else M.vx = 0;
      if (M.botes === 0) { M.giro += M.vgiro * paso; if (!M.vueltas && Math.abs(M.giro) > Math.PI / 2) M.giro = Math.sign(M.giro) * Math.PI / 2; }
      if (M.altura <= 0) {
        M.altura = 0;
        if (M.vy > 1.2 && M.botes < 2) {   // pega contra el piso y rebota
          const primero = M.botes === 0; M.vy = -M.vy * 0.28; M.vx *= 0.5; M.botes++;
          Audio_.cuerpoAnimalCae(this.jefe ? 2 : 1.1, primero ? 1 : 0.5);
          if (primero) {
            juego.sacudida = Math.max(juego.sacudida, this.jefe ? 14 : 2.5);
            juego.salpicar(this.x + M.d * 14 * e, this.y - 8 * e, this.colorSangre, 8, 3, this.ySuelo);
            for (let k = 0; k < 8; k++) juego.particulas.push(new Particula(this.x + (Math.random() - 0.3) * 40 * e * M.d, this.y - 2, (Math.random() - 0.5) * 3.5, -Math.random() * 1.8, '#8a7e6a', 0.5 + Math.random() * 0.4, 3 + Math.random() * 4, true, this.ySuelo));
          }
        } else { M.botes = Math.max(M.botes, 1); M.vy = 0; M.vx *= Math.pow(0.78, paso); if (Math.abs(M.vx) < 0.08) M.quieto = true; }
      }
    }
    if (M.botes > 0) { const meta = Math.round((M.giro - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2; M.giro += (meta - M.giro) * Math.min(1, dt * 9); }   // queda tendido
    this.y = this.ySuelo !== undefined ? this.ySuelo : alturaSuelo(this.x);   // en el último bastión el piso es la fila
    const T = this.tiempoMuerto;
    if (T < 1.6 && T >= M.chorro) {   // chorros de sangre mientras se retuerce
      M.chorro = T + 0.2 + Math.random() * 0.15;
      const lx = this.x + Math.sin(M.giro) * 22 * e, ly = this.y - M.altura - 10 * e;
      for (let k = 0; k < 4; k++) juego.particulas.push(new Particula(lx + (Math.random() - 0.5) * 6, ly, (Math.random() - 0.5) * 2.2, -(2 + Math.random() * 2.6), k % 2 ? this.colorSangre : '#5a0606', 0.5 + Math.random() * 0.4, 2 + Math.random() * 2.5, true, this.ySuelo));
    }
  }

  dibujar(ctx, camaraX, ahora) {
    this.ahora = ahora;
    const sx = this.x - camaraX;
    const golpeado = ahora < this.golpeadoHasta;
    const cuerpo = () => {
      if (this.giro) { const cy = -36 * this.escala; ctx.translate(0, cy); ctx.rotate(this.giro); ctx.translate(0, -cy); }   // voltereta
      if (this.trepa) { const f = Math.min(1, this.trepa.t / this.trepa.dur); ctx.rotate(this.direccion * 0.45 * Math.sin(f * Math.PI)); }   // se tira contra el escalón para subir
      if (this.vyCaida) { const cy = -36 * this.escala; ctx.translate(0, cy); ctx.rotate(-this.direccion * Math.min(0.35, this.vyCaida * 0.04)); ctx.translate(0, -cy); }   // cae hacia atrás
      this.cuerpo(ctx, golpeado);
    };
    if (this.estado === 'muerto' && this.muerte) {
      const T = this.tiempoMuerto, e = this.escala, M = this.muerte;
      this.pataleo = T < 0.5 ? 1 : limitar(1 - (T - 0.6) / 1.5, 0, 1) * (0.25 + 0.75 * Math.abs(Math.sin(T * 7)));
      this.ojosApagados = T > 1.0;
      const yc0 = -34 * e, apoyo = -10 * e, k = Math.abs(Math.sin(M.giro));      // gira sobre la cadera; tendido, la cadera queda cerca del piso
      ctx.save(); ctx.translate(sx, this.y);
      ctx.globalAlpha = 1 - limitar((T - 3.3) / 1.7, 0, 1);
      if (M.botes > 0) { const charco = limitar((T - 0.5) / 1.4, 0, 1); ctx.fillStyle = this.colorCharco; ctx.beginPath(); ctx.ellipse(M.d * 16 * e * k, 3, (6 + charco * 22) * e, (2 + charco * 5) * e, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.rect(-500, -600, 1000, 604); ctx.clip();
      ctx.translate(0, -M.altura + yc0 + (apoyo - yc0) * k); ctx.rotate(M.giro); ctx.translate(0, -yc0);
      this.recogido = 0.25 * this.pataleo;
      this.cuerpo(ctx, false);
      ctx.restore();
      return;
    }
    if (this.estado === 'muerto') {
      // Cae de rodillas, un segundo después se desploma boca abajo y se desvanece en los 3 s siguientes
      const T = this.tiempoMuerto, e = this.escala, d = this.direccion;
      const rodillas = suavizar(Math.min(1, T / MUERTE.rodillas));
      const cae = suavizar(limitar((T - MUERTE.desploma) / MUERTE.caida, 0, 1));
      const inicioFundido = MUERTE.desploma + MUERTE.caida;
      ctx.save();
      ctx.translate(sx, this.y);
      ctx.globalAlpha = 1 - limitar((T - inicioFundido) / (MUERTE.fin - inicioFundido), 0, 1);
      // Charco de sangre que se agranda debajo del cuerpo caído
      const charco = limitar((T - MUERTE.desploma) / 1.2, 0, 1);
      if (charco > 0) { ctx.fillStyle = this.colorCharco; ctx.beginPath(); ctx.ellipse(d * 26 * e, 3, 6 + charco * 22, 2 + charco * 5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.rect(-300, -400, 600, 403); ctx.clip();          // lo que queda debajo del piso no se ve
      this.recogido = rodillas;                                                // piernas dobladas
      ctx.translate(0, rodillas * 17 * e - cae * 13 * e);                       // baja hasta apoyar las rodillas
      const ry = -16 * e;                                                      // gira sobre las rodillas, hacia adelante
      ctx.translate(0, ry); ctx.rotate(d * (rodillas * 0.18 + cae * (Math.PI / 2 - 0.18))); ctx.translate(0, -ry);
      cuerpo();
      ctx.restore();
      return;
    }
    conSombra(ctx, sx, this.y - this.altura, cuerpo, 0.32, this.y);
  }

  // El cuerpo alrededor de los pies (0, 0) mirando a la derecha; sirve para el zombie y para su sombra
  cuerpo(ctx, golpeado) {
    ctx.scale(this.direccion * this.escala, this.escala);
    const C = this.colores, V = this.variante, R = this.recogido;
    const col = c => golpeado ? ajustarColor(c, 0.7) : c;                 // el impacto lo blanquea un instante
    const piel = col(this.piel), pielOscura = col(ajustarColor(this.piel, -0.3));
    const agonia = this.estado === 'muerto' ? (this.pataleo || 0) : 0;     // muriendo: patalea y manotea
    const camina = this.estado === 'camina' || agonia > 0.05, ataca = this.estado === 'ataca' || agonia > 0.4;
    const s = camina ? Math.sin(this.fase) : 0;
    const vaiven = Math.sin(this.fase * 0.5);
    const encorvado = (this.corredor ? 0.32 : 0.16) + Math.abs(s) * 0.04;
    const ty = camina ? -Math.abs(Math.cos(this.fase)) * 1.2 : 0;

    // Piernas: la de atrás arrastra el pie, la de adelante da el paso
    // R: piernas recogidas (agazapado antes de saltar o en el aire)
    const est = this.estilo, muslo = est.piernas === 'corto' ? 0.55 : 1;   // short deportivo: más de medio muslo a la vista
    this.pierna(ctx, -4, -34, (this.corredor ? -s * 0.6 : -s * 0.25 - 0.05) + R * 0.5, 0.25 + (this.corredor ? 0.6 * Math.max(0, -s) : 0.15) + R * 1.3, col(ajustarColor(C.pantalon, -0.2)), col(ajustarColor(this.piel, -0.18)), V.rotoIzq, false, golpeado, muslo, false);
    this.pierna(ctx, 4, -34, s * 0.5 + R * 0.9, 0.65 * Math.max(0, s) + 0.1 + R * 1.5, col(C.pantalon), piel, V.rotoDer, V.agujeroRodilla && est.piernas !== 'corto', golpeado, muslo, !!est.zapatilla && V.zapatilla);

    // Todo lo de arriba va inclinado hacia adelante desde la cadera
    ctx.save();
    ctx.translate(0, -34); ctx.rotate(encorvado); ctx.translate(0, 34 + ty);

    // Brazo de atrás
    const sinManga = est.torso === 'musculosa';
    this.brazo(ctx, -2, -54, V.brazoColgando || this.dormido || (this.estado === 'muerto' && agonia < 0.4) ? 'cuelga' : 'estira', 0.4 + vaiven * 0.12, ataca, sinManga ? null : col(ajustarColor(C.camiseta, -0.25)), col(ajustarColor(this.piel, -0.2)), golpeado);

    // Torso: camiseta azul con el borde de abajo deshilachado
    const hemY = -33;
    const torso = c => {
      c.moveTo(-9, hemY);
      c.quadraticCurveTo(-11.5, -45, -10, -54);            // espalda encorvada
      c.quadraticCurveTo(-8.5, -58.5, -3, -58.2);          // hombro de atrás redondeado
      c.lineTo(4, -58.2);
      c.quadraticCurveTo(9.5, -58, 9.8, -53);              // hombro de adelante
      c.quadraticCurveTo(11.5, -44, 9, hemY);              // panza hinchada
      [[7, hemY + 2.5], [4.5, hemY - 0.5], [1, hemY + 3], [-2.5, hemY - 0.3], [-6, hemY + 2.2]].forEach(([x, y]) => c.lineTo(x, y));   // ruedo deshilachado
    };
    const cerrado = est.torso !== 'abierta' && est.torso !== 'musculosa' && est.torso !== 'desnudo';
    if (est.torso === 'desnudo') this.torsoDesnudo(ctx, torso, hemY, piel, pielOscura, golpeado);
    else if (est.torso === 'abierta') this.torsoCamisaAbierta(ctx, torso, hemY, C, col, piel, pielOscura, golpeado, vaiven);
    else if (est.torso === 'musculosa') this.torsoMusculosa(ctx, torso, hemY, C, col, piel, golpeado);
    else pieza(ctx, torso, col(C.camiseta), -11.5, 11.5);
    if (cerrado && !Pincel.silueta && !golpeado) {
      // Pliegues de la tela
      linea(ctx, 'rgba(10, 20, 60, 0.35)', 0.7, [[-6, -55], [-4, -46], [-6, -38]]);
      linea(ctx, 'rgba(10, 20, 60, 0.3)', 0.7, [[6, -54], [4, -44]]);
      // Desgarro con la piel y las costillas a la vista
      if (V.desgarroCamiseta) {
        detalle(ctx, pielOscura, poli([[3, -49], [9, -47], [10, -41], [6, -39], [2, -43]]));
        for (let k = 0; k < 3; k++) linea(ctx, 'rgba(25, 40, 10, 0.55)', 0.6, [[3.5, -46 + k * 2.2], [9, -45.5 + k * 2.2]]);
        linea(ctx, 'rgba(10, 20, 60, 0.6)', 0.6, [[3, -49], [2.5, -46], [2, -43]]);
      }
      // Manchas de sangre (con chorreaduras) y de mugre
      for (const m of V.manchas) {
        ctx.fillStyle = m.sangre ? (C.mancha || 'rgba(110, 11, 11, 0.85)') : 'rgba(70, 52, 28, 0.5)';
        ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r, m.r * 0.8, m.x * 0.3, 0, Math.PI * 2); ctx.fill();
        if (m.sangre) for (let g = 0; g < m.gotas; g++) { const gx = m.x - m.r * 0.5 + g * m.r * 0.7; ctx.fillRect(gx, m.y, 0.9, m.r * 1.6 + g * 1.5); ctx.beginPath(); ctx.arc(gx + 0.45, m.y + m.r * 1.6 + g * 1.5, 0.8, 0, Math.PI * 2); ctx.fill(); }
      }
      // Cuello de la camiseta estirado
      linea(ctx, 'rgba(10, 20, 60, 0.6)', 1, [[-4, -57.8], [0.5, -55], [4.5, -57.8]]);
    }
    if (cerrado && this.ropa !== 'toxico') this.prendaEncima(ctx, hemY, col, golpeado, est);
    if (est.rayas || est.lunares || est.faja || est.delantal || est.panuelo || est.bombo) this.extrasRopa(ctx, torso, hemY, col, golpeado, est);

    // Cuello flaco, con la mordida que lo convirtió
    pieza(ctx, poli(segmento(1, -56, 4, -63, 5.5, 4.8)), pielOscura, -2, 7);
    detalle(ctx, golpeado ? '#fff' : C.sangreFresca, elipse(3.5, -59, 1.6, 1.1));

    // Cabeza adelantada y caída hacia un costado, con un leve cabeceo
    ctx.save();
    ctx.translate(5, -63); ctx.rotate(0.12 + vaiven * 0.06 + (ataca ? -0.15 : 0) - this.cabezaAtras * 0.55); ctx.scale(ESCALA_CABEZA, ESCALA_CABEZA); ctx.translate(-5, 63);   // (la cabeza, 12 % más chica: js/anatomia.js)
    this.cabeza(ctx, piel, pielOscura, golpeado, ataca);
    if (est.accesorio) this.accesorio(ctx, est, golpeado);
    ctx.restore();

    // Brazo de adelante: estirado hacia la presa
    this.brazo(ctx, 7, -54, this.dormido || (this.estado === 'muerto' && agonia < 0.4) ? 'cuelga' : 'estira', 0.25 - vaiven * 0.12, ataca, sinManga ? null : col(C.camiseta), piel, golpeado);
    ctx.restore();
  }

  // Zombie común: camisa a cuadros abierta (sin botones) y el abdomen podrido a la vista
  torsoCamisaAbierta(ctx, torso, hemY, C, col, piel, pielOscura, golpeado, vaiven) {
    const est = this.estilo;
    pieza(ctx, torso, piel, -11.5, 11.5);                                                   // el cuerpo entero es piel…
    if (est.panza) pieza(ctx, elipse(7, -40, 7, 8.4), piel, 0, 14);                        // panza que asoma
    if (!Pincel.silueta && !golpeado) {
      sombraInterna(ctx, c => c.rect(0, -56, 11, 22), 0.12);
      for (let k = 0; k < 4; k++) linea(ctx, 'rgba(25, 40, 10, 0.5)', 0.6, [[0, -54 + k * 2.3], [8, -53.4 + k * 2.3]]);     // costillas
      for (const y of [-46, -41.5]) linea(ctx, 'rgba(25, 40, 10, 0.3)', 0.5, [[0.5, y], [7.5, y + 0.3]]);                   // abdominales flacos
      linea(ctx, 'rgba(25, 40, 10, 0.35)', 0.5, [[4, -48], [4.6, -36]]);
      detalle(ctx, 'rgba(20, 30, 8, 0.8)', elipse(5.4, -37.5, 0.8, 1.1));                                                     // ombligo
      detalle(ctx, 'rgba(90, 8, 8, 0.85)', elipse(2.4, -40.5, 2.4, 1.3, 0.4));                                               // mordida en la panza
      detalle(ctx, 'rgba(60, 70, 20, 0.45)', elipse(6.8, -45, 1.8, 2.6));                                                     // podrido
    }
    // …y encima la camisa: el paño de atrás llega hasta adelante del hombro y queda abierta
    const camisa = c => {
      c.moveTo(-9, hemY);
      c.quadraticCurveTo(-11.5, -45, -10, -54); c.quadraticCurveTo(-8.5, -58.5, -3, -58.4);
      c.lineTo(1.2, -58.4); c.quadraticCurveTo(-2.2, -50, -3.4, hemY + 2.6);
      [[-5, hemY + 0.3], [-6.6, hemY + 3], [-8, hemY + 0.6]].forEach(([x, y]) => c.lineTo(x, y));   // ruedo deshilachado
    };
    pieza(ctx, camisa, col(C.camiseta), -11.5, 2);
    const sw = vaiven * 1.2;   // la solapa delantera cuelga suelta y se balancea
    const solapa = c => { c.moveTo(6.4, -58); c.lineTo(9.4, -56.8); c.lineTo(12 + sw, hemY + 2.4); c.lineTo(10.6 + sw, hemY + 4.2); c.lineTo(9.6 + sw * 0.6, hemY + 2.2); c.quadraticCurveTo(8.6, -46, 7.4, -55); c.closePath(); };
    pieza(ctx, solapa, col(ajustarColor(C.camiseta, 0.06)), 6, 12.5);
    if (Pincel.silueta || golpeado) return;
    // Cuadros de la tela, solo dentro de la camisa
    ctx.save(); ctx.beginPath(); camisa(ctx); ctx.clip();
    if (est.estampado === 'cuadros') {
      for (const x of [-9, -6.5, -4, -1.5]) linea(ctx, 'rgba(8, 18, 55, 0.35)', 0.7, [[x, -59], [x - 0.6, hemY + 3]]);
      for (const y of [-53, -47, -41, -36]) linea(ctx, 'rgba(8, 18, 55, 0.3)', 0.7, [[-12, y], [2, y + 0.4]]);
    } else if (est.estampado === 'floral') {   // camisa hawaiana
      for (const [x, y, c] of [[-8, -53, '#f4e04a'], [-4, -47, '#2aa36a'], [-8.5, -42, '#2aa36a'], [-3.5, -38, '#f4e04a'], [-1, -55, '#fff3c4']]) {
        ctx.fillStyle = c; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1, 0.8, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    for (const m of this.variante.manchas) if (m.x < -2 && m.sangre) { ctx.fillStyle = 'rgba(110, 11, 11, 0.8)'; ctx.beginPath(); ctx.ellipse(m.x - 1, m.y, m.r, m.r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    linea(ctx, 'rgba(8, 18, 55, 0.5)', 0.6, [[8.4, -57.4], [11 + sw, hemY + 3]]);                                            // pliegue de la solapa
    pieza(ctx, poli([[-3, -58.6], [0.6, -60.2], [3.8, -58.4], [1.2, -57]]), col(ajustarColor(C.camiseta, 0.12)), -3, 4);   // cuello de la camisa
    if (est.corbata) pieza(ctx, poli([[3, -58], [5, -58], [6.4 + sw, -46], [5 + sw, -43.6], [3.8 + sw, -46]]), est.corbata, 3, 7);   // corbata floja
    if (est.camara) {   // cámara de turista colgando del cuello
      linea(ctx, '#1a1a1a', 0.6, [[1, -58], [5, -47], [9, -57]]);
      pieza(ctx, redondo(3, -48, 5.4, 3.8, 0.8), '#2a2a2e', 3, 8.4); detalle(ctx, '#6fa8c8', circulo(6.6, -46.1, 1.1));
    }
  }

  // Prenda cerrada (remera, chaleco, uniforme, capucha, overol): detalles encima de la tela
  prendaEncima(ctx, hemY, col, golpeado, est) {
    if (Pincel.silueta) return;
    switch (est.torso) {
      case 'chaleco':   // chaleco de obra naranja con bandas reflectivas
        pieza(ctx, poli([[-9.6, hemY + 1], [-10.6, -54], [-4, -58], [-2, -58], [-2.4, hemY + 1.6]]), col(est.chaleco), -10.6, -2);
        pieza(ctx, poli([[3.4, -58], [6, -58], [9.8, -53], [10.6, -44], [9, hemY + 1], [3.6, hemY + 1.6]]), col(est.chaleco), 3.4, 10.6);
        if (!golpeado && !est.sinBandas) for (const y of [-46, -40]) { linea(ctx, '#eef0e8', 1.3, [[-10.2, y], [-2.2, y]]); linea(ctx, '#eef0e8', 1.3, [[3.6, y], [10.2, y]]); }
        if (!golpeado && est.cartucheras) {   // portaplacas de soldado: cintas para enganchar y dos portacargadores
          for (const y of [-52, -48.6]) { linea(ctx, ajustarColor(est.chaleco, -0.3), 0.5, [[-10, y], [-2.6, y]]); linea(ctx, ajustarColor(est.chaleco, -0.3), 0.5, [[3.8, y], [10, y]]); }
          for (const x of [4.2, 7.4]) pieza(ctx, redondo(x, -45, 2.8, 5.4, 0.6), col(ajustarColor(est.chaleco, -0.16)), x, x + 2.8);
        }
        break;
      case 'uniforme':  // botones (dobles en la chaqueta de cocinero), bolsillo y placa
        if (golpeado) break;
        for (const y of [-54, -49, -44, -39]) { detalle(ctx, '#d8d4c4', circulo(7.6, y, 0.55)); if (est.botonesDobles) detalle(ctx, '#d8d4c4', circulo(4.4, y, 0.55)); }
        if (est.placa) { pieza(ctx, poli([[1, -53], [3.4, -54], [4.2, -51.6], [2.6, -50], [0.8, -51]]), '#d8b23a', 0.8, 4.2); linea(ctx, 'rgba(0,0,0,0.4)', 0.5, [[-4, -50], [0, -50]]); }
        break;
      case 'capucha':   // buzo: bolsillo canguro y cordones
        pieza(ctx, poli([[0, -42], [9.6, -42], [9.2, -35], [0.4, -35]]), col(ajustarColor(this.colores.camiseta, -0.1)), 0, 9.6);
        if (!golpeado) { linea(ctx, '#d8d8d0', 0.5, [[4, -57], [4.6, -51]]); linea(ctx, '#d8d8d0', 0.5, [[6, -57], [6.8, -51.6]]); }
        break;
      case 'overol':    // overol de jean sobre la camisa: peto, tirantes y botones
        pieza(ctx, poli([[0, -52], [9.4, -52], [10.6, -44], [9, hemY + 1], [-9, hemY + 1], [-10, -40], [-1, -42]]), col(est.overol), -10, 10.6);
        linea(ctx, tinta(est.overol), 1.6, [[-6, -58], [1, -51]]); linea(ctx, tinta(est.overol), 1.6, [[6, -58], [8, -51]]);
        if (!golpeado) { detalle(ctx, '#c9b36a', circulo(1.6, -50.6, 0.6)); detalle(ctx, '#c9b36a', circulo(8, -50.6, 0.6)); pieza(ctx, redondo(3, -49, 4, 3.6, 0.6), col(ajustarColor(est.overol, 0.08)), 3, 7); }
        break;
      case 'remera':    // franja de ciclista o estampa de la remera
        if (golpeado) break;
        if (est.franja) linea(ctx, est.franja, 1.4, [[-10, -50], [9.6, -42]]);
        if (est.estampa) { ctx.fillStyle = est.estampa; ctx.beginPath(); ctx.arc(5, -47, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(3.6, -47.4, 2.8, 0.8); }
        break;
    }
  }

  // Lo que lleva en la cabeza según la variante
  accesorio(ctx, est, golpeado) {
    const hy = -79, c = col => golpeado ? ajustarColor(col, 0.7) : col;
    switch (est.accesorio) {
      case 'casco-soldado':   // casco de combate con funda, borde y barbijo suelto (el soldado contagiado del último bastión)
        pieza(ctx, k => { k.moveTo(-9.6, hy + 4.4); k.quadraticCurveTo(-10.4, hy - 7.4, 0.6, hy - 7.6); k.quadraticCurveTo(10.4, hy - 7.2, 10.8, hy + 2.6); k.lineTo(10.8, hy + 4); k.quadraticCurveTo(0, hy + 2.6, -9.6, hy + 4.4); }, c('#5b6340'), -10.4, 10.8);
        pieza(ctx, redondo(-10.2, hy + 2.4, 21.4, 2, 0.9), c('#454c30'), -10.2, 11.2);
        if (!Pincel.silueta && !golpeado) { linea(ctx, 'rgba(30,34,20,0.5)', 0.5, [[-6, hy - 3.6], [-1, hy - 6], [5, hy - 5.4]]); linea(ctx, '#3b3a2c', 0.9, [[-6.4, hy + 4.4], [-5, hy + 12], [-1, hy + 15.4]]); }
        break;
      case 'casco-obra':
        pieza(ctx, k => { k.moveTo(-9, hy + 3); k.quadraticCurveTo(-9, hy - 7, 1, hy - 7); k.quadraticCurveTo(10.4, hy - 7, 10.6, hy + 3); }, c('#e8b21c'), -9, 10.6);
        pieza(ctx, redondo(-10, hy + 1.6, 22.4, 1.8, 0.8), c('#d9a214'), -10, 12.4);
        break;
      case 'gorra-policia':
        pieza(ctx, poli([[-8.6, hy + 3], [-8.4, hy - 3.4], [9, hy - 4.4], [9.6, hy + 3]]), c('#1e2a48'), -8.6, 9.6);
        pieza(ctx, poli([[5, hy + 2], [15, hy + 2.6], [13, hy + 4.2], [5, hy + 4]]), c('#111'), 5, 15);
        detalle(ctx, '#d8b23a', circulo(4, hy - 1, 1));
        break;
      case 'sombrero-paja':
        pieza(ctx, elipse(1, hy + 0.6, 15, 2.2), c('#d8b86a'), -14, 16);
        pieza(ctx, poli([[-6.6, hy], [-5.8, hy - 8], [7.4, hy - 8], [8.2, hy]]), c('#d8b86a'), -6.6, 8.2);
        detalle(ctx, '#8a3a26', c2 => c2.rect(-6.4, hy - 2.4, 14.4, 1.6));
        break;
      case 'casco-ciclista':
        pieza(ctx, poli([[-10.4, hy + 3], [-7.4, hy - 5], [3, hy - 6.6], [10, hy - 2.4], [11, hy + 2]]), c('#3fbf3a'), -10.4, 11);
        if (!Pincel.silueta) for (const x of [-5, -1, 3]) linea(ctx, '#111', 0.8, [[x, hy - 4.6], [x + 2.6, hy - 1]]);
        break;
      case 'gorro-chef':
        pieza(ctx, poli([[-7, hy + 2], [-8.4, hy - 10], [-4, hy - 14], [2, hy - 15], [7.6, hy - 12], [8, hy + 2]]), c('#ece8de'), -8.4, 8);
        detalle(ctx, 'rgba(110,11,11,0.6)', elipse(2, hy - 8, 1.6, 1));
        pieza(ctx, redondo(-7.4, hy - 0.6, 15.6, 3, 0.8), c('#dcd8cc'), -7.4, 8.2);
        break;
      case 'capucha':
        pieza(ctx, poli([[-10, hy + 15], [-11, hy + 2], [-6, hy - 5], [4, hy - 5.6], [9.4, hy - 1], [6, hy + 0.6], [-2, hy + 1], [-5, hy + 8], [-4, hy + 15]]), c(ajustarColor(this.colores.camiseta, -0.08)), -11, 9.4);
        break;
      case 'vincha':
        pieza(ctx, redondo(-8.4, hy + 2.2, 18.6, 2.2, 0.6), c('#f2f2ea'), -8.4, 10.2);
        if (!Pincel.silueta) linea(ctx, est.numero || '#5a2a8a', 0.6, [[-8, hy + 3.3], [10, hy + 3.3]]);
        break;
      case 'barbijo':
        pieza(ctx, poli([[0.6, hy + 13.2], [8.4, hy + 12.6], [8.8, hy + 15.8], [1.2, hy + 16.4]]), c('#9ec9d6'), 0.6, 8.8);
        if (!Pincel.silueta) linea(ctx, '#d8e8ee', 0.4, [[0.8, hy + 14], [-4.6, hy + 7]]);
        break;
      case 'gorro-pompon':   // gorro de lana de esquiador, con pompón y las antiparras en la frente
        pieza(ctx, k => { k.moveTo(-9, hy + 3); k.quadraticCurveTo(-9.4, hy - 8, 1, hy - 8.4); k.quadraticCurveTo(10, hy - 8, 10.4, hy + 3); }, c(est.gorro || '#2a5fb0'), -9.4, 10.4);
        pieza(ctx, redondo(-9.6, hy + 0.6, 20.4, 3, 1), c(ajustarColor(est.gorro || '#2a5fb0', 0.25)), -9.6, 10.8);
        pieza(ctx, circulo(0, hy - 9.4, 3), c('#f2f2ea'), -3, 3);
        if (est.antiparras) { pieza(ctx, redondo(1, hy + 2.6, 10, 3.6, 1.6), c('#26282c'), 1, 11); detalle(ctx, golpeado ? '#fff' : '#f0a020', redondo(2, hy + 3.2, 8, 2.4, 1.1)); }
        break;
      case 'boina':   // boina de paisano, chata y caída hacia adelante
        pieza(ctx, k => { k.moveTo(-9.6, hy + 1.6); k.quadraticCurveTo(-9, hy - 5.6, 2, hy - 5.4); k.quadraticCurveTo(12.6, hy - 5, 12.4, hy + 0.6); k.quadraticCurveTo(2, hy + 3.2, -9.6, hy + 1.6); }, c('#1e1f24'), -9.6, 12.6);
        detalle(ctx, golpeado ? '#fff' : '#2c2e34', circulo(1, hy - 5.6, 0.8));
        break;
      case 'ruleros':   // ruleros de colores con la redecilla
        for (const [x, y, k2] of [[-6, hy - 1, '#e86aa8'], [-1.5, hy - 3, '#6ac0e8'], [3, hy - 3, '#e8d86a'], [7.2, hy - 1, '#e86aa8'], [-8, hy + 3, '#6ac0e8']]) pieza(ctx, redondo(x - 2.4, y - 1.8, 4.8, 3.6, 1.6), c(k2), x - 2.4, x + 2.4);
        if (!Pincel.silueta && !golpeado) for (let k = 0; k < 5; k++) linea(ctx, 'rgba(240,240,240,0.4)', 0.3, [[-9 + k * 4, hy + 4], [-7 + k * 4, hy - 5]]);
        break;
      case 'pelo-revuelto':   // mata de pelo negro parado (el jefe del barrio)
        pieza(ctx, poli([[-9, hy + 4], [-10.5, hy - 2], [-7, hy - 1], [-6.6, hy - 6.6], [-3, hy - 3], [-1, hy - 8], [2, hy - 3.4], [5, hy - 7.4], [6.4, hy - 2.4], [10.4, hy - 4], [9.6, hy + 2], [3, hy + 1], [-4, hy + 1.4]]), c('#15161a'), -10.5, 10.4);
        break;
      case 'gorra-atras':
        pieza(ctx, poli([[-8.6, hy + 3], [-8.4, hy - 3.4], [9, hy - 4.4], [9.6, hy + 3]]), c('#b3261e'), -8.6, 9.6);
        pieza(ctx, poli([[-5, hy + 2], [-15, hy + 2.6], [-13, hy + 4.2], [-5, hy + 4]]), c('#8a1c16'), -15, -5);
        break;
    }
  }

  // Torso desnudo y musculoso (el jefe del barrio): pectorales, abdominales y hombros enormes
  torsoDesnudo(ctx, torso, hemY, piel, pielOscura, golpeado) {
    const k = 1 + ((this.grosorBrazos || 1) - 1) * 0.35;                                                        // más ancho cuanto más grueso
    pieza(ctx, elipse(0, -45, 11 * k, 13), piel, -11 * k, 11 * k);                                             // tórax ancho
    pieza(ctx, torso, piel, -11.5, 11.5);
    pieza(ctx, elipse(-6, -53, 6.4 * k, 5.2 * k), piel, -6 - 6.4 * k, -6 + 6.4 * k);                           // espalda
    pieza(ctx, elipse(5, -51, 6.6 * k, 5.4 * k), piel, 5 - 6.6 * k, 5 + 6.6 * k);                              // pectoral
    if (Pincel.silueta || golpeado) return;
    linea(ctx, 'rgba(20, 50, 10, 0.55)', 0.8, [[0, -47], [6, -46.4], [10.4, -48.6]]);                           // borde del pectoral
    for (const y of [-43, -39.4, -36]) { linea(ctx, 'rgba(20, 50, 10, 0.45)', 0.6, [[1.6, y], [8.4, y + 0.4]]); }
    linea(ctx, 'rgba(20, 50, 10, 0.45)', 0.6, [[5, -46], [5.4, -34]]);
    for (let k = 0; k < 3; k++) linea(ctx, 'rgba(20, 50, 10, 0.4)', 0.5, [[-9.6, -46 + k * 3], [-6, -45 + k * 3]]);   // dorsales
    detalle(ctx, 'rgba(90, 8, 8, 0.7)', elipse(-2, -42, 2.6, 1.4, 0.3));                                       // mordida
    linea(ctx, 'rgba(30, 60, 20, 0.6)', 0.5, [[8, -54], [9.6, -50], [9, -46]]);                                 // vena
  }

  // Ropa típica encima del torso: camiseta a rayas, batón a lunares, faja con rastra, delantal de asador,
  // pañuelo al cuello y el bombo del hincha
  extrasRopa(ctx, torso, hemY, col, golpeado, est) {
    if (Pincel.silueta) { if (est.bombo) pieza(ctx, elipse(13, -40, 6, 9), '#000', 7, 19); return; }
    if ((est.rayas || est.lunares) && !golpeado) {
      ctx.save(); ctx.beginPath(); torso(ctx); ctx.clip();
      if (est.rayas) { ctx.fillStyle = est.rayas; for (let x = -12; x < 12; x += 5) ctx.fillRect(x, -60, 2.5, 30); }
      if (est.lunares) { ctx.fillStyle = est.lunares; for (let y = -56; y < hemY; y += 4) for (let x = -11 + ((y / 4) % 2 ? 2 : 0); x < 11; x += 4) { ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill(); } }
      ctx.restore();
    }
    if (est.delantal) {
      pieza(ctx, poli([[0.4, -52], [8.6, -52], [10.6, -44], [10.4, hemY + 5], [-1.6, hemY + 5], [-0.6, -44]]), col(est.delantal), -1.6, 10.6);
      if (!golpeado) { linea(ctx, est.delantal, 0.7, [[1, -52], [2.4, -58]]); linea(ctx, est.delantal, 0.7, [[8, -52], [6.6, -58]]); detalle(ctx, 'rgba(110,11,11,0.6)', elipse(5, -42, 2, 1.4)); detalle(ctx, 'rgba(255,255,255,0.15)', c2 => c2.rect(1, -40, 8.6, 0.8)); }
    }
    if (est.faja) {
      pieza(ctx, poli([[-10.4, hemY - 4], [10.4, hemY - 4.4], [10.2, hemY + 0.4], [-10, hemY + 0.6]]), col(est.faja), -10.4, 10.4);
      if (!golpeado) for (let x = -8; x < 10; x += 3.2) detalle(ctx, '#d8d8d0', circulo(x, hemY - 1.8, 0.9));   // rastra de monedas
    }
    if (est.panuelo) pieza(ctx, poli([[-3.6, -58.6], [7, -58.4], [3.6, -51.4], [1.6, -52.4]]), col(est.panuelo), -3.6, 7);
    if (est.bombo) {   // bombo colgado adelante, con los parches y las cuerdas
      pieza(ctx, elipse(13, -40, 6, 9.4), col('#e8e2d0'), 7, 19);
      if (!golpeado) {
        detalle(ctx, est.rayas || '#2a5fb0', c2 => { c2.rect(7.4, -44.6, 11.2, 2.4); c2.rect(7.4, -37.6, 11.2, 2.4); });
        for (let k = 0; k < 5; k++) linea(ctx, '#7a5a2a', 0.4, [[7.6 + k * 2.4, -48.6], [8.8 + k * 2.4, -31.6]]);
        linea(ctx, '#3a2a1a', 0.6, [[4, -56], [10, -49]]);
      }
    }
  }

  // Zombie corredor: musculosa con dorsal de carrera, hombros y brazos a la vista
  torsoMusculosa(ctx, torso, hemY, C, col, piel, golpeado) {
    pieza(ctx, torso, piel, -11.5, 11.5);
    const musculosa = c => {
      c.moveTo(-8.6, hemY);
      c.quadraticCurveTo(-11, -45, -9.6, -51.5); c.lineTo(-7.6, -52); c.quadraticCurveTo(-6, -56.8, -3.4, -58.2);
      c.lineTo(2.8, -58.2); c.quadraticCurveTo(4.6, -55, 8.6, -51.6); c.quadraticCurveTo(11.2, -44, 8.8, hemY);
      [[6, hemY + 2], [3, hemY + 0.4], [0, hemY + 2.4], [-3, hemY + 0.5], [-6, hemY + 2]].forEach(([x, y]) => c.lineTo(x, y));
    };
    pieza(ctx, musculosa, col(C.camiseta), -11, 11);
    if (Pincel.silueta || golpeado) return;
    linea(ctx, 'rgba(255, 255, 255, 0.35)', 0.8, [[-9.4, -50], [-9.8, hemY + 1]]);                                          // vivo lateral
    if (this.estilo.numero) {   // camiseta de básquet: número grande con borde
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 1.2; ctx.strokeStyle = '#f2f2ea'; ctx.fillStyle = this.estilo.numero;
      const n = String(this.variante.dorsal % 100); ctx.strokeText(n, 4.6, -42); ctx.fillText(n, 4.6, -42);
    } else if (!this.estilo.sinDorsal) {
      // Dorsal de la carrera, abrochado con alfileres y salpicado
      pieza(ctx, poli([[1.2, -50.5], [8.6, -50], [8.4, -42.6], [1.4, -43]]), '#ece6d6', 1, 9, { bisel: false });
      ctx.fillStyle = '#1b1b1b'; ctx.font = 'bold 4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(this.variante.dorsal), 4.9, -45);
      ctx.fillStyle = 'rgba(110, 11, 11, 0.75)'; ctx.beginPath(); ctx.ellipse(7, -44.5, 1.4, 1, 0, 0, Math.PI * 2); ctx.fill();
      for (const [x, y] of [[1.8, -50], [8, -49.6], [1.9, -43.5], [7.9, -43.2]]) detalle(ctx, '#b8b8b8', circulo(x, y, 0.35));
    }
    for (const m of this.variante.manchas) if (m.sangre && m.x < 0) { ctx.fillStyle = 'rgba(90, 8, 8, 0.75)'; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r * 0.8, m.r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
  }

  /* Pierna: el muslo, la canilla y el pie descalzo son una sola forma de piel (los huesos y los rangos de
   * js/anatomia.js, los mismos que el jugador), y encima va el pantalón roto a distinta altura, que termina en flecos.
   * Antes eran cuadriláteros sueltos con un círculo en la rodilla. El pie apoya de plano mientras el tobillo da. */
  pierna(ctx, hx, hy, a, doblez, tela, piel, corte, agujero, golpeado, muslo = 1, zapatilla = false) {
    const L1 = HUESOS.muslo, L2 = HUESOS.canilla, H = HUESOS.tobillo, A = ANATOMIA, g = this.grosorPiernas || 1;
    a = limitar(a, -A.cadera.extension * GRADOS, A.cadera.flexion * GRADOS);
    doblez = limitar(doblez, A.rodilla.extension * GRADOS, A.rodilla.flexion * GRADOS);
    const kx = hx + Math.sin(a) * L1, ky = hy + Math.cos(a) * L1, b = a - doblez, tx = kx + Math.sin(b) * L2, ty = ky + Math.cos(b) * L2;
    const en = (x0, y0, x1, y1, k) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    const pie = giroDelPie(b, doblez), cp = Math.cos(pie), sp = Math.sin(pie), fg = 1 + (g - 1) * 0.5;   // el pie crece menos que la pierna
    // Un punto del pie (m: achicado hacia su centro, para el tono de luz)
    const P = (x, y, m = 0) => { const k = m ? 0.88 : 1; x = 3 + (x - 3) * k; y = H - 2.2 + (y - H + 2.2) * (m ? 0.8 : 1); return [tx + x * fg * cp - y * sp, ty + x * fg * sp + y * cp]; };
    const piernaPiel = m => juntos(tramoMusculo(hx, hy, kx, ky, 7.4 * g - m, 5.5 * g - m, 0.12, 0.26, 0.3, 0.4), tramoMusculo(kx, ky, tx, ty, 5.5 * g - m, 3.9 * g - m, 0.36, 0.04, 0.3, 0.5));
    if (zapatilla) {   // zapatilla de correr blanca y embarrada, con la suela roja
      miembroZombie(ctx, m => c => { c.moveTo(...P(-3.8, H - 1.3, m)); c.lineTo(...P(8.4, H - 1.3, m)); c.quadraticCurveTo(...P(9.5, H - 1.5, m), ...P(9.0, H - 2.7, m)); c.quadraticCurveTo(...P(8.2, H - 4.1, m), ...P(6, H - 4.3, m));
        c.quadraticCurveTo(...P(3.4, -0.9, m), ...P(2.3, -2.0, m)); c.lineTo(...P(-2.6, -1.6, m)); c.quadraticCurveTo(...P(-3.9, 0.6, m), ...P(-3.8, H - 1.3, m)); c.closePath(); }, golpeado ? '#fff' : '#d9d6cc');
      if (!Pincel.silueta) {
        ctx.fillStyle = golpeado ? '#fff' : '#c23b2b'; ctx.beginPath(); for (const q of [P(-4, H - 1.4), P(8.8, H - 1.4), P(9.3, H - 0.5), P(8.6, H), P(-4, H)]) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill();   // suela
        detalle(ctx, 'rgba(90,70,40,0.5)', c => c.ellipse(...P(4.4, H - 2.4), 2.8, 1.2, pie, 0, Math.PI * 2));
      }
      miembroZombie(ctx, piernaPiel, piel);
    } else {           // pie descalzo: talón, empeine y dedos; va en la misma forma que la pierna
      const piePiel = m => c => { c.moveTo(...P(-3.4, H, m)); c.lineTo(...P(7.6, H, m)); c.quadraticCurveTo(...P(9.5, H, m), ...P(9.2, H - 1.3, m)); c.quadraticCurveTo(...P(8.9, H - 2.3, m), ...P(7.3, H - 2.5, m));
        c.quadraticCurveTo(...P(4.6, H - 3.0, m), ...P(1.9, -1.3, m)); c.lineTo(...P(-2.1, -1.5, m)); c.quadraticCurveTo(...P(-3.9, 0.9, m), ...P(-3.4, H, m)); c.closePath(); };
      miembroZombie(ctx, m => juntos(piernaPiel(m), piePiel(m)), piel);
      if (!Pincel.silueta) for (let k = 0; k < 3; k++) linea(ctx, 'rgba(20, 35, 10, 0.5)', 0.45, [P(5.8 + k * 1.1, H - 2.2 + k * 0.2), P(6.1 + k * 1.1, H - 0.4)]);   // dedos
    }
    // Pantalón: hasta la mitad del muslo (short deportivo), hasta la rodilla o hasta donde se rompió en la canilla
    if (muslo < 1) {
      const fin = en(hx, hy, kx, ky, muslo);
      miembroZombie(ctx, m => tramoCortado(hx, hy, fin[0], fin[1], 9.6 - m, 9.2 - m, 1.3), tela);
      if (!Pincel.silueta && !golpeado) { const nx = -Math.cos(a), ny = Math.sin(a); linea(ctx, 'rgba(255,255,255,0.4)', 0.7, [[hx - nx * 3.3, hy - ny * 3.3], [fin[0] - nx * 3.3, fin[1] - ny * 3.3]]); }   // franja del short
    } else if (corte > 0.02) {
      const fin = en(kx, ky, tx, ty, corte);
      miembroZombie(ctx, m => juntos(tramoMusculo(hx, hy, kx, ky, 9.2 * g - m, 7.2 * g - m, 0.15, 0.3, 0.3, 0.4), tramoCortado(kx, ky, fin[0], fin[1], 7.2 * g - m, 6.6 * g - m)), tela);
    } else miembroZombie(ctx, m => tramoCortado(hx, hy, kx, ky, 9.2 * g - m, 7.4 * g - m), tela);
    if (agujero && !Pincel.silueta) {   // rodilla a la vista por un roto
      detalle(ctx, 'rgba(30, 18, 8, 0.7)', elipse(kx + 0.5, ky, 3.0, 2.3));
      detalle(ctx, golpeado ? '#fff' : ajustarColor(this.piel, -0.1), elipse(kx + 0.5, ky + 0.3, 2.1, 1.5));
    }
  }

  /* Brazo: una sola forma de piel del hombro a la muñeca, con el codo donde lo pone la anatomía (resolverBrazo: hacia
   * abajo, y nunca más de lo que dobla), la manga corta rota encima y una mano de verdad en garra (dibujarGarra: los
   * mismos nudos que la del jugador), con uñas. Antes eran dos cuadriláteros con un círculo en el hombro, y el
   * antebrazo se estiraba al manotear. */
  brazo(ctx, hx, hy, pose, angulo, ataca, manga, piel, golpeado) {
    const t = this.ahora / 1000, g = this.grosorBrazos || 1, cerca = hx > 0, largo = HUESOS.brazo + HUESOS.antebrazo;
    let mx, my, giro, flexion, desvio, cierre, abre, suelto;
    if (pose === 'cuelga') {   // inerte: casi estirado, con un leve vaivén
      mx = hx + 2.5 + Math.sin(this.fase * 0.5) * 2; my = hy + largo * 0.965; giro = 15; flexion = 10; desvio = 0; cierre = 0.3; abre = 0.6; suelto = 1;
    } else {
      // Estirado hacia la presa: la mano de canto no (se vería una raya), sino con el dorso o la palma hacia el que mira,
      // así se ve la garra abierta; la muñeca cae hacia el meñique lo que da (30°) y se levanta en el manotazo
      const manotazo = ataca ? Math.max(0, Math.sin(t * 7)) : 0, ang = angulo + (ataca ? Math.sin(t * 7) * 0.35 : 0);
      mx = hx + 26 + manotazo * 2.4; my = hy + 1.5 + ang * 15; giro = 10; flexion = 8; desvio = -26 + manotazo * 40;
      cierre = 0.13 + (ataca ? (1 + Math.sin(this.ahora / 90)) * 0.1 : 0); abre = 2.4; suelto = 0.75;   // dedos largos y abiertos, en gancho; al morder la garra se abre y se cierra
    }
    const R = resolverBrazo(hx, hy, mx, my, { lado: cerca ? 1 : -1, fondo: cerca ? -2 : 2, afuera: 0.1 }), cx = R.cx, cy = R.cy;
    const en = (x0, y0, x1, y1, k) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    miembroZombie(ctx, m => juntos(tramoMusculo(hx, hy, cx, cy, 6.0 * g - m, 4.7 * g - m, 0.18, 0.22, 0.5, 0.3), tramoMusculo(cx, cy, mx, my, 4.7 * g - m, 3.4 * g - m, 0.2, 0.1, 0.28, 0.3)), piel);
    if (!Pincel.silueta && !golpeado) {   // venas y un parche podrido a lo largo del antebrazo
      const ux = Math.cos(R.ante), uy = Math.sin(R.ante), q = (k, d) => { const [x, y] = en(cx, cy, mx, my, k); return [x - uy * d, y + ux * d]; };
      linea(ctx, 'rgba(35, 55, 20, 0.55)', 0.5, [q(0.16, -0.5 * g), q(0.4, 0.7 * g), q(0.64, 0)]);
      detalle(ctx, 'rgba(70, 50, 20, 0.45)', c => c.ellipse(...q(0.48, 0.4 * g), 2.1 * g, 1.1 * g, R.ante, 0, Math.PI * 2));
    }
    if (manga) { const gm = 1 + (g - 1) * 0.8, fin = en(hx, hy, cx, cy, 0.55); miembroZombie(ctx, m => tramoCortado(hx, hy, fin[0], fin[1], 8.0 * gm - m, 7.0 * gm - m, 1.8), manga); }   // manga corta deshilachada: el hombro es su arranque, no una bola
    // Mano: sigue al antebrazo dentro de lo que da la muñeca
    const B = manoDesdeAntebrazo(R.ante3, cerca, giro, flexion, desvio), kh = 1.22 + (g - 1) * 0.7;   // manos grandes y huesudas
    if (Pincel.silueta) {   // en la sombra, la mano es una mancha: armar los dedos de toda una horda dos veces por cuadro no se paga
      ctx.fillStyle = Pincel.silueta; ctx.beginPath(); ctx.ellipse(mx + B.ex[0] * 3.6 * kh, my + B.ex[1] * 3.6 * kh, 3.9 * kh, 2.3 * kh, Math.atan2(B.ex[1], B.ex[0]), 0, Math.PI * 2); ctx.fill();
      return;
    }
    GARRA.cierre[0] = GARRA.cierre[1] = GARRA.cierre[2] = GARRA.cierre[3] = cierre; GARRA.abre = abre; GARRA.pulgar.suelto = suelto; GARRA.pulgar.arriba = 1 - suelto;
    ctx.save(); ctx.translate(mx, my); ctx.scale(kh, kh);
    dibujarGarra(ctx, [B.ex[0] * MANO.muneca, B.ex[1] * MANO.muneca], B, GARRA, piel, golpeado ? '#fff' : '#2a2418');
    ctx.restore();
  }

  // Cabeza: cráneo demacrado, cuencas hundidas con ojos que brillan, mandíbula floja con dientes
  cabeza(ctx, piel, pielOscura, golpeado, ataca) {
    const V = this.variante, hy = -79;
    const boca = this.bocaAbierta > 0 ? 2.5 + this.bocaAbierta * 4.5 : ataca ? 3.5 + Math.abs(Math.sin(this.ahora / 110)) * 2 : 1.6 + Math.abs(Math.sin(this.fase * 0.7)) * 1;
    // Mandíbula (detrás del cráneo para que se abra hacia abajo)
    pieza(ctx, poli([[-3, hy + 12], [9, hy + 11 + boca], [9.5, hy + 14 + boca], [4, hy + 17 + boca], [-4, hy + 15]]), pielOscura, -4, 10);
    // Cráneo con pómulo marcado
    pieza(ctx, poli([[-8, hy + 4], [-5, hy], [5, hy - 0.5], [9, hy + 3], [10, hy + 8], [9.5, hy + 11], [6, hy + 12], [-3, hy + 13], [-8, hy + 10]]), piel, -8, 10);
    if (!Pincel.silueta) {
      // Boca abierta: interior oscuro y dientes torcidos arriba y abajo
      detalle(ctx, golpeado ? '#fff' : this.colores.boca, poli([[3, hy + 11.5], [9.3, hy + 11], [9.2, hy + 11 + boca], [4, hy + 12 + boca * 0.6]]));
      if (!golpeado) {
        ctx.fillStyle = this.colores.dientes;
        for (let k = 0; k < 4; k++) { ctx.fillRect(4.2 + k * 1.3, hy + 11.2, 0.9, 1.3 + (k % 2) * 0.5); ctx.fillRect(4.6 + k * 1.2, hy + 10.6 + boca, 0.9, 1.2); }
        ctx.fillStyle = this.colores.sangreFresca; ctx.fillRect(8, hy + 11 + boca, 1, 3.5); ctx.beginPath(); ctx.arc(8.5, hy + 14.8 + boca, 0.9, 0, Math.PI * 2); ctx.fill();   // baba de sangre
      }
      // Pómulo hundido, venas en la sien y nariz carcomida
      sombraInterna(ctx, elipse(4, hy + 8.5, 3.6, 1.6, -0.2), 0.28);
      linea(ctx, 'rgba(30, 50, 15, 0.5)', 0.5, [[-4, hy + 3], [-2.5, hy + 5], [-3, hy + 7]]);
      detalle(ctx, 'rgba(25, 15, 8, 0.75)', poli([[8.5, hy + 6.5], [10.3, hy + 8], [9, hy + 9]]));
      // Oreja rota
      pieza(ctx, poli([[-6, hy + 5], [-3.5, hy + 4.5], [-3, hy + 8], [-4.5, hy + 9], [-5, hy + 7.5], [-6.2, hy + 8]]), pielOscura, -6, -3);
      // Cuenca hundida y ojo que brilla (rojo cuando muerde)
      detalle(ctx, 'rgba(20, 30, 8, 0.75)', elipse(5, hy + 5.2, 2.8, 2.2));
      const ojo = this.ojosApagados ? '#3a3420' : ataca ? '#ff3b2b' : '#f2e84a';
      if (!golpeado && !this.ojosApagados) {
        const brillo = ctx.createRadialGradient(5.4, hy + 5.2, 0, 5.4, hy + 5.2, 4);
        brillo.addColorStop(0, ataca ? 'rgba(255, 60, 40, 0.55)' : 'rgba(250, 240, 90, 0.45)'); brillo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = brillo; ctx.fillRect(1, hy + 1, 9, 9);
      }
      detalle(ctx, ojo, circulo(5.6, hy + 5.3, 1.2));
      detalle(ctx, '#1a0a00', circulo(6, hy + 5.3, 0.45));
      // Ceja prominente
      linea(ctx, 'rgba(25, 35, 10, 0.8)', 1.2, [[2.5, hy + 3], [8, hy + 2.6]]);
      // Pelo y heridas del cuero cabelludo según la variante
      if (V.pelo === 'ralo' || V.pelo === 'largo') {
        const largo = V.pelo === 'largo' ? 10 : 4;
        for (let k = 0; k < 6; k++) linea(ctx, golpeado ? '#fff' : '#1e2412', 0.7, [[-6 + k * 2, hy + 0.5 - (k % 2) * 0.5], [-7.5 + k * 1.6, hy + 2 + largo * (0.5 + (k % 3) * 0.25)]]);
      }
      if (V.heridaCabeza) {
        detalle(ctx, golpeado ? '#fff' : '#5a0808', elipse(1, hy + 1.3, 2.8, 1.5, 0.1));
        detalle(ctx, golpeado ? '#fff' : '#c9b8a0', elipse(1.3, hy + 1.1, 1.4, 0.7, 0.1));   // hueso
      }
    }
  }
}
