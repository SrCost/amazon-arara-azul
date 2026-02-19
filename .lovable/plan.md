

# Substituir Imagem Mobile do Banner de Pascoa

## Acao

Copiar a imagem enviada (`user-uploads://CAMPANHA-PACOTE-PASCOA--1080.png`) para `src/assets/pascoa-pacote-banner-mobile.png`, substituindo a versao anterior.

## Detalhes Tecnicos

- A imagem tem 1080x1080px (quadrada), que e a dimensao recomendada para mobile/tablet
- Nenhuma alteracao de codigo necessaria no `HeroCarousel.tsx` -- o import ja aponta para `pascoa-pacote-banner-mobile.png`
- As configuracoes de `object-contain` e `backgroundColor: "hsl(120, 15%, 97%)"` permanecem inalteradas

