const view = document.getElementById('view');

let state = JSON.parse(localStorage.getItem('state')) || {
  irpf: 35,
  jornales: 51,
  periodos: {
    '1-15': 0,
    '16-31': 0
  },
  historico: []
};

function save(){ localStorage.setItem('state', JSON.stringify(state)); }

function go(page){
  if(page==='inicio') inicio();
  if(page==='sueldometro') sueldometro();
  if(page==='historico') historico();
}

function inicio(){
  view.innerHTML = `
  <div class="card">
    <h2>Bienvenido/a</h2>
    <p>Jornales totales: <strong>${state.jornales}</strong></p>
  </div>`;
}

function sueldometro(){
  const brutoTotal = state.periodos['1-15'] + state.periodos['16-31'];
  const neto = brutoTotal * (1 - state.irpf/100);
  view.innerHTML = `
  <div class="card">
    <h2>Sueldómetro</h2>
    <label>IRPF %
      <input type="number" value="${state.irpf}" onchange="updateIRPF(this.value)">
    </label>
    <h3>Periodo 1–15</h3>
    <input type="number" placeholder="Bruto €" value="${state.periodos['1-15']}" onchange="updatePeriodo('1-15',this.value)">
    <h3>Periodo 16–31</h3>
    <input type="number" placeholder="Bruto €" value="${state.periodos['16-31']}" onchange="updatePeriodo('16-31',this.value)">
    <p class="orange">Total Bruto: ${brutoTotal.toFixed(2)} €</p>
    <p class="green">Total Neto: ${neto.toFixed(2)} €</p>
  </div>`;
}

function historico(){
  let html = `<div class="card"><h2>Histórico</h2>`;
  if(state.historico.length===0){
    html += `<p>No hay datos guardados.</p>`;
  } else {
    state.historico.forEach(h=>{
      html += `<p>${h.fecha} → Bruto: ${h.bruto} €</p>`;
    });
  }
  html += `<button onclick="guardarMes()">Guardar mes actual</button></div>`;
  view.innerHTML = html;
}

function updateIRPF(v){ state.irpf = Number(v); save(); sueldometro(); }
function updatePeriodo(p,v){ state.periodos[p] = Number(v); save(); sueldometro(); }

function guardarMes(){
  const bruto = state.periodos['1-15'] + state.periodos['16-31'];
  state.historico.push({fecha:new Date().toLocaleDateString(), bruto});
  state.periodos['1-15']=0;
  state.periodos['16-31']=0;
  save();
  historico();
}

go('inicio');
