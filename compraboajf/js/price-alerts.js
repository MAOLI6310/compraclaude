// ============================================
// HISTÓRICO DE PREÇOS E ALERTAS
// ============================================

        function showPriceHistory(productName, currentPrice) {
            if (!isLoggedIn) {
                showSignupModal();
                return;
            }
            
            if (!currentUser || currentUser.plan === 'Básico') {
                showNotification('Upgrade Necessário', 'Histórico de preços disponível nos planos Pro, Premium e +Saudável', 'warning');
                showPage('assinatura');
                return;
            }
            
            let modal = document.getElementById('priceHistoryModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'priceHistoryModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            
            // Generate sample price history
            const priceHistory = generatePriceHistory(currentPrice);
            const minPrice = Math.min(...priceHistory.map(p => p.price));
            const maxPrice = Math.max(...priceHistory.map(p => p.price));
            const avgPrice = priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length;
            
            modal.innerHTML = `
                <div class="premium-glass rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-slate-800 mb-2">📊 Histórico de Preços</h3>
                        <p class="text-slate-600">${productName}</p>
                        <p class="text-sm text-slate-500">Últimos 30 dias</p>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="text-center bg-green-50 rounded-lg p-4">
                            <div class="text-2xl font-bold text-green-600">R$ ${minPrice.toFixed(2)}</div>
                            <div class="text-sm text-green-700">Menor Preço</div>
                        </div>
                        <div class="text-center bg-blue-50 rounded-lg p-4">
                            <div class="text-2xl font-bold text-blue-600">R$ ${avgPrice.toFixed(2)}</div>
                            <div class="text-sm text-blue-700">Preço Médio</div>
                        </div>
                        <div class="text-center bg-red-50 rounded-lg p-4">
                            <div class="text-2xl font-bold text-red-600">R$ ${maxPrice.toFixed(2)}</div>
                            <div class="text-sm text-red-700">Maior Preço</div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 class="font-semibold text-gray-800 mb-4">Curva de Preços</h4>
                        <div class="space-y-2">
                            ${priceHistory.map((entry, index) => {
                                const barWidth = ((entry.price - minPrice) / (maxPrice - minPrice)) * 100;
                                const isCurrentPrice = Math.abs(entry.price - currentPrice) < 0.01;
                                return `
                                    <div class="flex items-center space-x-3">
                                        <div class="w-16 text-xs text-gray-600">${entry.date}</div>
                                        <div class="flex-1 bg-gray-200 rounded-full h-4 relative">
                                            <div class="bg-${isCurrentPrice ? 'blue' : entry.price === minPrice ? 'green' : entry.price === maxPrice ? 'red' : 'gray'}-500 h-4 rounded-full transition-all duration-300" style="width: ${Math.max(barWidth, 5)}%"></div>
                                        </div>
                                        <div class="w-20 text-sm font-semibold text-gray-800">R$ ${entry.price.toFixed(2)}</div>
                                        <div class="w-24 text-xs text-gray-600">${entry.store}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 rounded-lg p-4 mb-6">
                        <h4 class="font-semibold text-blue-800 mb-2">💡 Análise Inteligente</h4>
                        <div class="text-sm text-blue-700 space-y-1">
                            <p>• Preço atual está ${currentPrice < avgPrice ? 'abaixo' : 'acima'} da média (${((currentPrice - avgPrice) / avgPrice * 100).toFixed(1)}%)</p>
                            <p>• ${currentPrice === minPrice ? 'Este é o menor preço registrado!' : `Você pode economizar R$ ${(currentPrice - minPrice).toFixed(2)} comprando no menor preço`}</p>
                            <p>• Melhor dia para comprar: ${priceHistory.find(p => p.price === minPrice)?.date}</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <button onclick="closeModal('priceHistoryModal')" class="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                            Fechar
                        </button>
                        <button onclick="setPriceAlert('${productName}', ${currentPrice}); closeModal('priceHistoryModal')" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                            🔔 Criar Alerta
                        </button>
                    </div>
                    
                    <button onclick="closeModal('priceHistoryModal')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
            
            modal.classList.add('active');
        }

        function generatePriceHistory(currentPrice) {
            const history = [];
            const stores = ['Zona Sul', 'Extra', 'EPA', 'Bahamas', 'Carrefour'];
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                
                // Generate price variation around current price
                const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
                const price = currentPrice * (1 + variation);
                const store = stores[Math.floor(Math.random() * stores.length)];
                
                history.push({
                    date: dateStr,
                    price: Math.max(price, 0.5), // Minimum price
                    store: store
                });
            }
            
            return history;
        }

        function setPriceAlert(productName, currentPrice) {
            if (!isLoggedIn) {
                showSignupModal();
                return;
            }
            
            if (!currentUser || currentUser.plan === 'Básico') {
                showNotification('Upgrade Necessário', 'Alertas de preço disponíveis nos planos Pro, Premium e +Saudável', 'warning');
                showPage('assinatura');
                return;
            }
            
            let modal = document.getElementById('priceAlertModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'priceAlertModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            
            const suggestedPrice = (currentPrice * 0.9).toFixed(2); // 10% below current price
            
            modal.innerHTML = `
                <div class="premium-glass rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">🔔</span>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-800 mb-2">Criar Alerta de Preço</h3>
                        <p class="text-slate-600">${productName}</p>
                        <p class="text-sm text-slate-500">Preço atual: R$ ${currentPrice.toFixed(2)}</p>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Avisar quando o preço for igual ou menor que:</label>
                            <div class="relative">
                                <span class="absolute left-3 top-3 text-gray-500">R$</span>
                                <input type="number" id="alertPrice" value="${suggestedPrice}" step="0.01" min="0.01" 
                                       class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                            </div>
                        </div>
                        
                        <div class="bg-yellow-50 rounded-lg p-4">
                            <h4 class="font-semibold text-yellow-800 mb-2">💡 Sugestão Inteligente</h4>
                            <p class="text-sm text-yellow-700">
                                Baseado no histórico, recomendamos alertar quando o preço for R$ ${suggestedPrice} ou menos 
                                (economia de R$ ${(currentPrice - parseFloat(suggestedPrice)).toFixed(2)}).
                            </p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Como você quer ser notificado?</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="checkbox" checked class="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500">
                                    <span class="ml-2 text-sm text-slate-700">Notificação no app</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" checked class="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500">
                                    <span class="ml-2 text-sm text-slate-700">E-mail</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500">
                                    <span class="ml-2 text-sm text-slate-700">SMS (Premium/+Saudável)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="closeModal('priceAlertModal')" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                            Cancelar
                        </button>
                        <button onclick="createPriceAlert('${productName}', ${currentPrice})" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition-colors">
                            Criar Alerta
                        </button>
                    </div>
                    
                    <button onclick="closeModal('priceAlertModal')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
            
            modal.classList.add('active');
        }

        function createPriceAlert(productName, currentPrice) {
            const alertPrice = document.getElementById('alertPrice').value;
            
            if (!alertPrice || parseFloat(alertPrice) <= 0) {
                showNotification('Erro', 'Digite um preço válido para o alerta', 'error');
                return;
            }
            
            closeModal('priceAlertModal');
            showNotification('Alerta Criado!', `Você será notificado quando ${productName} custar R$ ${parseFloat(alertPrice).toFixed(2)} ou menos`, 'success');
            
            // Simulate alert triggering after some time
            setTimeout(() => {
                if (Math.random() > 0.7) { // 30% chance of alert
                    showNotification('🔔 Alerta de Preço!', `${productName} está em promoção por R$ ${(parseFloat(alertPrice) - 0.50).toFixed(2)}!`, 'success');
                }
            }, 10000); // 10 seconds
        }

        // Form formatting functions
