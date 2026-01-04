// src/modules/oraculo.js


// ================================
// ESTADO GLOBAL DEL ORÁCULO
// ================================
const OracleState = {
  chapa: null,
  posicion: null,
  fijos: null,
  demandas: null,
  censo: null,
  puertas: null,
  listo: false
};

const SheetsAPI = {
  async getCenso() {
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTrMuapybwZUEGPR1vsP9p1_nlWvznyl0sPD4xWsNJ7HdXCj1ABY1EpU1um538HHZQyJtoAe5Niwrxq/pubhtml?gid=841547354&single=true&output=csv';
    const csv = await fetch(url).then(r => r.text());
    return parseCensoCSV(csv);
  },

  async getPuertas() {
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrQ5bGZDNShEWi1lwx_l1EvOxC0si5kbN8GBxj34rF0FkyGVk6IZOiGk5D91_TZXBHO1mchydFvvUl/pubhtml?gid=3770623&single=true&output=csv';
    const csv = await fetch(url).then(r => r.text());
    return parsePuertasCSV(csv);
  },

  async getPosicionChapa(chapa) {
    const censo = await this.getCenso();
    const fila = censo.find(p => p.chapa === Number(chapa));
    return fila ? fila.posicion : null;
  }
};

function parseCensoCSV(csv) {
  return csv.split('\n').slice(1).map(line => {
    const [posicion, chapa, color] = line.split(',');
    if (!posicion || !chapa) return null;
    return {
      posicion: Number(posicion),
      chapa: Number(chapa),
      color: (color || '').trim().toLowerCase()
    };
  }).filter(Boolean);
}

function parsePuertasCSV(csv) {
  return {
    puertas: csv.split('\n').slice(1).map(line => {
      const [jornada, puertaSP, puertaOC] = line.split(',');
      return {
        jornada: jornada?.trim(),
        puertaSP: Number(puertaSP),
        puertaOC: Number(puertaOC)
      };
    }).filter(p => p.jornada)
  };
}

// ================================
// COMPONENTE ORÁCULO
// ================================
const Oraculo = {
  render(container) {
    container.innerHTML = `
      <div class="card">
        <h2>🔮 El Oráculo</h2>
        <p class="muted">Calculadora predictiva de jornadas</p>

        <label>Tu número de chapa</label>
        <input id="oracle-chapa" type="number" placeholder="Ej: 155">

        <button id="oracle-start" class="primary">
          Iniciar Oráculo
        </button>

        <div id="oracle-status" class="muted" style="margin-top:10px;"></div>

        <div id="oracle-data" style="display:none; margin-top:16px;">
          <div class="card">
            <strong>Fijos disponibles:</strong>
            <span id="oracle-fijos">—</span>
          </div>

          <div class="grid-3">
            <div class="card">🌅 08-14<br><span id="d-0814">—</span></div>
            <div class="card">🌆 14-20<br><span id="d-1420">—</span></div>
            <div class="card">🌙 20-02<br><span id="d-2002">—</span></div>
          </div>

          <button id="oracle-calc" class="primary" style="margin-top:16px;">
            ¿Cuándo voy a trabajar?
          </button>

          <div id="oracle-result" style="margin-top:16px;"></div>
        </div>
      </div>
    `;

    this.bind();
  },

  bind() {
    document.getElementById('oracle-start')
      .addEventListener('click', this.start);

    document.getElementById('oracle-calc')
      .addEventListener('click', this.calculate);
  },

  async start() {
    const chapa = parseInt(document.getElementById('oracle-chapa').value);
    const status = document.getElementById('oracle-status');

    if (!chapa) {
      status.textContent = '⚠️ Introduce una chapa válida';
      return;
    }

    OracleState.chapa = chapa;
    status.textContent = '🔄 Cargando datos…';

    try {
      // 1️⃣ CENSO
      OracleState.censo = await SheetsAPI.getCenso();
      OracleState.posicion = await SheetsAPI.getPosicionChapa(chapa);

      // 2️⃣ PUERTAS
      OracleState.puertas = (await SheetsAPI.getPuertas()).puertas;

      // 3️⃣ PREVISIÓN
      const prevRes = await fetch(
        'https://noray-scraper.onrender.com/api/prevision'
      ).then(r => r.json());

      OracleState.demandas = prevRes.demandas;

      // 4️⃣ FIJOS
      const fijosRes = await fetch(
        'https://noray-scraper.onrender.com/api/chapero'
      ).then(r => r.json());

      OracleState.fijos = fijosRes.fijos;

      // 5️⃣ PINTAR DATOS
      document.getElementById('oracle-fijos').textContent = OracleState.fijos;
      document.getElementById('d-0814').textContent =
        OracleState.demandas['08-14'].gruas + 'g / ' +
        OracleState.demandas['08-14'].coches + 'c';

      document.getElementById('d-1420').textContent =
        OracleState.demandas['14-20'].gruas + 'g / ' +
        OracleState.demandas['14-20'].coches + 'c';

      document.getElementById('d-2002').textContent =
        OracleState.demandas['20-02'].gruas + 'g / ' +
        OracleState.demandas['20-02'].coches + 'c';

      document.getElementById('oracle-data').style.display = 'block';
      status.textContent = '✅ Datos cargados';
      OracleState.listo = true;

    } catch (e) {
      console.error(e);
      status.textContent = '❌ Error cargando datos';
    }
  },

  calculate() {
  if (!OracleState.listo) return;

  const resultadoDiv = document.getElementById('oracle-result');
  resultadoDiv.innerHTML = '';

  // ===============================
  // CONFIGURACIÓN GENERAL
  // ===============================
  const LIMITE_SP = 455;
  const INICIO_OC = 456;
  const FIN_OC = 519;

  const FACTOR_SEGUNDA_VUELTA = 2.0;

  const posicionUsuario = OracleState.posicion;
  const censo = OracleState.censo;
  const puertas = OracleState.puertas;
  const demandas = OracleState.demandas;
  const fijos = OracleState.fijos;

  const esOC = posicionUsuario > LIMITE_SP;

  const censoActivo = esOC
    ? censo.filter(p => p.posicion >= INICIO_OC)
    : censo.filter(p => p.posicion <= LIMITE_SP);

  const limiteInicio = esOC ? INICIO_OC : 1;
  const limiteFin = esOC ? FIN_OC : LIMITE_SP;

  // ===============================
  // UTILIDADES DE DISPONIBILIDAD
  // ===============================
  function pesoDisponibilidad(pos) {
    const p = censoActivo.find(c => c.posicion === pos);
    if (!p) return 0;
    switch (p.color) {
      case 'green': return 1;
      case 'blue': return 0.75;
      case 'yellow': return 0.5;
      case 'orange': return 0.25;
      default: return 0;
    }
  }

  function contarDisponibles(desde, hasta) {
    let total = 0;

    if (desde < hasta) {
      for (let i = desde + 1; i <= hasta; i++) {
        total += pesoDisponibilidad(i);
      }
    } else {
      for (let i = desde + 1; i <= limiteFin; i++) {
        total += pesoDisponibilidad(i);
      }
      for (let i = limiteInicio; i <= hasta; i++) {
        total += pesoDisponibilidad(i);
      }
    }

    return total;
  }

  // ===============================
  // DETECTAR SIGUIENTE JORNADA
  // ===============================
  function detectarSiguienteJornada() {
    const orden = ['02-08', '08-14', '14-20', '20-02'];
    let siguiente = '02-08';

    orden.forEach(j => {
      const p = puertas.find(x => x.jornada === j);
      if (!p) return;

      const puerta = esOC ? p.puertaOC : p.puertaSP;
      if (puerta && puerta > 0) siguiente = j;
    });

    return siguiente;
  }

  const siguienteJornada = detectarSiguienteJornada();

  // ===============================
  // CONFIGURACIÓN DE JORNADAS
  // ===============================
  const jornadasOrden = ['08-14', '14-20', '20-02'];

  const jornadasActivas = jornadasOrden.map(j => {
    let demanda = 0;

    if (esOC) {
      demanda = 15;
    } else {
      const d = demandas[j];
      demanda = d ? (d.gruas * 7 + d.coches) : 0;
    }

    return { codigo: j, demanda };
  });

  // ===============================
  // SIMULACIÓN DE CONTRATACIÓN
  // ===============================
  let puertaActual = (() => {
    const p = puertas.find(x => x.jornada === siguienteJornada);
    return p ? (esOC ? p.puertaOC : p.puertaSP) : limiteInicio;
  })();

  let resultados = [];

  jornadasActivas.forEach((jornada, index) => {
    if (jornada.demanda === 0) {
      resultados.push({
        jornada: jornada.codigo,
        prob: 0,
        mensaje: 'Sin contratación'
      });
      return;
    }

    let demandaEventuales = jornada.demanda;

    if (!esOC && index === 0) {
      demandaEventuales = Math.max(0, jornada.demanda - Math.floor(fijos / 2));
    }

    const distancia = contarDisponibles(puertaActual, posicionUsuario);
    const ratio = demandaEventuales / Math.max(1, distancia);

    let probBase = 0;

    if (ratio >= 1) {
      probBase = 0.85;
    } else if (ratio >= 0.7) {
      probBase = 0.6;
    } else if (ratio >= 0.4) {
      probBase = 0.4;
    } else if (ratio >= 0.2) {
      probBase = 0.25;
    } else {
      probBase = 0.1;
    }

    resultados.push({
      jornada: jornada.codigo,
      prob: probBase,
      distancia: Math.round(distancia),
      demanda: demandaEventuales
    });

    puertaActual = posicionUsuario;
  });

  // ===============================
  // NORMALIZAR PROBABILIDADES
  // ===============================
  const suma = resultados.reduce((a, b) => a + b.prob, 0) || 1;

  resultados = resultados.map(r => ({
    ...r,
    prob: Math.round((r.prob / suma) * 100)
  }));

  // ===============================
  // PINTAR RESULTADO
  // ===============================
  resultadoDiv.innerHTML = resultados.map(r => {
    let clase = 'probability-low';
    let texto = 'Difícil';

    if (r.prob >= 80) {
      clase = 'probability-very-high';
      texto = 'Calienta que sales';
    } else if (r.prob >= 60) {
      clase = 'probability-high';
      texto = 'Bastante probable';
    } else if (r.prob >= 40) {
      clase = 'probability-medium';
      texto = 'Va a estar justo';
    }

    return `
      <div class="calc-resultado-item ${clase}">
        <div class="resultado-header">
          <span class="resultado-jornada">${r.jornada}</span>
          <span class="resultado-percent">${r.prob}%</span>
        </div>
        <div class="resultado-mensaje">${texto}</div>
        <div class="resultado-detalle">
          Demanda: ${r.demanda ?? '-'} · Faltan: ${r.distancia ?? '-'}
        </div>
      </div>
    `;
  }).join('');
}

export default Oraculo;

