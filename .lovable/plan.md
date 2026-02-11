

# Trocar Imagem Mobile do Banner e Ajustar Enquadramento

## Problema Atual

A imagem mobile atual nao se encaixa bem no container do hero. O `object-contain` deixa a imagem muito pequena com espacos vazios, e o `object-cover` corta demais.

## Nova Imagem

A nova imagem enviada (formato story 9:16) tem o conteudo principal (logotipo, "15% OFF", texto, "Faca sua reserva") concentrado na metade superior/central da imagem. A parte inferior e majoritariamente a ponte de madeira (menos importante).

## Solucao

### 1. Substituir a imagem mobile

Copiar `user-uploads://CAMPANHA-PACOTE-PASCOASTORY.png` para `src/assets/pascoa-pacote-banner-mobile.png` (substituindo a anterior).

### 2. Usar `object-cover` com `object-top` no mobile/tablet

Como a imagem e bem mais alta que o container (hero tem 400-650px, imagem tem ~1920px de altura), `object-cover` vai cortar -- mas usando `object-top` garantimos que o corte acontece apenas na parte inferior (a ponte), preservando o logotipo, o "15% OFF" e todo o texto informativo.

### 3. Remover o efeito blur de fundo

Com `object-cover`, a imagem preenche todo o container sem espacos vazios, entao a camada de blur nao e mais necessaria.

## Alteracao Tecnica

### `src/components/HeroCarousel.tsx`

Dentro do bloco `image.mobileSrc`:

**De:**
```
blur background img (lg:hidden)
img object-contain lg:hidden
img object-contain hidden lg:block
```

**Para:**
```
img object-cover object-top lg:hidden
img object-contain hidden lg:block
```

- Remover a tag `<img>` do blur (aria-hidden)
- Trocar `object-contain` por `object-cover object-top` na imagem mobile
- Manter a imagem desktop (`object-contain hidden lg:block`) sem mudanca

## Resultado Esperado

- **Mobile (400px)**: a imagem preenche toda a area, corte apenas na parte inferior (ponte). Logo, "15% OFF", texto e botao ficam visiveis
- **Tablet (550-650px)**: mais espaco vertical, mostra ainda mais conteudo da imagem. Mesmo enquadramento a partir do topo
- **Desktop (1024px+)**: banner panoramico sem mudanca

