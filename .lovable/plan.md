

# Correcoes: Precos, Preview de Email e Logo

## Problemas Identificados

### 1. Diaria salva incorretamente no banco
No `EditReservationModal`, linha 252, o campo `daily_rate` salva `data.daily_rate` que e a **tarifa base do quarto** (ex: R$ 1.499,96), e nao a diaria efetiva calculada com multiplicador de hospedes ou sobrescrita manual (ex: R$ 2.393,94). Isso faz com que ao reabrir a reserva, os valores aparecam diferentes do que foi inserido.

**Correcao**: Salvar `dailyRate` (que ja considera override manual e calculo com multiplicador) em vez de `data.daily_rate`.

### 2. Email com dados errados + sem preview
Dois sub-problemas:
- A edge function busca os dados do banco (`total_price`, `room_name`, etc.) - se o admin acabou de editar e salvou corretamente, os dados estarao corretos. Porem, o botao "Enviar Email" nao exige que o admin salve antes, podendo enviar dados desatualizados.
- A edge function tem um **bloqueio de idempotencia** (linhas 564-584) que impede reenvio se ja houve um email do mesmo tipo para a mesma reserva. Isso impede o admin de reenviar apos corrigir valores.
- Nao ha preview do conteudo do email antes do envio.

**Correcao**:
- Adicionar um dialog de **preview** ao clicar em "Enviar Email" mostrando: nome, bangalo, check-in, check-out, hospedes, valor total
- O preview usa os dados **salvos no formulario atual**, alertando se houver alteracoes nao salvas
- Adicionar parametro `force: true` na chamada da edge function para reservas manuais, permitindo bypass da idempotencia
- Atualizar a edge function para aceitar o parametro `force` que ignora a verificacao de duplicidade

### 3. Logo quebrada no email
O `LOGO_URL` na edge function aponta para `gallery/logo-arara-azul.png` no storage, mas esse arquivo **nao existe** no bucket. O logo existe apenas em `src/assets/logo-arara-azul.png` (arquivo local do build).

**Correcao**: Fazer upload do logo para o bucket `gallery` do storage via codigo na edge function ou instrucao ao admin. A abordagem mais simples e usar uma URL publica confiavel. Vamos criar um script/endpoint para fazer upload do logo, ou instruir para upload manual. A melhor solucao tecnica: alterar a URL do logo para apontar para o favicon ou usar uma imagem hospedada externamente. Como temos o arquivo `src/assets/logo-arara-azul.png` no projeto, vamos adicionar logica no admin para fazer upload automatico do logo ao bucket se nao existir.

---

## Alteracoes Detalhadas

### Arquivo: `src/components/admin/calendar/EditReservationModal.tsx`

1. **Corrigir `daily_rate` no update** (linha 252):
   - Trocar `daily_rate: data.daily_rate` por `daily_rate: dailyRate` para salvar o valor efetivo (com multiplicador ou override manual)

2. **Adicionar dialog de preview antes de enviar email**:
   - Novo estado `showEmailPreview` (boolean)
   - Ao clicar "Enviar Email", abre um `AlertDialog` mostrando os dados que serao enviados:
     - Nome do hospede
     - Email destino
     - Bangalo
     - Check-in / Check-out
     - Hospedes
     - Valor total
   - Aviso se existem alteracoes nao salvas (comparar form values com reservation original)
   - Botao "Confirmar Envio" que chama `handleSendEmail` com `force: true`

3. **Atualizar `handleSendEmail`** para enviar `force: true` no body

### Arquivo: `supabase/functions/send-reservation-email/index.ts`

1. **Aceitar parametro `force`** no `EmailRequest` interface
2. **Condicionar o bloqueio de idempotencia**: se `force === true`, pular a verificacao de email duplicado (linhas 564-584)
3. **Corrigir LOGO_URL**: Usar URL do favicon publico (`https://pousada-arara-azul.lovable.app/favicon.ico`) como fallback temporario, ou melhor, fazer upload do logo ao bucket gallery e manter a URL atual

### Upload do Logo ao Storage

Para resolver o logo quebrado de forma permanente:
- Adicionar no `HeroCarousel` admin (ou criar utilitario) uma funcao que faz upload do `logo-arara-azul.png` ao bucket `gallery` se o arquivo nao existir
- Alternativa mais simples: na edge function, usar uma URL de imagem hospedada externamente (ex: URL do site publicado) como `https://pousada-arara-azul.lovable.app/favicon.ico`
- A melhor opcao: criar uma pequena funcao na pagina admin que verifica e faz upload do logo ao bucket, garantindo que o `LOGO_URL` na edge function funcione

---

## Resumo dos Arquivos

1. **`src/components/admin/calendar/EditReservationModal.tsx`** - Corrigir daily_rate no save + adicionar preview de email
2. **`supabase/functions/send-reservation-email/index.ts`** - Aceitar `force` param + corrigir logo URL
3. **Novo utilitario ou script** - Upload do logo ao bucket gallery (pode ser integrado ao admin)

