/* ===== Último bastión v2: panel, parte de la oleada, fichas, pantalla previa y textos =====
 * El panel de abajo tiene las 12 unidades con su retrato, agrupadas por clase (infantería, mecanizados, estructuras),
 * las tres herramientas (vender, reparar, mover) y el botón de la oleada. Arriba, el parte: qué trae la oleada que
 * viene (o la que está en curso), con el tipo que debuta marcado. Los contrapesos se ven sin tapar el campo: al elegir
 * una unidad, en el parte quedan marcados los zombies que frena (verde) y contra los que rinde poco (rojo); al tocar
 * un zombie del parte, en la barra quedan marcadas las unidades que lo frenan y las que no sirven. De texto, un solo
 * renglón arriba de la barra. La guía completa (qué hace cada uno, fuerte, débil, cómo usarlo) es la pantalla previa.
 */
const BastionV2UI = {
  retratos: {}, parteDe: '', infoDe: '', debutVisto: -1, debutCola: [], zombieVisto: '', zombieHasta: 0, colocandoVisto: null,
  // Un zombie de cada tipo para retratarlo (quieto, mirando hacia el campamento)
  zombieDeMuestra(id) {
    const P = Juego.prototype, falso = { dificultad: DIFICULTADES.medio, ronda: 1, nivelV2: { vida: 1 }, ahora: 0, vidaComunV2: P.vidaComunV2, vestirZombieV2: P.vestirZombieV2 };
    const z = P.crearZombieV2.call(falso, id, DIFICULTADES.medio);
    z.escala = BASTION2.zombies[id].escala; z.direccion = -1; z.x = 0; z.y = z.ySuelo = 0; z.fase = 1.2; z.estado = 'camina';
    if (z.variante) z.variante.brazoColgando = false;
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
        const [x0, y0, x1, y1] = BastionV2Dibujo.CAJAS[id], s = c.width / Math.max(x1 - x0, y1 - y0) * 0.94;
        g.translate(c.width / 2, c.height / 2); g.scale(s, s); g.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
        BastionV2Dibujo.posar(g, id);
      } else {
        const z = this.zombieDeMuestra(id);
        if (z.vuela) { const s = c.width / (z.E.ancho * 1.5 * z.escala); g.translate(c.width * 0.56, c.height * 0.62); g.scale(s, s); z.altura = 0; z.fase = 0.9; g.save(); z.cuerpo(g, false); g.restore(); }
        else if (z.E) { const s = c.width / (z.E.ancho * 1.75 * z.escala); g.translate(c.width * 0.6, c.height * 0.8); g.scale(s, s); z.dibujar(g, 0, 0); }
        else { const s = c.height / (98 * z.escala); g.translate(c.width * (id === 'acorazado' || id === 'griton' ? 0.62 : 0.56), c.height * 0.95); g.scale(s, s); z.dibujar(g, 0, 0); }
      }
    } catch (e) { /* sin lienzo: queda vacío */ } finally { Lienzo.liviano = liviano; }
    return (this.retratos[k] = c.toDataURL());
  },
  // Íconos de unidades o de zombies en fila (para «lo frena», «frena a»)
  iconos(clase, ids, lado = 26) { return ids.map(id => `<img class="b2-ico" src="${this.retrato(clase + ':' + id, lado)}" alt="${t('b2.' + clase + '.' + id)}" title="${t('b2.' + clase + '.' + id)}">`).join(''); },
  // A quién frena una unidad y contra quién rinde poco, según BASTION2.contra
  contraDe(unidad) {
    const bien = [], mal = [];
    for (const z of BASTION2.ordenParte) { const C = BASTION2.contra[z]; if (C.bien.includes(unidad)) bien.push(z); if (C.mal.includes(unidad)) mal.push(z); }
    return { bien, mal };
  },
  claseDe(clave) {
    const [clase, id] = clave.split(':');
    if (clase === 'u') return BASTION2.unidades[id].clase;
    return id === 'soldadoZombie' || id === 'jefe' ? 'cam' : BASTION2.zombies[id].clase;
  },
  // Lo que dice la ficha de la guía: qué hace, fuerte, débil, cómo usarlo o frenarlo, y los contrapesos con íconos
  ficha(clave) {
    const [clase, id] = clave.split(':'), k = 'b2.' + clase + '.' + id, esZ = clase === 'z';
    const C = esZ ? BASTION2.contra[id] : this.contraDe(id);
    const contras = `<p class="b2-contras"><span><b class="mas">${t(esZ ? 'b2.loFrena' : 'b2.frenaA')}</b> ${this.iconos(esZ ? 'u' : 'z', C.bien)}</span>` +
      (C.mal.length ? `<span><b class="menos">${t(esZ ? 'b2.noSirve' : 'b2.flojoContra')}</b> ${this.iconos(esZ ? 'u' : 'z', C.mal)}</span>` : '') + '</p>';
    const precio = esZ ? '' : ` <small>$${BASTION2.unidades[id].costo}</small>`;
    return `<img src="${this.retrato(clave, 112)}" alt=""><div><h3>${t(k)}${precio} <em>${t('b2.clase.' + this.claseDe(clave))}</em></h3><p>${t(k + '.hace')}</p>` +
      `<p><b class="mas">${t('b2.fuerte')}</b> ${t(k + '.fuerte')}</p><p><b class="menos">${t('b2.debil')}</b> ${t(k + '.debil')}</p>` +
      `<p><b>${t(esZ ? 'b2.frenar' : 'b2.usar')}</b> ${t(k + '.uso')}</p>${contras}</div>`;
  },

  /* ---------- Pantalla previa: los dos bandos por clase, con sus fichas ---------- */
  abrir(mostrar) {
    BastionV2.ajustarUnidades(true);   // los precios de la v2, también antes de empezar
    this.pintar('z:caminante');
    mostrar('panel-bastion2');
  },
  // Las fichas de los dos bandos y el detalle de la elegida (se arma de nuevo si cambia el idioma con la pantalla abierta)
  pintar(elegida) {
    const tecla = (clave, precio) => `<button type="button" class="b2-ficha" data-ficha="${clave}"><img src="${this.retrato(clave, 56)}" alt=""><b>${t('b2.' + clave.replace(':', '.'))}</b>${precio ? `<small>${precio}</small>` : ''}</button>`;
    const fila = (clase, claves, precios) => `<div class="b2-fila"><h4>${t('b2.clase.' + clase)}</h4><div class="b2-fichas">${claves.map(k => tecla(k, precios ? '$' + BASTION2.unidades[k.slice(2)].costo : '')).join('')}</div></div>`;
    document.getElementById('b2-zombies').innerHTML = ['cam', 'esp', 'ani', 'ace'].map(c => fila(c, [...BASTION2.clasesZombie[c], ...(c === 'cam' ? ['soldadoZombie', 'jefe'] : [])].map(k => 'z:' + k))).join('');
    document.getElementById('b2-unidades').innerHTML = ['inf', 'mec', 'est'].map(c => fila(c, BASTION2.clases[c].map(k => 'u:' + k), true)).join('');
    const guardada = BastionV2.partida(), seguir = document.getElementById('b2-continuar');
    seguir.classList.toggle('oculta', !guardada);
    if (guardada) seguir.textContent = t('b2.continuar', { ola: guardada.ronda + 1, total: BastionV2.oleadas().length });
    this.mostrarFicha(elegida);
  },
  mostrarFicha(clave) {
    document.querySelectorAll('.b2-ficha').forEach(b => b.classList.toggle('elegida', b.dataset.ficha === clave));
    document.getElementById('b2-detalle').innerHTML = this.ficha(clave);
  },

  /* ---------- El panel de la partida ---------- */
  armarPanel() {
    const panel = document.getElementById('panel-bastion'); if (!panel || document.getElementById('b2-barra')) return;
    const teclas = Object.fromEntries(Object.entries(BastionV2.TECLAS).map(([codigo, tipo]) => [tipo, codigo.replace(/^(Digit|Key)/, '')]));
    const boton = tipo => `<button type="button" data-unidad="${tipo}"><img alt=""><small></small><span class="cola"></span><span class="avance"></span><kbd>${teclas[tipo] || ''}</kbd></button>`;
    const herramienta = tipo => `<button type="button" class="herr" data-unidad="${tipo}"><b></b><small></small><kbd>${teclas[tipo] || ''}</kbd></button>`;
    const barra = document.createElement('div'); barra.id = 'b2-barra'; barra.className = 'b2-barra';
    barra.innerHTML = ['inf', 'mec', 'est'].map(c => `<div class="b2-grupo ${c}">${BASTION2.clases[c].map(boton).join('')}</div>`).join('') +
      `<div class="b2-grupo herr">${['vender', 'reparar', 'mover'].map(herramienta).join('')}</div><button type="button" id="b2-oleada" class="b2-oleada"></button>`;
    panel.appendChild(barra);
    barra.querySelector('#b2-oleada').addEventListener('click', () => { const j = window.ZonaMuerta && ZonaMuerta.juego(); if (j && j.estrategia) j.oleadaYa(); });
  },
  panel(j) {
    this.armarPanel();
    const B = BASTION, barra = document.getElementById('b2-barra'); if (!barra) return;
    const total = j.nivelV2.oleadas.length, idioma = Idioma.actual();
    document.getElementById('bastion-dinero').textContent = '$ ' + j.dinero;
    document.getElementById('bastion-ola').textContent = t('bastion.olaDe', { n: Math.max(1, j.ronda), total });
    const base = document.getElementById('bastion-base');
    base.textContent = t('bastion.base', { v: j.vidaBase, max: B.vidaBase }); base.classList.toggle('peligro', j.vidaBase <= B.vidaBase * 0.3);
    for (const b of barra.querySelectorAll('[data-unidad]')) {
      const tipo = b.dataset.unidad, U = B.unidades[tipo];
      b.classList.toggle('elegida', j.colocando === tipo);
      if (!U) {   // herramientas
        if (b.dataset.idioma !== idioma) { b.dataset.idioma = idioma; b.querySelector('b').textContent = t('bastion.' + tipo); }
        b.querySelector('small').textContent = tipo === 'vender' ? (j.enDescanso ? '¾' : '½') : tipo === 'reparar' ? '¾' : '';
        continue;
      }
      if (b.dataset.idioma !== idioma) { b.dataset.idioma = idioma; b.title = t('b2.u.' + tipo); const img = b.querySelector('img'); img.src = this.retrato('u:' + tipo, 40); img.alt = t('b2.u.' + tipo); }
      const precio = '$' + U.costo, chico = b.querySelector('small'); if (chico.textContent !== precio) chico.textContent = precio;   // (el panel del modo de siempre también escribe en los botones que comparten nombre)
      b.classList.toggle('caro', j.dinero < U.costo);
      const cola = U.donde === 'cuartel' ? j.colaCuartel : U.donde === 'taller' ? j.colaTaller : null;
      const enCola = cola ? cola.filter(o => o.tipo === tipo).length : 0;
      b.querySelector('.cola').textContent = enCola ? '×' + enCola : '';
      const avance = cola && cola[0] && cola[0].tipo === tipo ? Math.min(1, (cola[0].hecho || 0) / U.tiempo) : 0;
      b.querySelector('.avance').style.width = Math.round(avance * 100) + '%';
    }
    for (const b of document.querySelectorAll('#panel-bastion [data-velocidad]')) b.classList.toggle('elegida', +b.dataset.velocidad === j.velocidad);
    const ola = document.getElementById('b2-oleada');
    if (j.enDescanso) { ola.disabled = false; ola.textContent = t('bastion.proxima', { n: j.ronda + 1, s: Math.max(0, Math.ceil(j.descansoHasta - j.tiempoJugado)) }); }
    else { ola.disabled = true; ola.textContent = t('bastion.enCurso', { n: j.ronda, q: j.porAparecer + j.zombies.filter(z => z.estado !== 'muerto').length }); }
    this.parte(j);
  },

  /* ---------- Parte de la oleada, renglón de información y marcas de contrapeso ---------- */
  parte(j) {
    const el = document.getElementById('bastion-parte'), info = document.getElementById('bastion-info'), barra = document.getElementById('b2-barra');
    if (!el || !info || !barra) return;
    const total = j.nivelV2.oleadas.length, n = j.enDescanso ? j.ronda : j.ronda - 1, ver = n < total && n >= 0 && !j.terminado;
    el.classList.toggle('oculta', !ver); el.classList.toggle('en-curso', !j.enDescanso);
    el.classList.toggle('muchos', ver && Object.keys(j.nivelV2.oleadas[n]).length > 11);   // con muchos tipos, más chicos para que entren en el celular
    const clave = ver ? n + ':' + j.enDescanso + ':' + Idioma.actual() : '';
    const def = ver ? j.nivelV2.oleadas[n] : {}, debut = BastionV2.debut();
    let rehecho = false;
    if (clave !== this.parteDe) {
      this.parteDe = clave; rehecho = true;
      el.innerHTML = ver ? `<b>${t('b2.parte', { n: n + 1 })}</b>` + BASTION2.ordenParte.filter(k => def[k]).map(k => {
        const nuevo = debut[k] === n && n > 0;
        return `<button type="button" class="chip${nuevo ? ' nuevo' : ''}" data-ficha-z="${k}" title="${t('b2.z.' + k)}"><img src="${this.retrato('z:' + k, 44)}" alt="${t('b2.z.' + k)}"><i>×${def[k]}</i>${nuevo ? `<u>${t('b2.nuevo')}</u>` : ''}</button>`;
      }).join('') : '';
    }
    // El tipo que debuta se presenta solo, una vez, al empezar el descanso
    if (ver && j.enDescanso && n > 0 && this.debutVisto !== n) { this.debutVisto = n; this.debutCola = BASTION2.ordenParte.filter(k => def[k] && debut[k] === n); }
    if (this.debutCola.length && !this.zombieVisto && ver && j.enDescanso) this.verZombie(this.debutCola.shift(), 8000);   // de a uno, si son dos
    // Elegir otra cosa en la barra deja de mostrar al zombie que se había tocado
    if (j.colocando !== this.colocandoVisto) { this.colocandoVisto = j.colocando; if (j.colocando) { this.verZombie(null); this.debutCola = []; } }
    if (this.zombieVisto && (performance.now() > this.zombieHasta || j.terminado)) this.verZombie(null);
    const unidad = BASTION2.unidades[j.colocando] ? j.colocando : '', zombie = this.zombieVisto;
    // Renglón de arriba de la barra: el zombie que se tocó (o que debuta) o, si no, lo que se está por poner
    const claveInfo = (zombie ? 'z:' + zombie : unidad ? 'u:' + unidad : '') + ':' + Idioma.actual();
    info.classList.toggle('oculta', !zombie && !unidad);
    if (claveInfo !== this.infoDe || rehecho) {
      this.infoDe = claveInfo;
      if (zombie) info.innerHTML = `<b>${t('b2.z.' + zombie)}</b>${debut[zombie] === n && n > 0 ? ` <i class="b2-nuevo">${t('b2.nuevo')}</i>` : ''} ${t('b2.z.' + zombie + '.hace')} ${t('b2.z.' + zombie + '.fuerte')}`;
      else if (unidad) info.innerHTML = `<b>${t('b2.u.' + unidad)}</b> ${t('b2.u.' + unidad + '.hace')} ${t('b2.u.' + unidad + '.uso')}`;
      info.classList.toggle('zombie', !!zombie);
      // Marcas: con un zombie a la vista, en la barra (qué lo frena y qué no sirve); con una unidad elegida, en el parte
      const CZ = zombie ? BASTION2.contra[zombie] : null;
      for (const b of barra.querySelectorAll('[data-unidad]')) { const u = b.dataset.unidad; b.classList.toggle('bien', !!CZ && CZ.bien.includes(u)); b.classList.toggle('mal', !!CZ && CZ.mal.includes(u)); }
      for (const c of el.querySelectorAll('.chip')) {
        const C = BASTION2.contra[c.dataset.fichaZ];
        c.classList.toggle('vista', c.dataset.fichaZ === zombie);
        c.classList.toggle('bien', !zombie && !!unidad && C.bien.includes(unidad)); c.classList.toggle('mal', !zombie && !!unidad && C.mal.includes(unidad));
      }
    }
  },
  // Deja a la vista un zombie del parte por ms milisegundos (null: ninguno)
  verZombie(tipo, ms = 9000) { this.zombieVisto = tipo || ''; this.zombieHasta = tipo ? performance.now() + ms : 0; },
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ficha]'); if (b) { BastionV2UI.mostrarFicha(b.dataset.ficha); return; }
  const chip = e.target.closest('[data-ficha-z]');   // tocar un tipo del parte lo deja a la vista; tocarlo de nuevo lo saca
  if (chip) { BastionV2UI.verZombie(BastionV2UI.zombieVisto === chip.dataset.fichaZ ? null : chip.dataset.fichaZ); const j = window.ZonaMuerta && ZonaMuerta.juego(); if (j && j.v2) j.panelBastion(); }
});
Idioma.alCambiar(() => {   // con la pantalla previa abierta, las fichas pasan al idioma nuevo
  const panel = document.getElementById('panel-bastion2'), elegida = document.querySelector('.b2-ficha.elegida');
  if (panel && panel.classList.contains('visible')) BastionV2UI.pintar(elegida ? elegida.dataset.ficha : 'z:caminante');
});

/* ---------- Textos ---------- */
// Fichas: [nombre, qué hace, fuerte, débil, cómo usarlo (unidades) o cómo frenarlo (zombies)]
const FICHAS_B2 = {
  es: {
    u: {
      soldado: ['Soldado raso', 'Dispara un fusil de alcance medio.', 'Barato y rápido de formar. Le tira a lo que camina y a lo que vuela. Llena los búnkeres.', 'Lo ven enseguida y aguanta poco. Contra blindaje, sus balas hacen un tercio.', 'Nunca suelto en primera línea: detrás de un muro o dentro de un búnker.'],
      francotirador: ['Francotirador', 'Abate de un tiro fuerte y lejano cada 3 segundos.', 'Dispara desde fuera de la vista de casi todos. Ignora el blindaje y elige solo al más peligroso. También baja buitres.', 'Un blanco a la vez: la horda le pasa por encima. Aguanta muy poco. Lo delata el gritón, lo huelen los perros y se lo lleva el buitre.', 'Lejos del frente, con algo que lo cubra, o dentro de un búnker.'],
      lanzallamas: ['Lanzallamas', 'Quema a todos los que tiene a 2 celdas y los deja ardiendo.', 'Pega a todo el montón a la vez y el fuego ignora el blindaje. Perros y toro no cruzan el fuego.', 'Siempre está a la vista. No llega a lo que vuela. Hace estallar en su cara al hinchado y al dinamitero, y enciende el gas.', 'En el hueco por donde pasa la horda, detrás de un muro o de alambrado.'],
      medico: ['Médico', 'Cura a la infantería que tiene a 2 celdas. No dispara.', 'Quien cae a su lado no se contagia. Con él cerca, el gas no vacía los búnkeres.', 'No hace daño y es presa como cualquiera. No arregla máquinas ni estructuras.', 'Pegado a tu gente o dentro de un búnker, del lado del campamento.'],
      torreta: ['Torreta', 'Barre con ráfagas de ametralladora.', 'Mucho fuego: nada rápido se le escapa. Acaba con jaurías, corredores y dinamiteros.', 'Balas chicas: contra blindaje rinde la mitad. No apunta al aire. Atrae a la horda y no se mueve.', 'Detrás de alambrado o de un muro, apuntando al hueco.'],
      tanque: ['Tanque', 'Aguanta al frente y voltea a los pesados con su cañón.', 'Tiene 400 de vida y las mordidas le hacen un tercio. Su cañón ignora el blindaje y busca al que más aguanta. El gas no le entra. Se puede mover. Por su peso, ningún topo pasa por debajo a 2 celdas.', 'Un solo blanco por disparo: no para una horda ni una jauría. Lo buscan el hinchado y el dinamitero. Nada contra lo que vuela. Caro.', 'De ancla al frente: la horda se frena contra él mientras lo demás dispara.'],
      mortero: ['Mortero', 'Bombardea con granadas que estallan en un área.', 'Tira de 4 a 9 celdas, por encima de los muros y desde fuera de la vista. Castiga al montón que se frenó.', 'La granada tarda 1.5 segundos: falla contra lo rápido. Ciego a menos de 4 celdas. Nada contra lo que vuela.', 'Bien atrás, apuntando adonde la horda se frena: un búnker, el tanque o un señuelo.'],
      antiaerea: ['Antiaérea', 'Derriba lo que vuela con ráfagas que estallan en el aire.', 'Limpia una bandada entera y baja al buitre. Alcanza 6 celdas.', 'No baja el cañón: inútil contra lo que camina.', 'Cerca del campamento y al centro: todo lo que vuela termina pasando por ahí.'],
      muro: ['Muro', 'Bloquea el paso.', 'Barato y resistente. Desvía a los que no ven a nadie y es el escudo de quien está detrás. Perros y toro no lo pasan.', 'Lo vuela el dinamitero y lo rompe el gordo. Lo que vuela lo ignora. No se puede cerrar el paso del todo.', 'Delante de tu gente, no al lado.'],
      alambrado: ['Alambrado', 'Frena y lastima sin bloquear.', 'Los zombies lo cruzan a menos de la mitad de velocidad y pierden una quinta parte de la vida. Va en el barro. Carnada para el hinchado.', 'Se gasta: unas 20 pisadas. Los perros lo saltan, el gordo lo aplasta y el toro lo arranca.', 'Bajo el fuego de tus torretas, dos celdas delante de lo valioso.'],
      bunker: ['Búnker', 'Protege hasta a 4 de infantería, que disparan desde adentro.', 'Adentro no los muerden, ni los picotean, ni se los llevan, y tiran 20 % más lejos. Aguanta mucho y frena a la horda donde conviene.', 'Lo buscan el hinchado y el dinamitero. El gas entra. Si cae, su gente queda a pie en medio de la horda.', 'De ancla al frente, lleno de soldados; con un médico adentro si vienen tóxicos.'],
      senuelo: ['Señuelo', 'Altavoz que llama a los caminantes.', 'Comunes, corredores y acorazados a 5 celdas dejan lo que estén haciendo, hasta de morder, y lo golpean 5 segundos. Carnada para el hinchado. El topo sale junto a él en vez de junto a tu gente.', 'Se gasta: entretiene a unos 20. No engaña dos veces al mismo. No llama a animales ni a especiales, y el gordo lo aplasta.', 'Donde apuntan el mortero y las torretas, lejos de tu gente.'],
      vigia: ['Torre de vigía', 'Descubre a los topos enterrados a 4 celdas y los obliga a salir.', 'Barata. El topo que pasa por su zona sale encandilado, a tiro de todos, antes de llegar a lo que tienes atrás.', 'No dispara ni frena a nadie: sin armas cerca, sólo avisa. La vuelan el dinamitero y el hinchado.', 'Detrás de tu línea, cubriendo morteros, francotiradores y antiaéreas.'],
    },
    z: {
      caminante: ['Común', 'Va por el primer humano que ve a 3 celdas; si no ve a nadie, al campamento.', 'Viene de a muchos y contagia. Rompe el muro que tapa a su presa.', 'Lento y sin protección. Se amontona: el fuego y las granadas lo barren. Sigue a cualquier señuelo.', 'Mortero o lanzallamas donde se frena; señuelo para llevarlo adonde quieras.'],
      corredor: ['Corredor', 'Ve a 4 celdas y rodea los muros buscando el hueco.', 'Rápido: pasa poco tiempo bajo fuego y llega antes que los demás.', 'Aguanta menos. Nunca rompe: si no hay hueco, sigue de largo. El alambrado y el barro le quitan su ventaja.', 'Alambrado y torreta.'],
      gordo: ['Gordo', 'Nunca rodea: va derecho y rompe todo lo que tiene delante.', 'Tres veces la vida del común y muerde más fuerte. Abre el laberinto para los demás. Aplasta alambrado y señuelo.', 'Lento, ve poco y es blanco fácil para los golpes fuertes.', 'Tanque y francotirador.'],
      acorazado: ['Acorazado', 'Como el común, con casco y escudo.', 'Blindaje: la torreta le hace la mitad y el fusil, un tercio. Tiene el doble de vida.', 'Lento. El escudo no frena al francotirador, al cañón, al fuego ni a las explosiones.', 'Francotirador y tanque; lanzallamas si llega cerca.'],
      griton: ['Gritón', 'Ve a 6 celdas y grita: delata a tu gente.', 'Los zombies a 5 celdas van por los humanos que él ve y se apuran 30 %. Descubre a francotiradores y morteros escondidos.', 'Casi no pelea y aguanta poco.', 'Francotirador, que lo elige primero; torreta si se acerca.'],
      hinchado: ['Hinchado', 'Camina hacia lo construido más cercano y estalla al tocarlo o al morir.', 'Su explosión destroza defensas amontonadas y mata a la infantería cercana.', 'Lento. La explosión también mata zombies: reventado lejos, limpia la horda. Va igual a un alambrado de $15 que a una torreta.', 'Francotirador de lejos; alambrado o señuelo de carnada; no amontones tus defensas.'],
      dinamitero: ['Dinamitero', 'Corre derecho al campamento y vuela la primera construcción que le corta el paso.', 'Le saca 120 de vida de un golpe a un muro, una torreta, un búnker o el tanque. Abre camino a los que vienen detrás.', 'Frágil. No ataca a la gente. A balazos cae sin estallar, y el alambrado lo deja bajo fuego.', 'Torreta y soldados; alambrado delante de lo que cierra el paso.'],
      toxico: ['Tóxico', 'Caza donde hay más gente junta; al morir deja una nube de gas 5 segundos.', 'El gas daña a la infantería y vacía los búnkeres de a uno. Quien muere por gas se contagia.', 'El gas no entra a las máquinas ni daña estructuras. Si muere lejos, no llega. El fuego enciende la nube.', 'Francotirador de lejos; tanque; un médico para aguantar.'],
      perro: ['Jauría', 'Cinco perros que huelen a la gente a pie a 6 celdas, aun detrás de un muro.', 'Muy rápidos. Rodean los muros y saltan el alambrado, los fardos y el tractor. Matan a un soldado suelto en un segundo.', 'Poca vida. A los protegidos ni los miran. No entran al agua ni cruzan el fuego.', 'Torreta; gente en búnker; lanzallamas.'],
      toro: ['Toro', 'Embiste en línea recta a la gente a pie.', 'Derriba y aturde 2 segundos a todos los que atropella. Cuatro veces la vida del común. Arranca el alambrado.', 'Avisa antes de cargar, sólo va derecho y queda quieto 2 segundos después. No toca muros, búnkeres ni máquinas. No cruza el fuego.', 'Gente en búnker o detrás de un muro; tanque y francotirador mientras está quieto.'],
      cuervo: ['Bandada', 'Seis cuervos que vuelan sobre todo y ven todo el campo.', 'Pasan sobre muros, agua y obstáculos. Picotean a la gente a pie; si no hay, cada uno le saca 1 al campamento.', 'Poca vida. No pueden con búnkeres ni máquinas.', 'Antiaérea; soldados dentro de un búnker.'],
      buitre: ['Buitre', 'Vuela hasta alguien a pie, lo levanta y lo suelta en medio de la horda.', 'Primero se lleva a los que más valen: francotirador, médico, lanzallamas. Nada que camine lo alcanza.', 'Lento y de a uno. No puede con los protegidos. Blanco grande para fusiles y antiaérea.', 'Antiaérea; un soldado que cubra a tu tirador; búnker.'],
      soldadoZombie: ['Soldado zombie', 'Es tu soldado contagiado: se levanta a los 3 segundos de caer.', 'Conserva casco y chaleco: blindaje 1 y más vida que un común.', 'Sólo aparece si pierdes gente. Con un médico cerca, el que cae no se contagia.', 'No pierdas infantería: búnker, muro de escudo y médico.'],
      topo: ['Topo', 'Se entierra al entrar y avanza por debajo de todo; sale junto a lo que tienes más atrás.', 'Bajo tierra nadie le puede tirar. Pasa por debajo de muros, alambrado y unidades. Va por morteros, francotiradores, médicos y antiaéreas, y muerde el doble.', 'Al salir tarda un segundo y queda a tiro. La torre de vigía y el tanque lo obligan a salir antes, encandilado; el señuelo lo engaña.', 'Torre de vigía adelante, para que salga en tu zona de fuego; tanque; señuelo; lanzallamas junto a lo de atrás.'],
      lanzador: ['Lanzador', 'Agarra al zombie que tiene al lado y lo arroja por encima de tus muros, hasta 7 celdas, junto a lo que tienes más atrás.', 'Tus muros no protegen de lo que cae del cielo. Si no tiene a quién arrojar, tira cascotes a lo construido. Mucha vida.', 'Lento. El arrojado cae lastimado y aturdido, y no puede con un búnker.', 'Francotiradores dentro de un búnker, o el tanque con francotiradores: lo que cae no puede con los protegidos.'],
      escupidor: ['Escupidor', 'Se planta a 5 celdas y escupe ácido en arco: un charco que quema a la gente y a lo construido.', 'Tira desde más lejos que el soldado y la torreta, que no le llegan. El ácido desarma torretas y búnkeres.', 'Poca vida y se queda quieto: el francotirador lo baja de uno o dos tiros. El charco dura poco. Le escupe a la gente, no a un muro pelado.', 'Francotirador; el tanque, que tira tan lejos como él.'],
      rabioso: ['Rabioso', 'Corre al doble que un perro, en zigzag, directo al campamento. No se detiene por nadie.', 'Vienen de a cuatro. El tiro del francotirador y el cañón le erran más de la mitad de las veces, y la granada nunca llega a tiempo.', 'Poca vida. El alambrado y el barro lo frenan como a todos. No ataca a tu gente.', 'Lanzallamas en fila en el paso; varias torretas con alambrado.'],
      jefe: ['El Coloso', 'Jefe de las oleadas 6 y 12: va derecho, rompe todo y arroja fardos a lo que tiene a 5 celdas.', 'Tiene 22 veces la vida del común y muerde el triple. Sus fardos golpean a todo lo que está junto. Si entra, le saca 8 al campamento.', 'Muy lento.', 'Fuego concentrado: tanque, francotiradores y todo lo que haya. No amontones tus defensas.'],
    },
  },
  pt: {
    u: {
      soldado: ['Soldado raso', 'Atira com um fuzil de alcance médio.', 'Barato e rápido de formar. Atira no que anda e no que voa. Enche os bunkers.', 'É visto logo e aguenta pouco. Contra blindagem, suas balas fazem um terço.', 'Nunca solto na linha de frente: atrás de um muro ou dentro de um bunker.'],
      francotirador: ['Atirador de elite', 'Abate com um tiro forte e distante a cada 3 segundos.', 'Atira de fora da visão de quase todos. Ignora a blindagem e escolhe sozinho o mais perigoso. Também derruba abutres.', 'Um alvo por vez: a horda passa por cima. Aguenta muito pouco. O gritador o denuncia, os cães o farejam e o abutre o leva.', 'Longe da frente, com algo que o cubra, ou dentro de um bunker.'],
      lanzallamas: ['Lança-chamas', 'Queima todos a até 2 casas e os deixa em chamas.', 'Acerta o grupo inteiro de uma vez e o fogo ignora a blindagem. Cães e touro não cruzam o fogo.', 'Está sempre à vista. Não alcança o que voa. Faz o inchado e o dinamitador explodirem na cara dele e acende o gás.', 'No vão por onde a horda passa, atrás de um muro ou de arame farpado.'],
      medico: ['Médico', 'Cura a infantaria a até 2 casas. Não atira.', 'Quem cai ao lado dele não se contagia. Com ele por perto, o gás não esvazia os bunkers.', 'Não causa dano e é presa como qualquer um. Não conserta máquinas nem estruturas.', 'Junto do seu pessoal ou dentro de um bunker, do lado do acampamento.'],
      torreta: ['Torre', 'Varre com rajadas de metralhadora.', 'Muito fogo: nada rápido escapa. Acaba com matilhas, corredores e dinamitadores.', 'Balas pequenas: contra blindagem rende a metade. Não mira para o ar. Atrai a horda e não se move.', 'Atrás de arame farpado ou de um muro, apontando para o vão.'],
      tanque: ['Tanque', 'Aguenta na frente e derruba os pesados com o canhão.', 'Tem 400 de vida e as mordidas fazem um terço. O canhão ignora a blindagem e busca quem mais aguenta. O gás não entra. Pode se mover. Pelo peso, nenhuma toupeira passa por baixo a até 2 casas.', 'Um só alvo por disparo: não para uma horda nem uma matilha. O inchado e o dinamitador o procuram. Nada contra o que voa. Caro.', 'De âncora na frente: a horda para nele enquanto o resto atira.'],
      mortero: ['Morteiro', 'Bombardeia com granadas que explodem em área.', 'Atira de 4 a 9 casas, por cima dos muros e de fora da visão. Castiga o grupo que parou.', 'A granada leva 1,5 segundo: erra o que é rápido. Cego a menos de 4 casas. Nada contra o que voa.', 'Bem atrás, apontando para onde a horda para: um bunker, o tanque ou uma isca.'],
      antiaerea: ['Antiaérea', 'Derruba o que voa com rajadas que explodem no ar.', 'Limpa um bando inteiro e derruba o abutre. Alcança 6 casas.', 'Não abaixa o canhão: inútil contra o que anda.', 'Perto do acampamento e no centro: tudo o que voa acaba passando por ali.'],
      muro: ['Muro', 'Bloqueia a passagem.', 'Barato e resistente. Desvia quem não vê ninguém e é o escudo de quem está atrás. Cães e touro não passam.', 'O dinamitador o explode e o gordo o quebra. O que voa o ignora. Não dá para fechar a passagem de vez.', 'Na frente do seu pessoal, não ao lado.'],
      alambrado: ['Arame farpado', 'Freia e fere sem bloquear.', 'Os zumbis o cruzam a menos da metade da velocidade e perdem um quinto da vida. Vai na lama. Isca para o inchado.', 'Gasta: umas 20 pisadas. Os cães o pulam, o gordo o esmaga e o touro o arranca.', 'Sob o fogo das suas torres, duas casas à frente do que é valioso.'],
      bunker: ['Bunker', 'Protege até 4 de infantaria, que atiram de dentro.', 'Lá dentro não são mordidos, nem bicados, nem levados, e atiram 20 % mais longe. Aguenta muito e segura a horda onde convém.', 'O inchado e o dinamitador o procuram. O gás entra. Se cair, o pessoal fica a pé no meio da horda.', 'De âncora na frente, cheio de soldados; com um médico dentro se vierem tóxicos.'],
      senuelo: ['Isca', 'Alto-falante que chama os caminhantes.', 'Comuns, corredores e blindados a até 5 casas largam o que estiverem fazendo, até de morder, e batem nele por 5 segundos. Isca para o inchado. A toupeira sai junto dele em vez de junto do seu pessoal.', 'Gasta: distrai uns 20. Não engana o mesmo duas vezes. Não chama animais nem especiais, e o gordo o esmaga.', 'Onde o morteiro e as torres apontam, longe do seu pessoal.'],
      vigia: ['Torre de vigia', 'Descobre as toupeiras enterradas a até 4 casas e as obriga a sair.', 'Barata. A toupeira que passa pela zona dela sai ofuscada, na mira de todos, antes de chegar ao que você tem atrás.', 'Não atira nem segura ninguém: sem armas por perto, só avisa. O dinamitador e o inchado a explodem.', 'Atrás da sua linha, cobrindo morteiros, atiradores de elite e antiaéreas.'],
    },
    z: {
      caminante: ['Comum', 'Vai atrás do primeiro humano que vê a até 3 casas; se não vê ninguém, vai para o acampamento.', 'Vem em grande número e contagia. Quebra o muro que esconde a presa.', 'Lento e sem proteção. Amontoa-se: fogo e granadas o varrem. Segue qualquer isca.', 'Morteiro ou lança-chamas onde ele para; isca para levá-lo aonde quiser.'],
      corredor: ['Corredor', 'Vê a até 4 casas e contorna os muros procurando o vão.', 'Rápido: passa pouco tempo sob fogo e chega antes dos outros.', 'Aguenta menos. Nunca quebra: sem vão, segue em frente. O arame farpado e a lama tiram a vantagem dele.', 'Arame farpado e torre.'],
      gordo: ['Gordo', 'Nunca contorna: vai reto e quebra tudo o que tem pela frente.', 'Três vezes a vida do comum e morde mais forte. Abre o labirinto para os outros. Esmaga arame farpado e isca.', 'Lento, vê pouco e é alvo fácil para golpes fortes.', 'Tanque e atirador de elite.'],
      acorazado: ['Blindado', 'Como o comum, com capacete e escudo.', 'Blindagem: a torre faz a metade e o fuzil, um terço. Tem o dobro de vida.', 'Lento. O escudo não segura o atirador de elite, o canhão, o fogo nem as explosões.', 'Atirador de elite e tanque; lança-chamas se chegar perto.'],
      griton: ['Gritador', 'Vê a até 6 casas e grita: denuncia o seu pessoal.', 'Os zumbis a até 5 casas vão atrás dos humanos que ele vê e aceleram 30 %. Revela atiradores e morteiros escondidos.', 'Quase não luta e aguenta pouco.', 'Atirador de elite, que o escolhe primeiro; torre se chegar perto.'],
      hinchado: ['Inchado', 'Anda até a construção mais próxima e explode ao tocá-la ou ao morrer.', 'A explosão destrói defesas amontoadas e mata a infantaria por perto.', 'Lento. A explosão também mata zumbis: estourado longe, limpa a horda. Vai tanto a um arame de $15 quanto a uma torre.', 'Atirador de elite de longe; arame farpado ou isca como chamariz; não amontoe as defesas.'],
      dinamitero: ['Dinamitador', 'Corre reto para o acampamento e explode a primeira construção que fecha o caminho.', 'Tira 120 de vida de uma vez de um muro, uma torre, um bunker ou do tanque. Abre caminho para os que vêm atrás.', 'Frágil. Não ataca pessoas. A tiros cai sem explodir, e o arame farpado o deixa sob fogo.', 'Torre e soldados; arame farpado na frente do que fecha a passagem.'],
      toxico: ['Tóxico', 'Caça onde há mais gente junta; ao morrer deixa uma nuvem de gás por 5 segundos.', 'O gás fere a infantaria e esvazia os bunkers um a um. Quem morre pelo gás se contagia.', 'O gás não entra nas máquinas nem fere estruturas. Se morrer longe, não chega. O fogo acende a nuvem.', 'Atirador de elite de longe; tanque; um médico para aguentar.'],
      perro: ['Matilha', 'Cinco cães que farejam quem está a pé a até 6 casas, mesmo atrás de um muro.', 'Muito rápidos. Contornam os muros e pulam o arame farpado, os fardos e o trator. Matam um soldado solto em um segundo.', 'Pouca vida. Nem olham para os protegidos. Não entram na água nem cruzam o fogo.', 'Torre; pessoal em bunker; lança-chamas.'],
      toro: ['Touro', 'Investe em linha reta contra quem está a pé.', 'Derruba e atordoa por 2 segundos todos os que atropela. Quatro vezes a vida do comum. Arranca o arame farpado.', 'Avisa antes de investir, só vai reto e fica parado 2 segundos depois. Não toca muros, bunkers nem máquinas. Não cruza o fogo.', 'Pessoal em bunker ou atrás de um muro; tanque e atirador de elite enquanto ele está parado.'],
      cuervo: ['Bando', 'Seis corvos que voam por cima de tudo e veem o campo inteiro.', 'Passam sobre muros, água e obstáculos. Bicam quem está a pé; se não houver ninguém, cada um tira 1 do acampamento.', 'Pouca vida. Não podem com bunkers nem máquinas.', 'Antiaérea; soldados dentro de um bunker.'],
      buitre: ['Abutre', 'Voa até alguém a pé, levanta-o e o solta no meio da horda.', 'Leva primeiro os que mais valem: atirador de elite, médico, lança-chamas. Nada que anda o alcança.', 'Lento e um por vez. Não pode com os protegidos. Alvo grande para fuzis e antiaérea.', 'Antiaérea; um soldado cobrindo o seu atirador; bunker.'],
      soldadoZombie: ['Soldado zumbi', 'É o seu soldado contagiado: levanta 3 segundos depois de cair.', 'Mantém capacete e colete: blindagem 1 e mais vida que um comum.', 'Só aparece se você perder gente. Com um médico por perto, quem cai não se contagia.', 'Não perca infantaria: bunker, muro de escudo e médico.'],
      topo: ['Toupeira', 'Enterra-se ao entrar e avança por baixo de tudo; sai junto do que você tem mais atrás.', 'Debaixo da terra ninguém consegue atirar nela. Passa por baixo de muros, arame farpado e unidades. Vai atrás de morteiros, atiradores de elite, médicos e antiaéreas, e morde em dobro.', 'Ao sair demora um segundo e fica na mira. A torre de vigia e o tanque a obrigam a sair antes, ofuscada; a isca a engana.', 'Torre de vigia na frente, para que ela saia na sua zona de fogo; tanque; isca; lança-chamas junto do que está atrás.'],
      lanzador: ['Arremessador', 'Agarra o zumbi ao lado e o arremessa por cima dos seus muros, até 7 casas, junto do que você tem mais atrás.', 'Seus muros não protegem do que cai do céu. Se não tiver quem arremessar, joga entulho nas construções. Muita vida.', 'Lento. O arremessado cai ferido e atordoado, e não pode com um bunker.', 'Atiradores de elite dentro de um bunker, ou o tanque com atiradores: o que cai não pode com os protegidos.'],
      escupidor: ['Cuspidor', 'Para a 5 casas e cospe ácido em arco: uma poça que queima pessoas e construções.', 'Atira de mais longe que o soldado e a torre, que não o alcançam. O ácido desmonta torres e bunkers.', 'Pouca vida e fica parado: o atirador de elite o derruba com um ou dois tiros. A poça dura pouco. Cospe nas pessoas, não em um muro vazio.', 'Atirador de elite; o tanque, que atira tão longe quanto ele.'],
      rabioso: ['Raivoso', 'Corre o dobro de um cão, em zigue-zague, direto para o acampamento. Não para por ninguém.', 'Vêm de quatro em quatro. O tiro do atirador de elite e o canhão erram mais da metade das vezes, e a granada nunca chega a tempo.', 'Pouca vida. O arame farpado e a lama o freiam como a todos. Não ataca o seu pessoal.', 'Lança-chamas em fila na passagem; várias torres com arame farpado.'],
      jefe: ['O Colosso', 'Chefe das ondas 6 e 12: vai reto, quebra tudo e arremessa fardos no que estiver a até 5 casas.', 'Tem 22 vezes a vida do comum e morde o triplo. Os fardos acertam tudo o que está junto. Se entrar, tira 8 do acampamento.', 'Muito lento.', 'Fogo concentrado: tanque, atiradores de elite e tudo o que houver. Não amontoe as defesas.'],
    },
  },
  en: {
    u: {
      soldado: ['Rifleman', 'Fires a medium-range rifle.', 'Cheap and quick to train. Shoots at what walks and what flies. Fills bunkers.', 'Spotted right away and fragile. Against armor, his bullets do a third.', 'Never loose on the front line: behind a wall or inside a bunker.'],
      francotirador: ['Sniper', 'Takes one hard, long shot every 3 seconds.', 'Shoots from outside almost everyone’s sight. Ignores armor and picks the most dangerous target himself. Also brings down vultures.', 'One target at a time: the horde walks over him. Very fragile. The screamer gives him away, dogs smell him and the vulture carries him off.', 'Far from the front, with something covering him, or inside a bunker.'],
      lanzallamas: ['Flamethrower', 'Burns everyone within 2 cells and leaves them on fire.', 'Hits the whole pack at once and fire ignores armor. Dogs and the bull will not cross fire.', 'Always in sight. Cannot reach what flies. Makes the bloater and the dynamiter blow up in his face, and ignites gas.', 'In the gap the horde walks through, behind a wall or barbed wire.'],
      medico: ['Medic', 'Heals infantry within 2 cells. Does not shoot.', 'Whoever falls next to him is not infected. With him nearby, gas does not empty bunkers.', 'Deals no damage and is prey like anyone else. Does not fix machines or structures.', 'Right next to your people or inside a bunker, on the camp side.'],
      torreta: ['Turret', 'Sweeps with machine-gun bursts.', 'Lots of fire: nothing fast gets away. Finishes packs, runners and dynamiters.', 'Small bullets: half effect against armor. Cannot aim at the sky. Draws the horde and does not move.', 'Behind barbed wire or a wall, aimed at the gap.'],
      tanque: ['Tank', 'Holds the front and knocks down the heavy ones with its cannon.', 'It has 400 health and bites do a third. Its cannon ignores armor and goes for whoever has the most health. Gas cannot get in. It can move. Because of its weight, no mole gets underneath within 2 cells.', 'A single target per shot: it will not stop a horde or a pack. The bloater and the dynamiter go for it. Nothing against flyers. Expensive.', 'As a forward anchor: the horde stalls against it while everything else fires.'],
      mortero: ['Mortar', 'Shells an area with grenades.', 'Fires from 4 to 9 cells, over walls and from out of sight. Punishes the pack that stalled.', 'The shell takes 1.5 seconds: it misses fast targets. Blind under 4 cells. Nothing against flyers.', 'Far back, aimed where the horde stalls: a bunker, the tank or a decoy.'],
      antiaerea: ['Anti-air gun', 'Brings down flyers with bursts that explode in the air.', 'Clears a whole flock and brings down the vulture. Reaches 6 cells.', 'It cannot lower its barrels: useless against what walks.', 'Near the camp and in the middle: everything that flies ends up passing there.'],
      muro: ['Wall', 'Blocks the way.', 'Cheap and sturdy. Diverts those who see nobody and shields whoever is behind it. Dogs and the bull cannot get past.', 'The dynamiter blows it up and the fat one breaks it. Flyers ignore it. You cannot close the way completely.', 'In front of your people, not beside them.'],
      alambrado: ['Barbed wire', 'Slows and hurts without blocking.', 'Zombies cross it at less than half speed and lose a fifth of their health. Goes on mud. Bait for the bloater.', 'It wears out: about 20 crossings. Dogs jump it, the fat one flattens it and the bull rips it out.', 'Under your turrets’ fire, two cells ahead of what matters.'],
      bunker: ['Bunker', 'Shelters up to 4 infantry, who shoot from inside.', 'Inside they cannot be bitten, pecked or carried off, and they shoot 20% farther. Very sturdy and stalls the horde where you want.', 'The bloater and the dynamiter go for it. Gas gets in. If it falls, its people are left on foot among the horde.', 'As a forward anchor, full of riflemen; with a medic inside if toxics are coming.'],
      senuelo: ['Decoy', 'Loudspeaker that calls walkers.', 'Walkers, runners and armored ones within 5 cells drop whatever they are doing, biting included, and hit it for 5 seconds. Bait for the bloater. The mole surfaces next to it instead of next to your people.', 'It wears out: it distracts about 20. It never fools the same one twice. It does not call animals or specials, and the fat one flattens it.', 'Where the mortar and the turrets aim, away from your people.'],
      vigia: ['Watchtower', 'Spots buried moles within 4 cells and forces them to surface.', 'Cheap. A mole crossing its area comes up dazzled, in everyone’s sights, before reaching what you keep in the back.', 'It does not shoot or stop anyone: with no guns nearby, it only warns. The dynamiter and the bloater blow it up.', 'Behind your line, covering mortars, snipers and anti-air guns.'],
    },
    z: {
      caminante: ['Walker', 'Goes for the first human it sees within 3 cells; if it sees nobody, for the camp.', 'Comes in numbers and infects. Breaks the wall hiding its prey.', 'Slow and unprotected. It bunches up: fire and shells sweep it. Follows any decoy.', 'Mortar or flamethrower where it stalls; a decoy to lead it wherever you want.'],
      corredor: ['Runner', 'Sees 4 cells away and goes around walls looking for the gap.', 'Fast: spends little time under fire and arrives before the rest.', 'Less health. Never breaks anything: with no gap, it runs past. Barbed wire and mud take away its edge.', 'Barbed wire and turret.'],
      gordo: ['Fat one', 'Never goes around: walks straight and breaks whatever is in front.', 'Three times a walker’s health and a harder bite. Opens the maze for the rest. Flattens barbed wire and decoys.', 'Slow, short-sighted and an easy target for heavy hits.', 'Tank and sniper.'],
      acorazado: ['Armored', 'Like the walker, with helmet and shield.', 'Armor: the turret does half and the rifle a third. Twice the health.', 'Slow. The shield does not stop the sniper, the cannon, fire or explosions.', 'Sniper and tank; flamethrower if it gets close.'],
      griton: ['Screamer', 'Sees 6 cells away and screams: it gives your people away.', 'Zombies within 5 cells go for the humans it sees and speed up 30%. Reveals hidden snipers and mortars.', 'Barely fights and has little health.', 'Sniper, who picks it first; turret if it gets close.'],
      hinchado: ['Bloater', 'Walks to the nearest thing you built and blows up on touching it or on dying.', 'Its blast wrecks defenses packed together and kills nearby infantry.', 'Slow. The blast also kills zombies: popped far away, it clears the horde. It goes for a $15 wire just like for a turret.', 'Sniper from afar; barbed wire or a decoy as bait; do not pack your defenses together.'],
      dinamitero: ['Dynamiter', 'Runs straight for the camp and blows up the first building in its way.', 'Takes 120 health in one hit from a wall, a turret, a bunker or the tank. Opens the way for those behind.', 'Fragile. Does not attack people. Shot down, it falls without exploding, and barbed wire keeps it under fire.', 'Turret and riflemen; barbed wire in front of what closes the way.'],
      toxico: ['Toxic', 'Hunts where most people stand together; on dying it leaves a gas cloud for 5 seconds.', 'Gas hurts infantry and empties bunkers one by one. Whoever dies from gas is infected.', 'Gas does not get into machines or hurt structures. If it dies far away, the gas does not reach. Fire ignites the cloud.', 'Sniper from afar; tank; a medic to hold on.'],
      perro: ['Pack', 'Five dogs that smell people on foot from 6 cells, even behind a wall.', 'Very fast. They go around walls and jump barbed wire, hay bales and the tractor. They kill a loose soldier in a second.', 'Little health. They ignore the protected. They will not enter water or cross fire.', 'Turret; people in a bunker; flamethrower.'],
      toro: ['Bull', 'Charges in a straight line at people on foot.', 'Knocks down and stuns for 2 seconds everyone it runs over. Four times a walker’s health. Rips out barbed wire.', 'It warns before charging, only goes straight and stands still for 2 seconds afterwards. It does not touch walls, bunkers or machines. It will not cross fire.', 'People in a bunker or behind a wall; tank and sniper while it stands still.'],
      cuervo: ['Flock', 'Six crows that fly over everything and see the whole field.', 'They pass over walls, water and obstacles. They peck people on foot; if there are none, each takes 1 from the camp.', 'Little health. They can do nothing to bunkers or machines.', 'Anti-air gun; riflemen inside a bunker.'],
      buitre: ['Vulture', 'Flies to someone on foot, lifts him and drops him in the middle of the horde.', 'It takes the most valuable first: sniper, medic, flamethrower. Nothing that walks can reach it.', 'Slow and one at a time. It can do nothing to the protected. A big target for rifles and anti-air.', 'Anti-air gun; a rifleman covering your sniper; bunker.'],
      soldadoZombie: ['Zombie soldier', 'It is your infected soldier: it gets up 3 seconds after falling.', 'Keeps helmet and vest: armor 1 and more health than a walker.', 'It only shows up if you lose people. With a medic nearby, whoever falls is not infected.', 'Do not lose infantry: bunker, wall as a shield and medic.'],
      topo: ['Mole', 'Burrows on entering and advances under everything; it surfaces next to whatever you keep farthest back.', 'Underground nobody can shoot it. It passes under walls, barbed wire and units. It goes for mortars, snipers, medics and anti-air guns, and bites twice as hard.', 'Surfacing takes a second and leaves it exposed. The watchtower and the tank force it up early, dazzled; the decoy fools it.', 'Watchtower up front, so it surfaces in your kill zone; tank; decoy; flamethrower next to what you keep in the back.'],
      lanzador: ['Thrower', 'Grabs the zombie next to it and throws it over your walls, up to 7 cells, next to whatever you keep farthest back.', 'Your walls do not protect from what falls from the sky. With nobody to throw, it hurls rubble at what you built. Lots of health.', 'Slow. The thrown one lands hurt and stunned, and can do nothing to a bunker.', 'Snipers inside a bunker, or the tank with snipers: what lands cannot hurt the protected.'],
      escupidor: ['Spitter', 'Stops 5 cells away and spits acid in an arc: a puddle that burns people and buildings.', 'It shoots from farther than the rifleman and the turret, which cannot reach it. Acid takes apart turrets and bunkers.', 'Little health and it stands still: the sniper drops it in a shot or two. The puddle does not last. It spits at people, not at a bare wall.', 'Sniper; the tank, which shoots as far as it does.'],
      rabioso: ['Rabid', 'Runs twice as fast as a dog, zigzagging, straight for the camp. It stops for nobody.', 'They come in fours. The sniper’s shot and the cannon miss more than half the time, and the shell never arrives in time.', 'Little health. Barbed wire and mud slow it like everyone else. It does not attack your people.', 'Flamethrowers in a row in its way; several turrets with barbed wire.'],
      jefe: ['The Colossus', 'Boss of waves 6 and 12: walks straight, breaks everything and throws hay bales at whatever is within 5 cells.', 'It has 22 times a walker’s health and bites three times as hard. Its bales hit everything standing together. If it gets in, it takes 8 from the camp.', 'Very slow.', 'Focused fire: tank, snipers and everything you have. Do not pack your defenses together.'],
    },
  },
};
for (const [idioma, F] of Object.entries(FICHAS_B2)) for (const clase of ['u', 'z']) for (const [id, [nombre, hace, fuerte, debil, uso]] of Object.entries(F[clase])) {
  Object.assign(TEXTOS[idioma], { [`b2.${clase}.${id}`]: nombre, [`b2.${clase}.${id}.hace`]: hace, [`b2.${clase}.${id}.fuerte`]: fuerte, [`b2.${clase}.${id}.debil`]: debil, [`b2.${clase}.${id}.uso`]: uso });
}
Object.assign(TEXTOS.es, {
  'menu.bastion2': 'ÚLTIMO BASTIÓN V2',
  'bastion.alambrado': 'ALAMBRADO', 'bastion.senuelo': 'SEÑUELO', 'bastion.francotirador': 'TIRADOR', 'bastion.lanzallamas': 'LLAMAS', 'bastion.medico': 'MÉDICO', 'bastion.mortero': 'MORTERO', 'bastion.antiaerea': 'ANTIAÉREA', 'bastion.vigia': 'VIGÍA', 'bastion.mover': 'MOVER',
  'b2.titulo': 'ÚLTIMO BASTIÓN V2 · DOS BANDOS', 'b2.ayuda': 'Aguanta 12 oleadas en La granja. Cada oleada trae un tipo nuevo de zombie: mira el parte y arma la respuesta.',
  'b2.regla1': 'Ninguna unidad sirve contra todo. El blindaje frena las balas chicas, lo que vuela pasa sobre los muros y la granada falla contra lo rápido. Y no todos vienen de frente.',
  'b2.regla2': 'Los zombies ven. Van por tu gente y rompen lo que la protege; el que cae se levanta en tu contra a los 3 segundos.',
  'b2.regla3': 'Antes de cada oleada, el parte dice qué viene. Toca un tipo para ver con qué se lo frena.',
  'b2.horda': 'LA HORDA', 'b2.ejercito': 'EL BASTIÓN', 'b2.empezar': 'EMPEZAR', 'b2.continuar': 'SEGUIR EN LA OLEADA {ola} DE {total}',
  'b2.clase.inf': 'Infantería', 'b2.clase.mec': 'Mecanizados', 'b2.clase.est': 'Estructuras', 'b2.clase.cam': 'Caminantes', 'b2.clase.esp': 'Especiales', 'b2.clase.ani': 'Animales', 'b2.clase.ace': 'Acechadores',
  'b2.fuerte': 'FUERTE:', 'b2.debil': 'DÉBIL:', 'b2.frenar': 'CÓMO FRENARLO:', 'b2.usar': 'CÓMO USARLO:',
  'b2.loFrena': 'LO FRENA', 'b2.noSirve': 'NO SIRVE', 'b2.frenaA': 'FRENA A', 'b2.flojoContra': 'FLOJO CONTRA', 'b2.nuevo': 'NUEVO',
  'b2.parte': 'OLEADA {n}:', 'b2.teVen': 'DESDE AQUÍ LO VEN', 'b2.blando': 'Suelo blando: aquí sólo va gente a pie, alambrado o señuelo',
  'b2.contagiado': '¡Soldado contagiado!', 'b2.sinContagio': 'Cayó, pero el médico evitó el contagio', 'b2.baja': '¡Perdiste a uno de los tuyos!', 'b2.raptado': '¡El buitre se lleva a uno de los tuyos!',
  'b2.gasEncendido': '¡El fuego encendió el gas!', 'b2.nadaQueMover': 'Toca a alguien a pie, el tanque o un búnker con gente', 'b2.aviso': 'Mira el parte de arriba: dice qué viene en la próxima oleada',
  'b2.repetir': 'REPETIR LA OLEADA {n}', 'b2.deCero': 'DESDE EL PRINCIPIO',
  'b2.finGanado': 'Resististe las {olas} oleadas de {nivel} con el campamento en {base}/{max}: {bajas} zombies muertos y {contagiados} soldados contagiados, en {tiempo}.',
  'b2.finPerdido': 'El campamento de {nivel} cayó en la oleada {ola} de {total}. Entraron: {lista}. Soldados contagiados: {contagiados}. Tiempo: {tiempo}.',
  'b2.consejo': 'Contra {tipo} sirve: {con}.',
});
Object.assign(TEXTOS.pt, {
  'menu.bastion2': 'ÚLTIMO BASTIÃO V2',
  'bastion.alambrado': 'ARAME', 'bastion.senuelo': 'ISCA', 'bastion.francotirador': 'ATIRADOR', 'bastion.lanzallamas': 'CHAMAS', 'bastion.medico': 'MÉDICO', 'bastion.mortero': 'MORTEIRO', 'bastion.antiaerea': 'ANTIAÉREA', 'bastion.vigia': 'VIGIA', 'bastion.mover': 'MOVER',
  'b2.titulo': 'ÚLTIMO BASTIÃO V2 · DOIS LADOS', 'b2.ayuda': 'Aguente 12 ondas em A fazenda. Cada onda traz um tipo novo de zumbi: veja o relatório e monte a resposta.',
  'b2.regla1': 'Nenhuma unidade serve contra tudo. A blindagem segura as balas pequenas, o que voa passa por cima dos muros e a granada erra o que é rápido. E nem todos vêm de frente.',
  'b2.regla2': 'Os zumbis veem. Vão atrás do seu pessoal e quebram o que o protege; quem cai se levanta contra você em 3 segundos.',
  'b2.regla3': 'Antes de cada onda, o relatório diz o que vem. Toque em um tipo para ver o que o segura.',
  'b2.horda': 'A HORDA', 'b2.ejercito': 'O BASTIÃO', 'b2.empezar': 'COMEÇAR', 'b2.continuar': 'CONTINUAR NA ONDA {ola} DE {total}',
  'b2.clase.inf': 'Infantaria', 'b2.clase.mec': 'Mecanizados', 'b2.clase.est': 'Estruturas', 'b2.clase.cam': 'Caminhantes', 'b2.clase.esp': 'Especiais', 'b2.clase.ani': 'Animais', 'b2.clase.ace': 'Espreitadores',
  'b2.fuerte': 'FORTE:', 'b2.debil': 'FRACO:', 'b2.frenar': 'COMO PARÁ-LO:', 'b2.usar': 'COMO USAR:',
  'b2.loFrena': 'O QUE O PARA', 'b2.noSirve': 'NÃO SERVE', 'b2.frenaA': 'PARA', 'b2.flojoContra': 'FRACO CONTRA', 'b2.nuevo': 'NOVO',
  'b2.parte': 'ONDA {n}:', 'b2.teVen': 'DAQUI ELES O VEEM', 'b2.blando': 'Solo mole: aqui só vai gente a pé, arame farpado ou isca',
  'b2.contagiado': 'Soldado contagiado!', 'b2.sinContagio': 'Caiu, mas o médico evitou o contágio', 'b2.baja': 'Você perdeu um dos seus!', 'b2.raptado': 'O abutre está levando um dos seus!',
  'b2.gasEncendido': 'O fogo acendeu o gás!', 'b2.nadaQueMover': 'Toque em alguém a pé, no tanque ou em um bunker com gente', 'b2.aviso': 'Veja o relatório acima: ele diz o que vem na próxima onda',
  'b2.repetir': 'REPETIR A ONDA {n}', 'b2.deCero': 'DESDE O COMEÇO',
  'b2.finGanado': 'Você resistiu às {olas} ondas de {nivel} com o acampamento em {base}/{max}: {bajas} zumbis mortos e {contagiados} soldados contagiados, em {tiempo}.',
  'b2.finPerdido': 'O acampamento de {nivel} caiu na onda {ola} de {total}. Entraram: {lista}. Soldados contagiados: {contagiados}. Tempo: {tiempo}.',
  'b2.consejo': 'Contra {tipo} serve: {con}.',
});
Object.assign(TEXTOS.en, {
  'menu.bastion2': 'LAST BASTION V2',
  'bastion.alambrado': 'WIRE', 'bastion.senuelo': 'DECOY', 'bastion.francotirador': 'SNIPER', 'bastion.lanzallamas': 'FLAMER', 'bastion.medico': 'MEDIC', 'bastion.mortero': 'MORTAR', 'bastion.antiaerea': 'ANTI-AIR', 'bastion.vigia': 'WATCH', 'bastion.mover': 'MOVE',
  'b2.titulo': 'LAST BASTION V2 · TWO SIDES', 'b2.ayuda': 'Hold out for 12 waves at The farm. Each wave brings a new zombie type: check the report and build the answer.',
  'b2.regla1': 'No unit works against everything. Armor stops small bullets, flyers pass over walls and shells miss fast targets. And not all of them come head-on.',
  'b2.regla2': 'Zombies can see. They go for your people and break whatever protects them; whoever falls gets up against you in 3 seconds.',
  'b2.regla3': 'Before each wave, the report says what is coming. Tap a type to see what stops it.',
  'b2.horda': 'THE HORDE', 'b2.ejercito': 'THE BASTION', 'b2.empezar': 'START', 'b2.continuar': 'CONTINUE AT WAVE {ola} OF {total}',
  'b2.clase.inf': 'Infantry', 'b2.clase.mec': 'Mechanized', 'b2.clase.est': 'Structures', 'b2.clase.cam': 'Walkers', 'b2.clase.esp': 'Specials', 'b2.clase.ani': 'Animals', 'b2.clase.ace': 'Stalkers',
  'b2.fuerte': 'STRONG:', 'b2.debil': 'WEAK:', 'b2.frenar': 'HOW TO STOP IT:', 'b2.usar': 'HOW TO USE IT:',
  'b2.loFrena': 'STOPPED BY', 'b2.noSirve': 'NO USE', 'b2.frenaA': 'STOPS', 'b2.flojoContra': 'WEAK AGAINST', 'b2.nuevo': 'NEW',
  'b2.parte': 'WAVE {n}:', 'b2.teVen': 'THEY SEE IT FROM HERE', 'b2.blando': 'Soft ground: only people on foot, barbed wire or a decoy can go here',
  'b2.contagiado': 'Soldier infected!', 'b2.sinContagio': 'He fell, but the medic prevented the infection', 'b2.baja': 'You lost one of yours!', 'b2.raptado': 'The vulture is carrying off one of yours!',
  'b2.gasEncendido': 'Fire ignited the gas!', 'b2.nadaQueMover': 'Tap someone on foot, the tank or a bunker with people in it', 'b2.aviso': 'Check the report at the top: it says what the next wave brings',
  'b2.repetir': 'REPLAY WAVE {n}', 'b2.deCero': 'FROM THE START',
  'b2.finGanado': 'You held out for the {olas} waves of {nivel} with the camp at {base}/{max}: {bajas} zombies killed and {contagiados} soldiers infected, in {tiempo}.',
  'b2.finPerdido': 'The camp at {nivel} fell on wave {ola} of {total}. They got in: {lista}. Soldiers infected: {contagiados}. Time: {tiempo}.',
  'b2.consejo': 'Against {tipo}, use: {con}.',
});
// Los textos con {llaves} toman sus valores al pedirlos (t('b2.parte', { n: 3 }))
for (const idioma of ['es', 'pt', 'en']) for (const k of Object.keys(TEXTOS[idioma])) {
  const v = TEXTOS[idioma][k];
  if (k.startsWith('b2.') && typeof v === 'string' && /\{\w+\}/.test(v)) TEXTOS[idioma][k] = p => v.replace(/\{(\w+)\}/g, (_, n) => p[n] ?? '');
}
