// ============================================================
// GEOCODIFICAÇÃO DOS MERCADOS — rode no console do navegador
// Acesse: compraclaude.vercel.app/admin/ → F12 → Console → cole e Enter
// Leva ~2 minutos (1 requisição por segundo, limite do Nominatim)
// ============================================================

(async function geocodeMarkets() {
    console.log('🗺️ Iniciando geocodificação dos mercados...');

    // Busca todos os mercados sem coordenadas
    const { data: markets, error } = await supabaseClient
        .from('markets')
        .select('id, name, address, neighborhood')
        .is('latitude', null);

    if (error || !markets) {
        console.error('Erro ao buscar mercados:', error);
        return;
    }

    console.log(`📍 ${markets.length} mercados para geocodificar`);

    let success = 0, failed = 0;

    for (const market of markets) {
        const query = `${market.address}, ${market.neighborhood}, Juiz de Fora, MG, Brasil`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;

        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'CompraClaudeJF/1.0 (juizdefora@compraclaude.com.br)' }
            });
            const data = await res.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                const { error: updateError } = await supabaseClient
                    .from('markets')
                    .update({ latitude: lat, longitude: lon })
                    .eq('id', market.id);

                if (!updateError) {
                    success++;
                    console.log(`✅ ${market.name}: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                } else {
                    failed++;
                    console.warn(`⚠️ ${market.name}: geocodificado mas erro ao salvar:`, updateError.message);
                }
            } else {
                failed++;
                console.warn(`❌ ${market.name}: não encontrado no mapa`);
            }
        } catch (err) {
            failed++;
            console.warn(`❌ ${market.name}: erro de rede:`, err.message);
        }

        // Aguarda 1.2 segundos entre requisições (limite do Nominatim)
        await new Promise(r => setTimeout(r, 1200));
    }

    console.log(`\n✅ Geocodificação concluída!`);
    console.log(`   Sucesso: ${success} mercados`);
    console.log(`   Falhou: ${failed} mercados`);
    console.log(`\nRecarregue a página para ver os marcadores no mapa de rota.`);
})();
