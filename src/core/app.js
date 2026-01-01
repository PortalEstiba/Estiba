// src/core/app.js
// Arranque correcto de la app Portal Estiba

import dashboard from '../modules/dashboard.js';
import sueldometro from '../modules/sueldometro.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Portal Estiba iniciado');

  const dashboardPage = document.getElementById('page-dashboard');
  const sueldometroPage = document.getElementById('page-sueldometro');

  // Render inicial Dashboard
  if (dashboard && dashboard.render) {
    dashboard.render(dashboardPage);
  }

  // Preparar Sueldómetro (se muestra al navegar)
  if (sueldometro && sueldometro.render) {
    sueldometro.render(sueldometroPage);
  }
});
