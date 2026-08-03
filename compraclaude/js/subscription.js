// ============================================
// PLANOS E PAGAMENTO
// ============================================

        async function selectPlan(planType) {
            if (!isLoggedIn) {
                showSignupModal();
                return;
            }

            const planInfo = PLAN_INFO[planType];
            if (!planInfo) {
                console.error('Plano desconhecido:', planType);
                return;
            }

            // Show payment processing modal
            showPaymentProcessingModal(planType, planInfo.label, planInfo.price);
        }

        function showPaymentProcessingModal(planKey, planName, planPrice) {
            let modal = document.getElementById('paymentProcessingModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'paymentProcessingModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            
            modal.innerHTML = `
                <div class="premium-glass rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="text-center">
                        <div id="processingStep1" class="step-content">
                            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div class="loading-spinner"></div>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-2">Processando Pagamento</h3>
                            <p class="text-slate-600 mb-4">Plano ${planName} - R$ ${planPrice.toFixed(2)}/mês</p>
                            <p class="text-sm text-slate-500">Validando dados do cartão...</p>
                        </div>
                        
                        <div id="processingStep2" class="step-content hidden">
                            <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div class="loading-spinner"></div>
                            </div>
                            <h3 class="text-2xl font-bold text-slate-800 mb-2">Autorizando Transação</h3>
                            <p class="text-slate-600 mb-4">Comunicando com o banco...</p>
                            <p class="text-sm text-slate-500">Aguarde alguns segundos</p>
                        </div>
                        
                        <div id="processingStep3" class="step-content hidden">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                            </div>
                            <h3 class="text-2xl font-bold text-green-800 mb-2">Pagamento Aprovado!</h3>
                            <p class="text-green-600 mb-4">Plano ${planName} ativado com sucesso</p>
                            <p class="text-sm text-slate-500">Você receberá um email de confirmação</p>
                            
                            <button onclick="closePaymentModal()" class="mt-6 premium-button text-white px-8 py-3 rounded-lg font-semibold">
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
            
            // Simulate payment processing steps
            setTimeout(() => {
                document.getElementById('processingStep1').classList.add('hidden');
                document.getElementById('processingStep2').classList.remove('hidden');
            }, 2000);
            
            setTimeout(async () => {
                document.getElementById('processingStep2').classList.add('hidden');
                document.getElementById('processingStep3').classList.remove('hidden');
                
                // Update user plan in Supabase
                if (currentUser) {
                    try {
                        const { error } = await supabaseClient
                            .from('profiles')
                            .update({
                                plan: planKey,
                                subscription_status: 'active'
                            })
                            .eq('id', currentUser.uid);

                        if (error) throw error;

                        // Update current user object
                        currentUser.plan = planName;
                        updateUserInterface();

                        // Log payment event
                        await logUserEvent('payment_processed', {
                            plan: planKey,
                            amount: planPrice,
                            paymentMethod: currentUser.paymentMethod || 'credit'
                        });

                        // Send payment confirmation email
                        await sendPaymentConfirmationEmail(currentUser.email, currentUser.name, planName, planPrice);

                    } catch (error) {
                        console.error('Error updating user plan:', error);
                    }
                }
            }, 4000);
        }

        function closePaymentModal() {
            const modal = document.getElementById('paymentProcessingModal');
            if (modal) {
                modal.classList.remove('active');
                showNotification('Plano Ativado!', 'Aproveite todas as funcionalidades premium', 'success');
            }
        }

        // Price history and alerts
