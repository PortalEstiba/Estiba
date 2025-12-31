const view = document.getElementById('view');

let state = JSON.parse(localStorage.getItem('state')) || {
  jornales: 51,
  irpf: 35,
  listaJornales: []
};

function save(){ localStorage.setItem('state', JSON.stringify(state)); }

function go(page){
  if(page==='inicio') inicio();
  if(page==='sueldometro') sueldometro();
}

function inicio(){
  view.innerHTML = `
    <div class="card">
      <h2>Bienvenido/a</h2>
      <p>Jornales totales: <strong>${state.jornales}</strong></p>
    </div>
  `;
}

function sueldometro(){
  const bruto = state.listaJornales.reduce((a,b)=>a+b,0);
  const neto = bruto * (1 - state.irpf/100);

  let lista = state.listaJornales.map((j,i)=>`
    <div class="item">
      <span>Jornal ${i+1}</span>
      <strong>${j.toFixed(2)} €</strong>
    </div>
  `).join('');

  view.innerHTML = `
    <div class="card">
      <h2>💰 Sueldómetro</h2>

      <label>IRPF %
        <input type="number" value="${state.irpf}" onchange="setIRPF(this.value)">
      </label>

      <label>Precio del jornal (€)
        <input type="number" id="precio">
      </label>

      <button class="add" onclick="addJornal()">➕ Añadir jornal</button>

      <div class="list">${lista || '<p>No hay jornales añadidos.</p>'}</div>

      <hr>

      <p class="orange">Total Bruto: <strong>${bruto.toFixed(2)} €</strong></p>
      <p class="green">Total Neto: <strong>${neto.toFixed(2)} €</strong></p>
    </div>
  `;
}

function addJornal(){
  const v = Number(document.getElementById('precio').value);
  if(!v) return;
  state.listaJornales.push(v);
  save();
  sueldometro();
}

function setIRPF(v){
  state.irpf = Number(v);
  save();
  sueldometro();
}

go('inicio');
