

# Banner de Páscoa com Imagem Dedicada para Mobile

## Problema

O banner de Páscoa atual é panorâmico (horizontal), o que não se adapta bem ao formato vertical do hero no mobile. Em vez de usar efeitos de blur ou corte, o usuário forneceu uma versão vertical do banner otimizada para mobile.

## Solução

Adicionar suporte a uma imagem alternativa para mobile no carrossel, usando a imagem vertical fornecida no mobile e mantendo o banner panorâmico no desktop.

## Alterações

### 1. Copiar a imagem para o projeto
- Copiar `user-uploads://image-14.png` para `src/assets/pascoa-pacote-banner-mobile.png`

### 2. `src/components/HeroCarousel.tsx`

- Adicionar campo `mobileSrc` opcional na interface `CarouselImage`
- Configurar o slide do banner de Páscoa com `mobileSrc` apontando para a imagem vertical
- Renderizar duas tags `<img>` quando `mobileSrc` existir: uma visível apenas no mobile (`sm:hidden`) e outra apenas no desktop (`hidden sm:block`)
- Remover a camada de blur (não será mais necessária)

```tsx
interface CarouselImage {
  src: string;
  mobileSrc?: string;  // novo campo
  alt: string;
  objectFit: "cover" | "contain";
  backgroundColor?: string;
  hideOverlay?: boolean;
}

const CAROUSEL_IMAGES: CarouselImage[] = [
  { src: heroBungalow1, alt: "...", objectFit: "cover" },
  { src: heroBungalow2, alt: "...", objectFit: "cover" },
  { 
    src: pascoaBanner, 
    mobileSrc: pascoaBannerMobile,  // imagem vertical
    alt: "Pacote Páscoa", 
    objectFit: "contain", 
    backgroundColor: "rgb(30, 58, 140)", 
    hideOverlay: true 
  },
];
```

Na renderização, quando `mobileSrc` existir:
- Imagem mobile: `object-cover sm:hidden`
- Imagem desktop: `hidden sm:block object-contain`
- Quando não tiver `mobileSrc`: comportamento atual sem mudança

## Resultado Esperado

- **Mobile**: banner vertical preenche o hero perfeitamente, sem corte, sem blur, sem preenchimento
- **Desktop**: banner panorâmico exibido normalmente com `object-contain` e fundo azul
