/* ===== Zona Muerta VR como app del Meta Quest 3S =====
 * Arma el APK con Bubblewrap de Meta (@meta-quest/bubblewrap-core: lo mismo que hacen `bubblewrap init --metaquest` y
 * `bubblewrap build`, sin sus preguntas): lee twa-manifest.json, genera el proyecto de Android en quest/android/,
 * compila con Gradle, alinea y firma. La app es la página de la VR (https://zenebord.github.io/zona-muerta/vr/) en el
 * motor del navegador del Quest como Trusted Web Activity, en modo inmersivo: abre con ?pwa=1 y entra directo al visor
 * (vr/campo.js); lo ya bajado queda guardado para abrir sin conexión (vr/sw.js). La versión web sigue igual.
 *
 * Uso, desde quest/:
 *   npm install                                       (una vez)
 *   node armar.mjs                                    íconos y manifiesto web del sitio publicado
 *   node armar.mjs --base=http://127.0.0.1:8794/      los del árbol de trabajo (antes de publicar): el APK es el mismo
 * Necesita el JDK 17 y el SDK de Android (JAVA_HOME y ANDROID_HOME; si no, los de Homebrew). La firma va fuera del
 * repositorio, en ~/.zona-muerta-quest/firma.json ({ keystore, alias, clave }); si no existe, se crea. Toda versión
 * nueva tiene que salir firmada con la misma: guardarla.
 * Deja quest/ZonaMuertaVR.apk y quest/assetlinks.json, que tiene que estar en
 * https://zenebord.github.io/.well-known/assetlinks.json: si no, el Quest no abre la app inmersiva. */
import { createRequire } from 'module';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const { TwaManifest, TwaGenerator, ConsoleLog } = require('@meta-quest/bubblewrap-core');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUBLICADO = 'https://zenebord.github.io/zona-muerta/';
const JAVA_HOME = process.env.JAVA_HOME || '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home';
const ANDROID_HOME = process.env.ANDROID_HOME || '/opt/homebrew/share/android-commandlinetools';
const HERRAMIENTAS = path.join(ANDROID_HOME, 'build-tools', '34.0.0');
const base = (process.argv.find(a => a.startsWith('--base=')) || '').slice(7);
const ENTORNO = { ...process.env, JAVA_HOME, ANDROID_HOME, PATH: `${path.join(JAVA_HOME, 'bin')}:${process.env.PATH}` };

function correr(cmd, args, op = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: ENTORNO, ...op });
  if (r.status !== 0) throw new Error(`${path.basename(cmd)} ${args[0]} falló (código ${r.status})`);
}

// La firma: fuera del repositorio y siempre la misma (el Quest no acepta una versión nueva firmada con otra)
const CARPETA_FIRMA = path.join(os.homedir(), '.zona-muerta-quest'), ARCHIVO_FIRMA = path.join(CARPETA_FIRMA, 'firma.json');
function firma() {
  if (fs.existsSync(ARCHIVO_FIRMA)) return JSON.parse(fs.readFileSync(ARCHIVO_FIRMA, 'utf8'));
  fs.mkdirSync(CARPETA_FIRMA, { recursive: true, mode: 0o700 });
  const f = { keystore: path.join(CARPETA_FIRMA, 'zona-muerta.keystore'), alias: 'zonamuerta', clave: crypto.randomBytes(18).toString('base64url') };
  correr(path.join(JAVA_HOME, 'bin', 'keytool'), ['-genkeypair', '-keystore', f.keystore, '-alias', f.alias, '-keyalg', 'RSA', '-keysize', '2048',
    '-validity', '10000', '-storepass', f.clave, '-keypass', f.clave, '-dname', 'CN=Zona Muerta VR']);
  fs.chmodSync(f.keystore, 0o600);
  fs.writeFileSync(ARCHIVO_FIRMA, JSON.stringify(f, null, 2) + '\n', { mode: 0o600 });
  console.log(`Firma nueva en ${CARPETA_FIRMA}: guardar una copia (sin ella no se puede actualizar la app)`);
  return f;
}
function huella(f) {   // SHA-256 del certificado, como lo pide assetlinks.json
  const r = spawnSync(path.join(JAVA_HOME, 'bin', 'keytool'), ['-list', '-v', '-keystore', f.keystore, '-alias', f.alias, '-storepass', f.clave], { encoding: 'utf8', env: ENTORNO });
  const m = /SHA256:\s*([0-9A-F:]{95})/.exec(r.stdout || '');
  if (!m) throw new Error('No se pudo leer la huella de la firma');
  return m[1];
}

const datos = JSON.parse(fs.readFileSync(path.join(AQUI, 'twa-manifest.json'), 'utf8'));
const deBase = u => base && u && u.startsWith(PUBLICADO) ? base + u.slice(PUBLICADO.length) : u;
const f = firma();
const twa = new TwaManifest({ ...datos, iconUrl: deBase(datos.iconUrl), maskableIconUrl: deBase(datos.maskableIconUrl),
  webManifestUrl: deBase(datos.webManifestUrl), signingKey: { path: f.keystore, alias: f.alias } });

// 1. El proyecto de Android, de cero (la plantilla de Meta: API 32, minSdk 23, modo inmersivo)
const proyecto = path.join(AQUI, 'android');
fs.rmSync(proyecto, { recursive: true, force: true }); fs.mkdirSync(proyecto);
await new TwaGenerator().createTwaProject(proyecto, twa, new ConsoleLog('quest'));
// Como indica Meta: jcenter ya no existe, va mavenCentral
const gradleRaiz = path.join(proyecto, 'build.gradle');
fs.writeFileSync(gradleRaiz, fs.readFileSync(gradleRaiz, 'utf8').replace(/jcenter\(\)/g, 'mavenCentral()'));

// 2. Compilar, alinear y firmar
correr('./gradlew', ['assembleRelease', '--console=plain', '--warning-mode=none'], { cwd: proyecto });
const sinFirmar = path.join(proyecto, 'app/build/outputs/apk/release/app-release-unsigned.apk');
const alineado = path.join(proyecto, 'app-release-alineado.apk'), apk = path.join(AQUI, 'ZonaMuertaVR.apk');
correr(path.join(HERRAMIENTAS, 'zipalign'), ['-f', '-p', '4', sinFirmar, alineado]);
correr(path.join(HERRAMIENTAS, 'apksigner'), ['sign', '--ks', f.keystore, '--ks-key-alias', f.alias, '--ks-pass', 'pass:' + f.clave,
  '--key-pass', 'pass:' + f.clave, '--out', apk, alineado]);
correr(path.join(HERRAMIENTAS, 'apksigner'), ['verify', apk]);

// 3. Digital Asset Links: el Quest abre la app inmersiva sólo si el sitio declara que este paquete, con esta firma, es suyo
const enlaces = [{ relation: ['delegate_permission/common.handle_all_urls'],
  target: { namespace: 'android_app', package_name: datos.packageId, sha256_cert_fingerprints: [huella(f)] } }];
fs.writeFileSync(path.join(AQUI, 'assetlinks.json'), JSON.stringify(enlaces, null, 2) + '\n');
console.log(`\nListo: ${apk} (${(fs.statSync(apk).size / 1e6).toFixed(1)} MB)` +
  `\nassetlinks.json: ${path.join(AQUI, 'assetlinks.json')} → https://${datos.host}/.well-known/assetlinks.json`);
