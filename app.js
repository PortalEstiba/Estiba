const view = document.getElementById('view');

let state = JSON.parse(localStorage.getItem('state')) || {
  irpf: 35,
  bruto: 14224.54,
  jornales: 51
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
    <p>Jornales: ${state.jornales}</p>
    <p>Total Bruto: ${state.bruto} €</p>
  </div>`;
}

function sueldometro(){
  const neto = state.bruto * (1 - state.irpf/100);
  view.innerHTML = `
  <div class="card">
    <h2>Sueldómetro</h2>
    <label>IRPF %
      <input type="number" value="${state.irpf}" onchange="updateIRPF(this.value)">
    </label>
    <p class="orange">Bruto: ${state.bruto.toFixed(2)} €</p>
    <p class="green">Neto: ${neto.toFixed(2)} €</p>
  </div>`;
}

function updateIRPF(v){
  state.irpf = Number(v);
  save();
  sueldometro();
}

go('inicio');
