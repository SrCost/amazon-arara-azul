# Carrossel de scroll horizontal contínuo em /experiencias

## Objetivo
Substituir o carrossel paginado atual (Embla, duas fileiras, autoplay, dots) da seção "Experiências exclusivas para contratar" por um carrossel de **scroll horizontal contínuo**, com drag/swipe livre e sem paginação.

## Mudanças

### 1. `ExperiencesCarousel.tsx` — reescrita do componente
- Remover Embla/Autoplay, a divisão em colunas de 2 cards, os dots e o `selectedIndex`.
- Nova estrutura: um contêiner `overflow-x-auto` com `flex` em **uma única fileira**:
  - Cards com largura fixa já existente no card (`w-[210px] sm:w-[240px] lg:w-[270px]`, variant `fixed`) e `snap-start`.
  - Scroll nativo com `overflow-x-auto` + `snap-x snap-mandatory` suave → drag/swipe livre em mouse e touch, sem travar a rolagem vertical da página (o gesto horizontal só é capturado quando o usuário arrasta na horizontal).
  - Scrollbar oculta via utilitário CSS (`scrollbar-hide` inline) para manter o visual limpo.
- Setas laterais (visíveis em `lg`, mesmo estilo visual atual — círculo `bg-card` com borda e sombra) que chamam `scrollBy({ left: ±larguraVisível, behavior: "smooth" })`, dando o deslize suave.
- Setas desabilitam/escondem nas extremidades conforme `scrollLeft` (opcional: fade quando não há mais conteúdo).
- **Nenhuma lógica de preenchimento de espaço vazio**: remover `fillHeight` e o pareamento — com número ímpar de itens não há mais buraco possível.

### 2. `ExperienceOfferCard.tsx` — padronização do texto (já quase pronto)
- Confirmar/manter: título `line-clamp-2` com altura fixa `h-[2.6em]` e tooltip (`title`), linha de duração com altura fixa `h-5`, ícone de categoria no badge sempre no topo-esquerdo da imagem.
- Remover o prop `fillHeight` (não mais necessário) e simplificar `variant` para usar apenas a largura fixa com `snap-start`.
- Ajustar larguras se necessário para aproximar de ~260px no desktop (hoje 270px em `lg`).

### 3. Escopo preservado
- Nenhuma alteração em dados (`useExperiences`), modal de detalhe, badges de categoria, outras seções da página (hero, galeria) ou demais páginas.
- `Experiencias.tsx` continua chamando `<ExperiencesCarousel experiences={offers} onSelect={setSelectedExperience} />` — mesma interface.

## Verificação
- Typecheck/build.
- Playwright em desktop (1280px), tablet (~768px) e mobile (~390px): conferir fileira única, swipe horizontal funcional, rolagem vertical da página não bloqueada, setas deslizando suavemente, títulos longos com "..." e duração alinhada entre cards.
