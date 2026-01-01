
// PARCHE FAB + MODAL (no elimina lógica existente)
const fab = document.getElementById('fabAddJornal');
const modal = document.getElementById('modalJornal');
const closeBtn = document.getElementById('closeModal');
const formContainer = document.getElementById('modalFormContainer');

fab.onclick = () => {
  modal.classList.remove('hidden');
  document.getElementById('page-sueldometro')?.querySelector('.card')?.scrollIntoView();
};

closeBtn.onclick = () => modal.classList.add('hidden');

// Hook para inyectar el formulario existente
export function mountJornalForm(html){
  formContainer.innerHTML = html;
}
