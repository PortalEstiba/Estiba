// src/modules/sueldometro.js
// Sueldómetro por quincenas con LocalStorage

const STORAGE_KEY = 'sueldometro_v1';

const defaultState = {
  irpf: 35,
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  jornales: [] // {id, fecha, precio, especialidad, barco, empresa, parte}
};

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
  } catch {
    return defaultState;
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function quincena(dateStr) {
  const d = new Date(dateStr).getDate();
  return d <= 15 ? 'q1' : 'q2';
}

function calc(state) {
  let q1 = 0, q2 = 0;
  state.jornales
    .filter(j => {
      const d = new Date(j.fecha);
      return d.getMonth() === state.mes && d.getFullYear() === state.anio;
    })
    .forEach(j => {
      quincena(j.fecha) === 'q1' ? q1 += j.precio : q2 += j.precio;
    });
  const bruto = q1 + q2;
  const neto = bruto * (1 - state.irpf / 100);
  return { q1, q2, bruto, neto };
}

function render(container) {
  const state = load();
  const { q1, q2, bruto, neto } = calc(state);

  container.innerHTML = `
    <div class="card">
      <h2>💰 Sueldómetro</h2>
      <div class="grid">
        <label>Mes
          <select id="sm-mes">
            ${Array.from({length:12}).map((_,i)=>`<option value="${i}" ${i===state.mes?'selected':''}>${i+1}</option>`).join('')}
          </select>
        </label>
        <label>Año
          <input id="sm-anio" type="number" value="${state.anio}">
        </label>
        <label>IRPF %
          <input id="sm-irpf" type="number" value="${state.irpf}">
        </label>
      </div>
    </div>

    <div class="card">
      <h3>➕ Añadir jornal</h3>
      <div class="grid">
        <input id="j-fecha" type="date">
        <input id="j-precio" type="number" placeholder="Precio €">
        <input id="j-esp" placeholder="Especialidad">
        <input id="j-barco" placeholder="Barco">
        <input id="j-empresa" placeholder="Empresa">
        <input id="j-parte" placeholder="Nº Parte">
      </div>
      <button id="j-add" class="primary">Añadir</button>
    </div>

    <div class="card">
      <h3>📋 Jornales del mes</h3>
      <div id="j-list">
        ${state.jornales
          .filter(j => {
            const d = new Date(j.fecha);
            return d.getMonth() === state.mes && d.getFullYear() === state.anio;
          })
          .map(j => `
            <div class="row">
              <div>
                <strong>${j.fecha}</strong> · ${j.especialidad || '-'} · ${j.barco || '-'}
                <div class="muted">${j.empresa || '-'} · Parte ${j.parte || '-'}</div>
              </div>
              <div class="right">
                <strong>${j.precio.toFixed(2)} €</strong>
                <button data-del="${j.id}" class="danger">✕</button>
              </div>
            </div>
          `).join('') || '<p class="muted">No hay jornales.</p>'}
      </div>
    </div>

    <div class="card">
      <h3>📊 Resumen</h3>
      <p class="orange">Bruto 1–15: <strong>${q1.toFixed(2)} €</strong></p>
      <p class="orange">Bruto 16–fin: <strong>${q2.toFixed(2)} €</strong></p>
      <p class="orange"><strong>Total Bruto: ${bruto.toFixed(2)} €</strong></p>
      <p class="green"><strong>Total Neto: ${neto.toFixed(2)} €</strong></p>
    </div>
  `;

  // handlers
  container.querySelector('#sm-mes').onchange = e => {
    state.mes = Number(e.target.value); save(state); render(container);
  };
  container.querySelector('#sm-anio').onchange = e => {
    state.anio = Number(e.target.value); save(state); render(container);
  };
  container.querySelector('#sm-irpf').onchange = e => {
    state.irpf = Number(e.target.value); save(state); render(container);
  };
  container.querySelector('#j-add').onclick = () => {
    const fecha = container.querySelector('#j-fecha').value;
    const precio = Number(container.querySelector('#j-precio').value);
    if (!fecha || !precio) return;
    state.jornales.push({
      id: Date.now(),
      fecha,
      precio,
      especialidad: container.querySelector('#j-esp').value,
      barco: container.querySelector('#j-barco').value,
      empresa: container.querySelector('#j-empresa').value,
      parte: container.querySelector('#j-parte').value
    });
    save(state); render(container);
  };
  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.del);
      state.jornales = state.jornales.filter(j => j.id !== id);
      save(state); render(container);
    };
  });
}

export default { render };
