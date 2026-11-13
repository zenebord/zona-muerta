/* ===== Último bastión v2: dibujo de lo nuevo, pantalla previa, parte de la oleada y textos =====
 * Alambrado, señuelo y soldado caído se dibujan como las demás unidades (js/bastion-dibujo.js): pies en (0, 0), el
 * centro de la celda, y la pose quieta guardada como imagen. La pantalla previa muestra la horda y el ejército del
 * nivel con sus fichas (lo que hace cada uno, dónde es fuerte, dónde es débil y cómo se usa o se frena).
 */
Object.assign(DibujoBastion, {
  /* Alambrado: tres caballetes de madera en X unidos por un travesaño, hilos de púas tensados y dos rollos de
   * concertina. No bloquea: los zombies lo cruzan despacio y lo van rompiendo (se cae un caballete, se cortan hilos) */
  alambrado(ctx, u) {
    const d = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1), nivel = d > 0.65 ? 2 : d > 0.35 ? 1 : 0;
    conSprite(ctx, 'al' + nivel, [-25, -19, 26, 8], g => DibujoBastion.alambradoCuerpo(g, nivel));
  },
  alambradoCuerpo(ctx, nivel = 0) {
    const madera = '#5f4226';
    sombraPiso(ctx, 23, 4.6, 0.26, 0, 2);
    // Rollo de concertina: vueltas de alambre con sus púas; salta: las vueltas que ya arrancaron
    const rollo = (y, alto, x0, x1, alfa, salta) => {
      if (Pincel.silueta) return;
      ctx.lineWidth = 0.55;
      for (let k = 0, n = 11; k < n; k++) {
        if (salta && salta(k)) continue;
        const x = x0 + (x1 - x0) * k / (n - 1);
        ctx.strokeStyle = `rgba(150,157,164,${alfa})`; ctx.beginPath(); ctx.ellipse(x, y, 3.4, alto, 0.22, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(222,227,232,${alfa})`; ctx.fillRect(x - 0.5, y - alto - 0.6, 1, 1.2); ctx.fillRect(x + 2.7, y - 0.5, 1.2, 1);
      }
    };
    rollo(-9, 6.2, -20, 20, 0.5, nivel === 2 ? k => k > 2 && k < 6 : null);                               // el de atrás
    pb(ctx, tramo(-17, -7.5, 17, -7.5, 1.7, 1.7), ajustarColor(madera, -0.14), { sombra: 0.3, linea: 0.35, brillo: 0.15 });   // travesaño
    [-17, 0, 17].forEach((x, i) => {
      if ((nivel >= 1 && i === 2) || (nivel === 2 && i === 0)) {   // caballete partido: queda en el piso
        pb(ctx, tramo(x - 6, 2.2, x + 6, 0.8, 2.1, 1.9), madera, { sombra: 0.3, linea: 0.4 }); return;
      }
      pb(ctx, tramo(x - 5.5, 3, x + 4.5, -16.5, 2.9, 2.3), madera, { sombra: 0.4, linea: 0.45, brillo: 0.2 });
      pb(ctx, tramo(x + 5.5, 3, x - 4.5, -16.5, 2.9, 2.3), ajustarColor(madera, 0.12), { sombra: 0.4, linea: 0.45, brillo: 0.25 });
    });
    if (!Pincel.silueta) for (const y of nivel === 0 ? [-14, -10, -5] : nivel === 1 ? [-14, -5] : [-5]) {   // hilos tensados, con púas
      ctx.strokeStyle = '#8e959c'; ctx.lineWidth = 0.55; ctx.beginPath();
      ctx.moveTo(-20, y + 0.6); ctx.quadraticCurveTo(-8.5, y + 2.2, 0, y + 0.4); ctx.quadraticCurveTo(8.5, y + 2.2, 20, y + 0.6); ctx.stroke();
      for (let x = -17; x <= 17; x += 4.25) {
        const yy = y + 0.5 + 1.3 * Math.sin((x + 20) / 20 * Math.PI) ** 2;
        linea(ctx, '#dde2e7', 0.45, [[x - 0.8, yy - 0.9], [x + 0.8, yy + 0.9]]); linea(ctx, '#dde2e7', 0.45, [[x - 0.8, yy + 0.9], [x + 0.8, yy - 0.9]]);
      }
    }
    rollo(-3.4, 5.2, -21, 21, 0.7, nivel >= 1 ? k => k === 7 || k === 8 : null);                          // el de adelante
  },

  /* Señuelo: trípode con dos bocinas, el amplificador, la luz de sirena y la batería al pie. La luz y las ondas de
   * sonido se pintan por cuadro; el resto, de la caché. Roto (a media vida) queda con la cabeza torcida */
  senuelo(ctx, u, t) {
    const roto = 1 - (u.vida ?? 1) / (u.vidaMax ?? 1) > 0.5, ms = t || 0;
    conSprite(ctx, 'se' + (roto ? 'r' : ''), [-18, -45, 20, 8], g => DibujoBastion.senueloCuerpo(g, roto));
    if (Pincel.silueta) return;
    if (Math.sin(ms / 160) > 0) {   // luz de la sirena
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -38, 0, 0, -38, 7); g.addColorStop(0, 'rgba(255,90,70,0.85)'); g.addColorStop(1, 'rgba(255,60,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -38, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    for (let k = 0; k < 3; k++) {   // ondas de sonido que salen de las dos bocinas
      const f = (ms / 900 + k / 3) % 1, r = 5 + f * 15;
      ctx.strokeStyle = `rgba(255,236,170,${0.55 * (1 - f)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(15, -34, r, -0.7, 0.7); ctx.stroke();
      ctx.beginPath(); ctx.arc(-11, -34, r * 0.7, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
    }
  },
  senueloCuerpo(ctx, roto) {
    const P = PAL_BASTION;
    sombraPiso(ctx, 13, 3.4, 0.3, 1, 2);
    caja34(ctx, -10, -2, 4, 4.5, 5.5, '#2b2e32', '#3e4247');   // batería
    if (!Pincel.silueta) { detalle(ctx, '#c0392b', circulo(-8, -6.6, 0.8)); detalle(ctx, '#17181a', circulo(-4.2, -6.6, 0.8)); linea(ctx, '#17181a', 0.6, [[-8, -6.6], [-5.4, -13], [-0.6, -19]]); }
    for (const [px, py, col] of [[-8.5, 1, P.aceroOsc], [8.5, 1, P.aceroOsc], [1, 4.4, P.acero]]) pb(ctx, tramo(0, -27, px, py, 1.3, 1.5), col, { sombra: 0.3, linea: 0.35, brillo: 0.3 });   // trípode
    pb(ctx, tramo(0, -26, 0, -33, 1.6, 1.6), P.acero, { sombra: 0.3, linea: 0.35 });   // mástil
    ctx.save(); ctx.translate(0, -34); if (roto) ctx.rotate(-0.3);
    // Bocinas: la grande mira al campo y la chica, hacia el campamento
    const bocina = (s, largo, boca) => {
      pb(ctx, c => { c.moveTo(s * 3, -1.8); c.lineTo(s * (3 + largo), -boca); c.quadraticCurveTo(s * (4.8 + largo), 0, s * (3 + largo), boca); c.lineTo(s * 3, 1.6); c.closePath(); }, '#8d939a', { sombra: 0.5, brillo: 0.45, linea: 0.4 });
      if (!Pincel.silueta) { ctx.fillStyle = '#26282c'; ctx.beginPath(); ctx.ellipse(s * (3.4 + largo), 0, 1.3, boca * 0.82, 0, 0, Math.PI * 2); ctx.fill(); }
    };
    bocina(-1, 6.5, 3.8); bocina(1, 10, 5.6);
    pb(ctx, rr(-3.4, -3, 6.8, 5.4, 1), P.od, { sombra: 0.4, linea: 0.4, brillo: 0.25 });                       // amplificador
    pb(ctx, c => { c.arc(0, -3, 1.8, Math.PI, 0); c.closePath(); }, '#8a211b', { sombra: 0.2, linea: 0.35, brillo: 0.45 });   // luz de sirena, apagada
    if (roto && !Pincel.silueta) linea(ctx, 'rgba(20,20,22,0.7)', 0.5, [[5, -3], [8, 0.4], [7, 3.4]]);            // abolladura
    ctx.restore();
  },

  /* Soldado caído: tendido boca arriba en su charco, con el resplandor del contagio que late cada vez más fuerte y
   * el reloj que se va llenando; cuando se completa, se levanta en contra (lo saca y lo cambia js/bastion-v2.js) */
  caido(ctx, u, t) {
    const f = Math.min(1, (u.t || 0) / BASTION2.contagio), pulso = 0.5 + 0.5 * Math.sin((t || 0) / 110);
    if (!Pincel.silueta) { ctx.fillStyle = 'rgba(90,8,8,0.55)'; ctx.beginPath(); ctx.ellipse(-13, 1.5, 16, 3.8, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(3, -2.6); ctx.rotate(-Math.PI / 2 + 0.07);
    conSprite(ctx, '34' + 'sa0.00', [-11, -42, 26, 3], g => DibujoBastion.soldadoCuerpo(g, { apunta: 0 }, 0));
    ctx.restore();
    if (Pincel.silueta) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(-14, -4, 0, -14, -4, 24); g.addColorStop(0, `rgba(150,255,90,${0.14 + 0.3 * f * pulso})`); g.addColorStop(1, 'rgba(150,255,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-14, -4, 26, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(10,8,6,0.65)'; ctx.beginPath(); ctx.arc(-14, -18, 4.6, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#b6ff5c'; ctx.beginPath(); ctx.arc(-14, -18, 4.6, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
  },
});

const BastionV2UI = {
  retratos: {}, parteDe: '', infoDe: '',
  // Un zombie de cada tipo para retratarlo (quieto, mirando hacia el campamento)
  zombieDeMuestra(id) {
    const dif = DIFICULTADES.medio, variante = v => VARIANTES_CAMINANTE.find(x => x.id === v);
    let z;
    if (id === 'jefe') { z = zombieConEstilo(0, ESTILO_COLOSO, dif); z.piel = '#4fae2e'; z.grosorBrazos = 2; z.grosorPiernas = 1.6; z.jefe = true; }
    else if (id === 'soldadoZombie') { z = zombieConEstilo(0, ESTILO_SOLDADO_ZOMBIE, dif); z.piel = '#8fa672'; }
    else if (id === 'gordo') z = zombieConEstilo(0, variante('gordo'), dif);
    else if (id === 'corredor') z = new Zombie(0, true, dif);
    else z = zombieConEstilo(0, variante('camisa-roja'), dif);
    z.escala = BASTION.zombies[id].escala; z.direccion = -1; z.x = 0; z.y = z.ySuelo = 0; z.fase = 1.2; z.variante.brazoColgando = false;
    return z;
  },
  // Retrato de una unidad ('u:muro') o de un zombie ('z:gordo') como imagen, del tamaño pedido en px de pantalla
  retrato(clave, lado = 64) {
    const k = clave + '@' + lado; if (this.retratos[k]) return this.retratos[k];
    const e = Math.min(3, window.devicePixelRatio || 1), c = document.createElement('canvas'); c.width = c.height = Math.round(lado * e);
    const g = c.getContext('2d'), [clase, id] = clave.split(':'), liviano = Lienzo.liviano;
    Lienzo.liviano = false;
    try {
      if (clase === 'u') {
        const [x0, y0, x1, y1] = { soldado: [-13, -43, 27, 4], torreta: [-27, -39, 37, 8], bunker: [-29, -57, 35, 8], muro: [-26, -35, 31, 8], alambrado: [-25, -21, 26, 8], senuelo: [-22, -46, 26, 8] }[id];
        const s = c.width / Math.max(x1 - x0, y1 - y0) * 0.94;
        g.translate(c.width / 2, c.height / 2); g.scale(s, s); g.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
        if (id === 'soldado') DibujoBastion.soldadoCuerpo(g, { apunta: 0 }, 0);
        else if (id === 'alambrado') DibujoBastion.alambradoCuerpo(g, 0);
        else if (id === 'senuelo') DibujoBastion.senueloCuerpo(g, false);
        else DibujoBastion[id + 'Cuerpo'](g, { adentro: 2, vida: 1, vidaMax: 1, apunta: 0 }, 0);
      } else {
        const z = this.zombieDeMuestra(id), s = c.height / (96 * z.escala);
        g.translate(c.width * 0.56, c.height * 0.95); g.scale(s, s);
        z.dibujar(g, 0, 0);
      }
    } catch { /* sin lienzo: queda vacío */ } finally { Lienzo.liviano = liviano; }
    return (this.retratos[k] = c.toDataURL());
  },

  /* ---------- Pantalla previa: la horda y el ejército del nivel, con sus fichas ---------- */
  abrir(mostrar) {
    BastionV2.ajustarUnidades(true);   // los precios de la v2, también antes de empezar
    this.pintar('z:caminante');
    mostrar('panel-bastion2');
  },
  // Las fichas de los dos bandos y el detalle de la elegida (se arma de nuevo si cambia el idioma con la pantalla abierta)
  pintar(elegida) {
    const ficha = (clave, nombre, precio) => `<button type="button" class="b2-ficha" data-ficha="${clave}"><img src="${this.retrato(clave, 72)}" alt=""><b>${nombre}</b>${precio ? `<small>${precio}</small>` : ''}</button>`;
    document.getElementById('b2-zombies').innerHTML = ['caminante', 'corredor', 'gordo', 'jefe', 'soldadoZombie'].map(k => ficha('z:' + k, t('b2.z.' + k))).join('');
    document.getElementById('b2-unidades').innerHTML = BASTION2.orden.map(k => ficha('u:' + k, t('b2.u.' + k), '$' + BASTION.unidades[k].costo)).join('');
    const guardada = BastionV2.partida(), seguir = document.getElementById('b2-continuar');
    seguir.classList.toggle('oculta', !guardada);
    if (guardada) seguir.textContent = t('b2.continuar', { ola: guardada.ronda + 1, total: BASTION2.niveles.granja.oleadas.length });
    this.mostrarFicha(elegida);
  },
  mostrarFicha(clave) {
    const [clase, id] = clave.split(':'), k = 'b2.' + clase + '.' + id;
    document.querySelectorAll('.b2-ficha').forEach(b => b.classList.toggle('elegida', b.dataset.ficha === clave));
    document.getElementById('b2-detalle').innerHTML =
      `<img src="${this.retrato(clave, 112)}" alt=""><div><h3>${t(k)}</h3><p>${t(k + '.hace')}</p>` +
      `<p><b class="mas">${t('b2.fuerte')}</b> ${t(k + '.fuerte')}</p><p><b class="menos">${t('b2.debil')}</b> ${t(k + '.debil')}</p>` +
      `<p><b>${t(clase === 'z' ? 'b2.frenar' : 'b2.usar')}</b> ${t(k + '.uso')}</p></div>`;
  },

  /* ---------- En la partida: parte de la próxima oleada y qué hace lo que se está por poner ---------- */
  parte(j) {
    const el = document.getElementById('bastion-parte'), info = document.getElementById('bastion-info');
    if (!el || !info) return;
    const total = j.nivelV2.oleadas.length, ver = j.enDescanso && j.ronda < total && !j.terminado;
    el.classList.toggle('oculta', !ver);
    const clave = ver ? j.ronda + ':' + Idioma.actual() : '';
    if (clave !== this.parteDe) {
      this.parteDe = clave;
      const def = ver ? j.nivelV2.oleadas[j.ronda] : {};
      el.innerHTML = ver ? `<b>${t('b2.parte', { n: j.ronda + 1 })}</b>` + ['caminante', 'corredor', 'gordo', 'jefe'].filter(k => def[k]).map(k => `<span class="chip" title="${t('b2.z.' + k)}"><img src="${this.retrato('z:' + k, 44)}" alt="${t('b2.z.' + k)}"><i>×${def[k]}</i></span>`).join('') : '';
    }
    const tipo = BASTION2.orden.includes(j.colocando) ? j.colocando : '', claveInfo = tipo + ':' + Idioma.actual();
    info.classList.toggle('oculta', !tipo);
    if (claveInfo !== this.infoDe) { this.infoDe = claveInfo; info.textContent = tipo ? t('b2.u.' + tipo) + ': ' + t('b2.u.' + tipo + '.hace') + ' ' + t('b2.u.' + tipo + '.uso') : ''; }
  },

  /* ---------- Sobre la escena: el «te vi», desde dónde ven a lo que se va a poner y las celdas de barro ---------- */
  encima(j) {
    const ctx = j.ctx, cam = j.camaraBastion(), ahora = j.ahora, B = BASTION, [W, H] = B.celda;
    ctx.save(); ctx.setTransform(Lienzo.escala, 0, 0, Lienzo.escala, 0, 0);
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    // El zombie que acaba de ver a alguien
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    for (const z of j.zombies) {
      if (z.estado === 'muerto' || !(z.alerta > ahora) || !z.presa) continue;
      const P = cam.proyectar(z.x, z.y), y = P.y - (70 * z.escala + 12) * P.s;
      ctx.globalAlpha = Math.min(1, (z.alerta - ahora) / 300);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,8,6,0.85)'; ctx.strokeText('!', P.x, y); ctx.fillStyle = '#ffd23a'; ctx.fillText('!', P.x, y);
    }
    ctx.globalAlpha = 1;
    const U = j.colocando && B.unidades[j.colocando];
    if (U && j.puntero && !j.terminado) {
      const celda = (c, f) => [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, k]) => cam.proyectar(B.baseX + (c + i) * W, B.arriba + (f + k) * H));
      // Lo pesado no va en el barro: esas celdas, tachadas
      if (j.colocando !== 'soldado' && !U.liviano) {
        ctx.fillStyle = 'rgba(240,80,70,0.2)'; ctx.strokeStyle = 'rgba(240,80,70,0.5)'; ctx.lineWidth = 1;
        for (let f = 0; f < j.filas; f++) for (let c = 0; c < j.cols; c++) {
          if (j.terrenoEn(c, f) !== 'barro') continue;
          const q = celda(c, f);
          ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); ctx.lineTo(q[2].x, q[2].y); ctx.moveTo(q[1].x, q[1].y); ctx.lineTo(q[3].x, q[3].y); ctx.stroke();
        }
      }
      const { c, f } = j.celdaDe(j.puntero.x, j.puntero.y);
      if (j.dentro(c, f)) {
        const p = j.centroCelda(c, f);
        const anillo = (radio, color, guion) => {
          ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.setLineDash(guion); ctx.beginPath();
          for (let i = 0; i <= 56; i++) { const a = i / 56 * Math.PI * 2, q = cam.proyectar(p.x + Math.cos(a) * radio, p.y + Math.sin(a) * radio / 1.3); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
          ctx.stroke(); ctx.setLineDash([]);
        };
        if (j.colocando === 'soldado' || j.colocando === 'torreta' || j.colocando === 'bunker') {   // desde dónde lo ve un zombie común
          const radio = BASTION2.zombies.caminante.vista * BASTION2.celda;
          anillo(radio, 'rgba(255,120,95,0.8)', [2, 4]);
          const arriba = cam.proyectar(p.x, p.y - radio / 1.3), abajo = cam.proyectar(p.x, p.y + radio / 1.3), yT = arriba.y > 46 ? arriba.y - 5 : abajo.y + 11;   // arriba del anillo; si no entra, abajo
          ctx.font = 'bold 9px "Trebuchet MS", sans-serif'; ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(20,8,6,0.8)'; ctx.strokeText(t('b2.teVen'), arriba.x, yT); ctx.fillStyle = '#ff9c88'; ctx.fillText(t('b2.teVen'), arriba.x, yT);
        }
        if (U.atrae) anillo(U.atrae * BASTION2.celda, 'rgba(255,230,170,0.6)', [5, 5]);   // hasta dónde llama el señuelo
      }
    }
    ctx.restore();
  },
};
document.addEventListener('click', e => { const b = e.target.closest('[data-ficha]'); if (b) BastionV2UI.mostrarFicha(b.dataset.ficha); });
Idioma.alCambiar(() => {   // con la pantalla previa abierta, las fichas pasan al idioma nuevo
  const panel = document.getElementById('panel-bastion2'), elegida = document.querySelector('.b2-ficha.elegida');
  if (panel && panel.classList.contains('visible')) BastionV2UI.pintar(elegida ? elegida.dataset.ficha : 'z:caminante');
});

/* ---------- Textos (español de México, portugués de Brasil e inglés) ---------- */
Object.assign(TEXTOS.es, {
  'menu.bastion2': 'ÚLTIMO BASTIÓN V2', 'bastion.alambrado': 'ALAMBRADO', 'bastion.senuelo': 'SEÑUELO',
  'b2.titulo': 'ÚLTIMO BASTIÓN V2 · LA GRANJA', 'b2.ayuda': 'Versión de prueba del diseño nuevo. Aguanta 10 oleadas con el campamento en pie.',
  'b2.regla1': 'Los zombies ven. Si alguien de tu gente entra en su vista, dejan el camino y van por él.',
  'b2.regla2': 'Si está detrás de un muro o dentro de un búnker o una torreta, primero rompen eso.',
  'b2.regla3': 'Soldado que cae, se contagia: a los 3 segundos se levanta en tu contra.',
  'b2.horda': 'LA HORDA', 'b2.ejercito': 'TU EJÉRCITO', 'b2.empezar': 'EMPEZAR', 'b2.continuar': v => `CONTINUAR · OLEADA ${v.ola}/${v.total}`,
  'b2.fuerte': 'FUERTE:', 'b2.debil': 'DÉBIL:', 'b2.usar': 'CÓMO USARLO:', 'b2.frenar': 'CÓMO FRENARLO:',
  'b2.parte': v => `OLEADA ${v.n}:`, 'b2.teVen': 'TE VEN DESDE AQUÍ', 'b2.repetir': v => `REPETIR LA OLEADA ${v.n}`, 'b2.deCero': 'DESDE EL PRINCIPIO',
  'b2.aviso': 'LOS ZOMBIES VAN POR TU GENTE: PONLA DETRÁS DE UN MURO O DENTRO DE UN BÚNKER', 'b2.contagiado': '¡SOLDADO CONTAGIADO!',
  'b2.blando': 'EN EL BARRO SOLO VAN SOLDADOS, ALAMBRADO Y SEÑUELO',
  'b2.finGanado': v => `Resististe las ${v.olas} oleadas de ${v.nivel} con el campamento en ${v.base}/${v.max}: ${v.bajas} zombies muertos y ${v.contagiados} soldados contagiados, en ${v.tiempo}.`,
  'b2.finPerdido': v => `${v.nivel}: caíste en la oleada ${v.ola} de ${v.total}, en ${v.tiempo}. Entraron al campamento: ${v.lista}. Soldados contagiados: ${v.contagiados}.`,
  'b2.tip.caminante': 'Consejo: el alambrado deja a los comunes bajo fuego, y un señuelo los lleva adonde apuntan tus torretas.',
  'b2.tip.corredor': 'Consejo: los corredores no rompen muros. Ciérrales el paso y pon alambrado en el hueco, frente a una torreta.',
  'b2.tip.gordo': 'Consejo: el gordo rompe lo que tiene adelante. Concentra el fuego en él y repara el muro que ataca.',
  'b2.tip.jefe': 'Consejo: contra el Coloso, todo el fuego junto y muros de sobra para ganar tiempo.',
  'b2.tip.soldadoZombie': 'Consejo: cada soldado que pierdes pelea en tu contra. Mételos en un búnker.',
  'b2.z.caminante': 'Común', 'b2.z.corredor': 'Corredor', 'b2.z.gordo': 'Gordo', 'b2.z.jefe': 'El Coloso', 'b2.z.soldadoZombie': 'Soldado zombie',
  'b2.u.soldado': 'Soldado raso', 'b2.u.torreta': 'Torreta', 'b2.u.bunker': 'Búnker', 'b2.u.muro': 'Muro', 'b2.u.alambrado': 'Alambrado', 'b2.u.senuelo': 'Señuelo',
  'b2.u.soldado.hace': 'Dispara un fusil de alcance medio: 4 celdas.', 'b2.u.soldado.fuerte': 'Barato y rápido de formar. Llena búnkeres.',
  'b2.u.soldado.debil': 'Los zombies lo ven casi al mismo tiempo que él dispara. Tres mordidas y cae.', 'b2.u.soldado.uso': 'Nunca suelto en primera línea: detrás de un muro o dentro de un búnker.',
  'b2.u.torreta.hace': 'Ametralladora con su artillero. Barre con ráfagas.', 'b2.u.torreta.fuerte': 'Mucho daño por segundo: nada rápido se le escapa.',
  'b2.u.torreta.debil': 'Su artillero atrae a la horda. Si la rompen, él queda a pie.', 'b2.u.torreta.uso': 'Detrás de alambrado o de un muro, apuntando al hueco.',
  'b2.u.bunker.hace': 'Refugio para 4 soldados.', 'b2.u.bunker.fuerte': 'Adentro no los muerden, y disparan más lejos y más seguido. Atrae a la horda y la frena donde tú elijas.',
  'b2.u.bunker.debil': 'Vacío no hace nada. Si cae, tu gente queda a pie entre los zombies.', 'b2.u.bunker.uso': 'De ancla al frente, con torretas que cubran a los que se amontonan contra él.',
  'b2.u.muro.hace': 'Bloquea el paso.', 'b2.u.muro.fuerte': 'Mucho aguante por poco dinero. Escudo para quien está detrás; desvía a los que no ven a nadie.',
  'b2.u.muro.debil': 'El gordo no lo rodea: lo rompe. Si tapa a un soldado a la vista, lo atacan.', 'b2.u.muro.uso': 'Delante de tu gente, no al lado.',
  'b2.u.alambrado.hace': 'Frena y lastima sin bloquear.', 'b2.u.alambrado.fuerte': 'Los zombies lo cruzan a menos de la mitad de velocidad y cada uno les saca un quinto de la vida (entre todos, hasta la mitad). Se puede poner en el barro.',
  'b2.u.alambrado.debil': 'Se gasta: aguanta unas 20 pisadas. El gordo lo aplasta de una.', 'b2.u.alambrado.uso': 'Donde apuntan tus torretas y tus soldados.',
  'b2.u.senuelo.hace': 'Altavoz que llama a los zombies.', 'b2.u.senuelo.fuerte': 'Comunes y corredores a 5 celdas dejan lo que estén haciendo, también de morder, y lo golpean 5 segundos.',
  'b2.u.senuelo.debil': 'Se gasta: entretiene a unos 20. No engaña dos veces al mismo zombie. Al gordo no lo llama, y si lo pisa lo aplasta.', 'b2.u.senuelo.uso': 'A 3 celdas de tus torretas, o junto a lo que estén mordiendo, para sacárselos de encima.',
  'b2.z.caminante.hace': 'Ve a 3 celdas. Va derecho por el primer humano que ve.', 'b2.z.caminante.fuerte': 'Viene de a muchos. Rompe el muro que tapa a su presa. Contagia.',
  'b2.z.caminante.debil': 'Lento y sin protección. Cae en cualquier señuelo.', 'b2.z.caminante.uso': 'Alambrado y fuego concentrado donde se amontona.',
  'b2.z.corredor.hace': 'Ve a 4 celdas. Corre y rodea los muros buscando el hueco.', 'b2.z.corredor.fuerte': 'El doble de rápido: pasa poco tiempo bajo fuego.',
  'b2.z.corredor.debil': 'Menos vida. No rompe muros: si no hay hueco, sigue de largo.', 'b2.z.corredor.uso': 'Alambrado frente a una torreta.',
  'b2.z.gordo.hace': 'Ve poco: 2 celdas. Nunca rodea: rompe lo que tiene adelante.', 'b2.z.gordo.fuerte': 'Tres veces la vida de un común y muerde más fuerte. Aplasta el alambrado.',
  'b2.z.gordo.debil': 'Muy lento: da tiempo para concentrar el fuego.', 'b2.z.gordo.uso': 'Varias torretas y soldados a la vez. Repara el muro que está atacando.',
  'b2.z.jefe.hace': 'Gigante de las oleadas 5 y 10. Rompe todo a su paso.', 'b2.z.jefe.fuerte': 'Tiene la vida de 22 comunes y sus golpes valen por tres.',
  'b2.z.jefe.debil': 'Lento, y es uno solo.', 'b2.z.jefe.uso': 'Todo el fuego sobre él, y muros de sobra para ganar tiempo.',
  'b2.z.soldadoZombie.hace': 'Tu soldado contagiado. Se levanta a los 3 segundos de caer.', 'b2.z.soldadoZombie.fuerte': 'Casco y chaleco: cada bala le hace 1 punto menos. Más vida que un común.',
  'b2.z.soldadoZombie.debil': 'Solo existe si pierdes gente.', 'b2.z.soldadoZombie.uso': 'No pierdas soldados: búnker y muros.',
});
Object.assign(TEXTOS.pt, {
  'menu.bastion2': 'ÚLTIMO BASTIÃO V2', 'bastion.alambrado': 'ARAME', 'bastion.senuelo': 'ISCA',
  'b2.titulo': 'ÚLTIMO BASTIÃO V2 · A FAZENDA', 'b2.ayuda': 'Versão de teste do novo design. Aguente 10 ondas com o acampamento de pé.',
  'b2.regla1': 'Os zumbis enxergam. Se alguém do seu pessoal entra na visão deles, largam o caminho e vão atrás.',
  'b2.regla2': 'Se ele está atrás de um muro ou dentro de um bunker ou de uma torre, primeiro quebram isso.',
  'b2.regla3': 'Soldado que cai é contaminado: em 3 segundos se levanta contra você.',
  'b2.horda': 'A HORDA', 'b2.ejercito': 'SEU EXÉRCITO', 'b2.empezar': 'COMEÇAR', 'b2.continuar': v => `CONTINUAR · ONDA ${v.ola}/${v.total}`,
  'b2.fuerte': 'FORTE:', 'b2.debil': 'FRACO:', 'b2.usar': 'COMO USAR:', 'b2.frenar': 'COMO PARAR:',
  'b2.parte': v => `ONDA ${v.n}:`, 'b2.teVen': 'VEEM VOCÊ DAQUI', 'b2.repetir': v => `REPETIR A ONDA ${v.n}`, 'b2.deCero': 'DO COMEÇO',
  'b2.aviso': 'OS ZUMBIS VÃO ATRÁS DO SEU PESSOAL: PONHA-O ATRÁS DE UM MURO OU DENTRO DE UM BUNKER', 'b2.contagiado': 'SOLDADO CONTAMINADO!',
  'b2.blando': 'NA LAMA SÓ VÃO SOLDADOS, ARAME E ISCA',
  'b2.finGanado': v => `Você resistiu às ${v.olas} ondas de ${v.nivel} com o acampamento em ${v.base}/${v.max}: ${v.bajas} zumbis mortos e ${v.contagiados} soldados contaminados, em ${v.tiempo}.`,
  'b2.finPerdido': v => `${v.nivel}: você caiu na onda ${v.ola} de ${v.total}, em ${v.tiempo}. Entraram no acampamento: ${v.lista}. Soldados contaminados: ${v.contagiados}.`,
  'b2.tip.caminante': 'Dica: o arame deixa os comuns sob fogo, e uma isca os leva para onde suas torres apontam.',
  'b2.tip.corredor': 'Dica: os corredores não quebram muros. Feche a passagem e ponha arame na brecha, diante de uma torre.',
  'b2.tip.gordo': 'Dica: o gordo quebra o que tem pela frente. Concentre o fogo nele e conserte o muro que ele ataca.',
  'b2.tip.jefe': 'Dica: contra o Colosso, todo o fogo junto e muros de sobra para ganhar tempo.',
  'b2.tip.soldadoZombie': 'Dica: cada soldado perdido luta contra você. Ponha-os em um bunker.',
  'b2.z.caminante': 'Comum', 'b2.z.corredor': 'Corredor', 'b2.z.gordo': 'Gordo', 'b2.z.jefe': 'O Colosso', 'b2.z.soldadoZombie': 'Soldado zumbi',
  'b2.u.soldado': 'Soldado raso', 'b2.u.torreta': 'Torre', 'b2.u.bunker': 'Bunker', 'b2.u.muro': 'Muro', 'b2.u.alambrado': 'Arame farpado', 'b2.u.senuelo': 'Isca',
  'b2.u.soldado.hace': 'Atira com um fuzil de alcance médio: 4 casas.', 'b2.u.soldado.fuerte': 'Barato e rápido de formar. Enche bunkers.',
  'b2.u.soldado.debil': 'Os zumbis o veem quase ao mesmo tempo em que ele atira. Três mordidas e cai.', 'b2.u.soldado.uso': 'Nunca solto na linha de frente: atrás de um muro ou dentro de um bunker.',
  'b2.u.torreta.hace': 'Metralhadora com seu artilheiro. Varre com rajadas.', 'b2.u.torreta.fuerte': 'Muito dano por segundo: nada rápido escapa.',
  'b2.u.torreta.debil': 'O artilheiro atrai a horda. Se a quebram, ele fica a pé.', 'b2.u.torreta.uso': 'Atrás de arame ou de um muro, apontando para a brecha.',
  'b2.u.bunker.hace': 'Abrigo para 4 soldados.', 'b2.u.bunker.fuerte': 'Lá dentro não são mordidos, e atiram mais longe e mais rápido. Atrai a horda e a segura onde você quiser.',
  'b2.u.bunker.debil': 'Vazio não faz nada. Se cair, seu pessoal fica a pé no meio dos zumbis.', 'b2.u.bunker.uso': 'De âncora na frente, com torres cobrindo os que se amontoam contra ele.',
  'b2.u.muro.hace': 'Bloqueia a passagem.', 'b2.u.muro.fuerte': 'Aguenta muito por pouco dinheiro. Escudo para quem está atrás; desvia os que não veem ninguém.',
  'b2.u.muro.debil': 'O gordo não o contorna: quebra. Se esconde um soldado à vista, atacam.', 'b2.u.muro.uso': 'Na frente do seu pessoal, não ao lado.',
  'b2.u.alambrado.hace': 'Freia e fere sem bloquear.', 'b2.u.alambrado.fuerte': 'Os zumbis o cruzam a menos da metade da velocidade e cada um tira um quinto da vida (no total, até a metade). Pode ir na lama.',
  'b2.u.alambrado.debil': 'Gasta: aguenta umas 20 pisadas. O gordo o esmaga de uma vez.', 'b2.u.alambrado.uso': 'Onde suas torres e seus soldados apontam.',
  'b2.u.senuelo.hace': 'Alto-falante que chama os zumbis.', 'b2.u.senuelo.fuerte': 'Comuns e corredores a 5 casas largam o que estão fazendo, até de morder, e batem nele por 5 segundos.',
  'b2.u.senuelo.debil': 'Gasta: distrai uns 20. Não engana o mesmo zumbi duas vezes. Não chama o gordo, e se ele pisa, esmaga.', 'b2.u.senuelo.uso': 'A 3 casas das suas torres, ou junto do que estão mordendo, para tirá-los de cima.',
  'b2.z.caminante.hace': 'Enxerga a 3 casas. Vai direto no primeiro humano que vê.', 'b2.z.caminante.fuerte': 'Vem em bando. Quebra o muro que esconde sua presa. Contamina.',
  'b2.z.caminante.debil': 'Lento e sem proteção. Segue qualquer isca.', 'b2.z.caminante.uso': 'Arame e fogo concentrado onde se amontoa.',
  'b2.z.corredor.hace': 'Enxerga a 4 casas. Corre e contorna os muros procurando a brecha.', 'b2.z.corredor.fuerte': 'O dobro da velocidade: passa pouco tempo sob fogo.',
  'b2.z.corredor.debil': 'Menos vida. Não quebra muros: sem brecha, segue em frente.', 'b2.z.corredor.uso': 'Arame diante de uma torre.',
  'b2.z.gordo.hace': 'Enxerga pouco: 2 casas. Nunca contorna: quebra o que tem pela frente.', 'b2.z.gordo.fuerte': 'Três vezes a vida de um comum e morde mais forte. Esmaga o arame.',
  'b2.z.gordo.debil': 'Muito lento: dá tempo de concentrar o fogo.', 'b2.z.gordo.uso': 'Várias torres e soldados ao mesmo tempo. Conserte o muro que ele ataca.',
  'b2.z.jefe.hace': 'Gigante das ondas 5 e 10. Quebra tudo pelo caminho.', 'b2.z.jefe.fuerte': 'Tem a vida de 22 comuns e seus golpes valem por três.',
  'b2.z.jefe.debil': 'Lento, e é um só.', 'b2.z.jefe.uso': 'Todo o fogo nele, e muros de sobra para ganhar tempo.',
  'b2.z.soldadoZombie.hace': 'Seu soldado contaminado. Levanta 3 segundos depois de cair.', 'b2.z.soldadoZombie.fuerte': 'Capacete e colete: cada bala tira 1 ponto a menos. Mais vida que um comum.',
  'b2.z.soldadoZombie.debil': 'Só existe se você perde gente.', 'b2.z.soldadoZombie.uso': 'Não perca soldados: bunker e muros.',
});
Object.assign(TEXTOS.en, {
  'menu.bastion2': 'LAST BASTION V2', 'bastion.alambrado': 'WIRE', 'bastion.senuelo': 'DECOY',
  'b2.titulo': 'LAST BASTION V2 · THE FARM', 'b2.ayuda': 'Test build of the new design. Hold 10 waves with the camp standing.',
  'b2.regla1': 'Zombies can see. If one of your people steps into their sight, they leave the path and go for them.',
  'b2.regla2': 'If that person is behind a wall or inside a bunker or a turret, they break that first.',
  'b2.regla3': 'A fallen soldier is infected: 3 seconds later he rises against you.',
  'b2.horda': 'THE HORDE', 'b2.ejercito': 'YOUR ARMY', 'b2.empezar': 'START', 'b2.continuar': v => `CONTINUE · WAVE ${v.ola}/${v.total}`,
  'b2.fuerte': 'STRONG:', 'b2.debil': 'WEAK:', 'b2.usar': 'HOW TO USE IT:', 'b2.frenar': 'HOW TO STOP IT:',
  'b2.parte': v => `WAVE ${v.n}:`, 'b2.teVen': 'THEY SEE YOU FROM HERE', 'b2.repetir': v => `RETRY WAVE ${v.n}`, 'b2.deCero': 'FROM THE START',
  'b2.aviso': 'ZOMBIES GO FOR YOUR PEOPLE: PUT THEM BEHIND A WALL OR INSIDE A BUNKER', 'b2.contagiado': 'SOLDIER INFECTED!',
  'b2.blando': 'ONLY SOLDIERS, WIRE AND DECOYS GO ON MUD',
  'b2.finGanado': v => `You held the ${v.olas} waves of ${v.nivel} with the camp at ${v.base}/${v.max}: ${v.bajas} zombies killed and ${v.contagiados} soldiers infected, in ${v.tiempo}.`,
  'b2.finPerdido': v => `${v.nivel}: you fell on wave ${v.ola} of ${v.total}, in ${v.tiempo}. Got into the camp: ${v.lista}. Soldiers infected: ${v.contagiados}.`,
  'b2.tip.caminante': 'Tip: wire keeps walkers under fire, and a decoy leads them to where your turrets aim.',
  'b2.tip.corredor': 'Tip: runners never break walls. Close the way and put wire in the gap, in front of a turret.',
  'b2.tip.gordo': 'Tip: the fat one breaks whatever is ahead. Focus fire on him and repair the wall he attacks.',
  'b2.tip.jefe': 'Tip: against the Colossus, all fire together and spare walls to buy time.',
  'b2.tip.soldadoZombie': 'Tip: every soldier you lose fights against you. Put them in a bunker.',
  'b2.z.caminante': 'Walker', 'b2.z.corredor': 'Runner', 'b2.z.gordo': 'Fat one', 'b2.z.jefe': 'The Colossus', 'b2.z.soldadoZombie': 'Zombie soldier',
  'b2.u.soldado': 'Rifleman', 'b2.u.torreta': 'Turret', 'b2.u.bunker': 'Bunker', 'b2.u.muro': 'Wall', 'b2.u.alambrado': 'Barbed wire', 'b2.u.senuelo': 'Decoy',
  'b2.u.soldado.hace': 'Fires a mid-range rifle: 4 cells.', 'b2.u.soldado.fuerte': 'Cheap and quick to train. Fills bunkers.',
  'b2.u.soldado.debil': 'Zombies see him almost as soon as he can shoot. Three bites and he falls.', 'b2.u.soldado.uso': 'Never loose on the front line: behind a wall or inside a bunker.',
  'b2.u.torreta.hace': 'Machine gun with its gunner. Sweeps with bursts.', 'b2.u.torreta.fuerte': 'High damage per second: nothing fast gets away.',
  'b2.u.torreta.debil': 'Its gunner draws the horde. If it breaks, he is left on foot.', 'b2.u.torreta.uso': 'Behind wire or a wall, aiming at the gap.',
  'b2.u.bunker.hace': 'Shelter for 4 soldiers.', 'b2.u.bunker.fuerte': 'Inside they cannot be bitten, and they shoot farther and faster. It draws the horde and holds it where you choose.',
  'b2.u.bunker.debil': 'Empty, it does nothing. If it falls, your people are on foot among the zombies.', 'b2.u.bunker.uso': 'As an anchor up front, with turrets covering those who pile up against it.',
  'b2.u.muro.hace': 'Blocks the way.', 'b2.u.muro.fuerte': 'Lots of toughness for little money. A shield for whoever is behind; diverts those who see nobody.',
  'b2.u.muro.debil': 'The fat one never goes around: he breaks it. If it hides a soldier in sight, they attack it.', 'b2.u.muro.uso': 'In front of your people, not beside them.',
  'b2.u.alambrado.hace': 'Slows and hurts without blocking.', 'b2.u.alambrado.fuerte': 'Zombies cross it at less than half speed and each one takes a fifth of their health (up to half in total). It can go on mud.',
  'b2.u.alambrado.debil': 'It wears out: about 20 crossings. The fat one flattens it in one step.', 'b2.u.alambrado.uso': 'Where your turrets and soldiers aim.',
  'b2.u.senuelo.hace': 'Loudspeaker that calls zombies.', 'b2.u.senuelo.fuerte': 'Walkers and runners within 5 cells drop whatever they are doing, biting included, and hit it for 5 seconds.',
  'b2.u.senuelo.debil': 'It wears out: it distracts about 20. It never fools the same zombie twice. It does not call the fat one, and if he steps on it, he flattens it.', 'b2.u.senuelo.uso': '3 cells from your turrets, or next to whatever they are biting, to pull them off.',
  'b2.z.caminante.hace': 'Sees 3 cells. Goes straight for the first human it sees.', 'b2.z.caminante.fuerte': 'Comes in numbers. Breaks the wall hiding its prey. Infects.',
  'b2.z.caminante.debil': 'Slow and unprotected. Follows any decoy.', 'b2.z.caminante.uso': 'Wire and focused fire where they pile up.',
  'b2.z.corredor.hace': 'Sees 4 cells. Runs and goes around walls looking for the gap.', 'b2.z.corredor.fuerte': 'Twice as fast: spends little time under fire.',
  'b2.z.corredor.debil': 'Less health. Never breaks walls: with no gap, it runs past.', 'b2.z.corredor.uso': 'Wire in front of a turret.',
  'b2.z.gordo.hace': 'Short-sighted: 2 cells. Never goes around: breaks whatever is ahead.', 'b2.z.gordo.fuerte': 'Three times a walker\'s health and a harder bite. Flattens wire.',
  'b2.z.gordo.debil': 'Very slow: there is time to focus fire.', 'b2.z.gordo.uso': 'Several turrets and soldiers at once. Repair the wall he is attacking.',
  'b2.z.jefe.hace': 'Giant of waves 5 and 10. Breaks everything in his way.', 'b2.z.jefe.fuerte': 'Has the health of 22 walkers and each blow counts as three.',
  'b2.z.jefe.debil': 'Slow, and there is only one.', 'b2.z.jefe.uso': 'All fire on him, and spare walls to buy time.',
  'b2.z.soldadoZombie.hace': 'Your infected soldier. Rises 3 seconds after falling.', 'b2.z.soldadoZombie.fuerte': 'Helmet and vest: every bullet does 1 less. More health than a walker.',
  'b2.z.soldadoZombie.debil': 'Only exists if you lose people.', 'b2.z.soldadoZombie.uso': 'Do not lose soldiers: bunker and walls.',
});
