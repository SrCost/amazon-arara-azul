## Problema

Na home (`/`), o card do novo "Bangalô Abano" aparece sem foto pelo mesmo motivo já corrigido em `/bangalos`: a query filtra `display_order = 1`, e novos bangalôs salvam imagens com outros valores de ordem.

## Correção

Em `src/pages/Index.tsx`, na consulta de `gallery_images`:

1. Remover `.eq("display_order", 1)`.
2. Adicionar `.order("display_order", { ascending: true })`.
3. Manter o `find` por `bungalow_slug` — após ordenado, retornará a imagem de menor `display_order` como capa, funcionando para qualquer bangalô novo.

## Arquivos

- `src/pages/Index.tsx` — ajustar a query de `gallery_images`.
