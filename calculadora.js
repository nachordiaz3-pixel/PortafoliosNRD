/* ==========================================================
   Calculadora - lógica
   Operaciones: suma, resta, multiplicación, división,
   potencia, raíz cuadrada, porcentaje y cambio de signo.
   No se usa eval(): el cálculo se hace con funciones propias.
   ========================================================== */

(() => {
  'use strict';

  const MAX_DIGITOS = 15;

  const SIMBOLOS = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };

  const OPERACIONES = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '^': (a, b) => Math.pow(a, b),
  };

  // Elementos del DOM
  const pantallaActual = document.getElementById('pantalla-actual');
  const pantallaHistorial = document.getElementById('pantalla-historial');
  const teclado = document.getElementById('teclado');

  // Estado de la calculadora
  let actual = '0';          // número que se está escribiendo (como texto)
  let anterior = null;       // primer operando guardado
  let operador = null;       // operador pendiente
  let reiniciar = false;     // true si el próximo dígito empieza un número nuevo
  let error = null;          // mensaje de error, si lo hay
  let ultimaOperacion = '';  // texto de la última operación resuelta

  /* ---------- Utilidades ---------- */

  // Redondea para evitar errores de coma flotante (0.1 + 0.2 -> 0.3)
  function formatear(numero) {
    return String(parseFloat(numero.toPrecision(12)));
  }

  function aVisible(texto) {
    return texto.replace('.', ',');
  }

  function mostrarError(mensaje) {
    error = mensaje;
    actual = '0';
    anterior = null;
    operador = null;
    reiniciar = true;
    ultimaOperacion = '';
  }

  function actualizarPantalla() {
    if (error) {
      pantallaActual.textContent = error;
      pantallaActual.classList.add('error');
      pantallaActual.classList.remove('pequeno');
      pantallaHistorial.textContent = '';
      return;
    }

    const texto = aVisible(actual);
    pantallaActual.textContent = texto;
    pantallaActual.classList.remove('error');
    pantallaActual.classList.toggle('pequeno', texto.length > 11);

    if (operador !== null) {
      pantallaHistorial.textContent = `${aVisible(anterior)} ${SIMBOLOS[operador]}`;
    } else {
      pantallaHistorial.textContent = ultimaOperacion;
    }
  }

  /* ---------- Acciones ---------- */

  function limpiar() {
    actual = '0';
    anterior = null;
    operador = null;
    reiniciar = false;
    error = null;
    ultimaOperacion = '';
  }

  function introducirDigito(digito) {
    if (error) limpiar();
    if (reiniciar) {
      actual = '0';
      reiniciar = false;
      ultimaOperacion = '';
    }
    if (actual === '0') {
      actual = digito;
    } else if (actual.replace(/[-.]/g, '').length < MAX_DIGITOS) {
      actual += digito;
    }
  }

  function introducirDecimal() {
    if (error) limpiar();
    if (reiniciar) {
      actual = '0';
      reiniciar = false;
      ultimaOperacion = '';
    }
    if (!actual.includes('.')) actual += '.';
  }

  function borrarUltimo() {
    if (error) return limpiar();
    if (reiniciar) return;
    actual = actual.slice(0, -1);
    if (actual === '' || actual === '-') actual = '0';
  }

  function cambiarSigno() {
    if (error || actual === '0') return;
    actual = actual.startsWith('-') ? actual.slice(1) : '-' + actual;
  }

  // Resuelve anterior (operador) actual. Devuelve el resultado o null si hay error.
  function calcular() {
    const a = parseFloat(anterior);
    const b = parseFloat(actual);

    if (operador === '/' && b === 0) {
      mostrarError('No se puede dividir entre 0');
      return null;
    }

    const resultado = OPERACIONES[operador](a, b);

    if (!Number.isFinite(resultado)) {
      mostrarError('Resultado no válido');
      return null;
    }
    return formatear(resultado);
  }

  function elegirOperador(op) {
    if (error) return;

    // Si ya había una operación pendiente con un segundo número, se resuelve primero
    if (operador !== null && !reiniciar) {
      const resultado = calcular();
      if (resultado === null) return;
      actual = resultado;
    }

    anterior = actual;
    operador = op;
    reiniciar = true;
    ultimaOperacion = '';
  }

  function igual() {
    if (error || operador === null) return;

    const expresion = `${aVisible(anterior)} ${SIMBOLOS[operador]} ${aVisible(actual)} =`;
    const resultado = calcular();
    if (resultado === null) return;

    actual = resultado;
    anterior = null;
    operador = null;
    reiniciar = true;
    ultimaOperacion = expresion;
  }

  function raizCuadrada() {
    if (error) return;
    const n = parseFloat(actual);
    if (n < 0) {
      mostrarError('Raíz de un número negativo');
      return;
    }
    ultimaOperacion = `√(${aVisible(actual)}) =`;
    actual = formatear(Math.sqrt(n));
    reiniciar = true;
  }

  function porcentaje() {
    if (error) return;
    const n = parseFloat(actual);
    if (operador !== null && anterior !== null && ['+', '-'].includes(operador)) {
      // 200 + 10 %  ->  10 % de 200 = 20
      actual = formatear((parseFloat(anterior) * n) / 100);
    } else {
      actual = formatear(n / 100);
    }
  }

  /* ---------- Despacho de eventos ---------- */

  function ejecutar(tipo, valor) {
    if (tipo === 'num') {
      introducirDigito(valor);
    } else if (tipo === 'op') {
      elegirOperador(valor);
    } else if (tipo === 'accion') {
      switch (valor) {
        case 'decimal':    introducirDecimal(); break;
        case 'igual':      igual(); break;
        case 'borrar':     borrarUltimo(); break;
        case 'limpiar':    limpiar(); break;
        case 'signo':      cambiarSigno(); break;
        case 'raiz':       raizCuadrada(); break;
        case 'porcentaje': porcentaje(); break;
      }
    }
    actualizarPantalla();
  }

  // Clic en los botones
  teclado.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button');
    if (!boton) return;
    ejecutar(boton.dataset.tipo, boton.dataset.valor);
  });

  // Soporte de teclado físico
  function traducirTecla(tecla) {
    if (/^[0-9]$/.test(tecla)) return ['num', tecla];
    if (['+', '-', '*', '/', '^'].includes(tecla)) return ['op', tecla];
    if (tecla === '.' || tecla === ',') return ['accion', 'decimal'];
    if (tecla === 'Enter' || tecla === '=') return ['accion', 'igual'];
    if (tecla === 'Backspace') return ['accion', 'borrar'];
    if (tecla === 'Escape' || tecla === 'Delete') return ['accion', 'limpiar'];
    if (tecla === '%') return ['accion', 'porcentaje'];
    return null;
  }

  document.addEventListener('keydown', (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

    const accion = traducirTecla(evento.key);
    if (!accion) return;

    evento.preventDefault();
    ejecutar(accion[0], accion[1]);

    // Efecto visual en el botón correspondiente
    const boton = teclado.querySelector(
      `[data-tipo="${accion[0]}"][data-valor="${accion[1]}"]`
    );
    if (boton) {
      boton.classList.add('activo');
      setTimeout(() => boton.classList.remove('activo'), 120);
    }
  });

  actualizarPantalla();
})();
