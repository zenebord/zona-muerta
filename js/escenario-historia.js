/* ===== Escenarios del modo historia («Camino a casa») =====
 * Cuatro lugares, uno por nivel, de atrás hacia adelante: cielo, capas lejanas con paralaje, suelo y objetos
 * fijos al mundo. Al final de cada nivel, un cartel con el kilómetro; en el último, la casa.
 *   avion:  bosque al amanecer con los restos del avión (fuselaje partido, ala, cola, motor, valijas, fuego y humo)
 *   ruta:   carretera a la tarde, con neblina, postes de luz, guardarraíl, carteles y autos abandonados
 *   ciudad: la ciudad en ruinas de noche, con luna, incendios en el horizonte y faroles
 *   barrio: casas con jardín y cerca blanca al amanecer; la última es la del protagonista
 */
const EscenarioHistoria = {
  fondo(ctx, cam, t, H) {
    const tema = H.def.clave;
    if (tema === 'avion') this.fondoAvion(ctx, cam, t, H);
    else if (tema === 'ruta') this.fondoRuta(ctx, cam, t, H);
    else if (tema === 'ciudad') this.fondoCiudad(ctx, cam, t, H);
    else this.fondoBarrio(ctx, cam, t, H);
    if (tema !== 'barrio') this.cartelMeta(ctx, cam, H);
  },

  frente(ctx, cam, t, H) {
    const tema = H.def.clave;
    if (tema === 'ruta' || tema === 'ciudad') Escenario.dibujarFrente(ctx, cam);
    else this.pastoAdelante(ctx, cam, tema === 'barrio' ? '#4f7a32' : '#3e5226');
    if (tema === 'ciudad') { ctx.fillStyle = 'rgba(10, 14, 40, 0.18)'; ctx.fillRect(0, 0, ANCHO, ALTO); }   // la noche también tiñe lo de adelante
  },

  /* ---------- Piezas comunes ---------- */
  cielo(ctx, colores, alto = SUELO_BASE) {
    const g = ctx.createLinearGradient(0, 0, 0, alto);
    colores.forEach((c, i) => g.addColorStop(i / (colores.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, ANCHO, ALTO);
  },
  astro(ctx, x, y, r, color, halo) {
    if (halo) { const h = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3); h.addColorStop(0, halo); h.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = h; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  },
  estrellas(ctx, cam, t) {
    for (let k = 0; k < 90; k++) {
      const x = ((azar(k, 701) * 2400 - cam * 0.02) % 2400 + 2400) % 2400 - 200, y = azar(k, 702) * 260;
      ctx.fillStyle = `rgba(230, 230, 255, ${0.35 + 0.5 * Math.abs(Math.sin(t * 1.3 + k))})`; ctx.fillRect(x, y, k % 7 ? 1.5 : 2.5, k % 7 ? 1.5 : 2.5);
    }
  },
  // Fila de pinos (o árboles redondos) con paralaje
  arboleda(ctx, cam, factor, base, alto, color, sal, redondos = false) {
    const paso = 46, desplaza = cam * factor, inicio = Math.floor(desplaza / paso) - 1;
    ctx.fillStyle = color; ctx.fillRect(0, base - 2, ANCHO, ALTO - base + 2);
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza + azar(k, sal) * 20, h = alto * (0.6 + azar(k, sal + 1) * 0.5);
      ctx.beginPath();
      if (redondos) { ctx.ellipse(x, base - h * 0.6, h * 0.42, h * 0.5, 0, 0, Math.PI * 2); ctx.rect(x - 3, base - h * 0.3, 6, h * 0.3); }
      else { ctx.moveTo(x - h * 0.28, base); ctx.lineTo(x, base - h); ctx.lineTo(x + h * 0.28, base); }
      ctx.fill();
    }
  },
  humo(ctx, x, y, t, escala = 1) {
    for (let k = 0; k < 9; k++) {
      const f = (t * 0.12 + k / 9) % 1, r = (10 + f * 46) * escala;
      ctx.fillStyle = `rgba(${60 + f * 60}, ${56 + f * 56}, ${60 + f * 56}, ${0.5 * (1 - f)})`;
      ctx.beginPath(); ctx.arc(x + Math.sin(k * 2 + t * 0.5) * 12 * escala + f * 60 * escala, y - f * 260 * escala, r, 0, Math.PI * 2); ctx.fill();
    }
  },
  fuego(ctx, x, y, t, escala = 1) {
    for (let k = 0; k < 7; k++) {
      const f = Math.sin(t * 11 + k * 1.9), h = (16 + f * 6 + (k % 3) * 6) * escala;
      ctx.fillStyle = k % 2 ? 'rgba(255, 176, 46, 0.9)' : 'rgba(255, 90, 31, 0.9)';
      ctx.beginPath(); ctx.moveTo(x + (k - 3.5) * 5 * escala, y); ctx.quadraticCurveTo(x + (k - 3) * 5 * escala + f * 3, y - h * 0.6, x + (k - 3) * 5 * escala, y - h); ctx.quadraticCurveTo(x + (k - 2.5) * 5 * escala, y - h * 0.5, x + (k - 2.5) * 5 * escala, y); ctx.fill();
    }
    const g = ctx.createRadialGradient(x, y - 10 * escala, 2, x, y - 10 * escala, 60 * escala); g.addColorStop(0, 'rgba(255,160,60,0.35)'); g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 60 * escala, y - 70 * escala, 120 * escala, 120 * escala);
  },
  pastoAdelante(ctx, cam, color) {
    const desde = Math.floor(cam / 38) - 1, hasta = Math.floor((cam + ANCHO) / 38) + 1;
    for (let c = desde; c <= hasta; c++) {
      if (azar(c, 720) > 0.6) continue;
      const x = c * 38 + azar(c, 721) * 30 - cam, y = SUELO_BASE + 60 + azar(c, 722) * 40, h = 10 + azar(c, 723) * 14;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3, y); ctx.quadraticCurveTo(x + k * 4, y - h * 0.6, x + k * 6, y - h); ctx.stroke(); }
    }
  },
  sueloCampo(ctx, cam, arriba, abajo, camino) {
    const horizonte = SUELO_BASE - FONDO_CALLE;
    const g = ctx.createLinearGradient(0, horizonte, 0, ALTO); g.addColorStop(0, arriba); g.addColorStop(1, abajo);
    ctx.fillStyle = g; ctx.fillRect(0, horizonte, ANCHO, ALTO - horizonte);
    // Sendero de tierra por donde camina
    const s = ctx.createLinearGradient(0, SUELO_BASE - 18, 0, SUELO_BASE + 46); s.addColorStop(0, camino[0]); s.addColorStop(1, camino[1]);
    ctx.fillStyle = s; ctx.fillRect(0, SUELO_BASE - 18, ANCHO, 64);
    const desde = Math.floor(cam / 30) - 1, hasta = Math.floor((cam + ANCHO) / 30) + 1;
    for (let c = desde; c <= hasta; c++) {
      const x = c * 30 + azar(c, 730) * 26 - cam, y = horizonte + 6 + azar(c, 731) * (ALTO - horizonte - 10);
      ctx.fillStyle = azar(c, 732) < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,240,200,0.10)';
      ctx.beginPath(); ctx.ellipse(x, y, 3 + azar(c, 733) * 5, 1.5 + azar(c, 734) * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  },

  /* ---------- Nivel 1: los restos del avión, en el bosque, al amanecer ---------- */
  fondoAvion(ctx, cam, t, H) {
    this.cielo(ctx, ['#2a2340', '#5a3a5e', '#b8625c', '#e8915a', '#f2c27a']);
    this.astro(ctx, 220 - cam * 0.01, 330, 34, 'rgba(255, 226, 154, 0.95)', 'rgba(255, 200, 120, 0.35)');
    Escenario.cordillera(ctx, cam, 0.06, 330, 70, '#6a5068', '#4a3850', 41);
    this.arboleda(ctx, cam, 0.25, 360, 70, '#2f3b34', 43);
    this.arboleda(ctx, cam, 0.5, 385, 90, '#243024', 47);
    this.sueloCampo(ctx, cam, '#5d6b3a', '#2c331b', ['#7a6440', '#5a4528']);
    const x0 = H.inicio;
    // Columnas de humo de los restos que todavía arden (se ven desde lejos)
    for (const dx of [-250, 950, 2600]) { const sx = x0 + dx - cam; if (sx > -300 && sx < ANCHO + 300) this.humo(ctx, sx, SUELO_BASE - 70, t, 1.3); }
    // Los restos, fijos en el mundo
    const piezas = [['fuselaje', -260, 1], ['valijas', 120], ['ala', 420], ['asientos', 760], ['cola', 950], ['valijas', 1300], ['motor', 1750], ['asientos', 2150], ['fuselaje', 2600, -1], ['valijas', 3000], ['ala', 3500], ['asientos', 3900], ['valijas', 4300]];
    for (const [tipo, dx, lado] of piezas) {
      const sx = x0 + dx - cam;
      if (sx < -340 || sx > ANCHO + 340) continue;
      this['resto_' + tipo](ctx, sx, SUELO_BASE - FONDO_CALLE + 22, t, lado || 1);
    }
    if (H.def.terreno) this.terreno(ctx, cam, t, H);
  },

  /* ---------- Desniveles del nivel 1: escombros, cráteres, cajas de carga, fuselajes, escalerillas y el ala ----------
   * La cara de arriba de cada obstáculo es la línea donde se camina; el frente baja hasta delante del sendero. */
  terreno(ctx, cam, t, H) {
    const x0 = H.inicio, frente = SUELO_BASE + 34;
    for (const [a, b, h0, h1, tipo] of H.def.terreno) {
      if (tipo === 'suelo') continue;
      const sa = x0 + a - cam, sb = x0 + b - cam;
      if (sb < -40 || sa > ANCHO + 40) continue;
      const k = a;   // semilla de los detalles
      if (tipo === 'pozo') this.crater(ctx, sa, sb, SUELO_BASE - h0, t, k);
      else if (tipo === 'escombro') this.escombro(ctx, sa, sb, SUELO_BASE - h0, frente, k);
      else if (tipo === 'cajas') this.cajasCarga(ctx, sa, sb, SUELO_BASE - h0, frente, k);
      else if (tipo === 'fuselaje') this.fuselajePiso(ctx, sa, sb, SUELO_BASE - h0, frente, t, k);
      else if (tipo === 'escalera') this.escalerilla(ctx, sa, sb, h0, h1, frente);
      else if (tipo === 'ala') this.alaRampa(ctx, sa, sb, h0, h1, frente);
    }
  },
  crater(ctx, sa, sb, piso, t, k) {
    const borde = SUELO_BASE - 18;
    ctx.fillStyle = '#2a1e14'; ctx.beginPath(); ctx.moveTo(sa - 12, borde); ctx.lineTo(sa + 10, piso - 6); ctx.lineTo(sb - 10, piso - 6); ctx.lineTo(sb + 12, borde); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, piso - 8, 0, piso + 40); g.addColorStop(0, '#4a3624'); g.addColorStop(1, '#22180f');
    ctx.fillStyle = g; ctx.fillRect(sa + 6, piso - 8, sb - sa - 12, SUELO_BASE + 46 - piso + 8);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sa + 6, piso - 8, 10, SUELO_BASE + 54 - piso);   // sombra de la pared
    for (let i = 0; i < 5; i++) { const x = sa + 20 + azar(k + i, 760) * (sb - sa - 40); ctx.fillStyle = `rgba(255, ${90 + i * 20}, 30, ${0.4 + 0.4 * Math.abs(Math.sin(t * 3 + i))})`; ctx.fillRect(x, piso - 2, 3, 2); }   // brasas
    ctx.fillStyle = '#5a4a38'; for (let i = 0; i < 6; i++) { const x = sa + azar(k + i, 761) * (sb - sa); ctx.beginPath(); ctx.ellipse(x, borde + 2, 6 + azar(k, i) * 6, 3, 0, 0, Math.PI * 2); ctx.fill(); }   // tierra levantada en el borde
  },
  escombro(ctx, sa, sb, arriba, frente, k) {
    // Montaña de losas de hormigón, chapas y hierros, con la cara de arriba por donde se camina
    const pts = [[sa - 6, frente]];
    for (let x = sa, i = 0; x <= sb; x += 12, i++) pts.push([x, arriba - 2 - azar(k + i, 770) * 7]);
    pts.push([sb + 6, frente]);
    const g = ctx.createLinearGradient(0, arriba - 10, 0, frente); g.addColorStop(0, '#9a948c'); g.addColorStop(0.5, '#6e6862'); g.addColorStop(1, '#3e3a36');
    ctx.fillStyle = g; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 6; i++) {   // losas sueltas y chapas
      const x = sa + azar(k + i, 771) * (sb - sa - 20), y = arriba + 4 + azar(k + i, 772) * (frente - arriba - 16), w = 18 + azar(k + i, 773) * 26;
      ctx.save(); ctx.translate(x, y); ctx.rotate((azar(k + i, 774) - 0.5) * 0.8);
      ctx.fillStyle = i % 3 === 0 ? '#7d838c' : '#b0aaa0'; ctx.fillRect(0, 0, w, 7); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 5, w, 2); ctx.restore();
    }
    ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2;   // hierros retorcidos
    for (let i = 0; i < 4; i++) { const x = sa + 10 + azar(k + i, 775) * (sb - sa - 20); ctx.beginPath(); ctx.moveTo(x, arriba + 4); ctx.quadraticCurveTo(x + 6, arriba - 14, x + 14 - azar(k, i) * 20, arriba - 22); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sa, arriba - 3, sb - sa, 2);
  },
  cajasCarga(ctx, sa, sb, arriba, frente, k) {
    // Contenedores de carga del avión, de aluminio con nervios y la etiqueta
    const g = ctx.createLinearGradient(0, arriba, 0, frente); g.addColorStop(0, '#b9c0c8'); g.addColorStop(1, '#6b7280');
    ctx.fillStyle = g; ctx.fillRect(sa, arriba, sb - sa, frente - arriba);
    ctx.fillStyle = '#e8ecf0'; ctx.fillRect(sa, arriba, sb - sa, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = sa + 10; x < sb - 4; x += 12) ctx.fillRect(x, arriba + 6, 3, frente - arriba - 10);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(sa + 8, arriba + 14, Math.min(46, sb - sa - 16), 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('CARGO', sa + 11, arriba + 25);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(sa, arriba, sb - sa, frente - arriba);
  },
  fuselajePiso(ctx, sa, sb, arriba, frente, t, k) {
    // Tramo de fuselaje acostado: se camina por el techo; ventanillas, franja roja y las puntas rotas
    const g = ctx.createLinearGradient(0, arriba - 6, 0, frente); g.addColorStop(0, '#f2f4f7'); g.addColorStop(0.35, '#c5cad2'); g.addColorStop(1, '#6b7078');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sa, frente); ctx.lineTo(sa, arriba + 8); ctx.quadraticCurveTo(sa, arriba - 4, sa + 14, arriba - 4); ctx.lineTo(sb - 14, arriba - 4); ctx.quadraticCurveTo(sb, arriba - 4, sb, arriba + 8); ctx.lineTo(sb, frente); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(sa, arriba + 30, sb - sa, 6);
    ctx.fillStyle = '#2b3e55'; for (let x = sa + 18; x < sb - 14; x += 22) { ctx.beginPath(); ctx.ellipse(x, arriba + 18, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#1d2129'; for (const x of [sa, sb - 10]) { ctx.beginPath(); ctx.moveTo(x, arriba + 4); ctx.lineTo(x + 10, arriba + 14); ctx.lineTo(x + 4, arriba + 30); ctx.lineTo(x + 10, frente - 6); ctx.lineTo(x, frente); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(sa, frente - 8, sb - sa, 8);
    this.fuego(ctx, sb - 6, arriba - 2, t, 0.8);
  },
  escalerilla(ctx, sa, sb, h0, h1, frente) {
    // Escalerilla del avión: escalones con pasamanos y la base con ruedas
    const n = Math.max(1, Math.round(Math.abs(h1 - h0) / 12)), w = (sb - sa) / n, sube = h1 > h0;
    for (let i = 0; i < n; i++) {
      const h = h0 + (h1 - h0) * (i + (sube ? 1 : 0)) / n, x = sa + i * w, y = SUELO_BASE - h;
      ctx.fillStyle = '#c9ced6'; ctx.fillRect(x, y, w + 1, 4); ctx.fillStyle = '#6b7280'; ctx.fillRect(x, y + 4, w + 1, frente - y - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + w - 2, y + 4, 2, frente - y - 4);
    }
    const alto = SUELO_BASE - Math.max(h0, h1), bajoX = sube ? sa : sb, altoX = sube ? sb : sa;
    ctx.strokeStyle = '#e8ecf0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bajoX, SUELO_BASE - 30); ctx.lineTo(altoX, alto - 30); ctx.stroke();   // pasamanos
    ctx.lineWidth = 2; for (let i = 0; i <= n; i++) { const x = sa + i * w, y = SUELO_BASE - (h0 + (h1 - h0) * i / n); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 30); ctx.stroke(); }
    ctx.fillStyle = '#1d2129'; for (const x of [sa + 10, sb - 10]) { ctx.beginPath(); ctx.arc(x, frente - 2, 6, 0, Math.PI * 2); ctx.fill(); }
  },
  alaRampa(ctx, sa, sb, h0, h1, frente) {
    // El ala apoyada como rampa: chapa de aluminio con remaches y las aletas
    const y0 = SUELO_BASE - h0, y1 = SUELO_BASE - h1;
    ctx.fillStyle = '#a7adb6'; ctx.beginPath(); ctx.moveTo(sa, y0); ctx.lineTo(sb, y1); ctx.lineTo(sb, y1 + 12); ctx.lineTo(sa, y0 + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9dde3'; ctx.beginPath(); ctx.moveTo(sa, y0); ctx.lineTo(sb, y1); ctx.lineTo(sb, y1 + 3); ctx.lineTo(sa, y0 + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4f58'; ctx.beginPath(); ctx.moveTo(sa, y0 + 12); ctx.lineTo(sb, y1 + 12); ctx.lineTo(sb, frente); ctx.lineTo(sa + 10, frente); ctx.closePath(); ctx.globalAlpha = h0 === h1 ? 1 : 0.55; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = sa + 8; x < sb; x += 16) { const y = y0 + (y1 - y0) * (x - sa) / (sb - sa); ctx.fillRect(x, y + 6, 2, 2); }
    if (h0 === h1) { ctx.fillStyle = '#c0392b'; ctx.fillRect(sb - 14, y1 - 2, 10, 5); }
  },
  resto_fuselaje(ctx, sx, base, t, lado) {
    ctx.save(); ctx.translate(sx, base); ctx.scale(lado, 1);
    const g = ctx.createLinearGradient(0, -86, 0, 0); g.addColorStop(0, '#eef1f5'); g.addColorStop(0.5, '#c5cad2'); g.addColorStop(1, '#7d838c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-170, -6); ctx.quadraticCurveTo(-190, -46, -160, -82); ctx.lineTo(120, -86); ctx.lineTo(132, -64); ctx.lineTo(118, -50); ctx.lineTo(136, -30); ctx.lineTo(120, -12); ctx.lineTo(128, 0); ctx.lineTo(-150, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1d2129'; ctx.beginPath(); ctx.moveTo(120, -86); ctx.lineTo(132, -64); ctx.lineTo(118, -50); ctx.lineTo(136, -30); ctx.lineTo(120, -12); ctx.lineTo(128, 0); ctx.lineTo(104, 0); ctx.lineTo(104, -84); ctx.closePath(); ctx.fill();   // boca rota
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-160, -40, 264, 6);
    ctx.fillStyle = '#2b3e55'; for (let k = 0; k < 11; k++) { ctx.beginPath(); ctx.ellipse(-140 + k * 22, -58, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-150, -6, 270, 6);
    ctx.restore();
    this.fuego(ctx, sx + 112 * lado, base - 4, t, 1.3);
  },
  resto_ala(ctx, sx, base, t) {
    ctx.fillStyle = '#a7adb6'; ctx.beginPath(); ctx.moveTo(sx - 150, base - 2); ctx.lineTo(sx + 130, base - 20); ctx.lineTo(sx + 150, base - 10); ctx.lineTo(sx - 120, base + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7d838c'; ctx.beginPath(); ctx.moveTo(sx - 120, base + 6); ctx.lineTo(sx + 150, base - 10); ctx.lineTo(sx + 150, base - 4); ctx.lineTo(sx - 116, base + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(sx + 120, base - 22, 18, 5);
  },
  resto_cola(ctx, sx, base, t) {
    ctx.save(); ctx.translate(sx, base); ctx.rotate(-0.2);
    ctx.fillStyle = '#d9dde3'; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-10, -130); ctx.lineTo(30, -130); ctx.lineTo(50, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(-26, -70); ctx.lineTo(-12, -120); ctx.lineTo(24, -120); ctx.lineTo(36, -70); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f1e6d0'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('214', 8, -86);
    ctx.restore();
    this.fuego(ctx, sx - 10, base, t, 0.9);
  },
  resto_motor(ctx, sx, base, t) {
    const g = ctx.createLinearGradient(0, base - 50, 0, base); g.addColorStop(0, '#9aa0aa'); g.addColorStop(1, '#4a4f58');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx - 60, base - 48, 110, 48, 22) : ctx.rect(sx - 60, base - 48, 110, 48); ctx.fill();
    ctx.fillStyle = '#1d2129'; ctx.beginPath(); ctx.ellipse(sx + 50, base - 24, 10, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(sx + 50, base - 24); ctx.lineTo(sx + 50 + Math.cos(t + k * 1.26) * 8, base - 24 + Math.sin(t + k * 1.26) * 20); ctx.stroke(); }
    this.humo(ctx, sx + 30, base - 40, t, 0.6);
  },
  resto_asientos(ctx, sx, base) {
    for (let k = 0; k < 3; k++) {
      const x = sx - 50 + k * 34, y = base + (k % 2) * 6;
      ctx.fillStyle = '#2c4a7a'; ctx.fillRect(x, y - 34, 24, 26); ctx.fillStyle = '#1f3558'; ctx.fillRect(x, y - 10, 30, 8); ctx.fillStyle = '#5a6b8a'; ctx.fillRect(x + 4, y - 30, 16, 4);
    }
  },
  resto_valijas(ctx, sx, base) {
    const colores = ['#8a2a2a', '#2a5a8a', '#3a3a3a', '#8a6a2a'];
    for (let k = 0; k < 4; k++) {
      const x = sx - 70 + k * 40 + (k % 2) * 8, y = base + 8 + (k % 3) * 6, w = 26 + (k % 2) * 8, h = 18 + (k % 3) * 4;
      ctx.fillStyle = colores[k]; ctx.fillRect(x, y - h, w, h); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y - 3, w, 3);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.strokeRect(x + w / 2 - 5, y - h - 5, 10, 5);
    }
  },

  /* ---------- Nivel 2: la ruta 9, a la tarde ---------- */
  fondoRuta(ctx, cam, t, H) {
    this.cielo(ctx, ['#7d8fa0', '#b6b39a', '#e2cf9c', '#efd9a6']);
    this.astro(ctx, 640 - cam * 0.01, 150, 30, 'rgba(255, 244, 210, 0.85)', 'rgba(255, 240, 200, 0.3)');
    Escenario.cordillera(ctx, cam, 0.06, 330, 80, '#8a93a6', '#6e7790', 51);
    Escenario.cordillera(ctx, cam, 0.14, 360, 46, '#a3a07e', '#878466', 53);
    this.arboleda(ctx, cam, 0.35, 378, 40, '#6f7350', 55, true);
    // Postes de luz con los cables, más cerca
    const paso = 300, desplaza = cam * 0.6, inicio = Math.floor(desplaza / paso) - 1;
    ctx.strokeStyle = '#3a3428'; ctx.lineWidth = 1.2;
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza;
      ctx.fillStyle = '#4a3f2c'; ctx.fillRect(x - 3, 250, 6, 140); ctx.fillRect(x - 22, 258, 44, 4);
      ctx.beginPath(); ctx.moveTo(x - 20, 262); ctx.quadraticCurveTo(x + paso / 2, 290, x + paso - 20, 262); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 20, 262); ctx.quadraticCurveTo(x + paso / 2, 294, x + paso + 20, 262); ctx.stroke();
    }
    const n = ctx.createLinearGradient(0, 240, 0, 390); n.addColorStop(0, 'rgba(226, 207, 156, 0)'); n.addColorStop(1, 'rgba(226, 207, 156, 0.5)');
    ctx.fillStyle = n; ctx.fillRect(0, 240, ANCHO, 150);
    // Carteles de la ruta, fijos en el mundo
    for (const [dx, txt] of [[300, 'RUTA 9'], [2200, 'CIUDAD 50 KM'], [4200, 'NO SE DETENGA']]) {
      const sx = H.inicio + dx - cam; if (sx < -150 || sx > ANCHO + 150) continue;
      const base = SUELO_BASE - FONDO_CALLE - 10;
      ctx.fillStyle = '#5a5a5a'; ctx.fillRect(sx - 40, base - 90, 5, 90); ctx.fillRect(sx + 35, base - 90, 5, 90);
      ctx.fillStyle = '#1f6a3a'; ctx.fillRect(sx - 64, base - 130, 128, 46); ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 3; ctx.strokeRect(sx - 60, base - 126, 120, 38);
      ctx.fillStyle = '#f2f2f2'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(txt, sx, base - 101);
    }
    Escenario.dibujarSuelo(ctx, cam);
    this.guardarrail(ctx, cam);
    Escenario.dibujarFondoDelMundo(ctx, cam, t);
  },
  guardarrail(ctx, cam) {
    const y = SUELO_BASE - FONDO_CALLE - 12;
    ctx.fillStyle = '#9ca3ad'; ctx.fillRect(0, y - 8, ANCHO, 7); ctx.fillStyle = '#6b7280'; ctx.fillRect(0, y - 2, ANCHO, 2);
    const inicio = Math.floor(cam / 80) * 80;
    for (let x = inicio; x < cam + ANCHO + 80; x += 80) { ctx.fillStyle = '#5b616b'; ctx.fillRect(x - cam - 2, y - 8, 4, 18); }
  },

  /* ---------- Nivel 3: la ciudad en ruinas, de noche ---------- */
  fondoCiudad(ctx, cam, t, H) {
    this.cielo(ctx, ['#03040c', '#0b1024', '#1c1a38', '#3a2234', '#6a3424']);
    this.estrellas(ctx, cam, t);
    this.astro(ctx, 760 - cam * 0.01, 90, 26, '#f2ecc8', 'rgba(220, 220, 255, 0.18)');
    // Rascacielos lejanos con ventanas prendidas y el resplandor de los incendios
    const paso = 70, desplaza = cam * 0.2, inicio = Math.floor(desplaza / paso) - 1;
    for (let k = inicio; k < inicio + ANCHO / paso + 3; k++) {
      const x = k * paso - desplaza, h = 80 + azar(k, 801) * 150, w = 50 + azar(k, 802) * 16;
      ctx.fillStyle = '#0e1020'; ctx.fillRect(x, 380 - h, w, h);
      for (let yy = 380 - h + 8; yy < 370; yy += 12) for (let xx = x + 6; xx < x + w - 6; xx += 10) if (azar(k * 97 + yy + xx, 803) < 0.18) { ctx.fillStyle = azar(k + yy, 804) < 0.7 ? 'rgba(255, 210, 120, 0.7)' : 'rgba(150, 190, 255, 0.6)'; ctx.fillRect(xx, yy, 4, 6); }
      if (azar(k, 805) < 0.15) this.fuego(ctx, x + w / 2, 380 - h + 4, t, 0.8);
    }
    const r = ctx.createLinearGradient(0, 250, 0, 390); r.addColorStop(0, 'rgba(255, 110, 40, 0)'); r.addColorStop(1, 'rgba(255, 110, 40, 0.28)');
    ctx.fillStyle = r; ctx.fillRect(0, 250, ANCHO, 140);
    Escenario.dibujarRuinas(ctx, cam, t);
    ctx.fillStyle = 'rgba(8, 10, 34, 0.42)'; ctx.fillRect(0, 0, ANCHO, ALTO);   // de noche
    Escenario.dibujarSuelo(ctx, cam);
    Escenario.dibujarFondoDelMundo(ctx, cam, t);
    ctx.fillStyle = 'rgba(8, 10, 34, 0.3)'; ctx.fillRect(0, SUELO_BASE - FONDO_CALLE - 20, ANCHO, ALTO);
  },

  /* ---------- Nivel 4: tu barrio, al amanecer ---------- */
  fondoBarrio(ctx, cam, t, H) {
    this.cielo(ctx, ['#3b3560', '#7a4a72', '#d07a72', '#f4a27c', '#ffd8a0']);
    this.astro(ctx, 300 - cam * 0.01, 300, 40, 'rgba(255, 240, 184, 0.95)', 'rgba(255, 200, 140, 0.35)');
    this.arboleda(ctx, cam, 0.2, 320, 60, '#5a4a6a', 61, true);
    this.arboleda(ctx, cam, 0.4, 340, 70, '#4a5a4a', 63, true);
    const horizonte = SUELO_BASE - FONDO_CALLE - 14;
    ctx.fillStyle = '#5c7a3a'; ctx.fillRect(0, 330, ANCHO, horizonte - 330);   // jardines
    // Casas fijas en el mundo, una cada 340 px; la última es la del protagonista
    const paso = 340, desde = Math.floor((cam - 300) / paso), hasta = Math.floor((cam + ANCHO + 300) / paso);
    for (let k = desde; k <= hasta; k++) {
      const x = k * paso + 170;
      if (x < H.inicio - 400 || x > H.meta - 260) continue;
      this.casa(ctx, x - cam, horizonte, k, t);
    }
    this.casaFinal(ctx, H.meta - cam, horizonte, t);
    Escenario.dibujarSuelo(ctx, cam);
  },
  casa(ctx, sx, base, k, t) {
    const paredes = ['#c9b08a', '#a8c0d0', '#d8a88a', '#b0c4a0', '#d0c0d8'], techos = ['#6a2a1a', '#3a3a4a', '#5a3a2a', '#2a4a3a'];
    const w = 220 + azar(k, 901) * 40, h = 110 + azar(k, 902) * 30, pared = paredes[Math.floor(azar(k, 903) * paredes.length)], techo = techos[Math.floor(azar(k, 904) * techos.length)];
    const rota = azar(k, 905) < 0.35, fuego = azar(k, 906) < 0.15, x = sx - w / 2;
    ctx.fillStyle = pared; ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, base - 12, w, 12);
    ctx.fillStyle = techo; ctx.beginPath(); ctx.moveTo(x - 16, base - h); ctx.lineTo(sx, base - h - 56); ctx.lineTo(x + w + 16, base - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a3420'; ctx.fillRect(sx + w * 0.12, base - 70, 34, 70);   // puerta
    for (const vx of [x + 24, x + w - 74]) {
      ctx.fillStyle = rota ? '#1a1a22' : '#2a3048'; ctx.fillRect(vx, base - h + 26, 50, 40);
      if (rota) { ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(vx - 4, base - h + 30); ctx.lineTo(vx + 54, base - h + 62); ctx.moveTo(vx - 4, base - h + 60); ctx.lineTo(vx + 54, base - h + 28); ctx.stroke(); }   // tablas clavadas
      else { ctx.fillStyle = '#e9e2d0'; ctx.fillRect(vx + 23, base - h + 26, 4, 40); ctx.fillRect(vx, base - h + 44, 50, 4); }
    }
    // Cerca blanca adelante
    ctx.fillStyle = '#eeeeee';
    for (let fx = x - 20; fx < x + w + 20; fx += 14) { ctx.beginPath(); ctx.moveTo(fx, base); ctx.lineTo(fx, base - 26); ctx.lineTo(fx + 4, base - 32); ctx.lineTo(fx + 8, base - 26); ctx.lineTo(fx + 8, base); ctx.fill(); }
    ctx.fillRect(x - 20, base - 20, w + 40, 4);
    if (fuego) { this.fuego(ctx, sx + w * 0.3, base - h, t, 1.2); this.humo(ctx, sx + w * 0.3, base - h - 20, t, 0.9); }
  },
  // La casa del protagonista: azul, con el porche, la luz del cuarto prendida y la puerta donde termina el viaje
  casaFinal(ctx, sx, base, t) {
    if (sx < -400 || sx > ANCHO + 400) return;
    const w = 320, h = 170, x = sx - w * 0.62;
    ctx.fillStyle = '#7aa0c8'; ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = '#4a3040'; ctx.beginPath(); ctx.moveTo(x - 22, base - h); ctx.lineTo(x + w / 2, base - h - 80); ctx.lineTo(x + w + 22, base - h); ctx.closePath(); ctx.fill();
    // Ventana del cuarto de la hija, con luz y su silueta
    const vx = x + 40, vy = base - h + 30;
    const brillo = ctx.createRadialGradient(vx + 32, vy + 26, 4, vx + 32, vy + 26, 90); brillo.addColorStop(0, 'rgba(255, 220, 120, 0.45)'); brillo.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = brillo; ctx.fillRect(vx - 60, vy - 60, 184, 172);
    ctx.fillStyle = '#f6d36a'; ctx.fillRect(vx, vy, 64, 52); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(vx + 30, vy, 4, 52); ctx.fillRect(vx, vy + 24, 64, 4);
    ctx.fillStyle = 'rgba(60, 30, 40, 0.75)'; ctx.beginPath(); ctx.arc(vx + 16, vy + 30, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(vx + 9, vy + 36, 14, 16);
    // Porche y puerta
    ctx.fillStyle = '#e9e2d0'; ctx.fillRect(sx - 60, base - 96, 120, 8); ctx.fillRect(sx - 56, base - 88, 6, 88); ctx.fillRect(sx + 50, base - 88, 6, 88);
    ctx.fillStyle = '#6a3a22'; ctx.fillRect(sx - 22, base - 80, 44, 80); ctx.fillStyle = '#e0c060'; ctx.beginPath(); ctx.arc(sx + 12, base - 40, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♥ ' + t2Casa(), sx, base - 104 + Math.sin(t * 3) * 3);
    for (let fx = x - 30; fx < sx - 70; fx += 14) { ctx.fillStyle = '#eeeeee'; ctx.fillRect(fx, base - 26, 8, 26); }
  },

  // Cartel verde con el kilómetro al final de los niveles 1 a 3, con bandera a cuadros
  cartelMeta(ctx, cam, H) {
    const sx = H.meta - cam; if (sx < -200 || sx > ANCHO + 200) return;
    const base = SUELO_BASE - FONDO_CALLE + 4;
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(sx - 46, base - 120, 6, 120); ctx.fillRect(sx + 40, base - 120, 6, 120);
    ctx.fillStyle = '#1f6a3a'; ctx.fillRect(sx - 80, base - 170, 160, 58); ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 3; ctx.strokeRect(sx - 75, base - 165, 150, 48);
    ctx.fillStyle = '#f2f2f2'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t('hist.cartel', { km: H.def.kmHasta }) + ' →', sx, base - 133);
    for (let f = 0; f < 4; f++) for (let c = 0; c < 6; c++) { ctx.fillStyle = (f + c) % 2 ? '#111' : '#f2f2f2'; ctx.fillRect(sx + 50 + c * 7, base - 230 + f * 7, 7, 7); }
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(sx + 47, base - 232, 3, 62);
  },
};
function t2Casa() { return t('hist.casa'); }
