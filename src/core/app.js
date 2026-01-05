// Arranque seguro de la app
import oraculo from '../modules/oraculo.js';
import dashboard from '../modules/dashboard.js';
import sueldometro from '../modules/sueldometro.js';

document.addEventListener('DOMContentLoaded', () => {
  const oraculoPage = document.getElementById('page-oraculo');
  const dashboardPage = document.getElementById('page-dashboard');
  const sueldometroPage = document.getElementById('page-sueldometro');
  
  oraculo?.render?.(oraculoPage);
  dashboard?.render?.(dashboardPage);
  sueldometro?.render?.(sueldometroPage);
});
