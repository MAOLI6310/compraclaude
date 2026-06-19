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

---

# Etapa 2: Banco de Dados Real (Supabase)

## O que foi feito

- `database/01_schema.sql` — cria todas as tabelas do banco (mercados,
  produtos, preços, histórico de preços, perfis de usuário, alertas,
  carrinho, solicitações de parceria, mensagens de contato) com as
  regras de segurança (RLS) já configuradas.
- `database/02_seed_exemplo.sql` — alguns mercados e produtos de
  exemplo, só para você testar a conexão antes de importar dados reais.
- `js/supabase-config.js` — arquivo de conexão do site com o banco.

**Importante:** nesta etapa o site ainda **não está usando** o banco de
dados de verdade — ele continua mostrando os dados simulados de antes.
Só preparamos o banco e a conexão. A troca de fato (login real, busca
real) acontece nas Etapas 3 e 4.

## Como aplicar

### 1. Rodar os scripts SQL
No painel do Supabase, vá em **SQL Editor → New Query**, e rode **nesta ordem** (um de cada vez, clicando em Run):

1. `database/01_schema.sql` — cria as tabelas
2. `database/02_mercados_reais.sql` — cadastra os 77 mercados reais de Juiz de Fora (lista fornecida por você; "Bretas" foi atualizado para "Supermercados BH", conforme a aquisição)
3. `database/03_produtos_catalogo.sql` — cadastra 71 produtos reais em 8 categorias (Cereais e Grãos, Mercearia, Laticínios, Bebidas, Carnes e Aves, Hortifruti, Padaria, Higiene e Limpeza)

Depois de rodar os três, vá em **Table Editor** no menu lateral — você deve ver `markets` com 77 linhas e `products` com 71 linhas.

**Observação importante:** a tabela `market_products` (que cruza mercado + produto + preço) fica **vazia** por enquanto, de propósito — os preços reais só vão entrar quando os mercados começarem a mandar os arquivos (Etapa 5). Não criei preços fictícios desta vez, já que você pediu pra fazer com dado real desde o início.

**Sobre coordenadas (lat/long):** os mercados foram cadastrados só com endereço em texto. Vou geocodificar (converter endereço em coordenada) quando chegarmos na Etapa 6 (otimização de rota), em lote, pra não gastar isso à toa agora.

**Sobre código de barras dos produtos:** deixei em branco por enquanto — vai ser preenchido automaticamente quando os arquivos reais dos mercados (que trazem o código de barras de cada item) começarem a ser importados.

### 2. Pegar suas chaves de conexão
No painel do Supabase: **Project Settings (ícone de engrenagem) → API**

Você vai precisar de dois valores:
- **Project URL** (algo como `https://xxxxx.supabase.co`)
- **anon public** key (uma chave longa)

### 3. Colar as chaves no projeto
Abra o arquivo `js/supabase-config.js` e substitua:

```js
const SUPABASE_URL = "COLE_AQUI_A_SUA_PROJECT_URL";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_SUA_ANON_KEY";
```

pelos valores que você copiou.

### 4. Subir as alterações para o GitHub
Suba os arquivos novos/alterados (`database/`, `js/supabase-config.js`,
`index.html`) do mesmo jeito que fez antes (Add file → Upload files).

⚠️ Enquanto as chaves não forem coladas, é normal aparecer um erro no
console do navegador (F12) sobre "Invalid URL" — isso não quebra o
site, só significa que a conexão real ainda não foi configurada.

## Próxima etapa

**Etapa 3:** Trocar o sistema de login/cadastro simulado pela
autenticação real do Supabase.

