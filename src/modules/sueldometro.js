// src/modules/sueldometro.js
// Sueldómetro v11.1 — Vista quincenal + Alta de jornales (FIX)

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

  const r1=resumen(q1);
  const r2=resumen(q2);

  container.innerHTML=`
  <div class="card">
    <h2>📊 Vista quincenal</h2>
    <div class="grid">
      <label>Mes
        <select id="mes">${MONTHS.map((n,i)=>`<option value="${i}" ${i===s.mes?'selected':''}>${n}</option>`).join('')}</select>
      </label>
      <label>Año <input id="anio" type="number" value="${s.anio}"></label>
      <label>Vista
        <select id="vista">
          <option value="mes">Mensual</option>
          <option value="quincena" selected>Quincenal</option>
        </select>
      </label>
    </div>
  </div>

  <div class="card">
    <h3>➕ Añadir jornal</h3>
    <div class="grid">
      <input id="f" type="date">
      <input id="p" type="number" placeholder="Precio €">
      <input id="pr" type="number" placeholder="Prima €">
      <input id="i" type="number" placeholder="IRPF %">
      <select id="j">${JORNADAS.map(x=>`<option>${x}</option>`).join('')}</select>
      <select id="e">${ESPECIALIDADES.map(x=>`<option>${x}</option>`).join('')}</select>
      <select id="em">${EMPRESAS.map(x=>`<option>${x}</option>`).join('')}</select>
      <input id="b" placeholder="Barco">
      <input id="pa" placeholder="Parte">
    </div>
    <button id="add" class="primary">Guardar jornal</button>
  </div>

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

  <div class="card">
    <h3>📤 Exportar</h3>
    <button id="csv" class="primary">Exportar Excel</button>
    <button id="pdf">Exportar PDF</button>
  </div>
  `;

  function fila(j){
    return `<div class="row">
      <div><strong>${j.fecha}</strong> · ${j.jornada} · ${j.especialidad}
        <div class="muted">${j.empresa} · ${j.barco||'-'} · Parte ${j.parte||'-'}</div>
      </div>
      <div class="right"><strong>${total(j).toFixed(2)} €</strong></div>
    </div>`;
  }

  container.querySelector('#add').onclick=()=>{
    const j={
      id:Date.now(),
      fecha:f.value,
      precio:+p.value,
      prima:+pr.value||0,
      irpf:+i.value||0,
      jornada:j.value,
      especialidad:e.value,
      empresa:em.value,
      barco:b.value,
      parte:pa.value
    };
    if(!j.fecha||!j.precio)return;
    s.jornales.push(j); save(s); render(container);
  };

  mes.onchange=e=>{s.mes=+e.target.value;save(s);render(container)}
  anio.onchange=e=>{s.anio=+e.target.value;save(s);render(container)}
  csv.onclick=()=>exportCSV(mesJ,s.mes,s.anio)
  pdf.onclick=()=>exportPDF(`Sueldómetro ${MONTHS[s.mes]} ${s.anio}`)
}

export default { render };
