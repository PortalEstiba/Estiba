// src/modules/sueldometro.js
// Sueldómetro v3: selector de mes/año + edición y borrado

const STORAGE_KEY = 'sueldometro_v3';

const defaultState = {
  irpf: 35,
  mes: new Date().getMonth(),
  anio: new Date().getFullYear(),
  jornales: []
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
  return new Date(dateStr).getDate() <= 15 ? 'q1' : 'q2';
}

function calc(state) {
  let q1 = 0, q2 = 0;
  const filtered = state.jornales.filter(j => {
    const d = new Date(j.fecha);
    return d.getMonth() === state.mes && d.getFullYear() === state.anio;
  });
  filtered.forEach(j => {
    quincena(j.fecha) === 'q1' ? q1 += j.precio : q2 += j.precio;
  });
  const bruto = q1 + q2;
  const neto = bruto * (1 - state.irpf / 100);
  return { q1, q2, bruto, neto, count: filtered.length };
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function render(container) {
  const state = load();
  const { q1, q2, bruto, neto, count } = calc(state);

  container.innerHTML = `
    <div class="card">
      <h2>💰 Sueldómetro</h2>
      <div class="grid">
        <label>Mes
          <select id="sm-mes">
            ${MONTHS.map((m,i)=>`<option value="${i}" ${i===state.mes?'selected':''}>${m}</option>`).join('')}
          </select>
        </label>
        <label>Año
          <select id="sm-anio">
            ${Array.from({length:6}).map((_,i)=>{
              const y = new Date().getFullYear() - 3 + i;
              return `<option value="${y}" ${y===state.anio?'selected':''}>${y}</option>`;
            }).join('')}
          </select>
        </label>
        <label>IRPF %
          <input id="irpf" type="number" value="${state.irpf}">
        </label>
      </div>
    </div>

    <div class="card">
      <h3>➕ Añadir / Editar jornal</h3>
      <input type="hidden" id="j-id">
      <input id="j-fecha" type="date">
      <input id="j-precio" type="number" placeholder="Precio €">
      <input id="j-esp" placeholder="Especialidad">
      <input id="j-barco" placeholder="Barco">
      <input id="j-empresa" placeholder="Empresa">
      <input id="j-parte" placeholder="Nº Parte">
      <button id="j-save" class="primary">Guardar</button>
    </div>

    <div class="card">
      <h3>📋 Jornales (${MONTHS[state.mes]} ${state.anio})</h3>
      ${state.jornales.filter(j => {
        const d = new Date(j.fecha);
        return d.getMonth() === state.mes && d.getFullYear() === state.anio;
      }).map(j => `
        <div class="row">
          <div>
            <strong>${j.fecha}</strong> · ${j.especialidad || '-'} · ${j.barco || '-'}
            <div class="muted">${j.empresa || '-'} · Parte ${j.parte || '-'}</div>
          </div>
          <div class="right">
            <strong>${j.precio.toFixed(2)} €</strong>
            <button data-edit="${j.id}">✏️</button>
            <button data-del="${j.id}" class="danger">✕</button>
          </div>
        </div>
      `).join('') || '<p class="muted">No hay jornales este mes.</p>'}
    </div>

    <div class="card">
      <h3>📊 Resumen del mes</h3>
      <p>Jornales: <strong>${count}</strong></p>
      <p>Bruto 1–15: <strong>${q1.toFixed(2)} €</strong></p>
      <p>Bruto 16–fin: <strong>${q2.toFixed(2)} €</strong></p>
      <p class="orange"><strong>Total Bruto: ${bruto.toFixed(2)} €</strong></p>
      <p class="green"><strong>Total Neto: ${neto.toFixed(2)} €</strong></p>
    </div>
  `;

  container.querySelector('#sm-mes').onchange = e => {
    state.mes = Number(e.target.value); save(state); render(container);
  };
  container.querySelector('#sm-anio').onchange = e => {
    state.anio = Number(e.target.value); save(state); render(container);
  };
  container.querySelector('#irpf').onchange = e => {
    state.irpf = Number(e.target.value); save(state); render(container);
  };

  container.querySelector('#j-save').onclick = () => {
    const id = container.querySelector('#j-id').value;
    const jornal = {
      id: id ? Number(id) : Date.now(),
      fecha: container.querySelector('#j-fecha').value,
      precio: Number(container.querySelector('#j-precio').value),
      especialidad: container.querySelector('#j-esp').value,
      barco: container.querySelector('#j-barco').value,
      empresa: container.querySelector('#j-empresa').value,
      parte: container.querySelector('#j-parte').value
    };
    if (!jornal.fecha || !jornal.precio) return;
    if (id) {
      state.jornales = state.jornales.map(j => j.id === jornal.id ? jornal : j);
    } else {
      state.jornales.push(jornal);
    }
    save(state); render(container);
  };

  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const j = state.jornales.find(x => x.id == btn.dataset.edit);
      container.querySelector('#j-id').value = j.id;
      container.querySelector('#j-fecha').value = j.fecha;
      container.querySelector('#j-precio').value = j.precio;
      container.querySelector('#j-esp').value = j.especialidad;
      container.querySelector('#j-barco').value = j.barco;
      container.querySelector('#j-empresa').value = j.empresa;
      container.querySelector('#j-parte').value = j.parte;
    };
  });

  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => {
      state.jornales = state.jornales.filter(j => j.id != btn.dataset.del);
      save(state); render(container);
    };
  });
}

export default { render };
