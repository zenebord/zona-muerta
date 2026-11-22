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
  adolescente (el más chico, gorra para atrás). Cada uno varía además el tono de la piel y de la ropa.
  **Tamaño y zona de impacto** (pedidos de Enzo, 22/11). Los chicos (los 5 corredores) pasaron de 0,68–0,86 a **0,58–0,68** del
  tamaño común (unos 50 px de alto contra 75–100 del común). **Todos los zombies, de cualquier tipo, tienen la zona de impacto
  completa**: la de cada uno es lo que se ve dibujado (cabeza, sombrero, brazos estirados e inclinación hacia adelante). Se mide
  una sola vez por tipo (`medirFormaZombie` en `js/zombie.js`): se dibuja su cuerpo real en un lienzo aparte, a escala 1, mirando a
  la derecha, caminando y atacando en ocho momentos del paso, y se guarda lo más lejos que llegó a verse en cada lado (más 4 px
  de margen). Antes era un rectángulo fijo de 64·escala + 4: la cabeza sobresalía (11 px en el común, 6–8 en los chicos,
  hasta 23 con un sombrero) y la inclinación y los brazos quedaban afuera, así que el tiro de la M2 desde una montaña
  (la boca queda a 46 px sobre la cima y dispara recta; los zombies de la ladera tienen la cabeza a esa altura) pasaba por la
  cabeza que se veía sin pegarle. Medido sobre 34 tipos (comunes, corredores, tóxico, congelado, los del lugar con los
  animales y los 4 jefes, en las dos direcciones): lo máximo que algo visible queda fuera de la caja es 0,8 px a los costados (el
  margen de 4 px es sólo vertical); probado con la M2 desde la montaña: la bala le pega a la cabeza de todos, aun a 1 px del tope. **Excepción: los
  chicos y los animales** conservan un piso de altura (56 y 52 px, más el margen) y su caja es la completa de su dibujo: agachado
  (la boca queda a 50–52 px) se les pega siempre, 8 de 8 con la Glock incluso al más chico (0,58); parados, 0 de 8 (la boca está
  a 65 px: hay que agacharse, o usar el bípode o la mira, que los sigue). Los comunes, tóxicos y congelados, 8 de 8 parados y
  agachados. La mira automática sigue apuntando al pecho (`Zombie.pecho()`, 41 px en el común, igual que antes).
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
  - **Bosque nevado** (`js/escenario-nieve.js`, pedido: «un mapa de nieve con pinos nevados con nieve en las hojas»):
    el mismo mundo de la ciudad (trozos de 1200 px), todo nevado. Cielo de invierno con el sol velado, dos
    cordilleras nevadas y tres filas de **pinos con nieve en las ramas** (cada piso de ramas con su capa de nieve,
    blanca al sol y celeste a la sombra, con gotas que cuelgan) que se lavan con la distancia. El camino tapado de
    nieve tiene las huellas de las ruedas, pisadas y ventisqueros; atrás hay pinos grandes, rocas nevadas, troncos,
    carteles de ruta y autos enterrados. Las **colinas** son las montañas de la ciudad, con su **M2 Browning** arriba
    y la **caja especial**, pinos en las laderas, cornisa, carámbanos y rocas. Nieva en tres profundidades, el viento
    levanta ráfagas al ras del piso y las pisadas crujen. Vienen los mismos zombies que en la ciudad y, además,
    **zombies congelados** (`js/zombie-congelado.js`: casi uno de cada cinco al principio, hasta cuatro de cada
    diez en las rondas altas): excursionistas con campera acolchada y gorro de lana con pompón, con **nieve en la
    ropa** (hombros, pecho, ruedo y gorro) y carámbanos, la piel gris azulada escarchada, ojos celestes y vaho al
    respirar; caminan más lento y aguantan 25 % más. De lejos (de 140 a 560 px) levantan un **bloque de hielo
    azul** por detrás de la cabeza y lo tiran por elevación adonde va a estar el jugador: si pega, **saca 5 de
    vida** y se rompe en astillas, igual que contra el piso. Probado: en 4 tiros desde 200 a 420 px, de los dos
    lados, cada bloque le sacó exactamente 5 al jugador; en cinco rondas salieron 14 congelados de 70 zombies.
    Los pinos se dibujan una vez por variante y tamaño, y cada fila de bosque en una tira de 2048 px que se repite;
    aun así, el cuadro de la nieve cuesta 1,6 veces el de la ciudad (medido sin placa de video).
  - **Distancia y búnkeres** (`js/bunker.js`, pedido de Enzo el 16/11; los botiquines los sumó Leandro): en los
    tres mapas, arriba de la pantalla se ve **cuántos metros** se recorrieron desde el punto de partida (1 m = 44
    unidades, la medida de las estacas del entrenamiento) y a cuánto está el **próximo búnker** hacia donde se camina.
    El primero está a **300 m**, para los dos lados, y **cada búnker queda siempre a 300 m del anterior** (pedido de
    Leandro el 22/11; antes, por pedido de Enzo del 18/11, la distancia crecía 1 km cada 3 hordas: se sacó). Se genera el
    siguiente cuando el jugador se acerca a 3 pantallas del último.
    Cada uno es un **búnker subterráneo**: en el piso, una losa blanca con una reja encima
    de la escalera que baja, lámparas verdes en las esquinas y una **luz verde** que sale del piso y sube hasta el
    cielo (se ve desde lejos). Si el trozo de un búnker iba a ser una montaña, deja de serlo (`Mundo.sinMontana`): así queda a 300 m exactos y
    nunca arriba de una montaña. Parado encima aparece **«↓ ENTRAR AL BÚNKER»** (en el
    celular, «toca ▼ ABAJO»); entrar es opcional y la partida queda quieta mientras se está adentro; al salir hay
    1,5 s sin daño. Adentro, en una bóveda de concreto blanco con armero, lámpara y la puerta de la escalera
    iluminada de verde, atiende el **comerciante**: un señor de unos 75 años con **parche en el ojo**, **barba blanca
    más o menos larga** y **pelo corto y blanco**, con camisa gris y chaleco de cuero (es un personaje más de
    `js/skins.js`, con la anatomía de todos, que no aparece entre los elegibles) y con el arma elegida en la mano.
    El menú dice **MEJORAS** arriba, las **muertes y el dinero** arriba a la derecha y **nuestras armas** abajo; al
    tocar una se ve **el arma grande** y a su derecha **MEJORAR** con el precio. Cada mejora sube el daño del arma un
    **20 %** (cinco niveles, hasta el doble; se aplica en `Zombie.recibirDano`) y cuesta la mitad del precio del
    arma la primera vez y medio precio más cada vez (Glock: $60, $100, $150, $200, $250). La otra pestaña,
    **COMPRAR**, vende las armas comunes y las especiales que no se tienen, cada una con su precio (los de la
    defensa ultra; Glock $100, AK-47 $650, Barrett $1300, minigun $3000, láser $3500), y **botiquines** ($150):
    se llevan encima hasta 3 y se usan con **V** (configurable) o el botón **✚**; curan 50 y quitan el veneno. Las
    especiales también se recargan ahí. **Ataque aéreo** (pedido de Enzo el 18/11): en la pelea infinita (no en las
    misiones) se pide con **A** o el botón de arriba a la izquierda, igual que en las defensas: los misiles limpian la
    pantalla y se recarga **cada 60 s** (el primero no está de entrada: llega a los 60 s de empezar); el personaje se tira **cuerpo a tierra** mientras caen los misiles; en el búnker se compran **cargas extra** ($400, hasta
    3), que se gastan sin esperar cuando el gratuito está recargando (el botón muestra «LISTO · +2»). Probado: 5 de 5
    zombies a la vista caen, la espera es de 60 s y las cargas se compran y se gastan. **EQUIPABLES** (`js/equipables.js`, pedido de Enzo el 18/11), abajo de todo en la
    ventana del arma elegida, muestra tres objetos que quedan puestos en esa arma (y se dibujan sobre ella, en la
    mano y en el menú): **bípode** ($200; en todas menos escopetas, pistolas y cuerpo a cuerpo; mejora muy poco la
    puntería: le pega de frente a los zombies chiquitos —escala menor a 0,85— del mismo piso sin agacharse, y cierra
    las ráfagas a la mitad; parado en el piso, no vale desde una montaña ni un lugar alto; medido: 0 de 8 tiros contra
    un corredor chico sin bípode y 8 de 8 con él, y 0 de 8 en la montaña); **mira** ($350 la telescópica, sólo en los
    **rifles**; $250 la de punto rojo en las demás; funciona igual que las que ya existen: tecla D, apunta sola y no
    falla; no se vende en las que ya traen una); y **silenciador** ($300; disparo apagado y fogonazo mínimo, y con él
    en el arma de la mano los zombies vivos a la vez bajan un 20 %: con el tope de 30 de dificultad media, 24).
    El dinero sale de los zombies: $10 cada uno, $15 los corredores, $20 los
    tóxicos y congelados, y $2 más por cada ronda. En el menú: ← → otra carta, Tab la otra pestaña, Enter la acción,
    Esc o ↑ salen. Las misiones, la historia y los otros modos no tienen búnkeres.
    **Vista dividida** (pedido de Leandro): al bajar, **la partida sigue arriba tal cual** —los zombies caminan, las rondas
    pasan, el dinero de las muertes sube— y el búnker ocupa **la mitad de abajo** de la pantalla (todo mide en vh). El
    jugador no se ve ni recibe daño (invulnerable mientras esté abajo, el veneno queda en pausa) y los zombies lo toman por
    ausente: no muerden, escupen ni lanzan, sólo se juntan en la boca (probado: 5 tipos 20 s, vida 100 → 100; al salir
    muerden de nuevo). Un botón rojo, **BOMBARDEAR LA SUPERFICIE · GRATIS**, lanza el ataque aéreo (dos cazas, siete
    misiles y remate sobre todo lo que está a la vista) **sin gastar la espera de 60 s ni las cargas compradas y sin límite
    de veces** mientras se esté adentro; el contador «ARRIBA: N ☠» dice cuántos zombies hay a la vista y se pone verde en 0,
    para salir con la superficie limpia (probado: 7 de 8 muertos, el que seguía estaba a 760 px, fuera de la pantalla; se
    repite gratis). Con el búnker cerrado, el ataque aéreo sigue como siempre (`A`, 60 s).
- **Botiquines en las cajas** (pedido de Leandro, 22/11): en la pelea infinita, ~22 de cada 100 cajas del camino traen un
  **botiquín** (caja con la valija blanca y el aviso BOTIQUÍN) en vez de un arma; al pasar suma uno a los que se llevan (hasta
  3, se usan con V o ✚). Con los tres encima ya no salen y la que quedó en el camino no se levanta. Medido: 21,3 % de 4000
  cajas; 0 de 500 con los tres; levantar suma 1 (1 → 2).
- **Menú principal**: el botón **MISIONES** se sacó (pedido de Leandro, 22/11); el código y el panel quedan en el juego pero
  sin acceso desde el menú. Los demás modos se reacomodan en dos columnas.
- **Parpadeo del personaje**: sólo en el respiro corto tras un golpe o al reaparecer (hasta 2 s). En el tutorial, que lo hace
  invulnerable 60 s, titilaba como un foco fallando: ya no (medido: 0 de 100 cuadros con parpadeo; tras un golpe, 53 de 100).
- **Misiones**: 17 misiones que se juegan dentro de la pelea infinita (matar zombies, conseguir
  armas, sobrevivir, y varias contrarreloj). El progreso queda guardado en el navegador.
- **Defensa zombie ultra** (`js/defensa-ultra.js`): el tirador defiende su sector, a la izquierda, y los zombies llegan
  desde la derecha por **4 carriles**; con ↑ y ↓ (o ▲ ▼ en el celular) cambia de carril. Las balas y el cuchillo sólo
  pegan en el carril propio. Arranca con una Glock y un cargador de repuesto; sin balas pasa a otra arma con munición o
  al **cuchillo**. Cada zombie muerto paga **dinero** ($10, $15 los corredores, +$2 por ola), que se gasta en la
  **tienda** (B o TIENDA, pausa la partida): armas que se habilitan cada dos olas, munición para las que tiene y hasta 4
  **torretas automáticas** (una por carril, $300 / $500 / $800 / $1200; T compra una directo) que disparan solas en su
  carril. Durante las olas, y siempre al terminar una, cae una **caja en paracaídas** con un arma o munición en otro
  carril de su columna: hay que ir a buscarla antes de que desaparezca (13 s). El ataque aéreo se recarga cada 25 s.
  **Si pasan más de 5 zombies, se pierde**; el récord de olas se guarda por dificultad.
  Detrás de la línea hay un campamento militar (carpa, bandera, antena, cajas bajo red de camuflaje, tambores y
  parapeto de bolsas de arena). Durante el ataque aéreo el tirador se tira cuerpo a tierra con las manos en la
  cabeza: no dispara ni cambia de carril hasta que termina.
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
- **Campo de pruebas**: un puesto de tiro techado, sin zombies ni rondas, con las 24 armas en el
  inventario, para probar armas y recargas. `1`-`5` eligen el grupo de armas. `C` abre un menú
  donde se elige cualquier arma para tenerla directo en la mano (granadas y especiales incluidas), se pone o quita
  una M2 Browning y plantar un zombie maniquí que no se mueve ni muerde. Con el menú abierto, `X`
  borra todo lo generado.
- **Dificultad** (se elige en el menú y queda guardada):

| | Fácil | Medio | Difícil |
|---|---|---|---|
| Zombies en la ronda 1 (base) | 5 | 8 | 12 |
| Más por ronda | +2 | +3 | +4 |
| Zombies reales por ronda | **10 % menos** que la base, redondeado (`FACTOR_ZOMBIES_INFINITA`, pedido de Leandro): en Medio, rondas 1, 2, 3, 5 y 10 = 7, 10, 13, 18 y 32 (antes 8, 11, 14, 20 y 35) | | |
| Vida del zombie | 9 | 15 | 15 |
| Tiros con pistola / metralleta / rifle | 2 / 3 / 1 | 3 / 5 / 1 | 3 / 5 / 1 |
| Velocidad | ×0,75 | ×1 | ×1,3 |
| Mordida | 8 | 10 | 15 |

## Campo de pruebas: vitrina de armas

El personaje queda quieto y la cámara se acerca (3,3× con pistolas, 2,9× con metralletas y cuerpo a cuerpo, 2,6×
con el resto) para ver de cerca el arma, el fogonazo, los casquillos y la recarga. ← y → cambian de arma (lista para
tirar, sin heredar la espera de la anterior), `F` o clic dispara, `S` o clic derecho recarga y `L` pone cámara lenta
(un cuarto de la velocidad; el sonido sigue normal). `Z` o el botón **+ ZOMBIE DE PRUEBA** de la ficha ponen un zombie quieto
que no muerde, para probar el arma: cada uno nuevo va un poco más atrás que el anterior y puede haber hasta 5 (con uno
más se va el más viejo). Se dibuja siempre con todos los píxeles de la pantalla (hasta 3×), sin importar la calidad elegida, para que de cerca no se vea pixelado. La ficha del arma en la mano: su dibujo entero de perfil con el largo, grupo, origen, año,
munición, descripción, daño, tiros para matar, cargador, cadencia, funcionamiento, recarga, alcance y retroceso, con
la munición en vivo; va arriba a la izquierda y el personaje justo a su derecha (el juego mide dónde termina la ficha, que cambia con la
pantalla: entre el 30 % y el 42 % del ancho), así queda lugar a la derecha para los zombies de prueba, desde 140 px. `C` sigue abriendo la lista de todas las armas.

El escenario es un galpón enorme (`Escenario.dibujarCampo`). Como la cámara acercada sólo muestra unos tres metros, el
tamaño se lee por la profundidad: el piso sigue hasta la pared del fondo, dos hileras de columnas de acero cada vez más
chicas y lavadas por la neblina, estanterías lejanas, un ventanal alto, haces de luz en diagonal, lámparas colgadas y
las juntas del piso que convergen. Detrás del arma queda lo más claro (la neblina del fondo), así el acero negro
recorta; el piso de adelante es claro para ver casquillos, peines y cargadores; la línea de tiro amarilla está en la
punta de las botas y, a la derecha, la trampa de balas. Suena como galpón (eco) y apenas entra el viento de afuera.

**Luz del fogonazo** (`LuzFogonazo` en `js/objetos.js`, en todos los modos salvo la defensa ultra): cada disparo
ilumina el piso debajo de la boca (una mancha anaranjada, más ancha y tenue cuanto más alto el arma) y al tirador,
cuerpo y arma, más fuerte cerca de la boca. Dura 90 ms (un poco más que la llama) y se apaga en curva. Lo del tirador
se hace con su silueta en un lienzo aparte, sin la sombra; con la calidad liviana se omite.

### Campo de pruebas en realidad virtual (`vr/`)

`vr/index.html` (publicado en `…/zona-muerta/vr/`): el campo de pruebas en primera persona para el Meta Quest 3S, con
WebXR desde el navegador del visor (necesita HTTPS: GitHub Pages; dentro del artefacto de claude.ai no entra en VR).
Three.js 0.170.0 desde jsDelivr; del juego usa los modelos de las armas, los cargadores, los calibres (`js/municion.js`),
el catálogo (`ARMAS`) y los sonidos. `js/armas-especiales.js` (trae el modelo de la minigun) se carga con `Jugador`,
`Juego` y `FUERZA_RETROCESO_ARMA` vacíos, porque al cargar parcha esas clases del juego.

- **Las armas son las del juego** (`vr/modelo3d.js`): se graban los polígonos que pinta el modelo 2D de cada arma, con la
  transformación del lienzo (la bomba de la Mossberg y el quiebre del M79 se dibujan con `translate`/`rotate`), y cada
  pieza se extruye con su espesor o se tornea alrededor de su eje (cañones, tubos, miras telescópicas, cohetes, mangos).
  Lo que se mueve sale de comparar el dibujo en reposo con el del otro extremo: un desplazamiento o un giro con su
  pivote. Las piezas fijas de cada arma se juntan en una malla por material: con las 12 armas, el zombie y el galpón
  son 162 llamadas de dibujo por cuadro (281 sin juntar) y 112 000 triángulos. Si el dibujo cambia el orden de las piezas
  entre los dos extremos (la escopeta de dos caños y el M79 pintan la báscula antes o después del caño según estén
  abiertos), las piezas se emparejan por color y cantidad de puntos: antes el M79 de la mesa no se veía abrir (el
  ajuste daba cero).
- **El dibujo del juego como textura** (las 36 del armero; `def.textura`, `texturaDeArma`): el 2D pinta mucho más que
  los polígonos (degradados, veta, cuadriculado de las cachas, bisel, desgaste, grabados como «PYTHON 357», tornillos,
  el alambre del bate, la sangre del machete del cazador, los rayos de la Égida: el acabado de `js/armas-modelos.js` a
  más de 3 px/cm). Se dibuja el arma entera a 4–8 px/cm y se proyecta de costado sobre las piezas; los bordes se corren
  11 px para que los cantos tomen el color del borde. Con textura el metal refleja menos (la luz ya viene pintada).
  Cada pieza se ve de su color (colores por vértice) hasta que su dibujo está listo: se pintan de a una arma, 60 ms
  entre una y otra, después de arrancar (en el Chrome de pruebas por software el dibujo y los bordes costaban 4,4 s
  juntos; así la página queda lista igual que antes, en 4,1 s, y las texturas a los 7,3 s). La que se toma antes, se
  pinta en el momento.
- **Los trazos en el aire** (`def.trazos`, `grabarTrazos`): las líneas que el dibujo traza fuera de las piezas
  (guardamontes, colas del disparador, la palanca de las Winchester, los clavos del bate, los cables de la bazuca) se
  vuelven varillas; las que caen sobre una pieza (ranuras, rayas, grabados) ya están en la textura. Cuenta como «en el
  aire» si lo que queda afuera mide al menos 0,8 cm y el 40 % del trazo (las marcas de la vara de Gungnir no).
- **La mesa**: una de cada tipo de `NOMBRE_CATEGORIA`, acostadas con la empuñadura hacia el jugador y un cartel con el
  nombre. Agarre derecho cerca de una la toma; otra vez la deja (sobre la mesa vuelve a su lugar; lejos, cae y vuelve).
- **El armero de la pared de atrás** (`vr/armero.js`, `vr/armas-todas.js`): las otras 36 armas del juego (todas menos la
  M2, que es la ametralladora fija del monte) en un tablero perforado corrido de 13 m sobre la pared que queda a la
  espalda al empezar, a 5,5 m: pistolas, metralletas, rifles, escopetas, lanzagranadas y bazuca, cuerpo a cuerpo y
  legendarias, cada grupo con su cartel y cada arma con su nombre. Las de fuego cuelgan de dos ganchos en lo más bajo de
  su mitad de atrás y de su mitad de adelante, con la boca a la derecha y el lado dibujado a la vista, como en el juego;
  las de pie, con los mangos a 0,95 m (la Égida, de frente). Si el juego suma armas o categorías, entran solas (las
  categorías nuevas, en un grupo «OTRAS»). Se toman con la mano (se puede caminar hasta 45 cm de la pared) o apuntándoles
  desde la mesa: el rayo del mando y la tecla E llegan a 9 m. Al dejarlas vuelven a su lugar (tarda más cuanto más
  lejos). Tablero, marcos, ganchos y carteles van en cuatro mallas; mirando la pared son 181 llamadas de dibujo y
  142 000 triángulos (mirando al campo, 107). Armar las 36: 140 ms en la computadora.
- **Cada arma de la pared se arma sola desde el juego** (`fichaDe` en `vr/armas-todas.js`): la empuñadura donde apoya la
  mano del gatillo en el 2D; el apoyo en `manoDelantera`; la carga en el ancla `cargador`; lo que se mueve (corredera,
  cerrojo o manija, bomba, palanca, quiebre, tambor); la mecánica y la munición de `ARMAS` (`recargaTipo`); las miras
  telescópicas del SVD (4×), el Barrett (10×) y la Mosin (3,5×) en su tubo y las de punto rojo (ver «Todas las miras»); el retroceso por categoría (más
  fuerte en la Desert Eagle, los revólveres y el Barrett). Los materiales se deciden por el color medido como lo pinta el
  juego (sRGB: `tipoDeColor` lo mide en lineal y los marrones oscuros quedaban goma y los dorados, madera): madera los
  marrones, latón los dorados (en las legendarias, también el bronce), acero los grises, goma o polímero los oscuros.
- **Los tambores son redondos** (`vr/tambores3d.js`): el dibujo los trae de costado y, extruidos, eran una placa (el del
  MGL y los de los revólveres, de frente, un rectángulo; el de la Thompson, una tabla de 3 cm). `fichaDe` saca esa pieza
  (la reconoce por lo que hace: la más grande de las que se mueven al abrir, o lo que se va con el cargador) y pone en
  su lugar el tambor de verdad, con las medidas del dibujo:
  - **Colt Python y Magnum .44**: seis recámaras pasantes, estrías entre ellas que no llegan hasta atrás, la estrella
    del extractor y la varilla (cerrado, adentro de la funda bajo el cañón); el escudo de atrás queda en el armazón.
    Gira 60° con cada tiro: la Colt a la derecha y la Smith & Wesson a la izquierda, mirados desde atrás. El contador de
    balas pasó al costado del cañón (iba sobre el tambor y lo tapaba).
  - **Milkor MGL**: seis recámaras de 40 mm (la de arriba, en línea con el cañón), estrías anchas y la placa trasera
    oscura; 18,6 cm de diámetro, como en el dibujo.
  - **Se abren hacia la izquierda** (los dos revólveres y el MGL): el tambor gira 90° alrededor de un eje paralelo al
    cañón, arriba y a la izquierda de él, y termina al costado izquierdo del arma a la misma altura, con su borde a
    1,8 cm del medio (en la mitad del recorrido baja 0,8 cm en los revólveres y 2,3 en el MGL: así no roza el armazón
    de arriba al salir). El dibujo del juego los baja (y al MGL le vuelca hacia abajo todo el frente): en el MGL ahora
    sale sólo el tambor y la placa, el cañón y la empuñadura quedan en su lugar. La recámara donde entra la bala o la
    granada va con el tambor.
  - **Thompson**: el tambor de 50 es un disco de perfil, de 13,2 cm y 5,4 de ancho (como lo dibuja el juego cuando cae
    al piso), con el canto de dos aros, la cara estampada, la llave de cuerda del lado izquierdo y la torre que entra en
    el cajón; va 1,6 cm más adelante que la pieza del dibujo para no meterse en el armazón del disparador. El que cae,
    el que trae la mano izquierda (agarrado del canto de abajo) y el puesto son el mismo tambor.
  - Con el arma en la mano, cada recámara muestra lo que tiene: la bala, la vaina del tiro o nada (abierto se ve; en
    la pared no se dibujan las balas). Los cuatro suman 15 000 triángulos y 8 mallas.
- **Menú** (`vr/menu.js`): un panel en el aire que aparece al empezar y se abre cuando quieras con **Y** (mando
  izquierdo) o **M** sin visor (Esc también, al soltar el mouse); se apunta con el rayo de cualquier mando, el gatillo
  aprieta, y mientras está abierto el juego está en pausa (no corren los zombies, los blancos ni el reloj del nivel; el
  arma sigue la mano pero no tira, y al cerrar hay que soltar el gatillo antes de volver a disparar). Páginas: inicio
  (los tres modos), niveles, pausa, modo libre (con pestañas), resultado, guía (con «Tipos de zombie»: qué hace cada
  uno, en dos páginas) y configuración.
- **Modos** (`vr/modos.js`; al elegir un modo se ven sus niveles; las reglas están en la guía, que pausa):

| Modo | Qué es | Niveles |
|---|---|---|
| Entrenamiento | Blancos de chapa (`vr/blancos.js`) que suben detrás de un parapeto, se quedan un rato y bajan: +1, la cabeza roja +2, −1 si baja sin tiro. Caen con bala, explosión, llamas o golpe | 10: de 10 blancos de a uno a 8–12 m y 4 s arriba, a 30 de a cuatro a 20–60 m y 1,4 s, con móviles desde el 5 y chicos desde el 8. Se pasa con el 60 % (★★ 80 %, ★★★ todos) |
| Ataque zombie | El campo vacío; los zombies salen del piso al fondo, caminan, rodean la mesa y muerden (−20 de 100 hasta el nivel 5 y −25 después, por lo que muerde cada tipo); explosiones, gas, ácido, cascotes, fardos y embestidas también quitan vida | 10: de 4 caminantes (2 a la vez) a 28 de todos los tipos de Último bastión (10 a la vez, más rápidos y con más vida, también por los costados). Cada nivel suma tipos (gordo y jauría en el 3, acorazado, soldado y cuervos en el 4, gritón e hinchado en el 5…) y, cuando cayó el 60 %, los jefes: El Coloso en el 5, La Sirena en el 8, El Escudo (con cuatro que cubre) en el 9, La Cisterna y El Coloso en el 10. Se pasa matando a todos (★★ con media vida, ★★★ sin perder vida) |
| Libre | El campo de pruebas: papel a 10, 25 y 50 m, el zombie de cartón y un caminante | Sin niveles: el menú tiene pestañas (comunes, Último bastión, animales, jefes, blancos) para aparecer cada tipo (perros, cuervos y rabiosos en manada; El Escudo con los que cubre) o una horda de 6, y blancos a 10/25/50 m o móvil; zombies quietos, que reaparezcan o no, quitar todo |

  Los niveles se destraban de a uno; el progreso (superado, estrellas, récord) se guarda en `localStorage`
  (`zonaMuerta.vr.progreso`). Tablero sobre la mesa, cartel arriba a la izquierda sin visor y, en el visor, un reloj en
  la muñeca izquierda con la vida o los puntos. Cuenta regresiva al empezar cada nivel y los puntos suben sobre cada
  blanco.
- **Configuración** (`zonaMuerta.vr.config`): volumen general y de efectos, silencio, vibración de los mandos, giro con
  la palanca (30°, 45° o suave), velocidad al caminar, altura (de pie o sentado: el piso baja 40 cm) y sensibilidad del
  mouse.

| Tipo | Arma | Cómo funciona (`vr/armas-vr.js`, `vr/especiales.js`) |
|---|---|---|
| Pistola | Glock 17 | Semiautomática; la corredera cicla y, vacía, queda atrás (B o la mano la sueltan) |
| Metralleta | AK-47 | Automática; manija de carga a mano o con B |
| Rifle | Remington 700 | Cerrojo a mano después de cada tiro; mira telescópica de 6× que aumenta de verdad (una cámara angosta en la lente) |
| Escopeta | Mossberg 500 | La bomba es el guardamanos donde apoya la mano izquierda; 6 perdigones; cartuchos de a uno por el portillo |
| Ametralladora | Minigun M134 | Los cañones arrancan en 0,35 s y frenan en 1,4 s; 2000 por minuto; caja de 300; una de cada tres es trazadora |
| Lanzagranadas | M79 | B lo quiebra (sale la vaina) y lo cierra; la granada de 40 mm vuela en parábola y explota |
| Bazuca | RPG-7 | El cohete sale con estela, acelera y explota; otro se encastra en la boca |
| Granada | M67 | Gatillo: anilla; al soltarla con el brazo en movimiento vuela, rebota y explota a los 3,5 s |
| Lanzallamas | M2 | Chorro de llamas que prende al zombie (4 de vida por segundo, la piel se chamusca) |
| Láser | Alienígena | Energía que atraviesa (hasta 3); la celda es el huevo verde |
| Cuerpo a cuerpo | Machete | Pega según la velocidad de la mano (más de 2 m/s); silba al blandirlo |
| Legendaria | Mjölnir | Pega con rayos: el golpeado y hasta 3 zombies más a menos de 6,3 m (como en el juego; un solo trueno); se tira soltándolo rápido y vuelve con el agarre de la mano vacía |

Las del armero (lo que ya hacían en el 2D, en 3D):

| Grupo | Armas | Cómo funcionan |
|---|---|---|
| Pistolas | Colt 1911, Desert Eagle, Beretta 92FS, Walther PPK, Mauser C96 | Como la Glock: cargador propio de cada una (`js/cargadores.js`) y corredera trabada atrás al vaciarse |
| Revólveres | Magnum .44, Colt Python | B abre el tambor y la varilla vuelca todo (vainas y balas, como en el juego). La Magnum se carga de a una; la Python con el cargador rápido, las seis de una vez, y el cargador vacío se cae de la mano |
| Metralletas | Uzi, M16, MP5, Thompson (tambor), Kriss Vector, P90 | Automáticas con su cargador; vacías, se monta con la mano o con B |
| Rifles | Barrett M82, Dragunov SVD | Semiautomáticos con cargador y mira telescópica |
| | M1 Garand | Peine en bloque de 8: con la última sale el peine con su «ping» y el cerrojo queda trabado atrás; la mano izquierda trae un peine lleno y, al entrar, el cerrojo cierra solo |
| | Mosin-Nagant | Cerrojo a mano; vacía y con el cerrojo atrás, el peine de 5 en la guía empuja las cinco y salta al cerrar (a medias, bala por bala) |
| | Winchester 1894 | Palanca (con su sonido) después de cada tiro; balas de a una por el portillo |
| Escopetas | SPAS-12, Remington 870 | Bomba (como la Mossberg, ver «La bomba») |
| | Benelli M4, Saiga-12, AA-12 | Semiautomáticas (la Benelli con tubo; la Saiga y la AA-12 con cargador; la AA-12 automática) |
| | Winchester 1887 | Palanca y cartuchos por el portillo |
| | Escopeta de dos cañones | Dos cañones lado a lado (el dibujo, de costado, muestra uno solo: se tornean dos), cada martillo sobre el suyo y cada tiro sale por su caño, primero el izquierdo. Se quiebra en la bisagra (salen sólo los gastados); cada tiro baja su martillo y, al cerrarla, el pulgar monta los caídos (uno y otro, con su clic). Con los dos abajo no tira |
| Lanzadores | Milkor MGL | Se abre como un revólver; granadas de 40 mm de a una, en parábola |
| | Bazuca M9 | Un cohete por vez, que se encastra atrás |
| Cuerpo a cuerpo | Katana, Hacha de bombero, Bate con alambre de púas, Mazo | Como el machete |
| | Machete del cazador | Al tomarlo susurra en vez de hacer ruido de arma; al matar (y 4 de cada 10 golpes) vuelve a susurrar, con la espera del juego (4 s y 8 s) |
| Legendarias | Excalibur | Cada tajo fuerte (con el visor) o cada clic (sin visor) suelta una medialuna de luz que avanza a 12 m/s y atraviesa a todos hasta 10,7 m |
| | Tridente de Poseidón | La ola: crece, barre el piso hasta 5,3 m, pega 0,7 del daño y empuja 1,6 m (aturde) |
| | Égida, Gungnir | Se tiran rectas (la lanza con la punta adelante, 15 m/s y 10,7 m; el escudo acostado y girando, 11 m/s y 7,2 m), pegan a cada zombie que cruzan, a la ida y a la vuelta, y vuelven solas a la mano |

  Todas toman con el ruido de sacar esa arma del juego (`Audio_.sacarArma`) y tiran con su disparo grabado. Sin visor, R
  hace la recarga entera con los tiempos de la mano.
- **Pasos de la recarga en orden**: la cola de pasos (abrir, volcar, cargar, cerrar) ejecutaba de atrás para adelante
  los que vencían en el mismo cuadro; con un cuadro largo (por ejemplo, mientras se pinta una textura) la Magnum
  cerraba antes de cargar. Ahora corren en orden (probado con un tirón de 3 s: Magnum, MGL, dos caños y Mosin cargan
  completas).
- **Balas chicas por categoría**: lo que frena el escudo y lo que achica el blindaje (`vr/zombie3d.js`), y los tiros
  pesados que esquiva el rabioso, ahora van por categoría (pistola, metralleta, escopeta y ametralladora; rifle,
  lanzagranadas y bazuca) en lugar de por nombre: con nombres fijos, cualquier pistola de la pared atravesaba el escudo.

- **Miras**: el dibujo es de costado y, pasado a 3D tal cual, de atrás no servía (el bloque del alza de la AK tapaba la
  vista y el guion era una placa maciza). Las armas de fuego tienen muesca y poste (o la mira telescópica) y la bala sale
  por la línea de mira: medido con la AK, a 50 m pasó de 0 de 5 a 5 de 5 en el papel.
- **La bomba** (Mossberg 500, SPAS-12, Remington 870; pedido de Enzo: «que siempre funcione, más fácil y no tan
  extraño»): con la mano izquierda en el guardamanos (se agarra desde 20 cm), alcanza con llevarla 6 cm atrás (la bomba
  dibujada corre 8 o 9): pasando el 60 % expulsa, y de vuelta, pasando la mitad, se cierra sola del todo y queda lista
  para tirar; soltarla a medio camino también la cierra. Antes cargaba al volver al 15 % pero sólo tiraba bajo el 5 %
  (quedaba cargada y no tiraba), quedaba trabada si se la soltaba a medias, y si la mano se corría hacia adelante
  mientras apuntaba había que tirarla otro tanto más para atrás: ahora lo que la mano se pasa de un tope no cuenta.
- **Todas las miras del juego andan** (pedido de Leandro: «que todas las armas con mira telescópica o no telescópica
  funcionen, así es más fácil apuntar»):
  - **Telescópicas** (Remington 700, Dragunov 4×, Barrett 10×, Mosin 3,5×): como la de la Remington, la lente del ocular
    muestra lo que ve una cámara angosta desde el objetivo, con la retícula. En las de la pared, `miraDe` buscaba sola
    la pieza larga y fina de arriba y agarraba otra cosa (en la Dragunov el tubo de gases, en la Mosin el cañón, en la
    Barrett una pieza del frente) y ponía una lente de 1,2 cm adentro de ella; ahora cada una dice dónde va su tubo
    (`TELESCOPICAS` en `vr/armas-todas.js`) y las piezas de la mira se tornean.
  - **De punto rojo** (Kriss Vector, P90, Saiga-12, Milkor MGL y bazuca M9; `vr/miras3d.js`): como la tecla D del 2D,
    marcan al zombie vivo más cercano al alcance del arma, la retícula de Enzo (el anillo rojo, las cuatro marcas y el
    punto) se cierra sobre su pecho y el tiro va derecho a él y no falla: los perdigones de la Saiga no se abren y la
    granada del MGL y el cohete de la bazuca lo siguen. En el 2D el personaje se da vuelta solo; acá apunta la mano,
    así que se elige entre los que están a menos de 25° de donde apunta el arma, y el que estaba marcado sigue si el
    nuevo no está al menos 1 m más cerca. Siempre prendida (con el visor no hay D). La mira, que era un bloque macizo,
    ahora es hueca, y en su vidrio está la misma retícula «en el infinito», como en una de verdad: se ve sobre la línea
    de la mira aunque el ojo no esté centrado (mientras hay un zombie marcado, el vidrio no la repite). Sin visor, con
    el clic derecho el ojo va a 13 cm de la ventana. A los blancos del entrenamiento no los marca (en el 2D tampoco).
- **Las dos manos se ven como manos** (`vr/mano3d.js`), no como los controles: las del sobreviviente del juego
  (`js/skins.js`), con guante arena, palma y yemas de cuero, el abrojo de la muñeca, las almohadillas de los nudillos y la
  manga oliva de la chaqueta (la boca de la manga, oscura). Se arma como los zombies (`vr/forma3d.js`: primitivas unidas en
  una superficie, 31 000 triángulos, 105 ms en la computadora) con 16 huesos: la palma, tres falanges por dedo y el
  pulgar; la derecha es el espejo de la izquierda (la malla se arma una sola vez). Vacía, cada una va en el «grip» de
  WebXR girada 45° (en el Touch el mango cruza la palma en diagonal y el antebrazo va hacia atrás por el rayo): pulgar
  arriba, dorso afuera. El agarre cierra medio, anular y meñique alrededor del mango (3,4 cm, que no se ve); el gatillo,
  el índice (con sólo rozarlo, se acerca); el pulgar baja cuando toca la palanca, los botones o el apoyo. Lo que sostiene
  la izquierda (cargador, cartucho, guardamanos, cerrojo) cierra la mano entera. El reloj de la vida o los puntos va
  sobre la manga izquierda, del lado del pulgar, inclinado hacia los ojos. El color base va a la mitad (lineal): el
  galpón está tan iluminado desde arriba que, con el color del 2D tal cual, el guante se veía crema.
- **La mano derecha agarra el arma**: va con el arma (sube con el retroceso y la sigue cuando la izquierda apunta desde
  el guardamanos). Con una hoja, un mango, la Égida o la granada, el puño cerrado a lo largo del mango. Con un arma de
  fuego, la empuñadura de la VR se eligió para el control y no para una mano (en la Remington 700, el M79 y la Mossberg
  el puño quedaba debajo de la culata), así que la primera vez que toma cada arma la mano busca dónde agarrarla: se
  corre hasta 5 cm y se inclina (la muñeca, de 50° hacia adelante a 20° hacia atrás) para que el meñique, el anular y el
  medio queden alrededor del mango, centrados (el dibujo 2D del arma visto de costado, `grabarArma`), y la yema del
  índice —el 65 % de la última falange, como en el 2D— en el disparador (`DEDO_GATILLO` de `js/armas-modelos-3.js`), con
  la curvatura del índice y cuánto se separa del medio. Primero de a 1 cm y 10°, después fino; tarda de 2 a 24 ms y queda
  guardado. En las 36 armas de fuego la yema queda a 0,1–0,5 cm del disparador (la Mossberg a 1,0 y el láser a 1,3); las
  de culata recta (Remington, Mossberg, M79, Winchester, Garand, Mosin, Remington 870, recortada) se inclinan de 30° a
  45°. Apretar el gatillo del control dobla el índice un poco más.
- **Mano izquierda**: agarre en el guardamanos sostiene con las dos manos (la recta entre las manos manda; en pistolas,
  minigun y RPG solo afirma); en la corredera, la manija o el cerrojo los lleva atrás; lejos del arma saca munición
  nueva (cargador, cartucho, bala, granada de 40 mm, cohete, caja, cilindro o celda), que entra al acercarla a su lugar.
- **Los zombies** (`vr/zombie3d.js`; los tipos en `vr/zombie-tipos.js`, los animales en `vr/animales3d.js`): los 20
  humanos del juego, con los colores del 2D (`js/zombie.js`, `js/bastion-v2-horda.js`) y lo que hace cada uno, y los 4
  animales de Último bastión. Vida 15 y paso de 0,55 m/s para el común; el resto, multiplicado:

| Grupo | Tipo | Cómo se ve | Qué hace |
|---|---|---|---|
| Comunes | Caminante, Camisa roja, Enfermero, Policía, Corredor | Camisa escocesa abierta (azul o roja); ambo celeste con barbijo; uniforme con gorra, placa y cinturón; musculosa con dorsal y una sola zapatilla | Caminan y rodean la mesa. El policía aguanta ×1,6; el corredor corre a 2,4 m/s |
| Último bastión | Gordo | Camisa amarilla abierta sobre la panza, papada | Vida ×3,2; va derecho, trepa la mesa y tira las armas; muerde ×1,5 |
| | Acorazado | Casco antidisturbios, hombreras y escudo con ventana y «POLICÍA» | Blindaje 2; el escudo para las balas chicas, el rifle lo atraviesa |
| | Soldado zombie | Casco, portaplacas y portacargadores | Blindaje 1, vida ×1,5 |
| | Gritón | Buzo violeta con capucha y megáfono | Se planta a gritar cada 5 s: los que están a 10 m se apuran ×1,3 durante 6 s |
| | Hinchado | Sin camisa, hinchado, con pústulas que laten | Estalla al tocarte o al morir (2,6 m, 45 de daño), también a los zombies |
| | Dinamitero | Casco de obra, chaleco naranja y la dinamita en la espalda con la mecha prendida | Corre a la mesa (2,5 m/s) y la vuela: las armas salen volando. A balazos cae sin estallar; con fuego o explosión, estalla |
| | Tóxico | Traje amarillo roto, sangre verde y baba | Al morir deja gas (2,2 m, 5 s) |
| | Topo | Casco de minero y overol | Avanza bajo tierra (no se le puede tirar) y sale a 1 m detrás del jugador |
| | Lanzador | Brazos enormes, vincha y short rojo | Agarra al de al lado y lo arroja (cae con 30 % menos de vida); si no tiene, tira cascotes (15) |
| | Escupidor | Piel amarilla y el buche hinchado | Se planta a 9 m y escupe ácido en arco: golpe y charco |
| | Rabioso | Remera blanca, pelo largo, el más flaco | Corre a 4,5 m/s en zigzag, en manada de 4, y esquiva el 60 % de los tiros pesados |
| Animales | Jauría, Toro, Cuervos, Buitre | Perros flacos con sarna y ojos amarillos; toro negro con cuernos y argolla; aves con las costillas al aire | 5 perros que saltan la mesa y no cruzan el fuego; el toro escarba, embiste (40, aturde 2 s) y queda quieto; 6 cuervos que rodean la cabeza y picotean; el buitre baja, te levanta y te suelta en medio de la horda |
| Jefes | El Coloso, El Escudo, La Cisterna, La Sirena | Casi el doble de alto | Coloso (vida ×22): trepa la mesa y tira fardos (25). Escudo (×22): pavés con ventana enrejada y franjas de obra, cubre a los que trae detrás (cuatro en Ataque zombie, tres en Libre) y las balas chicas le hacen 1. Cisterna (×18): estalla a 6 m (90). Sirena (×18): mientras vive, todos se apuran ×1,33 |

  Cómo están hechos: el cuerpo es una sola superficie de primitivas anatómicas unidas con mínimo suave (`vr/forma3d.js`,
  el mismo núcleo que usan los animales), pasada a malla con surface nets (cada triángulo se orienta por el lado de
  adentro de su arista); manos con dedos y uñas; la ropa son capas a 1 y 1,6 cm del cuerpo recortadas por prenda (la
  camisa abierta se abre más cuanto más panza); piel sobre 19 huesos. Cinco cuerpos con su esqueleto: normal, gordo
  (panza y papada), fuerte (brazos ×1,75), coloso (brazos ×2, piernas ×1,6, abdominales) e hinchado (pústulas). El
  material (`vr/piel3d.js`) hace en el sombreador lo que en los juegos sale de texturas pintadas, pegado al cuerpo en
  reposo y proyectado en los tres ejes: poros, venas moradas, manchas, mugre hacia los pies, brillo húmedo en la sangre
  y la boca, relieve y la luz que atraviesa la piel en los bordes; en la tela, el tejido y el revés más oscuro. Heridas
  como las de Left 4 Dead 2 (Valve, GDC 2010): hasta dos por zombie, un elipsoide que recorta piel y ropa con borde
  desparejo, sangre alrededor y la carne adentro. Los escudos llevan una textura dibujada como en el 2D (ventana,
  «POLICÍA» o franjas de obra, remaches, grieta, sangre y barro) y otra de rugosidad (el vidrio brilla, el barro no).

  Costo: cada cuerpo se arma la primera vez que hace falta, mientras el menú dice «Preparando…» (0,6–1 s cada uno en la
  computadora; los 20 tipos y los animales, 4,4–4,9 s). De cerca (los 4 más cercanos a menos de 7 m; los jefes, desde
  más lejos) va el cuerpo fino con la ropa en capas: 39 500 triángulos el normal, 46 600 el gordo, 50 500 el fuerte,
  51 000 el hinchado y 55 600 el coloso; de lejos, una malla gruesa con la ropa pintada (11 500 a 15 600). El perro tiene
  18 200 y el toro 42 300, sin niveles de detalle. Peor caso medido: 18 enemigos a la vista (el máximo de la horda:
  jauría, los cuatro jefes, el toro, cuervos y comunes), con las armas y el galpón, 287 llamadas y 296 000 triángulos.

  Caminan hacia el jugador por el camino más corto alrededor de la mesa (sus esquinas), no se enciman, reaccionan a
  cada impacto, la cabeza los mata; muerden a menos de 0,78 m (vibran los mandos y se ve rojo). Daño de `ARMAS`, ×4 en la
  cabeza y ×0,6 en brazos y piernas; las balas chicas (pistola, metralleta, escopeta, minigun) hacen 1/(1 + blindaje) y
  el rifle no; a los jefes la cabeza les hace ×2 y no los mata de un tiro. Aturdido o en las garras del buitre no se
  puede tirar ni caminar y la vista se pone gris. Las granadas, cohetes y el martillo chocan con el cuerpo entero (un
  cilindro de 20 cm), no sólo con las zonas de las balas.
- **Sin visor**: mouse apunta, clic dispara (o golpea, o saca la anilla y al soltar tira la granada), clic derecho apunta
  con las miras (con Mjölnir: lo tira y lo llama), E toma el arma que mira la cruz, números la toman directo, Q la deja,
  R recarga entera, B monta, WASD camina, M el menú (con el mouse suelto se aprieta como cualquier botón).
- **Probar los controles del visor en la computadora**: la extensión Immersive Web Emulator 2.0 de Meta para Chrome
  simula un Quest 3 con sus mandos; en el modo juego del panel el mouse mira, clic izquierdo es el gatillo, `W A S D` la
  palanca izquierda, las flechas la derecha, `E` el agarre izquierdo, `Enter` A, `Shift` derecho B y `Z` el botón Y (el
  menú).
- **Publicar**: `herramientas/armar-web.py` copia `vr/` y le pone huellas `?v=` a los `js/` del juego que usa, a
  `campo.js` y, con el mapa de importación, a los módulos, así el visor no mezcla versiones después de publicar.
- **Pruebas automáticas**: `window.__campo` (tomar, apretar, apuntar, recargar, montar, golpe, tirar, llamar, avanzar el
  juego, el menú: `pagina()` y `clic(texto)`, mandos simulados con `visorFalso`, horda, blancos, modos, contadores de
  dibujo y `molde`).

### App para el Meta Quest 3S (`quest/`)

La misma VR, también como app instalable del Quest: las dos versiones conviven. La web sigue en `…/zona-muerta/vr/` para
el navegador; la app es esa página empaquetada con **Bubblewrap de Meta** (`@meta-quest/bubblewrap-core` 1.24.1) como
*Trusted Web Activity* en **modo inmersivo**: se instala como APK, tiene su ícono en la biblioteca y corre con el motor
del navegador del Quest (el mismo WebXR, el mismo rendimiento). No es un port a Unity o Godot: todo el trabajo de la web
(armas, zombies, modos, sonidos) va tal cual, y cada publicación de la web actualiza la app sin reinstalarla.

- **La parte web** (`vr/`): `manifest.webmanifest` (nombre, íconos, `start_url` con `?pwa=1`, `ovr_package_name`), los
  íconos (`icono-192.png`, `icono-512.png`, `icono-512-enmascarable.png`: un caminante del juego dibujado con el código
  2D, el título y la placa VR) y `sw.js`, que guarda cada archivo que se baja (también three.js y los modelos de los
  mandos de jsDelivr): primero va a la red, sin conexión sirve lo guardado (en el Chrome de pruebas, sin red, carga en
  3,4 s con las 48 armas; en el visor no está probado). Con `?pwa=1`, `vr/campo.js` pide la sesión inmersiva apenas carga, como pide Meta (tocar el ícono vale como el
  gesto), y la conecta cuando está todo armado; si no se puede, queda la portada con «Entrar». Sin `?pwa=1` no cambia
  nada.
- **Armar el APK**: `cd quest && npm install && node armar.mjs` (con `--base=http://127.0.0.1:8794/` usa los íconos y el
  manifiesto del árbol de trabajo, antes de publicar). Genera el proyecto de Android con la plantilla de Meta (API 32,
  minSdk 23; `jcenter` cambiado por `mavenCentral`, como indica Meta), compila con Gradle, alinea, firma y deja
  `quest/ZonaMuertaVR.apk` y `quest/assetlinks.json` (el APK y el proyecto no van al repositorio). Necesita JDK 17 y el SDK
  de Android (por defecto, los de Homebrew). Para una versión nueva del APK (sólo hace falta si cambia el nombre, el
  ícono o la configuración: la web se actualiza sola), subir `appVersionCode` en `twa-manifest.json`.
- **La firma** vive fuera del repositorio, en `~/.zona-muerta-quest/` (`zona-muerta.keystore` y `firma.json` con la
  clave): toda versión nueva tiene que salir firmada con la misma. Guardar una copia.
- **Digital Asset Links**: el Quest abre una app inmersiva sólo si el sitio declara que ese paquete con esa firma es
  suyo, en `https://zenebord.github.io/.well-known/assetlinks.json` (la raíz del dominio, no la del proyecto): eso es el
  repositorio de usuario `zenebord/zenebord.github.io` con `quest/assetlinks.json` en `.well-known/` y un `.nojekyll`.
  Sin ese archivo la app no arranca (en el registro del visor: «TWA verification was unsuccessful!»).
- **Instalar** (con el visor en modo desarrollador y conectado por USB): `adb install -r quest/ZonaMuertaVR.apk`; aparece
  en la biblioteca, en «Orígenes desconocidos». Para la tienda de Meta hace falta crear la app en el panel de
  desarrolladores y subir el APK con `ovr-platform-util`.
- **Lo que hace Meta con el modo inmersivo**: la página debe entrar al visor apenas se abre, sin pantalla previa; lo
  que esté fuera de `vr/` se abre en el navegador común.

## Último bastión (defensa con estrategia)

**Lo que se juega hoy es el rediseño por bandos**, que se describe más abajo, en «El juego: dos bandos con
contrapesos» (13 unidades contra 16 tipos de zombie, cuatro niveles con terreno propio). El modo anterior, de cinco
unidades, oleadas sorteadas y cinco niveles de 10 oleadas, ya no está en el menú; su motor (`js/estrategia.js`) es la
base sobre la que corre el rediseño, así que lo que sigue hasta «Arte» vale como descripción de esa base (grilla,
caminos, cuartel y taller, velocidades, cámara, dibujo) y como historia de lo que había.

Modo aparte de las defensas (`js/estrategia.js`): no se dispara, se manda. Vista de estratega sobre un campo con
grilla; a la izquierda el campamento (cuartel, taller, empalizada), y los zombies llegan por la derecha buscando el
camino más corto (un mapa de distancias por celda que se rehace cada vez que algo se construye o se rompe).

| Qué | Cuesta | Tarda | Dónde se hace | Qué hace |
|---|---|---|---|---|
| Soldado | $50 | 4 s | Cuartel, de a uno | Camina a su lugar y dispara (alcance medio). Si su lugar es un búnker, entra (hasta 4) |
| Torreta | $150 | 8 s | En el lugar, con andamio | Ametralladora con su tirador detrás de bolsas de arena: mucho fuego, poco daño |
| Búnker | $150 | 12 s | En el lugar | Mucha vida; disparan los soldados que tenga adentro, con más alcance. Si cae, salen |
| Tanque | $375 | 15 s | Taller, de a uno | Maneja hasta su lugar; dispara muy lejos con daño en área (radio 32), pero no a los que tiene pegados |
| Muro | $35 | 2 s | En el lugar | Obliga a rodear: en los huecos angostos los zombies se amontonan y van más lento. No se puede cerrar el paso del todo |

Torretas, búnkeres, tanques y muros ocupan su celda; los soldados no. Los zombies muerden lo que tienen adelante y,
si se trancan, rompen lo que los traba. La economía está ajustada para que haya que administrar: se empieza con
$150 y un ejército mínimo (3 soldados y 4 muros que dejan un pasillo), que solo no aguanta más de 4 oleadas. Cada
muerto paga poco (caminante $6, corredor $7, gordo $15, el coloso de cada 5 oleadas $90), cada oleada superada da
$30 + $5 por oleada, la vida de los zombies crece 21 % por oleada y la cantidad es 8 + 4·(n−1) + n^1,4. Entre
oleadas hay 25 s para construir (la primera, 40); se puede adelantar con Espacio o el botón, y cobra $1 por segundo
ahorrado. El que llega al campamento le saca vida (1, 3 el gordo, 8 el coloso); con 15 entradas se pierde.
Velocidad 1×, 2×, 5× o 10× con los botones de arriba a la derecha o `V` (el bucle da varios pasos normales por
cuadro, no uno grande). Teclas: `1` a `5` eligen, `6` vende, clic derecho vende a mitad de precio (o cancela entero
lo que no estaba listo), `7` (o REPARAR) arregla lo dañado pagando ¾ de lo roto, `Esc` suelta lo elegido.

Laberintos: los muros obligan a dar vueltas, pero el 60 % de los zombies comunes (y todos los gordos y el coloso)
son impacientes: si el camino es más de 4 celdas más largo que ir derecho y tienen una construcción justo del lado
del campamento, la muerden para abrirse paso. Mantener un laberinto cuesta reparaciones.

Balance medido con bots que juegan solos con el código real en Node (4 corridas por caso, oleada en la que
pierden; dificultad media): no construir nada 4–5; solo torretas con muros 4–5; solo soldados 7–8; solo tanques
6–9; mezcla sin laberinto 6–10; laberinto en serpentina con torretas, tanques atrás y reparaciones 10–16.
Antes de este ajuste el laberinto llegaba a la 20 sin recibir un golpe.

### Niveles

Cada nivel son 10 oleadas fijas (`OLAS_POR_NIVEL`, `js/bastion-niveles.js`): se gana llegando al final con el
campamento en pie, y ganar abre el siguiente. Cada escenario tiene su fondo, su suelo, obstáculos que bloquean (no se
construye encima y los zombies los rodean; no se rompen) y terreno que no bloquea pero cambia el paso: el agua frena a
la mitad y ahí no se construye, el barro frena un cuarto y el hielo acelera 35 %.

| Nivel | Escenario | Obstáculos | Terreno | Dinero | Vida |
|---|---|---|---|---|---|
| 1 | La granja, de día (molino y granero) | 4 árboles, 2 fardos, tractor | camino de tierra, tierra arada (barro), estanque | $200 | ×0,75 |
| 2 | La autopista, al atardecer | 6 autos, 2 contenedores | asfalto, charcos, barro en la banquina | $175 | ×0,9 |
| 3 | El bosque, de noche | 7 pinos, 2 rocas | río de punta a punta con un puente, barro | $175 | ×1 |
| 4 | El desierto, al mediodía (mesetas) | 5 cactus, 3 rocas | oasis | $160 | ×0,9 |
| 5 | La montaña, nevando | 5 pinos nevados, 2 rocas, cabaña | lago congelado (hielo) | $160 | ×1,05 |

La partida se guarda sola al terminar cada oleada (`zonaMuerta.bastion.partida`: nivel, dificultad, oleada, dinero,
campamento y cada construcción con su vida; lo que estaba en cola se devuelve en dinero) y se sigue desde la pantalla
de niveles con CONTINUAR. Al ganar o perder se borra. Los niveles ganados quedan en `zonaMuerta.bastion.progreso`.

Con bots en Node (3 partidas por caso, dificultad media): sin construir no se gana ninguno; solo tanques gana la granja
siempre y la autopista 2 de 3; un laberinto armado para cada escenario gana los cinco (el desierto, 2 de 3). En difícil
la montaña no la gana ningún bot.

### Arte

Vista como en StarCraft 2: la cámara mira al norte desde arriba y de costado, con perspectiva suave
(`js/bastion-camara.js`). La fila de adelante queda del tamaño de siempre y la de atrás al 80 % (`CAMARA_BASTION`); los
costados del campo se cierran hacia el fondo y las filas se achican, como un tablero visto desde una punta. La
perspectiva es sólo la cámara: el juego sigue pasando en el plano (la grilla, las distancias, los alcances, el
movimiento y el guardado no cambiaron) y el toque se lleva de vuelta al plano (`desproyectar`), así que construir,
vender y reparar funcionan igual.

- **El piso** (pasto, terreno, campos, calles, el patio del campamento) se pinta plano en un lienzo aparte y se lleva a
  la pantalla en trapecio, fila por fila, cada una a su escala (`capaQuietaBastion`, una vez por nivel).
- **Lo que está parado** (unidades, zombies, obstáculos, edificios, árboles, el campamento) va en su punto proyectado,
  escalado alrededor de los pies (`enCamara`), de atrás hacia adelante. Las barras de vida y los carteles no se achican.
- **Lo que vuela** (trazadoras, proyectiles del tanque, gotas de sangre, humo) lleva su altura sobre el piso, que también
  se achica con la distancia; las gotas caen a la fila de quien sangra.

De cada cosa se ve el techo y el frente (`caja34`). La luz viene del noroeste: los techos con luz, los frentes que miran
al sur en sombra (los muros de cestones tienen el techo de arena claro y la malla del frente más oscura), y las sombras
caen abajo a la derecha (`sombraCaja`). No hay cielo.

- **Borde del mapa** (`PaisajeBastion.borde`): una meseta más alta que el campo, separada por un escalón del que se ve el
  frente (`escalon34`). El escalón va en tramos diagonales, como las barrancas de StarCraft: los que miran al suroeste,
  más claros; los que miran al sureste, más oscuros. Cada escenario tiene el suyo: barranca de tierra con piedras, raíces
  y alambrado en la granja (con una rampa por donde baja el camino); muro de contención de paneles con baranda en la
  autopista; barranca con raíces en el bosque; paredón de estratos con el cañón como rampa en el desierto; paredón de roca
  con vetas de nieve en la montaña. Arriba, con la misma cámara y hasta el borde de la pantalla: casas y granero con el
  techo a dos aguas a la vista, silo, molino, fardos y campos sembrados con la altura de las plantas (`parcela34`), entre
  caminos con cortinas de árboles; manzanas de edificios entre calles y avenidas, con las azoteas a la vista (pretil,
  máquinas, tanques de agua, agujeros quemados e incendios con humo), autos y faroles; el bosque cerrado de pinos, con la
  niebla de la noche; piedras, cactus y el cañón; peñascos y pinos nevados.
- **Terreno hundido** (`pozo34`): del agua, el barro, el hielo y la ruta entre los cordones se ve la pared de enfrente
  (la del norte) y el fondo corrido hacia abajo; contra la orilla oeste, la sombra. El agua refleja la barranca y tiene
  la línea del agua; la tierra arada, surcos con el lomo con luz; el puente de tablones queda levantado sobre el agua, con
  su canto, pilotes y barandas.
- **Muro del campamento**: como está sobre el borde izquierdo de la pantalla, la cámara lo ve un poco de costado
  (`prisma34`): además del techo de arena se ve la cara que mira al campo, con la malla y los parantes.

Todo lo del modo se dibuja en `js/bastion-dibujo.js` (la cámara, en `js/bastion-camara.js`), con el mismo estilo de
ilustración que el jugador (`pintura`:
dos tonos, brillo de borde y contorno del color de cada pieza). Soldado con casco con funda, chaleco, mochila y fusil
con mira; nido de ametralladora pesada en trípode con el tirador agachado tras bolsas de arena; búnker de hormigón con
red de camuflaje, tronera con los cascos de los de adentro y antena; tanque con orugas, ruedas, faldones, torre con
escotilla, ametralladora, lanzahumos y cañón con evacuador y freno de boca; muro de cestones de malla con concertina
(se abolla y pierde arena con el daño); obra con andamio y tablón de seguridad. El campamento es una base de avanzada:
muro de cestones con portón y barrera, torre de guardia con reflector que barre el campo, bandera, carpas, cuartel
prefabricado y taller de chapa en arco. Cada escenario tiene su paisaje alrededor del campo (granja con granero, silo
y molino; ciudad con incendios; bosque de noche con luciérnagas; desierto con cañón y buitres; montaña nevando) y
terreno con bordes redondeados, orillas, juncos, carriles y surcos.

Rendimiento: cada pose de cada unidad y cada obstáculo se dibuja una sola vez y queda en una caché de imágenes
(`conSprite`, a la resolución en que se ve, que con la cámara depende de la fila); el piso en trapecio, el borde del
mapa, el campamento y la niebla de la derecha van en una capa por nivel (`capaQuietaBastion`: de 25 a 78 ms al entrar,
en Chrome sin GPU); por cuadro solo se pintan fogonazos, humo, bandera, reflector, nubes, nieve y brillos del agua. Con
43 unidades en pantalla el dibujo pasó de 26 ms a 3,4 ms por cuadro (sin la caché, el arte nuevo era inviable). La
cámara le suma algo al cuadro: en una batalla chica (6 unidades, 4 o 5 zombies), de 5,2–6,0 ms a 6,4–7,9 ms (Chrome sin
GPU), por las unidades y los zombies escalados.

### El juego: dos bandos con contrapesos (archivos `bastion-v2*`)

El botón «ÚLTIMO BASTIÓN» del menú abre la lista de niveles (cuatro, de 12 oleadas, todos abiertos) y la partida
guardada, si hay. Es el rediseño por bandos, que en el código sigue llamándose «v2»: el plantel completo, 13 unidades
contra 16 tipos de zombie y un jefe por nivel, donde ninguna unidad sirve contra todo, no todos los zombies vienen de
frente y cada escenario limita a su manera dónde entra cada cosa. La guía de los dos bandos (qué hace cada uno, fuerte,
débil, cómo usarlo) no es una pantalla previa: es una capa que se abre desde la lista de niveles o desde adentro de la
partida, con el botón **GUÍA** o la tecla `H`, y deja el juego en pausa mientras se lee; en partida, los tipos que no
vienen en ese nivel quedan apagados. Los archivos `js/bastion-v2*.js` envuelven los métodos de `js/estrategia.js`; lo
nuevo corre si `juego.v2`, que hoy es siempre (la interfaz no inicia el modo anterior).

| Archivo | Qué tiene |
|---|---|
| `js/bastion-v2.js` | Los números de los dos bandos (`BASTION2`), las oleadas, colocar, vender, mover y guardar |
| `js/bastion-v2-horda.js` | Cómo se crea y cómo se porta cada tipo de zombie |
| `js/bastion-v2-tropa.js` | Armas y oficios de cada unidad, explosiones, gas y granadas |
| `js/bastion-v2-dibujo.js` | El dibujo de lo nuevo: unidades, zombies, aves y efectos |
| `js/bastion-v2-ui.js` | Lista de niveles, panel, parte de la oleada, marcas de contrapeso, guía y textos |

Los contrapesos salen de seis reglas que valen para todos, no de una tabla de multiplicadores:

- **Blindaje**: le resta puntos a cada bala, con un mínimo de 1 (al acorazado, 2: la torreta le hace la mitad y el fusil,
  un tercio). No frena al francotirador, al cañón, al fuego ni a las explosiones.
- **Área**: el fuego y las explosiones pegan a todos los que están juntos; la granada del mortero tarda 1,5 s en caer
  donde estaba el blanco, así que falla contra lo rápido.
- **Aire**: lo que vuela pasa sobre todo. Sólo le tiran los fusiles (soldado, francotirador, también desde un búnker)
  y la antiaérea, que no puede tirarle a nada más.
- **Velocidad**: cuanto más rápido el zombie, menos tiempo pasa bajo fuego: cadencia alta y alambrado.
- **Vista**: cada zombie va por el primer humano que ve. El que tira desde más lejos que esa vista, tira escondido.
- **Altura**: arriba de un obstáculo con techo (`BASTION2.techos`: el contenedor) o de una cornisa de la montaña sólo
  sube la infantería, de a uno. Desde ahí tira 25 % más lejos y los que caminan no la alcanzan ni la toman de presa; sí
  la alcanzan lo que vuela (bandada, buitre), el escupidor, lo que arrojan el lanzador y el Coloso, el gas y las
  explosiones.

**Suelos** (`BASTION2.suelos`, `BastionV2.noAguanta`): cada terreno aguanta lo suyo, y eso es lo que hace distinto a
cada nivel. Al elegir qué poner, el campo marca dónde entra: si casi ningún suelo lo aguanta se pintan en verde las
celdas donde sí; si no, se tachan las que no.

| Suelo | Dónde | Qué se puede parar | La horda |
|---|---|---|---|
| Firme | Pasto, asfalto, banquina, nieve, losa de piedra | Todo | Pasa |
| Blando | Barro, tierra arada | Gente a pie, alambrado y señuelo | Pasa al 75 % |
| Suelto | Arena | Gente a pie, alambrado, señuelo y el tanque | Pasa |
| Liso | Hielo | Sólo gente a pie | Resbala: va 35 % más rápido |
| Pared | Risco | Nada | No lo pisa (lo que vuela, sí) |
| Alto | Cornisa | Sólo gente a pie, de a uno (regla de altura) | No la pisa |
| Agua | Estanque, oasis, charco | Nada | No pasa a pie |

La bala que no pasa el blindaje (la torreta contra el acorazado, casi todo contra El Escudo) rebota: saca 1 punto, sin
destello ni empujón.

**El Bastión** (alcances en celdas de 44 px):

| Clase | Unidad | $ | Vida | Qué hace |
|---|---|---|---|---|
| Infantería | Soldado raso | 50 | 30 | Fusil: 3 por bala cada 0,65 s a 4 celdas. Le tira también a lo que vuela |
| | Francotirador | 120 | 20 | 45 cada 3 s a 7,7 celdas, al más peligroso. Ignora el blindaje |
| | Lanzallamas | 110 | 45 | 14 por segundo a todos los del cono, a 2 celdas, y los deja prendidos. Perros y toro no cruzan el fuego |
| | Médico | 90 | 25 | Cura 4 por segundo a la infantería a 2 celdas. Quien cae a su lado no se contagia; con él cerca el gas no vacía los búnkeres |
| Mecanizados | Torreta | 150 | 90 | 2 por bala cada 0,13 s a 4,4 celdas. No apunta al aire |
| | Tanque | 375 | 400 | Cañón de 70 cada 1,8 s a 5 celdas, al que más vida tiene. Las mordidas le hacen un tercio. Se mueve. Ningún topo pasa por debajo a 2 celdas |
| | Mortero | 130 | 60 | 14 en un radio de 40 px cada 5 s, de 4 a 6,5 celdas, adonde hay más juntos (el 2026-11-15 pasó de 9 celdas y 3,5 s a esto: el alcance a mitad de camino entre el mínimo y el de antes, y 5 s entre tiros) |
| | Antiaérea | 140 | 80 | 6 en un radio de 34 px cada 0,4 s a 6 celdas, sólo a lo que vuela |
| Estructuras | Muro | 35 | 150 | Bloquea el paso (nunca del todo) y es el escudo de quien está detrás |
| | Alambrado | 15 | 40 | No bloquea: frena al 45 % y saca 20 % de la vida. Aguanta 20 pisadas |
| | Búnker | 120 | 280 | Refugio para 4 de infantería de cualquier oficio, que tiran desde adentro con 20 % más de alcance |
| | Señuelo | 50 | 100 | Llama a los caminantes a 5 celdas, que lo golpean 5 s. Una vez por zombie. El topo sale junto a él |
| | Torre de vigía | 60 | 80 | No dispara: descubre a los topos enterrados a 4 celdas y los obliga a salir, encandilados 2,5 s |

La infantería se forma en el cuartel de a uno y camina a su puesto (uno por celda); en el barro sólo van la infantería,
el alambrado y el señuelo. Al romperse una máquina queda un soldado a pie, herido. **Mover** (tecla `C`) cambia de lugar
a la infantería, al tanque o al último que entró a un búnker, también en plena oleada.

**La Horda** (vida: veces la de un común de esa oleada, que crece 17 % por oleada):

| Clase | Zombie | Vida | px/s | Qué hace |
|---|---|---|---|---|
| Caminantes | Común | 1 | 24 | Ve a 3 celdas. Entra en hordas de 6. Rodea si el rodeo es corto; si no, rompe lo que tapa a su presa |
| | Corredor | 0,8 | 46 | Ve a 4. Rodea buscando el hueco y nunca rompe |
| | Gordo | 3,2 | 16 | Ve a 2. Nunca rodea: rompe toda construcción. Aplasta alambrado y señuelo |
| | Acorazado | 2 | 20 | Como el común, con casco y escudo: blindaje 2 |
| Especiales | Gritón | 0,8 | 26 | Ve a 6 y grita: los zombies a 5 celdas van por los humanos que él ve y se apuran 30 % |
| | Hinchado | 5 | 14 | Camina a lo construido más cercano (a 5 celdas) y estalla al tocarlo o al morir: radio 60 px, también mata zombies |
| | Dinamitero | 0,8 | 50 | Corre derecho al campamento y le saca 120 a la primera construcción que le corta el paso |
| | Tóxico | 3 | 18 | Caza donde hay más gente junta. Al morir deja 5 s de gas: daña a la infantería y vacía los búnkeres de a uno |
| Animales | Jauría | 0,5 | 62 | Cinco perros que huelen a la gente a pie a 6 celdas, rodean y saltan el alambrado, los fardos y el tractor |
| | Toro | 6 | 20 | Ve a 6. Avisa, embiste en línea recta (96 px/s) y aturde 2 s a quien atropella; después queda quieto 2 s |
| | Bandada | 0,4 | 55 | Seis cuervos que vuelan: picotean a la gente a pie o, si no hay, le sacan 1 cada uno al campamento |
| | Buitre | 2,5 | 40 | Vuela hasta alguien a pie (primero el francotirador), lo levanta y lo suelta junto al caminante más cercano |
| Acechadores | Topo | 1,6 | 36 | Se entierra al entrar y va por debajo de todo, sin que se le pueda tirar, hasta lo que hay más atrás (mortero, francotirador, médico, antiaérea); sale en 0,8 s y muerde ×1,5 |
| | Lanzador | 6 | 16 | Agarra al zombie que tiene al lado y lo arroja hasta 7 celdas, junto al humano que esté más atrás; sin zombies a mano, tira cascotes a lo construido |
| | Escupidor | 1,2 | 20 | Se planta a 5 celdas de la gente (más de lo que alcanzan el soldado y la torreta) y escupe ácido en arco: un charco de 3,5 s |
| | Rabioso | 0,7 | 120 | De a cuatro, en zigzag, directo al campamento sin detenerse. El francotirador y el cañón le erran 6 de cada 10 tiros |

Los acechadores son los que no vienen de frente: el topo pasa por debajo de la línea, el lanzador por arriba, el
escupidor tira desde más lejos y el rabioso corre más rápido que las armas lentas. El soldado que cae se levanta a los
3 s como soldado zombie (blindaje 1), salvo que lo haya matado una explosión o tenga un médico cerca.

Cada nivel tiene su jefe, en las oleadas 6 y 12, y cada uno cambia una regla mientras vive:

- **El Coloso** (La granja; vida ×22): rompe todo y arroja fardos a lo que tiene a 5 celdas.
- **El Escudo** (La autopista; ×22): un acorazado gigante (blindaje 4: las balas chicas le hacen 1) que sale adelante y
  **cubre** a los que marchan pegados detrás de él, a 2,2 celdas: a esos no les entra ninguna bala tirada desde el
  piso. Les llegan el fuego, las granadas y los tiros de quien está arriba de un contenedor; a él, el francotirador y
  el cañón.
- **La Cisterna** (El desierto; ×18): una hinchada gigante. Va a lo primero construido que ve y, donde cae, estalla a
  3 celdas (220 a lo construido, 60 a la gente). Si muere lejos, su estallido sólo mata zombies; un señuelo o un
  alambrado adelantado la aparta.
- **La Sirena** (La montaña; ×18): una gritona gigante. Ve a toda la gente del campo, esté donde esté, y su grito llega
  a todos los zombies: cada 6 s les muestra adónde ir y los apura un 35 %.

**Niveles** (`BASTION2.niveles`, en el orden de `BASTION2.ordenNiveles`). Cada nivel usa el escenario del modo de
siempre con ese nombre (`BastionV2.escenario`) y puede redefinir su mapa (`mapa`: terreno y obstáculos), con qué se
empieza (`inicio`) y el aviso inicial. Los tipos de zombie son siempre los mismos: cada nivel elige un grupo.

| Nivel | Terreno que manda | Horda | Jefe |
|---|---|---|---|
| 1. La granja | Campo abierto, sin embudo. Tierra arada (suelo blando: sólo infantería, alambrado y señuelo) y un estanque | Los 16 tipos, uno o dos nuevos por oleada | El Coloso |
| 2. La autopista | Dos líneas de autos chocados arman pasillos (en la de cerca, 4 pasos; en la de lejos, 2, y el del sur es barro: no se cierra con un muro). Cuatro contenedores con techo. Los perros saltan los autos | 11 tipos: común, corredor, acorazado, hinchado, dinamitero, jauría, bandada, buitre, escupidor, lanzador y rabioso (bajo el asfalto no hay topos) | El Escudo |
| 3. El desierto | Arena suelta: no se construye nada. Lo que pesa va en 12 celdas de losa de piedra, en seis afloramientos; sobre la arena sólo van la gente a pie, el tanque (se empieza con uno), el alambrado y el señuelo. Sin muros no hay embudo, y el oasis parte el frente en dos | 10 tipos: común, corredor, hinchado, dinamitero, toro, bandada, buitre, topo, escupidor y rabioso | La Cisterna |
| 4. La montaña | Un paso entre riscos: 84 de las 162 celdas son pared. El paso se angosta dos veces a tres filas, y esos cuellos son hielo (no se construye; la horda resbala). Se construye en la plaza del medio (20 celdas) y en la retaguardia (15), pegada al campamento. Cuatro cornisas | 12 tipos: común, corredor, gordo, acorazado, dinamitero, tóxico, toro, bandada, topo, lanzador, escupidor y rabioso | La Sirena |

En los niveles 3 y 4 la horda aguanta un 5 % más (`vida: 1.05`).

El progreso (`zonaMuerta.bastion2.progreso`) guarda qué niveles se ganaron; la partida guardada es una sola, la última,
y recuerda su nivel. Al ganar, la pantalla de fin ofrece el nivel siguiente.

**Información sin tapar el campo.** Cada oleada estrena un tipo y el parte de arriba dice qué viene, con el debutante
marcado. Al elegir una unidad, en el parte quedan en verde los zombies que frena y en rojo aquellos contra los que
rinde poco; al tocar un zombie del parte, en la barra quedan marcadas las unidades que lo frenan y las que no sirven
(`BASTION2.contra`). De texto hay un solo renglón arriba de la barra; la guía completa se abre aparte (botón GUÍA o
`H`). La partida se guarda al empezar cada oleada: al perder, la pantalla de fin dice quiénes entraron, con qué se los
frena, y ofrece repetir esa oleada con todo como estaba. Lo mismo se puede pedir en cualquier momento desde la pausa,
con **REINICIAR LA OLEADA n**: unidades, dinero y campamento vuelven a como estaban al empezar la última oleada que se
largó (`fotoInicioV2`; si todavía no empezó ninguna, el nivel arranca de cero). En el descanso que sigue a una oleada
ganada el botón sigue apuntando a esa oleada, así que sirve para rehacerla aunque se haya ganado mal.

**Elegir una unidad del campo.** Con la mano vacía, tocar una unidad la elige (`unidadBajoV2`, `elegirDelCampoV2`): en
el campo se ve hasta dónde llega desde donde está (el arma, el mínimo del mortero, la cura, el llamado del señuelo, lo
que descubre la vigía; para un búnker, el alcance de cada uno de los de adentro, que tiran 20 % más lejos), su botón
queda marcado en la barra y las tres herramientas pasan a actuar sobre ella: **Vender** dice lo que devuelve (`+$`),
**Reparar** lo que cuesta (`−$`) y **Mover** la levanta para tocar adónde va (ahí se ve el alcance que tendría y desde
dónde la verían). Las que no aplican quedan apagadas. El renglón de arriba de la barra dice su vida y su alcance.
Tocarla de nuevo, tocar el suelo, el botón derecho o `Esc` la sueltan. Sin unidad elegida, las herramientas funcionan
como antes (se elige la herramienta y después a quién).

Teclas: `1` a `4` la infantería, `Q W E R` los mecanizados, `A S D F G` las estructuras; `Z` vende (75 % en el descanso,
50 % en la oleada), `X` repara, `C` mueve (sobre la unidad elegida, si hay una); `H` abre la guía.

**Balance medido en La granja** con bots que juegan con el código real, en dificultad media. Cruce por cruce (una defensa de un solo
tipo y unos $300 contra una tanda de un solo tipo, en la oleada 6 los doce primeros y en la 8 los acechadores;
campamento que queda sobre 15 y parte de la defensa en pie). Todo lo de esta sección se midió con el mortero anterior
(9 celdas, un tiro cada 3,5 s); con el de ahora (6,5 celdas, cada 5 s) no se volvió a medir:

| Tanda | Lo que frena | Lo que no |
|---|---|---|
| 10 acorazados | 3 francotiradores 15 y 100 %; 3 lanzallamas 15 y 100 % | 2 torretas 1 y 0 %; 6 soldados 0 y 0 %; búnker con 4: 0 y 0 % |
| 20 corredores | 2 torretas con 3 alambrados 15 y 87 % (sin alambrado, 56 %) | 6 soldados 4 y 0 %, con 6 contagiados |
| 15 perros | 3 lanzallamas 15 y 100 %; 2 torretas 12 y 100 % | 6 soldados 4 y 0 %; 2 antiaéreas 0 (ni los miran) |
| 3 toros | 3 francotiradores 15 y 100 %; 3 lanzallamas 15 y 100 % | 6 soldados 0 y 0 % |
| 18 cuervos | 2 antiaéreas 15; búnker con 4 soldados 12 | 2 torretas 0; tanque 0; 2 morteros 0 |
| 4 topos | tanque 15 y 100 %; 3 lanzallamas 15 y 67 % | 3 francotiradores 11 y 0 %; 2 torretas 9 y 0 %; búnker con 4: 7 y 0 % |
| 5 escupidores | 3 francotiradores 15 y 100 %; tanque 15 y 100 % | 2 torretas 3 y 0 %; 6 soldados 0 y 0 %; búnker con 4: 1 y 0 % |
| 12 rabiosos | 3 lanzallamas 15 y 100 % | 3 francotiradores 7; 2 torretas 6; 2 morteros 3 |
| 3 lanzadores con 12 comunes | búnker con 4 francotiradores 15 y 100 %; tanque con 2 francotiradores 15 y 100 % | 4 francotiradores a pie 10 y 25 %; tanque solo 1 y 0 % |

El topo es el caso de detector: contra una retaguardia de dos francotiradores, mortero y antiaérea, 4 topos la dejan en
0 % con 4 contagiados; con una torre de vigía adelante y una torreta, o con un señuelo y una torreta, o con el tanque
adelante, la retaguardia queda entera y no entra ninguno.

La partida entera, con tres planes de distinta calidad:

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 2 o 3 |
| Sólo soldados | pierde en la 3 o 4 |
| Sólo torretas | pierde en la 4 o 5 |
| Respuesta a cada debut sin pensar en los acechadores | pierde 4 de 4, en la 10 u 11 |
| Embudo (columna 7 cerrada, lanzallamas en el hueco, francotiradores y mortero atrás) | pierde 6 de 6, en la 11 |
| El embudo adaptado: francotiradores dentro de un búnker, dos torres de vigía adelante, torretas atrás, dos antiaéreas | gana 6 de 8, con el campamento en 7 de 15 |

El plan adaptado sin francotiradores pierde en la oleada 4 (5 de 5); sin antiaéreas gana 1 de 5; sin torres de vigía o
sin mortero, 3 de 5. En fácil, el embudo y el adaptado ganan 3 de 3 sin perder campamento; en difícil el adaptado
pierde en la 10. El embudo ganaba 4 de 4 sin recibir un golpe antes de los acechadores.

La plata por zombie es la perilla de la dificultad: con las pagas de antes (un común, $3) ningún plan llegaba al final;
con las actuales (un común, $4, y un poco más por los demás) gana el que se adapta. El resultado es brusco, no gradual: en los planes que pierden, el campamento suele estar entero hasta la
oleada 8 o 9 y la defensa se derrumba en una sola oleada, porque cada baja se levanta en contra. No está medido con
jugadores.

**Balance medido en La autopista**, igual (dificultad media, partidas enteras):

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 2 |
| Sólo torretas | pierde 4 de 4, en la 5 |
| Embudo como en la granja, sin usar los techos (una línea de autos cerrada salvo un pasillo, lanzallamas en el hueco, francotiradores y mortero atrás, en el piso) | pierde 6 de 6, en la 10 u 11 |
| El plan adaptado con los mismos francotiradores en el piso en vez de en los techos | pierde 8 de 8, en la 6 o 7 |
| Adaptado al nivel: francotiradores arriba de los dos contenedores de cerca, los dos pasillos abiertos con lanzallamas detrás y alambrado delante, las banquinas cerradas, mortero, dos antiaéreas y tanque de ancla | gana 9 de 12 |

El plan adaptado sin francotiradores pierde 5 de 5 en la oleada 6 (no hay con qué frenar a El Escudo); sin antiaéreas,
5 de 5 en la 11 o 12 (la bandada); sin mortero gana 1 de 5; sin tanque, 4 de 5; sin lanzallamas, 5 de 5. En fácil el
adaptado y el embudo ganan 5 de 5 sin perder campamento; en difícil el adaptado gana 1 de 5. Contra El Escudo con 14
comunes detrás, en la oleada 6 y con unos $300: 3 francotiradores o un tanque lo frenan sin perder campamento; 3
lanzallamas matan a los que cubre pero caen (campamento 5); 2 torretas, 6 soldados, un búnker con 4 soldados, 2
morteros u 8 muros no lo paran (campamento 0 a 4). Cuatro soldados arriba de los contenedores matan a los 14 que cubre
sin recibir un golpe, pero el jefe entra igual. Como en La granja, el resultado es brusco: las partidas del plan
adaptado terminan con el campamento entero o se pierden de golpe en la oleada 12.

**Balance medido en El desierto** (dificultad media, partidas enteras):

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 3 |
| Sólo torretas, en todas las losas | pierde 4 de 4, en la 7 |
| Como en la granja pero sin muros: búnker y torretas en las losas, francotiradores a pie, mortero y antiaérea; sin sumar tanques, señuelos ni vigías | pierde 6 de 6, en la 8 |
| Adaptado: el tanque de ancla en la arena con alambrado delante, dos búnkeres con francotiradores en las losas, vigías en las losas del frente, señuelos adelantados, dos tanques más, antiaéreas y morteros atrás | gana 7 de 12, con el campamento en 6 de 15 |

El adaptado sin francotiradores pierde 5 de 5 en la oleada 10; sin antiaéreas gana 1 de 5; sin mortero o sin
lanzallamas, 3 de 5; sin sumar tanques o sin vigías, 4 de 5. En fácil gana 5 de 5 sin perder campamento, y el plan
«como en la granja» pierde 5 de 5 también en fácil (en la 11); en difícil el adaptado pierde 5 de 5 en la 12. Acá las
derrotas son por goteo y no de golpe: lo que entra son rabiosos, de a pocos por oleada.

**Balance medido en La montaña**:

| Plan | Resultado |
|---|---|
| No construir | pierde en la oleada 2 o 3 |
| Sólo torretas | pierde 4 de 4, en la 5 |
| Embudo en la plaza: dos muros en la boca del cuello de lejos, lanzallamas y búnker con médico detrás del hueco, francotiradores a pie, tanque, mortero en la retaguardia y dos antiaéreas | gana 7 de 12, con el campamento en 12 de 15 |
| El mismo embudo con los francotiradores arriba de las cornisas de atrás | gana 6 de 12, con el campamento en 8 de 15 |

Ese embudo sin francotiradores pierde 5 de 5 en la oleada 6 (La Sirena); sin lanzallamas, sin mortero, sin antiaéreas
o sin tanque, 5 de 5; sin médico gana 2 de 5. En fácil gana 4 de 5; en difícil pierde 5 de 5 en la 12. Dos cosas a
mirar jugando: con los bots, poner a los francotiradores en las cornisas no rinde más que dejarlos a pie detrás del
tapón (los pican los cuervos y caen contagiados), así que las cornisas todavía no son la ventaja que deberían; y el
nivel es muy sensible: con la horda al 104 % ese embudo ganó 9 de 12 y al 106 %, 6 de 12 (quedó en 105 %).

Rendimiento: con 87 zombies de todos los tipos y 26 unidades, 0,8 ms de lógica y 13,6 ms de dibujo por cuadro (Chrome
de escritorio, lienzo a escala 2). No está medido en un celular.

## Publicar

- **Código y web**: `herramientas/publicar-web.sh` sube el último commit a https://github.com/zenebord/zona-muerta
  (rama `main`) y arma la web con `herramientas/armar-web.py` en la rama `gh-pages`, que GitHub Pages sirve en
  https://zenebord.github.io/zona-muerta/. Solo va lo commiteado. Imprime la versión publicada (`AAAAMMDD-HHMM-commit`).
- **Artefacto de Claude**: `herramientas/armar-artefacto.py <proyecto> <salida> <versión> https://zenebord.github.io/zona-muerta/`
  arma la página con cada script pedido con su huella (`?v=`, para que el celular no use copias viejas) y un
  `js/version.js` con esa versión y esa dirección, que se publica como archivo del artefacto. Así el juego que se
  descarga desde el artefacto o desde la web (`zona-muerta.html`) consulta `version.json` en la web y se actualiza solo.
- Los commits van firmados como `zenebord` con la dirección anónima de GitHub (configurada en este repositorio).

## Historia: «Camino a casa»

Modo por niveles, de izquierda a derecha como los juegos de plataformas de antes (`js/historia.js`,
`js/escenario-historia.js`). El avión del protagonista cae en la cordillera, cerca de Bariloche, cuando aparecen los zombies, y tiene que
volver con su hija a su casa en Padua (Merlo), a 1600 km. La historia se cuenta con viñetas de 8 bits (lienzo de 320×180 agrandado sin
suavizar, con líneas de barrido) y música de consola de los 80 hecha en vivo (temas «Camino a casa», «Cien
kilómetros» y «Estás en casa» en `js/musica.js`).

| Nivel | Lugar | Km |
|---|---|---|
| 1 | Bariloche: la montaña donde cayó el avión, al amanecer (cordillera nevada, el lago, cipreses, nieve), con escombros, cráteres, contenedores de carga, fuselajes para caminar por arriba, escalerillas, el ala como rampa, turbinas y valijas tiradas; zombies dormidos que se despiertan al ver al jugador | 1600 → 1550 |
| 2 | La Pampa: la ruta destruida, con baches gigantes (dos se cruzan con una soga colgada de un pórtico de carteles), autos atravesados y un colectivo para saltar, un camión al que se sube por escalera, partes de autos tiradas, un auto en llamas y una horda de 5 al final | 1550 → 60 |
| 3 | Zona sur (conurbano de Buenos Aires) al atardecer con humo: negocios saqueados de fondo, semáforos caídos, carteles de calle (Av. Calchaquí, Quilmes, Lomas de Zamora), basura y escombros, andamios y escalera hasta los techos, socavones con sogas colgadas de los cables, contenedores, fuego, bocinas y alarmas de autos, y una horda de 7 | 60 → 15 |
| 4 | Padua, Merlo, de noche: casas en penumbras; solo se ve alrededor del personaje, del fuego, de los faroles que quedan y de la ventana de la hija. Cercas, techos con escaleras, zanjas inundadas de soga en soga y una horda de 10 antes de la puerta de casa | 15 → 0 |

La dificultad sube con cada nivel: más zombies dormidos (14, 12, 15 y 17), zombies sueltos más seguidos, más
corredores (0 %, 15 %, 25 % y 35 %) y hordas más grandes al final. Mecánicas de plataformas:
- **Escaleras de mano**: al pie, ↑ (o saltar) trepa sola hasta arriba; arriba, ↓ baja.
- **Sogas**: se balancean solas; te agarras si cualquier parte del cuerpo toca los tres cuartos de abajo de la
  soga (quedas colgado de la punta; el agarre tolera ±32 px) y **te puedes impulsar**: apretar ← o → hacia donde va el
  balanceo lo agranda hasta 1,45 veces (apretar al revés lo frena; sin empujar vuelve solo a lo de siempre); saltando
  otra vez te sueltas con el impulso del balanceo (hay que soltarse cuando va hacia adelante), ahora con más
  empuje y con control en el aire (las flechas corrigen y se puede girar). Si caes pegado al borde del vacío del que
  venías, un corrimiento te deja al menos a 62 px (antes, a 6 px: de ahí un paso de más era una caída). En el nivel 4, los dos huecos de dos sogas tienen un apoyo en el medio: un andamio
  entre los techos y un montón de escombros en la zanja.
- **El arma tiene cuerpo** (pedido de Enzo): un zombie que viene de frente se frena en la **boca del cañón** (a lo
  más 84 px) y muerde desde ahí, así nunca queda adentro del arma; si el jugador se da vuelta y lo deja adentro,
  el cañón lo empuja hasta la boca. Por la espalda, igual que antes; el tiro sigue saliendo desde el cuerpo.
- **Girar sin caminar** (tecla **W**, o ⟲ GIRAR en el celular): el jugador mira para el otro lado, también en el aire;
  si sigue apretando una flecha la mirada queda fija hasta que la suelta (disparar hacia atrás mientras retrocede o salta).
- **Margen al saltar**: se puede saltar hasta 130 ms después de pisar el vacío y un salto apretado hasta 130 ms
  antes de aterrizar sale al tocar el piso (se midió: salta con 7 cuadros de retraso, no con 10).
- **Niveles más largos**: los tramos de piso y de techo se estiran 1,6 veces y todo lo que tiene posición
  (cajas, corazones, radios, dormidos, escaleras, sogas, fuego) se corre con su tramo; los huecos, escalones y
  autos quedan iguales. Largo en px: 4600→5878, 5600→7826, 6400→9238 y 7000→10180 (+28 % a +45 %).
- **Precipicios** (río, canal, hueco entre edificios): caer quita 25 de vida y te devuelve al último lugar firme.
- **Fuego en el piso**: quema mientras lo pisas. Los zombies no se tiran a los precipicios: esperan en el borde.

**Zombies del lugar y jefes** (`js/zombies-autoctonos.js`). En cada nivel, uno de cada dos zombies es del lugar
(van por pares: uno común y uno del lugar, en orden al azar), con su propio dibujo y su vida y velocidad:

| Nivel | Del lugar | Jefe (antes de la meta) |
|---|---|---|
| 1 | Guanacos, ciervos colorados y esquiadores (campera, gorro con pompón, antiparras) | El San Bernardo del Centro Cívico, con su barril: embiste |
| 2 | Vacas (lentas y con mucha vida), ñandúes (rápidos) y paisanos de boina, faja con rastra y pañuelo | El toro de la pampa: escarba y embiste |
| 3 | Perros callejeros, hinchas con la camiseta a rayas (celeste, verde o granate) y colectiveros | El hincha del bombo: golpea el bombo y la onda corre por el piso |
| 4 | Gatos, perros, abuelas en batón con ruleros y el vecino del asado (musculosa y delantal) | El coloso verde, un zombie gigante y musculoso: salta y cae con una onda expansiva |

Los animales están hechos para dar miedo: pelaje podrido con calvas, lomo erizado, la herida con las costillas,
el hueso a la vista en una pata, garras, hocico arrugado que muestra encías y colmillos, baba de sangre y ojos
rojos con pupila rasgada bajo el ceño. Se lanzan un 50 % más rápido cuando el jugador está a menos de 260 px,
muerden cada 0,6 s (los demás, cada 0,9) empujando con el cuerpo, y gruñen (`Audio_.gruñido`, más grave cuanto
más grande el animal) en vez de gemir; al morder, ladran o braman.
Al morir, el golpe los despide hacia donde los empujó (con una explosión, el doble; vacas, ciervos, guanacos y
jefes pesan más y vuelan menos), dan una vuelta en el aire con un chillido, caen panza arriba, rebotan (con
polvo, sangre y temblor de cámara según el tamaño), patalean con espasmos 2 s echando chorros de sangre, sacan
la lengua, se les apagan los ojos y se desvanecen en su charco a los 5 s.

El jefe aparece a 700 px de la meta, entre el jugador y la casa, con su barra de vida abajo; mientras viva la meta
queda cerrada. Tiene de 22 a 55 veces la vida de un zombie común (22, 30, 40 y 55) y ningún golpe le saca más
del 8 % (una explosión o un ataque aéreo no lo matan de una). Las embestidas y las ondas se esquivan saltando.
Mientras está el jefe, salen la mitad de zombies sueltos.

- En el camino hay **corazones** (+30 de vida) y **radios**: cada radio es un ataque aéreo para pedir con la A
  (el personaje se tira cuerpo a tierra mientras caen los misiles).
- Las armas y la munición pasan de un nivel al siguiente; las cajas de cada nivel suman armas nuevas. Siempre
  lleva el cuchillo, y cada nivel empieza con 3 granadas más que se suman a las que traía.
- Al terminar cada nivel aparece un resumen (zombies, tiempo, vida, corazones, radios y armas encontradas) y el
  mapa del camino; al terminar el cuarto, el reencuentro con la hija y el fin.
- Si muere, reintenta el nivel con lo que tenía al empezarlo. El progreso queda guardado en el navegador
  (`zonaMuerta.historia.nivel`) y desde el menú se puede continuar o empezar de nuevo.
- Desniveles: `Mundo.perfil` da la altura del piso por tramos; un escalón de más de 14 px no se sube caminando
  (`ESCALON_MAX` en `js/jugador.js`), hay que saltarlo (el salto llega a unos 120 px). Trepando una escalera o
  colgado de una soga, el personaje guarda el arma en la espalda y usa las dos manos.
- Los zombies también respetan los desniveles: trepan de a poco los escalones de hasta 75 px, caen con gravedad
  al bajar, esperan al pie de las paredes más altas y en el borde de los precipicios.

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
- **Jerarquía de armas** (`js/jerarquia.js`, pedido de Leandro el 22/11): en la pelea infinita y las misiones, una caja con
  un arma de **menor nivel** que la de la mano **no la cambia**: el arma se guarda igual en el inventario (con su
  munición, aviso «GUARDADA EN EL INVENTARIO») y la mano sigue con la más valiosa; una de igual o mayor nivel sí pasa a la
  mano. Niveles, de menor a mayor: cuerpo a cuerpo, pistolas, metralletas, **rifles** (no los nombró: los puse acá), especiales,
  especiales cuerpo a cuerpo (las legendarias) y, arriba de todo, escopetas. En la configuración (sección **JERARQUÍA DE
  ARMAS**) se apaga con una casilla y se reordena con ▲ ▼; «Orden original» y RESTABLECER lo devuelven. No rige en la
  defensa zombie, la ultra ni la historia. Probado: con una AK-47 en la mano, pistola y machete no la cambian (quedan en el
  inventario), una metralleta y una escopeta sí; con el cuerpo a cuerpo subido arriba de todo, el hacha sí; apagada la
  casilla, todo cambia como antes. Al guardar un arma sin equiparla, el inventario se reordena sin mover la de la mano.
- **Configuración**: el **engranaje** de arriba a la izquierda (en todas las pantallas; en partida pausa el
  juego) abre un panel con volumen general, efectos y música, silenciar todo y un botón para probar el
  sonido; idioma; dificultad; calidad gráfica (alta: hasta 2× de resolución; normal: 1×, para celulares
  lentos); botones en pantalla (automático, siempre o nunca); vibración al tocar, pantalla completa y **usar el
  mouse** para disparar, recargar y cambiar de arma (viene activado). Cinco casillas apagan **de a un sonido** sin
  tocar los demás: música, pasos, disparos, balas que pegan en zombies y voces y golpes de zombies (medido: cada
  una deja en 0 los sonidos de su categoría y el resto sigue igual). La bala que entra en un zombie ya no suena a
  esponja exprimida (la grabación `impacto_carne`, que quedó sin usar): ahora es un golpe seco de bala contra algo
  duro, hecho con ruido, un tono corto y un golpe grave. En el campo de pruebas, la rueda del mouse sobre la
  ficha del arma la desplaza y no cambia de arma.
- **Pedidos** (`js/pedidos.js`, `servidor/pedidos.mjs`): un gestor de tickets sencillo dentro del juego (botón PEDIDOS
  del menú, debajo de TUTORIAL). La lista muestra el número, el título, el estado (abierto, en curso, listo o cerrado), la
  sección del juego y la prioridad de cada pedido, con su texto al tocarlo, y se filtra por estado y por sección; se actualiza sola cada 20 segundos (no hay botón de actualizar). Estados: abierto, en curso, listo (hecho y publicado), **esperando confirmación** (se le pidió a quien lo pidió que lo pruebe) y cerrado (confirmado). **Qué puede hacer cada uno** (cada respuesta queda como una nota del pedido: quién, qué y cuándo): quien lo pidió, en abierto o en curso, agrega una aclaración; en listo o esperando confirmación responde **«sí, quedó bien»** (pasa a cerrado) o **«no, todavía no»** con el motivo (vuelve a abierto), y en cerrado lo **reabre** con el motivo; siempre puede borrarlo (dos toques). En la lista se marca con «● ¿Quedó bien?» el pedido que le toca responder. El dueño cambia el estado, responde (nota «Desarrollo») y borra cualquiera; los pedidos de otras personas sólo se leen. Reglas en el servidor: sin la clave del pedido, 403; confirmar un pedido que no está listo, 409; rechazar o aclarar sin texto, 400; 30 notas por pedido y 60 respuestas por persona y por día. Desde la terminal: `node servidor/pedidos.mjs nota 3 "texto"`. Cada pedido puede llevar **una foto** (botón AGREGAR FOTO del formulario): el navegador la achica antes de enviarla (lado máximo de 1280 px, JPEG; con eso se pierden los datos ocultos, como la ubicación: probado con una imagen de 3000×2000 px y 1328 KB que quedó en 21 KB y sin EXIF); el servidor comprueba que sea un JPEG de verdad y de menos de 700 KB (si no, 400 o 413) y la guarda en `servidor/datos/pedidos-fotos/`; en el pedido se ve chica y al tocarla se agranda; al borrar el pedido se borra la foto. Sin servidor, la foto se guarda dentro del pedido, en el navegador; y en la web publicada, las fotos de los pedidos viajan en `fotos/` (las copia `herramientas/exportar-pedidos.py`). Cada pedido guarda **quién lo abrió** (`creador`): **Tío Lea**, **Francisco** o **Claude**, cada uno con su color (celeste, verde lima y terracota) y su **cara** (`js/pedidos-caras.js`: ilustraciones vectoriales dibujadas en código, sin archivos; Tío Lea, un adulto de 40 años con barba; Francisco, un nene de 12 con pelo castaño y ojos azules; Claude, su estrella) en la etiqueta «Abierto por…» y en sus notas. El formulario pide «¿Quién eres?» con una tarjeta con la cara de cada uno (Tío Lea o Francisco; se acuerda de la última elección en ese dispositivo) y Claude abre los suyos, desde la terminal, con `node servidor/pedidos.mjs crear "título" "Sección" media "texto"`): la confirmación la da quien lo abrió, así que un pedido que espera confirmación dice **«Esperando confirmación de Claude»** (o «de Francisco», «de Tío Lea»). Al responder, si el pedido ya no encaja en el filtro, la lista pasa a TODOS y se agradece. NUEVO
  PEDIDO es un formulario (sección, prioridad, título y qué se pide) y el botón **CREAR** lo guarda, sin salir del juego.
  **Dónde se guarda:** si el juego corre en el servidor de construcción, en su base de datos sencilla,
  `servidor/datos/pedidos.json` (un archivo JSON que se puede abrir y editar a mano; tope de 20 pedidos nuevos por
  persona y por día, 1000 en total, y no se guarda ningún dato de quien lo pide); si no (la web publicada o el
  artefacto), los pedidos de la lista son una **copia de sólo lectura que viaja con el juego** (`pedidos.json`, que `herramientas/publicar-web.sh` genera con `herramientas/exportar-pedidos.py`, sin las claves de borrado; se actualiza en cada publicación) y los que crea cada persona se guardan en su navegador (se numeran «L1», «L2»…) y sólo los ve ella. Para administrarlos:
  `node servidor/pedidos.mjs` (lista), `… ver 3`, `… estado 3 cerrado` y `… borrar 3` (los números no se reutilizan); **desde la pantalla**, el dueño cambia el estado de cualquier pedido con un selector (abierto, en curso, listo o cerrado) y cada pedido desplegado tiene BORRAR (con confirmación de dos toques) para quien lo creó (el servidor le entrega una clave al crearlo y la guarda su navegador) y para el dueño, que es quien entra desde la Mac del servidor, no por el túnel; los cambios se ven al instante. Todo lo
  guardado se muestra como texto, nunca como HTML.
- **Tutorial** (`js/tutorial.js`, pedido de Enzo): un cuadrito TUTORIAL arriba a la derecha del menú, debajo del
  personaje, abre un campo plano con 11 pasos guiados (caminar, saltar con una flecha apretada, agacharse, girar,
  disparar a un zombie lento, recargar, cambiar de arma, la mira del Remington 700, el ataque aéreo con A, la pausa y
  recargar la página con F5) más la pantalla final; cada uno se da por hecho cuando se hace y se puede omitir. Nadie
  muere ahí. Los textos usan las teclas que tenga puestas cada uno (y los botones, en el celular) y están en los tres
  idiomas. Recorrido simulado de punta a punta: 15 s de juego.
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

Además de las flechas y F/S/D/A: **W** gira sin caminar (también en el aire).

**Las teclas se cambian** en Configuración → Teclas (también desde CONTROLES → CAMBIAR TECLAS): cada acción tiene un
botón con su tecla; se toca y se presiona la nueva, que puede ser cualquier letra, número, flecha, Control, Alt o
Alt Gr. Si la tecla ya era de otra acción, se intercambian (y lo avisa). Escape cancela; no se asigna, porque siempre
pausa y cierra. «Teclas originales» vuelve a las de la tabla, y RESTABLECER también. Las teclas cambiadas se ven
resaltadas, y la pantalla de controles y las ayudas del juego («F DISPARA», la del campo de pruebas, la de Defensa
zombie…) muestran siempre las que están puestas. Cómo funciona (`js/teclas.js`): se guardan por código físico de la
tecla, con el nombre que tiene en el teclado de quien la eligió (en uno español, la Ñ), y el teclado del juego
traduce cada tecla apretada a la original de su acción, así el resto del código no cambia. Los botones táctiles
mandan la original y no se traducen. Alt Gr en Windows llega como un Control falso seguido de Alt: si Control tiene
una acción, espera 30 ms para saber cuál de las dos fue. Las teclas del Último bastión (números, `Q W E R`,
`A S D F G`, `V`, espacio) son de ese modo y no cambian; la de pausa sí.

| Tecla | Acción |
|---|---|
| `→` / `←` | Avanzar / retroceder |
| `↑` | Saltar |
| `↓` (mantener) | Agacharse con rodilla en tierra: el arma baja 13 unidades (blancos bajos) y se esquiva el chorro de ácido. Junto a una M2, la monta o la suelta |
| `F` o clic izquierdo | Disparar (mantener presionado con las metralletas) |
| `S` o clic derecho | Recargar (las escopetas cargan cartucho por cartucho; disparar interrumpe la carga). El clic derecho no abre el menú del navegador |
| `1` … `7` | Grupo de armas: 1 pistolas, 2 metralletas, 3 rifles, 4 escopetas, 5 especiales, 6 cuerpo a cuerpo, 7 legendarias (otra vez: la siguiente del grupo) |
| `Q` / `E`, `G` / `H` o rueda del mouse | Arma anterior / siguiente |
| `D` | Mira: telescópica (Remington 700, Barrett M82, Mosin-Nagant y Dragunov SVD) o de punto rojo (Kriss Vector, P90, Saiga-12, Milkor MGL y bazuca M9): apunta sola al zombie más cercano; otra vez, la quita |
| `A` | Defensa zombie: pedir un ataque aéreo (cada 20 s) |
| `C` | Campo de pruebas: menú de cajas y ametralladoras (`X` borra todo lo generado) |
| `P` / `Esc` | Pausa |

**Mira telescópica** (`D`; en el celular, el botón MIRA que aparece con esas armas; en todos los modos menos el
bastión, donde la tecla es de otra cosa): con un rifle que la tiene dibujada (Remington 700, Barrett M82, Mosin-Nagant
de tirador y Dragunov SVD) apunta sola al zombie vivo más cercano en línea recta, también más abajo en la montaña o a
los chiquitos sin agacharse, hasta volver a apretarla (en Defensa ultra, el más cercano de su carril). El personaje se
da vuelta hacia él, el arma gira sobre la cantonera hasta 34° y la cabeza la acompaña; la retícula (anillo de borde
difuso, cuatro postes, círculo y cruz finos, como la imagen de referencia que mandó Enzo) se cierra sobre el zombie y
lo sigue. La bala no falla: sale derecho al pecho, corrige el rumbo si se mueve y no se corta contra el borde de la
montaña. Si el zombie muere pasa solo al siguiente, y no salta a otro por un pelo (sólo si está 10 más cerca).
Probado con las cuatro: un zombie 100 px más arriba y otros de 60 a 160 px más abajo murieron de un tiro; en una
partida normal, 10 de 10 tiros pegaron. Código: `alternarMira` y `actualizarMira` en `js/jugador.js`,
`Proyectil.objetivo` en `js/objetos.js` y `dibujarMiraTelescopica` en `js/jugador-dibujo.js`.

**Mira de punto rojo** (`D`, igual que la telescópica; otro pedido de Enzo, con la imagen de su retícula): con las armas
que tienen dibujada una mira holográfica o réflex, que no aumenta (`MIRA_PUNTO_ROJO`: Kriss Vector, P90, Saiga-12,
Milkor MGL y la caja de la mira de la bazuca M9). Elige el zombie, gira al personaje e inclina el arma igual (la P90,
que no va al hombro, sobre la empuñadura); cambia la retícula: un anillo rojo de trazo parejo con cuatro marcas cortas
hacia afuera y el punto en el centro, con un resplandor rojo para la noche y un contorno oscuro apenas marcado para
los fondos claros (`dibujarMiraPuntoRojo`). Tampoco falla: los perdigones de la Saiga salen abiertos y se juntan en el
zombie, y la granada del MGL y el cohete de la bazuca van derecho a él (sin caer por el peso ni explotar contra la
montaña mientras lo siguen; el cohete se dibuja apuntando hacia donde va). Probado con el juego avanzado a mano, tres
tiros por caso, contra un zombie 75 y 150 px más arriba en la montaña, 75 y 150 px más abajo y uno chiquito: 75 de
75 (la Saiga, 9 de 9 con los 54 perdigones adentro: los de 150 px quedan fuera de su alcance; el MGL y la bazuca,
todas las explosiones en el zombie); la telescópica, 15 de 15. Con un arma sin mira, el aviso dice cuáles la tienen.

## Armas y tiros para matar un zombie

**Escopetas, de a dos** (pedido de Enzo): los perdigones de un tiro comparten la cuenta de zombies alcanzados y, tocados
dos, los que van hacia un tercero se pierden (`ZOMBIES_POR_PERDIGONADA` en `js/armas.js`; `Proyectil.tanda`). El
alcance no cambió. La AA-12 trae 10 cartuchos en el cargador (antes 20). Probado: tres zombies a distintas alturas y un
perdigón del mismo tiro hacia cada uno: con la regla, 2 de 3; sin ella, 3 de 3.

**Animales del modo historia** (pedido de Enzo): van un 13 % más lentos (`LENTITUD_ANIMALES` en
`js/zombies-autoctonos.js`) y cualquier tiro los voltea, sea del arma que sea; los jefes (el San Bernardo, el toro) no
cambian, ni los animales del Último bastión, a los que les tiran las unidades. Probado: vaca, ñandú, guanaco y perro
caen con un tiro de Glock; la vaca pasó de 0,75 a 0,65 de velocidad.

Tiros en dificultad media:

| Tipo | Armas | Tiros |
|---|---|---|
| Pistolas | Glock 17, Magnum .44, Colt 1911, Desert Eagle, Colt Python, Beretta 92FS, Walther PPK, Mauser C96 | 3 |
| Metralletas | Uzi, AK-47, M16, MP5, Thompson M1928 (tambor de 50), Kriss Vector, P90 | 5 |
| Rifles | Remington 700, Barrett M82, Mosin-Nagant, M1 Garand, Dragunov SVD, Winchester 1894 | 1 |
| Escopetas | Recortada doble caño, Mossberg 500, SPAS-12, AA-12, Saiga-12, Benelli M4, Remington 870, Winchester 1887 | 1 |
| Ametralladora fija | M2 Browning .50, clavada en las montañas, no se puede llevar | 1 |
| Especiales (solo en montañas) | Lanzagranadas M79, Milkor MGL (6 granadas), Bazuca M9, RPG-7, Granadas M67, Lanzallamas M2, Minigun M134 (300 tiros), Láser alienígena | 1 (el lanzallamas: 0,9 s de fuego) |
| Cuerpo a cuerpo (tecla 6) | Machete y Bate con alambre de púas (2 golpes), Katana (2, rápida), Hacha de bombero y Mazo (1, lentos; el mazo empuja lejos), Machete del cazador (1; solo con el cazador enmascarado) | 1–2 |
| Legendarias (tecla 7; en las cajas de las montañas, salvo en la historia y la pelea infinita) | Mjölnir (llama rayos sobre 4 zombies), Excalibur (onda de luz que atraviesa), Tridente de Poseidón (ola que barre), Égida (escudo que se lanza y vuelve), Gungnir (lanza que se lanza y vuelve) | 1 |

Las armas cuerpo a cuerpo y las legendarias no usan munición ni se recargan: `F` da el golpe (alza el arma,
la baja de golpe y vuelve a la guardia) y pega a los dos o tres zombies más cercanos adelante. Las de dos
manos se toman con las dos en el mango; el machete, la Égida y Gungnir, con una. Las legendarias son de la
mitología (nórdica, artúrica y griega); 3 de cada 10 cajas de montaña traen una.

### Machete del cazador y Minigun M134

Armas especiales de `js/armas-especiales.js`, que se engancha envolviendo métodos de `Jugador` y de `Juego`.

- **Machete del cazador**: es del personaje enmascarado (skin `cazador`) y de nadie más. Con él está siempre en el
  inventario, al lado del machete común; con otro personaje no aparece en ninguna lista (ni en el campo de pruebas),
  no se puede recoger ni equipar, y si se cambia de personaje con el machete en la mano pasa a la siguiente arma. Hoja
  de 58 cm (76 de punta a punta), vieja: óxido, cuatro mellas, sangre seca, mango rajado con cinta aisladora y un
  cordón. Una mano, alcance 60 y daño 15: tumba a un zombie de un golpe. El nombre sigue la regla de los personajes:
  sin nombres de marcas ni de películas.
- **Sonidos del cazador** (`js/audio.js`, síntesis propia: ni grabaciones ni copias de películas o juegos; se
  escuchan fuera del juego con `Audio_.generadores` en un `OfflineAudioContext`):
  - *Susurro* «ki ki ki ki… ma ma ma ma», medido contra una grabación de referencia del efecto clásico que eligió
    Leandro. De ella se tomaron medidas, no sonido: queda a menos de 1 dB de la referencia en cada uno de sus 11
    pulsos. Una sílaba cada 0,4 s de punta a punta, y el primer «ma» un pulso después del último «ki», sin pausa. El
    «ki» es corto y casi un «ch»: un soplido ancho al soltar la «k», una resonancia angosta en 2,78 kHz que pica a los
    55 ms (la mitad de la energía entre 2,6 y 3,6 kHz, como en la referencia) y una «i» floja que asoma a los 70 ms;
    a los 150 ms ya está 17 dB abajo. La «m», un murmullo nasal grave, y la «a», aire con un hilo de voz grave (88 Hz,
    más bajo en cada «ma») por sus formantes (780, 1180, 2500 y 3400 Hz). Volúmenes (dB A, re el primer «ki»):
    «ki» 0 · 0 · −5 · −9,5; «ma» +6 · +6,5 · −2 · −7 y la cola del eco −14 · −20 · −27. Eco al mismo paso (0,4 s),
    que rebota de izquierda a derecha y se oscurece, y una sala larga. `SUSURRO` (ritmo, eco, volumen de cada sílaba)
    y `SILABA_KI` (la «k», el soplido, la resonancia, la «i», la aspereza) en `js/audio.js` permiten probar variantes.
    Suena al sacar el machete, sin ningún ruido de arma antes (nunca antes de que termine el anterior, así no se
    pisan) y, si pasaron 8 s del último, al matar con él o en 4 de cada 10 golpes.
  - *Machete*: el tajo, aire que barre de grave a agudo y vuelve, con el silbido del filo y el peso de la hoja, de
    izquierda a derecha; el golpe, el filo que muerde, el golpe sordo, la carne, el hueso si es fuerte y la hoja que
    queda vibrando (más la grabación de carne de siempre). Al sacarlo no suena nada de arma: sólo el susurro.
- **Minigun M134**: seis cañones que gira un motor eléctrico, 300 tiros en la caja y dos de repuesto. Al apretar, los
  cañones tardan 350 ms en llegar a la velocidad de tiro (giran sin tirar); después tira cada 30 ms (2000 por minuto) y
  la vaina salta por la ventana del costado. Al soltar siguen girando 1,4 s hasta parar. Tirando mucho, las bocas se
  ponen rojas. El motor sube y baja de tono con la velocidad y la ráfaga ruge debajo de cada tiro. Recargar es cambiar
  la caja: la vacía cae al piso y la nueva llega con la punta de la cinta. Un tiro por zombie, como la M2; la misión
  «Artillero» sigue contando solo la M2.

### Lanzallamas M2

El lanzallamas de mochila de Estados Unidos (1943), en el grupo de especiales. La lanza (111 cm) tiene la válvula de
combustible atrás con la manguera, dos empuñaduras de madera con sus gatillos (combustible e ignición), el cilindro de
ignición en la punta y la llama piloto que titila; en la espalda van los dos tanques de combustible y el de nitrógeno, y
la manguera baja por detrás del cuerpo hasta la válvula siguiendo al arma.

- **Chorro**: automático, una descarga cada 50 ms con tres llamas escalonadas que se estiran hacia donde vuelan, frenan
  con el aire, caen un poco y pasan de blanco amarillento a anaranjado, rojo y humo (alcance unos 7 m). Lo que toca el
  piso sigue ardiendo un poco más de un segundo. La luz del chorro ilumina el piso y al tirador (`LuzLlama`).
- **Daño**: cada llama pega una vez (0,4) y prende fuego al zombie, que se sigue quemando 3 s (4 por segundo), con lenguas
  de fuego por el cuerpo y su luz. Sin destello, ruido de impacto, empujón ni sangre por llama. Un zombie cae con
  0,6 s de fuego en fácil y 0,9 s en medio y difícil; la ficha y el HUD lo muestran en segundos.
- **Carga**: 7 s de fuego (140 descargas) y 4 de reserva. Recargar cambia el cilindro de ignición (`recargaTipo: 'ignicion'`).
- **Sonido**: un rugido grave que se encadena entre descargas, con algún chisporroteo.

### Diseño

Cada arma está dibujada de perfil con sus medidas reales en centímetros (Glock 20 cm, AK-47 88 cm, M16 99 cm,
Barrett 145 cm…) y sus rasgos de verdad: estrías de las correderas, cachas de madera cuadriculadas, tambores
estriados y varillas extractoras en los revólveres, cajones fresados, rieles, guardamanos ventilados,
apagallamas, miras telescópicas con torretas y lentes, tornillos y juntas. La P90 y el M1 Garand se midieron
además sobre fotos de perfil.

El AK-47 y la MP5 están calcados de fotos de perfil: la foto se endereza, se escala a su largo real con una grilla
en centímetros, el modelo se dibuja encima y se superpone para comprobar que coincida; los colores se toman de la
foto. El Remington 700 toma de una foto la forma de la culata y el nogal lustrado.

**Acabado de material** (`pintar` en `js/armas-modelos.js`): cuando el arma se ve grande (desde 3 px por cm, o sea en
la ficha) cada pieza recibe la terminación de su material, que sale del color: la madera, veta que sigue la pieza,
poros, barniz (y `lustre` para la de alto brillo); el acero oscuro, grano, reflejo azulado, bisel, filo brillante y
desgaste en los cantos de arriba; el inoxidable, cepillado a lo largo; las hojas (acero claro muy alargado), pulido
espejo; el polímero, texturado; los caños finos, reflejo cilíndrico. Más chico no se nota y se omite, así que el arma
en mano se dibuja igual y no cuesta más. La ficha mide el arma en chico y la dibuja directo al tamaño final.
`remache`, `rebaje` y `sombraContacto` (en `js/armas-modelos-3.js`) agregan detalles que el acabado no puede inventar.

### Recargas

Cada arma se recarga con su mecanismo real. Durante la recarga el arma se acerca al cuerpo y se
inclina, y el personaje baja la mirada. Lo que carga lo saca de adelante del cuerpo (`BOLSAS` en `js/jugador.js`):
los cargadores, del portacargadores del cinturón; las balas, los cartuchos, los peines y los cargadores rápidos, de la
canana del pecho. Antes todo salía de un punto detrás de la cadera y el brazo cruzaba hasta la espalda en cada viaje
(ocho veces seguidas con una Winchester). La mano no va en línea recta sino en arco, arranca y llega sin tirón, y
mientras el arma gira para cargarla ya va camino a la canana.

**Armas de quiebre** (escopeta de dos caños y M79; pedido de Enzo del 17/11): abiertas, se ve la cara de atrás de los
cañones en escorzo con lo que hay en cada recámara (`caraQuiebre` en `js/armas-modelos-3.js`): vacía (el ánima oscura,
con las estrías en la M79), con un cartucho o una granada sin tirar (culote con el fulminante sano) o con la vaina
servida (fulminante marcado y hollín). Cada tiro deja su vaina en el cañón (`Jugador.servidas`); al terminar de abrir,
el expulsor las tira hacia atrás por el eje del cañón, girando, y caen al piso y se desvanecen como cualquier vaina
(`Juego.expulsarRecamaras`, dibujadas con la munición de `js/municion.js`: el cartucho del 12 con el cierre abierto, la
vaina de aluminio de 40 mm con hollín en la boca). Si no se tiró, no sale nada; si se tiró un caño solo, sale una y el
cartucho sano queda. La mano trae cada cartucho o granada tomado del culote, en línea con el cañón, con la punta en la
boca, y lo empuja adentro: se lo ve entrar y después queda el culote a la vista hasta cerrar. Los cañones se redibujaron
con volumen: los dos de la escopeta (el de enfrente asoma arriba) con la banda y el guion, y el del M79 con el anillo de
acero de atrás y el labio de la boca. El salto máximo de la mano por cuadro quedó como antes (4,4 y 4,3 unidades).
Ojo: la VR (`vr/modelo3d.js`) arma cada arma en 3D solo con las piezas que el dibujo pasa por `pintar`. La primera
versión dibujó los cañones nuevos por fuera de `pintar` y en la VR la escopeta y el M79 se quedaron sin cañón (la
escopeta pasó de 101 a 74 cm). Las piezas originales del cañón siguen igual y lo nuevo va encima; antes de tocar un
dibujo de arma, comparar lo que toma la VR (piezas de `pintar` y trazos sólidos) con el commit anterior.

| Mecanismo | Armas | Qué hace |
|---|---|---|
| Cargador de pistola | Glock, Colt 1911, Desert Eagle, Beretta 92FS, Walther PPK, Mauser C96 | Saca el cargador, toma otro del cinturón y lo mete. Si quedó vacía, la corredera está trabada atrás: la mano vuelve a tomar el arma, el pulgar baja el retén y la corredera se va adelante sola con la primera bala; nadie la toca (pedido de Enzo). Antes la Glock, la Deagle, la Beretta y la Mauser tiraban de la corredera después de una pausa de 0,4 s: con el retén esa pausa no hace falta y la recarga en vacío dura 0,4 s menos. |
| Tambor | Magnum .44 | Abre el tambor, boca arriba vacía los seis casquillos, baja el revólver a la altura de la canana, carga bala por bala y cierra. |
| Cargador rápido | Colt Python | Abre, vacía, mete las seis juntas con el cargador rápido, lo suelta al piso y cierra. |
| (los dos revólveres) | Magnum .44, Colt Python | La ventana del armazón donde va el tambor es hueca: con el tambor volcado se ve a través de ella lo que hay detrás, y al cerrarlo el tambor la vuelve a tapar entera (`ventana` en `PY_FORMAS` y `MG_FORMAS`, `js/armas-modelos-3.js`). |
| Peine | Mosin-Nagant | Vacía: abre el cerrojo, apoya el peine, empuja las balas y al cerrar salta el peine. A medias: completa bala por bala. |
| Peine en bloque | M1 Garand | Con la última bala el cerrojo queda trabado atrás y el peine vacío salta para arriba girando, con su «ping». Vacía: no toca la manija; apoya el peine lleno en la guía, lo empuja entero con el pulgar (peine y balas bajan juntos y desaparecen en el cajón) y, cuando la mano se va, el cerrojo salta adelante solo. A medias: completa bala por bala. |
| Cerrojo | Remington 700 | Abre la recámara, pone bala por bala por arriba, metiéndola en la ranura de la recámara abierta (antes la bala se borraba unos centímetros antes), y cierra. |
| Palanca | Winchester 1894 y 1887 | Gira el arma y carga por la ventana lateral de a una. Si estaba vacía, acciona la palanca: el lazo baja y se adelanta girando sobre su pivote (`GIRO_PALANCA`, unos 57°), con la mano del gatillo adentro. |
| Bombeo | Mossberg 500, SPAS-12 | Da vuelta el arma y mete los cartuchos por abajo de a uno; bombea si estaba vacía. Disparar interrumpe la carga. |
| Quiebre | Recortada, M79 | Se parte, boca arriba saltan los gastados, entran los nuevos y se cierra de un golpe. La recortada tiene martillos exteriores: con cada tiro cae uno (primero el de este lado) y, ya cerrada, el pulgar monta los caídos uno por uno, con su clic (pedido de Enzo). |
| Cargador extraíble | Uzi, AK-47, M16, MP5, Thompson, Kriss Vector, P90, Barrett, SVD, AA-12, Saiga-12, láser | El vacío cae al piso. La AK y la Saiga lo enganchan con balanceo. Si estaban vacías (pedidos de Enzo): la **M16** y la **Vector** cierran con el retén del cerrojo (`RETEN` en `js/jugador.js`): la mano sube por el costado del cajón, aprieta el botón y el cerrojo se va adelante solo, sin tocar la manija; la **MP5** traba la manija atrás al empezar y al final la mano se alza abierta y la baja de una palmada (suena la palma contra la manija y, enseguida, el cerrojo que llega adelante); la **Thompson**, que quedó con el cerrojo y la perilla atrás, toma la perilla, la tira apenas y la suelta; las demás tiran de la manija y la sueltan. |
| Cinta | M2 Browning | Levanta la tapa, tiende la cinta nueva, cierra y tira de la manija. |

Las de acción manual (Remington, Mosin, Mossberg y las dos Winchester) accionan el cerrojo, la
bomba o la palanca después de cada tiro, y el casquillo sale recién ahí. Los revólveres y la
recortada no tiran casquillos al disparar: los sueltan cuando se abren para recargar.

**Recámara a la vista** (`js/armas-recamara.js`): el casquillo no aparece en el momento del tiro, sale por la
ventana de expulsión cuando la recámara está abierta. En las que se recargan solas (Uzi, AK-47, M16, MP5,
Thompson, Vector, Garand, SVD, Barrett, SPAS-12, AA-12, Saiga-12, Benelli) el cerrojo va atrás con cada tiro:
la ventana, que en reposo muestra el costado del cerrojo, queda abierta un instante con la vaina tomada de la uña
del extractor; a los 0,3 del ciclo la escupe, y al cerrar se ve entrar la bala nueva. El ciclo dura 130 ms (160 en
la Barrett), y nunca más que tres cuartos de la cadencia: en la AK, 75 ms. En las pistolas la ventana se abre con
la corredera (la vaina sale a los 20 ms; si se vació, la recámara queda abierta), en las de bomba con la bomba y
en las de palanca con la palanca. La manija de carga va con el portacerrojo donde en el arma real va (AK, SVD,
Saiga, SPAS-12, Benelli, Uzi, Thompson); en la M16, la MP5, la Vector, la Barrett y la AA-12 queda quieta. En
cámara lenta (L, en el campo de pruebas) se ve cada paso.

**Recámara abierta al vaciarse** (pedido de Enzo; `QUEDA_ABIERTA` en `js/jugador.js`): en la M16, la MP5, la
Thompson y la Kriss Vector, con la última bala el cerrojo queda atrás y la ventana, abierta (el hueco oscuro en
lugar de la franja clara del cerrojo), todo el tiempo que el arma esté vacía. Se cierra recién en la recarga, después
de sacar el cargador y poner uno nuevo, cuando se suelta el cerrojo (el retén, la palmada o la perilla, según el
arma): ahí se ve entrar la primera bala. En la Thompson la perilla queda atrás con el cerrojo. Las pistolas (la
corredera trabada) y el Garand ya quedaban abiertos; la AK, la Uzi, la P90, el SVD, la Barrett, la Saiga y la
AA-12 cierran con la última bala, como antes.

**Cargadores** (`js/cargadores.js`): cada arma con cargador extraíble tiene el suyo, el mismo dibujo que se ve
puesto en el arma (el modelo lo llama desde ahí). El que se saca, el que va en la mano y el que cae al piso son ese
cargador y de esa medida; antes eran un palito de 2 × 10 o tres cubitos apilados. La mano lo agarra cerca de la
base y lo saca y lo mete a lo largo de su eje (inclinado como la empuñadura en las pistolas) y no lo suelta hasta
que encastra. En la mano se dibuja antes que el arma, así el pozo o la empuñadura tapan lo que todavía está adentro
(el de la P90, que va encima, después). En las pistolas y la Uzi, puesto se ve solo la base; suelto, el cuerpo
entero con los agujeros de control. El nuevo trae asomando la bala de arriba, que es la de su calibre. Al piso cae
girado como estaba en la mano, se va acostando y queda tendido sobre su lado largo.

**Munición** (`js/municion.js`): cada arma tira su calibre y se ve. `CALIBRES` tiene las medidas reales de 17
cartuchos (largo de la vaina, diámetro, cuánto asoma la bala, si la vaina lleva cuello o reborde) y `CALIBRE_ARMA`
dice cuál usa cada arma: de los 3 cm de un 9 × 19 (Glock, Uzi, MP5) a los 5,6 del 7,62 × 39 de la AK, los 7,7 del
7,62 × 54 R del Mosin y los 13,8 de la .50 del Barrett y la M2. Un solo dibujo (`dibujarCartucho`) sirve para la
bala de arriba del cargador, la que entra por la ventana de la recámara, la vaina servida, la que lleva la mano al
cargar de a una, el peine (cinco balas tomadas del culote; el en bloque del Garand, ocho en dos hileras), el cargador
rápido del revólver y la cinta. Antes había cuatro tamaños genéricos (la Desert Eagle mostraba una .50 de
ametralladora) y la bala suelta era una barra de 10 unidades, 17 cm a escala, siempre parada. El latón y el cobre son
apagados y no llevan contorno: el canto lo da la sombra del cilindro. Lo que lleva la mano apunta hacia donde va
(`e.apuntaMano`): sale de la canana con la punta hacia abajo y en el camino gira hasta quedar en línea con el arma,
que es como entra.

**Cuerpo y anatomía** (`js/anatomia.js`): el cuerpo se ve de costado, pero los brazos y las manos se resuelven en
tres dimensiones y después se proyectan. `ANATOMIA` tiene los rangos de movimiento normales de un adulto y nada los
pasa:

| Articulación | Rango |
|---|---|
| Hombro | 180° hacia adelante y arriba, 60° hacia atrás |
| Codo | de recto a 150° de flexión, y solo hacia adelante |
| Antebrazo | 85° de pronación y 85° de supinación desde la posición neutra |
| Muñeca | 80° de flexión, 70° de extensión, 20° hacia el pulgar y 30° hacia el meñique |
| Dedos | 90° en el nudillo, 100° y 80° en las otras dos articulaciones |
| Cadera, rodilla y tobillo | 120° y 30°; de recta a 140°; 20° hacia arriba y 50° hacia abajo |

- **Brazo** (`resolverBrazo`): con el largo verdadero de los huesos (`HUESOS`, uno solo para los dos brazos y para
  todas las armas; antes el de apoyo medía 31,5 con un fusil y 26,5 con una pistola) sale el ángulo del codo, y el
  codo cae sobre un círculo alrededor de la línea hombro–muñeca: se elige el punto hacia donde tira un brazo de
  verdad (abajo, un poco hacia afuera y en línea con la mano si agarra algo). Un brazo que viene hacia el que mira se
  ve en escorzo en vez de encogerse. Si quedara más atrás de lo que da el hombro, el codo se abre hacia el costado.
- **Una sola forma por miembro** (`forma`, `tramoMusculo`): la manga arranca ancha en el hombro, afina hacia el codo
  y sigue por el antebrazo; el muslo y la canilla son un trazado con el cuádriceps adelante y la pantorrilla atrás.
  El contorno va por detrás del relleno, así queda solo en la silueta del conjunto. Antes cada tramo era una cápsula
  con su contorno y había un círculo en el hombro, un rollo en el codo y una elipse en la rodilla: se leía como
  pelotas unidas. La pintura es mate (sin el filo de brillo, que era lo que daba aspecto de plástico).
- **Piernas**: 14,5 de muslo y 14 de canilla (antes 13 y 12, con una bota de 9 de alto); la rodillera es una
  coquilla chica sobre el frente de la rodilla y la bota tiene tobillo. El pie apoya de plano mientras el tobillo da:
  si la canilla se inclina más, se levanta el talón (la pierna de atrás al caminar, la que apoya la rodilla) o la
  punta (la de adelante).
- **Cabeza**: se dibuja al 88 % alrededor del cuello (`ESCALA_CABEZA`), con lo que lleve puesto. Tal como estaba
  dibujada era un cuarto de la altura; con el cuerpo de proporciones reales quedaba grande. Vale para los nueve
  personajes y para los zombies. El cuello (`dibujarCuello` en `js/skins.js`) se dibuja antes que el torso y sale
  de adentro de la ropa, con la sombra de la mandíbula; antes iba con la cabeza, encima del cuello de la camisa, y
  en el cazador enmascarado y el centinela se veía despegado del cuerpo.
- **Zombies** (`js/zombie.js`): los humanoides (las 15 variantes, el tóxico, los jefes y los 17 tipos del bastión,
  que comparten un solo dibujo de pierna, brazo y cabeza) usan los mismos huesos y los mismos rangos. La pierna es
  una forma de piel con su pie descalzo y encima el pantalón roto, que termina en flecos (`tramoCortado`); el brazo
  resuelve el codo con `resolverBrazo` y ya no se estira al manotear; el hombro es el arranque de la manga y la
  rodilla el quiebre de la pierna, no círculos. La mano es la misma del jugador en garra, con uñas (`dibujarGarra`:
  los mismos nudos, trazados más livianos).
- **Infantería del bastión** (`infanteCuerpo` en `js/bastion-dibujo.js`): el soldado, el francotirador, el
  lanzallamas y el médico son un solo cuerpo en miniatura, con los huesos del jugador a escala (`HUESOS_MINI`: 7,2 y
  6,2 de brazo y 6,9 y 6,5 de pierna para 38 de altura) y los mismos rangos. Las piernas tienen rodilla
  (`piernaMini`): al caminar la que avanza despega y dobla hasta 47°, y la cadera queda a la altura que le da la
  pierna apoyada; de pie hacen guardia con la pierna del lado del arma atrás; el francotirador apoya una rodilla y la
  puntera del pie de atrás, con el otro pie de plano. El brazo es una sola forma (`brazoB`, con `resolverBrazo`): el
  de apoyo llega al guardamanos con el codo abajo, el del gatillo baja junto al cuerpo y sube al pistolete, y el
  guante tiene palma y pulgar y se dibuja después del arma. La cabeza va al 88 %. Antes las piernas eran un tubo sin
  rodilla, los brazos dos tubos de 5,6 que no llegaban al guardamanos (se estiraban un 10 %), el guante una bola y la
  cadera estaba a 0,38 de la altura (ahora a 0,42, como en el jugador). El tirador de la torreta y los servidores del
  mortero y la antiaérea usan el mismo brazo.
- **Animales** (`js/zombies-autoctonos.js`; las aves, en `js/bastion-v2-dibujo.js`): las patas doblan como las del
  animal. La de adelante baja derecha desde el codo, que va contra el pecho, y solo dobla en el carpo, con la caña
  hacia atrás; la de atrás hace la zeta: muslo hacia adelante hasta la babilla, pierna hacia atrás hasta el corvejón
  y caña hasta el pie. Perros y gatos caminan sobre los dedos, con uñas; guanaco, ciervo, vaca y toro, sobre la
  pezuña hendida. El pie se pone donde le toca en el paso (apoyado va hacia atrás; en el vuelo se levanta y vuelve) y
  de ahí salen las articulaciones (`dosHuesos`), así no patina ni se hunde; los lentos van al paso, de a una pata, y
  los rápidos al trote, de a dos en diagonal. El cuerpo deja de ser un óvalo: pecho hondo, cruz, lomo, grupa y la
  panza recogida de cada especie (`cintura`), en una sola silueta con el cuello y las patas del lado cercano, sin una
  bola en la cadera ni en el codo. Al ñandú la pata le doblaba hacia adelante, como una rodilla: ahora el muslo va
  entre las plumas y la articulación que se ve a media pata es el talón, que mira hacia atrás, con la caña y los tres
  dedos. El cuervo es una sola forma de la cola al pico y lleva las patas recogidas; el buitre, el cuerpo con la cola
  por un lado y el cuello pelado con la cabeza por el otro. Antes cada pata eran dos rectángulos, con su contorno,
  que doblaban todos para el mismo lado.
- **Costo**: una horda no puede pagar la pintura del jugador. En este lienzo un relleno con degradado o un recorte
  cuestan varias veces lo que un relleno plano, así que los miembros de los zombies van en dos tonos planos
  (`miembroZombie`: la forma en sombra y, encima, la misma más fina y corrida hacia la luz) y en la pasada de la
  sombra la mano es una mancha. Dibujar 60 zombies con su sombra pasó de 25,6 a 16,7 ms (medido ida y vuelta en la
  misma ventana; con la máquina más libre, de 15,9 a 12,9). El jugador, de 0,95 a 0,9 ms. Los animales usan la
  misma idea (`pielAnimal`) y, con menos piezas, salen más baratos que antes: un perro pasó de 0,69 a 0,40 ms, una
  vaca de 0,70 a 0,44, el toro de 0,96 a 0,49, un gato de 0,52 a 0,30 y el buitre de 0,25 a 0,15. El ñandú, que antes
  eran unas pocas líneas, subió de 0,21 a 0,30. La infantería se dibuja una vez por pose y se guarda como imagen.

**Manos** (`dibujarMano` en `js/anatomia.js`, los gestos en `js/jugador-dibujo.js`): todas son la misma mano con
guante, empuñe lo que empuñe, en reposo y en cada fase de la recarga: una palma, cuatro dedos de tres falanges y el
pulgar, con las medidas de una mano. Tiene su propio marco (hacia la punta de los dedos, hacia el pulgar y hacia donde
mira la palma), así que puede quedar orientada hacia cualquier lado, no solo con los dedos para arriba o para abajo:
de dorso, de palma, de canto o en escorzo.

- **Gestos** (`GESTOS_MANO`): cada uno dice cuánto cierra cada dedo y qué hace el pulgar (en camino, soltando,
  envolviendo un cargador, en pinza con una bala, metida en la bolsa, en gancho sobre la manija, de palmada, en la
  empuñadura con el índice en el disparador, por debajo del guardamanos, sobre los dedos de la otra mano). La
  orientación sale del antebrazo (`manoDesdeAntebrazo`: giro, flexión y desvío, dentro de los rangos) o de lo que
  agarra, y entonces `limitarMuneca` no deja que la muñeca se quiebre.
- **Fluidez** (`poseSuave`): la mano pasa de un gesto a otro girando y cerrando de a poco (65 ms), no de golpe. A 60
  cuadros por segundo, en las 76 recargas (38 armas, vacías y a medias), lo máximo de un cuadro al otro son 16° de
  giro y 0,14 de cierre; antes cambiaba de pose en un cuadro. Un agarre firme sobre el arma la sigue sin retraso.
- **El índice en el gatillo** (pedido de Enzo: en la Desert Eagle quedaba afuera y en la Mauser C96 atravesaba el
  cargador): cada arma dice dónde apoya la yema en la cola del disparador (`DEDO_GATILLO` en `js/armas-modelos-3.js`,
  medido con una grilla de 1 cm, en la parte baja de la cola), y `ajusteGatillo` (`js/jugador-dibujo.js`) busca
  cuánto dobla el índice y cuánto se separa hacia arriba en el plano de la palma (`giroIndice`, hasta 32°, como uno
  lo hace en una culata recta) para llegar ahí moviendo lo menos posible la mano; en 25 de 36 armas la mano no se
  corre más de 0,4 cm. Donde el dibujo no tiene el origen en la empuñadura, la mano se corre: la Mauser baja 1,7 cm
  y el Barrett va 2,6 cm atrás. El índice va del otro lado del armazón, como el de una mano derecha de verdad: se ve
  por el hueco del guardamonte, con la punta delante de la cola. En las pistolas la mano izquierda envuelve 0,8 más
  abajo, por debajo del guardamonte, que queda a la vista.
- **El pulgar de la mano del gatillo** (pedido: «el pulgar atraviesa el arma y parece fusionado con ella»):
  va del otro lado, estirado a lo largo del armazón (`pulgar: { largo: 1 }` y `op.pulgarDetras` en `dibujarMano`),
  y no se ve. Antes envolvía la empuñadura hacia este lado y, de costado, cruzaba el cajón en diagonal en las 33 armas
  de fuego (en las pistolas llegaba hasta la corredera). Los otros cuatro dedos quedan donde estaban.
- **Lo que agarra va por detrás**: la palma y los nudillos lo tapan, y los dedos que lo envuelven por el otro lado
  se dibujan antes que él (cada mano va en dos capas). El cargador se agarra por el medio, con los dedos cruzando su
  costado y doblando en el canto, en vez de quedar parado encima del puño.
- **Empuñadura vertical y bomba**: en las armas con mango adelante (Vector, Saiga-12, MGL, Thompson, bazuca,
  lanzallamas: `apoyoVertical` en `js/armas-modelos-3.js`) la mano de apoyo cierra el puño en el mango, no lo sostiene
  desde abajo como un guardamanos. En las de bombeo (Mossberg, Remington 870, SPAS-12) la mano queda en la bomba y al
  bombear sólo la lleva atrás y adelante. Si el mango o la bomba quedan lejos, la mano no se corre: el hombro de
  adelante se adelanta hasta 3 unidades y el brazo se estira.

La granada M67 no sale de golpe: la mano de apoyo engancha la anilla y saca el pasador (se oye el tirón),
el brazo va atrás, lanza (salta la cuchara) y la mano suelta el pasador, que cae al piso. La granada se
gasta recién al soltarla.

Las armas comunes (incluidas las de cuerpo a cuerpo) aparecen en cajas por el camino. Las especiales, en una caja brillante arriba
de las montañas, y vuelven a aparecer a los 90 segundos.

## Gráficos y sonido

**Calidad gráfica y juego descargable.** La calidad viene en «Automático»: arranca en alta (hasta 2× de
resolución) y, si en 3 s de partida el cuadro promedio tarda más de 24 ms (menos de unos 42 por segundo), baja un
escalón (normal: 1×; baja: 0,75× y sin el bisel de las piezas) y avisa; recuerda lo medido en cada computadora.
También se puede fijar a mano. En la portada, «Descargar el juego» (grande, con avance animado) arma un solo `zona-muerta.html` (unos
8,6 MB, con el CSS, los 53 scripts y los sonidos adentro) para jugar con el navegador sin pasar por la página de
Claude; su progreso y su configuración se guardan aparte.

**El archivo descargado se actualiza solo.** `zona-muerta.html` es un lanzador (`js/lanzador.js`): trae el juego
entero adentro en base64 (anda sin conexión) y lo muestra en un marco `srcdoc`, que comparte el origen de la página,
así el progreso se conserva entre versiones. Al abrirlo o recargarlo usa la versión más nueva que tenga (la de
adentro o la última que bajó, guardada en IndexedDB) y, con conexión, consulta `version.json` en la web del juego:
si hay una más nueva baja `juego.html`, la guarda y la carga (si está jugando, queda para la próxima recarga).
La web se arma con `python3 -I herramientas/armar-web.py <salida> <URL pública/>` (index.html, css, js,
juego.html, zona-muerta.html, version.json) para subirla a un hosting estático como GitHub Pages; la versión es
fecha, hora y commit. Mientras `js/version.js` diga `dev` y no tenga dirección, el lanzador no busca nada.

**Muerte de los zombies.** El golpe los despide de espaldas según el arma: con pistola o metralleta trastabillan
y caen; con escopeta, rifle o ametralladora vuelan hacia atrás; con un explosivo salen por el aire dando vueltas.
Pegan contra el piso y rebotan (con el golpe del cuerpo, polvo y sangre), quedan tendidos pataleando y manoteando
con espasmos mientras echan chorros de sangre, se les apagan los ojos, los brazos caen flojos y se desvanecen en
su charco a los 5 s. Los jefes pesan y vuelan menos, y su caída hace temblar la pantalla. El zombie tóxico de la
cloaca conserva su caída de rodillas.

Si el juego deja de verse (pestaña o app en segundo plano, celular bloqueado, página cerrada o el marco del
artefacto escondido), el audio se suspende y la partida se pausa. Lo último no avisa con `visibilitychange`:
`js/audio.js` vigila además que la página siga pintando cuadros y, si se frena más de 0,7 s, silencia todo.

- El lienzo se dibuja a la resolución real de la pantalla (hasta 1920×1080) sobre una escena lógica de 960×540.
- Personajes y armas se ilustran por piezas con degradado, bisel de luz y sombra en el borde y contorno fino.
  Las armas tienen brillo metálico, veta en la madera y culatas con caída.
- El jugador (`js/jugador-dibujo.js` y `js/skins.js`) tiene proporciones reales (unas 6,5 cabezas de alto), se
  dibuja al 116 % de su esqueleto (`ESCALA_JUGADOR`, para quedar a la altura de los zombies; `puntoArma` y la soga
  lo tienen en cuenta) y se
  pinta con sombreado de dos tonos tipo ilustración (`pintura`): la forma en tono oscuro, encima la misma forma
  corrida hacia la luz, un brillo en el borde y contorno del mismo color más oscuro. El sobreviviente es un
  soldado: camisa de combate oliva con parche, portaplacas coyote, pantalón camuflado (`camuflaje`, manchas fijas
  a la tela), rodilleras, botas de desierto, guantes arena, barba corta y shemagh. Los torsos de las otras skins
  se dibujan al 64 % de ancho (perfil) y todas las cabezas al 72 %. La sombra del jugador se pinta en una capa
  aparte (`sombraPareja` en `js/dibujo.js`) para que las piezas encimadas no la manchen.
- Cada zombie sale distinto: pelo, heridas, desgarros, manchas y a veces un brazo colgando. Al morir cae sobre un charco de sangre.
- Los mecanismos de recarga (cargadores, correderas, cerrojos, bombeo, cartuchos, balas) son grabaciones reales
  de armas, recortadas en eventos sueltos y elegidas según el arma. Fuentes y licencias en `sonidos/CREDITOS.md`.
- **Cada golpe suena cuando la pieza llega** (`sonidos` en las fases de `LineaTiempo`, `js/jugador.js`;
  `PARTES_GRABACION` y `Audio_.anticipo`, `js/audio.js`). Las grabaciones de «abrir y cerrar» (tirar de una manija,
  bombear, accionar un cerrojo o una palanca) traen sus dos golpes con el ritmo de quien las grabó, de 0,17 a 0,55 s
  entre uno y otro; la animación tiene el suyo, distinto en cada arma y casi siempre más corto, y el segundo golpe
  sonaba con la pieza ya cerrada y la mano de vuelta (Enzo lo notó: «el sonido puede ser más rápido o más lento»).
  Ahora cada fase dice en qué momento tiene que caer el golpe (cuando la pieza llega atrás, cuando cierra, cuando el
  pestillo suelta el tambor, cuando el cargador traba) y la grabación se larga antes lo que su golpe tarda en sonar;
  las de dos golpes se tocan en dos partes, una por movimiento, y si la animación no da tiempo se saltea el silencio
  del principio. En cámara lenta el anticipo se achica con el juego, porque el sonido sigue a velocidad normal. Lo
  mismo vale para el tambor de los revólveres (cerraba con dos golpes separados por un cuarto de segundo; ahora uno),
  el quiebre, los martillos de la recortada, la tapa de la M2, el cargador (el chasquido de la traba cae cuando
  termina de entrar; antes, 0,1 s después), el peine del Mosin (su golpe caía 0,7 s tarde) y el último cartucho de
  una tanda (la cola de la grabación seguía 0,3 s con la mano ya de vuelta en el arma). Medido en 105 casos (cada arma
  vacía, a medias, faltándole una y accionando después del tiro): antes 40 tenían algún golpe de pieza a más de 60 ms
  de su movimiento y 37 a más de 120 (el cierre de la AA-12, 0,66 s tarde); ahora el peor es de 31 ms y nada suena
  más de 86 ms después de terminada la animación (antes, hasta 331). Los llamados de siempre, `Audio_.recarga(evento,
  arma)`, suenan enteros como antes (la VR y el bastión los usan así).
- Voces de zombies, pasos, impactos de bala en la carne y quejidos del protagonista también son grabaciones reales.
  El viento de fondo, la sirena de cada ronda y el latido con poca vida son sintetizados.
- El «ping» del M1 Garand (el peine vacío que sale despedido) es síntesis modal desde la física del peine: el modo
  principal cerca de 2,65 kHz con un gemelo que bate como una campana, la torsión a ×1,49, y se apaga en ~0,9 s.
  Medido con la mezcla del juego: 7,8 dB A por debajo del disparo y, en su banda (2,2 a 3,3 kHz), de 11 a 19 dB por
  encima de la cola del disparo durante el primer medio segundo.
- **Disparos grabados** (`js/sonidos-armas.js`, `DISPARO_REAL` en `js/audio.js`): armas reales disparadas al aire
  libre, de The Free Firearm Sound Library (CC0). Cada arma del juego usa las tomas del arma real más parecida, con
  el mismo cartucho cuando lo hay: Colt 1911, AK-47, AR-15 (M16), Mosin-Nagant (también el Dragunov), .30-06 de un
  Springfield 1917 y un Tikka (Garand, Remington, y más lentas el Barrett y la M2), Winchester 1894, Bersa .380 (PPK),
  el tiro suelto de una PPSh (Mauser C96), Walther 9 mm (Glock, Beretta), revólver .38 más lento (Magnum, Python),
  Carl Gustav 9 mm (las subametralladoras) y cuatro escopetas del 12 distintas. Para que no suenen todos iguales,
  cada tiro elige una de 2 a 4 tomas sin repetir la anterior y varía ±4 % el tono y ±0,5 dB el volumen. La Desert
  Eagle, los revólveres grandes, el Barrett, la M2 y la recortada suman por debajo un golpe de presión sintetizado.
  Al aire libre la toma trae la cola del campo; en el galpón y la cloaca se le suma sala y eco. Cada toma se preparó
  con un limitador con anticipación (el pico del estallido, 14 dB abajo) y al mismo nivel percibido, y el volumen de
  cada arma se calibró con la mezcla del juego: con el limitador de la mezcla quedan a la par de los sintetizados de
  antes en ventanas de 50 y 125 ms (−0,8 y −0,7 dB de media) y con 2,8 dB más de cola en 250 ms. La minigun, el
  láser, el lanzallamas y los lanzagranadas siguen sintetizados, y donde no se cargó `js/sonidos-armas.js` (la VR)
  suenan los sintetizados de antes.
- **Explosiones**: el cuerpo es una explosión grabada (Michel Baradari, CC BY 3.0) con otra sólo de graves por
  debajo (untamedpixels, CC0), cada vez distintas y a otra velocidad, más la presión, el retumbo y la tierra que cae
  sintetizados. Respecto de un tiro de AK pasaron de −6,6 / −6,2 / −1,6 dB (125, 250 y 500 ms) a −1,7 / +1,5 / +4,4,
  con 31 dB más de graves (bajo 120 Hz) en el primer segundo.
- **Sacar un arma** (elegirla del inventario en el campo de pruebas o el entrenamiento, juntarla de una caja o cambiar
  de arma con las teclas; `Audio_.sacarArma`): foley grabado, no el tintineo de antes. Las largas salen de la espalda
  (la correa corre por la ropa, tira, el arma llega a las manos y el anclaje tintinea apenas), las pistolas de la
  funda, las hojas de la vaina, la granada del portagranadas; las muy pesadas, con ropa gruesa y metal grave. Sutil:
  entre −14 y −19 dB respecto de un tiro (una recarga queda en −2). El machete del cazador sale en silencio, con su
  susurro. La munición de una caja suena a bolsa y balas sueltas.
- **Granada de mano** (foley grabado): tomarla del portagranadas, el pasador (el dedo engancha la anilla, el pasador
  sale raspando de la espoleta y la anilla queda suelta; −7,5 dB respecto de un tiro) y, al soltarla, la cuchara que
  salta con el resorte. Antes eran tonos de metal sintetizados.

## Estructura

```
index.html        pantallas (menú, misiones, controles, juego)
css/estilos.css   interfaz
js/config.js      configuración guardada (volúmenes, idioma, calidad, táctiles, vibración)
js/idioma.js      textos en español, portugués e inglés, y t('clave') para usarlos
js/audio.js       sonidos con WebAudio: reproduce las grabaciones (disparos, mecanismos, foley) y sintetiza el resto
js/musica.js      música de cada escenario, tocada en vivo por capas según la intensidad
js/sonidos-datos.js  grabaciones de mecanismos embebidas en base64 (generado desde sonidos/)
js/sonidos-ambiente.js  zombies, pasos, impactos y voz embebidos en base64 (generado desde sonidos/ambiente/)
js/sonidos-armas.js  disparos, explosiones y foley en MP3, embebidos en base64 (generado desde sonidos/armas/)
sonidos/          recortes de las grabaciones reales (WAV; los de armas/, MP3) y sus créditos
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
js/escenario-nieve.js    bosque nevado: cielo de invierno, cordilleras, pinos nevados, camino, colinas, objetos y nevada
js/jugador.js     jugador, inventario, disparo, recarga por fases
js/jugador-dibujo.js  cuerpo del jugador con los brazos siguiendo la recarga
js/skins.js       personajes elegibles: colores, capa, torso y cabeza de cada uno
js/zombie.js      zombie (verde, camiseta azul manchada, pantalón marrón roto)
js/zombie-toxico.js  zombie tóxico de la cloaca, escupitajo de ácido y charco
js/zombie-congelado.js  zombie congelado del bosque nevado y su bloque de hielo
js/bunker.js            pelea infinita: distancia, búnkeres cada vez más lejos, comerciante, mejoras y botiquines
js/equipables.js        bípode, mira y silenciador que se compran en el búnker (dibujo, efectos y ventana)
js/tutorial.js          tutorial guiado de lo básico
js/armas-modelos-2.js  las 20 armas nuevas (fuego, cuerpo a cuerpo y legendarias)
js/armas-modelos-3.js  rediseño realista de las armas de fuego (medidas reales, estrías, cuadrillé, rieles, miras)
js/poderes.js     golpe cuerpo a cuerpo y poderes de las legendarias (rayo, onda, ola, armas que vuelven)
js/objetos.js     proyectiles, explosiones, cajas, ametralladora fija, partículas, casquillos
js/juego.js       partida: rondas, aparición de enemigos y cajas, HUD
js/interfaz.js    menú, teclado, pausa, fin de partida
js/tactil.js      controles en pantalla para celulares y tablets
```

Para depurar desde la consola del navegador: `ZonaMuerta.juego()` devuelve la partida en curso.
