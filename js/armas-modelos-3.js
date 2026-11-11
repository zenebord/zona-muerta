/* ===== Rediseño realista de las armas (reemplaza los modelos anteriores) =====
 * Mismo sistema que armas-modelos.js (cm reales, origen en la empuñadura, x hacia la boca, y hacia abajo),
 * pero cada arma con sus rasgos de verdad: estrías, cachas cuadriculadas, cantos redondeados, rieles,
 * miras, tornillos, cajones fresados. Las anclas siguen apuntando a las mismas piezas, así las recargas y
 * los agarres funcionan igual. El agarre y las piezas móviles se heredan del modelo anterior si no se dan.
 */
// Detalles de terminación
function cuadriculado(ctx, pts, paso = 0.55, color = 'rgba(0,0,0,0.4)') {   // cuadrillé de las cachas
  if (Pincel.silueta) return;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = 0.14; ctx.beginPath();
  const h = y1 - y0;
  for (let x = x0 - h; x < x1 + h; x += paso) { ctx.moveTo(x, y0); ctx.lineTo(x + h, y1); ctx.moveTo(x + h, y0); ctx.lineTo(x, y1); }
  ctx.stroke(); ctx.restore();
}
function punteado(ctx, pts, paso = 0.5, color = 'rgba(255,255,255,0.07)') {   // texturado de polímero
  if (Pincel.silueta) return;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  ctx.fillStyle = color;
  for (let y = y0; y < y1; y += paso) for (let x = x0 + ((y / paso) % 2) * paso / 2; x < x1; x += paso) ctx.fillRect(x, y, paso * 0.35, paso * 0.35);
  ctx.restore();
}
function Ec(cx, cy, rx, ry, n = 32) { return Array.from({ length: n }, (_, k) => [cx + Math.cos(k / n * Math.PI * 2) * rx, cy + Math.sin(k / n * Math.PI * 2) * ry]); }   // elipse
const tornillo = (ctx, x, y, r = 0.32) => { punto(ctx, x, y, r, '#4a4c52'); trazo(ctx, 'rgba(0,0,0,0.6)', 0.1, [[x - r * 0.7, y], [x + r * 0.7, y]]); };
// Reemplaza el modelo de un arma conservando agarre, ángulo, culata y piezas móviles del anterior
function reemplazar(id, def) {
  const viejo = DIBUJO_ARMAS[id] || {}, nuevo = modelo(def);
  for (const k of ['agarre', 'anguloEmpunadura', 'culataCm', 'moviles', 'casquilloVaciado']) if (nuevo[k] === undefined && viejo[k] !== undefined) nuevo[k] = viejo[k];
  DIBUJO_ARMAS[id] = nuevo;
}

/* ======================= PISTOLAS ======================= */

// Glock 17 Gen5 (20,2 cm), calcada de una foto del lado izquierdo con el armazón color tierra, espejada para que
// apunte a la derecha: corredera negra con estrías adelante y atrás, frente achaflanado y grabado; armazón con riel,
// guardamonte cuadrado, palanca de desarme, retén de corredera, retén del cargador estriado, empuñadura sin apoyos
// para los dedos con texturado y boca del pozo ensanchada, base del cargador y argolla. GL pasa píxeles de la foto
// a cm (0,0236 por píxel a lo largo y 0,0228 a lo alto) con el origen arriba de la empuñadura.
const GL = (x, y) => [(707 - x) * 0.0236, (y - 161) * 0.0228];
const GLF = pts => pts.map(p => GL(...p));
const GLOCK_TIERRA = '#b0966f', GLOCK_NEGRO = '#2f2d2c';
const GLOCK_FORMAS = {
  armazon: suave(GLF([[26, 143], [880, 140], [885, 150], [884, 163], [872, 178], [868, 250], [872, 300], [900, 400], [925, 500], [937, 550], [935, 600], [925, 613], [692, 613], [687, 550], [656, 450], [612, 350], [587, 330], [560, 346], [356, 347], [345, 340], [341, 215], [335, 207], [40, 205], [28, 198], [24, 170]]), 0.3, 3),
  guardamonte: suave(GLF([[380, 222], [560, 222], [570, 240], [572, 300], [560, 326], [395, 330], [380, 318], [377, 240]]), 0.35, 3),
  textura: suave(GLF([[604, 332], [866, 262], [895, 360], [922, 500], [928, 588], [702, 594], [682, 520], [642, 420]]), 0.4, 2),
  base: suave(GLF([[692, 612], [910, 612], [913, 632], [900, 648], [706, 650], [692, 640]]), 0.2, 2),
  corredera: suave(GLF([[22, 64], [30, 46], [45, 42], [860, 42], [872, 48], [876, 62], [876, 134], [870, 140], [34, 140], [24, 128], [20, 100]]), 0.25, 3),
  gatillo: suave(GLF([[515, 222], [545, 228], [556, 246], [540, 258], [522, 270], [506, 290], [488, 314], [471, 318], [463, 306], [480, 280], [496, 252], [505, 232]]), 0.15, 2),
  reten: GLF([[600, 288], [650, 272], [660, 302], [608, 318]]),
};
reemplazar('glock', { casquillo: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: GL(620, 398), cargador: GL(790, 625), corredera: GL(750, 90), expulsion: GL(560, 50), boca: GL(20, 92) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = GLOCK_FORMAS, T = GLOCK_TIERRA, cs = e.corredera * 3.6;
    // Armazón de polímero color tierra con el hueco del guardamonte
    pintar(ctx, F.armazon, T, { mate: true, brillo: 0.12, huecos: [F.guardamonte] });
    if (!sil) {
      punteado(ctx, F.textura, 0.36, 'rgba(70,46,16,0.22)');
      ctx.fillStyle = 'rgba(70,46,16,0.35)'; ctx.fillRect(...GL(273, 170), 240 * 0.0236, 7 * 0.0228);            // ranura del riel
      ctx.fillRect(...GL(153, 200), 20 * 0.0236, 8 * 0.0228);
      trazo(ctx, 'rgba(255,255,255,0.16)', 0.12, [GL(30, 146), GL(860, 146)]);
      trazo(ctx, 'rgba(70,46,16,0.3)', 0.12, [GL(600, 176), GL(673, 176)]);                                     // repisa del retén
    }
    if (!e.sinCargador) pintar(ctx, F.base, T, { mate: true, brillo: 0.15 });
    if (!sil) { ctx.beginPath(); ctx.arc(...GL(912, 622), 0.26, 0, Math.PI * 2); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.1; ctx.stroke(); }   // argolla
    pintar(ctx, F.gatillo, '#1d1d1f', { brillo: 0.3 });
    pintar(ctx, F.reten, '#1c1c1e', { mate: true }); if (!sil) for (let k = 1; k < 6; k++) trazo(ctx, 'rgba(255,255,255,0.14)', 0.05, [GL(600 + k * 9, 288 - k * 3), GL(608 + k * 9, 318 - k * 3)]);
    pintar(ctx, suave(GLF([[610, 141], [667, 141], [667, 170], [610, 170]]), 0.12, 2), '#55575c', { brillo: 0.3 });   // retén de corredera
    if (!sil) for (let k = 1; k < 5; k++) trazo(ctx, 'rgba(0,0,0,0.5)', 0.04, [GL(610, 141 + k * 6), GL(667, 141 + k * 6)]);
    pintar(ctx, suave(GLF([[443, 155], [463, 155], [463, 197], [443, 197]]), 0.08, 2), '#1c1c1e');            // palanca de desarme
    for (const [x, y] of [[507, 189], [792, 260]]) { punto(ctx, ...GL(x, y), 0.15, '#6b6d72'); punto(ctx, ...GL(x, y), 0.07, '#2a2a2a'); }
    // Cañón: asoma cuando retrocede la corredera
    pintar(ctx, suave(GLF([[30, 60], [560, 60], [560, 124], [30, 124]]), 0.2, 2), MAT.acero, { brillo: 0.35 });
    ctx.save(); ctx.translate(-cs, 0);
    pintar(ctx, F.corredera, GLOCK_NEGRO, { brillo: 0.22 });
    if (!sil) {
      trazo(ctx, 'rgba(255,255,255,0.13)', 0.1, [GL(40, 50), GL(866, 50)]);                                  // bisel de arriba
      for (let x = 85; x < 245; x += 15) trazo(ctx, 'rgba(0,0,0,0.6)', 0.1, [GL(x, 52), GL(x, 134)]);         // estrías delanteras
      for (let x = 685; x < 835; x += 15) trazo(ctx, 'rgba(0,0,0,0.6)', 0.1, [GL(x, 52), GL(x, 134)]);        // estrías traseras
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.05;
      ctx.strokeRect(...GL(347, 78), 47 * 0.0236, 34 * 0.0228);                                                 // logo
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (const [x, w] of [[378, 30], [420, 38], [470, 70], [568, 34]]) ctx.fillRect(...GL(x + w, 88), w * 0.0236, 12 * 0.0228);   // grabado
    }
    pintar(ctx, GLF([[58, 42], [62, 28], [106, 28], [110, 42]]), '#1a1a1a'); punto(ctx, ...GL(84, 33), 0.08, '#f0f0f0');   // guion
    pintar(ctx, GLF([[800, 42], [802, 26], [812, 26], [814, 34], [826, 34], [828, 26], [838, 26], [840, 42]]), '#1a1a1a');   // alza en U
    ctx.restore();
  } });

// Colt 1911 (21,6 cm), calcada de una foto: corredera pavonada con estrías atrás, miras, martillo con espuela,
// cola del seguro de empuñadura, armazón, guardamonte, gatillo largo, retén y cachas de nogal con los dos
// tornillos. C11 pasa píxeles a cm (0,0432 por píxel, origen arriba de la empuñadura).
const C11 = (x, y) => [(x - 120) * 0.0432, (y - 100) * 0.0432];
const C11F = pts => pts.map(p => C11(...p));
const C11_FORMAS = {
  corredera: suave(C11F([[80, 22], [95, 18], [505, 18], [513, 25], [513, 97], [410, 98], [330, 95], [120, 87], [80, 82]]), 0.3, 3),
  armazon: suave(C11F([[13, 104], [40, 97], [60, 84], [410, 98], [410, 110], [300, 112], [295, 160], [280, 174], [222, 174], [208, 160], [205, 112], [174, 108], [137, 321], [10, 318], [53, 112]]), 0.4, 3),
  guardamonte: suave(C11F([[218, 113], [287, 113], [289, 160], [278, 168], [226, 168], [218, 155]]), 0.5, 3),
  cacha: suave(C11F([[100, 86], [180, 89], [170, 140], [137, 318], [18, 316], [64, 150]]), 0.8, 4),
};
reemplazar('colt1911', { casquillo: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: C11(130, 250), cargador: C11(75, 322), corredera: C11(145, 50), expulsion: C11(300, 40), boca: C11(513, 50) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = C11_FORMAS, P = C11, AZUL = '#2b2f3a', cs = e.corredera * 3;
    pintar(ctx, F.armazon, AZUL, { brillo: 0.35, huecos: [F.guardamonte] });
    pintar(ctx, F.cacha, MAT.nogal, { lustre: true });
    cuadriculado(ctx, F.cacha, 0.28, 'rgba(15,6,2,0.35)');
    for (const [x, y] of [[137, 108], [71, 282]]) { pintar(ctx, Cc(...P(x, y), 0.32, 12), '#8f949b'); if (!sil) trazo(ctx, '#3a3c42', 0.06, [[P(x, y)[0] - 0.2, P(x, y)[1]], [P(x, y)[0] + 0.2, P(x, y)[1]]]); }
    pintar(ctx, suave(C11F([[224, 124], [236, 124], [236, 158], [226, 158]]), 0.1, 2), MAT.acero);              // gatillo
    pintar(ctx, suave(C11F([[50, 12], [70, 13], [76, 40], [82, 80], [62, 82], [58, 42]]), 0.2, 2), AZUL);        // martillo
    pintar(ctx, C11F([[300, 40], [510, 40], [510, 90], [300, 90]]), '#3a3e48', { brillo: 0.3 });               // cañón
    ctx.save(); ctx.translate(-cs, 0);
    pintar(ctx, F.corredera, AZUL, { brillo: 0.45 });
    if (!sil) {
      for (let x = 112; x < 180; x += 6) trazo(ctx, 'rgba(0,0,0,0.6)', 0.07, [P(x, 22), P(x, 64)]);           // estrías
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(...P(390, 64), 120 * 0.0432, 30 * 0.0432);               // rebaje de abajo
      trazo(ctx, 'rgba(255,255,255,0.2)', 0.07, [P(100, 24), P(505, 24)]);
    }
    pintar(ctx, C11F([[100, 18], [102, 10], [116, 10], [118, 18]]), AZUL);                                     // alza
    pintar(ctx, C11F([[486, 18], [488, 12], [498, 12], [500, 18]]), AZUL);                                     // guion
    ctx.restore();
  } });

// Beretta 92FS (21,7 cm), calcada de una foto: corredera abierta arriba con el cañón a la vista, grabado,
// estrías atrás, palanca del seguro con el punto rojo, martillo, armazón con el guardamonte redondo, gatillo,
// palanca de desarme, retén, cachas negras cuadriculadas con el medallón y la base del cargador. La foto
// muestra el lado izquierdo: B92 la espeja (0,0437 cm por píxel, origen arriba de la empuñadura).
const B92 = (x, y) => [(420 - x) * 0.0437, (y - 105) * 0.0437];
const B92F = pts => pts.map(p => B92(...p));
const B92_FORMAS = {
  corredera: suave(B92F([[8, 22], [30, 18], [72, 20], [72, 48], [290, 48], [292, 22], [463, 22], [470, 35], [470, 92], [300, 98], [30, 100], [10, 90]]), 0.3, 3),
  canon: B92F([[70, 22], [295, 22], [295, 50], [70, 50]]),
  armazon: suave(B92F([[32, 100], [474, 96], [505, 100], [498, 130], [500, 200], [505, 295], [500, 324], [379, 324], [347, 187], [337, 187], [224, 187], [224, 116], [32, 116]]), 0.4, 3),
  guardamonte: suave(B92F([[237, 121], [337, 121], [337, 179], [250, 179], [237, 160]]), 1.2, 4),
  cacha: suave(B92F([[360, 118], [468, 113], [478, 200], [490, 303], [389, 303]]), 0.8, 4),
  base: suave(B92F([[379, 303], [471, 303], [473, 324], [380, 326]]), 0.3, 2),
};
reemplazar('beretta92', { casquillo: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: B92(370, 250), cargador: B92(425, 320), corredera: B92(340, 70), expulsion: B92(200, 30), boca: B92(8, 38) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = B92_FORMAS, P = B92, NEGRO = '#232427', cs = e.corredera * 3;
    if (!e.sinCargador) pintar(ctx, F.base, NEGRO, { brillo: 0.3 });
    pintar(ctx, F.armazon, NEGRO, { brillo: 0.3, huecos: [F.guardamonte] });
    pintar(ctx, F.cacha, '#18181a', { mate: true });
    cuadriculado(ctx, F.cacha, 0.22, 'rgba(255,255,255,0.1)');
    pintar(ctx, Cc(...P(416, 195), 0.75, 18), '#2c2d30', { brillo: 0.3 });                                     // medallón
    punto(ctx, ...P(437, 274), 0.18, '#5a5d63');
    pintar(ctx, suave(B92F([[272, 126], [296, 130], [292, 168], [278, 166]]), 0.15, 2), NEGRO);                 // gatillo
    pintar(ctx, Cc(...P(363, 179), 0.4, 12), '#3a3c40');                                                      // retén
    pintar(ctx, suave(B92F([[232, 89], [263, 89], [263, 105], [232, 105]]), 0.15, 2), '#3a3c40');               // palanca de desarme
    pintar(ctx, suave(B92F([[458, 26], [479, 28], [479, 44], [460, 42]]), 0.2, 2), NEGRO);                      // martillo
    pintar(ctx, B92F([[60, 48], [300, 48], [300, 92], [60, 92]]), '#3a3d43', { brillo: 0.3 });                  // cañón bajo la corredera
    ctx.save(); ctx.translate(-cs, 0);
    pintar(ctx, F.canon, '#3e4148', { brillo: 0.5 });
    pintar(ctx, F.corredera, NEGRO, { brillo: 0.4 });
    if (!sil) {
      for (let x = 306; x < 380; x += 5) trazo(ctx, 'rgba(0,0,0,0.6)', 0.06, [P(x, 58), P(x, 82)]);            // estrías
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(...P(250, 66), 175 * 0.0437, 5 * 0.0437);          // grabado
      trazo(ctx, 'rgba(255,255,255,0.18)', 0.07, [P(300, 26), P(460, 26)]);
    }
    pintar(ctx, suave(B92F([[405, 37], [437, 40], [437, 79], [405, 74]]), 0.3, 2), NEGRO);                      // palanca del seguro
    punto(ctx, ...P(415, 73), 0.16, '#d0302a');
    pintar(ctx, B92F([[32, 18], [34, 10], [42, 10], [44, 18]]), NEGRO);                                       // guion
    pintar(ctx, B92F([[363, 22], [365, 14], [379, 14], [381, 22]]), NEGRO);                                    // alza
    ctx.restore();
  } });

// Walther PPK (15,5 cm), calcada de una foto: inoxidable, corredera con estrías atrás, ventana, grabado y miras,
// martillo de anillo, cola del armazón, guardamonte redondo grande, gatillo, cachas negras cuadriculadas que
// envuelven la empuñadura y base del cargador con apoyo. WP pasa píxeles a cm (0,0278 por píxel).
const WP = (x, y) => [(x - 240) * 0.0278, (y - 112) * 0.0278];
const WPF = pts => pts.map(p => WP(...p));
const WP_FORMAS = {
  corredera: suave(WPF([[100, 25], [120, 20], [550, 22], [560, 30], [568, 45], [566, 100], [560, 106], [240, 108], [130, 110], [104, 100]]), 0.3, 3),
  armazon: suave(WPF([[10, 128], [60, 116], [100, 108], [560, 106], [562, 136], [520, 142], [430, 150], [425, 200], [400, 222], [300, 224], [262, 210], [244, 150], [228, 200], [205, 392], [36, 394], [42, 300], [62, 170], [40, 145]]), 0.4, 3),
  guardamonte: suave(WPF([[285, 128], [400, 128], [408, 170], [398, 208], [300, 210], [282, 180]]), 0.6, 3),
  cacha: suave(WPF([[100, 120], [230, 120], [225, 200], [205, 388], [46, 388], [68, 260], [86, 165]]), 0.7, 4),
  base: suave(WPF([[85, 392], [182, 392], [192, 420], [172, 436], [90, 432]]), 0.4, 3),
};
reemplazar('ppk', { casquillo: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: WP(215, 260), cargador: WP(140, 410), corredera: WP(175, 65), expulsion: WP(320, 50), boca: WP(568, 60) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = WP_FORMAS, P = WP, INOX = '#aeb2b8', cs = e.corredera * 2.4;
    if (!e.sinCargador) pintar(ctx, F.base, '#1d1d1f', { brillo: 0.25 });
    pintar(ctx, F.armazon, INOX, { brillo: 0.45, huecos: [F.guardamonte] });
    pintar(ctx, F.cacha, '#1c1c1e', { mate: true });
    cuadriculado(ctx, F.cacha, 0.26, 'rgba(255,255,255,0.2)');
    pintar(ctx, suave(WPF([[330, 150], [342, 148], [348, 190], [335, 205], [328, 180]]), 0.15, 2), '#8f949b');   // gatillo
    pintar(ctx, Cc(...P(85, 55), 0.35, 14), INOX, { huecos: [Cc(...P(85, 55), 0.16, 10)] });                   // martillo de anillo
    pintar(ctx, RRc(...P(18, 120), 1.0, 0.3, 0.1), '#8f949b');
    // Cañón: asoma al retroceder la corredera
    pintar(ctx, WPF([[250, 45], [560, 45], [560, 90], [250, 90]]), '#7d8188', { brillo: 0.3 });
    ctx.save(); ctx.translate(-cs, 0);
    pintar(ctx, F.corredera, INOX, { brillo: 0.5 });
    if (!sil) {
      for (let x = 125; x < 236; x += 7) trazo(ctx, 'rgba(40,44,50,0.45)', 0.05, [P(x, 50), P(x, 106)]);   // estrías
      ctx.fillStyle = '#2a2c30'; ctx.beginPath(); ctx.ellipse(...P(322, 50), 1.45, 0.3, 0, 0, Math.PI * 2); ctx.fill();   // ventana
      ctx.fillStyle = 'rgba(40,44,50,0.35)'; for (const [x, y, w] of [[430, 72, 70], [420, 88, 90], [425, 98, 85], [330, 66, 40]]) ctx.fillRect(...P(x, y), w * 0.0278, 2 * 0.0278 * 2);   // grabado
      trazo(ctx, 'rgba(255,255,255,0.35)', 0.06, [P(125, 28), P(548, 28)]);
    }
    pintar(ctx, WPF([[535, 22], [537, 14], [548, 14], [549, 22]]), '#7d8188');                                 // guion
    ctx.restore();
  } });

// Desert Eagle Mark XIX (27 cm): cañón fijo de perfil triangular con la arista que brilla, panel rebajado con
// el grabado y riel arriba; corredera corta atrás con estrías inclinadas, ventana con el cerrojo rotativo,
// seguro ambidiestro y alza; martillo con espuela estriada, guardamonte cuadrado con gancho, cachas envolventes
reemplazar('deagle', { casquillo: 'grande', origen: PISTOLA,
  anclas: { manoDelantera: [0.8, 5.4], cargador: [-5.0, 9.8], corredera: [-3.6, -2.6], expulsion: [6, -4.5], boca: [22.6, -2.6] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, N = MAT.niquel, cs = e.corredera * 4.2;
    const grip = suave([[-4.4, 0.0], [-5.8, 0.8], [-7.6, 9.0], [-7.4, 9.8], [-1.8, 9.8], [-1.4, 9.0], [-0.8, 7.2], [0.2, 5.0], [1.2, 3.6], [1.6, 1.4]], 0.6, 3);
    pintar(ctx, grip, MAT.polimero, { mate: true });
    if (!sil) { ctx.save(); ctx.beginPath(); grip.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.clip(); for (let k = 0; k < 14; k++) trazo(ctx, 'rgba(255,255,255,0.07)', 0.2, [[-5.4 + k * 0.5, 1.4], [-7.2 + k * 0.5, 9.6]]); ctx.restore(); }
    pintar(ctx, suave([[-4.6, -0.6], [11.6, -0.6], [11.6, 1.0], [8.4, 1.2], [7.6, 1.4], [-4.6, 1.4], [-5.8, 0.6], [-5.8, -0.2]], 0.4, 3), N, { brillo: 0.5 });   // armazón
    pintar(ctx, suave([[1.4, 1.2], [7.8, 1.2], [8.4, 2.4], [8.0, 4.4], [6.8, 4.6], [2.6, 4.6], [1.6, 3.4]], 0.6, 3), N, { huecos: [suave([[2.2, 1.2], [7.2, 1.2], [7.5, 2.4], [7.2, 3.8], [2.8, 3.8], [2.3, 3.0]], 0.6, 3)] });
    pintar(ctx, [[8.3, 2.0], [9.2, 2.6], [8.3, 3.0]], N);                                                   // gancho del guardamonte
    pintar(ctx, [[3.2, 1.2], [4.2, 1.2], [4.4, 2.6], [3.8, 3.2], [3.2, 2.5]], MAT.acero);
    pintar(ctx, Cc(10.6, 0.3, 0.45, 10), MAT.acero);                                                        // botón de desarme
    if (!e.sinCargador) pintar(ctx, suave(Rc(-7.8, 9.6, 6.6, 0.8), 0.3, 2), N);
    pintar(ctx, suave([[-5.0, -0.8], [-6.4, -1.8], [-7.0, -3.0], [-6.4, -3.8], [-5.4, -3.4], [-4.6, -1.4]], 0.4, 2), N);   // martillo
    for (let k = 0; k < 4; k++) trazo(ctx, 'rgba(0,0,0,0.45)', 0.1, [[-6.8 + k * 0.35, -3.2 + k * 0.1], [-6.1 + k * 0.35, -3.6 + k * 0.1]]);
    // Cañón fijo
    pintar(ctx, suave([[11.0, -5.0], [22.2, -5.0], [22.6, -4.4], [22.6, -1.0], [22.0, -0.4], [11.0, -0.4]], 0.35, 3), N, { brillo: 0.55 });
    pintar(ctx, suave(Rc(12.6, -3.3, 8.8, 2.2), 0.4, 2), '#7d838c', { brillo: 0.15 });                       // panel rebajado
    trazo(ctx, 'rgba(255,255,255,0.4)', 0.18, [[11.4, -3.75], [22.2, -3.75]]);                              // arista del perfil triangular
    if (!sil) for (let k = 0; k < 9; k++) { ctx.fillStyle = 'rgba(30,32,36,0.35)'; ctx.fillRect(13.4 + k * 0.8, -2.4, 0.55, 0.3); }   // grabado
    pintar(ctx, Rc(11.4, -5.8, 10.6, 0.8), N); rayas(ctx, 12.2, 21.4, -5.8, -5.1, 1.0, 'rgba(0,0,0,0.45)', 0.25);   // riel
    pintar(ctx, [[21.2, -5.8], [21.4, -6.7], [22.0, -6.7], [22.2, -5.8]], N);                               // guion
    // Corredera corta
    ctx.save(); ctx.translate(-cs, 0);
    pintar(ctx, suave([[-5.0, -0.6], [-5.0, -3.9], [-4.3, -5.0], [11.0, -5.0], [11.0, -0.6]], 0.35, 3), N, { brillo: 0.5 });
    for (let k = 0; k < 7; k++) trazo(ctx, 'rgba(0,0,0,0.4)', 0.2, [[-4.4 + k * 0.42, -4.4], [-4.1 + k * 0.42, -1.0]]);
    trazo(ctx, 'rgba(255,255,255,0.3)', 0.18, [[-4.0, -3.75], [10.8, -3.75]]);
    if (!sil) { ctx.fillStyle = '#0c0c0e'; ctx.fillRect(4.0, -5.0, 4.6, 1.2); ctx.fillStyle = '#6b7078'; ctx.fillRect(4.2, -4.9, 2.6, 0.8); }   // ventana y cerrojo
    pintar(ctx, Cc(-2.6, -2.9, 0.75, 12), N); pintar(ctx, suave([[-2.4, -3.5], [-4.2, -3.9], [-4.3, -3.3], [-2.4, -2.4]], 0.2, 2), N);   // seguro
    pintar(ctx, [[-4.4, -5.0], [-2.4, -5.0], [-2.4, -5.8], [-3.0, -5.8], [-3.1, -5.4], [-3.7, -5.4], [-3.8, -5.8], [-4.4, -5.8]], N);   // alza
    ctx.restore();
  } });

// Revólver (S&W 29 y Colt Python): armazón, tambor estriado que se vuelca, puente arriba con el alza,
// martillo con espuela, varilla extractora bajo el cañón y cachas de madera
function revolver(ctx, e, op) {
  const { largo, funda, costilla, acabado, madera } = op;
  pintar(ctx, suave([[-2.8, -0.9], [-1.2, 0.4], [-0.4, 1.6], [-1.0, 7.4], [-1.8, 9.2], [-5.4, 9.6], [-6.0, 8.0], [-5.2, 3.4], [-5.0, 1.0], [-4.0, -0.4]], 0.9, 5), madera);   // cacha
  cuadriculado(ctx, [[-1.6, 2.4], [-1.6, 7.2], [-5.0, 7.6], [-4.6, 2.4]], 0.5, 'rgba(15,6,2,0.45)');
  pintar(ctx, Cc(-3.2, 4.2, 0.55, 12), '#b8a26a');                                                        // medallón
  pintar(ctx, suave([[-2.8, -1.0], [1.4, -1.0], [1.4, -5.0], [6.4, -5.0], [6.4, 0.6], [5.2, 0.8], [1.2, 0.8], [-0.6, 1.6], [-2.6, 0.2]], 0.4, 3), acabado, { brillo: 0.4 });   // armazón
  tornillo(ctx, -0.2, -0.4); tornillo(ctx, 4.8, 0.3, 0.26);
  pintar(ctx, suave([[0.6, 0.6], [5.0, 0.6], [5.2, 2.0], [4.2, 3.0], [1.4, 3.0], [0.6, 2.0]], 0.9, 4), acabado, { huecos: [suave([[1.2, 0.6], [4.4, 0.6], [4.5, 1.8], [3.8, 2.4], [1.6, 2.4], [1.2, 1.7]], 0.7, 4)] });
  pintar(ctx, [[2.0, 0.6], [2.9, 0.6], [3.0, 1.8], [2.4, 2.2], [2.0, 1.6]], MAT.acero);
  pintar(ctx, suave([[-3.6, -2.0], [-2.4, -3.8], [-1.2, -4.4], [-0.4, -3.6], [-0.4, -1.0], [-2.4, -1.0]], 0.4, 2), acabado);   // martillo
  rayas(ctx, -2.6, -1.6, -4.0, -3.4, 0.3, 'rgba(0,0,0,0.5)', 0.14);
  pintar(ctx, Rc(0, -5.6, 1.4, 0.7), acabado);                                                            // alza
  pintar(ctx, Cc(0.6, -2.0, 0.5, 10), acabado);                                                          // retén del tambor
  // Cañón con costilla (ventilada en el Python), funda de la varilla o «underlug» completo
  pintar(ctx, suave([[6.4, -4.4], [largo, -4.4], [largo, -2.2], [6.4, -2.2]], 0.3, 2), acabado, { brillo: 0.45 });
  pintar(ctx, Rc(6.4, -5.2, largo - 6.8, 0.9), acabado);
  if (costilla && !Pincel.silueta) for (let x = 8; x < largo - 1.4; x += 1.2) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(x, -5.1, 0.6, 0.5); }
  pintar(ctx, suave(funda === 'completa' ? [[6.4, -2.2], [largo, -2.2], [largo, 0.2], [largo - 1, 0.6], [6.4, 0.6]] : [[6.4, -2.2], [12.4, -2.2], [12.4, -0.6], [11.8, 0.2], [6.4, 0.2]], 0.5, 3), acabado, { brillo: 0.35 });
  pintar(ctx, [[largo - 1.4, -5.2], [largo - 0.6, -6.6], [largo - 0.2, -6.6], [largo - 0.2, -5.2]], acabado);   // guion
  punto(ctx, largo - 0.4, -6.2, 0.18, '#d33');
  // Tambor de seis con estrías; se vuelca hacia afuera para recargar
  ctx.save(); ctx.translate(-e.abierto * 1.5, e.abierto * 4.2);
  pintar(ctx, suave([[1.6, -4.6], [6.2, -4.6], [6.4, -4.0], [6.4, -0.4], [6.2, 0.2], [1.6, 0.2], [1.4, -0.4], [1.4, -4.0]], 0.6, 3), acabado, { brillo: 0.5 });
  if (!Pincel.silueta) for (const y of [-3.4, -2.2, -1.0]) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(3.9, y, 1.8, 0.28, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
reemplazar('magnum', { casquillo: null, casquilloVaciado: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: [-0.2, 5.0], cargador: [3.8, -2.4], corredera: [3.8, -2.4], expulsion: [3.8, -2.4], boca: [23.8, -3.3] },
  dibujarCm(ctx, e) { revolver(ctx, e, { largo: 23.8, funda: 'media', costilla: false, acabado: '#b9bdc6', madera: '#7a3f22' }); } });
reemplazar('python', { casquillo: null, casquilloVaciado: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: [-0.2, 5.0], cargador: [3.8, -2.4], corredera: [3.8, -2.4], expulsion: [3.8, -2.4], boca: [22.8, -3.3] },
  dibujarCm(ctx, e) { revolver(ctx, e, { largo: 22.8, funda: 'completa', costilla: true, acabado: '#232a36', madera: '#5a2e18' }); } });

// Mauser C96 «M712» (29,5 cm), calcada de una foto: cañón largo pavonado con su extensión y guion, cajón con el
// panel rebajado, alza tangencial, cerrojo con orejas, martillo de anillo, pozo del cargador delante del gatillo
// con el cargador desmontable de 20, guardamonte redondo, empuñadura «mango de escoba» de madera con estrías y
// argolla. La foto muestra el lado izquierdo: MZ la espeja y pasa píxeles a cm (0,048 por píxel, origen arriba
// de la empuñadura).
const MZ = (x, y) => [(520 - x) * 0.048, (y - 97) * 0.048];
const MZF = pts => pts.map(p => MZ(...p));
const MZ_FORMAS = {
  canon: suave(MZF([[12, 42], [300, 34], [300, 74], [12, 70]]), 0.4, 2),
  extension: suave(MZF([[300, 28], [345, 26], [345, 84], [300, 80]]), 0.3, 2),
  cajon: suave(MZF([[340, 28], [430, 22], [440, 8], [470, 8], [478, 20], [560, 16], [600, 22], [604, 40], [600, 96], [340, 96]]), 0.4, 3),
  pozo: suave(MZF([[340, 90], [446, 90], [446, 212], [340, 216]]), 0.3, 2),
  cargador: suave(MZF([[346, 212], [444, 212], [444, 342], [436, 356], [352, 356], [346, 346]]), 0.4, 3),
  armazon: suave(MZF([[444, 94], [600, 94], [602, 140], [560, 158], [522, 168], [512, 208], [446, 212]]), 0.4, 3),
  empunadura: suave(MZF([[520, 160], [560, 150], [602, 142], [616, 180], [626, 250], [620, 300], [606, 326], [580, 331], [552, 325], [536, 300], [530, 240], [518, 192]]), 0.9, 4),
};
reemplazar('mauser', { casquillo: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: MZ(545, 230), cargador: MZ(395, 330), corredera: MZ(585, 25), expulsion: MZ(500, 20), boca: MZ(10, 55) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = MZ_FORMAS, P = MZ, GRIS = '#5c5852', OSCURO = '#2e2f33';
    pintar(ctx, F.canon, OSCURO, { brillo: 0.45 });
    pintar(ctx, MZF([[22, 42], [24, 22], [48, 22], [50, 40]]), OSCURO);                                            // guion
    pintar(ctx, F.extension, OSCURO, { brillo: 0.35 });
    if (!e.sinCargador) {
      pintar(ctx, F.cargador, '#4c4a47', { brillo: 0.25 });
      if (!sil) trazo(ctx, 'rgba(0,0,0,0.45)', 0.12, [P(400, 214), P(400, 352)]);
    }
    pintar(ctx, F.pozo, GRIS, { brillo: 0.3 });
    if (!sil) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.06; ctx.strokeRect(...P(436, 100), 86 * 0.048, 100 * 0.048); }
    pintar(ctx, F.armazon, GRIS, { brillo: 0.3, huecos: [Ec(...P(478, 173), 1.15, 1.15, 20)] });
    if (!sil) trazo(ctx, MAT.acero, 0.16, [P(470, 158), P(474, 180)]);                                              // gatillo
    pintar(ctx, F.empunadura, MAT.madera, { lustre: true });
    if (!sil) for (let y = 180; y < 320; y += 10) trazo(ctx, 'rgba(30,12,4,0.35)', 0.08, [P(540, y), P(616, y - 6)]);   // estrías
    if (!sil) { ctx.beginPath(); ctx.arc(...P(606, 336), 0.42, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.14; ctx.stroke(); }
    pintar(ctx, F.cajon, GRIS, { brillo: 0.35 });
    pintar(ctx, MZF([[362, 40], [556, 36], [556, 80], [362, 82]]), '#504c47', { brillo: 0.15 });                  // panel rebajado
    if (!sil) { rayas(ctx, P(470, 0)[0], P(440, 0)[0], P(0, 10)[1], P(0, 22)[1], 0.25, 'rgba(255,255,255,0.15)', 0.05); }   // alza graduada
    pintar(ctx, Cc(...P(606, 98), 0.55, 14), OSCURO, { huecos: [Cc(...P(606, 98), 0.22, 10)] });                   // martillo de anillo
    // Cerrojo con las orejas: va atrás al disparar y al montar
    ctx.save(); ctx.translate(-Math.max(e.corredera, e.abierto) * 3.4, 0);
    pintar(ctx, suave(MZF([[560, 13], [600, 13], [604, 40], [560, 40]]), 0.2, 2), OSCURO, { brillo: 0.3 });
    if (!sil) for (let x = 566; x < 600; x += 6) trazo(ctx, 'rgba(255,255,255,0.15)', 0.05, [P(x, 15), P(x, 38)]);
    ctx.restore();
  } });

/* ======================= METRALLETAS Y FUSILES DE ASALTO ======================= */

// Uzi (47 cm con la culata plegada), calcada de una foto: cañón y tuerca, guardamanos de polímero estriado, cajón
// con las ranuras, alza y guion con orejas, perilla de carga arriba, empuñadura en el pozo del cargador con
// cachas, guardamonte de alambre, cargador y la culata de metal plegada debajo con la cantonera atrás.
// La foto muestra el lado izquierdo: UZ la espeja (0,0756 cm por píxel, origen arriba de la empuñadura).
const UZ = (x, y) => [(410 - x) * 0.0756, (y - 117) * 0.0756];
const UZF = pts => pts.map(p => UZ(...p));
const UZ_FORMAS = {
  canon: suave(UZF([[11, 72], [94, 72], [94, 92], [11, 92]]), 0.5, 2),
  tuerca: suave(UZF([[94, 61], [133, 61], [133, 111], [94, 111]]), 0.8, 3),
  guardamanos: suave(UZF([[133, 42], [300, 42], [302, 117], [140, 117], [133, 100]]), 0.8, 3),
  cajon: suave(UZF([[133, 39], [600, 39], [604, 50], [604, 100], [470, 104], [461, 117], [306, 117], [300, 104], [133, 104]]), 0.5, 3),
  pozo: suave(UZF([[375, 115], [444, 115], [444, 244], [378, 244]]), 0.5, 3),
  cargador: suave(UZF([[380, 240], [422, 240], [422, 306], [380, 306]]), 0.3, 2),
  brazo: suave(UZF([[466, 114], [612, 104], [626, 112], [612, 124], [520, 132], [470, 128]]), 0.5, 3),
  cantonera: suave(UZF([[598, 100], [633, 100], [633, 230], [620, 240], [600, 236], [590, 160]]), 1.0, 4),
};
reemplazar('uzi', { casquillo: 'pistola',
  anclas: { manoDelantera: UZ(220, 112), cargador: UZ(400, 296), corredera: UZ(261, 22), expulsion: UZ(330, 60), boca: UZ(11, 82) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = UZ_FORMAS, P = UZ, NEGRO = '#26272a';
    pintar(ctx, F.canon, MAT.pavonado, { brillo: 0.4 });
    if (!e.sinCargador) pintar(ctx, F.cargador, MAT.pavonado, { brillo: 0.3 });
    pintar(ctx, F.brazo, NEGRO, { brillo: 0.3 });
    if (!sil) trazo(ctx, NEGRO, 0.9, [P(520, 128), P(575, 160), P(596, 226)]);                                   // brazo curvo de la culata
    pintar(ctx, F.cantonera, NEGRO, { brillo: 0.3 });
    pintar(ctx, F.pozo, NEGRO, { brillo: 0.25 });
    pintar(ctx, suave(UZF([[385, 132], [438, 132], [436, 226], [388, 226]]), 0.5, 3), '#1a1a1c', { mate: true });   // cachas
    cuadriculado(ctx, UZF([[388, 136], [434, 136], [432, 222], [390, 222]]), 0.3, 'rgba(255,255,255,0.08)');
    if (!sil) trazo(ctx, '#2a2b2e', 0.25, [P(303, 119), P(311, 161), P(356, 164), P(378, 122)]);              // guardamonte de alambre
    pintar(ctx, F.cajon, '#2f3033', { brillo: 0.35 });
    if (!sil) for (const [x0, x1, y] of [[311, 456, 64], [311, 456, 72], [311, 456, 80], [478, 544, 60], [478, 544, 70], [478, 544, 78]]) { trazo(ctx, '#0d0d0f', 0.22, [P(x0, y), P(x1, y)]); trazo(ctx, 'rgba(255,255,255,0.12)', 0.1, [P(x0, y + 2), P(x1, y + 2)]); }
    pintar(ctx, F.tuerca, NEGRO, { brillo: 0.3 });
    pintar(ctx, F.guardamanos, '#1c1d1f', { mate: true });
    if (!sil) for (let y = 52; y < 112; y += 6) trazo(ctx, 'rgba(255,255,255,0.07)', 0.18, [P(140, y), P(296, y)]);
    pintar(ctx, Cc(...P(160, 28), 1.1, 14), NEGRO, { huecos: [Cc(...P(160, 28), 0.5, 10)] });                  // guion con orejas
    pintar(ctx, Cc(...P(560, 26), 1.3, 14), NEGRO, { huecos: [Cc(...P(560, 26), 0.6, 10)] });                  // alza
    const dx = -e.corredera * 5;
    pintar(ctx, Cc(P(261, 24)[0] + dx, P(261, 24)[1], 0.9, 12), '#3a3c40', { brillo: 0.35 });                  // perilla de carga
  } });
Object.assign(DIBUJO_ARMAS.uzi, { agarre: 'hombro', culataCm: 17, anguloEmpunadura: 0.12 });   // con la culata plegada, la cantonera atrás va al hombro

// Detalles que el acabado general no puede inventar: remaches, rebajes, sombras donde una pieza entra en otra
function remache(ctx, x, y, r = 0.28) {
  if (Pincel.silueta || pxPorCm(ctx) < DETALLE_PX_CM) return;   // de lejos no se ve
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, '#9aa0a8'); g.addColorStop(0.5, '#3c3f45'); g.addColorStop(1, '#0d0d0f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function rebaje(ctx, pts, fondo = 0.6) {   // hueco con fondo oscuro y labio iluminado abajo
  if (Pincel.silueta) return;
  let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
  for (const [x, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#020203'); g.addColorStop(1, `rgba(40,42,48,${fondo})`);
  ctx.fillStyle = g; ctx.fill(trazadoPieza(pts));
  trazo(ctx, 'rgba(255,255,255,0.12)', 0.08, [[x0 + 0.1, y1], [x1 - 0.1, y1]]);
}
function sombraContacto(ctx, pts, y0, y1, alfa = 0.55) {   // de oscuro (y0) a nada (y1), dentro de la pieza
  if (Pincel.silueta || pxPorCm(ctx) < DETALLE_PX_CM) return;
  ctx.save(); ctx.clip(trazadoPieza(pts));
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(0,0,0,${alfa})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-100, Math.min(y0, y1), 200, Math.abs(y1 - y0));
  ctx.restore();
}

// AK-47 (88 cm), calcado de una foto de perfil de un AKM: culata de madera laminada de 23 cm con cantonera de
// chapa, pistolete de baquelita ciruela con estrías, cajón estampado con remaches y el rebaje sobre el cargador,
// tapa con la cola redondeada, palanca selectora larga, bloque del alza alto atrás, guardamanos laminados,
// tubo de gases, bloque de gases inclinado, varilla de limpieza con su abrazadera, guion con orejas y
// cargador de acero de 30 con nervaduras. Medidas en cm desde la parte de arriba del pistolete.
reemplazar('ak47', { casquillo: 'bala', culataCm: 27.6, anguloEmpunadura: 0.25,
  anclas: { manoDelantera: [30, -0.4], cargador: [13.1, -0.4], corredera: [18, -4.8], expulsion: [13.7, -5.4], boca: [60.8, -3.6] },
  dibujarCm(ctx, e) {
    const PAVON = '#24232c', TAPA = '#211f2a', ACERO = '#2c2b34', MADERA = '#a8441f', MADERA_GM = '#a33c14', BAQUELITA = '#4a3a48';
    // Culata laminada: lomo casi recto que sube hacia el cajón, panza recta hasta la garganta
    const culata = suave([[-4.5, -3.9], [-26.4, -2.7], [-26.9, -2.2], [-26.9, 6.6], [-26.3, 6.9], [-12, 3.6], [-6.4, 1.9], [-4.5, 1.4]], 0.7, 4);
    pintar(ctx, culata, MADERA, { lustre: true });
    if (!Pincel.silueta && pxPorCm(ctx) >= DETALLE_PX_CM) {   // sombra del cajón sobre la madera
      ctx.save(); ctx.clip(trazadoPieza(culata)); const g = ctx.createLinearGradient(-4.5, 0, -8.5, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-8.5, -5, 4, 8); ctx.restore();
    }
    pintar(ctx, suave([[-27.6, -2.9], [-26.8, -2.9], [-26.8, 7.1], [-27.6, 6.9]], 0.3, 2), ACERO);   // cantonera de chapa
    remache(ctx, -27.2, -1.6, 0.2); remache(ctx, -27.2, 5.8, 0.2);
    // Pistolete de baquelita con estrías verticales
    const pistolete = suave([[-2.6, 0], [2.6, 0], [2.2, 2.0], [-0.1, 9.8], [-0.7, 10.6], [-4.0, 10.0], [-4.4, 9.2], [-2.4, 2.2]], 0.7, 4);
    pintar(ctx, pistolete, BAQUELITA, { mate: true });
    if (!Pincel.silueta) for (let k = 0; k < 4; k++) { const t = 0.2 + k * 0.2; trazo(ctx, 'rgba(0,0,0,0.35)', 0.14, [[-2.2 + t * 4.4, 1.2], [-3.8 + t * 3.4, 9.6]]); }
    sombraContacto(ctx, pistolete, 0, 1.4, 0.6);
    // Guardamonte estampado y cola del disparador
    if (!Pincel.silueta) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0d0d10'; ctx.lineWidth = 0.85; ctx.beginPath(); ctx.moveTo(2.6, 0); ctx.lineTo(2.9, 2.6); ctx.quadraticCurveTo(3.2, 3.5, 4.4, 3.5); ctx.lineTo(9.2, 3.2); ctx.quadraticCurveTo(10.1, 3.1, 10.1, 2.2); ctx.lineTo(10.0, -0.2); ctx.stroke();
      ctx.strokeStyle = '#3d3c47'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(3.0, 2.4); ctx.quadraticCurveTo(3.3, 3.2, 4.4, 3.2); ctx.lineTo(9.2, 2.9); ctx.stroke();
    }
    pintar(ctx, suave([[4.3, 0], [5.0, 0], [5.4, 1.6], [4.9, 2.9], [4.3, 1.4]], 0.25, 2), ACERO);
    // Cargador de acero curvo con nervaduras estampadas y base
    if (!e.sinCargador) {
      const carg = suave([[10.0, -0.4], [16.1, -0.4], [18.2, 4.6], [21.5, 8.7], [25.0, 11.6], [20.8, 16.9], [16.8, 12.1], [12.8, 6.0]], 0.6, 5);
      pintar(ctx, carg, '#2c2a38');
      if (!Pincel.silueta) for (const t of [0.2, 0.42, 0.64, 0.84]) {   // nervaduras: sombra de un lado, luz del otro
        const p0 = [10.5 + t * 5.0, 0.6], p1 = [12.8 + t * 5.4, 6.0 - t * 1.4], p2 = [16.9 + t * 4.6, 12.0 - t * 3.3];
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.38; ctx.beginPath(); ctx.moveTo(p0[0] + 0.14, p0[1]); ctx.quadraticCurveTo(p1[0] + 0.14, p1[1], p2[0] + 0.14, p2[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(190,190,220,0.22)'; ctx.lineWidth = 0.16; ctx.beginPath(); ctx.moveTo(p0[0] - 0.14, p0[1]); ctx.quadraticCurveTo(p1[0] - 0.14, p1[1], p2[0] - 0.14, p2[1]); ctx.stroke();
      }
      pintar(ctx, suave([[20.4, 16.4], [25.0, 10.9], [25.8, 11.6], [21.2, 17.4]], 0.3, 2), ACERO);   // base
      sombraContacto(ctx, carg, -0.4, 1.4, 0.7);
    }
    // Cajón estampado: remaches de los muñones, pernos del disparador, rebaje sobre el cargador y ventana
    const cajon = suave([[-4.5, -5.3], [21.5, -5.3], [21.5, -0.4], [-4.5, 0.6]], 0.35, 3);
    pintar(ctx, cajon, PAVON);
    rebaje(ctx, suave([[11.4, -3.6], [15.2, -3.6], [15.2, -2.2], [11.4, -2.2]], 0.5, 2), 0.4);   // el rebaje del AKM
    rebaje(ctx, Rc(10.7, -5.25, 6.1, 0.65), 0.6);                                               // ventana de expulsión
    for (const [x, y] of [[-3.0, -1.4], [-1.2, -1.4], [-3.0, -3.6], [3.6, -1.6], [6.2, -1.6], [17.8, -1.0], [19.8, -1.0], [19.8, -3.6]]) remache(ctx, x, y, 0.26);
    const tapa = suave([[-4.6, -5.3], [-4.6, -5.8], [-3.2, -6.6], [20.6, -6.6], [21.1, -6.1], [21.1, -5.3]], 0.45, 4);
    pintar(ctx, tapa, TAPA);
    sombraContacto(ctx, cajon, -5.3, -4.5, 0.6);
    // Palanca selectora larga con su uña
    pintar(ctx, [[0.2, -2.8], [10.4, -3.9], [11.2, -4.6], [11.6, -3.6], [10.6, -3.2], [0.4, -2.2]], '#2e2d38');
    pintar(ctx, Ec(0.4, -2.5, 0.75, 0.75, 16), '#2e2d38'); remache(ctx, 0.4, -2.5, 0.3);
    // Bloque del alza: alto atrás con la hoja, baja hacia adelante
    pintar(ctx, suave([[18.8, -5.2], [18.8, -7.6], [19.6, -8.6], [21.8, -8.6], [22.6, -7.4], [26.3, -6.1], [26.3, -5.2]], 0.35, 3), ACERO);
    pintar(ctx, suave([[19.4, -8.4], [24.6, -7.6], [24.6, -7.0], [19.4, -7.8]], 0.15, 2), '#34333d');   // hoja del alza
    // Guardamanos de madera laminada, retenes de chapa, tubo de gases y bloque inclinado
    const gmInf = suave([[21.5, -5.2], [37.4, -5.2], [37.8, -4.6], [37.8, -1.6], [37.0, -0.8], [23.0, -0.1], [21.5, -0.6]], 0.9, 4);
    pintar(ctx, gmInf, MADERA_GM, { lustre: true });
    pintar(ctx, suave([[37.6, -5.6], [38.6, -5.6], [38.6, -0.9], [37.6, -0.9]], 0.2, 2), ACERO);       // retén delantero
    pintar(ctx, Rc(37.8, -7.0, 7.7, 1.45), PAVON);                                                      // tubo de gases
    pintar(ctx, suave([[26.6, -5.3], [26.6, -7.5], [37.6, -7.7], [38.2, -6.5], [37.6, -5.3]], 0.6, 4), '#9a3a18', { lustre: true });   // guardamanos superior
    sombraContacto(ctx, gmInf, -5.2, -4.2, 0.55);
    pintar(ctx, suave([[45.0, -7.4], [46.5, -7.4], [47.8, -5.4], [47.8, -3.0], [45.0, -3.0]], 0.35, 3), PAVON);   // bloque de gases
    // Cañón, varilla de limpieza con abrazadera, guion con orejas y tuerca de la boca
    pintar(ctx, Rc(37.8, -4.3, 21.8, 1.4), PAVON);
    pintar(ctx, Rc(38.6, -2.75, 20.6, 0.42), '#35343d');
    pintar(ctx, suave([[47.8, -3.0], [49.0, -3.0], [49.0, -1.8], [47.8, -1.8]], 0.2, 2), ACERO);
    pintar(ctx, suave([[56.4, -2.9], [56.8, -9.0], [59.0, -9.0], [59.3, -2.9]], 0.45, 3), PAVON, { huecos: [suave([[57.2, -8.5], [58.6, -8.5], [58.6, -6.4], [57.2, -6.4]], 0.35, 2)] });
    if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(57.75, -7.2, 0.3, 1.4); }   // poste del guion
    pintar(ctx, suave([[59.4, -4.4], [60.8, -4.4], [60.8, -2.8], [59.4, -2.8]], 0.3, 2), ACERO);
    // Manija de carga (va con la corredera)
    const dx = -e.corredera * 8;
    pintar(ctx, suave([[16.6 + dx, -5.6], [19.2 + dx, -5.6], [19.4 + dx, -4.4], [16.6 + dx, -4.2]], 0.35, 3), '#302f39');
    pintar(ctx, Ec(19.5 + dx, -4.9, 0.8, 0.7, 16), '#302f39');
  } });

// M16A1 (99 cm): culata fija de polímero, cajón inferior con el pistolete, cajón superior con asa y alza,
// asistente de cierre, guardamanos redondo ventilado, anillo delta, guion triangular y apagallamas «jaula»
reemplazar('m16', { casquillo: 'bala',
  anclas: { manoDelantera: [30, -1.6], cargador: [9.6, 3.6], corredera: [-2, -8.6], expulsion: [10, -6.8], boca: [61, -5.0] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-4, -7.8], [-37, -7.6], [-38.4, -7.4], [-38.4, 3.8], [-33, 3.2], [-12, -1.2], [-4, -1.8]], 0.8, 4), MAT.polimero, { mate: true });   // culata
    pintar(ctx, suave([[-39.2, -7.8], [-38.2, -7.8], [-38.2, 4.0], [-39.2, 4.0]], 0.3, 2), MAT.goma);
    pintar(ctx, suave([[-0.6, 1.0], [3.0, 1.0], [1.6, 10.0], [-2.6, 10.0], [-2.8, 4.0]], 0.8, 4), MAT.polimero, { mate: true });   // pistolete
    pintar(ctx, suave([[-4, -4.4], [14.4, -4.4], [14.4, 4.4], [6.0, 4.4], [4.4, 1.2], [-4, 1.2]], 0.5, 3), MAT.aleacion);   // cajón inferior
    guardamonteC(ctx, 3.2, 10.0, 1.2, 2.6, MAT.aleacion);
    pintar(ctx, [[4.6, 1.2], [5.4, 1.2], [5.6, 2.8], [5.0, 3.2], [4.6, 2.4]], MAT.acero);
    if (!e.sinCargador) pintar(ctx, suave([[6.6, 4.2], [12.6, 4.2], [14.0, 12], [15.2, 17.0], [9.4, 18.0], [8.2, 12]], 0.5, 3), MAT.aleacion);
    pintar(ctx, Cc(1.2, -1.6, 0.6, 10), MAT.pavonado); pintar(ctx, Rc(2.4, -5.4, 2.6, 1.2), MAT.pavonado);   // selector y retén del cerrojo
    pintar(ctx, suave([[-4, -4.4], [-4, -8.2], [19.4, -8.2], [19.4, -4.4]], 0.4, 3), MAT.aleacion);      // cajón superior
    pintar(ctx, suave([[-2.4, -8.2], [-1.6, -13.2], [13.2, -13.2], [14.2, -8.2], [11.8, -8.2], [11.2, -11.6], [0.8, -11.6], [0.4, -8.2]], 0.5, 3), MAT.aleacion);   // asa
    pintar(ctx, suave([[-1.6, -14.6], [1.0, -14.6], [1.0, -13.2], [-1.6, -13.2]], 0.4, 2), MAT.aleacion);   // alza
    pintar(ctx, Cc(14.4, -5.6, 0.85, 12), MAT.aleacion);                                                    // asistente de cierre
    if (!Pincel.silueta) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(6.4, -7.4, 6.0, 1.6); }
    pintar(ctx, suave([[19.4, -8.6], [21, -8.6], [21, -1.2], [19.4, -1.2]], 0.4, 2), MAT.acero);            // anillo delta
    pintar(ctx, suave([[21, -8.2], [46, -7.6], [47.6, -6.8], [47.6, -2.4], [46, -1.6], [21, -1.4]], 1.0, 4), MAT.polimero, { mate: true });   // guardamanos
    if (!Pincel.silueta) for (let x = 23; x < 45; x += 1.6) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, -7.0, 0.6, 1.6); }   // ventilación
    pintar(ctx, Rc(47.6, -5.7, 9.2, 1.3), MAT.pavonado);
    pintar(ctx, suave([[50, -4.4], [51.4, -12.6], [52.4, -12.6], [53.6, -4.4], [53, -3.2], [50.6, -3.2]], 0.3, 2), MAT.pavonado);   // guion triangular
    pintar(ctx, Rc(50.8, -3.4, 1.6, 1.1), MAT.pavonado);
    pintar(ctx, suave([[56.6, -6.2], [61, -6.2], [61, -3.8], [56.6, -3.8]], 0.4, 2), MAT.pavonado); rayas(ctx, 57.6, 60.4, -6.0, -4.0, 0.7, '#000', 0.28);   // apagallamas
    pintar(ctx, suave([[-5.8 - e.corredera * 6, -9.0], [-2.0 - e.corredera * 6, -9.0], [-2.0 - e.corredera * 6, -8.0], [-5.8 - e.corredera * 6, -8.0]], 0.3, 2), MAT.aleacion);   // manija en T
  } });

// MP5A3 (70 cm), calcado de una foto (lado izquierdo, espejado): culata retráctil de dos varillas con la
// cantonera curva y estriada, traba de la culata, cajón de chapa negro con el tubo de la manija arriba del
// guardamanos fino, alza de tambor, guion anular, cañón con las tres orejas, grupo del disparador de polímero
// con el pistolete inclinado, selector con sus pictogramas rojos, guardamonte fino, gatillo plateado, retén de
// paleta y cargador recto de 30. Medidas en cm desde la parte de arriba del pistolete.
reemplazar('mp5', { casquillo: 'pistola', culataCm: 24, anguloEmpunadura: 0.4,
  anclas: { manoDelantera: [28, -2.6], cargador: [14.8, 0.2], corredera: [31.7, -9.8], expulsion: [12, -9.5], boca: [45.8, -6.1] },
  dibujarCm(ctx, e) {
    const CHAPA = '#2a2d2e', POLI = '#1f2120', VARILLA = '#2c2e30';
    // Culata retráctil: dos varillas y la cantonera curva con la parte de atrás estriada
    pintar(ctx, Rc(-18.8, -8.6, 8.4, 0.8), VARILLA); pintar(ctx, Rc(-18.8, -7.2, 8.4, 0.8), VARILLA);
    const cantonera = suave([[-23.9, -10.0], [-18.6, -10.0], [-18.6, -7.0], [-19.6, -6.2], [-21.0, -0.6], [-22.2, 3.6], [-23.6, 3.7], [-23.9, 3.0]], 0.7, 4);
    pintar(ctx, cantonera, POLI, { mate: true });
    if (!Pincel.silueta) for (let y = -9.4; y < 3.2; y += 0.55) trazo(ctx, 'rgba(0,0,0,0.55)', 0.16, [[-23.8, y], [-23.2, y]]);   // estrías
    // Cajón: tapa trasera con la traba de la culata, cuerpo de chapa y tubo de la manija hasta el guion
    pintar(ctx, suave([[-12.2, -5.2], [-10.6, -5.4], [-10.6, -2.7], [-11.6, -2.6]], 0.3, 2), POLI, { mate: true });   // traba
    const cajon = [[-10.6, -11.3], [-9.6, -11.9], [39.3, -11.9], [39.3, -8.1], [18.3, -8.1], [18.3, -4.9], [-10.6, -4.9]];
    pintar(ctx, suave(cajon, 0.4, 3), CHAPA);
    pintar(ctx, suave([[11.6, -5.2], [17.6, -5.2], [17.6, 0.4], [11.6, 0.4]], 0.3, 2), CHAPA);   // boca del cargador
    trazo(ctx, 'rgba(0,0,0,0.55)', 0.2, [[-9.8, -8.6], [18.0, -8.6]]);                              // canaleta del cajón
    trazo(ctx, 'rgba(255,255,255,0.08)', 0.1, [[-9.8, -8.4], [18.0, -8.4]]);
    trazo(ctx, 'rgba(0,0,0,0.5)', 0.18, [[18.6, -10.0], [39.0, -10.0]]);                            // tubo de la manija
    rebaje(ctx, suave([[19.2, -9.6], [30.0, -9.6], [30.0, -8.9], [19.2, -8.9]], 0.3, 2), 0.4);       // ranura de la manija
    for (const [x, y] of [[-8.0, -3.8], [-9.0, -6.6], [10.8, -0.2], [16.4, -6.6]]) remache(ctx, x, y, 0.3);
    // Alza de tambor y su base
    pintar(ctx, Rc(-4.3, -12.5, 4.3, 0.6), CHAPA);
    pintar(ctx, Ec(-2.2, -13.4, 1.5, 1.5, 20), '#262829');
    if (!Pincel.silueta) for (let k = 0; k < 4; k++) trazo(ctx, 'rgba(0,0,0,0.5)', 0.12, [[-3.5 + k * 0.85, -14.6], [-3.5 + k * 0.85, -12.2]]);
    // Guardamanos fino de polímero
    const gm = suave([[18.3, -8.1], [38.6, -8.1], [39.3, -7.4], [38.9, -4.6], [38.2, -4.1], [18.6, -2.2], [18.3, -2.6]], 1.0, 4);
    pintar(ctx, gm, POLI, { mate: true });
    sombraContacto(ctx, gm, -8.1, -7.0, 0.5);
    // Guion anular sobre su base, cañón con las orejas
    pintar(ctx, suave([[39.6, -11.4], [42.3, -11.4], [42.3, -6.0], [39.6, -6.0]], 0.4, 2), CHAPA);
    pintar(ctx, Ec(40.95, -12.6, 1.55, 1.55, 24), CHAPA, { huecos: [Ec(40.95, -12.6, 0.85, 0.85, 18)] });
    pintar(ctx, Rc(41.5, -6.9, 4.3, 1.6), '#232526');
    if (!Pincel.silueta) for (const x of [42.6, 43.8, 45.0]) { ctx.fillStyle = '#121313'; ctx.fillRect(x, -7.3, 0.55, 2.4); }   // orejas
    // Grupo del disparador y pistolete de polímero
    const grupo = suave([[-6.4, -4.9], [11.6, -4.9], [11.6, 0.8], [10.4, 1.0], [3.4, 0.2], [-3.4, 0.2], [-6.0, -1.2], [-6.4, -3.0]], 0.6, 3);
    pintar(ctx, grupo, '#232424', { mate: true });
    sombraContacto(ctx, grupo, -4.9, -4.0, 0.55);
    const pistolete = suave([[-3.4, 0], [3.3, 0], [2.6, 2.4], [-1.4, 10.4], [-2.4, 10.8], [-7.6, 9.8], [-8.0, 9.0], [-4.4, 2.6]], 1.0, 4);
    pintar(ctx, pistolete, '#1b1c1c', { mate: true });
    sombraContacto(ctx, pistolete, 0, 1.2, 0.6);
    // Selector con los pictogramas rojos (seguro, tiro a tiro, ráfaga)
    if (!Pincel.silueta) {
      ctx.strokeStyle = '#c4262a'; ctx.lineWidth = 0.14;
      for (let k = 0; k < 7; k++) ctx.strokeRect(-0.8 + k * 1.2, -4.1, 0.95, 0.65);
      ctx.fillStyle = '#c4262a'; for (let k = 0; k < 7; k++) ctx.fillRect(-0.55 + k * 1.2, -3.88, 0.45, 0.22);
      ctx.beginPath(); ctx.moveTo(1.8, -2.1); ctx.lineTo(3.6, -3.3); ctx.stroke();
    }
    pintar(ctx, suave([[0.6, -3.2], [1.4, -3.4], [2.4, -1.0], [1.6, -0.6]], 0.3, 2), '#2a2b2b');
    pintar(ctx, Ec(1.6, -1.6, 0.75, 0.75, 14), '#2a2b2b');
    // Guardamonte fino, gatillo plateado y retén de paleta
    if (!Pincel.silueta) {
      ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1b1b'; ctx.lineWidth = 0.6; ctx.beginPath();
      ctx.moveTo(1.0, 0.2); ctx.lineTo(1.6, 4.0); ctx.quadraticCurveTo(1.8, 4.7, 2.6, 4.7); ctx.lineTo(7.8, 4.4); ctx.quadraticCurveTo(8.6, 4.3, 8.6, 3.6); ctx.lineTo(8.6, 0.8); ctx.stroke();
    }
    pintar(ctx, suave([[3.7, 0.3], [4.5, 0.3], [4.9, 1.8], [4.4, 2.9], [3.8, 1.6]], 0.25, 2), '#b9bdc6');
    pintar(ctx, suave([[10.3, 0.2], [11.3, 0.4], [11.6, 3.2], [10.8, 3.3]], 0.25, 2), '#202121');
    // Cargador recto de 30, apenas curvo
    if (!e.sinCargador) {
      const carg = suave([[12.6, 0.2], [17.0, 0.2], [19.4, 11.8], [21.6, 17.0], [17.0, 17.9], [15.0, 11.8]], 0.6, 4);
      pintar(ctx, carg, '#3a3b39');
      if (!Pincel.silueta) { trazo(ctx, 'rgba(0,0,0,0.5)', 0.3, [[14.6, 1.0], [16.9, 11.8], [19.0, 16.8]]); trazo(ctx, 'rgba(255,255,255,0.12)', 0.12, [[14.3, 1.0], [16.6, 11.8], [18.7, 16.8]]); }
      pintar(ctx, suave([[16.6, 17.4], [21.8, 16.4], [22.2, 17.4], [16.9, 18.5]], 0.3, 2), '#2a2b2a');
      sombraContacto(ctx, carg, 0.2, 1.6, 0.65);
    }
    // Manija de carga plegable sobre el tubo (se traba atrás y arriba)
    ctx.save(); ctx.translate(-e.corredera * 2.4, -e.corredera * 1.4);
    pintar(ctx, suave([[30.6, -10.6], [32.8, -10.6], [32.8, -9.1], [30.6, -9.1]], 0.5, 2), '#303233');
    ctx.restore();
  } });

// Thompson M1928 (84 cm), calcada de una foto: compensador Cutts, cañón con aletas, guion, empuñadura delantera
// de madera con los dedos, cajón con el alza y la perilla de carga arriba, tambor de 50, armazón con el pistolete
// de madera y la culata de madera. La foto muestra el lado izquierdo: TH la espeja (0,14 cm por píxel, origen
// arriba del pistolete).
const TH = (x, y) => [(330 - x) * 0.14, (y - 60) * 0.14];
const THF = pts => pts.map(p => TH(...p));
const TH_FORMAS = {
  compensador: suave(THF([[5, 22], [40, 22], [40, 38], [5, 38]]), 0.4, 2),
  canon: THF([[40, 25], [205, 25], [205, 35], [40, 35]]),
  aletas: THF([[100, 20], [205, 20], [205, 40], [100, 40]]),
  delantera: suave(THF([[100, 40], [205, 42], [200, 52], [188, 56], [185, 80], [178, 95], [160, 112], [145, 115], [140, 100], [132, 92], [122, 72], [112, 56]]), 1.0, 4),
  cajon: suave(THF([[205, 18], [235, 16], [235, 12], [440, 12], [442, 50], [380, 52], [235, 50], [205, 45]]), 0.5, 3),
  tambor: suave(THF([[228, 40], [262, 40], [266, 60], [266, 132], [258, 150], [232, 150], [224, 132], [224, 60]]), 1.6, 4),
  armazon: suave(THF([[262, 48], [385, 50], [380, 64], [345, 68], [300, 80], [272, 80], [262, 66]]), 0.5, 3),
  pistolete: suave(THF([[325, 60], [360, 58], [365, 80], [372, 110], [368, 135], [345, 136], [338, 118], [331, 108], [328, 95], [322, 84]]), 1.0, 4),
  culata: suave(THF([[385, 48], [445, 50], [600, 88], [604, 160], [590, 162], [440, 76], [400, 72]]), 1.0, 4),
};
reemplazar('thompson', { casquillo: 'bala',
  anclas: { manoDelantera: TH(152, 78), cargador: TH(245, 95), corredera: TH(280, 9), expulsion: TH(300, 22), boca: TH(5, 30) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = TH_FORMAS, P = TH, NEGRO = '#232427';
    pintar(ctx, F.culata, MAT.madera, { lustre: true });
    pintar(ctx, THF([[598, 88], [605, 89], [606, 160], [598, 162]]), '#1b1b1d');                             // cantonera
    pintar(ctx, F.canon, MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, F.aletas, MAT.pavonado, { brillo: 0.3 });
    if (!sil) for (let x = 104; x < 204; x += 4) trazo(ctx, 'rgba(0,0,0,0.6)', 0.16, [P(x, 21), P(x, 39)]);  // aletas del cañón
    pintar(ctx, F.compensador, MAT.pavonado, { brillo: 0.45 });
    if (!sil) for (const x of [14, 22, 30]) { ctx.fillStyle = '#060607'; ctx.fillRect(...P(x + 2, 22), 0.25, 0.7); }
    pintar(ctx, THF([[38, 22], [40, 8], [48, 8], [50, 22]]), MAT.pavonado);                                   // guion
    pintar(ctx, F.delantera, MAT.madera, { lustre: true });
    pintar(ctx, F.armazon, NEGRO, { brillo: 0.3 });
    if (!sil) { trazo(ctx, NEGRO, 0.45, [P(274, 64), P(276, 76), P(290, 80), P(302, 76), P(304, 64)]); trazo(ctx, MAT.acero, 0.35, [P(290, 62), P(292, 74)]); }   // guardamonte y cola
    pintar(ctx, F.pistolete, MAT.madera, { lustre: true });
    if (!e.sinCargador) { pintar(ctx, F.tambor, '#1d1e21', { brillo: 0.4 }); if (!sil) trazo(ctx, 'rgba(255,255,255,0.12)', 0.3, [P(230, 55), P(230, 140)]); }
    pintar(ctx, F.cajon, NEGRO, { brillo: 0.35 });
    if (!sil) trazo(ctx, 'rgba(255,255,255,0.12)', 0.3, [P(240, 18), P(436, 18)]);
    pintar(ctx, THF([[395, 12], [400, 3], [438, 3], [440, 12]]), MAT.pavonado);                              // alza
    const dx = -e.corredera * 6;
    pintar(ctx, Cc(P(280, 9)[0] + dx, P(280, 9)[1], 0.7, 12), MAT.acero, { brillo: 0.4 });                  // perilla de carga
  } });
DIBUJO_ARMAS.thompson.culataCm = 38;

// Kriss Vector (medida sobre la foto de referencia): cajón alto con riel de punta a punta y miras plegables,
// mira holográfica, frente bajo con riel inferior y empuñadura vertical, bloque inferior en «V» que baja con el
// pozo del cargador largo, guardamonte grande que cierra contra el pie del pistolete, pistolete con panel de
// goma, manija de carga plateada adelante, culata plegable (brazo, tirante y cantonera con dos pernos) y supresor
reemplazar('vector', { casquillo: 'pistola',
  anclas: { manoDelantera: [31.4, 6.0], cargador: [15.8, 11.4], corredera: [29.6, -3.4], expulsion: [12, -4.6], boca: [62.2, -1.0] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, P = MAT.polimero, A = MAT.aleacion, cc = e.corredera * 5;
    // Culata plegable desplegada
    pintar(ctx, suave([[-24.4, -0.6], [-26.2, -1.4], [-28.8, 8.4], [-27.4, 9.4]], 0.5, 2), P, { mate: true });   // tirante
    pintar(ctx, suave([[-7.0, -5.0], [-23.0, -5.0], [-26.6, -3.0], [-29.0, -1.0], [-29.0, 1.0], [-27.4, 0.8], [-24.4, -1.6], [-22.6, -2.6], [-7.0, -2.6]], 0.8, 3), P, { mate: true });   // brazo
    pintar(ctx, suave([[-28.6, -2.2], [-31.6, -2.4], [-33.0, -1.4], [-33.0, 13.2], [-31.8, 13.8], [-28.6, 13.4], [-28.2, 12.0], [-28.4, 0.2]], 0.6, 3), P, { mate: true });   // cantonera
    rayas(ctx, -32.4, -31.0, -0.8, 12.6, 0.45, 'rgba(255,255,255,0.05)', 0.14);
    tornillo(ctx, -27.4, 0.1, 0.42); tornillo(ctx, -27.4, 9.0, 0.42);
    pintar(ctx, suave([[-4.0, -6.0], [-7.4, -6.0], [-7.4, -1.8], [-4.0, -1.8]], 0.5, 2), P, { mate: true });   // bisagra
    // Supresor sobre la rosca del cañón
    pintar(ctx, Rc(35.0, -2.0, 1.6, 2.0), MAT.acero);
    pintar(ctx, suave([[36.4, -3.3], [62.2, -3.3], [62.2, 1.3], [36.4, 1.3]], 0.8, 3), '#2b2c30', { brillo: 0.4 });
    trazo(ctx, 'rgba(255,255,255,0.14)', 0.3, [[37.2, -2.2], [61.6, -2.2]]);
    // Cargador largo
    if (!e.sinCargador) {
      pintar(ctx, suave([[13.8, 11.2], [18.2, 11.2], [17.2, 24.4], [12.6, 24.4]], 0.5, 3), P);
      trazo(ctx, 'rgba(255,255,255,0.06)', 0.3, [[15.4, 12.0], [14.8, 23.6]]);
      pintar(ctx, suave(Rc(12.3, 23.6, 5.2, 1.4), 0.4, 2), '#2a2b2f');
    }
    // Bloque inferior en «V» con el guardamonte grande (el hueco llega hasta abajo)
    pintar(ctx, suave([[1.0, -2.0], [23.4, -2.0], [23.6, 1.8], [20.4, 11.4], [-0.6, 11.4], [-0.6, 9.6], [0.6, 0.0]], 0.7, 3), P,
      { mate: true, huecos: [suave([[9.2, -1.8], [2.0, -1.8], [1.0, 1.0], [0.4, 4.0], [0.0, 9.8], [4.8, 9.9], [8.8, 2.2]], 0.7, 3)] });
    trazo(ctx, 'rgba(255,255,255,0.08)', 0.25, [[22.8, 2.4], [19.8, 10.8]]);
    trazo(ctx, 'rgba(255,255,255,0.1)', 0.3, [[16.6, 2.2], [15.0, 4.6], [13.4, 2.2]]);                          // la «V»
    pintar(ctx, suave(Rc(21.0, 3.6, 0.9, 1.7), 0.3, 2), '#2a2b2f');                                            // retén del cargador
    for (const [x, y] of [[21.6, 0.2], [11.8, 10.4], [5.2, 10.6], [18.4, 9.6]]) tornillo(ctx, x, y, 0.36);
    pintar(ctx, [[4.0, -1.8], [4.8, -1.8], [5.0, -0.2], [4.4, 0.6], [4.0, -0.4]], MAT.acero);                  // disparador
    // Pistolete con panel de goma
    const grip = suave([[0.8, -1.8], [0.6, 1.4], [0.2, 4.6], [0.0, 8.0], [-0.4, 10.4], [-1.6, 11.2], [-4.8, 11.0], [-5.8, 9.6], [-6.0, 6.8], [-5.2, 2.4], [-4.4, -1.8]], 0.8, 4);
    pintar(ctx, grip, P, { mate: true });
    const goma = suave([[-0.8, 1.6], [-1.4, 9.4], [-4.6, 9.4], [-4.8, 3.0], [-3.4, 1.4]], 0.6, 3);
    pintar(ctx, goma, '#232427', { mate: true }); punteado(ctx, goma, 0.42, 'rgba(255,255,255,0.08)');
    // Cajón superior: parte de atrás alta y frente que baja con el riel inferior
    pintar(ctx, suave([[-4.4, -6.9], [35.3, -6.9], [35.3, 1.7], [22.6, 1.7], [22.6, -2.0], [-4.4, -2.0]], 0.5, 3), P, { mate: true });
    trazo(ctx, 'rgba(255,255,255,0.08)', 0.2, [[-4.0, -6.3], [35.0, -6.3]]);
    trazo(ctx, 'rgba(0,0,0,0.5)', 0.16, [[22.6, -4.8], [35.0, -4.8]]);
    for (const [x, y] of [[33.7, -0.7], [27.7, -0.7], [23.6, -4.0], [11.2, -5.0], [17.8, -5.0], [24.6, 0.6]]) tornillo(ctx, x, y, 0.36);
    if (!sil) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(24.6, -4.0, 9.6, 1.1); }
    pintar(ctx, suave(Rc(26.6 - cc, -3.9, 7.0, 0.9), 0.3, 2), '#8d939c', { brillo: 0.5 });                   // manija de carga
    pintar(ctx, Cc(1.8, -4.6, 0.6, 12), A); pintar(ctx, suave([[1.8, -5.0], [3.2, -5.6], [3.4, -5.2], [2.0, -4.4]], 0.2, 2), A);   // selector
    // Rieles, miras plegables y mira holográfica
    pintar(ctx, Rc(-4.0, -7.7, 39.0, 0.8), A); if (!sil) for (let x = -3.6; x < 34.6; x += 1.0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, -7.7, 0.45, 0.45); }
    pintar(ctx, Rc(26.0, 1.7, 8.4, 0.9), A);
    pintar(ctx, [[-0.4, -7.7], [0.0, -11.0], [0.8, -11.0], [1.2, -7.7]], P); pintar(ctx, [[30.4, -7.7], [30.8, -11.6], [31.6, -11.6], [32.0, -7.7]], P);
    pintar(ctx, Rc(7.6, -8.5, 11.2, 0.8), A);
    pintar(ctx, suave([[7.0, -8.5], [19.0, -8.5], [19.0, -11.6], [17.6, -11.6], [17.6, -14.0], [10.0, -14.0], [9.0, -12.8], [7.0, -12.4]], 0.5, 3), '#26272b',
      { huecos: [suave(Rc(10.6, -13.4, 6.2, 1.7), 0.4, 2)], brillo: 0.3 });
    pintar(ctx, Cc(8.2, -10.4, 0.7, 12), '#3a3c42'); pintar(ctx, Rc(15.4, -11.2, 1.6, 0.6), '#d6b84a', { brillo: 0.2 });
    // Empuñadura vertical
    pintar(ctx, suave([[29.6, 2.6], [33.4, 2.6], [33.0, 12.2], [30.0, 12.2]], 0.8, 3), P, { mate: true });
    for (let y = 7.6; y < 11.8; y += 0.8) trazo(ctx, 'rgba(255,255,255,0.08)', 0.25, [[30.2, y], [32.8, y]]);
  } });
DIBUJO_ARMAS.vector.culataCm = 33;
DIBUJO_ARMAS.vector.anguloEmpunadura = 0.15;

/* ======================= RIFLES ======================= */

// Mira telescópica más detallada: campanas, torretas, anillas con tornillos, lentes
function mira2(ctx, x0, x1, eje, diam, objetivo, ocular, anillas, base) {
  for (const ax of anillas) { pintar(ctx, suave([[ax, eje - diam / 2 - 0.3], [ax + 2, eje - diam / 2 - 0.3], [ax + 2, base], [ax, base]], 0.3, 2), MAT.pavonado); tornillo(ctx, ax + 1, eje - diam / 2 - 0.1, 0.22); }
  pintar(ctx, suave([[x0, eje - ocular / 2], [x0 + 6, eje - ocular / 2], [x0 + 8, eje - diam / 2], [x1 - 9, eje - diam / 2], [x1 - 5, eje - objetivo / 2], [x1, eje - objetivo / 2], [x1, eje + objetivo / 2], [x1 - 5, eje + objetivo / 2], [x1 - 9, eje + diam / 2], [x0 + 8, eje + diam / 2], [x0 + 6, eje + ocular / 2], [x0, eje + ocular / 2]], 0.5, 3), MAT.pavonado, { brillo: 0.4 });
  const mx = (x0 + x1) / 2 - 1.6;
  pintar(ctx, suave([[mx, eje - diam / 2 - 1.8], [mx + 3, eje - diam / 2 - 1.8], [mx + 3, eje - diam / 2], [mx, eje - diam / 2]], 0.3, 2), MAT.pavonado); rayas(ctx, mx + 0.4, mx + 2.6, eje - diam / 2 - 1.7, eje - diam / 2 - 0.4, 0.35, 'rgba(255,255,255,0.15)', 0.12);
  trazo(ctx, 'rgba(255,255,255,0.1)', 0.25, [[x0 + 8, eje - diam / 2 + 0.4], [x1 - 9, eje - diam / 2 + 0.4]]);
  if (!Pincel.silueta) { const g = ctx.createLinearGradient(x1, eje - objetivo / 2, x1, eje + objetivo / 2); g.addColorStop(0, '#9fd2f0'); g.addColorStop(1, '#1d4c6c'); ctx.fillStyle = g; ctx.fillRect(x1 - 0.4, eje - objetivo / 2 + 0.5, 0.4, objetivo - 1); }
}

// Remington 700 BDL (112 cm), calcado de una foto: culata de nogal con lomo Monte Carlo, cantonera de goma
// negra, pistolete con tapa negra y separador blanco, cuadrillé en el pistolete y el fuste, punta del fuste de
// ébano con separador; cajón pavonado con la ventana, cerrojo con la manija curva y la bola negra, guardamonte,
// cañón largo y fino, mira telescópica con anillas, torretas y campana del objetivo, y las argollas de la
// correa. R700 pasa píxeles de la foto (enderezada) a cm: 0,1397 cm por píxel, origen arriba del pistolete.
const R700 = (x, y) => [(x - 215) * 0.1397, (y - 96) * 0.1397];
const R700F = pts => pts.map(p => R700(...p));
const R700_FORMAS = {
  culata: suave(R700F([[26, 90], [160, 80], [205, 76], [236, 66], [300, 63], [400, 62], [528, 63], [528, 86], [470, 90], [360, 95], [280, 98], [240, 104], [216, 108], [201, 120], [197, 139], [190, 145], [172, 144], [166, 130], [155, 122], [100, 143], [30, 179]]), 1.2, 4),
  cantonera: suave(R700F([[8, 92], [28, 89], [32, 180], [12, 182]]), 0.6, 3),
  tapa: suave(R700F([[168, 139], [197, 138], [195, 147], [172, 147]]), 0.3, 2),
  punta: suave(R700F([[527, 63], [556, 63], [566, 70], [562, 82], [530, 86]]), 0.6, 3),
  cuadrilleGrip: R700F([[178, 100], [214, 93], [222, 104], [196, 116]]),
  cuadrilleFuste: R700F([[330, 68], [425, 66], [432, 82], [338, 88]]),
  cajon: suave(R700F([[226, 57], [372, 57], [374, 66], [226, 68]]), 0.6, 3),
  canon: R700F([[555, 61], [810, 64], [812, 70], [555, 73]]),
};
reemplazar('remington700', { casquillo: 'bala',
  anclas: { manoDelantera: R700(410, 94), cargador: R700(330, 60), corredera: R700(256, 89), expulsion: R700(330, 60), boca: R700(812, 67) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = R700_FORMAS, P = R700;
    pintar(ctx, F.cajon, MAT.pavonado, { brillo: 0.45 });
    pintar(ctx, F.canon, MAT.pavonado, { brillo: 0.45 });
    pintar(ctx, F.culata, MAT.maderaClara, { lustre: true });
    cuadriculado(ctx, F.cuadrilleGrip, 0.42, 'rgba(25,10,2,0.38)');
    cuadriculado(ctx, F.cuadrilleFuste, 0.42, 'rgba(25,10,2,0.38)');
    pintar(ctx, F.cantonera, MAT.goma, { mate: true });
    pintar(ctx, F.tapa, '#141414'); pintar(ctx, F.punta, '#17110d', { brillo: 0.35 });
    if (!sil) {
      trazo(ctx, 'rgba(235,230,220,0.75)', 0.14, [P(170, 139), P(197, 138)]);                                   // separadores blancos
      trazo(ctx, 'rgba(235,230,220,0.75)', 0.14, [P(528, 63), P(529, 86)]);
      trazo(ctx, 'rgba(255,240,220,0.12)', 0.3, [P(40, 92), P(200, 82)]);
      for (const [x, y] of [[48, 178], [515, 92]]) { ctx.beginPath(); ctx.arc(...P(x, y + 6), 0.65, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.28; ctx.stroke(); }
      trazo(ctx, MAT.pavonado, 0.4, [P(240, 104), P(243, 117), P(256, 123), P(272, 120), P(280, 104)]);          // guardamonte
      trazo(ctx, MAT.acero, 0.35, [P(254, 104), P(257, 116)]);                                                    // cola del disparador
      trazo(ctx, 'rgba(255,255,255,0.22)', 0.2, [P(560, 64), P(806, 66)]);
    }
    // Cerrojo: va atrás con la manija curva y la bola negra
    const ab = Math.max(e.corredera, e.abierto);
    if (ab > 0.3 && !sil) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(...P(296, 58), 64 * 0.1397, 6 * 0.1397); }
    else if (!sil) { ctx.fillStyle = 'rgba(230,235,240,0.5)'; ctx.fillRect(...P(300, 60), 60 * 0.1397, 2 * 0.1397); }
    ctx.save(); ctx.translate(-ab * 8.5, 0);
    pintar(ctx, suave(R700F([[222, 58], [240, 58], [240, 68], [222, 68]]), 0.4, 2), MAT.pavonado);             // cola del cerrojo
    if (!sil) { ctx.beginPath(); ctx.moveTo(...P(268, 68)); ctx.quadraticCurveTo(...P(266, 82), ...P(257, 88)); ctx.strokeStyle = MAT.acero; ctx.lineWidth = 0.7; ctx.stroke(); }
    pintar(ctx, Cc(...P(256, 89), 0.9, 14), '#17181b', { brillo: 0.4 });
    ctx.restore();
    // Mira telescópica: anillas, tubo, ocular, torretas y campana del objetivo
    for (const x of [284, 374]) pintar(ctx, suave(R700F([[x, 44], [x + 18, 44], [x + 18, 58], [x, 58]]), 0.3, 2), MAT.pavonado);
    pintar(ctx, R700F([[255, 27], [402, 27], [402, 45], [255, 45]]), '#1d1e21', { brillo: 0.4 });
    pintar(ctx, suave(R700F([[220, 21], [258, 23], [258, 49], [220, 51]]), 0.6, 3), '#1d1e21', { brillo: 0.4 });
    pintar(ctx, suave(R700F([[400, 27], [416, 18], [471, 16], [471, 55], [416, 53], [400, 45]]), 0.6, 3), '#1d1e21', { brillo: 0.4 });
    pintar(ctx, suave(R700F([[322, 9], [342, 9], [342, 27], [322, 27]]), 0.3, 2), '#26272b');
    pintar(ctx, Cc(...P(333, 36), 1.0, 14), '#26272b');
    if (!sil) { rayas(ctx, P(324, 0)[0], P(340, 0)[0], P(0, 11)[1], P(0, 25)[1], 0.3, 'rgba(255,255,255,0.12)', 0.1); trazo(ctx, 'rgba(0,0,0,0.6)', 0.2, [P(228, 21), P(228, 51)]); }
    if (!sil) { const [x1, y0] = P(470, 18), [, y1] = P(0, 53); const g = ctx.createLinearGradient(x1, y0, x1, y1); g.addColorStop(0, '#9fd2f0'); g.addColorStop(1, '#1d4c6c'); ctx.fillStyle = g; ctx.fillRect(x1 - 0.4, y0 + 0.4, 0.4, y1 - y0 - 0.8); }
  } });
DIBUJO_ARMAS.remington700.culataCm = 29;

// Barrett M82A1 (145 cm): cajón superior largo con nervios, asa de transporte, cajón inferior con el
// pistolete y el cargador de 10, culata con almohadilla grande, cañón grueso, freno de boca de dos cámaras,
// bípode plegado y mira
reemplazar('barrett', { casquillo: 'grande',
  anclas: { manoDelantera: [26, -3.6], cargador: [10, 1.2], corredera: [10, -8.4], expulsion: [14, -11], boca: [104, -8.2] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-12, -11.6], [-37.6, -11.6], [-38.8, -10.4], [-38.8, 4.8], [-34, 5.6], [-28, 1.6], [-12, -1.4]], 0.9, 4), MAT.pavonado);   // culata
    pintar(ctx, suave([[-41.2, -12.2], [-38.6, -12.2], [-38.6, 5.8], [-41.2, 5.8]], 0.9, 3), MAT.goma);
    pintar(ctx, suave([[-30, -6.4], [-22, -6.4], [-22, -2.8], [-30, -1.6]], 0.8, 3), '#2a2c31', { mate: true });   // aligeramiento
    pintar(ctx, suave([[-0.6, 1.0], [3.6, 1.0], [2.2, 10.4], [-2.6, 10.4], [-2.4, 4.0]], 0.8, 4), MAT.polimero, { mate: true });
    pintar(ctx, suave([[-12, -5.6], [20, -5.6], [20, 1.2], [6, 1.2], [4.4, 3.6], [-12, 1.2]], 0.5, 3), MAT.pavonado);   // cajón inferior
    guardamonteC(ctx, 3.6, 9.4, 1.0, 2.8, MAT.pavonado);
    pintar(ctx, [[4.8, 1.0], [5.6, 1.0], [5.8, 2.6], [5.2, 3.0], [4.8, 2.2]], MAT.acero);
    if (!e.sinCargador) { pintar(ctx, suave([[5.6, 0.6], [15.2, 0.6], [15.2, 12.8], [5.6, 12.8]], 0.6, 3), MAT.pavonado); rayas(ctx, 6.6, 14.2, 2, 11.6, 2.4, 'rgba(255,255,255,0.06)', 0.4); }
    pintar(ctx, suave([[-10, -12.2], [47, -12.2], [47, -5.6], [-10, -5.6]], 0.6, 3), MAT.pavonado, { brillo: 0.3 });   // cajón superior
    if (!Pincel.silueta) for (let x = 24; x < 46; x += 2.8) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, -11.2, 1.4, 4.4); }   // nervios
    trazo(ctx, 'rgba(255,255,255,0.1)', 0.3, [[-9.6, -8.6], [46.6, -8.6]]);
    pintar(ctx, suave([[14, -12.2], [15.4, -16.6], [30, -16.6], [31.4, -12.2], [28.6, -12.2], [28, -15.0], [17.4, -15.0], [16.8, -12.2]], 0.6, 3), MAT.pavonado);   // asa
    pintar(ctx, Rc(47, -10.0, 51, 3.4), MAT.pavonado, { brillo: 0.4 });                                     // cañón
    pintar(ctx, suave([[97, -11.4], [104.2, -11.4], [104.2, -5.0], [97, -5.0]], 0.6, 3), MAT.acero);        // freno de boca
    if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(98.4, -10.6, 1.6, 4.8); ctx.fillRect(101.2, -10.6, 1.6, 4.8); }
    pintar(ctx, suave([[42, -6.0], [46, -6.0], [46, -4.4], [42, -4.4]], 0.3, 2), MAT.pavonado);             // bípode plegado
    trazo(ctx, MAT.pavonado, 1.0, [[44, -4.6], [70, -4.0]]); trazo(ctx, '#2a2c30', 0.9, [[44, -4.0], [70, -3.4]]);
    mira2(ctx, -6, 26, -18.6, 3.4, 5.8, 4.6, [0, 15], -12.2);
    const dx = -e.corredera * 9;
    pintar(ctx, suave([[7.6 + dx, -9.4], [12 + dx, -9.4], [12 + dx, -7.6], [7.6 + dx, -7.6]], 0.4, 2), MAT.acero);   // manija de carga
  } });

// Mosin-Nagant 91/30 de tirador (123 cm), según la imagen de referencia: culata larga de cuello recto con las
// ranuras de la correa, guardamanos de madera hasta casi la boca, dos abrazaderas, cajón hexagonal, depósito,
// mira PU sobre el cajón, manija de cerrojo doblada hacia abajo, perilla de amartillar y baqueta bajo el cañón
reemplazar('mosin', { casquillo: 'bala',
  anclas: { manoDelantera: [34, 0.6], cargador: [8, -7], corredera: [-1.6, -1.2], expulsion: [8, -6.6], boca: [84, -5.6] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-39, -5.0], [-6, -4.2], [-2, -3.6], [18, -3.4], [72, -3.4], [73.4, -2.0], [72, -0.6], [18, 0.8], [14, 2.6], [4, 2.8], [1, 1.4], [-3, 2.4], [-9, 2.8], [-26, 6.4], [-39, 8.4]], 0.9, 4), MAT.maderaClara);   // culata y fuste
    pintar(ctx, suave([[-39.8, -5.2], [-38.8, -5.2], [-38.8, 8.6], [-39.8, 8.4]], 0.3, 2), MAT.acero);
    pintar(ctx, suave([[3, 0.6], [14, 0.6], [14, 3.4], [3, 3.4]], 0.4, 2), MAT.pavonado);                   // depósito
    guardamonteC(ctx, 1.6, 8.0, 0.6, 2.4, MAT.pavonado);
    pintar(ctx, suave([[-2, -6.8], [18, -6.8], [18, -3.6], [-2, -3.6]], 0.3, 2), MAT.pavonado, { brillo: 0.35 });   // cajón
    trazo(ctx, 'rgba(255,255,255,0.12)', 0.25, [[-1.6, -5.6], [17.6, -5.6]]);
    pintar(ctx, suave([[19, -7.0], [70, -6.6], [70, -5.6], [19, -5.6]], 0.4, 2), MAT.maderaClara);         // guardamanos superior
    pintar(ctx, Rc(18, -6.4, 67, 1.6), MAT.pavonado, { brillo: 0.4 });
    for (const bx of [32, 69]) pintar(ctx, suave([[bx, -7.2], [bx + 1.4, -7.2], [bx + 1.4, -0.6], [bx, -0.6]], 0.3, 2), MAT.pavonado);   // abrazaderas
    pintar(ctx, suave([[19.4, -6.8], [25.4, -7.8], [25.6, -6.6], [19.6, -6.4]], 0.3, 2), MAT.pavonado);     // alza tangencial
    pintar(ctx, suave([[81.6, -6.4], [81.8, -9.2], [83.8, -9.2], [84, -6.4]], 0.5, 2), MAT.pavonado, { huecos: [suave([[82.4, -8.6], [83.2, -8.6], [83.2, -7.0], [82.4, -7.0]], 0.2, 2)] });   // guion con capuchón
    if (!Pincel.silueta) {
      for (const [x, y] of [[-22, 2.2], [40, -2.2]]) { ctx.fillStyle = '#e6dccb'; ctx.beginPath(); ctx.ellipse(x, y, 1.5, 0.32, -0.03, 0, Math.PI * 2); ctx.fill(); }   // ranuras de la correa
      trazo(ctx, MAT.pavonado, 0.35, [[70.6, -4.6], [84.6, -4.8]]);                                       // baqueta
    }
    const ab = Math.max(e.corredera, e.abierto);
    if (ab > 0.3 && !Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(4, -6.8, 7, 1.2); }
    ctx.save(); ctx.translate(-ab * 10, 0);
    pintar(ctx, suave([[-6.2, -6.6], [-2, -6.6], [-2, -3.8], [-6.2, -3.8]], 1.0, 3), MAT.acero);          // perilla de amartillar
    rayas(ctx, -5.6, -3, -6.2, -4.2, 0.6, 'rgba(0,0,0,0.4)', 0.16);
    if (!Pincel.silueta) { ctx.beginPath(); ctx.moveTo(0.4, -5.2); ctx.quadraticCurveTo(0.6, -2.4, -1.4, -1.5); ctx.strokeStyle = MAT.acero; ctx.lineWidth = 0.8; ctx.lineCap = 'round'; ctx.stroke(); }   // manija doblada
    pintar(ctx, Cc(-1.6, -1.2, 0.9, 12), '#4a4c52');
    ctx.restore();
    // Mira PU sobre el cajón, con su montura lateral, torreta, ocular y objetivo
    pintar(ctx, suave([[3, -6.8], [12, -6.8], [12, -8.8], [3, -8.8]], 0.3, 2), MAT.pavonado);
    pintar(ctx, Rc(-3.4, -11.2, 22, 1.9), '#3c3f45', { brillo: 0.45 });
    pintar(ctx, suave([[-5.6, -11.6], [-3.2, -11.6], [-3.2, -9.0], [-5.6, -9.0]], 0.4, 2), '#34373c');
    pintar(ctx, suave([[18.4, -11.7], [21, -11.7], [21, -8.9], [18.4, -8.9]], 0.4, 2), '#34373c');
    pintar(ctx, Rc(7, -12.4, 1.8, 1.2), '#34373c');
    if (!Pincel.silueta) { ctx.fillStyle = '#7fb7d8'; ctx.fillRect(20.8, -11.3, 0.25, 2.0); }
  } });

// Dragunov SVD (122,5 cm): culata esqueleto con hueco para el pulgar y carrillera, cajón tipo AK, cargador
// de 10, guardamanos con ranuras, cañón largo con apagallamas ranurado y mira PSO-1
reemplazar('svd', { casquillo: 'bala',
  anclas: { manoDelantera: [38, -3.4], cargador: [10, -2.2], corredera: [19, -5.2], expulsion: [14, -7], boca: [86.6, -5.9] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-4.6, -7.2], [-32.4, -7.0], [-33.6, -6.6], [-33.6, 8.6], [-30.4, 8.6], [-16, 3.2], [-2.8, 7.6], [-0.6, 7.6], [0.6, 0.6], [-4.6, -1.6]], 0.9, 4), MAT.madera,
      { huecos: [suave([[-6, -4.4], [-27.4, -4.4], [-28.2, 4.4], [-17, 0.6], [-5.6, 4.4], [-3.8, 0.2]], 1.6, 5)] });   // culata esqueleto
    pintar(ctx, suave([[-26.4, -9.6], [-13, -9.6], [-12, -7.0], [-26.4, -7.0]], 1.0, 3), MAT.madera);            // carrillera
    pintar(ctx, suave([[-34.6, -7.0], [-33.4, -7.0], [-33.4, 8.8], [-34.6, 8.6]], 0.4, 2), MAT.goma);
    guardamonteC(ctx, 3.2, 9.2, -2.0, 3.0, MAT.acero);
    pintar(ctx, [[4.2, -2.0], [5.0, -2.0], [5.2, -0.2], [4.6, 0.4], [4.2, -0.4]], MAT.acero);
    if (!e.sinCargador) pintar(ctx, suave([[7, -2.2], [12.6, -2.2], [13.8, 4], [15.4, 9.4], [10.6, 10.6], [9.4, 5], [7, 0]], 0.5, 3), MAT.pavonado);
    pintar(ctx, suave([[-4.6, -2.0], [-4.6, -6.6], [-3.0, -7.8], [26, -7.8], [26, -2.0]], 0.5, 3), MAT.pavonado, { brillo: 0.25 });
    trazo(ctx, 'rgba(0,0,0,0.5)', 0.25, [[-4, -5.6], [25.6, -5.6]]);
    pintar(ctx, [[2.6, -4.2], [14.4, -4.8], [14.6, -4.0], [2.8, -3.6]], MAT.acero);
    if (!Pincel.silueta) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(10, -5.2, 7, 1.2); }
    pintar(ctx, suave([[27, -7.8], [50, -7.6], [51.4, -5.6], [50, -3.4], [27, -3.2]], 1.0, 4), MAT.madera, { huecos: Array.from({ length: 5 }, (_, k) => suave([[30 + k * 4, -6.6], [32.4 + k * 4, -6.6], [32.4 + k * 4, -5.4], [30 + k * 4, -5.4]], 0.5, 2)) });
    pintar(ctx, Rc(50, -6.6, 31, 1.4), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, suave([[52, -7.4], [55, -7.4], [55, -4.6], [52, -4.6]], 0.3, 2), MAT.pavonado);              // bloque de gases
    pintar(ctx, suave([[81, -7.2], [86.8, -7.2], [86.8, -4.6], [81, -4.6]], 0.5, 2), MAT.pavonado); rayas(ctx, 82.2, 85.8, -7.0, -4.8, 1.2, '#000', 0.35);   // apagallamas
    pintar(ctx, [[77, -6.6], [77.4, -9.6], [78.6, -9.6], [79, -6.6]], MAT.pavonado);
    mira2(ctx, -2, 22, -12.6, 2.6, 4.2, 3.6, [3, 16], -7.8);
    pintar(ctx, suave([[-4, -10.4], [-0.8, -10.4], [-0.8, -14.6], [-4, -14.6]], 0.8, 3), MAT.goma);          // ocular de goma
    pintar(ctx, suave([[16.4 - e.corredera * 8, -6.2], [19.4 - e.corredera * 8, -6.2], [19.4 - e.corredera * 8, -4.6], [16.4 - e.corredera * 8, -4.6]], 0.4, 2), MAT.acero);
  } });

// Winchester 1894 (96 cm): culata de cuello recto con cantonera, cajón con la ventana de carga, martillo,
// palanca con lazo, tubo de balas bajo el cañón hasta casi la boca, fuste con abrazadera, alza y guion
reemplazar('winchester1894', { casquillo: 'bala',
  anclas: { manoDelantera: [27, -1.0], cargador: [11, -0.2], corredera: [-8, 4], expulsion: [9, -5.6], boca: [61, -4.2] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-35, -5.4], [-4, -4.2], [0, -4.4], [0, 1.6], [-5, 2.0], [-20, 5.6], [-35, 8.0]], 0.9, 4), MAT.maderaClara);   // culata
    pintar(ctx, suave([[-35.8, -5.6], [-34.8, -5.6], [-34.8, 8.2], [-35.8, 7.8], [-36.4, 1.2]], 0.4, 2), MAT.acero);
    pintar(ctx, suave([[0, -5.8], [17.4, -5.8], [17.4, 0.6], [16, 2.0], [0, 2.0]], 0.8, 4), MAT.pavonado, { brillo: 0.4 });   // cajón
    if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(10, -1.2, 4.6, 1.4); }                   // ventana de carga
    tornillo(ctx, 3.0, -3.0); tornillo(ctx, 6.6, -1.6); tornillo(ctx, 14.6, -3.6);
    pintar(ctx, suave([[-1.6, -5.0], [-3.0, -7.4], [-1.8, -7.6], [0.6, -5.4]], 0.3, 2), MAT.pavonado);    // martillo
    pintar(ctx, Rc(17.4, -5.2, 43.6, 1.6), MAT.pavonado, { brillo: 0.4 });                                  // cañón
    pintar(ctx, Rc(17.4, -3.4, 41.4, 1.5), MAT.pavonado, { brillo: 0.35 });                                 // tubo de balas
    pintar(ctx, suave([[17.4, -3.6], [32, -3.6], [32.8, -2.2], [32, -0.8], [17.4, -0.6]], 0.8, 3), MAT.maderaClara);   // fuste
    pintar(ctx, suave([[32, -3.8], [33.2, -3.8], [33.2, -1.0], [32, -1.0]], 0.3, 2), MAT.pavonado);
    pintar(ctx, suave([[56.6, -5.4], [57.8, -5.4], [57.8, -1.6], [56.6, -1.6]], 0.3, 2), MAT.pavonado);     // abrazadera
    pintar(ctx, suave([[26, -5.2], [29, -5.2], [29, -6.2], [26, -6.2]], 0.2, 2), MAT.pavonado);             // alza
    pintar(ctx, [[59.6, -5.2], [59.8, -6.6], [60.4, -6.6], [60.6, -5.2]], MAT.pavonado);
    ctx.save(); ctx.translate(14, 1.6); ctx.rotate(e.palanca * 0.95);                                         // palanca
    if (!Pincel.silueta) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-13.2, 0.4); ctx.quadraticCurveTo(-16.6, 0.6, -16.0, 3.6); ctx.quadraticCurveTo(-15.2, 6.8, -10.4, 6.6); ctx.quadraticCurveTo(-5.8, 6.4, -5.6, 2.8); ctx.lineTo(-3, 2.2);
      ctx.strokeStyle = MAT.pavonado; ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.25; ctx.stroke();
    } else { ctx.fillStyle = Pincel.silueta; ctx.fillRect(-16, 0, 13, 6.6); }
    ctx.restore();
  } });

DIBUJO_ARMAS.svd.culataCm = 34.6;   // Dragunov: culata a la medida real

/* ======================= ESCOPETAS ======================= */
function bombaNervada(ctx, x, y, w, h, color, desplazamiento) {   // guardamanos que se bombea, con canaletas
  ctx.save(); ctx.translate(-desplazamiento, 0);
  pintar(ctx, suave([[x, y], [x + w, y], [x + w + 0.6, y + h / 2], [x + w, y + h], [x, y + h], [x - 0.6, y + h / 2]], 1.0, 3), color, { mate: color === MAT.polimero });
  if (!Pincel.silueta) for (let k = x + 1.4; k < x + w - 1; k += 1.3) { ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(k, y + 0.5, 0.45, h - 1); }
  ctx.restore();
}

// Escopeta de dos caños superpuestos (115 cm), calcada de una foto: culata de nogal con semipistolete y cantonera,
// báscula gris con el perno de la bisagra, palanca de apertura arriba, guardamonte redondo con un disparador,
// caños superpuestos negros con la banda de arriba y el guion, y delantera de madera. La foto muestra el lado
// izquierdo: E2 la espeja y pasa píxeles a cm (0,1624 por píxel, origen arriba del pistolete). Los caños y la
// delantera giran sobre la bisagra para cargar.
const E2 = (x, y) => [(495 - x) * 0.1624, (y - 100) * 0.1624];
const E2F = pts => pts.map(p => E2(...p));
const E2_BISAGRA = E2(390, 96);
const E2_FORMAS = {
  culata: suave(E2F([[462, 70], [470, 68], [562, 90], [600, 95], [715, 106], [713, 189], [690, 187], [600, 165], [565, 152], [548, 150], [537, 145], [528, 132], [518, 117], [500, 108], [486, 105], [470, 100], [460, 92]]), 0.9, 4),
  cantonera: suave(E2F([[714, 106], [729, 109], [727, 188], [712, 190]]), 0.5, 3),
  bascula: suave(E2F([[380, 62], [440, 60], [462, 66], [470, 80], [468, 98], [452, 102], [395, 101], [380, 96]]), 0.6, 3),
  palanca: suave(E2F([[452, 58], [471, 55], [473, 62], [456, 64]]), 0.3, 2),
  canonArriba: E2F([[22, 58], [455, 60], [455, 72], [22, 71]]),
  canonAbajo: E2F([[22, 71], [455, 72], [455, 86], [22, 85]]),
  banda: E2F([[22, 56], [440, 58], [440, 60], [22, 58]]),
  delantera: suave(E2F([[250, 72], [382, 72], [382, 99], [272, 99], [258, 93], [249, 82]]), 1.0, 4),
};
reemplazar('recortada', { casquillo: null, casquilloVaciado: 'escopeta', agarre: 'hombro', anguloEmpunadura: 0.9, culataCm: 37,
  anclas: { manoDelantera: E2(320, 99), cargador: E2(450, 72), corredera: E2(462, 59), expulsion: E2(450, 72), boca: E2(22, 72) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = E2_FORMAS, P = E2, GRIS = '#868d95', [bx, by] = E2_BISAGRA;
    pintar(ctx, F.culata, MAT.madera, { lustre: true });
    cuadriculado(ctx, E2F([[488, 92], [510, 100], [524, 122], [506, 116]]), 0.42, 'rgba(25,10,2,0.35)');
    pintar(ctx, F.cantonera, '#1a1512', { mate: true });
    if (!sil) {
      trazo(ctx, MAT.pavonado, 0.42, [P(452, 101), P(450, 112), P(458, 121), P(475, 122), P(484, 115), P(486, 105)]);   // guardamonte
      trazo(ctx, MAT.acero, 0.38, [P(463, 101), P(467, 114)]);                                                         // disparador
    }
    const abierta = e.abierto > 0.03;
    const bascula = () => {
      pintar(ctx, F.bascula, GRIS, { brillo: 0.5 });
      if (!sil) { for (let k = 0; k < 3; k++) { ctx.strokeStyle = 'rgba(40,44,50,0.3)'; ctx.lineWidth = 0.1; ctx.beginPath(); ctx.arc(...P(425, 82), 0.9 + k * 0.6, 0, Math.PI * 2); ctx.stroke(); } }
      pintar(ctx, Cc(bx, by, 0.55, 12), '#5c636b'); punto(ctx, bx, by, 0.2, '#2a2d31');                                // perno de la bisagra
      pintar(ctx, F.palanca, '#6f767e');
    };
    if (abierta) bascula();
    // Caños y delantera: giran alrededor de la bisagra
    ctx.save(); ctx.translate(bx, by); ctx.rotate(e.abierto * 0.6); ctx.translate(-bx, -by);
    pintar(ctx, F.canonAbajo, '#141517', { brillo: 0.35 });
    pintar(ctx, F.canonArriba, '#17181b', { brillo: 0.5 });
    pintar(ctx, F.banda, '#202125');
    if (!sil) { trazo(ctx, 'rgba(0,0,0,0.7)', 0.16, [P(24, 71), P(452, 72)]); trazo(ctx, 'rgba(255,255,255,0.16)', 0.18, [P(30, 62), P(445, 64)]); }
    punto(ctx, ...P(28, 55), 0.3, '#e0d8c0');                                                                          // guion
    if (abierta && !sil) for (const y of [65, 79]) { ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.ellipse(...P(455, y), 0.3, 0.85, 0, 0, Math.PI * 2); ctx.fill(); }
    pintar(ctx, F.delantera, MAT.madera, { lustre: true });
    cuadriculado(ctx, E2F([[285, 80], [365, 80], [365, 95], [285, 95]]), 0.42, 'rgba(25,10,2,0.35)');
    ctx.restore();
    if (!abierta) bascula();
  } });
DIBUJO_ARMAS.recortada.moviles = {
  manoDelantera: e => girarCm(...E2(320, 99), ...E2_BISAGRA, e.abierto * 0.6),
  cargador: e => girarCm(...E2(450, 72), ...E2_BISAGRA, e.abierto * 0.6),
};

// Mossberg 500 (100 cm), calcada de una foto: culata y pistolete sintéticos gris azulado, cajón con la ventana de
// carga abajo, guardamonte, cañón con la camisa perforada, tubo del depósito con tapa, abrazadera con argolla,
// bomba nervada y argolla en la culata. La foto muestra el lado izquierdo: MB la espeja y pasa píxeles a cm
// (0,162 por píxel, origen arriba del pistolete). La bomba y la mano de apoyo corren juntas al bombear.
const MB = (x, y) => [(430 - x) * 0.162, (y - 52) * 0.162];
const MBF = pts => pts.map(p => MB(...p));
const MB_FORMAS = {
  canon: MBF([[12, 17], [322, 16], [322, 31], [12, 31]]),
  tubo: MBF([[18, 32], [322, 32], [322, 50], [18, 50]]),
  bomba: suave(MBF([[136, 30], [262, 29], [266, 40], [262, 56], [138, 56], [134, 42]]), 0.8, 3),
  cajon: suave(MBF([[320, 15], [400, 15], [440, 22], [452, 32], [448, 50], [322, 50]]), 0.5, 3),
  culata: suave(MBF([[440, 22], [492, 40], [615, 47], [616, 121], [560, 100], [485, 83], [472, 78], [462, 66], [448, 50]]), 1.0, 4),
  cantonera: suave(MBF([[612, 47], [628, 49], [628, 121], [614, 122]]), 0.4, 2),
};
reemplazar('mossberg', { casquillo: 'escopeta',
  anclas: { manoDelantera: MB(200, 54), cargador: MB(355, 52), corredera: MB(200, 54), expulsion: MB(350, 30), boca: MB(8, 24) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = MB_FORMAS, P = MB, GRIS = '#646b7b', CAJON = '#5b6272', ACERO = '#575d6b';
    pintar(ctx, F.tubo, ACERO, { brillo: 0.3 });
    pintar(ctx, MBF([[8, 36], [20, 34], [20, 48], [8, 46]]), '#4a505c');                                           // tapa del tubo
    pintar(ctx, F.canon, ACERO, { brillo: 0.45 });
    if (!sil) for (let x = 115; x < 305; x += 12) punto(ctx, ...P(x, 21), 0.18, '#22252b');                         // camisa perforada
    pintar(ctx, MBF([[93, 28], [110, 28], [110, 52], [93, 52]]), '#4a505c');                                       // abrazadera
    if (!sil) { ctx.beginPath(); ctx.arc(...P(94, 58), 0.45, 0, Math.PI * 2); ctx.strokeStyle = '#3a3e46'; ctx.lineWidth = 0.22; ctx.stroke(); }
    pintar(ctx, F.culata, GRIS, { mate: true, brillo: 0.14 });
    pintar(ctx, F.cantonera, '#3c414b', { mate: true });
    if (!sil) { ctx.beginPath(); ctx.arc(...P(578, 114), 0.4, 0, Math.PI * 2); ctx.strokeStyle = '#3a3e46'; ctx.lineWidth = 0.2; ctx.stroke(); }
    pintar(ctx, F.cajon, CAJON, { brillo: 0.3 });
    if (!sil) {
      ctx.fillStyle = '#121418'; ctx.fillRect(...P(375, 44), 40 * 0.162, 6 * 0.162);                                 // ventana de carga
      trazo(ctx, CAJON, 0.4, [P(392, 50), P(393, 60), P(402, 66), P(418, 66), P(424, 58), P(425, 50)]);              // guardamonte
      trazo(ctx, MAT.acero, 0.35, [P(405, 51), P(407, 62)]);
      trazo(ctx, 'rgba(255,255,255,0.12)', 0.3, [P(325, 19), P(430, 21)]);
    }
    pintar(ctx, Rc(...P(436, 17), 1.2, 0.6), '#3c414b');                                                          // seguro arriba
    // Bomba nervada: corre hacia atrás al bombear
    ctx.save(); ctx.translate(-e.bombeo * 9, 0);
    pintar(ctx, F.bomba, GRIS, { mate: true, brillo: 0.18 });
    if (!sil) for (let x = 166; x < 252; x += 8) trazo(ctx, 'rgba(20,24,32,0.45)', 0.35, [P(x, 31), P(x, 55)]);
    ctx.restore();
  } });
DIBUJO_ARMAS.mossberg.culataCm = 32;

// SPAS-12 (104 cm): culata metálica plegable con gancho, pistolete, cajón, protección perforada sobre el
// cañón, tubo del depósito, bomba
reemplazar('spas12', { casquillo: 'escopeta',
  anclas: { manoDelantera: [33, -2.4], cargador: [11, 1.5], corredera: [33, -2.6], expulsion: [11, -6.5], boca: [60.5, -5.6] },
  dibujarCm(ctx, e) {
    trazo(ctx, MAT.pavonado, 0.9, [[-2, -6.4], [-29, -6.0]]); trazo(ctx, MAT.pavonado, 0.9, [[-2.4, 0.2], [-28.4, 3.4]]);   // culata de varillas
    pintar(ctx, suave([[-30.6, -8.0], [-28.4, -7.6], [-28.2, 5.0], [-30.6, 5.4]], 0.6, 3), MAT.pavonado);
    pintar(ctx, suave([[-28.4, -7.6], [-24.4, -9.0], [-24.0, -8.0], [-27.6, -6.6]], 0.4, 2), MAT.pavonado);   // gancho del antebrazo
    pintar(ctx, suave([[-0.6, 1.4], [3.4, 1.4], [2.0, 10.6], [-2.6, 10.6], [-2.4, 4]], 0.8, 4), MAT.polimero, { mate: true });
    pintar(ctx, suave([[-2, -7], [22, -7], [22, 1.6], [-2, 1.6]], 0.6, 3), MAT.pavonado, { brillo: 0.25 });
    trazo(ctx, 'rgba(255,255,255,0.08)', 0.25, [[-1.6, -3.6], [21.6, -3.6]]);
    if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(7.4, -6.2, 6.6, 1.6); }
    guardamonteC(ctx, 3.4, 9.2, 1.6, 2.6, MAT.pavonado);
    pintar(ctx, [[4.6, 1.6], [5.4, 1.6], [5.6, 3.0], [5.0, 3.4], [4.6, 2.6]], MAT.acero);
    pintar(ctx, Rc(22, -6.4, 38.4, 1.6), MAT.pavonado);
    pintar(ctx, suave([[22, -8.4], [56, -8.4], [56.6, -6.4], [56, -4.2], [22, -4.2]], 1.2, 3), MAT.pavonado, { huecos: Array.from({ length: 9 }, (_, k) => Cc(25.2 + k * 3.6, -6.3, 0.9, 10)) });   // protección perforada
    pintar(ctx, Rc(22, -4.0, 32, 2.4), MAT.pavonado);
    pintar(ctx, suave([[57.2, -6.4], [57.6, -8.8], [58.6, -8.8], [59, -6.4]], 0.3, 2), MAT.pavonado);
    pintar(ctx, suave([[59.4, -6.8], [60.6, -6.8], [60.6, -4.6], [59.4, -4.6]], 0.3, 2), MAT.acero);
    bombaNervada(ctx, 25, -4.8, 17, 4.6, MAT.polimero, e.bombeo * 8);
  } });

// AA-12 (99 cm), calcada de una foto del modelo original de Atchisson: cuerpo negro recto de una pieza con la
// culata, ventana lateral, cañón fino que asoma adelante, guion, mira del medio y torre del alza, perilla de
// carga, cargador recto gris, pistolete y el guardamonte de alambre largo hasta el cargador. La foto muestra el
// lado izquierdo: AA la espeja y pasa píxeles a cm (0,172 por píxel, origen arriba del pistolete).
const AA = (x, y) => [(410 - x) * 0.172, (y - 118) * 0.172];
const AAF = pts => pts.map(p => AA(...p));
const AA_FORMAS = {
  cuerpo: suave(AAF([[128, 58], [575, 52], [588, 54], [591, 62], [590, 134], [582, 140], [440, 111], [428, 118], [350, 122], [348, 106], [300, 104], [130, 100]]), 0.6, 3),
  cantonera: AAF([[583, 52], [591, 55], [591, 136], [583, 139]]),
  ventana: suave(AAF([[160, 70], [270, 70], [272, 92], [160, 92]]), 0.4, 2),
  canon: suave(AAF([[15, 82], [128, 82], [128, 96], [15, 96]]), 0.3, 2),
  cargador: suave(AAF([[300, 104], [348, 104], [348, 212], [340, 228], [300, 228]]), 0.4, 2),
  pistolete: suave(AAF([[392, 110], [436, 108], [440, 140], [446, 172], [440, 190], [424, 192], [412, 165], [398, 140]]), 0.8, 3),   // nace dentro del cuerpo
};
reemplazar('aa12', { casquillo: 'escopeta',
  anclas: { manoDelantera: AA(230, 100), cargador: AA(325, 112), corredera: AA(135, 75), expulsion: AA(300, 70), boca: AA(15, 89) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = AA_FORMAS, P = AA, NEGRO = '#26272a', METAL = '#8a8d92';
    pintar(ctx, F.canon, METAL, { brillo: 0.5 });
    pintar(ctx, suave(AAF([[118, 78], [132, 78], [132, 100], [118, 100]]), 0.3, 2), '#5d6065');
    if (!e.sinCargador) {
      pintar(ctx, F.cargador, '#6b6e72', { mate: true, brillo: 0.18 });
      if (!sil) for (const x of [312, 324, 336]) trazo(ctx, 'rgba(0,0,0,0.22)', 0.3, [P(x, 112), P(x, 222)]);
    }
    pintar(ctx, F.cuerpo, NEGRO, { mate: true, brillo: 0.16 });
    pintar(ctx, F.cantonera, '#151617', { mate: true });
    pintar(ctx, F.ventana, '#141516', { brillo: 0.12 });
    if (!sil) { trazo(ctx, 'rgba(255,255,255,0.1)', 0.4, [P(140, 62), P(578, 57)]); trazo(ctx, 'rgba(0,0,0,0.4)', 0.2, [P(300, 104), P(350, 106)]); }
    pintar(ctx, F.pistolete, MAT.polimero, { mate: true }); punteado(ctx, F.pistolete, 0.45);
    if (!sil) {
      trazo(ctx, MAT.acero, 0.4, [P(380, 122), P(386, 140)]);                                                      // disparador
      trazo(ctx, '#b9bcc2', 0.22, [P(348, 207), P(402, 196), P(440, 190)]);                                        // guardamonte de alambre
    }
    // Guion, mira del medio y torre del alza (aletas de chapa con agujero), y la perilla de carga
    pintar(ctx, AAF([[126, 58], [131, 21], [138, 19], [143, 58]]), METAL, { huecos: [Cc(...P(135, 32), 0.35, 10)] });
    pintar(ctx, AAF([[268, 54], [275, 40], [284, 37], [285, 54]]), METAL);
    pintar(ctx, AAF([[404, 52], [407, 10], [422, 9], [427, 52]]), METAL, { huecos: [Cc(...P(415, 20), 0.45, 10)] });
    const dx = -e.corredera * 6;
    pintar(ctx, Cc(P(135, 75)[0] + dx, P(135, 75)[1], 0.85, 14), '#a7aab0', { brillo: 0.5 });
  } });
DIBUJO_ARMAS.aa12.culataCm = 31;

// Saiga-12 (110 cm): mecanismo AK con culata y guardamanos de polímero, cargador recto y ancho de 8,
// cañón grueso con bloque de gases y guion
reemplazar('saiga', { casquillo: 'escopeta',
  anclas: { manoDelantera: [36, -4.6], cargador: [10, -2.2], corredera: [19, -5.2], expulsion: [14, -7], boca: [64.5, -5.9] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-4.6, -6.8], [-38, -4.2], [-38.8, -3.8], [-38.8, 8.6], [-38, 8.8], [-9, 1.2], [-4.6, -1.8]], 0.9, 4), MAT.polimero, { mate: true });
    pintar(ctx, suave([[-1.2, -2.0], [2.8, -2.0], [1.6, 7.8], [-2.4, 7.8], [-2.8, 1.2]], 0.8, 4), MAT.polimero, { mate: true });
    guardamonteC(ctx, 3.2, 9.2, -2.2, 3.2, MAT.acero);
    pintar(ctx, [[4.2, -2.0], [5.0, -2.0], [5.2, -0.2], [4.6, 0.4], [4.2, -0.4]], MAT.acero);
    if (!e.sinCargador) { pintar(ctx, suave([[6.6, -2.2], [14.2, -2.2], [15.4, 12.4], [7.6, 13.2]], 0.6, 3), MAT.polimero, { mate: true }); trazo(ctx, 'rgba(255,255,255,0.08)', 0.3, [[8, 0], [9, 12]]); }
    pintar(ctx, suave([[-4.6, -2.0], [-4.6, -6.4], [-3.0, -7.8], [26, -7.8], [26, -2.0]], 0.5, 3), MAT.pavonado, { brillo: 0.25 });
    trazo(ctx, 'rgba(0,0,0,0.5)', 0.25, [[-4, -5.6], [25.6, -5.6]]);
    pintar(ctx, [[2.6, -4.2], [15.6, -5.0], [15.8, -4.2], [2.8, -3.6]], MAT.acero);
    if (!Pincel.silueta) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(10.4, -5.2, 7.4, 1.2); }
    pintar(ctx, suave([[27, -7.6], [46, -7.4], [46.6, -4.4], [44, -3.0], [27, -3.0]], 1.0, 4), MAT.polimero, { mate: true });
    rayas(ctx, 29, 44, -7.0, -3.6, 1.6, 'rgba(255,255,255,0.06)', 0.4);
    pintar(ctx, suave([[44, -9.8], [47.6, -9.8], [47.6, -7.0], [44, -7.0]], 0.4, 2), MAT.pavonado);
    pintar(ctx, Rc(46, -7.2, 18.6, 2.4), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, [[60.4, -7.2], [61, -10.0], [62.2, -10.0], [62.8, -7.2]], MAT.pavonado);
    pintar(ctx, suave([[16.4 - e.corredera * 8, -6.2], [19.4 - e.corredera * 8, -6.2], [19.4 - e.corredera * 8, -4.6], [16.4 - e.corredera * 8, -4.6]], 0.4, 2), MAT.acero);
  } });

// Benelli M4 (101 cm), calcada de una foto: culata telescópica con la cantonera de ventana, carrillera en punta
// y tubo, pistolete nervado, cajón negro con riel y alza fantasma, ventana con la manija de carga, guardamonte,
// guardamanos con estrías, cañón, tubo del depósito con su tapa, abrazadera, argolla y guion fantasma.
// BM4 pasa píxeles de la foto a cm (0,137 cm por píxel) con el origen arriba del pistolete.
const BM4 = (x, y) => [(x - 245) * 0.137, (y - 74) * 0.137];
const BM4F = pts => pts.map(p => BM4(...p));
const BM4_FORMAS = {
  cantonera: suave(BM4F([[5, 63], [48, 59], [50, 128], [42, 147], [10, 151]]), 0.6, 3),
  culata: suave(BM4F([[46, 60], [160, 46], [168, 49], [150, 58], [105, 76], [228, 55], [233, 63], [180, 80], [150, 95], [100, 118], [46, 145]]), 0.5, 3),   // cuerpo que se afina en el tubo
  cajon: suave(BM4F([[228, 52], [255, 40], [262, 28], [290, 28], [410, 28], [412, 72], [330, 72], [300, 76], [262, 82], [232, 68]]), 0.5, 3),
  alza: BM4F([[262, 28], [268, 14], [286, 14], [292, 28]]),
  pistolete: suave(BM4F([[206, 72], [258, 74], [262, 82], [250, 105], [240, 135], [246, 150], [200, 145], [198, 138], [204, 110]]), 0.7, 4),
  canon: BM4F([[410, 27], [735, 29], [742, 27], [742, 43], [735, 42], [410, 42]]),
  tubo: suave(BM4F([[552, 46], [742, 48], [742, 70], [552, 71]]), 0.6, 3),
  guardamanos: suave(BM4F([[410, 40], [555, 42], [557, 72], [410, 74]]), 0.8, 3),
  guion: suave(BM4F([[706, 28], [708, 14], [712, 10], [722, 10], [726, 14], [728, 28]]), 0.2, 2),
};
reemplazar('benelli', { casquillo: 'escopeta',
  anclas: { manoDelantera: BM4(480, 72), cargador: BM4(360, 74), corredera: BM4(396, 40), expulsion: BM4(350, 40), boca: BM4(742, 35) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = BM4_FORMAS, P = BM4, NEGRO = '#232427';
    pintar(ctx, F.culata, MAT.polimero, { mate: true });
    if (!sil) { trazo(ctx, 'rgba(255,255,255,0.1)', 0.3, [P(110, 80), P(226, 58)]); trazo(ctx, 'rgba(0,0,0,0.5)', 0.15, [P(150, 58), P(70, 80)]); }
    pintar(ctx, F.cantonera, MAT.polimero, { mate: true, huecos: [BM4F([[34, 70], [46, 68], [46, 96], [34, 98]])] });
    punto(ctx, ...P(40, 122), 0.4, '#0a0a0c');
    pintar(ctx, F.pistolete, MAT.polimero, { mate: true });
    if (!sil) for (let k = 0; k < 7; k++) trazo(ctx, 'rgba(255,255,255,0.08)', 0.2, [P(210 - k * 1.6, 90 + k * 7.5), P(250 - k * 1.6, 92 + k * 7.5)]);
    pintar(ctx, F.canon, MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, F.tubo, MAT.pavonado, { brillo: 0.35 });
    pintar(ctx, suave(BM4F([[715, 47], [742, 47], [742, 71], [715, 71]]), 0.5, 2), '#1a1b1e');                     // tapa del tubo
    pintar(ctx, F.guardamanos, MAT.polimero, { mate: true });
    if (!sil) for (const y of [50, 58, 66]) trazo(ctx, 'rgba(0,0,0,0.55)', 0.22, [P(420, y), P(548, y + 1)]);
    pintar(ctx, suave(BM4F([[554, 43], [566, 43], [566, 73], [554, 73]]), 0.3, 2), NEGRO);                         // abrazadera
    if (!sil) { ctx.beginPath(); ctx.arc(...P(568, 80), 0.5, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.25; ctx.stroke(); }
    pintar(ctx, F.guion, NEGRO, { huecos: [Cc(...P(717, 19), 0.35, 10)] });
    // Cajón con riel, alza fantasma, ventana y manija de carga
    pintar(ctx, F.cajon, NEGRO, { brillo: 0.3 });
    pintar(ctx, BM4F([[305, 20], [410, 20], [410, 28], [305, 28]]), MAT.pavonado);
    if (!sil) for (let x = 308; x < 408; x += 7) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(...P(x, 20), 3 * 0.137, 5 * 0.137); }
    pintar(ctx, F.alza, NEGRO, { huecos: [Cc(...P(277, 22), 0.4, 10)] });
    if (!sil) {
      ctx.fillStyle = '#0a0a0c'; ctx.fillRect(...P(300, 36), 95 * 0.137, 6 * 0.137);                                // ventana
      trazo(ctx, NEGRO, 0.45, [P(268, 74), P(268, 86), P(275, 92), P(298, 92), P(304, 82), P(304, 74)]);              // guardamonte
      trazo(ctx, MAT.acero, 0.4, [P(283, 76), P(287, 88)]);
    }
    const dx = -e.corredera * 5;
    pintar(ctx, suave(BM4F([[388, 33], [403, 33], [404, 47], [388, 47]]).map(([x, y]) => [x + dx, y]), 0.3, 2), MAT.acero);   // manija de carga
  } });
DIBUJO_ARMAS.benelli.culataCm = 33;

// Remington 870 Express (97 cm), calcada de una foto: culata y semipistolete sintéticos negros con cantonera,
// cajón negro con la ventana, guardamonte, cañón con la perla, tubo del depósito con tapa y bomba nervada.
// R870 pasa píxeles de la foto a cm (0,18 por píxel) con el origen arriba del pistolete.
const R870 = (x, y) => [(x - 195) * 0.18, (y - 48) * 0.18];
const R870F = pts => pts.map(p => R870(...p));
const R870_FORMAS = {
  culata: suave(R870F([[8, 48], [60, 44], [128, 36], [150, 40], [175, 28], [196, 20], [198, 48], [185, 54], [168, 64], [158, 80], [148, 82], [120, 84], [12, 118]]), 1.0, 4),
  cantonera: suave(R870F([[3, 48], [11, 47], [15, 118], [6, 120]]), 0.4, 2),
  cajon: suave(R870F([[196, 15], [212, 12], [300, 12], [301, 47], [285, 48], [198, 48]]), 0.5, 3),
  canon: R870F([[300, 13], [546, 12], [548, 14], [548, 21], [300, 23]]),
  tubo: suave(R870F([[300, 27], [470, 27], [472, 41], [300, 41]]), 0.5, 2),
  bomba: suave(R870F([[326, 27], [455, 26], [459, 37], [455, 49], [330, 50], [324, 40]]), 0.9, 3),
};
reemplazar('rem870', { casquillo: 'escopeta',
  anclas: { manoDelantera: R870(390, 49), cargador: R870(250, 47), corredera: R870(390, 49), expulsion: R870(270, 24), boca: R870(548, 17) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = R870_FORMAS, P = R870, NEGRO = '#25262a';
    pintar(ctx, F.tubo, MAT.pavonado, { brillo: 0.3 });
    pintar(ctx, F.canon, MAT.pavonado, { brillo: 0.45 });
    punto(ctx, ...P(541, 10), 0.25, '#d9d2c0');                                                               // perla
    pintar(ctx, F.culata, NEGRO, { mate: true, brillo: 0.14 });
    pintar(ctx, F.cantonera, '#151617', { mate: true });
    pintar(ctx, F.cajon, NEGRO, { brillo: 0.3 });
    if (!sil) {
      ctx.fillStyle = '#0d0e10'; ctx.beginPath(); ctx.ellipse(...P(270, 25), 3.4, 0.7, 0, 0, Math.PI * 2); ctx.fill();   // ventana
      trazo(ctx, NEGRO, 0.4, [P(201, 48), P(202, 56), P(209, 61), P(222, 61), P(227, 54), P(227, 48)]);              // guardamonte
      trazo(ctx, MAT.acero, 0.35, [P(212, 49), P(214, 58)]);
    }
    ctx.save(); ctx.translate(-e.bombeo * 9, 0);
    pintar(ctx, R870F([[300, 30], [330, 30], [330, 38], [300, 38]]), '#1a1b1e');                // barras de acción
    pintar(ctx, F.bomba, NEGRO, { mate: true, brillo: 0.16 });
    if (!sil) for (let y = 32; y < 48; y += 3.5) trazo(ctx, 'rgba(0,0,0,0.5)', 0.18, [P(340, y), P(448, y)]);
    ctx.restore();
  } });
DIBUJO_ARMAS.rem870.culataCm = 34;

// Winchester 1887 (101 cm): cajón grande de bloque redondeado, palanca con lazo, culata de cuello recto,
// fuste corto, tubo del depósito y cañón largo
reemplazar('winchester1887', { casquillo: 'escopeta',
  anclas: { manoDelantera: [30, -1.8], cargador: [14, -1], corredera: [-6, 4], expulsion: [10, -7], boca: [68, -5.5] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-34, -6.0], [-4, -5.0], [0, -5.0], [0, 2.2], [-6, 2.6], [-20, 6.2], [-34, 8.6]], 0.9, 4), MAT.madera);
    pintar(ctx, suave([[-35, -6.2], [-34, -6.2], [-34, 8.8], [-35, 8.6]], 0.3, 2), MAT.acero);
    pintar(ctx, suave([[0, -5.6], [2.4, -7.6], [6.6, -8.0], [21, -8.0], [21, 2.6], [0, 2.6]], 1.0, 4), MAT.pavonado, { brillo: 0.4 });   // cajón
    trazo(ctx, 'rgba(255,255,255,0.1)', 0.25, [[2, -6.4], [20.6, -6.6]]);
    tornillo(ctx, 5, -2); tornillo(ctx, 17, -4);
    if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(11, -1.8, 5, 1.6); }
    pintar(ctx, suave([[-1, -6.6], [-2.6, -8.8], [-1.2, -9.0], [1, -6.8]], 0.3, 2), MAT.pavonado);         // martillo
    pintar(ctx, Rc(21, -6.4, 47, 1.8), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, Rc(21, -4.4, 40, 2.0), MAT.pavonado);
    pintar(ctx, suave([[21, -4.6], [38, -4.6], [38.8, -3.0], [38, -1.6], [21, -1.4]], 0.8, 3), MAT.madera);
    pintar(ctx, suave([[60, -4.6], [61.4, -4.6], [61.4, -2.0], [60, -2.0]], 0.3, 2), MAT.pavonado);
    punto(ctx, 67.4, -6.9, 0.4, '#e0d8c0');
    ctx.save(); ctx.translate(15, 2.4); ctx.rotate(e.palanca * 0.9);
    if (!Pincel.silueta) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, 0.4); ctx.quadraticCurveTo(-17.6, 0.8, -16.8, 3.8); ctx.quadraticCurveTo(-15.8, 7.0, -10.8, 6.8); ctx.quadraticCurveTo(-6.4, 6.6, -6, 2.8); ctx.lineTo(-3, 2.2);
      ctx.strokeStyle = MAT.pavonado; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.25; ctx.stroke();
    } else { ctx.fillStyle = Pincel.silueta; ctx.fillRect(-16, 0, 14, 6.6); }
    ctx.restore();
  } });

/* ======================= ESPECIALES ======================= */

// M79 (73 cm), calcado de un dibujo: culata de madera con la caída hacia el pistolete y almohadilla negra,
// báscula de acero con la palanca de apertura negra arriba, cañón de aluminio de 40 mm, chapa inferior con el
// perno, delantera de madera, alza de escalera levantada con su abrazadera, guion, guardamonte, seguro y argolla.
// Sin verde. M79 pasa píxeles del dibujo (enderezado) a cm: 0,0811 por píxel, origen arriba del pistolete.
const M79 = (x, y) => [(x - 420) * 0.0811, (y - 248) * 0.0811];
const M79F = pts => pts.map(p => M79(...p));
const M79_BISAGRA = M79(545, 256);
const M79_FORMAS = {
  culata: suave(M79F([[38, 138], [82, 138], [98, 150], [118, 170], [250, 190], [295, 210], [318, 222], [345, 212], [372, 196], [398, 180], [420, 175], [452, 175], [452, 262], [400, 262], [370, 270], [345, 292], [325, 302], [310, 296], [300, 284], [250, 284], [150, 288], [40, 293]]), 1.2, 4),
  almohadilla: suave(M79F([[10, 140], [40, 138], [41, 293], [12, 295]]), 0.6, 3),
  bascula: suave(M79F([[450, 172], [546, 172], [546, 262], [450, 262]]), 0.5, 3),
  palanca: suave(M79F([[465, 165], [520, 165], [546, 178], [465, 178]]), 0.3, 2),
  canon: suave(M79F([[543, 177], [905, 176], [911, 182], [911, 228], [905, 233], [543, 233]]), 0.8, 3),
  chapa: M79F([[543, 232], [645, 232], [645, 262], [543, 262]]),
  delantera: suave(M79F([[640, 224], [800, 222], [806, 232], [801, 262], [640, 262]]), 1.0, 4),
};
reemplazar('m79', { casquillo: null, casquilloVaciado: 'granada40',
  anclas: { manoDelantera: M79(720, 262), cargador: M79(545, 205), corredera: M79(500, 166), expulsion: M79(545, 205), boca: M79(911, 205) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = M79_FORMAS, P = M79, ACERO = '#8d939a', ALU = '#aab0b8', [bx, by] = M79_BISAGRA;
    pintar(ctx, F.culata, MAT.maderaClara, { lustre: true });
    pintar(ctx, F.almohadilla, '#151515', { mate: true });
    if (!sil) {
      trazo(ctx, MAT.pavonado, 0.45, [P(405, 266), P(404, 286), P(412, 298), P(432, 299), P(441, 288), P(442, 266)]);   // guardamonte
      trazo(ctx, MAT.acero, 0.4, [P(422, 266), P(426, 286)]);
    }
    pintar(ctx, suave(M79F([[468, 268], [492, 268], [492, 280], [468, 280]]), 0.2, 2), ACERO);                        // seguro
    pintar(ctx, suave(M79F([[395, 175], [412, 172], [414, 190], [398, 192]]), 0.3, 2), ACERO);                        // traba de atrás
    const abierta = e.abierto > 0.03;
    const bascula = () => {
      pintar(ctx, F.bascula, ACERO, { brillo: 0.45 });
      pintar(ctx, F.palanca, '#1d1e21', { brillo: 0.3 });
      punto(ctx, ...P(458, 252), 0.3, '#4a4f55');
    };
    if (abierta) bascula();
    ctx.save(); ctx.translate(bx, by); ctx.rotate(e.abierto * 0.6); ctx.translate(-bx, -by);
    pintar(ctx, F.canon, ALU, { brillo: 0.55 });
    if (!sil) { trazo(ctx, 'rgba(255,255,255,0.45)', 0.5, [P(550, 196), P(900, 196)]); trazo(ctx, 'rgba(40,44,50,0.35)', 0.4, [P(550, 226), P(900, 226)]); }
    pintar(ctx, suave(M79F([[888, 150], [904, 160], [904, 177], [888, 177]]), 0.2, 2), '#2a2c30');                   // guion
    pintar(ctx, F.chapa, ACERO, { brillo: 0.3, huecos: [M79F([[597, 233], [640, 233], [640, 250], [597, 250]])] });
    punto(ctx, ...P(598, 252), 0.3, '#4a4f55');
    pintar(ctx, F.delantera, MAT.maderaClara, { lustre: true });
    if (!sil) { ctx.beginPath(); ctx.arc(...P(728, 268), 0.5, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.25; ctx.stroke(); }
    // Alza de escalera levantada: abrazadera negra alrededor del cañón y la escalera con sus perillas
    pintar(ctx, M79F([[712, 175], [721, 175], [721, 233], [712, 233]]), '#1d1e21');
    pintar(ctx, suave(M79F([[698, 152], [726, 152], [726, 172], [698, 172]]), 0.25, 2), '#2a2c30');
    if (!sil) { trazo(ctx, '#2a2c30', 0.32, [P(705, 18), P(705, 152)]); trazo(ctx, '#2a2c30', 0.32, [P(709, 18), P(709, 152)]); }
    punto(ctx, ...P(707, 15), 0.45, '#2a2c30'); punto(ctx, ...P(707, 57), 0.4, '#2a2c30');
    if (abierta && !sil) { ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.ellipse(...P(545, 205), 0.6, 2.0, 0, 0, Math.PI * 2); ctx.fill(); }   // recámara a la vista
    ctx.restore();
    if (!abierta) bascula();
  } });
DIBUJO_ARMAS.m79.culataCm = 33;
DIBUJO_ARMAS.m79.moviles = {
  manoDelantera: e => girarCm(...M79(720, 262), ...M79_BISAGRA, e.abierto * 0.6),
  cargador: e => girarCm(...M79(545, 205), ...M79_BISAGRA, e.abierto * 0.6),
};

// Bazuca M9 (155 cm): tubo de 60 mm en dos tramos con su unión, aro trasero acampanado (por ahí entra el
// cohete), apoyo de hombro de madera, empuñadura con el disparador y empuñadura delantera, caja de la
// mira, contactos eléctricos y refuerzo de la boca
reemplazar('bazuca', { casquillo: null,
  anclas: { manoDelantera: [18, 3.4], cargador: [-72, -4], corredera: [-72, -4], expulsion: [-76, -4], boca: [80.5, -4] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[-26, -1.0], [-6, -1.0], [-7.6, 4.4], [-24, 4.8]], 0.8, 3), MAT.madera);              // apoyo de hombro
    pintar(ctx, suave([[-0.6, -0.8], [3.2, -0.8], [2.0, 8.8], [-2.2, 8.8], [-2.0, 3]], 0.8, 4), MAT.madera);
    guardamonteC(ctx, 3.2, 8.4, -0.8, 2.8, MAT.oliva);
    pintar(ctx, [[4.4, -0.8], [5.2, -0.8], [5.4, 0.8], [4.8, 1.2], [4.4, 0.4]], MAT.acero);
    pintar(ctx, suave([[16.2, -0.8], [20.2, -0.8], [19.8, 8.2], [16.6, 8.2]], 0.8, 3), MAT.madera);
    pintar(ctx, suave([[-74, -7.4], [80, -7.4], [80, -0.8], [-74, -0.8]], 2.6, 5), MAT.oliva, { mate: true, brillo: 0.25 });   // tubo
    trazo(ctx, 'rgba(255,255,255,0.12)', 0.4, [[-70, -6.4], [78, -6.4]]);
    pintar(ctx, suave([[-78.4, -9.0], [-74, -7.8], [-74, -0.4], [-78.4, 0.8]], 0.8, 3), MAT.acero);       // aro trasero acampanado
    if (!e.sinCargador && !Pincel.silueta) { ctx.fillStyle = '#2b2d22'; ctx.fillRect(-78.2, -6.4, 1.4, 4.8); }
    pintar(ctx, suave([[-1.4, -8.2], [1.4, -8.2], [1.4, 0], [-1.4, 0]], 0.4, 2), MAT.acero);               // unión de los dos tramos
    for (const x of [-0.6, 0.6]) tornillo(ctx, x, -4.2, 0.24);
    pintar(ctx, suave([[76, -8.4], [80.6, -8.4], [80.6, 0.6], [76, 0.6]], 1.2, 3), MAT.oliva);              // refuerzo de la boca
    pintar(ctx, suave([[8, -11.6], [17, -11.6], [17, -7.4], [8, -7.4]], 0.6, 3), MAT.oliva);                // caja de la mira
    pintar(ctx, Rc(16.2, -13.0, 1.2, 1.6), MAT.acero); punto(ctx, 9.4, -9.6, 0.5, '#6fa8c8');
    pintar(ctx, suave([[-68, -8.6], [-64, -8.6], [-64, -7.4], [-68, -7.4]], 0.3, 2), MAT.acero);            // contacto eléctrico
    trazo(ctx, '#2a2620', 0.35, [[-66, -8.4], [-40, -9.4], [-10, -9.0], [6, -8.0]]);                        // cable
    if (!Pincel.silueta) for (const x of [-50, 50]) { ctx.beginPath(); ctx.ellipse(x, -0.2, 1.0, 0.9, 0, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.35; ctx.stroke(); }   // argollas
  } });

// RPG-7 (95 cm el tubo; con la granada cargada 123 cm): tubo de 40 mm, tobera trasera acampanada, protectores
// térmicos de madera adelante y atrás con sus abrazaderas, mecanismo de disparo con guardamonte y pistolete,
// alza plegada y guion, mira óptica PGO-7 en su montura lateral con ocular de goma, y la granada PG-7V que asoma
// por la boca (motor oscuro, cabeza verde con banda amarilla y espoleta). Disparada, el tubo queda vacío.
reemplazar('rpg7', { casquillo: null,
  anclas: { manoDelantera: [17, -0.6], cargador: [37, -4], corredera: [37, -4], expulsion: [-58, -4], boca: [64, -4] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, T = '#3b3e3a', M = MAT.madera;
    pintar(ctx, suave([[-46, -6.3], [-55.6, -8.4], [-58.4, -8.8], [-58.4, 0.8], [-55.6, 0.4], [-46, -1.7]], 0.5, 3), T, { brillo: 0.35 });   // tobera
    pintar(ctx, suave(Rc(-59.2, -9.2, 1.2, 10.4), 0.4, 2), T);
    pintar(ctx, Rc(-46, -6.0, 83, 4.0), T, { brillo: 0.45 });                                                 // tubo
    trazo(ctx, 'rgba(255,255,255,0.14)', 0.3, [[-45, -5.1], [36, -5.1]]);
    // Protector térmico trasero, mecanismo y pistolete
    pintar(ctx, suave([[-22, -7.0], [-5.6, -7.0], [-4.8, -6.2], [-4.8, -1.8], [-5.6, -1.0], [-22, -1.0], [-22.8, -1.8], [-22.8, -6.2]], 0.8, 3), M);
    for (const x of [-23.4, -5.0]) pintar(ctx, suave(Rc(x, -7.2, 0.9, 6.4), 0.3, 2), T);
    pintar(ctx, suave([[-3.4, -2.0], [9.2, -2.0], [9.2, 0.6], [6.8, 1.0], [-2.0, 1.0], [-3.4, 0.0]], 0.4, 2), T);   // mecanismo de disparo
    tornillo(ctx, -1.6, -0.6, 0.3); tornillo(ctx, 7.6, -0.8, 0.3);
    guardamonteC(ctx, 1.6, 7.6, 0.6, 2.8, T);
    pintar(ctx, [[3.0, 0.6], [3.8, 0.6], [4.0, 2.2], [3.4, 2.7], [3.0, 1.8]], MAT.acero);
    const grip = suave([[-1.0, 0.6], [2.2, 0.6], [1.2, 9.2], [-2.6, 9.2], [-2.6, 3.0]], 0.8, 4);
    pintar(ctx, grip, '#3a2418', { brillo: 0.25 });
    for (const y of [3.4, 5.0, 6.6]) trazo(ctx, 'rgba(0,0,0,0.35)', 0.22, [[-2.2, y], [1.4, y - 0.2]]);
    // Protector térmico delantero y abrazaderas
    pintar(ctx, suave([[9.6, -7.2], [30.2, -7.0], [31.2, -6.0], [31.2, -2.0], [30.2, -1.0], [9.6, -0.8], [8.8, -1.8], [8.8, -6.2]], 0.8, 3), M);
    for (const x of [8.4, 30.8]) pintar(ctx, suave(Rc(x, -7.4, 0.9, 6.8), 0.3, 2), T);
    // Alza plegada, guion, refuerzo de la boca y argollas
    pintar(ctx, suave([[2.0, -6.0], [6.0, -6.0], [5.6, -6.9], [2.4, -6.8]], 0.2, 2), T);
    pintar(ctx, [[33.0, -6.0], [33.4, -8.2], [34.0, -8.2], [34.4, -6.0]], T);
    pintar(ctx, suave(Rc(35.4, -6.4, 1.8, 4.8), 0.4, 2), T);
    if (!sil) for (const [x, y] of [[-30, -1.0], [24, -0.2]]) { ctx.beginPath(); ctx.ellipse(x, y + 0.9, 0.9, 0.8, 0, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.3; ctx.stroke(); }
    // Mira PGO-7 sobre la montura lateral
    pintar(ctx, suave([[-4.8, -10.4], [6.4, -10.4], [6.4, -7.6], [5.0, -6.0], [-3.4, -6.0], [-4.8, -7.6]], 0.4, 2), '#2b2d2b');
    pintar(ctx, suave([[-7.6, -14.6], [10.4, -14.6], [11.4, -13.6], [11.4, -10.6], [10.4, -10.0], [-7.6, -10.0]], 0.5, 3), '#313430', { brillo: 0.35 });
    pintar(ctx, suave(Rc(11.2, -14.2, 2.8, 3.8), 0.4, 2), '#313430');
    pintar(ctx, suave(Rc(0.4, -16.0, 2.4, 1.6), 0.3, 2), '#313430'); rayas(ctx, 0.8, 2.4, -15.8, -14.6, 0.4, 'rgba(255,255,255,0.12)', 0.1);
    pintar(ctx, Cc(5.6, -12.3, 0.85, 12), '#262826');
    pintar(ctx, suave([[-7.6, -14.4], [-11.4, -15.2], [-11.8, -14.6], [-11.8, -9.8], [-7.6, -10.2]], 0.6, 3), MAT.goma);
    if (!sil) { const g = ctx.createLinearGradient(0, -14.2, 0, -10.4); g.addColorStop(0, '#9fd2f0'); g.addColorStop(1, '#1d4c6c'); ctx.fillStyle = g; ctx.fillRect(13.7, -13.8, 0.35, 3.0); }
    // Granada PG-7V (sólo mientras está cargada)
    if (!e.sinCargador) {
      pintar(ctx, Rc(37.2, -5.8, 3.6, 3.6), '#2e302c');
      pintar(ctx, suave([[40.6, -5.6], [43.8, -8.2], [52.6, -8.2], [61.2, -5.2], [61.2, -2.8], [52.6, 0.2], [43.8, 0.2], [40.6, -2.4]], 0.5, 3), MAT.oliva, { brillo: 0.35 });
      trazo(ctx, 'rgba(0,0,0,0.3)', 0.2, [[44.2, -8.0], [44.2, 0.0]]); trazo(ctx, 'rgba(0,0,0,0.3)', 0.2, [[52.6, -8.0], [52.6, 0.0]]);
      trazo(ctx, '#d6c36a', 0.5, [[47.4, -8.1], [47.4, 0.1]]);
      pintar(ctx, suave([[61.2, -4.8], [63.4, -4.6], [64.0, -4.0], [63.4, -3.4], [61.2, -3.2]], 0.3, 2), '#1d1e1c');
    }
  } });

// Granada M67: cuerpo esférico de acero verde con su costura, espoleta, cuchara y anilla con el pasador
reemplazar('granadas', { casquillo: null,
  anclas: { manoDelantera: [1, 1.5], cargador: [1, 1.5], corredera: [1, 1.5], expulsion: [0, 0], boca: [5, -2] },
  dibujarCm(ctx, e) {
    if (e.sinCargador) return;
    pintar(ctx, Cc(2.6, -0.4, 3.2, 28), '#4a5a2c', { brillo: 0.4 });
    trazo(ctx, 'rgba(0,0,0,0.35)', 0.22, [[-0.5, -0.6], [5.7, -0.6]]);                                     // costura
    if (!Pincel.silueta) { ctx.fillStyle = '#d9c24a'; ctx.font = '0.9px sans-serif'; ctx.fillText('M67', 1.4, 1.2); }
    pintar(ctx, suave([[1.4, -5.4], [3.8, -5.4], [3.8, -3.4], [1.4, -3.4]], 0.4, 2), '#3a3c40');           // espoleta
    pintar(ctx, suave([[1.8, -5.0], [4.0, -5.2], [5.2, -3.4], [5.8, 0.6], [5.2, 1.6], [4.6, 1.2], [4.8, -2.4], [3.0, -3.8]], 0.4, 3), MAT.acero, { brillo: 0.4 });   // cuchara
    if (!Pincel.silueta) { ctx.beginPath(); ctx.arc(0.2, -5.4, 1.1, 0, Math.PI * 2); ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 0.32; ctx.stroke(); trazo(ctx, '#c8c8c8', 0.25, [[1.2, -5.0], [2.6, -4.6]]); }   // anilla
  } });

// Láser alienígena: cuerpo orgánico violeta con nervaduras, bobinas que brillan, emisor de tres puntas y
// celda de energía a la vista
reemplazar('laser', { casquillo: null,
  anclas: { manoDelantera: [22, 1.2], cargador: [8, 4.4], corredera: [2, -6], expulsion: [0, 0], boca: [37, -3] },
  dibujarCm(ctx, e) {
    const V = MAT.violeta, oscuro = ajustarColor(V, -0.3);
    pintar(ctx, suave([[-18, -6.0], [-6, -8.4], [-1, -7.6], [-1, 1.2], [-5, 1.6], [-14, 4.6], [-18.6, 3.0]], 1.6, 5), V);   // culata orgánica
    pintar(ctx, suave([[-13, -4.0], [-6, -5.4], [-5, -1.6], [-12, 1.0]], 1.2, 4), oscuro);                   // hueco nervado
    pintar(ctx, suave([[-0.6, 0.8], [3.4, 0.8], [2.0, 9.2], [-2.6, 9.2], [-2.4, 3]], 1.0, 4), oscuro);
    pintar(ctx, suave([[-2, -8.2], [24, -8.8], [31, -6.4], [31.4, -0.4], [26, 1.8], [-2, 1.8]], 1.8, 5), V, { brillo: 0.45 });   // cuerpo
    if (!Pincel.silueta) for (let x = 3; x < 22; x += 2.6) { ctx.strokeStyle = 'rgba(30,15,50,0.55)'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(x, -8.2); ctx.quadraticCurveTo(x + 1.2, -3.4, x, 1.6); ctx.stroke(); }   // nervaduras
    // Emisor de tres puntas
    for (const [dy, l] of [[-5.6, 6], [-3.0, 7], [-0.4, 6]]) pintar(ctx, suave([[31, dy - 0.6], [31 + l, dy - 0.2], [31 + l, dy + 0.2], [31, dy + 0.6]], 0.3, 2), oscuro);
    if (!Pincel.silueta) {
      ctx.save(); ctx.shadowColor = MAT.verde; ctx.shadowBlur = 4; ctx.fillStyle = MAT.verde;
      ctx.fillRect(2, -6.6, 22, 0.55); ctx.fillRect(4, -2.4, 16, 0.45);
      for (let x = 24.6; x < 30.6; x += 1.4) { ctx.beginPath(); ctx.ellipse(x, -3.2, 0.35, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }   // bobinas
      ctx.beginPath(); ctx.arc(36.6, -3.0, 0.6, 0, Math.PI * 2); ctx.fill();
      if (!e.sinCargador) { ctx.beginPath(); ctx.arc(8, 4.4, 2.0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#1d5a12'; ctx.lineWidth = 0.4; ctx.stroke(); }
      ctx.restore();
    }
  } });

/* ======================= ARMAS DE PALANCA (medidas sobre foto de un Winchester de palanca) ======================= */
// Palanca integrada: placa gruesa pegada bajo el cajón desde el pivote, lazo chico que rodea el disparador
// y lazo para los dedos justo debajo de la garganta de la culata. Gira sobre el pivote al accionarla.
function palancaLazo(ctx, e, px, py, base) {
  ctx.save(); ctx.translate(px, py); ctx.rotate(e.palanca * 0.95); ctx.translate(-px, -py);
  pintar(ctx, suave([[px + 0.6, base - 0.2], [px + 0.6, base + 1.1], [4.4, base + 1.3], [3.4, base + 0.1]], 0.4, 2), MAT.pavonado, { brillo: 0.35 });   // placa
  pintar(ctx, Cc(px, py, 0.45, 10), MAT.acero);                                                              // pivote
  if (Pincel.silueta) { ctx.fillStyle = Pincel.silueta; ctx.fillRect(-7.6, base + 1.8, 12, 5.4); ctx.restore(); return; }
  ctx.beginPath();
  ctx.moveTo(4.4, base + 1.2); ctx.quadraticCurveTo(3.6, base + 3.6, 1.2, base + 3.3); ctx.lineTo(-0.2, base + 2.5);   // lazo del disparador
  ctx.lineTo(-1.2, base + 2.0); ctx.lineTo(-6.2, base + 2.0); ctx.quadraticCurveTo(-7.6, base + 2.0, -7.6, base + 3.4);
  ctx.lineTo(-7.6, base + 5.6); ctx.quadraticCurveTo(-7.6, base + 7.0, -6.2, base + 7.0); ctx.lineTo(-1.8, base + 7.0);
  ctx.quadraticCurveTo(-0.6, base + 7.0, -0.6, base + 5.6); ctx.lineTo(-0.2, base + 2.5);                    // lazo para los dedos
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#121316'; ctx.lineWidth = 1.15; ctx.stroke();
  ctx.strokeStyle = MAT.pavonado; ctx.lineWidth = 0.85; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 0.22; ctx.stroke();
  ctx.restore();
}

// Winchester 1894 (96 cm): culata de nogal de garganta recta con caída, cajón bajo con la ventana de carga y
// el cerrojo a la vista, martillo, palanca integrada, fuste sobre el tubo de balas, abrazaderas, alza y guion
reemplazar('winchester1894', { casquillo: 'bala',
  anclas: { manoDelantera: [23, -1.4], cargador: [10.6, -2.4], corredera: [-4, 4.6], expulsion: [6, -5.4], boca: [64, -4.7] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[0, -4.6], [-2.2, -3.8], [-8, -1.6], [-31.8, 0.6], [-32.2, 1.4], [-32.2, 12.2], [-31.4, 12.6], [-10, 3.2], [-6, 1.8], [-2.6, 1.2], [0, -0.2]], 0.9, 4), MAT.maderaClara);   // culata
    pintar(ctx, suave([[-33, 0.6], [-32, 0.6], [-32, 12.6], [-33, 12.4]], 0.3, 2), MAT.pavonado);             // cantonera
    pintar(ctx, Rc(1.0, -0.3, 0.9, 2.3), MAT.acero);                                                          // disparador
    palancaLazo(ctx, e, 13, 0.4, -0.2);
    pintar(ctx, suave([[0, -0.3], [0, -4.8], [1.2, -5.4], [14, -5.4], [14, 0], [12.4, 0.2], [0, -0.3]], 0.6, 3), MAT.pavonado, { brillo: 0.4 });   // cajón
    if (!Pincel.silueta) { ctx.fillStyle = '#9aa0a8'; ctx.fillRect(3.2, -4.8, 4.2, 0.7); ctx.fillStyle = '#0a0a0c'; ctx.fillRect(9.2, -2.6, 3.6, 0.9); }   // cerrojo y ventana de carga
    tornillo(ctx, 2.0, -2.2, 0.26); tornillo(ctx, 11.8, -4.2, 0.24);
    pintar(ctx, suave([[0.2, -4.8], [-0.4, -6.6], [0.6, -7.0], [1.6, -5.2]], 0.3, 2), MAT.pavonado);       // martillo
    pintar(ctx, Rc(14, -5.4, 50, 1.4), MAT.pavonado, { brillo: 0.45 });                                       // cañón
    pintar(ctx, Rc(14, -3.8, 48.6, 1.6), MAT.pavonado, { brillo: 0.35 });                                    // tubo de balas
    pintar(ctx, suave([[14, -4.4], [31.6, -4.4], [31.6, -1.6], [14, -1.6]], 0.6, 3), MAT.maderaClara);       // fuste
    pintar(ctx, suave([[31.6, -5.6], [32.6, -5.6], [32.6, -1.4], [31.6, -1.4]], 0.3, 2), MAT.pavonado);      // abrazadera
    pintar(ctx, suave([[60.2, -5.6], [61.0, -5.6], [61.0, -2.0], [60.2, -2.0]], 0.3, 2), MAT.pavonado);      // abrazadera delantera
    pintar(ctx, suave([[17.2, -5.4], [19.6, -5.4], [19.6, -6.1], [17.2, -6.1]], 0.2, 2), MAT.pavonado);      // alza
    pintar(ctx, suave([[62.2, -5.4], [62.4, -6.8], [63.4, -6.8], [63.6, -5.4]], 0.3, 2), MAT.pavonado);      // guion encapuchado
  } });
DIBUJO_ARMAS.winchester1894.culataCm = 32;
DIBUJO_ARMAS.winchester1894.moviles = { corredera: e => girarCm(-4, 4.6, 13, 0.4, e.palanca * 0.95) };   // la mano viaja con la palanca

// Winchester 1887 (101 cm), según la imagen de referencia: culata recta de madera con cantonera, cajón negro grande
// de bloque redondeado, palanca con lazo, delantera de madera larga que cubre el tubo hasta dos tercios del cañón
reemplazar('winchester1887', { casquillo: 'escopeta',
  anclas: { manoDelantera: [30, -1.8], cargador: [14, -1], corredera: [-4, 6.8], expulsion: [10, -7], boca: [68, -5.5] },
  dibujarCm(ctx, e) {
    pintar(ctx, suave([[0, -5.0], [-2.4, -4.0], [-8, -1.6], [-33.4, 1.2], [-33.8, 2.0], [-33.8, 13.2], [-33.0, 13.6], [-10, 5.6], [-6, 4.2], [-2.6, 3.6], [0, 2.2]], 0.9, 4), MAT.madera);   // culata
    pintar(ctx, suave([[-34.6, 1.2], [-33.6, 1.2], [-33.6, 13.6], [-34.6, 13.4]], 0.3, 2), MAT.pavonado);
    pintar(ctx, Rc(1.0, 2.2, 0.9, 2.3), MAT.acero);
    palancaLazo(ctx, e, 15.6, 2.8, 2.2);
    pintar(ctx, suave([[0, 2.4], [0, -5.6], [2.4, -7.6], [6.6, -8.0], [21, -8.0], [21, 2.6], [15, 2.8], [0, 2.4]], 1.0, 4), MAT.pavonado, { brillo: 0.4 });   // cajón grande
    trazo(ctx, 'rgba(255,255,255,0.1)', 0.25, [[2, -6.4], [20.6, -6.6]]);
    tornillo(ctx, 5, -2); tornillo(ctx, 17, -4);
    if (!Pincel.silueta) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(11, -1.8, 5, 1.6); }
    pintar(ctx, suave([[-1, -6.6], [-2.6, -8.8], [-1.2, -9.0], [1, -6.8]], 0.3, 2), MAT.pavonado);
    pintar(ctx, Rc(21, -6.4, 47, 1.8), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, Rc(21, -4.4, 34, 2.0), MAT.pavonado);                                                       // tubo del depósito
    pintar(ctx, suave([[54.6, -4.6], [56, -4.6], [56, -2.0], [54.6, -2.0]], 0.3, 2), MAT.pavonado);         // tapa del tubo
    pintar(ctx, suave([[21, -5.6], [53, -5.4], [54.2, -3.6], [53, -1.6], [21, -1.2]], 0.9, 3), MAT.madera, { lustre: true });   // delantera larga
    punto(ctx, 41, -3.4, 0.28, '#2a2016');
    punto(ctx, 67.4, -6.9, 0.4, '#e0d8c0');
  } });
DIBUJO_ARMAS.winchester1887.culataCm = 33.6;
DIBUJO_ARMAS.winchester1887.moviles = { corredera: e => girarCm(-4, 6.8, 15.6, 2.8, e.palanca * 0.95) };

/* ======================= M16 (calcada de una foto de perfil de un M16A1) ======================= */
// 99 cm: culata fija A1 con argolla, pistolete sin saliente, cajón inferior gris con guardamonte y selector,
// cargador recto de 20, cajón superior con asa de transporte y alza, ventana de expulsión, anillo delta,
// guardamanos de nervaduras que se afina hacia adelante, torre del guion en «A» con argolla, cañón fino y
// apagallamas «jaula». M16 pasa píxeles de la foto a cm (0,0931 por píxel) con el origen arriba del pistolete.
const M16 = (x, y) => [(x - 330) * 0.0931, (y - 152) * 0.0931];
const M16F = pts => pts.map(p => M16(...p));
const M16_FORMAS = (() => {
  const arriba = []; for (let x = 520; x <= 830; x += 4) arriba.push([x, 66 + (x - 520) * 0.03 + Math.abs(Math.sin((x - 520) / 26 * Math.PI)) * -2.4]);
  return {
    culata: suave(M16F([[8, 84], [20, 82], [280, 83], [292, 86], [292, 140], [280, 141], [60, 207], [30, 215], [14, 214], [8, 205], [5, 150]]), 0.9, 4),
    pistolete: suave(M16F([[288, 150], [336, 152], [333, 165], [318, 202], [306, 242], [302, 260], [288, 265], [256, 253], [258, 240], [274, 196], [283, 162]]), 0.7, 4),
    cargador: suave(M16F([[410, 190], [477, 190], [480, 230], [488, 266], [497, 290], [430, 303], [424, 262], [415, 225]]), 0.4, 3),
    inferior: suave(M16F([[285, 124], [490, 124], [490, 168], [486, 192], [404, 192], [400, 162], [340, 160], [300, 156], [285, 142]]), 0.4, 3),
    guardamonte: suave(M16F([[345, 158], [404, 158], [404, 186], [395, 193], [358, 193], [348, 182]]), 0.5, 3),
    guardamonteHueco: suave(M16F([[356, 162], [397, 162], [397, 182], [390, 187], [362, 187], [355, 178]]), 0.4, 3),
    superior: suave(M16F([[286, 76], [492, 72], [492, 126], [286, 126]]), 0.4, 3),
    asa: suave(M16F([[296, 76], [318, 40], [326, 24], [340, 20], [478, 34], [488, 42], [491, 74]]), 0.6, 3),
    asaHueco: suave(M16F([[352, 36], [470, 42], [481, 52], [478, 64], [354, 64], [346, 50]]), 0.8, 3),
    delta: suave(M16F([[488, 70], [503, 68], [503, 132], [488, 132]]), 0.4, 2),
    guardamanos: suave(M16F([[500, 68], ...arriba, [838, 76], [840, 118], [830, 121], [520, 138], [500, 136]]), 0.6, 2),
    torre: M16F([[840, 88], [856, 86], [879, 32], [893, 30], [895, 42], [894, 124], [886, 128], [846, 126]]),
    torreHueco: suave(M16F([[864, 84], [882, 44], [886, 44], [886, 84]]), 0.15, 2),
    jaula: suave(M16F([[1018, 93], [1065, 93], [1069, 97], [1069, 109], [1065, 113], [1018, 113]]), 0.3, 2),
  };
})();
reemplazar('m16', { casquillo: 'bala',
  anclas: { manoDelantera: M16(620, 126), cargador: M16(440, 196), corredera: M16(300, 74), expulsion: M16(430, 95), boca: M16(1069, 103) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = M16_FORMAS, N = '#222326', GRIS = '#3d4043', GRIS2 = '#44484b';
    // Culata A1 con la argolla de la correa
    pintar(ctx, F.culata, N, { mate: true, brillo: 0.16 });
    if (!sil) {
      trazo(ctx, 'rgba(255,255,255,0.1)', 0.5, [M16(24, 92), M16(278, 92)]);
      trazo(ctx, 'rgba(0,0,0,0.5)', 0.2, [M16(13, 86), M16(16, 212)]);                                         // cantonera
      ctx.beginPath(); ctx.ellipse(...M16(76, 220), 0.85, 0.55, 0, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c40'; ctx.lineWidth = 0.28; ctx.stroke();
    }
    // Pistolete y cargador recto de 20
    pintar(ctx, F.pistolete, N, { mate: true }); punteado(ctx, F.pistolete, 0.5, 'rgba(255,255,255,0.07)');
    if (!e.sinCargador) {
      pintar(ctx, F.cargador, '#5d6268', { mate: true, brillo: 0.15 });
      if (!sil) for (const x of [428, 446, 464]) trazo(ctx, 'rgba(0,0,0,0.3)', 0.3, [M16(x, 196), M16(x + 12, 292)]);
    }
    // Cajón inferior: pozo del cargador, guardamonte, cola del disparador, selector, retén y pernos
    pintar(ctx, F.inferior, GRIS2);
    pintar(ctx, F.guardamonte, GRIS2, { huecos: [F.guardamonteHueco] });
    pintar(ctx, M16F([[370, 162], [377, 162], [380, 175], [375, 181], [371, 173]]), MAT.acero);
    pintar(ctx, Cc(...M16(320, 134), 0.65, 12), MAT.pavonado); trazo(ctx, '#b9bdc6', 0.18, [M16(320, 134), M16(326, 128)]);
    pintar(ctx, Cc(...M16(408, 140), 0.55, 12), MAT.pavonado);
    tornillo(ctx, ...M16(298, 132), 0.3); tornillo(ctx, ...M16(395, 130), 0.3);
    // Cajón superior con la ventana de expulsión, el asa de transporte y el alza
    pintar(ctx, F.superior, GRIS, { brillo: 0.25 });
    if (!sil) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(...M16(396, 88), 72 * 0.0931, 16 * 0.0931); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(...M16(396, 104), 72 * 0.0931, 2 * 0.0931); }
    pintar(ctx, Cc(...M16(478, 116), 0.75, 12), GRIS);                                                       // asistente de cierre
    pintar(ctx, F.asa, GRIS, { huecos: [F.asaHueco] });
    pintar(ctx, Cc(...M16(337, 33), 0.6, 12), MAT.pavonado); punto(ctx, ...M16(337, 33), 0.2, '#0a0a0c');       // alza
    const mc = e.corredera * 6;
    pintar(ctx, suave(M16F([[280, 70], [300, 70], [300, 78], [280, 78]]).map(([x, y]) => [x - mc, y]), 0.25, 2), GRIS);   // manija de carga
    // Anillo delta, guardamanos y casquete
    pintar(ctx, F.delta, MAT.pavonado);
    pintar(ctx, F.guardamanos, N, { mate: true, brillo: 0.12 });
    if (!sil) { for (let x = 533; x < 828; x += 26) trazo(ctx, 'rgba(0,0,0,0.5)', 0.18, [M16(x, 72), M16(x, 78)]); trazo(ctx, 'rgba(255,255,255,0.08)', 0.4, [M16(510, 82), M16(828, 86)]); }
    pintar(ctx, suave(M16F([[830, 76], [842, 76], [842, 120], [830, 120]]), 0.3, 2), MAT.pavonado);
    // Cañón, torre del guion en «A», argolla de la correa y apagallamas
    pintar(ctx, M16F([[842, 97], [1020, 97], [1020, 109], [842, 109]]), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, F.torre, MAT.pavonado, { huecos: [F.torreHueco] });
    pintar(ctx, M16F([[882, 50], [885, 50], [885, 84], [882, 84]]), MAT.pavonado);                          // poste del guion
    if (!sil) { ctx.beginPath(); ctx.ellipse(...M16(851, 140), 0.55, 0.75, 0, 0, Math.PI * 2); ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 0.28; ctx.stroke(); }
    pintar(ctx, F.jaula, MAT.pavonado, { brillo: 0.35 });
    if (!sil) { ctx.fillStyle = '#060607'; for (const y of [96, 107]) ctx.fillRect(...M16(1032, y), 28 * 0.0931, 3 * 0.0931); }
  } });
DIBUJO_ARMAS.m16.culataCm = 30;
DIBUJO_ARMAS.m16.anguloEmpunadura = 0.42;   // el pistolete del AR va bien inclinado

/* ======================= REVISIÓN CON FOTOS: SPAS-12, SVD, BARRETT, REVÓLVERES ======================= */

// Revólver de doble acción visto del lado derecho, a partir de fotos de un S&W Model 29 (pavonado, cachas de
// tiro ensanchadas abajo, funda corta de la varilla, rampa roja) y de un Colt Python (niquelado, costilla
// ventilada, «underlug» hasta la boca, cachas de nogal con medallón dorado). Cañón de 6" en los dos.
function revolver2(ctx, e, op) {
  const { largo, colt, acabado, madera } = op, sil = Pincel.silueta;
  // Martillo: el cuerpo queda metido en la ranura del armazón y asoma la espuela ancha cuadriculada
  pintar(ctx, suave(colt
    ? [[1.2, -2.6], [0.9, -4.2], [0.1, -5.3], [-1.0, -6.0], [-2.4, -6.3], [-3.5, -6.1], [-3.8, -5.5], [-3.0, -5.1], [-2.1, -4.6], [-1.6, -3.6], [-1.6, -2.4]]
    : [[1.2, -2.6], [0.9, -4.0], [0.2, -5.0], [-0.8, -5.7], [-2.2, -6.0], [-3.7, -5.9], [-4.1, -5.4], [-3.3, -5.0], [-2.2, -4.6], [-1.6, -3.6], [-1.6, -2.4]], 0.45, 3), MAT.acero, { brillo: 0.45 });
  if (!sil) for (let k = 0; k < 5; k++) trazo(ctx, 'rgba(0,0,0,0.55)', 0.1, [[-1.0 - k * 0.55, -5.6 - k * 0.06], [-1.3 - k * 0.55, -5.0 - k * 0.06]]);
  // Armazón: lomo con la joroba detrás del martillo, puente superior, frente del armazón y la parte baja
  pintar(ctx, suave(colt
    ? [[-3.8, 0.2], [-3.8, -1.8], [-3.0, -3.4], [-1.6, -4.4], [0.0, -5.0], [1.0, -5.2], [7.4, -5.2], [7.8, -4.6], [7.8, 0.4], [7.2, 1.0], [1.6, 1.0], [0.4, 1.6], [-0.6, 2.0], [-1.6, 1.2]]
    : [[-3.8, 0.2], [-3.7, -1.6], [-2.8, -3.0], [-1.4, -3.9], [0.0, -4.6], [1.0, -5.0], [7.4, -5.0], [7.8, -4.6], [7.8, 0.4], [7.2, 1.0], [1.6, 1.0], [0.4, 1.6], [-0.6, 2.0], [-1.6, 1.2]], 0.45, 3), acabado, { brillo: 0.5 });
  if (!sil) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(2.0, -4.3, 4.2, 4.4); }                              // ventana del tambor
  // Cachas de madera cuadriculadas con borde liso
  const cacha = colt
    ? [[-3.8, -0.4], [-0.8, 1.0], [-0.4, 2.0], [-0.9, 4.6], [-1.4, 7.4], [-1.6, 9.2], [-2.4, 10.4], [-6.0, 10.7], [-7.2, 9.6], [-7.0, 6.8], [-6.0, 3.2], [-4.6, 0.6]]
    : [[-3.8, -0.4], [-0.8, 1.0], [-0.2, 2.0], [-0.8, 4.4], [-1.6, 6.8], [-1.6, 8.6], [-1.0, 9.6], [-2.0, 10.6], [-6.0, 10.6], [-7.0, 9.4], [-6.7, 6.8], [-5.8, 3.6], [-4.6, 0.8]];
  pintar(ctx, suave(cacha, 0.9, 5), madera, { brillo: 0.35 });
  cuadriculado(ctx, colt ? [[-1.4, 3.0], [-2.4, 9.2], [-5.8, 9.4], [-5.4, 4.0], [-3.6, 2.4]] : [[-1.2, 3.0], [-2.2, 9.2], [-6.0, 9.2], [-5.6, 4.2], [-3.8, 2.4]], 0.42, 'rgba(15,6,2,0.5)');
  pintar(ctx, Cc(-2.6, 1.6, colt ? 0.6 : 0.5, 14), colt ? '#c9a227' : '#9aa0a8', { brillo: 0.5 });   // medallón
  tornillo(ctx, -3.9, 6.0, 0.28);                                                                     // tornillo de las cachas
  // Placa lateral, retén del tambor (botón S&W o pestillo Colt) y tornillos
  trazo(ctx, 'rgba(0,0,0,0.45)', 0.12, [[1.6, -3.9], [-0.6, -3.6], [-2.0, -2.6], [-2.6, -1.0], [-1.6, 0.6], [1.4, 0.9]]);
  tornillo(ctx, -1.2, -1.4, 0.26); tornillo(ctx, 0.9, 0.2, 0.24); tornillo(ctx, 6.9, -0.4, 0.24);
  if (colt) pintar(ctx, suave([[-0.8, -2.9], [1.6, -2.7], [1.8, -2.1], [-0.2, -1.8], [-0.9, -2.3]], 0.3, 2), acabado, { brillo: 0.6 });
  else { pintar(ctx, suave([[-0.1, -2.9], [1.7, -2.9], [1.7, -1.9], [-0.1, -1.9]], 0.35, 2), acabado, { brillo: 0.5 }); rayas(ctx, 0.3, 1.4, -2.7, -2.1, 0.28, 'rgba(0,0,0,0.5)', 0.1); }
  // Alza regulable sobre el puente
  pintar(ctx, suave([[0.8, -4.9], [3.8, -4.9], [3.8, -5.8], [1.2, -5.9], [0.8, -5.5]], 0.25, 2), MAT.pavonado);
  tornillo(ctx, 3.1, -5.4, 0.2);
  // Cola del disparador y guardamonte redondo
  pintar(ctx, suave([[2.2, 0.9], [3.4, 0.9], [3.4, 2.0], [2.9, 3.0], [2.3, 3.2], [2.6, 2.1]], 0.3, 2), MAT.acero);
  pintar(ctx, suave([[0.6, 0.9], [6.0, 0.9], [5.8, 2.6], [4.6, 3.9], [2.6, 4.1], [1.0, 3.2], [0.3, 1.8]], 0.8, 4), acabado,
    { huecos: [suave([[1.1, 0.9], [5.2, 0.9], [5.0, 2.3], [4.1, 3.3], [2.7, 3.4], [1.5, 2.7], [1.0, 1.8]], 0.7, 4)], brillo: 0.4 });
  // Cañón
  if (!colt) pintar(ctx, suave([[7.6, -4.6], [9.0, -4.5], [largo, -4.4], [largo, -2.2], [9.0, -2.2], [7.6, -2.0]], 0.25, 2), acabado, { brillo: 0.55 });
  if (colt) {
    // Cañón y «underlug» de una sola pieza, hasta la boca
    pintar(ctx, suave([[7.6, -4.6], [largo, -4.4], [largo, 0.3], [largo - 0.6, 0.7], [10.8, 0.7], [9.0, 0.2], [7.6, 0.2]], 0.35, 3), acabado, { brillo: 0.55 });
    trazo(ctx, 'rgba(0,0,0,0.18)', 0.1, [[8.6, -2.0], [largo - 0.3, -2.0]]);
    trazo(ctx, 'rgba(255,255,255,0.3)', 0.14, [[9.4, -1.2], [largo - 0.4, -1.2]]);
    // Costilla ventilada: barra superior apoyada en postes, con las ventanas abiertas
    const huecos = []; for (let x = 9.2; x + 2.6 < largo - 4.0; x += 3.5) huecos.push(suave(Rc(x, -5.2, 2.6, 0.75), 0.25, 2));
    pintar(ctx, [[7.6, -4.4], [largo - 0.3, -4.4], [largo - 0.3, -5.8], [7.6, -5.6]], acabado, { huecos, brillo: 0.6 });
    rayas(ctx, 8.0, largo - 1.0, -5.75, -5.6, 0.25, 'rgba(0,0,0,0.35)', 0.07);
    pintar(ctx, [[largo - 3.6, -5.8], [largo - 0.9, -6.6], [largo - 0.3, -6.6], [largo - 0.3, -5.8]], acabado);   // guion en rampa
    if (!sil) for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(30,30,36,0.45)'; ctx.fillRect(10 + k * 0.9, -3.6, 0.6, 0.35); }   // grabado «PYTHON 357»
  } else {
    pintar(ctx, [[7.6, -4.4], [largo - 0.2, -4.3], [largo - 0.2, -4.9], [7.6, -5.0]], acabado, { brillo: 0.5 });   // costilla lisa
    rayas(ctx, 8.0, largo - 1.0, -4.95, -4.75, 0.25, 'rgba(0,0,0,0.3)', 0.07);
    pintar(ctx, suave([[7.6, -2.3], [13.4, -2.3], [14.2, -1.5], [13.8, -0.6], [13.0, -0.1], [7.6, 0.0]], 0.4, 3), acabado, { brillo: 0.35 });   // funda corta de la varilla
    pintar(ctx, [[largo - 4.2, -4.8], [largo - 1.0, -5.9], [largo - 0.3, -5.9], [largo - 0.3, -4.7]], acabado);   // rampa del guion
    pintar(ctx, [[largo - 1.8, -5.3], [largo - 1.0, -5.7], [largo - 0.6, -5.7], [largo - 0.6, -5.1]], '#d0322a', { brillo: 0.3 });   // inserto rojo
    if (!sil) for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(200,210,230,0.18)'; ctx.fillRect(10 + k * 0.9, -3.6, 0.6, 0.35); }   // grabado «44 MAGNUM»
  }
  trazo(ctx, 'rgba(255,255,255,0.22)', 0.18, [[8.4, -3.9], [largo - 0.4, -3.9]]);
  // Tambor de seis con estrías y muescas del retén; se vuelca hacia afuera para recargar
  ctx.save(); ctx.translate(-e.abierto * 1.5, e.abierto * 4.2);
  pintar(ctx, suave([[1.9, -4.45], [5.9, -4.45], [6.35, -3.9], [6.35, -0.4], [5.9, 0.15], [1.9, 0.15], [1.7, -0.3], [1.7, -4.0]], 0.35, 3), acabado, { brillo: 0.55 });
  if (!sil) {
    const rx = colt ? 1.2 : 1.5, cx = colt ? 4.3 : 4.1;
    for (const [y, ry] of [[-3.75, 0.2], [-2.15, 0.45], [-0.55, 0.2]]) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(cx, y + ry * 0.45, rx * 0.8, ry * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(2.1, -3.0, 0.5, 0.3); ctx.fillRect(2.1, -1.45, 0.5, 0.3);
    trazo(ctx, 'rgba(255,255,255,0.28)', 0.16, [[2.0, -3.15], [6.1, -3.15]]);
  }
  ctx.restore();
}
reemplazar('magnum', { casquillo: null, casquilloVaciado: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: [-0.2, 5.0], cargador: [3.8, -2.4], corredera: [3.8, -2.4], expulsion: [3.8, -2.4], boca: [23.8, -3.3] },
  dibujarCm(ctx, e) { revolver2(ctx, e, { largo: 23.8, colt: false, acabado: '#20242e', madera: '#8a4421' }); } });
reemplazar('python', { casquillo: null, casquilloVaciado: 'pistola', origen: PISTOLA,
  anclas: { manoDelantera: [-0.2, 5.0], cargador: [3.8, -2.4], corredera: [3.8, -2.4], expulsion: [3.8, -2.4], boca: [23.0, -3.3] },
  dibujarCm(ctx, e) { revolver2(ctx, e, { largo: 23.0, colt: true, acabado: '#a9aeb7', madera: '#7a3a1a' }); } });

// SPAS-12 (104 cm con la culata abierta, 82 plegada): culata plegable de chapa estampada con agujeros y gancho
// para el antebrazo, pistolete de polímero con apoyos para los dedos, cajón largo de aluminio con la ventana
// de expulsión y el cerrojo cromado, bomba grande nervada con labios, protector térmico con ventanas sobre el
// cañón, tubo del depósito con tapa y anilla, guion con orejas protectoras
reemplazar('spas12', { casquillo: 'escopeta',
  anclas: { manoDelantera: [40, -2.4], cargador: [15.4, 0.6], corredera: [40, -2.4], expulsion: [15, -6.2], boca: [71, -7.5] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, NEGRO = '#2a2c30', ALU = '#2e3036', b = e.bombeo * 8;
    // Culata plegable: brazo superior, culatín y brazo inferior que traba en el pistolete
    pintar(ctx, suave([[-2.4, -8.8], [-30.4, -8.4], [-31.6, -7.4], [-31.6, 4.6], [-30.4, 5.6], [-28.6, 5.2], [-3.4, 1.4], [-3.4, -6.6]], 0.6, 3), NEGRO,
      { brillo: 0.25, huecos: [suave([[-4.4, -6.6], [-29.0, -6.4], [-29.2, 3.0], [-4.4, -0.4]], 1.4, 4), ...[-8, -12.2, -16.4, -20.6, -24.8].map(x => Cc(x, -7.6, 0.5, 10))] });
    pintar(ctx, suave([[-32.8, -8.8], [-31.4, -8.6], [-31.4, 5.8], [-32.6, 6.0], [-33.2, -1.4]], 0.6, 3), MAT.goma);   // cantonera curva
    pintar(ctx, suave([[-30.8, -8.6], [-30.2, -9.6], [-25.6, -10.6], [-23.8, -10.0], [-23.4, -9.0], [-24.4, -8.8], [-25.4, -9.4], [-29.4, -8.6]], 0.4, 3), NEGRO);   // gancho plegado
    punto(ctx, -30.2, -8.9, 0.4, '#4a4c52');
    // Pistolete con apoyos para los dedos
    const grip = suave([[-3.8, -0.2], [0.8, -0.2], [1.4, 1.6], [0.5, 3.0], [1.1, 4.6], [0.2, 6.0], [0.7, 7.6], [-0.2, 9.4], [-1.0, 11.4], [-2.6, 11.9], [-5.2, 11.5], [-5.6, 10.2], [-4.9, 5.0], [-4.4, 1.6]], 0.55, 3);
    pintar(ctx, grip, MAT.polimero, { mate: true }); punteado(ctx, grip, 0.45);
    // Cajón de aluminio
    pintar(ctx, suave([[-4.0, -9.4], [27.0, -9.4], [27.0, 0.4], [-4.0, 0.4]], 0.5, 3), ALU, { brillo: 0.3 });
    trazo(ctx, 'rgba(255,255,255,0.07)', 0.25, [[-3.6, -3.2], [26.6, -3.2]]);
    pintar(ctx, suave([[-3.6, 0.2], [8.6, 0.2], [8.6, 1.4], [-3.6, 1.4]], 0.4, 2), MAT.polimero, { mate: true });   // grupo del disparador
    guardamonteC(ctx, 1.6, 7.8, 1.0, 2.8, MAT.polimero);
    pintar(ctx, [[3.0, 1.2], [3.8, 1.2], [4.0, 2.8], [3.4, 3.2], [3.0, 2.4]], MAT.acero);
    punto(ctx, 7.6, 0.8, 0.35, '#8a2a22');                                                                        // seguro
    if (!sil) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(10.8, -7.6, 8.4, 2.8); ctx.fillRect(10.6, 0.0, 9.6, 0.5); }   // ventana de expulsión y boca de carga
    ctx.save(); ctx.beginPath(); ctx.rect(10.8, -7.6, 8.4, 2.8); ctx.clip();
    pintar(ctx, Rc(10.8 - b, -7.2, 8.4, 2.0), '#a9adb5', { brillo: 0.5 });                                          // cerrojo cromado
    ctx.restore();
    pintar(ctx, Cc(17.6 - b, -6.2, 0.55, 12), MAT.acero);                                                       // manija del cerrojo
    pintar(ctx, Cc(22.4, -2.4, 0.6, 12), '#3a3c42');                                                            // retén del cerrojo
    pintar(ctx, [[-1.6, -9.4], [1.2, -9.4], [1.0, -10.6], [0.0, -11.0], [-0.8, -10.6]], NEGRO, { huecos: [Cc(0.0, -10.1, 0.32, 8)] });   // alza de anillo
    // Tubo del depósito, cañón y abrazadera
    pintar(ctx, Rc(27.0, -4.8, 36.4, 2.8), NEGRO, { brillo: 0.35 });
    pintar(ctx, suave([[63.2, -5.0], [65.6, -5.0], [65.6, -1.8], [63.2, -1.8]], 0.5, 2), MAT.acero);               // tapa
    if (!sil) { ctx.beginPath(); ctx.arc(64.4, -0.8, 0.8, 0, Math.PI * 2); ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.3; ctx.stroke(); }   // anilla
    pintar(ctx, [[27.0, -8.8], [71.0, -8.7], [71.0, -6.3], [27.0, -6.2]], MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, suave([[60.0, -9.0], [61.6, -9.0], [61.6, -4.8], [60.0, -4.8]], 0.3, 2), MAT.pavonado);             // abrazadera
    // Protector térmico con ventanas (se ve el cañón a través)
    pintar(ctx, suave([[27.0, -10.4], [55.0, -10.4], [56.0, -9.4], [56.0, -6.0], [27.0, -6.0]], 0.6, 3), NEGRO,
      { brillo: 0.3, huecos: Array.from({ length: 7 }, (_, k) => suave(Rc(29.4 + k * 3.6, -9.6, 2.4, 2.4), 0.7, 3)) });
    // Guion con orejas protectoras
    pintar(ctx, suave([[66.4, -9.0], [69.6, -9.0], [69.6, -6.0], [66.4, -6.0]], 0.3, 2), MAT.pavonado);
    pintar(ctx, [[66.6, -9.0], [67.0, -11.8], [69.0, -11.8], [69.4, -9.0]], MAT.pavonado, { huecos: [suave(Rc(67.6, -11.2, 0.8, 1.4), 0.3, 2)] });
    pintar(ctx, Rc(67.85, -11.2, 0.3, 1.4), MAT.acero);
    // Bomba grande con nervios y labios, que corre sobre el tubo
    ctx.save(); ctx.translate(-b, 0);
    pintar(ctx, suave([[29.0, -6.6], [30.4, -6.2], [49.4, -6.2], [51.0, -6.8], [51.4, -5.6], [51.2, 0.6], [50.2, 1.4], [30.2, 1.0], [29.0, 0.8], [28.6, -2.6]], 0.8, 3), MAT.polimero, { mate: true });
    if (!sil) for (let x = 31.2; x < 49; x += 1.15) { ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(x, -5.6, 0.45, 5.6); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 0.5, -5.6, 0.2, 5.6); }
    pintar(ctx, suave([[47.8, 1.0], [49.6, 1.0], [49.6, 1.8], [47.8, 1.8]], 0.3, 2), MAT.acero);                   // botón de modo
    ctx.restore();
  } });
DIBUJO_ARMAS.spas12.culataCm = 33.2;   // culatín a la medida real

// Dragunov SVD (122 cm): culata esqueleto de madera laminada con hueco para el pulgar y carrillera aparte,
// cantonera de acero, cajón tipo AK con tapa redondeada y palanca de seguro larga, cargador de 10 con nervios,
// guardamanos de dos piezas con ventilaciones ovaladas, bloque de gases, cañón largo, guion con capuchón y
// apagallamas largo ranurado; mira PSO-1 sobre montura lateral con torreta arriba y ocular de goma largo
reemplazar('svd', { casquillo: 'bala',
  anclas: { manoDelantera: [38, -4.2], cargador: [10, -1.6], corredera: [18.4, -5.6], expulsion: [13, -6.6], boca: [87.6, -6.2] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, c = e.corredera * 8;
    // Culata esqueleto: lomo, culatín, barra inferior y pistolete forman el hueco para el pulgar
    pintar(ctx, suave([[-4.8, -7.6], [-32.4, -7.2], [-33.6, -6.6], [-33.6, 8.4], [-32.4, 9.4], [-29.4, 9.4], [-6.0, 9.0], [-2.2, 9.0], [-1.2, 8.0], [0.8, 0.8], [1.0, -1.8], [-4.8, -1.8]], 0.8, 4), MAT.madera,
      { huecos: [suave([[-6.6, -4.2], [-27.6, -4.0], [-28.6, -3.0], [-28.4, 5.6], [-27.2, 6.4], [-7.8, 6.4], [-6.2, 5.2], [-4.4, -2.0]], 1.6, 5)] });
    pintar(ctx, suave([[-27.4, -7.2], [-27.4, -9.8], [-26.4, -10.6], [-13.6, -10.6], [-12.4, -9.6], [-12.0, -7.4]], 0.8, 4), MAT.madera);   // carrillera
    trazo(ctx, 'rgba(0,0,0,0.5)', 0.2, [[-27.2, -7.35], [-12.2, -7.45]]);
    tornillo(ctx, -24.6, -8.8, 0.3); tornillo(ctx, -15.2, -8.8, 0.3);
    pintar(ctx, suave([[-34.6, -7.0], [-33.4, -7.0], [-33.4, 9.4], [-34.4, 9.2], [-34.8, 1.2]], 0.4, 2), MAT.acero);   // cantonera
    // Cargador de 10 con nervios de refuerzo
    if (!e.sinCargador) {
      pintar(ctx, suave([[6.8, -2.0], [12.8, -2.0], [13.4, 2.6], [14.8, 8.0], [14.6, 9.0], [9.2, 9.8], [8.6, 9.2], [7.6, 4.0], [6.8, 0.6]], 0.5, 3), MAT.pavonado);
      pintar(ctx, suave([[8.4, 0.2], [11.8, 0.2], [12.6, 4.0], [13.4, 7.8], [9.8, 8.4], [9.0, 4.2]], 0.5, 3), '#1b1c20', { mate: true });
      if (!sil) for (let k = 0; k < 5; k++) trazo(ctx, 'rgba(255,255,255,0.09)', 0.3, [[8.8 + k * 0.25, 1.0 + k * 1.5], [12.0 + k * 0.3, 1.0 + k * 1.5]]);
      pintar(ctx, suave([[8.8, 9.2], [14.8, 8.4], [15.0, 9.2], [9.2, 10.2]], 0.3, 2), MAT.acero);
    }
    // Montura lateral de la mira (del lado izquierdo: asoma por encima del cajón)
    pintar(ctx, suave([[2.4, -11.2], [15.6, -11.2], [15.6, -8.0], [14.0, -7.2], [3.2, -7.2], [2.4, -8.0]], 0.5, 3), '#1d1e22');
    trazo(ctx, '#3a3c42', 0.5, [[3.6, -9.6], [0.6, -8.6]]);                                                     // palanca de la montura
    // Cajón estampado, tapa redondeada, remaches, ventana con el portacerrojo y la manija de carga
    pintar(ctx, suave([[-4.8, -1.8], [-4.8, -6.8], [22.6, -6.8], [23.4, -6.0], [23.4, -1.8]], 0.4, 2), MAT.pavonado, { brillo: 0.3 });
    pintar(ctx, suave([[-4.4, -6.6], [-4.4, -7.6], [-3.4, -8.4], [20.6, -8.4], [21.4, -7.6], [21.4, -6.6]], 0.6, 3), MAT.pavonado, { brillo: 0.45 });
    pintar(ctx, Cc(-4.6, -7.4, 0.45, 10), MAT.acero);                                                           // botón de la tapa
    if (!sil) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(9.4, -6.6, 7.8, 1.2); }
    ctx.save(); ctx.beginPath(); ctx.rect(9.4, -6.6, 7.8, 1.2); ctx.clip(); pintar(ctx, Rc(9.4 - c, -6.5, 9, 1.0), MAT.acero); ctx.restore();
    pintar(ctx, suave([[17.4 - c, -6.4], [19.8 - c, -6.4], [20.2 - c, -5.6], [19.8 - c, -4.8], [17.4 - c, -4.8]], 0.4, 2), MAT.acero);   // manija
    pintar(ctx, suave([[-3.4, -5.4], [9.0, -5.6], [9.2, -4.9], [-2.6, -4.3], [-2.6, -2.6], [-3.6, -2.8]], 0.3, 2), MAT.acero);   // palanca de seguro
    for (const [x, y] of [[0.6, -3.2], [4.0, -3.0], [19.6, -3.0], [21.6, -2.6], [14.8, -2.6]]) punto(ctx, x, y, 0.22, '#4a4c52');
    pintar(ctx, suave([[5.4, -1.9], [6.4, -1.9], [6.4, -0.4], [5.4, -0.6]], 0.2, 2), MAT.acero);                // retén del cargador
    guardamonteC(ctx, 1.2, 5.6, -1.8, 3.4, MAT.acero);
    pintar(ctx, [[2.4, -1.8], [3.2, -1.8], [3.4, 0.0], [2.8, 0.6], [2.4, -0.2]], MAT.acero);
    // Alza tangencial delante del cajón
    pintar(ctx, [[21.4, -7.2], [25.4, -7.6], [25.4, -8.6], [21.4, -8.2]], MAT.pavonado);
    // Cañón y bloque de gases (debajo del guardamanos)
    pintar(ctx, Rc(23.4, -6.9, 55.6, 1.5), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, suave([[50.4, -8.4], [54.6, -8.4], [55.6, -7.4], [55.6, -5.2], [50.4, -5.0]], 0.4, 2), MAT.pavonado);
    pintar(ctx, Cc(53.4, -4.2, 0.6, 10), MAT.acero);                                                            // regulador de gases
    // Guardamanos superior e inferior con ventilaciones ovaladas
    pintar(ctx, suave([[23.6, -6.0], [23.6, -8.0], [24.6, -8.8], [49.0, -8.6], [50.2, -7.6], [50.2, -6.0]], 0.5, 3), MAT.madera);
    pintar(ctx, suave([[23.6, -6.0], [50.2, -6.0], [50.2, -3.6], [49.0, -2.6], [24.8, -2.0], [23.6, -2.8]], 0.6, 3), MAT.madera);
    trazo(ctx, 'rgba(0,0,0,0.5)', 0.18, [[23.8, -6.0], [50.0, -6.0]]);
    if (!sil) for (const [x, y, w] of [[29, -7.3, 4.6], [36.4, -7.3, 4.6], [43.8, -7.3, 4.0], [27.4, -4.2, 5.2], [35.2, -4.2, 5.2], [43, -4.2, 4.6]]) {
      ctx.fillStyle = '#121214'; ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2, y < -6 ? 0.45 : 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    pintar(ctx, suave([[22.6, -8.8], [23.8, -8.8], [23.8, -2.0], [22.6, -2.0]], 0.3, 2), MAT.acero);             // anillo trasero
    pintar(ctx, suave([[49.8, -8.8], [51.0, -8.8], [51.0, -2.6], [49.8, -2.6]], 0.3, 2), MAT.acero);             // anillo delantero
    // Base del guion con capuchón, tetón de bayoneta y apagallamas largo ranurado
    pintar(ctx, suave([[74.4, -7.4], [78.6, -7.4], [78.6, -5.0], [74.4, -5.0]], 0.3, 2), MAT.pavonado);
    pintar(ctx, [[74.8, -5.0], [78.2, -5.0], [77.8, -3.6], [75.2, -3.8]], MAT.pavonado);
    pintar(ctx, [[76.2, -7.4], [76.4, -9.8], [76.9, -9.8], [77.1, -7.4]], MAT.acero);
    if (!sil) { ctx.beginPath(); ctx.arc(76.65, -9.0, 1.3, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = MAT.pavonado; ctx.lineWidth = 0.45; ctx.stroke(); }
    pintar(ctx, suave([[78.6, -7.3], [87.6, -7.3], [87.6, -5.0], [78.6, -5.0]], 0.4, 2), MAT.pavonado, { brillo: 0.4 });
    if (!sil) for (const y of [-6.75, -6.15, -5.55]) { ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.ellipse(83.4, y, 3.0, 0.17, 0, 0, Math.PI * 2); ctx.fill(); }
    // Mira PSO-1: ocular de goma largo, tubo, torreta de elevación arriba y parasol
    pintar(ctx, suave([[-4.0, -14.0], [20.0, -14.0], [20.0, -11.2], [-4.0, -11.2]], 0.4, 2), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, suave([[20.0, -14.0], [21.6, -14.6], [25.6, -14.6], [25.6, -10.6], [21.6, -10.6], [20.0, -11.2]], 0.4, 2), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, suave([[-4.0, -14.0], [-5.6, -14.4], [-8.0, -14.4], [-8.0, -10.8], [-5.6, -10.8], [-4.0, -11.2]], 0.4, 2), MAT.pavonado);
    pintar(ctx, suave([[-8.0, -14.8], [-11.4, -15.6], [-11.9, -15.0], [-11.9, -10.4], [-8.0, -10.4]], 0.7, 3), MAT.goma);
    rayas(ctx, -7.4, -5.8, -14.2, -11.0, 0.5, 'rgba(0,0,0,0.5)', 0.14);
    pintar(ctx, suave([[7.8, -16.4], [11.8, -16.4], [11.8, -14.0], [7.8, -14.0]], 0.4, 2), MAT.pavonado);
    rayas(ctx, 8.2, 11.4, -16.2, -14.2, 0.4, 'rgba(255,255,255,0.14)', 0.12);
    pintar(ctx, Cc(14.8, -12.6, 0.8, 12), '#1d1e22');                                                           // tapa de la pila
    if (!sil) { const g = ctx.createLinearGradient(0, -14.4, 0, -10.8); g.addColorStop(0, '#9fd2f0'); g.addColorStop(1, '#1d4c6c'); ctx.fillStyle = g; ctx.fillRect(25.2, -14.1, 0.4, 3.0); }
  } });
DIBUJO_ARMAS.svd.culataCm = 34.6;

// Barrett M82A1 (145 cm): cajón superior largo de chapa con ventanas ovaladas adelante y riel arriba, cajón
// inferior que sigue como culata con hueco trapezoidal y almohadilla grande, pistolete, cargador de 10,
// cañón grueso estriado, freno de boca de dos cámaras en punta de flecha, bípode plegado con agujeros de
// regulación, asa de transporte y mira con anillas
reemplazar('barrett', { casquillo: 'grande',
  anclas: { manoDelantera: [27, -5.0], cargador: [15, 1.4], corredera: [10, -9.6], expulsion: [13, -11.2], boca: [105.4, -9.4] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, CH = '#2a2c30', dx = -e.corredera * 9;
    // Cajón inferior y culata
    pintar(ctx, suave([[24.0, -6.4], [24.0, 1.0], [-1.0, 1.0], [-3.6, 1.6], [-14.0, 2.4], [-34.4, 5.8], [-39.2, 6.0], [-39.2, -13.0], [-14.0, -13.0], [-14.0, -6.4]], 0.6, 3), CH,
      { brillo: 0.25, huecos: [suave([[-37.0, -9.4], [-27.0, -9.4], [-27.0, 2.2], [-37.0, 3.6]], 1.2, 4)] });
    trazo(ctx, 'rgba(0,0,0,0.5)', 0.2, [[-14.0, -12.8], [-14.0, -6.6]]);
    for (const x of [-20, -8, 20]) tornillo(ctx, x, -3.6, 0.32);
    pintar(ctx, suave([[-41.6, -13.4], [-39.0, -13.4], [-39.0, 6.4], [-41.6, 6.4]], 0.9, 3), MAT.goma);          // almohadilla
    if (!sil) rayas(ctx, -41.2, -39.4, -12.6, 5.6, 0.6, 'rgba(255,255,255,0.05)', 0.2);
    // Pistolete, guardamonte y disparador
    const grip = suave([[-0.8, 0.8], [3.2, 0.8], [2.6, 3.4], [2.2, 5.2], [1.4, 9.6], [0.6, 10.6], [-2.2, 10.6], [-3.2, 9.6], [-1.8, 4.2], [-1.8, 1.6]], 0.8, 4);
    pintar(ctx, grip, MAT.polimero, { mate: true }); punteado(ctx, grip, 0.45);
    guardamonteC(ctx, 3.2, 9.0, 1.0, 2.8, CH);
    pintar(ctx, [[4.4, 1.0], [5.2, 1.0], [5.4, 2.6], [4.8, 3.0], [4.4, 2.2]], MAT.acero);
    pintar(ctx, Cc(1.2, -1.8, 0.7, 12), MAT.pavonado); trazo(ctx, '#b9bdc6', 0.2, [[1.2, -1.8], [1.7, -2.3]]);   // seguro
    // Cargador de 10 con nervios y tapa
    if (!e.sinCargador) {
      pintar(ctx, suave([[9.6, 0.6], [20.6, 0.6], [20.6, 12.0], [9.6, 12.0]], 0.6, 3), MAT.pavonado);
      pintar(ctx, suave([[10.6, 2.6], [19.6, 2.6], [19.6, 10.0], [10.6, 10.0]], 0.6, 3), '#1b1c20', { mate: true });
      for (const y of [4.4, 6.2, 8.0]) trazo(ctx, 'rgba(255,255,255,0.08)', 0.35, [[11.2, y], [19.0, y]]);
      pintar(ctx, suave([[9.2, 11.6], [21.0, 11.6], [21.0, 12.6], [9.2, 12.6]], 0.3, 2), MAT.acero);
    }
    pintar(ctx, suave([[21.0, 0.0], [22.2, 0.0], [22.2, 1.6], [21.0, 1.6]], 0.3, 2), MAT.acero);                // retén
    // Cajón superior con ventanas ovaladas adelante (se ve el cañón adentro)
    pintar(ctx, Rc(24.0, -10.8, 31.0, 3.0), MAT.pavonado);
    pintar(ctx, suave([[-14.0, -13.0], [54.0, -13.0], [54.6, -12.4], [54.6, -6.4], [-14.0, -6.4]], 0.5, 3), CH,
      { brillo: 0.3, huecos: Array.from({ length: 8 }, (_, k) => suave(Rc(28.4 + k * 3.1, -10.3, 2.2, 1.8), 0.85, 4)) });
    trazo(ctx, 'rgba(255,255,255,0.09)', 0.3, [[-13.6, -11.2], [54.2, -11.2]]);
    for (const x of [-10, 4, 24]) tornillo(ctx, x, -7.4, 0.3);
    if (!sil) { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(9.0, -11.0, 8.0, 2.6); }                               // ventana de expulsión
    ctx.save(); ctx.beginPath(); ctx.rect(9.0, -11.0, 8.0, 2.6); ctx.clip(); pintar(ctx, Rc(9.0 + dx, -10.7, 8.0, 2.0), MAT.acero); ctx.restore();
    pintar(ctx, suave([[7.6 + dx, -10.2], [11.6 + dx, -10.2], [12.2 + dx, -9.4], [11.6 + dx, -8.6], [7.6 + dx, -8.6]], 0.4, 2), MAT.acero);   // manija de carga
    // Riel con dientes, asa de transporte y guion plegado
    pintar(ctx, Rc(-10.0, -14.0, 48.0, 1.0), CH);
    if (!sil) for (let x = -9.4; x < 37.6; x += 1.0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, -14.0, 0.45, 0.55); }
    pintar(ctx, suave([[39.0, -13.0], [39.6, -15.8], [50.4, -15.8], [51.0, -13.0], [49.8, -13.0], [49.4, -14.8], [40.6, -14.8], [40.2, -13.0]], 0.5, 3), CH);
    pintar(ctx, [[52.0, -13.0], [52.4, -14.4], [53.6, -14.4], [53.8, -13.0]], CH);
    // Cañón grueso con estrías longitudinales
    pintar(ctx, [[54.6, -11.0], [97.2, -10.8], [97.2, -8.0], [54.6, -7.8]], MAT.pavonado, { brillo: 0.45 });
    if (!sil) for (const y of [-10.1, -9.3, -8.5]) { ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(58, y - 0.16, 34, 0.32); }
    // Bípode plegado hacia adelante: abrazadera, dos patas con agujeros y zapatas
    pintar(ctx, suave([[50.6, -6.6], [55.0, -6.6], [55.0, -4.4], [50.6, -4.4]], 0.4, 2), CH);
    for (const [y0, y1] of [[-6.2, -5.6], [-4.8, -4.2]]) {
      pintar(ctx, suave([[53.0, y0 - 0.5], [81.0, y1 - 0.5], [81.0, y1 + 0.5], [53.0, y0 + 0.5]], 0.3, 2), MAT.acero, { brillo: 0.3 });
      if (!sil) for (let x = 64; x < 79; x += 1.4) punto(ctx, x, y0 + (y1 - y0) * (x - 53) / 28, 0.22, '#0a0a0c');
    }
    pintar(ctx, suave([[80.4, -7.0], [83.2, -7.0], [83.2, -3.4], [80.4, -3.4]], 0.4, 2), MAT.goma);
    // Freno de boca de dos cámaras con ventanas en punta de flecha
    pintar(ctx, suave([[96.6, -11.4], [97.8, -11.4], [97.8, -7.4], [96.6, -7.4]], 0.3, 2), MAT.acero);
    pintar(ctx, suave([[97.6, -12.4], [105.4, -12.4], [105.4, -6.4], [97.6, -6.4]], 0.5, 3), MAT.acero, { brillo: 0.4,
      huecos: [[[98.6, -9.4], [99.6, -11.6], [101.2, -11.6], [100.2, -9.4], [101.2, -7.2], [99.6, -7.2]], [[101.8, -9.4], [102.8, -11.6], [104.4, -11.6], [103.4, -9.4], [104.4, -7.2], [102.8, -7.2]]] });
    // Mira sobre el riel
    mira2(ctx, -6, 28, -19.0, 3.4, 5.8, 4.6, [1, 17], -14.0);
  } });
DIBUJO_ARMAS.barrett.culataCm = 42.6;

/* ======================= REVISIÓN: SAIGA-12, MILKOR MGL Y CUERPO A CUERPO ======================= */

// Saiga-12 táctica (95 cm, sobre foto): culata plegable de tubo con tirante y apoyo de goma, cajón tipo AK con tapa
// redondeada y palanca de seguro, cargador recto y ancho de 8 con nervios, pistolete nervado, guardamanos de
// rieles con ventanas ovaladas, empuñadura vertical, freno de boca dentado y mira holográfica
reemplazar('saiga', { casquillo: 'escopeta',
  anclas: { manoDelantera: [33.6, 4.2], cargador: [11, -1.6], corredera: [19, -5.2], expulsion: [14, -6.6], boca: [62, -5.4] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, P = MAT.polimero, A = MAT.aleacion, c = e.corredera * 8;
    // Culata plegable: bisagra, tubo superior, tirante y apoyo de goma
    pintar(ctx, suave(Rc(-7.6, -7.0, 3.2, 5.0), 0.5, 2), MAT.pavonado);
    pintar(ctx, suave([[-7.4, -6.2], [-30.0, -4.6], [-30.0, -2.8], [-7.4, -4.4]], 0.8, 3), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, suave([[-7.0, -3.0], [-29.0, 4.4], [-29.6, 2.8], [-7.6, -4.6]], 0.6, 3), MAT.pavonado, { brillo: 0.3 });
    pintar(ctx, suave([[-29.4, -6.6], [-32.4, -6.8], [-33.2, -5.6], [-33.0, 6.2], [-32.0, 7.2], [-29.2, 6.6], [-28.8, 2.0]], 0.8, 4), MAT.goma);
    rayas(ctx, -32.4, -30.0, -5.6, 6.0, 0.6, 'rgba(255,255,255,0.05)', 0.18);
    // Cargador de 8: recto, ancho, con nervios y tapa
    if (!e.sinCargador) {
      const car = suave([[6.8, -2.0], [15.0, -2.0], [16.8, 13.6], [16.4, 14.6], [8.6, 15.4], [7.8, 14.4]], 0.6, 3);
      pintar(ctx, car, P, { mate: true });
      if (!sil) for (let k = 0; k < 6; k++) trazo(ctx, 'rgba(255,255,255,0.08)', 0.35, [[8.0 + k * 0.2, 1.5 + k * 2.1], [15.4 + k * 0.22, 0.8 + k * 2.1]]);
      pintar(ctx, suave([[7.8, 14.0], [16.6, 13.2], [16.8, 14.8], [8.2, 15.6]], 0.3, 2), '#2a2b2f');
    }
    // Pistolete nervado y guardamonte
    const grip = suave([[-1.0, -2.0], [2.8, -2.0], [1.8, 3.0], [1.2, 8.6], [0.4, 9.4], [-2.6, 9.0], [-2.8, 8.0], [-1.8, 2.8]], 0.7, 4);
    pintar(ctx, grip, P, { mate: true });
    if (!sil) for (let y = 1.6; y < 8.4; y += 0.9) trazo(ctx, 'rgba(255,255,255,0.07)', 0.25, [[-2.0 + y * -0.08, y], [1.6 - y * 0.12, y]]);
    guardamonteC(ctx, 3.0, 6.6, -2.0, 3.2, MAT.acero);
    pintar(ctx, [[4.0, -2.0], [4.8, -2.0], [5.0, -0.2], [4.4, 0.4], [4.0, -0.4]], MAT.acero);
    // Cajón tipo AK: tapa redondeada, ventana con el portacerrojo, manija, palanca de seguro y remaches
    pintar(ctx, suave([[-4.6, -2.0], [-4.6, -6.6], [24.0, -6.6], [24.0, -2.0]], 0.4, 2), MAT.pavonado, { brillo: 0.3 });
    pintar(ctx, suave([[-4.2, -6.4], [-4.2, -7.4], [-3.2, -8.2], [22.8, -8.2], [23.6, -7.4], [23.6, -6.4]], 0.6, 3), MAT.pavonado, { brillo: 0.45 });
    if (!sil) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(9.6, -6.4, 8.2, 1.2); }
    ctx.save(); ctx.beginPath(); ctx.rect(9.6, -6.4, 8.2, 1.2); ctx.clip(); pintar(ctx, Rc(9.6 - c, -6.3, 9, 1.0), MAT.acero); ctx.restore();
    pintar(ctx, suave([[17.8 - c, -6.2], [20.2 - c, -6.2], [20.6 - c, -5.4], [20.2 - c, -4.6], [17.8 - c, -4.6]], 0.4, 2), MAT.acero);
    pintar(ctx, suave([[-3.4, -5.4], [9.0, -5.6], [9.2, -4.9], [-2.6, -4.3], [-2.6, -2.6], [-3.6, -2.8]], 0.3, 2), MAT.acero);
    for (const [x, y] of [[0.6, -3.2], [4.0, -3.0], [21.6, -3.0], [22.8, -4.8]]) punto(ctx, x, y, 0.22, '#4a4c52');
    pintar(ctx, suave([[5.4, -1.9], [6.4, -1.9], [6.4, -0.4], [5.4, -0.6]], 0.2, 2), MAT.acero);
    // Mira holográfica sobre la tapa
    pintar(ctx, Rc(9.0, -9.0, 10.4, 0.8), A);
    pintar(ctx, suave([[8.6, -9.0], [19.6, -9.0], [19.6, -11.8], [18.4, -11.8], [18.4, -13.8], [11.2, -13.8], [10.2, -12.6], [8.6, -12.2]], 0.5, 3), '#26272b', { huecos: [suave(Rc(11.8, -13.2, 5.6, 1.5), 0.4, 2)], brillo: 0.3 });
    pintar(ctx, Rc(16.0, -11.0, 1.4, 0.5), '#d6b84a');
    // Guardamanos de rieles con ventanas ovaladas, y empuñadura vertical
    pintar(ctx, Rc(24.0, -6.8, 26.6, 3.0), '#141518', { mate: true, brillo: 0 });   // el cañón y el pistón, que se ven por las ventanas
    pintar(ctx, suave([[24.0, -8.4], [50.0, -8.4], [50.6, -7.6], [50.6, -3.0], [50.0, -2.2], [24.0, -2.2]], 0.5, 3), '#202125', { brillo: 0.3,
      huecos: Array.from({ length: 6 }, (_, k) => Ec(28.6 + k * 3.8, -5.3, 1.3, 0.75, 14)) });
    pintar(ctx, Rc(24.4, -9.2, 25.8, 0.8), A); if (!sil) for (let x = 24.8; x < 50; x += 1.0) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, -9.2, 0.45, 0.5); }
    pintar(ctx, Rc(24.4, -2.2, 25.8, 0.8), A); if (!sil) for (let x = 24.8; x < 50; x += 1.0) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, -1.7, 0.45, 0.4); }
    pintar(ctx, suave([[31.8, -1.4], [35.4, -1.4], [35.0, 8.6], [32.2, 8.6]], 0.8, 3), MAT.polimero, { mate: true });
    for (let y = 4.0; y < 8.4; y += 0.8) trazo(ctx, 'rgba(255,255,255,0.08)', 0.25, [[32.4, y], [34.8, y]]);
    // Cañón corto y freno de boca dentado
    pintar(ctx, Rc(50.6, -6.5, 5.6, 2.2), MAT.pavonado, { brillo: 0.4 });
    pintar(ctx, [[56.0, -7.4], [61.0, -7.4], [62.0, -8.2], [62.0, -6.6], [62.4, -5.4], [62.0, -4.2], [62.0, -2.6], [61.0, -3.4], [56.0, -3.4]], MAT.pavonado, { brillo: 0.35 });
    if (!sil) { ctx.fillStyle = '#0b0b0d'; ctx.fillRect(57.2, -6.6, 2.6, 0.8); ctx.fillRect(57.2, -5.0, 2.6, 0.8); }
  } });
DIBUJO_ARMAS.saiga.culataCm = 33.2;

// Milkor MGL (80 cm, calcada de la foto de referencia en color tierra): culata ajustable tipo M4 con cantonera de
// goma, tubo superior que une el armazón con la placa delantera, pistolete negro, tambor de 6 con estrías y remaches
// en la placa, guardamanos de rieles con ventanas, cañón negro con boca acampanada, empuñadura vertical y mira
// réflex encima del tambor. Las medidas se tomaron en píxeles de la foto (MGL_F las pasa a cm: 0,186 cm por píxel,
// origen arriba del pistolete). El tambor, la placa, el cañón y la empuñadura se vuelcan juntos para cargar.
const MGL_F = pts => pts.map(([x, y]) => [(x - 136) * 0.186, (y - 116) * 0.186]);
const MGL_P = (x, y) => [(x - 136) * 0.186, (y - 116) * 0.186];
const MGL_TIERRA = '#a68b69', MGL_TIERRA_CLARA = '#b49c7c', MGL_TIERRA_OSC = '#8a7559', MGL_NEGRO = '#262725';
const MGL_FORMAS = {
  cantonera: suave(MGL_F([[11, 80], [25, 76], [38, 159], [24, 162]]), 0.5, 3),
  culata: suave(MGL_F([[24, 81], [116, 80], [121, 84], [121, 108], [116, 112], [26, 112]]), 0.8, 3),
  culataBaja: suave(MGL_F([[28, 112], [106, 112], [104, 118], [96, 124], [62, 128], [46, 140], [40, 152], [33, 152]]), 0.5, 3),
  tubo: suave(MGL_F([[118, 82], [140, 82], [140, 96], [118, 96]]), 0.3, 2),
  bloqueTrasero: suave(MGL_F([[138, 78], [190, 78], [190, 96], [138, 96]]), 0.4, 2),
  tapaTubo: suave(MGL_F([[164, 62], [173, 62], [173, 84], [164, 84]]), 0.3, 2),
  tuboSuperior: suave(MGL_F([[170, 64], [268, 64], [268, 80], [170, 80]]), 0.9, 3),
  armazon: suave(MGL_F([[124, 112], [186, 84], [197, 86], [197, 128], [158, 128], [148, 122]]), 0.6, 3),
  pistolete: suave(MGL_F([[118, 110], [128, 110], [150, 118], [150, 126], [142, 148], [131, 184], [124, 189], [110, 186], [92, 176], [90, 171], [104, 150], [117, 124]]), 0.8, 4),
  tambor: suave(MGL_F([[196, 86], [224, 83], [252, 83], [252, 183], [224, 183], [196, 176]]), 2.2, 5),
  tamborAtras: suave(MGL_F([[189, 89], [200, 85], [200, 172], [189, 167]]), 0.6, 3),
  placa: suave(MGL_F([[249, 80], [262, 83], [269, 96], [271, 132], [269, 170], [262, 183], [249, 186]]), 1.0, 4),
  bloquePlaca: suave(MGL_F([[255, 61], [276, 61], [279, 69], [279, 97], [262, 97], [255, 89]]), 0.6, 3),
  collar: suave(MGL_F([[266, 88], [283, 88], [283, 118], [266, 118]]), 0.4, 2),
  riel: suave(MGL_F([[280, 79], [389, 79], [389, 122], [280, 122]]), 0.4, 2),
  canon: suave(MGL_F([[386, 88], [437, 88], [437, 116], [386, 116]]), 0.5, 2),
  boca: suave(MGL_F([[435, 85], [442, 86], [443, 101], [442, 116], [435, 117]]), 0.5, 2),
  abrazadera: suave(MGL_F([[326, 120], [360, 120], [360, 131], [326, 131]]), 0.4, 2),
  empunadura: suave(MGL_F([[330, 129], [357, 129], [356, 193], [351, 199], [335, 199], [330, 193]]), 1.0, 4),
  caja: suave(MGL_F([[212, 173], [238, 173], [238, 193], [212, 193]]), 0.4, 2),
  miraBase: MGL_F([[204, 57], [258, 57], [258, 64], [204, 64]]),
  mira: suave(MGL_F([[196, 19], [263, 19], [263, 52], [251, 57], [208, 57], [196, 47]]), 0.8, 3),
  miraRiel: MGL_F([[228, 9], [264, 9], [264, 18], [228, 18]]),
};
reemplazar('mgl', { casquillo: null, casquilloVaciado: 'granada40',
  anclas: { manoDelantera: MGL_P(343, 140), cargador: MGL_P(203, 120), corredera: MGL_P(150, 86), expulsion: MGL_P(203, 120), boca: MGL_P(443, 101) },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, F = MGL_FORMAS, T = MGL_TIERRA, N = MGL_NEGRO, P = MGL_P;
    // Culata ajustable: cuerpo con la costura ondulada, parte baja calada y cantonera de goma
    pintar(ctx, F.tubo, N, { brillo: 0.3 });
    pintar(ctx, F.culataBaja, MGL_TIERRA_OSC, { mate: true, huecos: [...[44, 52, 60, 68, 76, 84, 92].map(x => Ec(...P(x, 117), 0.42, 0.4, 12)), Ec(...P(47, 130), 0.8, 0.75, 14)] });
    pintar(ctx, F.culata, T, { mate: true, brillo: 0.14 });
    if (!sil) {
      const onda = []; for (let x = 30; x <= 114; x += 3) onda.push(P(x, 94 + ((x / 3) % 2 ? 1.6 : -1.6)));
      trazo(ctx, 'rgba(40,24,10,0.6)', 0.18, onda);
      trazo(ctx, 'rgba(255,255,255,0.12)', 0.3, [P(30, 84), P(114, 84)]);
    }
    pintar(ctx, Rc(...P(84, 119), 1.3, 1.6), N);                                                       // palanca de la culata
    pintar(ctx, F.cantonera, MAT.goma, { mate: true });
    if (!sil) for (let y = 90; y < 156; y += 6) trazo(ctx, 'rgba(255,255,255,0.07)', 0.25, [P(15 + (y - 80) * 0.16, y), P(28 + (y - 80) * 0.16, y)]);
    // Armazón trasero, tubo superior y pistolete
    pintar(ctx, F.bloqueTrasero, N, { brillo: 0.3 });
    tornillo(ctx, ...P(150, 88), 0.3); tornillo(ctx, ...P(178, 88), 0.3);
    pintar(ctx, F.tuboSuperior, MGL_TIERRA_OSC, { brillo: 0.35 });
    if (!sil) trazo(ctx, 'rgba(255,255,255,0.16)', 0.35, [P(176, 68), P(262, 68)]);
    pintar(ctx, F.tapaTubo, N, { brillo: 0.3 });
    pintar(ctx, F.armazon, T, { mate: true, brillo: 0.16 });
    tornillo(ctx, ...P(186, 98), 0.3); tornillo(ctx, ...P(172, 120), 0.3);
    pintar(ctx, F.pistolete, MAT.polimero, { mate: true }); punteado(ctx, F.pistolete, 0.45);
    if (!sil) {
      trazo(ctx, '#151515', 0.5, [P(166, 127), P(171, 136), P(170, 147)]);                               // cola del disparador
      trazo(ctx, N, 0.42, [P(151, 127), P(152, 147), P(157, 153), P(184, 153), P(189, 147), P(190, 130)]);   // guardamonte de alambre
    }
    // Tambor, placa, cañón y empuñadura: se vuelcan juntos alrededor de la bisagra de abajo
    const [bx, by] = P(196, 178);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(e.abierto * 0.5); ctx.translate(-bx, -by);
    if (!sil) trazo(ctx, N, 0.4, [P(190, 168), P(197, 178), P(260, 181)]);                                // alambre bajo el tambor
    pintar(ctx, F.caja, N, { brillo: 0.25 });
    pintar(ctx, F.tamborAtras, '#2e2c28', { brillo: 0.3 });
    pintar(ctx, F.tambor, T, { mate: true, brillo: 0.18 });
    if (!sil) for (const y of [111, 147]) {                                                             // estrías entre los caños
      ctx.fillStyle = 'rgba(30,20,8,0.32)'; ctx.fillRect(...P(201, y - 3), 49 * 0.186, 6 * 0.186);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(...P(201, y + 3), 49 * 0.186, 2 * 0.186);
    }
    if (!sil) for (const y of [96, 129, 164]) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(...P(203, y), 45 * 0.186, 3 * 0.186); }
    if (e.abierto > 0.5 && !sil) for (const y of [102, 130, 158]) { ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.ellipse(...P(194, y), 0.5, 1.9, 0, 0, Math.PI * 2); ctx.fill(); }   // bocas de las recámaras, de canto
    pintar(ctx, F.placa, MGL_TIERRA_CLARA, { mate: true, brillo: 0.2 });
    if (!sil) for (const [x, y] of [[257, 95], [262, 112], [263, 130], [262, 148], [258, 165]]) { punto(ctx, ...P(x, y), 0.32, '#e8dcc6'); punto(ctx, ...P(x + 0.6, y + 0.6), 0.2, 'rgba(60,40,20,0.6)'); }
    pintar(ctx, F.bloquePlaca, T, { mate: true, brillo: 0.2 });
    pintar(ctx, Cc(...P(265, 74), 0.85, 14), MGL_TIERRA_OSC); punto(ctx, ...P(265, 74), 0.35, '#5b4a35');
    pintar(ctx, F.collar, MGL_TIERRA_OSC, { brillo: 0.25 });
    pintar(ctx, Rc(...P(272, 121), 2.2, 1.4), N);                                                      // traba del tambor
    // Guardamanos de rieles: ventanas arriba y abajo, riel lateral negro con ranuras
    pintar(ctx, F.riel, T, { mate: true, brillo: 0.14 });
    if (!sil) {
      ctx.fillStyle = '#1a1a18';
      for (let x = 285; x < 386; x += 20) ctx.fillRect(...P(x, 84), 10 * 0.186, 8 * 0.186);
      for (let x = 296; x < 380; x += 28) ctx.fillRect(...P(x, 113), 8 * 0.186, 5 * 0.186);
    }
    pintar(ctx, MGL_F([[282, 94], [387, 94], [387, 110], [282, 110]]), '#2a2b28', { brillo: 0.2 });
    if (!sil) for (let x = 286; x < 386; x += 4.5) trazo(ctx, 'rgba(0,0,0,0.6)', 0.22, [P(x, 95), P(x, 109)]);
    for (const y of [76, 120]) {                                                                       // rieles de arriba y de abajo
      pintar(ctx, MGL_F([[280, y], [388, y], [388, y + 4], [280, y + 4]]), MGL_TIERRA_OSC, { brillo: 0.2 });
      if (!sil) for (let x = 283; x < 386; x += 6.5) { ctx.fillStyle = 'rgba(20,14,6,0.7)'; ctx.fillRect(...P(x, y), 2.4 * 0.186, 4 * 0.186); }
    }
    pintar(ctx, F.canon, '#2b2d29', { brillo: 0.4 });
    if (!sil) trazo(ctx, 'rgba(255,255,255,0.18)', 0.4, [P(390, 93), P(434, 93)]);
    pintar(ctx, F.boca, '#232420', { brillo: 0.35 });
    // Empuñadura vertical con estrías y tapa
    pintar(ctx, F.abrazadera, MGL_TIERRA_OSC, { brillo: 0.2 });
    tornillo(ctx, ...P(338, 125), 0.28); tornillo(ctx, ...P(349, 125), 0.28);
    pintar(ctx, F.empunadura, T, { mate: true, brillo: 0.15 });
    if (!sil) { for (let y = 146; y < 186; y += 5) trazo(ctx, 'rgba(50,32,12,0.35)', 0.28, [P(333, y), P(354, y)]); trazo(ctx, 'rgba(50,32,12,0.45)', 0.3, [P(331, 188), P(356, 188)]); }
    ctx.restore();
    // Mira réflex sobre el tubo: base, cuerpo, lente trasera, perilla, escala y riel de arriba
    pintar(ctx, F.miraBase, N, { brillo: 0.25 });
    pintar(ctx, Rc(...P(209, 51), 11 * 0.186, 7 * 0.186), N); pintar(ctx, Rc(...P(241, 51), 11 * 0.186, 7 * 0.186), N);
    pintar(ctx, F.mira, '#41423e', { brillo: 0.3 });
    pintar(ctx, F.miraRiel, '#2b2c29', { brillo: 0.2 });
    if (!sil) for (let x = 231; x < 263; x += 4.5) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(...P(x, 9), 1.8 * 0.186, 4 * 0.186); }
    pintar(ctx, Cc(...P(205, 26), 1.6, 18), '#1f201e'); punto(ctx, ...P(205, 26), 0.8, '#3a4a52'); punto(ctx, ...P(204, 25), 0.25, 'rgba(255,255,255,0.4)');
    pintar(ctx, Cc(...P(241, 40), 0.95, 14), '#2a2b28'); rayas(ctx, P(238, 0)[0], P(244, 0)[0], P(0, 37)[1], P(0, 43)[1], 0.25, 'rgba(255,255,255,0.12)', 0.1);
    if (!sil) { for (let k = 0; k < 6; k++) trazo(ctx, 'rgba(235,230,215,0.7)', 0.14, [P(214 + k * 1.2, 46 - k * 4.5), P(217 + k * 1.2, 46 - k * 4.5)]); ctx.fillStyle = '#6fb7e8'; ctx.fillRect(...P(262, 24), 0.35, 4.6); }
  } });
DIBUJO_ARMAS.mgl.culataCm = 22;
DIBUJO_ARMAS.mgl.moviles = { manoDelantera: e => girarCm(...MGL_P(343, 140), ...MGL_P(196, 178), e.abierto * 0.5), cargador: e => girarCm(...MGL_P(203, 120), ...MGL_P(196, 178), e.abierto * 0.5) };

/* ----- Cuerpo a cuerpo: todos de pie, la hoja o la cabeza hacia arriba, el origen donde agarra la mano ----- */
// Bisel del filo: franja clara a lo largo del borde cortante (como el afilado de una hoja de verdad)
function biselFilo(ctx, puntos, ancho, color = '#dfe3e8') {
  if (Pincel.silueta) return;
  const interior = puntos.map(([x, y]) => [x - ancho, y]).reverse();
  pintar(ctx, [...puntos, ...interior], color, { brillo: 0.5 });
}
// Vetas de madera a lo largo (los mangos y el bate van de pie; la veta de pintar() es horizontal)
function vetaLarga(ctx, x0, x1, y0, y1, n = 3) {
  if (Pincel.silueta) return;
  for (let k = 0; k < n; k++) { const x = x0 + (x1 - x0) * (k + 0.5) / n; trazo(ctx, 'rgba(60,32,14,0.22)', 0.22, [[x, y0], [x + 0.25, (y0 + y1) / 2], [x - 0.15, y1]]); }
}
const MADERA_MANGO = '#a0703f', MADERA_BATE = '#c9955a';

// Machete latino (63 cm): hoja de acero pavonado de 47 cm que se ensancha hacia la punta, filo afilado brillante,
// lomo recto, cachas de polímero con dos remaches y agujero para el cordón
reemplazar('machete', { casquillo: null,
  anclas: { manoDelantera: [0, 6], cargador: [0, 3], corredera: [0, 3], expulsion: [0, 0], boca: [1.8, -46] },
  dibujarCm(ctx) {
    pintar(ctx, suave([[-1.9, -0.6], [1.9, -0.6], [2.1, 3.4], [1.6, 5.0], [2.1, 6.8], [1.8, 11.0], [-0.2, 12.4], [-2.2, 11.6], [-2.2, 3.0]], 0.8, 3), MAT.polimero, { mate: true });   // cachas
    punteado(ctx, [[-1.6, 1.0], [1.6, 1.0], [1.4, 10.4], [-1.8, 10.4]], 0.45);
    punto(ctx, 0, 2.2, 0.5, '#b8a26a'); punto(ctx, 0, 7.6, 0.5, '#b8a26a');                                       // remaches de latón
    if (!Pincel.silueta) { ctx.beginPath(); ctx.arc(-0.4, 10.6, 0.55, 0, Math.PI * 2); ctx.fillStyle = '#0b0b0d'; ctx.fill(); }   // agujero del cordón
    const filo = [[2.0, -1.2], [2.6, -8], [3.3, -18], [4.1, -29], [4.8, -39], [4.9, -43.6], [4.2, -46.6], [2.6, -48.6]];
    pintar(ctx, [[-1.6, -1.2], ...filo, [0.6, -49.2], [-1.2, -47.6], [-1.6, -40]], '#3a3d42', { brillo: 0.3 });   // hoja pavonada
    biselFilo(ctx, filo, 1.1);
    trazo(ctx, 'rgba(255,255,255,0.18)', 0.25, [[-1.3, -2], [-1.3, -46]]);                                       // lomo con luz
  } });

// Katana (100 cm): tsuka con ito cruzado y kashira, tsuba ovalada, habaki de latón, hoja curva con shinogi,
// hamon ondulado y punta (kissaki) con su línea yokote
reemplazar('katana', { casquillo: null,
  anclas: { manoDelantera: [0, 14], cargador: [0, 6], corredera: [0, 6], expulsion: [0, 0], boca: [3.4, -72] },
  dibujarCm(ctx) {
    const sil = Pincel.silueta;
    pintar(ctx, RRc(-1.7, -1.2, 3.4, 25.2, 1.4), '#e9e2d0');                                                     // samegawa (debajo del ito)
    pintar(ctx, RRc(-1.7, -1.2, 3.4, 25.2, 1.4), '#1d1a22', { huecos: Array.from({ length: 9 }, (_, k) => [[0, 0.6 + k * 2.6], [1.0, 1.9 + k * 2.6], [0, 3.2 + k * 2.6], [-1.0, 1.9 + k * 2.6]]) });   // ito cruzado con rombos
    pintar(ctx, RRc(-1.9, 23.6, 3.8, 1.8, 0.7), '#3a3c42');                                                      // kashira
    pintar(ctx, suave(Rc(-4.4, -2.9, 8.8, 1.7), 0.7, 3), '#2a2b2f', { brillo: 0.4 });                             // tsuba
    pintar(ctx, Rc(-1.6, -3.3, 3.2, 0.4), MAT.laton);                                                           // seppa
    pintar(ctx, suave(Rc(-1.5, -5.4, 3.0, 2.1), 0.3, 2), MAT.laton, { brillo: 0.5 });                             // habaki
    const lomo = [], borde = [];
    for (let k = 0; k <= 14; k++) { const t = k / 14, y = -5.4 - t * 62, c = 2.5 * t * t; lomo.push([-1.3 + c, y]); borde.push([1.4 + c - t * 0.25, y]); }
    const [px, py] = [3.6, -72.6];
    pintar(ctx, [...borde, [3.9, -69.6], [px, py], ...lomo.reverse()], '#cfd4da', { brillo: 0.5 });             // hoja
    if (!sil) {
      ctx.beginPath(); for (let k = 0; k <= 30; k++) { const t = k / 30, y = -6 - t * 61, c = 2.5 * t * t; const x = 0.55 + c - t * 0.15 + Math.sin(k * 1.3) * 0.16; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.3; ctx.stroke();                                // hamon
      ctx.beginPath(); for (let k = 0; k <= 14; k++) { const t = k / 14, y = -5.6 - t * 61, c = 2.5 * t * t; const x = -0.55 + c; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = 'rgba(80,88,98,0.45)'; ctx.lineWidth = 0.18; ctx.stroke();                                 // shinogi
      trazo(ctx, 'rgba(80,88,98,0.5)', 0.18, [[1.2, -67.2], [3.9, -68.0]]);                                       // yokote
    }
  } });

// Hacha de bombero (90 cm): cabeza roja con filo amolado brillante y pico, mango de fibra amarillo con empuñadura
// de goma y tope al final
reemplazar('hacha', { casquillo: null,
  anclas: { manoDelantera: [0, 16], cargador: [0, 8], corredera: [0, 8], expulsion: [0, 0], boca: [14, -61] },
  dibujarCm(ctx) {
    pintar(ctx, suave([[-1.7, -56], [1.7, -56], [1.6, -20], [1.9, 10], [2.4, 21.6], [-2.4, 21.6], [-1.9, 10], [-1.6, -20]], 0.8, 3), '#d9a627', { brillo: 0.45 });   // mango de fibra
    pintar(ctx, suave([[-2.0, 9.6], [2.0, 9.6], [2.5, 21.4], [3.1, 23.6], [-3.1, 23.6], [-2.5, 21.4]], 0.8, 3), MAT.goma);   // goma con tope
    for (let y = 11; y < 21; y += 1.2) trazo(ctx, 'rgba(255,255,255,0.07)', 0.3, [[-1.9, y], [2.0, y]]);
    // Cabeza: hoja con filo convexo a la derecha, ojo al centro y pico a la izquierda
    const filo = [[13.8, -71.6], [15.2, -67.4], [15.7, -61.0], [15.1, -54.6], [13.6, -50.4]];
    pintar(ctx, [[2.6, -66.4], [8.0, -67.2], ...filo, [8.0, -55.4], [2.6, -56.2]], MAT.rojo, { brillo: 0.4 });
    biselFilo(ctx, filo, 2.0, '#c9ced4');
    pintar(ctx, [[-2.6, -65.8], [-9.0, -63.4], [-16.2, -59.6], [-9.0, -59.8], [-2.6, -57.0]], MAT.rojo, { brillo: 0.35 });   // pico
    pintar(ctx, suave(Rc(-2.8, -66.8, 5.6, 11.4), 0.8, 3), MAT.rojo, { brillo: 0.45 });                             // ojo
    pintar(ctx, Rc(-1.2, -66.9, 2.4, 0.9), '#2a2b2f');                                                           // cuña del mango
  } });

// Bate de béisbol con clavos (84 cm): madera clara con veta a lo largo, perilla, cinta antideslizante en espiral,
// barril ancho con la punta redondeada, clavos atravesados con su cabeza, manchas de sangre secas
reemplazar('bate', { casquillo: null,
  anclas: { manoDelantera: [0, 8], cargador: [0, 4], corredera: [0, 4], expulsion: [0, 0], boca: [0, -62] },
  dibujarCm(ctx) {
    const sil = Pincel.silueta;
    const perfil = suave([[-1.25, 11.6], [1.25, 11.6], [1.3, -4], [1.6, -18], [2.6, -32], [3.3, -44], [3.4, -64], [2.6, -67.6], [0, -68.6], [-2.6, -67.6], [-3.4, -64], [-3.3, -44], [-2.6, -32], [-1.6, -18], [-1.3, -4]], 1.0, 4);
    pintar(ctx, perfil, MADERA_BATE, { brillo: 0.45 });
    vetaLarga(ctx, -2.4, 2.4, -66, -30, 4);
    pintar(ctx, suave([[-2.6, 11.0], [2.6, 11.0], [2.8, 13.0], [-2.8, 13.0]], 0.8, 3), MADERA_BATE);              // perilla
    pintar(ctx, suave(Rc(-1.45, -6, 2.9, 17.2), 0.6, 2), '#1d1e22', { mate: true });                              // cinta
    if (!sil) for (let y = -5.6; y < 11; y += 1.3) trazo(ctx, 'rgba(255,255,255,0.12)', 0.18, [[-1.4, y + 0.6], [1.4, y]]);
    // Clavos: la punta asoma de un lado y del otro, la cabeza queda clavada en la madera
    for (const [y, lado, inc] of [[-40, 1, -0.6], [-45, -1, 0.5], [-50, 1, 0.3], [-54, -1, -0.4], [-58, 1, -0.2], [-62, -1, 0.6], [-47, 1, 0.8]]) {
      const ancho = 3.3;
      trazo(ctx, '#9aa0a8', 0.45, [[lado * (ancho - 0.6), y], [lado * (ancho + 2.8), y + inc]]);
      trazo(ctx, 'rgba(255,255,255,0.5)', 0.15, [[lado * (ancho - 0.2), y - 0.12], [lado * (ancho + 2.4), y + inc - 0.12]]);
      punto(ctx, -lado * 1.0, y + 0.4, 0.55, '#7a7f87');
    }
    if (!sil) { for (const [x, y, rx, ry] of [[1.2, -52, 1.1, 2.6], [-1.4, -45, 0.8, 1.8], [1.6, -59, 0.7, 1.4]]) { ctx.fillStyle = 'rgba(105,14,10,0.42)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2); ctx.fill(); } }
  } });

// Mazo de 4 kg (90 cm): cabeza de acero con las caras achaflanadas y la cuña del ojo, mango de nogal con veta y
// empuñadura de goma
reemplazar('mazo', { casquillo: null,
  anclas: { manoDelantera: [0, 15], cargador: [0, 8], corredera: [0, 8], expulsion: [0, 0], boca: [8, -66] },
  dibujarCm(ctx) {
    pintar(ctx, suave([[-1.5, -61], [1.5, -61], [1.4, -30], [1.7, 8], [2.0, 20.6], [-2.0, 20.6], [-1.7, 8], [-1.4, -30]], 0.8, 3), MADERA_MANGO, { brillo: 0.35 });
    vetaLarga(ctx, -1.2, 1.2, -60, 8, 2);
    pintar(ctx, suave([[-1.9, 8.4], [1.9, 8.4], [2.3, 20.4], [2.6, 22.2], [-2.6, 22.2], [-2.3, 20.4]], 0.8, 3), MAT.goma);
    for (let y = 9.6; y < 20.4; y += 1.1) trazo(ctx, 'rgba(255,255,255,0.07)', 0.3, [[-1.9, y], [2.0, y]]);
    pintar(ctx, [[-7.4, -71.0], [7.4, -71.0], [8.6, -69.8], [8.6, -61.6], [7.4, -60.4], [-7.4, -60.4], [-8.6, -61.6], [-8.6, -69.8]], '#4a4d53', { brillo: 0.4 });   // cabeza
    pintar(ctx, [[7.4, -71.0], [8.6, -69.8], [8.6, -61.6], [7.4, -60.4]], '#6b6f76', { brillo: 0.5 });           // caras amoladas
    pintar(ctx, [[-7.4, -71.0], [-8.6, -69.8], [-8.6, -61.6], [-7.4, -60.4]], '#6b6f76', { brillo: 0.5 });
    trazo(ctx, 'rgba(255,255,255,0.18)', 0.3, [[-7.0, -69.8], [7.0, -69.8]]);
    pintar(ctx, Rc(-1.3, -71.1, 2.6, 0.7), MADERA_MANGO); pintar(ctx, Rc(-0.3, -71.2, 0.6, 0.8), MAT.acero);     // punta del mango y cuña
  } });

// Cuchillo de combate (30 cm): hoja de 19 cm con punta de lanza, bisel brillante en el filo, guarda de acero,
// mango estriado y pomo
DIBUJO_ARMAS.cuchillo = modelo({ casquillo: null,
  anclas: { manoDelantera: [0, 6], cargador: [0, 3], corredera: [0, 3], expulsion: [0, 0], boca: [0.5, -20] },
  dibujarCm(ctx) {
    pintar(ctx, suave([[-1.6, -0.6], [1.6, -0.6], [1.8, 4.0], [1.5, 7.0], [1.7, 10.6], [-1.7, 10.6], [-1.5, 7.0], [-1.8, 4.0]], 0.8, 3), '#2a2b2f', { mate: true });   // mango
    for (let y = 1; y < 10; y += 1.3) trazo(ctx, 'rgba(255,255,255,0.08)', 0.3, [[-1.4, y], [1.4, y]]);
    pintar(ctx, suave(Rc(-1.6, 10.4, 3.2, 1.6), 0.5, 2), MAT.acero);                                             // pomo
    pintar(ctx, suave(Rc(-3.0, -1.8, 6.0, 1.2), 0.5, 2), MAT.acero, { brillo: 0.4 });                             // guarda
    const filo = [[1.5, -1.8], [1.8, -10], [1.6, -15.5], [0.9, -18.6], [0.1, -20.0]];
    pintar(ctx, [[-1.4, -1.8], ...filo, [-0.8, -17.0], [-1.4, -12]], '#4a4d53', { brillo: 0.35 });               // hoja
    biselFilo(ctx, filo, 0.7);
    trazo(ctx, 'rgba(255,255,255,0.2)', 0.2, [[-1.2, -2.4], [-1.2, -12]]);
  } });
Object.assign(DIBUJO_ARMAS.cuchillo, { agarre: 'cuerpo', anguloEmpunadura: 0 });
