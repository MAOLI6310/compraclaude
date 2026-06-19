// ============================================
// ESTADO GLOBAL DA APLICAÇÃO
// Variáveis compartilhadas entre os módulos
// ============================================

        // Global variables
        let currentUser = null;
        let cart = [];
        let isLoggedIn = false;
        let userSubscription = null;
        let mapAnimationInterval = null;

        // Planos de assinatura disponíveis (precisa bater com o "check"
        // da coluna profiles.plan no banco: 'none' | 'basico' | 'premium')
        const PLAN_INFO = {
            basico: { label: 'Básico', price: 9.90 },
            premium: { label: 'Premium', price: 19.90 }
        };
