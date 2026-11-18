/* ===== Tutorial (pedido de Enzo) =====
 * Un nivel corto (unos 2 minutos) en un campo plano donde se enseña, paso a paso, lo básico: caminar, saltar, agacharse,
 * girar sin caminar, disparar, recargar, cambiar de arma, apuntar con la mira, el ataque aéreo (las «bombas») y, fuera del
 * juego, la pausa y recargar la página (F5), que mucha gente no sabe. Cada paso se da por hecho cuando el jugador lo
 * hace; todos se pueden omitir. El jugador no puede morir y los zombies vienen de a uno y lentos.
 * Las teclas de cada texto son las que tiene configuradas ({k:acción}); en el celular se nombran los botones en pantalla.
 */
const PASOS_TUTORIAL = [
  { id: 'mover', listo: (J, P) => P.recorrido >= 260 },
  { id: 'saltar', listo: J => !J.jugador.enSuelo && Math.abs(J.jugador.vx) > 1 },
  { id: 'agacharse', listo: J => J.jugador.agachado > 0.9 },
  { id: 'girar', listo: (J, P) => (J.jugador.girosHechos || 0) > P.giros },
  { id: 'disparar', alEmpezar: J => J.ponerZombiesTutorial(1), listo: (J, P) => J.bajas > P.bajas },
  { id: 'recargar', alEmpezar: J => J.ponerZombiesTutorial(1, true), listo: (J, P) => J.jugador.recargando() || J.jugador.municionActual() > P.municion },
  { id: 'cambiar', listo: (J, P) => J.jugador.indiceArma !== P.arma },
  { id: 'mira', alEmpezar: J => { J.equiparTutorial('remington700'); J.ponerZombiesTutorial(1); }, listo: J => J.jugador.mira },
  { id: 'aereo', alEmpezar: J => { J.jugador.mira && J.jugador.alternarMira(J); J.ponerZombiesTutorial(4); }, listo: (J, P) => { if (J.aereo.activo) P.visto = true; return P.visto && !J.aereo.activo; } },
  { id: 'pausa', info: 6 },
  { id: 'pagina', boton: true },
  { id: 'fin', fin: true },
];
const CLAVE_TUTORIAL_HECHO = 'zonaMuerta.tutorialHecho';

Object.assign(TEXTOS.es, {
  'tutorial.modo': 'TUTORIAL', 'tutorial.paso': v => `PASO ${v.n} DE ${v.total}`, 'tutorial.omitir': 'OMITIR', 'tutorial.entendido': 'ENTENDIDO', 'tutorial.menu': 'VOLVER AL MENÚ', 'tutorial.repetir': 'REPETIR', 'tutorial.boton': 'TUTORIAL',
  'tutorial.mover': 'Camina con {k:izquierda} y {k:derecha}.', 'tutorial.mover.t': 'Camina con los botones ◀ y ▶.',
  'tutorial.saltar': 'Salta con {k:saltar}. Si mantienes una flecha mientras saltas, vas saltando hacia adelante o hacia atrás.', 'tutorial.saltar.t': 'Salta con el botón ▲ SALTO. Si mantienes ◀ o ▶ mientras saltas, saltas hacia adelante o hacia atrás.',
  'tutorial.agacharse': 'Agáchate con {k:abajo} (mantenla apretada). Agachado le pegas de frente a los zombies chiquitos.', 'tutorial.agacharse.t': 'Agáchate con el botón ▼ ABAJO (mantenlo apretado). Agachado le pegas de frente a los zombies chiquitos.',
  'tutorial.girar': 'Gira sin caminar con {k:girar}: miras para el otro lado y puedes disparar hacia atrás. Funciona también en el aire.', 'tutorial.girar.t': 'Gira sin caminar con el botón ⟲ GIRAR: miras para el otro lado y puedes disparar hacia atrás.',
  'tutorial.disparar': 'Un zombie viene hacia ti. Dispara con {k:disparar} (o clic izquierdo) hasta derribarlo.', 'tutorial.disparar.t': 'Un zombie viene hacia ti. Dispara con el botón FUEGO hasta derribarlo.',
  'tutorial.recargar': 'Se gastaron balas del cargador: recarga con {k:recargar} (o clic derecho). Hazlo antes de quedarte sin balas.', 'tutorial.recargar.t': 'Recarga con el botón RECARGAR. Hazlo antes de quedarte sin balas.',
  'tutorial.cambiar': 'Cambia de arma con {k:armaAnterior} y {k:armaSiguiente}, o con la rueda del mouse.', 'tutorial.cambiar.t': 'Cambia de arma con ◀ ARMA y ARMA ▶.',
  'tutorial.mira': 'Ahora tienes un rifle con mira. Apunta con {k:mira}: la mira se pone sola en el zombie más cercano y la bala no falla. Con la misma tecla la sueltas.', 'tutorial.mira.t': 'Ahora tienes un rifle con mira. Toca MIRA: se pone sola en el zombie más cercano y la bala no falla.',
  'tutorial.aereo': 'Pide un ataque aéreo con {k:ataqueAereo}: los misiles limpian la pantalla de zombies. En la historia necesitas encontrar radios; en las defensas y en la pelea infinita se recarga solo.', 'tutorial.aereo.t': 'Pide un ataque aéreo tocando el botón ATAQUE AÉREO: los misiles limpian la pantalla de zombies. En la historia necesitas encontrar radios.',
  'tutorial.pausa': 'Pausa la partida con {k:pausa} o Esc. Ahí puedes cambiar el sonido, las teclas y todo lo de la configuración.', 'tutorial.pausa.t': 'Pausa la partida con el botón ❚❚. Ahí puedes cambiar el sonido y todo lo de la configuración.',
  'tutorial.pagina': 'Si el juego se traba o va lento, recarga la página: F5 o Ctrl+R en la computadora, el botón ⟳ del navegador, o desliza hacia abajo en el celular. La configuración y las misiones superadas se conservan; la partida en curso, no.', 'tutorial.pagina.t': 'Si el juego se traba o va lento, recarga la página: el botón ⟳ del navegador o desliza hacia abajo. La configuración y las misiones superadas se conservan; la partida en curso, no.',
  'tutorial.fin': '¡Listo! Ya sabes lo básico. Elige un modo en el menú y a sobrevivir.', 'tutorial.fin.t': '¡Listo! Ya sabes lo básico. Elige un modo en el menú y a sobrevivir.',
});
Object.assign(TEXTOS.pt, {
  'tutorial.modo': 'TUTORIAL', 'tutorial.paso': v => `PASSO ${v.n} DE ${v.total}`, 'tutorial.omitir': 'PULAR', 'tutorial.entendido': 'ENTENDI', 'tutorial.menu': 'VOLTAR AO MENU', 'tutorial.repetir': 'REPETIR', 'tutorial.boton': 'TUTORIAL',
  'tutorial.mover': 'Ande com {k:izquierda} e {k:derecha}.', 'tutorial.mover.t': 'Ande com os botões ◀ e ▶.',
  'tutorial.saltar': 'Pule com {k:saltar}. Se mantiver uma seta apertada enquanto pula, você pula para frente ou para trás.', 'tutorial.saltar.t': 'Pule com o botão ▲. Se mantiver ◀ ou ▶ enquanto pula, você pula para frente ou para trás.',
  'tutorial.agacharse': 'Abaixe-se com {k:abajo} (mantenha apertada). Abaixado, você acerta os zumbis pequenos de frente.', 'tutorial.agacharse.t': 'Abaixe-se com o botão ▼ (mantenha apertado). Abaixado, você acerta os zumbis pequenos de frente.',
  'tutorial.girar': 'Vire sem andar com {k:girar}: você olha para o outro lado e pode atirar para trás. Vale também no ar.', 'tutorial.girar.t': 'Vire sem andar com o botão ⟲ VIRAR: você olha para o outro lado e pode atirar para trás.',
  'tutorial.disparar': 'Um zumbi vem na sua direção. Atire com {k:disparar} (ou clique esquerdo) até derrubá-lo.', 'tutorial.disparar.t': 'Um zumbi vem na sua direção. Atire com o botão FOGO até derrubá-lo.',
  'tutorial.recargar': 'Gastou balas do carregador: recarregue com {k:recargar} (ou clique direito). Faça isso antes de ficar sem balas.', 'tutorial.recargar.t': 'Recarregue com o botão RECARREGAR. Faça isso antes de ficar sem balas.',
  'tutorial.cambiar': 'Troque de arma com {k:armaAnterior} e {k:armaSiguiente}, ou com a roda do mouse.', 'tutorial.cambiar.t': 'Troque de arma com ◀ ARMA e ARMA ▶.',
  'tutorial.mira': 'Agora você tem um rifle com mira. Mire com {k:mira}: a mira vai sozinha no zumbi mais próximo e a bala não erra. Com a mesma tecla você solta.', 'tutorial.mira.t': 'Agora você tem um rifle com mira. Toque em MIRA: ela vai sozinha no zumbi mais próximo e a bala não erra.',
  'tutorial.aereo': 'Peça um ataque aéreo com {k:ataqueAereo}: os mísseis limpam a tela de zumbis. Na história você precisa achar rádios; nas defesas ele recarrega sozinho.', 'tutorial.aereo.t': 'Peça um ataque aéreo tocando no botão ATAQUE AÉREO: os mísseis limpam a tela de zumbis. Na história você precisa achar rádios.',
  'tutorial.pausa': 'Pause a partida com {k:pausa} ou Esc. Ali você muda o som, as teclas e tudo da configuração.', 'tutorial.pausa.t': 'Pause a partida com o botão ❚❚. Ali você muda o som e tudo da configuração.',
  'tutorial.pagina': 'Se o jogo travar ou ficar lento, recarregue a página: F5 ou Ctrl+R no computador, o botão ⟳ do navegador, ou deslize para baixo no celular. A configuração e as missões concluídas ficam; a partida em andamento, não.', 'tutorial.pagina.t': 'Se o jogo travar ou ficar lento, recarregue a página: o botão ⟳ do navegador ou deslize para baixo. A configuração e as missões concluídas ficam; a partida em andamento, não.',
  'tutorial.fin': 'Pronto! Você já sabe o básico. Escolha um modo no menu e sobreviva.', 'tutorial.fin.t': 'Pronto! Você já sabe o básico. Escolha um modo no menu e sobreviva.',
});
Object.assign(TEXTOS.en, {
  'tutorial.modo': 'TUTORIAL', 'tutorial.paso': v => `STEP ${v.n} OF ${v.total}`, 'tutorial.omitir': 'SKIP', 'tutorial.entendido': 'GOT IT', 'tutorial.menu': 'BACK TO MENU', 'tutorial.repetir': 'REPEAT', 'tutorial.boton': 'TUTORIAL',
  'tutorial.mover': 'Walk with {k:izquierda} and {k:derecha}.', 'tutorial.mover.t': 'Walk with the ◀ and ▶ buttons.',
  'tutorial.saltar': 'Jump with {k:saltar}. If you hold an arrow while you jump, you leap forward or backward.', 'tutorial.saltar.t': 'Jump with the ▲ button. If you hold ◀ or ▶ while you jump, you leap forward or backward.',
  'tutorial.agacharse': 'Crouch with {k:abajo} (hold it down). Crouched, you hit small zombies head-on.', 'tutorial.agacharse.t': 'Crouch with the ▼ button (hold it down). Crouched, you hit small zombies head-on.',
  'tutorial.girar': 'Turn around without walking with {k:girar}: you face the other way and can shoot backward. It works in the air too.', 'tutorial.girar.t': 'Turn around without walking with the ⟲ TURN button: you face the other way and can shoot backward.',
  'tutorial.disparar': 'A zombie is coming. Shoot with {k:disparar} (or left click) until it goes down.', 'tutorial.disparar.t': 'A zombie is coming. Shoot with the FIRE button until it goes down.',
  'tutorial.recargar': 'You used up some rounds: reload with {k:recargar} (or right click). Do it before you run dry.', 'tutorial.recargar.t': 'Reload with the RELOAD button. Do it before you run dry.',
  'tutorial.cambiar': 'Switch weapons with {k:armaAnterior} and {k:armaSiguiente}, or with the mouse wheel.', 'tutorial.cambiar.t': 'Switch weapons with ◀ ARMA and ARMA ▶.',
  'tutorial.mira': 'You now have a scoped rifle. Aim with {k:mira}: the scope locks onto the nearest zombie and the bullet never misses. The same key lets go.', 'tutorial.mira.t': 'You now have a scoped rifle. Tap SIGHT: it locks onto the nearest zombie and the bullet never misses.',
  'tutorial.aereo': 'Call in an air strike with {k:ataqueAereo}: the missiles clear every zombie off the screen. In the story you have to find radios; in the defense modes it recharges by itself.', 'tutorial.aereo.t': 'Call in an air strike by tapping the AIR STRIKE button: the missiles clear every zombie off the screen. In the story you have to find radios.',
  'tutorial.pausa': 'Pause the game with {k:pausa} or Esc. There you can change the sound, the keys and everything in the settings.', 'tutorial.pausa.t': 'Pause the game with the ❚❚ button. There you can change the sound and everything in the settings.',
  'tutorial.pagina': 'If the game freezes or runs slowly, reload the page: F5 or Ctrl+R on a computer, the browser’s ⟳ button, or pull down on a phone. Your settings and completed missions are kept; the game in progress is not.', 'tutorial.pagina.t': 'If the game freezes or runs slowly, reload the page: the browser’s ⟳ button or pull down. Your settings and completed missions are kept; the game in progress is not.',
  'tutorial.fin': 'All set! You know the basics. Pick a mode in the menu and survive.', 'tutorial.fin.t': 'All set! You know the basics. Pick a mode in the menu and survive.',
});

Object.assign(Juego.prototype, {
  // Al armar la partida: el campo plano sin rondas, tres armas (la última con mira) y el primer paso
  prepararTutorial() {
    const j = this.jugador;
    this.descansoHasta = Infinity; this.proximaCaja = Infinity; this.proximoZombie = Infinity;
    for (const id of ['ak47', 'remington700']) j.recoger(id);
    j.indiceArma = j.inventario.indexOf(ARMA_INICIAL); j.cancelarRecarga();
    this.tut = { paso: -1, P: null, xAnterior: j.x };
    this.panelTutorial = document.getElementById('tutorial');
    this.pasoTutorial(0);
  },
  tactilTutorial() { return document.body.classList.contains('tactil'); },
  textoTutorial(id) { return t('tutorial.' + id + (this.tactilTutorial() ? '.t' : '')); },
  equiparTutorial(armaId) {
    const j = this.jugador; if (!j.inventario.includes(armaId)) j.recoger(armaId);
    j.indiceArma = j.inventario.indexOf(armaId); j.cancelarRecarga(); j.ultimoDisparo = -1e9; Audio_.sacarArma(ARMAS[armaId]);
  },
  // Zombies lentos que llegan de a uno desde el frente (los que el jugador va derribando); gastado: deja el cargador sin llenar
  ponerZombiesTutorial(n, gastar = false) {
    const j = this.jugador;
    for (let k = 0; k < n; k++) {
      const x = j.x + j.direccion * (ANCHO / 2 + 40 + k * 130), z = new Zombie(x, false, this.dificultad);
      z.vida = z.vidaMax = 24; z.velocidad = 0.38; z.y = alturaSuelo(x);
      this.zombies.push(z);
    }
    if (gastar && j.municionActual() >= j.arma().cargador) j.municion[j.arma().id] = Math.max(1, j.arma().cargador - 2);
  },
  // Empieza el paso n: su texto, su botón (si lo tiene) y lo que necesite en la cancha
  pasoTutorial(n) {
    const T = this.tut, j = this.jugador; T.paso = n;
    const paso = PASOS_TUTORIAL[n];
    T.P = { desde: this.tiempoJugado, recorrido: 0, giros: j.girosHechos || 0, bajas: this.bajas, municion: j.municionActual(), arma: j.indiceArma, visto: false };
    if (paso.alEmpezar) paso.alEmpezar(this);
    this.dibujarPanelTutorial();
    if (paso.fin) { try { localStorage.setItem(CLAVE_TUTORIAL_HECHO, '1'); } catch { /* sin almacenamiento */ } Audio_.mision(); }
    else if (n > 0) Audio_.recoger();
  },
  dibujarPanelTutorial() {
    const T = this.tut, paso = PASOS_TUTORIAL[T.paso], el = this.panelTutorial; if (!el) return;
    const total = PASOS_TUTORIAL.length - 1;
    el.classList.remove('oculta'); el.classList.toggle('final', !!paso.fin);
    document.getElementById('tutorial-paso').textContent = paso.fin ? '✓' : t('tutorial.paso', { n: T.paso + 1, total });
    document.getElementById('tutorial-texto').textContent = this.textoTutorial(paso.id);
    const botones = document.getElementById('tutorial-botones');
    botones.innerHTML = paso.fin
      ? `<button type="button" class="boton chico" data-accion="al-menu">${t('tutorial.menu')}</button><button type="button" class="boton chico" data-accion="tutorial">${t('tutorial.repetir')}</button>`
      : paso.boton ? `<button type="button" class="boton chico" data-accion="tutorial-saltar">${t('tutorial.entendido')}</button>` : '';
    botones.classList.toggle('oculta', !botones.innerHTML);
    document.getElementById('tutorial-omitir').classList.toggle('oculta', !!paso.fin || !!paso.boton);
    document.getElementById('tutorial-omitir').textContent = t('tutorial.omitir');
    this.tutorialTextoDe = paso.id + (this.tactilTutorial() ? 't' : '');
  },
  siguienteTutorial() { if (this.tut && this.tut.paso < PASOS_TUTORIAL.length - 1) this.pasoTutorial(this.tut.paso + 1); },
  actualizarTutorial(dt) {
    const T = this.tut, j = this.jugador; if (!T) return;
    j.invulnerableHasta = this.ahora + 60000;   // aquí nadie se muere
    T.P.recorrido += Math.abs(j.x - T.xAnterior); T.xAnterior = j.x;
    const paso = PASOS_TUTORIAL[T.paso];
    // Cambió el idioma, una tecla o el tipo de pantalla: el texto se vuelve a escribir
    if (this.tutorialTextoDe !== paso.id + (this.tactilTutorial() ? 't' : '') || document.getElementById('tutorial-texto').textContent !== this.textoTutorial(paso.id)) this.dibujarPanelTutorial();
    const avance = document.getElementById('tutorial-avance');
    if (paso.fin || paso.boton) { avance.style.width = '100%'; return; }
    if (paso.info) {
      const f = Math.min(1, (this.tiempoJugado - T.P.desde) / paso.info); avance.style.width = (f * 100) + '%';
      if (f >= 1) this.siguienteTutorial();
      return;
    }
    // Pasos con zombies: que nunca falte uno a la vista para practicar
    if (['disparar', 'recargar', 'mira'].includes(paso.id) && !this.zombies.some(z => z.estado !== 'muerto')) this.ponerZombiesTutorial(1);
    avance.style.width = '0%';
    if (paso.listo(this, T.P)) this.siguienteTutorial();
  },
});
