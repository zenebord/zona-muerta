/* ===== Zona Muerta VR: efectos compartidos =====
 * Fogonazo y humo de la boca, polvo y chispas donde pega la bala, agujeros en el papel, sangre, y la física simple de
 * lo que se cae (vainas, cartuchos, cargadores, armas soltadas): gravedad, rebote con su sonido y quedan tendidos sobre
 * la mesa o el piso. */
import * as THREE from 'three';

export function texturaCanvas(w, h, dibujar, repetir) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repetir); }
  t.lienzo = c;
  return t;
}
const radial = (colores) => texturaCanvas(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 1, 32, 32, 30); colores.forEach(([p, c]) => r.addColorStop(p, c)); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });

export class Efectos {
  constructor(escena, superficie) {
    this.escena = escena;
    this.superficie = superficie;            // (x, z) → altura del apoyo (mesa o piso)
    this.sueltos = []; this.particulas = []; this.trazos = []; this.rayos = [];
    this.texFogonazo = texturaCanvas(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 2, 64, 64, 60); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(0.25, 'rgba(255,200,90,0.9)'); r.addColorStop(1, 'rgba(255,120,20,0)');
      g.fillStyle = r; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, rr = k % 2 ? 26 : 62; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); } g.fill();
    });
    this.fogonazo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texFogonazo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.fogonazo.visible = false; escena.add(this.fogonazo);
    this.luz = new THREE.PointLight(0xffb45a, 0, 6, 2); escena.add(this.luz);
    this.fogonazoHasta = 0;
    this.matPolvo = new THREE.SpriteMaterial({ map: radial([[0, 'rgba(200,190,170,0.9)'], [1, 'rgba(200,190,170,0)']]), depthWrite: false, transparent: true });
    this.matHumo = new THREE.SpriteMaterial({ map: radial([[0, 'rgba(225,225,225,0.55)'], [1, 'rgba(225,225,225,0)']]), depthWrite: false, transparent: true });
    this.matChispa = new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,240,190,1)'], [0.4, 'rgba(255,170,60,0.8)'], [1, 'rgba(255,120,20,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    this.matSangre = new THREE.SpriteMaterial({ map: radial([[0, 'rgba(120,10,6,0.95)'], [0.6, 'rgba(90,6,4,0.7)'], [1, 'rgba(70,0,0,0)']]), depthWrite: false, transparent: true });
    this.matFuego = new THREE.SpriteMaterial({ map: texturaCanvas(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 1, 32, 32, 30); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.3, 'rgba(255,190,70,0.95)'); r.addColorStop(0.7, 'rgba(230,80,20,0.6)'); r.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    this.matHumoOscuro = new THREE.SpriteMaterial({ map: radial([[0, 'rgba(60,56,52,0.75)'], [0.6, 'rgba(70,66,60,0.45)'], [1, 'rgba(80,76,70,0)']]), depthWrite: false, transparent: true });
    this.luces = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffa040, 0, 12, 2); escena.add(l); return { luz: l, vida: 0, total: 1, max: 0 }; });
    this.geoAgujero = new THREE.CircleGeometry(1, 12);
    this.matAgujero = new THREE.MeshBasicMaterial({ color: 0x141012 });
    this.matMancha = new THREE.MeshBasicMaterial({ color: 0x5a0d08 });
  }
  /* Fogonazo en la boca: tamaño en metros; el humo queda flotando un instante */
  disparo(boca, dir, ahora, tam = 0.2) {
    const f = this.fogonazo; f.position.copy(boca).addScaledVector(dir, tam * 0.25); f.scale.setScalar(tam * (0.8 + Math.random() * 0.5));
    f.material.rotation = Math.random() * Math.PI; f.visible = true;
    this.luz.position.copy(boca); this.luz.intensity = 6 * Math.min(2, tam / 0.2); this.fogonazoHasta = ahora + 45;
    for (let k = 0; k < 2; k++) this.particula(this.matHumo, boca.clone().addScaledVector(dir, 0.04 + k * 0.05), dir.clone().multiplyScalar(0.35 + Math.random() * 0.2).add(new THREE.Vector3(0, 0.08, 0)), tam * 0.35, 0.9, 1.6);
  }
  // Partícula suelta: sprite que se mueve, crece y se apaga
  particula(mat, pos, vel, tam, vida, crece = 1, gravedad = 0) {
    const s = new THREE.Sprite(mat.clone()); s.position.copy(pos); s.scale.setScalar(tam); this.escena.add(s);
    const q = { s, vel, vida, total: vida, crece, gravedad }; this.particulas.push(q); return q;
  }
  /* Donde pega la bala: polvo (madera, papel, tierra), chispas (metal) o sangre */
  impacto(punto, normal, tipo) {
    if (tipo === 'carne') { for (let k = 0; k < 5; k++) this.particula(this.matSangre, punto.clone().addScaledVector(normal, 0.02), normal.clone().multiplyScalar(0.6 + Math.random()).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 0.8, (Math.random() - 0.5) * 1.2)), 0.05 + Math.random() * 0.05, 0.45, 1.2, 6); return; }
    if (tipo === 'metal') for (let k = 0; k < 6; k++) this.particula(this.matChispa, punto.clone().addScaledVector(normal, 0.01), normal.clone().multiplyScalar(1.5 + Math.random() * 2).add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3)), 0.025, 0.25, 0.5, 9.8);
    this.particula(this.matPolvo, punto.clone().addScaledVector(normal, 0.03), normal.clone().multiplyScalar(0.3), tipo === 'papel' ? 0.06 : 0.16, 0.35, 2);
  }
  // Agujero o mancha pegada a la malla (en su marco, así se mueve con ella)
  marca(malla, punto, normal, radio, sangre = false) {
    const m = new THREE.Mesh(this.geoAgujero, sangre ? this.matMancha : this.matAgujero);
    m.scale.setScalar(radio);
    m.position.copy(punto).addScaledVector(normal, 0.002); m.lookAt(punto.clone().add(normal));
    malla.updateMatrixWorld(true);
    malla.worldToLocal(m.position); m.quaternion.premultiply(malla.getWorldQuaternion(new THREE.Quaternion()).invert());
    const s = malla.getWorldScale(new THREE.Vector3()); m.scale.divide(s);
    malla.add(m);
    return m;
  }
  // Un destello con una de las luces fijas (la más apagada)
  destello(pos, color, intensidad, alcance, vida) {
    const l = this.luces.reduce((a, b) => (a.luz.intensity <= b.luz.intensity ? a : b));
    l.luz.position.copy(pos); l.luz.color.set(color); l.luz.distance = alcance; l.luz.intensity = intensidad; l.max = intensidad; l.vida = l.total = vida;
  }
  /* Explosión: bola de fuego, humo oscuro, esquirlas encendidas y el destello */
  explosion(pos, radio = 3) {
    const al = r => new THREE.Vector3((Math.random() - 0.5) * r, (Math.random() - 0.5) * r, (Math.random() - 0.5) * r);
    this.destello(pos, 0xffa040, 40, radio * 7, 0.45);
    for (let k = 0; k < 16; k++) this.particula(this.matFuego, pos.clone().add(al(0.5)), al(radio * 1.6).setY(Math.random() * radio * 0.9), 0.35 + Math.random() * 0.45, 0.45 + Math.random() * 0.35, 3.2, -1.5);
    for (let k = 0; k < 14; k++) this.particula(this.matHumoOscuro, pos.clone().add(al(0.8)), al(1.4).setY(0.5 + Math.random() * 1.2), 0.6 + Math.random() * 0.6, 2.4 + Math.random() * 1.6, 0.9, -0.25);
    for (let k = 0; k < 24; k++) this.particula(this.matChispa, pos.clone().add(al(0.2)), al(14).setY(2 + Math.random() * 7), 0.05, 0.9 + Math.random() * 0.4, 0.1, 9.8);
  }
  llama(pos, vel, tam = 0.06) { return this.particula(this.matFuego, pos, vel, tam, 0.75 + Math.random() * 0.25, 2.6, -1.2); }
  estela(pos) { this.particula(this.matHumo, pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04)), new THREE.Vector3(0, 0.15, 0), 0.12, 1.4, 1.5); }
  // Trazadora: un trazo brillante que va de la boca al impacto
  trazadora(desde, hasta) {
    const d = hasta.clone().sub(desde), largo = d.length(); if (largo < 2) return;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.position.copy(desde); this.escena.add(m);
    this.trazos.push({ m, desde: desde.clone(), dir: d.normalize(), largo, t: 0 });
  }
  /* Rayo: un trazo dentado de luz desde el techo hasta el punto, que titila y se apaga */
  rayo(hasta) {
    const desde = new THREE.Vector3(hasta.x + (Math.random() - 0.5) * 2, 8.2, hasta.z + (Math.random() - 0.5) * 2), pts = [];
    for (let k = 0; k <= 14; k++) { const t = k / 14, p = desde.clone().lerp(hasta, t); if (k > 0 && k < 14) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.7, 0, (Math.random() - 0.5) * 0.7).multiplyScalar(Math.sin(t * Math.PI))); pts.push(p); }
    const curva = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 60, 0.025, 5), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 60, 0.11, 6), new THREE.MeshBasicMaterial({ color: 0x7ab8ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
    this.escena.add(g); this.rayos.push({ g, vida: 0.4 });
    this.destello(hasta.clone().setY(hasta.y + 0.5), 0xbfd8ff, 60, 30, 0.4);
    for (let k = 0; k < 18; k++) this.particula(this.matChispa, hasta.clone(), new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 6), 0.04, 0.6, 0.2, 9.8);
  }
  /* Lo que se cae: { objeto, vel, giro, tipo, alto (medio espesor: cuánto queda sobre el apoyo), vida, alPosarse } */
  soltar(objeto, vel, giro, tipo, alto, vida = tipo === 'vaina' ? 12 : 30) {
    if (!objeto.parent) this.escena.add(objeto);
    const s = { objeto, vel, giro, tipo, alto, rebotes: 0, vida, quieto: false };
    this.sueltos.push(s);
    if (this.sueltos.length > 120) { const v = this.sueltos.find(x => x.tipo === 'vaina') || this.sueltos[0]; this.quitarSuelto(v); }
    return s;
  }
  quitarSuelto(s, sacarDeEscena = true) { const i = this.sueltos.indexOf(s); if (i >= 0) this.sueltos.splice(i, 1); if (sacarDeEscena && s.objeto.parent) s.objeto.parent.remove(s.objeto); }
  actualizar(ahora, dt) {
    if (ahora > this.fogonazoHasta) { this.fogonazo.visible = false; this.luz.intensity = 0; }
    for (const l of this.luces) if (l.vida > 0) { l.vida -= dt; l.luz.intensity = Math.max(0, l.max * (l.vida / l.total) * (0.75 + Math.random() * 0.25)); }
    for (let i = this.trazos.length - 1; i >= 0; i--) { const t = this.trazos[i]; t.t += dt * 320; t.m.position.copy(t.desde).addScaledVector(t.dir, Math.min(t.t, t.largo)); if (t.t >= t.largo) { this.escena.remove(t.m); t.m.geometry.dispose(); this.trazos.splice(i, 1); } }
    for (let i = this.rayos.length - 1; i >= 0; i--) { const r = this.rayos[i]; r.vida -= dt; r.g.visible = Math.random() > 0.25; if (r.vida <= 0) { this.escena.remove(r.g); r.g.traverse(o => o.geometry && o.geometry.dispose()); this.rayos.splice(i, 1); } }
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const q = this.particulas[i]; q.vida -= dt;
      q.vel.y -= q.gravedad * dt; q.s.position.addScaledVector(q.vel, dt);
      q.s.material.opacity = Math.max(0, q.vida / q.total); q.s.scale.multiplyScalar(1 + dt * q.crece);
      if (q.vida <= 0) { this.escena.remove(q.s); q.s.material.dispose(); this.particulas.splice(i, 1); }
    }
    for (let i = this.sueltos.length - 1; i >= 0; i--) {
      const s = this.sueltos[i];
      s.vida -= dt;
      if (s.vida <= 0) { this.quitarSuelto(s); if (s.alVencer) s.alVencer(); continue; }
      if (s.quieto) continue;
      s.vel.y -= 9.8 * dt;
      s.objeto.position.addScaledVector(s.vel, dt);
      s.objeto.rotateX(s.giro.x * dt); s.objeto.rotateY(s.giro.y * dt); s.objeto.rotateZ(s.giro.z * dt);
      const piso = this.superficie(s.objeto.position.x, s.objeto.position.z) + s.alto;
      if (s.objeto.position.y < piso) {
        s.objeto.position.y = piso;
        if (s.vel.y < -0.8 && s.rebotes < 3) {
          if (s.rebotes === 0 && s.sonido) s.sonido(Math.min(1, -s.vel.y / 4));
          s.vel.y *= -0.32; s.vel.x *= 0.6; s.vel.z *= 0.6; s.giro.multiplyScalar(0.6); s.rebotes++;
        } else {   // queda tendido
          s.quieto = true;
          if (s.alPosarse) s.alPosarse(s); else {
            const e = new THREE.Euler().setFromQuaternion(s.objeto.quaternion, 'YXZ');
            s.objeto.rotation.set(s.tumbado ?? 0, e.y, 0, 'YXZ');
          }
        }
      }
    }
  }
}
