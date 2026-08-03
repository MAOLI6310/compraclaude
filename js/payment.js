// ============================================
// PAGAMENTO — Mercado Pago (Etapa 7)
// Pix + Cartão de Crédito
// ============================================

const MP_PUBLIC_KEY = "APP_USR-2c5c2639-27bb-499a-8aa2-468bdb3de80c";

let mp = null;

function initMercadoPago() {
    if (window.MercadoPago && !mp) {
        mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
    }
}

// ============================================
// MODAL DE PAGAMENTO
// ============================================
function showPaymentModal(planKey) {
    if (!isLoggedIn) { showSignupModal(); return; }
    const plan = PLAN_INFO[planKey];
    if (!plan) return;

    let modal = document.getElementById('paymentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="premium-glass rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 class="text-xl font-bold text-slate-800">Assinar Plano ${plan.label}</h3>
                    <p class="text-2xl font-bold text-green-600 mt-1">R$ ${plan.price.toFixed(2)}<span class="text-sm font-normal text-slate-500">/mês</span></p>
                </div>
                <button onclick="closeModal('paymentModal')" class="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div class="p-6">
                <p class="text-sm font-semibold text-slate-700 mb-3">Forma de pagamento</p>
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <button onclick="selectPaymentMethod('pix', '${planKey}')" id="btnPix"
                            class="payment-method-btn flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all">
                        <span class="text-3xl">🟢</span>
                        <span class="font-semibold text-slate-700">Pix</span>
                        <span class="text-xs text-green-600">Aprovação imediata</span>
                    </button>
                    <button onclick="selectPaymentMethod('card', '${planKey}')" id="btnCard"
                            class="payment-method-btn flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <span class="text-3xl">💳</span>
                        <span class="font-semibold text-slate-700">Cartão</span>
                        <span class="text-xs text-blue-600">Crédito ou débito</span>
                    </button>
                </div>
                <div id="paymentArea"></div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    initMercadoPago();
}

function selectPaymentMethod(method, planKey) {
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('border-green-400', 'bg-green-50', 'border-blue-400', 'bg-blue-50');
        btn.classList.add('border-gray-200');
    });
    if (method === 'pix') {
        document.getElementById('btnPix').classList.add('border-green-400', 'bg-green-50');
        renderPixForm(planKey);
    } else {
        document.getElementById('btnCard').classList.add('border-blue-400', 'bg-blue-50');
        renderCardForm(planKey);
    }
}

// ============================================
// PIX
// ============================================
function renderPixForm(planKey) {
    const plan = PLAN_INFO[planKey];
    document.getElementById('paymentArea').innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p class="text-sm text-green-800">
                Clique em "Gerar QR Code" para criar uma cobrança de
                <strong>R$ ${plan.price.toFixed(2)}</strong>.
                Escaneie com o app do seu banco. O plano é ativado automaticamente após a confirmação.
            </p>
        </div>
        <div id="pixQRArea" class="hidden text-center mb-4">
            <p class="text-sm text-slate-600 mb-3">Escaneie o QR Code abaixo:</p>
            <img id="pixQRImage" src="" alt="QR Code Pix" class="mx-auto rounded-xl border w-48 h-48 object-contain"/>
            <div class="mt-3 bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-slate-500 mb-1">Ou copie o código Pix:</p>
                <div class="flex gap-2">
                    <input id="pixCode" type="text" readonly class="flex-1 text-xs bg-white border rounded px-2 py-1"/>
                    <button onclick="copyPixCode()" class="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700">Copiar</button>
                </div>
            </div>
            <p class="text-xs text-slate-400 mt-3">⏱️ QR Code válido por 30 minutos</p>
        </div>
        <div id="pixLoading" class="hidden text-center py-6">
            <div class="animate-spin text-4xl mb-3">⏳</div>
            <p class="text-slate-500">Gerando QR Code...</p>
        </div>
        <button onclick="generatePix('${planKey}')" id="btnGeneratePix"
                class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold">
            🟢 Gerar QR Code Pix — R$ ${plan.price.toFixed(2)}
        </button>
    `;
}

async function generatePix(planKey) {
    const plan = PLAN_INFO[planKey];
    document.getElementById('btnGeneratePix').classList.add('hidden');
    document.getElementById('pixLoading').classList.remove('hidden');

    try {
        const res = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'pix',
                planKey,
                amount: plan.price,
                email: currentUser.email,
                userId: currentUser.uid
            })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Erro ao gerar Pix');

        document.getElementById('pixLoading').classList.add('hidden');
        document.getElementById('pixQRArea').classList.remove('hidden');
        document.getElementById('pixQRImage').src = data.qr_code_base64
            ? `data:image/png;base64,${data.qr_code_base64}` : '';
        document.getElementById('pixCode').value = data.qr_code || '';

        startPaymentPolling(data.payment_id, planKey);
    } catch (err) {
        document.getElementById('pixLoading').classList.add('hidden');
        document.getElementById('btnGeneratePix').classList.remove('hidden');
        showNotification('Erro', err.message || 'Não foi possível gerar o Pix', 'error');
    }
}

function copyPixCode() {
    navigator.clipboard.writeText(document.getElementById('pixCode').value)
        .then(() => showNotification('Copiado!', 'Código Pix copiado', 'success'));
}

// ============================================
// CARTÃO
// ============================================
function renderCardForm(planKey) {
    const plan = PLAN_INFO[planKey];
    document.getElementById('paymentArea').innerHTML = `
        <div class="space-y-3 mb-4">
            <div>
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Número do cartão</label>
                <div id="cardNumberContainer" class="border rounded-lg px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-blue-400 min-h-[48px]"></div>
            </div>
            <div>
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Nome no cartão</label>
                <input id="cardholderName" type="text" placeholder="Como está no cartão"
                       class="w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-xs font-semibold text-slate-600 mb-1 block">Validade</label>
                    <div id="expirationDateContainer" class="border rounded-lg px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-blue-400 min-h-[48px]"></div>
                </div>
                <div>
                    <label class="text-xs font-semibold text-slate-600 mb-1 block">CVV</label>
                    <div id="securityCodeContainer" class="border rounded-lg px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-blue-400 min-h-[48px]"></div>
                </div>
            </div>
            <div>
                <label class="text-xs font-semibold text-slate-600 mb-1 block">CPF do titular</label>
                <input id="cardholderCPF" type="text" placeholder="000.000.000-00" oninput="formatCPF(this)"
                       class="w-full border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
        </div>
        <div id="cardError" class="hidden bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p id="cardErrorMsg" class="text-sm text-red-700"></p>
        </div>
        <div id="cardLoading" class="hidden text-center py-6">
            <div class="animate-spin text-4xl mb-3">⏳</div>
            <p class="text-slate-500">Processando pagamento...</p>
        </div>
        <button onclick="processCardPayment('${planKey}')" id="btnPayCard"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">
            💳 Pagar R$ ${plan.price.toFixed(2)}
        </button>
        <p class="text-xs text-slate-400 text-center mt-3">🔒 Pagamento seguro via Mercado Pago</p>
    `;

    setTimeout(() => {
        if (mp) {
            try {
                const fields = mp.fields({ locale: 'pt-BR', advancedFraudPrevention: true });
                fields.create('cardNumber', { placeholder: '0000 0000 0000 0000' }).mount('cardNumberContainer');
                fields.create('expirationDate', { placeholder: 'MM/AA' }).mount('expirationDateContainer');
                fields.create('securityCode', { placeholder: '000' }).mount('securityCodeContainer');
            } catch(e) {
                console.error('Erro ao montar campos do cartão:', e);
            }
        }
    }, 300);
}

async function processCardPayment(planKey) {
    const plan = PLAN_INFO[planKey];
    const cardholderName = document.getElementById('cardholderName').value.trim();
    const cpf = document.getElementById('cardholderCPF').value.replace(/\D/g, '');

    if (!cardholderName) { showCardError('Informe o nome do titular'); return; }
    if (cpf.length !== 11) { showCardError('Informe um CPF válido'); return; }

    document.getElementById('btnPayCard').classList.add('hidden');
    document.getElementById('cardLoading').classList.remove('hidden');

    try {
        const token = await mp.fields.createCardToken({
            cardholderName,
            identificationType: 'CPF',
            identificationNumber: cpf
        });

        const res = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'card',
                planKey,
                amount: plan.price,
                email: currentUser.email,
                userId: currentUser.uid,
                token: token.id,
                installments: 1,
                cardholderName,
                identificationType: 'CPF',
                identificationNumber: cpf
            })
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Pagamento recusado');

        if (data.status === 'approved') {
            await activatePlan(planKey);
            closeModal('paymentModal');
            showNotification('Pagamento aprovado! 🎉', `Plano ${plan.label} ativado!`, 'success');
        } else {
            throw new Error('Pagamento não aprovado. Verifique os dados do cartão.');
        }
    } catch (err) {
        document.getElementById('cardLoading').classList.add('hidden');
        document.getElementById('btnPayCard').classList.remove('hidden');
        showCardError(err.message || 'Erro ao processar. Tente novamente.');
    }
}

function showCardError(msg) {
    document.getElementById('cardErrorMsg').textContent = msg;
    document.getElementById('cardError').classList.remove('hidden');
}

// ============================================
// POLLING — verifica se o Pix foi pago
// ============================================
let pollingInterval = null;

function startPaymentPolling(paymentId, planKey) {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/check-payment?id=${paymentId}`);
            const data = await res.json();
            if (data.status === 'approved') {
                clearInterval(pollingInterval);
                await activatePlan(planKey);
                closeModal('paymentModal');
                showNotification('Pix confirmado! 🎉', `Plano ${PLAN_INFO[planKey].label} ativado!`, 'success');
            }
        } catch (err) { console.error('Polling error:', err); }
    }, 5000);
    setTimeout(() => clearInterval(pollingInterval), 30 * 60 * 1000);
}

// ============================================
// ATIVA O PLANO NO BANCO APÓS PAGAMENTO
// ============================================
async function activatePlan(planKey) {
    if (!currentUser) return;
    const { error } = await supabaseClient
        .from('profiles')
        .update({ plan: planKey, subscription_status: 'active' })
        .eq('id', currentUser.uid);
    if (!error) {
        currentUser.plan = PLAN_INFO[planKey].label;
        updateUserInterface();
    }
}
