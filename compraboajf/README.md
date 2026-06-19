# Compra Boa JF — Etapa 1: Reorganização do Projeto

## O que foi feito nesta etapa

O arquivo único `index.html` (que tinha ~4.800 linhas, com HTML, CSS e JS
tudo misturado) foi separado em uma estrutura de pastas. **O visual e o
comportamento continuam exatamente os mesmos** — nada de lógica foi
alterado, só reorganizado. É a mesma "demo" de antes, só que arrumada.

## Estrutura de pastas

```
compraboajf/
├── index.html              # Estrutura HTML da página (sem estilos/scripts inline)
├── css/
│   └── styles.css          # Todo o CSS customizado (Tailwind continua via CDN)
├── js/
│   ├── demo-backend.js     # Simulação de Firebase/EmailJS (TEMPORÁRIO — vira Supabase na Etapa 2/3)
│   ├── app-state.js        # Variáveis globais (usuário atual, carrinho, etc.)
│   ├── utils.js             # Formatação de CPF, cartão, validações
│   ├── notifications.js     # Sistema de notificações (toasts)
│   ├── navigation.js        # Troca de páginas, menu mobile, modais
│   ├── auth.js               # Login, cadastro, logout, sessão
│   ├── search.js             # Busca e comparação de produtos
│   ├── cart.js               # Carrinho de compras
│   ├── route.js              # Otimização de rota de compras
│   ├── subscription.js       # Planos e fluxo de pagamento (UI)
│   ├── price-alerts.js       # Histórico de preços e alertas
│   ├── forms.js               # Seleção de plano/pagamento nos formulários
│   ├── map-animation.js       # Animação decorativa do mapa
│   └── account.js             # Página "Minha Conta"
└── api/                        # (vazio por enquanto — Etapa 5: receberá os
                                  uploads/processamento dos CSVs dos mercados)
```

## Por que separar assim?

Cada arquivo JS tem **uma responsabilidade só**. Isso significa que, quando
formos trocar o login fake por um login de verdade (Etapa 3), só vamos
mexer em `auth.js` — sem risco de quebrar o carrinho ou a busca, por
exemplo.

## O que ainda é "fake" (será resolvido nas próximas etapas)

- `js/demo-backend.js` simula Firebase usando `localStorage` do navegador.
  Isso será substituído por um banco de dados real (Supabase) — Etapa 2/3.
- `js/search.js` usa produtos gerados aleatoriamente
  (`generateSampleProducts`). Vai puxar do banco real — Etapa 4.
- Existe um login automático de teste (`testLogin()`, em `js/init.js`) que
  loga um usuário fake assim que a página carrega. Isso será removido
  quando a autenticação real entrar.

## Como testar

Como não há nenhum processo de build (sem npm, sem compilação), você pode
simplesmente subir essa pasta inteira para o GitHub e conectar ao Vercel
do jeito que já faz hoje — o `index.html` vai carregar os arquivos CSS e
JS automaticamente pelos caminhos relativos (`css/styles.css`,
`js/auth.js`, etc.).

Se quiser testar localmente antes de subir, dá pra simplesmente abrir o
`index.html` no navegador.

## Próxima etapa

**Etapa 2:** Criar o banco de dados real no Supabase (produtos,
supermercados, preços, usuários).
