// ================================
// DASHBOARD CON ENLACES
// ================================

// Datos estáticos - Enlaces
const ENLACES_DATA = [

  // Formularios
  { titulo: 'Punto y HS', url: 'https://docs.google.com/forms/d/e/1FAIpQLSeGKl5gwKrcj110D_6xhHVo0bn7Fo56tneof68dRyS6xUrD7Q/viewform', categoria: 'Formularios', color: 'blue' },
  { titulo: 'Cambio Posición', url: 'https://docs.google.com/forms/d/e/1FAIpQLSe6V16kccSmyBAYCkDNphYAbD7dqe4ydHbVWu_zpXvnFFFxlA/viewform', categoria: 'Formularios', color: 'blue' },
  { titulo: 'Cambio IRPF', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfDe2o5X_Bge14GA-bSBPRL7zpB2ZW_isBGGVFGAyvGkSAomQ/viewform', categoria: 'Formularios', color: 'blue' },
  { titulo: 'Justificantes', url: 'https://docs.google.com/forms/d/e/1FAIpQLSc27Doc2847bvoPTygEKscwl9jdMuavlCOgtzNDXYVnjSLsUQ/viewform', categoria: 'Formularios', color: 'blue' },
  { titulo: 'Comunicar Incidencia', url: 'https://docs.google.com/forms/d/e/1FAIpQLSdc_NZM-gasxCpPZ3z09HgKcEcIapDsgDhNi_9Y45a-jpJnMw/viewform', categoria: 'Formularios', color: 'blue' },
  { titulo: 'Modelo 145', url: 'https://docs.google.com/forms/d/e/1FAIpQLSdEumqz7aiATukMmIyO2euqhVW5HEqf5Tn5WetAH5LBabcprg/viewform', categoria: 'Formularios', color: 'blue' },

  // Disponibilidad
  { titulo: 'No Disponible Jornada', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfXcs0lOG7beU9HMfum-6eKkwmZCjcvnOQXaFiiY8EAb9rpYA/closedform', categoria: 'Disponibilidad', color: 'yellow' },
  { titulo: 'No Disponible Periodo', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfTqZSFoEbs89vxmGXVi5DKpKIyH5npIOpI11uiQnt32Rxp3g/closedform', categoria: 'Disponibilidad', color: 'yellow' },
  { titulo: 'Recuperación', url: 'https://docs.google.com/forms/d/e/1FAIpQLSeEaBKptVkoX4oxktWkl5Be7fOhjdYUiRupyFkrG3LxWKISMA/viewform', categoria: 'Disponibilidad', color: 'yellow' },

  // Documentos
  { titulo: 'Carnet de Conducir', url: 'https://docs.google.com/forms/d/e/1FAIpQLSdKF0jRJjcFrdbL3Wk_U-0Cjb3T-JeVYDNuN8QU1a-60kAXqA/viewform', categoria: 'Documentos', color: 'orange' },
  { titulo: 'Doc. Desempleo', url: 'https://docs.google.com/forms/d/e/1FAIpQLScL1GRtLuuRGgOolBLe31cWKqY92DZ9mFzfN2_uJwx3XmRq3g/viewform', categoria: 'Documentos', color: 'orange' },
  { titulo: '145 Abreviado', url: 'https://drive.google.com/file/d/1AwHoBJHTumN-cEYk6jV0nZGBGVFSJWPj/view', categoria: 'Documentos', color: 'orange' },

  // Seguridad
  { titulo: '¿Qué hago en caso de accidente?', url: 'https://drive.google.com/file/d/1Jei371j-lI95VTkBzm2XVfOxofjxvzbh/view', categoria: 'Seguridad', color: 'red' },

  // Información
  { titulo: 'Censo DO', url: 'https://drive.google.com/file/d/1yIqMMJCRTyS8GZglMLTnR01A4MLU-spf/view', categoria: 'Información', color: 'green' },
  { titulo: 'Calendario de Pago', url: 'https://drive.google.com/file/d/1bovGdc1Fb6VRHrru1DrJOsSjbSEhFZgN/view', categoria: 'Información', color: 'green' },
  { titulo: 'Teléfonos Terminales', url: 'https://drive.google.com/file/d/1KxLm_X_0JdUEJF7JUuIvNNleU-PTqUgv/view', categoria: 'Información', color: 'green' },
  { titulo: 'Tabla Contratación', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSTtbkA94xqjf81lsR7bLKKtyES2YBDKs8J2T4UrSEan7e5Z_eaptShCA78R1wqUyYyASJxmHj3gDnY/pubhtml?gid=1388412839&single=true', categoria: 'Información', color: 'green' },
  { titulo: 'Chapero', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTrMuapybwZUEGPR1vsP9p1_nlWvznyl0sPD4xWsNJ7HdXCj1ABY1EpU1um538HHZQyJtoAe5Niwrxq/pubhtml?gid=841547354&single=true', categoria: 'Información', color: 'green' },
  { titulo: 'Previsión Demanda', url: 'https://noray.cpevalencia.com/PrevisionDemanda.asp', categoria: 'Información', color: 'green' },
  { titulo: 'Chapero CPE', url: 'https://noray.cpevalencia.com/Chapero.asp', categoria: 'Información', color: 'green' },
  { titulo: 'Asignación CSP', url: 'https://workerhub.marvalsa.com/login', categoria: 'Información', color: 'green' },
  { titulo: 'Asignación MSC', url: 'https://intranet.msctv.es/ESTIBA/asignacion.asp?chapa=', categoria: 'Información', color: 'green' },
  // Comunicaciones
  { titulo: 'Comunicación Contingencia', url: 'https://docs.google.com/forms/d/e/1FAIpQLSdxLm9xqP4FOv61h3-YoyRFzkxKcfAGir_YYRi5e4PTFisEAw/viewform', categoria: 'Comunicaciones', color: 'purple' }
];

// ================================
// PUERTAS DEL DÍA (Dashboard)
// ================================

const PUERTAS_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrQ5bGZDNShEWi1lwx_l1EvOxC0si5kbN8GBxj34rF0FkyGVk6IZOiGk5D91_TZXBHO1mchydFvvUl/gviz/tq?tqx=out:json&gid=3770623';
  
async function cargarPuertas() {
  const card = document.getElementById('puertas-card');
  if (!card) return;

  try {
    const res = await fetch(PUERTAS_URL);
    const text = await res.text();

    // Google Sheets wrapper FIX (iOS compatible)
    const match = text.match(/setResponse\(([\s\S]*?)\);/);
    if (!match || !match[1]) throw new Error('Formato no válido');

    const json = JSON.parse(match[1]);

    const rows = json.table.rows;

    const puertas = rows.map(r => ({
      jornada: r.c[0]?.v ?? '',
      sp: r.c[1]?.v ?? '— No contratada',
      oc: r.c[2]?.v ?? '— No contratada'
    }));

    card.innerHTML = `
      <h3>🚪 Puertas del Día</h3>
      <table class="puertas-table">
        <thead>
          <tr>
            <th>Jornada</th>
            <th>Puerta SP</th>
            <th>Puerta OC</th>
          </tr>
        </thead>
        <tbody>
          ${puertas.map(p => `
            <tr>
              <td>${p.jornada}</td>
              <td class="${p.sp.includes('No') ? 'no' : 'sp'}">${p.sp}</td>
              <td class="${p.oc.includes('No') ? 'no' : 'oc'}">${p.oc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p class="muted">Actualizado automáticamente</p>
    `;
  } catch (e) {
    console.error(e);
    card.innerHTML = `
      <h3>🚪 Puertas del Día</h3>
      <p class="error">❌ Error cargando puertas</p>
    `;
  }
}

export default {
  render(container) {
    if (!container) return;

    const categorias = [...new Set(ENLACES_DATA.map(e => e.categoria))];

    container.innerHTML = `
      <div class="card">
  <h2>Bienvenido/a</h2>
  <p>Aplicación creada solamente para un sueldómetro y oraculo gratuito.</p>
</div>

<div class="card" id="puertas-card">
  <h3>🚪 Puertas del Día</h3>
  <p class="muted">Cargando puertas…</p>
</div>

      ${categorias.map(cat => `
        <div class="card">
          <h3>${cat}</h3>
          <div class="grid-links">
            ${ENLACES_DATA
              .filter(e => e.categoria === cat)
              .map(e => `
                <a href="${e.url}" target="_blank" rel="noopener" class="link-card ${e.color}">
                  ${e.titulo}
                </a>
              `).join('')}
          </div>
        </div>
      `).join('')}
    `;
  }
};
setTimeout(() => {
  cargarPuertas();
  setInterval(cargarPuertas, 5 * 60 * 1000);
}, 0);