// ============================================
// BUSCA E COMPARAÇÃO DE PRODUTOS
// ============================================

        function startComparison() {
            if (!isLoggedIn) {
                showSignupModal();
                return;
            }
            
            // Scroll to search section
            document.getElementById('productSearch').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('productSearchInput').focus();
        }

        function handleSearchKeyPress(event) {
            if (event.key === 'Enter') {
                searchProducts();
            }
        }

        function searchProducts() {
            if (!isLoggedIn) {
                showSignupModal();
                return;
            }
            
            const query = document.getElementById('productSearchInput').value.trim();
            if (!query) {
                showNotification('Atenção', 'Digite um produto para buscar', 'warning');
                return;
            }
            
            // Show loading
            showNotification('Buscando...', 'Procurando os melhores preços', 'info');
            
            // Simulate search - cart stays open if it was open
            setTimeout(() => {
                displaySearchResults(query);
                // Maintain cart state after search
                if (isCartOpen) {
                    openCart();
                }
            }, 1500);
        }

        function searchByCategory(category) {
            if (!isLoggedIn) {
                showSignupModal();
                return;
            }
            
            const categoryNames = {
                'bebidas': 'Bebidas',
                'laticinios': 'Laticínios',
                'carnes': 'Carnes',
                'cereais': 'Cereais'
            };
            
            document.getElementById('productSearchInput').value = categoryNames[category];
            
            // Remember cart state before search
            const wasCartOpen = isCartOpen;
            
            searchProducts();
            
            // Restore cart state after search
            setTimeout(() => {
                if (wasCartOpen) {
                    openCart();
                }
            }, 1600);
        }

        function displaySearchResults(query) {
            const resultsContainer = document.getElementById('searchResults');
            const resultsCount = document.getElementById('resultsCount');
            
            // Generate sample products based on query
            currentProducts = generateSampleProducts(query);
            
            // Update results count
            resultsCount.textContent = `${currentProducts.length} produtos encontrados`;
            
            // Reset sort to price by default
            document.getElementById('sortBy').value = 'price';
            
            // Sort and display products
            sortProducts();
            
            resultsContainer.classList.remove('hidden');
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }

        function sortProducts() {
            const sortBy = document.getElementById('sortBy').value;
            const productList = document.getElementById('productList');
            
            // Create a copy to sort
            let sortedProducts = [...currentProducts];
            
            // Regular sorting
            switch(sortBy) {
                case 'price':
                    sortedProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'distance':
                    sortedProducts.sort((a, b) => a.distanceKm - b.distanceKm);
                    break;
                case 'savings':
                    sortedProducts.sort((a, b) => b.savings - a.savings);
                    break;
            }
            
            // Calculate rankings for all criteria
            const priceRanking = [...currentProducts].sort((a, b) => a.price - b.price);
            const distanceRanking = [...currentProducts].sort((a, b) => a.distanceKm - b.distanceKm);
            const savingsRanking = [...currentProducts].sort((a, b) => b.savings - a.savings);
            
            // Clear product list
            productList.innerHTML = '';
            
            // Create product cards with ranking information
            sortedProducts.forEach((product, index) => {
                const priceRank = priceRanking.findIndex(p => p.name === product.name) + 1;
                const distanceRank = distanceRanking.findIndex(p => p.name === product.name) + 1;
                const savingsRank = savingsRanking.findIndex(p => p.name === product.name) + 1;
                
                const productCard = createProductCard(product, {
                    currentSort: sortBy,
                    currentRank: index + 1,
                    priceRank: priceRank,
                    distanceRank: distanceRank,
                    savingsRank: savingsRank,
                    totalProducts: currentProducts.length,
                    cheapestPrice: priceRanking[0].price,
                    closestDistance: distanceRanking[0].distanceKm
                });
                productList.appendChild(productCard);
            });
        }

        // Global variable to store current products
        let currentProducts = [];

        function generateSampleProducts(query) {
            const brands = ['Premium', 'Nacional', 'Popular', 'Especial', 'Gourmet', 'Econômica'];
            
            const products = [
                {
                    name: `${query} - Marca Premium`,
                    store: 'Zona Sul Cascatinha',
                    price: 7.50,
                    originalPrice: 8.90,
                    distanceKm: 2.1,
                    distance: '2.1km',
                    brand: 'Premium'
                },
                {
                    name: `${query} - Marca Nacional`,
                    store: 'Extra Benfica',
                    price: 9.89,
                    originalPrice: 11.20,
                    distanceKm: 1.8,
                    distance: '1.8km',
                    brand: 'Nacional'
                },
                {
                    name: `${query} - Marca Popular`,
                    store: 'EPA Centro',
                    price: 8.20,
                    originalPrice: 9.50,
                    distanceKm: 3.2,
                    distance: '3.2km',
                    brand: 'Popular'
                },
                {
                    name: `${query} - Marca Especial`,
                    store: 'Bahamas São Mateus',
                    price: 8.90,
                    originalPrice: 10.50,
                    distanceKm: 4.5,
                    distance: '4.5km',
                    brand: 'Especial'
                },
                {
                    name: `${query} - Marca Gourmet`,
                    store: 'Carrefour Shopping',
                    price: 9.10,
                    originalPrice: 10.80,
                    distanceKm: 1.2,
                    distance: '1.2km',
                    brand: 'Gourmet'
                },
                {
                    name: `${query} - Marca Econômica`,
                    store: 'Atacadão Benfica',
                    price: 6.50,
                    originalPrice: 7.90,
                    distanceKm: 5.8,
                    distance: '5.8km',
                    brand: 'Econômica'
                }
            ];
            
            // Calculate savings for each product
            products.forEach(product => {
                product.savings = product.originalPrice - product.price;
                product.savingsPercent = ((product.savings / product.originalPrice) * 100);
            });
            
            return products;
        }

        function createProductCard(product, rankings) {
            const card = document.createElement('div');
            card.className = 'premium-glass rounded-xl p-6 hover:scale-102 transition-all duration-300';
            
            const savings = product.savings;
            const savingsPercent = product.savingsPercent.toFixed(0);
            
            // Determine primary badge based on current sort
            let primaryBadge = '';
            let badgeColor = '';
            
            if (rankings.currentSort === 'price') {
                if (rankings.currentRank === 1) {
                    primaryBadge = 'MELHOR PREÇO';
                    badgeColor = 'green';
                } else if (rankings.currentRank === 2) {
                    primaryBadge = '2º MELHOR PREÇO';
                    badgeColor = 'blue';
                } else {
                    primaryBadge = `${rankings.currentRank}º PREÇO`;
                    badgeColor = 'gray';
                }
            } else if (rankings.currentSort === 'distance') {
                if (rankings.currentRank === 1) {
                    primaryBadge = 'MAIS PRÓXIMO';
                    badgeColor = 'green';
                } else if (rankings.currentRank === 2) {
                    primaryBadge = '2º MAIS PRÓXIMO';
                    badgeColor = 'blue';
                } else {
                    primaryBadge = `${rankings.currentRank}º PROXIMIDADE`;
                    badgeColor = 'gray';
                }
            } else if (rankings.currentSort === 'savings') {
                if (rankings.currentRank === 1) {
                    primaryBadge = 'MAIOR ECONOMIA';
                    badgeColor = 'green';
                } else if (rankings.currentRank === 2) {
                    primaryBadge = '2ª MAIOR ECONOMIA';
                    badgeColor = 'blue';
                } else {
                    primaryBadge = `${rankings.currentRank}º ECONOMIA`;
                    badgeColor = 'gray';
                }
            }
            

            
            // Generate secondary ranking info
            let secondaryInfo = '';
            if (rankings.currentSort === 'price') {
                secondaryInfo = `
                    <div class="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            </svg>
                            ${rankings.distanceRank}º em proximidade
                        </span>
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                            ${rankings.savingsRank}º em economia
                        </span>
                    </div>
                `;
            } else if (rankings.currentSort === 'distance') {
                const priceDifference = (product.price - rankings.cheapestPrice).toFixed(2);
                secondaryInfo = `
                    <div class="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                            ${rankings.priceRank}º em preço
                        </span>
                        <span class="text-orange-600">
                            ${priceDifference > 0 ? `+R$ ${priceDifference}` : 'Melhor preço'} vs mais barato
                        </span>
                    </div>
                `;
            } else if (rankings.currentSort === 'savings') {
                secondaryInfo = `
                    <div class="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                            ${rankings.priceRank}º em preço
                        </span>
                        <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            </svg>
                            ${rankings.distanceRank}º em proximidade
                        </span>
                    </div>
                `;
            }
            
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-bold text-lg text-slate-800 mb-2">${product.name}</h4>
                        <p class="text-slate-600 mb-3">${product.store} • ${product.distance}</p>
                        
                        <div class="flex items-center flex-wrap gap-2 mb-3">
                            <span class="bg-${badgeColor}-100 text-${badgeColor}-800 text-xs px-3 py-1 rounded-full font-semibold">
                                ${primaryBadge}
                            </span>
                            <span class="text-sm text-slate-500">Economia: ${savingsPercent}%</span>
                        </div>
                        

                        
                        ${secondaryInfo}
                        
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl font-bold text-green-600">R$ ${product.price.toFixed(2)}</span>
                            <span class="text-sm text-gray-500 line-through">R$ ${product.originalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <button onclick="addToCart('${product.name}', ${product.price}, '${product.store}')" 
                                class="premium-button text-white px-6 py-2 rounded-lg font-semibold mb-2 hover:scale-105 transition-transform">
                            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                            Adicionar
                        </button>
                        
                        <div class="flex space-x-1 mb-2">
                            <button onclick="showPriceHistory('${product.name}', ${product.price})" 
                                    class="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-200 transition-colors">
                                📊 Histórico
                            </button>
                            <button onclick="setPriceAlert('${product.name}', ${product.price})" 
                                    class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-semibold hover:bg-yellow-200 transition-colors">
                                🔔 Alerta
                            </button>
                        </div>
                        
                        <div class="text-xs text-slate-500">
                            Economize R$ ${savings.toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
            
            return card;
        }

        // Cart functions
