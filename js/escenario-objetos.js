/* ===== Escenario, parte 2: ruinas, farolas, chatarra, primer plano y ambiente ===== */
const VEREDA_FONDO = SUELO_BASE - FONDO_CALLE;   // y donde apoyan las cosas de la vereda del fondo

Object.assign(Escenario, {
  // Ruinas detrás de la vereda, con paralaje: parecen estar más lejos que la calle
  dibujarRuinas(ctx, camaraX, tiempo) {
    const factor = 0.6, desplaza = camaraX * factor, base = VEREDA_FONDO - 12;
    const inicio = Math.floor(desplaza / SEGMENTO_RUINAS) - 1;
    for (let k = inicio; k < inicio + ANCHO / SEGMENTO_RUINAS + 3; k++) {
      for (const r of ruinasDeSegmento(k)) {
        const sx = r.x - desplaza;
        ctx.save(); ctx.translate(sx, base);
        if (r.tipo === 'casa') {
          cubo(ctx, 0, -r.alto, r.ancho, r.alto, r.fondo, r.color);
          if (r.techoRoto) {   // le falta parte del techo: se come un pedazo con el color del cielo
            ctx.fillStyle = '#c97a3f';
            ctx.beginPath(); ctx.moveTo(r.ancho * 0.3, -r.alto - r.fondo * 0.6); ctx.lineTo(r.ancho * 0.5, -r.alto + 26); ctx.lineTo(r.ancho * 0.8, -r.alto - r.fondo * 0.6); ctx.closePath(); ctx.fill();
          }
          ctx.fillStyle = '#1a1418';
          for (let xx = 14; xx < r.ancho - 20; xx += 34) ctx.fillRect(xx, -r.alto + 22, 16, 20);
          ctx.fillRect(r.ancho - 34, -34, 18, 34);   // puerta
          if (r.fuego) { const p = 0.5 + Math.sin(tiempo * 9 + r.x) * 0.3; ctx.fillStyle = `rgba(255, 140, 40, ${p})`; ctx.fillRect(14, -r.alto + 22, 16, 20); }
        } else if (r.tipo === 'gasolinera') {
          cilindro(ctx, 10, 0, 5, 90, '#8a8278'); cilindro(ctx, 150, 0, 5, 90, '#8a8278');
          cubo(ctx, -10, -104, 180, 14, 24, '#a63d2e');
          cubo(ctx, 60, -44, 22, 44, 8, '#c8c0b0'); ctx.fillStyle = '#1a1418'; ctx.fillRect(64, -38, 14, 10);   // surtidor
          ctx.fillStyle = '#f1e6d0'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GAS', 80, -92);
        } else if (r.tipo === 'tanque') {
          ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-8, -90); ctx.moveTo(18, 0); ctx.lineTo(8, -90); ctx.moveTo(-14, -40); ctx.lineTo(14, -40); ctx.stroke();
          cilindro(ctx, 0, -88, 26, 44, '#7d7066');
        } else if (r.tipo === 'poste') {
          cilindro(ctx, 0, 0, 3, 150, '#5a4634');
          bloque(ctx, -22, -140, 44, 4, '#5a4634');
          ctx.strokeStyle = 'rgba(20,14,16,0.7)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(-20, -138); ctx.quadraticCurveTo(-60, -90, -120, -60); ctx.moveTo(20, -138); ctx.quadraticCurveTo(50, -100, 90, -40); ctx.stroke();
        } else if (r.tipo === 'arbol') {
          ctx.strokeStyle = '#3a2a1e'; ctx.lineCap = 'round';
          ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, -r.alto * 0.6); ctx.stroke();
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(4, -r.alto * 0.6); ctx.lineTo(-22, -r.alto); ctx.moveTo(4, -r.alto * 0.6); ctx.lineTo(26, -r.alto * 0.95);
          ctx.moveTo(2, -r.alto * 0.4); ctx.lineTo(-18, -r.alto * 0.55); ctx.moveTo(-10, -r.alto * 0.82); ctx.lineTo(-24, -r.alto * 0.78); ctx.stroke();
        }
        ctx.restore();
      }
    }
    // Neblina leve sobre la capa del fondo para separarla de la calle
    ctx.fillStyle = 'rgba(228, 176, 106, 0.12)'; ctx.fillRect(0, 200, ANCHO, VEREDA_FONDO - 200);
  },

  dibujarFarola(ctx, f, sx, tiempo) {
    const alto = 180;
    let intensidad = f.rota ? 0 : 1;
    if (f.parpadea && !f.rota) intensidad = (Math.sin(tiempo * 23 + f.x) > 0.3 && Math.sin(tiempo * 7 + f.x) > -0.6) ? 1 : 0.15;
    const poste = () => {
      ctx.rotate(f.torcida);
      cilindro(ctx, 0, 0, 4, alto, '#3a383e');
      bloque(ctx, -10, -6, 20, 6, '#3a383e');
      bloque(ctx, 0, -alto, 46, 5, '#3a383e');
      bloque(ctx, 34, -alto - 4, 24, 12, '#232226');
      ctx.fillStyle = tinta(f.rota ? '#3a3a3a' : `rgba(255, 230, 160, ${intensidad})`); ctx.fillRect(38, -alto + 6, 16, 5);
    };
    conSombra(ctx, sx, VEREDA_FONDO, poste, 0.22);
    if (intensidad > 0) {
      ctx.save(); ctx.translate(sx, VEREDA_FONDO); ctx.rotate(f.torcida);
      // Cono de luz y charco de luz sobre el asfalto
      const g = ctx.createLinearGradient(0, -alto, 0, 60);
      g.addColorStop(0, `rgba(255, 220, 130, ${0.3 * intensidad})`); g.addColorStop(1, 'rgba(255, 220, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(40, -alto + 8); ctx.lineTo(52, -alto + 8); ctx.lineTo(130, 70); ctx.lineTo(-40, 70); ctx.closePath(); ctx.fill();
      const charco = ctx.createRadialGradient(46, 50, 5, 46, 50, 100);
      charco.addColorStop(0, `rgba(255, 220, 130, ${0.28 * intensidad})`); charco.addColorStop(1, 'rgba(255, 220, 130, 0)');
      ctx.fillStyle = charco;
      ctx.beginPath(); ctx.ellipse(46, 50, 110, 42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  },

  dibujarChatarra(ctx, c, sx, tiempo) {
    const y = VEREDA_FONDO + 10;   // apoyada en el borde del fondo de la calle
    if (c.tipo === 'auto') {
      const auto = () => {
        if (c.volcado) { ctx.translate(0, -34); ctx.rotate(Math.PI); ctx.translate(0, 20); }
        cubo(ctx, -70, -40, 140, 32, 18, c.color);
        ctx.fillStyle = tinta(ajustarColor(c.color, 0.15));
        ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(-25, -62); ctx.lineTo(35, -62); ctx.lineTo(50, -40); ctx.closePath(); ctx.fill();
        ctx.fillStyle = tinta('#141420');
        ctx.beginPath(); ctx.moveTo(-34, -42); ctx.lineTo(-22, -58); ctx.lineTo(0, -58); ctx.lineTo(0, -42); ctx.closePath(); ctx.fill();
        ctx.fillRect(5, -58, 26, 16);
        ctx.fillStyle = tinta('#5a3a28'); ctx.fillRect(-70, -22, 30, 8); ctx.fillRect(20, -36, 40, 6);   // óxido
        esfera(ctx, -42, -6, 13, '#1a1a1a');
        ctx.fillStyle = tinta('#1a1a1a'); ctx.beginPath(); ctx.ellipse(44, -3, 14, 6, 0, 0, Math.PI * 2); ctx.fill();   // llanta pinchada
      };
      conSombra(ctx, sx, y, auto, 0.25);
    } else if (c.tipo === 'barril') {
      conSombra(ctx, sx, y, () => { cilindro(ctx, 0, 0, 13, 36, '#4a3a30'); ctx.fillStyle = tinta('#2d2420'); ctx.fillRect(-13, -28, 26, 3); ctx.fillRect(-13, -12, 26, 3); }, 0.25);
      ctx.save(); ctx.translate(sx, y);
      const t = tiempo * 10;
      ctx.fillStyle = 'rgba(255, 140, 40, 0.16)';
      ctx.beginPath(); ctx.arc(0, -46, 55 + Math.sin(t) * 5, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 4; k++) {
        const h = 22 + Math.sin(t + k * 1.7) * 9;
        ctx.fillStyle = k % 2 ? '#ffb327' : '#ff5a1f';
        ctx.beginPath(); ctx.moveTo(-9 + k * 5, -38); ctx.lineTo(-5 + k * 5 + Math.sin(t * 1.3 + k) * 4, -38 - h); ctx.lineTo(-1 + k * 5, -38); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    } else if (c.tipo === 'llanta') {
      sombraElipse(ctx, sx + 6, y + 2, 18, 5, 0.25);
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.ellipse(sx, y - 5, 16, 7, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.ellipse(sx, y - 5, 8, 3.5, 0.3, 0, Math.PI * 2); ctx.fill();
    } else if (c.tipo === 'cartel') {
      conSombra(ctx, sx, y, () => {
        cilindro(ctx, 0, 0, 3, 110, '#5a5a5a');
        cubo(ctx, -55, -150, 110, 44, 6, '#8a6a1e');
        if (!Pincel.silueta) {
          ctx.fillStyle = '#2a2a2a'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('mundo.' + c.texto), 0, -122);
          ctx.fillStyle = '#c0392b'; ctx.fillRect(10, -140, 18, 10);
        }
      }, 0.22);
    }
  },

  // Todo lo fijo que va detrás de los personajes, de atrás hacia adelante
  dibujarFondoDelMundo(ctx, camaraX, tiempo) {
    const desde = indiceTrozo(camaraX) - 1, hasta = indiceTrozo(camaraX + ANCHO) + 1;
    for (let i = desde; i <= hasta; i++) {
      for (const c of chatarraDeTrozo(i)) this.dibujarChatarra(ctx, c, c.x - camaraX, tiempo);
      for (const f of farolasDeTrozo(i)) this.dibujarFarola(ctx, f, f.x - camaraX, tiempo);
    }
  },

  // Primer plano: alambrado, arbustos secos y piedras, oscuros y moviéndose más rápido que la calle
  dibujarFrente(ctx, camaraX) {
    const factor = 1.35, desplaza = camaraX * factor, base = ALTO - 4;
    const inicio = Math.floor(desplaza / SEGMENTO_FRENTE) - 1;
    ctx.fillStyle = 'rgba(16, 10, 14, 0.88)'; ctx.strokeStyle = 'rgba(16, 10, 14, 0.7)';
    let anterior = null;
    for (let k = inicio; k < inicio + ANCHO / SEGMENTO_FRENTE + 3; k++) {
      for (const p of frenteDeSegmento(k)) {
        const sx = p.x - desplaza;
        if (p.tipo === 'poste') {
          ctx.fillRect(sx - 3, base - p.alto, 6, p.alto);
          if (anterior) { ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(anterior.x, anterior.y); ctx.quadraticCurveTo((anterior.x + sx) / 2, anterior.y + 14, sx, base - p.alto + 8); ctx.stroke(); }
          anterior = { x: sx, y: base - p.alto + 8 };
        } else if (p.tipo === 'arbusto') {
          ctx.lineWidth = 1.5;
          for (let j = 0; j < 7; j++) { ctx.beginPath(); ctx.ellipse(sx, base - p.r * 0.6, p.r, p.r * (0.35 + (j % 3) * 0.25), j * 0.5, 0, Math.PI * 2); ctx.stroke(); }
        } else if (p.tipo === 'piedra') {
          ctx.beginPath(); ctx.ellipse(sx, base, p.r, p.r * 0.6, 0, Math.PI, 0); ctx.fill();
        }
      }
    }
  },

  dibujarAmbiente(ctx, camaraX, ambiente) {
    for (const p of ambiente.periodicos) {
      ctx.save();
      ctx.translate(p.x - camaraX, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.55 + Math.abs(Math.sin(p.fase)) * 0.45);
      ctx.fillStyle = '#e9e2cf'; ctx.fillRect(-p.w / 2, -p.w * 0.65, p.w, p.w * 1.3);
      ctx.fillStyle = '#9a948a';
      for (let k = 0; k < 4; k++) ctx.fillRect(-p.w / 2 + 2, -p.w * 0.5 + k * 5, p.w - 4, 1.5);
      ctx.restore();
    }
    for (const b of ambiente.bolas) {
      sombraElipse(ctx, b.x - camaraX + 4, b.y + b.radio, b.radio, b.radio * 0.3, 0.25);
      ctx.save();
      ctx.translate(b.x - camaraX, b.y);
      ctx.rotate(b.rot);
      ctx.strokeStyle = '#b4883f'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(0, 0, b.radio, b.radio * (0.3 + (k % 3) * 0.25), k * 0.7, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(230, 200, 150, 0.35)';
    for (const g of ambiente.polvo) ctx.fillRect(g.x, g.y, 2, 2);
  },
});

/* ===== Campo de pruebas: cielo y una planicie de tierra, sin nada más ===== */
Object.assign(Escenario, {
  dibujarCampo(ctx, camaraX) {
    const g = ctx.createLinearGradient(0, 0, 0, SUELO_BASE);
    g.addColorStop(0, '#1d1226'); g.addColorStop(0.45, '#6b2f2c'); g.addColorStop(0.8, '#c97a3f'); g.addColorStop(1, '#e4b06a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, ALTO);
    const solX = ((700 - camaraX * 0.01) % 2000 + 2000) % 2000 - 300;
    ctx.fillStyle = 'rgba(255, 224, 170, 0.95)';
    ctx.beginPath(); ctx.arc(solX, 300, 58, 0, Math.PI * 2); ctx.fill();
    const horizonte = SUELO_BASE - FONDO_CALLE;
    // Tierra: clara y lavada lejos, oscura cerca
    const t = ctx.createLinearGradient(0, horizonte, 0, ALTO);
    t.addColorStop(0, '#d2ad78'); t.addColorStop(0.25, '#a97d4f'); t.addColorStop(1, '#6a4a2e');
    ctx.fillStyle = t; ctx.fillRect(0, horizonte, ANCHO, ALTO - horizonte);
    // Surcos cada vez más separados hacia el frente (perspectiva)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
    for (let k = 0, y = horizonte + 6; y < ALTO; k++, y += 6 + k * 2.2) ctx.fillRect(0, y, ANCHO, 1);
    // Terrones y grietas fijos al mundo, para que se note el movimiento
    const desde = Math.floor(camaraX / 40) - 1, hasta = Math.floor((camaraX + ANCHO) / 40) + 1;
    for (let c = desde; c <= hasta; c++) {
      for (let fila = 0; fila < 4; fila++) {
        if (azar(c, 300 + fila) > 0.55) continue;
        const x = c * 40 + azar(c, 310 + fila) * 40 - camaraX;
        const prof = azar(c, 320 + fila);
        const y = horizonte + 8 + prof * (ALTO - horizonte - 16);
        const r = 2 + prof * 5;
        ctx.fillStyle = azar(c, 330 + fila) < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,230,190,0.18)';
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Neblina sobre el horizonte
    const n = ctx.createLinearGradient(0, horizonte - 24, 0, horizonte + 50);
    n.addColorStop(0, 'rgba(228, 176, 106, 0.55)'); n.addColorStop(1, 'rgba(228, 176, 106, 0)');
    ctx.fillStyle = n; ctx.fillRect(0, horizonte - 24, ANCHO, 74);
  },
});

/* ===== Galpón del entrenamiento: polígono de tiro bajo techo =====
 * De atrás hacia adelante: techo de chapa con cerchas y claraboyas, pared de chapa acanalada con
 * columnas de acero, carteles y zócalo de bloques; piso de cemento pulido con juntas en perspectiva;
 * campanas industriales con su cono de luz y polvo flotando en los haces de las claraboyas.
 * Cada capa se desplaza con su propio factor (paralaje); el punto de fuga es el centro de la pantalla. */
const CARTELES_GALPON = [
  ['PELIGRO', 'ZONA DE TIRO'], ['AVISO', 'USA PROTECCIÓN AUDITIVA'], ['AVISO', 'APUNTA SOLO AL BLANCO'],
  ['PELIGRO', 'NO CRUCES LA LÍNEA'], ['AVISO', 'ARMA DESCARGADA AL SALIR'],
];
Object.assign(Escenario, {
  dibujarGalpon(ctx, camaraX, tiempo = 0) {
    const PISO = SUELO_BASE - FONDO_CALLE;   // pie de la pared del fondo
    const TECHO = 66;                        // donde termina la estructura y empieza la pared
    const F_TECHO = 0.72, F_PARED = 0.82, F_LAMPARA = 0.9;
    const proy = (X, f) => (X - camaraX - ANCHO / 2) * f + ANCHO / 2;
    // Índices de los elementos con período `paso` que caen en pantalla con el factor f
    const rango = (paso, f, margen = 1) => {
      const media = ANCHO / 2 / f, c = camaraX + ANCHO / 2;
      return [Math.floor((c - media) / paso) - margen, Math.floor((c + media) / paso) + margen];
    };
    const desliz = (f, periodo) => ((-camaraX * f) % periodo + periodo) % periodo;

    /* --- Techo --- */
    let g = ctx.createLinearGradient(0, 0, 0, TECHO + 30);
    g.addColorStop(0, '#0b0d10'); g.addColorStop(1, '#1b1f25');
    ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, TECHO + 30);
    // Ondas de la chapa del techo vistas desde abajo
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let x = desliz(F_TECHO, 12); x < ANCHO; x += 12) ctx.fillRect(x, 0, 3, TECHO);
    // Claraboyas: paneles traslúcidos por donde entra la luz del día
    const claraboyas = [];
    let [a, b] = rango(900, F_TECHO);
    for (let k = a; k <= b; k++) {
      const x0 = proy(k * 900 + 260, F_TECHO), w = 170 * F_TECHO;
      if (x0 > ANCHO + 40 || x0 + w < -260) continue;
      g = ctx.createLinearGradient(0, 2, 0, TECHO - 8);
      g.addColorStop(0, '#9fb3bf'); g.addColorStop(1, '#5f7480');
      ctx.fillStyle = g; ctx.fillRect(x0, 2, w, TECHO - 10);
      ctx.fillStyle = 'rgba(20,24,28,0.55)';
      for (let i = 1; i < 5; i++) ctx.fillRect(x0 + w * i / 5 - 1, 2, 2, TECHO - 10);   // perfiles del marco
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0, 2, w, 3);
      claraboyas.push([x0, w]);
    }
    // Cercha continua: cordón superior, inferior y diagonales en zigzag
    ctx.fillStyle = '#2b3037'; ctx.fillRect(0, 6, ANCHO, 4); ctx.fillRect(0, TECHO - 6, ANCHO, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0, TECHO - 6, ANCHO, 1);
    ctx.strokeStyle = '#2b3037'; ctx.lineWidth = 2.2; ctx.beginPath();
    [a, b] = rango(56, F_TECHO);
    for (let k = a; k <= b; k++) {
      const x = proy(k * 56, F_TECHO), x2 = proy(k * 56 + 28, F_TECHO);
      ctx.moveTo(x, TECHO - 4); ctx.lineTo(x2, 9); ctx.lineTo(proy(k * 56 + 56, F_TECHO), TECHO - 4);
    }
    ctx.stroke();
    // Conducto de ventilación colgado bajo la cercha
    g = ctx.createLinearGradient(0, TECHO + 2, 0, TECHO + 18);
    g.addColorStop(0, '#6c737b'); g.addColorStop(0.35, '#9aa1a8'); g.addColorStop(1, '#3d4248');
    ctx.fillStyle = g; ctx.fillRect(0, TECHO + 2, ANCHO, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = desliz(F_TECHO, 130); x < ANCHO; x += 130) ctx.fillRect(x, TECHO + 1, 3, 18);   // uniones del conducto

    /* --- Pared de chapa acanalada --- */
    const muro = TECHO + 18;
    g = ctx.createLinearGradient(0, muro, 0, PISO);
    g.addColorStop(0, '#3a4148'); g.addColorStop(0.6, '#2f353b'); g.addColorStop(1, '#262a2f');
    ctx.fillStyle = g; ctx.fillRect(0, muro, ANCHO, PISO - muro);
    const onda = 7, inicio = desliz(F_PARED, onda);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = inicio; x < ANCHO; x += onda) ctx.fillRect(x, muro, 2, PISO - muro);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = inicio + 3.5; x < ANCHO; x += onda) ctx.fillRect(x, muro, 1.5, PISO - muro);
    // Junta horizontal entre chapas, con tornillos
    const junta = muro + (PISO - muro) * 0.42;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, junta, ANCHO, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, junta + 1.5, ANCHO, 1);
    ctx.fillStyle = '#5a6168';
    for (let x = inicio; x < ANCHO; x += onda * 3) ctx.fillRect(x, junta - 3, 1.5, 1.5);
    // Chorreaduras de óxido bajo algunos tornillos
    [a, b] = rango(onda * 3, F_PARED);
    for (let k = a; k <= b; k++) {
      if (azar(k, 501) > 0.18) continue;
      const x = proy(k * onda * 3, F_PARED), largo = 18 + azar(k, 502) * 50;
      const r = ctx.createLinearGradient(0, junta, 0, junta + largo);
      r.addColorStop(0, 'rgba(130,70,35,0.4)'); r.addColorStop(1, 'rgba(130,70,35,0)');
      ctx.fillStyle = r; ctx.fillRect(x - 1, junta, 3, largo);
    }
    // Número de pista estarcido en grande
    [a, b] = rango(1536, F_PARED);
    ctx.font = 'bold 46px sans-serif'; ctx.textAlign = 'center';
    for (let k = a; k <= b; k++) {
      ctx.fillStyle = 'rgba(230,230,225,0.08)';
      ctx.fillText(t('mundo.PISTA') + ' ' + (((k % 9) + 9) % 9 + 1), proy(k * 1536 + 768, F_PARED), muro + 70);
    }
    // Zócalo de bloques de cemento con franja de seguridad
    const zocalo = PISO - 62;
    ctx.fillStyle = '#4d5154'; ctx.fillRect(0, zocalo, ANCHO, PISO - zocalo);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let fila = 0, y = zocalo + 10; y < PISO; fila++, y += 13) {
      ctx.fillRect(0, y, ANCHO, 1);
      const salto = fila % 2 ? 19 : 0;
      for (let x = desliz(F_PARED, 38) + salto - 38; x < ANCHO; x += 38) ctx.fillRect(x, y, 1, 13);
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, zocalo, ANCHO, 9); ctx.clip();
    ctx.fillStyle = '#d6b22a'; ctx.fillRect(0, zocalo, ANCHO, 9);
    ctx.fillStyle = '#1b1b1b';
    for (let x = desliz(F_PARED, 18) - 18; x < ANCHO + 18; x += 18) {
      ctx.beginPath(); ctx.moveTo(x, zocalo + 9); ctx.lineTo(x + 9, zocalo); ctx.lineTo(x + 18, zocalo); ctx.lineTo(x + 9, zocalo + 9); ctx.fill();
    }
    ctx.restore();
    // Carteles de seguridad entre columnas
    [a, b] = rango(384, F_PARED);
    for (let k = a; k <= b; k++) {
      if (azar(k, 520) > 0.65) continue;
      const [claveTitulo, claveTexto] = CARTELES_GALPON[Math.floor(azar(k, 521) * CARTELES_GALPON.length)];
      const titulo = t('mundo.' + claveTitulo), texto = t('mundo.' + claveTexto), peligro = claveTitulo === 'PELIGRO';
      const cx = proy(k * 384 + 192, F_PARED), cy = junta + 26 + azar(k, 522) * 30;
      ctx.font = 'bold 6.5px sans-serif';
      const w = Math.max(70, ctx.measureText(texto).width + 14), h = 30;   // el cartel se ajusta al texto
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - w / 2 + 2, cy + 2, w, h);
      ctx.fillStyle = '#e9e6dc'; ctx.fillRect(cx - w / 2, cy, w, h);
      ctx.fillStyle = peligro ? '#b5261e' : '#d8a21c'; ctx.fillRect(cx - w / 2, cy, w, 11);
      ctx.textAlign = 'center';
      ctx.fillStyle = peligro ? '#fff' : '#1b1b1b'; ctx.font = 'bold 8px sans-serif'; ctx.fillText(titulo, cx, cy + 8.5);
      ctx.fillStyle = '#1b1b1b'; ctx.font = 'bold 6.5px sans-serif'; ctx.fillText(texto, cx, cy + 22);
    }
    // Columnas de acero (perfil doble T) con protección pintada abajo
    [a, b] = rango(384, F_PARED);
    for (let k = a; k <= b; k++) {
      const x = proy(k * 384, F_PARED);
      if (x < -30 || x > ANCHO + 30) continue;
      const w = 20;
      g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, '#1c2025'); g.addColorStop(0.18, '#545c64'); g.addColorStop(0.24, '#2a2f35');
      g.addColorStop(0.76, '#2a2f35'); g.addColorStop(0.84, '#4a5158'); g.addColorStop(1, '#16191d');
      ctx.fillStyle = g; ctx.fillRect(x - w / 2, 0, w, PISO);
      // Protección amarilla y negra en el pie
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#1b1b1b' : '#d6b22a'; ctx.fillRect(x - w / 2, PISO - 48 + i * 8, w, 8); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + w / 2 - 5, PISO - 48, 5, 48);
      ctx.fillStyle = '#15171a'; ctx.fillRect(x - 15, PISO - 4, 30, 5);   // placa base
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('C-' + (((k % 24) + 24) % 24 + 1), x, muro + 30);
    }

    /* --- Piso de cemento pulido --- */
    g = ctx.createLinearGradient(0, PISO, 0, ALTO);
    g.addColorStop(0, '#6a6d6f'); g.addColorStop(0.3, '#55585a'); g.addColorStop(1, '#2c2e30');
    ctx.fillStyle = g; ctx.fillRect(0, PISO, ANCHO, ALTO - PISO);
    // Reflejo de la pared sobre el piso pulido
    g = ctx.createLinearGradient(0, PISO, 0, PISO + 30);
    g.addColorStop(0, 'rgba(20,24,28,0.45)'); g.addColorStop(1, 'rgba(20,24,28,0)');
    ctx.fillStyle = g; ctx.fillRect(0, PISO, ANCHO, 30);
    // Juntas de dilatación: transversales que convergen al centro y longitudinales que se separan
    const fBase = F_PARED, fFrente = 1.35;
    [a, b] = rango(240, fBase, 2);
    ctx.lineWidth = 1;
    for (let k = a; k <= b; k++) {
      const x1 = proy(k * 240, fBase), x2 = proy(k * 240, fFrente);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(x1, PISO); ctx.lineTo(x2, ALTO); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(x1 + 1, PISO); ctx.lineTo(x2 + 1.5, ALTO); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (const y of [PISO + 22, PISO + 66, PISO + 132]) ctx.fillRect(0, y, ANCHO, 1);
    // Línea amarilla de tiro, gastada
    [a, b] = rango(40, 0.95);
    for (let k = a; k <= b; k++) {
      const x = proy(k * 40, 0.95), gasto = azar(k, 540);
      ctx.fillStyle = `rgba(214,178,42,${0.35 + gasto * 0.35})`;
      ctx.fillRect(x, PISO + 12, 40 * 0.95 - (gasto < 0.12 ? 18 : 0), 3);
    }
    // Manchas de aceite y casquillos viejos tirados
    [a, b] = rango(70, 1.0, 2);
    for (let k = a; k <= b; k++) {
      const prof = azar(k, 550), y = PISO + 20 + prof * (ALTO - PISO - 30);
      const f = fBase + prof * (fFrente - fBase), x = proy(k * 70 + azar(k, 551) * 70, f);
      if (azar(k, 552) < 0.16) {
        ctx.fillStyle = 'rgba(10,10,12,0.16)';
        ctx.beginPath(); ctx.ellipse(x, y, 10 + prof * 22, 2.5 + prof * 5, 0, 0, Math.PI * 2); ctx.fill();
      } else if (azar(k, 553) < 0.3) {
        ctx.fillStyle = azar(k, 554) < 0.7 ? '#b8923f' : '#8f8f8a';
        ctx.fillRect(x, y, 2 + prof * 2, 1 + prof);
      }
    }

    /* --- Luz: haces de las claraboyas y campanas industriales --- */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x0, w] of claraboyas) {
      g = ctx.createLinearGradient(0, TECHO, 0, PISO + 60);
      g.addColorStop(0, 'rgba(190,205,215,0.10)'); g.addColorStop(1, 'rgba(190,205,215,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x0, TECHO); ctx.lineTo(x0 + w, TECHO); ctx.lineTo(x0 + w + 200, PISO + 60); ctx.lineTo(x0 + 150, PISO + 60); ctx.fill();
    }
    [a, b] = rango(384, F_LAMPARA);
    const lamparas = [];
    for (let k = a; k <= b; k++) {
      const x = proy(k * 384 + 192, F_LAMPARA);
      if (x < -160 || x > ANCHO + 160) continue;
      // Alguna titila, como los tubos viejos
      let luz = 1;
      if (azar(k, 560) < 0.15) luz = Math.sin(tiempo * 31 + k) + Math.sin(tiempo * 7.3 + k * 2) > 1.1 ? 0.25 : 1;
      lamparas.push([x, luz]);
      const yL = 118;
      g = ctx.createLinearGradient(0, yL, 0, PISO + 70);
      g.addColorStop(0, `rgba(255,232,180,${0.16 * luz})`); g.addColorStop(1, 'rgba(255,232,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - 14, yL); ctx.lineTo(x + 14, yL); ctx.lineTo(x + 125, PISO + 70); ctx.lineTo(x - 125, PISO + 70); ctx.fill();
      // Charco de luz en el piso
      const charco = ctx.createRadialGradient(x, PISO + 30, 4, x, PISO + 30, 150);
      charco.addColorStop(0, `rgba(255,232,180,${0.14 * luz})`); charco.addColorStop(1, 'rgba(255,232,180,0)');
      ctx.fillStyle = charco;
      ctx.beginPath(); ctx.ellipse(x, PISO + 30, 150, 32, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Polvo flotando, visible en la luz
    ctx.fillStyle = 'rgba(255,240,210,0.22)';
    for (let i = 0; i < 40; i++) {
      const x = ((azar(i, 570) * ANCHO * 1.4 + tiempo * (4 + azar(i, 571) * 8) - camaraX * 0.85) % ANCHO + ANCHO) % ANCHO;
      const y = 90 + azar(i, 572) * (PISO - 70) + Math.sin(tiempo * 0.6 + i) * 8;
      ctx.fillRect(x, y, 1.2, 1.2);
    }
    ctx.restore();
    // Campanas: cable, pantalla metálica y lámpara encendida
    for (const [x, luz] of lamparas) {
      ctx.fillStyle = '#121418'; ctx.fillRect(x - 0.6, TECHO + 18, 1.2, 88);
      ctx.fillStyle = '#2c3137';
      ctx.beginPath(); ctx.moveTo(x - 5, 106); ctx.lineTo(x + 5, 106); ctx.lineTo(x + 17, 119); ctx.lineTo(x - 17, 119); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x - 5, 106, 10, 2);
      const foco = ctx.createRadialGradient(x, 120, 1, x, 120, 22);
      foco.addColorStop(0, `rgba(255,246,220,${0.95 * luz})`); foco.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = foco; ctx.beginPath(); ctx.ellipse(x, 120, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
});
