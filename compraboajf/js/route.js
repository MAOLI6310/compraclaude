// ============================================
// OTIMIZAÇÃO DE ROTA DE COMPRAS
// ============================================

        function optimizeRoute() {
            if (cart.length === 0) {
                showNotification('Carrinho vazio', 'Adicione produtos para otimizar a rota', 'warning');
                return;
            }
            
            if (!currentUser || currentUser.plan === 'Básico') {
                showNotification('Upgrade Necessário', 'Funcionalidade disponível nos planos Pro, Premium e +Saudável', 'warning');
                showPage('assinatura');
                return;
            }
            
            showNotification('Otimizando...', 'Calculando a melhor rota e verificando disponibilidade', 'info');
            
            setTimeout(() => {
                // Check for unavailable items before showing modal
                const tourData = generateDetailedTour();
                const unavailableItems = tourData.unavailableItemsSummary || [];
                
                if (unavailableItems.length > 0) {
                    showNotification('Atenção!', `${unavailableItems.length} produto${unavailableItems.length > 1 ? 's' : ''} indisponível${unavailableItems.length > 1 ? 'is' : ''} detectado${unavailableItems.length > 1 ? 's' : ''}`, 'warning');
                }
                
                showRouteOptimizationModal();
            }, 2000);
        }

        function showRouteOptimizationModal() {
            // Create modal if it doesn't exist
            let modal = document.getElementById('routeOptimizationModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'routeOptimizationModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            
            const routeOptions = generateRouteOptions();
            
            modal.innerHTML = `
                <div class="premium-glass rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="text-center mb-6">
                        <h3 class="text-3xl font-bold text-slate-800 mb-2">🗺️ Carrinho Inteligente Avançado</h3>
                        <p class="text-slate-600">Escolha a melhor estratégia para suas compras</p>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        ${routeOptions.map((option, index) => `
                            <div class="bg-white rounded-xl p-6 border-2 ${index === 0 ? 'border-green-300 bg-green-50' : index === 1 ? 'border-blue-300 bg-blue-50' : 'border-purple-300 bg-purple-50'} hover:scale-105 transition-all duration-300 cursor-pointer" onclick="selectRouteOption(${index})">
                                <div class="text-center mb-4">
                                    <div class="w-16 h-16 ${index === 0 ? 'bg-green-100' : index === 1 ? 'bg-blue-100' : 'bg-purple-100'} rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span class="text-2xl">${option.icon}</span>
                                    </div>
                                    <h4 class="text-lg font-bold ${index === 0 ? 'text-green-800' : index === 1 ? 'text-blue-800' : 'text-purple-800'} mb-1">${option.title}</h4>
                                    <p class="text-xs ${index === 0 ? 'text-green-600' : index === 1 ? 'text-blue-600' : 'text-purple-600'} mb-3">${option.subtitle}</p>
                                    <div class="text-3xl font-bold ${index === 0 ? 'text-green-600' : index === 1 ? 'text-blue-600' : 'text-purple-600'} mb-2">R$ ${option.totalPrice.toFixed(2)}</div>
                                </div>
                                
                                <div class="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                                    <p class="text-xs text-gray-700 mb-2 font-semibold">${option.explanation}</p>
                                    <div class="space-y-2">
                                        <div class="flex items-center text-xs text-gray-600">
                                            <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            <span class="flex-1">${option.stores[0].name}</span>
                                        </div>
                                        <div class="text-xs text-gray-500 ml-4">
                                            📍 ${option.stores[0].distance} • ${option.stores[0].items} produtos
                                        </div>
                                        <div class="text-xs text-gray-500 ml-4">
                                            ${option.stores[0].address}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="bg-${index === 0 ? 'green' : index === 1 ? 'blue' : 'purple'}-50 rounded-lg p-3 mb-4">
                                    <p class="text-xs ${index === 0 ? 'text-green-700' : index === 1 ? 'text-blue-700' : 'text-purple-700'}">${option.details}</p>
                                </div>
                                
                                <div class="flex justify-between text-xs text-gray-600 mb-4">
                                    <span>Economia: <strong class="text-green-600">R$ ${option.savings.toFixed(2)}</strong></span>
                                    <span>100% disponível</span>
                                </div>
                                
                                <button class="w-full ${index === 0 ? 'bg-green-600 hover:bg-green-700' : index === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg font-semibold transition-colors text-sm">
                                    ✅ Escolher Esta Opção
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="bg-gray-50 rounded-xl p-6 mb-6">
                        <h4 class="font-bold text-gray-800 mb-4">🎯 Tour de Compras Detalhado - Opção Custo-Benefício</h4>
                        <div class="bg-blue-50 rounded-lg p-3 mb-4 border-l-4 border-blue-400">
                            <p class="text-sm text-blue-800">
                                <strong>💡 Como funciona:</strong> O tour indica apenas os produtos <strong>MAIS BARATOS</strong> disponíveis em cada mercado. 
                                Você vai direto ao que interessa - os melhores preços de cada loja!
                            </p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            ${generateDetailedTour().map(stop => `
                                <div class="bg-white rounded-lg p-4 border border-gray-200">
                                    <div class="flex items-center mb-3">
                                        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                            <span class="text-sm font-bold text-purple-600">${stop.order}</span>
                                        </div>
                                        <div>
                                            <h5 class="font-semibold text-gray-800">${stop.store}</h5>
                                            <p class="text-xs text-gray-600">${stop.address} • ${stop.distance}</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Available Items -->
                                    <div class="space-y-2 mb-3">
                                        ${stop.items.map(item => `
                                            <div class="flex justify-between items-center text-sm">
                                                <span class="text-gray-700 flex items-center">
                                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                    ${item.name}
                                                </span>
                                                <span class="font-semibold text-green-600">R$ ${item.price.toFixed(2)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <!-- Unavailable Items -->
                                    ${stop.unavailableItems.length > 0 ? `
                                        <div class="bg-red-50 rounded-lg p-3 mb-3">
                                            <h6 class="text-xs font-semibold text-red-800 mb-2 flex items-center">
                                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                                </svg>
                                                PRODUTOS INDISPONÍVEIS
                                            </h6>
                                            <div class="space-y-1">
                                                ${stop.unavailableItems.map(item => `
                                                    <div class="text-xs text-red-700 flex items-center">
                                                        <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                        ${item.name}
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    <div class="border-t mt-3 pt-3 flex justify-between items-center">
                                        <span class="text-sm font-semibold text-gray-800">Subtotal:</span>
                                        <span class="font-bold text-purple-600">R$ ${stop.subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Global Unavailable Items Warning -->
                        ${(() => {
                            const tourData = generateDetailedTour();
                            const totalUnavailable = tourData.unavailableItemsSummary || [];
                            return totalUnavailable.length > 0 ? `
                                <div class="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                                    <div class="flex items-center mb-2">
                                        <svg class="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                        </svg>
                                        <h5 class="font-bold text-orange-800">⚠️ ATENÇÃO: Produtos Indisponíveis Detectados</h5>
                                    </div>
                                    <p class="text-sm text-orange-700 mb-3">
                                        <strong>${totalUnavailable.length} produto${totalUnavailable.length > 1 ? 's' : ''}</strong> da sua lista não ${totalUnavailable.length > 1 ? 'estão' : 'está'} disponível${totalUnavailable.length > 1 ? 'is' : ''} nos mercados selecionados:
                                    </p>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                        ${totalUnavailable.map(item => `
                                            <div class="text-sm text-orange-800 bg-orange-100 rounded px-3 py-1">
                                                <strong>${item.name}</strong> - ${item.store}
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="text-sm text-orange-700">
                                        <p class="mb-2"><strong>💡 Sugestões:</strong></p>
                                        <ul class="list-disc list-inside space-y-1 text-xs">
                                            <li>Ligue antes para confirmar disponibilidade</li>
                                            <li>Considere produtos similares disponíveis</li>
                                            <li>Visite outros mercados próximos para estes itens</li>
                                            <li>Configure alertas para quando voltarem ao estoque</li>
                                        </ul>
                                    </div>
                                </div>
                            ` : '';
                        })()}
                    </div>
                    
                    ${currentUser && currentUser.plan === 'Premium' ? `
                        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                            <h4 class="font-bold text-indigo-800 mb-4">✨ Funcionalidades Premium Ativas</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span class="text-indigo-600">🎯</span>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-indigo-800">Trocas Sugeridas</p>
                                        <p class="text-xs text-indigo-600">2 sugestões encontradas</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span class="text-green-600">💰</span>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-green-800">Cashback Disponível</p>
                                        <p class="text-xs text-green-600">R$ 3,20 em cashback</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span class="text-yellow-600">🎫</span>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-yellow-800">Cupons Exclusivos</p>
                                        <p class="text-xs text-yellow-600">3 cupons aplicáveis</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span class="text-purple-600">🏆</span>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-purple-800">Pontos de Missão</p>
                                        <p class="text-xs text-purple-600">+150 pontos nesta compra</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="flex justify-between items-center">
                        <button onclick="closeModal('routeOptimizationModal')" class="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                            Fechar
                        </button>
                        <button onclick="startShopping()" class="premium-button text-white px-8 py-3 rounded-lg font-semibold">
                            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                            Iniciar Compras
                        </button>
                    </div>
                    
                    <button onclick="closeModal('routeOptimizationModal')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
            
            modal.classList.add('active');
        }

        function generateRouteOptions() {
            const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
            const cartOptimizationMode = document.getElementById('cartOptimizationMode')?.value || 'balanced';
            
            // Base options
            let options = [
                {
                    title: "TUDO MAIS BARATO",
                    subtitle: "Onde sua lista COMPLETA sai mais barata",
                    icon: "💰",
                    totalPrice: cartTotal * 0.82,
                    totalDistance: 0,
                    estimatedTime: "Uma parada só",
                    savings: cartTotal * 0.18,
                    storesCount: 1,
                    explanation: "Encontramos UM supermercado onde TODOS os seus produtos custam menos no total",
                    stores: [
                        { name: "Bahamas São Mateus", items: cart.length, address: "Rua São Mateus, 450", distance: "30m de você" }
                    ],
                    details: "Mesmo alguns produtos individuais custando mais, o TOTAL da sua compra sai mais barato aqui."
                },
                {
                    title: "TUDO MAIS PERTO", 
                    subtitle: "Mais próximo que tem TUDO disponível",
                    icon: "📍",
                    totalPrice: cartTotal * 0.96,
                    totalDistance: 0,
                    estimatedTime: "Uma parada só",
                    savings: cartTotal * 0.04,
                    storesCount: 1,
                    explanation: "O estabelecimento mais próximo que tem 100% dos seus produtos em estoque",
                    stores: [
                        { name: "Mercearia do Seu João", items: cart.length, address: "Rua São Mateus, 123", distance: "50m de você" }
                    ],
                    details: "Pode custar um pouco mais, mas você economiza tempo e combustível."
                },
                {
                    title: "MELHOR CUSTO-BENEFÍCIO",
                    subtitle: "Equilibrio entre preço e distância",
                    icon: "⚖️",
                    totalPrice: cartTotal * 0.89,
                    totalDistance: 0,
                    estimatedTime: "Uma parada só",
                    savings: cartTotal * 0.11,
                    storesCount: 1,
                    explanation: "Boa economia sem ir muito longe - tem tudo que você precisa",
                    stores: [
                        { name: "Mercado Itamar Franco", items: cart.length, address: "Av. Itamar Franco, 234", distance: "120m de você" }
                    ],
                    details: "Preços competitivos e bem pertinho. A escolha mais equilibrada."
                }
            ];
            

            
            return options;
        }

        function generateDetailedTour() {
            // Simulate a detailed tour based on cart items with product availability
            const allItems = [...cart];
            const stores = [];
            let unavailableItems = [];
            
            // Store 1: Extra Benfica
            const store1Items = allItems.slice(0, Math.ceil(allItems.length / 2));
            // Simulate some items not being available (20% chance per item)
            const store1Available = store1Items.filter(() => Math.random() > 0.2);
            const store1Unavailable = store1Items.filter(item => !store1Available.includes(item));
            unavailableItems.push(...store1Unavailable.map(item => ({...item, store: "Extra Benfica"})));
            
            stores.push({
                order: 1,
                store: "Extra Benfica",
                address: "Av. Barão do Rio Branco, 1234",
                distance: "1.2 km",
                items: store1Available.map(item => ({
                    name: item.name,
                    price: item.price * 0.9,
                    available: true
                })),
                unavailableItems: store1Unavailable.map(item => ({
                    name: item.name,
                    available: false
                })),
                subtotal: 0
            });
            
            // Store 2: Bahamas São Mateus
            const remainingItems = allItems.filter(item => !store1Available.includes(item) && !store1Unavailable.includes(item));
            const store2Items = remainingItems.slice(0, Math.ceil(remainingItems.length * 0.7));
            const store2Available = store2Items.filter(() => Math.random() > 0.15);
            const store2Unavailable = store2Items.filter(item => !store2Available.includes(item));
            unavailableItems.push(...store2Unavailable.map(item => ({...item, store: "Bahamas São Mateus"})));
            
            stores.push({
                order: 2,
                store: "Bahamas São Mateus",
                address: "Rua São Mateus, 567",
                distance: "2.1 km do anterior",
                items: store2Available.map(item => ({
                    name: item.name,
                    price: item.price * 0.85,
                    available: true
                })),
                unavailableItems: store2Unavailable.map(item => ({
                    name: item.name,
                    available: false
                })),
                subtotal: 0
            });
            
            // Store 3: Mercearia do Bairro (gets remaining items)
            const finalItems = allItems.filter(item => 
                !store1Available.includes(item) && !store1Unavailable.includes(item) &&
                !store2Available.includes(item) && !store2Unavailable.includes(item)
            );
            
            stores.push({
                order: 3,
                store: "Mercearia do Bairro",
                address: "Rua das Flores, 89",
                distance: "0.8 km do anterior",
                items: finalItems.map(item => ({
                    name: item.name,
                    price: item.price * 0.95,
                    available: true
                })),
                unavailableItems: [],
                subtotal: 0
            });
            
            // Calculate subtotals
            stores.forEach(store => {
                store.subtotal = store.items.reduce((sum, item) => sum + item.price, 0);
            });
            
            // Add unavailable items summary
            stores.unavailableItemsSummary = unavailableItems;
            
            return stores;
        }

        function selectRouteOption(optionIndex) {
            const options = ['Mais Barato', 'Mais Próximo', 'Custo-Benefício'];
            showNotification('Rota Selecionada!', `Você escolheu a opção "${options[optionIndex]}"`, 'success');
            
            setTimeout(() => {
                closeModal('routeOptimizationModal');
                showRouteDetailsModal();
            }, 1500);
        }

        function showRouteDetailsModal() {
            let modal = document.getElementById('routeDetailsModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'routeDetailsModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            
            // Get the selected route option (simplified to one store)
            const selectedStore = {
                name: "Bahamas São Mateus",
                address: "Rua São Mateus, 450 - São Mateus, Juiz de Fora - MG",
                distance: "30m de você",
                items: cart.length,
                total: cart.reduce((sum, item) => sum + item.price * 0.82, 0)
            };
            
            modal.innerHTML = `
                <div class="premium-glass rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-slate-800 mb-2">🗺️ Sua Compra Otimizada</h3>
                        <p class="text-slate-600">Um só lugar, todos os produtos</p>
                    </div>
                    
                    <div class="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                    <span class="text-2xl">🏪</span>
                                </div>
                                <div>
                                    <h4 class="text-xl font-bold text-gray-800">${selectedStore.name}</h4>
                                    <p class="text-gray-600">${selectedStore.address}</p>
                                    <p class="text-sm text-blue-600 font-semibold">${selectedStore.distance}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div class="text-center bg-green-50 rounded-lg p-3">
                                <div class="text-2xl font-bold text-green-600">${selectedStore.items}</div>
                                <div class="text-sm text-green-700">Produtos Disponíveis</div>
                            </div>
                            <div class="text-center bg-blue-50 rounded-lg p-3">
                                <div class="text-2xl font-bold text-blue-600">R$ ${selectedStore.total.toFixed(2)}</div>
                                <div class="text-sm text-blue-700">Total da Compra</div>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button onclick="copyAddress('${selectedStore.address}')" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors">
                                📋 Copiar Endereço
                            </button>
                            <button onclick="openInMaps('${selectedStore.name}', '${selectedStore.address}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors">
                                🗺️ Abrir no Maps
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 rounded-lg p-4 mb-6">
                        <h4 class="font-semibold text-blue-800 mb-2">📱 Como usar a navegação:</h4>
                        <div class="text-sm text-blue-700 space-y-1">
                            <p>• <strong>Copiar Endereço:</strong> Cola no Waze, Google Maps ou Apple Maps</p>
                            <p>• <strong>Abrir no Maps:</strong> Abre diretamente no Google Maps (nova aba)</p>
                            <p>• <strong>Dica:</strong> Ligue antes para confirmar horário de funcionamento</p>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 rounded-lg p-4 mb-6">
                        <h4 class="font-semibold text-green-800 mb-2">✅ Sua Lista de Compras:</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            ${cart.map(item => `
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-gray-700">${item.name}</span>
                                    <span class="font-semibold text-green-600">R$ ${(item.price * 0.89).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <button onclick="closeModal('routeDetailsModal')" class="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                            Fechar
                        </button>
                        <button onclick="openInMaps('${selectedStore.name}', '${selectedStore.address}'); closeModal('routeDetailsModal')" class="premium-button text-white px-6 py-3 rounded-lg font-semibold">
                            🚗 Ir às Compras
                        </button>
                    </div>
                    
                    <button onclick="closeModal('routeDetailsModal')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            `;
            
            modal.classList.add('active');
        }

        function copyAddress(address) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(address).then(() => {
                    showNotification('Copiado!', 'Endereço copiado para a área de transferência', 'success');
                }).catch(() => {
                    showNotification('Erro', 'Não foi possível copiar o endereço', 'error');
                });
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = address;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showNotification('Copiado!', 'Endereço copiado para a área de transferência', 'success');
                } catch (err) {
                    showNotification('Erro', 'Não foi possível copiar o endereço', 'error');
                }
                document.body.removeChild(textArea);
            }
        }

        function openInMaps(storeName, address) {
            const query = encodeURIComponent(`${storeName}, ${address}, Juiz de Fora, MG`);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
            
            // Try to open in new tab
            const newWindow = window.open(mapsUrl, '_blank');
            
            if (newWindow) {
                showNotification('Abrindo Maps', `Navegando para ${storeName}`, 'info');
            } else {
                // If popup blocked, show alternative
                showNotification('Popup Bloqueado', 'Copie o endereço e cole no seu app de navegação', 'warning');
                copyAddress(address);
            }
        }

        function openAllInMaps() {
            const tourStops = generateDetailedTour();
            let allAddresses = tourStops.map(stop => `${stop.store}: ${stop.address}`).join('\n');
            
            // Copy all addresses
            if (navigator.clipboard) {
                navigator.clipboard.writeText(allAddresses).then(() => {
                    showNotification('Todos os Endereços Copiados!', 'Cole no seu app de navegação favorito', 'success');
                });
            }
            
            // Try to open first location in Maps
            if (tourStops.length > 0) {
                const firstStop = tourStops[0];
                openInMaps(firstStop.store, firstStop.address);
            }
            
            closeModal('routeDetailsModal');
        }

        function startShopping() {
            closeModal('routeOptimizationModal');
            showNotification('Rota Salva!', 'Você pode copiar os endereços ou abrir no Google Maps', 'success');
            
            // Show route details modal
            setTimeout(() => {
                showRouteDetailsModal();
            }, 1500);
            
            // Simulate updating user savings
            if (currentUser) {
                const estimatedSavings = cart.reduce((sum, item) => sum + item.price * 0.15, 0);
                currentUser.savings += estimatedSavings;
                updateUserInterface();
            }
        }

        // Notification system
