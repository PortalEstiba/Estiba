import Sueldometro from '../modules/sueldometro.js';
import Oraculo from '../modules/oraculo.js';

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

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const target = document.getElementById(`page-${page}`);
  if (!target) return;

  target.classList.add('active');

  // 🔥 AQUÍ ESTABA EL PROBLEMA
  if (page === 'sueldometro') {
    Sueldometro.render(target);
  }

  if (page === 'oraculo') {
    Oraculo.render(target);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-navigate]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.navigate));
  });

  // Render inicial
  showPage('dashboard');
});

