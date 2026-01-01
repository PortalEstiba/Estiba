// Arranque seguro de la app
import dashboard from '../modules/dashboard.js';
import sueldometro from '../modules/sueldometro.js';

document.addEventListener('DOMContentLoaded', () => {
  const dashboardPage = document.getElementById('page-dashboard');
  const sueldometroPage = document.getElementById('page-sueldometro');

  dashboard?.render?.(dashboardPage);
  sueldometro?.render?.(sueldometroPage);
});
