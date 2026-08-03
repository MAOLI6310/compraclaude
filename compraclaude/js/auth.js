// ============================================
// AUTENTICAÇÃO (Etapa 3 — Supabase real)
// Login, cadastro, logout e sessão do usuário,
// agora usando o banco de dados de verdade.
// ============================================

async function handleLogin(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;

    showNotification('Entrando...', 'Verificando suas credenciais', 'info');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        let errorMessage = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'E-mail ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada)';
        }
        showNotification('Erro', errorMessage, 'error');
        return;
    }

    // O listener onAuthStateChange (no fim deste arquivo) cuida de
    // carregar o perfil do usuário e atualizar a tela automaticamente.
    closeModal('loginModal');
    showNotification('Bem-vindo!', 'Login realizado com sucesso', 'success');
}

async function handleSignup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const name = formData.get('fullName');
    const cpf = formData.get('cpf');
    const email = formData.get('email');
    const password = formData.get('password');
    const selectedPlan = formData.get('selectedPlan'); // 'pro' ou 'premium' (vem do formulário)
    const paymentMethod = formData.get('paymentMethod');

    if (!name || !cpf || !email || !password || !selectedPlan || !paymentMethod) {
        showNotification('Erro', 'Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (!isValidCPF(cpf)) {
        showNotification('Erro', 'CPF inválido. Verifique o formato.', 'error');
        return;
    }

    if (paymentMethod === 'credit') {
        const cardNumber = formData.get('cardNumber');
        const cardName = formData.get('cardName');
        const cardExpiry = formData.get('cardExpiry');
        const cardCVV = formData.get('cardCVV');
        if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
            showNotification('Erro', 'Preencha todos os dados do cartão', 'error');
            return;
        }
    }

    showNotification('Criando conta...', 'Processando seus dados', 'info');

    // O formulário usa o valor "pro" para o plano de entrada — mapeamos
    // para a chave "basico" usada no banco (PLAN_INFO, em app-state.js).
    const planKey = selectedPlan === 'premium' ? 'premium' : 'basico';

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
    });

    if (error) {
        let errorMessage = 'Erro ao criar conta';
        if (error.message.includes('already registered') || error.message.includes('already in use')) {
            errorMessage = 'Este e-mail já está em uso';
        } else if (error.message.includes('Password should be') || error.message.includes('at least 6')) {
            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
        }
        showNotification('Erro', errorMessage, 'error');
        return;
    }

    const user = data.user;
    if (!user) {
        showNotification('Erro', 'Não foi possível criar a conta', 'error');
        return;
    }

    // Um gatilho (trigger) no banco já criou automaticamente uma linha em
    // "profiles" com o nome completo. Agora completamos com CPF, plano
    // escolhido e o período de teste grátis de 7 dias.
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
            cpf: cpf,
            plan: planKey,
            subscription_status: 'trial',
            trial_ends_at: trialEndsAt
        })
        .eq('id', user.id);

    if (profileError) {
        console.error('Erro ao salvar dados do perfil:', profileError);
        showNotification('Atenção', 'Conta criada, mas houve um problema ao salvar alguns dados do perfil', 'info');
    }

    closeModal('signupModal');

    if (!data.session) {
        // O projeto Supabase está configurado para exigir confirmação de e-mail
        showNotification('Quase lá!', 'Enviamos um link de confirmação para o seu e-mail. Confirme para poder entrar.', 'info');
    } else {
        showNotification('Bem-vindo!', `Conta criada com sucesso! Plano ${PLAN_INFO[planKey].label} ativo por 7 dias grátis.`, 'success');
        await logUserEvent('signup', { plan: planKey, paymentMethod });
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        showNotification('Erro', 'Erro ao fazer logout', 'error');
        return;
    }
    showNotification('Até logo!', 'Logout realizado com sucesso', 'info');
}

// ============================================
// E-mails transacionais
// Ainda não conectados a um serviço de envio real.
// Por enquanto só registram no console — entram em
// uma etapa futura quando definirmos o provedor de e-mail.
// ============================================
async function sendWelcomeEmail(email, name, plan) {
    console.log(`[e-mail simulado] Boas-vindas para ${name} (${email}) — plano ${plan}`);
}

async function sendPaymentConfirmationEmail(email, name, plan, amount) {
    console.log(`[e-mail simulado] Confirmação de pagamento para ${name} (${email}) — ${plan}, R$ ${amount}`);
}

// ============================================
// Eventos de analytics — placeholder simples por enquanto
// ============================================
async function logUserEvent(eventType, eventData = {}) {
    console.log(`[evento] ${eventType}`, eventData);
}

// ============================================
// Carrinho — a persistência real (tabela cart_items) entra na
// Etapa 6, junto com a conexão dos produtos reais ao carrinho.
// Por enquanto o carrinho some ao recarregar a página, como antes.
// ============================================
async function loadUserCart() {
    // TODO (Etapa 6): carregar o carrinho salvo da tabela cart_items
}

async function saveUserCart() {
    // TODO (Etapa 6): salvar o carrinho atual na tabela cart_items
}

// ============================================
// Carrega o perfil (tabela "profiles") do usuário autenticado
// ============================================
async function loadUserProfile(user) {
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
    }
    return profile;
}

// ============================================
// Observador de sessão — dispara automaticamente quando o
// usuário faz login, logout, ou quando a página carrega e já
// existe uma sessão válida salva no navegador.
// ============================================
supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    if (session && session.user) {
        const profile = await loadUserProfile(session.user);
        const planInfo = profile && PLAN_INFO[profile.plan] ? PLAN_INFO[profile.plan] : null;

        currentUser = {
            uid: session.user.id,
            name: (profile && profile.full_name) || session.user.email,
            email: session.user.email,
            cpf: profile ? profile.cpf : null,
            plan: planInfo ? planInfo.label : 'Básico',
            paymentMethod: null,
            createdAt: profile ? profile.created_at : null,
            savings: profile ? Number(profile.total_savings) : 0,
            isTrialActive: profile ? profile.subscription_status === 'trial' : false,
            trialEndsAt: profile ? profile.trial_ends_at : null
        };

        isLoggedIn = true;
        updateUserInterface();
        loadUserCart();
    } else {
        currentUser = null;
        isLoggedIn = false;
        cart = [];
        updateUserInterface();
        updateCartDisplay();
    }
});

function updateUserInterface() {
    const notLoggedIn = document.getElementById('notLoggedIn');
    const loggedIn = document.getElementById('loggedIn');
    const minhaContaLink = document.getElementById('minhaContaLink');
    const cartCount = document.getElementById('cartCount');

    if (isLoggedIn && currentUser) {
        if (notLoggedIn) notLoggedIn.classList.add('hidden');
        if (loggedIn) {
            loggedIn.classList.remove('hidden');
            loggedIn.style.display = 'flex';
        }

        if (minhaContaLink) {
            minhaContaLink.classList.remove('hidden');
            minhaContaLink.style.display = 'block';
            minhaContaLink.style.visibility = 'visible';
        }

        if (cartCount) {
            cartCount.classList.remove('hidden');
            cartCount.style.display = 'flex';
            cartCount.style.visibility = 'visible';
            cartCount.style.opacity = '1';
            cartCount.textContent = cart.length;

            const cartButton = cartCount.closest('button');
            if (cartButton) {
                cartButton.classList.remove('hidden');
                cartButton.style.display = 'block';
                cartButton.style.visibility = 'visible';
            }

            const cartContainer = cartCount.closest('.relative');
            if (cartContainer) {
                cartContainer.classList.remove('hidden');
                cartContainer.style.display = 'block';
                cartContainer.style.visibility = 'visible';
            }
        }

        const userName = document.getElementById('userName');
        const userInitials = document.getElementById('userInitials');
        const userPlan = document.getElementById('userPlan');
        const userSavings = document.getElementById('userSavings');

        if (userName) userName.textContent = currentUser.name;
        if (userInitials) userInitials.textContent = currentUser.name.charAt(0).toUpperCase();
        if (userPlan) userPlan.textContent = currentUser.plan;
        if (userSavings) userSavings.textContent = `R$ ${currentUser.savings.toFixed(2)}`;

        const userNameLarge = document.getElementById('userNameLarge');
        const userEmailLarge = document.getElementById('userEmailLarge');
        const userInitialsLarge = document.getElementById('userInitialsLarge');

        if (userNameLarge) userNameLarge.textContent = currentUser.name;
        if (userEmailLarge) userEmailLarge.textContent = currentUser.email;
        if (userInitialsLarge) userInitialsLarge.textContent = currentUser.name.charAt(0).toUpperCase();

        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileCPF = document.getElementById('profileCPF');

        if (profileName) profileName.value = currentUser.name;
        if (profileEmail) profileEmail.value = currentUser.email;
        if (profileCPF) profileCPF.value = currentUser.cpf || '';

        const currentPlanName = document.getElementById('currentPlanName');
        const currentPlanPrice = document.getElementById('currentPlanPrice');

        if (currentPlanName) currentPlanName.textContent = `Plano ${currentUser.plan}`;
        if (currentPlanPrice) {
            const planEntry = Object.values(PLAN_INFO).find(p => p.label === currentUser.plan);
            currentPlanPrice.textContent = `R$ ${(planEntry ? planEntry.price : 9.90).toFixed(2)}/mês`;
        }

        updateCartDisplay();

    } else {
        if (notLoggedIn) notLoggedIn.classList.remove('hidden');
        if (loggedIn) loggedIn.classList.add('hidden');
        if (minhaContaLink) minhaContaLink.classList.add('hidden');

        if (cartCount) {
            cartCount.classList.add('hidden');
            cartCount.style.display = 'none';
        }
    }
}
