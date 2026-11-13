/* ===== Último bastión v2: el Bastión =====
 * Armas y oficios de las unidades (los números están en BASTION2.unidades, js/bastion-v2.js).
 *   Infantería   se forma en el cuartel y camina a su puesto; entra a los búnkeres (hasta 4, de cualquier oficio)
 *     soldado        fusil: tira al más cercano, también a lo que vuela. El blindaje le resta
 *     francotirador  un tiro fuerte y lejano cada 3 s al más peligroso; ignora el blindaje
 *     lanzallamas    quema a todos los del cono a 2 celdas y los deja prendidos; perros y toro no cruzan el fuego
 *     médico         cura a la infantería de alrededor y evita que quien cae a su lado se contagie
 *   Mecanizados  máquinas con dotación: cierran el paso; al romperse, queda un soldado a pie, herido
 *     torreta        ráfagas de bala chica: no apunta al aire y el blindaje le resta
 *     tanque         cañón de un blanco, al de más vida; las mordidas le hacen la mitad; se mueve
 *     mortero        granada con área de 4 a 9 celdas, que tarda 1,5 s en caer donde estaba el blanco
 *     antiaérea      ráfagas con área, sólo a lo que vuela
 *   Dentro de un búnker cada uno usa su arma, con 20 % más de alcance y un poco más de cadencia.
 * También: lo que pasa cuando algo propio recibe daño o cae (contagio), las explosiones, el gas y las granadas.
 */
(() => {
  const P = Juego.prototype, distPlano = BastionV2.distPlano;
  const U_ = tipo => BASTION.unidades[tipo];
  const esInf = u => !!u && u.clase === 'inf';
  // De dónde sale el tiro de cada unidad (lado: hacia dónde mira la infantería)
  const BOCAS = {
    soldado: (u, lado) => ({ x: u.x + 20 * lado, y: u.y - 22 }),
    francotirador: (u, lado) => ({ x: u.x + 27 * lado, y: u.y - 17 }),
    torreta: u => ({ x: u.x + 30, y: u.y - 12 }),
    tanque: u => ({ x: u.x + 44, y: u.y - 23 }),
    mortero: u => ({ x: u.x + 4, y: u.y - 26 }),
    antiaerea: u => ({ x: u.x + 9 * (u.rumbo || 1), y: u.y - 36 }),
  };
  // A qué altura del cuerpo pega un tiro
  const pecho = z => (z.altura || 0) + (z.vuela ? 5 : z.E ? z.E.alto * 0.5 * z.escala : 36 * z.escala);

  /* ---------- El paso de las unidades ---------- */
  P.tropaV2 = function (dt) {
    const ahora = this.ahora, K = this.K2 || this.contextoV2();
    for (const u of [...this.unidades]) {
      u.fuego = Math.max(0, (u.fuego || 0) - dt * 8); u.retroceso = Math.max(0, (u.retroceso || 0) - dt * 3); u.llama = Math.max(0, (u.llama || 0) - dt * 5);
      if (u.invisible || u.quitada || u.llevado) continue;
      if (u.tipo === 'caido') {   // el contagio avanza: a los 3 s se levanta en contra
        u.t += dt;
        if (u.t >= BASTION2.contagio) { u.quitada = true; this.unidades = this.unidades.filter(x => x !== u); this.levantarContagiado(u); }
        continue;
      }
      const U = U_(u.tipo);
      if (!u.listo) {   // en obra
        u.obra += dt / U.tiempo; u.vida = Math.min(u.vidaMax, u.vida + u.vidaMax * 0.75 * dt / U.tiempo);
        if (u.obra >= 1) { u.listo = true; u.vida = u.vidaMax; this.construidas++; Audio_.recarga('cerrar'); }
        continue;
      }
      if (u.techo || u.techoVisto) { const va = u.techo || 0, d = va - (u.techoVisto || 0); u.techoVisto = Math.abs(d) < 1 ? va : (u.techoVisto || 0) + Math.sign(d) * Math.min(Math.abs(d), dt * 110); }   // trepa (o baja) en un instante
      const aturdido = ahora < (u.aturdidoHasta || 0);   // derribado por el toro o soltado por el buitre: no hace nada
      if (u.enCamino && !aturdido) {   // caminando (o manejando) hasta su lugar
        const vel = U.vel || 62, dx = u.destino.x - u.x, dy = u.destino.y - u.y, d = Math.hypot(dx, dy);
        u.caminando = true; u.fase = (u.fase || 0) + dt * 10;
        if (esInf(u) && Math.abs(dx) > 1) u.mira = dx < 0 ? -1 : 1;
        if (d < 2) {
          u.enCamino = false; u.caminando = false; u.x = u.destino.x; u.y = u.destino.y; if (esInf(u)) u.mira = 1;
          if (u.destinoBunker) { const b = u.destinoBunker; u.destinoBunker = null; if (!b.quitada) { if (this.entrarAlBunkerV2(u, b)) continue; u.esperaBunker = b; } }
        } else { u.x += dx / d * Math.min(d, vel * dt); u.y += dy / d * Math.min(d, vel * dt); }
      }
      if (u.esperaBunker) { if (u.esperaBunker.quitada) u.esperaBunker = null; else if (this.entrarAlBunkerV2(u, u.esperaBunker)) continue; }
      if (aturdido) continue;
      if (u.tipo === 'bunker') { for (let k = 0; k < u.dentro.length; k++) this.oficioV2(u, u.dentro[k], U_(u.dentro[k].tipo), dt, K, k); continue; }
      this.oficioV2(u, u, U, dt, K, -1);
    }
    for (const u of this.unidades) if (u.fuegoK) u.fuegoK = u.fuegoK.map(v => Math.max(0, (v || 0) - dt * 8));
    for (const tr of this.trazos) tr.t -= dt;
    this.trazos = this.trazos.filter(tr => tr.t > 0);
  };
  P.entrarAlBunkerV2 = function (u, b) {
    if (!b.listo || b.dentro.length >= U_('bunker').capacidad) return false;
    b.dentro.push({ tipo: u.tipo, vida: u.vida, enfriado: Math.random() * 0.4 }); b.adentro = b.dentro.length;
    u.quitada = true; this.unidades = this.unidades.filter(x => x !== u);
    if (this.moviendo === u) this.soltarMoverV2();
    Audio_.recarga('cerrar');
    return true;
  };

  /* ---------- A quién le tira ---------- */
  P.blancoV2 = function (u, U, alcance, K) {
    let mejor = null, pm = -Infinity;
    for (const z of K.vivos) {
      if (z.estado === 'muerto' || (z.vuela ? !(U.aire || U.soloAire) : U.soloAire)) continue;
      if (z.cubierto && !u.techo && U.arma !== 'explosivo') continue;   // detrás de El Escudo no entra una bala tirada desde el piso (sí desde arriba de un contenedor)
      const d = distPlano(z.x, z.y, u.x, u.y);
      if (d > alcance || d < (U.minimo || 0)) continue;
      let p;
      if (U.elige === 'peligro') p = (20 - BASTION2.peligro.indexOf(z.tipoBastion)) * 2000 - z.x;        // el más peligroso; entre iguales, el más cerca del campamento
      else if (U.elige === 'vida') p = z.vida * 10 - d * 0.01;                                              // el que más aguanta
      else if (U.elige === 'monton') {                                                                       // donde hay más juntos, mejor si están frenados
        let n = 0; for (const o of K.suelo) if (o !== z && Math.abs(o.x - z.x) < U.radio && Math.abs(o.y - z.y) < U.radio) n++;
        p = n * 10 + (z.estado === 'ataca' ? 15 : 0) - z.vel * 0.25;
      } else p = -d;                                                                                         // el más cercano
      if (p > pm) { pm = p; mejor = z; }
    }
    return mejor;
  };

  /* ---------- El oficio de cada uno. q: quien lleva la cuenta del arma (la unidad, o el que está en la plaza de un búnker) ---------- */
  P.oficioV2 = function (u, q, U, dt, K, plaza) {
    const enBunker = plaza >= 0, Bk = U_('bunker');
    if (U.cura) { this.curarV2(u, U, dt, K, enBunker); return; }
    if (!U.alcance) return;   // muro, alambrado, señuelo
    q.enfriado = (q.enfriado || 0) - dt;
    const alcance = U.alcance * (enBunker ? Bk.masAlcance : 1) * (u.techo ? BASTION2.altura.alcance : 1);   // desde un búnker o desde arriba de un contenedor se tira más lejos
    if (U.arma === 'fuego') { this.quemarV2(u, U, dt, K, alcance, enBunker); return; }
    if (q.enfriado > 0.3 && U.cadencia >= 1) return;   // las armas lentas no buscan blanco hasta que están por tirar
    const z = this.blancoV2(u, U, alcance, K);
    if (!z) return;
    if (!enBunker) {
      if (esInf(u) && !u.enCamino) u.mira = z.x < u.x - 4 ? -1 : 1;
      const lado = esInf(u) ? u.mira || 1 : 1;
      if (U.soloAire || u.tipo === 'mortero') u.rumbo = z.x < u.x ? -1 : 1;
      u.apunta = U.soloAire ? limitar(Math.atan2(-(pecho(z) + 10), Math.max(12, Math.abs(z.x - u.x))), -1.3, -0.25)
        : limitar(Math.atan2((z.y - pecho(z)) - (u.y - 20 - (u.techo || 0)), Math.max(20, (z.x - u.x) * lado)), -0.5, 0.5);
    }
    if (q.enfriado > 0) return;
    q.enfriado = U.cadencia * (enBunker ? Bk.masCadencia : 1) * (0.85 + Math.random() * 0.3);
    u.fuego = 1;
    if (enBunker) { u.fuegoK = u.fuegoK || []; u.fuegoK[plaza] = 1; }
    const lado = esInf(u) ? u.mira || 1 : 1, tipo = enBunker ? q.tipo : u.tipo;
    const sale = enBunker ? { x: u.x - 9 + plaza * 6, y: u.y - 17 } : BOCAS[u.tipo](u, lado);
    if (u.techo) sale.y -= u.techo;
    const pega = { x: z.x + (Math.random() - 0.5) * 4, y: z.y - pecho(z) }, dir = z.x >= u.x ? 1 : -1;
    if (U.arma === 'bala') {
      const neto = U.dano - (z.blindaje || 0);   // el blindaje le resta a cada bala; la que no lo pasa, rebota
      z.recibirDano(Math.max(1, neto), dir, neto > 0 ? ARMA_BALA : ARMA_REBOTE, this);
      this.trazos.push({ x0: sale.x, y0: sale.y, x1: pega.x, y1: pega.y, b0: u.y, b1: z.y, t: 0.06 });
      if (z.blindaje && z.estado !== 'muerto') this.reboteV2(z, pega, dir);
      if (Math.random() < (tipo === 'torreta' ? 0.35 : 0.8)) Audio_.disparo(tipo === 'torreta' ? 'ametralladora' : 'rifle', tipo === 'torreta' ? 'm2' : 'm16');
    } else if (U.arma === 'pesada') {
      const erra = Math.random() < (BASTION2.zombies[z.tipoBastion].esquiva || 0);   // el rabioso zigzaguea: los tiros lentos le pasan al lado
      if (erra) { pega.x += dir * 14; pega.y += 10; this.salpicar(pega.x, z.y - 2, '#a89a7c', 4, 2, z.y); } else z.recibirDano(U.dano, dir, ARMA_PESADA, this);
      this.rayosV2.push({ x0: sale.x, y0: sale.y, x1: pega.x, y1: pega.y, b0: u.y, b1: z.y, t: 0.3, dura: 0.3, grueso: tipo === 'tanque' ? 2.6 : 1.3 });
      if (tipo === 'tanque') {
        u.retroceso = 1; this.sacudida = Math.max(this.sacudida, 3);
        this.explosiones.push(new Explosion(pega.x, z.y - 12, 14)); this.explosiones.push(new Fogonazo(sale.x, sale.y, 1, 14, 'fuego'));
        Audio_.disparo('bazuca', 'tanque');
      } else Audio_.disparo('rifle', 'barrett');
    } else if (U.arma === 'explosivo') {
      this.granadasV2.push({ x0: sale.x, y0: u.y, alto0: u.y - sale.y, x: z.x, y: z.y, t: 0, dur: U.vuelo, dano: U.dano, radio: U.radio });
      u.retroceso = 1; Audio_.disparo('lanzagranadas', 'mortero');
    } else if (U.arma === 'flak') {
      for (const o of K.vivos) if (o.vuela && o.estado !== 'muerto' && Math.hypot(o.x - z.x, o.y - z.y) <= U.radio) o.recibirDano(U.dano, dir, ARMA_BALA, this);
      this.flakV2.push({ x: z.x + (Math.random() - 0.5) * 10, y: z.y, alto: (z.altura || 0) + 4 + Math.random() * 8, t: 0, dura: 0.5 });
      this.trazos.push({ x0: sale.x, y0: sale.y, x1: pega.x, y1: pega.y, b0: u.y, b1: z.y, t: 0.06 });
      if (Math.random() < 0.45) Audio_.disparo('ametralladora', 'm2');
    }
  };
  // La bala que pega en el escudo o el casco: chispa y un trazo que sale desviado hacia arriba
  P.reboteV2 = function (z, pega, dir) {
    if (Math.random() < 0.5) this.particulas.push(new Particula(pega.x, pega.y, -dir * (1 + Math.random() * 2), -(1 + Math.random() * 2), '#ffe9a8', 0.25, 1.6, true, z.y));
    this.trazos.push({ x0: pega.x, y0: pega.y, x1: pega.x - dir * (6 + Math.random() * 8), y1: pega.y - 8 - Math.random() * 10, b0: z.y, b1: z.y, t: 0.05 });
  };
  // Lanzallamas: mientras haya alguien que camine a su alcance, quema a todos los del cono y los deja prendidos
  P.quemarV2 = function (u, U, dt, K, alcance, enBunker) {
    let cerca = null, dm = alcance;
    for (const z of K.suelo) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; cerca = z; } }
    if (!cerca) return;
    const ang = Math.atan2((cerca.y - u.y) * 1.3, cerca.x - u.x);
    u.llama = 1; u.anguloLlama = Math.atan2(cerca.y - u.y, cerca.x - u.x); u.alcanceFuego = alcance;
    if (!enBunker && !u.enCamino) u.mira = cerca.x < u.x ? -1 : 1;
    for (const z of K.suelo) {
      const d = distPlano(z.x, z.y, u.x, u.y); if (d > alcance || z.estado === 'muerto') continue;
      let da = Math.atan2((z.y - u.y) * 1.3, z.x - u.x) - ang; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > U.cono && d > 22) continue;
      z.recibirDano(U.dano * dt, 0, ARMA_FUEGO, this);
      if (z.estado !== 'muerto') z.quemar(this, U.quema);
    }
    if (K.ahora >= (u.rugeEn || 0)) { u.rugeEn = K.ahora + 60; Audio_.disparo('lanzallamas', 'lanzallamas'); }
  };
  // Médico: cura a la infantería de alrededor (a sí mismo, a media máquina)
  P.curarV2 = function (u, U, dt, K, enBunker) {
    let cura = false;
    for (const s of K.aPie) {
      if (s === u || s.vida >= s.vidaMax || s.quitada || distPlano(s.x, s.y, u.x, u.y) > U.radio) continue;
      s.vida = Math.min(s.vidaMax, s.vida + U.cura * dt); s.curadoEn = K.ahora; cura = true;
    }
    if (!enBunker && u.vida < u.vidaMax) u.vida = Math.min(u.vidaMax, u.vida + U.cura * 0.5 * dt);
    if (!enBunker) u.curando = cura ? 1 : Math.max(0, (u.curando || 0) - dt * 3);
  };
  // ¿Hay un médico cerca (a pie o dentro de un búnker)?
  P.medicoCercaV2 = function (x, y, menos) {
    const r = U_('medico').radio;
    return this.unidades.some(m => m !== menos && !m.quitada && m.listo && !m.llevado && (m.tipo === 'medico' || (m.tipo === 'bunker' && m.dentro.some(d => d.tipo === 'medico'))) && distPlano(m.x, m.y, x, y) <= r);
  };

  /* ---------- Daño a lo propio ---------- */
  P.herirUnidadV2 = function (u, dano, causa) {
    if (u.quitada || u.vida <= 0) return;
    u.vida -= dano;
    if (u.vida <= 0) this.perderUnidadV2(u, causa);
  };
  // Un soldado caído queda contagiado: a los 3 s se levanta en contra
  P.caerV2 = function (u) {
    this.unidades.push({ tipo: 'caido', c: u.c, f: u.f, x: u.x, y: u.y, vida: 1, vidaMax: 1, listo: true, bloquea: false, costo: 0, t: 0 });
    this.contagiados++; this.aviso(t('b2.contagiado'), 1500);
  };
  // Lo que un zombie (o una explosión, o el gas) termina de romper o de matar
  P.perderUnidadV2 = function (u, causa) {
    if (u.quitada) return;
    const U = U_(u.tipo);
    if (esInf(u)) {   // cae: se contagia, salvo que lo haya volado una explosión o tenga un médico al lado
      const salvado = this.medicoCercaV2(u.x, u.y, u);
      u.quitada = true; u.vida = 0; this.unidades = this.unidades.filter(x => x !== u);
      if (this.moviendo === u) this.soltarMoverV2();
      this.salpicar(u.x, u.y - 14, '#8b0f0f', 12, 3, u.y); Audio_.jugadorHerido();
      if (causa === 'explosion') { this.aviso(t('b2.baja'), 1300); return; }
      if (salvado) { this.aviso(t('b2.sinContagio'), 1500); return; }
      this.caerV2(u);
      return;
    }
    if (U.liviano) {   // alambrado y señuelo: sin estallido, se desarman
      this.quitarUnidad(u);
      this.salpicar(u.x, u.y - 8, u.tipo === 'senuelo' ? '#ffd27a' : '#9aa0a6', 10, 3, u.y);
      if (u.tipo === 'senuelo') { this.explosiones.push(new Explosion(u.x, u.y - 18, 12)); Audio_.recarga('tapa'); }
      return;
    }
    this.quitarUnidad(u, true);   // estalla; los que estaban en el búnker salen a pie
    if (U.clase === 'mec') {      // la dotación queda a pie, herida
      const s = this.nuevaUnidadV2('soldado', u.c, u.f, { x: u.x - 4, y: u.y + 2 }); s.vida = s.vidaMax / 2;
      this.unidades.push(s);
    }
  };

  /* ---------- Explosiones, gas, granadas y fuego ---------- */
  // Una explosión de la horda (hinchado, dinamitero, gas encendido): daña lo propio y también a los zombies de alrededor
  P.explotarV2 = function (e) {
    const base = this.vidaComunV2();
    this.explosiones.push(new Explosion(e.x, e.y - 10, e.radio * 0.8)); this.sacudida = Math.max(this.sacudida, 6); Audio_.explosion();
    for (let k = 0; k < 14; k++) this.particulas.push(new Particula(e.x + (Math.random() - 0.5) * e.radio, e.y - 4, (Math.random() - 0.5) * 5, -Math.random() * 4, k % 3 ? '#6a5a44' : '#3a3228', 0.5 + Math.random() * 0.5, 2 + Math.random() * 3, true, e.y));
    if (e.directo && !e.directo.quitada) this.herirUnidadV2(e.directo, e.danoDirecto, 'explosion');
    for (const u of [...this.unidades]) {
      if (u === e.directo || u.invisible || u.llevado || u.quitada || !U_(u.tipo)) continue;
      if (distPlano(u.x, u.y, e.x, e.y) > e.radio + (u.bloquea ? 14 : 0)) continue;
      this.herirUnidadV2(u, esInf(u) ? e.gente : e.unidades, 'explosion');
    }
    for (const z of this.zombies) if (z !== e.de && z.estado !== 'muerto' && !z.vuela && !z.enterrado && distPlano(z.x, z.y, e.x, e.y) <= e.radio) z.recibirDano(e.zombies * base, z.x >= e.x ? 1 : -1, ARMA_EXPLOSION, this);
  };
  P.efectosV2 = function (dt) {
    const ahora = this.ahora, K = this.K2 || this.contextoV2();
    // Lo que quedó prendido fuego se sigue quemando
    for (const z of this.zombies) if (z.estado !== 'muerto' && z.quemaHasta > ahora) z.recibirDano(BASTION2.quema * dt, 0, ARMA_FUEGO, this);
    // Granadas del mortero: caen donde estaba el blanco cuando salieron
    for (const g of this.granadasV2) {
      g.t += dt;
      if (g.t < g.dur) continue;
      g.fin = true;
      this.explosiones.push(new Explosion(g.x, g.y - 6, g.radio * 0.8)); this.sacudida = Math.max(this.sacudida, 4); Audio_.explosion();
      for (let k = 0; k < 8; k++) this.particulas.push(new Particula(g.x + (Math.random() - 0.5) * g.radio, g.y - 2, (Math.random() - 0.5) * 4, -Math.random() * 3.5, '#6a5a44', 0.4 + Math.random() * 0.4, 2 + Math.random() * 2.5, true, g.y));
      for (const z of this.zombies) if (z.estado !== 'muerto' && !z.vuela && !z.enterrado && distPlano(z.x, z.y, g.x, g.y) <= g.radio) z.recibirDano(g.dano, z.x >= g.x ? 1 : -1, ARMA_EXPLOSION, this);
    }
    this.granadasV2 = this.granadasV2.filter(g => !g.fin);
    // Gas del tóxico: daña a la infantería (también vacía de a uno los búnkeres); el fuego lo enciende
    for (const n of this.nubesV2) {
      n.t += dt;
      if (K.fuegos.some(fu => distPlano(fu.x, fu.y, n.x, n.y) < (fu.alcanceFuego || 88) + n.radio * 0.3)) {
        n.t = Infinity; this.pendientesV2.push({ x: n.x, y: n.y, radio: n.radio, unidades: 30, gente: 30, zombies: 1.5 });
        this.aviso(t('b2.gasEncendido'), 1500); continue;
      }
      for (const u of [...this.unidades]) {
        if (!u.listo || u.invisible || u.llevado || u.quitada) continue;
        const d = distPlano(u.x, u.y, n.x, n.y);
        if (esInf(u)) { if (d < n.radio) this.herirUnidadV2(u, n.dano * dt, 'gas'); }
        else if (u.tipo === 'bunker' && u.dentro.length && d < n.radio + 14 && !this.medicoCercaV2(u.x, u.y)) {
          u.gas = (u.gas || 0) + dt;
          if (u.gas >= n.bunker) {   // el gas entra: cae uno de los de adentro y queda contagiado en la puerta
            u.gas = 0; u.dentro.pop(); u.adentro = u.dentro.length;
            const libre = [[0, 1], [0, -1], [-1, 0], [1, 0]].map(([dc, df]) => [u.c + dc, u.f + df]).find(([c, f]) => this.dentro(c, f) && !this.bloqV2.has(c + ',' + f)) || [u.c, u.f];
            this.caerV2({ c: libre[0], f: libre[1], ...this.centroCelda(libre[0], libre[1]) }); Audio_.jugadorHerido();
          }
        }
      }
    }
    this.nubesV2 = this.nubesV2.filter(n => n.t < n.dura);
    // Lo que arroja la horda: cascotes del lanzador, fardos del Coloso y escupitajos, que dejan un charco de ácido
    for (const p of this.arrojadosV2) {
      p.t += dt;
      if (p.t < p.dur) continue;
      p.fin = true;
      const acido = p.tipo === 'escupitajo';
      if (acido) { this.charcosV2.push({ x: p.x, y: p.y, radio: p.radio, t: 0, dura: p.dura, gente: p.gente, cosas: p.cosas }); this.salpicar(p.x, p.y - 4, '#b6e04a', 10, 3, p.y); Audio_.salpicaduraToxica(0.6); }
      else {
        this.sacudida = Math.max(this.sacudida, p.tipo === 'fardo' ? 5 : 3); Audio_.cuerpoAnimalCae(p.tipo === 'fardo' ? 2.2 : 1.4, 1);
        for (let k = 0; k < 10; k++) this.particulas.push(new Particula(p.x + (Math.random() - 0.5) * p.radio, p.y - 3, (Math.random() - 0.5) * 4, -Math.random() * 3, p.tipo === 'fardo' ? '#d9b65a' : '#8a8478', 0.4 + Math.random() * 0.4, 2 + Math.random() * 2.5, true, p.y));
      }
      for (const u of [...this.unidades]) {
        if (u.invisible || u.llevado || u.quitada || !U_(u.tipo)) continue;
        if (distPlano(u.x, u.y, p.x, p.y) > p.radio + (u.bloquea ? 14 : 0)) continue;
        this.herirUnidadV2(u, acido ? p.golpe : esInf(u) ? p.gente : p.unidades, acido ? 'acido' : 'golpe');
      }
    }
    this.arrojadosV2 = this.arrojadosV2.filter(p => !p.fin);
    for (const c of this.charcosV2) {
      c.t += dt;
      for (const u of [...this.unidades]) {
        if (u.invisible || u.llevado || u.quitada || !U_(u.tipo)) continue;
        if (distPlano(u.x, u.y, c.x, c.y) > c.radio + (u.bloquea ? 14 : 0)) continue;
        this.herirUnidadV2(u, (esInf(u) ? c.gente : c.cosas) * dt, 'acido');
      }
    }
    this.charcosV2 = this.charcosV2.filter(c => c.t < c.dura);
    // Explosiones en cola; lo que maten y estalle se encadena (hasta cuatro vueltas por cuadro)
    for (let vuelta = 0; this.pendientesV2.length && vuelta < 4; vuelta++) { const lista = this.pendientesV2; this.pendientesV2 = []; for (const e of lista) this.explotarV2(e); }
    for (const lista of [this.rayosV2, this.flakV2, this.ondasV2]) for (const x of lista) x.t += lista === this.rayosV2 ? -dt : dt;
    this.rayosV2 = this.rayosV2.filter(r => r.t > 0); this.flakV2 = this.flakV2.filter(x => x.t < x.dura); this.ondasV2 = this.ondasV2.filter(x => x.t < x.dura);
  };
})();
