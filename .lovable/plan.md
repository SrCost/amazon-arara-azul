## Objetivo
Substituir, apenas na homepage (`src/pages/Index.tsx`), a grade de bangalôs por um carrossel novo e isolado, sem tocar em dados, hooks, rotas ou no `LodgeCard` usado em outras páginas.

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/home/BungalowCarousel.tsx` | Criar |
| `src/pages/Index.tsx` | Substituir apenas o bloco `<div className="grid ...">{lodges.map(...)}</div>` por `<BungalowCarousel lodges={lodges} />` |

Nada mais é tocado (título da seção, estados `loading`/vazio, CTAs, features, etc. permanecem).

## Novo componente: `BungalowCarousel`

Props:
```ts
interface BungalowCarouselProps {
  lodges: Array<{
    id: string; slug: string; name: string; location: string;
    image?: string; guests: number; description: string;
    amenities: string[]; // preço existe nos dados mas NÃO é renderizado
  }>;
}
```

### Card interno (definido dentro do arquivo, sem reutilizar `LodgeCard`)
- Imagem topo, `aspect-[4/3]`, `object-cover`, `rounded-t-xl`.
- Badge de localização abaixo da imagem: ícone `MapPin` + texto (`text-muted-foreground`, pequeno).
- Nome: `font-display font-bold text-lg lg:text-xl`.
- Descrição: `line-clamp-2 text-sm text-muted-foreground`.
- Linha de ícones: `Users` + nº hóspedes, `Wifi` se estiver em `amenities`.
- Botão largura total, `bg-gradient-forest` (verde do projeto), ícone `Calendar` à esquerda, texto `t("home.checkAvailability")`, link `/bangalos/{slug}`.
- **Sem preço.**

### Carrossel
- Usa a lib já instalada `embla-carousel-react` + `embla-carousel-autoplay` (adicionar apenas o plugin de autoplay se ainda não estiver — verificar; se não estiver, implementar autoplay manual com `useEffect` + `setInterval` sobre `emblaApi.scrollNext()` para não adicionar dependência).
- Opções Embla: `loop: true`, `align: "start"`, `dragFree: false`.
- Breakpoints via classes Tailwind nas slides:
  - Mobile `<640px`: `flex-[0_0_85%]` (1 card, peek ~10% de cada lado através de padding no container `px-[7.5%]`).
  - Tablet `640–1023`: `sm:flex-[0_0_50%]` (2 cards).
  - Desktop `≥1024`: `lg:flex-[0_0_33.3333%]` (3 cards).
  - Gap entre slides via `pl-4` nas slides e `-ml-4` no container (padrão Embla).
- Autoplay:
  - Intervalo 4s via `useEffect` com `setInterval` chamando `emblaApi?.scrollNext()`.
  - Estado `isPaused`; handlers `onMouseEnter`/`onMouseLeave` e `onTouchStart`/`onTouchEnd` no wrapper alternam pausa.
  - Se `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, não iniciar o intervalo.
  - `clearInterval` no cleanup.
- Transição: default do Embla (~300ms ease).
- Navegação:
  - Setas prev/next: botões absolutos laterais, `hidden md:flex`, `aria-label="Anterior"/"Próximo"`, chamam `emblaApi.scrollPrev()/scrollNext()`.
  - Dots: renderizados a partir de `emblaApi.scrollSnapList()`, sempre visíveis, dot ativo `bg-primary`, inativos `bg-muted-foreground/40`, `aria-label={`Ir para bangalô ${i+1}`}`.
- Touch/swipe: nativo do Embla (drag habilitado por padrão).

## Integração em `Index.tsx`
Substituir somente este trecho:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
  {lodges.map((lodge) => (<LodgeCard key={lodge.id} {...lodge} />))}
</div>
```
por:
```tsx
<div className="mb-6 sm:mb-8">
  <BungalowCarousel lodges={lodges} />
</div>
```
Import adicionado no topo. Estados `loading` e "sem bangalôs" continuam iguais.

## Fora de escopo
- `LodgeCard` original, página `/bangalos`, hooks, i18n keys novas (reutilizar `home.checkAvailability`, `common.people`, `lodgeDetail.location`), fonte de dados, preço em outras telas.