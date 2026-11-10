/* ===== Dibujo detallado de cada arma (1/2: herramientas, pistolas y metralletas) =====
 * Coordenadas locales: origen en la mano del gatillo, +x hacia adelante, -y hacia arriba.
 * Cada arma define, además de cómo se dibuja, sus puntos de anclaje:
 *   manoDelantera  dónde apoya la otra mano         cargador   dónde entra el cargador, el peine o la bala
 *   corredera      qué se acciona al final           expulsion  por dónde salen los casquillos al disparar
 *   boca           de dónde sale el tiro             casquillo  tipo de casquillo al disparar (null: no tira, como los revólveres)
 *   casquilloVaciado  lo que cae al abrir el arma en la recarga (tambor, quiebre)
 * dibujar(ctx, e) recibe e = { sinCargador, corredera: 0..1 (pulso), abierto: 0..1 (sostenido), bombeo: 0..1, palanca: 0..1 }.
 */
const METAL = '#2a2a2e', METAL_CLARO = '#5a5a62', MADERA = '#7a4a2a', MADERA_OSCURA = '#5a3a1e';

function cargadorRecto(ctx, x, y, w, h, color, e) { if (!e.sinCargador) { parte(ctx, x, y, w, h, color); ctx.fillStyle = tinta(ajustarColor(color, 0.25)); ctx.fillRect(x, y + h - 2, w, 2); } }
function cargadorCurvo(ctx, x, y, e, color = '#3a3a3a') {
  if (e.sinCargador) return;
  parte(ctx, x, y, 6, 6, color); parte(ctx, x + 1, y + 5, 6, 5, color); parte(ctx, x + 2, y + 9, 6, 4, color);
  ctx.fillStyle = tinta('#6a6a6a'); ctx.fillRect(x + 2, y + 12, 6, 1);
}
function guardamonte(ctx, x, y) { ctx.strokeStyle = tinta(METAL); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI); ctx.stroke(); }
function mira(ctx, x, y) { ctx.fillStyle = tinta(METAL_CLARO); ctx.fillRect(x, y, 1.5, 2); }
function mirilla(ctx, x, y, w) {
  parte(ctx, x, y, w, 4, '#1e1e1e'); parte(ctx, x + 2, y + 4, 3, 3, METAL); parte(ctx, x + w - 5, y + 4, 3, 3, METAL);
  if (!Pincel.silueta) { ctx.fillStyle = '#7ec8ff'; ctx.fillRect(x + w - 1, y + 1, 1, 2); }
}
// Tambor de revólver: cerrado dentro del armazón, abierto se vuelca hacia abajo y afuera
function tamborRevolver(ctx, x, y, e, color) {
  const a = e.abierto, tx = x - a * 2, ty = y + a * 7;
  parte(ctx, tx, ty, 8, 8, color);
  if (a > 0.5) {
    ctx.fillStyle = tinta('#2a2a30'); for (let k = 0; k < 3; k++) ctx.fillRect(tx + 1.5 + k * 2.5, ty + 2, 1.5, 4);   // recámaras vacías a la vista
    parte(ctx, tx + 3, ty - 4, 2, 4, '#8a8a92');                                                                   // vástago expulsor
  } else { ctx.fillStyle = tinta(ajustarColor(color, -0.3)); for (let k = 0; k < 3; k++) ctx.fillRect(tx + 1, ty + 1 + k * 3, 6, 1); }   // estrías
}

const DIBUJO_ARMAS = {
  /* ---------- Pistolas ---------- */
  glock: { manoDelantera: { x: 3, y: 4 }, cargador: { x: 3, y: 10 }, corredera: { x: 0, y: -8 }, expulsion: { x: 8, y: -6 }, boca: { x: 24, y: -4 }, casquillo: 'bala',
    dibujar(ctx, e) {
      parte(ctx, 0, 0, 20, 3, '#3a3a3a');
      parte(ctx, -1, 1, 7, 10, '#3a3a3a'); ctx.fillStyle = tinta('#2a2a2a'); for (let k = 0; k < 4; k++) ctx.fillRect(0, 3 + k * 2, 5, 1);
      cargadorRecto(ctx, 0, 10, 6, 3, '#222', e);
      parte(ctx, -2 - e.corredera * 6, -6, 25, 6, METAL);                   // corredera: atrás mientras está trabada
      mira(ctx, 20 - e.corredera * 6, -8); mira(ctx, -1 - e.corredera * 6, -8);
      parte(ctx, 20, -5, 4, 3, METAL_CLARO); guardamonte(ctx, 7, 3);
    } },
  magnum: { manoDelantera: { x: 2, y: 5 }, cargador: { x: 7, y: 2 }, corredera: { x: 8, y: -9 }, expulsion: { x: 8, y: -4 }, boca: { x: 30, y: -4 }, casquillo: null, casquilloVaciado: 'bala',
    dibujar(ctx, e) {
      parte(ctx, -2, 1, 7, 11, MADERA_OSCURA);
      parte(ctx, 0, -4, 14, 5, '#b9b9c4');
      parte(ctx, 12, -6, 18, 4, '#b9b9c4'); parte(ctx, 12, -8, 18, 2, '#8a8a92');
      tamborRevolver(ctx, 4, -6, e, '#9a9aa5');
      mira(ctx, 28, -10); guardamonte(ctx, 6, 3); parte(ctx, 5, 1, 2, 3, METAL);
    } },
  colt1911: { manoDelantera: { x: 3, y: 4 }, cargador: { x: 3, y: 10 }, corredera: { x: 5, y: -7 }, expulsion: { x: 9, y: -6 }, boca: { x: 26, y: -4 }, casquillo: 'bala',
    dibujar(ctx, e) {
      parte(ctx, 0, 0, 20, 3, '#3b3f44');                                   // armazón
      parte(ctx, -1, 1, 7, 10, '#3b3f44'); parte(ctx, 0, 3, 5, 7, MADERA); // empuñadura con cachas de madera
      cargadorRecto(ctx, 0, 10, 6, 3, '#222', e);
      parte(ctx, -2, -4, 3, 3, METAL_CLARO);                                // martillo
      parte(ctx, -1 - e.corredera * 6, -6, 27, 6, '#2e3236');               // corredera
      ctx.fillStyle = tinta('#1e2226'); for (let k = 0; k < 4; k++) ctx.fillRect(19 - e.corredera * 6 + k * 1.5, -5, 0.6, 4);   // estrías de agarre
      mira(ctx, 22 - e.corredera * 6, -8); parte(ctx, 22, -5, 4, 3, METAL_CLARO); guardamonte(ctx, 7, 3);
    } },
  deagle: { manoDelantera: { x: 3, y: 5 }, cargador: { x: 3, y: 12 }, corredera: { x: 0, y: -10 }, expulsion: { x: 10, y: -8 }, boca: { x: 32, y: -5 }, casquillo: 'grande',
    dibujar(ctx, e) {
      parte(ctx, 0, 0, 24, 3, '#6e6e76');
      parte(ctx, -1, 1, 8, 12, '#2a2a2e'); cargadorRecto(ctx, 0, 12, 7, 3, '#222', e);
      parte(ctx, -2 - e.corredera * 7, -8, 33, 8, '#8e8e96');               // corredera maciza
      parte(ctx, 6 - e.corredera * 7, -10, 24, 2, '#6e6e76');               // riel superior
      ctx.fillStyle = tinta('#5a5a62'); for (let k = 0; k < 4; k++) ctx.fillRect(24 - e.corredera * 7 + k * 1.6, -7, 0.7, 6);
      mira(ctx, 28 - e.corredera * 7, -12); parte(ctx, 28, -7, 4, 5, METAL_CLARO); guardamonte(ctx, 8, 3);
    } },
  python: { manoDelantera: { x: 2, y: 5 }, cargador: { x: 7, y: 2 }, corredera: { x: 8, y: -9 }, expulsion: { x: 8, y: -4 }, boca: { x: 32, y: -4 }, casquillo: null, casquilloVaciado: 'bala',
    dibujar(ctx, e) {
      parte(ctx, -2, 1, 7, 11, '#4a2a1a');
      parte(ctx, 0, -4, 14, 5, '#2a2d33');
      parte(ctx, 12, -6, 20, 4, '#2a2d33'); parte(ctx, 12, -9, 20, 3, '#1e2026');   // cañón con costilla ventilada
      ctx.fillStyle = tinta('#3e424a'); for (let k = 0; k < 5; k++) ctx.fillRect(14 + k * 3.5, -8.5, 2, 1.5);
      parte(ctx, 12, -2, 20, 2, '#1e2026');                                 // cubrevástago inferior
      tamborRevolver(ctx, 4, -6, e, '#3a3e46');
      mira(ctx, 30, -11); guardamonte(ctx, 6, 3); parte(ctx, 5, 1, 2, 3, METAL);
    } },
  mauser: { manoDelantera: { x: 10, y: 4 }, cargador: { x: 9, y: -9 }, corredera: { x: -2, y: -8 }, expulsion: { x: 8, y: -7 }, boca: { x: 36, y: -4 }, casquillo: 'bala',
    dibujar(ctx, e) {
      parte(ctx, -4, 1, 6, 12, MADERA_OSCURA); parte(ctx, -5, 12, 7, 3, MADERA);   // empuñadura "mango de escoba"
      parte(ctx, 0, -2, 18, 4, '#45484f');                                  // armazón
      parte(ctx, 6, -1, 8, 8, '#45484f'); ctx.fillStyle = tinta('#2e3036'); ctx.fillRect(7, 1, 6, 1); ctx.fillRect(7, 4, 6, 1);   // depósito fijo delante del gatillo
      parte(ctx, 16, -5, 20, 3, METAL);                                     // cañón largo y fino
      const ab = Math.max(e.corredera, e.abierto);
      parte(ctx, 2 - ab * 6, -7, 12, 5, '#3a3d44');                         // cerrojo: atrás para meter el peine
      if (ab > 0.3) { ctx.fillStyle = tinta('#111'); ctx.fillRect(8, -6, 5, 3); }
      parte(ctx, -1 - ab * 6, -8, 4, 2, METAL_CLARO); mira(ctx, 33, -7); guardamonte(ctx, 4, 3);
    } },

  /* ---------- Metralletas ---------- */
  uzi: { manoDelantera: { x: 16, y: 3 }, cargador: { x: 6, y: 12 }, corredera: { x: 0, y: -9 }, expulsion: { x: 10, y: -7 }, boca: { x: 32, y: -4 }, casquillo: 'bala',
    dibujar(ctx, e) {
      parte(ctx, -16, -5, 10, 3, METAL); parte(ctx, -8, -3, 3, 6, METAL);
      parte(ctx, -6, -8, 30, 10, '#4a4a52');
      parte(ctx, 3, 2, 6, 9, '#3a3a3a'); cargadorRecto(ctx, 4, 10, 5, 8, '#222', e);
      parte(ctx, -4 - e.corredera * 5, -10, 6, 3, METAL_CLARO);
      parte(ctx, 24, -5, 8, 3, METAL); mira(ctx, 22, -10); mira(ctx, -4, -10); guardamonte(ctx, 11, 3);
    } },
  ak47: { manoDelantera: { x: 24, y: -2 }, cargador: { x: 11, y: 8 }, corredera: { x: 4, y: -8 }, expulsion: { x: 10, y: -7 }, boca: { x: 46, y: -4 }, casquillo: 'bala',
    dibujar(ctx, e) {
      culata(ctx, -3, -6, 17, 6, MADERA, 2);
      parte(ctx, -4, -8, 26, 8, '#3a3a3a');
      parte(ctx, -1, 0, 5, 9, MADERA);
      cargadorCurvo(ctx, 8, 0, e);
      parte(ctx, 18, -7, 14, 6, MADERA); parte(ctx, 20, -9, 14, 2, METAL); parte(ctx, 32, -5, 14, 3, METAL);
      parte(ctx, 2 - e.corredera * 6, -9, 5, 2, METAL_CLARO);
      mira(ctx, 42, -8); parte(ctx, 4, -10, 3, 2, METAL); guardamonte(ctx, 7, 2);
    } },
  m16: { manoDelantera: { x: 30, y: -2 }, cargador: { x: 12, y: 8 }, corredera: { x: 6, y: -4 }, expulsion: { x: 12, y: -7 }, boca: { x: 54, y: -4 }, casquillo: 'bala',
    dibujar(ctx, e) {
      culata(ctx, -3, -6, 19, 6, '#2f3a2f', 1);
      parte(ctx, -4, -8, 28, 8, '#2f3a2f');
      parte(ctx, 0, -12, 16, 4, '#2f3a2f'); parte(ctx, 2, -14, 12, 2, '#2f3a2f');
      parte(ctx, 0, 0, 5, 8, '#2f3a2f');
      cargadorRecto(ctx, 10, 0, 5, 12, '#2a2a2a', e);
      parte(ctx, 24, -7, 16, 6, '#2f3a2f'); ctx.fillStyle = tinta('#1e261e'); for (let k = 0; k < 4; k++) ctx.fillRect(26 + k * 4, -6, 1, 4);
      parte(ctx, 40, -5, 14, 3, METAL); parte(ctx, 42, -9, 2, 4, METAL);
      parte(ctx, 4, -5, 4, 3, '#1e261e');                                   // retén del cerrojo: se palmea
      guardamonte(ctx, 7, 2);
    } },
  mp5: { manoDelantera: { x: 24, y: -2 }, cargador: { x: 10, y: 8 }, corredera: { x: 24, y: -11 }, expulsion: { x: 12, y: -7 }, boca: { x: 46, y: -4 }, casquillo: 'bala',
    dibujar(ctx, e) {
      parte(ctx, -22, -7, 18, 2.5, METAL); parte(ctx, -22, -2, 18, 2.5, METAL); parte(ctx, -22, -7, 3, 8, METAL);   // culata retráctil
      parte(ctx, -4, -8, 26, 8, '#2a2a2e');                                 // cajón
      parte(ctx, -1, 0, 6, 8, '#1e1e22');                                   // pistolete con guardamonte grande
      cargadorCurvo(ctx, 8, 0, e, '#2a2a2e');
      parte(ctx, 20, -7, 16, 6, '#1e1e22');                                 // guardamanos
      parte(ctx, 20, -11, 20, 4, METAL);                                    // tubo del cañón
      parte(ctx, 38, -5, 8, 3, METAL);
      parte(ctx, 24 - e.corredera * 3, -14 + (1 - e.corredera) * 2, 5, 3, METAL_CLARO);   // manija: trabada arriba, baja de un palmazo
      parte(ctx, 2, -11, 6, 3, METAL); mira(ctx, 42, -9); guardamonte(ctx, 8, 2);
    } },
  p90: { manoDelantera: { x: 18, y: 2 }, cargador: { x: 10, y: -12 }, corredera: { x: 6, y: -5 }, expulsion: { x: 4, y: 3 }, boca: { x: 34, y: -5 }, casquillo: 'bala',
    dibujar(ctx, e) {
      parte(ctx, -14, -8, 42, 9, '#3a3f3a');                                // cuerpo bullpup
      parte(ctx, -14, -2, 10, 8, '#3a3f3a'); parte(ctx, 4, 1, 20, 5, '#2e322e');   // culata y guardamanos con hueco para el pulgar
      parte(ctx, 0, 1, 4, 7, '#2e322e');
      if (!e.sinCargador) { parte(ctx, -8, -11, 34, 3, '#4a4f4a'); ctx.fillStyle = tinta('#8a7a3a'); for (let k = 0; k < 6; k++) ctx.fillRect(-5 + k * 5, -10, 2, 1); }   // cargador acostado arriba, con las balas asomando
      parte(ctx, 26, -6, 8, 4, METAL);                                      // cañón corto
      parte(ctx, 2 - e.corredera * 4, -6, 5, 2, METAL_CLARO);               // manija lateral
      mira(ctx, 10, -13); mira(ctx, 24, -13);
    } },
};

// Brazo como barra girada del hombro a la mano
function brazo(ctx, x0, y0, x1, y1, grosor, color) {
  const ang = Math.atan2(y1 - y0, x1 - x0), largo = Math.hypot(x1 - x0, y1 - y0);
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang); parte(ctx, 0, -grosor / 2, largo, grosor, color); ctx.restore();
}
