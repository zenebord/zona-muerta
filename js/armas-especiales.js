/* ===== Armas especiales: el machete del cazador y la minigun M134 =====
 * Machete del cazador (macheteCazador, js/armas.js): es del personaje «cazador» (js/skins.js) y de nadie más.
 *   - Jugador.recoger lo rechaza con otro personaje y Juego.equiparArma no lo pone en la mano: no sale en las listas, ni
 *     en el campo de pruebas, ni en el inventario de otro personaje.
 *   - En cada cuadro se revisa el inventario: con el cazador el machete está siempre (como el cuchillo de la historia);
 *     con otro personaje se saca, y si estaba en la mano pasa a la siguiente arma.
 *   - El susurro «ch ch ch… ja ja ja» (Audio_.susurroCazador): al sacarlo, sin ruido de arma antes (nunca antes de
 *     que termine el anterior: dos no se pisan), y, cuando pasaron 8 s del último, al matar con él (siempre) o al pegar
 *     (4 de cada 10 golpes).
 * Minigun M134 (minigun): seis cañones que gira un motor eléctrico.
 *   - Estado en jugador.minigun: vel (0 quietos … 1 a velocidad de tiro), angulo (giro del grupo), calor de los cañones.
 *   - Con el gatillo apretado los cañones arrancan (arma.giratoria.arranque ms) sin tirar; recién a velocidad tiran a su
 *     cadencia. Al soltar siguen girando y frenan (giratoria.frenado ms). Vacía o recargando no tira; vacía, gira igual.
 *   - Jugador.estadoArma suma e.giro, e.velGiro, e.calor, e.cinta (avance de la cinta entre tiro y tiro) y e.balas.
 *   - El motor y el rugido suenan con Audio_.minigun(vel, tirando) en cada cuadro; cada tiro, con Audio_.disparo.
 *   - Las vainas salen por la ventana del costado de la carcasa; la caja vacía cae al piso (CajaMinigunCae).
 * Todo se engancha envolviendo métodos de Jugador y de Juego: jugador.js no cambia.
 */

/* ---------- Quién puede tener cada arma ---------- */
// Personaje con el que juega (la vista previa del menú lleva el suyo en j.skin; si no, el de la configuración)
function skinDelJugador(j) {
  if (j && SKINS[j.skin]) return j.skin;
  const elegida = Config.get('skin');
  return SKINS[elegida] ? elegida : 'sobreviviente';
}
// ¿Puede tener esta arma? Las de un personaje (arma.skin), solo con ese personaje
function armaPermitida(id, jugador = null) {
  const a = ARMAS[id];
  return !!a && (!a.skin || a.skin === skinDelJugador(jugador));
}
const ARMAS_DE_PERSONAJE = Object.keys(ARMAS).filter(id => ARMAS[id].skin);

// Mezcla de dos colores '#rrggbb' (k de 0 a 1), en '#rrggbb' para que el acabado de pintar() sepa el material
function mezclaHex(a, b, k) {
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16), c = s => Math.round(((na >> s) & 255) + ((((nb >> s) & 255) - ((na >> s) & 255)) * k));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}
// Azar con semilla: las manchas, el óxido y las mellas salen iguales en cada cuadro
function azarFijo(semilla) { let s = semilla >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function rellenar(ctx, pts, color) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }

/* ======================= MACHETE DEL CAZADOR =======================
 * 76 cm de punta a punta. Hoja de 58 cm de acero al carbono viejo, recta de lomo y cada vez más ancha hacia la punta
 * (la panza llega a 7,4 cm), con la punta que sube hacia el lomo. El filo está amolado a mano y desparejo, con cuatro
 * mellas; óxido en manchas (más en el lomo y cerca del mango), picaduras, rayones, y sangre seca en la mitad de
 * adelante que chorreó hacia el lomo. Virola de acero oxidada; mango de madera gastada y oscura de mugre, rajado, con
 * dos remaches a la vista, cinta aisladora que emparcha la parte de abajo (con la punta despegada) y un cordón viejo
 * en el ojal. Origen en la mano: la hoja hacia y negativa, el filo del lado +x (va adelante en el golpe).
 */
const MACHETE_CAZADOR = (() => {
  const azar = azarFijo(1980);
  const panza = [[2.0, -2.4], [2.4, -9], [3.0, -18], [3.8, -27], [4.7, -36], [5.4, -44], [5.75, -49.5]];
  const xFilo = y => {
    for (let k = 0; k < panza.length - 1; k++) { const [x0, y0] = panza[k], [x1, y1] = panza[k + 1]; if (y <= y0 && y >= y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0); }
    return y > panza[0][1] ? panza[0][0] : panza[panza.length - 1][0];
  };
  const mellas = [[-12.5, 0.55], [-23.5, 0.85], [-34, 0.5], [-42.5, 0.75]];   // altura y hondura de cada mella
  const filo = [], esMella = [];
  for (let y = -2.4; y > -49.5; y -= 1.1) {
    filo.push([xFilo(y) + (azar() - 0.5) * 0.08, y]); esMella.push(false);
    for (const [ym, h] of mellas) if (ym <= y && ym > y - 1.1) {
      filo.push([xFilo(ym + 0.5), ym + 0.5], [xFilo(ym) - h, ym + 0.12], [xFilo(ym - 0.42), ym - 0.42]); esMella.push(true, true, true);
    }
  }
  for (const p of [[5.75, -49.5], [5.5, -53.2], [4.6, -56.6], [3.1, -59.4], [1.1, -61.6]]) { filo.push(p); esMella.push(false); }
  const lomo = [[0.1, -60.6], [-0.85, -58.6], [-1.45, -55.8], [-1.6, -52.6], [-1.6, -2.4]];   // la punta recortada baja al lomo
  const hoja = [...filo, ...lomo];
  // Bisel del filo: franja amolada, de 1,1 cm hacia adentro (en la punta se angosta)
  const bisel = [...filo, ...filo.map(([x, y], i) => [x - (y < -55 ? 0.7 : 1.15) + (esMella[i] ? 0.35 : 0), y + (y < -58 ? 0.7 : 0)]).reverse()];
  // Óxido: manchas de borde difuso (centro, radios, color, opacidad), la mayoría contra el lomo y cerca de la virola;
  // adentro, un granulado de puntitos más oscuros y más claros, y picaduras
  const oxido = [];
  const mancha = (x, y, rx, ry, color, a) => oxido.push({ x, y, rx, ry, color, a, forma: Array.from({ length: 11 }, (_, i) => { const t = i / 11 * Math.PI * 2, k = 0.62 + azar() * 0.5; return [x + Math.cos(t) * rx * k, y + Math.sin(t) * ry * k]; }) });
  for (let k = 0; k < 11; k++) { const y = -4 - azar() * 52; mancha(-1.2 + azar() * 0.9, y, 0.9 + azar() * 0.9, 1.6 + azar() * 3, '96,42,16', 0.42 + azar() * 0.2); }   // contra el lomo
  for (let k = 0; k < 9; k++) { const y = -4 - azar() * 54, x = -1.2 + Math.pow(azar(), 1.6) * (xFilo(Math.max(y, -49)) + 0.4); mancha(x, y, 0.5 + azar() * 1.3, 0.5 + azar() * 1.1, azar() < 0.5 ? '120,56,22' : '150,78,32', 0.3 + azar() * 0.25); }
  mancha(0.2, -4.6, 2.6, 2.4, '104,46,18', 0.5); mancha(1.6, -6.8, 1.4, 1.2, '150,78,32', 0.35); mancha(0.8, -57.8, 1.5, 1.8, '120,56,22', 0.38);
  const granos = [];
  for (const o of oxido) for (let k = 0; k < 9; k++) { const t = azar() * Math.PI * 2, d = Math.sqrt(azar()) * 0.85; granos.push([o.x + Math.cos(t) * o.rx * d, o.y + Math.sin(t) * o.ry * d, 0.05 + azar() * 0.12, azar() < 0.6 ? 'rgba(52,22,8,0.55)' : 'rgba(186,104,46,0.45)']); }
  const rayones = Array.from({ length: 16 }, () => { const y = -5 - azar() * 50, x = -1.2 + azar() * (xFilo(Math.max(y, -49)) + 0.4), l = 1.5 + azar() * 4, a = -0.5 + azar() * 1.0; return [[x, y], [x + Math.sin(a) * l * 0.4, y - Math.cos(a) * l]]; });
  // Sangre seca, oscura: una mancha despareja pegada al filo, en la panza (la parte que corta), salpicaduras y una
  // chorreadura hacia el lomo
  const sangre = [[5.1, -39.5], [5.35, -43], [5.55, -46.5], [5.6, -49.6], [5.15, -52.2], [4.2, -52.8], [3.7, -51.2], [3.95, -49], [3.55, -47.4], [4.1, -45.3], [3.9, -43.2], [4.35, -41.2]].map(([x, y]) => [x - 0.35 + (azar() - 0.5) * 0.25, y]);
  const chorros = [[[3.8, -48.2], [2.7, -48.9], [1.7, -49.9]], [[4.1, -42.6], [3.2, -43.1]]];
  const salpicaduras = [[2.2, -45.6, 0.28], [1.1, -44.1, 0.18], [2.9, -53.6, 0.22], [0.4, -51.8, 0.14], [3.0, -37.2, 0.16], [1.6, -55.9, 0.2], [4.3, -35.4, 0.12]];
  const mango = suave([[-2.05, -1.3], [2.05, -1.3], [2.2, 2.6], [1.85, 5.0], [2.3, 7.6], [2.5, 11.0], [3.1, 12.5], [2.4, 13.6], [-1.0, 13.7], [-2.4, 12.6], [-2.35, 6.4], [-2.2, 2.4]], 0.7, 3);
  return { hoja, filo, esMella, bisel, oxido, granos, rayones, sangre, chorros, salpicaduras, mango };
})();

DIBUJO_ARMAS.macheteCazador = modelo({ casquillo: null, agarre: 'cuerpo', anguloEmpunadura: 0,
  anclas: { manoDelantera: [0, 6], cargador: [0, 3], corredera: [0, 3], expulsion: [0, 0], boca: [0.5, -61] },
  dibujarCm(ctx) {
    const M = MACHETE_CAZADOR, sil = Pincel.silueta;
    // Cordón viejo en el ojal del mango (detrás del mango)
    if (!sil) { ctx.beginPath(); ctx.ellipse(0.9, 15.1, 1.1, 2.0, -0.25, 0, Math.PI * 2); ctx.strokeStyle = '#5e4e36'; ctx.lineWidth = 0.38; ctx.stroke(); trazo(ctx, 'rgba(94,78,54,0.9)', 0.18, [[1.5, 16.9], [1.9, 17.8]]); trazo(ctx, 'rgba(94,78,54,0.9)', 0.15, [[0.9, 17.1], [0.7, 18.0]]); }
    // Hoja
    pintar(ctx, M.hoja, '#4b4f55', { brillo: 0.25 });
    if (!sil) {
      ctx.save(); rellenar(ctx, M.hoja, 'rgba(0,0,0,0)'); ctx.clip();
      const g = ctx.createLinearGradient(-1.6, 0, 5.8, 0);   // pátina: el acero viejo se oscurece hacia el lomo
      g.addColorStop(0, 'rgba(40,30,24,0.35)'); g.addColorStop(0.5, 'rgba(60,52,44,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(-2, -62, 8.5, 61);
      for (const o of M.oxido) {   // borde difuso: el óxido se come el acero de a poco
        const g2 = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, Math.max(o.rx, o.ry));
        g2.addColorStop(0, `rgba(${o.color},${o.a})`); g2.addColorStop(0.55, `rgba(${o.color},${o.a * 0.75})`); g2.addColorStop(1, `rgba(${o.color},0)`);
        rellenar(ctx, o.forma, g2);
      }
      for (const [x, y, r, c] of M.granos) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
      for (const r of M.rayones) trazo(ctx, 'rgba(215,220,226,0.16)', 0.06, r);
      trazo(ctx, 'rgba(255,255,255,0.14)', 0.22, [[-1.35, -3], [-1.35, -53]]);   // lomo con luz
      // Filo amolado a mano: franja más clara, desgastada, con el canto brillante cortado en las mellas
      pintar(ctx, M.bisel, '#7d838a', { brillo: 0.35 });
      for (const r of M.rayones.slice(0, 8)) trazo(ctx, 'rgba(255,255,255,0.12)', 0.05, [[r[0][0] + 3.5, r[0][1]], [r[0][0] + 3.9, r[0][1] - 1.6]]);
      ctx.lineCap = 'round';
      for (let i = 0; i < M.filo.length - 1; i++) {
        const [ax, ay] = M.filo[i], [bx, by] = M.filo[i + 1];
        if (M.esMella[i] || M.esMella[i + 1]) { trazo(ctx, 'rgba(30,20,14,0.7)', 0.12, [[ax, ay], [bx, by]]); continue; }
        trazo(ctx, 'rgba(232,236,242,0.62)', 0.13, [[ax - 0.08, ay], [bx - 0.08, by]]);
      }
      // Sangre seca: mancha oscura con el borde apenas más rojo, chorreaduras con su gota y salpicaduras
      rellenar(ctx, M.sangre, 'rgba(52,8,5,0.74)');
      ctx.save(); rellenar(ctx, M.sangre, 'rgba(0,0,0,0)'); ctx.clip(); ctx.strokeStyle = 'rgba(96,18,10,0.5)'; ctx.lineWidth = 0.35; ctx.stroke(); ctx.restore();
      for (const c of M.chorros) { trazo(ctx, 'rgba(54,8,5,0.7)', 0.2, c); const [x, y] = c[c.length - 1]; ctx.beginPath(); ctx.ellipse(x, y, 0.22, 0.3, 0.6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(50,7,4,0.78)'; ctx.fill(); }
      for (const [x, y, r] of M.salpicaduras) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0.4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(58,9,5,0.7)'; ctx.fill(); }
      ctx.restore();
    }
    // Virola de acero, oxidada
    pintar(ctx, RRc(-2.35, -2.6, 4.7, 1.55, 0.3), '#45484d', { brillo: 0.35 });
    if (!sil) { rellenar(ctx, [[-1.9, -2.5], [-0.6, -2.3], [-0.9, -1.2], [-2.1, -1.3]], 'rgba(130,64,26,0.55)'); rellenar(ctx, [[1.0, -2.4], [2.0, -2.1], [1.8, -1.2], [0.7, -1.4]], 'rgba(110,52,22,0.45)'); }
    // Mango de madera gastada
    pintar(ctx, M.mango, '#5a3a22', { brillo: 0.12 });
    if (!sil) {
      ctx.save(); rellenar(ctx, M.mango, 'rgba(0,0,0,0)'); ctx.clip();
      const g = ctx.createLinearGradient(0, -1.3, 0, 13.7);   // mugre arriba y abajo, gastado y más claro donde agarra la palma
      g.addColorStop(0, 'rgba(22,10,4,0.45)'); g.addColorStop(0.12, 'rgba(22,10,4,0.05)'); g.addColorStop(0.35, 'rgba(255,226,186,0.1)'); g.addColorStop(0.5, 'rgba(255,226,186,0.04)'); g.addColorStop(1, 'rgba(22,10,4,0.35)');
      ctx.fillStyle = g; ctx.fillRect(-3, -2, 7, 16);
      for (let k = 0; k < 4; k++) trazo(ctx, 'rgba(30,14,5,0.3)', 0.1, [[-1.6 + k * 1.05, -0.8], [-1.4 + k * 1.05, 6], [-1.7 + k * 1.1, 13]]);   // veta a lo largo
      trazo(ctx, 'rgba(12,6,2,0.7)', 0.13, [[-0.9, -0.6], [-0.4, 2.0], [-0.7, 3.4], [-0.3, 5.9]]);              // rajadura
      ctx.restore();
      for (const y of [1.2, 4.5]) { punto(ctx, 0.1, y, 0.55, '#3a2c18'); punto(ctx, 0.1, y, 0.42, '#8c7c50'); punto(ctx, -0.05, y - 0.12, 0.15, 'rgba(255,240,200,0.5)'); }   // remaches
      ctx.beginPath(); ctx.arc(0.3, 12.4, 0.45, 0, Math.PI * 2); ctx.fillStyle = '#0d0a08'; ctx.fill();          // ojal del cordón
    }
    // Cinta aisladora que emparcha la parte de abajo del mango, con la punta despegada
    pintar(ctx, suave([[-2.48, 7.0], [2.42, 7.2], [2.62, 11.1], [-2.5, 11.3]], 0.35, 2), '#1d1d20', { mate: true, brillo: 0.12 });
    pintar(ctx, [[2.5, 10.4], [3.7, 11.7], [3.2, 12.0], [2.4, 11.2]], '#1d1d20', { mate: true, brillo: 0.1 });
    if (!sil) for (let y = 7.4; y < 11; y += 0.75) trazo(ctx, 'rgba(255,255,255,0.13)', 0.07, [[-2.4, y + 0.35], [2.45, y]]);
  } });

/* ======================= MINIGUN M134 =======================
 * Unos 80 cm de punta a punta, más la caja. Vista del lado izquierdo, la boca a la derecha, el origen arriba de la
 * empuñadura de pistola (y hacia abajo):
 *   - carcasa cilíndrica (gun housing) con bandas, chapa de datos, tornillos y la ventana por donde saltan las vainas;
 *   - atrás arriba el motor eléctrico, con aletas, y su cable que baja hasta la empuñadura (ahí van las baterías);
 *   - abajo atrás el alimentador, que toma la cinta que sube de la caja de munición (300 tiros) colgada debajo;
 *   - asa de transporte arriba y una barra debajo de los cañones para la mano de apoyo;
 *   - adelante el rotor y los seis cañones (54 cm) con la abrazadera del medio y la de la boca. El grupo gira de verdad:
 *     cada cañón sube y baja según e.giro, los de atrás más oscuros; a velocidad se corren (movimiento) y, después de
 *     tirar mucho, las bocas se ponen rojas (e.calor).
 */
const MINI = { eje: -5.4, radio: 3.3, x0Canon: 15.6, x1Canon: 70, abrazaderas: [[44, 2.4], [63.6, 2.8]], cajaX: -12.4, cajaW: 12.6, cajaArriba: 6.2, cajaAbajo: 15.4, pasoCinta: 1.27 };
const MINI_VERDE = '#4c5436', MINI_NEGRO = '#2f3136';
// Caja de munición: el ancla es el centro de abajo (x, y); con conCinta asoman dos balas de la cinta por arriba
function cajaMinigun(ctx, x, y, conCinta) {
  const w = MINI.cajaW, h = MINI.cajaAbajo - MINI.cajaArriba, x0 = x - w / 2, y0 = y - h, sil = Pincel.silueta;
  if (conCinta) cintaMinigun(ctx, x0 + 1.5, y0 - 2.6, y0 + 0.3, 0, 3);
  pintar(ctx, RRc(x0, y0, w, h, 0.7), MINI_VERDE, { brillo: 0.25 });
  pintar(ctx, RRc(x0 - 0.25, y0 - 0.3, w + 0.5, 1.5, 0.4), mezclaHex(MINI_VERDE, '#000000', 0.15), { brillo: 0.3 });   // tapa
  if (sil) return;
  for (const yy of [y0 + 3.3, y0 + 6.4]) { trazo(ctx, 'rgba(0,0,0,0.35)', 0.16, [[x0 + 0.8, yy], [x0 + w - 0.8, yy]]); trazo(ctx, 'rgba(255,255,255,0.12)', 0.1, [[x0 + 0.8, yy + 0.22], [x0 + w - 0.8, yy + 0.22]]); }   // nervaduras
  pintar(ctx, RRc(x0 + w - 1.5, y0 + 0.9, 1.1, 2.6, 0.3), '#3a3f2a');                                                // traba de la tapa
  ctx.save(); ctx.fillStyle = 'rgba(232,206,96,0.85)'; ctx.font = '700 1.25px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('7.62 MM', x, y0 + 5.1); ctx.font = '700 0.9px sans-serif'; ctx.fillText('300 CTGS', x, y0 + 8.0); ctx.restore();
  for (const [ax, ay] of [[x0 + 1.4, y0 + 2.2], [x0 + 3.4, y0 + 7.6], [x0 + w - 2.6, y0 + 6.9]]) { ctx.beginPath(); ctx.arc(ax, ay, 0.5 + (ax % 0.3), 0, Math.PI * 2); ctx.fillStyle = 'rgba(30,26,16,0.25)'; ctx.fill(); }   // golpes y raspones
  trazo(ctx, 'rgba(210,205,180,0.25)', 0.08, [[x0 + 2, y0 + h - 1.2], [x0 + 5.6, y0 + h - 1.6]]);
}
// Cinta de balas 7,62×51 (vaina de 5,1 cm y punta de 1,9) que sube, acostadas, unidas por eslabones; desde y0 hasta y1
// (arriba → abajo), corrida `avance` (0…1) de un paso hacia arriba; como mucho `n` balas
function cintaMinigun(ctx, x, y0, y1, avance, n = 99) {
  const sil = Pincel.silueta, P = MINI.pasoCinta;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 1, y0, 9, y1 - y0); ctx.clip();
  let k = 0;
  for (let y = y1 - 0.6 - avance * P; y > y0 - P && k < n; y -= P, k++) {
    if (sil) { ctx.fillStyle = sil; ctx.fillRect(x, y - 0.6, 7, 1.2); continue; }
    pintar(ctx, [[x, y - 0.6], [x + 4.0, y - 0.6], [x + 4.4, y - 0.42], [x + 5.1, y - 0.42], [x + 5.1, y + 0.42], [x + 4.4, y + 0.42], [x + 4.0, y + 0.6], [x, y + 0.6]], MAT.laton, { brillo: 0.45 });
    pintar(ctx, [[x + 5.1, y - 0.4], [x + 6.2, y - 0.3], [x + 7.0, y], [x + 6.2, y + 0.3], [x + 5.1, y + 0.4]], MAT.cobre, { brillo: 0.4 });
    ctx.fillStyle = 'rgba(70,46,8,0.6)'; ctx.fillRect(x + 0.3, y - 0.6, 0.12, 1.2);
    for (const ex of [x + 0.8, x + 3.1]) { pintar(ctx, Rc(ex, y - 0.75, 0.9, 1.5), '#3b3d42', { brillo: 0.3 }); }   // eslabones
  }
  ctx.restore();
}
// Grupo de seis cañones que gira, con el rotor y las abrazaderas
function canonesMinigun(ctx, e) {
  const sil = Pincel.silueta, ang = e.giro || 0, vel = e.velGiro || 0, { eje, radio, x0Canon: x0, x1Canon: x1 } = MINI;
  // Rotor: gira con los cañones (las ranuras se mueven)
  pintar(ctx, RRc(12, eje - 5.0, x0 + 0.4 - 12, 10.0, 1.2), '#2b2d32', { brillo: 0.3 });
  if (!sil) for (let k = 0; k < 6; k++) { const a = ang + k * Math.PI / 3 + Math.PI / 6, z = Math.sin(a); if (z > 0) trazo(ctx, `rgba(0,0,0,${0.25 + z * 0.35})`, 0.35, [[12.5, eje - 4.0 * Math.cos(a)], [x0, eje - 4.0 * Math.cos(a)]]); }
  if (sil) {   // la sombra: el grupo entero y las abrazaderas
    ctx.fillStyle = sil; ctx.fillRect(x0, eje - radio - 1.05, x1 - x0, (radio + 1.05) * 2);
    for (const [ax, aw] of MINI.abrazaderas) ctx.fillRect(ax, eje - radio - 1.65, aw, (radio + 1.65) * 2);
    return;
  }
  const canon = (a, alfa) => {
    const y = eje - radio * Math.cos(a), z = Math.sin(a), luz = (z + 1) / 2;
    ctx.globalAlpha = alfa;
    pintar(ctx, [[x0, y - 1.05], [x1 - 1.4, y - 0.9], [x1, y - 0.9], [x1, y + 0.9], [x1 - 1.4, y + 0.9], [x0, y + 1.05]], mezclaHex('#141518', '#4e525b', luz), { brillo: 0.12 + luz * 0.25 });
    ctx.fillStyle = `rgba(0,0,0,${0.7 - luz * 0.3})`; ctx.fillRect(x1 - 0.25, y - 0.6, 0.25, 1.2);   // la boca
  };
  const orden = Array.from({ length: 6 }, (_, k) => ang + k * Math.PI / 3).sort((a, b) => Math.sin(a) - Math.sin(b));
  if (vel > 0.25) {   // a velocidad: cada cañón deja su estela hacia atrás del giro
    const estela = Math.min(0.55, vel * 0.5);
    for (const a of orden) { canon(a - estela, 0.28); canon(a - estela * 0.5, 0.45); }
    const g = ctx.createLinearGradient(0, eje - radio - 1, 0, eje + radio + 1);
    g.addColorStop(0, 'rgba(20,21,24,0)'); g.addColorStop(0.18, `rgba(60,63,70,${0.25 * vel})`); g.addColorStop(0.5, `rgba(90,94,102,${0.18 * vel})`); g.addColorStop(0.82, `rgba(30,31,35,${0.3 * vel})`); g.addColorStop(1, 'rgba(20,21,24,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x0, eje - radio - 1, x1 - x0, (radio + 1) * 2);
  }
  for (const a of orden) canon(a, vel > 0.25 ? 0.8 : 1);
  ctx.globalAlpha = 1;
  // Calor: después de tirar mucho, los cañones se ponen rojos hacia la boca
  const calor = e.calor || 0;
  if (calor > 0.45) {
    const k = Math.min(1, (calor - 0.45) / 0.55);
    ctx.save(); ctx.beginPath();
    for (const a of orden) { const y = eje - radio * Math.cos(a); ctx.rect(x0, y - 0.9, x1 - x0, 1.8); }
    ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(34, 0, x1, 0);
    g.addColorStop(0, 'rgba(255,40,0,0)'); g.addColorStop(0.6, `rgba(190,28,0,${0.14 * k})`); g.addColorStop(1, `rgba(255,52,0,${0.32 * k})`);
    ctx.fillStyle = g; ctx.fillRect(34, eje - radio - 1.2, x1 - 34, (radio + 1.2) * 2); ctx.restore();
  }
  // Abrazaderas: giran con el grupo (se ven pasar los tornillos)
  for (const [ax, aw] of MINI.abrazaderas) {
    pintar(ctx, RRc(ax, eje - radio - 1.65, aw, (radio + 1.65) * 2, 0.7), '#34363c', { brillo: 0.35 });
    for (let k = 0; k < 3; k++) { const a = ang + Math.PI / 6 + k * Math.PI * 2 / 3, z = Math.sin(a); if (z > 0.1) { const y = eje - (radio + 0.9) * Math.cos(a); punto(ctx, ax + aw / 2, y, 0.42, mezclaHex('#2a2b30', '#8a8e96', z)); punto(ctx, ax + aw / 2 - 0.1, y - 0.12, 0.13, `rgba(255,255,255,${0.35 * z})`); } }
  }
}
DIBUJO_ARMAS.minigun = modelo({ casquillo: 'bala', agarre: 'pecho', anguloEmpunadura: 0.24,
  anclas: { manoDelantera: [25, 1.4], cargador: [MINI.cajaX, MINI.cajaAbajo], corredera: [4.8, -16.2], expulsion: [6.4, -2.4], boca: [MINI.x1Canon, MINI.eje] },
  dibujarCm(ctx, e) {
    const sil = Pincel.silueta, { eje } = MINI;
    // Cable del motor: baja por detrás de la caja y entra por la base de la empuñadura (ahí van las baterías)
    if (!sil) {
      ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14.8, -11.2); ctx.bezierCurveTo(-22.5, -9.5, -22, 16.5, -12, 15.6); ctx.bezierCurveTo(-8, 15.2, -6, 12.6, -4.6, 10.6);
      ctx.strokeStyle = '#151517'; ctx.lineWidth = 1.15; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.3; ctx.stroke(); ctx.restore();
    }
    // Empuñadura de pistola, con el gatillo y el guardamonte
    empunadura(ctx, -2.4, 2.4, 10.6, 0.24, MAT.polimero, { y: 0 });
    if (!sil) for (let k = 0; k < 5; k++) trazo(ctx, 'rgba(255,255,255,0.07)', 0.16, [[-2.6 - k * 0.45, 2.2 + k * 1.7], [1.6 - k * 0.45, 2.2 + k * 1.7]]);
    guardamonteC(ctx, 2.6, 8.2, 0.2, 2.8, MINI_NEGRO);
    pintar(ctx, [[4.0, 0.2], [4.8, 0.2], [5.1, 1.9], [4.6, 2.3], [4.0, 1.2]], '#1c1d20');
    // Barra de apoyo debajo de los cañones, con su soporte al frente de la carcasa
    pintar(ctx, RRc(9, -0.6, 3.2, 3.0, 0.4), MINI_NEGRO);
    pintar(ctx, RRc(9, -0.1, 21, 2.2, 0.9), '#2a2c30', { brillo: 0.3 });
    pintar(ctx, RRc(18.5, -0.45, 11.2, 2.9, 1.2), '#18191b', { mate: true, brillo: 0.15 });
    if (!sil) for (let x = 19.6; x < 29; x += 0.9) trazo(ctx, 'rgba(255,255,255,0.09)', 0.16, [[x, -0.1], [x, 2.1]]);
    pintar(ctx, RRc(29.6, -0.2, 1.2, 2.4, 0.5), '#2a2c30');
    // Caja de munición colgada debajo, con la cinta que sube al alimentador
    if (!e.sinCargador) {
      const balas = e.balas ?? 300;
      if (balas > 0) cintaMinigun(ctx, MINI.cajaX - 3.5, 1.4, MINI.cajaArriba + 0.4, e.cinta || 0, Math.min(6, balas));
      cajaMinigun(ctx, MINI.cajaX, MINI.cajaAbajo, false);
      if (!sil) { pintar(ctx, RRc(MINI.cajaX - 4.4, MINI.cajaArriba - 0.55, 8.8, 0.9, 0.3), '#2a2c30'); }   // boca de salida de la cinta
    }
    // Carcasa: tapa de atrás, cilindro principal con dos bandas, ventana de expulsión, chapa y tornillos
    pintar(ctx, RRc(-15, eje - 4.4, 1.8, 8.8, 0.7), '#26282c', { brillo: 0.3 });
    pintar(ctx, RRc(-13.5, eje - 5.6, 25.6, 11.2, 2.4), MINI_NEGRO, { brillo: 0.3 });
    for (const [bx, bw] of [[-11.2, 1.4], [9.6, 1.6]]) pintar(ctx, RRc(bx, eje - 5.85, bw, 11.7, 0.5), '#3a3c42', { brillo: 0.4 });
    if (!sil) {
      ctx.fillStyle = '#0b0b0d'; ctx.fillRect(3.6, -3.3, 5.6, 1.8);                                                    // ventana de expulsión
      trazo(ctx, 'rgba(255,255,255,0.18)', 0.1, [[3.6, -1.42], [9.2, -1.42]]);
      pintar(ctx, RRc(-7.6, -7.4, 6.4, 3.2, 0.3), '#5a5e66', { brillo: 0.3 });                                          // chapa de datos
      for (let k = 0; k < 3; k++) trazo(ctx, 'rgba(20,20,24,0.55)', 0.12, [[-7.0, -6.6 + k * 0.85], [-1.8 - k * 0.9, -6.6 + k * 0.85]]);
      for (const [x, y] of [[-8.4, -7.0], [-8.4, -4.6], [-0.4, -7.0], [-0.4, -4.6], [2.6, -9.6], [7.6, -9.6], [-12.4, -1.6], [11.0, -1.6]]) tornillo(ctx, x, y, 0.3);
      trazo(ctx, 'rgba(255,255,255,0.1)', 0.12, [[-12.4, eje - 4.9], [11.4, eje - 4.9]]);
    }
    // Alimentador abajo atrás: toma la cinta y la mete en la carcasa
    pintar(ctx, RRc(-16.4, -0.6, 10.6, 2.6, 0.6), '#34373c', { brillo: 0.3 });
    if (!sil) { tornillo(ctx, -15.2, 0.7, 0.26); tornillo(ctx, -7.0, 0.7, 0.26); }
    // Motor eléctrico arriba atrás, sobre su soporte, con aletas y la tapa por donde sale el cable
    pintar(ctx, Rc(-10.2, eje - 6.4, 7.2, 1.2), '#25272b');
    pintar(ctx, RRc(-14.2, eje - 8.6, 13.4, 5.2, 2.2), '#3b3e44', { brillo: 0.35 });
    if (!sil) for (let x = -12.4; x < -3.2; x += 0.75) trazo(ctx, 'rgba(0,0,0,0.38)', 0.16, [[x, eje - 7.9], [x, eje - 4.0]]);
    pintar(ctx, RRc(-2.6, eje - 8.3, 1.9, 4.6, 0.6), '#2a2c31', { brillo: 0.3 });
    pintar(ctx, RRc(-15.3, eje - 7.0, 1.4, 2.0, 0.4), '#1c1d20');
    // Asa de transporte arriba
    pintar(ctx, Rc(0.9, eje - 9.6, 1.2, 4.2), '#26282c'); pintar(ctx, Rc(7.9, eje - 9.6, 1.2, 4.2), '#26282c');
    pintar(ctx, RRc(0.2, eje - 11.4, 9.6, 2.0, 0.9), '#1b1c1f', { mate: true, brillo: 0.18 });
    // Rotor, cañones y abrazaderas
    canonesMinigun(ctx, e);
    // La caja en la mano de apoyo, durante la recarga, la dibuja dibujarUnidad (js/jugador-dibujo.js): va después del
    // brazo y debajo de los dedos, como todo lo que lleva la mano; si la dibujara el arma, el brazo la taparía
  } });

/* ---------- Caja vacía que cae al piso al recargar la minigun ---------- */
class CajaMinigunCae {
  constructor(x, y, direccion) {
    this.x = x; this.y = y; this.dir = direccion;
    this.vx = -direccion * (0.3 + Math.random() * 0.4); this.vy = 0.6;
    this.rot = 0; this.vrot = -direccion * (0.015 + Math.random() * 0.02);
    this.vida = 4.5; this.vidaMax = this.vida; this.rebotes = 0; this.vivo = true;
    this.profundidad = 4 + Math.random() * 6;   // dónde cae dentro de la banda de la calle
  }
  actualizar(dt) {
    const paso = dt * 60;
    this.vida -= dt; if (this.vida <= 0) { this.vivo = false; return; }
    this.vy += 0.42 * paso; this.x += this.vx * paso; this.y += this.vy * paso; this.rot += this.vrot * paso;
    const piso = alturaSuelo(this.x) + this.profundidad;
    if (this.y >= piso) {
      this.y = piso;
      if (this.vy > 1.4 && this.rebotes < 2) {
        const fuerza = Math.min(1, this.vy / 6);
        this.vy = -this.vy * 0.22; this.vx *= 0.5; this.vrot *= -0.4; this.rebotes++;
        if (this.rebotes === 1) Audio_.casquillo('tambor', !Mundo.interior && Mundo.plano || alturaSuelo(this.x) < SUELO_BASE - 1 ? 'arena' : 'asfalto', fuerza);
      } else { this.vy = 0; this.vx *= 0.6; this.vrot = 0; this.rot *= 0.7; }   // queda apoyada de plano
    }
  }
  dibujar(ctx, camaraX) {
    const K = CM * ESCALA_JUGADOR;
    ctx.save(); ctx.globalAlpha = Math.min(1, this.vida / 0.4);
    ctx.translate(this.x - camaraX, this.y); ctx.rotate(this.rot); ctx.scale(this.dir * K, K);
    cajaMinigun(ctx, 0, 0, false);
    ctx.restore();
  }
}

/* ---------- Enganches en Jugador y Juego ---------- */
FUERZA_RETROCESO_ARMA.minigun = 0.28;   // chico, pero con cada tiro: el arma tiembla mientras tira
const GIRO_MAX = 26;                    // rad/s del grupo de cañones a velocidad de tiro (lo que se ve)
// Susurro del cazador: espera mínima (ms) entre uno y otro al sacar el machete y entre golpes (nunca menos de lo que
// dura el susurro: dos no se pisan) y probabilidad al pegar sin matar
const SUSURRO = { alSacar: 4000, entreGolpes: 8000, alPegar: 0.4 };

function estadoMinigun(j) { return j.minigun || (j.minigun = { vel: 0, angulo: 0, calor: 0, gatillo: false, vacioAvisado: false }); }

// Recoger: las armas de otro personaje no se agarran
const recogerBase = Jugador.prototype.recoger;
Jugador.prototype.recoger = function (armaId) {
  if (!armaPermitida(armaId, this)) return false;
  return recogerBase.call(this, armaId);
};

// Las armas de personaje: con el cazador, su machete está siempre en el inventario; con otro, no está
function revisarArmasDePersonaje(j) {
  if (!ARMAS_DE_PERSONAJE.length) return;
  const enMano = j.inventario[j.indiceArma];
  let cambio = false;
  for (const id of ARMAS_DE_PERSONAJE) {
    const k = j.inventario.indexOf(id), puede = armaPermitida(id, j);
    if (k >= 0 && !puede) { j.inventario.splice(k, 1); cambio = true; }
    else if (k < 0 && puede) { j.inventario.push(id); j.municion[id] = ARMAS[id].cargador; cambio = true; }
  }
  if (!cambio) return;
  j.inventario.sort((a, b) => ORDEN_INVENTARIO.indexOf(a) - ORDEN_INVENTARIO.indexOf(b));   // las que no están en el orden (cuchillo) quedan primero
  if (!j.inventario.length) { j.inventario.push(ARMA_INICIAL); j.municion[ARMA_INICIAL] = ARMAS[ARMA_INICIAL].cargador; }
  const k = j.inventario.indexOf(enMano);
  if (k >= 0) { j.indiceArma = k; return; }
  // El arma de la mano ya no es suya: pasa a la que quedó en su lugar
  j.indiceArma = Math.min(j.indiceArma, j.inventario.length - 1);
  j.cancelarRecarga(); j.lanzado = null; j.ultimoDisparo = -1e9;
}

// Susurro del cazador, con su tiempo de espera
function susurrar(j, juego, motivo) {
  const espera = Math.max(Audio_.duracionSusurro() * 1000 + 300, motivo === 'sacar' ? SUSURRO.alSacar : SUSURRO.entreGolpes);
  if (j.susurroEn !== undefined && juego.ahora - j.susurroEn < espera) return;
  j.susurroEn = juego.ahora;
  Audio_.susurroCazador();
}

// La minigun en cada cuadro: velocidad y giro de los cañones, calor, sonido del motor y las vainas
function actualizarMinigun(j, dt, juego, casquillosAntes) {
  const m = estadoMinigun(j), arma = j.arma();
  if (j.montada || j.muerto || !arma.giratoria) {   // guardada (otra arma en la mano): los cañones paran
    if (m.vel || m.sonando) { m.vel = 0; m.sonando = false; Audio_.minigun(0); }
    m.gatillo = false; m.calor = Math.max(0, m.calor - dt / 8);
    return;
  }
  const G = arma.giratoria, apretado = m.gatillo && !j.recarga;
  m.gatillo = false;
  m.vel = apretado ? Math.min(1, m.vel + dt * 1000 / G.arranque) : Math.max(0, m.vel - dt * 1000 / G.frenado);
  if (!apretado) m.vacioAvisado = false;
  m.angulo = (m.angulo + m.vel * GIRO_MAX * dt) % (Math.PI * 2);
  const tirando = apretado && m.vel >= 1 && j.municionActual() > 0;
  m.calor = tirando ? Math.min(1, m.calor + dt / 7) : Math.max(0, m.calor - dt / 8);
  if (m.vel > 0 || m.sonando) { Audio_.minigun(m.vel, tirando); m.sonando = m.vel > 0; }
  // Las vainas saltan de la ventana del costado, de a montones: más bajas y abiertas que las de un fusil
  for (let k = casquillosAntes; k < juego.casquillos.length; k++) {
    const c = juego.casquillos[k];
    if (c instanceof Casquillo && c.tipo === 'bala') { c.vx = -j.direccion * (0.5 + Math.random() * 2.2); c.vy = -(1.2 + Math.random() * 2.4); }
  }
}

const actualizarBase = Jugador.prototype.actualizar;
Jugador.prototype.actualizar = function (dt, entrada, juego) {
  const casquillosAntes = juego.casquillos.length;
  actualizarBase.call(this, dt, entrada, juego);
  revisarArmasDePersonaje(this);
  const id = this.montada ? null : this.inventario[this.indiceArma];
  if (id === 'macheteCazador' && this.armaAntes !== undefined && this.armaAntes !== id && !this.muerto) susurrar(this, juego, 'sacar');
  this.armaAntes = id;
  actualizarMinigun(this, dt, juego, casquillosAntes);
};

// Disparar la minigun: el gatillo hace girar los cañones; recién a velocidad sale el tiro
const dispararBase = Jugador.prototype.disparar;
Jugador.prototype.disparar = function (juego) {
  const arma = this.arma();
  if (this.montada || this.muerto || !arma.giratoria) return dispararBase.call(this, juego);
  if (this.recarga || this.ciclo) return false;                   // las manos están ocupadas: ni gira ni tira
  const m = estadoMinigun(this);
  m.gatillo = true;
  if (this.municionActual() <= 0) { if (!m.vacioAvisado) { m.vacioAvisado = true; Audio_.vacio(); } return false; }   // vacía: gira sin tirar
  if (m.vel < 1) return false;                                     // los cañones todavía no llegaron a la velocidad de tiro
  const tiro = dispararBase.call(this, juego);
  if (tiro) juego.sacudida = Math.max(juego.sacudida, 1.8);
  return tiro;
};

// Para el dibujo: giro, velocidad y calor de los cañones, avance de la cinta y balas que quedan; con los cañones
// girando el arma tiembla un poco (y las manos con ella)
const estadoArmaBase = Jugador.prototype.estadoArma;
Jugador.prototype.estadoArma = function () {
  const e = estadoArmaBase.call(this), arma = this.arma();
  if (this.montada || !arma.giratoria) return e;
  const m = estadoMinigun(this);
  e.giro = m.angulo; e.velGiro = m.vel; e.calor = m.calor; e.balas = this.municionActual();
  e.cinta = limitar((this.ahora - this.tiroEn) / arma.cadencia, 0, 1);
  const fase = this.recarga && this.recarga.fases.find(f => this.ahora < f.hasta);
  e.cajaNueva = !!fase && (fase.nombre === 'cadera' || fase.nombre === 'poner');   // la que trae de la cadera, con la punta de la cinta
  if (m.vel > 0.05) {
    const dx = Math.sin(this.ahora * 1.37) * 0.16 * m.vel, dy = Math.sin(this.ahora * 0.91) * 0.26 * m.vel;
    e.origen = { x: e.origen.x + dx, y: e.origen.y + dy };
    for (const k of ['apoyo', 'mano', 'reposoApoyo']) if (e[k]) e[k] = { x: e[k].x + dx, y: e[k].y + dy };
  }
  return e;
};

// Campo de pruebas: el machete de otro personaje no se pone en la mano
const equiparBase = Juego.prototype.equiparArma;
Juego.prototype.equiparArma = function (armaId) {
  if (!armaPermitida(armaId, this.jugador)) return;
  return equiparBase.call(this, armaId);
};

// La caja de la minigun cae entera al piso (no un cargador)
const soltarCargadorBase = Juego.prototype.soltarCargador;
Juego.prototype.soltarCargador = function (jugador, tipo = 'cargador', desde = null) {
  if (tipo === 'cargador' && !jugador.montada && jugador.arma().recargaUnidad === 'cajaMinigun') {
    const p = desde || jugador.puntoArma('cargador');
    this.casquillos.push(new CajaMinigunCae(p.x, p.y, jugador.direccion));
    return;
  }
  return soltarCargadorBase.call(this, jugador, tipo, desde);
};

// Golpe del machete del cazador: si mata (o a veces si pega), el susurro
const golpeCuerpoBase = Juego.prototype.golpeCuerpo;
Juego.prototype.golpeCuerpo = function (j, arma) {
  if (!arma || arma.id !== 'macheteCazador') return golpeCuerpoBase.call(this, j, arma);
  const tocados = this.zombiesAlAlcance(j, arma.alcance, arma.objetivos);
  const r = golpeCuerpoBase.call(this, j, arma);
  if (tocados.length) {
    const mato = tocados.some(z => z.estado === 'muerto');
    if (mato || Math.random() < SUSURRO.alPegar) susurrar(j, this, mato ? 'matar' : 'pegar');
  }
  return r;
};
