

# Correcao do Banner Mobile e Tablet

## Problemas Identificados

1. **Mobile**: a imagem mobile esta usando `object-cover`, o que corta partes importantes do banner
2. **Tablet** (768px-1023px): o breakpoint atual e `sm:` (640px), entao tablets recebem a versao desktop com `object-contain` e preenchimento azul liso

## Solucao

### 1. Trocar breakpoint de `sm:` para `lg:` (1024px)

Seguindo o padrao ja estabelecido no projeto (tablets usam layout mobile), a imagem mobile sera exibida ate 1023px. Apenas a partir de 1024px (desktop) a versao panoramica sera usada.

### 2. Usar `object-contain` + blur de fundo no mobile/tablet

Em vez de `object-cover` (que corta), a imagem mobile usara `object-contain` para mostrar o conteudo completo. O espaco restante sera preenchido com o efeito de blur (mesma tecnica implementada anteriormente):

- Camada de fundo: imagem com `object-cover`, `blur-2xl`, `scale-110`, `opacity-80`
- Camada principal: imagem com `object-contain` (nitida e completa)
- Ambas visiveis apenas ate `lg:` (mobile + tablet)

## Alteracao Tecnica

### `src/components/HeroCarousel.tsx`

Dentro do bloco `image.mobileSrc`, alterar de:

```tsx
<img src={image.mobileSrc} className="... object-cover sm:hidden" />
<img src={image.src} className="... object-contain hidden sm:block" />
```

Para:

```tsx
{/* Blur background - mobile/tablet only */}
<img src={image.mobileSrc} aria-hidden="true"
     className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-80 lg:hidden" />
{/* Sharp mobile image - mobile/tablet only */}
<img src={image.mobileSrc} className="absolute inset-0 w-full h-full object-contain lg:hidden" />
{/* Desktop image */}
<img src={image.src} className="absolute inset-0 w-full h-full object-contain hidden lg:block" />
```

## Resultado Esperado

- **Mobile**: banner completo sem corte, fundo preenchido com blur suave da propria imagem
- **Tablet**: mesmo tratamento do mobile, sem preenchimento azul liso
- **Desktop** (1024px+): banner panoramico com `object-contain` e fundo azul (sem mudanca)

