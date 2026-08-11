# Parte 9 — Dashboard, auditoria, segurança, performance e UX da Pré-Chegada

Estado atual verificado (sem alterações feitas neste modo):

- A tabela `pre_arrival_responses` já existe com RLS: leitura só para `admin`/`super_admin`, escrita só via `service_role`. Sem acesso do cliente público.
- `get_pre_arrival_by_token` e `submit_pre_arrival` são `SECURITY DEFINER` e resolvem a reserva pelo token (`booking_tokens.type = 'pre_arrival'`, não expirado) — o público só alcança a própria reserva.
- `get_pre_arrival_admin` exige `admin`/`super_admin`, retorna Saúde apenas para `super_admin` e já grava o acesso em `sensitive_data_access_log`.
- Os envios já são logados em `email_logs` (`send-pre-arrival-email`, `notify-pre-arrival`, lembrete em `cron-guest-emails`).
- No dashboard existe a coluna "Pré-Chegada" na lista (status + enviar + ver respostas), mas o **detalhe da reserva** ainda mostra apenas "—".
- A página pública `/pre-chegada` é um formulário de rolagem única (todas as seções juntas), com tela final de sucesso, mas **sem etapas, progresso e revisão**.

## O que será feito

### 1. Seção "Pré-Chegada" no detalhe da reserva
No diálogo "Detalhes da Reserva", substituir o campo vazio por uma seção própria (abaixo das Acomodações) com:
- Status (🟡 Pendente / 🟠 Enviado / 🟢 Respondido / 🔵 Atualizado), data de resposta, último envio, origem (automático/manual) e nº de lembretes.
- Botões: **Enviar Pré-Chegada** (quando nunca enviado), **Enviar novamente** (com confirmação quando já respondido) e **Visualizar respostas**.
- Respostas em modo leitura, agrupadas por categoria: Dados da reserva, Alimentação, Saúde e Bem-Estar, Crianças, Ocasião Especial, Transporte e Chegada, Informações Adicionais. Saúde só aparece para o administrador principal (regra da Parte 7); para os demais, uma nota explicando a restrição.

### 2. Performance
- O status de cada reserva passa a vir de **uma única consulta agregada por página** (10 reservas), em vez de uma consulta por linha, reutilizando o carregamento já existente da lista.
- As respostas completas continuam sendo buscadas **somente ao clicar em Visualizar** (uma chamada, sob demanda).
- Nenhuma biblioteca nova; reutiliza Dialog, Badge, Button e o componente de célula já existente.

### 3. Auditoria
Reaproveitando as estruturas atuais (`email_logs`, `activity_log`, `sensitive_data_access_log`), sem criar sistema paralelo:
- Envio automático, envio manual e lembrete: já em `email_logs`; passam a registrar também um evento em `activity_log` com a origem.
- Formulário respondido e atualização de respostas: registro em `activity_log` feito dentro da função de envio pelo hóspede (identificado como acesso por token, sem usuário logado).
- Acesso administrativo às respostas de Saúde: já registrado em `sensitive_data_access_log`.

### 4. Segurança
Nenhuma permissão nova para o público. Confirmado e mantido: o cliente público não lista questionários, não lê respostas de terceiros, não consulta outras reservas e não altera a reserva. Operações privilegiadas seguem nas Edge Functions com `service_role`. Nenhum segredo ou chave chega ao frontend.

### 5. Formulário público em etapas (mobile-first)
Reescrever `/pre-chegada` como assistente de etapas, mantendo os mesmos campos, idiomas e a mesma chamada de envio:
- Etapas: Alimentação → Saúde e Bem-Estar → Crianças → Ocasião Especial → Transporte → Informações adicionais → **Revisão** → Conclusão.
- Barra de progresso com indicação "Etapa X de 7", botões **Voltar** / **Continuar** e **Enviar informações** apenas na revisão.
- Revisão mostra um resumo de tudo que foi preenchido, com atalho para editar cada seção.
- Conclusão premium: "Tudo pronto! 🌿" com nome do hóspede, código da reserva, período, status e aviso de que pode atualizar pelo mesmo link — sem exigir login.
- Alvos de toque grandes (campos e botões com altura confortável), sem rolagem horizontal nem texto cortado em celular; botões de navegação fixos e acessíveis no rodapé em telas pequenas.
- Todos os textos novos entram nos arquivos de tradução (pt, en, es, fr, de).

## Detalhes técnicos

- `src/pages/admin/Reservations.tsx`: buscar status de pré-chegada em lote na consulta da página; nova seção no diálogo de detalhes.
- `src/components/admin/PreArrivalCell.tsx`: aceitar status pré-carregado (evita consulta por linha) e ganhar variante "painel" usada no diálogo de detalhes.
- Novo `src/components/admin/PreArrivalDetails.tsx`: leitura por categoria via `get_pre_arrival_admin`, chamada sob demanda.
- Migração: inserir registros em `activity_log` dentro de `submit_pre_arrival`; nenhuma tabela nova, nenhuma mudança de RLS existente.
- `supabase/functions/send-pre-arrival-email/index.ts` e `cron-guest-emails`: registrar evento em `activity_log` além do `email_logs` atual; redeploy das funções afetadas.
- `src/pages/PreArrival.tsx`: refatorar para etapas com estado local; a chamada `submit_pre_arrival` e a notificação interna permanecem iguais.
