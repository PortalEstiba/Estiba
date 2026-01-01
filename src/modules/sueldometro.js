// src/modules/sueldometro.js
// Sueldómetro v4: Resumen mensual avanzado + acumulados

const STORAGE_KEY = 'sueldometro_v4';

const defaultState = {
  irpf: 35,
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  jornales: []
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState; }
  catch { return defaultState; }
}
function save(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function quincena(d){ return new Date(d).getDate() <= 15 ? 'q1' : 'q2'; }

function calcMonth(state){
  let q1=0,q2=0,count=0;
  state.jornales.forEach(j=>{
    const d=new Date(j.fecha);
    if(d.getMonth()===state.mes && d.getFullYear()===state.anio){
      count++;
      quincena(j.fecha)==='q1'? q1+=j.precio : q2+=j.precio;
    }
  });
  const bruto=q1+q2;
  const neto=bruto*(1-state.irpf/100);
  return {q1,q2,bruto,neto,count};
}

function calcYear(state){
  let bruto=0;
  state.jornales.forEach(j=>{
    const d=new Date(j.fecha);
    if(d.getFullYear()===state.anio) bruto+=j.precio;
  });
  const neto=bruto*(1-state.irpf/100);
  return {bruto,neto};
}

function render(container){
  const state=load();
  const m=calcMonth(state);
  const y=calcYear(state);

  container.innerHTML=`
  <div class="card">
    <h2>📊 Resumen avanzado</h2>
    <div class="grid">
      <label>Mes
        <select id="sm-mes">
          ${MONTHS.map((n,i)=>`<option value="${i}" ${i===state.mes?'selected':''}>${n}</option>`).join('')}
        </select>
      </label>
      <label>Año
        <input id="sm-anio" type="number" value="${state.anio}">
      </label>
      <label>IRPF %
        <input id="irpf" type="number" value="${state.irpf}">
      </label>
    </div>
  </div>

  <div class="card">
    <h3>${MONTHS[state.mes]} ${state.anio}</h3>
    <p>Jornales: <strong>${m.count}</strong></p>
    <p>Bruto 1–15: <strong>${m.q1.toFixed(2)} €</strong></p>
    <p>Bruto 16–fin: <strong>${m.q2.toFixed(2)} €</strong></p>
    <p class="orange"><strong>Total Bruto Mes: ${m.bruto.toFixed(2)} €</strong></p>
    <p class="green"><strong>Total Neto Mes: ${m.neto.toFixed(2)} €</strong></p>
  </div>

  <div class="card">
    <h3>📆 Acumulado ${state.anio}</h3>
    <p class="orange"><strong>Total Bruto Año: ${y.bruto.toFixed(2)} €</strong></p>
    <p class="green"><strong>Total Neto Año: ${y.neto.toFixed(2)} €</strong></p>
  </div>
  `;

  container.querySelector('#sm-mes').onchange=e=>{state.mes=+e.target.value; save(state); render(container);};
  container.querySelector('#sm-anio').onchange=e=>{state.anio=+e.target.value; save(state); render(container);};
  container.querySelector('#irpf').onchange=e=>{state.irpf=+e.target.value; save(state); render(container);};
}

export default { render };
