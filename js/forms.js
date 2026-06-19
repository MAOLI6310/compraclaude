// ============================================
// FORMULÁRIOS (seleção de plano e pagamento)
// ============================================

        function handlePlanSelection() {
            const planRadios = document.querySelectorAll('input[name="selectedPlan"]');
            const planOptions = document.querySelectorAll('.plan-option');
            const selectedPlanName = document.getElementById('selectedPlanName');
            const selectedPlanPrice = document.getElementById('selectedPlanPrice');
            const firstBilling = document.getElementById('firstBilling');
            
            planRadios.forEach((radio, index) => {
                radio.addEventListener('change', function() {
                    // Remove selected class from all options
                    planOptions.forEach(option => option.classList.remove('selected'));
                    
                    // Add selected class to chosen option
                    if (this.checked) {
                        planOptions[index].classList.add('selected');
                        
                        const planData = {
                            'pro': { name: 'Pro', price: 'R$ 9,90' },
                            'premium': { name: 'Premium', price: 'R$ 19,90' },
                            'saudavel': { name: '+Saudável', price: 'R$ 29,90' }
                        };
                        
                        const plan = planData[this.value];
                        selectedPlanName.textContent = plan.name;
                        selectedPlanPrice.textContent = plan.price;
                        
                        // Calculate first billing date (7 days from now)
                        const firstBillingDate = new Date();
                        firstBillingDate.setDate(firstBillingDate.getDate() + 7);
                        firstBilling.textContent = firstBillingDate.toLocaleDateString('pt-BR');
                    }
                });
            });
        }

        function handlePaymentSelection() {
            const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
            const paymentOptions = document.querySelectorAll('.payment-option');
            const creditCardFields = document.getElementById('creditCardFields');
            const pixInfo = document.getElementById('pixInfo');
            
            paymentRadios.forEach((radio, index) => {
                radio.addEventListener('change', function() {
                    // Remove selected class from all options
                    paymentOptions.forEach(option => option.classList.remove('selected'));
                    
                    // Add selected class to chosen option
                    if (this.checked) {
                        paymentOptions[index].classList.add('selected');
                        
                        if (this.value === 'credit') {
                            creditCardFields.classList.remove('hidden');
                            pixInfo.classList.add('hidden');
                            
                            // Make card fields required
                            const cardInputs = creditCardFields.querySelectorAll('input');
                            cardInputs.forEach(input => input.required = true);
                        } else {
                            creditCardFields.classList.add('hidden');
                            pixInfo.classList.remove('hidden');
                            
                            // Remove required from card fields
                            const cardInputs = creditCardFields.querySelectorAll('input');
                            cardInputs.forEach(input => input.required = false);
                        }
                    }
                });
            });
        }

        // Map animation functions
