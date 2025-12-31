
const view = document.getElementById('view');

let state = JSON.parse(localStorage.getItem('state')) || {
  irpf: 35,
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  jornales: []
};

function save(){ localStorage.setItem('state', JSON.stringify(state)); }
function go(p){ p==='inicio' ? inicio() : sueldometro(); }

function inicio(){
  view.innerHTML = `
  <div class="card">
    <h3>Bienvenido/a</h3>
    <p>Jornales registrados: <strong>${state.jornales.length}</strong></p>
  </div>`;
}

function sueldometro(){
  const filtrados = state.jornales.filter(j=>{
    const d=new Date(j.fecha);
    return d.getMonth()==state.mes && d.getFullYear()==state.anio;
  });

  let q1=0,q2=0;
  filtrados.forEach(j=>{
    new Date(j.fecha).getDate()<=15 ? q1+=j.precio : q2+=j.precio;
  });
  const bruto=q1+q2;
  const neto=bruto*(1-state.irpf/100);

  view.innerHTML = `
  <div class="card">
    <h3>💰 Sueldómetro</h3>

    <label>Mes
      <select onchange="setMes(this.value)">
        ${[...Array(12)].map((_,i)=>`<option value="${i}" ${i==state.mes?'selected':''}>${i+1}</option>`).join('')}
      </select>
    </label>

    <label>Año
      <input type="number" value="${state.anio}" onchange="setAnio(this.value)">
    </label>

    <label>IRPF %
      <input type="number" value="${state.irpf}" onchange="setIRPF(this.value)">
    </label>
  </div>

  <div class="card">
    <h3>➕ Añadir / Editar jornal</h3>
    <input type="date" id="f">
    <input type="number" id="p" placeholder="Precio €">
    <input id="e" placeholder="Especialidad">
    <input id="b" placeholder="Barco">
    <input id="em" placeholder="Empresa">
    <input id="pa" placeholder="Nº Parte">
    <button class="primary" onclick="add()">Guardar jornal</button>
  </div>

  <div class="card">
    <h3>📋 Jornales del mes</h3>
    ${filtrados.map((j,i)=>`
      <div class="jornal">
        ${j.fecha} · ${j.especialidad || '-'} · <strong>${j.precio} €</strong>
        <div class="actions">
          <button class="danger" onclick="del('${j.id}')">Borrar</button>
        </div>
      </div>
    `).join('') || '<p>No hay jornales.</p>'}
  </div>

  <div class="card">
    <h3>📊 Resumen mensual</h3>
    <p class="orange">Bruto 1–15: ${q1.toFixed(2)} €</p>
    <p class="orange">Bruto 16–fin: ${q2.toFixed(2)} €</p>
    <p class="orange"><strong>Total Bruto: ${bruto.toFixed(2)} €</strong></p>
    <p class="green"><strong>Total Neto: ${neto.toFixed(2)} €</strong></p>
    <button class="warn" onclick="exportCSV()">Exportar CSV</button>
    <button class="warn" onclick="exportPDF()">Exportar PDF</button>
  </div>
  `;
}

function add(){
  const j={
    id:Date.now(),
    fecha:f.value,
    precio:Number(p.value),
    especialidad:e.value,
    barco:b.value,
    empresa:em.value,
    parte:pa.value
  };
  if(!j.fecha||!j.precio) return;
  state.jornales.push(j); save(); sueldometro();
}

function del(id){
  state.jornales = state.jornales.filter(j=>j.id!=id);
  save(); sueldometro();
}

function setMes(v){state.mes=Number(v);save();sueldometro();}
function setAnio(v){state.anio=Number(v);save();sueldometro();}
function setIRPF(v){state.irpf=Number(v);save();sueldometro();}

function exportCSV(){
  let csv="Fecha,Precio,Especialidad,Barco,Empresa,Parte\n";
  state.jornales.forEach(j=>{
    csv+=`${j.fecha},${j.precio},${j.especialidad},${j.barco},${j.empresa},${j.parte}\n`;
  });
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="jornales.csv";
  a.click();
}

function exportPDF(){
  const w=window.open();
  w.document.write("<h1>Resumen Sueldómetro</h1>");
  state.jornales.forEach(j=>{
    w.document.write(`<p>${j.fecha} - ${j.precio} €</p>`);
  });
  w.print();
}

go('inicio');
