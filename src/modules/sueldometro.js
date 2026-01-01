// src/modules/sueldometro.js
// Sueldómetro v12 — Editar y borrar jornales

import { exportCSV, exportPDF } from './exporter.js';

const STORAGE_KEY = 'sueldometro_v12';

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

  const r1=resumen(q1);
  const r2=resumen(q2);

  container.innerHTML=`
  <div class="card">
    <h2>📊 Vista quincenal</h2>
  </div>

  <div class="card">
    <h3>${s.editId ? '✏️ Editar jornal' : '➕ Añadir jornal'}</h3>
    <div class="grid">
      <input id="f" type="date">
      <input id="p" type="number" placeholder="Precio €">
      <input id="pr" type="number" placeholder="Prima €">
      <input id="i" type="number" placeholder="IRPF %">
      <select id="jornada">${JORNADAS.map(x=>`<option>${x}</option>`).join('')}</select>
      <select id="especialidad">${ESPECIALIDADES.map(x=>`<option>${x}</option>`).join('')}</select>
      <select id="empresa">${EMPRESAS.map(x=>`<option>${x}</option>`).join('')}</select>
      <input id="barco" placeholder="Barco">
      <input id="parte" placeholder="Parte">
    </div>
    <button id="save" class="primary">${s.editId ? 'Actualizar' : 'Guardar'}</button>
    ${s.editId ? '<button id="cancel">Cancelar</button>' : ''}
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

  document.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.onclick=()=>{
      const j=s.jornales.find(x=>x.id==btn.dataset.edit);
      s.editId=j.id; save(s); render(container);
      f.value=j.fecha; p.value=j.precio; pr.value=j.prima;
      i.value=j.irpf; jornada.value=j.jornada;
      especialidad.value=j.especialidad; empresa.value=j.empresa;
      barco.value=j.barco; parte.value=j.parte;
    };
  });

  document.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick=()=>{
      if(confirm('¿Eliminar jornal?')){
        s.jornales=s.jornales.filter(j=>j.id!=btn.dataset.del);
        save(s); render(container);
      }
    };
  });

  save.onclick=()=>{
    const data={
      id:s.editId||Date.now(),
      fecha:f.value,
      precio:+p.value,
      prima:+pr.value||0,
      irpf:+i.value||0,
      jornada:jornada.value,
      especialidad:especialidad.value,
      empresa:empresa.value,
      barco:barco.value,
      parte:parte.value
    };
    if(!data.fecha||!data.precio)return;
    if(s.editId){
      s.jornales=s.jornales.map(j=>j.id===data.id?data:j);
      s.editId=null;
    }else{
      s.jornales.push(data);
    }
    save(s); render(container);
  };

  if(document.getElementById('cancel')){
    cancel.onclick=()=>{s.editId=null; save(s); render(container);}
  }
}

export default { render };
