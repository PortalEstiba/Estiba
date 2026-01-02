// src/modules/sueldometro.js
// Sueldómetro v11.4 — Editar y borrar jornales SIN perder funciones

import { exportCSV, exportPDF } from './exporter.js';

const STORAGE_KEY = 'sueldometro_v11';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ESPECIALIDADES = ['Conductor 1ª','Conductor 2ª','Estiba','Trinca','Trinca de Coches','Tolva'];
const JORNADAS = ['02-08','08-14','14-20','20-02'];
const EMPRESAS = ['CSP','APM','MSC','VTE','ERSIP','BALEARIA','GNV','TRANSMED'];

const defaultState = {
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  vista: 'quincena',
  editId: null,
  jornales: []
};

function load(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||defaultState}catch{return defaultState}}
function save(s){ localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function q(f){ return new Date(f).getDate()<=15?'q1':'q2' }
function total(j){ return j.precio + (j.prima||0) }

function resumen(arr){
  let bruto=0,neto=0;
  arr.forEach(j=>{
    const t=total(j);
    bruto+=t;
    neto+=t*(1-j.irpf/100);
  });
  return {bruto,neto,count:arr.length};
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

  container.innerHTML=`
  <div class="card">
    <h2>📊 Vista ${s.vista === 'quincena' ? 'quincenal' : 'mensual'}</h2>
    <div class="grid">
      <label>Mes
        <select id="mes">${MONTHS.map((n,i)=>`<option value="${i}" ${i===s.mes?'selected':''}>${n}</option>`).join('')}</select>
      </label>
      <label>Año <input id="anio" type="number" value="${s.anio}"></label>
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
      ${q1.map(j=>fila(j)).join('')||'<p class="muted">Sin jornales</p>'}
      <p class="orange">Bruto: ${r1.bruto.toFixed(2)} €</p>
      <p class="green">Neto: ${r1.neto.toFixed(2)} €</p>
    </div>

    <div class="card">
      <h3>📅 Quincena 2 (16–fin)</h3>
      ${q2.map(j=>fila(j)).join('')||'<p class="muted">Sin jornales</p>'}
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
      const prima = calcularPrimaAutomatica(
      jornada,
      tipoDia,
      movimientos);
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

  document.getElementById('guardar').onclick = () => {
    const s=load();
    s.jornales.push({
      id:Date.now(),
      fecha:f.value,
      precio:+p.value,
      prima:+pr.value||0,
      irpf:+i.value||0,
      jornada:jornada.value,
      especialidad:especialidad.value,
      empresa:empresa.value,
      barco:barco.value,
      parte:parte.value
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
        <input id="pr" type="number" value="${j.prima || 0}">
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
      j.prima = +pr.value || 0;
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

// ===============================
// TABLA DE PRIMAS POR JORNADA
// ===============================
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

function calcularPrimaAutomatica(jornada, tipoDia, movimientos) {
  if (!jornada || !tipoDia || !movimientos) return 0;

  const tablaJornada = PRIMA_TABLE[jornada];
  if (!tablaJornada) return 0;

  const tablaTipo = tablaJornada[tipoDia];
  if (!tablaTipo) return 0;

  const coef = movimientos < 120
    ? tablaTipo.lt120
    : tablaTipo.gte120;

  return +(coef * movimientos).toFixed(2);
}

export default { render };

