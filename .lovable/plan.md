

# Plano: Reviews Google + Check-in/Check-out Digital + Automacao

Implementacao modular e desacoplada em 7 fases, sem alterar fluxos existentes de reservas, pagamentos ou SEO.

---

## Fase 1: Infraestrutura de Banco de Dados

Criar 4 novas tabelas via migracao:

**`google_reviews_cache`** — cache de reviews do Google
- id, author_name, rating (integer), text, profile_photo_url, review_date, updated_at

**`booking_checkins`** — dados de check-in digital
- id, reservation_id (FK reservations.id), document, estimated_arrival_time, notes, accepted_terms (boolean), created_at

**`booking_checkouts`** — dados de check-out digital
- id, reservation_id (FK reservations.id), rating (1-5), comment, issues, created_at

**`booking_tokens`** — tokens seguros para check-in/check-out
- id, reservation_id (FK reservations.id), token (unique), type (checkin|checkout), expires_at, used (boolean), created_at

Adicionar campos opcionais na tabela `reservations`:
- `checkin_completed` (boolean default false)
- `checkout_completed` (boolean default false)

RLS: leitura publica para `google_reviews_cache`; insert via service_role para checkins/checkouts/tokens; admins podem ler tudo.

---

## Fase 2: Google Reviews — Backend

### 2.1 Secrets
Solicitar ao usuario: `GOOGLE_PLACE_ID` e `GOOGLE_API_KEY` via ferramenta de secrets.

### 2.2 Edge Function: `fetch-google-reviews`
- Chamar Google Places Details API com fields=reviews
- Filtrar rating >= 4, limitar a 6
- Upsert na tabela `google_reviews_cache`
- Retornar reviews atualizados

### 2.3 Cron Job (via pg_cron + pg_net)
- Agendar chamada a cada 12h
- Fallback: se API falhar, cache existente permanece

---

## Fase 3: Google Reviews — Frontend

### 3.1 Componente `<GoogleReviewsCarousel />`
- Buscar de `google_reviews_cache` via Supabase client
- Autoplay 5s, pause no hover
- Estrelas visuais (iconografia)
- Limite 300 caracteres com "...ver mais"
- Responsivo, lazy loading
- Estilo premium consistente com o site

### 3.2 Secao "Deixe sua Avaliacao"
- Titulo: "Compartilhe sua experiencia"
- Botao premium linkando para: `https://search.google.com/local/writereview?placeid=PLACE_ID`
- `GOOGLE_PLACE_ID` vindo de variavel de ambiente no frontend ou hardcoded

### 3.3 Integracao na Home (`Index.tsx`)
- Inserir `<GoogleReviewsCarousel />` apos secao de features
- Inserir secao "Deixe sua Avaliacao" antes do footer

---

## Fase 4: Check-in Digital

### 4.1 Rota `/checkin`
- Nova pagina `src/pages/Checkin.tsx`
- Rota publica (sem login)

### 4.2 Fluxo
1. Tela inicial: campos "Codigo da reserva" + "Email"
2. Validar contra tabela `reservations` (via RPC segura)
3. Se valido: formulario com documento, horario chegada, observacoes, aceite termos
4. Apos envio: salvar em `booking_checkins`, atualizar `reservations.checkin_completed = true`
5. Tela de sucesso premium: "Estamos preparando tudo para sua chegada"

### 4.3 Suporte a token via URL
- Se `?token=XXXX` presente, validar token da tabela `booking_tokens`
- Preencher automaticamente reserva vinculada

---

## Fase 5: Check-out Digital

### 5.1 Rota `/checkout`
- Nova pagina `src/pages/Checkout.tsx`
- Rota publica

### 5.2 Fluxo
1. Validacao: codigo reserva + email (ou token)
2. Formulario: nota 1-5, comentario, problemas, confirmacao saida
3. Apos envio:
   - Se rating >= 4: redirecionar para link de review Google
   - Se rating < 4: mensagem de agradecimento + disparar email interno para equipe
4. Salvar em `booking_checkouts`, atualizar `reservations.checkout_completed = true`
5. Tela personalizada com nome do hospede

---

## Fase 6: Automacao por Email

### 6.1 Edge Function: `send-checkin-email`
- Recebe reservation_id
- Gera token seguro (48h expiracao) na tabela `booking_tokens`
- Envia email via Resend com link `/checkin?token=XXXX`
- Template HTML premium (mesma identidade visual dos emails existentes)

### 6.2 Edge Function: `send-checkout-email`
- Mesma logica, tipo checkout
- Link `/checkout?token=XXXX`

### 6.3 Edge Function: `send-internal-feedback`
- Disparado quando rating < 4 no checkout
- Envia email para equipe com detalhes do feedback negativo

### 6.4 Cron Jobs (futuro/manual)
- Pode ser configurado via pg_cron para disparar 1 dia antes do check-in e 1 dia apos check-out
- Inicialmente, disparo sera manual via dashboard

---

## Fase 7: Dashboard Admin — Guest Automation

### 7.1 Nova pagina `/admin/guest-automation`
- `src/pages/admin/GuestAutomation.tsx`

### 7.2 Funcionalidades
- Buscar reserva por codigo/nome/email
- Para cada reserva, exibir status: checkin enviado, checkout enviado, checkin concluido, checkout concluido
- Botoes: "Enviar email check-in", "Enviar email check-out"
- Historico de envios

### 7.3 Integracao
- Adicionar item no menu do AdminLayout (icone `ClipboardCheck`, label "Automacao")
- Acesso para admin e super_admin

---

## Seguranca

- Tokens unicos com expiracao 48h, marcados como usados apos submissao
- Rate limit por IP nas rotas de checkin/checkout (reutilizar `check_rate_limit` existente)
- Validacao e sanitizacao de todos os inputs (zod)
- RPC security definer para validacao de reserva sem expor dados
- Nenhum dado sensivel exposto no frontend

---

## Arquivos a criar/modificar

**Novos arquivos:**
- `src/pages/Checkin.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/admin/GuestAutomation.tsx`
- `src/components/GoogleReviewsCarousel.tsx`
- `src/components/LeaveReviewSection.tsx`
- `src/hooks/useGoogleReviews.ts`
- `supabase/functions/fetch-google-reviews/index.ts`
- `supabase/functions/send-checkin-email/index.ts`
- `supabase/functions/send-checkout-email/index.ts`
- `supabase/functions/send-internal-feedback/index.ts`

**Arquivos modificados:**
- `src/App.tsx` — adicionar rotas /checkin, /checkout, /admin/guest-automation
- `src/pages/Index.tsx` — inserir GoogleReviewsCarousel e LeaveReviewSection
- `src/pages/admin/AdminLayout.tsx` — adicionar menu "Automacao"

**Migracoes:**
- 4 novas tabelas + 2 colunas opcionais em reservations + RLS policies + funcoes RPC

---

## Ordem de implementacao sugerida

Devido ao tamanho, recomendo implementar em etapas:
1. Banco de dados (tabelas + RLS + RPCs)
2. Google Reviews (backend + frontend)
3. Check-in digital
4. Check-out digital
5. Emails de automacao
6. Dashboard admin

