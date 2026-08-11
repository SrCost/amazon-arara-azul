# Levantamento FNRH antes de qualquer alteração (item 4 do prompt)

Nenhum código foi alterado. Abaixo o que a leitura do projeto mostra hoje.

## (a) Onde está a chamada de criação da ficha na FNRH

- Edge Function: `supabase/functions/fnrh-criar-reserva/index.ts` — faz `POST /hospedagem/registrar` via `_shared/fnrh-reserva.ts` (`registrarHospedagem`).
- Ela recebe **um** `reservation_id` e monta o payload a partir da linha da reserva.
- Adultos/menores enviados hoje: `quantidade_hospede_adulto ?? guests ?? 1` e `quantidade_hospede_menor ?? 0`, lidos da própria reserva (`_shared/fnrh-reserva.ts`, `buildRegistrarPayload`).
- Check-in/check-out: `fnrh-checkin` e `fnrh-checkout`, também por `reservation_id`, usando `hospede_id_fnrh` da reserva.
- Colunas de controle (`reserva_id_fnrh`, `hospede_id_fnrh`, `pessoa_id_fnrh`, `situacao_fnrh`, `link_precheckin`, `erro_sincronizacao_fnrh`) estão todas em `reservations`.

## (b) Em que ponto do fluxo a chamada é disparada

Um único ponto no frontend:

- `src/components/admin/calendar/NewReservationModal.tsx` (~linha 330): depois do `insert` em `reservations` retornar o `id`, dispara `supabase.functions.invoke("fnrh-criar-reserva", { reservation_id })` de forma best-effort (não bloqueia a reserva).

Observações do levantamento:

- Uma reserva hoje tem **um** `room_id`/`room_name` (relação 1:1 reserva → bangalô). Não existe tabela de "itens de acomodação".
- O fluxo público de reserva do site (`src/components/ReservationFlow.tsx`) **não** chama a FNRH; a sincronização acontece apenas na criação manual pelo calendário e manualmente no painel `/admin/fnrh`.

## (c) Esse ponto precisa mudar de posição para múltiplos bangalôs?

Sim — mas só se a reserva passar a conter vários bangalôs. Diagnóstico:

- Como está, cada reserva = 1 bangalô. Se o suporte a múltiplos bangalôs for implementado criando **uma reserva por bangalô**, o gatilho atual dispararia **uma chamada por bangalô** — exatamente o que a regra 1 proíbe.
- Se o suporte for implementado como **uma reserva com N itens de acomodação**, o gatilho atual continua correto em quantidade (1 chamada por reserva), porém precisa mudar de **momento**: passar a rodar somente após todos os itens da reserva estarem gravados/confirmados, e os totais de adultos/menores precisam ser a **soma** dos itens (regra 2), o que hoje não existe.

Reposicionamento proposto (a executar só após sua confirmação):

1. Modelo: manter `reservations` como a reserva-mãe (dona de todos os campos FNRH) e adicionar os bangalôs em uma estrutura filha de itens de acomodação — nunca duplicando colunas FNRH lá.
2. Gatilho: remover a invocação de dentro do fluxo por-bangalô e disparar **uma vez**, após a persistência de todos os itens (no encerramento do salvamento da reserva), com um guard de idempotência (não reenviar se `reserva_id_fnrh` já existir, comportamento que a função já tem).
3. Totais: em `_shared/fnrh-reserva.ts`, calcular `quantidadeHospedeAdulto`/`quantidadeHospedeMenor` pela soma dos itens da reserva, com fallback para os campos atuais quando não houver itens (mantendo as reservas existentes funcionando).
4. Check-in/check-out: permanecem por reserva (uma chamada), sem alteração de posição.

Nada disso será alterado sem seu "ok" explícito.

## Pendência para planejar a Pré-Chegada

O prompt enviado contém apenas o preâmbulo e as regras de proteção da FNRH (a "PARTE 2"). A **PARTE 1** — a especificação do módulo novo de Pré-Chegada (campos do formulário, quem recebe o link, e-mail/CTA, visualização no dashboard) — e a especificação funcional de múltiplos bangalôs (como o admin seleciona vários bangalôs, como o preço total é composto) não vieram na mensagem.

Assim que você colar a PARTE 1, eu apresento o plano de implementação completo (Pré-Chegada + múltiplos bangalôs + ajuste FNRH) em um único plano.
