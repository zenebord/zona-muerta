/* ===== Zona Muerta VR: el menú =====
 * Un panel en el aire delante del jugador, dibujado en un lienzo. Cada página es una lista de botones (rectángulos
 * en píxeles del lienzo) y, si hace falta, un dibujo propio (texto, barras). Se apunta con el rayo de cualquier mando
 * y el gatillo aprieta; sin visor, con el mouse (o con la cruz si el mouse está tomado). Se dibuja encima de todo.
 * Las páginas las arma vr/modos.js. */
import * as THREE from 'three';

export const ANCHO = 1280, ALTO = 840;
const METROS = 1.2 / ANCHO;   // el panel mide 1,2 × 0,79 m
export const COLOR = { arena: '#c9a96e', texto: '#f1e6d0', noche: '#16131a', rojo: '#8b0f0f', verde: '#7dd35a', gris: '#8d8578' };
const FUENTE = '"Trebuchet MS", "Segoe UI", sans-serif';

// Redondea un rectángulo en el lienzo
export function rect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// Escribe achicando la letra hasta que entre en el ancho
export function texto(g, t, x, y, { tam = 28, peso = 700, color = COLOR.texto, alinear = 'left', ancho = Infinity, base = 'alphabetic' } = {}) {
  g.fillStyle = color; g.textAlign = alinear; g.textBaseline = base;
  let f = tam; do { g.font = `${peso} ${f}px ${FUENTE}`; f -= 1; } while (g.measureText(t).width > ancho && f > 10);
  g.fillText(t, x, y);
}
// Párrafo con cortes de línea automáticos; devuelve la y donde terminó
export function parrafo(g, t, x, y, ancho, { tam = 26, alto = 1.35, color = COLOR.texto, peso = 400 } = {}) {
  g.font = `${peso} ${tam}px ${FUENTE}`; g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  let linea = '';
  for (const p of t.split(' ')) {
    const prueba = linea ? linea + ' ' + p : p;
    if (g.measureText(prueba).width > ancho && linea) { g.fillText(linea, x, y); y += tam * alto; linea = p; } else linea = prueba;
  }
  if (linea) { g.fillText(linea, x, y); y += tam * alto; }
  return y;
}
function estrella(g, cx, cy, r, llena) {
  g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath();
  g.fillStyle = llena ? '#f2c94c' : 'rgba(241,230,208,0.14)'; g.fill(); g.strokeStyle = llena ? '#8a6a12' : 'rgba(241,230,208,0.35)'; g.lineWidth = 2; g.stroke();
}
function candado(g, cx, cy, s) {
  g.strokeStyle = COLOR.gris; g.lineWidth = s * 0.16; g.beginPath(); g.arc(cx, cy - s * 0.25, s * 0.32, Math.PI, 0); g.stroke();
  g.fillStyle = COLOR.gris; rect(g, cx - s * 0.48, cy - s * 0.25, s * 0.96, s * 0.78, s * 0.1); g.fill();
  g.fillStyle = COLOR.noche; g.beginPath(); g.arc(cx, cy + 0.08 * s, s * 0.11, 0, 7); g.fill();
}

export class Menu {
  constructor(escena) {
    this.lienzo = document.createElement('canvas'); this.lienzo.width = ANCHO; this.lienzo.height = ALTO; this.g = this.lienzo.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.lienzo); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.malla = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO * METROS, ALTO * METROS), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false, transparent: true, depthTest: false, depthWrite: false }));
    this.malla.visible = false; this.malla.renderOrder = 1000; escena.add(this.malla);
    this.abierto = false; this.pagina = null; this.encima = {}; this.dibujado = '';
    // El rayo de cada mando mientras el menú está abierto, con un punto donde toca el panel
    this.rayos = {};
    for (const lado of ['right', 'left']) {
      const linea = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 1, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false }));
      const punto = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false }));
      linea.renderOrder = punto.renderOrder = 1001; linea.visible = punto.visible = false; escena.add(linea, punto);
      this.rayos[lado] = { linea, punto };
    }
    this.raycaster = new THREE.Raycaster();
  }
  // Lo pone delante de los ojos (1,35 m en el visor; más cerca en la pantalla), un poco abajo, mirando al jugador
  abrir(ojo, adelante, distancia = 1.35) {
    const a = adelante.clone().setY(0); if (a.lengthSq() < 1e-6) a.set(0, 0, -1); a.normalize();
    this.malla.position.copy(ojo).addScaledVector(a, distancia).add(new THREE.Vector3(0, -0.075 * distancia, 0));
    this.malla.lookAt(ojo.x, ojo.y, ojo.z);
    this.malla.visible = true; this.abierto = true; this.encima = {}; this.redibujar(true);
  }
  cerrar() { this.malla.visible = false; this.abierto = false; this.encima = {}; for (const r of Object.values(this.rayos)) r.linea.visible = r.punto.visible = false; }
  mostrar(pagina) { this.pagina = pagina; this.encima = {}; this.redibujar(true); }
  // El botón bajo un rayo (origen y dirección en el mundo), o null
  tocar(origen, dir) {
    if (!this.abierto) return null;
    this.raycaster.set(origen, dir); this.raycaster.far = 6;
    const h = this.raycaster.intersectObject(this.malla, false)[0]; if (!h || !h.uv) return null;
    const px = h.uv.x * ANCHO, py = (1 - h.uv.y) * ALTO;
    const boton = (this.pagina ? this.pagina.botones : []).find(b => b.activo !== false && px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) || null;
    return { boton, punto: h.point, distancia: h.distance };
  }
  // Mueve el puntero de un lado ('right', 'left' o 'mouse'); muestra el rayo del mando si corresponde
  apuntar(lado, origen, dir) {
    const h = origen ? this.tocar(origen, dir) : null, r = this.rayos[lado];
    if (r) {
      r.linea.visible = !!origen && this.abierto; r.punto.visible = !!h;
      if (origen && this.abierto) {
        const largo = h ? h.distancia : 2;
        r.linea.scale.set(1, largo, 1); r.linea.position.copy(origen).addScaledVector(dir, largo / 2); r.linea.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        r.linea.material.color.set(h && h.boton ? 0x7dff4a : 0xffd27a);
        if (h) r.punto.position.copy(h.punto);
      }
    }
    const antes = this.encima[lado] || null, ahora = h ? h.boton : null;
    this.encima[lado] = ahora;
    if (antes !== ahora) this.redibujar();
    return h;
  }
  apretar(lado) {
    const b = this.encima[lado]; if (!b || !this.abierto) return false;
    Audio_.recoger();
    b.accion();
    return true;
  }
  redibujar(forzar) {
    const marcados = new Set(Object.values(this.encima).filter(Boolean)), clave = [...marcados].map(b => this.pagina.botones.indexOf(b)).join(',');
    if (!forzar && clave === this.dibujado) return;
    this.dibujado = clave;
    const g = this.g, P = this.pagina;
    g.clearRect(0, 0, ANCHO, ALTO);
    g.fillStyle = 'rgba(16,13,20,0.95)'; rect(g, 4, 4, ANCHO - 8, ALTO - 8, 26); g.fill();
    g.strokeStyle = COLOR.arena; g.lineWidth = 5; rect(g, 6, 6, ANCHO - 12, ALTO - 12, 24); g.stroke();
    if (!P) { this.tex.needsUpdate = true; return; }
    g.save(); g.shadowColor = P.colorTitulo ? 'rgba(0,0,0,0.85)' : COLOR.rojo; g.shadowOffsetX = 4; g.shadowOffsetY = 4;
    texto(g, P.titulo, ANCHO / 2, 84, { tam: 58, color: P.colorTitulo || COLOR.arena, alinear: 'center', ancho: ANCHO - 100 }); g.restore();
    if (P.sub) texto(g, P.sub.toUpperCase(), ANCHO / 2, 126, { tam: 24, peso: 400, color: 'rgba(241,230,208,0.8)', alinear: 'center', ancho: ANCHO - 100 });
    if (P.dibujar) P.dibujar(g);
    for (const b of P.botones) this.boton(g, b, marcados.has(b));
    this.tex.needsUpdate = true;
  }
  boton(g, b, encima) {
    const apagado = b.activo === false, r = b.estilo === 'tarjeta' || b.estilo === 'modo' ? 16 : 12;
    g.save(); g.globalAlpha = apagado ? 0.45 : 1;
    g.fillStyle = encima ? COLOR.arena : b.marcado ? '#4a3a22' : 'rgba(34,27,40,0.96)'; rect(g, b.x, b.y, b.w, b.h, r); g.fill();
    g.strokeStyle = b.marcado && !encima ? '#f2c94c' : COLOR.arena; g.lineWidth = b.marcado ? 4 : 3; rect(g, b.x, b.y, b.w, b.h, r); g.stroke();
    const tinta = encima ? COLOR.noche : COLOR.texto, cx = b.x + b.w / 2;
    if (b.estilo === 'modo') {   // tarjeta grande de un modo: nombre, ícono y explicación corta
      texto(g, b.texto, cx, b.y + 62, { tam: 38, color: encima ? COLOR.noche : COLOR.arena, alinear: 'center', ancho: b.w - 30 });
      if (b.icono) b.icono(g, cx, b.y + 150, encima);
      let y = b.y + 240; for (const l of b.lineas || []) { texto(g, l, cx, y, { tam: 22, peso: 400, color: tinta, alinear: 'center', ancho: b.w - 30 }); y += 30; }
    } else if (b.estilo === 'tarjeta') {   // nivel: número, detalle, mejor resultado y estrellas (o candado)
      texto(g, b.texto, cx, b.y + 52, { tam: 30, color: encima ? COLOR.noche : COLOR.arena, alinear: 'center', ancho: b.w - 20 });
      if (b.candado) { candado(g, cx, b.y + 125, 56); texto(g, b.sub || '', cx, b.y + 205, { tam: 19, peso: 400, color: tinta, alinear: 'center', ancho: b.w - 20 }); }
      else {
        let y = b.y + 92; for (const l of b.lineas || []) { texto(g, l, cx, y, { tam: 21, peso: 400, color: tinta, alinear: 'center', ancho: b.w - 20 }); y += 28; }
        for (let k = 0; k < 3; k++) estrella(g, cx + (k - 1) * 46, b.y + b.h - 72, 18, k < (b.estrellas || 0));
        if (b.mejor) texto(g, b.mejor, cx, b.y + b.h - 22, { tam: 19, peso: 400, color: tinta, alinear: 'center', ancho: b.w - 20 });
      }
    } else {
      const tam = b.estilo === 'grande' ? 34 : b.estilo === 'chico' ? 22 : 27;
      texto(g, b.texto, cx, b.y + b.h / 2 + (b.sub ? -4 : tam * 0.36), { tam, color: tinta, alinear: 'center', ancho: b.w - 20 });
      if (b.sub) texto(g, b.sub, cx, b.y + b.h / 2 + 24, { tam: 18, peso: 400, color: tinta, alinear: 'center', ancho: b.w - 16 });
    }
    g.restore();
  }
}
// Dibujos para las tarjetas de los modos
export const ICONOS = {
  entrenamiento(g, cx, cy, encima) {
    const c = encima ? COLOR.noche : '#d9772b';
    g.fillStyle = c; g.beginPath(); g.arc(cx, cy - 46, 22, 0, 7); g.fill();
    g.beginPath(); g.moveTo(cx - 48, cy + 58); g.lineTo(cx - 50, cy - 4); g.quadraticCurveTo(cx - 50, cy - 22, cx - 18, cy - 24); g.lineTo(cx + 18, cy - 24); g.quadraticCurveTo(cx + 50, cy - 22, cx + 50, cy - 4); g.lineTo(cx + 48, cy + 58); g.closePath(); g.fill();
    g.fillStyle = encima ? COLOR.arena : '#3a3f47'; g.fillRect(cx - 62, cy + 50, 124, 22);
  },
  zombies(g, cx, cy, encima) {
    const c = encima ? COLOR.noche : '#5d8a3c';
    g.fillStyle = c; g.beginPath(); g.ellipse(cx, cy - 42, 24, 28, 0, 0, 7); g.fill();
    g.fillStyle = encima ? COLOR.noche : '#3563c8'; g.beginPath(); g.moveTo(cx - 34, cy - 12); g.lineTo(cx + 34, cy - 12); g.lineTo(cx + 30, cy + 44); g.lineTo(cx - 30, cy + 44); g.closePath(); g.fill();
    g.strokeStyle = c; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 30, cy - 4); g.lineTo(cx - 6, cy + 8); g.moveTo(cx + 30, cy - 4); g.lineTo(cx + 62, cy + 2); g.stroke();
    g.fillStyle = encima ? COLOR.arena : '#e8d84a'; g.beginPath(); g.arc(cx - 9, cy - 46, 5, 0, 7); g.arc(cx + 9, cy - 46, 5, 0, 7); g.fill();
    g.strokeStyle = encima ? COLOR.noche : '#6b4528'; g.lineWidth = 14; g.beginPath(); g.moveTo(cx - 14, cy + 46); g.lineTo(cx - 20, cy + 70); g.moveTo(cx + 14, cy + 46); g.lineTo(cx + 22, cy + 70); g.stroke();
  },
  libre(g, cx, cy, encima) {
    const c = encima ? COLOR.noche : COLOR.arena;
    g.fillStyle = c; g.fillRect(cx - 70, cy + 10, 140, 12);
    g.fillRect(cx - 62, cy - 6, 64, 14); g.fillRect(cx - 52, cy + 8, 12, 2);
    g.fillRect(cx + 10, cy - 14, 54, 10); g.fillRect(cx + 46, cy - 4, 10, 14);
    for (const x of [-60, 60]) g.fillRect(cx + x - 5, cy + 22, 10, 50);
    g.strokeStyle = c; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy - 55, 26, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy - 55, 8, 0, 7); g.fill();
  },
};
