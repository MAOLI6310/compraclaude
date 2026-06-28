// ============================================
// CARRINHO DE COMPRAS (Etapa 6 — persistência real)
// ============================================

let isCartOpen = false;

async function addToCart(name, price, store) {
    if (!isLoggedIn) {
        showSignupModal();
        return;
    }

    // Verifica se já existe no carrinho
    const existing = cart.find(i => i.name === name && i.store === store);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
        updateCartDisplay();
        await saveUserCart();
        showNotification('Quantidade atualizada!', `${name} agora tem ${existing.quantity} unidades`, 'info');
        return;
    }

    const item = {
        id: Date.now(),
        name,
        price,
        store,
        quantity: 1,
        addedAt: new Date().toISOString()
    };

    cart.push(item);
    updateCartDisplay();
    await saveUserCart();

    const planLabel = currentUser ? currentUser.plan : '';
    if (planLabel === 'Premium') {
        const cashback = (price * 0.05).toFixed(2);
        showNotification('Adicionado + Cashback!', `${name} adicionado. Cashback: R$ ${cashback}`, 'success');
    } else {
        showNotification('Adicionado!', `${name} foi adicionado ao carrinho`, 'success');
    }

    if (!isCartOpen || cart.length === 1) openCart();
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    saveUserCart();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    saveUserCart();
    showNotification('Carrinho limpo', 'Todos os itens foram removidos', 'info');
}

// ============================================
// PERSISTÊNCIA NO SUPABASE
// ============================================
async function saveUserCart() {
    if (!currentUser) return;

    // Apaga o carrinho atual e recria
    await supabaseClient
        .from('cart_items')
        .delete()
        .eq('user_id', currentUser.uid);

    if (cart.length === 0) return;

    // Busca os IDs dos produtos pelo nome (simplificado — na Etapa futura
    // o carrinho vai guardar o product_id diretamente)
    const inserts = cart.map(item => ({
        user_id: currentUser.uid,
        product_id: null,   // TODO: guardar product_id no item ao adicionar
        market_id: null,    // TODO: guardar market_id no item ao adicionar
        quantity: item.quantity || 1
    })).filter(i => i.product_id !== undefined);

    // Por enquanto salva em localStorage como fallback
    // (a ligação direta com product_id vem quando a busca retornar IDs)
    localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cart));
}

async function loadUserCart() {
    if (!currentUser) return;

    // Carrega do localStorage por enquanto
    const saved = localStorage.getItem(`cart_${currentUser.uid}`);
    if (saved) {
        try {
            cart = JSON.parse(saved);
            updateCartDisplay();
        } catch(e) {
            cart = [];
        }
    }
}

// ============================================
// DISPLAY DO CARRINHO
// ============================================
function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const emptyCart = document.getElementById('emptyCart');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const cartSavings = document.getElementById('cartSavings');

    if (isLoggedIn && currentUser && cartCount) {
        cartCount.classList.remove('hidden');
        cartCount.style.cssText = 'display:flex!important;visibility:visible!important;opacity:1!important;';
        cartCount.textContent = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);

        let parent = cartCount.parentElement;
        while (parent && parent !== document.body) {
            parent.classList.remove('hidden');
            parent.style.visibility = 'visible';
            if (parent.tagName === 'BUTTON') parent.style.display = 'block';
            parent = parent.parentElement;
        }

        if (cart.length === 0) {
            if (emptyCart) emptyCart.classList.remove('hidden');
            if (cartItemsList) cartItemsList.classList.add('hidden');
            if (cartFooter) cartFooter.classList.add('hidden');
        } else {
            if (emptyCart) emptyCart.classList.add('hidden');
            if (cartItemsList) cartItemsList.classList.remove('hidden');
            if (cartFooter) cartFooter.classList.remove('hidden');

            if (cartItemsList) {
                let total = 0;
                cartItemsList.innerHTML = '';

                cart.forEach(item => {
                    total += item.price * (item.quantity || 1);

                    const el = document.createElement('div');
                    el.className = 'cart-item bg-gray-50 rounded-lg p-4';
                    el.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h5 class="font-semibold text-gray-800">${item.name}</h5>
                                <p class="text-sm text-gray-600">${item.store}</p>
                                <div class="flex items-center gap-2 mt-1">
                                    <p class="text-lg font-bold text-green-600">R$ ${item.price.toFixed(2)}</p>
                                    ${(item.quantity || 1) > 1 ? `<span class="text-xs text-slate-500">x${item.quantity}</span>` : ''}
                                </div>
                            </div>
                            <button onclick="removeFromCart(${item.id})" class="text-red-400 hover:text-red-600 ml-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    `;
                    cartItemsList.appendChild(el);
                });

                if (cartTotal) cartTotal.textContent = `R$ ${total.toFixed(2)}`;
                if (cartSavings) cartSavings.textContent = `R$ 0,00`; // será calculado na rota
            }
        }
    } else {
        if (cartCount) {
            cartCount.classList.add('hidden');
            cartCount.style.display = 'none';
        }
    }
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    isCartOpen = !isCartOpen;
    cartSidebar.classList.toggle('translate-x-full', !isCartOpen);
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
