// ============================================
// INICIALIZAÇÃO DA PÁGINA
// ============================================
// O login automático de teste (testLogin) foi removido nesta etapa.
// Agora quem controla se o usuário está logado é a sessão real do
// Supabase (veja o listener supabaseClient.auth.onAuthStateChange,
// no final de js/auth.js) — ele roda sozinho assim que a página
// carrega e verifica se já existe uma sessão salva no navegador.
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Initialize user interface (começa "deslogado" até o Supabase confirmar a sessão)
    updateUserInterface();
    updateCartDisplay();

    // Initialize form handlers
    handlePlanSelection();
    handlePaymentSelection();
});
