
// ================================
// SUELDOMETRO CON PRIMA AUTOMÁTICA
// ================================

const STORAGE_KEY = 'sueldometro_v12';

const PRIMAS = {
  "02-08": {
    LABORABLE: { lt120: 0.901, gte120: 0.966 },
    FESTIVO: { lt120: 1.309, gte120: 1.405 }
  },
  "08-14": {
    LABORABLE: { lt120: 0.374, gte120: 0.612 },
    SABADO: { lt120: 0.374, gte120: 0.612 },
    FESTIVO: { lt120: 0.674, gte120: 0.786 }
  },
  "14-20": {
    LABORABLE: { lt120: 0.374, gte120: 0.612 },
    SABADO: { lt120: 0.674, gte120: 0.786 },
    FESTIVO: { lt120: 0.933, gte120: 1.000 }
  },
  "20-02": {
    LABORABLE: { lt120: 0.554, gte120: 0.774 },
    SABADO: { lt120: 0.974, gte120: 1.045 },
    FESTIVO: { lt120: 1.414, gte120: 1.517 },
    FEST_A_LAB: { lt120: 1.414, gte120: 1.517 },
    LAB_A_FEST: { lt120: 0.554, gte120: 0.774 },
    FEST_A_FEST: { lt120: 1.414, gte120: 1.517 }
  }
};

function calcularPrima(jornada, tipoDia, movimientos) {
  if (!movimientos || movimientos <= 0) return 0;
  const fila = PRIMAS[jornada]?.[tipoDia];
  if (!fila) return 0;
  const coef = movimientos < 120 ? fila.lt120 : fila.gte120;
  return +(coef * movimientos).toFixed(2);
}

function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"jornales":[]}');
}
function save(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function addJornal(data) {
  const state = load();
  const prima = calcularPrima(data.jornada, data.tipoDia, data.movimientos);
  const bruto = data.base + prima;
  const neto = bruto * (1 - data.irpf / 100);

  state.jornales.push({
    id: crypto.randomUUID(),
    ...data,
    prima,
    bruto,
    neto
  });

  save(state);
}
