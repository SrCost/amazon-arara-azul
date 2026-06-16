## Objetivo
Deixar a silhueta de arara realmente visível no fundo do site, mantendo a animação em todas as páginas públicas e ocultando-a em qualquer rota administrativa (`/admin/*`).

## Mudanças

### 1. `src/components/FlyingMacaw.tsx`
- Remover `-z-10` do wrapper (estava atrás do `body`, que tem `bg-background` opaco e escondia o SVG). Usar `z-0` + `isolate`.
- Detectar a rota com `useLocation()` do `react-router-dom`. Se `pathname` começar com `/admin`, retornar `null` (não renderiza).
- Aumentar visibilidade da silhueta:
  - Opacidade: `0.13` → `0.22`.
  - Tamanho: `w-[110px] md:w-[160px]`.
  - Gradiente com mais contraste: verde escuro `hsl(145 63% 18%)` → azul `hsl(200 80% 35%)`.
  - Adicionar `drop-shadow` sutil para destacar do fundo claro.
- Melhorar o SVG: substituir o path atual por uma silhueta de arara reconhecível em voo (corpo + duas asas abertas + cauda longa).
- Adicionar grupo `<g class="wings">` para uma animação leve de bater de asas.

### 2. `src/index.css`
- Manter `macaw-fly-across` (55s linear infinite), porém:
  - Ampliar oscilação vertical (`-40px` ↔ `+25px`) para movimento mais orgânico.
  - Posição inicial: `top-[15vh]` no componente.
- Adicionar `@keyframes macaw-wing-flap` (`scaleY` 1 → 0.85 → 1, ~1.4s ease-in-out infinite) aplicado a `.macaw-wings`.
- Manter o respeito a `prefers-reduced-motion`.

### 3. Sem alterações em `src/App.tsx`
- O componente continua montado uma única vez no topo da árvore; o próprio `FlyingMacaw` decide quando se ocultar via `useLocation`.

## Detalhes técnicos
- `useLocation` está disponível porque `FlyingMacaw` é renderizado dentro do `<BrowserRouter>` em `App.tsx`.
- Stacking: wrapper `fixed inset-0 z-0 isolate pointer-events-none` — fica acima do `body` mas abaixo de qualquer conteúdo em fluxo normal (que naturalmente fica em `z-auto` sobre `z-0`). Seções com background sólido continuam cobrindo o macaw, então ele aparece nos "respiros" da página — comportamento desejado de fundo ambiente.
- Nenhuma mudança em dados, RLS, edge functions, i18n ou lógica de negócio.

## Fora de escopo
- Alterar fundos de seções para deixar o macaw visível por trás delas.
- Adicionar múltiplas araras ou trajetórias variadas.