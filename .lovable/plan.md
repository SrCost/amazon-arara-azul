

# Atualizar template de email de reserva confirmada

## O que sera feito

Substituir o template atual `getReservationConfirmedEmailPremium` no edge function `send-reservation-email` pelo novo template fornecido, mapeando as variaveis dinamicas corretamente.

## Mapeamento de variaveis

| Placeholder no template | Valor dinamico |
|---|---|
| `{nome_cliente}` | `data.nome_cliente` |
| `{codigo_reserva}` | `data.codigo_reserva` |
| `{tipo_quarto}` | `data.tipo_quarto` |
| `{checkin}` | `data.checkin` |
| `{checkout}` | `data.checkout` |
| `{numero_noites}` | Novo campo calculado (checkout - checkin) |
| `{forma_pagamento}` | `data.metodo_pagamento` (formatado) |
| `{status_pagamento}` | Novo campo do status |
| `{valor_total}` | `data.valor_total` |
| `{ano_atual}` | `getCurrentYear()` |

## Ajustes necessarios no template

1. O link do WhatsApp no template usa `wa.me/message/G5O3HIKODARQB1` - sera atualizado para `wa.me/5592984125475` (consistente com o resto do projeto)
2. O link "VER MINHA RESERVA" aponta para `pousadararazul.com` - sera mantido como esta
3. O logo usa URL do S3 do Resend (`resend-attachments.s3.amazonaws.com`) - sera mantido conforme fornecido

## Alteracao tecnica

### `supabase/functions/send-reservation-email/index.ts`

1. Adicionar campos `numero_noites` e `status_pagamento` na interface de dados do template
2. Substituir a funcao `getReservationConfirmedEmailPremium` (linhas 76-273) pelo novo template HTML convertido para template literal
3. Atualizar a chamada na linha 628-640 para passar os novos campos (`numero_noites` calculado e `status_pagamento`)
4. Corrigir link WhatsApp para `wa.me/5592984125475`

### Calculo de noites (na chamada do template, ~linha 628)

```
const checkInDate = new Date(reservation.check_in);
const checkOutDate = new Date(reservation.check_out);
const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
```

### Formato do status de pagamento

Mapear `reservation.payment_status` para labels legiveis:
- `paid` -> `Aprovado`
- `pending` -> `Pendente`
- `failed` -> `Falhou`

Os templates de `payment_success` e `payment_error` permanecem inalterados.

