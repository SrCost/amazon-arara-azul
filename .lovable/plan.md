
# Plano: Esconder Texto do Hero Quando o Banner de Pascoa Estiver Ativo

## Problema

O texto do hero ("Viva a Amazonia com Responsabilidade", subtitulo, botoes e barra de busca) fica sobreposto ao banner de Pascoa, tornando ambos ilegiveis.

## Solucao

Expor o estado do slide atual do `HeroCarousel` para o `Index.tsx`, e esconder o overlay de texto com uma transicao suave quando o slide ativo for o banner de Pascoa (que tem `hideOverlay: true`).

## Alteracoes

### 1. `src/components/HeroCarousel.tsx`
- Adicionar prop `onSlideChange?: (hideOverlay: boolean) => void`
- Chamar o callback sempre que `currentIndex` mudar, passando o valor de `images[currentIndex].hideOverlay`

### 2. `src/pages/Index.tsx`
- Criar estado `hideHeroOverlay` (boolean)
- Passar callback `onSlideChange` para `HeroCarousel`
- Envolver o bloco "Content Overlay" (titulo, subtitulo, botoes, SearchBar) em uma transicao de opacidade:
  - `opacity-100` quando slides normais estao ativos
  - `opacity-0 pointer-events-none` quando o banner de Pascoa esta ativo
- Usar `transition-opacity duration-700` para uma transicao suave entre estados

## Detalhes Tecnicos

### HeroCarousel.tsx - Nova prop

```tsx
interface HeroCarouselProps {
  onSlideChange?: (hideOverlay: boolean) => void;
}

const HeroCarousel = ({ onSlideChange }: HeroCarouselProps) => {
  // ... existing code

  useEffect(() => {
    onSlideChange?.(images[currentIndex].hideOverlay ?? false);
  }, [currentIndex, onSlideChange]);
```

### Index.tsx - Estado e transicao

```tsx
const [hideHeroOverlay, setHideHeroOverlay] = useState(false);

<HeroCarousel onSlideChange={setHideHeroOverlay} />

{/* Content Overlay - com transicao */}
<div className={`absolute inset-0 z-10 transition-opacity duration-700 ${
  hideHeroOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
}`}>
```

## Resultado

- Slides dos bangalos: texto, botoes e barra de busca visiveis normalmente
- Slide do banner de Pascoa: texto desaparece suavemente, mostrando o banner limpo
- Transicao suave de 700ms entre os estados
