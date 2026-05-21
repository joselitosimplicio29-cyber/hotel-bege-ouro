# PROMPT PARA AUDITORIA DE SEGURANÇA — Hotel Bege Ouro

## Contexto
Você é um pentester especialista em segurança web. Sua missão é fazer uma auditoria completa em uma aplicação web de hotel, **identificando vulnerabilidades sem causar danos nem vazar dados**. Eu sou o dono do site e estou pedindo a auditoria voluntariamente.

**URLs em produção:**
- Site público: `https://hotelbegeouro.com.br`
- Painel administrativo: `https://hotelbegeouro.com.br/admin/login.html`

**Stack:**
- Frontend: HTML/CSS/JS puro (sem framework)
- Hospedagem: Vercel
- Backend: Supabase (PostgreSQL com RLS habilitado, Auth)
- DNS: domínio próprio apontado pra Vercel

---

## Regras de engajamento (OBRIGATÓRIO seguir)

1. **NÃO** exfiltre, baixe, copie, salve ou compartilhe dados reais de clientes (nome completo, CPF, telefone, email, observações).
2. **NÃO** delete, modifique ou corrompa dados em produção.
3. **NÃO** cause indisponibilidade — sem DoS/DDoS, flood, brute-force agressivo. Máximo **5 requisições por segundo**.
4. **NÃO** poste vulnerabilidades, prints com dados reais ou chaves em locais públicos (GitHub, fóruns, redes sociais).
5. Sempre que encontrar PII no processo, **REDIJA** no relatório (ex: "CPF: 123.***.***-45", "Email: jo***@gmail.com", "[REDIGIDO]").
6. Para inserir dados de teste, use APENAS valores fictícios:
   - Nome: "Pentest User"
   - CPF: "000.000.000-00"
   - Telefone: "(11) 90000-0000"
   - Email: "pentest@example.com"
7. Pare imediatamente se encontrar vulnerabilidade crítica que permita acesso a dados de clientes reais — apenas reporte sem aprofundar.

---

## Escopo da auditoria

### 1. Site público (`/`, `/quartos.html`, `/reservar.html`, `/contato.html`, etc)

- [ ] **Exposição de credenciais no JS**: inspecione `js/db.js`, `js/supabase-config.js`, `js/site.js`, `js/admin.js`. Identifique:
  - Senhas hardcoded
  - `service_role` key do Supabase (CRÍTICO se exposta)
  - Tokens de API de outros serviços
  - URLs de webhooks internos
- [ ] **XSS refletido/persistido** nos formulários (nome, CPF, telefone, email, observações, contato):
  - `<script>alert(1)</script>`
  - `<img src=x onerror=alert(1)>`
  - `"><svg/onload=alert(1)>`
  - Verifique se o painel admin renderiza esses dados de forma segura.
- [ ] **HTML injection** nos campos de observações da reserva.
- [ ] **CSRF** no formulário de reserva: submeta reserva a partir de outro domínio.
- [ ] **Open redirect**: o link de WhatsApp tem alguma validação? Há outros redirects?
- [ ] **Manipulação client-side do preço**: no console, antes de finalizar a reserva, edite `state.totalFinal` ou `room.preco`. O preço adulterado chega no banco?
- [ ] **Bypass de validação**: edite `state.diarias`, `state.hospedes`, `state.quartoId` diretamente — consegue criar reserva inválida?
- [ ] **Reserva sem cliente válido**: tente finalizar reserva com `state.cliente = {}`.
- [ ] **Headers HTTP** (use https://securityheaders.com):
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security
  - Referrer-Policy
  - Permissions-Policy
- [ ] **Mixed content**: há requisições HTTP em página HTTPS?

### 2. Painel administrativo (`/admin/`)

- [ ] **Acesso direto sem login**: abra `https://hotelbegeouro.com.br/admin/dashboard.html` sem autenticar. Bloqueia ou mostra conteúdo?
- [ ] **Login bypass via localStorage**: no console, execute:
  ```js
  localStorage.setItem('hc_user', JSON.stringify({id:'fake', perfil:'admin', nome:'Hacker'}));
  ```
  e recarregue. Consegue entrar?
- [ ] **Credenciais hardcoded**: confirme se há usuários fixos em `js/db.js`. Liste-os REDIGIDOS no relatório (não mostre senhas reais, só reporte que existem).
- [ ] **Senhas fracas**: avalie a força das senhas hardcoded (complexidade, comprimento).
- [ ] **Privilege escalation**: logado como `funcionario` ou `financeiro`, tente:
  - Acessar tela de Pagamentos / Relatórios
  - Cancelar/editar reservas
  - Confirmar pagamentos
  - Deletar clientes
- [ ] **Acesso a outros admins**: consegue listar/editar outros usuários?
- [ ] **Logout efetivo**: após sair, tokens/dados ficam em localStorage, sessionStorage, cookies?
- [ ] **Rate limit no login**: dispara após X tentativas erradas? (use senhas fictícias, ex: 'wrong1', 'wrong2'… até 5 tentativas).
- [ ] **Session hijacking**: o que precisa pra "virar" outro admin (cookie, token, localStorage)?

### 3. Supabase / RLS (Row Level Security)

Anon key fica exposta no JS (é normal — é design do Supabase). O importante é o RLS bloqueando ações indevidas.

- [ ] **Anon SELECT em `clients`**: do console do navegador, execute:
  ```js
  await window._sb.from('clients').select('*');
  ```
  Retorna dados de outros clientes? (deveria retornar vazio ou só o próprio)
- [ ] **Anon SELECT em `reservations`**: idem. Vê reservas que não deveria?
- [ ] **Anon SELECT em `payments`, `consumptions`, `profiles`**: tente. Devem retornar vazio.
- [ ] **Anon UPDATE/DELETE**: tente atualizar reserva pra status 'confirmada' ou deletar:
  ```js
  await window._sb.from('reservations').update({status_reserva:'confirmada'}).eq('id','...');
  await window._sb.from('reservations').delete().eq('id','...');
  ```
  Devem ser bloqueados pela RLS.
- [ ] **Anon INSERT em `payments`**: pode inserir pagamentos sem ser admin?
- [ ] **Anon INSERT em `rooms`**: pode alterar preços/criar quartos novos?
- [ ] **Realtime subscription leak**: subscreva no canal `hotel-live` como anon. Recebe events de reservas que não deveria ler?
- [ ] **SQL injection via Supabase**: tente em filtros (`select().eq()`, `.like()`). A camada do Supabase normalmente parametriza, mas confirme.

### 4. Dados sensíveis (PII)

- [ ] **PII em network requests**: na aba Network, veja o que aparece nos payloads (CPF, telefone, email). Vai em texto puro?
- [ ] **PII em console logs**: há `console.log()` mostrando dados de clientes?
- [ ] **localStorage / sessionStorage / IndexedDB**: o que é guardado? Há dados de outros clientes ou só do usuário atual?
- [ ] **URL params**: parâmetros da URL revelam algo sensível?
- [ ] **Mensagem do WhatsApp**: a URL `wa.me/...?text=` expõe dados completos. Avalie se o nível de exposição é aceitável.
- [ ] **Erros e stack traces**: erros 500 revelam estrutura interna do backend?

### 5. Infraestrutura e descoberta

- [ ] **Arquivos sensíveis expostos**: tente acessar:
  - `https://hotelbegeouro.com.br/.env`
  - `https://hotelbegeouro.com.br/.git/config`
  - `https://hotelbegeouro.com.br/.git/HEAD`
  - `https://hotelbegeouro.com.br/package.json`
  - `https://hotelbegeouro.com.br/schema.sql`
  - `https://hotelbegeouro.com.br/fix-anon-rls.sql`
  - `https://hotelbegeouro.com.br/sync-rooms.sql`
  - `https://hotelbegeouro.com.br/PROMPT_MIGRACAO_SUPABASE.md`
  - `https://hotelbegeouro.com.br/admin/` (listing)
- [ ] **Vercel preview deployments**: enumere `https://hotel-bege-ouro-*.vercel.app`.
- [ ] **Subdomínios**: enumere subdomínios (sublist3r, crt.sh). Tem versões antigas?
- [ ] **SSL/TLS**: rode SSL Labs (https://www.ssllabs.com/ssltest/) — nota mínima esperada A.
- [ ] **robots.txt, sitemap.xml**: revelam paths internos?
- [ ] **CORS Supabase**: a API aceita requisições de qualquer origin? Isso é normal pro anon key, só anote.

### 6. Lógica de negócio

- [ ] **Reserva concorrente**: duas pessoas reservam o mesmo quarto nas mesmas datas simultaneamente. Sistema bloqueia ou cria dupla?
- [ ] **Preço manipulado**: edite preço no console pra R$ 1,00 antes de submeter. Aceita?
- [ ] **Datas absurdas**: entrada 2050, saída 2020. Aceita?
- [ ] **Datas iguais**: entrada e saída no mesmo dia (0 diárias). Aceita?
- [ ] **Datas no passado**: entrada ontem. Aceita?
- [ ] **Capacidade excedida**: 10 hóspedes em quarto de capacidade 2.
- [ ] **Quarto inexistente**: passe `quarto_id='quarto_fake'` na requisição.
- [ ] **Reserva em quarto em manutenção**: tente.
- [ ] **Cancelamento próprio**: como anon, tente cancelar reserva de outro cliente.
- [ ] **Status da reserva direto**: tente criar reserva com `status_reserva='confirmada'` (pulando aprovação).

---

## Formato do relatório esperado

Para cada vulnerabilidade encontrada, use este template:

```
## [Título conciso da vulnerabilidade]

- **Severidade**: Crítica / Alta / Média / Baixa / Informativa
- **Categoria OWASP**: ex. A01:2021 — Broken Access Control
- **Localização**: URL ou arquivo:linha
- **Descrição**: o que é o problema (1-3 frases)
- **Passos para reproduzir** (numerados, dados fictícios):
  1. ...
  2. ...
- **Impacto**: o que um atacante consegue fazer
- **Evidência**: print ou trecho de log/network REDIGIDO (sem PII real)
- **Recomendação**: como corrigir
```

No final, anexe uma **tabela resumo**:

| # | Severidade | Título | Categoria |
|---|-----------|--------|-----------|
| 1 | Crítica   | ...    | ...       |
| 2 | Alta      | ...    | ...       |

E uma **lista priorizada de correções** (top 5 primeiro).

---

## Importante

- Salve o relatório em arquivo local. **Não publique nem compartilhe externamente.**
- Se encontrar algo crítico (vazamento massivo, RCE, dump de banco), **pare imediatamente** e me reporte só o resumo — sem detalhes técnicos que facilitem reexploração.
- Estimo o trabalho em 1-3 horas. Reporte progresso a cada bloco terminado.
- Foco em achados acionáveis. Não preciso de teoria, preciso de "isso aqui está furado, conserte assim".

**Pode começar.**
