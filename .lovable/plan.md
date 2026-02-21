
# Plano de Implementacao - 4 Melhorias no Dashboard Admin

## 1. Gerenciamento do Carrossel da Homepage no Dashboard

### Problema
O carrossel da pagina inicial (HeroCarousel) usa imagens estaticas importadas no codigo. Nao ha como o admin trocar fotos/videos sem alterar o codigo.

### Solucao
Criar uma nova tabela `hero_slides` no banco de dados e uma nova pagina de administracao para gerenciar os slides do carrossel.

### Detalhes tecnicos

**Migracao SQL** - Criar tabela `hero_slides`:
- `id` (uuid, PK)
- `title` (text) - nome/descricao interna do slide
- `desktop_image_url` (text) - URL da imagem/video para desktop (recomendado: 1920x700px)
- `mobile_image_url` (text) - URL da imagem/video para mobile/tablet (recomendado: 1080x1080px)
- `alt_text` (text) - texto alternativo
- `media_type` (text, default 'image') - 'image' ou 'video'
- `object_fit` (text, default 'cover') - 'cover' ou 'contain'
- `background_color` (text, nullable) - cor de fundo para slides com contain
- `hide_overlay` (boolean, default false) - ocultar overlay de texto
- `link_url` (text, nullable) - link ao clicar no slide
- `display_order` (integer, default 0) - ordem de exibicao
- `is_active` (boolean, default true) - ativar/desativar
- `created_at`, `updated_at` (timestamptz)
- RLS: admins podem gerenciar, publico pode ler ativos

**Novo arquivo** `src/pages/admin/HeroCarousel.tsx`:
- Pagina no dashboard para listar, criar, editar e excluir slides
- Upload de imagens separadas para Desktop (1920x700px) e Mobile/Tablet (1080x1080px) usando o bucket `gallery` existente
- Preview das imagens em ambas dimensoes
- Reordenacao por drag ou campo numerico
- Ativar/desativar slides individuais

**Alterar** `src/components/HeroCarousel.tsx`:
- Buscar slides ativos da tabela `hero_slides` em vez de usar array estatico
- Fallback para imagens estaticas caso nao haja slides no banco
- Suporte a tipo de media (imagem ou video)

**Alterar** `src/pages/admin/AdminLayout.tsx`:
- Adicionar link "Carrossel" no menu lateral do dashboard

---

## 2. Sincronizacao de Dados entre Abas do Dashboard

### Problema
Edicoes feitas na aba Reservas (lista) nao sao refletidas na aba Calendario e vice-versa. Ambas usam canais Realtime separados que ouvem a mesma tabela, mas a aba Reservas nao atualiza `operational_status` ao editar, e a aba Calendario nao reflete mudancas imediatas feitas na outra aba.

### Solucao
A sincronizacao via Realtime ja esta configurada em ambas as paginas -- ambas ouvem `postgres_changes` na tabela `reservations`. O problema real e que a aba Reservas (`Reservations.tsx`) nao atualiza campos importantes ao editar:

**Alterar** `src/pages/admin/Reservations.tsx` - `handleUpdateReservation`:
- Adicionar `operational_status: editForm.status` ao objeto de update (atualmente so atualiza `status` mas nao `operational_status`, que e o campo que o calendario usa)
- Adicionar `daily_rate` ao update
- Adicionar `room_name` ao update quando o quarto mudar

Isso garante que ao editar na aba Reservas, os campos usados pelo calendario (`operational_status`, `daily_rate`) tambem sao atualizados. O Realtime ja cuida de notificar ambas as paginas.

---

## 3. Protecao contra Crash no Formulario de Reserva Manual

### Problema
Ao preencher o formulario de nova reserva manual, erros nao tratados fazem o site "cair" (tela branca).

### Solucao
Adicionar tratamento robusto de erros com `try...catch` em todas as operacoes assincronas e proteger o formulario contra dados invalidos.

**Alterar** `src/components/admin/calendar/NewReservationModal.tsx`:
- Envolver o `onSubmit` em try/catch mais robusto (ja existe, mas verificar edge cases)
- Adicionar validacao de `NaN` e `Infinity` nos campos de preco antes de submeter
- Proteger `calculatedDailyRate` contra divisao por zero quando `nights = 0`
- Adicionar `ErrorBoundary` ao redor do modal ou proteger renderizacao de valores `NaN`/`undefined`

**Alterar** `src/components/admin/calendar/EditReservationModal.tsx`:
- Mesmas protecoes contra NaN e divisao por zero

---

## 4. Envio de Email para Reservas Manuais

### Problema
Reservas criadas manualmente pelo admin nao disparam email de confirmacao para o hospede. Apenas reservas do fluxo normal (com pagamento) enviam email.

### Solucao
Apos criar a reserva manual com sucesso, chamar a edge function `send-reservation-email` existente com o tipo `reservation_confirmed`.

**Alterar** `src/components/admin/calendar/NewReservationModal.tsx` - `onSubmit`:
- Apos o insert com sucesso, buscar o ID da reserva criada
- Chamar `supabase.functions.invoke('send-reservation-email', ...)` com:
  - `type: 'reservation_confirmed'`
  - `reservationId: novaReservaId`
  - `email: data.guest_email`
  - `name: data.guest_name`
- Tratar o erro do email separadamente (nao bloquear a criacao da reserva)
- Exibir toast de sucesso/erro para o envio do email
- Modificar o insert para usar `.select().single()` em vez de so `.insert()` para obter o `id` da reserva criada

**Alterar** `supabase/functions/send-reservation-email/index.ts`:
- Nenhuma alteracao necessaria - a edge function ja suporta o tipo `reservation_confirmed` e busca os dados completos da reserva pelo ID. O template premium existente sera reutilizado.

---

## Resumo dos Arquivos a Modificar

1. **Nova migracao SQL** - tabela `hero_slides` + RLS
2. **Novo arquivo** `src/pages/admin/HeroCarousel.tsx` - pagina de gerenciamento
3. **Novo hook** `src/hooks/useHeroSlides.ts` - buscar slides do banco
4. **Alterar** `src/components/HeroCarousel.tsx` - usar dados do banco
5. **Alterar** `src/pages/admin/AdminLayout.tsx` - adicionar menu "Carrossel"
6. **Alterar** `src/pages/admin/Reservations.tsx` - sincronizar `operational_status` no update
7. **Alterar** `src/components/admin/calendar/NewReservationModal.tsx` - protecao contra crash + envio de email
8. **Alterar** `src/components/admin/calendar/EditReservationModal.tsx` - protecao contra crash
