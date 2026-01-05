/* ======================================================
   ORÁCULO – PORTAL ESTIBA (VERSIÓN ESTABLE)
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
  cargado: false
};

/* =========================
   UTILIDADES
   ========================= */
function $(id) {
  return document.getElementById(id);
}

/* =========================
   GOOGLE SHEETS – FETCH
   ========================= */
const SheetsAPI = {
  async getCSV(url) {
    const res = await fetch(url);
    return res.text();
  },

  async getCenso() {
    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTrMuapybwZUEGPR1vsP9p1_nlWvznyl0sPD4xWsNJ7HdXCj1ABY1EpU1um538HHZQyJtoAe5Niwrxq/pubhtml?gid=841547354&single=true&output=csv';
    const csv = await this.getCSV(url);
    return parseCenso(csv);
  },

  async getPuertas() {
    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrQ5bGZDNShEWi1lwx_l1EvOxC0si5kbN8GBxj34rF0FkyGVk6IZOiGk5D91_TZXBHO1mchydFvvUl/pubhtml?gid=3770623&single=true&output=csv';
    const csv = await this.getCSV(url);
    return parsePuertas(csv);
  }
};

/* =========================
   PARSEADORES CSV
   ========================= */
function parseCenso(csv) {
  return csv
    .split('\n')
    .slice(1)
    .map(line => {
      if (!line.trim()) return null;

      // Detectar separador automáticamente
      const sep = line.includes(';') ? ';' : ',';
      const cols = line.split(sep).map(c => c.trim());

      // Ajusta índices si tu hoja tiene más columnas
      const posicion = Number(cols[0]);
      const chapa = Number(cols[1]);

      if (!posicion || !chapa) return null;

      return {
        posicion,
        chapa
      };
    })
    .filter(Boolean);
}

function parsePuertas(csv) {
  return csv
    .split('\n')
    .slice(1)
    .map(l => {
      const [jornada, sp, oc] = l.split(',');
      if (!jornada) return null;
      return {
        jornada: jornada.trim(),
        sp: Number(sp),
        oc: Number(oc)
      };
    })
    .filter(Boolean);
}

/* =========================
   RENDER PRINCIPAL
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
          <p><b>Fijos disponibles:</b> <span id="oracle-fijos">–</span></p>

          <p><b>Previsión:</b></p>
          <ul>
            <li>08-14: <span id="prev-0814">–</span></li>
            <li>14-20: <span id="prev-1420">–</span></li>
            <li>20-02: <span id="prev-2002">–</span></li>
          </ul>
        </div>

        <button id="btn-calcular" class="primary" style="display:none">
          ¿Cuándo voy a trabajar?
        </button>

        <div id="resultado-oraculo" style="margin-top:14px"></div>
      </div>
    `;

    this.bind();
  },

  bind() {
    $('oracle-start').onclick = iniciarOraculo;
    $('btn-calcular').onclick = calcularOraculo;
  }
};

/* =========================
   INICIO DEL ORÁCULO
   ========================= */
async function iniciarOraculo() {
  const chapa = Number($('oracle-chapa').value);
  const status = $('oracle-status');

  if (!chapa) {
    status.textContent = '⚠️ Introduce una chapa válida';
    return;
  }

  status.textContent = '🔄 Cargando datos...';

  try {
    OracleState.chapa = chapa;
    OracleState.censo = await SheetsAPI.getCenso();
    OracleState.puertas = await SheetsAPI.getPuertas();
    
    console.log('Censo cargado:', OracleState.censo.slice(0, 5));

    const fila = OracleState.censo.find(f => Number(f.chapa) === Number(chapa));
    OracleState.posicion = fila ? fila.posicion : null;

    if (!OracleState.posicion) {
      status.textContent = '❌ Chapa no encontrada en el censo';
      return;
    }

    const prevision = await fetch(
      'https://noray-scraper.onrender.com/api/prevision'
    ).then(r => r.json());

    const chapero = await fetch(
      'https://noray-scraper.onrender.com/api/chapero'
    ).then(r => r.json());

    OracleState.demandas = prevision.demandas;
    OracleState.fijos = chapero.fijos;

    $('oracle-fijos').textContent = OracleState.fijos;
    $('prev-0814').textContent =
      `${prevision.demandas['08-14'].gruas} grúas / ${prevision.demandas['08-14'].coches} coches`;
    $('prev-1420').textContent =
      `${prevision.demandas['14-20'].gruas} grúas / ${prevision.demandas['14-20'].coches} coches`;
    $('prev-2002').textContent =
      `${prevision.demandas['20-02'].gruas} grúas / ${prevision.demandas['20-02'].coches} coches`;

    $('oracle-data').style.display = 'block';
    $('btn-calcular').style.display = 'block';

    OracleState.cargado = true;
    status.textContent = '✅ Datos cargados correctamente';

  } catch (err) {
    console.error(err);
    status.textContent = '❌ Error cargando datos';
  }
}

/* =========================
   CÁLCULO PRINCIPAL
   ========================= */
function calcularOraculo() {
  if (!OracleState.cargado) return;

  const LIMITE_SP = 455;
  const esOC = OracleState.posicion > LIMITE_SP;

  const puerta0814 = OracleState.puertas.find(p => p.jornada === '08-14');
  const puerta = esOC ? puerta0814.oc : puerta0814.sp;

  const demanda =
    OracleState.demandas['08-14'].gruas * 7 +
    OracleState.demandas['08-14'].coches -
    Math.floor(OracleState.fijos / 2);

  const distancia = OracleState.posicion >= puerta
    ? OracleState.posicion - puerta
    : (esOC ? 519 : LIMITE_SP) - puerta + OracleState.posicion;

  let mensaje = '❌ Difícil';
  let color = '#dc2626';

  if (demanda >= distancia) {
    mensaje = '🔥 Calienta que sales';
    color = '#16a34a';
  } else if (demanda >= distancia * 0.7) {
    mensaje = '⚠️ Va a estar justo';
    color = '#f59e0b';
  }

  $('resultado-oraculo').innerHTML = `
    <div class="card" style="background:${color};color:white">
      <h3>${mensaje}</h3>
      <p>Tu posición: ${OracleState.posicion}</p>
      <p>Puerta: ${puerta}</p>
      <p>Demanda estimada: ${demanda}</p>
      <p>Distancia: ${distancia}</p>
    </div>
  `;
}

export default Oraculo;