// Router por secciones
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-navigate]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.navigate));
  });
});

import Oraculo from './modules/oraculo.js';

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  // 🔥 NUEVO: inicialización por página
  if (page === 'sueldometro') {
    if (typeof loadCalculadora === 'function') {
      loadCalculadora();
    }
  }

  if (page === 'oraculo') {
    if (typeof loadCalculadora === 'function') {
      loadCalculadora();
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-navigate]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.navigate));
  });
});
