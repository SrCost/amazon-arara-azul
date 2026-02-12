

# Substituir Imagem Mobile/Tablet do Banner de Pascoa (1080x1080)

## Problema

As imagens anteriores (formato story 9:16) eram muito altas para o container do hero, resultando em corte excessivo mesmo com `object-top`.

## Nova Imagem

A imagem enviada tem dimensoes 1080x1080 (quadrada), que se encaixa muito melhor no container do hero (que tem proporcao mais larga que alta). Com uma imagem quadrada, o corte sera minimo ou inexistente.

## Solucao

### 1. Substituir o asset

Copiar `user-uploads://Captura_de_tela_2026-02-12_092611_1.jpg` para `src/assets/pascoa-pacote-banner-mobile.png`, substituindo a versao anterior.

### 2. Ajustar posicionamento para `object-center`

Como a imagem agora e quadrada (1080x1080), o conteudo esta distribuido de forma mais uniforme. Trocar `object-top` por `object-[center_top]` ou manter `object-top` pode cortar a parte inferior desnecessariamente. Com uma imagem quadrada, `object-cover` com posicionamento centralizado (`object-center`) ou levemente para cima (`object-[20%]`) pode funcionar melhor, ja que o logo esta no topo e o CTA no rodape.

Vamos usar `object-cover object-top` mesmo, pois o logo Arara Azul e o "Pacote Pascoa" estao no topo e sao os elementos mais importantes. O CTA "Faca sua reserva" na parte inferior pode ser levemente cortado em telas muito largas, mas todo o conteudo principal ficara visivel.

## Alteracao Tecnica

### `src/assets/pascoa-pacote-banner-mobile.png`
- Substituir pela nova imagem quadrada 1080x1080

### `src/components/HeroCarousel.tsx`
- Nenhuma alteracao de codigo necessaria
- O `object-cover object-top lg:hidden` existente ja funciona bem para uma imagem quadrada

## Resultado Esperado

- **Mobile (400px)**: Imagem quadrada preenche a area com corte minimo. Logo, "15% OFF", textos e fotos bem visiveis
- **Tablet (768px)**: Ainda melhor aproveitamento, praticamente sem corte
- **Desktop (1024px+)**: Sem mudanca (banner panoramico)

