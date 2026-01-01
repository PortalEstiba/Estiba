// src/modules/sueldometro.js
// Sueldómetro v6: IRPF por jornal (individual)

const STORAGE_KEY = 'sueldometro_v6';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const defaultState = {
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  jornales: []
};

function load(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||defaultState}catch{return defaultState}}
function save(s){ localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
function quincena(f){ return new Date(f).getDate()<=15?'q1':'q2' }

function calcMonth(s){
  let q1=0,q2=0,neto=0,count=0;
  s.jornales.forEach(j=>{
    const d=new Date(j.fecha);
    if(d.getMonth()===s.mes && d.getFullYear()===s.anio){
      count++;
      quincena(j.fecha)==='q1'?q1+=j.precio:q2+=j.precio;
      neto += j.precio * (1 - j.irpf/100);
    }
  });
  const bruto=q1+q2;
  return {q1,q2,bruto,neto,count};
}

function calcYear(s){
  let bruto=0,neto=0;
  s.jornales.forEach(j=>{
    const d=new Date(j.fecha);
    if(d.getFullYear()===s.anio){
      bruto+=j.precio;
      neto+=j.precio*(1-j.irpf/100);
    }
  });
  return {bruto,neto};
}

function render(container){
  const s=load();
  const m=calcMonth(s);
  const y=calcYear(s);

  container.innerHTML=`
  <div class="card">
    <h2>📊 Resumen avanzado</h2>
    <div class="grid">
      <label>Mes
        <select id="mes">${MONTHS.map((n,i)=>`<option value="${i}" ${i===s.mes?'selected':''}>${n}</option>`).join('')}</select>
      </label>
      <label>Año
        <input id="anio" type="number" value="${s.anio}">
      </label>
    </div>
  </div>

  <div class="card">
    <h3>➕ Añadir / Editar jornal</h3>
    <input type="hidden" id="jid">
    <div class="grid">
      <input id="jfecha" type="date">
      <input id="jprecio" type="number" placeholder="Precio €">
      <input id="jirpf" type="number" placeholder="IRPF %">
      <input id="jesp" placeholder="Especialidad">
      <input id="jbarco" placeholder="Barco">
      <input id="jempresa" placeholder="Empresa">
      <input id="jparte" placeholder="Nº Parte">
    </div>
    <button id="guardar" class="primary">Guardar</button>
  </div>

  <div class="card">
    <h3>📋 Jornales ${MONTHS[s.mes]} ${s.anio}</h3>
    ${s.jornales.filter(j=>{
      const d=new Date(j.fecha);
      return d.getMonth()===s.mes && d.getFullYear()===s.anio;
    }).map(j=>`
      <div class="row">
        <div>
          <strong>${j.fecha}</strong> · ${j.especialidad||'-'} · ${j.barco||'-'}
          <div class="muted">${j.empresa||'-'} · Parte ${j.parte||'-'} · IRPF ${j.irpf}%</div>
        </div>
        <div class="right">
          <strong>${j.precio.toFixed(2)} €</strong>
          <button data-e="${j.id}">✏️</button>
          <button data-d="${j.id}" class="danger">✕</button>
        </div>
      </div>
    `).join('')||'<p class="muted">No hay jornales.</p>'}
  </div>

  <div class="card">
    <h3>${MONTHS[s.mes]} ${s.anio}</h3>
    <p>Jornales: <strong>${m.count}</strong></p>
    <p>Bruto 1–15: <strong>${m.q1.toFixed(2)} €</strong></p>
    <p>Bruto 16–fin: <strong>${m.q2.toFixed(2)} €</strong></p>
    <p class="orange"><strong>Total Bruto Mes: ${m.bruto.toFixed(2)} €</strong></p>
    <p class="green"><strong>Total Neto Mes: ${m.neto.toFixed(2)} €</strong></p>
  </div>

  <div class="card">
    <h3>📆 Acumulado ${s.anio}</h3>
    <p class="orange"><strong>Total Bruto Año: ${y.bruto.toFixed(2)} €</strong></p>
    <p class="green"><strong>Total Neto Año: ${y.neto.toFixed(2)} €</strong></p>
  </div>
  `;

  container.querySelector('#mes').onchange=e=>{s.mes=+e.target.value;save(s);render(container)}
  container.querySelector('#anio').onchange=e=>{s.anio=+e.target.value;save(s);render(container)}

  container.querySelector('#guardar').onclick=()=>{
    const id=container.querySelector('#jid').value;
    const j={
      id:id?+id:Date.now(),
      fecha:container.querySelector('#jfecha').value,
      precio:+container.querySelector('#jprecio').value,
      irpf:+container.querySelector('#jirpf').value||0,
      especialidad:container.querySelector('#jesp').value,
      barco:container.querySelector('#jbarco').value,
      empresa:container.querySelector('#jempresa').value,
      parte:container.querySelector('#jparte').value
    };
    if(!j.fecha||!j.precio)return;
    if(id) s.jornales=s.jornales.map(x=>x.id===j.id?j:x);
    else s.jornales.push(j);
    save(s);render(container);
  }

  container.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{
    const j=s.jornales.find(x=>x.id==b.dataset.e);
    container.querySelector('#jid').value=j.id;
    container.querySelector('#jfecha').value=j.fecha;
    container.querySelector('#jprecio').value=j.precio;
    container.querySelector('#jirpf').value=j.irpf;
    container.querySelector('#jesp').value=j.especialidad;
    container.querySelector('#jbarco').value=j.barco;
    container.querySelector('#jempresa').value=j.empresa;
    container.querySelector('#jparte').value=j.parte;
  })

  container.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
    s.jornales=s.jornales.filter(j=>j.id!=b.dataset.d);
    save(s);render(container);
  })
}

export default { render };
