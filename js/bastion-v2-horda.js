/* ===== Último bastión v2: la Horda =====
 * Cómo se crea y cómo se porta cada tipo de zombie (los números están en BASTION2.zombies, js/bastion-v2.js).
 *   Caminantes  cazan: miran, van por el primer humano que ven y rompen lo que lo protege; si no ven a nadie, marchan
 *     común       por el camino si el rodeo es corto; si no, derecho, rompiendo lo que tapa a su presa
 *     corredor    rodea buscando el hueco y nunca rompe
 *     gordo       nunca rodea: va derecho y rompe toda construcción. Aplasta alambrado y señuelo
 *     acorazado   como el común, con casco y escudo: blindaje 2
 *   Especiales  no cazan: cada uno anula una defensa
 *     gritón      ve lejos y grita: los zombies de alrededor van por los humanos que él ve, y se apuran
 *     hinchado    camina hacia lo construido más cercano y estalla al tocarlo o al morir (también mata zombies)
 *     dinamitero  corre derecho al campamento y vuela la primera construcción que le corta el paso
 *     tóxico      caza donde hay más gente junta; al morir deja una nube de gas que sólo daña a la infantería
 *   Animales    van sólo por la gente a pie y no rompen nada
 *     jauría      perros que huelen a través de los muros, rodean, saltan lo bajo y el alambrado
 *     toro        embiste en línea recta: derriba y aturde a la gente que atropella, y arranca el alambrado
 *     bandada     cuervos que vuelan sobre todo y picotean a la gente a pie; si no hay, van al campamento
 *     buitre      vuela hasta alguien a pie, lo levanta y lo suelta en medio de la horda
 *   Acechadores no vienen de frente: cada uno evita la línea de una manera
 *     topo        se entierra al entrar y avanza por debajo de todo, sin que se le pueda tirar; sale junto a lo que
 *                 hay más atrás (mortero, francotirador, médico, antiaérea). La torre de vigía y el tanque lo obligan
 *                 a salir antes, aturdido; el señuelo lo engaña y sale junto al altavoz
 *     lanzador    agarra al zombie que tiene al lado y lo arroja por encima de los muros (va por el aire: le tiran la
 *                 antiaérea y los fusiles); sin zombies a mano, tira cascotes
 *     escupidor   se planta a 5 celdas, más lejos de lo que llegan el soldado y la torreta, y escupe ácido en arco
 *     rabioso     corre al doble que un perro, en zigzag, directo al campamento; los tiros pesados le erran
 *   El Coloso, además de romper todo, arroja fardos a lo que tiene a 5 celdas.
 * Perros y toro no cruzan el fuego del lanzallamas. El contexto K se arma una vez por cuadro (contextoV2).
 */
const ESTILO_SOLDADO_ZOMBIE = { id: 'soldado-zombie', torso: 'chaleco', sinBandas: true, cartucheras: true, camiseta: '#5d6248', chaleco: '#9a8262', piernas: 'largo', pantalon: '#7c7a5e', accesorio: 'casco-soldado', escala: [1.02, 1.08] };
const ESTILO_COLOSO = { id: 'coloso', torso: 'desnudo', camiseta: '#4fae2e', piernas: 'short', pantalon: '#363a5e', accesorio: 'pelo-revuelto', escala: [1, 1] };
const ESTILO_ACORAZADO = { id: 'acorazado', torso: 'uniforme', camiseta: '#232a3a', piernas: 'largo', pantalon: '#1b202c', accesorio: 'casco-antimotin', escudo: true, hombreras: true, escala: [1.04, 1.1] };
const ESTILO_GRITON = { id: 'griton', torso: 'capucha', camiseta: '#7a2d8a', piernas: 'largo', pantalon: '#2a2530', accesorio: 'megafono', escala: [0.92, 1] };
const ESTILO_HINCHADO = { id: 'hinchado', torso: 'desnudo', camiseta: '#a9b44a', piernas: 'short', pantalon: '#4a3f2c', hinchado: true, escala: [1.1, 1.18] };
const ESTILO_DINAMITERO = { id: 'dinamitero', torso: 'chaleco', camiseta: '#5a5148', chaleco: '#c9541c', piernas: 'largo', pantalon: '#3c4252', accesorio: 'casco-obra', dinamita: true, escala: [0.9, 0.98] };
const ESTILO_TOPO = { id: 'topo', torso: 'overol', camiseta: '#6a5a44', overol: '#4a463e', piernas: 'largo', pantalon: '#4a463e', accesorio: 'casco-minero', escala: [0.96, 1.04] };
const ESTILO_LANZADOR = { id: 'lanzador', torso: 'desnudo', camiseta: '#9c9a78', piernas: 'short', pantalon: '#5a2a26', accesorio: 'vincha', numero: '#b8322a', escala: [1, 1] };
const ESTILO_ESCUPIDOR = { id: 'escupidor', torso: 'musculosa', sinDorsal: true, camiseta: '#3a3540', piernas: 'largo', pantalon: '#2c2a30', buche: true, escala: [0.96, 1.04] };
const ESTILO_RABIOSO = { id: 'rabioso', torso: 'remera', camiseta: '#e9e5d8', franja: '#b8322a', piernas: 'corto', pantalon: '#d8d4c6', escala: [0.84, 0.9] };
// Los comunes no llevan la ropa de otro tipo (el gordo, el policía del acorazado, el obrero del dinamitero)
const ESTILOS_COMUNES = VARIANTES_CAMINANTE.filter(v => !['gordo', 'policia', 'obrero'].includes(v.id));

(() => {
  const P = Juego.prototype, distPlano = BastionV2.distPlano, CELDA = BASTION2.celda, Zs = BASTION2.zombies;
  const U_ = tipo => BASTION.unidades[tipo];
  const esInf = u => !!u && u.clase === 'inf';

  /* ---------- Crear ---------- */
  P.crearZombieV2 = function (tipo, dificultad) {
    const dif = dificultad || this.dificultad;
    let z;
    switch (tipo) {
      case 'jefe': z = zombieConEstilo(0, ESTILO_COLOSO, dif); z.piel = '#4fae2e'; z.grosorBrazos = 2; z.grosorPiernas = 1.6; z.jefe = true; break;
      case 'soldadoZombie': z = zombieConEstilo(0, ESTILO_SOLDADO_ZOMBIE, dif); z.piel = '#8fa672'; break;
      case 'gordo': z = zombieConEstilo(0, VARIANTES_CAMINANTE.find(v => v.id === 'gordo'), dif); break;
      case 'corredor': z = new Zombie(0, true, dif); break;
      case 'acorazado': z = zombieConEstilo(0, ESTILO_ACORAZADO, dif); z.variante.brazoColgando = false; z.piel = '#6f8a5a'; break;
      case 'griton': z = zombieConEstilo(0, ESTILO_GRITON, dif); z.variante.brazoColgando = false; z.variante.pelo = 'largo'; z.piel = '#9ab07a'; break;
      case 'hinchado': z = zombieConEstilo(0, ESTILO_HINCHADO, dif); z.variante.brazoColgando = false; z.piel = '#a9b44a'; z.grosorBrazos = 1.25; z.grosorPiernas = 1.3;
        z.pustulas = Array.from({ length: 7 }, (_, k) => ({ x: 1 + azarEntre(-6, 9), y: -52 + k * 3.4 + azarEntre(-1, 1), r: azarEntre(1.4, 2.6), fase: Math.random() * 6 })); break;
      case 'dinamitero': z = new Zombie(0, true, dif); z.estilo = ESTILO_DINAMITERO; z.colores = { ...COLORES_ZOMBIE, camiseta: ESTILO_DINAMITERO.camiseta, pantalon: ESTILO_DINAMITERO.pantalon }; z.variante.pelo = 'calvo'; z.ropa = 'comun'; break;
      case 'toxico': z = new ZombieToxico(0, dif); z.proximaEsquiva = Infinity; break;   // el de la cloaca, sin escupir ni saltar
      case 'topo': z = zombieConEstilo(0, ESTILO_TOPO, dif); z.variante.brazoColgando = false; z.piel = '#8f9a7a'; z.dibujar = dibujarTopo; break;   // js/bastion-v2-dibujo.js
      case 'lanzador': z = zombieConEstilo(0, ESTILO_LANZADOR, dif); z.variante.brazoColgando = false; z.piel = '#9c9a78'; z.grosorBrazos = 1.9; z.grosorPiernas = 1.45; break;
      case 'escupidor': z = zombieConEstilo(0, ESTILO_ESCUPIDOR, dif); z.variante.brazoColgando = false; z.variante.pelo = 'ralo'; z.piel = '#b8a64a'; break;
      case 'rabioso': z = new Zombie(0, true, dif); z.estilo = ESTILO_RABIOSO; z.colores = { ...COLORES_ZOMBIE, camiseta: ESTILO_RABIOSO.camiseta, pantalon: ESTILO_RABIOSO.pantalon }; z.variante.pelo = 'largo'; z.piel = '#a9b89a'; z.ropa = 'comun'; break;
      case 'perro': case 'toro': z = new ZombieAnimal(0, tipo, dif); break;
      case 'cuervo': case 'buitre': z = new AveBastion(tipo, dif); break;   // js/bastion-v2-dibujo.js
      default: z = zombieConEstilo(0, ESTILOS_COMUNES[Math.floor(Math.random() * ESTILOS_COMUNES.length)], dif); z.variante.pelo = ['ralo', 'calvo', 'largo'][Math.floor(Math.random() * 3)];
    }
    this.vestirZombieV2(z, tipo);
    return z;
  };
  // Vida, velocidad y lo que hace falta para portarse como su tipo
  P.vestirZombieV2 = function (z, tipo) {
    const Z = Zs[tipo];
    z.tipoBastion = tipo;
    z.escala = Z.escala * (tipo === 'jefe' ? 1 : 0.94 + Math.random() * 0.12);
    if (z.E) { z.ancho = z.E.ancho * z.escala; z.alto = z.E.alto * z.escala; } else { z.ancho = 26 * z.escala; z.alto = 64 * z.escala; }
    z.vidaMax = z.vida = Math.max(1, Math.round(this.vidaComunV2() * Z.vida));
    z.vel = Z.vel * this.dificultad.velocidad * AJUSTE.velocidadZombie * (0.9 + Math.random() * 0.2);
    z.blindaje = Z.blindaje || 0; z.vuela = Z.mueve === 'vuela';
    if (z.vuela) z.altura = Z.altura;
    // Dónde va la barra de vida (los animales y las aves no tienen la altura de una persona)
    if (tipo === 'perro') { z.barraAlto = 30 * z.escala; z.barraDx = 12 * z.escala; }
    else if (tipo === 'toro') { z.barraAlto = 58 * z.escala; z.barraDx = 14 * z.escala; }
    else if (z.vuela) { z.barraAlto = 14 * z.escala; z.barraDx = 0; }
    z.desvio = (Math.random() - 0.5) * 12; z.direccion = -1; z.mordiscoEn = 0; z.presa = null; z.miraEn = 0;
    z.quietoEn = this.ahora + 1500; z.quietoX = 1e9; z.quietoY = 0;
    if (Z.clase === 'ani') z.gemidoEn = Infinity;   // los animales no gimen
  };
  // La vida de un común en la oleada en curso (la medida de todo lo demás)
  P.vidaComunV2 = function () {
    return this.dificultad.vidaZombie * AJUSTE.vidaZombie * Math.pow(BASTION2.crecimientoVida, Math.max(1, this.ronda) - 1) * (this.nivelV2 ? this.nivelV2.vida : 1);
  };
  // El soldado caído se levanta en contra, con el uniforme puesto
  P.levantarContagiado = function (caido) {
    const z = this.crearZombieV2('soldadoZombie');
    z.x = caido.x; z.y = z.ySuelo = caido.y; z.cabezaAtras = -0.9; z.levanta = 0.7;
    this.zombies.push(z);
    Audio_.gemido(true, 120);
  };

  /* ---------- Lo que hay en el campo en este cuadro ---------- */
  P.contextoV2 = function () {
    const K = { ahora: this.ahora, vivos: [], suelo: [], humanos: [], aPie: [], construidos: [], senuelos: [], alambres: new Map(), medicos: [], fuegos: [], vigias: [], tanques: [] };
    for (const z of this.zombies) if (z.estado !== 'muerto' && !z.enterrado) { K.vivos.push(z); if (!z.vuela) K.suelo.push(z); }   // al topo enterrado no lo ve ni lo toca nadie
    for (const u of this.unidades) {
      if (!u.listo || u.invisible || u.llevado || u.quitada) continue;
      const U = U_(u.tipo); if (!U) continue;   // un caído no es nadie
      if (U.clase === 'inf') { K.humanos.push(u); K.aPie.push(u); if (u.tipo === 'medico') K.medicos.push(u); }
      else {
        K.construidos.push(u);
        if (U.clase === 'mec' || (u.tipo === 'bunker' && u.dentro.length)) K.humanos.push(u);
        if (u.tipo === 'bunker' && u.dentro.some(d => d.tipo === 'medico')) K.medicos.push(u);
        if (u.tipo === 'senuelo') K.senuelos.push(u); else if (u.tipo === 'alambrado') K.alambres.set(u.c + ',' + u.f, u);
        else if (u.tipo === 'vigia') K.vigias.push(u); else if (u.tipo === 'tanque') K.tanques.push(u);
      }
      if (u.llama > 0.3) K.fuegos.push(u);   // un lanzallamas tirando (a pie o desde un búnker)
    }
    return K;
  };

  /* ---------- Mirar, alcanzar y morder ---------- */
  // ¿A quién va el que caza? Si lo llama un señuelo (una sola vez en su vida; sólo a caminantes que no aplastan), deja
  // lo que esté haciendo y va; si no, al humano más cercano dentro de su vista. El tóxico prefiere donde hay más gente
  P.mirarV2 = function (z, Z, K) {
    const ahora = K.ahora; let mejor = null, dm;
    if (!z.fueLlamado && !Z.aplasta && !Z.grupo && K.senuelos.length) {
      dm = U_('senuelo').atrae * CELDA;
      for (const u of K.senuelos) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; mejor = u; } }
      if (mejor) { z.presa = mejor; z.fueLlamado = true; z.entretenido = 0; return; }
    }
    if (z.presa) return;   // sigue con la que tenía
    dm = Z.vista * CELDA; let pm = -Infinity;
    for (const u of K.humanos) {
      if (z.inalcanzable && z.inalcanzable.get(u) > ahora) continue;
      const d = distPlano(z.x, z.y, u.x, u.y);
      if (d >= dm) continue;
      let p = -d;
      if (Z.grupo) { let junto = u.dentro ? u.dentro.length : 1; for (const o of K.humanos) if (o !== u && distPlano(o.x, o.y, u.x, u.y) < 1.6 * CELDA) junto += o.dentro ? o.dentro.length : 1; p += junto * 60; }
      if (p > pm) { pm = p; mejor = u; }
    }
    if (mejor) { z.presa = mejor; z.alerta = ahora + 900; }
  };
  P.alAlcanceV2 = function (z, u) {
    const k = z.tipoBastion === 'jefe' ? 1.5 : 1;
    if (u.bloquea) return Math.abs(z.x - u.x) < 36 * k && Math.abs(z.y - u.y) < 26 * k;   // pegado a la celda que ocupa
    return distPlano(z.x, z.y, u.x, u.y) < (esInf(u) ? 20 : 16) * k;
  };
  P.morderV2 = function (z, u, dt, cada = 900) {
    const Z = Zs[z.tipoBastion];
    z.estado = 'ataca'; z.direccion = u.x < z.x ? -1 : 1; z.fase += dt * 4;
    if (this.ahora < z.mordiscoEn) return;
    z.mordiscoEn = this.ahora + cada;
    if (Z.clase === 'ani') Audio_.gruñido(200, z.tamañoVoz ? z.tamañoVoz() : 1, true); else Audio_.zombieGolpea();
    this.herirUnidadV2(u, this.dificultad.danoMordida * AJUSTE.mordida * (Z.mordida || 1) * (U_(u.tipo).mordida || 1), 'mordida');
  };

  /* ---------- Caminar: un paso hacia (tx, ty), amontonándose, frenándose en el barro y en el alambrado ---------- */
  P.pasoV2 = function (z, Z, dt, K, tx, ty, op = {}) {
    const B = BASTION;
    z.estado = op.estado || 'camina'; z.direccion = tx < z.x - 2 ? -1 : tx > z.x + 2 ? 1 : z.direccion;
    // Amontonamiento: cuantos más alrededor, más lento; y se empujan para no encimarse
    let cerca = 0, ex = 0, ey = 0;
    for (const o of K.suelo) {
      if (o === z || o.estado === 'muerto') continue;
      const dx = z.x - o.x, dy = (z.y - o.y) * 1.6, d2 = dx * dx + dy * dy;
      if (d2 < 22 * 22 && d2 > 0.01) { cerca++; const d = Math.sqrt(d2); ex += dx / d * (22 - d); ey += dy / d * (22 - d) / 1.6; }
    }
    const { c, f } = this.celdaDe(z.x, z.y);
    let paso = this.pasoTerreno(z.x, z.y);
    // Alambrado: lo cruza a menos de la mitad de velocidad y las púas lo lastiman. Cada zombie que lo pisa lo gasta un
    // poco; el gordo y el toro lo arrancan de una pisada, y los perros lo saltan
    const alambre = op.salta ? null : K.alambres.get(c + ',' + f);
    if (alambre && !alambre.quitada) {
      if (Z.aplasta || op.arranca) this.perderUnidadV2(alambre);
      else {
        const A = U_('alambrado');
        paso *= A.frena;
        if (z.pisado !== alambre) { z.pisado = alambre; z.raspado = 0; alambre.vida -= BASTION2.desgaste; if (alambre.vida <= 0) this.perderUnidadV2(alambre); }
        if (z.raspado < z.vidaMax * A.raspa && (z.raspadoTotal || 0) < z.vidaMax * BASTION2.topeRaspado) {   // hasta un quinto de su vida por alambrado, y entre todos, la mitad
          const d = Math.min(z.vidaMax * 0.1 * dt, z.vidaMax * A.raspa - z.raspado);
          z.raspado += d; z.raspadoTotal = (z.raspadoTotal || 0) + d; z.recibirDano(d, 0, ARMA_ALAMBRE, this);
          if (Math.random() < dt * 2.5) this.salpicar(z.x, z.y - 8, z.colorSangre, 2, 2, z.ySuelo);
          if (z.estado === 'muerto') return;
        }
      }
    }
    if (Z.aplasta || op.arranca) for (const su of K.senuelos) if (!su.quitada && su.c === c && su.f === f) this.perderUnidadV2(su);
    let vx = tx - z.x, vy = ty - z.y; const l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
    const corre = op.corre || z.tipoBastion === 'corredor', apuro = K.ahora < (z.apuroHasta || 0) ? z.apuro || 1 : 1;
    const v = (op.vel || z.vel) * apuro / (1 + (op.apretado ?? 0.32) * cerca) * (corre ? 1 : 0.55 + Math.max(0, Math.sin(z.fase)) * 0.9) * paso;
    const mx = (vx * v + ex * 1.2) * dt, my = (vy * v + ey * 1.2) * dt;
    z.x += mx; z.y += my;
    // No meterse en celdas cerradas (si lo empujaron, vuelve). El que ya quedó adentro de una, sale
    const k = this.celdaDe(z.x, z.y), bloq = op.bloq || this.bloqV2;
    if (this.dentro(k.c, k.f) && bloq.has(k.c + ',' + k.f) && !(k.c === c && k.f === f)) { z.x -= mx; z.y -= my; }
    z.y = limitar(z.y, B.arriba + 10, B.arriba + this.filas * B.celda[1] + 6); z.ySuelo = z.y;
    z.fase += dt * (corre ? 14 : 6);
  };
  // Hacia la celda vecina que acerca según el campo. En el campo crudo, la que viene puede ser una construcción: la
  // rompe a mordidas (o hace lo que diga op.alTrabar). u: la presa, si va por alguien
  P.avanzarV2 = function (z, Z, dt, K, campo, crudo, u, op = {}) {
    const B = BASTION, [W] = B.celda, { c, f } = this.celdaDe(z.x, z.y), cc = limitar(c, 0, this.cols - 1), ff = limitar(f, 0, this.filas - 1);
    let tx = B.baseX - 40, ty = z.y;
    if (c >= this.cols) tx = B.baseX + this.cols * W - 12;   // recién llega: entra al campo por su fila
    else {
      const sig = this.siguienteCeldaV2(cc, ff, campo, crudo);
      const traba = crudo && sig ? this.ocupadaPor(sig[0], sig[1]) : null;
      if (traba && !traba.invisible) {
        if (this.alAlcanceV2(z, traba)) { if (op.alTrabar) op.alTrabar(traba); else this.morderV2(z, traba, dt); return; }
        tx = traba.x; ty = traba.y;
      } else if (sig) { const p = this.centroCelda(sig[0], sig[1]); tx = p.x; ty = p.y + z.desvio * 0.5; }
      else if (u) { tx = u.x; ty = u.y; }   // ya está al lado: derecho a la presa
      else if (cc > 0) tx = z.x - 30;       // quedó en un rincón sin salida: hacia el campamento igual
      else ty = this.centroCelda(0, ff).y;
    }
    this.pasoV2(z, Z, dt, K, tx, ty, op);
    // Frenado mucho rato sin avanzar (amontonado contra un muro): se enoja y rompe lo que tenga adelante
    if (K.ahora >= z.quietoEn) {
      if (Math.hypot(z.x - z.quietoX, z.y - z.quietoY) < 5 && Z.llega === 'derecho') z.furia = K.ahora + 3500;
      z.quietoEn = K.ahora + 1800; z.quietoX = z.x; z.quietoY = z.y;
    }
  };

  /* ---------- Conductas ---------- */
  const CONDUCTAS = {
    // Caminantes (y el tóxico): miran, cazan, rompen lo que protege a su presa y, si no ven a nadie, marchan
    caza(z, Z, dt, K) {
      const ahora = K.ahora;
      if (Z.arroja && this.arrojarDeLejosV2(z, Z, K)) return;   // el Coloso: fardos a lo que tiene lejos
      if (z.presa && (z.presa.quitada || z.presa.llevado || (z.presa.tipo === 'bunker' && !z.presa.dentro.length))) z.presa = null;
      if (ahora >= z.miraEn && (!z.presa || (!z.fueLlamado && K.senuelos.length))) { z.miraEn = ahora + 180 + Math.random() * 120; this.mirarV2(z, Z, K); }
      const { c, f } = this.celdaDe(z.x, z.y), cc = limitar(c, 0, this.cols - 1), ff = limitar(f, 0, this.filas - 1);
      const enojado = Z.llega === 'rompe' || ahora < (z.furia || 0);   // va derecho, rompiendo
      let campo = this.distBastion, crudo = false, u = z.presa;
      if (u && u.tipo === 'senuelo' && distPlano(z.x, z.y, u.x, u.y) < 26) {   // lo llamó el altavoz: lo golpea unos segundos buscando a alguien y sigue viaje
        const S = U_('senuelo');
        z.estado = 'ataca'; z.direccion = u.x < z.x ? -1 : 1; z.fase += dt * 3;
        z.entretenido = (z.entretenido || 0) + dt; u.vida -= dt * u.vidaMax / (20 * S.entretiene);   // aguanta a unos 20
        if (u.vida <= 0) this.perderUnidadV2(u);
        if (z.entretenido >= S.entretiene || u.quitada) z.presa = null;
        return;
      }
      if (u) {
        if (u.tipo !== 'senuelo' && this.alAlcanceV2(z, u)) { this.morderV2(z, u, dt); return; }
        const k = u.enCamino ? this.celdaDe(u.x, u.y) : u, uc = limitar(k.c, 0, this.cols - 1), uf = limitar(k.f, 0, this.filas - 1);
        const libre = this.campoLibre(uc, uf), dl = libre[ff][cc];
        if (enojado) { campo = this.campoCrudo(uc, uf); crudo = true; }
        else if (dl < Infinity && (Z.llega === 'rodea' || dl <= 2 * (Math.abs(cc - uc) + Math.abs(ff - uf)) + 5)) campo = libre;
        else if (Z.llega === 'rodea') { (z.inalcanzable || (z.inalcanzable = new Map())).set(u, ahora + 4000); z.presa = u = null; }   // sin hueco: sigue de largo
        else { campo = this.campoCrudo(uc, uf); crudo = true; }   // está tapada: derecho, rompiendo lo que la tapa
      }
      if (!u && enojado) { campo = this.campoCrudoBase(); crudo = true; }
      this.avanzarV2(z, Z, dt, K, campo, crudo, u);
    },

    // Gritón: marcha con la horda y, cuando ve a alguien, se planta y grita
    grita(z, Z, dt, K) {
      const ahora = K.ahora, G = Z.grito;
      if (ahora < (z.gritaHasta || 0)) { z.estado = 'ataca'; z.bocaAbierta = 1; z.fase += dt * 2; return; }
      z.bocaAbierta = 0;
      if (ahora >= (z.proximoGrito || 0) && ahora >= z.miraEn) {
        z.miraEn = ahora + 250;
        const vistos = K.humanos.filter(u => distPlano(z.x, z.y, u.x, u.y) < Z.vista * CELDA);
        if (vistos.length) { z.gritaHasta = ahora + G.quieto * 1000; z.proximoGrito = ahora + G.cada * 1000; this.gritoV2(z, vistos, G); return; }
      }
      this.avanzarV2(z, Z, dt, K, this.distBastion, false, null);
    },

    // Hinchado: hacia lo construido más cercano; estalla al tocarlo
    revienta(z, Z, dt, K) {
      const ahora = K.ahora;
      for (const u of K.construidos) if (!u.quitada && this.alAlcanceV2(z, u)) { this.reventarV2(z); return; }
      if (z.presa && z.presa.quitada) z.presa = null;
      if (ahora >= z.miraEn) {
        z.miraEn = ahora + 320; let mejor = null, dm = Z.vista * CELDA;
        for (const u of K.construidos) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; mejor = u; } }
        z.presa = mejor; z.hincha = mejor ? 1 - dm / (Z.vista * CELDA) : 0;
      }
      const u = z.presa;
      if (u) this.avanzarV2(z, Z, dt, K, this.campoCrudo(limitar(u.c, 0, this.cols - 1), limitar(u.f, 0, this.filas - 1)), true, u, { alTrabar: () => this.reventarV2(z) });
      else this.avanzarV2(z, Z, dt, K, this.distBastion, false, null);
    },

    // Dinamitero: corre derecho al campamento; la primera construcción que le corta el paso, la vuela
    demuele(z, Z, dt, K) {
      this.avanzarV2(z, Z, dt, K, this.campoCrudoBase(), true, null, { corre: true, alTrabar: traba => { z.detona = traba; this.reventarV2(z); } });
    },

    // Jauría: huelen a la gente a pie (también detrás de un muro), rodean y saltan lo bajo. A los protegidos, ni los miran
    jauria(z, Z, dt, K) {
      const B = BASTION, ahora = K.ahora;
      if (this.huirDelFuegoV2(z, Z, dt, K)) return;
      if (z.presa && (z.presa.quitada || z.presa.llevado || !esInf(z.presa))) z.presa = null;
      if (!z.presa && ahora >= z.miraEn) {
        z.miraEn = ahora + 200 + Math.random() * 150; let mejor = null, dm = Z.olfato * CELDA;
        for (const u of K.aPie) { if (z.inalcanzable && z.inalcanzable.get(u) > ahora) continue; const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; mejor = u; } }
        z.presa = mejor;
      }
      const { c, f } = this.celdaDe(z.x, z.y), cc = limitar(c, 0, this.cols - 1), ff = limitar(f, 0, this.filas - 1);
      let campo = this.distCuadV2, u = z.presa;
      if (u) {
        if (distPlano(z.x, z.y, u.x, u.y) < 18) { this.morderV2(z, u, dt, Z.cadaMordida); return; }
        const k = u.enCamino ? this.celdaDe(u.x, u.y) : u, libre = this.campoLibre(limitar(k.c, 0, this.cols - 1), limitar(k.f, 0, this.filas - 1), true);
        if (libre[ff][cc] < Infinity) campo = libre;
        else { (z.inalcanzable || (z.inalcanzable = new Map())).set(u, ahora + 4000); z.presa = u = null; }   // encerrado: no le interesa
      }
      let tx = B.baseX - 40, ty = z.y;
      if (c >= this.cols) tx = B.baseX + this.cols * B.celda[0] - 12;
      else {
        const sig = this.siguienteCeldaV2(cc, ff, campo, false);
        if (sig) { const p = this.centroCelda(sig[0], sig[1]); tx = p.x; ty = p.y + z.desvio * 0.5; }
        else if (u) { tx = u.x; ty = u.y; }
        else if (cc > 0) tx = z.x - 30; else ty = this.centroCelda(0, ff).y;
      }
      this.pasoV2(z, Z, dt, K, tx, ty, { salta: true, bloq: this.bloqCuadV2, corre: true, apretado: 0.1 });
      z.altura = this.bajasV2.has(c + ',' + f) ? 12 + Math.abs(Math.sin(z.fase * 0.5)) * 8 : 0;   // salta el fardo o el tractor
    },

    // Toro: si ve gente a pie, escarba y embiste en línea recta; después queda quieto. Si no ve a nadie, marcha
    embiste(z, Z, dt, K) {
      const B = BASTION, ahora = K.ahora, E = Z.embestida;
      if (z.modo === 'quieto') { z.estado = 'quieto'; if (ahora >= z.modoHasta) z.modo = null; return; }
      if (z.modo === 'aviso') {   // escarba el piso: es el aviso
        z.estado = 'carga';
        if (ahora >= z.modoHasta) { z.modo = 'carga'; z.cargaX0 = z.x; z.cargaY0 = z.y; z.golpeados = new Set(); Audio_.gruñido(150, 2.2, true); }
        return;
      }
      if (z.modo === 'carga') {
        if (this.huirDelFuegoV2(z, Z, dt, K)) return;   // el fuego le corta la embestida
        z.estado = 'embiste'; z.direccion = z.cargaDx < 0 ? -1 : 1; z.fase += dt * 18;
        const nx = z.x + z.cargaDx * E.vel * dt, ny = z.y + z.cargaDy * E.vel * dt, k = this.celdaDe(nx, ny);
        const choca = k.c >= this.cols || k.f < 0 || k.f >= this.filas || (k.c >= 0 && this.bloqV2.has(k.c + ',' + k.f));
        if (choca || Math.hypot(nx - z.cargaX0, ny - z.cargaY0) > E.largo * CELDA) {
          z.modo = 'quieto'; z.modoHasta = ahora + E.quieto * 1000;
          if (choca) { this.sacudida = Math.max(this.sacudida, 5); this.salpicar(z.x + z.cargaDx * 14, z.y - 12, '#a89a7c', 10, 3, z.y); Audio_.cuerpoAnimalCae(2, 1); }
          return;
        }
        z.x = nx; z.y = z.ySuelo = ny;
        for (const u of K.aPie) {   // atropella: derriba y aturde
          if (z.golpeados.has(u) || u.quitada || distPlano(z.x, z.y, u.x, u.y) > 20) continue;
          z.golpeados.add(u); u.aturdidoHasta = ahora + E.aturde * 1000; this.herirUnidadV2(u, E.dano, 'golpe');
          this.salpicar(u.x, u.y - 14, '#a89a7c', 8, 3, u.y); Audio_.golpeCuerpo('carne', true);
        }
        const al = K.alambres.get(k.c + ',' + k.f); if (al && !al.quitada) this.perderUnidadV2(al);
        for (const su of K.senuelos) if (!su.quitada && su.c === k.c && su.f === k.f) this.perderUnidadV2(su);
        if (Math.random() < dt * 20) this.salpicar(z.x - z.cargaDx * 16, z.y - 2, '#a89a7c', 1, 1.5, z.y);
        return;
      }
      if (this.huirDelFuegoV2(z, Z, dt, K)) return;
      if (ahora >= z.miraEn) {
        z.miraEn = ahora + 300; let mejor = null, dm = Z.vista * CELDA;
        for (const u of K.aPie) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; mejor = u; } }
        if (mejor && dm < 24) { this.morderV2(z, mejor, dt); return; }   // lo tiene encima: lo cornea
        if (mejor) {
          const dx = mejor.x - z.x, dy = mejor.y - z.y, l = Math.hypot(dx, dy) || 1;
          z.modo = 'aviso'; z.modoHasta = ahora + E.aviso * 1000; z.cargaDx = dx / l; z.cargaDy = dy / l; z.direccion = dx < 0 ? -1 : 1;
          return;
        }
      }
      this.avanzarV2(z, Z, dt, K, this.distBastion, false, null, { arranca: true, apretado: 0.15 });
    },

    // Bandada: cada cuervo va por la gente a pie más cercana y la picotea; si no hay nadie expuesto, al campamento
    bandada(z, Z, dt, K) {
      const B = BASTION, ahora = K.ahora;
      if (z.presa && (z.presa.quitada || z.presa.llevado)) z.presa = null;
      if (!z.presa && ahora >= z.miraEn) {
        z.miraEn = ahora + 400 + Math.random() * 200; let mejor = null, dm = Infinity;
        for (const u of K.aPie) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; mejor = u; } }
        z.presa = mejor;
      }
      const u = z.presa; let tx = B.baseX - 60, ty = z.y, baja = false;
      if (u) {
        tx = u.x + z.desvio; ty = u.y + z.desvio * 0.3;
        if (distPlano(z.x, z.y, tx, ty) < 16) { baja = true; if (ahora >= z.mordiscoEn) { z.mordiscoEn = ahora + Z.cadaPico; this.herirUnidadV2(u, Z.pico, 'pico'); this.salpicar(u.x, u.y - 22, '#8b0f0f', 2, 2, u.y); } }
      }
      this.volarV2(z, Z, dt, tx, ty, baja ? 16 : Z.altura, baja ? 0.4 : 1);
    },

    // Buitre: va por alguien a pie (primero los que más valen), lo levanta y lo suelta en medio de la horda
    rapta(z, Z, dt, K) {
      const B = BASTION, ahora = K.ahora;
      if (z.carga) {
        const u = z.carga;
        if (u.quitada) { z.carga = null; return; }
        // Lo lleva hasta el caminante más cercano y se lo suelta al lado; si no hay ninguno, seis celdas campo adentro
        let cerca = null, dm = Infinity;
        for (const o of K.suelo) { if (Zs[o.tipoBastion].clase !== 'cam') continue; const d = distPlano(o.x, o.y, z.x, z.y); if (d < dm) { dm = d; cerca = o; } }
        const sx = cerca ? cerca.x + 16 : z.sueltaX, sy = cerca ? cerca.y : z.sueltaY;
        this.volarV2(z, Z, dt, sx, sy, Z.altura, 0.8);
        u.x = z.x; u.y = z.y;
        if (Math.hypot(z.x - sx, z.y - sy) < 8 && z.x > B.baseX + 20) this.soltarV2(z);
        return;
      }
      if (ahora < (z.descansaHasta || 0)) { this.volarV2(z, Z, dt, z.x + 20, z.y, Z.altura, 0.3); return; }
      if (z.presa && (z.presa.quitada || z.presa.llevado)) z.presa = null;
      if (!z.presa && ahora >= z.miraEn) {
        z.miraEn = ahora + 500; let mejor = null, pm = -Infinity;
        const valor = { francotirador: 4, medico: 3, lanzallamas: 2, soldado: 1 };
        for (const u of K.aPie) { if ((u.enCamino && u.destinoBunker) || u.soltadoPor === z) continue; const p = (valor[u.tipo] || 1) * 400 - distPlano(z.x, z.y, u.x, u.y); if (p > pm) { pm = p; mejor = u; } }   // al que ya soltó no lo vuelve a levantar
        z.presa = mejor;
      }
      const u = z.presa;
      if (!u) { this.volarV2(z, Z, dt, B.baseX - 60, z.y, Z.altura, 1); return; }
      const cerca = Math.hypot(z.x - u.x, z.y - u.y) < 10;
      this.volarV2(z, Z, dt, u.x, u.y, cerca ? 22 : distPlano(z.x, z.y, u.x, u.y) < 70 ? 30 : Z.altura, 1);
      if (cerca && z.altura < 26) {   // lo agarra y se lo lleva adonde está la horda
        z.carga = u; z.presa = null; u.llevado = z; u.enCamino = false; u.caminando = false; u.destinoBunker = u.esperaBunker = null;
        z.sueltaX = Math.min(u.x + 6 * CELDA, B.baseX + (this.cols - 1.5) * B.celda[0]); z.sueltaY = u.y;
        this.aviso(t('b2.raptado'), 1500); Audio_.animalMuere(1.4);
      }
    },

    // Topo: camina un trecho, se entierra y va por debajo de todo hasta lo que hay más atrás; ahí sale y caza
    excava(z, Z, dt, K) {
      const B = BASTION, ahora = K.ahora, T = Z.topo;
      if (z.modoTopo === 'arriba') { CONDUCTAS.caza.call(this, z, Z, dt, K); return; }
      if (z.modoTopo === 'sale') { z.saliendo -= dt; z.estado = 'quieto'; if (z.saliendo <= 0) { z.saliendo = 0; z.modoTopo = 'arriba'; } return; }
      if (!z.modoTopo) {
        if (z.x > B.baseX + (this.cols - 1.3) * B.celda[0]) { this.avanzarV2(z, Z, dt, K, this.distBastion, false, null); return; }
        z.modoTopo = 'bajo'; z.enterrado = true; z.presa = null; this.salpicar(z.x, z.y - 4, '#6a5338', 12, 3, z.y);
      }
      // Lo descubren: la torre de vigía a su alcance o el tanque a dos celdas. Sale ahí mismo, encandilado
      if (K.vigias.some(u => distPlano(u.x, u.y, z.x, z.y) < U_('vigia').detecta * CELDA) || K.tanques.some(u => distPlano(u.x, u.y, z.x, z.y) < T.tanque * CELDA)) { this.salirV2(z, T.encandila, true); return; }
      // Adónde va: al señuelo que lo llama o, si no, a lo que más vale de lo que hay más atrás
      if (ahora >= z.miraEn || (z.presa && z.presa.quitada)) {
        z.miraEn = ahora + 500; let objetivo = null, dm = U_('senuelo').atrae * CELDA;
        for (const u of K.senuelos) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; objetivo = u; } }
        if (!objetivo) {
          const valor = { mortero: 5, francotirador: 4, medico: 4, antiaerea: 3, lanzallamas: 2 }; let pm = -Infinity;
          for (const u of K.humanos) { const p = (valor[u.tipo] || 1) * 300 - u.x; if (p > pm) { pm = p; objetivo = u; } }
        }
        z.presa = objetivo;
      }
      const u = z.presa, { c, f } = this.celdaDe(z.x, z.y), cc = limitar(c, 0, this.cols - 1), ff = limitar(f, 0, this.filas - 1);
      if (u && distPlano(z.x, z.y, u.x, u.y) < 32) { if (u.tipo === 'senuelo') { z.fueLlamado = true; z.entretenido = 0; } this.salirV2(z, T.sale); return; }
      // Bajo tierra: derecho, sólo lo desvían el agua y los obstáculos del mapa
      const campo = u ? this.campoCrudo(limitar(u.c, 0, this.cols - 1), limitar(u.f, 0, this.filas - 1)) : this.campoCrudoBase();
      const sig = c >= this.cols ? null : this.siguienteCeldaV2(cc, ff, campo, false);
      let tx = u ? u.x : B.baseX - 40, ty = u ? u.y : z.y;
      if (sig && !(u && sig[0] === limitar(u.c, 0, this.cols - 1) && sig[1] === limitar(u.f, 0, this.filas - 1))) { const p = this.centroCelda(sig[0], sig[1]); tx = p.x; ty = p.y; }
      const dx = tx - z.x, dy = ty - z.y, l = Math.hypot(dx, dy) || 1, v = Math.min(l, T.vel * dt);
      z.x += dx / l * v; z.y += dy / l * v; z.ySuelo = z.y; z.direccion = dx < 0 ? -1 : 1; z.fase += dt * 6;
      if (Math.random() < dt * 5) this.salpicar(z.x + (Math.random() - 0.5) * 10, z.y - 1, '#6a5338', 1, 1.2, z.y);   // la tierra que remueve
    },

    // Lanzador: marcha con la horda; cuando tiene a alguien a tiro, le arroja el zombie que tenga al lado (o un cascote)
    arroja(z, Z, dt, K) {
      if (this.arrojarDeLejosV2(z, Z, K)) return;
      const cerca = K.humanos.find(u => this.alAlcanceV2(z, u));
      if (cerca) { this.morderV2(z, cerca, dt); return; }
      this.avanzarV2(z, Z, dt, K, this.distBastion, false, null);
    },

    // Escupidor: en cuanto tiene gente a 5 celdas se planta y la baña en ácido; no se acerca más
    escupe(z, Z, dt, K) {
      const ahora = K.ahora, E = Z.escupe, alcance = E.alcance * CELDA;
      if (ahora < (z.escupeHasta || 0)) { z.estado = 'ataca'; z.bocaAbierta = 1; z.fase += dt * 2; return; }
      z.bocaAbierta = 0;
      if (z.presa && (z.presa.quitada || z.presa.llevado)) z.presa = null;
      if (ahora >= z.miraEn) {
        z.miraEn = ahora + 300; let b = null, dm = alcance;   // le escupe a la gente (y a lo que tiene gente adentro), no a un muro pelado
        for (const u of K.humanos) { const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm) { dm = d; b = u; } }
        z.presa = b;
      }
      const u = z.presa;
      if (u && distPlano(z.x, z.y, u.x, u.y) <= alcance * 1.05) {
        z.estado = 'quieto'; z.direccion = u.x < z.x ? -1 : 1;
        if (ahora >= (z.escupeEn || 0)) {
          z.escupeEn = ahora + E.cada * 1000 * (0.9 + Math.random() * 0.2); z.escupeHasta = ahora + 450;
          this.arrojadosV2.push({ tipo: 'escupitajo', x0: z.x, y0: z.y, alto0: 44 * z.escala, x: u.x, y: u.y, t: 0, dur: E.vuelo, alto: 46, golpe: E.golpe, ...E.charco });
          Audio_.escupir(200);
        }
        return;
      }
      this.avanzarV2(z, Z, dt, K, this.distBastion, false, null);
    },

    // Rabioso: derecho al campamento por el camino abierto, en zigzag, sin detenerse por nadie
    corre(z, Z, dt, K) {
      const B = BASTION, { c, f } = this.celdaDe(z.x, z.y), cc = limitar(c, 0, this.cols - 1), ff = limitar(f, 0, this.filas - 1);
      let tx = B.baseX - 40, ty = z.y;
      if (c >= this.cols) tx = B.baseX + this.cols * B.celda[0] - 12;
      else {
        const sig = this.siguienteCeldaV2(cc, ff, this.distBastion, false);
        if (sig) { const p = this.centroCelda(sig[0], sig[1]); tx = p.x; ty = p.y + Math.sin(K.ahora / 95 + z.desvio * 3) * 10; }
        else if (cc === 0) ty = this.centroCelda(0, ff).y; else tx = z.x - 30;
      }
      this.pasoV2(z, Z, dt, K, tx, ty, { corre: true, apretado: 0.06 });
    },
  };

  // El que arroja (lanzador, Coloso): si tiene a alguien a tiro y ya puede, le tira algo. Devuelve si está en eso
  P.arrojarDeLejosV2 = function (z, Z, K) {
    const ahora = K.ahora, A = Z.arroja;
    if (ahora < (z.lanzaHasta || 0)) { z.estado = 'ataca'; return true; }   // el gesto de lanzar
    if (ahora < (z.lanzaEn || 0) || ahora < (z.buscaEn || 0)) return false;
    z.buscaEn = ahora + 300;   // (aparte de miraEn: el Coloso además mira para cazar)
    let blanco = null, dm = A.alcance * CELDA, fondo = null;
    for (const u of K.humanos) { const d = distPlano(z.x, z.y, u.x, u.y); if (d >= A.alcance * CELDA || d <= 1.3 * CELDA) continue; if (d < dm) { dm = d; blanco = u; } if (!fondo || u.x < fondo.x) fondo = u; }
    const gente = !!blanco;
    if (!blanco) for (const u of K.construidos) { if (!u.bloquea) continue; const d = distPlano(z.x, z.y, u.x, u.y); if (d < dm && d > 1.3 * CELDA) { dm = d; blanco = u; } }
    if (!blanco) return false;
    z.lanzaEn = ahora + A.cada * 1000; z.lanzaHasta = ahora + 550; z.estado = 'ataca'; z.direccion = blanco.x < z.x ? -1 : 1;
    // El lanzador prefiere arrojar al zombie que tenga al lado: cae junto a su presa, del otro lado de lo que la tape
    if (A.tira && gente) {
      let municion = null, dz = A.cerca * CELDA;
      for (const o of K.suelo) { if (o === z || o.enVuelo || !A.tira.includes(o.tipoBastion) || o.aturdidoHasta > ahora) continue; const d = distPlano(o.x, o.y, z.x, z.y); if (d < dz) { dz = d; municion = o; } }
      if (municion && A.alFondo) blanco = fondo;   // por encima de todo: junto al que está más atrás
      const k = blanco.enCamino ? this.celdaDe(blanco.x, blanco.y) : blanco;
      const lugar = municion && (blanco.bloquea ? [] : [[k.c, k.f]]).concat([[k.c - 1, k.f], [k.c, k.f + 1], [k.c, k.f - 1], [k.c + 1, k.f]]).find(([c, f]) => this.dentro(c, f) && !this.bloqV2.has(c + ',' + f));
      if (lugar) {
        const p = this.centroCelda(lugar[0], lugar[1]);
        municion.enVuelo = { x0: municion.x, y0: municion.y, x1: p.x + (Math.random() - 0.5) * 12, y1: p.y + (Math.random() - 0.5) * 8, t: 0, dur: A.vuelo, alto: 72, presa: blanco };
        municion.vuela = true; municion.presa = null; municion.estado = 'camina';
        Audio_.gruñido(150, 1.8, true);
        return true;
      }
    }
    this.arrojadosV2.push({ tipo: A.cosa, x0: z.x, y0: z.y, alto0: 60 * z.escala, x: blanco.x, y: blanco.y, t: 0, dur: A.vuelo, alto: 66, ...A.golpe });
    Audio_.gruñido(150, 2.2, true);
    return true;
  };
  // El zombie arrojado: va por el aire dando vueltas (le pueden tirar la antiaérea y los fusiles) y cae lastimado y aturdido
  P.volandoV2 = function (z, dt) {
    const V = z.enVuelo; V.t += dt;
    const f = Math.min(1, V.t / V.dur), lado = V.x1 < V.x0 ? -1 : 1;
    z.x = V.x0 + (V.x1 - V.x0) * f; z.y = z.ySuelo = V.y0 + (V.y1 - V.y0) * f; z.altura = Math.sin(f * Math.PI) * V.alto; z.giro = f * Math.PI * 2 * lado; z.direccion = lado;
    if (f < 1) return;
    z.enVuelo = null; z.vuela = false; z.altura = 0; z.giro = 0; z.aturdidoHasta = this.ahora + 700;
    z.presa = V.presa && !V.presa.quitada ? V.presa : null; z.miraEn = 0;
    this.salpicar(z.x, z.y - 3, '#a89a7c', 8, 3, z.y); Audio_.cuerpoAnimalCae(1, 0.8);
    z.recibirDano(z.vidaMax * 0.2, 0, ARMA_ALAMBRE, this);
  };
  // El topo sale a la superficie: tarda `seg` en terminar de salir (a tiro de todos); encandilado, además avisa
  P.salirV2 = function (z, seg, encandilado) {
    z.enterrado = false; z.modoTopo = 'sale'; z.saliendo = z.saleEn = seg;
    this.salpicar(z.x, z.y - 4, '#6a5338', 14, 4, z.y); Audio_.aterrizar('tierra');
    if (encandilado) { z.alerta = 0; z.descubierto = this.ahora + seg * 1000; }
  };

  // Volar: derecho hacia (tx, ty), con la altura que toque
  P.volarV2 = function (z, Z, dt, tx, ty, altura, ritmo) {
    const dx = tx - z.x, dy = ty - z.y, l = Math.hypot(dx, dy) || 1, v = Math.min(l, z.vel * ritmo * dt);
    z.x += dx / l * v; z.y += dy / l * v; z.ySuelo = z.y;
    z.direccion = dx < -2 ? -1 : dx > 2 ? 1 : z.direccion;
    z.altura += (altura - z.altura) * Math.min(1, dt * 3);
    z.estado = 'camina'; z.fase += dt * 15;
  };
  // El buitre suelta al que llevaba (o se le cae, si lo mataron): queda aturdido en el piso, en una celda donde quepa
  P.soltarV2 = function (z, caida) {
    const u = z.carga; z.carga = null; z.descansaHasta = this.ahora + 2500;
    if (!u || u.quitada) return;
    u.llevado = null; u.soltadoPor = z;
    let { c, f } = this.celdaDe(z.x, z.y); c = limitar(c, 0, this.cols - 1); f = limitar(f, 0, this.filas - 1);
    if (this.motivoNoColocar(u.tipo, c, f, true, u) || this.ocupadaPor(c, f)) {   // no cabe ahí: a la celda libre más cercana
      let mejor = null, dm = Infinity;
      for (let ff = 0; ff < this.filas; ff++) for (let cc = 0; cc < this.cols; cc++) {
        const d = Math.hypot(cc - c, ff - f); if (d < dm && !this.motivoNoColocar(u.tipo, cc, ff, true, u) && !this.ocupadaPor(cc, ff)) { dm = d; mejor = [cc, ff]; }
      }
      if (mejor) [c, f] = mejor;
    }
    const p = this.centroCelda(c, f);
    u.c = c; u.f = f; u.x = p.x; u.y = p.y; u.aturdidoHasta = this.ahora + (caida ? 1000 : 1800);
    this.salpicar(u.x, u.y - 4, '#a89a7c', 8, 3, u.y); Audio_.aterrizar('tierra');
    if (caida) this.herirUnidadV2(u, 8, 'golpe');
  };
  // El grito: una onda que se ve; los zombies de alrededor se apuran, y los que cazan van por los humanos delatados
  P.gritoV2 = function (z, vistos, G) {
    const ahora = this.ahora, r = G.radio * CELDA;
    this.ondasV2.push({ x: z.x, y: z.y, alto: 46 * z.escala, t: 0, dura: 0.9, radio: r });
    Audio_.toxicoChillido(120);
    for (const u of vistos) u.delatadoHasta = ahora + 3000;
    for (const o of this.zombies) {
      if (o === z || o.estado === 'muerto' || distPlano(o.x, o.y, z.x, z.y) > r) continue;
      const ZO = Zs[o.tipoBastion];
      o.apuroHasta = ahora + G.dura * 1000; o.apuro = G.apuro;
      if (o.presa || (ZO.conducta !== 'caza' && ZO.conducta !== 'jauria')) continue;
      let mejor = null, dm = Infinity;
      for (const u of vistos) { if (ZO.conducta === 'jauria' && !esInf(u)) continue; const d = distPlano(o.x, o.y, u.x, u.y); if (d < dm) { dm = d; mejor = u; } }
      if (mejor) { o.presa = mejor; o.alerta = ahora + 900; }
    }
  };
  // Perros y toro no cruzan el fuego: si entran al alcance de un lanzallamas que está tirando, dan media vuelta
  P.huirDelFuegoV2 = function (z, Z, dt, K) {
    if (K.ahora >= (z.huyeHasta || 0)) {
      const fu = K.fuegos.find(u => distPlano(z.x, z.y, u.x, u.y) < (u.alcanceFuego || 88));
      if (!fu) return false;
      const dx = z.x - fu.x, dy = z.y - fu.y, l = Math.hypot(dx, dy) || 1;
      z.huyeHasta = K.ahora + 1300; z.huyeDx = dx / l; z.huyeDy = dy / l; z.presa = null; z.modo = null;
    }
    this.pasoV2(z, Z, dt, K, z.x + z.huyeDx * 40, z.y + z.huyeDy * 40, { salta: true, bloq: Z.manada ? this.bloqCuadV2 : this.bloqV2, corre: true, apretado: 0.1, vel: z.vel * 1.15 });
    return true;
  };
  // Estalla (el hinchado al tocar algo construido, el dinamitero contra lo que le corta el paso): no paga
  P.reventarV2 = function (z) { z.sinPaga = true; z.recibirDano(z.vida + 999, 0, ARMA_EXPLOSION, this); };
  // Lo que deja un zombie al morir. Las explosiones quedan en cola: se resuelven al final del cuadro (efectosV2)
  P.alCaerZombieV2 = function (z, arma) {
    const Z = Zs[z.tipoBastion]; if (!Z) return;
    if (Z.estalla) this.pendientesV2.push({ x: z.x, y: z.y, ...Z.estalla, de: z });
    if (Z.carga && (z.detona || (arma && (arma.fuego || arma.explosivo) && !arma.alambre))) {   // la dinamita estalla contra el muro, o si lo mató el fuego o una explosión
      this.pendientesV2.push({ x: z.x, y: z.y, radio: Z.carga.radio, unidades: Z.carga.unidades, gente: Z.carga.gente, zombies: Z.carga.zombies, directo: z.detona, danoDirecto: Z.carga.dano, de: z });
    }
    if (Z.gas) { this.nubesV2.push({ x: z.x, y: z.y, t: 0, ...Z.gas }); Audio_.salpicaduraToxica(1); }
    if (z.carga) this.soltarV2(z, true);
  };
  // Llegó al campamento: le saca vida según el tipo
  P.entrarAlCampamentoV2 = function (z, Z) {
    const B = BASTION;
    if (z.carga) this.soltarV2(z, true);
    this.vidaBase = Math.max(0, this.vidaBase - Z.dano); z.estado = 'muerto'; z.tiempoMuerto = 99; z.muerte = null;
    this.entraron[z.tipoBastion] = (this.entraron[z.tipoBastion] || 0) + 1;
    this.aviso(t('bastion.baseGolpeada'), 1200); this.sacudida = 6; Audio_.jugadorHerido();
    this.salpicar(B.baseX - 20, z.y - 10, '#8b0f0f', 8, 3, z.y);
    if (Z.estalla || Z.carga) { this.explosiones.push(new Explosion(B.baseX - 16, z.y - 12, 30)); Audio_.explosion(); }
    if (this.vidaBase <= 0 && !this.terminado) { this.terminado = true; this.resultado = 'invadido'; Audio_.jugadorMuere(); }   // la partida guardada queda: se puede repetir la oleada
  };

  /* ---------- El paso de la horda ---------- */
  P.hordaV2 = function (dt) {
    const B = BASTION, ahora = this.ahora, K = this.K2 = this.contextoV2();
    for (const z of this.zombies) {
      z.ahora = ahora;
      if (z.estado === 'muerto') { if (z.muerte) z.moverCadaver(dt, this); else z.tiempoMuerto += dt; continue; }
      if (z.cabezaAtras < 0) z.cabezaAtras = Math.min(0, z.cabezaAtras + dt * 1.4);
      if (z.levanta > 0) { z.levanta -= dt; z.estado = 'camina'; z.fase += dt * 2; continue; }   // recién contagiado: se incorpora
      if (z.enVuelo) { this.volandoV2(z, dt); continue; }                                        // arrojado por un lanzador
      if (ahora < (z.aturdidoHasta || 0)) { z.estado = 'quieto'; continue; }                     // recién cayó: se levanta
      const Z = Zs[z.tipoBastion] || Zs.caminante;
      CONDUCTAS[Z.conducta].call(this, z, Z, dt, K);
      if (z.estado === 'muerto') continue;
      if (z.x < B.baseX - 30) { this.entrarAlCampamentoV2(z, Z); continue; }
      if (ahora >= (z.gemidoEn || 0)) { z.gemidoEn = ahora + 4000 + Math.random() * 9000; if (Math.random() < 0.3) Audio_.gemido(false, 300); }
    }
    this.zombies = this.zombies.filter(z => !z.terminado());
  };
})();
