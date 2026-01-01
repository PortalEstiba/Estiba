// src/core/app.js
// Enrutado simple + carga de módulos

import Sueldometro from '../modules/sueldometro.js';

document.addEventListener('DOMContentLoaded', () => {
  showPage('dashboard');
  setupNavigation();
});

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) {
    page.classList.add('active');
    if (pageId === 'sueldometro') {
      const mount = page.querySelector('#sueldometro-root');
      Sueldometro.render(mount);
    }
  }
}

function setupNavigation() {
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', () => showPage(el.dataset.navigate));
  });
}

window.showPage = showPage;
