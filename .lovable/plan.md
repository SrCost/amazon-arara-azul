## Problema

Em `/bangalos`, o card do novo "Bangalô Abano" aparece sem foto, mesmo com imagens já enviadas pelo admin.

A causa está em `src/pages/Lodges.tsx`: a busca da capa filtra `display_order = 1`:

```ts
.eq("display_order", 1)
```

Para os bangalôs antigos isso funciona por coincidência (a primeira foto foi salva com ordem 1), mas para os novos as fotos são gravadas com outros valores de `display_order` (sequenciais ou conforme a ordem de upload), então nenhuma imagem casa e o card cai no fallback (ícone de café cinza).

## Correção

Em `src/pages/Lodges.tsx`, na consulta de `gallery_images`:

1. Remover o filtro `.eq("display_order", 1)`.
2. Manter `category = 'bungalows'`, `is_active = true` e ordenar por `display_order ASC`.
3. Ao montar `coverImageMap`, manter a lógica `if (!coverImageMap[slug])` para que, após o `order`, a primeira imagem de cada `bungalow_slug` (menor `display_order`) seja usada como capa — funcionando para qualquer bangalô novo, sem precisar de imagem com ordem fixa = 1.

Nenhuma outra mudança (LodgeCard, hooks, RLS, banco) é necessária. Sem alteração de lógica de negócio.

## Arquivos

- `src/pages/Lodges.tsx` — ajustar a query de `gallery_images` e a derivação da capa.
