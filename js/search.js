// ============================================
// BUSCA E COMPARAÇÃO DE PRODUTOS (Etapa 4 — dados reais do Supabase)
// ============================================

function startComparison() {
    if (!isLoggedIn) {
        showSignupModal();
        return;
    }

    document.getElementById('productSearch').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('productSearchInput').focus();
}

function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        searchProducts();
    }
}

async function searchProducts() {
    if (!isLoggedIn) {
        showSignupModal();
        return;
    }

    const query = document.getElementById('productSearchInput').value.trim();
    if (!query) {
        showNotification('Atenção', 'Digite um produto para buscar', 'warning');
        return;
    }

    showNotification('Buscando...', 'Procurando os melhores preços', 'info');

    const results = await fetchOffers({ field: 'name', value: query });
    displaySearchResults(results);

    if (isCartOpen) {
        openCart();
    }
}

async function searchByCategory(category) {
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

    const label = categoryNames[category] || category;
    document.getElementById('productSearchInput').value = label;

    const wasCartOpen = isCartOpen;
    showNotification('Buscando...', 'Procurando os melhores preços', 'info');

    const results = await fetchOffers({ field: 'category', value: label });
    displaySearchResults(results);

    if (wasCartOpen) {
        openCart();
    }
}

// ============================================
// Busca no banco real: junta market_products + products + markets
// ============================================
async function fetchOffers({ field, value }) {
    let query = supabaseClient
        .from('market_products')
        .select(`
            id,
            price,
            last_updated,
            products!inner ( id, name, brand, unit, category ),
            markets!inner ( id, name, neighborhood )
        `)
        .eq('in_stock', true)
        .limit(100);

    if (field === 'name') {
        query = query.ilike('products.name', `%${value}%`);
    } else {
        query = query.ilike('products.category', `%${value}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        showNotification('Erro', 'Não foi possível buscar os produtos agora', 'error');
        return [];
    }

    // Calcula a "economia" comparando o preço de cada oferta com o
    // preço mais alto encontrado para o MESMO produto entre os mercados
    const maxPriceByProduct = {};
    data.forEach(row => {
        const pid = row.products.id;
        if (!maxPriceByProduct[pid] || row.price > maxPriceByProduct[pid]) {
            maxPriceByProduct[pid] = row.price;
        }
    });

    return data.map(row => {
        const maxPrice = maxPriceByProduct[row.products.id];
        const savings = maxPrice - row.price;
        const savingsPercent = maxPrice > 0 ? (savings / maxPrice) * 100 : 0;
        const brandPart = row.products.brand && row.products.brand !== 'Sem marca' ? ` - ${row.products.brand}` : '';

        return {
            offerId: row.id,
            productId: row.products.id,
            name: `${row.products.name}${brandPart}`,
            unit: row.products.unit,
            store: row.markets.name,
            neighborhood: row.markets.neighborhood,
            price: Number(row.price),
            savings: savings,
            savingsPercent: savingsPercent,
            lastUpdated: row.last_updated
        };
    });
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');

    currentProducts = results;

    resultsCount.textContent = `${currentProducts.length} produtos encontrados`;

    document.getElementById('sortBy').value = 'price';

    sortProducts();

    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function sortProducts() {
    const sortBy = document.getElementById('sortBy').value;
    const productList = document.getElementById('productList');

    if (currentProducts.length === 0) {
        productList.innerHTML = `
            <div class="text-center text-slate-500 py-8">
                Nenhum produto encontrado para essa busca ainda.<br>
                <span class="text-sm">Os preços são cadastrados conforme os mercados parceiros enviam suas listas.</span>
            </div>
        `;
        return;
    }

    let sortedProducts = [...currentProducts];

    switch (sortBy) {
        case 'price':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'distance':
            // Coordenadas reais dos mercados ainda não existem (chegam na
            // Etapa 6). Por enquanto, agrupamos por bairro em ordem alfabética.
            sortedProducts.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
            break;
        case 'savings':
            sortedProducts.sort((a, b) => b.savings - a.savings);
            break;
    }

    const priceRanking = [...currentProducts].sort((a, b) => a.price - b.price);
    const savingsRanking = [...currentProducts].sort((a, b) => b.savings - a.savings);

    productList.innerHTML = '';

    sortedProducts.forEach((product, index) => {
        const priceRank = priceRanking.findIndex(p => p.offerId === product.offerId) + 1;
        const savingsRank = savingsRanking.findIndex(p => p.offerId === product.offerId) + 1;

        const productCard = createProductCard(product, {
            currentSort: sortBy,
            currentRank: index + 1,
            priceRank: priceRank,
            savingsRank: savingsRank,
            totalProducts: currentProducts.length,
            cheapestPrice: priceRanking[0].price
        });
        productList.appendChild(productCard);
    });
}

// Variável global com os resultados da busca atual
let currentProducts = [];

function createProductCard(product, rankings) {
    const card = document.createElement('div');
    card.className = 'premium-glass rounded-xl p-6 hover:scale-102 transition-all duration-300';

    const savings = product.savings;
    const savingsPercent = product.savingsPercent.toFixed(0);

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
        primaryBadge = product.neighborhood ? product.neighborhood.toUpperCase() : 'BAIRRO';
        badgeColor = 'gray';
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

    let secondaryInfo = '';
    if (rankings.currentSort === 'price') {
        secondaryInfo = `
            <div class="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                <span class="flex items-center">
                    📍 ${product.neighborhood || 'Bairro não informado'}
                </span>
                ${product.savings > 0 ? `
                <span class="flex items-center">
                    ${rankings.savingsRank}º em economia
                </span>` : ''}
            </div>
        `;
    } else if (rankings.currentSort === 'distance') {
        const priceDifference = (product.price - rankings.cheapestPrice).toFixed(2);
        secondaryInfo = `
            <div class="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                <span class="flex items-center">
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
                    ${rankings.priceRank}º em preço
                </span>
                <span class="flex items-center">
                    📍 ${product.neighborhood || 'Bairro não informado'}
                </span>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <h4 class="font-bold text-lg text-slate-800 mb-2">${product.name}${product.unit ? ` (${product.unit})` : ''}</h4>
                <p class="text-slate-600 mb-3">${product.store} • ${product.neighborhood || ''}</p>
                
                <div class="flex items-center flex-wrap gap-2 mb-3">
                    <span class="bg-${badgeColor}-100 text-${badgeColor}-800 text-xs px-3 py-1 rounded-full font-semibold">
                        ${primaryBadge}
                    </span>
                    ${product.savings > 0 ? `<span class="text-sm text-slate-500">Economia: ${savingsPercent}%</span>` : ''}
                </div>
                
                ${secondaryInfo}
                
                <div class="flex items-center space-x-2">
                    <span class="text-2xl font-bold text-green-600">R$ ${product.price.toFixed(2)}</span>
                </div>
            </div>
            <div class="text-right">
                <button onclick="addToCart('${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.store.replace(/'/g, "\\'")}')" 
                        class="premium-button text-white px-6 py-2 rounded-lg font-semibold mb-2 hover:scale-105 transition-transform">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Adicionar
                </button>
                
                <div class="flex space-x-1 mb-2">
                    <button onclick="showPriceHistory('${product.name.replace(/'/g, "\\'")}', ${product.price})" 
                            class="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-200 transition-colors">
                        📊 Histórico
                    </button>
                    <button onclick="setPriceAlert('${product.name.replace(/'/g, "\\'")}', ${product.price})" 
                            class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-semibold hover:bg-yellow-200 transition-colors">
                        🔔 Alerta
                    </button>
                </div>
                
                ${product.savings > 0 ? `<div class="text-xs text-slate-500">Economize R$ ${savings.toFixed(2)}</div>` : ''}
            </div>
        </div>
    `;

    return card;
}
