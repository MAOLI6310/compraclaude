// ============================================
// INICIALIZAÇÃO DA PÁGINA
// ============================================

        function testLogin() {
            currentUser = {
                uid: 'test_user_123',
                name: 'João Silva',
                email: 'joao@teste.com',
                plan: 'Premium',
                paymentMethod: 'credit',
                createdAt: new Date(),
                savings: 156.80,
                isTrialActive: false,
                trialEndsAt: null,
                cpf: '123.456.789-00'
            };
            
            isLoggedIn = true;
            cart = []; // Start with empty cart
            
            updateUserInterface();
            updateCartDisplay();
            
            showNotification('Login de Teste!', 'Usuário João Silva logado com sucesso', 'success');
            
            console.log('TEST LOGIN ACTIVATED');
            console.log('Current User:', currentUser);
            console.log('Is Logged In:', isLoggedIn);
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            // Close modals when clicking outside
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            });
            
            // Initialize user interface
            updateUserInterface();
            updateCartDisplay();
            
            // Initialize form handlers
            handlePlanSelection();
            handlePaymentSelection();
            
            // AUTO TEST LOGIN - REMOVE IN PRODUCTION
            setTimeout(() => {
                testLogin();
            }, 1000);
        });
