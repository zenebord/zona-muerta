/* ===== Música de los escenarios =====
 * Dos temas originales que se tocan en vivo con WebAudio (no hay archivos):
 *  - «A caballo entre las ruinas» (ciudad): música de vaqueros en la menor (Am–G–F–E): guitarra criolla
 *    rasgueada, guitarra grave con trémolo, silbido, trompetas en terceras, armónica, birimbao, cascos al
 *    galope, latigazo, campana del pueblo y coro de hombres cuando la horda aprieta.
 *  - «Bajo la ciudad» (cloaca): ambiente industrial en do menor: zumbido grave que late, gotas, golpes
 *    metálicos en los caños, ostinato de sintetizador y percusión de fábrica.
 * Cada tema tiene capas que entran según la intensidad (0…1) que pasa el juego: en el descanso entre
 * rondas quedan pocas; con muchos zombies vivos suena todo.
 * Programación con anticipación: cada 50 ms se agendan las notas de los próximos 250 ms en el reloj de audio.
 */
const Musica = (() => {
  let ctx = null, salida = null, envRev = null, envEco = null, ruido = null, curva = null;
  let tema = null, paso = 0, proximo = 0, reloj = 0, intensidad = 0, objetivo = 0, pausada = false;

  const frec = m => 440 * Math.pow(2, (m - 69) / 12);
  const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- Mezcla propia: salida → bus de música, con reverberación de sala grande y eco ---------- */
  function preparar(c, destino) {
    ctx = c;
    salida = ctx.createGain(); salida.gain.value = 0; salida.connect(destino);
    const largo = ctx.sampleRate * 3.4, ir = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const d = ir.getChannelData(canal);
      for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6);
    }
    const rev = ctx.createConvolver(); rev.buffer = ir;
    envRev = ctx.createGain(); envRev.gain.value = 0.5; envRev.connect(rev); rev.connect(salida);
    const eco = ctx.createDelay(2), vuelta = ctx.createGain(), oscuro = ctx.createBiquadFilter();
    eco.delayTime.value = 0.32; vuelta.gain.value = 0.38; oscuro.type = 'lowpass'; oscuro.frequency.value = 2200;
    envEco = ctx.createGain(); envEco.gain.value = 0.4;
    envEco.connect(eco); eco.connect(oscuro); oscuro.connect(vuelta); vuelta.connect(eco); oscuro.connect(salida);
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const r = ruido.getChannelData(0); for (let i = 0; i < r.length; i++) r[i] = Math.random() * 2 - 1;
    curva = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = i / 256 - 1; curva[i] = Math.tanh(x * 2.5); }
  }
  function enviar(nodo, rev = 0, eco = 0) {
    nodo.connect(salida);
    if (rev) { const g = ctx.createGain(); g.gain.value = rev; nodo.connect(g); g.connect(envRev); }
    if (eco) { const g = ctx.createGain(); g.gain.value = eco; nodo.connect(g); g.connect(envEco); }
  }
  // Envolvente: sube en `ataque`, se sostiene y cae exponencial en `caida` desde t + dur
  function envolvente(g, t, vol, ataque, dur, caida) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.setValueAtTime(vol, t + Math.max(ataque, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(ataque, dur) + caida);
  }

  /* ---------- Instrumentos ---------- */
  // Nota con osciladores, filtro con envolvente y, opcionales, vibrato y trémolo
  function nota(m, t, dur, o = {}) {
    const { tipo = 'sawtooth', vol = 0.1, ataque = 0.005, caida = 0.3, filtro = 2000, filtroFin = null, q = 0.7,
      desafino = 0, vibrato = 0, vibratoRetraso = 0.15, tremolo = 0, rev = 0.3, eco = 0, doble = false } = o;
    const f = frec(m), fin = t + Math.max(ataque, dur) + caida + 0.05;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = q;
    filt.frequency.setValueAtTime(filtro, t);
    if (filtroFin) filt.frequency.exponentialRampToValueAtTime(filtroFin, t + Math.max(0.05, dur * 0.8 + caida * 0.4));
    const g = ctx.createGain(); envolvente(g, t, vol, ataque, dur, caida);
    const oscs = [];
    for (const d of doble ? [-desafino || -7, desafino || 7] : [desafino]) {
      const osc = ctx.createOscillator(); osc.type = tipo; osc.frequency.value = f; osc.detune.value = d;
      osc.connect(filt); oscs.push(osc);
    }
    if (vibrato) {
      const lfo = ctx.createOscillator(), prof = ctx.createGain(); lfo.frequency.value = 5.4;
      prof.gain.setValueAtTime(0, t); prof.gain.linearRampToValueAtTime(vibrato, t + vibratoRetraso + 0.2);
      lfo.connect(prof); oscs.forEach(o2 => prof.connect(o2.detune)); lfo.start(t); lfo.stop(fin); 
    }
    let ultimo = filt;
    if (tremolo) {   // trémolo de amplificador viejo
      const trem = ctx.createGain(), lfo = ctx.createOscillator(), prof = ctx.createGain();
      trem.gain.value = 1 - tremolo / 2; lfo.frequency.value = 6.2; prof.gain.value = tremolo / 2;
      lfo.connect(prof); prof.connect(trem.gain); filt.connect(trem); ultimo = trem; lfo.start(t); lfo.stop(fin);
    }
    ultimo.connect(g); enviar(g, rev, eco);
    oscs.forEach(o2 => { o2.start(t); o2.stop(fin); });
  }
  // Ruido filtrado corto (shaker, platillo, golpe de chapa)
  function soplo(t, dur, vol, tipo, f, q = 1, rev = 0.15, fFin = null) {
    const src = ctx.createBufferSource(); src.buffer = ruido;
    const filt = ctx.createBiquadFilter(); filt.type = tipo; filt.frequency.setValueAtTime(f, t); filt.Q.value = q;
    if (fFin) filt.frequency.exponentialRampToValueAtTime(fFin, t + dur);
    const g = ctx.createGain(); envolvente(g, t, vol, 0.002, 0.005, dur);
    src.connect(filt); filt.connect(g); enviar(g, rev);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.1);
  }
  // Tambor: seno que cae de tono, con un golpe de ruido; `sucio` lo satura (bombo industrial)
  function tambor(t, f0, f1, dur, vol, rev = 0.25, sucio = false) {
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    const g = ctx.createGain(); envolvente(g, t, vol, 0.002, 0.01, dur);
    if (sucio) { const ws = ctx.createWaveShaper(); ws.curve = curva; osc.connect(ws); ws.connect(g); } else osc.connect(g);
    enviar(g, rev);
    osc.start(t); osc.stop(t + dur + 0.1);
    soplo(t, 0.04, vol * 0.35, 'lowpass', 1800, 0.7, rev * 0.5);
  }
  // Metal (síntesis FM con relación inarmónica): caño golpeado, campana oxidada
  function metal(t, f, vol, dur = 2.2, indice = 3, rev = 0.6, eco = 0) {
    const port = ctx.createOscillator(), mod = ctx.createOscillator(), modG = ctx.createGain();
    port.frequency.value = f; mod.frequency.value = f * 1.414;
    modG.gain.setValueAtTime(f * indice, t); modG.gain.exponentialRampToValueAtTime(f * 0.05, t + dur);
    mod.connect(modG); modG.connect(port.frequency);
    const g = ctx.createGain(); envolvente(g, t, vol, 0.002, 0.01, dur);
    port.connect(g); enviar(g, rev, eco);
    [port, mod].forEach(o => { o.start(t); o.stop(t + dur + 0.1); });
  }

  /* ---------- Instrumentos del oeste ---------- */
  // Cuerda pulsada de guitarra criolla: serrucho y triángulo con el brillo que se apaga
  function cuerda(m, t, vol, dur = 0.7, brillo = 3000, rev = 0.3) {
    nota(m, t, 0.005, { tipo: 'sawtooth', vol: vol * 0.55, ataque: 0.002, caida: dur, filtro: brillo, filtroFin: 380, q: 1.3, rev });
    nota(m, t, 0.005, { tipo: 'triangle', vol, ataque: 0.002, caida: dur * 1.3, filtro: 2600, rev });
  }
  // Rasgueo: las cuerdas del acorde una tras otra (hacia abajo o hacia arriba); `apagado` = mano sobre las cuerdas
  function rasgueo(acorde, t, vol, arriba = false, apagado = false) {
    if (apagado) {   // golpe apagado del galope: tres cuerdas graves, cortas y sordas (liviano: un oscilador por cuerda)
      acorde.slice(0, 3).forEach((m, k) => nota(m, t + k * 0.008, 0.005, { tipo: 'triangle', vol: vol * 1.3, ataque: 0.002, caida: 0.11, filtro: 1500, rev: 0.1 }));
      return;
    }
    const cuerdas = arriba ? [...acorde].reverse().slice(0, 4) : acorde;
    cuerdas.forEach((m, k) => cuerda(m, t + k * (arriba ? 0.009 : 0.013), vol * (arriba ? 0.75 : 1), 0.9, 3200, 0.3));
  }
  // Trompeta: el filtro se abre de golpe en el ataque (el «blat» del bronce) y después vibra
  function trompeta(m, t, dur, vol) {
    const f = frec(m), fin = t + dur + 0.25;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = 1.5;
    filt.frequency.setValueAtTime(500, t); filt.frequency.exponentialRampToValueAtTime(3400, t + 0.05); filt.frequency.exponentialRampToValueAtTime(1900, t + 0.25);
    const g = ctx.createGain(); envolvente(g, t, vol, 0.03, dur, 0.18);
    const lfo = ctx.createOscillator(), prof = ctx.createGain(); lfo.frequency.value = 5.8;
    prof.gain.setValueAtTime(0, t); prof.gain.linearRampToValueAtTime(16, t + Math.min(dur, 0.45));
    lfo.connect(prof);
    for (const d of [-5, 5]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; prof.connect(o.detune); o.connect(filt); o.start(t); o.stop(fin); }
    filt.connect(g); enviar(g, 0.45, 0.2);
    lfo.start(t); lfo.stop(fin);
  }
  // Birimbao (arpa de boca): nota grave con un filtro muy resonante que barre: «boiiing»
  function birimbao(m, t, vol) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = frec(m);
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 14;
    filt.frequency.setValueAtTime(350, t); filt.frequency.exponentialRampToValueAtTime(2300, t + 0.09); filt.frequency.exponentialRampToValueAtTime(450, t + 0.42);
    const g = ctx.createGain(); envolvente(g, t, vol, 0.004, 0.05, 0.45);
    o.connect(filt); filt.connect(g); enviar(g, 0.3, 0.15);
    o.start(t); o.stop(t + 0.6);
  }
  // Cascos al galope (coco contra madera): clic agudo con cuerpo hueco
  function casco(t, vol, alto) {
    const f = alto ? 1250 : 900;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.05);
    const g = ctx.createGain(); envolvente(g, t, vol, 0.001, 0.002, 0.06);
    o.connect(g); enviar(g, 0.12); o.start(t); o.stop(t + 0.1);
    soplo(t, 0.02, vol * 0.5, 'bandpass', 2600, 2, 0.05);
  }
  // Latigazo: el silbido del cuero que viaja y el chasquido al final
  function latigo(t, vol) {
    soplo(t, 0.16, vol * 0.25, 'bandpass', 400, 2, 0.1, 3500);
    soplo(t + 0.15, 0.07, vol, 'highpass', 2500, 0.8, 0.35);
  }
  // Coro de hombres en «oh»: dos formantes sobre un serrucho
  function coro(m, t, dur, vol) {
    const g = ctx.createGain(); envolvente(g, t, vol, 0.5, dur, 0.8);
    for (const [fo, q, nivel] of [[480, 6, 1], [820, 8, 0.55], [2600, 10, 0.12]]) {
      const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fo; b.Q.value = q;
      const n = ctx.createGain(); n.gain.value = nivel; b.connect(n); n.connect(g);
      for (const d of [-9, 9]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = frec(m); o.detune.value = d; o.connect(b); o.start(t); o.stop(t + dur + 1); }
    }
    enviar(g, 0.7);
  }

  /* ---------- Tema 1: «A caballo entre las ruinas» (ciudad): música de vaqueros ---------- */
  const CIUDAD = (() => {
    // Cadencia andaluza en la menor: Am – G – F – E (la del western de siempre)
    const RASGUEO = [[45, 52, 57, 60, 64], [43, 47, 50, 55, 59], [41, 48, 53, 57, 60], [40, 47, 52, 56, 59]];
    const BAJOS = [33, 31, 29, 28];
    const ESCALA = [];   // la menor armónica (con sol sostenido), para armonizar en terceras
    for (let o = 0; o < 9; o++) for (const g of [0, 2, 3, 5, 7, 8, 11]) ESCALA.push(9 + o * 12 + g);
    const terceraAbajo = m => { const k = ESCALA.indexOf(m); return k >= 2 ? ESCALA[k - 2] : m - 4; };
    // Guitarra grave con trémolo (compases 0-7) y silbido (8-15): [compás, semicorchea, nota, largo]
    const BARITONO = [
      [0, 0, 45, 3], [0, 3, 45, 1], [0, 4, 48, 2], [0, 6, 52, 2], [0, 8, 57, 6], [0, 14, 55, 2],
      [1, 0, 55, 4], [1, 4, 50, 4], [1, 8, 47, 6],
      [2, 0, 53, 3], [2, 3, 52, 1], [2, 4, 53, 2], [2, 6, 57, 2], [2, 8, 60, 6], [2, 14, 57, 2],
      [3, 0, 56, 4], [3, 4, 59, 2], [3, 6, 56, 2], [3, 8, 52, 8],
      [4, 0, 45, 3], [4, 3, 45, 1], [4, 4, 48, 2], [4, 6, 52, 2], [4, 8, 57, 4], [4, 12, 64, 4],
      [5, 0, 62, 4], [5, 4, 59, 4], [5, 8, 55, 6],
      [6, 0, 53, 3], [6, 3, 55, 1], [6, 4, 57, 2], [6, 6, 60, 2], [6, 8, 65, 4], [6, 12, 64, 4],
      [7, 0, 52, 4], [7, 4, 50, 2], [7, 6, 48, 2], [7, 8, 47, 4], [7, 12, 44, 4],
    ];
    const SILBIDO = [
      [8, 0, 76, 6], [8, 6, 74, 2], [8, 8, 72, 4], [8, 12, 71, 2], [8, 14, 69, 2],
      [9, 0, 71, 8], [9, 8, 67, 8],
      [10, 0, 69, 4], [10, 4, 72, 4], [10, 8, 77, 6], [10, 14, 76, 2],
      [11, 0, 76, 12],
      [12, 0, 81, 4], [12, 4, 79, 2], [12, 6, 76, 2], [12, 8, 72, 4], [12, 12, 76, 4],
      [13, 0, 74, 4], [13, 4, 71, 4], [13, 8, 67, 8],
      [14, 0, 65, 2], [14, 2, 69, 2], [14, 4, 72, 4], [14, 8, 71, 4], [14, 12, 69, 2], [14, 14, 68, 2],
      [15, 0, 69, 16],
    ];
    const indice = lista => { const m = new Map(); for (const n of lista) m.set(n[0] * 16 + n[1], n); return m; };
    const B = indice(BARITONO), S = indice(SILBIDO);
    const GALOPE = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15];   // ta-taka ta-taka
    return {
      bpm: 108, largo: 256,
      paso(i, t, s, I) {
        const compas = Math.floor(i / 16) % 16, sc = i % 16, k = compas % 4, ac = RASGUEO[k];
        const segunda = compas >= 8, accion = I > 0.55;
        // Campana del pueblo al empezar cada mitad
        if (sc === 0 && (compas === 0 || compas === 8)) metal(t, 220, 0.05, 3.2, 1.1, 0.8);
        // Guitarra criolla: rasgueo lento en la calma; galope apagado cuando hay acción
        if (!accion) {
          if (sc === 0 || sc === 6 || sc === 8) rasgueo(ac, t, 0.05);
          if (sc === 11 || sc === 14) rasgueo(ac, t, 0.04, true);
        } else {
          if (GALOPE.includes(sc)) rasgueo(ac, t, sc % 4 === 0 ? 0.05 : 0.03, sc % 4 === 3, sc % 4 !== 0);
        }
        // Bajo: tónica y quinta, como un guitarrón
        if (sc === 0) cuerda(BAJOS[k], t, 0.16, 1.1, 900, 0.15);
        if (sc === 8) cuerda(BAJOS[k] + 7, t, 0.12, 0.9, 900, 0.15);
        // Primera mitad: guitarra grave con trémolo; segunda mitad: silbido
        const b = B.get(compas * 16 + sc);
        if (b && !segunda) nota(b[2], t, s * b[3] * 0.75, { tipo: 'sawtooth', vol: 0.075, ataque: 0.003, caida: 0.8, filtro: 3000, filtroFin: 650, q: 3, tremolo: 0.5, vibrato: 12, vibratoRetraso: 0.3, rev: 0.7, eco: 0.35 });
        const w = S.get(compas * 16 + sc);
        if (w) {
          nota(w[2], t, s * w[3] * 0.85, { tipo: 'sine', vol: 0.065, ataque: 0.06, caida: 0.3, filtro: 4000, vibrato: 20, vibratoRetraso: 0.18, rev: 0.75, eco: 0.3 });
          // Con acción, dos trompetas en terceras doblan la melodía una octava abajo (estilo mariachi)
          if (accion) { trompeta(w[2] - 12, t, s * w[3] * 0.85, 0.05); trompeta(terceraAbajo(w[2] - 12), t, s * w[3] * 0.85, 0.035); }
        }
        // Calma: armónica en acordes largos y el «boiiing» del birimbao
        if (!accion) {
          if (segunda && sc === 0 && compas % 2 === 1) for (const m of [ac[2] + 12, ac[3] + 12]) nota(m, t, s * 12, { tipo: 'square', vol: 0.016, ataque: 0.12, caida: 0.5, filtro: 1800, tremolo: 0.35, vibrato: 10, rev: 0.5 });
          if (!segunda && compas % 2 === 0 && (sc === 4 || sc === 12)) birimbao(BAJOS[k] + 12, t, 0.07);
        }
        // Cascos de caballo al galope
        if (I > 0.3 && GALOPE.includes(sc)) casco(t, sc % 4 === 0 ? 0.09 : 0.06, sc % 4 !== 0);
        // Tambor grave y latigazo cuando aprieta
        if (accion) {
          if (sc === 0 || sc === 8) tambor(t, 95, 45, 0.5, 0.26, 0.3);
          if (compas % 4 === 3 && sc === 12) latigo(t, 0.22);
        }
        // Horda encima: coro de hombres sosteniendo la tónica y la quinta
        if (I > 0.8 && sc === 0 && compas % 2 === 0) { coro(BAJOS[k] + 12, t, s * 30, 0.028); coro(BAJOS[k] + 19, t, s * 30, 0.02); }
      },
    };
  })();

  /* ---------- Tema 2: «Bajo la ciudad» (cloaca) ---------- */
  const CLOACA = (() => {
    const RAICES = [36, 37, 36, 35];   // C Db C B: medio tono que incomoda
    const COLCHON = [[48, 51, 55], [49, 53, 56], [48, 51, 55], [47, 50, 53]];
    const GOTAS = [72, 75, 79, 80, 83, 84, 87];
    const OSTINATO = [0, 0, 12, 0, 3, 0, 7, 0, 0, 0, 12, 0, 8, 7, 3, 1];
    return {
      bpm: 72, largo: 256,
      paso(i, t, s, I) {
        const compas = Math.floor(i / 16) % 16, sc = i % 16, k = compas % 4, raiz = RAICES[k];
        // Zumbido grave que late (siempre): dos senos apenas desafinados y un serrucho muy filtrado
        if (sc === 0) {
          nota(raiz - 12, t, s * 15, { tipo: 'sine', vol: 0.12, ataque: 0.8, caida: 1.4, filtro: 300, rev: 0.2 });
          nota(raiz - 12, t, s * 15, { tipo: 'sine', desafino: 9, vol: 0.08, ataque: 0.8, caida: 1.4, filtro: 300, rev: 0.2 });
          nota(raiz, t, s * 15, { tipo: 'sawtooth', doble: true, desafino: 12, vol: 0.025, ataque: 1.5, caida: 1.5, filtro: 260, filtroFin: 520, rev: 0.4 });
          if (compas % 2 === 0) for (const m of COLCHON[k]) nota(m, t, s * 28, { tipo: 'triangle', vol: 0.016, ataque: 2.5, caida: 2.5, filtro: 900, rev: 0.8 });
        }
        // Gotas que caen en un charco, con eco de túnel
        if ((sc === 2 || sc === 7 || sc === 11 || sc === 13) && hash(compas, sc) < 0.55) {
          const m = GOTAS[Math.floor(hash(sc, compas + 7) * GOTAS.length)];
          nota(m, t, 0.02, { tipo: 'sine', vol: 0.05, ataque: 0.001, caida: 0.25, filtro: 6000, rev: 0.7, eco: 0.6 });
        }
        // Golpe metálico lejano en los caños
        if (sc === 6 && compas % 2 === 1) metal(t, 70 + hash(compas, 3) * 60, 0.06, 2.6, 4, 0.9);
        // Latido grave
        if (I > 0.2 && (sc === 0 || sc === 3)) tambor(t, 70, 38, 0.35, sc === 0 ? 0.22 : 0.14, 0.15);
        // Ostinato de sintetizador
        if (I > 0.45) nota(raiz + OSTINATO[sc] - 12 + 12, t, s * 0.6, { tipo: 'sawtooth', vol: 0.04, ataque: 0.004, caida: 0.12, filtro: 1400, filtroFin: 260, q: 4, rev: 0.25 });
        // Percusión de fábrica
        if (I > 0.65) {
          if (sc === 0 || sc === 8 || sc === 10) tambor(t, 120, 42, 0.3, 0.26, 0.2, true);
          if (sc === 4 || sc === 12) { soplo(t, 0.16, 0.08, 'bandpass', 2600, 6, 0.4); metal(t, 330, 0.035, 0.35, 2, 0.4); }
          if (sc % 2 === 0) soplo(t, 0.03, 0.02, 'highpass', 8000, 0.7, 0.05);
        }
        if (I > 0.85 && sc === 14 && compas % 4 === 3) metal(t, 520, 0.05, 1.4, 6, 0.7, 0.4);   // alarma oxidada
      },
    };
  })();
  /* ---------- Temas de 8 bits del modo historia (estilo consola de los 80) ----------
   * Solo ondas cuadradas y triangulares y ruido, como el chip de sonido de una consola de los 80: melodía en
   * cuadrada, arpegio rápido del acorde en otra cuadrada, bajo en triangular y batería de ruido.
   *  - «Camino a casa» (viñetas): la menor, melancólico y con esperanza.
   *  - «Cien kilómetros» (niveles): la menor, rápido, para avanzar peleando; la batería entra con los zombies.
   *  - «Estás en casa» (final): do mayor, tranquilo y feliz. */
  const CHIP = 0.6;   // volumen general de los temas de 8 bits, parejo con los otros temas
  const cuadrada = (m, t, dur, vol, eco = 0.12) => nota(m, t, dur, { tipo: 'square', vol: vol * CHIP, ataque: 0.003, caida: 0.07, filtro: 5200, rev: 0.12, eco });
  const triangulo = (m, t, dur, vol) => nota(m, t, dur, { tipo: 'triangle', vol: vol * CHIP, ataque: 0.003, caida: 0.05, filtro: 5000, rev: 0.04 });
  const platillo = (t, vol) => soplo(t, 0.03, vol * CHIP, 'highpass', 7000, 0.7, 0.03);
  const redoblante = (t, vol) => soplo(t, 0.1, vol * CHIP, 'bandpass', 1800, 0.9, 0.08, 900);
  const bombo = (t, vol) => tambor(t, 160, 48, 0.18, vol * CHIP * 0.8, 0.04);
  // Arma un tema: acordes por compás [raíz, tercera, quinta], melodía [compás, semicorchea, nota, largo]
  function temaChip({ bpm, acordes, melodia, arpegio = 1, bajo = 'pulso', bateria = 0.25, volMelodia = 0.05, contra = null }) {
    const M = new Map(); for (const n of melodia) M.set(n[0] * 16 + n[1], n);
    const C = contra ? new Map(contra.map(n => [n[0] * 16 + n[1], n])) : null;
    const compases = acordes.length;
    return {
      bpm, largo: compases * 16,
      paso(i, t, s, I) {
        const compas = Math.floor(i / 16) % compases, sc = i % 16, [r, te, q] = acordes[compas];
        const n = M.get(compas * 16 + sc); if (n) cuadrada(n[2], t, s * n[3] * 0.82, volMelodia, 0.18);
        if (C && I > 0.6) { const c = C.get(compas * 16 + sc); if (c) cuadrada(c[2], t, s * c[3] * 0.8, volMelodia * 0.55, 0.08); }
        // Arpegio del acorde, una nota por semicorchea (o por corchea en el tema lento)
        if (arpegio && sc % arpegio === 0) { const tonos = [r + 12, te + 12, q + 12, r + 24]; cuadrada(tonos[(sc / arpegio) % 4], t, s * arpegio * 0.6, 0.016, 0.05); }
        // Bajo en triangular: pulsando en corcheas o largo en blancas
        if (bajo === 'pulso' && sc % 2 === 0) triangulo(r - 12 + (sc % 4 === 2 ? 12 : 0), t, s * 1.6, 0.11);
        if (bajo === 'largo' && sc % 8 === 0) triangulo(r - 12, t, s * 7, 0.1);
        // Batería de ruido: entra con la intensidad
        if (I > bateria) {
          if (sc === 0 || sc === 8 || (sc === 10 && I > 0.6)) bombo(t, 0.22);
          if (sc === 4 || sc === 12) redoblante(t, 0.08);
          if (sc % 2 === 0) platillo(t, 0.022);
        }
      },
    };
  }
  const Am = [57, 60, 64], F = [53, 57, 60], C_ = [48, 52, 55], G = [55, 59, 62], E = [52, 56, 59];
  const RETRO = temaChip({ bpm: 100, arpegio: 1, bajo: 'largo', bateria: 0.05, volMelodia: 0.045,
    acordes: [Am, F, C_, G, Am, F, G, E, Am, F, C_, G, Am, F, E, Am],
    melodia: [
      [0, 0, 76, 6], [0, 6, 74, 2], [0, 8, 72, 4], [0, 12, 71, 4], [1, 0, 69, 8], [1, 8, 72, 4], [1, 12, 74, 4],
      [2, 0, 76, 6], [2, 6, 79, 2], [2, 8, 77, 4], [2, 12, 76, 4], [3, 0, 74, 12], [3, 12, 71, 4],
      [4, 0, 72, 4], [4, 4, 74, 4], [4, 8, 76, 6], [4, 14, 79, 2], [5, 0, 77, 8], [5, 8, 76, 4], [5, 12, 72, 4],
      [6, 0, 74, 6], [6, 6, 72, 2], [6, 8, 71, 4], [6, 12, 74, 4], [7, 0, 68, 8], [7, 8, 71, 4], [7, 12, 76, 4],
      [8, 0, 81, 6], [8, 6, 79, 2], [8, 8, 76, 4], [8, 12, 72, 4], [9, 0, 77, 8], [9, 8, 76, 4], [9, 12, 74, 4],
      [10, 0, 76, 6], [10, 6, 79, 2], [10, 8, 84, 4], [10, 12, 83, 4], [11, 0, 79, 12], [11, 12, 74, 4],
      [12, 0, 72, 4], [12, 4, 76, 4], [12, 8, 81, 6], [12, 14, 79, 2], [13, 0, 77, 6], [13, 6, 76, 2], [13, 8, 74, 8],
      [14, 0, 71, 4], [14, 4, 74, 4], [14, 8, 80, 8], [15, 0, 81, 16],
    ] });
  const RETRO_ACCION = temaChip({ bpm: 150, arpegio: 1, bajo: 'pulso', bateria: 0.2, volMelodia: 0.05,
    acordes: [Am, Am, F, G, C_, G, Am, E],
    melodia: [
      [0, 0, 69, 2], [0, 2, 72, 2], [0, 4, 76, 4], [0, 8, 74, 2], [0, 10, 72, 2], [0, 12, 74, 4],
      [1, 0, 76, 6], [1, 6, 72, 2], [1, 8, 69, 8],
      [2, 0, 77, 2], [2, 2, 76, 2], [2, 4, 74, 2], [2, 6, 72, 2], [2, 8, 74, 4], [2, 12, 77, 4],
      [3, 0, 79, 8], [3, 8, 74, 4], [3, 12, 71, 4],
      [4, 0, 72, 2], [4, 2, 76, 2], [4, 4, 79, 4], [4, 8, 77, 2], [4, 10, 76, 2], [4, 12, 74, 4],
      [5, 0, 74, 6], [5, 6, 71, 2], [5, 8, 67, 8],
      [6, 0, 69, 2], [6, 2, 72, 2], [6, 4, 76, 2], [6, 6, 81, 2], [6, 8, 79, 4], [6, 12, 76, 4],
      [7, 0, 80, 8], [7, 8, 76, 4], [7, 12, 71, 4],
    ],
    // Con muchos zombies, una segunda voz responde abajo
    contra: [[0, 8, 64, 4], [1, 8, 60, 8], [2, 8, 65, 8], [3, 0, 67, 8], [4, 8, 64, 8], [5, 8, 62, 8], [6, 8, 64, 8], [7, 0, 68, 8]] });
  const Cm = [48, 52, 55], Gm = [55, 59, 62], Amn = [57, 60, 64], Fm = [53, 57, 60];
  const RETRO_FINAL = temaChip({ bpm: 88, arpegio: 2, bajo: 'largo', bateria: 0.5, volMelodia: 0.05,
    acordes: [Cm, Gm, Amn, Fm, Cm, Gm, Fm, Cm],
    melodia: [
      [0, 0, 76, 4], [0, 4, 79, 4], [0, 8, 84, 8], [1, 0, 83, 4], [1, 4, 79, 4], [1, 8, 74, 8],
      [2, 0, 76, 4], [2, 4, 72, 4], [2, 8, 81, 8], [3, 0, 79, 6], [3, 6, 77, 2], [3, 8, 76, 8],
      [4, 0, 72, 4], [4, 4, 76, 4], [4, 8, 79, 8], [5, 0, 79, 4], [5, 4, 77, 4], [5, 8, 74, 8],
      [6, 0, 77, 4], [6, 4, 76, 4], [6, 8, 74, 4], [6, 12, 71, 4], [7, 0, 72, 16],
    ] });
  const TEMAS = { ciudad: CIUDAD, cloaca: CLOACA, retro: RETRO, retroAccion: RETRO_ACCION, retroFinal: RETRO_FINAL };

  /* ---------- Programador ---------- */
  function tic() {
    if (!tema || pausada) return;
    intensidad += (objetivo - intensidad) * 0.06;
    const s = 60 / tema.bpm / 4;   // semicorchea
    if (proximo < ctx.currentTime - 0.3) proximo = ctx.currentTime + 0.05;   // la pestaña estuvo dormida: no amontonar notas
    while (proximo < ctx.currentTime + 0.25) {
      tema.paso(paso % tema.largo, proximo, s, intensidad);
      proximo += s; paso++;
    }
  }

  return {
    // Arranca un tema desde el principio ('ciudad' | 'cloaca'); null o un nombre desconocido la callan
    tocar(nombre) {
      if (!ctx) { const m = Audio_.mezclaMusica(); if (!m.ctx) return; preparar(m.ctx, m.bus); }
      const nuevo = TEMAS[nombre] || null;
      tema = nuevo; paso = 0; pausada = false; intensidad = objetivo = 0.15;
      const t = ctx.currentTime;
      salida.gain.cancelScheduledValues(t); salida.gain.setValueAtTime(0.0001, t);
      if (!nuevo) { clearInterval(reloj); reloj = 0; return; }
      salida.gain.linearRampToValueAtTime(1, t + 1.5);
      proximo = t + 0.1;
      if (!reloj) reloj = setInterval(tic, 50);
    },
    // Baja de a poco y se calla
    detener(fundido = 1.5) {
      if (!ctx || !tema) return;
      const t = ctx.currentTime;
      salida.gain.cancelScheduledValues(t); salida.gain.setValueAtTime(salida.gain.value, t); salida.gain.linearRampToValueAtTime(0.0001, t + fundido);
      const actual = tema;
      setTimeout(() => { if (tema === actual) { tema = null; clearInterval(reloj); reloj = 0; } }, fundido * 1000);
    },
    pausar(si) {
      if (!ctx || !tema || pausada === si) return;
      pausada = si;
      const t = ctx.currentTime;
      salida.gain.cancelScheduledValues(t); salida.gain.setValueAtTime(salida.gain.value, t);
      salida.gain.linearRampToValueAtTime(si ? 0.0001 : 1, t + (si ? 0.3 : 0.8));
      if (!si) proximo = ctx.currentTime + 0.05;
    },
    // 0 = calma … 1 = horda encima
    intensidad(v) { objetivo = Math.max(0, Math.min(1, v)); },
    sonando: () => tema !== null && !pausada,
    // Solo para pruebas: tocar un tema en un contexto fuera de línea
    _probar(c, destino, nombre, segundos, nivel) {
      preparar(c, destino); salida.gain.value = 1;
      const T = TEMAS[nombre], s = 60 / T.bpm / 4;
      for (let i = 0, t = 0; t < segundos; i++, t += s) T.paso(i % T.largo, t, s, nivel);
      ctx = null;
    },
  };
})();
