# Ajustes: e-mail de Pré-Chegada e formulário de check-in

## 1. Enviar "Preparar minha chegada" logo após o e-mail de reserva

Hoje o formulário só é enviado no lembrete automático (3 dias antes do check-in) ou manualmente pelo painel — prazo curto para a equipe preparar o que o hóspede pedir.

- Após o envio bem-sucedido do e-mail de resumo/confirmação da reserva, disparar também a função de Pré-Chegada (origem `auto`), em sequência e sem bloquear o e-mail principal (falha no segundo envio não invalida o primeiro).
- Idempotência: só envia se ainda não houver registro de envio de pré-chegada para a reserva (`pre_arrival_responses` + registro em `email_logs`). Nunca envia se já respondido.
- O lembrete de 3 dias antes continua existindo, mas apenas como reforço para quem está com status `pending` (regra já implementada), evitando duplicidade.

## 2. Formulário de check-in

- Remover os campos "Meio de transporte" e "Motivo da viagem" da tela (dados já coletados na pré-chegada). As colunas do banco permanecem intactas, apenas deixam de ser preenchidas por esse formulário.
- "Horário estimado de chegada" passa a ser um seletor com opções de 30 em 30 minutos, de 08:00 até 22:00 (08:00, 08:30, ... 22:00), substituindo o campo de texto livre.

## 3. Evitar preenchimento duplicado pelo e-mail de check-in

O e-mail de check-in inclui hoje, sempre, o bloco "Prepare sua chegada" com um novo token — o hóspede pode responder duas vezes.

- No e-mail de check-in, o bloco de pré-chegada passa a ser condicional: só aparece quando o questionário ainda não foi respondido (status diferente de `answered`/`updated`).
- Quando já respondido, não gera novo token de pré-chegada e não altera o registro de envio; o e-mail segue normal, só sem esse bloco.
- Reforço na página `/pre-chegada`: link de reserva já respondida continua exibindo o estado "já respondido" (bloqueio server-side já existente), sem permitir novo envio.

## Detalhes técnicos

- `supabase/functions/send-reservation-email/index.ts`: após log de sucesso do e-mail de confirmação, `invoke("send-pre-arrival-email", { reservationId, origin: "auto" })` protegido por try/catch.
- `supabase/functions/send-pre-arrival-email/index.ts`: guarda de saída antecipada quando status já é `answered`/`updated`, e quando já houve envio anterior automático.
- `supabase/functions/send-checkin-email/index.ts`: consulta `pre_arrival_responses` antes de gerar o token; monta o bloco HTML só se pendente.
- `src/pages/Checkin.tsx`: remover os dois `Select` e seus estados; envio passa `transport_mode`/`travel_reason` como nulos; novo `Select` de horários gerado por lista de 08:00–22:00 em passos de 30 min.
- Traduções: reutilizar `checkinPage.arrival`; sem novas chaves obrigatórias além de placeholder de seleção já existente.
- Validação: typecheck + verificação da tela de check-in no preview. Sem deploy automático.
