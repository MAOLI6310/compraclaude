// api/check-payment.js — Vercel Function
// Verifica o status de um pagamento (usado pelo polling do Pix)

const MP_ACCESS_TOKEN = "APP_USR-8978701768480802-080315-31acd96b3f2229586509345c7e9f7831-3589098896";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID do pagamento não informado' });

    try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
        });

        const payment = await mpRes.json();

        if (!mpRes.ok) {
            return res.status(400).json({ error: 'Pagamento não encontrado' });
        }

        return res.status(200).json({ status: payment.status });

    } catch (err) {
        console.error('Erro ao verificar pagamento:', err);
        return res.status(500).json({ error: 'Erro interno' });
    }
}
