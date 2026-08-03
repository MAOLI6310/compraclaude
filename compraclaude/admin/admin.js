// ============================================
// CompraClaude — Painel Admin (Etapa 5)
// Importação de preços com detecção automática
// de colunas e match por código de barras/nome
// ============================================

// ============================================
// AUTENTICAÇÃO ADMIN
// ============================================
const ADMIN_EMAILS = []; // preenchido dinamicamente via profiles.plan = 'admin'

async function adminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');

    errorEl.classList.add('hidden');

    if (!email || !password) {
        errorEl.textContent = 'Preencha e-mail e senha';
        errorEl.classList.remove('hidden');
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        errorEl.textContent = 'E-mail ou senha incorretos';
        errorEl.classList.remove('hidden');
        return;
    }

    // Verifica se é admin (tem coluna plan = 'admin' no perfil)
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('plan')
        .eq('id', data.user.id)
        .single();

    if (!profile || profile.plan !== 'admin') {
        await supabaseClient.auth.signOut();
        errorEl.textContent = 'Acesso restrito a administradores';
        errorEl.classList.remove('hidden');
        return;
    }

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    await loadMarkets();
    showTab('import');
    loadReviewQueue();
}

async function adminLogout() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// ============================================
// ABAS / NAVEGAÇÃO
// ============================================
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-indigo-600', 'text-white');
        b.classList.add('bg-gray-100', 'text-slate-600');
    });

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('bg-indigo-600', 'text-white');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('bg-gray-100', 'text-slate-600');

    if (tabName === 'history') loadHistory();
    if (tabName === 'review') loadReviewQueue();
}

// ============================================
// MERCADOS
// ============================================
let markets = [];

async function loadMarkets() {
    const { data, error } = await supabaseClient
        .from('markets')
        .select('id, name, neighborhood')
        .eq('active', true)
        .order('name');

    if (error || !data) return;
    markets = data;

    const select = document.getElementById('marketSelect');
    select.innerHTML = '<option value="">Selecione o mercado...</option>';
    data.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} — ${m.neighborhood}`;
        select.appendChild(opt);
    });
}

// ============================================
// UPLOAD DE ARQUIVO
// ============================================
let uploadedFile = null;
let parsedData = [];    // todas as linhas do arquivo
let fileColumns = [];   // nomes das colunas detectadas

function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.add('drag-over');
}

function handleDragLeave(e) {
    document.getElementById('dropZone').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

function clearFile() {
    uploadedFile = null;
    parsedData = [];
    fileColumns = [];
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('dropZone').classList.remove('hidden');
}

function processFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert('Arquivo muito grande. Máximo: 10MB');
        return;
    }

    uploadedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = `${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById('fileInfo').classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            if (json.length < 2) {
                alert('Arquivo sem dados suficientes (mínimo 2 linhas: cabeçalho + dados)');
                return;
            }

            // Primeira linha = cabeçalho, resto = dados
            const headers = json[0].map(h => String(h).trim());
            fileColumns = headers;
            parsedData = json.slice(1).map(row => {
                const obj = {};
                headers.forEach((h, i) => { obj[h] = String(row[i] || '').trim(); });
                return obj;
            }).filter(row => Object.values(row).some(v => v !== ''));

            console.log(`Arquivo lido: ${parsedData.length} linhas, colunas: ${headers.join(', ')}`);
        } catch (err) {
            alert('Erro ao ler o arquivo. Verifique se é um CSV, TXT ou Excel válido.');
            console.error(err);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ============================================
// DETECÇÃO AUTOMÁTICA DE COLUNAS
// ============================================
// Dicionário de palavras-chave por campo
const COLUMN_KEYWORDS = {
    name: ['descricao', 'descrição', 'produto', 'nome', 'name', 'desc', 'item', 'mercadoria', 'descr'],
    price: ['preco_venda', 'preçovenda', 'preco', 'preço', 'vlr_venda', 'valor_venda', 'valor', 'price',
            'vl_venda', 'venda', 'pvenda', 'pr_venda', 'prco_venda', 'preco venda'],
    barcode: ['ean', 'cod_barras', 'codigo_barras', 'codigobarras', 'barcode', 'gtin', 'ean13',
              'cod barras', 'cód. barras', 'codigo de barras', 'cod. barras'],
    unit: ['unidade', 'un', 'unit', 'medida', 'und', 'unid'],
    brand: ['marca', 'fabricante', 'brand', 'fornecedor', 'fab'],
    category: ['categoria', 'secao', 'seção', 'departamento', 'grupo', 'familia', 'família', 'category', 'dept']
};

function detectColumn(columns, field) {
    const keywords = COLUMN_KEYWORDS[field];
    const colsLower = columns.map(c => c.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Busca match exato primeiro
    for (let i = 0; i < colsLower.length; i++) {
        if (keywords.some(k => colsLower[i] === k.replace(/[^a-z0-9]/g, ''))) {
            return columns[i];
        }
    }

    // Busca match por "contém"
    for (let i = 0; i < colsLower.length; i++) {
        if (keywords.some(k => colsLower[i].includes(k.replace(/[^a-z0-9]/g, '')))) {
            return columns[i];
        }
    }

    return '';
}

function populateColumnSelects() {
    const selects = ['mapName', 'mapPrice', 'mapBarcode', 'mapUnit', 'mapBrand', 'mapCategory'];
    const fields = ['name', 'price', 'barcode', 'unit', 'brand', 'category'];

    selects.forEach((id, i) => {
        const select = document.getElementById(id);
        const currentVal = select.value;
        // Mantém a opção vazia inicial
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption.cloneNode(true));

        fileColumns.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            select.appendChild(opt);
        });

        // Tenta detectar automaticamente
        const detected = detectColumn(fileColumns, fields[i]);
        if (detected) {
            select.value = detected;
            // Marca visualmente que foi auto-detectado
            select.style.borderColor = '#4f46e5';
        }
    });
}

function buildPreviewTable() {
    const table = document.getElementById('previewTable');
    const previewRows = parsedData.slice(0, 5);

    let html = '<thead><tr>';
    fileColumns.forEach(col => {
        html += `<th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 bg-gray-50 border border-gray-200 whitespace-nowrap">${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    previewRows.forEach(row => {
        html += '<tr>';
        fileColumns.forEach(col => {
            const val = row[col] || '';
            html += `<td class="px-3 py-2 text-sm text-slate-700 border border-gray-200 whitespace-nowrap max-w-xs truncate" title="${val}">${val}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;
}

// ============================================
// NAVEGAÇÃO ENTRE STEPS
// ============================================
function goToStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${n}`).classList.add('active');
}

async function goToStep2() {
    const marketId = document.getElementById('marketSelect').value;
    if (!marketId) { alert('Selecione um mercado'); return; }
    if (!uploadedFile || parsedData.length === 0) { alert('Selecione e aguarde o carregamento do arquivo'); return; }

    // Tenta carregar mapeamento salvo para este mercado
    await loadSavedMapping(marketId);

    populateColumnSelects();
    buildPreviewTable();
    goToStep(2);
}

function goToStep3() {
    const nameCol = document.getElementById('mapName').value;
    const priceCol = document.getElementById('mapPrice').value;

    if (!nameCol) { alert('Selecione a coluna de Nome do Produto'); return; }
    if (!priceCol) { alert('Selecione a coluna de Preço'); return; }

    // Valida e conta linhas
    const barcodeCol = document.getElementById('mapBarcode').value;
    let valid = 0, skipped = 0;

    parsedData.forEach(row => {
        const name = row[nameCol];
        const price = parseFloat(String(row[priceCol]).replace(',', '.'));
        if (name && !isNaN(price) && price > 0) { valid++; }
        else { skipped++; }
    });

    document.getElementById('totalRows').textContent = parsedData.length;
    document.getElementById('validRows').textContent = valid;
    document.getElementById('skippedRows').textContent = skipped;

    // Preview dos dados mapeados
    const preview = parsedData.slice(0, 10);
    let html = `<table class="text-sm w-full">
        <thead><tr class="bg-gray-50">
            ${barcodeCol ? '<th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 border border-gray-200">EAN</th>' : ''}
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 border border-gray-200">Produto</th>
            <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 border border-gray-200">Preço</th>
        </tr></thead><tbody>`;

    preview.forEach(row => {
        const name = row[nameCol] || '';
        const price = parseFloat(String(row[priceCol] || '0').replace(',', '.'));
        const barcode = barcodeCol ? (row[barcodeCol] || '') : '';
        const valid = name && !isNaN(price) && price > 0;

        html += `<tr class="${valid ? '' : 'bg-red-50'}">
            ${barcodeCol ? `<td class="px-3 py-2 border border-gray-200 text-slate-600">${barcode}</td>` : ''}
            <td class="px-3 py-2 border border-gray-200">${name || '<span class="text-red-400">vazio</span>'}</td>
            <td class="px-3 py-2 border border-gray-200 font-medium ${valid ? 'text-green-700' : 'text-red-400'}">
                ${!isNaN(price) && price > 0 ? `R$ ${price.toFixed(2)}` : 'inválido'}
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    if (parsedData.length > 10) {
        html += `<p class="text-sm text-slate-400 mt-2 text-center">... e mais ${parsedData.length - 10} linhas</p>`;
    }

    document.getElementById('step3Preview').innerHTML = html;
    goToStep(3);
}

// ============================================
// MAPEAMENTO SALVO POR MERCADO (localStorage)
// ============================================
function getMappingKey(marketId) { return `col_mapping_${marketId}`; }

async function loadSavedMapping(marketId) {
    const saved = localStorage.getItem(getMappingKey(marketId));
    if (saved) {
        const mapping = JSON.parse(saved);
        // Aplica depois que os selects forem populados
        window._pendingMapping = mapping;
    }
}

function applySavedMapping() {
    if (!window._pendingMapping) return;
    const m = window._pendingMapping;
    ['Name', 'Price', 'Barcode', 'Unit', 'Brand', 'Category'].forEach(field => {
        const key = `map${field}`;
        const val = m[key.replace('map', '').toLowerCase()];
        if (val) {
            const select = document.getElementById(key);
            if ([...select.options].some(o => o.value === val)) {
                select.value = val;
            }
        }
    });
    window._pendingMapping = null;
}

function saveMapping(marketId) {
    const mapping = {
        name: document.getElementById('mapName').value,
        price: document.getElementById('mapPrice').value,
        barcode: document.getElementById('mapBarcode').value,
        unit: document.getElementById('mapUnit').value,
        brand: document.getElementById('mapBrand').value,
        category: document.getElementById('mapCategory').value
    };
    localStorage.setItem(getMappingKey(marketId), JSON.stringify(mapping));
}

// ============================================
// IMPORTAÇÃO PRINCIPAL
// ============================================
async function runImport() {
    const marketId = document.getElementById('marketSelect').value;
    const nameCol = document.getElementById('mapName').value;
    const priceCol = document.getElementById('mapPrice').value;
    const barcodeCol = document.getElementById('mapBarcode').value;
    const unitCol = document.getElementById('mapUnit').value;
    const brandCol = document.getElementById('mapBrand').value;
    const categoryCol = document.getElementById('mapCategory').value;

    // Salva mapeamento pra próxima vez
    saveMapping(marketId);

    document.getElementById('importActions').classList.add('hidden');
    document.getElementById('progressSection').classList.remove('hidden');

    const validRows = parsedData.filter(row => {
        const name = row[nameCol];
        const price = parseFloat(String(row[priceCol] || '').replace(',', '.'));
        return name && !isNaN(price) && price > 0;
    });

    // Carrega catálogo atual de produtos do banco (indexado por EAN e por nome)
    updateProgress(5, 'Carregando catálogo de produtos...');
    const { data: existingProducts } = await supabaseClient
        .from('products')
        .select('id, name, barcode, brand, unit, category');

    const byBarcode = {};
    const byName = {};
    (existingProducts || []).forEach(p => {
        if (p.barcode) byBarcode[p.barcode] = p;
        byName[normalizeText(p.name)] = p;
    });

    let updated = 0, created = 0, review = 0, errors = 0;
    const reviewItems = [];

    const total = validRows.length;

    for (let i = 0; i < total; i++) {
        const row = validRows[i];
        const name = row[nameCol].trim();
        const price = parseFloat(String(row[priceCol]).replace(',', '.'));
        const barcode = barcodeCol ? cleanBarcode(row[barcodeCol]) : null;
        const unit = unitCol ? row[unitCol] : null;
        const brand = brandCol ? row[brandCol] : null;
        const category = categoryCol ? row[categoryCol] : null;

        updateProgress(
            5 + Math.round((i / total) * 90),
            `Processando ${i + 1} de ${total}: ${name.substring(0, 40)}...`
        );

        try {
            let productId = null;
            let matchType = null;

            // === CAMADA 1: Match por código de barras (EAN) ===
            if (barcode && byBarcode[barcode]) {
                productId = byBarcode[barcode].id;
                matchType = 'barcode';
            }

            // === CAMADA 2: Match por nome normalizado (exato) ===
            if (!productId) {
                const normName = normalizeText(name);
                if (byName[normName]) {
                    productId = byName[normName].id;
                    matchType = 'name_exact';
                }
            }

            // === CAMADA 3: Match por similaridade de texto ===
            if (!productId) {
                const normName = normalizeText(name);
                const similar = findSimilar(normName, Object.keys(byName));

                if (similar.score >= 0.85) {
                    // Alta confiança — faz o match
                    productId = byName[similar.key].id;
                    matchType = 'name_similar_high';
                } else if (similar.score >= 0.60) {
                    // Baixa confiança — vai pra fila de revisão
                    review++;
                    await saveToReviewQueue({
                        marketId, name, price, barcode,
                        suggestedProductId: byName[similar.key]?.id,
                        suggestedProductName: byName[similar.key] ? similar.key : null,
                        similarityScore: similar.score
                    });
                    continue;
                }
                // Abaixo de 0.60 = produto novo
            }

            // === Produto não encontrado: cria novo no catálogo ===
            if (!productId) {
                const { data: newProduct, error: insertError } = await supabaseClient
                    .from('products')
                    .insert({
                        name: capitalizeProduct(name),
                        barcode: barcode || null,
                        brand: brand ? capitalizeProduct(brand) : null,
                        unit: unit || null,
                        category: category || null
                    })
                    .select('id')
                    .single();

                if (insertError) { errors++; continue; }

                productId = newProduct.id;
                // Adiciona ao índice local pra não criar duplicata na mesma importação
                if (barcode) byBarcode[barcode] = { id: productId };
                byName[normalizeText(name)] = { id: productId };
                created++;
            }

            // === Atualiza ou insere o preço (upsert) ===
            const { error: upsertError } = await supabaseClient
                .from('market_products')
                .upsert({
                    market_id: marketId,
                    product_id: productId,
                    price: price,
                    in_stock: true,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'market_id,product_id' });

            if (upsertError) { errors++; continue; }

            // === Grava no histórico de preços ===
            await supabaseClient
                .from('price_history')
                .insert({
                    market_id: marketId,
                    product_id: productId,
                    price: price
                });

            if (matchType) updated++;

        } catch (err) {
            console.error('Erro processando linha:', name, err);
            errors++;
        }
    }

    // Salva registro da importação no histórico
    await supabaseClient.from('import_logs').insert({
        market_id: marketId,
        file_name: uploadedFile.name,
        total_rows: total,
        updated_prices: updated,
        new_products: created,
        review_queue: review,
        errors: errors
    }).catch(() => {}); // import_logs ainda não existe — silencia o erro, criamos na próxima etapa de SQL

    updateProgress(100, 'Concluído!');

    setTimeout(() => {
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('resultSection').classList.remove('hidden');
        document.getElementById('resUpdated').textContent = updated;
        document.getElementById('resNew').textContent = created;
        document.getElementById('resReview').textContent = review;
        document.getElementById('resErrors').textContent = errors;

        if (review > 0) loadReviewQueue();
    }, 500);
}

function updateProgress(percent, text) {
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = text;
}

// ============================================
// UTILITÁRIOS DE TEXTO E MATCH
// ============================================
function normalizeText(text) {
    return String(text)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-z0-9\s]/g, '')                      // remove especiais
        .replace(/\s+/g, ' ')
        .trim();
}

function capitalizeProduct(text) {
    return String(text).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function cleanBarcode(raw) {
    if (!raw) return null;
    const cleaned = String(raw).replace(/\D/g, '');
    // EANs válidos: 8, 12, 13 ou 14 dígitos. Códigos internos começam com 2 — ignora.
    if (cleaned.length < 8 || cleaned.length > 14) return null;
    if (cleaned.startsWith('2')) return null; // código interno do ERP
    return cleaned;
}

// Similaridade de Dice (bigramas) — simples e eficaz para nomes de produtos
function diceCoefficient(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const getBigrams = s => {
        const bigrams = new Set();
        for (let i = 0; i < s.length - 1; i++) bigrams.add(s.substring(i, i + 2));
        return bigrams;
    };

    const aB = getBigrams(a);
    const bB = getBigrams(b);
    let intersection = 0;
    aB.forEach(bg => { if (bB.has(bg)) intersection++; });

    return (2 * intersection) / (aB.size + bB.size);
}

function findSimilar(normName, candidates) {
    let bestScore = 0;
    let bestKey = null;

    candidates.forEach(candidate => {
        const score = diceCoefficient(normName, candidate);
        if (score > bestScore) {
            bestScore = score;
            bestKey = candidate;
        }
    });

    return { key: bestKey, score: bestScore };
}

// ============================================
// FILA DE REVISÃO
// ============================================
async function saveToReviewQueue({ marketId, name, price, barcode, suggestedProductId, suggestedProductName, similarityScore }) {
    // Salva em localStorage por enquanto (tabela review_queue será criada no SQL update)
    const queue = JSON.parse(localStorage.getItem('review_queue') || '[]');
    queue.push({
        id: Date.now(),
        marketId, name, price, barcode,
        suggestedProductId, suggestedProductName,
        similarityScore: Math.round(similarityScore * 100),
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('review_queue', JSON.stringify(queue));
}

async function loadReviewQueue() {
    const queue = JSON.parse(localStorage.getItem('review_queue') || '[]');
    const badge = document.getElementById('reviewBadge');

    if (queue.length > 0) {
        badge.textContent = queue.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    const list = document.getElementById('reviewList');
    if (!list) return;

    if (queue.length === 0) {
        list.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-slate-400">✅ Nenhum item pendente de revisão</div>';
        return;
    }

    list.innerHTML = queue.map(item => `
        <div class="bg-white rounded-xl shadow-sm p-6" id="review-${item.id}">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <p class="text-xs text-slate-400 mb-1">Arquivo do mercado</p>
                    <p class="font-semibold text-slate-800">${item.name}</p>
                    ${item.barcode ? `<p class="text-xs text-slate-400 mt-1">EAN: ${item.barcode}</p>` : ''}
                    <p class="text-green-600 font-medium mt-1">R$ ${Number(item.price).toFixed(2)}</p>
                </div>
                <span class="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">
                    ${item.similarityScore}% similar
                </span>
            </div>

            ${item.suggestedProductName ? `
            <div class="bg-blue-50 rounded-lg p-3 mb-4">
                <p class="text-xs text-blue-600 font-medium mb-1">Produto mais similar no catálogo:</p>
                <p class="text-slate-700">${item.suggestedProductName}</p>
            </div>
            <p class="text-sm text-slate-600 mb-4">Este produto do arquivo é o mesmo que o produto acima?</p>
            <div class="flex gap-3">
                <button onclick="resolveReview(${item.id}, 'same', '${item.suggestedProductId}')"
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm">
                    ✅ Sim, é o mesmo
                </button>
                <button onclick="resolveReview(${item.id}, 'new', null)"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm">
                    ➕ Não, é produto novo
                </button>
                <button onclick="resolveReview(${item.id}, 'skip', null)"
                        class="px-4 bg-gray-100 hover:bg-gray-200 text-slate-600 py-2 rounded-lg font-medium text-sm">
                    Ignorar
                </button>
            </div>
            ` : `
            <p class="text-sm text-slate-600 mb-4">Não encontrei nenhum produto similar no catálogo.</p>
            <div class="flex gap-3">
                <button onclick="resolveReview(${item.id}, 'new', null)"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm">
                    ➕ Cadastrar como produto novo
                </button>
                <button onclick="resolveReview(${item.id}, 'skip', null)"
                        class="px-4 bg-gray-100 hover:bg-gray-200 text-slate-600 py-2 rounded-lg font-medium text-sm">
                    Ignorar
                </button>
            </div>
            `}
        </div>
    `).join('');
}

async function resolveReview(itemId, action, productId) {
    let queue = JSON.parse(localStorage.getItem('review_queue') || '[]');
    const item = queue.find(i => i.id === itemId);
    if (!item) return;

    if (action === 'same' && productId) {
        // Usa o produto sugerido e registra o preço
        await supabaseClient.from('market_products').upsert({
            market_id: item.marketId,
            product_id: productId,
            price: item.price,
            in_stock: true,
            last_updated: new Date().toISOString()
        }, { onConflict: 'market_id,product_id' });

        await supabaseClient.from('price_history').insert({
            market_id: item.marketId,
            product_id: productId,
            price: item.price
        });
    } else if (action === 'new') {
        // Cria produto novo no catálogo
        const { data: newProduct } = await supabaseClient
            .from('products')
            .insert({ name: capitalizeProduct(item.name), barcode: item.barcode || null })
            .select('id')
            .single();

        if (newProduct) {
            await supabaseClient.from('market_products').upsert({
                market_id: item.marketId,
                product_id: newProduct.id,
                price: item.price,
                in_stock: true,
                last_updated: new Date().toISOString()
            }, { onConflict: 'market_id,product_id' });
        }
    }

    // Remove da fila
    queue = queue.filter(i => i.id !== itemId);
    localStorage.setItem('review_queue', JSON.stringify(queue));

    document.getElementById(`review-${itemId}`)?.remove();
    loadReviewQueue();
}

// ============================================
// HISTÓRICO DE IMPORTAÇÕES
// ============================================
async function loadHistory() {
    // Por enquanto usa localStorage — tabela import_logs será adicionada no SQL update
    const list = document.getElementById('historyList');
    const logs = JSON.parse(localStorage.getItem('import_logs_local') || '[]').reverse();

    if (logs.length === 0) {
        list.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-slate-400">Nenhuma importação realizada ainda</div>';
        return;
    }

    list.innerHTML = logs.map(log => `
        <div class="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
            <div>
                <p class="font-semibold text-slate-800">${log.marketName}</p>
                <p class="text-sm text-slate-500">${log.fileName} • ${new Date(log.date).toLocaleString('pt-BR')}</p>
            </div>
            <div class="flex gap-4 text-center text-sm">
                <div><p class="font-bold text-green-600">${log.updated}</p><p class="text-slate-400">atualizados</p></div>
                <div><p class="font-bold text-blue-600">${log.created}</p><p class="text-slate-400">novos</p></div>
                <div><p class="font-bold text-yellow-600">${log.review}</p><p class="text-slate-400">revisão</p></div>
            </div>
        </div>
    `).join('');
}

// ============================================
// RESET
// ============================================
function resetImport() {
    clearFile();
    document.getElementById('marketSelect').value = '';
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('importActions').classList.remove('hidden');
    goToStep(1);
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se já tem sessão ativa
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await supabaseClient
            .from('profiles').select('plan').eq('id', session.user.id).single();

        if (profile && profile.plan === 'admin') {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
            await loadMarkets();
            showTab('import');
            loadReviewQueue();
        }
    }
});
