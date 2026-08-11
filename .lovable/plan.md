# Partes 7 e 8 — Questionário de Pré-Chegada e e-mails

Módulo novo, vinculado à reserva (um questionário por reserva, independente de quantos bangalôs/hóspedes). Nada do fluxo atual de pré-checkin da FNRH é alterado.

## Levantamento (verificado antes do plano)

- Papéis administrativos existentes hoje: `super_admin` e `admin` (enum `app_role`, além de `user`), com `has_role()` e `AuthContext` expondo `isAdmin`/`isSuperAdmin`. **Existem dois papéis administrativos**, então, seguindo sua regra, a seção de Saúde e Bem-Estar ficará visível apenas para `super_admin`. Aviso: não criarei papéis novos; se depois você quiser um nível intermediário (ex.: recepção sem acesso a saúde), vale criar em outra etapa com sua confirmação.
- Já existe arquitetura segura de tokens: tabela `booking_tokens` (token aleatório, `type`, `expires_at`, `used`) validada no servidor via função `validate_booking_token`, usada hoje pelas páginas `/checkin` e `/checkout`. A Pré-Chegada reutiliza essa tabela com `type = 'pre_arrival'`.
- `SITE_URL` já é normalizado no padrão `(Deno.env.get("SITE_URL") || "https://pousadararazul.com").replace(/\/+$/, "")` em `send-checkin-email` — o mesmo padrão será usado, sem barra dupla e sem domínio lovable.app.
- E-mails saem via Resend com log em `email_logs` (`email_type`), e há cron diário (`cron-guest-emails`) que já usa `email_logs` como trava de idempotência.
- `reservations.guest_language` existe e será a fonte do idioma do formulário e dos e-mails (fallback `pt`).

## Banco de dados

Nova tabela `pre_arrival_responses` (uma linha por reserva, `reservation_id` único):

- Controle: `status` (`pending` | `sent` | `answered` | `updated`), `created_at`, `first_sent_at`, `last_sent_at`, `answered_at`, `updated_at`, `reminders_sent` (int), `last_send_origin` (`auto` | `manual`), `language`.
- Respostas não sensíveis: restrições alimentares (array), alimentos a evitar, crianças, ocasião especial + detalhe, meio de chegada, horário estimado, necessidades de transporte, observações adicionais.
- Respostas de saúde (sensíveis, colunas separadas): condição de saúde, limitações de mobilidade, medicação contínua.

RLS/GRANT:
- Sem acesso para `anon`/`authenticated` na tabela; toda a leitura/escrita pública passa por funções `SECURITY DEFINER` validadas por token e por Edge Functions com service_role.
- Leitura administrativa: `admin` e `super_admin` veem os dados operacionais; os campos de saúde são retornados apenas para `super_admin` (função dedicada que devolve os campos sensíveis somente quando `has_role(auth.uid(), 'super_admin')`).
- Acesso administrativo aos campos sensíveis registrado em `sensitive_data_access_log` (quem, quando, quais campos) — tabela já existente.

Funções de banco:
- `get_pre_arrival_by_token(token)` — valida token `pre_arrival` não expirado, devolve só o necessário (nome do responsável, código da reserva, datas, hóspedes, bangalôs) + respostas já gravadas.
- `submit_pre_arrival(token, payload)` — upsert por reserva: primeira resposta grava `answered_at` e status `answered`; reenvio atualiza `updated_at` e status `updated`. Nunca altera dados da reserva.

Token: gerado por Edge Function, aleatório, sem dados pessoais, vinculado à reserva, `expires_at` = data de check-out + 1 dia. Link expirado mostra mensagem amigável, não erro técnico.

## Página pública `/pre-chegada`

- Rota nova `/pre-chegada?token=...`, com Navigation/Footer no padrão atual e `noindex` (mesma regra de privacidade de checkin/checkout).
- Cabeçalho somente leitura: responsável, código da reserva, check-in/check-out, hóspedes, bangalôs reservados.
- Seções: Alimentação, Saúde e Bem-Estar (com o aviso de opcionalidade exigido, exibido antes da seção), Crianças, Ocasião Especial, Transporte e Chegada, Informações Adicionais. Todos os campos opcionais.
- Mensagens de abertura e encerramento acolhedoras, mencionando Pousada Rará Azul.
- Estados: formulário, sucesso, já respondido (pré-preenchido para atualização), token inválido, token expirado.
- Idiomas pt/en/es/fr com textos controlados nos arquivos de tradução (sem tradução automática), idioma inicial vindo de `guest_language` com fallback pt. Também incluirei `de`, já que o site tem esse idioma.

## Dashboard

- Em `/admin/reservations`: coluna **Pré-Chegada** com o status e ação **Enviar Pré-Chegada**, com confirmação "Enviar o formulário de Pré-Chegada para {nome}?" exibindo o e-mail de destino, e aviso extra "Este questionário já foi respondido. Deseja realmente reenviar o acesso?" quando aplicável. Após confirmar: envia, registra data/hora, marca origem manual e atualiza status.
- Modal de respostas: dados operacionais para `admin`/`super_admin`; bloco de Saúde e Bem-Estar apenas para `super_admin`, com registro de acesso. Mostra data da primeira resposta e da última atualização.

## E-mails

- `send-checkin-email`: mantém template e conteúdo atuais e ganha **apenas** um bloco novo "Prepare sua chegada" com o CTA **PREPARAR MINHA CHEGADA** apontando para `https://pousadararazul.com/pre-chegada?token=...` (token próprio de pré-chegada, sem relação com FNRH), no mesmo padrão visual premium/logo.
- Nova função `send-pre-arrival-email` (envio manual e reenvio) e novo template de lembrete com assunto "Podemos preparar sua chegada à Pousada Rará Azul? 🌿" e a nota "Caso você já tenha preenchido o formulário, pode desconsiderar este e-mail." Responsivo e no visual atual.
- Lembrete automático: um único envio, 3 dias antes do check-in, somente com status `pending`, nunca para reserva cancelada/finalizada/inválida. Idempotência dupla: `reminders_sent`/`last_sent_at` na tabela e registro em `email_logs` (`email_type = 'pre_arrival_reminder'`), verificados antes do envio. Entrará no cron diário já existente.
- Notificação interna ao concluir o questionário: assunto "Novo questionário de pré-chegada — Reserva #{codigo}", com responsável, código, período, quantidade de bangalôs e data/hora da resposta, botão **VER RESPOSTAS NO DASHBOARD**. Sem qualquer informação de saúde no corpo do e-mail (também ausente no e-mail de confirmação ao hóspede).

## Ordem de execução

1. Migração (tabela, RLS/GRANT, funções de token e submit).
2. Edge Functions: geração de token, envio/reenvio, notificação interna, ajuste do cron.
3. Página pública `/pre-chegada` + traduções.
4. Dashboard (coluna, ação de envio, modal de respostas com restrição de saúde).
5. Bloco novo no e-mail de check-in e deploy das funções.

Ao final, aviso o que foi entregue e o ponto sobre granularidade de papéis administrativos.
