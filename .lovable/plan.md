# Redesign /experiencias — Imersão Amazônica

Reformulação visual completa da página `src/pages/Experiencias.tsx` em 3 seções encadeadas, mantendo conteúdo, fotos, cards, traduções e Lightbox existentes. Apenas layout/animação/visual mudam. Tokens semânticos do projeto (verde-floresta, primary) serão reutilizados; nada hardcoded fora os tons profundos de fundo para slides.

## 1. Hero Imersivo (substitui hero + preview)

Slider fullwidth de 400px (320px mobile) com as **4 primeiras fotos** de `galleryImages`.

- Container com `perspective: 1200px`; slide interno com `rotateX/Y` reagindo à posição do mouse (tilt 3D suave, ease-out).
- Background paralaxe: imagem com `translateX/Y` proporcional ao mouse (`mousemove` no container, intensidade ~12px).
- Cursor personalizado: div fixo seguindo o cursor, `border: 2px solid white`, mix-blend-mode difference, ocultado em touch.
- Swipe touch (touchstart/move/end) + drag mouse (pointer events) para trocar slide.
- Autoplay 5,5s com `setInterval`, pausado em hover/interação/drag e retomado após 8s ocioso.
- Dots animados na parte inferior: dot ativo expande para barra (`width: 32px` com transição).
- Tira de thumbnails abaixo do hero (4 miniaturas 64x40), thumbnail ativa com `border-2 border-primary` e leve scale.
- Cada slide:
  - Background colorido profundo amazônico rotativo: verde-negro, âmbar-escuro, azul-água, verde-musgo (definidos via CSS var por slide).
  - Imagem em `object-cover` com `mix-blend-mode: luminosity` opcional para integrar à cor.
  - Gradiente vignette de baixo para cima (`from-black/70 via-black/20 to-transparent`).
  - Tag de categoria flutuante: `bg-[rgba(45,106,79,0.12)] text-[#0F6E56] backdrop-blur` border sutil.
  - Título display + descrição curta sobrepostos no canto inferior esquerdo, com animação fade-up ao trocar slide.

Mantém `h1` e `subtitle` atuais (de `t("experiences.title/subtitle")`) acima do slider, mas mais compactos.

## 2. Cards de Experiências

Grid `grid-cols-2 lg:grid-cols-3` com os 6 cards existentes (preserva `experiences[]` e ícones lucide).

- Reestrutura cada card: imagem no topo (usar imagem da galeria correspondente por índice, fallback gradiente forest + ícone grande), tag de categoria verde (`bg-[rgba(45,106,79,0.12)] text-primary`), título display, descrição curta.
- Hover: `translateY(-4px)` + sombra forte, transição 300ms. Imagem com leve `scale-105`.
- Clique abre o `Lightbox` no índice correspondente (reuso da galeria).
- Stagger fade-in via `useInViewAnimation` (já existente).

## 3. Galeria Completa — grade irregular

Mantém id `gallery-full` e botão de scroll.

- Grid CSS irregular: `grid-cols-2 lg:grid-cols-4` com `grid-auto-rows: 200px`. Itens nas posições `0, 3, 6, 9...` recebem `lg:col-span-2` (algumas fotos span 2 colunas), gerando ritmo visual.
- Hover overlay escuro `bg-black/45` + ícone `Search` ampliado (reusa o `GalleryItem` adaptado).
- Clique abre Lightbox (já existente) com animação `animate-scale-in` (já no projeto).

## Divisores SVG em ondas

Componente novo `src/components/WaveDivider.tsx`:
- SVG inline path de onda fluida, `fill="#2d6a4f"`, `opacity: 0.35`.
- Variantes `top` e `bottom` (flip via `transform: scaleY(-1)`).
- Aplicado entre Hero ↔ Cards e Cards ↔ Galeria.

## Arquivos afetados

- **Editar** `src/pages/Experiencias.tsx` — nova composição das 3 seções, mantendo dados/traduções/Lightbox.
- **Criar** `src/components/experiences/ImmersiveHero.tsx` — slider 3D, paralaxe, cursor, swipe, autoplay, dots, thumbs.
- **Criar** `src/components/experiences/ExperienceCard.tsx` — card visual (imagem + tag + título + descrição + hover lift).
- **Criar** `src/components/experiences/IrregularGallery.tsx` — grid irregular com span variável.
- **Criar** `src/components/WaveDivider.tsx` — divisor SVG de onda.
- **Editar** `src/index.css` — keyframes auxiliares (`slide-fade-up`, `dot-expand`) e classe `.amazon-cursor` se necessário; tokens de cores de slide via CSS vars.

## Fora de escopo

- Não alterar traduções, conteúdo, `useGalleryImages`, `Lightbox`, Navigation/Footer.
- Não tocar em outras páginas, nem nas folhas caindo (`FallingLeaves`).
- Sem novas dependências (sem framer-motion novo se não estiver instalado — usar CSS transitions/transforms puros).
- Cursor personalizado e tilt 3D desativados em dispositivos touch / `prefers-reduced-motion`.
