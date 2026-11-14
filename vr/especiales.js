/* ===== Zona Muerta VR: las armas especiales, de cuerpo a cuerpo y la legendaria =====
 * Una de cada tipo que falta, sobre la misma base (vr/armas-vr.js):
 *   minigun      ametralladora: los seis cañones giran (arrancan en 0,35 s y frenan en 1,4 s) y tira 2000 por minuto;
 *                caja de 300 con su cinta, que se cambia con la mano izquierda; una de cada tres es trazadora
 *   m79          lanzagranadas: B lo quiebra (sale la vaina) y lo cierra; la granada de 40 mm vuela en parábola y explota
 *   rpg7         bazuca: el cohete sale por la boca con su estela, acelera y explota; otro se encastra en la boca
 *   granadas     M67: el gatillo saca la anilla; al soltarla con el brazo en movimiento vuela, rebota y explota a 3,5 s
 *   lanzallamas  chorro de llamas que prende al zombie; se cambia el cilindro de ignición de la punta
 *   laser        disparos de energía que atraviesan; la celda es el huevo verde
 *   machete      pega según la velocidad de la mano (y silba al blandirlo)
 *   mjolnir      legendaria: pega con un rayo; se tira soltándolo con el brazo en movimiento y vuelve con el agarre
 * El mundo (vr/campo.js) da: disparo, lanzar (proyectiles), explotar, barrer (golpes de hoja), golpearZombie, rayo,
 * volverAMesa y el zombie. */
import * as THREE from 'three';
import { Arma, DEFS, A_METROS, cartucho3d } from './armas-vr.js';
import { extruir, tornear, caja, v3, fusionar } from './modelo3d.js';
import { texturaCanvas } from './efectos.js';

const P = (x, y, z = 0) => v3(x, y, z);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const brillo = (color, intensidad = 1, op = {}) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensidad, roughness: 0.3, metalness: 0.1, ...op });

/* ---------- Definiciones ---------- */
Object.assign(DEFS, {
  minigun: {
    mecanica: 'giratoria', municion: 'cargador', fogonazo: 0.22, cono: 0.012, vibra: 0.3,
    retroceso: { atras: 0.006, sube: 0.012, dura: 0.06 },
    empunadura: [-1.5, -5.4], apoyo: { punto: [5, 15.8], modo: 'estabiliza', radio: 0.15 },
    expulsion: [-2, -1, 3.5], contador: { x: -12, y: -10.8, z: -4.65, ancho: 6 },
    modelo: {
      piezas: { 0: { t: 3.0 }, 1: { t: 0.6 }, 2: { t: 3.0 }, 3: { t: 3.0 }, 4: { t: 3.2 }, 5: { t: 3.0 }, 26: { t: 9.0 }, 27: { t: 9.2 }, 28: { t: 1.0 }, 29: { t: 3.0 },
        30: { t: 3.0 }, 31: { t: 8.0 }, 32: { t: 8.6 }, 33: { t: 8.6 }, 34: { t: 8.2 }, 35: { t: 4.0 }, 36: { t: 6.0 }, 37: { redonda: 'x' }, 38: { redonda: 'x' }, 39: { redonda: 'x' },
        40: { t: 1.2 }, 41: { t: 1.2 }, 42: { redonda: 'x' }, 43: { redonda: 'x' }, 44: { omitir: true }, 45: { omitir: true }, 46: { omitir: true }, 47: { omitir: true }, 48: { omitir: true }, 49: { omitir: true },
        50: { redonda: 'x' }, 51: { redonda: 'x' },
        ...Object.fromEntries(Array.from({ length: 20 }, (_, k) => [6 + k, { t: 1.1 }])) },
      materiales: { '#c9a227': 'laton', '#b87333': 'laton', '#4c5436': 'pintura', '#41472e': 'pintura', '#3a3f2a': 'pintura' },
      extras(a) {
        // El haz de seis cañones que gira: cilindros alrededor del eje (y = 5,45 cm) y las abrazaderas giran con él
        const haz = new THREE.Group(); haz.position.set(0, 5.45, 0); a.raiz.add(haz); a.canones = haz;
        const m = a.mat('#18191c', 'metal');
        for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 54.4, 12), m); c.rotation.z = Math.PI / 2; c.position.set(42.8, Math.cos(ang) * 3.35, Math.sin(ang) * 3.35); haz.add(c); }
        for (const malla of [...a.raiz.children]) if ([50, 51, 43].includes(malla.userData.pieza)) { haz.attach(malla); }
        fusionar(haz, true);
      },
    },
  },
  m79: {
    mecanica: 'quiebre', municion: 'quiebre', fogonazo: 0.25, vibra: 0.8,
    retroceso: { atras: 0.02, sube: 0.2, dura: 0.15 },
    empunadura: [-2.5, -0.6], apoyo: { punto: [25, -2.0], modo: 'linea', radio: 0.16 },
    mira: { alza: [23.6, 7.9], poste: [38.6, 7.95] }, contador: { x: 6, y: 2.5, z: -1.95, ancho: 4 },
    modelo: {
      piezas: { 0: { t: 4.0 }, 1: { t: 4.1, material: 'goma' }, 2: { t: 0.6 }, 3: { t: 1.4 }, 4: { redonda: 'x' }, 5: { t: 0.35 }, 6: { t: 3.2 }, 7: { t: 4.0 },
        8: { t: 4.9 }, 9: { t: 1.6, partir: 0.4 }, 10: { t: 3.8 }, 11: { t: 2.2 } },
      movimientos: { quiebre: { estado: 'abierto' } }, cargador: false,
    },
  },
  rpg7: {
    mecanica: 'cohete', municion: 'cohete', fogonazo: 0.45, vibra: 1,
    retroceso: { atras: 0.02, sube: 0.08, dura: 0.2 },
    empunadura: [1.0, -5.6], apoyo: { punto: [-13.6, -3.8], modo: 'estabiliza', radio: 0.15 },
    mira: { alza: [-10, 8.8], poste: [12.9, 8.2] },
    modelo: {
      piezas: { 0: { t: 3.0 }, 1: { t: 3.0 }, 2: { t: 1.0 }, 3: { t: 1.2 }, 4: { t: 0.6 }, 5: { t: 3.0 }, 6: { redonda: 'x' }, 7: { redonda: 'x' }, 8: { t: 5.4 },
        9: { redonda: 'x' }, 10: { redonda: 'x' }, 11: { redonda: 'x' }, 12: { redonda: 'x' }, 13: { redonda: 'x' }, 14: { redonda: 'x' }, 15: { redonda: 'x' }, 16: { redonda: 'x' },
        17: { t: 1.6, partir: 0.4 }, 18: { t: 1.6 }, 19: { redonda: 'x' }, 20: { redonda: 'x' }, 21: { redonda: 'x' }, 22: { redonda: 'x' } },
      materiales: { '#4f2c20': 'madera', '#5c3426': 'madera', '#707b46': 'pintura', '#5b6340': 'pintura' },
    },
  },
  granadas: {
    mecanica: 'granada', municion: 'ninguna', vertical: false, empunadura: [2.6, 0.4],
    modelo: {
      piezas: { 0: { redonda: 'y' }, 1: { redonda: 'y' }, 2: { t: 0.5, z: 2.5 } }, cargador: false,
      materiales: { '#4a5a2c': 'pintura' },
      extras(a) {   // la anilla del pasador, al costado de la espoleta
        const anilla = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.13, 6, 18), a.mat('#9aa0a6', 'metal')); anilla.position.set(0.6, 4.6, 1.8); anilla.rotation.y = Math.PI / 2; a.raiz.add(anilla); a.anilla = anilla;
      },
    },
  },
  lanzallamas: {
    mecanica: 'chorro', municion: 'cargador', vibra: 0.25,
    retroceso: { atras: 0.003, sube: 0.004, dura: 0.08 },
    empunadura: [-1.2, -5.3], apoyo: { punto: [37.7, -3.5], modo: 'linea', radio: 0.16 },
    mira: { alza: [-4, 4.6], poste: [86, 5.0] }, contador: { x: 20, y: 3.6, z: -1.2, ancho: 4.5 },
    modelo: {
      piezas: { 0: { t: 2.6 }, 1: { t: 5.0 }, 2: { t: 2.0 }, 3: { t: 3.0 }, 4: { t: 3.2 }, 5: { t: 0.6 }, 6: { redonda: 'x' }, 7: { redonda: 'x' }, 8: { t: 3.0 }, 9: { t: 1.0 },
        10: { redonda: 'x' }, 11: { redonda: 'x' }, 12: { redonda: 'x' }, 13: { redonda: 'x' }, 14: { redonda: 'x' }, 15: { t: 1.0 } },
      materiales: { '#5a3a20': 'madera', '#4b5434': 'pintura' },
    },
  },
  laser: {
    mecanica: 'energia', municion: 'cargador', fogonazo: 0.15, vibra: 0.4,
    retroceso: { atras: 0.006, sube: 0.05, dura: 0.12 },
    empunadura: [-0.8, -5.3], apoyo: { punto: [25, 0.5], modo: 'linea', radio: 0.15 },
    mira: { alza: [0, 9.6], poste: [30, 9.6] }, contador: { x: 23, y: 1.5, z: -2.0, ancho: 4.5 },
    modelo: {
      piezas: { 0: { t: 2.6, material: 'brillo' }, 1: { t: 2.9 }, 2: { t: 2.9 }, 3: { t: 2.9 }, 4: { redonda: 'x' }, 5: { redonda: 'x' }, 6: { t: 1.4, material: 'brillo' }, 7: { t: 1.4, material: 'brillo' } },
      cargador: false,
      extras(a) {
        // Caracola en espiral (culata) con bandas de colores y un ojo a cada lado
        const espiral = texturaCanvas(256, 256, (g, w) => { const cs = ['#ff7a2f', '#ff3d8b', '#ffc23d']; for (let k = 0; k < 18; k++) { g.strokeStyle = cs[k % 3]; g.lineWidth = 16; g.beginPath(); for (let t = 0; t < 1; t += 0.01) { const ang = t * Math.PI * 2, r = (k + t) * 7; g.lineTo(w / 2 + Math.cos(ang) * r, w / 2 + Math.sin(ang) * r); } g.stroke(); } });
        const fijo = new THREE.Group(); a.raiz.add(fijo);
        const concha = new THREE.Mesh(new THREE.SphereGeometry(7, 28, 20), new THREE.MeshStandardMaterial({ map: espiral, roughness: 0.35, emissive: 0xff5a2a, emissiveIntensity: 0.15 }));
        concha.scale.set(1, 1, 0.8); concha.position.set(-11, 2.6, 0); fijo.add(concha);
        for (const s of [1, -1]) {
          const ojo = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfdfbe8, roughness: 0.3 })); ojo.scale.set(1.2, 0.8, 0.5); ojo.position.set(-14, 5.4, s * 5.2); fijo.add(ojo);
          const iris = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), brillo('#ffd400', 0.6)); iris.scale.set(1, 1, 0.4); iris.position.set(-13.6, 5.4, s * 5.75); fijo.add(iris);
          const pupila = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.2), new THREE.MeshBasicMaterial({ color: 0x120612 })); pupila.position.set(-13.6, 5.4, s * 6.05); fijo.add(pupila);
        }
        // Ampolla de vidrio con el núcleo que late y las burbujas
        const ampolla = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshStandardMaterial({ color: 0x3fd4e6, emissive: 0x1666a8, emissiveIntensity: 0.5, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.6, depthWrite: false }));
        ampolla.scale.set(11, 6.2, 5.5); ampolla.position.set(10.5, 3, 0); a.raiz.add(ampolla);
        const nucleo = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 14), brillo('#ff4fd8', 1.6)); nucleo.position.set(10.5, 3, 0); a.raiz.add(nucleo); a.nucleo = nucleo;
        a.burbujas = Array.from({ length: 7 }, (_, k) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.3 + 0.2 * (k % 3), 8, 6), brillo('#e6ffff', 0.5, { transparent: true, opacity: 0.7 })); b.userData.k = k; a.raiz.add(b); return b; });
        // Aleta dorsal tornasolada
        const aleta = [[0, -7.4], [3, -12.5], [7, -13.2], [10, -10.5], [12.5, -12.6], [16, -14], [19.5, -11.2], [18, -7.4]];
        fijo.add(extruir(aleta, [], brillo('#2ff3ff', 0.35, { side: THREE.DoubleSide }), -0.25, 0.25));
        fusionar(fijo, true);
        // La celda de energía: huevo verde con su tallo (es el cargador)
        const huevo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), brillo('#7dff4a', 0.9)); huevo.scale.set(1.8, 2.3, 1.8); huevo.position.set(8, -4.4, 0); a.cargador.add(huevo);
        const tallo = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2, 8), brillo('#1d7a10', 0.3)); tallo.position.set(8, -1.6, 0); a.cargador.add(tallo);
        a.cargadorSuelto = () => { const g = new THREE.Group(); for (const m of a.cargador.children) g.add(m.clone()); return g; };
      },
    },
  },
  machete: {
    mecanica: 'cuerpo', vertical: true, empunadura: [0, -6], filo: true, peso: 0.8,
    hoja: [[2.5, 6], [2.5, 18], [2.6, 30], [2.4, 42], [2.0, 48]],
    modelo: { piezas: { 0: { redonda: 'y' }, 1: { t: 0.4 }, 2: { t: 0.22 } }, cargador: false, materiales: { '#dfe3e8': 'metal', '#3a3d42': 'metal' } },
  },
  mjolnir: {
    mecanica: 'cuerpo', vertical: true, empunadura: [0, -6], filo: false, peso: 1.6, poder: 'rayo',
    hoja: [[-12, 13], [0, 13], [12, 13], [0, 20], [0, 6]],
    modelo: { piezas: { 0: { redonda: 'y' }, 1: { redonda: 'y' }, 2: { t: 13 }, 3: { t: 13.4 } }, cargador: false, materiales: { '#5a3a20': 'madera' } },
  },
});

/* ---------- Minigun ---------- */
class Minigun extends Arma {
  constructor(id, mundo) { super(id, mundo); this.giro = 0; this.angulo = 0; this.sonando = false; this.recamara = false; this.municion = this.capacidad; this.n = 0; this.dibujarContador(); }
  listo() { return this.puesto && this.municion > 0 && this.giro >= 1; }
  actualizar(ahora, dt) {
    const tira = this.gatilloApretado && this.giro >= 1;
    this.giro = limitar(this.giro + (this.gatilloApretado ? dt / 0.35 : -dt / 1.4), 0, 1);
    this.angulo += this.giro * dt * 35; this.a.canones.rotation.x = this.angulo;
    if (this.giro > 0 || this.sonando) { Audio_.minigun(this.giro, tira && this.puesto && this.municion > 0); this.sonando = this.giro > 0; }
    if (tira && ahora - this.ultimoTiro >= this.datos.cadencia) {
      if (this.listo()) this.dispararBala(ahora);
      else if (!this.avisoVacio) { Audio_.vacio(); this.avisoVacio = true; this.ultimoTiro = ahora; }
    }
    if (this.gatilloApretado && this.giro > 0.2) this.mundo.vibrar('right', 0.12 * this.giro, 20);
    this.retrocesoYCola(ahora, dt);
  }
  dispararBala(ahora) {
    this.ultimoTiro = ahora; this.municion--; this.disparos++; this.n++; this.retroceso = 1;
    Audio_.disparo('ametralladora', 'minigun');
    const boca = this.mundoDe(this.boca).add(v3(0, 0, 0)), dir = this.apuntarA ? this.apuntarA.clone().sub(boca).normalize() : this.direccion();
    const u = v3(1, 0, 0).cross(dir).normalize(), w = dir.clone().cross(u), ang = Math.random() * Math.PI * 2, r = Math.random() * this.def.cono;
    dir.addScaledVector(u, Math.cos(ang) * r).addScaledVector(w, Math.sin(ang) * r).normalize();
    if (this.n % 2) this.mundo.efectos.disparo(boca, dir, ahora, this.def.fogonazo);
    const punto = this.mundo.disparo(boca, dir, { dano: this.datos.dano, tipo: 'bala', arma: this, tiro: { impacto: false }, primero: true });
    if (this.n % 3 === 0) this.mundo.efectos.trazadora(boca, punto || boca.clone().addScaledVector(dir, 80));
    if (this.n % 3 === 1) this.expulsar(false);
    this.mundo.vibrar('right', this.def.vibra, 25); if (this.dosManos) this.mundo.vibrar('left', 0.2, 25);
    if (this.n % 5 === 0 || this.municion === 0) this.dibujarContador();
  }
  dibujarContador() { this.recamara = false; super.dibujarContador(); }
  recargaEscritorio(ahora) { if (this.cola.length) return; if (this.puesto) this.cola.push([ahora, () => this.soltarCargador()]); this.cola.push([ahora + 1200, () => { this.ponerCargador(); Audio_.recarga('cinta', this.id); }]); }
}

/* ---------- M79: se quiebra, entra la granada de 40 mm, se cierra ---------- */
class Quiebre extends Arma {
  constructor(id, mundo) { super(id, mundo); this.parteAccion = this.a.partes.quiebre; this.abierto = 0; this.objetivo = 0; this.cargada = true; this.vaina = false; this.municion = 0; this.recamara = true; this.dibujarContador(); }
  botonB() { this.objetivo = this.objetivo ? 0 : 1; Audio_.recarga(this.objetivo ? 'abrir' : 'cerrar', this.id); }
  actualizar(ahora, dt) {
    this.abierto = limitar(this.abierto + Math.sign(this.objetivo - this.abierto) * dt / 0.25, 0, 1);
    this.parteAccion.mover(this.abierto * this.abierto * (3 - 2 * this.abierto));
    if (this.abierto > 0.95 && this.vaina) { this.vaina = false; this.expulsarDeRecamara(); }
    if (this.pulso) {
      this.pulso = false;
      if (this.abierto < 0.05 && this.cargada) this.lanzarGranada(ahora); else if (!this.avisoVacio) { Audio_.vacio(); this.avisoVacio = true; }
    }
    this.retrocesoYCola(ahora, dt);
  }
  recamaraMundo() { return this.parteAccion.grupo.localToWorld(P(11, 3.5)); }
  expulsarDeRecamara() {   // la vaina sale de la recámara y cae
    const v = cartucho3d(this.id, false); v.scale.setScalar(A_METROS); v.position.copy(this.recamaraMundo()); v.quaternion.copy(this.modelo.getWorldQuaternion(new THREE.Quaternion()));
    const s = this.mundo.efectos.soltar(v, this.direccion().multiplyScalar(-1.2).add(v3(0, 0.5, 0)), v3(4, 0, 2), 'vaina', 0.02); s.sonido = f => Audio_.casquillo('grande', 'asfalto', f);
  }
  lanzarGranada(ahora) {
    this.cargada = false; this.vaina = true; this.recamara = false; this.disparos++; this.retroceso = 1; this.ultimoTiro = ahora;
    Audio_.disparo('lanzagranadas', this.id);
    const boca = this.mundoDe(this.boca), dir = this.direccionMira();
    this.mundo.efectos.disparo(boca, this.direccion(), ahora, this.def.fogonazo);
    const g = cartucho3d(this.id, true); g.children[0].visible = false; g.scale.setScalar(A_METROS); g.position.copy(boca); g.quaternion.copy(this.modelo.getWorldQuaternion(new THREE.Quaternion()));
    this.mundo.lanzar({ objeto: g, vel: dir.multiplyScalar(42), gravedad: 9.8, vida: 6, alChocar: h => { this.mundo.explotar(h.punto, 3); return true; } });
    this.mundo.vibrar('right', 0.8, 60); this.dibujarContador();
  }
  municionParaMano() { return this.abierto > 0.8 && !this.cargada && !this.vaina ? { tipo: 'granada40', cuerpo: cartucho3d(this.id, true), punta: true } : null; }
  probarCarga(m) {
    if (this.abierto < 0.8 || this.cargada) return false;
    const cal = calibreDe(this.id), punta = m.objeto.localToWorld(P(cal.vaina + cal.punta * 0.5, 0));
    if (punta.distanceTo(this.recamaraMundo()) > 0.08) return false;
    this.cargada = true; this.recamara = true; Audio_.recarga('granada', this.id); this.mundo.vibrar('left', 0.5, 40); this.dibujarContador(); return true;
  }
  zonas() { return this.def.apoyo ? [{ tipo: 'apoyo', punto: this.mundoDe(P(...this.def.apoyo.punto)), radio: this.def.apoyo.radio }] : []; }
  dibujarContador() { this.municion = 0; super.dibujarContador(); }
  recargaEscritorio(ahora) { if (this.cola.length) return; this.objetivo = 1; Audio_.recarga('abrir', this.id); this.cola.push([ahora + 700, () => { if (!this.cargada) { this.cargada = true; this.recamara = true; Audio_.recarga('granada', this.id); this.dibujarContador(); } }]); this.cola.push([ahora + 1100, () => { this.objetivo = 0; Audio_.recarga('cerrar', this.id); }]); }
}

/* ---------- RPG-7: el cohete sale por la boca ---------- */
class Cohete extends Arma {
  constructor(id, mundo) { super(id, mundo); this.municion = 0; this.recamara = true; this.dibujarContador(); }
  listo() { return this.puesto; }
  actualizar(ahora, dt) {
    if (this.pulso) { this.pulso = false; if (this.puesto) this.lanzarCohete(ahora); else if (!this.avisoVacio) { Audio_.vacio(); this.avisoVacio = true; } }
    this.retrocesoYCola(ahora, dt);
  }
  lanzarCohete(ahora) {
    this.puesto = false; this.recamara = false; this.a.cargador.visible = false; this.disparos++; this.retroceso = 1; this.ultimoTiro = ahora;
    Audio_.disparo('bazuca', this.id);
    const c = this.a.cargadorSuelto(), g = new THREE.Group(); g.add(c); g.scale.setScalar(A_METROS);
    this.modelo.updateMatrixWorld(true); this.modelo.matrixWorld.decompose(g.position, g.quaternion, v3());
    const dir = this.direccionMira(), atras = this.mundoDe(P(-76, 4));
    this.mundo.efectos.disparo(this.mundoDe(P(20, 4.2)), this.direccion(), ahora, 0.3);
    for (let k = 0; k < 8; k++) this.mundo.efectos.particula(this.mundo.efectos.matHumo, atras.clone(), this.direccion().multiplyScalar(-2 - Math.random() * 3).add(v3((Math.random() - 0.5), Math.random() * 0.5, (Math.random() - 0.5))), 0.3, 1.6, 1.4);   // fogonazo de atrás
    this.mundo.lanzar({ objeto: g, vel: dir.clone().multiplyScalar(28), empuje: 70, velMax: 75, gravedad: 1.2, vida: 6, estela: true, orientar: false,
      alChocar: h => { this.mundo.explotar(h.punto, 3.5); return true; } });
    this.mundo.vibrar('right', 1, 120); this.dibujarContador();
  }
  municionParaMano() {
    if (this.puesto) return null;
    const c = this.a.cargadorSuelto(), box = new THREE.Box3().setFromObject(c);
    const atras = P(box.min.x + 1, (box.min.y + box.max.y) / 2), medio = P((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2);
    return { tipo: 'cargador', cuerpo: c, agarre: P(medio.x + 4, medio.y), refs: [atras, medio], tolerancia: 0.07 };
  }
  ponerCargador() { this.puesto = true; this.recamara = true; this.a.cargador.visible = true; Audio_.recarga('granada', this.id); this.mundo.vibrar('left', 0.6, 50); this.dibujarContador(); }
  dibujarContador() { this.municion = 0; super.dibujarContador(); }
  zonas() { return this.def.apoyo ? [{ tipo: 'apoyo', punto: this.mundoDe(P(...this.def.apoyo.punto)), radio: this.def.apoyo.radio }] : []; }
  recargaEscritorio(ahora) { if (this.cola.length || this.puesto) return; this.cola.push([ahora + 900, () => this.ponerCargador()]); }
}

/* ---------- Granada M67 ---------- */
class Granada extends Arma {
  constructor(id, mundo) { super(id, mundo); this.armada = false; this.volando = false; this.agarreMano = true; }
  gatillo(apretado) {
    if (apretado && !this.gatilloApretado && !this.armada && this.enMano) {   // saca la anilla
      this.armada = true; Audio_.recarga('pasador', this.id); this.mundo.vibrar('right', 0.4, 30);
      const anilla = this.a.anilla, p = anilla.getWorldPosition(v3()); anilla.visible = false;
      const suelta = anilla.clone(); suelta.visible = true; suelta.scale.setScalar(A_METROS); suelta.position.copy(p);
      this.mundo.efectos.soltar(suelta, v3((Math.random() - 0.5), 1.5, (Math.random() - 0.5)), v3(6, 3, 2), 'vaina', 0.002).sonido = f => Audio_.casquillo('pistola', 'asfalto', f * 0.5);
    }
    this.gatilloApretado = apretado;
  }
  actualizar() {}
  // Al soltarla: armada vuela con la velocidad de la mano; sin la anilla sacada, se cae como cualquier arma
  lanzar(vel) {
    if (!this.armada) return false;
    Audio_.recarga('cuchara', this.id); Audio_.lanzar('granada');
    this.volando = true;
    const fin = performance.now() + 3500;
    this.mundo.lanzar({ objeto: this.soporte, vel: vel.clone().multiplyScalar(1.25), gravedad: 9.8, vida: 10, rebota: true, gira: v3(8, 3, 5), mecha: fin, enEscena: true,
      alExplotar: pos => { this.mundo.explotar(pos, 3.5); this.reponer(); } });
    return true;
  }
  reponer() {   // vuelve una nueva a la mesa
    this.armada = false; this.volando = false; this.a.anilla.visible = true; this.soporte.visible = false;
    setTimeout(() => { this.soporte.visible = true; this.mundo.volverAMesa(this, true); }, 1500);
  }
  recargaEscritorio() {}
}

/* ---------- Lanzallamas ---------- */
class Lanzallamas extends Arma {
  constructor(id, mundo) { super(id, mundo); this.recamara = false; this.municion = this.capacidad; this.llamas = []; this.dibujarContador(); }
  actualizar(ahora, dt) {
    const tira = this.gatilloApretado && this.puesto && this.municion > 0;
    if (tira && ahora - this.ultimoTiro >= this.datos.cadencia) {
      this.ultimoTiro = ahora; this.municion--; this.disparos++;
      if (this.municion % 3 === 0) Audio_.disparo('lanzallamas', this.id);
      const boca = this.mundoDe(this.boca), dir = this.apuntarA ? this.apuntarA.clone().sub(boca).normalize() : this.direccion();
      for (let k = 0; k < 3; k++) {
        const v = dir.clone().multiplyScalar(9 + Math.random() * 3).add(v3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.9));
        const q = this.mundo.efectos.llama(boca.clone(), v, 0.05 + Math.random() * 0.03); q.pego = false; this.llamas.push(q);
      }
      if (this.municion % 2 === 0) this.mundo.efectos.destello(boca, 0xff8030, 5, 6, 0.12);
      this.mundo.vibrar('right', this.def.vibra, 30);
      if (this.municion % 10 === 0) this.dibujarContador();
    } else if (this.pulso && (!this.puesto || this.municion <= 0)) { this.pulso = false; Audio_.vacio(); } else this.pulso = false;
    // Las llamas que tocan al zombie lo prenden
    const z = this.mundo.zombie;
    for (let i = this.llamas.length - 1; i >= 0; i--) {
      const q = this.llamas[i]; if (q.vida <= 0) { this.llamas.splice(i, 1); continue; }
      if (!q.pego && z && z.cerca(q.s.position, 0.35)) { q.pego = true; z.incendiar(3); z.recibir({ dano: this.datos.dano, tipo: 'fuego' }); }
    }
    this.retrocesoYCola(ahora, dt);
  }
  dibujarContador() { this.recamara = false; super.dibujarContador(); }
  recargaEscritorio(ahora) { if (this.cola.length) return; if (this.puesto) this.cola.push([ahora, () => this.soltarCargador()]); this.cola.push([ahora + 900, () => { this.ponerCargador(); Audio_.recarga('celda', this.id); }]); }
}

/* ---------- Láser: energía que atraviesa ---------- */
class Laser extends Arma {
  constructor(id, mundo) { super(id, mundo); this.recamara = false; this.municion = this.capacidad; this.dibujarContador(); }
  listo() { return this.puesto && this.municion > 0; }
  actualizar(ahora, dt) {
    if (this.pulso && ahora - this.ultimoTiro >= this.datos.cadencia) {
      this.pulso = false;
      if (this.listo()) this.dispararRayo(ahora); else if (!this.avisoVacio) { Audio_.vacio(); this.avisoVacio = true; }
    }
    const late = 1 + 0.18 * Math.sin(ahora * 0.005); if (this.a.nucleo) this.a.nucleo.scale.setScalar(late);
    for (const b of this.a.burbujas || []) { const u = (ahora * 0.00045 + b.userData.k / 7) % 1; b.position.set(3 + b.userData.k * 2.6 + Math.sin(ahora * 0.002 + b.userData.k) * 0.5, -2.6 + u * 11, Math.sin(b.userData.k) * 2); b.visible = u < 0.85; }
    this.retrocesoYCola(ahora, dt);
  }
  dispararRayo(ahora) {
    this.ultimoTiro = ahora; this.municion--; this.disparos++; this.retroceso = 1;
    Audio_.disparo('laser', this.id);
    const boca = this.mundoDe(this.boca), dir = this.apuntarA ? this.apuntarA.clone().sub(boca).normalize() : this.direccionMira();
    this.mundo.efectos.destello(boca, 0xff4fd8, 8, 8, 0.15);
    const bala = new THREE.Group();
    bala.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.22, 4, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    bala.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.3, 4, 8), new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })));
    bala.children.forEach(m => m.rotation.x = Math.PI / 2);
    bala.position.copy(boca); bala.lookAt(boca.clone().add(dir));
    let atravesados = 0;
    this.mundo.lanzar({ objeto: bala, vel: dir.multiplyScalar(60), gravedad: 0, vida: 3, orientar: true, perfora: true,
      alChocar: h => {
        if (h.zombie) { if (atravesados++ < 3) this.mundo.golpearZombie(h, this.datos.dano, 'rayo'); return false; }   // atraviesa
        for (let k = 0; k < 10; k++) this.mundo.efectos.particula(this.mundo.efectos.matChispa, h.punto.clone(), v3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4), 0.04, 0.5, 0.3, 6);
        this.mundo.efectos.destello(h.punto, 0xff4fd8, 6, 6, 0.2); return true;
      } });
    this.mundo.vibrar('right', this.def.vibra, 40); this.dibujarContador();
  }
  dibujarContador() { this.recamara = false; super.dibujarContador(); }
  ponerCargador() { super.ponerCargador(); Audio_.recarga('celda', this.id); }
  recargaEscritorio(ahora) { if (this.cola.length) return; if (this.puesto) this.cola.push([ahora, () => this.soltarCargador()]); this.cola.push([ahora + 800, () => this.ponerCargador()]); }
}

/* ---------- Cuerpo a cuerpo: pega según la velocidad de la mano ---------- */
class Cuerpo extends Arma {
  constructor(id, mundo) { super(id, mundo); this.agarreMano = true; this.previos = null; this.velPunta = 0; this.enfriamiento = 0; this.silbo = false; this.puntos = this.def.hoja.map(([x, y]) => P(x, y)); }
  gatillo() {}
  actualizar(ahora, dt) {
    const pts = this.puntos.map(p => this.mundoDe(p));
    if (this.previos && dt > 0 && (this.enMano || this.volando)) {
      this.velPunta = Math.max(...pts.map((p, i) => p.distanceTo(this.previos[i]))) / dt;
      if (this.velPunta > 3.5 && !this.silbo) { Audio_.blandir(this.def.peso, this.id); this.silbo = true; }
      if (this.velPunta < 1.5) this.silbo = false;
      if (this.velPunta > 2 && ahora > this.enfriamiento) {
        const h = this.mundo.barrer(this.previos, pts);
        if (h) {
          const fuerza = limitar(this.velPunta / 4, 0.6, 2);
          this.mundo.golpearZombie(h, this.datos.dano * fuerza, this.def.filo ? 'filo' : 'golpe');
          Audio_.golpeCuerpo(this.def.filo ? 'filo' : 'golpe', fuerza > 1.2, this.id); this.mundo.vibrar('right', 1, 70);
          this.enfriamiento = ahora + 350;
          if (this.def.poder === 'rayo') { this.mundo.rayo(h.punto); this.mundo.golpearZombie(h, 15, 'rayo'); }
        }
      }
    }
    this.previos = pts;
    this.retrocesoYCola(ahora, dt);
  }
  recargaEscritorio() {}
}

/* ---------- Mjölnir: se tira y vuelve a la mano ---------- */
class Mjolnir extends Cuerpo {
  constructor(id, mundo) { super(id, mundo); this.tirado = false; this.volviendoAMano = null; }
  // Al soltarlo rápido vuela; despacio, se cae como cualquier arma
  lanzar(vel) {
    if (vel.length() < 2.5) return false;
    this.tirado = true; this.volando = true; Audio_.lanzar('martillo');
    this.vuelo = this.mundo.lanzar({ objeto: this.soporte, vel: vel.clone().multiplyScalar(1.7), gravedad: 3, vida: 30, gira: v3(14, 0, 0), enEscena: true,
      alChocar: h => {
        if (h.zombie) { this.mundo.rayo(h.punto); this.mundo.golpearZombie(h, 15, 'rayo'); Audio_.golpeCuerpo('golpe', true, this.id); }
        else Audio_.golpeCuerpo('golpe', false, this.id);
        this.volando = false; return true;   // queda donde pegó, hasta que lo llamen
      } });
    return true;
  }
  // Agarre con la mano vacía: vuela de vuelta a la mano
  llamar(mano) { if (!this.tirado || this.volviendoAMano) return; if (this.vuelo) this.mundo.dejarDeLanzar(this.vuelo); this.volviendoAMano = mano; this.volando = true; Audio_.lanzar('martillo'); }
  actualizar(ahora, dt) {
    if (this.volviendoAMano) {
      const destino = this.volviendoAMano(), p = this.soporte.position, d = destino.clone().sub(p), l = d.length();
      if (l < 0.18) { this.volviendoAMano = null; this.tirado = false; this.volando = false; Audio_.atrapar('martillo'); if (this.alVolver) this.alVolver(this); }
      else { p.addScaledVector(d.normalize(), Math.min(l, 14 * dt)); this.soporte.rotateX(18 * dt); }
    }
    super.actualizar(ahora, dt);
  }
}

/* ---------- Cuál clase usa cada arma ---------- */
const CLASES = { minigun: Minigun, m79: Quiebre, rpg7: Cohete, granadas: Granada, lanzallamas: Lanzallamas, laser: Laser, machete: Cuerpo, mjolnir: Mjolnir };
export function crearArma(id, mundo) { return new (CLASES[id] || Arma)(id, mundo); }
