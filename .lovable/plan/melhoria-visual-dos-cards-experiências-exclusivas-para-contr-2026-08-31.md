# Melhoria visual dos cards — "Experiências exclusivas para contratar"

Objetivo: fazer os cards do carrossel em `/experiencias` parecerem produtos contratáveis, com hover animado, CTA e preço, sem alterar estrutura de dados nem outras seções.

## Contexto atual (confirmado)
- `ExperienceOfferCard.tsx`: card com imagem, badge de categoria, título (line-clamp 2) e duração. Clique abre `ExperienceDetailModal` via `onSelect` em `Experiencias.tsx`.
- `ExperiencesCarousel.tsx`: loop infinito com 3 blocos clonados, drag com mouse e supressão de clique após arraste (`onClickCapture`).
- Preço existe: `experience.base_price_per_person` (por pessoa).

## Mudanças (apenas `ExperienceOfferCard.tsx` + traduções)

1. **Animação de hover/seleção**
   - Imagem com `group-hover:scale-[1.06]` e transição de 300ms ease (já existe scale-105/500ms — ajustar para o padrão pedido).
   - Card "levanta": `-translate-y-1` + sombra mais forte no hover (já parcialmente existe; reforçar com `hover:shadow-strong` mantido e transição de 300ms).
   - Manter `overflow-hidden` no container da imagem (já presente) e `motion-reduce` para acessibilidade.

2. **CTA "Contratar" com seta**
   - Rodapé do card: botão/link visual "Contratar" com ícone `ArrowRight`, alinhado à base do card.
   - Desktop: sempre visível mas discreto, ganhando destaque (cor/translate da seta) no hover — mais consistente com o site do que fade-in oculto, e evita conteúdo inacessível.
   - Mobile/tablet: sempre visível (mesma renderização — não depende de hover).
   - Ação: mesma de hoje — o card inteiro já é um botão que abre o modal de detalhe/contratação; o CTA é visual dentro do card (sem botão aninhado, para não quebrar a11y nem a supressão de clique do drag).

3. **Preço "A partir de R$ X"**
   - Exibir `A partir de R$ {base_price_per_person}` (formatado `pt-BR`, sem centavos) entre a duração e o CTA, quando o valor for > 0.

4. **Acabamento**
   - Manter line-clamp de 2 linhas, altura fixa do título e `overflow-hidden` existentes.
   - Badges de categoria inalterados.
   - Alturas flexíveis: título fixo, duração fixa, preço com altura reservada (linha sempre presente, vazia se sem preço) para alinhar os CTAs entre cards.

5. **Traduções**
   - Adicionar chave `experiences.hireCta` ("Contratar" / "Book" / "Reservar" / "Réserver") e `experiences.priceFrom` ("A partir de") em pt, en, es, fr (e de, que já existe no projeto).

## Compatibilidade com o carrossel
- Nenhuma alteração em `ExperiencesCarousel.tsx`: o CTA é parte do card-botão, então o drag do mouse (com supressão de clique via `clickCapture`) e o swipe nativo por toque continuam funcionando sem competir com o gesto.

## Validação
- Typecheck.
- Playwright: desktop (hover com zoom + sombra + CTA), tablet e mobile (CTA visível, swipe horizontal do carrossel funcionando, clique abre modal), sem erros de console.

## Fora de escopo
- Estrutura de dados, modal de detalhe, outras seções da página e o carrossel em si.
