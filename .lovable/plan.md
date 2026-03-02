

# Sistema Premium de Check-in / Check-out Digital — Plano

## Status Atual

O sistema **ja possui a maioria das funcionalidades solicitadas** implementadas e funcionando:

| Funcionalidade | Status |
|---|---|
| Tabelas `booking_tokens`, `booking_checkins`, `booking_checkouts` | Existente |
| Páginas `/checkin` e `/checkout` com validação de token | Existente |
| Formulário de check-in (documento, chegada, notas, termos) | Existente |
| Avaliação 1-5 estrelas no checkout | Existente |
| Redirecionamento Google Reviews se nota >= 4 | Existente |
| Mensagem interna + email se nota < 4 (`send-internal-feedback`) | Existente |
| Edge Functions `send-checkin-email` e `send-checkout-email` | Existente |
| Token seguro com expiração 48h | Existente |
| Painel admin `/admin/guest-automation` com busca e envio manual | Existente |
| Funções SQL `validate_booking_token`, `submit_checkin`, `submit_checkout` | Existente |

## O que falta implementar (melhorias sobre o existente)

### 1. Melhorar o painel admin de Automação

O painel atual (`GuestAutomation.tsx`) e basico — so tem busca manual. Melhorar com:

- **Listagem automatica** de reservas proximas (check-in nos proximos 3 dias, checkout nos ultimos 3 dias)
- **Filtro por data** (date range picker)
- **Cards com estatisticas**: total de check-ins pendentes, concluidos, checkouts pendentes, nota media
- **Exibicao da nota** de checkout quando disponivel (join com `booking_checkouts`)
- **Botao para ver feedback completo** (comentario + issues)

### 2. Corrigir botao Google no checkout success

O botao "Avaliar no Google" na pagina `/checkout` (linha 222-228) usa `<a>` ao inves de `<button>` com `window.open()`. Aplicar a mesma correcao ja feita no `LeaveReviewSection.tsx`.

### 3. Criar cron job para envio automatico de emails

Criar edge function `cron-guest-emails` que:
- Busca reservas com `check_in = amanha` e `checkin_completed = false` → envia email de check-in
- Busca reservas com `check_out = ontem` e `checkout_completed = false` → envia email de checkout
- Registra em `email_logs` para evitar duplicatas

Agendar via `pg_cron` para rodar diariamente as 10:00 AM.

### 4. Melhorar UX das paginas de check-in e checkout

- Adicionar animacoes suaves (fade-in nos cards, transicao entre steps)
- Melhorar visual mobile-first com botoes maiores e espacamento adequado
- Adicionar icone de WhatsApp no fallback de token invalido para contato direto

### Arquivos a modificar

| Arquivo | Acao |
|---|---|
| `src/pages/admin/GuestAutomation.tsx` | Reescrever com stats, filtros, listagem automatica, notas |
| `src/pages/Checkout.tsx` | Corrigir botao Google (window.open) |
| `src/pages/Checkin.tsx` | Melhorias visuais + botao WhatsApp no erro |
| `supabase/functions/cron-guest-emails/index.ts` | Nova edge function para automacao diaria |
| `supabase/config.toml` | Adicionar config da nova function |

### Migracao SQL

Registrar cron job via `pg_cron` + `pg_net` para chamar a edge function diariamente.

### Nao sera criado

- Tabela `guests_stay` — o sistema ja usa `reservations` + tabelas auxiliares, criar uma nova tabela duplicaria dados sem necessidade
- Campos IP/user-agent no check-in/checkout — adicionaria complexidade sem beneficio imediato (pode ser fase futura)
- Export CSV — pode ser adicionado posteriormente sem impacto na arquitetura

