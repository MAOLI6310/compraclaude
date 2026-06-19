// ============================================
// AUTENTICAÇÃO
// Login, cadastro, logout, sessão do usuário
// ============================================

        async function handleLogin(event) {
            event.preventDefault();
            const email = event.target.querySelector('input[type="email"]').value;
            const password = event.target.querySelector('input[type="password"]').value;
            
            showNotification('Entrando...', 'Verificando suas credenciais', 'info');
            
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Get user data from demo database
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // Set current user in localStorage
                    localStorage.setItem('currentDemoUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email
                    }));
                    
                    currentUser = {
                        uid: user.uid,
                        name: userData.fullName,
                        email: user.email,
                        plan: userData.selectedPlan || 'Pro',
                        paymentMethod: userData.paymentMethod,
                        createdAt: userData.createdAt,
                        savings: userData.totalSavings || 0,
                        isTrialActive: userData.isTrialActive || false,
                        trialEndsAt: userData.trialEndsAt
                    };
                    
                    isLoggedIn = true;
                    updateUserInterface();
                    closeModal('loginModal');
                    showNotification('Bem-vindo!', `Olá, ${currentUser.name}!`, 'success');
                    
                    // Load user's cart if exists
                    loadUserCart();
                } else {
                    throw { code: 'auth/user-not-found' };
                }
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Erro ao fazer login';
                
                switch(error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Usuário não encontrado';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Senha incorreta';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
                        break;
                }
                
                showNotification('Erro', errorMessage, 'error');
            }
        }

        async function handleSignup(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            
            const name = formData.get('fullName');
            const cpf = formData.get('cpf');
            const email = formData.get('email');
            const password = formData.get('password');
            const selectedPlan = formData.get('selectedPlan');
            const paymentMethod = formData.get('paymentMethod');
            
            // Validate required fields
            if (!name || !cpf || !email || !password || !selectedPlan || !paymentMethod) {
                showNotification('Erro', 'Preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            // Validate CPF format
            if (!isValidCPF(cpf)) {
                showNotification('Erro', 'CPF inválido. Verifique o formato.', 'error');
                return;
            }
            
            // If credit card is selected, validate card fields
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
            
            try {
                // Check if email already exists in demo mode
                const savedUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
                if (savedUsers.find(u => u.email === email)) {
                    throw { code: 'auth/email-already-in-use' };
                }
                
                // Create user in Demo Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                const planNames = {
                    'pro': 'Pro',
                    'premium': 'Premium',
                    'saudavel': '+Saudável'
                };
                
                const planPrices = {
                    'pro': 9.90,
                    'premium': 19.90,
                    'saudavel': 29.90
                };
                
                // Prepare user data
                const userData = {
                    uid: user.uid,
                    fullName: name,
                    cpf: cpf,
                    email: email,
                    password: password, // Only for demo mode
                    selectedPlan: planNames[selectedPlan],
                    planPrice: planPrices[selectedPlan],
                    paymentMethod: paymentMethod,
                    isTrialActive: true,
                    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(),
                    totalSavings: 0,
                    status: 'trial',
                    lastLogin: new Date()
                };
                
                // Add payment method details if credit card
                if (paymentMethod === 'credit') {
                    userData.cardDetails = {
                        cardNumber: formData.get('cardNumber').replace(/\s/g, '').slice(-4), // Only last 4 digits
                        cardName: formData.get('cardName'),
                        cardExpiry: formData.get('cardExpiry')
                    };
                }
                
                // Save user data to demo database
                await db.collection('users').doc(user.uid).set(userData);
                
                // Save to demo users list
                savedUsers.push(userData);
                localStorage.setItem('demoUsers', JSON.stringify(savedUsers));
                
                // Set current user in localStorage
                localStorage.setItem('currentDemoUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email
                }));
                
                // Update current user
                currentUser = {
                    uid: user.uid,
                    name: name,
                    email: email,
                    plan: planNames[selectedPlan],
                    paymentMethod: paymentMethod,
                    savings: 0,
                    isTrialActive: true,
                    trialEndsAt: userData.trialEndsAt,
                    createdAt: userData.createdAt
                };
                
                isLoggedIn = true;
                updateUserInterface();
                closeModal('signupModal');
                
                // Send welcome email (simulated)
                await sendWelcomeEmail(email, name, planNames[selectedPlan]);
                
                showNotification('Bem-vindo!', `Conta criada com sucesso! Plano ${planNames[selectedPlan]} ativo por 7 dias grátis.`, 'success');
                
                // Show trial information
                setTimeout(() => {
                    showNotification('Teste Grátis Ativo!', 'Aproveite 7 dias para testar todas as funcionalidades', 'info');
                }, 2000);
                
                // Log signup event for analytics
                await logUserEvent('signup', {
                    plan: selectedPlan,
                    paymentMethod: paymentMethod
                });
                
            } catch (error) {
                console.error('Signup error:', error);
                let errorMessage = 'Erro ao criar conta';
                
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'Este email já está em uso';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        break;
                }
                
                showNotification('Erro', errorMessage, 'error');
            }
        }

        async function logout() {
            try {
                await auth.signOut();
                
                // Clear localStorage
                localStorage.removeItem('currentDemoUser');
                
                currentUser = null;
                isLoggedIn = false;
                cart = [];
                updateUserInterface();
                updateCartDisplay();
                showNotification('Até logo!', 'Logout realizado com sucesso', 'info');
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Erro', 'Erro ao fazer logout', 'error');
            }
        }

        // Email Functions
        async function sendWelcomeEmail(email, name, plan) {
            try {
                const templateParams = {
                    to_email: email,
                    to_name: name,
                    plan_name: plan,
                    trial_days: 7,
                    company_name: 'Compra Boa JF'
                };

                await emailjs.send('YOUR_SERVICE_ID', 'welcome_template', templateParams);
                console.log('Welcome email sent successfully');
            } catch (error) {
                console.error('Error sending welcome email:', error);
            }
        }

        async function sendPaymentConfirmationEmail(email, name, plan, amount) {
            try {
                const templateParams = {
                    to_email: email,
                    to_name: name,
                    plan_name: plan,
                    amount: amount,
                    company_name: 'Compra Boa JF'
                };

                await emailjs.send('YOUR_SERVICE_ID', 'payment_confirmation_template', templateParams);
                console.log('Payment confirmation email sent successfully');
            } catch (error) {
                console.error('Error sending payment confirmation email:', error);
            }
        }

        // Analytics Functions
        async function logUserEvent(eventType, eventData = {}) {
            try {
                if (currentUser) {
                    await db.collection('analytics').add({
                        userId: currentUser.uid,
                        eventType: eventType,
                        eventData: eventData,
                        timestamp: new Date(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    });
                }
            } catch (error) {
                console.error('Error logging event:', error);
            }
        }

        // Cart Functions with Firebase
        async function loadUserCart() {
            if (!currentUser) return;
            
            try {
                const cartDoc = await db.collection('carts').doc(currentUser.uid).get();
                if (cartDoc.exists) {
                    cart = cartDoc.data().items || [];
                    updateCartDisplay();
                }
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }

        async function saveUserCart() {
            if (!currentUser) return;
            
            try {
                await db.collection('carts').doc(currentUser.uid).set({
                    items: cart,
                    updatedAt: new Date()
                });
            } catch (error) {
                console.error('Error saving cart:', error);
            }
        }

        // Auth State Observer
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        currentUser = {
                            uid: user.uid,
                            name: userData.fullName,
                            email: user.email,
                            plan: userData.selectedPlan || 'Pro',
                            paymentMethod: userData.paymentMethod,
                            createdAt: userData.createdAt,
                            savings: userData.totalSavings || 0,
                            isTrialActive: userData.isTrialActive || false,
                            trialEndsAt: userData.trialEndsAt
                        };
                        
                        isLoggedIn = true;
                        updateUserInterface();
                        loadUserCart();
                        
                        // Update last login
                        await db.collection('users').doc(user.uid).update({
                            lastLogin: new Date()
                        });
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            } else {
                // User is signed out
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
            
            console.log('🔧 updateUserInterface called');
            console.log('isLoggedIn:', isLoggedIn);
            console.log('currentUser:', currentUser);
            
            if (isLoggedIn && currentUser) {
                console.log('✅ User is logged in, showing elements');
                
                // Show logged in elements
                if (notLoggedIn) notLoggedIn.classList.add('hidden');
                if (loggedIn) {
                    loggedIn.classList.remove('hidden');
                    loggedIn.style.display = 'flex';
                }
                
                // FORCE SHOW "Minha Conta" link
                if (minhaContaLink) {
                    minhaContaLink.classList.remove('hidden');
                    minhaContaLink.style.display = 'block';
                    minhaContaLink.style.visibility = 'visible';
                    console.log('✅ Minha Conta link shown');
                }
                
                // FORCE SHOW cart icon and count - MULTIPLE WAYS
                if (cartCount) {
                    cartCount.classList.remove('hidden');
                    cartCount.style.display = 'flex';
                    cartCount.style.visibility = 'visible';
                    cartCount.style.opacity = '1';
                    cartCount.textContent = cart.length;
                    
                    // Also force show the parent cart button
                    const cartButton = cartCount.closest('button');
                    if (cartButton) {
                        cartButton.classList.remove('hidden');
                        cartButton.style.display = 'block';
                        cartButton.style.visibility = 'visible';
                    }
                    
                    // Force show the entire cart container
                    const cartContainer = cartCount.closest('.relative');
                    if (cartContainer) {
                        cartContainer.classList.remove('hidden');
                        cartContainer.style.display = 'block';
                        cartContainer.style.visibility = 'visible';
                    }
                    
                    console.log('✅ Cart icon forced to show with count:', cart.length);
                }
                
                // Update user info in header
                const userName = document.getElementById('userName');
                const userInitials = document.getElementById('userInitials');
                const userPlan = document.getElementById('userPlan');
                const userSavings = document.getElementById('userSavings');
                
                if (userName) userName.textContent = currentUser.name;
                if (userInitials) userInitials.textContent = currentUser.name.charAt(0).toUpperCase();
                if (userPlan) userPlan.textContent = currentUser.plan;
                if (userSavings) userSavings.textContent = `R$ ${currentUser.savings.toFixed(2)}`;
                
                // Update user info in Minha Conta page
                const userNameLarge = document.getElementById('userNameLarge');
                const userEmailLarge = document.getElementById('userEmailLarge');
                const userInitialsLarge = document.getElementById('userInitialsLarge');
                
                if (userNameLarge) userNameLarge.textContent = currentUser.name;
                if (userEmailLarge) userEmailLarge.textContent = currentUser.email;
                if (userInitialsLarge) userInitialsLarge.textContent = currentUser.name.charAt(0).toUpperCase();
                
                // Update profile form fields
                const profileName = document.getElementById('profileName');
                const profileEmail = document.getElementById('profileEmail');
                const profileCPF = document.getElementById('profileCPF');
                
                if (profileName) profileName.value = currentUser.name;
                if (profileEmail) profileEmail.value = currentUser.email;
                if (profileCPF) profileCPF.value = currentUser.cpf || '000.000.000-00';
                
                // Update subscription info
                const currentPlanName = document.getElementById('currentPlanName');
                const currentPlanPrice = document.getElementById('currentPlanPrice');
                
                if (currentPlanName) currentPlanName.textContent = `Plano ${currentUser.plan}`;
                if (currentPlanPrice) {
                    const prices = { 'Pro': 9.90, 'Premium': 19.90, '+Saudável': 29.90 };
                    currentPlanPrice.textContent = `R$ ${prices[currentUser.plan] || 9.90}/mês`;
                }
                
                // Update cart display
                updateCartDisplay();

            } else {
                console.log('❌ User not logged in, hiding elements');
                if (notLoggedIn) notLoggedIn.classList.remove('hidden');
                if (loggedIn) loggedIn.classList.add('hidden');
                if (minhaContaLink) minhaContaLink.classList.add('hidden');
                
                // Hide cart when not logged in
                if (cartCount) {
                    cartCount.classList.add('hidden');
                    cartCount.style.display = 'none';
                }
            }
        }

        // Product search
