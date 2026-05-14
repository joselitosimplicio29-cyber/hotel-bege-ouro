# Prompt para o Antigravity — Migrar Hotel Bege Ouro do localStorage para Supabase

> Copie todo o conteúdo abaixo (entre as duas linhas com `==========`) e cole no chat do Antigravity, dentro deste mesmo projeto aberto.
> O Antigravity vai trabalhar sozinho em várias etapas e pedir sua confirmação nos momentos certos (criar conta no Supabase, fornecer as chaves, etc).

========== INÍCIO DO PROMPT ==========

# Tarefa: Migrar Hotel Bege Ouro de localStorage para Supabase

## Contexto do projeto

Este é um sistema completo de gerenciamento do **Hotel Bege Ouro**, composto por:

1. **Site público estático** — `index.html`, `sobre.html`, `quartos.html`, `galeria.html`, `contato.html`, `reservar.html`
2. **Dashboard administrativa** — `admin/login.html` e `admin/dashboard.html` com 9 módulos (mapa de quartos, reservas, check-in/out, consumo, clientes, pagamentos, relatórios, etc).

Hoje, **todos os dados** (quartos, clientes, reservas, pagamentos, consumo, usuários) vivem em `localStorage` no navegador, através de uma camada de dados centralizada em `js/db.js`. Isso impede uso multi-usuário, sincronização entre dispositivos, e causa perda de dados se o cache for limpo.

## Objetivo

Migrar a persistência de `localStorage` para **Supabase** (PostgreSQL gerenciado na nuvem), mantendo a API pública da camada `DB` em `js/db.js` o mais próxima possível da atual, para que **outros arquivos do projeto precisem do mínimo de alteração** (só converter chamadas síncronas em `await` quando necessário).

## Stack alvo

- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Cliente JS**: `@supabase/supabase-js` v2 via CDN (sem npm/build step, mantém o projeto como site estático puro)
- **Autenticação**: Supabase Auth (email/senha) substituindo o login atual em texto plano

## Esquema do banco (7 tabelas)

Crie no Supabase as tabelas abaixo com PostgreSQL:

```sql
-- ==========================================================
-- USUÁRIOS DO SISTEMA (recepção, admin, financeiro)
-- A autenticação usa Supabase Auth; esta tabela guarda metadata extra.
-- ==========================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  perfil text NOT NULL CHECK (perfil IN ('admin', 'funcionario', 'financeiro')),
  created_at timestamptz DEFAULT now()
);

-- ==========================================================
-- QUARTOS
-- ==========================================================
CREATE TABLE rooms (
  id text PRIMARY KEY,
  numero text NOT NULL,
  tipo text NOT NULL,
  capacidade int NOT NULL,
  preco numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel','reservado','ocupado','limpeza','manutencao')),
  descricao text,
  amenities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================================
-- CLIENTES (HÓSPEDES)
-- ==========================================================
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text UNIQUE,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_clients_cpf   ON clients(cpf);
CREATE INDEX idx_clients_email ON clients(email);

-- ==========================================================
-- RESERVAS
-- ==========================================================
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  cliente_id uuid REFERENCES clients(id) ON DELETE RESTRICT,
  quarto_id text REFERENCES rooms(id)    ON DELETE RESTRICT,
  entrada date NOT NULL,
  saida   date NOT NULL,
  diarias int NOT NULL,
  hospedes int NOT NULL DEFAULT 1,
  valor_diaria  numeric(10,2) NOT NULL,
  valor_total   numeric(10,2) NOT NULL,
  valor_pago    numeric(10,2) NOT NULL DEFAULT 0,
  valor_restante numeric(10,2) NOT NULL DEFAULT 0,
  forma_pagamento  text,
  status_pagamento text NOT NULL DEFAULT 'pendente'
    CHECK (status_pagamento IN ('pendente','parcial','pago')),
  status_reserva   text NOT NULL DEFAULT 'pendente'
    CHECK (status_reserva IN ('pendente','confirmada','em_hospedagem','finalizada','cancelada')),
  origem text NOT NULL DEFAULT 'manual'
    CHECK (origem IN ('online','manual')),
  observacoes text,
  check_in_at  timestamptz,
  check_out_at timestamptz,
  criada_em    timestamptz DEFAULT now()
);

CREATE INDEX idx_reservations_quarto_periodo ON reservations(quarto_id, entrada, saida);
CREATE INDEX idx_reservations_status         ON reservations(status_reserva);
CREATE INDEX idx_reservations_cliente        ON reservations(cliente_id);

-- ==========================================================
-- PAGAMENTOS
-- ==========================================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  valor numeric(10,2) NOT NULL,
  forma text NOT NULL,
  data  timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_reserva ON payments(reserva_id);
CREATE INDEX idx_payments_data    ON payments(data);

-- ==========================================================
-- CONSUMO DO HÓSPEDE (frigobar, restaurante, spa, etc)
-- ==========================================================
CREATE TABLE consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  produto text NOT NULL,
  qtd int NOT NULL,
  valor_unit  numeric(10,2) NOT NULL,
  valor_total numeric(10,2) NOT NULL,
  funcionario_id uuid REFERENCES profiles(id),
  data_hora timestamptz DEFAULT now()
);

CREATE INDEX idx_consumptions_reserva ON consumptions(reserva_id);

-- ==========================================================
-- LOG DE AUDITORIA (recomendado)
-- ==========================================================
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  user_id   uuid REFERENCES profiles(id),
  action    text NOT NULL,
  entity    text,
  entity_id text,
  details   jsonb,
  created_at timestamptz DEFAULT now()
);
```

## Row Level Security (RLS)

Habilite RLS em todas as tabelas e crie políticas conforme:

- **Usuários autenticados** podem **LER** todas as tabelas operacionais (rooms, clients, reservations, payments, consumptions)
- **Admin** pode INSERT/UPDATE/DELETE em qualquer registro
- **Funcionário** pode INSERT/UPDATE em reservations, clients, consumptions (sem DELETE)
- **Financeiro** apenas READ-ONLY
- **Anônimos** (visitantes do site público) podem INSERT em `clients` (sem duplicar CPF) e em `reservations` (apenas status `pendente` ou `confirmada`, origem `online`) e em `payments` (apenas vinculado a uma reserva recém-criada). Não podem ler dados existentes além das suas próprias inserções.

Exemplo de policy para reserva online anônima:

```sql
CREATE POLICY "Anônimo pode criar reserva online" ON reservations
  FOR INSERT TO anon
  WITH CHECK (origem = 'online' AND status_reserva IN ('pendente','confirmada'));
```

## Tarefas concretas

### 1) Configuração inicial

- Solicite ao usuário (`joselitosimplicio29@gmail.com`) que crie um projeto grátis em https://supabase.com
- Peça as 2 chaves do projeto criado: `SUPABASE_URL` e `SUPABASE_ANON_KEY` (Settings → API)
- Crie um arquivo `js/supabase-config.js` que exporta essas chaves no formato:

  ```js
  window.SUPABASE_CONFIG = {
    url: 'https://xxx.supabase.co',
    anonKey: 'eyJhbG...'
  };
  ```

- **NÃO** comite essas chaves no git: adicione `js/supabase-config.js` ao `.gitignore`
- Crie um arquivo modelo `js/supabase-config.example.js` que será comitado (com placeholders)
- Para deploy na Vercel: documente em um arquivo `DEPLOY_SUPABASE.md` como criar essas variáveis no painel da Vercel (Settings → Environment Variables) e adapte o código para usar essas variáveis em produção e o arquivo local em desenvolvimento

### 2) Schema e migração inicial

- Execute o SQL acima no SQL Editor do Supabase
- Crie todas as policies de RLS conforme especificado
- Habilite **Realtime** nas tabelas `rooms`, `reservations`, `payments` e `consumptions` (Database → Replication)
- Crie uma função de migração (Node.js standalone ou SQL) que importa o objeto `SEED` definido em `js/db.js` (rooms iniciais e dados de teste opcionais) para o Supabase
- Crie os 3 usuários iniciais via Supabase Auth (admin@begeouro.com, maria@begeouro.com, joao@begeouro.com) com senhas iniciais (admin123, maria123, joao123) e insira na tabela `profiles` com os perfis corretos. Lembre o usuário de trocar essas senhas depois do primeiro login

### 3) Reescrever `js/db.js`

- Carregue o cliente Supabase via CDN no início do arquivo:
  ```html
  <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
  ```
- No `js/db.js`, instancie o cliente:
  ```js
  const supabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
  );
  ```
- Reescreva **todos** os métodos de `DB` (rooms, room, saveRoom, clients, client, saveClient, findOrCreateClient, reservations, saveReservation, isRoomAvailable, availableRoomsBetween, checkIn, checkOut, cancelReservation, refreshRoomStatuses, consumptions, addConsumption, removeConsumption, payments, addPayment, login, logout, currentUser, etc.) para usar o cliente Supabase
- Como as funções agora são assíncronas, transforme a API em `async/await`
- Atualize TODOS os call sites em outros arquivos:
  - `index.html`, `sobre.html`, `quartos.html`, `galeria.html`, `contato.html`, `reservar.html`
  - `admin/login.html`, `admin/dashboard.html`
  - `js/admin.js`, `js/site.js`, `js/pdf.js`
  Para usar `await DB.metodo()` onde necessário

### 4) Cache em memória + Realtime

- Mantenha um cache em memória dos dados mais lidos (lista de quartos especialmente) para não chamar o banco a cada renderização
- Assine canais Realtime nas tabelas relevantes para que a dashboard atualize sozinha quando outro usuário criar uma reserva ou fizer check-in:
  ```js
  supabase.channel('rooms-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
      cache.rooms = null; // invalida cache, próxima leitura busca de novo
      App.view_mapa?.(); // re-renderiza o mapa se estiver aberto
    })
    .subscribe();
  ```

### 5) Autenticação

- Em `admin/login.html`, substitua o login atual por:
  ```js
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  ```
- Em `admin/dashboard.html` no `App.init()`, troque `DB.currentUser()` por:
  ```js
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { location.href = 'login.html'; return; }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  this.user = { ...user, ...profile };
  ```
- Implemente logout com `await supabase.auth.signOut()`
- Bloqueie a página de dashboard via `supabase.auth.onAuthStateChange()` — se o usuário sair, redirecione automaticamente

### 6) Reservas online sem autenticação

- Em `reservar.html`, o fluxo deve permitir que um visitante anônimo:
  1. Cadastre um cliente (ou reaproveite por CPF/email se já existir)
  2. Crie uma reserva
  3. Crie um pagamento opcional
- As policies de RLS criadas acima cuidam da segurança no banco

### 7) Testes obrigatórios

Após a migração, valide os cenários:

- **Sincronização**: Recepcionista cria reserva manual no PC 1 → Admin abre dashboard no PC 2 → reserva aparece sem refresh manual
- **Online → Dashboard**: Cliente entra em `begeouro.com` no celular, faz reserva → Admin vê a reserva instantaneamente na dashboard
- **Check-in/out**: Funcionário faz check-in → quarto muda para "ocupado" em todas as telas abertas
- **Persistência**: Sair, limpar cache, voltar → dados continuam intactos
- **Permissões**: Funcionário não consegue acessar relatórios financeiros, financeiro não consegue editar quartos
- **PDF**: Comprovante de check-out continua gerando corretamente com dados do Supabase
- **Relatórios**: Gráfico de faturamento 7 dias usa querys agregadas (`SELECT date_trunc(...), SUM(valor)...`)

## Restrições importantes

- **NÃO** alterar o visual do site público — só a fonte dos dados muda
- **NÃO** quebrar as URLs e estrutura de pastas existentes
- **NÃO** comitar chaves secretas no git
- **MANTER** compatibilidade com Vercel (deploy estático funciona)
- **MANTER** o sistema funcionando localmente para desenvolvimento (modo "demo" com localStorage como fallback se `SUPABASE_CONFIG` não existir é desejável mas não obrigatório)
- **MANTER** o carrossel de fotos dos quartos, o sistema de imagens em `js/site.js` e todo o trabalho visual já feito intactos

## Critério de pronto

Antes de declarar a migração concluída, **demonstre cada um dos 6 cenários da seção "Testes obrigatórios"** funcionando ao vivo, com prints ou descrição clara do que aconteceu em cada um.

## Como começar

1. Pergunte ao usuário se tem alguma dúvida sobre o escopo antes de iniciar
2. Liste em ordem as etapas que vai executar e o tempo estimado de cada uma
3. Peça ao usuário pra criar a conta no Supabase e fornecer as chaves quando estiver pronto
4. Aplique o schema SQL
5. Implemente em ordem incremental: leitura primeiro, escrita depois, auth depois, reservas online por último
6. Mantenha o sistema funcionando em cada etapa — não quebre antes de funcionar
7. Faça commits frequentes e pequenos, com mensagens claras (ex: `feat(db): leitura de quartos via supabase`)

========== FIM DO PROMPT ==========

## Como usar

1. **Copia** todo o conteúdo entre `========== INÍCIO DO PROMPT ==========` e `========== FIM DO PROMPT ==========`
2. **Abre o Antigravity** com este projeto aberto
3. **Cola** no chat do Antigravity
4. Responde as perguntas que ele fizer (criar conta Supabase, fornecer chaves, etc)
5. Acompanha a execução — o Antigravity vai trabalhar em etapas e te avisar quando precisar de alguma ação sua

Tempo estimado total: **3 a 6 horas** de trabalho com o Antigravity (você fica acompanhando, ele faz a maior parte).

## Custo

- **Supabase**: grátis até 500MB de banco + 50.000 usuários autenticados/mês — mais que suficiente pro hotel
- **Vercel**: grátis no plano Hobby — continua o mesmo
- **Tempo do Antigravity**: depende do seu plano (Gemini Plan vs Pro)

## O que mudar depois

Depois que a migração estiver pronta, troque as senhas iniciais dos 3 usuários (admin/maria/joao) por senhas fortes — o Antigravity vai te lembrar disso ao final.
