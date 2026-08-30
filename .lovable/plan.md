# Ajustes: Experiências, Formulários, FNRH, E-mail e Rodapé

Tudo abaixo é adição/ajuste pontual. Nenhum fluxo existente é reescrito.

## 1. /experiencias — remover "Galeria de Momentos" e melhorar o carrossel do topo

- Remover a seção 2 inteira (os 6 cards fixos: Trilhas, Aves, Canoa, Comunidades, Pôr do Sol, Fotografia) de `src/pages/Experiencias.tsx`, junto com o divisor de onda duplicado e os imports/assets que ficam sem uso. O componente `ExperienceCard.tsx` permanece no projeto, apenas deixa de ser usado nessa página.
- Aumentar a altura do herói imersivo ("Experiências Amazônicas") aproveitando o espaço liberado, com alturas responsivas (mobile mais baixo, desktop mais alto) em vez de altura única.
- Corrigir o corte das fotos: enquadramento com foco na parte superior/central da imagem (`object-position` ajustado) para não cortar rostos e silhuetas, e proporção diferente por breakpoint.
- Conferir em desktop, tablet e mobile no preview antes de finalizar.

## 2. /experiencias — carrossel "Experiências exclusivas para contratar"

- **Buraco com número ímpar**: hoje o carrossel monta colunas fixas de 2 cards, então a última coluna fica com um espaço vazio. A montagem passa a distribuir os cards em duas linhas contínuas (linha 1 recebe a primeira metade, linha 2 a segunda), com a última coluna incompleta ocupando a altura normalmente, sem vão visível. Setas, dots, swipe, autoplay e loop continuam iguais.
- **Altura desigual dos cards**: no `ExperienceOfferCard`, o bloco de texto passa a ter altura fixa — título limitado a 2 linhas com "..." e a linha de duração/preço sempre na mesma posição. O nome completo continua visível no modal de detalhe e como `title` no hover.

## 3. Respostas dos formulários — o que existe hoje (verificado)

As respostas **já são salvas**:

- Preparação de chegada (Pré-Chegada) → tabela `pre_arrival_responses` (1 resposta registrada). Já aparece na tela de Reservas via indicador e painel de detalhes.
- Check-in digital → `booking_checkins` (3 registros, com nome, nascimento, nacionalidade, documento, cidade/UF, endereço, transporte, motivo da viagem).
- Feedback de saída → `booking_checkouts` (1 registro, com nota, comentário e problemas).

O que falta é uma visão consolidada: hoje só é possível ver check-in/feedback abrindo reserva por reserva na tela de Automação de Hóspedes.

**Proposta (sem mudança de banco):** nova aba/seção "Formulários" no admin, no mesmo padrão visual da tela de FNRH, com tabela por reserva: hóspede, bangalô, período e três colunas de status (Preparação, Check-in, Feedback) com "Respondido / Pendente", filtro por período e por status, e clique abrindo um painel lateral com todas as respostas do hóspede (incluindo dados de saúde apenas para super admin, como já é a regra atual).

## 4. /admin/fnrh — "Dados incompletos" (investigação concluída)

Verificado no banco de produção:

- As três fichas em `DADOS_INCOMPLETOS` (Florent Rossi x2, Irina Korchagina) são reservas de origem **manual**, e nelas `birth_date`, `nationality`, `genero` e `documento_tipo` estão realmente vazios: o modal de reserva manual do calendário só coleta CPF, nunca data de nascimento nem nacionalidade. Ou seja, nessas reservas o dado nunca foi salvo.
- Em contrapartida, existem reservas do site cujo hóspede **já informou** nascimento, nacionalidade, documento e endereço no check-in digital (`booking_checkins`), e a sincronização da FNRH lê apenas a tabela `reservations` — esses dados existentes estão sendo ignorados.

**Correções propostas (camada de mapeamento primeiro):**

1. Na montagem do payload FNRH, buscar os dados faltantes em cascata: `reservations` → `booking_checkins` (nascimento, nacionalidade, documento, endereço, cidade/UF) → `pre_arrival_responses` (meio de transporte / horário de chegada). Nada de placeholder: se após a cascata ainda faltar, continua bloqueando com mensagem clara, como hoje.
2. Quando um dado for recuperado do check-in digital, gravá-lo também em `reservations` para que a ficha deixe de aparecer como incompleta nas próximas execuções.
3. Reserva manual: acrescentar ao modal de nova/editar reserva os campos que a FNRH exige (data de nascimento, nacionalidade/país, gênero, tipo de documento), como campos opcionais em um bloco "Dados para a ficha FNRH" — sem alterar nada do resto do formulário. Sem isso, reserva manual continuará incompleta por ausência real do dado.

Nenhuma tabela nova e nenhuma alteração de schema neste item.

## 5. E-mail de confirmação — link do pré check-in FNRH

- No template já existente de `reservation_confirmed` (usado tanto pelo fluxo automático quanto pelo manual), incluir um bloco discreto, na identidade visual atual, com texto amigável sobre a exigência do Ministério do Turismo e botão "Fazer meu pré check-in" apontando para o link oficial informado.
- Texto traduzido nos 5 idiomas já suportados. Nenhum e-mail novo é criado e o e-mail separado de pré check-in existente permanece como está.

## 6. Rodapé — guia de pré check-in em PDF

- Publicar o PDF enviado ("Manual de Pré Check-in do Hóspede") junto aos demais documentos públicos e adicionar o link "Como fazer o Pré Check-in (FNRH)" na mesma lista de Política de Privacidade / Termos / Cancelamento, abrindo em nova aba, com rótulo traduzido nos 5 idiomas.

## Detalhes técnicos

- Frontend: `src/pages/Experiencias.tsx`, `src/components/experiences/ImmersiveHero.tsx`, `ExperiencesCarousel.tsx`, `ExperienceOfferCard.tsx`, `src/components/Footer.tsx`, arquivos de i18n.
- Admin: nova tela `src/pages/admin/Formularios.tsx` (rota `/admin/formularios` + item de menu), reaproveitando `PreArrivalDetails` e as consultas já usadas em `GuestAutomation`.
- FNRH: `supabase/functions/_shared/fnrh-reserva.ts` (cascata de fallback + preenchimento retroativo) e campos extras em `NewReservationModal`/`EditReservationModal`.
- E-mail: `supabase/functions/send-reservation-email/index.ts`, apenas no tipo `reservation_confirmed`.
- Validação em preview (desktop/tablet/mobile) e reprocessamento de uma ficha FNRH antes de publicar.
