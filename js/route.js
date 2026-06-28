// ============================================
// OTIMIZAÇÃO DE ROTA (Etapa 6 — dados reais)
// Usa mercados reais do banco + OpenStreetMap
// ============================================

let routeMap = null;
let routeMarkers = [];
let userLocationMarker = null;

// ============================================
// PASSO 1: Tela de escolha de raio
// ============================================
async function optimizeRoute() {
    if (cart.length === 0) {
        showNotification('Carrinho vazio', 'Adicione produtos para otimizar a rota', 'warning');
        return;
    }

    if (!currentUser) {
        showSignupModal();
        return;
    }

    showRadiusModal();
}

function showRadiusModal() {
    let modal = document.getElementById('radiusModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'radiusModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="premium-glass rounded-2xl p-8 max-w-md w-full mx-4">
            <div class="text-center mb-6">
                <span class="text-5xl">📍</span>
                <h3 class="text-2xl font-bold text-slate-800 mt-3 mb-1">Onde você quer comprar?</h3>
                <p class="text-slate-500 text-sm">Escolha a área de busca para encontrar os melhores preços</p>
            </div>

            <div class="space-y-3 mb-6">

                <!-- Cidade toda -->
                <button onclick="startRouteSearch('city')"
                        class="w-full flex items-center gap-4 p-4 border-2 border-indigo-200 bg-indigo-50 rounded-xl hover:border-indigo-400 hover:bg-indigo-100 transition-all text-left">
                    <span class="text-3xl">🏙️</span>
                    <div>
                        <p class="font-semibold text-slate-800">Cidade toda</p>
                        <p class="text-sm text-slate-500">Busca nos ${77} mercados de Juiz de Fora</p>
                    </div>
                </button>

                <!-- Por raio -->
                <div class="border-2 border-gray-200 rounded-xl p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-2xl">🎯</span>
                        <div>
                            <p class="font-semibold text-slate-800">Por distância</p>
                            <p class="text-sm text-slate-500">Só mercados perto de você</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        ${[1, 2, 5, 10].map(km => `
                            <button onclick="startRouteSearch('radius', ${km})"
                                    class="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-700
                                           hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                                ${km}km
                            </button>
                        `).join('')}
                    </div>
                    <p class="text-xs text-slate-400 mt-2 text-center">
                        Será necessário permitir acesso à sua localização
                    </p>
                </div>

            </div>

            <button onclick="closeModal('radiusModal')"
                    class="w-full py-3 border border-gray-200 rounded-xl text-slate-500 hover:bg-gray-50 transition-colors text-sm">
                Cancelar
            </button>
        </div>
    `;

    modal.classList.add('active');
}

// ============================================
// PASSO 2: Busca por raio ou cidade toda
// ============================================
async function startRouteSearch(mode, radiusKm = null) {
    closeModal('radiusModal');
    showNotification('Buscando...', 'Calculando melhores preços e rotas', 'info');

    let userLat = null, userLon = null;

    // Se for por raio, pede a localização
    if (mode === 'radius') {
        try {
            const pos = await getUserLocation();
            userLat = pos.coords.latitude;
            userLon = pos.coords.longitude;
        } catch (err) {
            showNotification('Localização negada', 'Permita o acesso à sua localização para usar essa opção, ou escolha "Cidade toda"', 'warning');
            return;
        }
    }

    // Busca ofertas no banco
    const productNames = [...new Set(cart.map(i => i.name.split(' - ')[0]))];

    const { data: offers, error } = await supabaseClient
        .from('market_products')
        .select(`
            price,
            products!inner ( name ),
            markets!inner ( id, name, neighborhood, address, latitude, longitude )
        `)
        .in('products.name', productNames)
        .eq('in_stock', true);

    if (error || !offers || offers.length === 0) {
        showNotification('Sem resultados', 'Não encontrei preços para os produtos do carrinho ainda', 'warning');
        return;
    }

    // Agrupa por mercado
    let byMarket = {};
    offers.forEach(o => {
        const mId = o.markets.id;
        if (!byMarket[mId]) {
            byMarket[mId] = {
                id: mId,
                name: o.markets.name,
                neighborhood: o.markets.neighborhood,
                address: o.markets.address,
                lat: o.markets.latitude ? Number(o.markets.latitude) : null,
                lon: o.markets.longitude ? Number(o.markets.longitude) : null,
                items: [],
                total: 0
            };
        }
        byMarket[mId].items.push({ name: o.products.name, price: Number(o.price) });
        byMarket[mId].total += Number(o.price);
    });

    let marketList = Object.values(byMarket);

    // Filtra por raio se necessário
    if (mode === 'radius' && userLat && userLon) {
        marketList = marketList.filter(m => {
            if (!m.lat || !m.lon) return false;
            const dist = haversineKm(userLat, userLon, m.lat, m.lon);
            m.distanceKm = dist;
            return dist <= radiusKm;
        });

        if (marketList.length === 0) {
            showNotification('Nenhum mercado encontrado', `Não encontrei mercados em ${radiusKm}km com os produtos do seu carrinho. Tente um raio maior ou "Cidade toda".`, 'warning');
            return;
        }
    } else {
        // Cidade toda: calcula distância se tiver localização (só pra mostrar no card)
        marketList.forEach(m => { m.distanceKm = null; });
    }

    const options = buildRouteOptions(marketList, cart);
    showRouteModal(options, { userLat, userLon, mode, radiusKm });
}

// Distância em km entre dois pontos (fórmula de Haversine)
function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Pede a localização do usuário (retorna Promise)
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalização não suportada neste navegador'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 60000
        });
    });
}

// ============================================
// PASSO 3: Calcula opções de rota
// ============================================
function buildRouteOptions(marketList, cartItems) {
    const sorted = [...marketList].sort((a, b) => a.total - b.total);
    const cheapest = sorted[0];
    const distributed = buildDistributedOption(marketList, cartItems);
    const balanced = buildBalancedOption(marketList, cartItems);

    return [
        {
            title: 'Menor Preço',
            subtitle: 'Tudo em um só lugar',
            icon: '💰',
            color: 'green',
            markets: [cheapest],
            total: cheapest.total,
            explanation: `Todos os itens no ${cheapest.name}`,
            savings: 0
        },
        {
            title: 'Distribuído',
            subtitle: 'Cada item no mais barato',
            icon: '🗺️',
            color: 'blue',
            markets: distributed.markets,
            total: distributed.total,
            explanation: distributed.explanation,
            savings: Math.max(0, cheapest.total - distributed.total)
        },
        {
            title: 'Equilibrado',
            subtitle: 'Economia sem muito deslocamento',
            icon: '⚖️',
            color: 'purple',
            markets: balanced.markets,
            total: balanced.total,
            explanation: balanced.explanation,
            savings: Math.max(0, cheapest.total - balanced.total)
        }
    ].filter(o => o.markets.length > 0 && o.total > 0);
}

function buildDistributedOption(marketList, cartItems) {
    const assignment = {};
    let total = 0;

    cartItems.forEach(cartItem => {
        const productName = cartItem.name.split(' - ')[0];
        let bestPrice = Infinity;
        let bestMarket = null;

        marketList.forEach(market => {
            const offer = market.items.find(i =>
                i.name.toLowerCase().includes(productName.toLowerCase()) ||
                productName.toLowerCase().includes(i.name.toLowerCase())
            );
            if (offer && offer.price < bestPrice) {
                bestPrice = offer.price;
                bestMarket = market;
            }
        });

        if (bestMarket) {
            if (!assignment[bestMarket.id]) assignment[bestMarket.id] = { ...bestMarket, assignedItems: [] };
            assignment[bestMarket.id].assignedItems.push(cartItem.name);
            total += bestPrice;
        }
    });

    const markets = Object.values(assignment);
    return {
        markets,
        total,
        explanation: `${markets.length} mercado${markets.length > 1 ? 's' : ''}, cada produto no mais barato`
    };
}

function buildBalancedOption(marketList, cartItems) {
    const top2 = [...marketList].sort((a, b) => b.items.length - a.items.length).slice(0, 2);
    const total = top2.reduce((sum, m) => sum + m.total, 0) / Math.max(top2.length, 1);
    return {
        markets: top2,
        total,
        explanation: `${top2.length} mercado${top2.length > 1 ? 's' : ''}, bom equilíbrio entre preço e deslocamento`
    };
}

// ============================================
// PASSO 4: Modal com mapa
// ============================================
function showRouteModal(options, context = {}) {
    let modal = document.getElementById('routeOptimizationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'routeOptimizationModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const { mode, radiusKm } = context;
    const subtitle = mode === 'radius'
        ? `Mercados em até ${radiusKm}km de você`
        : 'Todos os mercados de Juiz de Fora';

    modal.innerHTML = `
        <div class="premium-glass rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 class="text-2xl font-bold text-slate-800">🗺️ Otimização de Rota</h3>
                    <p class="text-slate-500 text-sm mt-1">${subtitle}</p>
                </div>
                <button onclick="closeModal('routeOptimizationModal'); if(routeMap){routeMap.remove(); routeMap=null;}"
                        class="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div class="p-6">
                <!-- Opções -->
                <div class="grid grid-cols-1 md:grid-cols-${options.length} gap-4 mb-6">
                    ${options.map((opt, i) => `
                        <div onclick="selectRouteOption(${i})"
                             class="route-option border-2 border-${opt.color}-200 bg-${opt.color}-50 rounded-xl p-5 cursor-pointer hover:scale-105 transition-all"
                             id="routeOpt${i}">
                            <div class="text-center mb-3">
                                <span class="text-3xl">${opt.icon}</span>
                                <h4 class="font-bold text-${opt.color}-800 mt-1">${opt.title}</h4>
                                <p class="text-xs text-${opt.color}-600">${opt.subtitle}</p>
                            </div>
                            <div class="text-center mb-3">
                                <p class="text-2xl font-bold text-${opt.color}-700">R$ ${opt.total.toFixed(2)}</p>
                                ${opt.savings > 0 ? `<p class="text-xs text-green-600 font-medium mt-1">💚 Economize R$ ${opt.savings.toFixed(2)}</p>` : ''}
                            </div>
                            <p class="text-xs text-${opt.color}-700 text-center mb-3">${opt.explanation}</p>
                            <div class="space-y-1">
                                ${opt.markets.map(m => `
                                    <div class="bg-white rounded-lg px-3 py-2 text-xs">
                                        <p class="font-semibold text-slate-700">${m.name}</p>
                                        <p class="text-slate-400">${m.neighborhood}
                                            ${m.distanceKm ? ` • ${m.distanceKm.toFixed(1)}km` : ''}
                                            • ${m.items.length} itens
                                        </p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Mapa -->
                <div class="rounded-xl overflow-hidden mb-4 border border-gray-200" style="height: 300px;">
                    <div id="routeMap" style="height:100%;width:100%;"></div>
                </div>
                <p class="text-xs text-slate-400 text-center mb-4">
                    Mapa via OpenStreetMap • Clique nas opções acima para ver os mercados no mapa
                </p>

                <div class="flex gap-3">
                    <button onclick="showRadiusModal(); closeModal('routeOptimizationModal'); if(routeMap){routeMap.remove(); routeMap=null;}"
                            class="flex-1 py-3 border border-gray-200 rounded-xl text-slate-500 hover:bg-gray-50 text-sm">
                        ← Mudar raio de busca
                    </button>
                    <button onclick="closeModal('routeOptimizationModal'); if(routeMap){routeMap.remove(); routeMap=null;}"
                            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    window._routeOptions = options;
    window._routeContext = context;

    setTimeout(() => {
        initRouteMap(options, 0, context);
    }, 300);

    selectRouteOption(0);
}

function initRouteMap(options, selectedIndex, context = {}) {
    if (typeof L === 'undefined') return;

    if (routeMap) { routeMap.remove(); routeMap = null; }

    routeMap = L.map('routeMap').setView([-21.7642, -43.3503], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(routeMap);

    // Marcador da localização do usuário
    if (context.userLat && context.userLon) {
        const userIcon = L.divIcon({
            html: '<div style="background:#4f46e5;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #4f46e5;"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
        L.marker([context.userLat, context.userLon], { icon: userIcon })
            .addTo(routeMap)
            .bindPopup('📍 Você está aqui');

        // Círculo do raio
        if (context.radiusKm) {
            L.circle([context.userLat, context.userLon], {
                radius: context.radiusKm * 1000,
                color: '#4f46e5',
                fillColor: '#4f46e5',
                fillOpacity: 0.05,
                weight: 1.5,
                dashArray: '6'
            }).addTo(routeMap);
        }
    }

    updateMapMarkers(options[selectedIndex]);
}

function updateMapMarkers(option) {
    if (!routeMap) return;

    routeMarkers.forEach(m => routeMap.removeLayer(m));
    routeMarkers = [];

    const validMarkets = option.markets.filter(m => m.lat && m.lon);

    if (validMarkets.length === 0) {
        L.popup()
            .setLatLng([-21.7642, -43.3503])
            .setContent('⚠️ Coordenadas dos mercados ainda não cadastradas.<br>Rode o script de geocodificação no painel admin.')
            .openOn(routeMap);
        return;
    }

    validMarkets.forEach(market => {
        const marker = L.marker([market.lat, market.lon])
            .addTo(routeMap)
            .bindPopup(`
                <strong>${market.name}</strong><br>
                ${market.address}<br>
                ${market.neighborhood}<br>
                ${market.distanceKm ? `📍 ${market.distanceKm.toFixed(1)}km de você<br>` : ''}
                🛒 ${market.items.length} itens disponíveis
            `);
        routeMarkers.push(marker);
    });

    if (validMarkets.length === 1) {
        routeMap.setView([validMarkets[0].lat, validMarkets[0].lon], 15);
    } else {
        const group = L.featureGroup(routeMarkers);
        routeMap.fitBounds(group.getBounds().pad(0.2));
    }
}

function selectRouteOption(index) {
    const opts = window._routeOptions;
    if (!opts) return;

    document.querySelectorAll('.route-option').forEach((el, i) => {
        el.style.opacity = i === index ? '1' : '0.6';
        el.style.transform = i === index ? 'scale(1.03)' : 'scale(1)';
    });

    if (routeMap) updateMapMarkers(opts[index]);
    else if (window._routeContext) initRouteMap(opts, index, window._routeContext);
}
