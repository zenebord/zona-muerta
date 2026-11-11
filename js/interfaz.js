/* ===== Interfaz: pantallas, panel de misiones, teclado y bucle principal ===== */
(() => {
  const lienzo = document.getElementById('lienzo');
  const pantallas = document.querySelectorAll('.pantalla');
  const capaPausa = document.getElementById('pausa');
  const capaFin = document.getElementById('fin');
  const capaPruebas = document.getElementById('menu-pruebas');
  let juego = null, misionActual = null, opcionesActuales = {}, pausado = false, ultimo = 0, cuadro = 0, menuPruebasAbierto = false;

  function mostrar(id) { pantallas.forEach(p => p.classList.toggle('visible', p.id === id)); }

  // El lienzo se dibuja a la resolución real de la pantalla (hasta 2× de 960×540) para que los bordes salgan nítidos
  function ajustarResolucion(forzar = false) {
    const proporcion = Math.min(21 / 9, Math.max(16 / 9, window.innerWidth / Math.max(1, window.innerHeight)));
    const ancho = Math.round(ALTO * proporcion / 2) * 2;
    if (ancho !== ANCHO) { try { ANCHO = ancho; forzar = true; } catch { /* terreno.js viejo en caché: queda en 16:9 */ } }
    document.documentElement.style.setProperty('--proporcion', String(ANCHO / ALTO));
    const anchoCss = Math.min(window.innerWidth, window.innerHeight * ANCHO / ALTO);
    const tope = Config.get('calidad') === 'normal' ? 1 : 2;   // calidad normal: sin alta resolución
    const escala = Math.max(1, Math.min(tope, anchoCss * (window.devicePixelRatio || 1) / ANCHO));
    if (!forzar && Math.abs(escala - Lienzo.escala) < 0.01 && lienzo.width === Math.round(ANCHO * escala)) return;
    Lienzo.escala = escala;
    lienzo.width = Math.round(ANCHO * escala); lienzo.height = Math.round(ALTO * escala);
  }
  window.addEventListener('resize', () => ajustarResolucion());

  /* ---- Panel de misiones ---- */
  function renderizarMisiones() {
    const hechas = ProgresoMisiones.cargar();
    const lista = document.getElementById('lista-misiones');
    lista.innerHTML = '';
    for (const m of MISIONES) {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-mision' + (hechas.has(m.id) ? ' completada' : '');
      const etiqueta = m.tiempoLimite
        ? `<span class="etiqueta tiempo">⏱ ${formatearTiempo(m.tiempoLimite)}</span>`
        : `<span class="etiqueta">${t(m.tipo === 'bajas' ? 'misiones.caceria' : m.tipo === 'conseguir' ? 'misiones.busqueda' : 'misiones.supervivencia')}</span>`;
      tarjeta.dataset.cumplida = t('misiones.cumplida');
      tarjeta.innerHTML = `<h3>${m.nombre}</h3><p>${m.descripcion}</p>${etiqueta}`;
      tarjeta.addEventListener('click', () => iniciar(m));
      lista.appendChild(tarjeta);
    }
  }

  /* ---- Partida ---- */
  function iniciar(mision, opciones = {}) {
    Audio_.activar();
    misionActual = mision || null;
    opcionesActuales = opciones;
    juego = new Juego(lienzo, misionActual, Dificultad.actual(), opciones);
    if (window.Tactil) Tactil.alEmpezar();   // en un teléfono: pantalla completa y apaisado (donde se pueda)
    pausado = false; menuPruebasAbierto = false;
    capaPausa.classList.add('oculta');
    capaFin.classList.add('oculta');
    capaPruebas.classList.add('oculta');
    mostrar('pantalla-juego');
    ajustarResolucion();
    document.body.classList.toggle('en-entrenamiento', !!opciones.entrenamiento);
    tituloPruebas();
    const tactil = document.body.classList.contains('tactil');
    juego.aviso(opciones.historia ? t('hist.aviso.inicio', { nombre: Historia.nombre(opciones.historia.nivel) }) : opciones.entrenamiento ? t(tactil ? 'aviso.entrenamientoTactil' : 'aviso.entrenamiento') : opciones.ultra ? t(tactil ? 'aviso.ultraTactil' : 'aviso.ultra') : opciones.torreta ? t(tactil ? 'aviso.torretaTactil' : 'aviso.torreta') : opciones.pruebas ? t(tactil ? 'aviso.pruebasTactil' : 'aviso.pruebas') : misionActual ? t('aviso.mision', { nombre: misionActual.nombre.toUpperCase() }) : opciones.mapa === 'cloaca' ? t('aviso.cloaca') : t('aviso.sobrevive'), 2500);
    // Música del escenario: la ciudad (pelea, misiones, torreta) o la cloaca; el galpón y el campo, sin música
    Musica.tocar(opciones.entrenamiento || opciones.pruebas ? null : opciones.historia ? 'retroAccion' : juego.cloaca ? 'cloaca' : 'ciudad');   // la historia, con música de 8 bits
    ultimo = performance.now();
    cancelAnimationFrame(cuadro);
    cuadro = requestAnimationFrame(bucle);
  }

  function bucle(t) {
    const dt = Math.min(0.05, (t - ultimo) / 1000);   // tope: si la pestaña se durmió, no saltar en el tiempo
    ultimo = t;
    if (!pausado && juego) {
      juego.actualizar(dt);
      juego.dibujar();
      if (juego.terminado) { mostrarFin(); return; }
    }
    cuadro = requestAnimationFrame(bucle);
  }

  const tituloPruebas = () => { document.getElementById('titulo-pruebas').textContent = t(opcionesActuales.entrenamiento ? 'pruebas.armas' : 'pruebas.titulo'); };

  function mostrarFin() {
    if (juego.historia && juego.resultado === 'nivel-superado') { Audio_.ambiente(0); document.getElementById('hud-aereo').classList.add('oculta'); Historia.nivelSuperado(juego); return; }
    Audio_.ambiente(0);
    Musica.detener(2.5);
    const dif = juego.dificultad.nombre.toLowerCase(), tiempo = formatearTiempo(juego.tiempoJugado);
    const titulo = document.getElementById('fin-titulo');
    const detalle = document.getElementById('fin-detalle');
    const resumen = t('fin.resumen', { ronda: juego.ronda, dificultad: dif, bajas: juego.bajas, tiempo, armas: juego.jugador.inventario.length });
    if (juego.resultado === 'mision-cumplida') { titulo.textContent = t('fin.cumplida'); titulo.style.color = '#4caf50'; detalle.textContent = `${misionActual.nombre}: ${misionActual.descripcion} ${resumen}`; }
    else if (juego.resultado === 'mision-fallida') { titulo.textContent = t('fin.tiempo'); titulo.style.color = '#ff8a65'; detalle.textContent = t('fin.fallida', { mision: misionActual.nombre, resumen }); }
    else if (juego.ultra) {
      // Récord de olas de la defensa ultra, por dificultad
      const clave = 'zonaMuerta.recordUltra.' + juego.dificultad.id;
      let record = 0; try { record = parseInt(localStorage.getItem(clave) || '0', 10) || 0; } catch { /* sin almacenamiento */ }
      const nuevo = juego.ronda > record;
      if (nuevo) { try { localStorage.setItem(clave, String(juego.ronda)); } catch { /* ídem */ } }
      titulo.textContent = juego.resultado === 'invadido' ? t('fin.invadido') : t('fin.ola', { ola: juego.ronda }); titulo.style.color = '';
      detalle.textContent = t('fin.ultra', { olas: Math.max(0, juego.ronda - 1), dificultad: dif, bajas: juego.bajas, dinero: juego.dinero, torretas: juego.torretas.length, tiempo }) + (nuevo ? t('fin.record') : t('fin.tuRecord', { ola: record }));
    }
    else if (juego.torreta) {
      // Récord de olas por dificultad, guardado en este navegador
      const clave = 'zonaMuerta.recordTorreta.' + juego.dificultad.id;
      let record = 0; try { record = parseInt(localStorage.getItem(clave) || '0', 10) || 0; } catch { /* sin almacenamiento */ }
      const nuevo = juego.ronda > record;
      if (nuevo) { try { localStorage.setItem(clave, String(juego.ronda)); } catch { /* ídem */ } }
      titulo.textContent = t('fin.ola', { ola: juego.ronda }); titulo.style.color = '';
      detalle.textContent = t('fin.torreta', { olas: Math.max(0, juego.ronda - 1), dificultad: dif, bajas: juego.bajas, tiempo }) + (nuevo ? t('fin.record') : t('fin.tuRecord', { ola: record }));
    }
    else if (juego.historia) {
      const H = juego.historia;
      titulo.textContent = t('hist.muerto'); titulo.style.color = '';
      detalle.textContent = t('hist.muertoDetalle', { n: H.n, nombre: Historia.nombre(H.n), km: juego.kmRestantes(), bajas: juego.bajas });
    }
    else { titulo.textContent = t('fin.devoraron'); titulo.style.color = ''; detalle.textContent = resumen; }
    capaFin.classList.remove('oculta');
  }

  function alternarPausa() {
    if (!juego || juego.terminado) return;
    pausado = !pausado;
    capaPausa.classList.toggle('oculta', !pausado);
    Musica.pausar(pausado);
    if (!pausado) ultimo = performance.now();
  }

  // Menú del campo de pruebas: el juego sigue corriendo abajo, pero las teclas de juego se bloquean
  function alternarMenuPruebas() {
    // Al abrir, queda marcada el arma que está en la mano
    if (juego && !menuPruebasAbierto) {
      const enMano = juego.jugador.montada ? null : juego.jugador.arma().id;
      document.querySelectorAll('#lista-armas-prueba [data-arma]').forEach(b => b.classList.toggle('en-mano', b.dataset.arma === enMano));
    }
    if (!juego || !(juego.pruebas || juego.entrenamiento) || juego.terminado) return;
    menuPruebasAbierto = !menuPruebasAbierto;
    ocultarDetalleArma();
    capaPruebas.classList.toggle('oculta', !menuPruebasAbierto);
    juego.entrada.derecha = juego.entrada.izquierda = juego.entrada.disparar = juego.entrada.abajo = false;
  }
  // Armas del menú de cajas, agrupadas por tipo; cada botón muestra la capacidad del arma
  const GRUPOS_PRUEBA = [
    ['grupo.0', id => ARMAS[id].categoria === 'pistola'],
    ['grupo.1', id => ARMAS[id].categoria === 'metralleta'],
    ['grupo.2', id => ARMAS[id].categoria === 'rifle'],
    ['grupo.3', id => ARMAS[id].categoria === 'escopeta'],
    ['grupo.4', id => ARMAS_ESPECIALES.includes(id)],
    ['grupo.5', id => ARMAS[id].categoria === 'cuerpo'],
    ['grupo.6', id => ARMAS[id].categoria === 'legendaria'],
  ];
  const UNIDAD = { granada: 'granadas', laser: 'disparos', lanzagranadas: 'granada', bazuca: 'cohete', escopeta: 'cartuchos' };
  function renderizarArmasPrueba() {
    const lista = document.getElementById('lista-armas-prueba');
    lista.innerHTML = '';
    for (const [clave, pertenece] of GRUPOS_PRUEBA) {
      const ids = ORDEN_INVENTARIO.filter(pertenece);
      const grupo = document.createElement('section');
      grupo.className = 'grupo-armas' + (clave === 'grupo.4' ? ' especiales' : clave === 'grupo.6' ? ' legendarias' : '');
      grupo.innerHTML = `<h3>${t(clave).toUpperCase()} <span>${ids.length}</span></h3>`;
      const rejilla = document.createElement('div');
      rejilla.className = 'rejilla-armas';
      for (const id of ids) {
        const a = ARMAS[id], b = document.createElement('button');
        b.className = 'boton-arma' + (ARMAS_ESPECIALES.includes(id) ? ' especial' : a.legendaria ? ' legendaria' : '');
        b.dataset.arma = id;
        b.innerHTML = a.cuerpo ? `${a.nombre}<small>${a.legendaria ? t('poder.' + a.poder) : t('hud.golpes', { n: disparosParaMatar(a) })}</small>`
          : `${a.nombre}<small>${a.cargador} ${t('unidad.' + (a.cargador === 1 ? (UNIDAD[a.categoria] || 'bala') : (UNIDAD[a.categoria] || 'balas')))}</small>`;
        rejilla.appendChild(b);
      }
      grupo.appendChild(rejilla);
      lista.appendChild(grupo);
    }
  }

  /* ---- Ficha del arma: imagen, descripción real, datos de juego y USAR ---- */
  let armaEnDetalle = null;
  const MODOS_MANUALES = { cerrojo: 'modo.cerrojo', bombeo: 'modo.bombeo', palanca: 'modo.palanca' };
  const VIDA_TOXICO = () => Math.round(DIFICULTADES.medio.vidaZombie * 1.35);
  const m = unidades => Math.round(unidades / 44 * 10) / 10;   // 1 m ≈ 44 unidades del juego
  function filasFicha(id) {
    const a = ARMAS[id], f = FICHAS[id], filas = [];
    if (f) { filas.push([t('detalle.origen'), enIdioma(ORIGENES[f[0]] || f[0])], [t('detalle.anio'), f[1]], [t(a.cuerpo ? 'detalle.medida' : 'detalle.municion'), enIdioma(f[2])]); }
    filas.push([t('detalle.dano'), a.perdigones ? t('detalle.danoPerdigones', { dano: a.dano, n: a.perdigones }) : String(a.dano), true]);
    const porDif = ['facil', 'medio', 'dificil'].map(d => `${DIFICULTADES[d].nombre} ${disparosParaMatar(a, DIFICULTADES[d].vidaZombie)}`).join(' · ');
    filas.push([t(a.cuerpo ? 'detalle.matarGolpes' : 'detalle.matar'), porDif, true, true]);
    filas.push([t('detalle.toxico'), String(disparosParaMatar(a, VIDA_TOXICO()))]);
    if (a.cuerpo) {
      filas.push([t('detalle.ritmoGolpe'), `${Math.round(60000 / a.cadencia)}/min`]);
      filas.push([t('detalle.alcanceGolpe'), `${m(a.alcance).toLocaleString(Idioma.actual())} m`]);
      filas.push([t('detalle.objetivos'), String(a.objetivos)]);
      filas.push([t('detalle.empuje'), t(a.empuje >= 5 ? 'nivel.alto' : a.empuje >= 3 ? 'nivel.medio' : 'nivel.bajo')]);
      filas.push([t('detalle.modo'), t(a.poder === 'escudo' || a.poder === 'lanza' ? 'modo.lanzar' : 'modo.golpe')]);
      if (a.poder) filas.push([t('detalle.poder'), t('poder.' + a.poder), true]);
      return filas;
    }
    const unidad = a.cargador === 1 ? (UNIDAD[a.categoria] || 'bala') : (UNIDAD[a.categoria] || 'balas');
    filas.push([t('detalle.cargador'), `${a.cargador} ${t('unidad.' + unidad)}`]);
    if (a.reservaInicial !== undefined) filas.push([t('detalle.reserva'), String(a.reservaInicial)]);
    filas.push([t('detalle.cadencia'), `${Math.round(60000 / a.cadencia)}/min`]);
    const manual = MODOS_MANUALES[ACCION_MANUAL[id]];
    filas.push([t('detalle.modo'), t(manual || (a.automatica ? 'modo.auto' : a.cargador === 1 ? 'modo.tiro' : a.recargaTipo === 'tambor' || a.recargaTipo === 'tambor-rapido' ? 'modo.revolver' : 'modo.semi'))]);
    filas.push([t('detalle.recarga'), `${(a.recarga / 1000).toLocaleString(Idioma.actual())} s · ${t('recargaTipo.' + a.recargaTipo)}`]);
    filas.push([t('detalle.alcance'), `${Math.round(m(a.alcance))} m`]);
    if (a.explosivo) filas.push([t('detalle.explosion'), t('detalle.radio', { m: m(a.radio).toLocaleString(Idioma.actual()) })]);
    if (a.perfora) filas.push([t('detalle.perfora'), t('detalle.perforaSi')]);
    const r = FUERZA_RETROCESO_ARMA[id] ?? FUERZA_RETROCESO[a.categoria] ?? 0.6;
    filas.push([t('detalle.retroceso'), t(r >= 1.1 ? 'nivel.alto' : r >= 0.6 ? 'nivel.medio' : 'nivel.bajo')]);
    return filas;
  }
  // Dibuja el arma entera, centrada y lo más grande posible: primero en un lienzo aparte, en chico, para medir
  // dónde quedó; después otra vez directo en la ficha al tamaño final, así no se estira una imagen chica
  // (una pistola se agrandaba unas cinco veces y quedaba borrosa) y el acabado del material sale nítido
  function dibujarFicha(id) {
    const lienzoFicha = document.getElementById('detalle-vista'), c = lienzoFicha.getContext('2d');
    const a = ARMAS[id], d = DIBUJO_ARMAS[id], PX = 8;   // 8 píxeles por centímetro al medir
    const estado = { corredera: 0, sinCargador: false, abierto: 0, bombeo: 0, palanca: 0, mirar: 0, tapa: 0 };
    const aparte = document.createElement('canvas'); aparte.width = 1800; aparte.height = 1200;
    const o = aparte.getContext('2d'), k = PX / CM;
    o.setTransform(k, 0, 0, k, 900, 600); if (a.cuerpo) o.rotate(Math.PI / 2);   // las de cuerpo a cuerpo, acostadas
    Pincel.silueta = null;
    d.dibujar(o, estado);
    const datos = o.getImageData(0, 0, aparte.width, aparte.height).data;
    let x0 = aparte.width, y0 = aparte.height, x1 = 0, y1 = 0;
    for (let y = 0; y < aparte.height; y += 2) for (let x = 0; x < aparte.width; x += 2) if (datos[(y * aparte.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, lienzoFicha.width, lienzoFicha.height);
    if (x1 <= x0) return;
    const w = x1 - x0 + 4, h = y1 - y0 + 4, margen = 40;
    const esc = Math.min((lienzoFicha.width - margen * 2) / w, (lienzoFicha.height - margen * 2) / h);
    // El punto (x0 - 2, y0 - 2) del lienzo de medir cae en la esquina del recuadro centrado
    const ox = (lienzoFicha.width - w * esc) / 2, oy = (lienzoFicha.height - h * esc) / 2;
    c.setTransform(k * esc, 0, 0, k * esc, ox + (900 - (x0 - 2)) * esc, oy + (600 - (y0 - 2)) * esc);
    if (a.cuerpo) c.rotate(Math.PI / 2);
    d.dibujar(c, estado);
    c.setTransform(1, 0, 0, 1, 0, 0);
    document.getElementById('detalle-largo').textContent = t('detalle.largo', { cm: Math.round(w / PX) });
  }
  function mostrarDetalleArma(id) {
    const a = ARMAS[id], f = FICHAS[id];
    armaEnDetalle = id;
    document.getElementById('detalle-nombre').textContent = a.nombre;
    const chip = document.getElementById('detalle-grupo'), g = grupoDeArma(id);
    chip.textContent = g >= 0 ? GRUPOS_ARMAS[g].nombre.toUpperCase() : ''; chip.className = 'chip-grupo' + (a.legendaria ? ' legendaria' : ARMAS_ESPECIALES.includes(id) ? ' especial' : '');
    document.getElementById('detalle-desc').textContent = f ? enIdioma(f[3]) : '';
    document.getElementById('detalle-datos').innerHTML = filasFicha(id).map(([k, v, dest, ancha]) => `<div class="${dest ? 'destacado' : ''}${ancha ? ' ancha' : ''}"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    capaPruebas.classList.add('viendo-detalle');
    document.getElementById('detalle-arma').classList.remove('oculta');
    dibujarFicha(id);
    document.querySelector('#detalle-arma .boton-usar').focus({ preventScroll: true });   // la ficha abre desde arriba (nombre y dibujo)
    document.getElementById('detalle-arma').scrollTop = 0;
  }
  // Arma anterior o siguiente en el orden de la lista (da la vuelta al llegar al final)
  function armaVecina(id, paso) {
    const lista = [...document.querySelectorAll('#lista-armas-prueba [data-arma]')].map(b => b.dataset.arma);
    const i = lista.indexOf(id);
    return lista[((i < 0 ? 0 : i) + paso + lista.length) % lista.length];
  }
  function ocultarDetalleArma() {
    if (!armaEnDetalle) return;
    const id = armaEnDetalle; armaEnDetalle = null;
    capaPruebas.classList.remove('viendo-detalle');
    document.getElementById('detalle-arma').classList.add('oculta');
    const b = capaPruebas.querySelector(`[data-arma="${id}"]`); if (b) b.focus();
  }
  function usarArmaDetalle() {
    if (!armaEnDetalle || !juego) return;
    juego.equiparArma(armaEnDetalle);
    if (menuPruebasAbierto) alternarMenuPruebas();
    mostrarSelectorArmas();
  }

  function salirAlMenu() {
    cancelAnimationFrame(cuadro);
    Audio_.ambiente(0);
    Musica.detener(0.8);
    juego = null; pausado = false; menuPruebasAbierto = false;
    capaPruebas.classList.add('oculta');
    mostrar('menu-principal');
  }

  /* ---- Selector de armas ---- */
  const selector = document.getElementById('selector-armas');
  let ocultarSelector = 0;
  function mostrarSelectorArmas(grupoPedido = null) {
    if (!juego || juego.jugador.montada) return;
    const j = juego.jugador, actual = j.arma().id, gActual = grupoDeArma(actual);
    const tecla = !document.body.classList.contains('tactil');
    const grupos = GRUPOS_ARMAS.map((g, k) => {
      const tiene = j.inventario.some(id => g.es(ARMAS[id]));
      return `<span class="grupo${k === gActual ? ' actual' : ''}${tiene ? '' : ' vacio'}">${tecla ? `<b>${k + 1}</b>` : ''}${g.nombre.toUpperCase()}</span>`;
    }).join('');
    const ids = j.inventario.filter(id => GRUPOS_ARMAS[gActual].es(ARMAS[id]));
    const armas = ids.map(id => `<span class="arma${id === actual ? ' elegida' : ''}">${ARMAS[id].nombre}</span>`).join('');
    selector.innerHTML = `<div class="grupos">${grupos}</div><div class="armas">${armas}</div>`;
    selector.classList.add('mostrar');
    clearTimeout(ocultarSelector);
    ocultarSelector = setTimeout(() => selector.classList.remove('mostrar'), 1600);
  }

  /* ---- Selector de dificultad ---- */
  function renderizarDificultad() {
    const actual = Dificultad.actual();
    document.querySelectorAll('[data-dificultad]').forEach(b => b.classList.toggle('elegida', b.dataset.dificultad === actual.id));
    document.getElementById('descripcion-dificultad').textContent = actual.descripcion;
  }
  document.addEventListener('click', e => {
    const boton = e.target.closest('[data-dificultad]');
    if (!boton) return;
    Dificultad.elegir(boton.dataset.dificultad);
    renderizarDificultad();
  });

  // El panel del ataque aéreo también se puede tocar o clickear
  document.getElementById('hud-aereo').addEventListener('pointerdown', e => { e.preventDefault(); if (juego && !pausado) juego.pedirAtaqueAereo(); });

  /* ---- Botones (delegación por data-accion) ---- */
  document.addEventListener('click', e => {
    const arma = e.target.closest('[data-arma]');
    if (arma && juego) {
      if (menuPruebasAbierto) mostrarDetalleArma(arma.dataset.arma);   // primero la ficha; USAR la equipa
      else { juego.equiparArma(arma.dataset.arma); mostrarSelectorArmas(); }
      return;
    }
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    Audio_.activar();
    switch (boton.dataset.accion) {
      case 'infinita':  mostrar('panel-mapas'); break;
      case 'historia':  Historia.abrir(); break;
      case 'mapa-ciudad': iniciar(null); break;
      case 'mapa-cloaca': iniciar(null, { mapa: 'cloaca' }); break;
      case 'pruebas':   iniciar(null, { pruebas: true }); break;
      case 'torreta':   iniciar(null, { torreta: true }); break;
      case 'ultra':     iniciar(null, { ultra: true }); break;
      case 'entrenamiento': iniciar(null, { entrenamiento: true }); break;
      case 'poner-m2':  if (juego) juego.ponerAmetralladora(); break;
      case 'quitar-m2': if (juego) juego.quitarAmetralladora(); break;
      case 'poner-zombie': if (juego) juego.ponerZombiePrueba(); break;
      case 'borrar-generado': if (juego) juego.borrarGenerado(); break;
      case 'cerrar-pruebas': alternarMenuPruebas(); break;
      case 'usar-arma': usarArmaDetalle(); break;
      case 'volver-armas': ocultarDetalleArma(); break;
      case 'arma-anterior': if (armaEnDetalle) mostrarDetalleArma(armaVecina(armaEnDetalle, -1)); break;
      case 'arma-siguiente': if (armaEnDetalle) mostrarDetalleArma(armaVecina(armaEnDetalle, 1)); break;
      case 'misiones':  renderizarMisiones(); mostrar('panel-misiones'); break;
      case 'controles': mostrar('panel-controles'); break;
      case 'volver':    mostrar('menu-principal'); break;
      case 'borrar-progreso':
        // Confirmación dentro de la página (los visores de artefactos no muestran confirm()): segundo clic en 3 s
        if (boton.dataset.confirmar === '1') {
          ProgresoMisiones.borrar(); renderizarMisiones();
          boton.dataset.confirmar = ''; boton.textContent = t('misiones.borrado');
          setTimeout(() => { boton.textContent = t('misiones.borrar'); }, 1500);
        } else {
          boton.dataset.confirmar = '1'; boton.textContent = t('misiones.confirmar');
          setTimeout(() => { if (boton.dataset.confirmar === '1') { boton.dataset.confirmar = ''; boton.textContent = t('misiones.borrar'); } }, 3000);
        }
        break;
      case 'reanudar':  alternarPausa(); break;
      case 'reintentar': iniciar(misionActual, opcionesActuales); break;
      case 'al-menu':   salirAlMenu(); break;
      case 'config-abrir': abrirConfig(); break;
      case 'personaje-abrir': abrirPersonajes(); break;
      case 'personaje-cerrar': cerrarPersonajes(); break;
      case 'config-cerrar': cerrarConfig(); break;
      case 'config-restablecer': Config.restablecer(); sincronizarConfig(); break;
      case 'config-probar': Audio_.disparo('pistola', 'glock'); break;
      case 'config-completa': alternarPantallaCompleta(); break;
      case 'asist-abrir': Asistente.abrir(capaConfig); break;   // asistente de construcción (temporal)
      case 'asist-volver': Asistente.cerrar(); break;
    }
  });

  /* ---- Teclado ---- */
  const TECLAS_BLOQUEADAS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
  document.addEventListener('keydown', e => {
    if (configAbierta) { if (e.code === 'Escape') { if (Asistente.abierto()) Asistente.cerrar(); else cerrarConfig(); } return; }
    if (personajesAbierto) { if (e.code === 'Escape') cerrarPersonajes(); return; }
    if (TECLAS_BLOQUEADAS.has(e.code)) e.preventDefault();
    if (!juego) return;
    if (juego.enTienda) { if ((e.code === 'Escape' || e.code === 'KeyB') && !e.repeat) juego.alternarTienda(); return; }   // tienda abierta: sólo se cierra
    if ((juego.pruebas || juego.entrenamiento) && e.code === 'KeyC' && !e.repeat) { alternarMenuPruebas(); return; }
    if (menuPruebasAbierto) {
      if (armaEnDetalle) {   // en la ficha: Esc vuelve a la lista, Enter la usa
        if (e.code === 'Escape' || e.code === 'Backspace') ocultarDetalleArma();
        else if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat) { e.preventDefault(); usarArmaDetalle(); }
        else if (e.code === 'KeyC' && !e.repeat) alternarMenuPruebas();
        else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { e.preventDefault(); mostrarDetalleArma(armaVecina(armaEnDetalle, e.code === 'ArrowRight' ? 1 : -1)); }
        return;
      }
      // En la lista: ← → pasan a la ficha del arma de al lado de la marcada (o de la que está en la mano)
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        const marcada = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.arma;
        const base = marcada || (juego.jugador.montada ? null : juego.jugador.arma().id);
        mostrarDetalleArma(base ? armaVecina(base, e.code === 'ArrowRight' ? 1 : -1) : armaVecina(null, 0));
        return;
      }
      if (e.code === 'KeyX' && !e.repeat) juego.borrarGenerado();
      else if (e.code === 'Escape') alternarMenuPruebas();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') { alternarPausa(); return; }
    if (pausado || juego.terminado) return;
    const en = juego.entrada, j = juego.jugador;
    switch (e.code) {
      case 'ArrowRight': en.derecha = true; break;
      case 'ArrowLeft':  en.izquierda = true; break;
      case 'ArrowUp':    if (!e.repeat) en.saltarPulsado = true; break;
      case 'ArrowDown':  en.abajo = true; if (!e.repeat) { en.abajoPulsado = true; juego.alternarMontar(); } break;   // mantenida: agacharse; junto a una M2: montarla
      case 'KeyF':       en.disparar = true; if (!e.repeat) en.dispararPulsado = true; break;
      case 'KeyS':       if (!e.repeat) j.recargar(juego); break;
      case 'KeyA':       if (!e.repeat) juego.pedirAtaqueAereo(); break;
      case 'KeyT':       if (!e.repeat && juego.ultra) juego.comprarTorreta(); break;
      case 'KeyB':       if (!e.repeat && juego.ultra) juego.alternarTienda(); break;
      case 'KeyQ': case 'KeyG': if (!e.repeat) { j.cambiarArma(-1); mostrarSelectorArmas(); } break;
      case 'KeyE': case 'KeyH': if (!e.repeat) { j.cambiarArma(1); mostrarSelectorArmas(); } break;
      default:
        // 1 a 7 (fila de números o teclado numérico): grupo de armas; otra vez, la siguiente del grupo
        if (/^(Digit|Numpad)[1-7]$/.test(e.code) && !e.repeat) {
          const g = parseInt(e.code.slice(-1), 10) - 1;
          if (j.elegirGrupo(g)) mostrarSelectorArmas();
          else if (!j.montada) juego.aviso(t('aviso.sinGrupo', { grupo: GRUPOS_ARMAS[g].nombre.toUpperCase() }), 1200);
        }
    }
  });
  document.addEventListener('keyup', e => {
    if (!juego) return;
    const en = juego.entrada;
    if (e.code === 'ArrowRight') en.derecha = false;
    if (e.code === 'ArrowLeft') en.izquierda = false;
    if (e.code === 'KeyF') en.disparar = false;
    if (e.code === 'ArrowDown') en.abajo = false;
  });
  // Rueda del mouse: arma anterior / siguiente (con un respiro para que un giro no salte varias)
  let ultimaRueda = 0;
  window.addEventListener('wheel', e => {
    if (!juego || pausado || juego.terminado || menuPruebasAbierto || configAbierta) return;
    const ahora = performance.now();
    if (ahora - ultimaRueda < 120) return;
    ultimaRueda = ahora;
    juego.jugador.cambiarArma(e.deltaY > 0 ? 1 : -1); mostrarSelectorArmas();
  }, { passive: true });

  // Si la ventana pierde el foco, soltar todas las teclas para que no quede corriendo solo
  window.addEventListener('blur', () => {
    if (!juego) return;
    juego.entrada.derecha = juego.entrada.izquierda = juego.entrada.disparar = juego.entrada.abajo = false;
  });

  // Gancho para depurar desde la consola: ZonaMuerta.juego() devuelve la partida en curso
  window.ZonaMuerta = { juego: () => juego, iniciar, salir: () => salirAlMenu(), pausar: () => { if (juego && !pausado && !juego.terminado) alternarPausa(); } };

  /* ---- Configuración ---- */
  const capaConfig = document.getElementById('capa-config');
  let configAbierta = false, pausaPorConfig = false, focoAntes = null;
  function abrirConfig() {
    if (configAbierta) return;
    configAbierta = true; focoAntes = document.activeElement;
    // En partida, abrir la configuración pausa el juego (y al cerrarla sigue, si la pausó ella)
    if (juego && !pausado && !juego.terminado) { pausaPorConfig = true; pausado = true; Musica.pausar(true); }
    if (juego) { juego.entrada.derecha = juego.entrada.izquierda = juego.entrada.disparar = juego.entrada.abajo = false; }
    sincronizarConfig();
    capaConfig.classList.remove('oculta');
    capaConfig.querySelector('input, button').focus();
  }
  function cerrarConfig() {
    if (!configAbierta) return;
    configAbierta = false;
    capaConfig.classList.add('oculta');
    if (pausaPorConfig) { pausaPorConfig = false; pausado = false; Musica.pausar(false); ultimo = performance.now(); }
    if (focoAntes && focoAntes.focus) focoAntes.focus();
  }
  // Pone los controles del panel con los valores guardados
  function sincronizarConfig() {
    capaConfig.querySelectorAll('input[type=range][data-config]').forEach(r => { r.value = Math.round(Config.get(r.dataset.config) * 100); r.nextElementSibling.textContent = r.value + '%'; });
    capaConfig.querySelectorAll('input[type=checkbox][data-config]').forEach(c => { c.checked = !!Config.get(c.dataset.config); });
    const valores = { idioma: Idioma.actual(), dificultad: Dificultad.actual().id, calidad: Config.get('calidad'), tactil: Config.get('tactil') };
    capaConfig.querySelectorAll('[data-config-opciones]').forEach(g => {
      g.querySelectorAll('[data-valor]').forEach(b => { const si = b.dataset.valor === valores[g.dataset.configOpciones]; b.classList.toggle('elegida', si); b.setAttribute('aria-pressed', si); });
    });
    const completa = document.getElementById('boton-completa');
    completa.hidden = !(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  }
  capaConfig.addEventListener('input', e => {
    const r = e.target;
    if (r.matches('input[type=range][data-config]')) { Config.set(r.dataset.config, r.value / 100); r.nextElementSibling.textContent = r.value + '%'; }
  });
  capaConfig.addEventListener('change', e => {
    const c = e.target;
    if (c.matches('input[type=checkbox][data-config]')) Config.set(c.dataset.config, c.checked);
  });
  capaConfig.addEventListener('click', e => {
    if (e.target === capaConfig) { cerrarConfig(); return; }   // clic afuera del panel
    const b = e.target.closest('[data-valor]');
    if (!b) return;
    const que = b.parentElement.dataset.configOpciones, v = b.dataset.valor;
    if (que === 'idioma') Idioma.elegir(v);
    else if (que === 'dificultad') { Dificultad.elegir(v); renderizarDificultad(); }
    else Config.set(que, v);
    sincronizarConfig();
  });
  function alternarPantallaCompleta() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const el = document.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
    } catch { /* el navegador o el visor no lo permiten */ }
  }
  // Lo que cambia en la configuración se aplica enseguida
  const aplicarSonido = () => Audio_.volumenes({ general: Config.get('general'), efectos: Config.get('efectos'), musica: Config.get('musica'), silencio: Config.get('silencio') });
  Config.alCambiar(clave => {
    if (['general', 'efectos', 'musica', 'silencio'].includes(clave)) aplicarSonido();
    if (clave === 'calidad') ajustarResolucion(true);
  });
  aplicarSonido();
  // Cambio de idioma: textos fijos (Idioma.aplicar) y los que arma la interfaz
  Idioma.alCambiar(() => {
    renderizarDificultad(); renderizarArmasPrueba(); tituloPruebas();
    if (document.getElementById('panel-misiones').classList.contains('visible')) renderizarMisiones();
  });

  /* ---- Personaje (skin) ---- */
  const capaPersonaje = document.getElementById('capa-personaje');
  const muestra = new Jugador(0);   // un jugador de mentira para dibujar las vistas previas
  let personajesAbierto = false;
  // Dibuja el personaje `id` parado, respirando, centrado en un lienzo
  function dibujarMuestra(lienzoMuestra, id, ahora) {
    const c = lienzoMuestra.getContext('2d'), w = lienzoMuestra.width, h = lienzoMuestra.height;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
    const k = h / 110;
    c.setTransform(k, 0, 0, k, w / 2 - 4 * k, h - 8 * k);
    muestra.skin = id; muestra.ahora = ahora; muestra.direccion = 1;
    const fondo = c.createRadialGradient(0, -40, 4, 0, -40, 60); fondo.addColorStop(0, 'rgba(201,169,110,0.18)'); fondo.addColorStop(1, 'rgba(201,169,110,0)');
    c.fillStyle = fondo; c.fillRect(-60, -110, 120, 120);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, 1, 16, 3, 0, 0, Math.PI * 2); c.fill();
    c.save(); muestra.cuerpo(c, false); c.restore();
  }
  function renderizarPersonajes() {
    const lista = document.getElementById('lista-personajes'), actual = Config.get('skin') || 'sobreviviente';
    lista.innerHTML = '';
    for (const id of ORDEN_SKINS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tarjeta-personaje' + (id === actual ? ' elegida' : ''); b.dataset.skin = id;
      b.setAttribute('aria-pressed', id === actual);
      b.innerHTML = `<canvas width="150" height="170" aria-hidden="true"></canvas><span class="nombre">${t('skin.' + id)}</span><span class="desc">${t('skin.' + id + '.desc')}</span>`;
      lista.appendChild(b);
    }
  }
  function actualizarBotonPersonaje() { document.getElementById('nombre-personaje').textContent = t('skin.' + (Config.get('skin') || 'sobreviviente')); }
  function abrirPersonajes() { personajesAbierto = true; renderizarPersonajes(); capaPersonaje.classList.remove('oculta'); capaPersonaje.querySelector('.elegida, button').focus(); }
  function cerrarPersonajes() { personajesAbierto = false; capaPersonaje.classList.add('oculta'); document.querySelector('.boton-personaje').focus(); }
  capaPersonaje.addEventListener('click', e => {
    if (e.target === capaPersonaje) { cerrarPersonajes(); return; }
    const b = e.target.closest('[data-skin]');
    if (!b) return;
    Config.set('skin', b.dataset.skin);
    capaPersonaje.querySelectorAll('[data-skin]').forEach(x => { const si = x === b; x.classList.toggle('elegida', si); x.setAttribute('aria-pressed', si); });
    actualizarBotonPersonaje();
  });
  // Vistas previas animadas (respiran) mientras se ven: la del menú y las del panel
  (function animarMuestras(ahora) {
    if (document.getElementById('menu-principal').classList.contains('visible')) dibujarMuestra(document.getElementById('vista-personaje'), Config.get('skin') || 'sobreviviente', ahora);
    if (personajesAbierto) capaPersonaje.querySelectorAll('[data-skin]').forEach(b => dibujarMuestra(b.querySelector('canvas'), b.dataset.skin, ahora));
    requestAnimationFrame(animarMuestras);
  })(performance.now());
  Idioma.alCambiar(() => { actualizarBotonPersonaje(); if (personajesAbierto) renderizarPersonajes(); });
  actualizarBotonPersonaje();

  Idioma.aplicar();
  renderizarDificultad();
  renderizarArmasPrueba();
  mostrar('menu-principal');
})();
