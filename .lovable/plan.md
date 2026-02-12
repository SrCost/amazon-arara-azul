

# Corrigir Distorcao do Banner de Pascoa no Mobile/Tablet

## Problema

A imagem quadrada (1080x1080) esta sendo exibida com `object-cover`, que estica e corta a imagem para preencher o container retangular do hero, causando distorcao visual.

## Solucao

Trocar de `object-cover object-top` para `object-contain` na imagem mobile/tablet. Isso exibe a imagem inteira sem distorcao. O fundo azul (`rgb(30, 58, 140)`) ja configurado no slide preenchera os espacos laterais, mantendo a harmonia visual.

## Alteracao Tecnica

### `src/components/HeroCarousel.tsx` (linha 67)

**De:**
```
className="absolute inset-0 w-full h-full object-cover object-top lg:hidden"
```

**Para:**
```
className="absolute inset-0 w-full h-full object-contain lg:hidden"
```

Apenas uma linha alterada. O `object-contain` garante que a imagem inteira apareca sem corte nem distorcao, centralizada no container, com o fundo azul preenchendo as areas restantes.

## Resultado Esperado

- **Mobile**: Imagem quadrada exibida inteira, centralizada, sem distorcao. Fundo azul nas laterais/acima/abaixo
- **Tablet**: Mesmo comportamento, com mais area visivel
- **Desktop**: Sem mudanca (banner panoramico com `object-contain`)

