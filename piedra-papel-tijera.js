/* ==========================================================
   Piedra, papel o tijera - lógica
   ========================================================== */

const OPCIONES = ['piedra', 'papel', 'tijera'];

const ICONOS = { piedra: '✊', papel: '✋', tijera: '✌️' };

const NOMBRES = { piedra: 'Piedra', papel: 'Papel', tijera: 'Tijera' };

// Cada jugada vence a la que tiene asociada
const VENCE_A = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };

// Elección aleatoria del ordenador
function eleccionOrdenador() {
  return OPCIONES[Math.floor(Math.random() * OPCIONES.length)];
}

// Devuelve 'victoria', 'derrota' o 'empate' desde el punto de vista del jugador
function resolver(jugador, ordenador) {
  if (jugador === ordenador) return 'empate';
  return VENCE_A[jugador] === ordenador ? 'victoria' : 'derrota';
}

/* ---------- Interfaz (solo se ejecuta en el navegador) ---------- */
if (typeof document !== 'undefined') {
  const TIEMPO_SUSPENSE = 700; // ms que "piensa" el ordenador
  const MAX_HISTORIAL = 20;

  const botones = document.querySelectorAll('.opcion');
  const manoJugador = document.getElementById('eleccion-jugador');
  const manoPC = document.getElementById('eleccion-pc');
  const textoResultado = document.getElementById('resultado');
  const listaHistorial = document.getElementById('historial');
  const botonReiniciar = document.getElementById('reiniciar');

  const marcadores = {
    victoria: document.getElementById('marcador-jugador'),
    empate: document.getElementById('marcador-empates'),
    derrota: document.getElementById('marcador-pc'),
  };

  const MENSAJES = {
    victoria: '¡Has ganado!',
    derrota: 'Has perdido',
    empate: 'Empate',
  };

  let puntos = { victoria: 0, empate: 0, derrota: 0 };
  let ronda = 0;
  let jugando = false;

  function bloquearBotones(bloquear) {
    botones.forEach((b) => (b.disabled = bloquear));
  }

  function limpiarEstadoManos() {
    [manoJugador, manoPC].forEach((m) =>
      m.classList.remove('ganadora', 'perdedora', 'empatada', 'pensando')
    );
  }

  function mostrarResultado(jugador, ordenador, resultado) {
    manoJugador.textContent = ICONOS[jugador];
    manoPC.textContent = ICONOS[ordenador];
    manoPC.classList.remove('pensando');

    if (resultado === 'victoria') {
      manoJugador.classList.add('ganadora');
      manoPC.classList.add('perdedora');
    } else if (resultado === 'derrota') {
      manoPC.classList.add('ganadora');
      manoJugador.classList.add('perdedora');
    } else {
      manoJugador.classList.add('empatada');
      manoPC.classList.add('empatada');
    }

    textoResultado.className = `resultado ${resultado}`;
    textoResultado.textContent = `${MENSAJES[resultado]} · ${NOMBRES[jugador]} vs ${NOMBRES[ordenador]}`;
  }

  function actualizarMarcador(resultado) {
    puntos[resultado]++;
    const caja = marcadores[resultado];
    caja.textContent = puntos[resultado];
    caja.classList.remove('sube');
    void caja.offsetWidth; // reinicia la animación
    caja.classList.add('sube');
  }

  function anadirAlHistorial(jugador, ordenador, resultado) {
    const vacio = listaHistorial.querySelector('.historial__vacio');
    if (vacio) vacio.remove();

    const item = document.createElement('li');
    item.className = resultado;

    const jugada = document.createElement('span');
    jugada.textContent = `Ronda ${ronda}: ${ICONOS[jugador]} vs ${ICONOS[ordenador]}`;

    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta-resultado';
    etiqueta.textContent = MENSAJES[resultado].replace(/[¡!]/g, '').toUpperCase();

    item.append(jugada, etiqueta);
    listaHistorial.prepend(item);

    while (listaHistorial.children.length > MAX_HISTORIAL) {
      listaHistorial.lastElementChild.remove();
    }
  }

  function jugarRonda(eleccionJugador) {
    if (jugando) return;
    jugando = true;
    bloquearBotones(true);
    limpiarEstadoManos();

    textoResultado.className = 'resultado';
    textoResultado.textContent = 'El ordenador está eligiendo…';
    manoJugador.textContent = ICONOS[eleccionJugador];
    manoPC.textContent = '❔';
    manoPC.classList.add('pensando');

    const eleccionPC = eleccionOrdenador();

    setTimeout(() => {
      const resultado = resolver(eleccionJugador, eleccionPC);
      ronda++;
      mostrarResultado(eleccionJugador, eleccionPC, resultado);
      actualizarMarcador(resultado);
      anadirAlHistorial(eleccionJugador, eleccionPC, resultado);
      bloquearBotones(false);
      jugando = false;
    }, TIEMPO_SUSPENSE);
  }

  function reiniciarPartida() {
    if (jugando) return;
    puntos = { victoria: 0, empate: 0, derrota: 0 };
    ronda = 0;
    Object.values(marcadores).forEach((m) => (m.textContent = '0'));
    limpiarEstadoManos();
    manoJugador.textContent = '?';
    manoPC.textContent = '?';
    textoResultado.className = 'resultado';
    textoResultado.textContent = 'Elige una opción para empezar';
    listaHistorial.innerHTML =
      '<li class="historial__vacio">Todavía no has jugado ninguna ronda.</li>';
  }

  botones.forEach((boton) =>
    boton.addEventListener('click', () => jugarRonda(boton.dataset.eleccion))
  );
  botonReiniciar.addEventListener('click', reiniciarPartida);

  // Atajos de teclado: P = piedra, A = papel, T = tijera
  const ATAJOS = { p: 'piedra', a: 'papel', t: 'tijera', 1: 'piedra', 2: 'papel', 3: 'tijera' };
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const eleccion = ATAJOS[e.key.toLowerCase()];
    if (eleccion) jugarRonda(eleccion);
  });
}

// Permite probar la lógica con Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OPCIONES, eleccionOrdenador, resolver };
}
