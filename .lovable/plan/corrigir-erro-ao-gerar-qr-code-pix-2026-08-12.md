# Corrigir erro ao gerar QR Code PIX

## O que está acontecendo

O erro "Falha ao criar pedido PIX" não é uma falha do PIX: a função `create-pix-payment` respondeu **409 – datas indisponíveis**.

Confirmado nos logs e no banco:
- Log da função: `Bangalôs indisponíveis: [{ room_name: "Bangalô Peneira" }]` para o par de datas testado.
- Banco: existe reserva **confirmada** do Bangalô Peneira de 04/08 a 07/08 (hóspede Anne Kathrin Wegele).

O problema real é de **mensagem**: quando a Edge Function responde com status 409, o cliente Supabase devolve `data = null` e apenas um erro genérico, então o código que trataria `error === 'dates_unavailable'` nunca roda e o usuário vê "Falha ao criar pedido PIX" em vez de "essas datas já estão reservadas".

## O que será feito

1. **Ler o corpo real das respostas de erro das funções de pagamento**
   Criar um helper que, quando a chamada retorna erro HTTP, lê o JSON da resposta (`error.context`) e recupera `error`, `message` e `unavailable_rooms`.

2. **Aplicar o helper nos dois fluxos de pagamento** (PIX e cartão) em `ReservationFlow.tsx`
   - Se o código for `dates_unavailable`: mostrar aviso claro com o nome do(s) bangalô(s) indisponível(is), atualizar a disponibilidade e voltar para a etapa de datas (comportamento que já existe, mas hoje nunca dispara).
   - Para qualquer outro erro: exibir a mensagem real vinda do servidor no diálogo, em vez do texto genérico.

3. **Evitar o conflito antes do pagamento**
   Revalidar disponibilidade do bangalô principal **e dos bangalôs adicionais** ao avançar para a etapa de pagamento, para que o hóspede seja avisado antes de chegar no QR Code.

## Detalhes técnicos

- `src/components/ReservationFlow.tsx`: novo helper `parseFunctionError(error, data)` usando `error.context?.json()` (FunctionsHttpError), usado nos blocos de `create-pix-payment` (linhas ~357-380) e `create-card-payment` (linhas ~670-695).
- Nenhuma mudança em Edge Functions ou banco: a resposta 409 e o cálculo de disponibilidade em `supabase/functions/_shared/multi-rooms.ts` já estão corretos.
- Textos novos adicionados aos arquivos de tradução (pt/en/es/fr/de).
