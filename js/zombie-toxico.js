/* ===== Zombie tóxico (mapa de la cloaca) =====
 * Un trabajador de la cloaca con el traje amarillo hecho jirones, la piel verde ácido llena de pústulas
 * que brillan y baba fosforescente. Además de caminar y morder:
 *  - Escupe: echa la cabeza atrás y lanza ácido. «Arco»: cae donde está el jugador y deja un charco que
 *    quema. «Chorro»: recto a la altura de la cabeza; agachándose (↓) pasa por arriba.
 *  - Salta: se agazapa y cae encima del jugador desde lejos.
 *  - Esquiva: a veces, cuando le pegan, da una voltereta hacia atrás.
 */
const G_TOXICO = 0.42;   // gravedad de sus saltos (más flotantes que los del protagonista)
const COLORES_TOXICO = { ...COLORES_ZOMBIE, camiseta: '#c4a22a', pantalon: '#8f7a22', sangre: '#3f7a12', sangreFresca: '#9dff3c',
  boca: '#123005', dientes: '#d6dd9c', mancha: 'rgba(70, 150, 25, 0.85)' };

class ZombieToxico extends Zombie {
  constructor(x, dificultad) {
    super(x, false, dificultad);
    this.toxico = true;
    this.vidaMax = this.vida = Math.max(1, Math.round(dificultad.vidaZombie * 1.35 * AJUSTE.vidaZombie));
    this.velocidad = (1.2 + Math.random() * 0.5) * dificultad.velocidad * AJUSTE.velocidadZombie;
    this.escala = 0.98 + Math.random() * 0.1;
    this.ancho = 26 * this.escala; this.alto = 64 * this.escala;
    this.piel = ['#9fd13a', '#8cc43a', '#b2da4c'][Math.floor(Math.random() * 3)];
    this.colores = COLORES_TOXICO; this.colorSangre = '#7ddc2a'; this.colorCharco = 'rgba(95, 180, 30, 0.65)';
    this.variante.brazoColgando = false;
    this.ropa = 'toxico'; this.estilo = { torso: 'remera', piernas: 'largo', escala: [1, 1] };   // traje entero, pantalón largo roto
    this.variante.rotoIzq = azarEntre(0.35, 0.8); this.variante.rotoDer = azarEntre(0.45, 0.9);
    this.danoAcido = Math.round(dificultad.danoMordida * 0.9 * AJUSTE.mordida);
    // Pústulas: sobre el torso (t), la cabeza (c) y los brazos (b), cada una con su ritmo de brillo
    this.pustulas = Array.from({ length: 9 }, (_, k) => ({ zona: k < 4 ? 't' : k < 6 ? 'c' : 'b', x: azarEntre(-8, 8), y: azarEntre(-3, 3), r: azarEntre(1.2, 2.4), fase: Math.random() * 6 }));
    this.vAlt = 0; this.vxSalto = 0; this.accion = null;
    this.proximoEscupitajo = undefined; this.proximoSalto = undefined; this.proximaEsquiva = 0;
  }

  actualizar(dt, jugador, juego) {
    const paso = dt * 60, ahora = juego.ahora;
    this.ahora = ahora;
    if (this.proximoEscupitajo === undefined) { this.proximoEscupitajo = ahora + 1200 + Math.random() * 1800; this.proximoSalto = ahora + 1500 + Math.random() * 2000; }
    // Muerto en el aire: termina de caer
    if (this.estado === 'muerto') {
      this.tiempoMuerto += dt;
      if (this.altura > 0) { this.vAlt -= G_TOXICO * paso; this.altura = Math.max(0, this.altura + this.vAlt * paso); this.x += this.vxSalto * paso * 0.5; this.y = alturaSuelo(this.x); }
      this.giro *= 0.9;
      return;
    }
    const dx = jugador.x - this.x, distancia = Math.abs(dx);

    // En el aire: salto encima del jugador o voltereta hacia atrás
    if (this.altura > 0) {
      this.estado = 'salta';
      this.x += this.vxSalto * paso;
      this.vAlt -= G_TOXICO * paso; this.altura += this.vAlt * paso;
      this.recogido = Math.min(1, this.recogido + dt * 6);
      const a = this.accion;
      if (a && a.tipo === 'esquiva') this.giro = -this.direccion * Math.PI * 2 * Math.min(1, (ahora - a.desde) / a.dur);
      if (a && a.tipo === 'salto' && !a.pego && distancia < 28 && Math.abs((jugador.y - 40) - (this.y - this.altura - 35)) < 55 && !jugador.muerto) {
        a.pego = true;
        jugador.recibirDano(Math.round(this.mordida * 1.3), juego);
        jugador.envenenar(1.5);
      }
      this.y = alturaSuelo(this.x);
      if (this.altura <= 0) {
        this.altura = 0; this.vAlt = 0; this.giro = 0; this.accion = null; this.estado = 'camina';
        juego.salpicar(this.x, this.y - 2, this.colorSangre, 6, 2);
        Audio_.aterrizar('asfalto');
      }
      return;
    }
    this.recogido = Math.max(0, this.recogido - dt * 5);
    this.bocaAbierta = Math.max(0, this.bocaAbierta - dt * 3);
    this.cabezaAtras = Math.max(0, this.cabezaAtras - dt * 4);

    // Preparando algo: agazapado antes del salto o tomando aire para escupir
    if (this.accion) {
      const a = this.accion, p = Math.min(1, (ahora - a.desde) / (a.hasta - a.desde));
      this.direccion = dx >= 0 ? 1 : -1;
      this.estado = 'prepara';
      if (a.tipo === 'agazapa') { this.recogido = p * 0.75; if (ahora >= a.hasta) this.saltar(jugador, juego); }
      else if (a.tipo === 'escupe') {
        if (!a.disparado) { this.cabezaAtras = Math.min(1, p / 0.55); this.bocaAbierta = 0.3 * p; }
        if (!a.disparado && p >= 0.6) { a.disparado = true; this.cabezaAtras = 0; this.bocaAbierta = 1; this.escupir(jugador, juego, a.modo); }
        if (ahora >= a.hasta) this.accion = null;
      }
      this.y = alturaSuelo(this.x);
      return;
    }

    // Decide: escupir de lejos, saltar de media distancia, o caminar y morder como cualquier zombie
    const enPantalla = Math.abs(this.x - (juego.camaraX + ANCHO / 2)) < ANCHO / 2 - 20;
    if (!jugador.muerto && enPantalla) {
      if (distancia > 150 && distancia < 470 && ahora >= this.proximoEscupitajo) {
        this.accion = { tipo: 'escupe', desde: ahora, hasta: ahora + 700, modo: Math.random() < 0.55 ? 'arco' : 'chorro' };
        this.proximoEscupitajo = ahora + 2600 + Math.random() * 2600;
        Audio_.toxicoArcada(distancia);
        return;
      }
      if (distancia > 75 && distancia < 250 && ahora >= this.proximoSalto) {
        this.accion = { tipo: 'agazapa', desde: ahora, hasta: ahora + 300 };
        this.proximoSalto = ahora + 3400 + Math.random() * 2600;
        return;
      }
    }
    super.actualizar(dt, jugador, juego);
  }

  // Salto parabólico calculado para caer donde está el jugador
  saltar(jugador, juego) {
    const v0 = 7.6, vuelo = 2 * v0 / G_TOXICO;                 // cuadros en el aire
    this.vxSalto = limitar((jugador.x - this.x) / vuelo, -7.5, 7.5);
    this.vAlt = v0; this.altura = 0.01;
    this.accion = { tipo: 'salto', desde: juego.ahora, pego: false };
    Audio_.toxicoChillido(Math.abs(jugador.x - this.x));
  }

  // Voltereta hacia atrás para esquivar
  esquivar(juego) {
    const v0 = 6.4;
    this.vAlt = v0; this.altura = 0.01; this.vxSalto = -this.direccion * 3.4;
    this.accion = { tipo: 'esquiva', desde: juego.ahora, dur: 2 * v0 / G_TOXICO * 1000 / 60 };
  }

  escupir(jugador, juego, modo) {
    const bx = this.x + this.direccion * 11 * this.escala, by = this.y - 68 * this.escala;
    let vx, vy, g;
    if (modo === 'arco') {
      // Tiro por elevación: apunta adonde va a estar el jugador (un poco adelantado si camina)
      g = 0.24; vy = -4.6 - Math.random() * 1.2;
      const destino = jugador.x + jugador.vx * 22, caida = alturaSuelo(destino) - by;
      const t = (-vy + Math.sqrt(vy * vy + 2 * g * caida)) / g;
      vx = limitar((destino - bx) / t, -10, 10);
    } else {
      // Chorro recto a la altura de la cabeza del jugador parado: agachado pasa por arriba
      g = 0.012; vx = this.direccion * 8.5;
      const t = Math.abs(jugador.x - bx) / 8.5;
      vy = ((jugador.y - 76) - by - 0.5 * g * t * t) / Math.max(1, t);
    }
    juego.escupitajos.push(new Escupitajo(bx, by, vx, vy, g, modo, this.danoAcido));
    juego.salpicar(bx, by, this.colorSangre, 5, 1.5);
    Audio_.escupir(Math.abs(jugador.x - this.x));
  }

  recibirDano(cantidad, direccion, arma, juego) {
    const antes = this.estado;
    super.recibirDano(cantidad, direccion, arma, juego);
    if (antes === 'muerto') return;
    if (this.estado === 'muerto') {
      // Revienta en baba verde
      juego.salpicar(this.x, this.y - this.altura - 40 * this.escala, '#b6ff5c', 14, 4);
      this.accion = null; this.bocaAbierta = 0;
      return;
    }
    if (this.altura === 0 && !this.accion && Math.random() < 0.24 && juego.ahora >= this.proximaEsquiva) {
      this.proximaEsquiva = juego.ahora + 4500;
      this.esquivar(juego);
    }
  }

  // Aura verde detrás, el cuerpo de siempre y encima las pústulas que laten
  cuerpo(ctx, golpeado) {
    if (!Pincel.silueta) {
      const aura = ctx.createRadialGradient(0, -44 * this.escala, 4, 0, -44 * this.escala, 46 * this.escala);
      aura.addColorStop(0, 'rgba(150, 255, 60, 0.20)'); aura.addColorStop(1, 'rgba(150, 255, 60, 0)');
      ctx.fillStyle = aura; ctx.fillRect(-50, -95 * this.escala, 100, 100 * this.escala);
    }
    super.cuerpo(ctx, golpeado);   // deja aplicada la escala y la dirección
    if (Pincel.silueta || golpeado) return;
    const t = this.ahora / 1000;
    const camina = this.estado === 'camina';
    const s = camina ? Math.sin(this.fase) : 0, ty = camina ? -Math.abs(Math.cos(this.fase)) * 1.2 : 0;
    const encorvado = 0.16 + Math.abs(s) * 0.04;
    ctx.save();
    ctx.translate(0, -34); ctx.rotate(encorvado); ctx.translate(0, 34 + ty);
    const centro = { t: [0, -46], c: [1, -73], b: [14, -50] };
    for (const p of this.pustulas) {
      const [cx, cy] = centro[p.zona], brillo = 0.55 + Math.sin(t * 3 + p.fase) * 0.35;
      const x = cx + p.x * (p.zona === 'c' ? 0.5 : 1), y = cy + p.y * (p.zona === 't' ? 3 : 1);
      ctx.fillStyle = `rgba(190, 255, 80, ${0.25 * brillo})`; ctx.beginPath(); ctx.arc(x, y, p.r * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c8f1c'; ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(215, 255, 120, ${brillo})`; ctx.beginPath(); ctx.arc(x - p.r * 0.25, y - p.r * 0.25, p.r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    // Baba fosforescente que cuelga de la boca y se estira
    const largo = 4 + Math.abs(Math.sin(t * 1.7 + this.fase)) * 6 + this.bocaAbierta * 4;
    ctx.fillStyle = 'rgba(170, 255, 70, 0.85)';
    ctx.fillRect(8.2, -66, 1.1, largo);
    ctx.beginPath(); ctx.arc(8.75, -66 + largo, 1.2, 0, Math.PI * 2); ctx.fill();
    // Rayas reflectivas del traje
    ctx.fillStyle = 'rgba(220, 225, 210, 0.55)'; ctx.fillRect(-9, -42, 18, 1.6);
    ctx.restore();
  }
}

/* Escupitajo de ácido: gota que brilla con estela. Al tocar al jugador lo quema y lo envenena;
 * el de arco, al caer al piso, deja un charco. */
class Escupitajo {
  constructor(x, y, vx, vy, g, modo, dano) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.g = g; this.modo = modo; this.dano = dano;
    this.rastro = []; this.vivo = true; this.edad = 0;
  }
  actualizar(dt, juego) {
    const paso = dt * 60, j = juego.jugador;
    this.edad += dt;
    this.rastro.push([this.x, this.y]); if (this.rastro.length > 9) this.rastro.shift();
    this.vy += this.g * paso; this.x += this.vx * paso; this.y += this.vy * paso;
    // Contra el jugador: agachado es más bajo (la cabeza baja BAJA_AGACHADO)
    const tope = j.y - 84 + j.agachado * BAJA_AGACHADO;
    if (!j.muerto && Math.abs(this.x - j.x) < 11 && this.y > tope && this.y < j.y) {
      j.recibirDano(this.dano, juego);
      j.envenenar(2.6);
      juego.salpicar(this.x, this.y, '#a6ff4a', 12, 3);
      Audio_.salpicaduraToxica();
      this.vivo = false; return;
    }
    const piso = alturaSuelo(this.x);
    if (this.y >= piso - 1) {
      juego.salpicar(this.x, piso - 2, '#8fe83a', 8, 2.2);
      if (this.modo === 'arco') juego.charcos.push(new CharcoToxico(this.x, piso));
      Audio_.salpicaduraToxica(0.5);
      this.vivo = false; return;
    }
    if (this.edad > 4) this.vivo = false;
  }
  dibujar(ctx, camaraX) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.rastro.forEach(([x, y], k) => {
      const a = (k + 1) / this.rastro.length;
      ctx.fillStyle = `rgba(120, 220, 40, ${0.35 * a})`;
      ctx.beginPath(); ctx.arc(x - camaraX, y, 1.5 + a * 2.2, 0, Math.PI * 2); ctx.fill();
    });
    const sx = this.x - camaraX;
    const halo = ctx.createRadialGradient(sx, this.y, 0, sx, this.y, 11);
    halo.addColorStop(0, 'rgba(190, 255, 90, 0.7)'); halo.addColorStop(1, 'rgba(190, 255, 90, 0)');
    ctx.fillStyle = halo; ctx.fillRect(sx - 11, this.y - 11, 22, 22);
    ctx.restore();
    const ang = Math.atan2(this.vy, this.vx);
    ctx.save(); ctx.translate(sx, this.y); ctx.rotate(ang);
    ctx.fillStyle = '#6fc21f'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4ff8a'; ctx.beginPath(); ctx.ellipse(1, -0.8, 2.2, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

/* Charco de ácido: burbujea unos segundos; pisarlo quema y envenena */
class CharcoToxico {
  constructor(x, y) { this.x = x; this.y = y; this.ancho = 30 + Math.random() * 12; this.edad = 0; this.dura = 6.5; this.vivo = true; this.proximoDano = 0; }
  actualizar(dt, juego) {
    this.edad += dt;
    if (this.edad > this.dura) { this.vivo = false; return; }
    const j = juego.jugador, crece = Math.min(1, this.edad / 0.3);
    if (!j.muerto && j.enSuelo && Math.abs(j.x - this.x) < this.ancho * 0.5 * crece && juego.ahora >= this.proximoDano) {
      this.proximoDano = juego.ahora + 650;
      j.recibirDano(4, juego);
      j.envenenar(1.6);
      Audio_.salpicaduraToxica(0.35);
    }
  }
  dibujar(ctx, camaraX, tiempo) {
    const sx = this.x - camaraX, crece = Math.min(1, this.edad / 0.3), fin = Math.max(0, Math.min(1, (this.dura - this.edad) / 1.2));
    const w = this.ancho * crece * 0.5, a = fin;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(sx, this.y, 2, sx, this.y, w * 1.6);
    halo.addColorStop(0, `rgba(140, 255, 60, ${0.28 * a})`); halo.addColorStop(1, 'rgba(140, 255, 60, 0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.ellipse(sx, this.y, w * 1.6, w * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = `rgba(80, 160, 25, ${0.85 * a})`; ctx.beginPath(); ctx.ellipse(sx, this.y, w, w * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(190, 255, 100, ${0.6 * a})`; ctx.beginPath(); ctx.ellipse(sx - w * 0.2, this.y - 0.8, w * 0.5, w * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    // Burbujas que suben y revientan
    for (let k = 0; k < 4; k++) {
      const ciclo = (tiempo * 1.3 + k * 0.37 + this.x * 0.01) % 1;
      const bx = sx + (k - 1.5) * w * 0.4, by = this.y - ciclo * 4;
      ctx.strokeStyle = `rgba(210, 255, 130, ${(1 - ciclo) * 0.8 * a})`; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(bx, by, 0.8 + ciclo * 1.6, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
