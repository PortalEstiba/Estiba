// ================================
// SUELDÓMETRO – FIX DEFINITIVO
// ================================

import { exportCSV, exportPDF } from './exporter.js';

const STORAGE_KEY = 'sueldometro_v12';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ESPECIALIDADES = ['Conductor 1ª','Conductor 2ª','Estiba','Trinca','Trinca de Coches','Tolva'];
const JORNADAS = ['02-08','08-14','14-20','20-02'];
const EMPRESAS = ['CSP','APM','MSC','VTE','ERSIP','BALEARIA','GNV','TRANSMED'];

const PRIMAS_MOV = {
  '02-08': {
    LABORABLE: { lt120: 0.901, gte120: 0.966 },
    FESTIVO:   { lt120: 1.309, gte120: 1.405 },
    FEST_A_LAB:{ lt120: 0.901, gte120: 0.966 },
    FEST_A_FEST:{ lt120: 1.309, gte120: 1.405 }
  },
  '08-14': {
    LABORABLE: { lt120: 0.374, gte120: 0.612 },
    SABADO:    { lt120: 0.374, gte120: 0.612 },
    FESTIVO:   { lt120: 0.674, gte120: 0.786 }
  },
  '14-20': {
    LABORABLE: { lt120: 0.374, gte120: 0.612 },
    SABADO:    { lt120: 0.674, gte120: 0.786 },
    FESTIVO:   { lt120: 0.933, gte120: 1.000 }
  },
  '20-02': {
    LABORABLE:   { lt120: 0.554, gte120: 0.774 },
    LAB_A_FEST:  { lt120: 0.554, gte120: 0.774 },
    SABADO:      { lt120: 0.974, gte120: 1.045 },
    FESTIVO:     { lt120: 1.414, gte120: 1.517 },
    FEST_A_LAB:  { lt120: 1.414, gte120: 1.517 },
    FEST_A_FEST: { lt120: 1.414, gte120: 1.517 }
  }
};

function calcularPrima(jornada, tipo, movimientos) {
  if (!movimientos) return 0;
  const fila = PRIMAS_MOV[jornada]?.[tipo];
  if (!fila) return 0;
  const coef = movimientos < 120 ? fila.lt120 : fila.gte120;
  return +(coef * movimientos).toFixed(2);
}

function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    mes: new Date().getMonth(),
    anio: new Date().getFullYear(),
    vista: 'quincena',
    jornales: []
  };
}

function save(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function total(j) {
  return j.precio + (j.prima || 0);
}

// ================================
// RENDER
// ================================
export function render(container) {
  const s = load();

  container.innerHTML = `
    <div class="card">
      <h2>📊 Vista ${s.vista === 'quincena' ? 'quincenal' : 'mensual'}</h2>
    </div>
  `;
}

// ================================
// FAB + MODAL
// ================================
const fab = document.getElementById('fabAddJornal');
const modal = document.getElementById('modalJornal');
const closeBtn = document.getElementById('closeModal');
const modalContainer = document.getElementById('modalFormContainer');

fab?.addEventListener('click', () => {
  modalContainer.innerHTML = `
    <div class="grid">
      <input id="f" type="date">
      <input id="p" type="number" placeholder="Precio base €">
      <input id="mov" type="number" placeholder="Movimientos">
      <input id="i" type="number" placeholder="IRPF %">

      <select id="tipo">
        <option value="LABORABLE">Laborable</option>
        <option value="SABADO">Sábado</option>
        <option value="FESTIVO">Festivo</option>
        <option value="LAB_A_FEST">Lab → Fest (20-02)</option>
        <option value="FEST_A_LAB">Fest → Lab (20-02)</option>
        <option value="FEST_A_FEST">Fest → Fest (20-02)</option>
      </select>

      <select id="jornada">${JORNADAS.map(j=>`<option>${j}</option>`).join('')}</select>
      <select id="especialidad">${ESPECIALIDADES.map(e=>`<option>${e}</option>`).join('')}</select>
      <select id="empresa">${EMPRESAS.map(e=>`<option>${e}</option>`).join('')}</select>

      <input id="barco" placeholder="Barco">
      <input id="parte" placeholder="Parte">
    </div>
    <button id="guardar" class="primary">Guardar jornal</button>
  `;

  modal.classList.remove('hidden');

  document.getElementById('guardar').onclick = () => {
    const s = load();

    const jornada = document.getElementById('jornada').value;
    const tipo = document.getElementById('tipo').value;
    const mov = +document.getElementById('mov').value || 0;

    const prima = calcularPrima(jornada, tipo, mov);

    s.jornales.push({
      id: Date.now(),
      fecha: f.value,
      precio: +p.value,
      movimientos: mov,
      prima,
      tipoDia: tipo,
      irpf: +i.value || 0,
      jornada,
      especialidad: especialidad.value,
      empresa: empresa.value,
      barco: barco.value,
      parte: parte.value
    });

    save(s);
    modal.classList.add('hidden');
    render(document.getElementById('page-sueldometro'));
  };
});

closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
