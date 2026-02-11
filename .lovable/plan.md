

# Correção: Banner de Páscoa no Mobile sem Preenchimento Azul

## Problema

No mobile, o hero tem proporção vertical (ex: 400px de altura em ~390px de largura), mas o banner de Páscoa é panorâmico (1200x628, ratio 1.91:1). Com `object-contain`, a imagem fica pequena e o fundo azul preenche o espaço restante acima e abaixo.

## Solução

Usar `object-cover` no mobile para que o banner preencha todo o espaço (aceitando um leve corte lateral), e manter `object-contain` apenas em telas maiores (a partir de `sm:` / 640px) onde a proporção do container é mais compatível com o banner.

## Alteração

### `src/components/HeroCarousel.tsx`

Substituir a classe condicional de `objectFit` para usar classes responsivas:

- Imagens normais (bangalôs): `object-cover` em todos os tamanhos (sem mudança)
- Banner de Páscoa: `object-cover` no mobile + `object-contain` a partir de `sm:`

A lógica muda de:
```tsx
image.objectFit === "cover" ? "object-cover" : "object-contain"
```

Para:
```tsx
image.objectFit === "cover" ? "object-cover" : "object-cover sm:object-contain"
```

Isso garante que no mobile o banner preencha o container sem letterboxing azul, enquanto em telas maiores a imagem continua sendo exibida inteira.

## Resultado Esperado

- **Mobile**: Banner de Páscoa preenche o hero inteiro, com leve corte lateral se necessário, sem faixas azuis
- **Desktop/Tablet**: Banner continua sendo exibido inteiramente com fundo azul nas laterais

