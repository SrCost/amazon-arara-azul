
# Corrigir exibicao de imagens do banco no carrossel desktop

## Problema

As imagens adicionadas pelo admin estao sendo cortadas e distorcidas no desktop porque usam `object-cover`, que forca a imagem a preencher todo o espaco do carrossel, cortando partes da imagem. Mesmo com `object-contain`, as bordas ficam vazias sem transicao suave.

## Solucao

Duas alteracoes no `src/components/HeroCarousel.tsx`:

### 1. Forcar `object-contain` para slides do banco no desktop

Na funcao `renderMedia`, para imagens de slides do banco exibidas em desktop (`hidden lg:block` e a imagem unica), forcar `object-contain` em vez de respeitar `object_fit`. Isso garante que a imagem nunca sera cortada no desktop.

### 2. Adicionar gradiente lateral para mesclar com o fundo

Adicionar dois pseudo-elementos (divs) com gradiente horizontal nas laterais do slide do banco, indo da cor de fundo (`hsl(120, 15%, 97%)`) para transparente. Isso cria uma transicao suave entre a imagem e o fundo do site, disfarçando as areas vazias.

```
Estrutura visual:

[gradiente esq] [imagem contain centralizada] [gradiente dir]
   cor fundo ->    <- transparente | transparente ->    <- cor fundo
```

### Alteracoes no codigo

**`src/components/HeroCarousel.tsx`** - funcao `renderSlide` (slides tipo "db"):

- Adicionar dois divs com gradiente lateral sobre a imagem:
  - Esquerda: `background: linear-gradient(to right, bgColor, transparent)` com `w-[15%]`
  - Direita: `background: linear-gradient(to left, bgColor, transparent)` com `w-[15%]`
  - Visivel apenas em desktop: `hidden lg:block`
  - Z-index acima da imagem mas abaixo dos controles

**`src/components/HeroCarousel.tsx`** - funcao `renderMedia`:

- Para imagens desktop de slides do banco, forcar `object-contain` sempre (ignorar `object_fit` no desktop)
- Mobile continua respeitando o `object_fit` do banco normalmente

### Resultado esperado

- Imagem do banco aparece inteira no desktop, centralizada, sem corte
- As laterais que sobram mesclam suavemente com a cor de fundo do site via gradiente
- Mobile continua funcionando normalmente
- Imagens fallback (bangalos) nao sao afetadas
