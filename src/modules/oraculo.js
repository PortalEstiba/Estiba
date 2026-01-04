// src/modules/oraculo.js

/* ======================================================
   ORÁCULO – VERSIÓN ESTABLE Y LIMPIA
   ====================================================== */

/* =========================
   ESTADO GLOBAL ÚNICO
   ========================= */
const OracleState = {
  chapa: null,
  posicion: null,
  fijos: 0,
  demandas: null,
  censo: null,
  puertas: null,
  listo: false
};

/* =========================
   GOOGLE SHEETS API
   ========================= */
window.SheetsAPI = {
  async getCenso() {
    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTrMuapybwZUEGPR1vsP9p1_nlWvznyl0sPD4xWsNJ7HdXCj1ABY1EpU1um538HHZQyJtoAe5Niwrxq/pubhtml?gid=841547354&single=true&output=csv';
    const csv = await fetch(url).then(r => r.text());
    return parseCensoCSV(csv);
  },

  async getPuertas() {
    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrQ5bGZDNShEWi1lwx_l1EvOxC0si5kbN8GBxj34rF0FkyGVk6IZOiGk5D91_TZXBHO1mchydFvvUl/pubhtml?gid=3770623&single=true&output=csv';
    const csv = await fetch(url).then(r => r.text());
    return parsePuertasCSV(csv);
  },

  async getPosicionChapa(chapa) {
    const censo = await this.getCenso();
    const fila = censo.find(f => f.chapa === Number(chapa));
    return fila ? fila.posicion : null;
  }
};

/* =========================
   PARSERS CSV
   ========================= */
function parseCensoCSV(csv) {
  return csv
    .split('\n')
    .slice(1)
    .map(l => {
      const [pos, chapa, color] = l.split(',');
      if (!pos || !chapa) return null;
      return {
        posicion: Number(pos),
        chapa: Number(chapa),
        color: (color || '').trim().toLowerCase()
      };
    })
    .filter(Boolean);
}

function parsePuertasCSV(csv) {
  return {
    puertas: csv
      .split('\n')
      .slice(1)
      .map(l => {
        const [jornada, sp, oc] = l.split(',');
        if (!jornada) return null;
        return {
          jornada: jornada.trim(),
          puertaSP: sp?.trim(),
          puertaOC: oc?.trim()
        };
      })
      .filter(Boolean)
  };
}

/* =========================
   UI – RENDER
   ========================= */
const Oraculo = {
  render(container) {
    container.innerHTML = `
      <div class="card">
        <h2>🔮 El Oráculo</h2>

        <label>Número de chapa</label>
        <input id="oracle-chapa" type="number" placeholder="Ej: 155">

        <button id="oracle-start" class="primary" style="margin-top:12px">
          Iniciar oráculo
        </button>

        <p id="oracle-status" class="muted" style="margin-top:10px"></p>

        <div id="oracle-data" style="display:none;margin-top:14px">
          <div class="row"><b>Fijos:</b> <span id="oracle-fijos">–</span></div>
          <div class="row"><b>08-14:</b> <span id="d-0814">–</span></div>
          <div class="row"><b>14-20:</b> <span id="d-1420">–</span></div>
          <div class="row"><b>20-02:</b> <span id="d-2002">–</span></div>
        </div>

        <button id="btn-calcular" class="primary" style="display:none;margin-top:14px">
          ¿Cuándo voy a trabajar?
        </button>

        <div id="calc-resultado" style="margin-top:14px"></div>
      </div>
    `;

    this.bind();
  },

  bind() {
    document.getElementById('oracle-start').onclick = startOracle;
    document.getElementById('btn-calcular').onclick = calcularResultado;
  }
};

/* =========================
   INICIO ORÁCULO
   ========================= */
async function startOracle() {
  const chapa = Number(document.getElementById('oracle-chapa').value);
  const status = document.getElementById('oracle-status');

  if (!chapa) {
    status.textContent = '⚠️ Introduce una chapa válida';
    return;
  }

  status.textContent = '🔄 Cargando previsión...';
  OracleState.chapa = chapa;

  try {
    OracleState.posicion = await SheetsAPI.getPosicionChapa(chapa);
    OracleState.censo = await SheetsAPI.getCenso();
    OracleState.puertas = (await SheetsAPI.getPuertas()).puertas;

    const prev = await fetch(
      'https://noray-scraper.onrender.com/api/prevision?t=' + Date.now()
    ).then(r => r.json());

    const fij = await fetch(
      'https://noray-scraper.onrender.com/api/chapero?t=' + Date.now()
    ).then(r => r.json());

    OracleState.demandas = prev.demandas;
    OracleState.fijos = fij.fijos;

    document.getElementById('oracle-fijos').textContent = OracleState.fijos;
    document.getElementById('d-0814').textContent =
      `${prev.demandas['08-14'].gruas}g / ${prev.demandas['08-14'].coches}c`;
    document.getElementById('d-1420').textContent =
      `${prev.demandas['14-20'].gruas}g / ${prev.demandas['14-20'].coches}c`;
    document.getElementById('d-2002').textContent =
      `${prev.demandas['20-02'].gruas}g / ${prev.demandas['20-02'].coches}c`;

    document.getElementById('oracle-data').style.display = 'block';
    document.getElementById('btn-calcular').style.display = 'block';

    OracleState.listo = true;
    status.textContent = '✅ Datos cargados correctamente';

  } catch (e) {
    console.error(e);
    status.textContent = '❌ Error cargando datos';
  }
}

/* =========================
   CÁLCULO FINAL
   ========================= */
function calcularResultado() {
  if (!OracleState.listo) return;

  const resultado = document.getElementById('calc-resultado');

  const LIMITE_SP = 455;
  const esOC = OracleState.posicion > LIMITE_SP;

  const puertaData = OracleState.puertas.find(p => p.jornada === '08-14');
  const puerta = Number(esOC ? puertaData.puertaOC : puertaData.puertaSP) || 0;

  const demanda =
    OracleState.demandas['08-14'].gruas * 7 +
    OracleState.demandas['08-14'].coches -
    Math.floor(OracleState.fijos / 2);

  const distancia = OracleState.posicion >= puerta
    ? OracleState.posicion - puerta
    : (esOC ? 519 : LIMITE_SP) - puerta + OracleState.posicion;

  let mensaje = 'Difícil';
  let clase = 'danger';

  if (demanda >= distancia) {
    mensaje = 'Calienta que sales';
    clase = 'green';
  } else if (demanda >= distancia * 0.7) {
    mensaje = 'Va a estar justo';
    clase = 'orange';
  }

  resultado.innerHTML = `
    <div class="card ${clase}">
      <b>${mensaje}</b><br>
      Distancia: ${distancia}<br>
      Demanda: ${demanda}
    </div>
  `;
}

/* =========================
   AUTO INIT
   ========================= */
window.Oraculo = Oraculo;
