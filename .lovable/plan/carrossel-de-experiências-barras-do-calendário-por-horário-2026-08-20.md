# Carrossel de Experiências + Barras do calendário por horário

## 1. Página /experiencias — carrossel único em duas linhas

- Remover a divisão por categorias na seção "Experiências exclusivas": todas as experiências ativas passam a alimentar um único carrossel.
- Distribuir os cards em **duas linhas** dentro do mesmo carrossel (linha 1 = itens ímpares, linha 2 = itens pares), mantendo a ordem de `display_order`.
- **Autoplay** contínuo (~4s por avanço), com loop infinito, pausa ao passar o mouse / ao focar por teclado e respeito a `prefers-reduced-motion`.
- Animação suave de transição, setas em desktop, arraste/swipe em mobile e indicadores (dots) discretos.
- Card mantém o formato atual (4:3, badge de categoria, nome, duração) e continua abrindo o modal de detalhes ao clicar.
- Responsivo: 1,2 cards visíveis em mobile, 2 em tablet, 3–4 em desktop, por linha.

## 2. /admin/calendario-reservas — barras proporcionais ao horário

Hoje a barra ocupa a célula inteira do dia de check-in e do dia de check-out. Quando uma reserva termina no mesmo dia em que outra começa, as duas barras dividem a mesma coluna e ficam sobrepostas.

Ajuste de visualização (somente apresentação, sem alterar dados):

- A barra passa a começar no **meio da coluna do check-in** e terminar no **meio da coluna do check-out**, refletindo entrada à tarde e saída pela manhã.
- Assim, no dia de virada, a reserva que sai ocupa a metade esquerda da célula e a que entra ocupa a metade direita — sem sobreposição e sem confusão visual.
- Reservas que começam antes ou terminam depois do mês exibido continuam sendo cortadas nas bordas (barra "cheia" até a borda).
- Se ainda houver sobreposição real de datas no mesmo bangalô (conflito), as barras são empilhadas em faixas (lanes) dentro da linha, com a altura da linha crescendo conforme necessário, para que nenhuma fique escondida atrás da outra.
- Bloqueios seguem a mesma regra de meio-dia, mantendo a coerência visual com as reservas.
- Tooltip, cores por status, clique para editar e o modo arrastar continuam funcionando como hoje (o drop continua atribuindo a data da célula sob o cursor).

## Detalhes técnicos

- `src/pages/Experiencias.tsx`: remover o agrupamento por categoria (`offerGroups`) e renderizar um novo componente `ExperiencesCarousel`.
- Novo `src/components/experiences/ExperiencesCarousel.tsx` usando `embla-carousel-react` (já no projeto) + plugin de autoplay; duas trilhas sincronizadas em um único container de slides (cada slide contém dois cards empilhados) para garantir autoplay único e alinhamento das linhas.
- `ExperienceCategoryRow.tsx` deixa de ser usado na página pública (removido).
- `src/components/admin/calendar/CalendarGrid.tsx`: `getReservationPosition` passa a devolver, além de `startCol`/`span`, offsets percentuais de início/fim (50% quando a borda é real, 0% quando cortada pela borda do mês) e um índice de lane calculado por bangalô.
- `DraggableReservationBlock.tsx` e `BlockedBlock.tsx`: aplicar os offsets via `left`/`right` em % (com `calc`) e posicionar verticalmente pela lane; conteúdo interno já se adapta ao span.
