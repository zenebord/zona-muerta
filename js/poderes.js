/* ===== Cuerpo a cuerpo y poderes de las armas legendarias =====
 * Juego.golpeCuerpo resuelve el golpe en el instante en que el arma baja: a quién le pega (los más cercanos
 * adelante, hasta `objetivos`), cuánto los empuja, y el poder de la legendaria:
 *   rayo    Mjölnir: caen rayos sobre los zombies cercanos (hasta 4)
 *   onda    Excalibur: sale una onda de luz que atraviesa todo lo que encuentra
 *   marea   Tridente: una ola de agua avanza por el piso y barre a los zombies hacia atrás
 *   escudo  Égida: se lanza girando, golpea a los que cruza y vuelve a la mano
 *   lanza   Gungnir: se lanza recta, atraviesa y vuelve a la mano
 * Las clases nuevas se portan como un proyectil más (actualizar, dibujar, vivo).
 */
Object.assign(Juego.prototype, {
  // ¿Qué zombies vivos hay adelante, a menos de `alcance`, a la altura del golpe? (los más cercanos primero)
  zombiesAlAlcance(j, alcance, cuantos, ambosLados = false) {
    return this.zombies
      .filter(z => z.estado !== 'muerto')
      .map(z => ({ z, d: (z.x - j.x) * j.direccion }))
      .filter(o => (ambosLados ? Math.abs(o.d) : o.d) < alcance + o.z.ancho / 2 && o.d > (ambosLados ? -alcance : -12) && Math.abs((o.z.y - o.z.altura) - j.y) < 75)
      .sort((a, b) => Math.abs(a.d) - Math.abs(b.d))
      .slice(0, cuantos)
      .map(o => o.z);
  },

  golpeCuerpo(j, arma) {
    const dir = j.direccion;
    if (arma.poder === 'escudo' || arma.poder === 'lanza') {   // se arrojan: el golpe es el lanzamiento
      j.lanzado = new ArmaLanzada(arma, j.x + dir * 20, j.y - 56 + j.agachado * BAJA_AGACHADO, dir);
      this.proyectiles.push(j.lanzado);
      Audio_.lanzar(arma.poder);
      return;
    }
    const tocados = this.zombiesAlAlcance(j, arma.alcance, arma.objetivos);
    for (const z of tocados) {
      z.recibirDano(arma.dano, dir, arma, this);
      if (z.estado !== 'muerto') z.empuje = dir * arma.empuje;
      if (arma.filo) this.salpicar(z.x, z.y - z.altura - 42 * z.escala, z.colorSangre, 8, 3.5);
    }
    // En el entrenamiento también se puede pegar a los blancos que estén al alcance
    if (this.blancos) for (const b of this.blancos) {
      const d = (b.x - j.x) * dir;
      if (b.golpeable() && d > -8 && d < arma.alcance + b.r && b.cy > j.y - 95 && b.cy < j.y + 5) b.impacto(b.cy, this, this.disparoId = (this.disparoId || 0) + 1);
    }
    if (tocados.length) { Audio_.golpeCuerpo(arma.filo ? 'filo' : 'contundente', arma.dano >= 15); this.sacudida = Math.max(this.sacudida, arma.dano >= 15 ? 5 : 2.5); }
    switch (arma.poder) {
      case 'rayo': {
        const objetivos = this.zombiesAlAlcance(j, 380, 4, true);
        const cabeza = j.puntoArma('boca');
        this.explosiones.push(new Rayo(cabeza.x, cabeza.y, true));
        for (const z of objetivos) {
          this.explosiones.push(new Rayo(z.x, z.y - z.altura - 30, false));
          if (z.estado !== 'muerto') { z.recibirDano(arma.dano, Math.sign(z.x - j.x) || dir, arma, this); if (z.estado !== 'muerto') z.empuje = (Math.sign(z.x - j.x) || dir) * 4; }
          this.salpicar(z.x, z.y - 30, '#bfe4ff', 6, 3);
        }
        this.destello = 0.22; this.sacudida = 9;
        Audio_.trueno();
        break;
      }
      case 'onda': {
        this.proyectiles.push(new OndaLuz(j.x + dir * 30, j.y - 44 + j.agachado * BAJA_AGACHADO, dir, arma));
        Audio_.ondaLuz();
        break;
      }
      case 'marea':
        this.proyectiles.push(new Marea(j.x + dir * 18, j.y, dir, arma));
        Audio_.marea();
        break;
    }
  },
});

// Rayo: cae del cielo en zigzag (o desde el martillo hacia arriba), con un resplandor que se apaga
class Rayo {
  constructor(x, y, haciaArriba) {
    this.x = x; this.y = y; this.vida = 0.35; this.vivo = true;
    const desde = haciaArriba ? y : 0, hasta = haciaArriba ? 0 : y;
    this.puntos = [];
    for (let k = 0; k <= 9; k++) { const t = k / 9; this.puntos.push([x + (k && k < 9 ? (Math.random() - 0.5) * 34 : 0), desde + (hasta - desde) * t]); }
    this.ramas = Array.from({ length: 3 }, () => { const k = 2 + Math.floor(Math.random() * 6), [px, py] = this.puntos[k]; return [[px, py], [px + (Math.random() - 0.5) * 50, py + 20 + Math.random() * 30]]; });
  }
  actualizar(dt) { this.vida -= dt; if (this.vida <= 0) this.vivo = false; }
  dibujar(ctx, camaraX) {
    const a = Math.max(0, this.vida / 0.35), parpadeo = Math.random() < 0.8 ? 1 : 0.4;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
    const trazar = (pts, ancho, color) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x - camaraX, y) : ctx.moveTo(x - camaraX, y)); ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.stroke(); };
    trazar(this.puntos, 9, `rgba(120,170,255,${0.25 * a * parpadeo})`);
    trazar(this.puntos, 3.5, `rgba(190,225,255,${0.8 * a * parpadeo})`);
    trazar(this.puntos, 1.4, `rgba(255,255,255,${a})`);
    for (const r of this.ramas) trazar(r, 1.2, `rgba(190,225,255,${0.7 * a})`);
    const g = ctx.createRadialGradient(this.x - camaraX, this.y, 2, this.x - camaraX, this.y, 40);
    g.addColorStop(0, `rgba(200,230,255,${0.6 * a})`); g.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = g; ctx.fillRect(this.x - camaraX - 40, this.y - 40, 80, 80);
    ctx.restore();
  }
}

// Onda de luz de Excalibur: medialuna dorada que avanza y atraviesa
class OndaLuz {
  constructor(x, y, dir, arma) { this.x = x; this.y = y; this.dir = dir; this.arma = arma; this.recorrido = 0; this.vivo = true; this.tocados = new Set(); }
  actualizar(dt, juego) {
    const paso = dt * 60, v = 12 * paso;
    this.x += this.dir * v; this.recorrido += v;
    for (const z of juego.zombies) {
      if (z.estado === 'muerto' || this.tocados.has(z)) continue;
      const c = z.caja();
      if (this.x > c.x - 10 && this.x < c.x + c.w + 10 && this.y > c.y - 20 && this.y < c.y + c.h + 20) {
        this.tocados.add(z); z.recibirDano(this.arma.dano, this.dir, this.arma, juego); if (z.estado !== 'muerto') z.empuje = this.dir * 3;
        juego.salpicar(z.x, this.y, '#ffe08a', 5, 2);
      }
    }
    if (juego.blancos) for (const b of juego.blancos) if (!this.tocados.has(b) && b.golpeable() && Math.abs(b.x - this.x) < b.r + 8 && Math.abs(b.cy - this.y) < 30) { this.tocados.add(b); b.impacto(b.cy, juego, juego.disparoId = (juego.disparoId || 0) + 1); }
    if (this.recorrido > 640) this.vivo = false;
  }
  dibujar(ctx, camaraX) {
    const sx = this.x - camaraX, a = Math.min(1, (640 - this.recorrido) / 160);
    ctx.save(); ctx.translate(sx, this.y); ctx.scale(this.dir, 1); ctx.globalCompositeOperation = 'lighter';
    for (const [r, ancho, color] of [[30, 10, `rgba(255,200,80,${0.25 * a})`], [28, 4, `rgba(255,230,140,${0.8 * a})`], [27, 1.5, `rgba(255,255,240,${a})`]]) {
      ctx.beginPath(); ctx.arc(-14, 0, r, -1.1, 1.1); ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.stroke();
    }
    ctx.restore();
  }
}

// Ola del Tridente: una pared de agua que crece, avanza por el piso y empuja fuerte
class Marea {
  constructor(x, y, dir, arma) { this.x0 = x; this.y = y; this.dir = dir; this.arma = arma; this.t = 0; this.vivo = true; this.tocados = new Set(); }
  frente() { return this.x0 + this.dir * Math.min(320, this.t * 520); }
  actualizar(dt, juego) {
    this.t += dt;
    const f = this.frente();
    for (const z of juego.zombies) {
      if (z.estado === 'muerto' || this.tocados.has(z)) continue;
      const d = (z.x - this.x0) * this.dir, df = (f - this.x0) * this.dir;
      if (d > -5 && d < df + 10 && Math.abs(z.y - this.y) < 40) {
        this.tocados.add(z); z.recibirDano(this.arma.dano * 0.7, this.dir, this.arma, juego);
        if (z.estado !== 'muerto') z.empuje = this.dir * 9;
        juego.salpicar(z.x, z.y - 20, '#bfefff', 8, 3);
      }
    }
    if (this.t > 0.95) this.vivo = false;
  }
  dibujar(ctx, camaraX) {
    const f = this.frente(), alto = Math.min(1, this.t * 4) * Math.max(0, 1 - Math.max(0, this.t - 0.6) / 0.35) * 72;
    const x0 = this.x0 - camaraX, x1 = f - camaraX;
    const g = ctx.createLinearGradient(0, this.y - alto, 0, this.y + 6);
    g.addColorStop(0, 'rgba(210,245,255,0.9)'); g.addColorStop(0.3, 'rgba(80,180,220,0.75)'); g.addColorStop(1, 'rgba(20,90,140,0.55)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, this.y + 6);
    for (let k = 0; k <= 12; k++) { const t = k / 12, x = x0 + (x1 - x0) * t; ctx.lineTo(x, this.y - alto * (0.15 + 0.85 * Math.pow(t, 1.6)) + Math.sin(k * 1.7 + this.t * 20) * 2.5); }
    ctx.lineTo(x1 + this.dir * 8, this.y + 6); ctx.closePath(); ctx.fill();
    // Espuma en la cresta
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = 0; k < 8; k++) { const x = x1 - this.dir * k * 5 + (Math.random() - 0.5) * 4; ctx.beginPath(); ctx.arc(x, this.y - alto * (1 - k * 0.05) + Math.random() * 3, 1.5 + Math.random() * 2, 0, Math.PI * 2); ctx.fill(); }
  }
}

// Égida o Gungnir en el aire: van hasta su alcance golpeando a todo lo que cruzan y vuelven a la mano
class ArmaLanzada {
  constructor(arma, x, y, dir) {
    this.arma = arma; this.x = x; this.y = y; this.dir = dir; this.vivo = true; this.vuelta = false; this.recorrido = 0; this.edad = 0;
    this.tocados = new Set(); this.giro = 0;
    this.esLanza = arma.poder === 'lanza';
    this.alcanceVuelo = this.esLanza ? 640 : 430; this.vel = this.esLanza ? 15 : 11;
  }
  actualizar(dt, juego) {
    const paso = dt * 60, j = juego.jugador;
    this.edad += dt;
    if (!this.vuelta) {
      this.x += this.dir * this.vel * paso; this.recorrido += this.vel * paso;
      if (this.recorrido >= this.alcanceVuelo) { this.vuelta = true; this.tocados.clear(); }
    } else {
      // Vuelve a la mano, por más que el jugador se haya movido
      const mx = j.x + j.direccion * 14, my = j.y - 50, dx = mx - this.x, dy = my - this.y, d = Math.hypot(dx, dy);
      const v = Math.min(d, (this.vel + 2) * paso);
      this.x += dx / d * v; this.y += dy / d * v;
      if (d < 18 || this.edad > 5) { this.vivo = false; if (j.lanzado === this) j.lanzado = null; Audio_.atrapar(this.arma.poder); return; }
    }
    this.giro += (this.esLanza ? 0 : 0.45) * paso;
    for (const z of juego.zombies) {
      if (z.estado === 'muerto' || this.tocados.has(z)) continue;
      const c = z.caja();
      if (this.x > c.x - 8 && this.x < c.x + c.w + 8 && this.y > c.y - 8 && this.y < c.y + c.h + 8) {
        this.tocados.add(z); const sentido = Math.sign(z.x - j.x) || this.dir;
        z.recibirDano(this.arma.dano, sentido, this.arma, juego); if (z.estado !== 'muerto') z.empuje = sentido * this.arma.empuje;
        Audio_.golpeCuerpo(this.esLanza ? 'filo' : 'contundente', true);
      }
    }
    if (juego.blancos) for (const b of juego.blancos) if (!this.tocados.has(b) && b.golpeable() && Math.abs(b.x - this.x) < b.r + 10 && Math.abs(b.cy - this.y) < b.r + 10) { this.tocados.add(b); b.impacto(b.cy, juego, juego.disparoId = (juego.disparoId || 0) + 1); }
  }
  dibujar(ctx, camaraX) {
    const d = DIBUJO_ARMAS[this.arma.id];
    ctx.save(); ctx.translate(this.x - camaraX, this.y);
    if (this.esLanza) ctx.rotate((this.vuelta ? -Math.PI / 2 : Math.PI / 2) * this.dir);   // la punta adelante
    else { ctx.scale(1, 0.92); ctx.rotate(this.giro); ctx.translate(-4 * CM, 4 * CM); }
    if (this.esLanza) ctx.translate(0, 50 * CM);
    d.dibujar(ctx, { sinCargador: false });
    ctx.restore();
    // Estela
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = this.esLanza ? 'rgba(150,210,255,0.25)' : 'rgba(255,200,110,0.2)';
    ctx.beginPath(); ctx.ellipse(this.x - camaraX - this.dir * (this.vuelta ? -14 : 14), this.y, 16, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
