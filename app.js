import Dashboard from './dashboard.js';
import Sueldometro from './sueldometro.js';

const pages = {
  dashboard: Dashboard,
  sueldometro: Sueldometro
};

window.showPage = function (id, btn) {
  // páginas
  document.querySelectorAll('.page')
    .forEach(p => p.classList.remove('active'));

  const page = document.getElementById(id);
  page.classList.add('active');

  // botones
  document.querySelectorAll('.nav-btn')
    .forEach(b => b.classList.remove('active'));

  if (btn) btn.classList.add('active');

  // 🔥 render contenido
  pages[id]?.render(page);
};

// render inicial
document.addEventListener('DOMContentLoaded', () => {
  showPage('dashboard', document.querySelector('.nav-btn'));
});