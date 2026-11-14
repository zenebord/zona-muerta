/* ===== Objetos del mundo: proyectiles, explosiones, cajas, ametralladora fija y partículas ===== */

/* Cruce de un segmento (x0,y0)→(x1,y1) con una caja: devuelve en qué fracción del segmento entra (0..1) o null */
function cruceSegmentoCaja(x0, y0, x1, y1, c) {
  let tmin = 0, tmax = 1;
  for (const [p0, d, lo, hi] of [[x0, x1 - x0, c.x, c.x + c.w], [y0, y1 - y0, c.y, c.y + c.h]]) {
    if (Math.abs(d) < 1e-9) { if (p0 < lo || p0 > hi) return null; continue; }
    let t1 = (lo - p0) / d, t2 = (hi - p0) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

class Proyectil {
  constructor(arma, x, y, vx, vy) {
    this.arma = arma;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.origenX = x; this.origenY = y;
    this.recorrido = 0;
    this.vivo = true;
    this.golpeados = new Set();          // para las balas que perforan
    this.mecha = arma.mecha || 0;        // granadas de mano: explotan cuando se acaba
    this.rebotes = 0;
    this.direccion = Math.sign(vx) || 1;
  }

  actualizar(dt, juego) {
    const paso = dt * 60;
    // El barrido arranca donde estaba la bala; en el primer cuadro, desde el cuerpo del tirador,
    // para que un zombie pegado al jugador (entre él y la boca del arma) también reciba el tiro
    const antesX = this.desdeX ?? this.x, antesY = this.y;
    this.desdeX = undefined;
    if (this.arma.gravedad) this.vy += this.arma.gravedad * paso;
    if (this.arma.cohete) {   // el motor del cohete lo acelera y deja una estela de humo
      this.vx = Math.sign(this.vx) * Math.min(26, Math.abs(this.vx) * (1 + 0.07 * paso));
      if (juego.particulas.length < 600) juego.particulas.push(new Particula(this.x - this.direccion * 6, this.y + (Math.random() - 0.5) * 2, -this.direccion * 0.4, -0.15 - Math.random() * 0.3, '#a49c92', 0.7, 3 + Math.random() * 3, false));
    }
    if (this.arma.fuego) this.vx *= Math.pow(0.986, paso);   // la llama frena con el aire
    if (this.objetivo) {   // tiro con mira telescópica (js/jugador.js): corrige el rumbo hacia el pecho del zombie, no falla
      const z = this.objetivo;
      if (z.estado === 'muerto' || !juego.zombies.includes(z)) this.objetivo = null;
      else {
        const c = z.caja(), dx = c.x + c.w / 2 - this.x, dy = c.y + c.h * 0.4 - this.y, d = Math.hypot(dx, dy) || 1, v = Math.hypot(this.vx, this.vy);
        this.vx = dx / d * v; this.vy = dy / d * v; this.direccion = Math.sign(this.vx) || this.direccion;
      }
    }
    this.x += this.vx * paso;
    this.y += this.vy * paso;
    this.recorrido += Math.abs(this.vx * paso);

    // Impacto contra zombies: todos los que cruza el segmento recorrido, del más cercano al más lejano
    const cruces = [];
    for (const z of juego.zombies) {
      if (z.estado === 'muerto' || this.golpeados.has(z)) continue;
      if (this.carril !== undefined && z.carril !== this.carril) continue;   // defensa ultra: sólo su carril
      // En un carril cuenta el carril, no la altura: le pega igual a un zombie chiquito (ahí no hay cómo agacharse)
      const caja = this.carril !== undefined ? { ...z.caja(), y: -1e4, h: 2e4 } : z.caja();
      const t = cruceSegmentoCaja(antesX, antesY, this.x, this.y, caja);
      if (t !== null) cruces.push([t, z]);
    }
    for (const b of this.arma.fuego ? [] : juego.blancos || []) {   // las llamas no cuentan en los blancos del entrenamiento
      if (!b.golpeable() || this.golpeados.has(b)) continue;
      const t = cruceSegmentoCaja(antesX, antesY, this.x, this.y, b.caja());
      if (t !== null) cruces.push([t, b]);
    }
    cruces.sort((a, b) => a[0] - b[0]);
    for (const [t, z] of cruces) {
      const ix = antesX + (this.x - antesX) * t, iy = antesY + (this.y - antesY) * t;
      if (z instanceof Blanco) {
        if (!z.impacto(iy, juego, this.disparoId)) continue;   // pasó por fuera de la figura: sigue de largo
        this.golpeados.add(z);
        if (this.arma.explosivo) { this.x = ix; this.y = iy; this.explotar(juego); return; }
        if (!this.arma.perfora) { this.x = ix; this.y = iy; this.vivo = false; return; }
        continue;
      }
      if (this.arma.explosivo) { this.x = ix; this.y = iy; this.explotar(juego); return; }
      z.recibirDano(this.arma.dano, this.direccion, this.arma, juego);
      if (this.arma.fuego && z.quemar) z.quemar(juego, this.arma.quemaSeg);
      this.golpeados.add(z);
      if (!this.arma.perfora) { this.x = ix; this.y = iy; this.vivo = false; return; }
    }

    // Granadas y lanzagranadas: tocan el piso
    const piso = this.pisoY ?? alturaSuelo(this.x);   // en un carril, el piso es el del carril
    if (this.arma.explosivo && this.y >= piso - 3) {
      if (this.arma.mecha) {         // granada de mano: rebota y rueda
        this.y = piso - 3; this.vy = -Math.abs(this.vy) * 0.35; this.vx *= 0.6; this.rebotes++;
      } else { this.explotar(juego); return; }
    }
    if (this.arma.mecha) {
      this.mecha -= dt * 1000;
      if (this.mecha <= 0) { this.explotar(juego); return; }
    }
    // (la bala de la mira no se corta contra el piso ni el borde de la montaña mientras siga a su zombie: no falla)
    if (this.recorrido > this.arma.alcance || this.y > ALTO + 50 || (!this.arma.explosivo && !this.objetivo && this.y >= piso)) {
      if (this.arma.fuego && this.y >= piso && Math.random() < 0.35 && juego.explosiones.length < 400) juego.explosiones.push(new FuegoPiso(this.x, piso));   // el combustible sigue ardiendo en el piso
      if (this.arma.explosivo && !this.arma.mecha) this.explotar(juego); else this.vivo = false;
    }
  }

  explotar(juego) {
    this.vivo = false;
    juego.explotar(this.x, this.y, this.arma);
  }

  dibujar(ctx, camaraX) {
    const sx = this.x - camaraX;
    ctx.save();
    if (this.arma.fuego) {   // llama: lengua estirada hacia donde vuela; crece y pasa de blanco amarillento a anaranjado, rojo y humo
      const p = Math.min(1, this.recorrido / this.arma.alcance), r = (3.6 + p * 14) * (0.85 + Math.random() * 0.3);
      const rapidez = Math.hypot(this.vx, this.vy), estira = 1 + rapidez * 0.28;
      if (p > 0.5) { ctx.fillStyle = `rgba(58,52,48,${(p - 0.5) * 0.4})`; ctx.beginPath(); ctx.arc(sx, this.y - p * 8, r * 1.15, 0, Math.PI * 2); ctx.fill(); }
      if (p < 0.9) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(sx, this.y); ctx.rotate(Math.atan2(this.vy, this.vx)); ctx.scale(estira, 1);
        const a = 0.8 * (1 - p * 0.85), g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, `rgba(255,${Math.round(245 - p * 150)},${Math.round(170 - p * 160)},${a})`);
        g.addColorStop(0.5, `rgba(255,${Math.round(150 - p * 70)},30,${a * 0.55})`); g.addColorStop(1, 'rgba(200,50,10,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore(); return;
    }
    if (this.arma.cohete) {
      ctx.translate(sx, this.y); ctx.scale(this.direccion, 1);
      ctx.fillStyle = `rgba(255, ${170 + Math.random() * 60}, 60, 0.9)`;
      ctx.beginPath(); ctx.moveTo(-6, -1.4); ctx.lineTo(-13 - Math.random() * 5, 0); ctx.lineTo(-6, 1.4); ctx.fill();   // llama del motor
      parte(ctx, -6, -1.4, 9, 2.8, '#4b5634');                                                                           // cuerpo
      ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.moveTo(3, -1.6); ctx.lineTo(7, 0); ctx.lineTo(3, 1.6); ctx.fill();  // ojiva
      ctx.fillRect(-6.5, -2.4, 2, 4.8);                                                                                   // aletas
    } else if (this.arma.explosivo) {
      ctx.fillStyle = this.arma.mecha ? '#3d5a2a' : '#2a2a2a';
      ctx.beginPath(); ctx.arc(sx, this.y, 5, 0, Math.PI * 2); ctx.fill();
      if (this.arma.mecha && Math.floor(this.mecha / 120) % 2 === 0) { ctx.fillStyle = '#ff5a1f'; ctx.fillRect(sx - 1, this.y - 8, 3, 3); }
    } else if (this.arma.categoria === 'laser') {
      ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 3; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(sx - this.vx * 1.2, this.y); ctx.lineTo(sx, this.y); ctx.stroke();
    } else {
      // Trazadora: una rayita del largo de la velocidad
      ctx.strokeStyle = this.arma.categoria === 'escopeta' ? '#ffcf6a' : '#fff1b0';
      ctx.lineWidth = this.arma.categoria === 'rifle' || this.arma.categoria === 'ametralladora' ? 2.5 : 1.8;
      ctx.beginPath(); ctx.moveTo(sx - this.vx * 0.9, this.y - this.vy * 0.9); ctx.lineTo(sx, this.y); ctx.stroke();
    }
    ctx.restore();
  }
}

class Explosion {
  constructor(x, y, radio) { this.x = x; this.y = y; this.radio = radio; this.t = 0; this.vivo = true; }
  actualizar(dt) { this.t += dt; if (this.t > 0.55) this.vivo = false; }
  dibujar(ctx, camaraX) {
    const p = this.t / 0.55, sx = this.x - camaraX;
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = '#ffb327';
    ctx.beginPath(); ctx.arc(sx, this.y, this.radio * (0.4 + p * 0.6), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5a1f';
    ctx.beginPath(); ctx.arc(sx, this.y, this.radio * p * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = (1 - p) * 0.6; ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(sx, this.y - p * 30, this.radio * (0.5 + p), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

/* Caja de madera con un arma adentro, en perspectiva; las especiales brillan verde */
class Caja {
  constructor(x, armaId, especial) {
    this.x = x; this.y = alturaSuelo(x); this.armaId = armaId; this.especial = !!especial;
    this.t = Math.random() * 6; this.vivo = true;
  }
  actualizar(dt) { this.t += dt; }
  tocaA(jugador) { return Math.abs(jugador.x - this.x) < 30 && Math.abs(jugador.y - this.y) < 50; }
  dibujar(ctx, camaraX) {
    const sx = this.x - camaraX, flote = Math.sin(this.t * 3) * 3;
    sombraElipse(ctx, sx + 8, this.y + 2, 24, 7, 0.3 - flote * 0.02);
    ctx.save();
    ctx.translate(sx, this.y - 14 + flote);
    if (this.especial) { ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 18 + Math.sin(this.t * 5) * 6; }
    cubo(ctx, -16, -12, 30, 26, 10, this.especial ? '#2a3a40' : '#8a5a2b');
    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.especial ? '#39ff14' : '#5a3a18'; ctx.lineWidth = 2;
    ctx.strokeRect(-16, -12, 30, 26);
    ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(14, 14); ctx.moveTo(14, -12); ctx.lineTo(-16, 14); ctx.stroke();
    // Etiqueta con el nombre del arma, flotando encima
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-64, -44, 128, 16);
    ctx.fillStyle = this.especial ? '#39ff14' : '#ffd27a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(ARMAS[this.armaId].nombre, 0, -32);
    ctx.restore();
  }
}

/* Ametralladora clavada al suelo de una montaña. Solo se usa estando ahí. */
class AmetralladoraFija {
  constructor(x) {
    this.x = x; this.y = alturaSuelo(x);
    this.municion = ARMA_FIJA.cargador;
    this.ocupada = false;
  }
  cercaDe(jugador) { return Math.abs(jugador.x - this.x) < 40 && Math.abs(jugador.y - this.y) < 40; }
  dibujar(ctx, camaraX, direccion, jugadorCerca, tapaAbierta = 0, retroceso = 0, manija = 0) {
    const sx = this.x - camaraX;
    const cuerpo = () => {
      // Parapeto de bolsas de arena: cada bolsa redondeada, con costura y atadura
      const bolsa = (x, y, w, h, tono) => {
        pieza(ctx, redondo(x, y, w, h, h * 0.45), tono, x, x + w);
        linea(ctx, 'rgba(60, 45, 20, 0.45)', 0.6, [[x + 3, y + h * 0.55], [x + w - 3, y + h * 0.5]]);
        linea(ctx, 'rgba(60, 45, 20, 0.6)', 0.8, [[x + w - 4, y + 1.5], [x + w - 4, y + h - 1.5]]);
      };
      bolsa(-38, -13, 26, 13, '#a8956a'); bolsa(-13, -13, 26, 13, '#9c8a5a'); bolsa(12, -13, 26, 13, '#a39062');
      bolsa(-26, -25, 26, 12, '#9c8a5a'); bolsa(-1, -25, 24, 12, '#a8956a');
      // Trípode
      linea(ctx, tinta('#1d1d20'), 2.6, [[0, -44], [-15, -27]]); linea(ctx, tinta('#1d1d20'), 2.6, [[0, -44], [14, -27]]); linea(ctx, tinta('#1d1d20'), 2.6, [[0, -44], [1, -26]]);
      ctx.scale(this.ocupada ? direccion : 1, 1);
      ctx.translate(-retroceso, 0);                                                    // el arma retrocede sobre el trípode
      // Cajón, empuñaduras de pala atrás, cañón con camisa perforada, freno de boca y caja de munición
      parte(ctx, -14, -52, 32, 13, '#34363b', { r: 1.5 });
      parte(ctx, -19, -50, 5, 10, '#222'); parte(ctx, -21, -50, 2, 3, '#444'); parte(ctx, -21, -43, 2, 3, '#444');
      parte(ctx, 18, -49, 24, 7, '#2a2b2f');
      ctx.fillStyle = tinta('#111'); for (let k = 0; k < 5; k++) ctx.fillRect(20 + k * 4.4, -47, 2.2, 3);
      parte(ctx, 42, -48, 18, 4, '#1c1d20'); parte(ctx, 58, -49.5, 6, 7, '#4a4b50');
      parte(ctx, 22, -54, 10, 2, '#3a3b40'); parte(ctx, 25, -53, 2, 4, '#3a3b40');   // asa de transporte
      parte(ctx, 9 - manija * 8, -44, 4, 7, '#56575c');                              // manija de carga (la tira la mano)
      parte(ctx, -9, -40, 12, 11, '#6b6a3a', { r: 0.6 }); ctx.fillStyle = tinta('#e0d070'); ctx.font = '3px sans-serif'; if (!Pincel.silueta) ctx.fillText('.50 CAL', -8.5, -33);
      // Tapa del cajón: se levanta por la bisagra de atrás cuando se cambia la cinta
      ctx.save(); ctx.translate(-14, -52); ctx.rotate(-tapaAbierta * 1.1);
      parte(ctx, 0, -3, 32, 3.2, '#3d3e44'); ctx.restore();
      if (tapaAbierta > 0.5) { for (let k = 0; k < 5; k++) parte(ctx, -8 + k * 5, -52, 2.4, 3.5, '#c9a227'); }   // cinta a la vista
      else if (!Pincel.silueta) { for (let k = 0; k < 4; k++) parte(ctx, -6 - k * 3.2, -40 + k * 1.5, 2.4, 4, '#c9a227'); }   // cinta colgando hacia la caja
    };
    conSombra(ctx, sx, this.y, cuerpo, 0.28);
    if (jugadorCerca && !this.ocupada) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(sx - 70, this.y - 90, 140, 18);
      ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t('mundo.montar'), sx, this.y - 77);
    }
  }
}

/* Fogonazo: estrella de fuego en la boca del arma durante un instante y una bocanada de humo que sube */
class Fogonazo {
  constructor(x, y, direccion, tamano, color) {
    this.x = x; this.y = y; this.dir = direccion; this.tam = tamano; this.color = color;
    this.t = 0; this.vivo = true; this.giro = (Math.random() - 0.5) * 0.25; this.forma = Math.random();
  }
  actualizar(dt) { this.t += dt; if (this.t > 0.55) this.vivo = false; }
  dibujar(ctx, camaraX) {
    const sx = this.x - camaraX, sy = this.y;
    ctx.save();
    // Humo: crece, se aclara y sube despacio
    const h = this.t / 0.55;
    ctx.globalAlpha = 0.22 * (1 - h);
    ctx.fillStyle = '#bdb6a8';
    ctx.beginPath(); ctx.arc(sx + this.dir * (6 + h * 10), sy - h * 14, 3 + h * this.tam * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + this.dir * (12 + h * 16), sy - h * 9, 2 + h * this.tam * 0.6, 0, Math.PI * 2); ctx.fill();
    if (this.t < 0.06) {
      const a = 1 - this.t / 0.06, L = this.tam * (1.7 + this.forma * 0.6), W = this.tam * 0.55;
      ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
      const brillo = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.tam * 2.2);
      brillo.addColorStop(0, this.color === 'laser' ? 'rgba(120,255,90,0.55)' : 'rgba(255,210,120,0.55)'); brillo.addColorStop(1, 'rgba(255,150,40,0)');
      ctx.fillStyle = brillo; ctx.fillRect(sx - this.tam * 2.2, sy - this.tam * 2.2, this.tam * 4.4, this.tam * 4.4);
      ctx.translate(sx, sy); ctx.rotate(this.giro); ctx.scale(this.dir, 1);
      const llama = ctx.createLinearGradient(0, 0, L, 0);
      if (this.color === 'laser') { llama.addColorStop(0, '#eaffd8'); llama.addColorStop(1, 'rgba(57,255,20,0)'); }
      else { llama.addColorStop(0, '#fffbe6'); llama.addColorStop(0.35, '#ffd25a'); llama.addColorStop(1, 'rgba(255,110,20,0)'); }
      ctx.fillStyle = llama;
      ctx.beginPath(); ctx.moveTo(0, -W * 0.4); ctx.lineTo(L * 0.45, -W); ctx.lineTo(L * 0.55, -W * 0.25); ctx.lineTo(L, 0); ctx.lineTo(L * 0.55, W * 0.25); ctx.lineTo(L * 0.45, W); ctx.lineTo(0, W * 0.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(L * 0.1, 0); ctx.lineTo(L * 0.25, -W * 1.5); ctx.lineTo(L * 0.32, 0); ctx.lineTo(L * 0.25, W * 1.5); ctx.closePath(); ctx.fill();   // destellos laterales del freno
    }
    ctx.restore();
  }
}

/* Luz del fogonazo: el destello ilumina el piso debajo de la boca y al tirador (cuerpo y arma), más fuerte cerca de la
 * boca. Dura un poco más que la llama (la vista la retiene) y se apaga en curva. */
Fogonazo.prototype.luz = function () { return this.t < 0.09 ? (1 - this.t / 0.09) ** 1.4 : 0; };
const LuzFogonazo = {
  activos(explosiones) { return explosiones.filter(e => e.luz && e.luz() > 0); },   // fogonazos, el chorro del lanzallamas y el fuego del piso
  colorDe(f) { return f.color === 'laser' ? '120,255,90' : '255,184,96'; },
  // Mancha cálida en el piso: más ancha y más tenue cuanto más arriba está la boca
  piso(ctx, camaraX, fogonazos) {
    if (!fogonazos.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const f of fogonazos) {
      const suelo = alturaSuelo(f.x), alto = Math.max(0, suelo - f.y), R = f.tam * 12 + alto * 1.1;
      const fuerza = f.luz() * Math.min(1, f.tam / 6) * 0.95 / (1 + alto / 160), c = f.color === 'laser' ? '110,255,80' : '255,160,60';   // en el piso, más anaranjada: se nota sobre el cemento claro
      ctx.save(); ctx.translate(f.x - camaraX + f.dir * f.tam * 1.5, suelo); ctx.scale(1, 0.22);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, `rgba(${c},${fuerza})`); g.addColorStop(0.4, `rgba(${c},${fuerza * 0.45})`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2); ctx.restore();
    }
    ctx.restore();
  },
  // Luz sobre el tirador: su silueta (sin la sombra) en un lienzo aparte, teñida con la luz que sale de la boca y
  // sumada encima. Con la calidad liviana se omite.
  cuerpo(ctx, camaraX, jugador, fogonazos) {
    if (!fogonazos.length || Lienzo.liviano || jugador.muerto || jugador.aTierra) return;
    const w = ctx.canvas.width, h = ctx.canvas.height;
    if (!this.silueta || this.silueta.width !== w || this.silueta.height !== h) {
      for (const k of ['silueta', 'luces']) { this[k] = document.createElement('canvas'); this[k].width = w; this[k].height = h; }
    }
    const s = this.silueta.getContext('2d'), l = this.luces.getContext('2d'), m = ctx.getTransform();
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, w, h);
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, w, h);
    s.setTransform(m); Pincel.silueta = '#fff';
    s.save(); s.translate(jugador.x - camaraX, jugador.y); jugador.cuerpo(s, false); s.restore();
    Pincel.silueta = null;
    l.setTransform(m); l.globalCompositeOperation = 'lighter';
    for (const f of fogonazos) {
      const x = f.x - camaraX + f.dir * f.tam * 0.6, R = f.tam * 15, a = f.luz() * Math.min(1, 0.55 + f.tam / 14), c = this.colorDe(f);
      const g = l.createRadialGradient(x, f.y, 0, x, f.y, R);
      g.addColorStop(0, `rgba(${c},${a * 0.85})`); g.addColorStop(0.3, `rgba(${c},${a * 0.42})`); g.addColorStop(0.65, `rgba(${c},${a * 0.1})`); g.addColorStop(1, `rgba(${c},0)`);
      l.fillStyle = g; l.fillRect(x - R, f.y - R, R * 2, R * 2);
    }
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-in'; s.drawImage(this.luces, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(this.silueta, 0, 0); ctx.restore();
  },
};

/* ===== Fuego del lanzallamas ===== */
// Luz del chorro: una por descarga, en la mitad de la llama; dura un poco más que la descarga y se apaga
class LuzLlama {
  constructor(x, y, dir) { this.x = x; this.y = y; this.dir = dir; this.tam = 9; this.color = 'fuego'; this.t = 0; this.vivo = true; }
  actualizar(dt) { this.t += dt; if (this.t > 0.1) this.vivo = false; }
  luz() { return this.t < 0.1 ? (1 - this.t / 0.1) * 0.6 : 0; }
  dibujar() {}
}
// Combustible que sigue ardiendo en el piso un poco más de un segundo
class FuegoPiso {
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; this.dur = 1.1 + Math.random() * 0.6; this.vivo = true; this.dir = 0; this.tam = 3.5; this.color = 'fuego'; this.fase = Math.random() * 6; }
  actualizar(dt) { this.t += dt; if (this.t > this.dur) this.vivo = false; }
  luz() { return Math.max(0, 1 - this.t / this.dur) * 0.3; }
  dibujar(ctx, camaraX) {
    const k = Math.max(0, 1 - this.t / this.dur), sx = this.x - camaraX;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) Fuego.lengua(ctx, sx + (i - 1) * 3.4, this.y, 2.2, (5 + Math.sin(this.t * 22 + this.fase + i * 2) * 2) * k, Math.sin(this.t * 15 + i) * 1.2, k);
    ctx.restore();
  }
}
const Fuego = {
  // Una lengua de fuego: base ancha abajo, punta que se mece; amarilla adentro, roja afuera
  lengua(ctx, x, y, ancho, alto, vaiven, fuerza = 1) {
    if (alto <= 0.5) return;
    const g = ctx.createLinearGradient(0, y, 0, y - alto);
    g.addColorStop(0, `rgba(255,236,150,${0.8 * fuerza})`); g.addColorStop(0.45, `rgba(255,140,40,${0.65 * fuerza})`); g.addColorStop(1, 'rgba(210,50,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - ancho, y);
    ctx.quadraticCurveTo(x - ancho, y - alto * 0.55, x + vaiven, y - alto); ctx.quadraticCurveTo(x + ancho, y - alto * 0.55, x + ancho, y); ctx.closePath(); ctx.fill();
  },
  // Zombie prendido fuego: lenguas que suben por todo el cuerpo; se apagan en el último medio segundo
  cuerpo(ctx, camaraX, z, ahora) {
    const resto = (z.quemaHasta - ahora) / 500, fuerza = Math.max(0, Math.min(1, resto)), c = z.caja();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const fx = c.x + c.w * (0.15 + 0.7 * ((i * 0.37) % 1)) - camaraX, base = c.y + c.h * (0.35 + 0.6 * ((i * 0.61) % 1));
      const alto = (10 + Math.sin(ahora / 70 + i * 1.7) * 4 + Math.random() * 3) * (0.6 + 0.4 * fuerza);
      Fuego.lengua(ctx, fx, base, 3.2, alto, Math.sin(ahora / 90 + i) * 2.5, fuerza);
    }
    ctx.restore();
  },
};

class Particula {
  // piso: hasta dónde cae (en el último bastión, la fila de quien la largó; cada gota un poco más adelante o más atrás,
  // para que quede una mancha y no una raya); si no, el suelo de ese lugar
  constructor(x, y, vx, vy, color, vida, tam, gravedad, piso) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color;
    this.vida = vida; this.vidaMax = vida; this.tam = tam; this.gravedad = gravedad; this.vivo = true;
    this.piso = piso === undefined ? undefined : piso + (Math.random() - 0.5) * 14;
  }
  actualizar(dt) {
    const paso = dt * 60;
    this.vida -= dt; if (this.vida <= 0) { this.vivo = false; return; }
    if (this.gravedad) this.vy += 0.4 * paso;
    this.x += this.vx * paso; this.y += this.vy * paso;
    const piso = this.piso ?? alturaSuelo(this.x);
    if (this.y > piso) { this.y = piso; this.vy = 0; this.vx *= 0.5; }
  }
  dibujar(ctx, camaraX) {
    ctx.globalAlpha = Math.min(1, this.vida / this.vidaMax * 2);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - camaraX - this.tam / 2, this.y - this.tam / 2, this.tam, this.tam);
    ctx.globalAlpha = 1;
  }
}

/* Casquillo (o cargador vacío) que sale volando, rebota en el piso y se esfuma enseguida */
class Casquillo {
  constructor(x, y, direccion, tipo, suave) {
    this.x = x; this.y = y; this.tipo = tipo;   // pistola | bala | escopeta | grande | cargador | cargadorPistola | tambor | granada40 | peine | speedloader | enBloque
    const esCargador = tipo === 'cargador' || tipo === 'cargadorPistola' || tipo === 'tambor' || tipo === 'speedloader' || tipo === 'peine';
    if (suave) {   // cae del arma al abrirla, sin salir disparado
      this.vx = -direccion * (0.2 + Math.random() * 0.6); this.vy = 0.3 + Math.random() * 0.4;
    } else if (tipo === 'enBloque') {   // el peine vacío del Garand: el resorte lo tira para arriba, un poco hacia atrás y girando
      this.vx = -direccion * (0.5 + Math.random() * 0.7); this.vy = -(4.6 + Math.random() * 1.0); this.lado = direccion;
    } else {
      this.vx = -direccion * (esCargador ? 0.4 + Math.random() * 0.4 : 1.2 + Math.random() * 1.4);
      this.vy = esCargador ? 0.5 : -(2.5 + Math.random() * 2.2);
    }
    this.rot = esCargador || tipo === 'enBloque' ? (Math.random() - 0.5) * 0.4 : Math.random() * Math.PI * 2;   // el cargador cae parado y se va acostando
    this.vrot = tipo === 'enBloque' ? -direccion * (0.22 + Math.random() * 0.18) : (Math.random() - 0.5) * (esCargador ? 0.2 : 0.7);
    this.vida = esCargador || tipo === 'pasador' || tipo === 'enBloque' ? 2.4 : 1.0; this.vidaMax = this.vida;
    this.profundidad = 2 + Math.random() * 14;   // dónde cae dentro de la banda de la calle
    this.rebotes = 0; this.vivo = true;
  }
  actualizar(dt) {
    const paso = dt * 60;
    this.vida -= dt; if (this.vida <= 0) { this.vivo = false; return; }
    this.vy += 0.35 * paso; this.x += this.vx * paso; this.y += this.vy * paso; this.rot += this.vrot * paso;
    const piso = alturaSuelo(this.x) + this.profundidad;
    if (this.y >= piso) {
      this.y = piso;
      if (this.vy > 0.8 && this.rebotes < 3) {
        const fuerza = Math.min(1, this.vy / 5);
        this.vy = -this.vy * 0.38; this.vx *= 0.7; this.rebotes++;
        if (this.rebotes === 1) Audio_.casquillo(this.tipo, !Mundo.interior && Mundo.plano || alturaSuelo(this.x) < SUELO_BASE - 1 ? 'arena' : 'asfalto', fuerza);
      }
      else {
        this.vy = 0; this.vrot = 0;
        if (this.cargador) {   // queda tendido: el largo del cargador acostado, del lado más cercano a como cayó
          const [ex, ey] = this.cargador.ejeLargo || this.cargador.eje, b = Math.atan2(ey, ex * this.lado);
          this.rot = Math.round((this.rot + b) / Math.PI) * Math.PI - b;
        } else if (this.tipo === 'cargador' || this.tipo === 'cargadorPistola') this.rot = Math.PI / 2;
        else if (this.tipo === 'enBloque') this.rot = Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2);   // queda apoyado sobre un canto
      }
      this.vx *= 0.6;
    }
  }
  dibujar(ctx, camaraX) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.vida / 0.3);   // se desvanece en los últimos 0,3 s
    ctx.translate(this.x - camaraX, this.y); ctx.rotate(this.rot);
    if (this.tipo !== 'cargador' && this.tipo !== 'cargadorPistola' && this.tipo !== 'tambor' && this.tipo !== 'pasador' && this.tipo !== 'enBloque' && this.rebotes === 0 && Math.sin(this.rot * 3) > 0.6) {   // destello del latón al girar
      ctx.fillStyle = 'rgba(255, 240, 190, 0.3)'; ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    if (this.cargador) {   // el cargador de su arma, en cm, girado alrededor de donde lo tenía la mano
      const M = this.cargador, K = ESCALA_JUGADOR * CM;
      ctx.scale(this.lado * K, K); ctx.translate(-M.agarre[0], -M.agarre[1]);
      dibujarCargadorSuelto(ctx, M, false);
      ctx.restore();
      return;
    }
    if (this.tipo === 'enBloque') {   // el mismo peine que entra en el Garand (js/municion.js), vacío, girando sobre su centro
      const K = ESCALA_JUGADOR * CM;
      ctx.scale(this.lado * K, K); ctx.translate(-calibreDe('garand').vaina * 0.31 + 0.35, 0);
      dibujarPeine(ctx, 'garand', 0);
      ctx.restore();
      return;
    }
    // Proporciones reales (vaina de 9 mm, de fusil, de .50 y cartucho de escopeta), agrandadas para que se vean al volar.
    // El latón y el plástico, de los mismos tonos apagados que la munición (js/municion.js)
    const [, laton, latonSombra] = TONOS_MUNICION.laton, rojo = TONOS_MUNICION.plastico[1];
    switch (this.tipo) {
      case 'pistola':  bloque(ctx, -1.0, -0.45, 2.0, 0.9, laton); ctx.fillStyle = latonSombra; ctx.fillRect(-1.0, -0.45, 0.3, 0.9); break;
      case 'escopeta': bloque(ctx, -2.2, -0.8, 4.4, 1.6, rojo); ctx.fillStyle = laton; ctx.fillRect(-2.2, -0.8, 1.1, 1.6); break;
      case 'grande':   bloque(ctx, -3.0, -0.8, 6.0, 1.6, laton); ctx.fillStyle = latonSombra; ctx.fillRect(-3.0, -0.8, 0.5, 1.6); ctx.fillRect(1.6, -0.5, 1.4, 1.0); break;
      case 'cargador': bloque(ctx, -1.0, -5.2, 2.0, 10.4, '#222'); ctx.fillStyle = '#555'; ctx.fillRect(-1.0, 4.4, 2.0, 0.8); break;
      case 'cargadorPistola': bloque(ctx, -0.8, -3.4, 1.6, 6.8, '#222'); ctx.fillStyle = '#444'; ctx.fillRect(-1.0, 2.8, 2.0, 0.7); break;
      case 'granada40': bloque(ctx, -1.7, -1.4, 3.4, 2.8, TONOS_MUNICION.aluminio[1]); ctx.fillStyle = TONOS_MUNICION.aluminio[2]; ctx.fillRect(-1.7, -1.4, 0.5, 2.8); break;   // la vaina corta de aluminio
      case 'peine':    bloque(ctx, -0.3, -2.2, 0.6, 4.4, TONOS_MUNICION.acero[1]); break;                                                                                       // la lámina del peine
      case 'pasador':  ctx.beginPath(); ctx.arc(-1.4, 0, 2.0, 0, Math.PI * 2); ctx.strokeStyle = '#b8b8b8'; ctx.lineWidth = 0.7; ctx.stroke(); bloque(ctx, 0.4, -0.3, 3.8, 0.6, '#9a9a9a'); break;   // anilla y pasador
      case 'tambor':   esfera(ctx, 0, 0, 6.5, '#1e2226'); bloque(ctx, -2, -8, 4, 3, '#2b2f33'); break;
      case 'speedloader': bloque(ctx, -1.3, -1.5, 2.0, 3.0, '#2f3136'); bloque(ctx, -2.3, -0.5, 1.1, 1.0, '#2f3136'); break;                                                   // el cuerpo vacío, a su medida
      default:         bloque(ctx, -1.8, -0.5, 3.6, 1.0, laton); ctx.fillStyle = latonSombra; ctx.fillRect(-1.8, -0.5, 0.35, 1.0); ctx.fillRect(1.0, -0.32, 0.8, 0.64);   // vaina de fusil con cuello
    }
    ctx.restore();
  }
}

/* Misil del ataque aéreo: baja en picada con estela de fuego y humo y explota al tocar el piso */
class Misil {
  constructor(xDestino, retraso, juego) {
    this.xDestino = xDestino; this.retraso = retraso;
    this.yPiso = alturaSuelo(xDestino);
    this.inclinacion = (Math.random() - 0.5) * 0.35;           // llega un poco en diagonal
    this.x = xDestino - Math.sin(this.inclinacion) * 600; this.y = -60;
    this.velocidad = 14; this.vivo = true; this.silbo = false; this.estela = [];
    this.juego = juego;
  }
  actualizar(dt) {
    if (this.retraso > 0) { this.retraso -= dt; return; }
    if (!this.silbo) { this.silbo = true; Audio_.silbidoMisil(); }
    const paso = dt * 60;
    this.velocidad += 0.9 * paso;
    this.x += Math.sin(this.inclinacion) * this.velocidad * paso;
    this.y += Math.cos(this.inclinacion) * this.velocidad * paso;
    this.estela.push({ x: this.x, y: this.y, t: 0 });
    for (const p of this.estela) p.t += dt;
    this.estela = this.estela.filter(p => p.t < 0.6);
    if (this.y >= this.yPiso - 4) { this.vivo = false; this.juego.impactoMisil(this.x, this.yPiso - 6); }
  }
  dibujar(ctx, camaraX) {
    if (this.retraso > 0) return;
    ctx.save();
    for (const p of this.estela) {   // humo gris que se abre y se apaga
      const a = 1 - p.t / 0.6;
      ctx.fillStyle = `rgba(150, 140, 130, ${0.35 * a})`;
      ctx.beginPath(); ctx.arc(p.x - camaraX, p.y, 3 + p.t * 16, 0, Math.PI * 2); ctx.fill();
    }
    ctx.translate(this.x - camaraX, this.y); ctx.rotate(-this.inclinacion);
    const llama = ctx.createLinearGradient(0, -34, 0, -12);
    llama.addColorStop(0, 'rgba(255, 120, 30, 0)'); llama.addColorStop(1, 'rgba(255, 230, 140, 0.95)');
    ctx.fillStyle = llama; ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(0, -34 - Math.random() * 8); ctx.lineTo(3, -12); ctx.fill();
    parte(ctx, -2.6, -14, 5.2, 16, '#6d7177');                         // cuerpo
    ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.moveTo(-2.6, 2); ctx.lineTo(0, 7); ctx.lineTo(2.6, 2); ctx.fill();   // ojiva
    ctx.fillStyle = '#3c3f44'; ctx.fillRect(-5, -14, 2.6, 4); ctx.fillRect(2.4, -14, 2.6, 4);                          // aletas
    ctx.restore();
  }
}

/* Caza que cruza el cielo durante el ataque aéreo (silueta oscura a contraluz) */
class Avion {
  constructor(desdeX, y, direccion, retraso) { this.x = desdeX; this.y = y; this.dir = direccion; this.retraso = retraso; this.vivo = true; this.t = 0; }
  actualizar(dt) { if (this.retraso > 0) { this.retraso -= dt; return; } this.t += dt; this.x += this.dir * 1100 * dt; if (this.t > 2.2) this.vivo = false; }
  dibujar(ctx, camaraX) {
    if (this.retraso > 0) return;
    ctx.save(); ctx.translate(this.x - camaraX * 0.4, this.y); ctx.scale(this.dir, 1);
    ctx.fillStyle = '#1f1a22';
    ctx.beginPath();
    ctx.moveTo(34, 0); ctx.lineTo(18, -3); ctx.lineTo(-4, -3); ctx.lineTo(-14, -12); ctx.lineTo(-20, -12); ctx.lineTo(-16, -3);   // fuselaje y deriva
    ctx.lineTo(-24, -2); ctx.lineTo(-24, 2); ctx.lineTo(-6, 3); ctx.lineTo(-16, 14); ctx.lineTo(-8, 14); ctx.lineTo(10, 3); ctx.lineTo(30, 2); ctx.closePath(); ctx.fill();   // alas
    ctx.fillStyle = 'rgba(255, 170, 80, 0.85)'; ctx.beginPath(); ctx.arc(-26, 0, 2.6, 0, Math.PI * 2); ctx.fill();               // tobera
    ctx.restore();
  }
}

/* ===== Entrenamiento: blancos de tiro =====
 * diana (anillos 10-8-6-4-2), silueta (torso 5, cabeza 10), móvil (diana sobre un riel), alta (diana elevada,
 * hay que saltar) y plato (vuela en arco). Como la vista es de costado, el puntaje sale de la altura del impacto
 * respecto del centro. Se levantan, quedan arriba un rato y se bajan; al acertarles caen hacia atrás. */
class Blanco {
  constructor(tipo, x, cy, op = {}) {
    this.tipo = tipo; this.x = x; this.cy = cy; this.yPiso = alturaSuelo(x);
    this.r = op.r || 13; this.vida = op.vida || 3; this.mult = op.mult || 1; this.alto = !!op.alto; this.bajo = !!op.bajo;
    this.riel = op.riel || null; this.vel = op.vel || 0; this.dir = Math.random() < 0.5 ? -1 : 1;
    this.vx = op.vx || 0; this.vy = op.vy || 0;
    this.cyBase = cy; this.oscila = op.oscila || null;   // { amp, frec, fase }: sube y baja
    this.estado = tipo === 'plato' ? 'arriba' : 'sube'; this.t = 0; this.marcas = []; this.vivo = true;
    this.arribaDesde = null; this.cuenta = false;   // cuenta: ya se sumó como fallado o acertado
  }
  golpeable() { return this.estado === 'arriba' || (this.estado === 'sube' && this.t > 0.15); }
  altura() { return this.estado === 'sube' ? Math.min(1, this.t / 0.25) : this.estado === 'baja' ? Math.max(0, 1 - this.t / 0.3) : 1; }
  actualizar(dt, juego) {
    const paso = dt * 60;
    this.t += dt;
    if (this.arribaDesde === null && this.estado === 'arriba') this.arribaDesde = juego.ahora;
    if (this.tipo === 'plato') {
      if (this.estado === 'cae') { if (this.t > 0.05) this.vivo = false; return; }
      this.vy += 0.12 * paso; this.x += this.vx * paso; this.cy += this.vy * paso;
      if (this.cy > alturaSuelo(this.x) - 3) { this.vivo = false; juego.blancoPerdido(this); }
      return;
    }
    if (this.riel && this.golpeable()) {
      this.x += this.dir * this.vel * paso;
      if (this.x < this.riel[0]) { this.x = this.riel[0]; this.dir = 1; }
      if (this.x > this.riel[1]) { this.x = this.riel[1]; this.dir = -1; }
    }
    if (this.oscila && this.estado !== 'cae') {   // vaivén vertical: hay que tirar cuando cruza la línea de tiro
      this.edad = (this.edad || 0) + dt;
      this.cy = this.cyBase + Math.sin(this.oscila.fase + this.edad * this.oscila.frec) * this.oscila.amp;
    }
    if (this.estado === 'sube' && this.t >= 0.25) { this.estado = 'arriba'; this.t = 0; this.arribaDesde = juego.ahora; }
    else if (this.estado === 'arriba' && this.t >= this.vida) { this.estado = 'baja'; this.t = 0; juego.blancoPerdido(this); }
    else if ((this.estado === 'baja' && this.t >= 0.3) || (this.estado === 'cae' && this.t >= 0.7)) this.vivo = false;
  }
  caja() {
    if (this.tipo === 'silueta') return { x: this.x - 9, y: this.cy - 17, w: 18, h: 50 };
    return { x: this.x - this.r, y: this.cy - this.r, w: this.r * 2, h: this.r * 2 };
  }
  // Puntos según la altura del impacto (null si pasó por fuera de la figura)
  puntosEn(iy) {
    const dy = iy - this.cy;
    if (this.tipo === 'silueta') {
      if (dy >= -16 && dy <= -4) return { puntos: 10, cabeza: true };
      if (dy > -4 && dy <= 32) return { puntos: 5 };
      return null;
    }
    const a = Math.abs(dy) / this.r;
    if (a > 1) return null;
    if (this.tipo === 'plato') return { puntos: 10, plato: true };
    const puntos = a < 0.2 ? 10 : a < 0.4 ? 8 : a < 0.6 ? 6 : a < 0.8 ? 4 : 2;
    return { puntos, centro: puntos === 10 };
  }
  impacto(iy, juego, disparoId) {
    if (!this.golpeable()) return false;
    const res = this.puntosEn(iy);
    if (!res) return false;
    this.marcas.push({ dx: (Math.random() - 0.5) * this.r * 0.5, dy: iy - this.cy });
    this.estado = 'cae'; this.t = 0;
    if (this.tipo === 'plato') for (let k = 0; k < 12; k++) juego.particulas.push(new Particula(this.x, this.cy, (Math.random() - 0.5) * 5, -Math.random() * 4, k % 2 ? '#e0662a' : '#c94f1a', 0.8, 2 + Math.random() * 2, true));
    juego.blancoAcertado(this, res, disparoId);
    return true;
  }
  dibujar(ctx, camaraX) {
    const sx = this.x - camaraX;
    if (this.tipo === 'plato') {
      ctx.save(); ctx.translate(sx, this.cy);
      ctx.fillStyle = '#e0662a'; ctx.beginPath(); ctx.ellipse(0, 0, this.r + 1, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb07a'; ctx.beginPath(); ctx.ellipse(0, -0.8, this.r - 1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return;
    }
    const piso = this.yPiso, ly = this.cy - piso;
    if (this.riel) { ctx.fillStyle = '#3b3a38'; ctx.fillRect(this.riel[0] - camaraX - 10, piso - 1.5, this.riel[1] - this.riel[0] + 20, 3); }
    sombraElipse(ctx, sx + 5, piso + 1, 12 * this.altura(), 3, 0.25);
    ctx.save(); ctx.translate(sx, piso);
    if (this.estado === 'cae') ctx.rotate(Math.min(1, this.t / 0.35) * 1.35);   // se vuelca hacia atrás
    ctx.scale(1, this.altura());
    parte(ctx, -8, -3, 16, 3, '#6b4a2b');                                                     // pie
    if (this.tipo === 'silueta') {
      parte(ctx, -1.4, ly + 32, 2.8, -ly - 32, '#7a5230');                                     // estaca
      ctx.fillStyle = '#b8925a'; ctx.strokeStyle = 'rgba(40, 25, 10, 0.8)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-8, ly - 4); ctx.lineTo(8, ly - 4); ctx.lineTo(9.5, ly + 32); ctx.lineTo(-9.5, ly + 32); ctx.closePath(); ctx.fill(); ctx.stroke();   // torso de cartón
      ctx.beginPath(); ctx.arc(0, ly - 10, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();                                                                               // cabeza
      ctx.strokeStyle = 'rgba(80, 40, 20, 0.6)'; ctx.strokeRect(-4, ly + 2, 8, 14); ctx.beginPath(); ctx.arc(0, ly - 10, 3, 0, Math.PI * 2); ctx.stroke();            // zonas de puntaje
    } else {
      parte(ctx, -1.4, ly + this.r, 2.8, -ly - this.r, '#7a5230');                             // poste
      const anillos = ['#f1ece0', '#1d1d1f', '#2f6fb5', '#c8302b', '#f2c230'];
      anillos.forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, ly, this.r * (1 - k * 0.2), 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(0, ly, this.r, 0, Math.PI * 2); ctx.stroke();
      if (this.alto) { ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('×2', 0, ly - this.r - 2); }
      if (this.bajo) { ctx.fillStyle = '#7fd3ff'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▼ ×1,5', 0, ly - this.r - 2); }
      else if (this.riel && this.mult > 1 && !this.alto) { ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('×' + String(this.mult).replace('.', ','), 0, ly - this.r - 2); }
    }
    ctx.fillStyle = '#111';
    for (const m of this.marcas) { ctx.beginPath(); ctx.arc(m.dx, ly + m.dy, 1.1, 0, Math.PI * 2); ctx.fill(); }   // agujeros de bala
    ctx.restore();
  }
}

/* Texto que sube y se apaga (puntos de un impacto, "FALLADO") */
class TextoFlotante {
  constructor(x, y, texto, color) { this.x = x; this.y = y; this.texto = texto; this.color = color; this.t = 0; this.vivo = true; }
  actualizar(dt) { this.t += dt; this.y -= dt * 22; if (this.t > 1.1) this.vivo = false; }
  dibujar(ctx, camaraX) {
    ctx.save(); ctx.globalAlpha = Math.min(1, (1.1 - this.t) * 2);
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(this.texto, this.x - camaraX, this.y);
    ctx.fillStyle = this.color; ctx.fillText(this.texto, this.x - camaraX, this.y);
    ctx.restore();
  }
}
