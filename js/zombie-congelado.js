/* ===== Zombie congelado (mapa de la nieve, js/escenario-nieve.js) =====
 * Pedido: «un zombie que tiene nieve en la ropa, como un zombie congelado, que nos tira bloques de hielo pequeños,
 * azules, que nos sacan 5 puntos de vida». Un excursionista que quedó en la tormenta: campera acolchada azul pizarra con
 * la capucha bajada y gorro de lana con pompón, todo con nieve encima (los hombros, el pecho, el gorro y el ruedo, del
 * que cuelgan carámbanos), la piel gris azulada y escarchada, los ojos celestes, carámbanos en el mentón y el vaho que
 * le sale de la boca. Camina más tieso y más lento que el común y aguanta un poco más.
 * Además de caminar y morder, de lejos (de 140 a 560 px, a la vista) arranca un bloque de hielo: lo levanta por detrás
 * de la cabeza y lo tira por elevación adonde va a estar el jugador. El bloque (BloqueHielo) saca 5 de vida si pega y
 * se rompe en astillas azules contra el piso. Al morir se le desprende el hielo.
 */
const COLORES_CONGELADO = { ...COLORES_ZOMBIE, camiseta: '#41566f', pantalon: '#2c3440', sangre: '#4a1622', sangreFresca: '#7a2236',
  boca: '#13202b', dientes: '#d8e2e6', mancha: 'rgba(85, 30, 48, 0.7)' };
const PIELES_CONGELADO = ['#a9bfc9', '#9fb6c2', '#b4c8d0', '#98b0bd'];
const GORROS_CONGELADO = ['#8a2a30', '#2f5f8a', '#5f7030', '#8a6226'];
const NIEVE = { luz: '#f6f9fc', medio: '#dde8f1', sombra: '#b6c8d8', borde: 'rgba(90, 115, 140, 0.55)' };
const DANO_BLOQUE_HIELO = 5;   // lo que saca un bloque que pega (fijo: el pedido dice 5 puntos de vida)

class ZombieCongelado extends Zombie {
  constructor(x, dificultad) {
    super(x, false, dificultad);
    this.congelado = true;
    this.vidaMax = this.vida = Math.max(1, Math.round(dificultad.vidaZombie * 1.25 * AJUSTE.vidaZombie));
    this.velocidad = (0.72 + Math.random() * 0.35) * dificultad.velocidad * AJUSTE.velocidadZombie;   // tieso de frío
    this.estilo = { id: 'congelado', torso: 'capucha', piernas: 'largo', accesorio: 'gorro-pompon', escala: [0.98, 1.08], gorro: GORROS_CONGELADO[Math.floor(Math.random() * GORROS_CONGELADO.length)] };
    this.escala = azarEntre(...this.estilo.escala);
    this.ancho = 26 * this.escala; this.alto = 64 * this.escala;
    this.piel = PIELES_CONGELADO[Math.floor(Math.random() * PIELES_CONGELADO.length)];
    this.colores = { ...COLORES_CONGELADO, camiseta: variarColor(COLORES_CONGELADO.camiseta), pantalon: variarColor(COLORES_CONGELADO.pantalon) };
    this.colorSangre = '#5a1a2a'; this.colorCharco = 'rgba(70, 20, 35, 0.6)';
    Object.assign(this.variante, { brazoColgando: false, pelo: 'ralo', desgarroCamiseta: false });
    // La nieve que tiene encima: montoncitos en el pecho y la panza (además de los hombros, el gorro y el ruedo)
    this.copos = Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => ({ x: azarEntre(-8, 8), y: azarEntre(-52, -38), r: azarEntre(1.2, 2.4) }));
    this.carambanos = Array.from({ length: 6 }, (_, k) => ({ x: -8 + k * 3.2 + azarEntre(-0.6, 0.6), largo: azarEntre(1.4, 3.6) }));
    this.escarcha = Array.from({ length: 7 }, () => ({ x: azarEntre(-7, 9), y: azarEntre(-78, -66), r: azarEntre(0.35, 0.8) }));
    this.vaho = []; this.proximoVaho = 0;
    this.lanzamiento = null; this.proximoLanzamiento = undefined;
  }

  actualizar(dt, jugador, juego) {
    const ahora = juego.ahora;
    this.ahora = ahora;
    if (this.proximoLanzamiento === undefined) this.proximoLanzamiento = ahora + 1400 + Math.random() * 2200;
    // Vaho: una nubecita que sale de la boca cada tanto, sube un poco y se deshace
    for (const v of this.vaho) { v.t += dt; v.x += v.vx * dt * 60; v.y -= 0.18 * dt * 60; }
    this.vaho = this.vaho.filter(v => v.t < 1.3);
    if (this.estado !== 'muerto' && ahora >= this.proximoVaho) {
      this.proximoVaho = ahora + 1300 + Math.random() * 1500;
      const s = this.escala;
      this.vaho.push({ x: this.x + this.direccion * 10 * s, y: this.y - 67 * s, vx: this.direccion * (0.25 + Math.random() * 0.2), t: 0, r: 2.2 + Math.random() * 1.2 });
    }
    if (this.estado === 'muerto') { this.lanzamiento = null; super.actualizar(dt, jugador, juego); return; }
    const dx = jugador.x - this.x, distancia = Math.abs(dx);
    // Lanzando: quieto, mirando al jugador; suelta el bloque al 62 % del movimiento
    if (this.lanzamiento) {
      const L = this.lanzamiento, p = (ahora - L.desde) / L.dur;
      this.direccion = dx >= 0 ? 1 : -1;
      this.estado = 'prepara';
      if (!L.tirado && p >= 0.62) { L.tirado = true; this.lanzar(jugador, juego); }
      if (p >= 1) this.lanzamiento = null;
      this.y = alturaSuelo(this.x);
      return;
    }
    const enPantalla = Math.abs(this.x - (juego.camaraX + ANCHO / 2)) < ANCHO / 2 - 20;
    if (!jugador.muerto && enPantalla && distancia > 140 && distancia < 560 && ahora >= this.proximoLanzamiento && this.estado !== 'ataca') {
      this.lanzamiento = { desde: ahora, dur: 900, tirado: false };
      this.proximoLanzamiento = ahora + 3000 + Math.random() * 2400;
      return;
    }
    super.actualizar(dt, jugador, juego);
  }

  // Dónde va la mano del brazo de adelante mientras lanza (relativa al hombro; zombie.js: brazo): la lleva por detrás de
  // la cabeza, la descarga por arriba y adelante y la deja caer
  manoLanzando(hx, hy) {
    const L = this.lanzamiento; if (!L) return null;
    const p = limitar((this.ahora - L.desde) / L.dur, 0, 1);
    const reposo = [hx + 26, hy + 1.5], atras = [hx - 7, hy - 22], arriba = [hx + 9, hy - 21], adelante = [hx + 24, hy - 3];
    const entre = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    if (p < 0.55) return entre(reposo, atras, suavizar(p / 0.55));
    if (p < 0.7) { const k = (p - 0.55) / 0.15; return k < 0.5 ? entre(atras, arriba, k * 2) : entre(arriba, adelante, k * 2 - 1); }
    return entre(adelante, reposo, suavizar((p - 0.7) / 0.3));
  }

  // Tiro por elevación adonde va a estar el jugador (un poco adelantado si camina), a la altura del pecho
  lanzar(jugador, juego) {
    const s = this.escala, d = this.direccion, bx = this.x + d * 9 * s, by = this.y - 80 * s, g = 0.26;
    const destino = jugador.x + jugador.vx * 18, caida = (alturaSuelo(destino) - 40) - by;
    let vy = -4.2 - Math.random() * 1.1;
    if (vy * vy + 2 * g * caida < 0) vy = -Math.sqrt(-2 * g * caida) - 1.5;   // más arriba (en la colina): más fuerte
    const t = (-vy + Math.sqrt(vy * vy + 2 * g * caida)) / g;
    const vx = limitar((destino - bx) / Math.max(1, t), -11, 11);
    juego.escupitajos.push(new BloqueHielo(bx, by, vx, vy, g));
    Audio_.hieloLanzar(Math.abs(jugador.x - this.x));
  }

  recibirDano(cantidad, direccion, arma, juego) {
    const antes = this.estado;
    super.recibirDano(cantidad, direccion, arma, juego);
    if (antes === 'muerto') return;
    juego.salpicar(this.x, this.y - this.altura - 50 * this.escala, '#e8f2fa', 3, 2.2);   // cada impacto le saca nieve
    if (this.estado === 'muerto') {   // se le desprende el hielo
      this.lanzamiento = null;
      astillasDeHielo(juego, this.x, this.y - 40 * this.escala, 12, 3.4);
      juego.salpicar(this.x, this.y - 55 * this.escala, '#f2f7fb', 10, 3);
      Audio_.hieloRompe(0.7);
    }
  }

  dibujar(ctx, camaraX, ahora) {
    super.dibujar(ctx, camaraX, ahora);
    if (Pincel.silueta || !this.vaho.length) return;
    for (const v of this.vaho) {   // el vaho, en el mundo: crece, sube y se esfuma
      const k = v.t / 1.3, r = v.r * (1 + k * 2.2);
      ctx.fillStyle = `rgba(236, 244, 250, ${0.42 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(v.x - camaraX, v.y, r, 0, Math.PI * 2); ctx.arc(v.x - camaraX + r * 0.8, v.y - r * 0.3, r * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }

  // El cuerpo de siempre y encima, con la inclinación del torso: la nieve en los hombros y el bloque en la mano
  cuerpo(ctx, golpeado) {
    super.cuerpo(ctx, golpeado);   // deja aplicada la escala y la dirección
    if (Pincel.silueta || golpeado) return;
    const camina = this.estado === 'camina';
    const s = camina ? Math.sin(this.fase) : 0, ty = camina ? -Math.abs(Math.cos(this.fase)) * 1.2 : 0;
    ctx.save();
    ctx.translate(0, -34); ctx.rotate(0.16 + Math.abs(s) * 0.04); ctx.translate(0, 34 + ty);
    // Nieve sobre los hombros (y la parte de arriba de las mangas), con su sombra azulada debajo
    montonNieve(ctx, [[-10.6, -55.4], [-9.2, -58.6], [-5, -60.2], [0, -59.6], [5, -60.4], [9.4, -59], [11.4, -55.6], [9, -56.6], [6.6, -55.2], [3, -56.8], [-1, -55.6], [-4.4, -56.8], [-7.8, -55]]);
    // El bloque de hielo en la mano, mientras lo levanta (hasta que lo suelta)
    const L = this.lanzamiento;
    if (L && !L.tirado) { const m = this.manoLanzando(7, -54); if (m) cuboHielo(ctx, m[0] + 1.5, m[1] - 4.5, 6.6, 0.3); }
    ctx.restore();
  }

  // La campera: costuras del acolchado, cierre, bolsillos, la nieve que se le pegó y el ruedo escarchado con carámbanos
  prendaEncima(ctx, hemY, col, golpeado, est) {
    if (Pincel.silueta) return;
    const tela = this.colores.camiseta, oscuro = ajustarColor(tela, -0.32);
    pieza(ctx, poli([[-10.4, -56], [-4, -60], [4.6, -60], [10.4, -56], [6, -57.6], [0, -58.4], [-6, -57.4]]), col(ajustarColor(tela, 0.12)), -10.4, 10.4);   // la capucha bajada, sobre los hombros
    if (golpeado) return;
    for (const y of [-51, -45, -39]) linea(ctx, oscuro, 0.55, [[-10.2, y], [-4, y + 0.8], [3, y + 0.4], [10, y - 0.6]]);   // costuras del acolchado
    linea(ctx, '#aab4bc', 0.7, [[2.6, -57.6], [2.2, -46], [2.4, hemY + 1]]);                                           // cierre
    for (let y = -55; y < hemY; y += 2.6) detalle(ctx, '#d6dde2', circulo(2.4, y, 0.32));
    pieza(ctx, redondo(4, -42, 5.6, 4.4, 0.8), col(ajustarColor(tela, -0.1)), 4, 9.6);                                  // bolsillo
    for (const c of this.copos) montonNieve(ctx, [[c.x - c.r * 1.4, c.y + c.r * 0.5], [c.x - c.r, c.y - c.r * 0.6], [c.x, c.y - c.r], [c.x + c.r * 1.1, c.y - c.r * 0.5], [c.x + c.r * 1.4, c.y + c.r * 0.5], [c.x, c.y + c.r * 0.3]]);
    // Ruedo: costra de nieve y carámbanos colgando
    montonNieve(ctx, [[-9.6, hemY + 2], [-9.2, hemY - 1.4], [-4, hemY - 2], [2, hemY - 1.2], [8.6, hemY - 2], [9.4, hemY + 1.6], [4, hemY + 0.6], [-2, hemY + 1.4]]);
    for (const k of this.carambanos) carambano(ctx, k.x, hemY + 1, 0.9, k.largo);
  }

  // Gorro de lana con pompón (el de siempre, zombie.js: accesorio) con nieve arriba y escarcha en el borde
  accesorio(ctx, est, golpeado) {
    super.accesorio(ctx, est, golpeado);
    if (Pincel.silueta || golpeado) return;
    const hy = -79;
    montonNieve(ctx, [[-9, hy - 1], [-8, hy - 5.6], [-3, hy - 8.4], [2.6, hy - 8.6], [8, hy - 6.4], [10.4, hy - 1.6], [7, hy - 3.6], [2, hy - 5.2], [-3.4, hy - 4.6], [-7, hy - 2.4]]);
    montonNieve(ctx, [[-2.6, hy - 10.4], [-1.4, hy - 12.4], [1.4, hy - 12.6], [2.8, hy - 10.4], [0, hy - 9.6]]);   // el pompón, nevado
    for (let k = 0; k < 4; k++) carambano(ctx, -6 + k * 4.4, hy + 3.4, 0.7, 1.6 + (k % 2) * 1.1);
  }

  // La cabeza de siempre, con los ojos celestes, la cara escarchada y carámbanos en el mentón
  cabeza(ctx, piel, pielOscura, golpeado, ataca) {
    super.cabeza(ctx, piel, pielOscura, golpeado, ataca);
    if (Pincel.silueta || golpeado) return;
    const hy = -79;
    for (const e of this.escarcha) detalle(ctx, 'rgba(240, 248, 255, 0.75)', circulo(e.x, e.y + 2, e.r));
    linea(ctx, 'rgba(235, 246, 255, 0.7)', 0.6, [[-7, hy + 9], [-5, hy + 11], [-2, hy + 12.4]]);   // escarcha en la quijada
    if (!this.ojosApagados) {   // los ojos: celestes, fríos (rojos cuando muerde, como los otros)
      const brillo = ctx.createRadialGradient(5.4, hy + 5.2, 0, 5.4, hy + 5.2, 4);
      brillo.addColorStop(0, ataca ? 'rgba(255, 70, 60, 0.5)' : 'rgba(150, 225, 255, 0.6)'); brillo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = brillo; ctx.fillRect(1, hy + 1, 9, 9);
      detalle(ctx, ataca ? '#ff3b2b' : '#a8ecff', circulo(5.6, hy + 5.3, 1.25));
      detalle(ctx, '#0c2030', circulo(6, hy + 5.3, 0.45));
    }
    const boca = this.bocaAbierta > 0 ? 2.5 + this.bocaAbierta * 4.5 : 1.6;
    for (const [x, l] of [[2.6, 2.4], [5.2, 3.4], [7.6, 1.8]]) carambano(ctx, x, hy + 15.4 + boca * 0.6, 0.6, l);   // del mentón
  }
}

/* Un montón de nieve pegado a algo: el borde de abajo en sombra azulada y la cara de arriba iluminada */
function montonNieve(ctx, pts) {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.fillStyle = NIEVE.sombra; ctx.fill();
  ctx.strokeStyle = NIEVE.borde; ctx.lineWidth = 0.4; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.translate(-0.3, -0.9); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.fillStyle = NIEVE.medio; ctx.fill();
  ctx.translate(-0.2, -0.7); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.fillStyle = NIEVE.luz; ctx.fill();
  ctx.restore();
}
/* Carámbano: gota de hielo larga y transparente, con el brillo de un costado */
function carambano(ctx, x, y, ancho, largo) {
  ctx.beginPath(); ctx.moveTo(x - ancho, y); ctx.lineTo(x + ancho, y); ctx.lineTo(x + ancho * 0.15, y + largo); ctx.closePath();
  ctx.fillStyle = 'rgba(205, 236, 255, 0.85)'; ctx.fill();
  ctx.strokeStyle = 'rgba(110, 160, 200, 0.6)'; ctx.lineWidth = 0.25; ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(x - ancho * 0.6, y, ancho * 0.4, largo * 0.55);
}
/* Cubito de hielo azul visto en 3/4: cara de adelante, la de arriba más clara y la del costado en sombra, con una veta
 * y el brillo. lado: el ancho de la cara de adelante; giro: radianes */
function cuboHielo(ctx, x, y, lado, giro) {
  const h = lado / 2, p = lado * 0.32;
  ctx.save(); ctx.translate(x, y); ctx.rotate(giro);
  ctx.fillStyle = '#7fc6f6'; ctx.beginPath(); ctx.moveTo(-h, -h); ctx.lineTo(-h + p, -h - p); ctx.lineTo(h + p, -h - p); ctx.lineTo(h, -h); ctx.closePath(); ctx.fill();   // arriba
  ctx.fillStyle = '#2f78c4'; ctx.beginPath(); ctx.moveTo(h, -h); ctx.lineTo(h + p, -h - p); ctx.lineTo(h + p, h - p); ctx.lineTo(h, h); ctx.closePath(); ctx.fill();         // costado
  const g = ctx.createLinearGradient(-h, -h, h, h); g.addColorStop(0, '#9ad6ff'); g.addColorStop(0.55, '#4ea4e8'); g.addColorStop(1, '#2d72bd');
  ctx.fillStyle = g; ctx.fillRect(-h, -h, lado, lado);                                                                                                                       // adelante
  ctx.strokeStyle = 'rgba(16, 52, 96, 0.7)'; ctx.lineWidth = 0.45; ctx.strokeRect(-h, -h, lado, lado);
  ctx.strokeStyle = 'rgba(230, 248, 255, 0.85)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(-h + 0.6, h - 0.8); ctx.lineTo(-h + 0.6, -h + 0.6); ctx.lineTo(h - 0.8, -h + 0.6); ctx.stroke();                                              // filo con luz
  ctx.strokeStyle = 'rgba(220, 244, 255, 0.55)'; ctx.lineWidth = 0.35;
  ctx.beginPath(); ctx.moveTo(-h * 0.2, -h * 0.7); ctx.lineTo(h * 0.15, -h * 0.05); ctx.lineTo(-h * 0.1, h * 0.6); ctx.stroke();                                           // veta adentro
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(-h + 1, -h + 1, lado * 0.18, lado * 0.18);
  ctx.restore();
}
/* Astillas de hielo que saltan (azules y blancas) */
function astillasDeHielo(juego, x, y, cantidad, fuerza) {
  const colores = ['#bfe6ff', '#7cc4f5', '#e9f7ff', '#4f9bd9', '#a9dcff'];
  for (let k = 0; k < cantidad; k++) {
    const a = -Math.PI * (0.1 + Math.random() * 0.8), v = (0.6 + Math.random()) * fuerza;
    juego.particulas.push(new Particula(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.6, colores[k % colores.length], 0.45 + Math.random() * 0.5, 1.6 + Math.random() * 2.2, true));
  }
}

/* Bloque de hielo que tira el zombie congelado: gira en el aire con una estela de escarcha; si le pega al jugador le
 * saca 5 de vida (DANO_BLOQUE_HIELO) y se hace pedazos, igual que contra el piso */
class BloqueHielo {
  constructor(x, y, vx, vy, g) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.g = g; this.dano = DANO_BLOQUE_HIELO;
    this.lado = 6.4 + Math.random() * 1.6; this.giro = Math.random() * 6.28; this.vgiro = (vx >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.08);
    this.rastro = []; this.vivo = true; this.edad = 0;
  }
  actualizar(dt, juego) {
    const paso = dt * 60, j = juego.jugador;
    this.edad += dt;
    this.rastro.push([this.x, this.y]); if (this.rastro.length > 7) this.rastro.shift();
    this.vy += this.g * paso; this.x += this.vx * paso; this.y += this.vy * paso; this.giro += this.vgiro * paso;
    // Contra el jugador (agachado es más bajo)
    const tope = j.y - 84 + j.agachado * BAJA_AGACHADO;
    if (!j.muerto && Math.abs(this.x - j.x) < 12 && this.y > tope && this.y < j.y) {
      j.recibirDano(this.dano, juego, 'aire', this.x - this.vx * 10);   // el casco y el escudo lo frenan (js/protecciones.js)
      this.romper(juego, 1);
      return;
    }
    if (this.y >= alturaSuelo(this.x) - 2) { this.y = alturaSuelo(this.x) - 2; this.romper(juego, 0.6); return; }
    if (this.edad > 5) this.vivo = false;
  }
  romper(juego, fuerza) {
    this.vivo = false;
    astillasDeHielo(juego, this.x, this.y, 9, 2.6 * fuerza + 0.8);
    juego.salpicar(this.x, this.y, '#eef6fc', 4, 1.6);
    Audio_.hieloRompe(fuerza);
  }
  dibujar(ctx, camaraX) {
    ctx.save();
    this.rastro.forEach(([x, y], k) => {   // estela de escarcha
      const a = (k + 1) / this.rastro.length;
      ctx.fillStyle = `rgba(200, 235, 255, ${0.32 * a})`;
      ctx.beginPath(); ctx.arc(x - camaraX, y, 0.8 + a * 1.6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    cuboHielo(ctx, this.x - camaraX, this.y, this.lado, this.giro);
  }
}
