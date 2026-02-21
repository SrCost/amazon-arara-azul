

# Atualizar template de email com novo design premium

## O que sera feito

Substituir o template `getReservationConfirmedEmailPremium` pelo novo template fornecido, adicionando novas variaveis dinamicas e links contextuais para WhatsApp.

## Novas variaveis a calcular no backend

| Variavel | Calculo |
|---|---|
| `dias_para_checkin` | Diferenca em dias entre a data atual e o check-in |
| `google_calendar_link` | URL do Google Calendar com datas no formato `YYYYMMDDTHHmmss` (check-in 14h, check-out 12h) |
| `link_upgrade` | Link WhatsApp com mensagem contextual sobre upgrade |
| `link_passeio` | Link WhatsApp com mensagem contextual sobre passeios |

## Mapeamento completo de variaveis

| Placeholder | Valor |
|---|---|
| `{nome_cliente}` | `reservation.guest_name` |
| `{codigo_reserva}` | `formatReservationNumber(reservation.id)` |
| `{tipo_quarto}` | `reservation.room_name` |
| `{checkin}` | `formatDate(reservation.check_in)` |
| `{checkout}` | `formatDate(reservation.check_out)` |
| `{valor_total}` | `formatCurrency(reservation.total_price)` |
| `{dias_para_checkin}` | `Math.max(0, diffDays(now, checkIn))` |
| `{google_calendar_link}` | URL construida dinamicamente |
| `{link_upgrade}` | `https://wa.me/5592984125475?text=...` |
| `{link_passeio}` | `https://wa.me/5592984125475?text=...` |
| `{ano_atual}` | `getCurrentYear()` |

## Links WhatsApp contextuais

- **"Ver Upgrade Disponivel"**: `https://wa.me/5592984125475?text=Olá! Tenho a reserva {codigo} e gostaria de saber sobre upgrade de bangalô.`
- **"Reservar Passeio"**: `https://wa.me/5592984125475?text=Olá! Tenho a reserva {codigo} e gostaria de reservar passeios para complementar minha experiência na Amazônia.`
- **"Falar com nossa equipe"**: `https://wa.me/5592984125475?text=Olá! Tenho a reserva {codigo} e gostaria de mais informações.`

## Link Google Calendar

Formato:
```
https://www.google.com/calendar/render?action=TEMPLATE
&text=Reserva+Pousada+Arara+Azul
&dates=YYYYMMDDTHHmmss/YYYYMMDDTHHmmss
&details=Reserva+confirmada+Codigo+PAA-XXXXXX
&location=Manacapuru,+AM
```

- Check-in: data do check-in as 14:00 (T140000)
- Check-out: data do check-out as 12:00 (T120000)

## Alteracao tecnica

### `supabase/functions/send-reservation-email/index.ts`

1. Atualizar interface do template para incluir: `dias_para_checkin`, `google_calendar_link`, `link_upgrade`, `link_passeio`

2. Adicionar funcao helper para gerar o link do Google Calendar:
```typescript
const buildGoogleCalendarLink = (checkIn: string, checkOut: string, codigo: string) => {
  const formatGCalDate = (dateStr: string, time: string) => {
    const d = new Date(dateStr);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}T${time}`;
  };
  const start = formatGCalDate(checkIn, '140000');
  const end = formatGCalDate(checkOut, '120000');
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=Reserva+Pousada+Arara+Azul&dates=${start}/${end}&details=Reserva+confirmada+Codigo+${encodeURIComponent(codigo)}&location=Manacapuru,+AM`;
};
```

3. Substituir completamente a funcao `getReservationConfirmedEmailPremium` (linhas 96-242) pelo novo template convertido em template literal, usando `${data.variavel}` para cada placeholder

4. Atualizar a chamada do template (linhas 601-611) para passar os novos campos:
```typescript
const now = new Date();
const daysToCheckin = Math.max(0, Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
const codigoReserva = formatReservationNumber(reservation.id);
const googleCalLink = buildGoogleCalendarLink(reservation.check_in, reservation.check_out, codigoReserva);
const whatsappBase = 'https://wa.me/5592984125475';
const linkUpgrade = `${whatsappBase}?text=${encodeURIComponent(`Olá! Tenho a reserva ${codigoReserva} e gostaria de saber sobre upgrade de bangalô.`)}`;
const linkPasseio = `${whatsappBase}?text=${encodeURIComponent(`Olá! Tenho a reserva ${codigoReserva} e gostaria de reservar passeios para complementar minha experiência na Amazônia.`)}`;
```

5. O link "Falar com nossa equipe" no template usara `https://wa.me/5592984125475?text=...` com mensagem contextual (retornando ao formato correto do projeto, NAO o `wa.me/message/` que estava no template fornecido)

## Campos removidos do template anterior

O novo template NAO inclui: `numero_noites`, `forma_pagamento`, `status_pagamento` na tabela de detalhes. Esses campos serao removidos da interface do template pois o novo design nao os utiliza.

## Templates de payment_success e payment_error

Permanecem inalterados.

## Arquivo alterado

- `supabase/functions/send-reservation-email/index.ts`

