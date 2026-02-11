

# Efeito Blur de Fundo para Banner no Mobile

## Problema

Com `object-cover` no mobile, o banner fica muito cortado e perde informacao importante. Com `object-contain`, sobra espaco azul liso que nao fica agradavel.

## Solucao

Usar uma tecnica de "blurred background" no mobile: renderizar a mesma imagem do banner duas vezes em camadas sobrepostas:

1. **Camada de fundo**: a imagem com `object-cover`, escala ampliada e `blur` forte -- preenche todo o espaco com uma versao desfocada e colorida do banner
2. **Camada principal**: a imagem com `object-contain` por cima, mostrando o banner completo e nitido

No desktop (a partir de `sm:`), mantemos o comportamento atual com `object-contain` e fundo azul solido.

## Resultado Visual

- **Mobile**: fundo preenchido com uma versao desfocada/colorida do proprio banner, sem faixas lisas. A imagem principal aparece centralizada e completa
- **Desktop**: sem mudanca, banner exibido inteiramente com fundo azul

## Alteracao Tecnica

### `src/components/HeroCarousel.tsx`

Para slides com `objectFit: "contain"`, renderizar duas tags `<img>`:

```tsx
{image.objectFit === "contain" && (
  <img
    src={image.src}
    alt=""
    aria-hidden="true"
    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-80 sm:hidden"
  />
)}
<img
  src={image.src}
  alt={image.alt}
  className={`absolute inset-0 w-full h-full ${
    image.objectFit === "cover"
      ? "object-cover"
      : "object-contain"
  }`}
/>
```

A camada de blur usa:
- `object-cover` para preencher todo o espaco
- `scale-110` para evitar bordas transparentes do blur
- `blur-2xl` para desfocar bastante (efeito minimalista)
- `opacity-80` para suavizar
- `sm:hidden` para mostrar apenas no mobile

No mobile, a imagem principal volta a usar `object-contain` (nao mais `object-cover`), pois o fundo desfocado ja resolve o problema do espaco vazio.

