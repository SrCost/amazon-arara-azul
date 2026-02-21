

# Ajustar proporção de imagens desktop no carrossel

## Problema

Quando uma mídia é adicionada pelo admin com ajuste "Contain" (para não cortar), o fundo aparece como cor errada ou transparente, criando um visual desagradável. A imagem está sendo cortada quando usa "Cover".

## Solução

Duas alterações no `HeroCarousel.tsx`:

1. **Cor de fundo padrão para slides do banco**: Quando o slide do banco não tiver `background_color` definida, usar a cor do tema do site (`hsl(120, 15%, 97%)` - o tom claro esverdeado do fundo) em vez de `transparent`. Isso faz a imagem "mesclar" com o restante da página.

2. **Forçar `object-contain` como padrão para slides do banco**: Alterar o comportamento para que slides adicionados pelo admin usem `object-contain` por padrão (respeitando o campo `object_fit` do banco se o admin quiser mudar). Isso evita o corte da imagem.

## Alteração técnica

### `src/components/HeroCarousel.tsx`

Na função `renderSlide`, para slides do tipo `"db"` (linha 85):

- Alterar o `backgroundColor` padrão de `"transparent"` para `"hsl(120, 15%, 97%)"` (cor de fundo do site) quando `slide.background_color` estiver vazio
- Isso garante que imagens com `object-contain` tenham um fundo harmonioso

```
style={{ backgroundColor: slide.background_color || "hsl(120, 15%, 97%)" }}
```

Nenhuma alteração no admin ou no banco de dados. O admin continua podendo definir uma cor de fundo personalizada por slide se desejar.
