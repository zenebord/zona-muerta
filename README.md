# Zona Muerta — Zombies del Apocalipsis

Juego de plataformas y disparos en 2D hecho con HTML5 canvas y JavaScript puro. No usa
librerías ni necesita instalar nada.

## Cómo jugar

Abrí `index.html` con doble clic en cualquier navegador moderno (Chrome, Safari, Firefox).
Si preferís servirlo, desde esta carpeta:

```
python3 -m http.server 8791
```

y entrá a <http://127.0.0.1:8791/>.

## Modos y dificultad

- **Zombies**: hay 15 variantes y nunca salen dos iguales seguidas. Los **caminantes** (10): leñador y camisa
  roja (camisa a cuadros abierta, se ve la panza, short roto), oficinista (camisa abierta y corbata), obrero
  (chaleco naranja reflectivo y casco), enfermero (ambo y barbijo), policía (uniforme, placa y gorra), turista
  (camisa hawaiana y cámara), cocinero (chaqueta y gorro), granjero (overol y sombrero de paja) y gordo (más
  grande, con panza). Los **corredores** (5), más chicos y rápidos: maratonista (musculosa con dorsal y una
  zapatilla), basquetbolista (camiseta con número y vincha), encapuchado, ciclista (casco y calzas) y
  adolescente (el más chico, gorra para atrás). Cada uno varía además el tono de la piel y de la ropa. El
  **tóxico** (cloaca) lleva el traje amarillo.
- **Personaje**: arriba a la derecha del menú principal se elige la skin, con vista previa animada:
  Sobreviviente (el de siempre), Dios del trueno, Armadura de combate, Cazador enmascarado, Centinela, Bufón
  del caos, Rey de los mares, Vaquero y Ninja. Están inspirados en arquetipos conocidos pero con diseños
  propios (sin nombres, logos ni emblemas registrados). Queda guardada en el navegador.
- **Pelea infinita**: los zombies vienen en **rondas infinitas**: cada ronda trae más que la anterior y,
  cuando caen todos, hay un respiro de unos segundos (y +20 de vida) antes de la siguiente. Al entrar se
  elige el mapa:
  - **Ciudad en ruinas**: una calle con farolas, chatarra y periódicos volando, y montañas con M2 y cajas
    especiales.
  - **Cloaca**: un canal subterráneo gigante de ladrillo (bóveda, arcos de piedra, caños, desagües que
    vuelcan agua, faroles enjaulados y un canal de agua tóxica que corre). Suena a túnel (eco a 0,17 s),
    con agua corriendo y goteo. Entre los zombies de siempre aparecen **zombies tóxicos** (uno de cada cinco
    al principio, hasta la mitad en las rondas altas): trabajadores con el traje amarillo roto, pústulas que
    brillan y baba fosforescente, con 35 % más de vida. Escupen ácido de dos maneras: **en arco**, que cae
    donde estás y deja un charco que quema unos 6 s, y **en chorro** recto a la altura de la cabeza, que se
    esquiva agachándose. Además **saltan encima** del jugador desde media distancia y, a veces, cuando les
    pegan, dan una **voltereta hacia atrás**. El ácido envenena: la vida baja de a poco unos segundos y la
    barra se pone verde. En la cloaca no hay montañas, así que no hay M2 ni cajas especiales.
- **Misiones**: 17 misiones que se juegan dentro de la pelea infinita (matar zombies, conseguir
  armas, sobrevivir, y varias contrarreloj). El progreso queda guardado en el navegador.
- **Defensa zombie** (antes «Torreta»): fijo en una M2 Browning sobre un parapeto de bolsas de arena, en medio de la calle. Los zombies
  llegan en olas por los dos lados y cada ola es peor: más zombies, más rápidos, más corredores y, desde la
  cuarta, más resistentes (ya no caen de un tiro). Las flechas giran la ametralladora (el tirador rodea el
  trípode), `F` dispara y `S` cambia la cinta. Entre olas hay un respiro con +20 de vida. Se guarda la ola
  más alta de cada dificultad.
  Con `A` (o tocando el panel ✈ del HUD) se pide un **ataque aéreo**: pasan dos cazas, caen siete misiles y
  no queda ningún zombie a la vista; el tirador se agacha detrás de las bolsas y no recibe daño. Se recarga
  en 20 segundos y el panel muestra si está listo, recargando (con barra) o en curso.
- **Entrenamiento**: polígono de tiro bajo techo, en un galpón grande (pared de chapa, columnas de acero, campanas
  de luz, claraboyas y piso de cemento), con las 25 armas y carteles que marcan la distancia cada 5 metros. Como es
  un lugar cerrado, los disparos tienen un eco moderado de las paredes (rebote a 0,13 s) y algo más de sala. Aparecen blancos al azar y todos se mueven: suben y bajan cruzando la línea de tiro y, desde la
  segunda serie, también se deslizan sobre un riel. Hay dianas (10-8-6-4-2 según dónde pegue), siluetas
  (5 al torso, 10 a la cabeza saltando), dianas rápidas ×1,5, dianas altas ×2 (hay que saltar) y platos que
  vuelan en arco, y dianas bajas ▼ ×1,5 que solo se alcanzan agachado (`↓`). Reaccionar rápido suma puntos extra. Series de 15 blancos con resumen (puntos, blancos,
  precisión, reacción) y récord guardado; cada serie es más difícil. `C` elige arma.
- **Ficha de cada arma**: en el campo de pruebas y en el entrenamiento, `C` abre el menú de armas; al tocar una
  se abre su ficha con la imagen grande, una descripción real (origen, año y munición) y los datos de juego:
  daño por impacto, tiros o golpes para matar un zombie en cada dificultad y uno tóxico, cargador, cadencia,
  funcionamiento, tipo y tiempo de recarga, alcance, perdigones, radio de explosión, retroceso y, en las
  legendarias, su poder. **USAR** (o `Enter`) se la da al personaje; **VOLVER** (o `Esc`) regresa a la lista.
- **Campo de pruebas**: una planicie de tierra sin zombies ni rondas, con las 24 armas en el
  inventario, para probar armas y recargas. `1`-`5` eligen el grupo de armas. `C` abre un menú
  donde se elige cualquier arma para tenerla directo en la mano (granadas y especiales incluidas), se pone o quita
  una M2 Browning y plantar un zombie maniquí que no se mueve ni muerde. Con el menú abierto, `X`
  borra todo lo generado.
- **Dificultad** (se elige en el menú y queda guardada):

| | Fácil | Medio | Difícil |
|---|---|---|---|
| Zombies en la ronda 1 | 5 | 8 | 12 |
| Más por ronda | +2 | +3 | +4 |
| Vida del zombie | 9 | 15 | 15 |
| Tiros con pistola / metralleta / rifle | 2 / 3 / 1 | 3 / 5 / 1 | 3 / 5 / 1 |
| Velocidad | ×0,75 | ×1 | ×1,3 |
| Mordida | 8 | 10 | 15 |

## Música, configuración e idioma

- **Música**: cada escenario tiene su tema, original y tocado en vivo con WebAudio (no hay archivos de
  música). La **ciudad** (pelea infinita, misiones y defensa zombie) es música de vaqueros en la menor (Am–G–F–E):
  guitarra criolla rasgueada, guitarra grave con trémolo, silbido, armónica, birimbao y campana del pueblo
  en la calma; con acción entran el galope (rasgueo apagado y cascos de caballo), tambor, latigazo y dos
  trompetas en terceras, y con la horda encima, un coro de hombres. La **cloaca**
  es ambiente industrial en do menor: zumbido grave que late, gotas con eco, golpes metálicos en los caños,
  ostinato de sintetizador y percusión de fábrica. Las capas entran según cuántos zombies hay vivos: en el
  descanso entre rondas queda tranquila, con la horda encima suena todo. El galpón y el campo de pruebas
  no tienen música. Se pausa con el juego y se apaga al morir.
- **Configuración**: el **engranaje** de arriba a la izquierda (en todas las pantallas; en partida pausa el
  juego) abre un panel con volumen general, efectos y música, silenciar todo y un botón para probar el
  sonido; idioma; dificultad; calidad gráfica (alta: hasta 2× de resolución; normal: 1×, para celulares
  lentos); botones en pantalla (automático, siempre o nunca); vibración al tocar y pantalla completa.
  Todo queda guardado en el navegador. `Esc` lo cierra.
- **Idiomas**: español, portugués (Brasil) e inglés. Al principio se elige según el idioma del navegador.
  Se traducen menús, HUD, avisos, misiones, dificultades, controles y los carteles del escenario.

## Asistente de construcción y ramas de jugador (temporal)

Mientras se arma el juego, el panel de configuración (rueda arriba a la izquierda) tiene **Abrir asistente**: un chat
con Claude adentro del juego. Sólo anda con el juego abierto en claude.ai y la sesión iniciada; la primera vez pide
permiso, y cada mensaje gasta el uso de Claude de quien juega (usa Claude Sonnet 5.5, o el modelo estándar si a esa persona no le está disponible; un cambio de código tarda
alrededor de un minuto).

- **Ajustes de valores**: daño, cargador, cadencia, recarga, alcance y retroceso de cada arma; velocidad, salto y vida
  del jugador; vida, velocidad, daño y cantidad de zombies; frecuencia de cajas. Quedan en el navegador de quien juega;
  el dueño ve además **Fijar para todos** (documento `ajustes/compartidos` de la base del artefacto).
- **Rama del jugador** (`js/rama.js`): para lo que necesita código, el asistente lee el código del juego y escribe un
  **parche** de JavaScript que se aplica en vivo. Los parches viven en el navegador de cada jugador («Mi rama»: apagar,
  borrar, recargar) y se aplican en cada carga, después de los datos, modelos y clases y antes de la interfaz. Un parche
  que falla al aplicarse no se guarda; uno que tira un error al jugar se apaga solo y el juego se recarga; si la carga
  anterior se colgó, se apaga el último parche.
- **Enviar a revisión**: la rama va a la colección `ramas` de la base del artefacto (dueño y miembros de la
  organización). Quien no puede escribir ahí la descarga como archivo `.json` (o la copia) para mandarla.
- **Fusionar en main** (desde Claude Code, cuando el dueño lo pide): leer `ramas` con ArtifactData, crear una rama de
  git `rama/<id>`, pasar cada parche aprobado al código real (prolijo, en el archivo que corresponde), probar, fusionar
  en `main`, agregar los ids de los parches a `PARCHES_FUSIONADOS` (`js/rama.js`) para que se borren solos de las ramas
  de los jugadores, marcar la rama como fusionada en la base y publicar.
- **Al publicar**: generar `js/codigo-fuente.js` con `python3 herramientas/empaquetar-codigo.py . js/codigo-fuente.js`
  y subirlo junto al resto (es el plan B del asistente para leer el código; no se versiona).
- Para retirar todo: ver el comentario de arriba de `js/asistente.js` y `js/rama.js`.

## Servidor de construcción (para que cualquiera pueda cambiar el juego)

`servidor/servidor.mjs` (Node 24 + SDK oficial de Anthropic; `cd servidor && npm install` la primera vez):

- **Sirve el juego desde la rama `main` de git**, no desde la carpeta de trabajo: lo que se está editando sin
  commitear no le llega a nadie.
- **Cada cambio de un jugador es un commit** en la rama `rama/<código del jugador>`, en `ramas/<código>/`
  (`rama.json` con todo, y cada parche como `.js`). Lo escribe con un índice temporal de git: no toca la carpeta de
  trabajo ni la rama abierta. El jugador ve su código de rama en «Mi rama» y puede seguir en otro dispositivo.
- **Asistente**: la clave de la API va en `servidor/.env` (copia de `servidor/.env.ejemplo`; no se versiona). Modelo
  Claude Sonnet 5.5 con esfuerzo medio, respaldo automático si el modelo declina, caché del pedido fijo. Topes: 30
  pedidos por persona y por día, 300 llamadas por persona y 2000 en total por día (se cambian en `.env`).
- Arranque: `node servidor/servidor.mjs` (puerto 8790, sólo en la Mac) y un túnel de Cloudflare hacia ese puerto
  para tener la dirección pública.
- Para ver las ramas: `git branch --list 'rama/*'`; para leer una: `git log main..rama/<código>`.

## Controles

En celulares y tablets aparecen botones en pantalla: flechas a la izquierda, fuego (se puede mantener), salto y
recarga a la derecha, y abajo cambio de arma, M2, cajas (en el campo de pruebas) y pausa. Se detectan solos.

| Tecla | Acción |
|---|---|
| `→` / `←` | Avanzar / retroceder |
| `↑` | Saltar |
| `↓` (mantener) | Agacharse con rodilla en tierra: el arma baja 13 unidades (blancos bajos) y se esquiva el chorro de ácido. Junto a una M2, la monta o la suelta |
| `F` | Disparar (mantener presionada con las metralletas) |
| `S` | Recargar (las escopetas cargan cartucho por cartucho; disparar interrumpe la carga) |
| `1` … `5` | Grupo de armas: 1 pistolas, 2 metralletas, 3 rifles, 4 escopetas, 5 especiales (otra vez: la siguiente del grupo) |
| `Q` / `E`, `G` / `H` o rueda del mouse | Arma anterior / siguiente |
| `A` | Defensa zombie: pedir un ataque aéreo (cada 20 s) |
| `C` | Campo de pruebas: menú de cajas y ametralladoras (`X` borra todo lo generado) |
| `P` / `Esc` | Pausa |

## Armas y tiros para matar un zombie

Tiros en dificultad media:

| Tipo | Armas | Tiros |
|---|---|---|
| Pistolas | Glock 17, Magnum .44, Colt 1911, Desert Eagle, Colt Python, Beretta 92FS, Walther PPK, Mauser C96 | 3 |
| Metralletas | Uzi, AK-47, M16, MP5, Thompson M1928 (tambor de 50), Kriss Vector, P90 | 5 |
| Rifles | Remington 700, Barrett M82, Mosin-Nagant, M1 Garand, Dragunov SVD, Winchester 1894 | 1 |
| Escopetas | Recortada doble caño, Mossberg 500, SPAS-12, AA-12, Saiga-12, Benelli M4, Remington 870, Winchester 1887 | 1 |
| Ametralladora fija | M2 Browning .50, clavada en las montañas, no se puede llevar | 1 |
| Especiales (solo en montañas) | Lanzagranadas M79, Milkor MGL (6 granadas), Bazuca M9, RPG-7, Granadas M67, Láser alienígena | 1 |
| Cuerpo a cuerpo (tecla 6) | Machete y Bate con clavos (2 golpes), Katana (2, rápida), Hacha de bombero y Mazo (1, lentos; el mazo empuja lejos) | 1–2 |
| Legendarias (tecla 7, solo en montañas) | Mjölnir (llama rayos sobre 4 zombies), Excalibur (onda de luz que atraviesa), Tridente de Poseidón (ola que barre), Égida (escudo que se lanza y vuelve), Gungnir (lanza que se lanza y vuelve) | 1 |

Las armas cuerpo a cuerpo y las legendarias no usan munición ni se recargan: `F` da el golpe (alza el arma,
la baja de golpe y vuelve a la guardia) y pega a los dos o tres zombies más cercanos adelante. Las de dos
manos se toman con las dos en el mango; el machete, la Égida y Gungnir, con una. Las legendarias son de la
mitología (nórdica, artúrica y griega); 3 de cada 10 cajas de montaña traen una.

### Diseño

Cada arma está dibujada de perfil con sus medidas reales en centímetros (Glock 20 cm, AK-47 88 cm, M16 99 cm,
Barrett 145 cm…) y sus rasgos de verdad: estrías de las correderas, cachas de madera cuadriculadas, tambores
estriados y varillas extractoras en los revólveres, cajones fresados, rieles, guardamanos ventilados,
apagallamas, miras telescópicas con torretas y lentes, tornillos y juntas. La P90 y el M1 Garand se midieron
además sobre fotos de perfil.

### Recargas

Cada arma se recarga con su mecanismo real. Durante la recarga el arma se acerca al cuerpo y se
inclina, y el personaje baja la mirada.

| Mecanismo | Armas | Qué hace |
|---|---|---|
| Cargador de pistola | Glock, Desert Eagle, Colt 1911 | Saca el cargador, lo cambia en la cadera y lo mete. Si quedó vacía, la corredera está trabada atrás: la Glock y la Deagle la tiran, la 1911 suelta el retén. |
| Tambor | Magnum .44 | Abre el tambor, boca arriba vacía los seis casquillos, boca abajo carga bala por bala y cierra. |
| Cargador rápido | Colt Python | Abre, vacía, mete las seis juntas con el cargador rápido, lo suelta al piso y cierra. |
| Peine | Mosin-Nagant, Mauser C96 | Vacía: abre el cerrojo, apoya el peine, empuja las balas y al cerrar salta el peine. A medias: completa bala por bala. |
| Cerrojo | Remington 700 | Abre la recámara, pone bala por bala por arriba y cierra. |
| Palanca | Winchester 1894 y 1887 | Gira el arma y carga por la ventana lateral de a una. Si estaba vacía, acciona la palanca. |
| Bombeo | Mossberg 500, SPAS-12 | Da vuelta el arma y mete los cartuchos por abajo de a uno; bombea si estaba vacía. Disparar interrumpe la carga. |
| Quiebre | Recortada, M79 | Se parte, boca arriba saltan los gastados, entran los nuevos y se cierra de un golpe. |
| Cargador extraíble | Uzi, AK-47, M16, MP5, P90, Barrett, AA-12, Saiga-12, láser | El vacío cae al piso. La AK y la Saiga lo enganchan con balanceo; la M16 palmea el retén; la MP5 traba la manija al empezar y la baja de un palmazo al final; las demás tiran del cerrojo si estaban vacías. |
| Cinta | M2 Browning | Levanta la tapa, tiende la cinta nueva, cierra y tira de la manija. |

Las de acción manual (Remington, Mosin, Mossberg y las dos Winchester) accionan el cerrojo, la
bomba o la palanca después de cada tiro, y el casquillo sale recién ahí. Los revólveres y la
recortada no tiran casquillos al disparar: los sueltan cuando se abren para recargar.

Las armas comunes (incluidas las de cuerpo a cuerpo) aparecen en cajas por el camino. Las especiales, en una caja brillante arriba
de las montañas, y vuelven a aparecer a los 90 segundos.

## Gráficos y sonido

- El lienzo se dibuja a la resolución real de la pantalla (hasta 1920×1080) sobre una escena lógica de 960×540.
- Personajes y armas se ilustran por piezas con degradado, bisel de luz y sombra en el borde y contorno fino.
  Las armas tienen brillo metálico, veta en la madera y culatas con caída.
- Cada zombie sale distinto: pelo, heridas, desgarros, manchas y a veces un brazo colgando. Al morir cae sobre un charco de sangre.
- Los mecanismos de recarga (cargadores, correderas, cerrojos, bombeo, cartuchos, balas) son grabaciones reales
  de armas, recortadas en eventos sueltos y elegidas según el arma. Fuentes y licencias en `sonidos/CREDITOS.md`.
- Voces de zombies, pasos, impactos de bala en la carne y quejidos del protagonista también son grabaciones reales.
  El viento de fondo, la sirena de cada ronda y el latido con poca vida son sintetizados.
- Los disparos y explosiones son sintetizados y suenan a aire libre (sin eco y casi sin reverberación), salvo en el
  galpón del entrenamiento, donde tienen eco: disparos en capas (chasquido, explosión de gas, golpe grave
  y cola) con eco de exterior y reverberación, y gemidos con formantes de voz.

## Estructura

```
index.html        pantallas (menú, misiones, controles, juego)
css/estilos.css   interfaz
js/config.js      configuración guardada (volúmenes, idioma, calidad, táctiles, vibración)
js/idioma.js      textos en español, portugués e inglés, y t('clave') para usarlos
js/audio.js       disparos sintetizados con WebAudio y reproducción de las grabaciones de mecanismos
js/musica.js      música de cada escenario, tocada en vivo por capas según la intensidad
js/sonidos-datos.js  grabaciones de mecanismos embebidas en base64 (generado desde sonidos/)
js/sonidos-ambiente.js  zombies, pasos, impactos y voz embebidos en base64 (generado desde sonidos/ambiente/)
sonidos/          recortes WAV de las grabaciones reales y sus créditos
js/armas.js       catálogo de armas (daño calibrado por tiros)
js/dificultad.js  tabla de dificultades y tamaño de cada ronda
js/dibujo.js      degradados, cubos, cilindros y sombras proyectadas (el "2.5D")
js/armas-dibujo.js    dibujo de pistolas y metralletas, con sus puntos de anclaje
js/armas-dibujo-2.js  dibujo de rifles, escopetas, M2 y especiales
js/misiones.js    catálogo de misiones y seguimiento
js/fichas-armas.js  ficha real de cada arma (origen, año, munición, descripción) en tres idiomas
js/terreno.js     mundo infinito por trozos, montañas, farolas, chatarra, ruinas y primer plano
js/escenario.js   cielo, cordilleras, ciudad lejana y suelo en perspectiva
js/escenario-objetos.js  ruinas, farolas, chatarra, alambrado del frente, periódicos, bolas de paja, campo de pruebas y galpón
js/escenario-cloaca.js   canal subterráneo: bóveda, arcos, caños, desagües, vereda y canal de agua
js/jugador.js     jugador, inventario, disparo, recarga por fases
js/jugador-dibujo.js  cuerpo del jugador con los brazos siguiendo la recarga
js/skins.js       personajes elegibles: colores, capa, torso y cabeza de cada uno
js/zombie.js      zombie (verde, camiseta azul manchada, pantalón marrón roto)
js/zombie-toxico.js  zombie tóxico de la cloaca, escupitajo de ácido y charco
js/armas-modelos-2.js  las 20 armas nuevas (fuego, cuerpo a cuerpo y legendarias)
js/armas-modelos-3.js  rediseño realista de las armas de fuego (medidas reales, estrías, cuadrillé, rieles, miras)
js/poderes.js     golpe cuerpo a cuerpo y poderes de las legendarias (rayo, onda, ola, armas que vuelven)
js/objetos.js     proyectiles, explosiones, cajas, ametralladora fija, partículas, casquillos
js/juego.js       partida: rondas, aparición de enemigos y cajas, HUD
js/interfaz.js    menú, teclado, pausa, fin de partida
js/tactil.js      controles en pantalla para celulares y tablets
```

Para depurar desde la consola del navegador: `ZonaMuerta.juego()` devuelve la partida en curso.
