
// App principal SIN login - GitHub Pages
const AppState = {
  currentPage: 'dashboard'
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Portal Estiba - Modo público (sin login)');
  showPage('dashboard');
  setupNavigation();
});

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
}

function setupNavigation() {
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', () => {
      const page = el.dataset.navigate;
      showPage(page);
    });
  });
}
