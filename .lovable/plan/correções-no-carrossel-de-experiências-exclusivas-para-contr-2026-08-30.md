# Correções no carrossel de "Experiências exclusivas para contratar"

## 1. Título contido dentro do card

No card de experiência:
- Garantir `overflow: hidden` no container do card e no bloco de texto.
- Aplicar altura fixa de 2 linhas (~44-48px) no título com truncamento por `-webkit-line-clamp: 2` + `text-overflow: ellipsis`.
- Adicionar quebra de palavras (`break-words` / `overflow-wrap: anywhere`) e `min-w-0` no wrapper flex, para que nomes longos como "Cachoeira do Arara + Almoço Ribeirinho" e "Doce Amazônico - Oficina de Sabores da Floresta" nunca ultrapassem a largura do card.
- Manter ícone de duração sempre na mesma posição (altura fixa já existente).

## 2. Loop infinito nos dois sentidos

Transformar o scroll horizontal atual em loop verdadeiro:
- Renderizar a lista de cards três vezes (bloco anterior, bloco central, bloco seguinte) e posicionar o scroll inicialmente no bloco central.
- Durante o scroll/arraste, quando o usuário passa do limite do bloco central, reposicionar `scrollLeft` em ±largura de um bloco sem animação — o conteúdo é idêntico, então o salto é imperceptível.
- Setas passam a sempre estar disponíveis (não há mais início/fim) e continuam deslizando com transição suave; após a animação, o reposicionamento do loop é aplicado.
- Desativar `snap-mandatory` (que atrapalha o reposicionamento) mantendo o arraste livre por toque e mouse.
- Cards duplicados recebem `aria-hidden` para não duplicar a leitura por leitores de tela.

## Testes
- Verificar em desktop, tablet e mobile (Playwright): títulos longos contidos no card, arraste contínuo em ambos os sentidos sem "bater" no fim, setas funcionando, rolagem vertical da página não travada e nenhum erro de console.

## Detalhes técnicos
- Arquivos afetados: `src/components/experiences/ExperienceOfferCard.tsx` e `src/components/experiences/ExperiencesCarousel.tsx`.
- Sem alteração na estrutura de dados das experiências nem em outras seções da página.
