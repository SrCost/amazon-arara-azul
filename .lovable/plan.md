# Plano: Melhorias visuais (Galeria + Background Amazônia)

## 1. Galeria animada em /experiencias

**Arquivo: `src/pages/Experiencias.tsx`**
- Na Full Gallery, envolver cada `<div>` da foto com animação de entrada via IntersectionObserver (hook novo `useInViewAnimation`) que adiciona classe `animate-fade-in` + translateY com `delay` escalonado (index * 80ms).
- Hover: adicionar overlay escuro (`bg-black/0 group-hover:bg-black/40 transition`) + ícone `Search` (lupa, lucide-react) centralizado aparecendo no hover (`opacity-0 group-hover:opacity-100`). Manter `group-hover:scale-105` já existente.
- Aplicar o mesmo tratamento à Preview Gallery (mobile).
- Grid 2 col mobile / 3 col desktop já existente — preservado.

**Arquivo: `src/components/Lightbox.tsx`** (já existe, já tem prev/next/close/teclado)
- Sem mudanças funcionais. Apenas garantir uso consistente.

**Novo: `src/hooks/useInViewAnimation.ts`**
- Hook simples com IntersectionObserver retornando `ref` + `isInView` para disparar animações ao rolar.

**`tailwind.config.ts`**
- Já há `fade-in`. Adicionar keyframe `slide-up-fade` (translateY 20px → 0 + opacity 0 → 1, 600ms ease-out) se necessário.

## 2. Background animado — Arara voando

**Novo: `src/components/FlyingMacaw.tsx`**
- Componente fixo (`fixed inset-0 pointer-events-none -z-10 overflow-hidden`) com SVG inline de silhueta de arara estilizada (asas em pose de voo).
- Cor: gradiente do verde primário (`hsl(var(--primary))`) ao azul/accent existente. Opacidade 0.12.
- Animação CSS `@keyframes fly-across`: translateX de 110vw → -20vw, com leve oscilação vertical (translateY senoidal via keyframes intermediários) e rotação sutil das asas. Duração ~45s, `infinite linear`.
- Tamanho ~80px (mobile) / 120px (desktop).

**`src/index.css`**
- Adicionar keyframes `fly-across` com waypoints em 0%, 25%, 50%, 75%, 100% para movimento orgânico (não puramente reto).

**`src/App.tsx`**
- Montar `<FlyingMacaw />` uma vez no topo da árvore (todas as páginas), antes das rotas. Performance: apenas transform/opacity (GPU), sem reflow, sem JS no loop.

## Detalhes técnicos
- IntersectionObserver com `threshold: 0.15`, `triggerOnce: true` para não re-animar no scroll up.
- Lightbox já gerencia `body.overflow = hidden` e teclas — sem retrabalho.
- Arara: respeitar `prefers-reduced-motion` (pausar animação via media query no CSS).
- Sem novas dependências.

## Escopo fora
- Sem mudanças em outras páginas além de injetar o background global.
- Sem alteração nos dados/RLS/edge functions.
- Sem novas traduções (ícone de lupa é puramente visual; manter `aria-label` traduzido reusando chave existente `experiences.viewPhoto` — criar nas 5 línguas se inexistente).
