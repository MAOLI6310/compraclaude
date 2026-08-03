// api/create-payment.js — Vercel Function
// Cria pagamento (Pix ou Cartão) via Mercado Pago

const MP_ACCESS_TOKEN = "APP_USR-8978701768480802-080315-31acd96b3f2229586509345c7e9f7831-3589098896";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { method, planKey, amount, email, userId, token,
            installments, cardholderName, identificationType, identificationNumber } = req.body;

    if (!method || !planKey || !amount || !email || !userId) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }

    try {
        let body = {
            transaction_amount: Number(amount),
            description: `CompraClaude — Plano ${planKey}`,
            payer: { email }
        };

        if (method === 'pix') {
            body.payment_method_id = 'pix';
        } else if (method === 'card') {
            if (!token) return res.status(400).json({ error: 'Token do cartão não informado' });
            body.token = token;
            body.installments = installments || 1;
            body.payment_method_id = 'credit_card';
            body.payer = {
                email,
                identification: { type: identificationType, number: identificationNumber }
            };
        } else {
            return res.status(400).json({ error: 'Método de pagamento inválido' });
        }

        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': `${userId}-${planKey}-${Date.now()}`
            },
            body: JSON.stringify(body)
        });

        const payment = await mpRes.json();

        if (!mpRes.ok) {
            console.error('Erro Mercado Pago:', payment);
            return res.status(400).json({ error: payment.message || 'Erro ao criar pagamento' });
        }

        if (method === 'pix') {
            return res.status(200).json({
                payment_id: payment.id,
                status: payment.status,
                qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
                qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64
            });
        } else {
            return res.status(200).json({
                payment_id: payment.id,
                status: payment.status
            });
        }

    } catch (err) {
        console.error('Erro interno:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
