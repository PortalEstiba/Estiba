// src/modules/sueldometro.js
// Sueldómetro v11.4 — Editar y borrar jornales SIN perder funciones

import { exportCSV, exportPDF } from './exporter.js';

const STORAGE_KEY = 'sueldometro_v11';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ESPECIALIDADES = ['Conductor 1ª','Conductor 2ª','Estiba','Trinca','Trinca de Coches','Tolva'];
const JORNADAS = ['02-08','08-14','14-20','20-02'];
const EMPRESAS = ['CSP','APM','MSC','VTE','ERSIP','BALEARIA','GNV','TRANSMED'];
const FESTIVOS = [
  // ENERO
  '2025-01-01',
  '2025-01-06',

  // ABRIL
  '2025-04-17',
  '2025-04-18',
  '2025-04-21',

  // MAYO
  '2025-05-01',

  // JUNIO
  '2025-06-24',

  // JULIO
  '2025-07-16',

  // AGOSTO
  '2025-08-15',

  // SEPTIEMBRE
  '2025-09-18',

  // OCTUBRE
  '2025-10-09',

  // NOVIEMBRE
  '2025-11-05',

  // DICIEMBRE
  '2025-12-08',
  '2025-12-18',
  '2025-12-25'
];

// ================================
// TABLA DE PRIMAS POR MOVIMIENTO
// ================================

const PRIMAS = {
  '02-08': {
    LABORABLE: { lt120: 0.901, gte120: 0.966 },
    'FEST. A LAB.': { lt120: 0.901, gte120: 0.966 },
    FESTIVO: { lt120: 1.309, gte120: 1.405 },
    'FEST. A FEST.': { lt120: 1.309, gte120: 1.405 }
  },
  '08-14': {
    LABORABLE: { lt120: 0.374, gte120: 0.612 },
    SABADO: { lt120: 0.374, gte120: 0.612 },
    FESTIVO: { lt120: 0.674, gte120: 0.786 }
  },
  '14-20': {
    LABORABLE: { lt120: 0.374, gte120: 0.612 },
    SABADO: { lt120: 0.674, gte120: 0.786 },
    FESTIVO: { lt120: 0.933, gte120: 1.0 }
  },
  '20-02': {
    LABORABLE: { lt120: 0.554, gte120: 0.774 },
    'LAB A FEST': { lt120: 0.554, gte120: 0.774 },
    SABADO: { lt120: 0.974, gte120: 1.045 },
    'FEST. A LAB.': { lt120: 1.414, gte120: 1.517 },
    'FEST. A FEST.': { lt120: 1.414, gte120: 1.517 }
  }
};

const defaultState = {
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  vista: 'quincena',
  jornales: []
};

function load(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||defaultState}catch{return defaultState}}
function save(s){ localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function q(f){ return new Date(f).getDate()<=15?'q1':'q2' }
function total(j){ return j.precio + (j.prima||0) }
function detectarTipoDia(fecha, jornada) {
  const d = new Date(fecha + 'T00:00:00'); // fuerza mismo día local
  const diaSemana = d.getDay(); // 0 domingo, 6 sábado

  const esFestivo = FESTIVOS.includes(fecha);

  let inicio;
  if (esFestivo || diaSemana === 0) inicio = 'FESTIVO';
  else if (diaSemana === 6) inicio = 'SABADO';
  else inicio = 'LABORABLE';

  // Jornadas que NO cruzan día
  if (jornada === '02-08' || jornada === '08-14' || jornada === '14-20') {
    return inicio;
  }

  // Jornada 20–02 (única que cruza)
  if (jornada === '20-02') {
    if (inicio === 'SABADO') return 'SABADO';

    const d2 = new Date(d);
    d2.setDate(d.getDate() + 1);
    const fechaSig = d2.toISOString().slice(0, 10);
    const ds = d2.getDay();
    const festivoSig = FESTIVOS.includes(fechaSig);

    let fin;
    if (festivoSig || ds === 0) fin = 'FESTIVO';
    else if (ds === 6) fin = 'SABADO';
    else fin = 'LABORABLE';

    if (inicio === fin) return inicio;
    if (inicio === 'LABORABLE' && fin === 'FESTIVO') return 'LAB A FEST';
    if (inicio === 'FESTIVO' && fin === 'LABORABLE') return 'FEST. A LAB.';
    if (inicio === 'FESTIVO' && fin === 'FESTIVO') return 'FEST. A FEST.';

    return inicio;
  }

  return inicio;
}
function calcularPrima(jornada, tipoDia, movimientos) {
  if (!PRIMAS[jornada] || !PRIMAS[jornada][tipoDia]) return 0;

  const tramo = movimientos < 120 ? 'lt120' : 'gte120';
  const valor = PRIMAS[jornada][tipoDia][tramo] || 0;

  return valor * movimientos;
}

function resumen(arr){
  let bruto=0,neto=0;
  arr.forEach(j=>{
    const t=total(j);
    bruto+=t;
    neto+=t*(1-j.irpf/100);
  });
  return {bruto,neto,count:arr.length};
}

function createQuincenaCard(year, month, quincena, jornales) {
  const rangoInicio = quincena === 1 ? 1 : 16;
  const rangoFin = quincena === 1 ? 15 : new Date(year, month, 0).getDate();

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.style.cursor = 'pointer';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  header.innerHTML = `
    <strong>📅 ${rangoInicio}-${rangoFin}</strong>
    <span class="muted">${jornales.length} jornales</span>
  `;

  const body = document.createElement('div');
  body.style.display = 'none';
  body.style.marginTop = '10px';

  body.innerHTML = jornales.map(j => `
  <div class="row">
    <div>
      <strong>${j.fecha}</strong> · ${j.jornada} · ${j.especialidad}
      <div class="muted">${j.empresa} · ${j.barco || '-'} · Parte ${j.parte || '-'}</div>
    </div>
    <div class="right">
      <strong>${total(j).toFixed(2)} €</strong>
      <button data-edit="${j.id}">✏️</button>
      <button data-del="${j.id}" class="danger">🗑️</button>
    </div>
  </div>
`).join('') || '<p class="muted">Sin jornales</p>';

  header.onclick = () => {
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  };

  card.appendChild(header);
  card.appendChild(body);

  return card;
}
function abrirModalNuevoJornal() {
  modalContainer.innerHTML = `
    <div class="grid">
      <input id="f" type="date">
      <input id="p" type="number" placeholder="Precio €">
      <input id="mov" type="number" placeholder="Movimientos">

      <div id="primaPreview" class="prima-preview">
        Selecciona fecha y jornada
      </div>

      <input id="i" type="number" placeholder="IRPF %">

      <select id="jornada">
        ${JORNADAS.map(x => `<option>${x}</option>`).join('')}
      </select>

      <select id="especialidad">
        ${ESPECIALIDADES.map(x => `<option>${x}</option>`).join('')}
      </select>

      <select id="empresa">
        ${EMPRESAS.map(x => `<option>${x}</option>`).join('')}
      </select>

      <input id="barco" placeholder="Barco">
      <input id="parte" placeholder="Parte">
    </div>

    <button id="guardar" class="primary">Guardar jornal</button>
  `;

  modal.classList.remove('hidden');

  const f = document.getElementById('f');
  const mov = document.getElementById('mov');
  const jornada = document.getElementById('jornada');
  const preview = document.getElementById('primaPreview');
  const p = document.getElementById('p');
  const i = document.getElementById('i');
  const especialidad = document.getElementById('especialidad');
  const empresa = document.getElementById('empresa');
  const barco = document.getElementById('barco');
  const parte = document.getElementById('parte');

  function actualizarPreview() {
    if (!f.value) {
      preview.textContent = 'Selecciona fecha';
      return;
    }
    const movimientos = +mov.value || 0;
    const tipo = detectarTipoDia(f.value, jornada.value);
    const prima = calcularPrima(jornada.value, tipo, movimientos);
    preview.textContent = `Tipo: ${tipo} · Prima: ${prima.toFixed(2)} €`;
  }

  f.addEventListener('change', actualizarPreview);
  mov.addEventListener('input', actualizarPreview);
  jornada.addEventListener('change', actualizarPreview);

  document.getElementById('guardar').onclick = () => {
    const s = load();
    const tipo = detectarTipoDia(f.value, jornada.value);

    s.jornales.push({
      id: Date.now(),
      fecha: f.value,
      precio: +p.value,
      movimientos: +mov.value || 0,
      tipoDia: tipo,
      prima: calcularPrima(jornada.value, tipo, +mov.value || 0),
      irpf: +i.value || 0,
      jornada: jornada.value,
      especialidad: especialidad.value,
      empresa: empresa.value,
      barco: barco.value,
      parte: parte.value
    });

    save(s);
    modal.classList.add('hidden');
    render(document.getElementById('page-sueldometro'));
  };
}
function render(container){
  const s=load();

  const mesJ=s.jornales.filter(j=>{
    const d=new Date(j.fecha);
    return d.getMonth()===s.mes && d.getFullYear()===s.anio;
  });

  const q1=mesJ.filter(j=>q(j.fecha)==='q1');
  const q2=mesJ.filter(j=>q(j.fecha)==='q2');

  const rMes=resumen(mesJ);
  const r1=resumen(q1);
  const r2=resumen(q2);

  container.innerHTML = `
  <div class="card sueldometro-header">
    <div class="header-row">
      <h2>💶 Sueldómetro</h2>
      <button id="btnAddJornal" class="btn-add-jornal">
        + Añadir
      </button>
    </div>

    <div class="grid">
      <label>Mes
        <select id="mes">
          ${MONTHS.map((n,i)=>`<option value="${i}" ${i===s.mes?'selected':''}>${n}</option>`).join('')}
        </select>
      </label>

      <label>Año
        <input id="anio" type="number" value="${s.anio}">
      </label>

      <label>Vista
        <select id="vista">
          <option value="mensual" ${s.vista==='mensual'?'selected':''}>Mensual</option>
          <option value="quincena" ${s.vista==='quincena'?'selected':''}>Quincenal</option>
        </select>
      </label>
    </div>
  </div>

  ${s.vista === 'quincena' ? `
    <div class="card">
      <h3>📅 Quincena 1 (1–15)</h3>
      <div id="vista-quincena-1"></div>
      <p class="orange">Bruto: ${r1.bruto.toFixed(2)} €</p>
      <p class="green">Neto: ${r1.neto.toFixed(2)} €</p>
    </div>

    <div class="card">
      <h3>📅 Quincena 2 (16–fin)</h3>
      <div id="vista-quincena-2"></div>
      <p class="orange">Bruto: ${r2.bruto.toFixed(2)} €</p>
      <p class="green">Neto: ${r2.neto.toFixed(2)} €</p>
    </div>
  ` : `
    <div class="card">
      <h3>📅 Resumen mensual</h3>
      <p>Jornales: <strong>${rMes.count}</strong></p>
      <p class="orange"><strong>Total Bruto Mes: ${rMes.bruto.toFixed(2)} €</strong></p>
      <p class="green"><strong>Total Neto Mes: ${rMes.neto.toFixed(2)} €</strong></p>
    </div>
  `}

  <div class="card">
    <h3>📤 Exportar</h3>
    <button id="csv" class="primary">Exportar Excel</button>
    <button id="pdf">Exportar PDF</button>
  </div>
`;
const btnAdd = document.getElementById('btnAddJornal');
if (btnAdd) {
  btnAdd.onclick = () => {
  abrirModalNuevoJornal();
};
}
  
// Render vista nueva de quincenas (tarjetas plegables)
if (s.vista === 'quincena') {
  const q1Container = document.getElementById('vista-quincena-1');
  const q2Container = document.getElementById('vista-quincena-2');

  if (q1Container) {
    q1Container.appendChild(
      createQuincenaCard(s.anio, s.mes + 1, 1, q1)
    );
  }

  if (q2Container) {
    q2Container.appendChild(
      createQuincenaCard(s.anio, s.mes + 1, 2, q2)
    );
  }
}
  function fila(j){
    return `<div class="row">
      <div>
        <strong>${j.fecha}</strong> · ${j.jornada} · ${j.especialidad}
        <div class="muted">${j.empresa} · ${j.barco||'-'} · Parte ${j.parte||'-'}</div>
      </div>
      <div class="right">
        <strong>${total(j).toFixed(2)} €</strong>
        <button data-edit="${j.id}">✏️</button>
        <button data-del="${j.id}" class="danger">🗑️</button>
      </div>
    </div>`;
  }

  document.getElementById('mes').onchange=e=>{s.mes=+e.target.value;save(s);render(container)}
  document.getElementById('anio').onchange=e=>{s.anio=+e.target.value;save(s);render(container)}
  document.getElementById('vista').onchange=e=>{s.vista=e.target.value;save(s);render(container)}

  document.getElementById('csv').onclick=()=>exportCSV(mesJ,s.mes,s.anio)
  document.getElementById('pdf').onclick=()=>exportPDF(`Sueldómetro ${MONTHS[s.mes]} ${s.anio}`)
}

/* ================================
   FAB + MODAL — FORM DINÁMICO
   ================================ */

const fab = document.getElementById('fabAddJornal');
const modal = document.getElementById('modalJornal');
const closeBtn = document.getElementById('closeModal');
const modalContainer = document.getElementById('modalFormContainer');

fab?.addEventListener('click', () => {
  modalContainer.innerHTML = `
    <div class="grid">
      <input id="f" type="date">
      <input id="p" type="number" placeholder="Precio €">
      <input id="mov" type="number" placeholder="Movimientos">
      <div id="primaPreview" class="prima-preview muted">
        Selecciona fecha y jornada
      </div>
      <input id="i" type="number" placeholder="IRPF %">
      <select id="jornada">${JORNADAS.map(x=>`<option>${x}</option>`).join('')}</select>
      <select id="especialidad">${ESPECIALIDADES.map(x=>`<option>${x}</option>`).join('')}</select>
      <select id="empresa">${EMPRESAS.map(x=>`<option>${x}</option>`).join('')}</select>
      <input id="barco" placeholder="Barco">
      <input id="parte" placeholder="Parte">
    </div>
    <button id="guardar" class="primary">Guardar jornal</button>
  `;

  modal.classList.remove('hidden');

  const f = document.getElementById('f');
  const p = document.getElementById('p');
  const mov = document.getElementById('mov');
  const jornada = document.getElementById('jornada');
  const preview = document.getElementById('primaPreview');
  const i = document.getElementById('i');
  const especialidad = document.getElementById('especialidad');
  const empresa = document.getElementById('empresa');
  const barco = document.getElementById('barco');
  const parte = document.getElementById('parte');

  function actualizarPreview() {
  if (!f.value) {
    preview.textContent = 'Selecciona fecha';
    return;
  }

  const movimientos = +mov.value || 0;
  const tipo = detectarTipoDia(f.value, jornada.value);
  const prima = calcularPrima(jornada.value, tipo, movimientos);

  preview.textContent = `Tipo: ${tipo} · Prima: ${prima.toFixed(2)} €`;
}

  f.addEventListener('change', actualizarPreview);
  mov.addEventListener('input', actualizarPreview);
  jornada.addEventListener('change', actualizarPreview);

  document.getElementById('guardar').onclick = () => {
    const s = load();
    const tipo = detectarTipoDia(f.value, jornada.value);

    s.jornales.push({
      id: Date.now(),
      fecha: f.value,
      precio: +p.value,
      movimientos: +mov.value || 0,
      tipoDia: tipo,
      prima: calcularPrima(jornada.value, tipo, +mov.value || 0),
      irpf: +i.value || 0,
      jornada: jornada.value,
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

closeBtn?.addEventListener('click',()=>modal.classList.add('hidden'));

// ================================
// EDITAR Y BORRAR JORNALES (FIX)
// ================================

document.addEventListener('click', (e) => {
  const s = load();

  // BORRAR
  if (e.target.dataset.del) {
    const id = Number(e.target.dataset.del);
    if (!confirm('¿Borrar este jornal?')) return;

    s.jornales = s.jornales.filter(j => j.id !== id);
    save(s);
    render(document.getElementById('page-sueldometro'));
  }

  // EDITAR
  if (e.target.dataset.edit) {
    const id = Number(e.target.dataset.edit);
    const j = s.jornales.find(j => j.id === id);
    if (!j) return;

    // Abrir modal con datos
    modalContainer.innerHTML = `
      <div class="grid">
        <input id="f" type="date" value="${j.fecha}">
        <input id="p" type="number" value="${j.precio}">
        <input id="mov" type="number" value="${j.movimientos || 0}">
        <div id="primaPreview" class="prima-preview muted">
        Prima calculada: 0.00 €
        </div>
        <select id="tipoDia">
          ${['LABORABLE','SABADO','FESTIVO','FEST. A LAB.','LAB A FEST','FEST. A FEST.']
            .map(x=>`<option ${x===j.tipoDia?'selected':''}>${x}</option>`).join('')}
         </select>
        <input id="i" type="number" value="${j.irpf}">
        <select id="jornada">${JORNADAS.map(x=>`<option ${x===j.jornada?'selected':''}>${x}</option>`).join('')}</select>
        <select id="especialidad">${ESPECIALIDADES.map(x=>`<option ${x===j.especialidad?'selected':''}>${x}</option>`).join('')}</select>
        <select id="empresa">${EMPRESAS.map(x=>`<option ${x===j.empresa?'selected':''}>${x}</option>`).join('')}</select>
        <input id="barco" value="${j.barco || ''}">
        <input id="parte" value="${j.parte || ''}">
      </div>
      <button id="guardarEdit" class="primary">Actualizar jornal</button>
    `;

    modal.classList.remove('hidden');

    document.getElementById('guardarEdit').onclick = () => {
      j.fecha = f.value;
      j.precio = +p.value;
      j.movimientos = +mov.value || 0;
      j.tipoDia = tipoDia.value;
      j.prima = calcularPrima(j.jornada, j.tipoDia, j.movimientos);
      j.irpf = +i.value;
      j.jornada = jornada.value;
      j.especialidad = especialidad.value;
      j.empresa = empresa.value;
      j.barco = barco.value;
      j.parte = parte.value;

      save(s);
      modal.classList.add('hidden');
      render(document.getElementById('page-sueldometro'));
    };
  }
});

export default { render };
