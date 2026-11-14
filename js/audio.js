/* ===== Audio sintetizado con WebAudio: sin archivos externos =====
 * Para que no suene a plástico:
 *  - Disparos en cuatro capas: chasquido supersónico saturado, explosión de gas con un filtro que se
 *    cierra, golpe grave de presión y una cola que va a un eco de exterior y a una reverberación.
 *  - Mecanismos: grabaciones reales de armas (js/sonidos-datos.js, créditos en sonidos/CREDITOS.md).
 *    Si todavía no se decodificaron, se usa la síntesis de respaldo (resonancias metálicas y fricción).
 */
const Audio_ = (() => {
  let ctx = null, maestro = null, envioReverb = null, envioEco = null, bufferRuido = null, curvaSaturacion = null;
  // Dónde suena todo: 'aire' (calle, campo), 'galpon' (polígono de tiro, chapa) o 'cloaca' (túnel de ladrillo)
  let interior = false, lugarActual = 'aire', nodosEco = null;
  // Volúmenes (los pone la configuración): general → limitador → parlantes; efectos y música por separado
  let general = null, busMusica = null;
  const vol = { general: 0.9, efectos: 0.85, musica: 0.6, silencio: false };
  function aplicarVolumenes() {
    if (!ctx) return;
    const t = ctx.currentTime;
    general.gain.setTargetAtTime(vol.silencio ? 0 : vol.general, t, 0.05);
    maestro.gain.setTargetAtTime(0.85 * vol.efectos, t, 0.05);
    busMusica.gain.setTargetAtTime(vol.musica, t, 0.05);
  }
  // Eco de cada lugar: cuándo vuelve el rebote, cuántas veces y qué tan brillante
  const ECOS = { aire: [0.21, 0.3, 1400], galpon: [0.13, 0.36, 2300], cloaca: [0.17, 0.46, 1500] };

  // Respuesta al impulso de un espacio abierto con algo de rebote: ruido estéreo que decae y se oscurece
  function respuestaImpulso(duracion, caida) {
    const largo = Math.floor(ctx.sampleRate * duracion), b = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const d = b.getChannelData(canal); let previo = 0;
      for (let i = 0; i < largo; i++) {
        const oscuro = 0.35 + 0.6 * (i / largo);                 // las altas se apagan antes que las bajas
        previo = previo * oscuro + (Math.random() * 2 - 1) * (1 - oscuro);
        d[i] = previo * Math.pow(1 - i / largo, caida) * (i < ctx.sampleRate * 0.012 ? 0 : 1);
      }
    }
    return b;
  }

  // En el galpón el rebote llega antes (la pared está a unos 20 m), vuelve más veces y más brillante (chapa)
  function aplicarLugar() {
    if (!nodosEco) return;
    const t = ctx.currentTime, { eco, realimentacion, pasoBajo } = nodosEco, [retardo, vuelta, brillo] = ECOS[lugarActual] || ECOS.aire;
    eco.delayTime.setTargetAtTime(retardo, t, 0.05);
    realimentacion.gain.setTargetAtTime(vuelta, t, 0.05);
    pasoBajo.frequency.setTargetAtTime(brillo, t, 0.05);
  }

  // Silencio cuando el juego no se ve: pestaña o app en segundo plano, celular bloqueado, página cerrada o el
  // marco del artefacto escondido. Lo último no avisa con «visibilitychange», así que además se vigila que
  // la página siga pintando cuadros: si requestAnimationFrame se frena más de 0,7 s, el juego no está a la vista.
  let oculto = document.hidden, porLatido = false, ultimoCuadro = performance.now(), vigila = true;
  function silenciar(si, latido = false) {
    if (si && !vigila) return;   // la versión VR lo apaga (sinSilencioAutomatico)
    oculto = si; porLatido = si && latido;
    if (!ctx) return;
    if (si && ctx.state === 'running') ctx.suspend().catch(() => {});
    else if (!si && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  document.addEventListener('visibilitychange', () => silenciar(document.hidden));
  window.addEventListener('pagehide', () => silenciar(true));
  window.addEventListener('pageshow', () => silenciar(document.hidden));
  (function latido() { ultimoCuadro = performance.now(); if (porLatido && !document.hidden) silenciar(false); requestAnimationFrame(latido); })();
  setInterval(() => { if (!oculto && performance.now() - ultimoCuadro > 700) silenciar(true, true); }, 250);

  function asegurar() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const limitador = ctx.createDynamicsCompressor();
      limitador.threshold.value = -12; limitador.knee.value = 6; limitador.ratio.value = 10; limitador.attack.value = 0.001; limitador.release.value = 0.18;
      general = ctx.createGain(); general.connect(ctx.destination);
      limitador.connect(general);
      maestro = ctx.createGain(); maestro.gain.value = 0.85; maestro.connect(limitador);
      busMusica = ctx.createGain(); busMusica.connect(limitador);   // la música pasa por el limitador: los tiros la aplastan un poco
      aplicarVolumenes();
      // Reverberación
      const reverb = ctx.createConvolver(); reverb.buffer = respuestaImpulso(2.2, 3.2);
      envioReverb = ctx.createGain(); envioReverb.gain.value = 0.55; envioReverb.connect(reverb); reverb.connect(maestro);
      // Eco de exterior: un rebote lejano, más oscuro cada vez
      const eco = ctx.createDelay(1); eco.delayTime.value = 0.21;
      const realimentacion = ctx.createGain(); realimentacion.gain.value = 0.3;
      const pasoBajo = ctx.createBiquadFilter(); pasoBajo.type = 'lowpass'; pasoBajo.frequency.value = 1400;
      envioEco = ctx.createGain(); envioEco.gain.value = 0.32;
      envioEco.connect(eco); eco.connect(pasoBajo); pasoBajo.connect(realimentacion); realimentacion.connect(eco); pasoBajo.connect(maestro);
      nodosEco = { eco, realimentacion, pasoBajo };
      aplicarLugar();
      // Ruido blanco compartido y curva de saturación suave (tanh)
      bufferRuido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = bufferRuido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      curvaSaturacion = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curvaSaturacion[i] = Math.tanh(x * 3) / Math.tanh(3); }
    }
    if (ctx.state === 'suspended' && !oculto) ctx.resume();
    cargarGrabaciones();
    return ctx;
  }

  /* ---------- Grabaciones reales de mecanismos (js/sonidos-datos.js) ---------- */
  const grabaciones = {};
  let grabacionesPedidas = false;
  function cargarGrabaciones() {
    if (grabacionesPedidas) return;
    grabacionesPedidas = true;
    const armas = typeof SONIDOS_ARMAS !== 'undefined' ? SONIDOS_ARMAS : {};
    const todas = Object.assign({}, typeof SONIDOS_GRABADOS !== 'undefined' ? SONIDOS_GRABADOS : {}, typeof SONIDOS_AMBIENTE !== 'undefined' ? SONIDOS_AMBIENTE : {}, armas);
    for (const [nombre, b64] of Object.entries(todas)) {
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      ctx.decodeAudioData(bytes.buffer).then(b => { grabaciones[nombre] = armas[nombre] ? sinSilencioInicial(b) : b; }).catch(() => {});
    }
  }
  // El MP3 puede llegar con unos milisegundos de silencio adelante (el relleno del codificador; depende del navegador):
  // se corta desde 1 ms antes del primer sonido, así el tiro sale en el mismo momento que el clic
  function sinSilencioInicial(b) {
    const d = b.getChannelData(0); let i = 0;
    while (i < d.length && Math.abs(d[i]) < 0.003) i++;
    const desde = Math.max(0, i - Math.round(b.sampleRate * 0.001));
    if (desde < 64 || desde >= b.length) return b;
    const c = ctx.createBuffer(b.numberOfChannels, b.length - desde, b.sampleRate);
    for (let k = 0; k < b.numberOfChannels; k++) c.copyToChannel(b.getChannelData(k).subarray(desde), k);
    return c;
  }
  // Reproduce una grabación; la velocidad cambia el peso (más lenta = arma más pesada) y varía un poco cada vez.
  // desde/dur: sólo un pedazo (en segundos de la grabación); pasoAlto/pasoBajo: filtros; eco: envío al eco de exterior
  function grabacion(nombre, { vol = 1, vel = 1, retraso = 0, rev = 0.12, eco = 0, pasoBajo = 0, pasoAlto = 0, desde = 0, dur = 0, variar = 0.03 } = {}) {
    const b = grabaciones[nombre];
    if (!b) return false;
    const fuente = ctx.createBufferSource(); fuente.buffer = b;
    const ritmo = vel * (1 - variar + Math.random() * variar * 2);
    fuente.playbackRate.value = ritmo;
    const g = ctx.createGain(), nivel = vol * (0.92 + Math.random() * 0.12); g.gain.value = nivel;
    let nodo = fuente;
    if (pasoAlto) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = pasoAlto; f.Q.value = 0.6; nodo.connect(f); nodo = f; }
    if (pasoBajo) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = pasoBajo; f.Q.value = 0.5; nodo.connect(f); nodo = f; }
    nodo.connect(g);
    conectar(g, rev, eco);
    const t = ctx.currentTime + retraso;
    if (dur) {   // el pedazo termina con una salida de 12 ms, sin clic
      const fin = t + dur / ritmo;
      g.gain.setValueAtTime(nivel, Math.max(t, fin - 0.012)); g.gain.linearRampToValueAtTime(0.0001, fin);
      fuente.start(t, desde, dur + 0.02);
    } else fuente.start(t, desde);
    return true;
  }

  // Una variante al azar de un grupo (prefijo_1 … prefijo_n), sin repetir la última que sonó
  const ultimas = {};
  function variante(prefijo, n, opciones) {
    let k; do { k = 1 + Math.floor(Math.random() * n); } while (n > 1 && k === ultimas[prefijo]);
    ultimas[prefijo] = k;
    return grabacion(`${prefijo}_${k}`, opciones);
  }

  /* ---------- Ambiente: viento continuo con ráfagas ---------- */
  let viento = null;
  function encenderViento(nivel) {
    if (viento) { viento.salida.gain.setTargetAtTime(nivel, ctx.currentTime, 0.8); return; }
    const t = ctx.currentTime;
    const fuente = ctx.createBufferSource(); fuente.buffer = bufferRuido; fuente.loop = true;
    // Cuerpo del viento: ruido pasabanda cuya frecuencia y volumen ondulan lento
    const banda = ctx.createBiquadFilter(); banda.type = 'bandpass'; banda.frequency.value = 420; banda.Q.value = 0.7;
    const rafagas = ctx.createGain(); rafagas.gain.value = 0.6;
    const lfoFrec = ctx.createOscillator(); lfoFrec.frequency.value = 0.07; const lfoFrecG = ctx.createGain(); lfoFrecG.gain.value = 220; lfoFrec.connect(lfoFrecG); lfoFrecG.connect(banda.frequency);
    const lfoVol = ctx.createOscillator(); lfoVol.frequency.value = 0.11; const lfoVolG = ctx.createGain(); lfoVolG.gain.value = 0.38; lfoVol.connect(lfoVolG); lfoVolG.connect(rafagas.gain);
    // Silbido de las ráfagas entre los carteles y los cables
    const silbido = ctx.createBiquadFilter(); silbido.type = 'bandpass'; silbido.frequency.value = 1700; silbido.Q.value = 9;
    const silbidoG = ctx.createGain(); silbidoG.gain.value = 0.12;
    const lfoSil = ctx.createOscillator(); lfoSil.frequency.value = 0.05; const lfoSilG = ctx.createGain(); lfoSilG.gain.value = 500; lfoSil.connect(lfoSilG); lfoSilG.connect(silbido.frequency);
    const salida = ctx.createGain(); salida.gain.setValueAtTime(0.0001, t); salida.gain.setTargetAtTime(nivel, t, 1.2);
    fuente.connect(banda); banda.connect(rafagas); fuente.connect(silbido); silbido.connect(silbidoG); silbidoG.connect(rafagas);
    rafagas.connect(salida); salida.connect(maestro);
    [fuente, lfoFrec, lfoVol, lfoSil].forEach(n => n.start(t));
    viento = { salida, nodos: [fuente, lfoFrec, lfoVol, lfoSil] };
  }
  /* ---------- Agua de la cloaca: corriente grave con burbujeo ---------- */
  let agua = null;
  function encenderAgua(nivel) {
    if (agua) { agua.salida.gain.setTargetAtTime(nivel, ctx.currentTime, 0.8); return; }
    const t = ctx.currentTime;
    const fuente = ctx.createBufferSource(); fuente.buffer = bufferRuido; fuente.loop = true;
    const grave = ctx.createBiquadFilter(); grave.type = 'lowpass'; grave.frequency.value = 520;
    const burbuja = ctx.createBiquadFilter(); burbuja.type = 'bandpass'; burbuja.frequency.value = 1300; burbuja.Q.value = 5;
    const burbujaG = ctx.createGain(); burbujaG.gain.value = 0.25;
    // El burbujeo sube y baja de tono rápido e irregular, como agua que choca
    const lfo = ctx.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 5.3; const lfoG = ctx.createGain(); lfoG.gain.value = 600; lfo.connect(lfoG); lfoG.connect(burbuja.frequency);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.13; const lfo2G = ctx.createGain(); lfo2G.gain.value = 0.12; lfo2.connect(lfo2G); lfo2G.connect(burbujaG.gain);
    const salida = ctx.createGain(); salida.gain.setValueAtTime(0.0001, t); salida.gain.setTargetAtTime(nivel, t, 1.2);
    fuente.connect(grave); grave.connect(salida); fuente.connect(burbuja); burbuja.connect(burbujaG); burbujaG.connect(salida);
    salida.connect(maestro);
    const envio = ctx.createGain(); envio.gain.value = 0.25; salida.connect(envio); envio.connect(envioReverb);   // el túnel lo devuelve
    [fuente, lfo, lfo2].forEach(n => n.start(t));
    agua = { salida, nodos: [fuente, lfo, lfo2] };
  }
  function apagarAgua() {
    if (!agua) return;
    const a = agua; agua = null;
    a.salida.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    a.nodos.forEach(n => n.stop(ctx.currentTime + 2));
  }
  function apagarViento() {
    if (!viento) return;
    const v = viento; viento = null;
    v.salida.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    v.nodos.forEach(n => n.stop(ctx.currentTime + 2));
  }

  // Qué grabación usa cada evento de recarga según el arma
  const PISTOLAS_CORREDERA = new Set(['glock', 'colt1911', 'deagle', 'beretta92', 'ppk']);
  const CERROJO_MANUAL = new Set(['remington700', 'mosin', 'mauser']);
  const REVOLVERES = new Set(['magnum', 'python']);
  const QUIEBRE = new Set(['recortada', 'm79', 'mgl']);
  const PESO = { barrett: 0.78, m2: 0.72, aa12: 0.74, saiga: 0.9, deagle: 0.9, uzi: 1.1, p90: 1.12, mp5: 1.05, minigun: 0.62 };
  function grabacionDeRecarga(evento, id) {
    const peso = PESO[id] || 1;
    switch (evento) {
      case 'cargador-sacar': return PISTOLAS_CORREDERA.has(id) ? ['pistola_cargador_sacar', { vel: peso }] : ['pistola_cargador_sacar', { vel: 0.86 * peso, vol: 1.05 }];
      case 'cargador-poner': return PISTOLAS_CORREDERA.has(id) ? ['pistola_cargador_poner', { vel: peso }] : ['pistola_cargador_poner', { vel: 0.88 * peso, vol: 1.1 }];
      case 'corredera':      return ['pistola_corredera', { vel: peso }];
      case 'liberar':        return ['pistola_liberar', {}];
      case 'cerrojo':        return CERROJO_MANUAL.has(id) ? ['cerrojo_cerrar', {}] : ['escopeta_rack', { vel: peso }];
      case 'cerrojo-abrir':  return id === 'mp5' ? ['pistola_trabar', { vel: 0.85 }] : ['cerrojo_abrir', {}];
      case 'palmada':        return ['pistola_liberar', { vel: 0.85, vol: 1.1 }];
      case 'cierra-solo':    return ['escopeta_cerrar', { vel: 0.95 }];   // el cerrojo del Garand salta adelante solo (el de la escopeta semiautomática al soltarlo)
      case 'palmada-hk':     return ['escopeta_cerrar', { vel: 1.05 }];
      case 'bombear':        return ['bombeo_rack', {}];
      case 'palanca':        return ['cerrojo_22', { vel: id === 'winchester1887' ? 0.82 : 0.95 }];
      case 'cartucho':       return QUIEBRE.has(id) ? ['escopeta_cargar_recamara', { vel: 1.1 }] : ['bombeo_cartucho', {}];
      case 'bala':           return REVOLVERES.has(id) ? ['rifle_bala', { vel: 1.35, vol: 0.75 }] : ['rifle_bala', {}];
      case 'abrir':          return REVOLVERES.has(id) ? ['pistola_trabar', { vel: 1.25, vol: 0.8 }] : ['escopeta_abrir', { vel: 0.9 }];
      case 'cerrar':         return REVOLVERES.has(id) ? ['cerrojo_cerrar', { vel: 1.35, vol: 0.8 }] : QUIEBRE.has(id) ? ['escopeta_cerrar', { vel: 0.85, vol: 1.1 }] : ['cerrojo_cerrar', {}];
      case 'peine':          return ['rifle_peine', {}];
      case 'speedloader':    return ['revolver_balas', { vel: 1.15 }];
      case 'cinta':          return ['balas_sueltas', { vel: 0.85 }];
      case 'tapa':           return ['escopeta_cerrar', { vel: 0.7, vol: 1.15 }];
      default:               return null;   // granada y celda del láser siguen sintetizadas
    }
  }

  // Conecta una voz a la mezcla, con envíos opcionales a la reverberación y al eco
  function conectar(nodo, rev = 0, eco = 0) {
    nodo.connect(maestro);
    if (interior) rev *= 1.5;   // bajo techo todo suena con algo de sala: pasos, casquillos, mecanismos
    if (rev) { const g = ctx.createGain(); g.gain.value = rev; nodo.connect(g); g.connect(envioReverb); }
    if (eco) { const g = ctx.createGain(); g.gain.value = eco; nodo.connect(g); g.connect(envioEco); }
  }
  function envolvente(g, t, vol, ataque, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + dur);
  }
  function saturar(entrada, cantidad) {
    if (!cantidad) return entrada;
    const pre = ctx.createGain(); pre.gain.value = cantidad;
    const ws = ctx.createWaveShaper(); ws.curve = curvaSaturacion; ws.oversample = '2x';
    entrada.connect(pre); pre.connect(ws); return ws;
  }

  // Ruido filtrado con barrido de frecuencia (la base de disparos, fricciones y explosiones)
  function ruido({ dur, vol, filtro = 'lowpass', freq = 1000, freqFin = null, q = 0.7, ataque = 0.002, retraso = 0, sat = 0, rev = 0, eco = 0 }) {
    const t = ctx.currentTime + retraso;
    const fuente = ctx.createBufferSource(); fuente.buffer = bufferRuido;
    const inicioLoop = Math.random() * 1.5;
    const f = ctx.createBiquadFilter(); f.type = filtro; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (freqFin) f.frequency.exponentialRampToValueAtTime(freqFin, t + ataque + dur);
    const g = ctx.createGain(); envolvente(g, t, vol, ataque, dur);
    fuente.connect(f); saturar(f, sat).connect(g); conectar(g, rev, eco);
    fuente.start(t, inicioLoop); fuente.stop(t + ataque + dur + 0.05);
  }
  // Senoide con caída de tono: el golpe de presión de los disparos y los golpes sordos
  function tono({ tipo = 'sine', desde, hasta, dur, vol, ataque = 0.002, retraso = 0, sat = 0, rev = 0, eco = 0 }) {
    const t = ctx.currentTime + retraso;
    const o = ctx.createOscillator(); o.type = tipo;
    o.frequency.setValueAtTime(desde, t); o.frequency.exponentialRampToValueAtTime(Math.max(hasta, 1), t + ataque + dur);
    const g = ctx.createGain(); envolvente(g, t, vol, ataque, dur);
    saturar(o, sat).connect(g); conectar(g, rev, eco);
    o.start(t); o.stop(t + ataque + dur + 0.05);
  }
  // Pieza de acero que suena: parciales inarmónicos que se apagan más rápido cuanto más agudos
  const PARCIALES_METAL = [1, 2.31, 3.89, 5.43, 7.21];
  function metal({ f, dur = 0.08, vol = 0.2, retraso = 0, rev = 0.08 }) {
    const t = ctx.currentTime + retraso, v = 0.96 + Math.random() * 0.08;
    const salida = ctx.createGain(); salida.gain.value = 1; conectar(salida, rev, 0);
    PARCIALES_METAL.forEach((r, k) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * r * v;
      const g = ctx.createGain(); envolvente(g, t, vol / (1 + k * 0.7), 0.0008, dur / (1 + k * 0.5));
      o.connect(g); g.connect(salida); o.start(t); o.stop(t + dur + 0.05);
    });
    ruido({ dur: 0.006, vol: vol * 0.9, filtro: 'bandpass', freq: f * 2.5, q: 1.5, ataque: 0.0005, retraso });   // el impacto
  }
  // Golpe sordo: algo pesado que encastra o cae
  function golpe({ f = 180, dur = 0.06, vol = 0.25, retraso = 0, rev = 0.05 }) {
    tono({ desde: f, hasta: f * 0.55, dur, vol, ataque: 0.001, retraso, rev });
    ruido({ dur: dur * 0.6, vol: vol * 0.6, filtro: 'lowpass', freq: 900, freqFin: 300, ataque: 0.001, retraso, rev });
  }
  // Metal que se desliza sobre metal
  function friccion({ desde, hasta, dur = 0.08, vol = 0.12, retraso = 0 }) {
    ruido({ dur, vol, filtro: 'bandpass', freq: desde, freqFin: hasta, q: 3.5, ataque: dur * 0.3, retraso, rev: 0.05 });
  }

  // Disparo en capas; `pesado` agranda el cuerpo y la cola (Magnum, Deagle, Barrett, M2)
  function detonacion({ crack, boom, boomHz, golpeVol, golpeHz, golpeDur, cola, colaDur, rev = 0.5, eco = 0.6, mecanismo = 0 }) {
    // Al aire libre no hay paredes que devuelvan el sonido: sin eco y casi sin reverberación,
    // solo la cola natural del estampido que se apaga. En el galpón vuelve un eco moderado de las paredes.
    if (interior) { eco *= 0.4; rev *= 0.4; } else { eco = 0; rev *= 0.2; }
    const v = 0.93 + Math.random() * 0.14;
    ruido({ dur: 0.014, vol: crack, filtro: 'highpass', freq: 2200 * v, ataque: 0.0004, sat: 4 });
    ruido({ dur: 0.08 + boom * 0.1, vol: boom, filtro: 'lowpass', freq: boomHz * 4 * v, freqFin: boomHz * 0.6, q: 0.9, ataque: 0.0008, sat: 3, rev: rev * 0.4, eco: eco * 0.5 });
    tono({ desde: golpeHz * v, hasta: golpeHz * 0.3, dur: golpeDur, vol: golpeVol, ataque: 0.0008, sat: 2.2 });
    ruido({ dur: colaDur, vol: cola, filtro: 'lowpass', freq: 1100, freqFin: 160, ataque: 0.012, retraso: 0.015, rev, eco });
    if (mecanismo) metal({ f: 2300, dur: 0.05, vol: mecanismo, retraso: 0.035, rev: 0 });   // la corredera o el cerrojo ciclando
  }

  /* ---------- Disparos grabados (js/sonidos-armas.js) ----------
   * Armas reales disparadas al aire libre (The Free Firearm Sound Library, CC0): cada arma del juego usa las tomas del
   * arma real más parecida, con el mismo cartucho cuando lo hay (Colt 1911, AK-47, AR-15, Mosin-Nagant, .30-06 de un
   * Springfield 1917 y un Tikka, Winchester 1894, .380 de una Bersa, el 7,62 × 25 de la PPSh para la Mauser C96,
   * cuatro escopetas del 12 distintas). La velocidad da el peso (más lenta = más grave). Cada tiro elige una toma al
   * azar sin repetir la anterior y varía un poco tono y volumen: así no suenan todos iguales. Las muy grandes (Desert
   * Eagle, Magnum, Barrett, M2, recortada) suman el golpe de presión sintetizado por debajo. Al aire libre la toma ya
   * trae la cola del campo; en el galpón y la cloaca se le suma la sala y el eco. Sin grabación, el disparo sintetizado.
   * [tomas, velocidad, volumen, golpe grave (0…1)] */
  const TOMAS_DISPARO = { tiro_pistola9: 3, tiro_pistola45: 2, tiro_pistola380: 2, tiro_pistola762: 3, tiro_revolver: 2, tiro_smg9: 3, tiro_ak: 3, tiro_ar15: 2,
    tiro_mosin: 3, tiro_3006: 4, tiro_palanca: 2, tiro_escopeta_cd: 2, tiro_escopeta_m12: 2, tiro_escopeta_mossberg: 2, tiro_escopeta_nova: 2 };
  const DISPARO_REAL = {
    glock: ['tiro_pistola9', 1, 2.98], beretta92: ['tiro_pistola9', 0.96, 2.92], colt1911: ['tiro_pistola45', 1, 2.2], ppk: ['tiro_pistola380', 1.02, 2.36],
    mauser: ['tiro_pistola762', 1, 2.35], deagle: ['tiro_pistola45', 0.82, 2.69, 0.6], magnum: ['tiro_revolver', 0.8, 3.37, 0.7], python: ['tiro_revolver', 0.9, 3.23, 0.4],
    uzi: ['tiro_smg9', 1.04, 1.38], mp5: ['tiro_smg9', 1, 1.69], p90: ['tiro_smg9', 1.12, 1.76], thompson: ['tiro_smg9', 0.9, 2.76], vector: ['tiro_smg9', 0.95, 1.59],
    ak47: ['tiro_ak', 1, 1.98], m16: ['tiro_ar15', 1, 2.94], garand: ['tiro_3006', 1, 2.57], svd: ['tiro_mosin', 1.03, 2.25], mosin: ['tiro_mosin', 1, 2.22],
    remington700: ['tiro_3006', 1.05, 2.54], barrett: ['tiro_3006', 0.7, 3.09, 1], winchester1894: ['tiro_palanca', 1, 2],
    recortada: ['tiro_escopeta_cd', 0.92, 2.03, 0.5], mossberg: ['tiro_escopeta_mossberg', 1, 1.1], spas12: ['tiro_escopeta_nova', 1, 1.54], benelli: ['tiro_escopeta_nova', 1.04, 1.67],
    rem870: ['tiro_escopeta_m12', 1, 1.55], saiga: ['tiro_escopeta_m12', 1.05, 1.73], aa12: ['tiro_escopeta_cd', 1.06, 1.97], winchester1887: ['tiro_escopeta_m12', 0.95, 1.39],
    m2: ['tiro_3006', 0.72, 3.66, 0.9],
  };
  const NIVEL_TIRO = 1;   // los volúmenes de arriba igualan el nivel de los sintetizados de antes (ventanas de 125 ms, con el limitador)
  function tiroGrabado(armaId) {
    const r = DISPARO_REAL[armaId];
    if (!r || !grabaciones[r[0] + '_1']) return false;
    const [tomas, vel, nivel, grave = 0] = r;
    variante(tomas, TOMAS_DISPARO[tomas], { vol: nivel * NIVEL_TIRO, vel, rev: interior ? 0.3 : 0.05, eco: interior ? 0.2 : 0, variar: 0.04 });
    if (grave) {   // el golpe de presión que la grabación de un arma más chica no trae
      tono({ desde: 125, hasta: 36, dur: 0.16 + grave * 0.14, vol: 0.55 * grave, ataque: 0.0008, sat: 1.6 });
      ruido({ dur: 0.1 + grave * 0.1, vol: 0.4 * grave, filtro: 'lowpass', freq: 700, freqFin: 110, ataque: 0.0008, sat: 1.5, rev: interior ? 0.2 : 0 });
    }
    return true;
  }

  /* ---------- Granada de mano y sacar el arma: foley grabado (Kenney y otros, CC0; sonidos/CREDITOS.md) ----------
   * Nada de tonos de metal sintetizados (sonaban a xilófono): roce de tela, cuero, madera y metal de verdad.
   * pasador: el dedo engancha la anilla (un clic), el pasador sale raspando de la espoleta (un roce de metal corto y
   * agudo) y la anilla queda suelta (otro clic). cuchara: al soltar la granada salta la cuchara con el resorte y el
   * percutor pega. granada: la saca del portagranadas. Los pedazos (desde, dur) se midieron en cada grabación. */
  const FOLEY_GRANADA = {
    granada: () => grabacion('foley_cuero', { vol: 0.24, vel: 1.1, rev: 0.05 }),
    pasador: () => {
      if (!grabaciones.foley_raspa || !grabaciones.foley_clic) return false;
      grabacion('foley_clic', { vol: 0.19, vel: 1.15, desde: 0.08, dur: 0.05, rev: 0.04 });
      grabacion('foley_raspa', { vol: 0.33, vel: 1.5, retraso: 0.03, desde: 0.05, dur: 0.19, pasoAlto: 1800, rev: 0.04 });
      grabacion('foley_clic', { vol: 0.14, vel: 1.35, retraso: 0.16, desde: 0.235, dur: 0.06, rev: 0.04 });
      return true;
    },
    cuchara: () => {
      if (!grabaciones.foley_pestillo) return false;
      grabacion('foley_pestillo', { vol: 0.4, vel: 1.3, dur: 0.16, rev: 0.06 });
      grabacion('foley_clic', { vol: 0.3, vel: 0.9, retraso: 0.015, desde: 0.08, dur: 0.05, rev: 0.04 });
      return true;
    },
  };
  // Sacar un arma: las largas, de la espalda (el brazo va atrás y la correa corre por la ropa, la correa tira, el arma
  // llega a las manos y el anclaje de la correa tintinea apenas); las pistolas, de la funda; las hojas, de la vaina; la
  // granada, del portagranadas. Las muy pesadas, con ropa gruesa y un golpe de metal grave.
  const PESADAS_A_LA_ESPALDA = new Set(['minigun', 'm2', 'barrett', 'bazuca', 'lanzallamas', 'mgl']);
  let ultimoSacar = -1;
  function sacar(a) {
    if (a.id === 'macheteCazador') return true;   // el del cazador sale en silencio: sólo su susurro (js/armas-especiales.js)
    if (!grabaciones.foley_ropa || !grabaciones.foley_cuero) return false;
    const t = ctx.currentTime;
    if (t - ultimoSacar < 0.12) return true;   // cambiar de arma muy rápido no amontona sonidos
    ultimoSacar = t;
    // Niveles medidos con la mezcla del juego, en ventanas de 125 ms respecto de un tiro de AK: fusil -18 dB, pistola -19,
    // hoja -17, granada -18, muy pesadas -15 (una recarga queda en -2). Sutil: se oye sin tapar nada
    let k = 1;
    const op = (vol, vel, retraso = 0, extra = {}) => Object.assign({ vol: vol * k, vel, retraso, rev: 0.05 }, extra);
    if (a.categoria === 'pistola') { k = 0.29; grabacion('foley_cuero', op(0.6, 1.05)); grabacion('foley_clic', op(0.15, 1.1, 0.13, { desde: 0.08, dur: 0.05 })); return true; }
    if (a.categoria === 'granada') { k = 0.35; grabacion('foley_cuero', op(0.55, 1.15)); return true; }
    if (a.cuerpo && a.filo) { k = 0.26; grabacion('foley_ropa', op(0.25, 1.1, 0, { dur: 0.25 })); grabacion('foley_hoja', op(0.6, 1, 0.05)); return true; }
    const pesada = PESADAS_A_LA_ESPALDA.has(a.id);
    k = pesada ? 0.28 : a.cuerpo ? 0.41 : 0.37;
    grabacion(pesada ? 'foley_ropa_gruesa' : 'foley_ropa', op(pesada ? 0.6 : 0.5, 1, 0, { dur: 0.45 }));
    grabacion('foley_cuero', op(0.35, 0.9, 0.1));
    if (a.cuerpo) { grabacion('foley_madera', op(0.4, 0.9, 0.28, { pasoBajo: 2500 })); return true; }   // bate, hacha, mazo: el mango en la mano
    grabacion(pesada ? 'foley_metal_pesado' : 'foley_madera', op(0.42, pesada ? 0.85 : 1, 0.28, { pasoBajo: pesada ? 4500 : 2800, desde: pesada ? 0.07 : 0 }));
    grabacion('foley_traqueteo', op(0.1, 1, 0.3, { pasoAlto: 1500, dur: 0.12 }));
    return true;
  }

  const PESADAS = new Set(['magnum', 'deagle', 'python', 'barrett', 'm2', 'mosin', 'svd', 'garand']);
  const LIVIANAS = new Set(['glock', 'uzi', 'p90', 'mp5', 'mauser', 'colt1911', 'ppk', 'vector', 'beretta92']);

  /* ---------- Minigun M134 ----------
   * Cada tiro es corto y seco (a 30 por segundo se encadenan en el «brrrrt»); por debajo suenan, mientras los cañones
   * giran, el motor eléctrico (dos osciladores que suben de tono con la velocidad), el silbido de los cañones con el
   * traqueteo de los seis al pasar, y mientras tira, un rugido grave cortado a la cadencia. Lo continuo se actualiza en
   * cada cuadro (Audio_.minigun): si dejan de llegar llamadas (pausa, menú, otra arma) se apaga solo. */
  function tiroMinigun() {
    const v = 0.92 + Math.random() * 0.16;
    ruido({ dur: 0.045, vol: 0.42, filtro: 'lowpass', freq: 5200 * v, freqFin: 520, q: 0.7, ataque: 0.0005, sat: 3, rev: interior ? 0.12 : 0.02, eco: interior ? 0.08 : 0 });
    tono({ desde: 150 * v, hasta: 58, dur: 0.05, vol: 0.32, ataque: 0.0006, sat: 1.8 });
  }
  let motor = null;
  function crearMotor() {
    const nodos = [], nuevo = (n, arrancar = false) => { if (arrancar) nodos.push(n); return n; };
    // Motor eléctrico: diente de sierra y su octava cuadrada, por un pasabajos
    const zumbido = ctx.createBiquadFilter(); zumbido.type = 'lowpass'; zumbido.frequency.value = 1400; zumbido.Q.value = 2.5;
    const o1 = nuevo(ctx.createOscillator(), true); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = nuevo(ctx.createOscillator(), true); o2.type = 'square'; o2.frequency.value = 110;
    const g1 = ctx.createGain(); g1.gain.value = 0.55; const g2 = ctx.createGain(); g2.gain.value = 0.16;
    o1.connect(g1); g1.connect(zumbido); o2.connect(g2); g2.connect(zumbido);
    // Silbido de los cañones: ruido en banda que sube con la velocidad, con el traqueteo de los seis cañones al pasar
    const aire = nuevo(ctx.createBufferSource(), true); aire.buffer = bufferRuido; aire.loop = true;
    const banda = ctx.createBiquadFilter(); banda.type = 'bandpass'; banda.frequency.value = 300; banda.Q.value = 1.3;
    const traqueteo = ctx.createGain(); traqueteo.gain.value = 0.55;
    const pasoCanon = nuevo(ctx.createOscillator(), true); pasoCanon.type = 'triangle'; pasoCanon.frequency.value = 4;
    const pasoCanonG = ctx.createGain(); pasoCanonG.gain.value = 0.45; pasoCanon.connect(pasoCanonG); pasoCanonG.connect(traqueteo.gain);
    aire.connect(banda); banda.connect(traqueteo);
    const salidaMotor = ctx.createGain(); salidaMotor.gain.value = 0;
    zumbido.connect(salidaMotor); const aireG = ctx.createGain(); aireG.gain.value = 1.6; traqueteo.connect(aireG); aireG.connect(salidaMotor);
    conectar(salidaMotor, 0.08, 0);
    // Rugido de la ráfaga: ruido grave saturado, con un golpe por tiro (diente de sierra invertido a la cadencia)
    const rugido = nuevo(ctx.createBufferSource(), true); rugido.buffer = bufferRuido; rugido.loop = true;
    const grave = ctx.createBiquadFilter(); grave.type = 'lowpass'; grave.frequency.value = 1100; grave.Q.value = 0.8;
    const golpes = ctx.createGain(); golpes.gain.value = 0.5;
    const cadencia = nuevo(ctx.createOscillator(), true); cadencia.type = 'sawtooth'; cadencia.frequency.value = 33;
    const cadenciaG = ctx.createGain(); cadenciaG.gain.value = -0.5; cadencia.connect(cadenciaG); cadenciaG.connect(golpes.gain);
    rugido.connect(grave); grave.connect(golpes);
    const salidaRafaga = ctx.createGain(); salidaRafaga.gain.value = 0;
    saturar(golpes, 2.2).connect(salidaRafaga);
    conectar(salidaRafaga, 0.25, 0.12);
    const t = ctx.currentTime;
    for (const n of nodos) n.start(t, n.buffer ? Math.random() * 1.5 : 0);
    motor = { o1, o2, banda, pasoCanon, cadencia, salidaMotor, salidaRafaga, nodos, reloj: 0 };
  }
  function apagarMotor() {
    if (!motor) return;
    const m = motor; motor = null;
    clearTimeout(m.reloj);
    const t = ctx.currentTime;
    m.salidaMotor.gain.cancelScheduledValues(t); m.salidaMotor.gain.setTargetAtTime(0, t, 0.03);
    m.salidaRafaga.gain.cancelScheduledValues(t); m.salidaRafaga.gain.setTargetAtTime(0, t, 0.03);
    for (const n of m.nodos) { try { n.stop(t + 0.3); } catch { /* ya parado */ } }
  }
  // Valor con «hombre muerto»: va hacia `valor` y, si en 0,2 s no llega otra llamada, cae a cero solo
  function sostener(param, valor, t, subida) {
    param.cancelScheduledValues(t);
    param.setTargetAtTime(valor, t, subida);
    param.setTargetAtTime(0, t + 0.2, 0.06);
  }

  /* ---------- El cazador: el susurro y el machete, con síntesis propia ----------
   * Nada de grabaciones de películas ni de juegos: cada sonido se arma de cero con aire (ruido), filtros y osciladores,
   * con tiempos y timbres propios. Los generadores reciben el contexto, la salida y el momento, así se pueden escuchar
   * fuera del juego (Audio_.generadores con un OfflineAudioContext); en el juego pasan por la mezcla de efectos.
   *
   * Susurro «ki ki ki ki… ma ma ma ma», medido contra una grabación de referencia del efecto clásico (Leandro la
   * eligió: «así debe sonar»). Lo que se copió son medidas, no el sonido: pulso, volumen de cada sílaba y timbre.
   *   Pulso: una sílaba cada 0,4 s de punta a punta, y el primer «ma» un pulso después del último «ki» (sin pausa).
   *   «ki»  corto y casi un «ch»: un soplido ancho al soltar la «k» (pico a los ~25 ms), una resonancia angosta en
   *         2,78 kHz (ancho ~300 Hz, como la de la referencia) que pica a los 55 ms, y la «i» floja (F1 500 y F2
   *         1800 Hz) que asoma a los 70 ms; a los 100 ms está 7 dB abajo y a los 150 ms, 17. Reparto: la mitad de la
   *         energía entre 2,6 y 3,6 kHz, como en la referencia.
   *   «ma»  la «m», un murmullo nasal grave (voz por debajo de 300 Hz); la «a», aire con un hilo de voz grave que cae
   *         (de 88 Hz, más bajo en cada «ma», con un temblor) por sus formantes (780, 1180, 2500 y 3400 Hz), el
   *         primero subiendo de 320 a 780 al abrir la boca.
   *   Volúmenes (dB A, re el primer «ki»), como en la referencia: «ki» 0 · 0 · −5 · −9,5; «ma» +6 · +6,5 · −2 · −7,
   *   y la cola del eco −14 · −20 · −27.
   *   El espacio: un eco al mismo paso (0,4 s) que rebota de un lado al otro y se oscurece, y una sala larga.
   * Machete: el tajo en el aire (aire que barre de grave a agudo y vuelve, el silbido del filo y el peso de la hoja,
   * de izquierda a derecha) y el golpe (el filo que muerde, el golpe sordo, la carne y, si es fuerte, el hueso, y la
   * hoja que queda vibrando). Al sacarlo no suena nada de arma: sólo el susurro.
   */
  const ruidosPorContexto = new WeakMap(), salasPorContexto = new WeakMap();
  function ruidoDe(ac) {
    let b = ruidosPorContexto.get(ac);
    if (!b) {
      b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      ruidosPorContexto.set(ac, b);
    }
    return b;
  }
  function aire(ac, t, dur) { const s = ac.createBufferSource(); s.buffer = ruidoDe(ac); s.loop = true; s.start(t, Math.random() * 1.6); s.stop(t + dur + 0.05); return s; }
  function filtro(ac, tipo, f, q = 1) { const b = ac.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; return b; }
  function ganancia(ac, v = 1) { const g = ac.createGain(); g.gain.value = v; return g; }
  // Envolvente por puntos [[t, valor], …], con rampas exponenciales (nunca a cero exacto)
  function curva(param, puntos) {
    const [[t0, v0], ...resto] = puntos;
    param.setValueAtTime(Math.max(v0, 0.0001), t0);
    for (const [t, v] of resto) param.exponentialRampToValueAtTime(Math.max(v, 0.0001), t);
  }
  // Sala larga: respuesta al impulso estéreo que decae y se oscurece (una por contexto)
  function salaLarga(ac, dur = 2.4) {
    let b = salasPorContexto.get(ac);
    if (!b) {
      const n = Math.floor(ac.sampleRate * dur); b = ac.createBuffer(2, n, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = b.getChannelData(c); let previo = 0;
        for (let i = 0; i < n; i++) { const t = i / n, k = 0.3 + 0.65 * t; previo = previo * k + (Math.random() * 2 - 1) * (1 - k); d[i] = previo * Math.pow(1 - t, 2.4) * 2.4; }
      }
      salasPorContexto.set(ac, b);
    }
    const conv = ac.createConvolver(); conv.buffer = b; return conv;
  }
  // Eco que va y vuelve entre la izquierda y la derecha, más oscuro en cada vuelta
  function ecoIdaVuelta(ac, salida, tiempo, vuelta, brillo, nodos) {
    const entrada = ganancia(ac), dI = ac.createDelay(2), dD = ac.createDelay(2), une = ac.createChannelMerger(2);
    dI.delayTime.value = tiempo; dD.delayTime.value = tiempo * 1.07;
    const fI = filtro(ac, 'lowpass', brillo, 0.5), fD = filtro(ac, 'lowpass', brillo * 0.85, 0.5), gI = ganancia(ac, vuelta), gD = ganancia(ac, vuelta);
    entrada.connect(dI); dI.connect(fI); fI.connect(gI); gI.connect(dD); dD.connect(fD); fD.connect(gD); gD.connect(dI);
    fI.connect(une, 0, 0); fD.connect(une, 0, 1); une.connect(salida);
    nodos.push(entrada, dI, dD, fI, fD, gI, gD, une);   // el lazo se desarma al terminar (si no, quedaría vivo)
    return entrada;
  }
  // El «ki», ajustable para probar variantes (op de silabaKi): cuánto suenan la «k», el soplido, la resonancia
  // (cuerpo), F1 y F2 de la «i», dónde están las resonancias y cuánto tiembla el aire
  const SILABA_KI = { k: 0.1, soplo: 0.14, cuerpo: 1, f1g: 0.21, f2g: 0.35, f2: 1800, q2: 4, f3: 2780, q3: 9, f4: 3680, q4: 8, g4: 0.3, aspereza: 8 };
  // variacion (0…1): corre la resonancia ±30 Hz, para que los cuatro «ki» no salgan iguales
  function silabaKi(ac, destino, t, v, variacion, op = {}) {
    const p = { ...SILABA_KI, ...op }, d = 0.23, f3 = p.f3 + (variacion - 0.5) * 60;
    const raspa = ganancia(ac, 1); raspa.connect(destino);                     // el aire tiembla: susurro rasposo, con fuerza
    if (p.aspereza) { const r = aire(ac, t, d), rl = filtro(ac, 'lowpass', 45, 0.7), rg = ganancia(ac, p.aspereza); r.connect(rl); rl.connect(rg); rg.connect(raspa.gain); }
    const ae = aire(ac, t, 0.04), eh = filtro(ac, 'highpass', 1500, 0.7), eb = filtro(ac, 'bandpass', 2900, 1), ge = ganancia(ac, 0);   // la «k»
    curva(ge.gain, [[t, 0.0001], [t + 0.0008, p.k * v], [t + 0.012, 0.09 * p.k * v], [t + 0.03, 0.0001]]);
    ae.connect(eh); eh.connect(eb); eb.connect(ge); ge.connect(destino);
    const as = aire(ac, t, d), sh = filtro(ac, 'highpass', 1500, 0.7), sl = filtro(ac, 'lowpass', 10000, 0.7), gs = ganancia(ac, 0);   // el soplido ancho al soltarla
    curva(gs.gain, [[t, 0.0001], [t + 0.008, 0.3 * p.soplo * v], [t + 0.025, p.soplo * v], [t + 0.04, 0.9 * p.soplo * v], [t + 0.06, 0.5 * p.soplo * v], [t + 0.085, 0.15 * p.soplo * v], [t + 0.105, 0.0001]]);
    as.connect(sh); sh.connect(sl); sl.connect(gs); gs.connect(raspa);
    // El cuerpo: la resonancia angosta en ~2,78 kHz (y la de 3,68), que sube despacio hasta los 55 ms y se apaga como
    // en la referencia (−7 dB a los 100 ms, −17 a los 150)
    const ar = aire(ac, t, d), gc = ganancia(ac, 0);
    for (const [fr, q, g] of [[f3, p.q3, 1], [p.f4, p.q4, p.g4]]) { const b = filtro(ac, 'bandpass', fr, q), bg = ganancia(ac, g); ar.connect(b); b.connect(bg); bg.connect(gc); }
    const c = p.cuerpo * v;
    curva(gc.gain, [[t + 0.004, 0.0001], [t + 0.012, 0.15 * c], [t + 0.022, 0.35 * c], [t + 0.032, 0.55 * c], [t + 0.042, 0.75 * c], [t + 0.055, c], [t + 0.07, 0.95 * c],
      [t + 0.085, 0.68 * c], [t + 0.1, 0.5 * c], [t + 0.12, 0.38 * c], [t + 0.14, 0.25 * c], [t + 0.16, 0.14 * c], [t + 0.19, 0.06 * c], [t + d, 0.0001]]);
    gc.connect(raspa);
    const b2 = filtro(ac, 'bandpass', p.f2, p.q2), b1 = filtro(ac, 'bandpass', 500, 2), g1 = ganancia(ac, p.f1g / p.f2g), g2 = ganancia(ac, 0);   // F1 y F2: la «i» que asoma
    ar.connect(b2); b2.connect(g2); ar.connect(b1); b1.connect(g1); g1.connect(g2); g2.connect(raspa);
    curva(g2.gain, [[t + 0.03, 0.0001], [t + 0.07, p.f2g * v], [t + 0.11, 0.55 * p.f2g * v], [t + 0.15, 0.2 * p.f2g * v], [t + 0.21, 0.0001]]);
  }
  function silabaMa(ac, destino, t, v, altura, voz0 = 0.2) {
    const dur = 0.32, a = aire(ac, t, dur);
    const voz = ac.createOscillator(); voz.type = 'sawtooth';
    curva(voz.frequency, [[t, altura], [t + dur, altura * 0.86]]);
    const temblor = ac.createOscillator(), gt = ganancia(ac, altura * 0.018); temblor.frequency.value = 5.5 + Math.random() * 1.5; temblor.connect(gt); gt.connect(voz.frequency);
    voz.start(t); voz.stop(t + dur + 0.05); temblor.start(t); temblor.stop(t + dur + 0.05);
    const gm = ganancia(ac, 0), nasal = filtro(ac, 'lowpass', 300, 1.2), vozM = ganancia(ac, 0.55), aireM = ganancia(ac, 0.25), aireMf = filtro(ac, 'lowpass', 450, 0.7);   // la «m»
    voz.connect(vozM); vozM.connect(nasal); a.connect(aireMf); aireMf.connect(aireM); aireM.connect(nasal); nasal.connect(gm); gm.connect(destino);
    curva(gm.gain, [[t, 0.0001], [t + 0.016, 0.35 * v], [t + 0.055, 0.28 * v], [t + 0.08, 0.0001]]);
    const mezcla = ganancia(ac), ga = ganancia(ac, 0), aireA = ganancia(ac, 0.9), vozA = ganancia(ac, voz0);             // la «a»
    a.connect(aireA); aireA.connect(mezcla); voz.connect(vozA); vozA.connect(mezcla);
    for (const [fr, q, g] of [[780, 4.5, 1.0], [1180, 7, 0.7], [2500, 10, 0.32], [3400, 10, 0.16]]) {
      const b = filtro(ac, 'bandpass', fr, q);
      if (fr === 780) { b.frequency.setValueAtTime(320, t + 0.04); b.frequency.exponentialRampToValueAtTime(780, t + 0.085); }
      const bg = ganancia(ac, g); mezcla.connect(b); b.connect(bg); bg.connect(ga);
    }
    curva(ga.gain, [[t + 0.045, 0.0001], [t + 0.08, v], [t + 0.15, 0.7 * v], [t + dur, 0.0001]]);
    ga.connect(destino);
  }
  // op: ki y ma (cuántas), paso (s entre sílabas), pausa (s del último «ki» al primer «ma»), altura (Hz de la voz de la
  // «a»), voz (cuánta voz lleva la «a»: 0 susurro puro), eco (s), vuelta (cuánto vuelve el eco en cada rebote), mojado
  // (cuánto eco se oye), sala (envío a la sala), nivelKi (los «ki» contra los «ma»), fuerzaKi y fuerzaMa (cada sílaba),
  // retraso (s hasta el primer «ki») y silabaKi (cambios al «ki»: ver SILABA_KI)
  // Todo medido contra la referencia (ver arriba): queda a menos de 1 dB de ella en cada uno de los 11 pulsos
  const SUSURRO = { ki: 4, ma: 4, pasoKi: 0.4, pasoMa: 0.4, pausa: 0.4, altura: 88, voz: 0.35, eco: 0.4, vuelta: 0.5, mojado: 0.55, sala: 0.35,
    nivelKi: 0.5, fuerzaKi: [1, 0.94, 0.4, 0.28], fuerzaMa: [1, 1, 0.27, 0.135], retraso: 0 };
  // Cuánto dura el susurro (s) desde el primer «ki» hasta que termina el último «ma» (sin la cola del eco)
  const duracionSusurro = (op = {}) => { const o = { ...SUSURRO, ...op }; return (o.ki - 1) * o.pasoKi + o.pausa + (o.ma - 1) * o.pasoMa + 0.35; };
  function genSusurro(ac, salida, t0, nodos, op = {}) {
    const o = { ...SUSURRO, ...op }; t0 += o.retraso;
    const seco = ganancia(ac, 1); seco.connect(salida);
    const mojado = ganancia(ac, o.mojado); mojado.connect(salida);
    seco.connect(ecoIdaVuelta(ac, mojado, o.eco, o.vuelta, 2600, nodos));
    const sala = salaLarga(ac), envio = ganancia(ac, o.sala); seco.connect(envio); envio.connect(sala); sala.connect(salida); nodos.push(seco, mojado, envio, sala);
    const v = 0.9 + Math.random() * 0.15, jit = () => (Math.random() - 0.5) * 0.015, fuerza = (l, k) => l[Math.min(k, l.length - 1)];
    for (let k = 0; k < o.ki; k++) silabaKi(ac, seco, t0 + k * o.pasoKi + jit(), v * o.nivelKi * fuerza(o.fuerzaKi, k), Math.random(), o.silabaKi);
    const tMa = t0 + (o.ki - 1) * o.pasoKi + o.pausa;
    for (let k = 0; k < o.ma; k++) silabaMa(ac, seco, tMa + k * o.pasoMa + jit(), v * 0.9 * fuerza(o.fuerzaMa, k), o.altura * (1 - k * 0.032), o.voz);
    return tMa + (o.ma - 1) * o.pasoMa + 0.35 + o.eco * 14;   // hasta que se apaga el eco
  }
  function genTajo(ac, salida, t0, nodos, fuerza = 1) {
    const d = 0.3, a = aire(ac, t0, d), lado = ac.createStereoPanner();
    lado.pan.setValueAtTime(-0.55, t0); lado.pan.linearRampToValueAtTime(0.55, t0 + d); lado.connect(salida); nodos.push(lado);
    const bp = filtro(ac, 'bandpass', 350, 1.4), g = ganancia(ac, 0);                       // el aire que barre la hoja
    curva(bp.frequency, [[t0, 350], [t0 + 0.13, 1900], [t0 + d, 600]]);
    curva(g.gain, [[t0, 0.0001], [t0 + 0.12, 0.8 * fuerza], [t0 + 0.17, 0.45 * fuerza], [t0 + d, 0.0001]]);
    a.connect(bp); bp.connect(g); g.connect(lado);
    const hp = filtro(ac, 'highpass', 4200, 0.7), bp2 = filtro(ac, 'bandpass', 6500, 0.9), g2 = ganancia(ac, 0);   // el silbido del filo
    curva(g2.gain, [[t0 + 0.08, 0.0001], [t0 + 0.135, 0.35 * fuerza], [t0 + 0.2, 0.0001]]);
    a.connect(hp); hp.connect(bp2); bp2.connect(g2); g2.connect(lado);
    const o = ac.createOscillator(), go = ganancia(ac, 0); o.type = 'sine';                // el peso de la hoja
    curva(o.frequency, [[t0, 120], [t0 + 0.13, 190], [t0 + d, 110]]);
    curva(go.gain, [[t0 + 0.04, 0.0001], [t0 + 0.13, 0.14 * fuerza], [t0 + d, 0.0001]]);
    o.connect(go); go.connect(lado); o.start(t0); o.stop(t0 + d + 0.05);
    return t0 + d + 0.1;
  }
  function genGolpe(ac, salida, t0, nodos, fuerte = false) {
    const a = aire(ac, t0, 0.4);
    const hp = filtro(ac, 'highpass', 2800, 0.7), g1 = ganancia(ac, 0);                      // el filo que muerde
    curva(g1.gain, [[t0, 0.0001], [t0 + 0.0015, 0.42], [t0 + 0.05, 0.0001]]); a.connect(hp); hp.connect(g1); g1.connect(salida);
    const o = ac.createOscillator(), go = ganancia(ac, 0); o.type = 'sine';                // el golpe sordo en el cuerpo
    curva(o.frequency, [[t0, 150], [t0 + 0.1, 55]]); curva(go.gain, [[t0, 0.0001], [t0 + 0.002, fuerte ? 0.5 : 0.36], [t0 + 0.15, 0.0001]]);
    o.connect(go); go.connect(salida); o.start(t0); o.stop(t0 + 0.2);
    let t = t0 + 0.004;                                                                      // la carne: chasquidos húmedos
    for (let k = 0; k < 4; k++) {
      const b = filtro(ac, 'bandpass', 800 + Math.random() * 700, 2), gb = ganancia(ac, 0), dur = 0.012 + Math.random() * 0.012;
      curva(gb.gain, [[t, 0.0001], [t + 0.002, 0.34 * (1 - k * 0.2)], [t + dur, 0.0001]]); a.connect(b); b.connect(gb); gb.connect(salida);
      t += 0.014 + Math.random() * 0.018;
    }
    if (fuerte) for (const dt of [0.01, 0.024, 0.043]) {                                    // el hueso: crujidos secos
      const c = filtro(ac, 'highpass', 2000, 0.8), gc = ganancia(ac, 0);
      curva(gc.gain, [[t0 + dt, 0.0001], [t0 + dt + 0.0008, 0.36], [t0 + dt + 0.005, 0.0001]]); a.connect(c); c.connect(gc); gc.connect(salida);
    }
    for (const [f, v, d] of [[2310, 0.05, 0.38], [3655, 0.035, 0.27], [5120, 0.02, 0.16]]) {   // la hoja queda vibrando
      const p = ac.createOscillator(), gp = ganancia(ac, 0); p.frequency.value = f * (0.99 + Math.random() * 0.02);
      curva(gp.gain, [[t0 + 0.003, 0.0001], [t0 + 0.006, v], [t0 + d, 0.0001]]); p.connect(gp); gp.connect(salida); p.start(t0); p.stop(t0 + d + 0.05);
    }
    return t0 + 0.5;
  }
  /* ---------- El «ping» del M1 Garand ----------
   * Con la última bala el cerrojo queda atrás y el resorte despide el peine en bloque vacío: una U de acero de resorte
   * que pega contra el cajón al salir y sigue sonando en el aire, como una campanita. No hay grabación ni mediciones
   * publicadas del sonido real: es síntesis modal desde la física del peine. Cada pared de la U vibra como una lengüeta
   * de unos 15 mm de acero de 0,8 mm empotrada en el lomo, y eso da el primer modo entre 2,5 y 3,3 kHz. Las dos paredes,
   * acopladas por el lomo, suenan casi iguales y se baten (el temblor de campana, unas 4 veces por segundo); arriba
   * van la torsión (×1,49) y los modos altos, que se apagan antes. El golpe contra el cajón es un chasquido ancho de
   * pocos milisegundos, y al girar en el aire el peine muestra al oído ora el canto, ora la cara: el volumen ondula
   * apenas. modos: [relación con el primero, amplitud, segundos hasta apagarse].
   */
  const PING = { f: 2650, modos: [[1, 1, 1.1], [1.0016, 0.45, 0.95], [1.49, 0.36, 0.5], [2.27, 0.17, 0.28], [2.98, 0.09, 0.16], [4.12, 0.045, 0.09]], giro: 7, ondula: 0.12, golpe: 0.5 };
  function genPing(ac, salida, t0, nodos, op = {}) {
    const o = { ...PING, ...op }, f0 = o.f * (0.97 + Math.random() * 0.06);
    const giro = ac.createOscillator(), prof = ganancia(ac, o.ondula), cuerpo = ganancia(ac, 1 - o.ondula);   // el peine girando
    giro.frequency.value = o.giro * (0.85 + Math.random() * 0.3);
    giro.connect(prof); prof.connect(cuerpo.gain); cuerpo.connect(salida);
    let fin = t0;
    for (const [r, amp, d] of o.modos) {
      const m = ac.createOscillator(), g = ganancia(ac, 0);
      m.frequency.value = f0 * r;
      curva(g.gain, [[t0, 0.0001], [t0 + 0.0012, amp], [t0 + d, 0.0001]]);
      m.connect(g); g.connect(cuerpo); m.start(t0); m.stop(t0 + d + 0.02);
      nodos.push(m, g); fin = Math.max(fin, t0 + d);
    }
    giro.start(t0); giro.stop(fin + 0.02);
    const a = aire(ac, t0, 0.03), bp = filtro(ac, 'bandpass', 6500, 0.9), gc = ganancia(ac, 0);                 // el golpe contra el cajón
    curva(gc.gain, [[t0, 0.0001], [t0 + 0.0004, o.golpe], [t0 + 0.012, 0.0001]]);
    a.connect(bp); bp.connect(gc); gc.connect(salida);
    nodos.push(giro, prof, cuerpo, a, bp, gc);
    return fin + 0.05;
  }
  // En el juego: por la mezcla de efectos; al terminar se desarma (los ecos con lazo no se apagan solos)
  function sonar(generador, rev, vol, ...args) {
    if (!asegurar()) return;
    const salida = ganancia(ctx, vol), nodos = [];
    conectar(salida, rev, 0);
    const fin = generador(ctx, salida, ctx.currentTime + 0.01, nodos, ...args);
    setTimeout(() => { salida.disconnect(); for (const n of nodos) n.disconnect(); }, (fin - ctx.currentTime + 0.3) * 1000);
  }

  return {
    activar: asegurar,
    // Versión VR (vr/campo.js): con el visor puesto la página no pinta cuadros con requestAnimationFrame y puede
    // figurar oculta, así que el silencio automático la dejaría muda. Se apaga al entrar
    sinSilencioAutomatico() { vigila = false; silenciar(false); },
    // Volúmenes de la configuración: { general, efectos, musica, silencio }
    volumenes(v) { Object.assign(vol, v); aplicarVolumenes(); },
    // Para la música: el contexto y el canal donde conectarse
    mezclaMusica() { asegurar(); return { ctx, bus: busMusica }; },

    disparo(categoria, armaId) {
      if (!asegurar()) return;
      if (armaId === 'minigun') { tiroMinigun(); return; }   // el rugido de la ráfaga lo pone Audio_.minigun
      if (tiroGrabado(armaId)) return;                       // arma real grabada (arriba); si no hay, el sintetizado
      const pesado = PESADAS.has(armaId) ? 1.35 : LIVIANAS.has(armaId) ? 0.85 : 1;
      switch (categoria) {
        case 'pistola':       detonacion({ crack: 0.9, boom: 0.75 * pesado, boomHz: 650 / pesado, golpeVol: 0.55 * pesado, golpeHz: 190, golpeDur: 0.09 * pesado, cola: 0.22 * pesado, colaDur: 0.45 * pesado, mecanismo: armaId === 'magnum' || armaId === 'python' ? 0 : 0.07 }); break;
        case 'metralleta':    detonacion({ crack: 0.75, boom: 0.6 * pesado, boomHz: 700, golpeVol: 0.45, golpeHz: 170, golpeDur: 0.07, cola: 0.13, colaDur: 0.3, rev: 0.35, eco: 0.4, mecanismo: 0.05 }); break;
        case 'rifle':         detonacion({ crack: 1.0, boom: 0.95 * pesado, boomHz: 480 / pesado, golpeVol: 0.85 * pesado, golpeHz: 130, golpeDur: 0.22 * pesado, cola: 0.32 * pesado, colaDur: 1.0 * pesado, rev: 0.7, eco: 0.85 }); break;
        case 'escopeta':      detonacion({ crack: 0.8, boom: 1.1, boomHz: 330, golpeVol: 1.0, golpeHz: 95, golpeDur: 0.28, cola: 0.36, colaDur: 1.0, rev: 0.65, eco: 0.8 }); break;
        case 'ametralladora': detonacion({ crack: 1.0, boom: 1.0, boomHz: 420, golpeVol: 0.85, golpeHz: 105, golpeDur: 0.14, cola: 0.2, colaDur: 0.5, rev: 0.45, eco: 0.55, mecanismo: 0.08 }); break;
        case 'lanzagranadas': tono({ desde: 170, hasta: 52, dur: 0.24, vol: 0.85, sat: 2.5, rev: 0.06 }); ruido({ dur: 0.16, vol: 0.5, freq: 700, freqFin: 200, sat: 2, rev: 0.06 }); metal({ f: 900, dur: 0.12, vol: 0.12 }); break;
        case 'bazuca':
          detonacion({ crack: 0.6, boom: 1.0, boomHz: 260, golpeVol: 0.9, golpeHz: 70, golpeDur: 0.35, cola: 0.4, colaDur: 1.3, rev: 0.7, eco: 0.8 });
          ruido({ dur: 0.9, vol: 0.28, filtro: 'bandpass', freq: 2200, freqFin: 700, q: 0.8, ataque: 0.03, retraso: 0.05, rev: 0.08 }); break;   // silbido del cohete que se aleja
        case 'granada':       ruido({ dur: 0.25, vol: 0.14, filtro: 'bandpass', freq: 400, freqFin: 1300, q: 1.5, ataque: 0.08 }); break;
        case 'lanzallamas':   // rugido del chorro: las descargas (cada 50 ms) se encadenan; a veces chisporrotea
          ruido({ dur: 0.13, vol: 0.3, filtro: 'lowpass', freq: 850 + Math.random() * 300, freqFin: 480, q: 0.7, ataque: 0.02, rev: 0.05 });
          if (Math.random() < 0.35) ruido({ dur: 0.02, vol: 0.06, filtro: 'highpass', freq: 3200, ataque: 0.001 });
          break;
        case 'laser':
          tono({ tipo: 'sawtooth', desde: 2400, hasta: 260, dur: 0.32, vol: 0.16, rev: 0.12 });
          tono({ desde: 1300, hasta: 90, dur: 0.22, vol: 0.32, sat: 1.5, rev: 0.08 });
          ruido({ dur: 0.08, vol: 0.2, filtro: 'highpass', freq: 5000, ataque: 0.001 }); break;
        default:              detonacion({ crack: 0.8, boom: 0.7, boomHz: 600, golpeVol: 0.5, golpeHz: 170, golpeDur: 0.1, cola: 0.2, colaDur: 0.4 });
      }
    },

    // Explosión de granada o proyectil, fuerte y con peso, sin tonos ni eco de videojuego. El cuerpo es una explosión
    // grabada (Michel Baradari, CC BY 3.0: el estallido ancho y los agudos que se apagan antes que los graves) con
    // otra grabada sólo de graves por debajo (untamedpixels, CC0), cada vez una distinta y a otra velocidad. Encima, lo
    // sintetizado: la presión que se siente en el pecho, el retumbo que rueda y la tierra que cae. Es lo más fuerte
    // del juego: el limitador de la mezcla la contiene sin saturar.
    explosion() {
      asegurar();
      const v = 0.9 + Math.random() * 0.2, rev = interior ? 0.35 : 0.12;
      if (variante('explosion_cuerpo', 2, { vol: 2.6, vel: 0.86 + Math.random() * 0.16, rev, variar: 0 })) {
        variante('explosion_grave', 2, { vol: 2.2, vel: 0.85 + Math.random() * 0.2, rev: 0, variar: 0 });
        tono({ desde: 58 * v, hasta: 24, dur: 0.95, vol: 0.8, ataque: 0.003, sat: 0.6 });
        ruido({ dur: 3.4, vol: 0.28, filtro: 'lowpass', freq: 260, freqFin: 38, q: 0.5, ataque: 0.3, retraso: 0.1, rev: rev * 1.5 });
        for (let k = 0; k < 9; k++) ruido({ dur: 0.03 + Math.random() * 0.06, vol: 0.03 + Math.random() * 0.04, filtro: 'bandpass', freq: 700 + Math.random() * 1600, q: 1.1, ataque: 0.003, retraso: 0.45 + Math.random() * 1.5 });
        return;
      }
      ruido({ dur: 0.12, vol: 0.5, filtro: 'lowpass', freq: 3200 * v, freqFin: 400, q: 0.5, ataque: 0.002, sat: 0.8 });
      ruido({ dur: 1.5, vol: 0.58, filtro: 'lowpass', freq: 700 * v, freqFin: 70, q: 0.6, ataque: 0.008, rev });
      tono({ desde: 62 * v, hasta: 28, dur: 0.7, vol: 0.45, ataque: 0.004 });
      ruido({ dur: 2.6, vol: 0.2, filtro: 'lowpass', freq: 220, freqFin: 45, q: 0.5, ataque: 0.25, retraso: 0.08, rev: rev * 1.5 });
      for (let k = 0; k < 7; k++) ruido({ dur: 0.03 + Math.random() * 0.05, vol: 0.025 + Math.random() * 0.035, filtro: 'bandpass', freq: 900 + Math.random() * 1800, q: 1.2, ataque: 0.003, retraso: 0.35 + Math.random() * 1.1 });
    },

    // Sonidos de cada fase de las recargas y del accionamiento: grabaciones reales con respaldo sintético
    recarga(evento, armaId) {
      asegurar();
      if (FOLEY_GRANADA[evento] && FOLEY_GRANADA[evento]()) return;   // granada de mano: foley real
      const real = grabacionDeRecarga(evento, armaId);
      if (real && grabacion(real[0], real[1])) return;
      switch (evento) {
        case 'cargador-sacar': metal({ f: 1900, dur: 0.05, vol: 0.18 }); friccion({ desde: 1900, hasta: 900, dur: 0.12, vol: 0.12, retraso: 0.02 }); break;
        case 'cargador-poner': friccion({ desde: 900, hasta: 1600, dur: 0.07, vol: 0.1 }); golpe({ f: 170, dur: 0.06, vol: 0.35, retraso: 0.065 }); metal({ f: 2500, dur: 0.06, vol: 0.2, retraso: 0.07 }); break;
        case 'corredera':      metal({ f: 2000, dur: 0.07, vol: 0.2 }); friccion({ desde: 1200, hasta: 2300, dur: 0.08, vol: 0.1, retraso: 0.01 }); metal({ f: 1650, dur: 0.13, vol: 0.32, retraso: 0.11 }); golpe({ f: 230, dur: 0.05, vol: 0.2, retraso: 0.11 }); break;
        case 'liberar':        metal({ f: 2500, dur: 0.035, vol: 0.14 }); metal({ f: 1650, dur: 0.13, vol: 0.32, retraso: 0.03 }); golpe({ f: 230, dur: 0.05, vol: 0.2, retraso: 0.03 }); break;
        case 'cerrojo':        metal({ f: 1500, dur: 0.08, vol: 0.24 }); friccion({ desde: 1000, hasta: 1900, dur: 0.1, vol: 0.12, retraso: 0.02 }); metal({ f: 1250, dur: 0.15, vol: 0.32, retraso: 0.13 }); golpe({ f: 180, dur: 0.06, vol: 0.25, retraso: 0.13 }); break;
        case 'cerrojo-abrir':  metal({ f: 1400, dur: 0.07, vol: 0.24 }); friccion({ desde: 1700, hasta: 900, dur: 0.12, vol: 0.13, retraso: 0.03 }); break;
        case 'palmada':        golpe({ f: 140, dur: 0.05, vol: 0.32 }); metal({ f: 1500, dur: 0.13, vol: 0.3, retraso: 0.04 }); break;
        case 'cierra-solo':    friccion({ desde: 2000, hasta: 1000, dur: 0.05, vol: 0.1 }); metal({ f: 1350, dur: 0.16, vol: 0.34, retraso: 0.04 }); golpe({ f: 150, dur: 0.05, vol: 0.28, retraso: 0.04 }); break;
        case 'palmada-hk':     golpe({ f: 150, dur: 0.04, vol: 0.28 }); friccion({ desde: 2100, hasta: 1000, dur: 0.06, vol: 0.12, retraso: 0.03 }); metal({ f: 1350, dur: 0.16, vol: 0.36, retraso: 0.05 }); break;
        case 'bombear':        friccion({ desde: 800, hasta: 1500, dur: 0.08, vol: 0.2 }); metal({ f: 1100, dur: 0.08, vol: 0.22, retraso: 0.06 }); friccion({ desde: 1500, hasta: 800, dur: 0.08, vol: 0.2, retraso: 0.13 }); metal({ f: 950, dur: 0.13, vol: 0.32, retraso: 0.2 }); golpe({ f: 170, dur: 0.05, vol: 0.25, retraso: 0.2 }); break;
        case 'palanca':        metal({ f: 1300, dur: 0.07, vol: 0.22 }); friccion({ desde: 900, hasta: 1600, dur: 0.1, vol: 0.12, retraso: 0.03 }); metal({ f: 1100, dur: 0.11, vol: 0.28, retraso: 0.17 }); golpe({ f: 160, dur: 0.05, vol: 0.22, retraso: 0.17 }); break;
        case 'cartucho':       friccion({ desde: 1300, hasta: 2100, dur: 0.05, vol: 0.1 }); golpe({ f: 280, dur: 0.035, vol: 0.16, retraso: 0.045 }); metal({ f: 2200, dur: 0.05, vol: 0.13, retraso: 0.05 }); break;
        case 'bala':           metal({ f: 3300, dur: 0.05, vol: 0.12 }); golpe({ f: 420, dur: 0.02, vol: 0.08, retraso: 0.005 }); break;
        case 'abrir':          metal({ f: 1800, dur: 0.06, vol: 0.2 }); friccion({ desde: 1500, hasta: 800, dur: 0.1, vol: 0.1, retraso: 0.03 }); metal({ f: 1200, dur: 0.1, vol: 0.18, retraso: 0.1 }); break;
        case 'cerrar':         golpe({ f: 180, dur: 0.06, vol: 0.3 }); metal({ f: 1500, dur: 0.14, vol: 0.32, retraso: 0.004 }); break;
        case 'peine':          friccion({ desde: 2400, hasta: 900, dur: 0.18, vol: 0.14 }); for (let k = 0; k < 5; k++) metal({ f: 2600 - k * 120, dur: 0.03, vol: 0.08, retraso: 0.02 + k * 0.03 }); golpe({ f: 220, dur: 0.04, vol: 0.15, retraso: 0.17 }); break;
        case 'speedloader':    friccion({ desde: 1000, hasta: 1800, dur: 0.06, vol: 0.1 }); for (let k = 0; k < 6; k++) metal({ f: 3000 - k * 90, dur: 0.035, vol: 0.07, retraso: 0.04 + k * 0.012 }); metal({ f: 1400, dur: 0.08, vol: 0.18, retraso: 0.13 }); break;
        case 'cinta':          for (let k = 0; k < 7; k++) metal({ f: 2700 + Math.random() * 400, dur: 0.04, vol: 0.07, retraso: k * 0.022 }); golpe({ f: 200, dur: 0.05, vol: 0.2, retraso: 0.16 }); break;
        case 'tapa':           golpe({ f: 120, dur: 0.08, vol: 0.42 }); metal({ f: 880, dur: 0.2, vol: 0.3, retraso: 0.005 }); break;
        case 'pasador':        metal({ f: 3400, dur: 0.05, vol: 0.14 }); friccion({ desde: 2600, hasta: 4000, dur: 0.13, vol: 0.13, retraso: 0.02 }); metal({ f: 5200, dur: 0.05, vol: 0.12, retraso: 0.15 }); metal({ f: 3900, dur: 0.07, vol: 0.1, retraso: 0.17 }); break;   // tirón: el pasador sale raspando y la anilla tintinea
        case 'cuchara':        metal({ f: 2300, dur: 0.2, vol: 0.16 }); metal({ f: 3300, dur: 0.12, vol: 0.09, retraso: 0.008 }); golpe({ f: 600, dur: 0.02, vol: 0.08 }); break;   // la cuchara salta con el resorte
        case 'granada':        metal({ f: 2600, dur: 0.05, vol: 0.12 }); friccion({ desde: 1500, hasta: 2500, dur: 0.06, vol: 0.06, retraso: 0.03 }); break;
        case 'celda':          tono({ desde: 300, hasta: 1500, dur: 0.28, vol: 0.14, rev: 0.4 }); tono({ desde: 1800, hasta: 2600, dur: 0.18, vol: 0.05, retraso: 0.22, rev: 0.4 }); golpe({ f: 200, dur: 0.04, vol: 0.15 }); break;
        default:               metal({ f: 1500, dur: 0.06, vol: 0.2 });
      }
    },

    // Lo que cae al piso: latón real que rebota (más agudo cuanto más chica la vaina), cartuchos de plástico,
    // cargadores que golpean. En la arena suena apagado y más bajo. Máximo 4 en 120 ms para no saturar con ráfagas.
    casquillo(tipo, superficie = 'asfalto', fuerza = 1) {
      asegurar();
      const ahora = ctx.currentTime;
      this._casquillos = (this._casquillos || []).filter(t => ahora - t < 0.12);
      if (this._casquillos.length >= 4) return;
      this._casquillos.push(ahora);
      const arena = superficie === 'arena';
      const nivel = (0.55 + fuerza * 0.45) * (arena ? 0.45 : 1);
      const filtro = arena ? 1300 : 0;
      const op = (vol, vel) => ({ vol: vol * nivel, vel, rev: 0.05, pasoBajo: filtro });
      let sono = false;
      switch (tipo) {
        case 'pistola':   sono = variante('casquillo_cae', 4, op(0.3, 1.45 + Math.random() * 0.15)); break;
        case 'bala':      sono = Math.random() < 0.5 ? grabacion('casquillo_rebote_1', op(0.32, 1.1 + Math.random() * 0.12)) : variante('casquillo_cae', 4, op(0.32, 1.12)); break;
        case 'grande':    sono = grabacion('casquillo_rebote_1', op(0.42, 0.8 + Math.random() * 0.06)); break;
        case 'escopeta':  sono = grabacion('cartucho_cae', op(0.36, 0.95 + Math.random() * 0.12)); break;
        case 'granada40': sono = grabacion('casquillo_rebote_1', op(0.36, 0.62)); break;
        case 'cargador':  sono = grabacion('cargador_al_piso', op(1, 0.9)); break;
        case 'cargadorPistola': sono = grabacion('cargador_al_piso', op(0.75, 1.2)); break;
        case 'tambor':    sono = grabacion('cargador_al_piso', op(1.1, 0.7)); break;
        case 'speedloader': sono = grabacion('cargador_al_piso', op(0.5, 1.35)); break;
        case 'peine':     sono = grabacion('cargador_al_piso', op(0.4, 1.5)); break;
        case 'enBloque':  sono = grabacion('cargador_al_piso', op(0.45, 1.4)); break;
        case 'pasador':   metal({ f: 4800, dur: 0.06, vol: 0.09 * nivel }); metal({ f: 3600, dur: 0.08, vol: 0.07 * nivel, retraso: 0.05 }); sono = true; break;
      }
      if (sono) return;
      if (tipo === 'escopeta') { golpe({ f: 520, dur: 0.025, vol: 0.05 }); metal({ f: 2100, dur: 0.05, vol: 0.03 }); }
      else metal({ f: 3900, dur: 0.12, vol: 0.06 * nivel });
    },

    vacio() { asegurar(); if (grabacion('gatillo_en_seco', { rev: 0.05 })) return; metal({ f: 2900, dur: 0.025, vol: 0.15, rev: 0 }); golpe({ f: 500, dur: 0.015, vol: 0.07 }); },

    // Gemido de zombie grabado; más bajo y más reverberado cuanto más lejos está
    // Gruñido de animal zombie: ruido grave y una sierra cortados a 22-34 golpes por segundo (la garganta que
    // vibra), que crece y termina en un ladrido o un bramido si ataca. tamaño: 0,5 gato … 1 perro … 2 toro.
    gruñido(distancia = 200, tamaño = 1, ataca = false) {
      if (!asegurar() || oculto) return;
      const cerca = Math.max(0.12, 1 - distancia / 650), t = ctx.currentTime, dur = (ataca ? 0.5 : 0.9 + Math.random() * 0.6) * Math.min(1.5, 0.7 + tamaño * 0.3);
      const vol = (ataca ? 0.5 : 0.32) * cerca, grave = 1 / Math.sqrt(tamaño);
      const am = ctx.createGain(); am.gain.value = 0;
      const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = (22 + Math.random() * 12) * Math.min(1.3, grave);
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.5; lfo.connect(lfoG); lfoG.connect(am.gain);
      const base = ctx.createConstantSource(); base.offset.value = 0.5; base.connect(am.gain);
      const fuente = ctx.createBufferSource(); fuente.buffer = bufferRuido;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.2; f.frequency.setValueAtTime(320 * grave, t); f.frequency.linearRampToValueAtTime(420 * grave, t + dur);
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95 * grave, t); o.frequency.linearRampToValueAtTime(75 * grave, t + dur);
      const pb = ctx.createBiquadFilter(); pb.type = 'lowpass'; pb.frequency.value = 650 * grave;
      const mezcla = ctx.createGain(); mezcla.gain.value = 0.6;
      fuente.connect(f); f.connect(am); o.connect(pb); pb.connect(mezcla); mezcla.connect(am);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.12); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      saturar(am, 2.5).connect(g); conectar(g, 0.12 + (1 - cerca) * 0.3, 0.05);
      for (const n of [lfo, base, fuente, o]) { n.start(t); n.stop(t + dur + 0.05); }
      if (ataca) { ruido({ dur: 0.12, vol: vol * 0.9, filtro: 'bandpass', freq: 700 * grave, freqFin: 300 * grave, q: 1.5, retraso: dur * 0.85, sat: 3, rev: 0.12 }); tono({ tipo: 'sawtooth', desde: 260 * grave, hasta: 140 * grave, dur: 0.12, vol: vol * 0.5, retraso: dur * 0.85, sat: 2 }); }
    },
    gemido(fuerte = false, distancia = 200) {
      asegurar();
      const cerca = Math.max(0.15, 1 - distancia / 600);
      if (variante('zombie_gemido', 8, { vol: (fuerte ? 1 : 0.55) * cerca, vel: 0.88 + Math.random() * 0.2, rev: 0.25 + (1 - cerca) * 0.5 })) return;
      this.gemidoSintetico(fuerte);
    },
    // Respaldo sintético: diente de sierra grave pasado por dos formantes, con temblor
    gemidoSintetico(fuerte = false) {
      const t = ctx.currentTime, dur = 0.9 + Math.random() * 0.6, base = 85 + Math.random() * 40;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(base * 1.15, t); o.frequency.exponentialRampToValueAtTime(base * 0.8, t + dur);
      const vib = ctx.createOscillator(); vib.frequency.value = 5 + Math.random() * 3;
      const vibG = ctx.createGain(); vibG.gain.value = base * 0.04; vib.connect(vibG); vibG.connect(o.frequency);
      const g = ctx.createGain(); envolvente(g, t, fuerte ? 0.18 : 0.07, 0.15, dur);
      [[480, 6], [1050, 8]].forEach(([fr, q]) => { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr * (0.9 + Math.random() * 0.2); f.Q.value = q; o.connect(f); f.connect(g); });
      conectar(g, 0.35, 0);
      o.start(t); vib.start(t); o.stop(t + dur + 0.2); vib.stop(t + dur + 0.2);
      ruido({ dur: dur * 0.7, vol: fuerte ? 0.05 : 0.02, filtro: 'bandpass', freq: 700, q: 2, ataque: 0.1 });   // aire y gorgoteo
    },
    // Animal zombie que muere: chillido que se quiebra hacia abajo (más grave cuanto más grande) y un estertor
    animalMuere(tamaño = 1) {
      if (!asegurar()) return;
      const g = 1 / Math.sqrt(tamaño);
      tono({ tipo: 'sawtooth', desde: 900 * g, hasta: 260 * g, dur: 0.38, vol: 0.22, sat: 2.5, rev: 0.25 });
      tono({ tipo: 'square', desde: 640 * g, hasta: 200 * g, dur: 0.3, vol: 0.06, retraso: 0.02, rev: 0.2 });
      ruido({ dur: 0.35, vol: 0.12, filtro: 'bandpass', freq: 1200 * g, freqFin: 400 * g, q: 2, rev: 0.2 });
      ruido({ dur: 0.5, vol: 0.06, filtro: 'bandpass', freq: 300 * g, q: 3, ataque: 0.05, retraso: 0.45, rev: 0.15 });   // estertor
    },
    // El cuerpo del animal que cae al piso (y rebota); los grandes retumban
    cuerpoAnimalCae(tamaño = 1, fuerza = 1) {
      if (!asegurar()) return;
      variante('cuerpo_cae', 2, { vol: Math.min(0.9, 0.35 + 0.25 * tamaño) * fuerza, vel: Math.max(0.6, 1.15 - tamaño * 0.2), rev: 0.1 });
      golpe({ f: 140 / Math.sqrt(tamaño), dur: 0.1 + 0.05 * tamaño, vol: Math.min(0.5, 0.18 * tamaño) * fuerza });
    },
    // conCaida: false cuando el cuerpo sale despedido y el golpe contra el piso suena recién al caer
    zombieMuere(conCaida = true) {
      asegurar();
      if (variante('zombie_muerte', 4, { vol: 0.85, vel: 0.9 + Math.random() * 0.15, rev: 0.2 })) {
        if (conCaida) { variante('cuerpo_cae', 2, { vol: 0.55, retraso: 0.32, rev: 0.1 }); golpe({ f: 95, dur: 0.12, vol: 0.28, retraso: 0.34 }); }   // el peso del cuerpo contra el piso
        return;
      }
      this.gemidoSintetico(true); if (conCaida) golpe({ f: 110, dur: 0.12, vol: 0.3, retraso: 0.35 });
    },
    zombieGolpea() {
      asegurar();
      variante('zombie_ataque', 6, { vol: 0.9, vel: 0.92 + Math.random() * 0.16, rev: 0.12 });
      golpe({ f: 120, dur: 0.07, vol: 0.32 }); ruido({ dur: 0.08, vol: 0.14, filtro: 'bandpass', freq: 900, q: 1.5 });   // manotazo
    },
    // Bala que entra en la carne (con un tope para que las escopetas no saturen)
    impactoCarne() {
      asegurar();
      const ahora = ctx.currentTime;
      if (this._ultimoImpacto && ahora - this._ultimoImpacto < 0.035) return;
      this._ultimoImpacto = ahora;
      if (!variante('impacto_carne', 5, { vol: 0.75, vel: 0.85 + Math.random() * 0.3, rev: 0.05 })) ruido({ dur: 0.06, vol: 0.2, filtro: 'bandpass', freq: 700, q: 1.2 });
      golpe({ f: 160, dur: 0.04, vol: 0.18 });
    },
    // Pasos del protagonista: asfalto en la calle, arena en las montañas y en el campo
    paso(superficie = 'asfalto', fuerza = 1) {
      asegurar();
      variante(superficie === 'arena' ? 'paso_arena' : 'paso_asfalto', 6, { vol: 0.15 * fuerza, vel: 0.9 + Math.random() * 0.2, rev: 0.03 });
    },
    aterrizar(superficie = 'asfalto') {
      asegurar();
      this.paso(superficie, 1.5); this.paso(superficie, 1.1);
      golpe({ f: 85, dur: 0.08, vol: 0.1 });
    },
    jugadorHerido() { asegurar(); variante('quejido', 8, { vol: 0.8, vel: 0.95 + Math.random() * 0.1, rev: 0.1 }); },
    jugadorMuere() { asegurar(); grabacion('grito_muerte', { vol: 0.9, rev: 0.35 }); golpe({ f: 90, dur: 0.15, vol: 0.3, retraso: 0.5 }); },
    /* ---------- Cuerpo a cuerpo y legendarias ---------- */
    // Silbido del arma cortando el aire: más grave y lento cuanto más pesada
    blandir(peso = 1, armaId) {
      if (armaId === 'macheteCazador') return sonar(genTajo, 0.05, 0.8, 1);
      asegurar();
      ruido({ dur: 0.22 * peso, vol: 0.22, filtro: 'bandpass', freq: 500 / peso, freqFin: 2200 / peso, q: 2.2, ataque: 0.08 * peso, rev: 0.05 });
    },
    // Impacto: el filo corta (carne y un chasquido agudo), lo contundente hunde (golpe grave y crujido)
    golpeCuerpo(tipo, fuerte = false, armaId) {
      if (armaId === 'macheteCazador') return sonar(genGolpe, 0.06, 0.9, fuerte);
      asegurar();
      if (tipo === 'filo') ruido({ dur: 0.08, vol: 0.18, filtro: 'highpass', freq: 3500, ataque: 0.001 });
      else { tono({ desde: 120, hasta: 55, dur: 0.12, vol: fuerte ? 0.5 : 0.35, sat: 2, ataque: 0.001 }); ruido({ dur: 0.1, vol: 0.2, filtro: 'bandpass', freq: 1400, q: 1.5, ataque: 0.001, retraso: 0.01 }); }
    },
    // Trueno de Mjölnir: chasquido eléctrico y estruendo que retumba
    trueno() {
      asegurar();
      ruido({ dur: 0.06, vol: 0.9, filtro: 'highpass', freq: 2500, ataque: 0.0005, sat: 3 });
      ruido({ dur: 1.8, vol: 0.85, filtro: 'lowpass', freq: 900, freqFin: 70, ataque: 0.01, retraso: 0.04, sat: 2, rev: 0.6 });
      tono({ desde: 70, hasta: 32, dur: 1.4, vol: 0.5, sat: 2, retraso: 0.05, rev: 0.4 });
    },
    // Onda de luz de Excalibur: un acorde que brilla y se va
    ondaLuz() {
      asegurar();
      for (const [f, r] of [[880, 0], [1320, 0.02], [1760, 0.04]]) tono({ desde: f, hasta: f * 1.5, dur: 0.5, vol: 0.09, ataque: 0.01, retraso: r, rev: 0.6 });
      ruido({ dur: 0.4, vol: 0.12, filtro: 'bandpass', freq: 3000, freqFin: 6000, q: 2, ataque: 0.02 });
    },
    // Ola del Tridente: agua que se levanta y rompe
    marea() {
      asegurar();
      ruido({ dur: 0.9, vol: 0.55, filtro: 'lowpass', freq: 400, freqFin: 1800, ataque: 0.15, rev: 0.3 });
      ruido({ dur: 0.6, vol: 0.35, filtro: 'bandpass', freq: 2500, q: 0.8, ataque: 0.05, retraso: 0.3, rev: 0.3 });
    },
    // Machete del cazador: el susurro «ch ch ch ch… ja ja ja ja» (bajito, con eco). Cuándo suena lo decide
    // js/armas-especiales.js (al sacarlo, y al pegar o matar, con un tiempo de espera)
    susurroCazador() { sonar(genSusurro, 0.12, 0.9); },
    duracionSusurro,
    // El peine vacío del Garand que salta con la última bala
    pingGarand() { sonar(genPing, 0.15, 0.08); },
    // Para escucharlos fuera del juego: (contexto, salida, momento, nodos, ...) en un OfflineAudioContext
    generadores: { susurro: genSusurro, tajo: genTajo, golpe: genGolpe, ping: genPing },
    // Minigun: en cada cuadro, la velocidad de los cañones (0 quietos … 1 a velocidad de tiro) y si está tirando.
    // El motor sube de tono al arrancar y baja al frenar; si dejan de llegar llamadas se apaga solo.
    minigun(vel, tirando = false) {
      const v = Math.max(0, Math.min(1, vel || 0));
      if (v < 0.002 && !tirando) { if (motor) apagarMotor(); return; }
      if (!asegurar()) return;
      if (!motor) crearMotor();
      const m = motor, t = ctx.currentTime;
      m.o1.frequency.setTargetAtTime(48 + 230 * v, t, 0.05);
      m.o2.frequency.setTargetAtTime(96 + 460 * v, t, 0.05);
      m.banda.frequency.setTargetAtTime(260 + 1900 * v, t, 0.06);
      m.pasoCanon.frequency.setTargetAtTime(Math.max(1, 33 * v), t, 0.06);   // seis cañones por vuelta: a velocidad de tiro pasan 33 por segundo
      sostener(m.salidaMotor.gain, 0.03 + 0.12 * Math.sqrt(v), t, 0.04);
      sostener(m.salidaRafaga.gain, tirando ? 0.3 : 0, t, tirando ? 0.008 : 0.04);
      clearTimeout(m.reloj); m.reloj = setTimeout(apagarMotor, 1500);   // sin llamadas (pausa, menú): se liberan los nodos
    },
    // Escudo o lanza arrojados, y cuando vuelven a la mano
    lanzar(tipo) {
      asegurar();
      ruido({ dur: tipo === 'lanza' ? 0.3 : 0.5, vol: 0.25, filtro: 'bandpass', freq: tipo === 'lanza' ? 1800 : 700, freqFin: tipo === 'lanza' ? 900 : 1400, q: 3, ataque: 0.03 });
    },
    atrapar(tipo) {
      asegurar();
      if (tipo === 'escudo') metal({ f: 520, dur: 0.25, vol: 0.25 }); else golpe({ f: 200, dur: 0.06, vol: 0.3 });
    },

    // Lugar acústico: 'galpon' (cerrado, con eco) o 'aire' (exterior, seco)
    lugar(tipo) { lugarActual = ECOS[tipo] ? tipo : 'aire'; interior = lugarActual !== 'aire'; if (ctx) aplicarLugar(); },
    // Agua de la cloaca corriendo por el canal (nivel 0 la apaga)
    agua(nivel) { asegurar(); if (nivel > 0) encenderAgua(nivel); else apagarAgua(); },
    // Una gota que cae del techo del túnel a un charco
    gota(cerca = 0.5) {
      asegurar();
      const f = 900 + Math.random() * 900;
      tono({ desde: f * 1.6, hasta: f, dur: 0.07, vol: 0.05 + cerca * 0.08, ataque: 0.001, rev: 0.6 });
      tono({ desde: f * 2.3, hasta: f * 1.9, dur: 0.04, vol: 0.02 + cerca * 0.03, retraso: 0.012, rev: 0.6 });
    },
    // Zombie tóxico: arcada antes de escupir, el escupitajo, el chillido del salto y el ácido que salpica
    toxicoArcada(distancia = 200) {
      asegurar();
      const cerca = Math.max(0.2, 1 - distancia / 600);
      if (!variante('zombie_gemido', 8, { vol: 0.5 * cerca, vel: 1.18 + Math.random() * 0.1, rev: 0.3 }))
        tono({ tipo: 'sawtooth', desde: 140, hasta: 90, dur: 0.4, vol: 0.12 * cerca, sat: 2, rev: 0.3 });
      ruido({ dur: 0.35, vol: 0.12 * cerca, filtro: 'bandpass', freq: 350, freqFin: 900, q: 3, ataque: 0.08, rev: 0.2 });   // gárgara
    },
    escupir(distancia = 200) {
      asegurar();
      const cerca = Math.max(0.25, 1 - distancia / 600);
      ruido({ dur: 0.16, vol: 0.32 * cerca, filtro: 'bandpass', freq: 1500, freqFin: 500, q: 1.6, ataque: 0.004, sat: 1.5, rev: 0.25 });
      tono({ desde: 220, hasta: 110, dur: 0.12, vol: 0.12 * cerca, sat: 2, rev: 0.15 });
    },
    toxicoChillido(distancia = 200) {
      asegurar();
      const cerca = Math.max(0.3, 1 - distancia / 600);
      if (!variante('zombie_gemido', 8, { vol: 0.8 * cerca, vel: 1.4 + Math.random() * 0.15, rev: 0.3 }))
        tono({ tipo: 'sawtooth', desde: 600, hasta: 300, dur: 0.35, vol: 0.15 * cerca, sat: 2, rev: 0.3 });
    },
    salpicaduraToxica(fuerza = 1) {
      asegurar();
      ruido({ dur: 0.18, vol: 0.38 * fuerza, filtro: 'lowpass', freq: 1800, freqFin: 300, ataque: 0.002, rev: 0.15 });
      ruido({ dur: 0.5, vol: 0.06 * fuerza, filtro: 'highpass', freq: 4200, ataque: 0.03, retraso: 0.05, rev: 0.05 });   // chisporroteo del ácido
    },
    // Ambiente de fondo: viento (nivel 0 lo apaga)
    ambiente(nivel) { asegurar(); if (nivel > 0) encenderViento(nivel); else { apagarViento(); apagarAgua(); } },
    // Gemido de algún zombie lejano que no está en pantalla
    gemidoLejano() { asegurar(); variante('zombie_gemido', 8, { vol: 0.16, vel: 0.8 + Math.random() * 0.15, rev: 0.9 }); },
    // Sirena antiaérea a lo lejos: arranca una ronda
    sirena() {
      asegurar();
      const t = ctx.currentTime, dur = 4.2;
      const salida = ctx.createGain(); envolvente(salida, t, 0.07, 0.9, dur);
      const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 1300;
      [0, 4].forEach(desafino => {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(180 + desafino, t); o.frequency.exponentialRampToValueAtTime(540 + desafino, t + 1.6);
        o.frequency.setValueAtTime(540 + desafino, t + 2.6); o.frequency.exponentialRampToValueAtTime(260 + desafino, t + dur);
        o.connect(filtro); o.start(t); o.stop(t + dur + 0.1);
      });
      filtro.connect(salida); conectar(salida, 1.2, 0.8);
    },
    // Fin de ronda: golpe grave lejano, como un portazo de acero
    // Ambiente de ciudad (modo historia): bocinas, alarmas de autos, sirenas y un helicóptero, a lo lejos.
    // `lejos` (0…1) baja el volumen y suma reverberación
    bocina(lejos = 0.5) {
      asegurar(); const v = 0.06 * (1 - lejos * 0.6), rev = 0.3 + lejos * 0.5, veces = 1 + Math.floor(Math.random() * 3), tono0 = 0.9 + Math.random() * 0.25;
      for (let k = 0; k < veces; k++) {
        const r = k * 0.3, d = k === veces - 1 ? 0.45 + Math.random() * 0.6 : 0.16;
        tono({ tipo: 'sawtooth', desde: 415 * tono0, hasta: 410 * tono0, dur: d, vol: v, ataque: 0.01, retraso: r, rev });
        tono({ tipo: 'sawtooth', desde: 523 * tono0, hasta: 518 * tono0, dur: d, vol: v * 0.8, ataque: 0.01, retraso: r, rev });
      }
    },
    alarmaAuto(lejos = 0.5) {
      asegurar(); const v = 0.045 * (1 - lejos * 0.6), rev = 0.35 + lejos * 0.5; let r = 0;
      for (let k = 0; k < 6; k++, r += 0.28) tono({ tipo: 'triangle', desde: 700, hasta: 1500, dur: 0.26, vol: v, ataque: 0.005, retraso: r, rev });      // uiu-uiu
      for (let k = 0; k < 8; k++, r += 0.16) tono({ tipo: 'square', desde: 1250, hasta: 1250, dur: 0.07, vol: v * 0.55, ataque: 0.002, retraso: r, rev }); // bip-bip
      for (let k = 0; k < 4; k++, r += 0.5) { tono({ tipo: 'triangle', desde: 900, hasta: 900, dur: 0.22, vol: v, retraso: r, rev }); tono({ tipo: 'triangle', desde: 650, hasta: 650, dur: 0.22, vol: v, retraso: r + 0.25, rev }); }   // tuu-tii
    },
    sirenaLejana() {
      asegurar();
      for (let k = 0; k < 3; k++) { tono({ tipo: 'sine', desde: 620, hasta: 1100, dur: 0.85, vol: 0.022, ataque: 0.2, retraso: k * 1.7, rev: 0.8 }); tono({ tipo: 'sine', desde: 1100, hasta: 620, dur: 0.85, vol: 0.022, ataque: 0.05, retraso: k * 1.7 + 0.85, rev: 0.8 }); }
    },
    helicoptero() {
      asegurar();
      for (let k = 0; k < 56; k++) { const f = k / 56; ruido({ dur: 0.04, vol: 0.06 * Math.sin(f * Math.PI), filtro: 'lowpass', freq: 360, ataque: 0.004, retraso: k * 0.085, rev: 0.2 }); }
    },
    rondaSuperada() { asegurar(); tono({ desde: 70, hasta: 40, dur: 1.6, vol: 0.35, ataque: 0.01, rev: 0.9 }); metal({ f: 220, dur: 0.9, vol: 0.08, rev: 0.7 }); },
    // Ataque aéreo: pedido por radio (dos pitidos y estática), cazas que pasan y misiles que silban al caer
    radioAereo() {
      asegurar();
      tono({ desde: 1250, hasta: 1250, dur: 0.07, vol: 0.12, ataque: 0.003 }); tono({ desde: 1250, hasta: 1250, dur: 0.07, vol: 0.12, ataque: 0.003, retraso: 0.12 });
      ruido({ dur: 0.55, vol: 0.09, filtro: 'bandpass', freq: 1800, q: 1.2, ataque: 0.02, retraso: 0.22 });
      ruido({ dur: 0.18, vol: 0.06, filtro: 'bandpass', freq: 2600, q: 2, retraso: 0.85 });
    },
    avionPasa() {
      asegurar();
      ruido({ dur: 2.4, vol: 0.32, filtro: 'lowpass', freq: 3200, freqFin: 380, q: 0.8, ataque: 0.9, rev: 0.5, eco: 0.4 });   // el rugido se acerca y se va
      tono({ tipo: 'sawtooth', desde: 190, hasta: 95, dur: 2.2, vol: 0.05, ataque: 0.8, rev: 0.4 });
    },
    silbidoMisil() { asegurar(); tono({ desde: 2300 + Math.random() * 300, hasta: 520, dur: 0.6, vol: 0.09, ataque: 0.05, rev: 0.3 }); },

    // Impacto en un blanco: chapa de acero que suena (centro o cabeza), cartón o un plato que estalla
    blanco(tipo) {
      asegurar();
      if (tipo === 'acero') { metal({ f: 880, dur: 0.6, vol: 0.18, rev: 0.05 }); metal({ f: 1320, dur: 0.35, vol: 0.08, retraso: 0.01 }); }
      else if (tipo === 'plato') { ruido({ dur: 0.12, vol: 0.3, filtro: 'highpass', freq: 2500 }); for (let k = 0; k < 4; k++) metal({ f: 2400 + Math.random() * 1200, dur: 0.05, vol: 0.04, retraso: 0.02 + k * 0.03 }); }
      else { golpe({ f: 240, dur: 0.05, vol: 0.18 }); ruido({ dur: 0.05, vol: 0.12, filtro: 'bandpass', freq: 1400, q: 1.5 }); }
    },

    // Latido cuando queda poca vida
    latido(fuerza = 1) {
      asegurar();
      tono({ desde: 62, hasta: 40, dur: 0.12, vol: 0.45 * fuerza, ataque: 0.005 });
      tono({ desde: 55, hasta: 38, dur: 0.14, vol: 0.32 * fuerza, ataque: 0.005, retraso: 0.2 });
    },
    recoger() { asegurar(); metal({ f: 1700, dur: 0.1, vol: 0.18 }); golpe({ f: 200, dur: 0.05, vol: 0.2 }); tono({ desde: 880, hasta: 1320, dur: 0.14, vol: 0.06, retraso: 0.05, rev: 0.4 }); },
    // Sacar un arma (elegirla del inventario, juntarla de una caja o cambiar de arma): foley grabado, ver `sacar`.
    // arma: el objeto de ARMAS o su id. Sin las grabaciones todavía decodificadas, apenas un roce
    sacarArma(arma) {
      asegurar();
      const a = typeof arma === 'string' ? (typeof ARMAS !== 'undefined' && ARMAS[arma]) || { id: arma } : arma || {};
      if (!sacar(a)) ruido({ dur: 0.18, vol: 0.05, filtro: 'bandpass', freq: 900, q: 0.8, ataque: 0.04 });
    },
    // Munición de una caja (el arma ya la tenía): la mano en la bolsa y las balas sueltas
    municion() {
      asegurar();
      if (!grabacion('foley_cuero', { vol: 0.16, vel: 1.1, rev: 0.05 })) { this.recoger(); return; }
      grabacion('balas_sueltas', { vol: 0.11, vel: 1.1, retraso: 0.06, rev: 0.05 });
    },
    mision() { asegurar(); [523, 659, 784, 1047].forEach((f, k) => tono({ desde: f, hasta: f, dur: 0.6, vol: 0.09, ataque: 0.01, retraso: k * 0.09, rev: 0.6 })); },
  };
})();
