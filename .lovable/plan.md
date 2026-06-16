## Objetivo
Substituir a silhueta de arara por **folhas caindo** (tema amazônico) e otimizar para reduzir impacto de carregamento e FPS, especialmente em mobile.

## Mudanças

### 1. Renomear `src/components/FlyingMacaw.tsx` → `src/components/FallingLeaves.tsx`
- Remover SVG de arara e animação horizontal.
- Renderizar **4 folhas no desktop / 2 no mobile** (via `useIsMobile`) — número fixo, não dinâmico, para não inflar DOM.
- Cada folha é um SVG inline pequeno (~24×24 viewBox), reutilizando 2 paths de folha simples (formatos diferentes: folha lanceolada e folha oval) via `<defs><symbol>` + `<use>` — só um `<svg>` raiz na página, evitando múltiplas árvores DOM.
- Cores derivadas dos tokens (verde primário e verde-esmeralda), opacidade `0.18` desktop / `0.12` mobile.
- Tamanhos: `14–20px` mobile, `22–32px` desktop.
- Atualizar import em `src/App.tsx`.
- Continuar ocultando em `/admin/*` via `useLocation`.

### 2. `src/index.css` — animações otimizadas
- Remover `@keyframes macaw-fly-across` e `@keyframes macaw-wing-flap` e as classes `.macaw-*`.
- Adicionar **uma única keyframe** `leaf-fall` que combina queda + rotação + leve sway:
  ```
  0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); }
  100% { transform: translate3d(var(--sway, 40px), 110vh, 0) rotate(360deg); }
  ```
- Classe `.leaf` usa `animation: leaf-fall var(--dur) linear infinite; animation-delay: var(--delay);` com `will-change: transform` e `transform: translateZ(0)` para forçar camada GPU.
- Cada folha recebe via `style` inline: `--sway`, `--dur` (18s–32s), `--delay` (negativo, para começar em fase distinta), `left: X%`.
- Manter `@media (prefers-reduced-motion: reduce) { .leaf { animation: none; display: none; } }`.
- Pausar animação quando aba não está visível, via `@media (prefers-reduced-motion)` já cobre; adicionar também `body:not(:focus-within) .leaf` não é confiável — em vez disso, usar `animation-play-state` controlada por classe `.leaves-paused` aplicada via `document.addEventListener('visibilitychange')` no componente.

### 3. Otimizações de performance
- **Sem filtros caros**: remover `drop-shadow` (era custoso em mobile). Substituir por leve `opacity` apenas.
- **SVG inline minimizado**: 2 paths reutilizáveis via `<symbol>`, sem gradientes (cor sólida via `fill="currentColor"`), reduzindo bytes e custo de pintura.
- **GPU-only**: animar apenas `transform` (translate3d + rotate). Nada de `top/left` animados, nada de `filter`, nada de `box-shadow`.
- **Pintura isolada**: wrapper com `contain: layout paint style` + `isolation: isolate`.
- **Mobile-first**: menos folhas (2 vs 4), tamanhos menores, opacidade menor — reduz overdraw.
- **pointer-events-none** + `aria-hidden` mantidos.
- **`prefers-reduced-motion`** desabilita totalmente.
- **Pausa em background tab** via `visibilitychange` listener evita ciclos desnecessários.

### 4. Tokens / breakpoints
- Usar hook existente `src/hooks/use-mobile.tsx` (`useIsMobile`) para decidir contagem/tamanho.
- Cores via classes Tailwind (`text-primary`, `text-secondary`) — sem hardcode.

## Detalhes técnicos
- Sem dependências novas. Sem mudanças em rotas, dados, RLS ou edge functions.
- Tamanho do bundle: o componente novo é menor que o atual (SVG menor, sem gradientes complexos).
- Custo de animação: 2–4 elementos animando apenas `transform` em camada própria = praticamente zero impacto no FPS, mesmo em mobile baixo.

## Fora de escopo
- Sons, parallax, interatividade ao passar o mouse.
- Variações por estação ou geração procedural de novas folhas em runtime.
- Trocar o nome do arquivo via histórico do git (apenas renomear arquivo + atualizar import).