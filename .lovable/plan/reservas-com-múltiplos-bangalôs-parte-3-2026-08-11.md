# Reservas com múltiplos bangalôs (PARTE 3)

## Situação atual (verificada)

- A tabela `reservations` representa a reserva e já carrega **um único** bangalô: `room_id` (FK para `rooms`) e `room_name`, ambos obrigatórios. Não existe hoje nenhuma tabela de itens de acomodação.
- O calendário (`useCalendarReservations`) lê `room_id` de cada reserva e desenha a barra na linha daquele bangalô.
- O cadastro manual (`NewReservationModal`) tem um único `room_id` no formulário e valida conflito com `checkConflict(roomId, ...)`.
- Os campos de controle FNRH (`reserva_id_fnrh`, `situacao_fnrh`, `quantidade_hospede_adulto/menor`, etc.) já estão em `reservations` — permanecem exatamente onde estão (regra 3 da PARTE 2).

Conclusão: a estrutura atual **não** suporta múltiplas acomodações. Será criada apenas a estrutura complementar mínima.

## O que será construído

### 1. Estrutura complementar no banco

Nova tabela `reservation_rooms` (itens de acomodação), ligada à reserva:

- `reservation_id` (FK → `reservations`, on delete cascade)
- `room_id` (FK → `rooms`), `room_name`
- `guests` (hóspedes daquele bangalô), `daily_rate`, `subtotal`
- `position` (ordem de exibição), timestamps
- Trava de segurança: no máximo **10** itens por reserva (validada por trigger, não por regra de negócio rígida)
- Permissões: leitura/escrita para admin e super_admin; leitura pública apenas via as funções de disponibilidade já existentes; acesso total para as funções de servidor

Nenhuma coluna existente é removida ou alterada. `reservations.room_id` / `room_name` continuam preenchidos com o **primeiro** item (âncora de compatibilidade), de modo que todo código antigo — pagamentos, e-mails, FNRH, relatórios, check-in/check-out — continua funcionando sem mudança.

Backfill: para cada reserva existente é criado 1 item em `reservation_rooms` espelhando o `room_id` atual. Nada é perdido nem reescrito.

### 2. Calendário PMS

- O calendário passa a desenhar **uma barra por item** de acomodação (cada bangalô mostra a mesma reserva na sua linha), com indicação visual de que fazem parte da mesma reserva (mesmo código/rótulo).
- Verificação de conflito passa a considerar todos os itens da reserva.
- Reservas antigas, tendo 1 item, aparecem idênticas a hoje.

### 3. Nova reserva / edição (admin)

- No modal de nova reserva, o campo único de bangalô vira uma **lista de acomodações**: adicionar/remover linhas, cada uma com bangalô, nº de hóspedes e diária.
- O total de hóspedes da reserva é a **soma** dos itens; o valor total é a soma dos subtotais (mantendo a opção de valor manual que já existe).
- Bloqueio de bangalô repetido no mesmo período e conflito verificado item por item antes de salvar.
- Modal de edição recebe o mesmo editor de acomodações.

### 4. FNRH (respeitando a PARTE 2)

- A chamada `fnrh-criar-reserva` sai de dentro do fluxo por bangalô e passa a ser disparada **uma única vez**, após a reserva e todos os seus itens estarem gravados.
- `quantidade_hospede_adulto` e `quantidade_hospede_menor` enviados à FNRH continuam sendo os totais da reserva (soma de todos os bangalôs).
- Colunas de controle FNRH permanecem na reserva; nada é movido para a tabela de itens.

### 5. Listagens e leitura

- Painel de reservas, painel FNRH e detalhes passam a exibir a lista de acomodações (ex.: "1 × Peneira, 1 × Tipiti, 1 × Paneiro"); quando há só um item, o texto fica igual ao de hoje.

## Detalhes técnicos

- Migração: `CREATE TABLE public.reservation_rooms` + GRANTs + RLS + políticas + trigger de `updated_at` + trigger de limite de 10 itens + backfill a partir de `reservations`.
- `useCalendarReservations`: busca `reservation_rooms` das reservas do período e expande as reservas em itens para renderização; `checkConflict` passa a operar sobre itens.
- `NewReservationModal` / `EditReservationModal`: array de itens no schema Zod (`min(1)`, `max(10)`), gravação em duas etapas (reserva → itens) e uma única chamada FNRH ao final.
- Sem migração destrutiva: nenhum `DROP`/`ALTER ... DROP COLUMN`; `room_id` da reserva mantido como espelho do primeiro item.

## Ordem de execução

1. Migração + backfill
2. Leitura (hook do calendário, listagens)
3. Escrita (modais de nova reserva/edição) + reposicionamento da chamada FNRH
