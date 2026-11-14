# Créditos de sonido

Los mecanismos de las armas (cargadores, correderas, cerrojos, bombeo, cartuchos, balas), los disparos, las
explosiones, el foley de sacar un arma y de la granada, las voces de los zombies, los pasos, los impactos y los
quejidos del protagonista son **grabaciones reales** recortadas en eventos sueltos. El viento, la sirena, el latido,
el «ping» del Garand, la minigun, el láser, el lanzallamas y los lanzagranadas son sintetizados en `js/audio.js`.

Cada archivo de esta carpeta es un recorte procesado (mono, 44,1 kHz, paso alto a 70 Hz, fundidos
y normalizado). `js/sonidos-datos.js` los lleva embebidos en base64 para que el juego funcione
abriendo `index.html` directo, sin servidor.

| Archivos | Fuente original | Autor | Licencia |
|---|---|---|---|
| `pistola_*`, `gatillo_en_seco`, `cerrojo_abrir`, `cerrojo_cerrar`, `rifle_*`, `escopeta_*`, `cerrojo_22`, `revolver_balas`, `balas_sueltas`, `casquillo_*`, `cartucho_cae` | [Handling Guns](https://opengameart.org/node/11033): Colt M1911A1, escopeta Browning semiautomática calibre 12, Marlin .22 de cerrojo y Remington 700 calibre .30-06, grabados en seco | Gary (para el proyecto PARPG) | [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `bombeo_cartucho`, `bombeo_rack` | [Shotgun Reload Sound Effects](https://opengameart.org/content/shotgun-reload-sound-effects) | zer0_sol | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `cargador_al_piso` | [Handgun Reload Sound Effect](https://opengameart.org/content/handgun-reload-sound-effect) | zer0_sol | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |

Disparos, explosiones y foley, en `sonidos/armas/` (MP3 mono, embebidos en `js/sonidos-armas.js`). Cada disparo es un
recorte de una toma «cerca del tirador»: el canal más fuerte, desde 2 ms antes del golpe, sin subgraves (pasa altos
de 45 Hz), con el pico del estallido bajado 14 dB por un limitador con anticipación (como se hace en los juegos, para
que tenga cuerpo y no lo aplaste el limitador de la mezcla) y todas las tomas al mismo nivel percibido.

| Archivos | Fuente original | Autor | Licencia |
|---|---|---|---|
| `tiro_pistola9_*` (Walther PPQ 9 mm), `tiro_pistola45_*` (Colt 1911 .45), `tiro_pistola380_*` (Bersa .380), `tiro_pistola762_*` (PPSh-41, tiro suelto, 7,62 × 25), `tiro_revolver_*` (Smith & Wesson 642 .38), `tiro_smg9_*` (Carl Gustav M45 9 mm), `tiro_ak_*` (AK-47), `tiro_ar15_*` (AR-15), `tiro_mosin_*` (Mosin-Nagant), `tiro_3006_*` (Springfield 1917 y Tikka T3, .30-06), `tiro_palanca_*` (Winchester 1894), `tiro_escopeta_cd_*` (Charles Daly de bombeo), `tiro_escopeta_m12_*` (Winchester Model 12), `tiro_escopeta_mossberg_*` (Mossberg 190), `tiro_escopeta_nova_*` (Benelli Nova) | [The Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library) («Prepared SFX Library») | el equipo de The Free Firearm Sound Library (Still North Media) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `explosion_cuerpo_1` (explode), `explosion_cuerpo_2` (explodemini) | [2 High Quality Explosions](https://opengameart.org/content/2-high-quality-explosions) | Michel Baradari (apollo-music.de) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| `explosion_grave_1`, `explosion_grave_2` (low_frequency_explosion_000 y _001) | [150 Combat Sound Effects](https://opengameart.org/node/195932) | untamedpixels | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `foley_ropa` (cloth1), `foley_cuero` (handleSmallLeather), `foley_hoja` (drawKnife3), `foley_raspa` (drawKnife1), `foley_clic` (metalClick), `foley_pestillo` (metalLatch) | [50 RPG sound effects](https://opengameart.org/content/50-rpg-sound-effects) | Kenney (kenney.nl) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `foley_ropa_gruesa` (cloth-heavy) | [RPG Sound Pack](https://opengameart.org/content/rpg-sound-pack) | artisticdude | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `foley_madera` (wood_hit_04), `foley_traqueteo` (tools_05), `foley_metal_pesado` (tools_04) | [100 CC0 metal and wood SFX](https://opengameart.org/content/100-cc0-metal-and-wood-sfx) | rubberduck | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |

**Qué implica CC BY 3.0** (Michel Baradari): hay que darle crédito, y este archivo y el README lo hacen.

Sonidos de ambiente, en `sonidos/ambiente/` (embebidos en `js/sonidos-ambiente.js`, a 22 kHz):

| Archivos | Fuente original | Autor | Licencia |
|---|---|---|---|
| `zombie_gemido_1` a `_4` | [Zombie moans](https://opengameart.org/content/zombie-moans) | Darsycho | CC0 |
| `zombie_gemido_5` a `_8`, `zombie_ataque_*`, `zombie_muerte_*` | [Zombies Sound Pack](https://opengameart.org/content/zombies-sound-pack) | artisticdude | CC0 |
| `impacto_carne_*` | [Squish Sounds Effects](https://opengameart.org/node/183322) | EZduzziteh | CC0 |
| `cuerpo_cae_*` | [2 wooden squish splatter sequences](https://opengameart.org/node/2549) | Independent.nu | CC0 |
| `paso_arena_*`, `paso_asfalto_*` | [Fantozzi's Footsteps (Grass/Sand & Stone)](https://opengameart.org/content/fantozzis-footsteps-grasssand-stone) | Fantozzi | CC0 |
| `quejido_*` | [DAMAGE SOUNDS (Male) - Audio Pack](https://opengameart.org/node/163052) | VoiceBosch | [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `grito_muerte` | [Man hurt sounds](https://opengameart.org/node/20720) | Aharabada | CC0 |

**Qué implican CC-BY-SA 3.0 y 4.0** (Gary y VoiceBosch): hay que dar crédito al autor (este archivo y el
README lo hacen) y los recortes derivados de esas grabaciones quedan bajo la misma licencia. El resto
del juego (código, gráficos) no queda alcanzado.
