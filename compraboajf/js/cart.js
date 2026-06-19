// ============================================
// CARRINHO DE COMPRAS
// ============================================

        async function addToCart(name, price, store) {
            if (!isLoggedIn) {
                showSignupModal();
                return;
            }
            
            const item = {
                id: Date.now(),
                name: name,
                price: price,
                store: store,
                quantity: 1,
                originalPrice: price * 1.15, // Simulate original price
                hasPromotion: Math.random() > 0.7,
                cashbackEligible: currentUser && currentUser.plan === 'Premium',
                addedAt: new Date()
            };
            
            cart.push(item);
            updateCartDisplay();
            
            // Save cart to Firebase
            await saveUserCart();
            
            // Log add to cart event
            await logUserEvent('add_to_cart', {
                productName: name,
                price: price,
                store: store
            });
            
            // Keep cart open if it was already open, or open it if it's the first item
            if (!isCartOpen || cart.length === 1) {
                openCart();
            }
            
            // Show plan-specific features
            if (currentUser) {
                if (currentUser.plan === 'Pro') {
                    showNotification('Adicionado!', `${name} foi adicionado ao carrinho`, 'success');
                } else if (currentUser.plan === 'Premium') {
                    const cashback = item.cashbackEligible ? (price * 0.05).toFixed(2) : '0.00';
                    showNotification('Adicionado + Cashback!', `${name} adicionado. Cashback: R$ ${cashback}`, 'success');
                }
            }
            
            // Check for suggested substitutions (Premium only)
            if (currentUser && currentUser.plan === 'Premium') {
                setTimeout(() => {
                    checkForSubstitutions(item);
                }, 1000);
            }
        }

        function checkForSubstitutions(item) {
            // Simulate finding better alternatives
            const alternatives = [
                {
                    name: item.name.replace('Premium', 'Econômica').replace('Nacional', 'Popular'),
                    price: item.price * 0.85,
                    store: 'Atacadão Benfica',
                    savings: item.price * 0.15,
                    reason: 'Melhor preço'
                },
                {
                    name: item.name.replace('Premium', 'Light').replace('Nacional', 'Integral'),
                    price: item.price * 1.05,
                    store: item.store,
                    savings: 0,
                    reason: 'Mais saudável',
                    healthier: true
                }
            ];
            
            const suggestion = alternatives[Math.floor(Math.random() * alternatives.length)];
            
            if (suggestion.savings > 0 || suggestion.healthier) {
                showSubstitutionModal(item, suggestion);
            }
        }

        function showSubstitutionModal(originalItem, suggestion) {
            let modal = document.getElementById('substitutionModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'substitutionModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            
            const isHealthierSuggestion = suggestion.healthier;
            const savingsText = suggestion.savings > 0 ? `Economize R$ ${suggestion.savings.toFixed(2)}` : '';
            const healthText = isHealthierSuggestion ? '🥗 Opção mais saudável' : '';
            
            modal.innerHTML = `
                <div class="premium-glass rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 ${isHealthierSuggestion ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">${isHealthierSuggestion ? '🥗' : '💰'}</span>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-800 mb-2">Sugestão do Parceiro</h3>
                        <p class="text-slate-600">Encontramos uma alternativa interessante!</p>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-semibold text-gray-800 mb-2">Produto Atual:</h4>
                            <p class="text-gray-700">${originalItem.name}</p>
                            <p class="text-lg font-bold text-gray-600">R$ ${originalItem.price.toFixed(2)}</p>
                        </div>
                        
                        <div class="text-center">
                            <svg class="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m0 0l7-7"/>
                            </svg>
                        </div>
                        
                        <div class="bg-${isHealthierSuggestion ? 'green' : 'blue'}-50 rounded-lg p-4 border-2 border-${isHealthierSuggestion ? 'green' : 'blue'}-200">
                            <h4 class="font-semibold text-${isHealthierSuggestion ? 'green' : 'blue'}-800 mb-2">Sugestão:</h4>
                            <p class="text-${isHealthierSuggestion ? 'green' : 'blue'}-700">${suggestion.name}</p>
                            <p class="text-lg font-bold text-${isHealthierSuggestion ? 'green' : 'blue'}-600">R$ ${suggestion.price.toFixed(2)}</p>
                            <p class="text-sm text-${isHealthierSuggestion ? 'green' : 'blue'}-600 mt-2">${suggestion.store}</p>
                            ${savingsText ? `<p class="text-sm font-semibold text-green-600 mt-1">${savingsText}</p>` : ''}
                            ${healthText ? `<p class="text-sm font-semibold text-green-600 mt-1">${healthText}</p>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="closeModal('substitutionModal')" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                            Manter Original
                        </button>
                        <button onclick="acceptSubstitution('${originalItem.id}', '${suggestion.name}', ${suggestion.price}, '${suggestion.store}')" class="flex-1 bg-${isHealthierSuggestion ? 'green' : 'blue'}-600 hover:bg-${isHealthierSuggestion ? 'green' : 'blue'}-700 text-white py-3 rounded-lg font-semibold transition-colors">
                            Trocar
                        </button>
                    </div>
                    
                    <button onclick="closeModal('substitutionModal')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
            
            modal.classList.add('active');
        }

        function acceptSubstitution(originalItemId, newName, newPrice, newStore) {
            // Find and replace the item in cart
            const itemIndex = cart.findIndex(item => item.id == originalItemId);
            if (itemIndex !== -1) {
                cart[itemIndex].name = newName;
                cart[itemIndex].price = newPrice;
                cart[itemIndex].store = newStore;
                updateCartDisplay();
                
                showNotification('Troca Realizada!', 'Produto substituído com sucesso', 'success');
                
                // Add mission points for Premium/+Saudável users
                if (currentUser && (currentUser.plan === 'Premium' || currentUser.plan === '+Saudável')) {
                    setTimeout(() => {
                        showNotification('Pontos Ganhos!', '+25 pontos de missão pela troca inteligente', 'info');
                    }, 1500);
                }
            }
            
            closeModal('substitutionModal');
        }

        function removeFromCart(itemId) {
            cart = cart.filter(item => item.id !== itemId);
            updateCartDisplay();
        }

        function updateCartDisplay() {
            const cartCount = document.getElementById('cartCount');
            const emptyCart = document.getElementById('emptyCart');
            const cartItemsList = document.getElementById('cartItemsList');
            const cartFooter = document.getElementById('cartFooter');
            const cartTotal = document.getElementById('cartTotal');
            const cartSavings = document.getElementById('cartSavings');
            
            console.log('🛒 updateCartDisplay called');
            console.log('isLoggedIn:', isLoggedIn);
            console.log('cart length:', cart.length);
            
            // FORCE SHOW cart icon when user is logged in
            if (isLoggedIn && currentUser && cartCount) {
                console.log('✅ Forcing cart visibility');
                
                // FORCE show cart count badge ALWAYS - MULTIPLE METHODS
                cartCount.classList.remove('hidden');
                cartCount.style.display = 'flex !important';
                cartCount.style.visibility = 'visible !important';
                cartCount.style.opacity = '1 !important';
                cartCount.textContent = cart.length;
                
                // Force show all parent elements too
                let parent = cartCount.parentElement;
                while (parent && parent !== document.body) {
                    parent.classList.remove('hidden');
                    parent.style.display = parent.tagName === 'BUTTON' ? 'block' : 'flex';
                    parent.style.visibility = 'visible';
                    parent = parent.parentElement;
                }
                
                console.log('✅ Cart count set to:', cart.length);
                
                if (cart.length === 0) {
                    if (emptyCart) emptyCart.classList.remove('hidden');
                    if (cartItemsList) cartItemsList.classList.add('hidden');
                    if (cartFooter) cartFooter.classList.add('hidden');
                } else {
                    if (emptyCart) emptyCart.classList.add('hidden');
                    if (cartItemsList) cartItemsList.classList.remove('hidden');
                    if (cartFooter) cartFooter.classList.remove('hidden');
                    
                    // Update cart items
                    if (cartItemsList) {
                        cartItemsList.innerHTML = '';
                        let total = 0;
                        let totalSavings = 0;
                        
                        cart.forEach(item => {
                            total += item.price * item.quantity;
                            totalSavings += (item.price * 0.15) * item.quantity; // Assume 15% savings
                            
                            const itemElement = document.createElement('div');
                            itemElement.className = 'cart-item bg-gray-50 rounded-lg p-4';
                            itemElement.innerHTML = `
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <h5 class="font-semibold text-gray-800">${item.name}</h5>
                                        <p class="text-sm text-gray-600">${item.store}</p>
                                        <p class="text-lg font-bold text-green-600 mt-1">R$ ${item.price.toFixed(2)}</p>
                                    </div>
                                    <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                            `;
                            cartItemsList.appendChild(itemElement);
                        });
                        
                        if (cartTotal) cartTotal.textContent = `R$ ${total.toFixed(2)}`;
                        if (cartSavings) cartSavings.textContent = `R$ ${totalSavings.toFixed(2)}`;
                    }
                }
            } else {
                console.log('❌ Hiding cart - user not logged in');
                // Hide cart when not logged in
                if (cartCount) {
                    cartCount.classList.add('hidden');
                    cartCount.style.display = 'none';
                }
            }
        }

        let isCartOpen = false;

        function toggleCart() {
            const cartSidebar = document.getElementById('cartSidebar');
            isCartOpen = !isCartOpen;
            
            if (isCartOpen) {
                cartSidebar.classList.remove('translate-x-full');
            } else {
                cartSidebar.classList.add('translate-x-full');
            }
        }

        function openCart() {
            const cartSidebar = document.getElementById('cartSidebar');
            isCartOpen = true;
            cartSidebar.classList.remove('translate-x-full');
        }

        function closeCart() {
            const cartSidebar = document.getElementById('cartSidebar');
            isCartOpen = false;
            cartSidebar.classList.add('translate-x-full');
        }

        function clearCart() {
            cart = [];
            updateCartDisplay();
            showNotification('Carrinho limpo', 'Todos os itens foram removidos', 'info');
        }

