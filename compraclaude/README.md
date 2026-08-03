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

---

# Etapa 3: Login e Cadastro Reais (Supabase Auth)

## O que foi feito

- `js/auth.js` — reescrito do zero. Login, cadastro e logout agora
  usam `supabaseClient.auth` de verdade, e os dados do usuário (nome,
  CPF, plano, etc.) são lidos/gravados na tabela `profiles` do banco.
- `js/subscription.js` — corrigido para gravar o plano escolhido
  direto na tabela `profiles` (antes chamava um banco fake que não
  existe mais).
- `js/account.js` — a função "Salvar Alterações" do perfil agora
  grava de verdade no banco.
- `js/init.js` — removido o login automático de teste
  (`testLogin()`) que logava um usuário fake ao carregar a página.
  Agora quem entra logado é só quem realmente tem uma sessão válida.
- `js/demo-backend.js` — esvaziado (não é mais carregado pelo
  `index.html`). Mantido só como referência histórica.
- `js/app-state.js` — adicionado `PLAN_INFO`, um "dicionário" com os
  planos disponíveis (`basico` e `premium`) e seus preços, usado em
  vários lugares pra manter tudo consistente com o banco.

## ⚠️ Passo obrigatório antes de testar: configurar confirmação de e-mail

Por padrão, o Supabase exige que o usuário **confirme o e-mail** antes
de poder logar (ele recebe um link por e-mail). Isso é ótimo para
produção, mas atrapalha os testes agora, porque sem confirmar o
e-mail a conta fica "pendente" e alguns dados do cadastro (CPF,
plano) não terminam de ser salvos.

**Para testar mais facilmente agora, desative essa exigência temporariamente:**

1. No painel do Supabase, vá em **Authentication**
2. Procure por **"Providers"** (ou "Sign In / Providers") → **Email**
3. Desative a opção **"Confirm email"**
4. Salve

(Você pode reativar isso mais pra frente, quando o site estiver perto
de ir ao ar de verdade — é só uma questão de segurança extra, não
afeta o funcionamento básico.)

## Como testar

1. Suba os arquivos alterados para o GitHub: `index.html`,
   `js/auth.js`, `js/subscription.js`, `js/account.js`, `js/init.js`,
   `js/demo-backend.js`, `js/app-state.js`
2. Espera o Vercel atualizar o site
3. Abre o site — agora ele deve abrir **deslogado** (sem o "João
   Silva" automático de antes)
4. Clica em **"Criar Conta"**, preenche os dados e cria uma conta de
   teste
5. Confere no Supabase, em **Table Editor → profiles**, se apareceu
   uma linha nova com seu nome, CPF e plano
6. Testa fazer **logout** e **login** de novo com essa conta

## O que ainda não está pronto

- O **carrinho** ainda não é salvo no banco (continua sumindo se você
  recarregar a página) — isso entra na Etapa 6
- O **e-mail de boas-vindas** é só simulado (aparece no console do
  navegador, não chega de verdade na caixa de entrada) — sem provedor
  de e-mail configurado ainda
- O **pagamento** continua sendo uma simulação visual (a "aprovação"
  é só uma animação) — pagamento de verdade é a Etapa 7

## Próxima etapa

**Etapa 4:** Conectar a busca e comparação de produtos ao banco de
dados real (hoje ainda mostra produtos inventados aleatoriamente).


