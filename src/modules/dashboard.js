// Dashboard básico funcional
export default {
  render(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="card">
        <h2>Bienvenido/a</h2>
        <p>Aplicación pública sin login.</p>
      </div>
    `;
  }
};
