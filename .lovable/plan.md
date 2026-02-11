

# Correção: Overlay do Hero Interferindo no Banner de Páscoa

## Problema

O mecanismo de esconder o overlay (texto, botões, barra de busca) não está funcionando corretamente durante a transição do carrossel. O texto do hero permanece visível sobre o banner de Páscoa, prejudicando a leitura de ambos.

## Causa Raiz

O array `images` é recriado a cada render dentro do componente `HeroCarousel`, o que pode causar instabilidade na referência usada pelo `useEffect`. Além disso, a transição cross-fade de 1000ms do carrossel cria um período onde ambas as imagens são parcialmente visíveis, mas o overlay ainda está totalmente visível.

## Solução

### 1. `src/components/HeroCarousel.tsx`
- Mover o array `images` para fora do componente (constante estável) para evitar re-criação a cada render
- Garantir que o `onSlideChange` seja chamado de forma confiável

### 2. `src/pages/Index.tsx`
- Acelerar a transição do overlay para `duration-500` (mais rápida que a do carrossel)
- Adicionar `will-change-opacity` para melhor performance da transição
- Garantir que o overlay também esconda a barra de busca mobile abaixo do hero quando o banner estiver ativo

## Detalhes Técnicos

### HeroCarousel.tsx - Images como constante externa

```tsx
// Mover para FORA do componente
const CAROUSEL_IMAGES: CarouselImage[] = [
  { src: heroBungalow1, alt: "...", objectFit: "cover" },
  { src: heroBungalow2, alt: "...", objectFit: "cover" },
  { src: pascoaBanner, alt: "...", objectFit: "contain", backgroundColor: "rgb(30, 58, 140)", hideOverlay: true },
];

const HeroCarousel = ({ onSlideChange }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    onSlideChange?.(CAROUSEL_IMAGES[currentIndex].hideOverlay ?? false);
  }, [currentIndex, onSlideChange]);
  // ...
};
```

### Index.tsx - Transição mais rápida

```tsx
<div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
  hideHeroOverlay ? "opacity-0 pointer-events-none" : "opacity-100"
}`}>
```

## Resultado Esperado

- Quando o carrossel chegar ao banner de Páscoa, o texto/botões/barra de busca desaparecem rapidamente (500ms)
- O banner fica limpo e totalmente legível
- Quando voltar para os slides dos bangalôs, o texto reaparece suavemente

