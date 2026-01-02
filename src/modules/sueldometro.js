/***********************
 * TABLA DE PRIMAS
 ***********************/
const PRIMA_TABLE = {
  "02-08": {
    "Laborable": { lt120: 0.901, gte120: 0.966 },
    "Festivo": { lt120: 1.309, gte120: 1.405 },
    "Festivo a Laborable": { lt120: 0.901, gte120: 0.966 },
    "Festivo a Festivo": { lt120: 1.309, gte120: 1.405 }
  },
  "08-14": {
    "Laborable": { lt120: 0.374, gte120: 0.612 },
    "Sábado": { lt120: 0.374, gte120: 0.612 },
    "Festivo": { lt120: 0.674, gte120: 0.786 }
  },
  "14-20": {
    "Laborable": { lt120: 0.374, gte120: 0.612 },
    "Sábado": { lt120: 0.674, gte120: 0.786 },
    "Festivo": { lt120: 0.933, gte120: 1.0 }
  },
  "20-02": {
    "Laborable": { lt120: 0.554, gte120: 0.774 },
    "Laborable a Festivo": { lt120: 0.554, gte120: 0.774 },
    "Sábado": { lt120: 0.974, gte120: 1.045 },
    "Festivo a Laborable": { lt120: 1.414, gte120: 1.517 },
    "Festivo a Festivo": { lt120: 1.414, gte120: 1.517 }
  }
};

/***********************
 * CALCULAR PRIMA
 ***********************/
function calcularPrima(jornada, tipoDia, movimientos) {
  if (!jornada || !tipoDia || !movimientos) return 0;

  const tablaJornada = PRIMA_TABLE[jornada];
  if (!tablaJornada) return 0;

  const tablaTipo = tablaJornada[tipoDia];
  if (!tablaTipo) return 0;

  const coef = movimientos < 120 ? tablaTipo.lt120 : tablaTipo.gte120;
  return +(coef * movimientos).toFixed(2);
}

/***********************
 * HOOK FORMULARIO
 ***********************/
function activarCalculoPrimaAutomatico() {
  const jornadaEl = document.querySelector('#jornada');
  const tipoDiaEl = document.querySelector('#tipoDia');
  const movimientosEl = document.querySelector('#movimientos');
  const primaEl = document.querySelector('#prima');

  if (!jornadaEl || !tipoDiaEl || !movimientosEl || !primaEl) return;

  function recalcular() {
    const jornada = jornadaEl.value;
    const tipoDia = tipoDiaEl.value;
    const movimientos = parseInt(movimientosEl.value, 10) || 0;

    const prima = calcularPrima(jornada, tipoDia, movimientos);
    primaEl.value = prima.toFixed(2);
  }

  jornadaEl.addEventListener('change', recalcular);
  tipoDiaEl.addEventListener('change', recalcular);
  movimientosEl.addEventListener('input', recalcular);
}

/***********************
 * INTEGRACIÓN SEGURA
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
  activarCalculoPrimaAutomatico();
});
