## Problema

No admin **Galeria**, ao categorizar foto como "Bangalôs", o dropdown "Bangalô *" mostra apenas 3 opções fixas no código (Peneira, Paneiro, Tipiti). Bangalôs criados depois na tela **Admin › Bangalôs** não aparecem, impedindo associar fotos a eles.

Também há divergência: o uploader usa slugs `suite-peneira/-paneiro/-tipiti` (incorretos), enquanto editor e filtros usam `bangalo-peneira/-paneiro/-tipiti`. Isso causa fotos órfãs.

## Solução

Tornar a lista de bangalôs dinâmica, vinda da tabela `rooms`, em todos os pontos da Galeria.

### Mudanças

**1. Novo hook `src/hooks/useRoomsList.ts`**
- Busca `rooms` (id, slug, name_pt) com `is_active = true`, ordenado por nome
- Cache via React Query

**2. `src/components/admin/GalleryUploader.tsx`**
- Substituir os 3 `<SelectItem>` fixos pelos itens do hook
- Usa `slug` como value e `name_pt` como label
- Corrige o bug de slug (`suite-*` → slug real do bangalô)

**3. `src/components/admin/GalleryImageEditor.tsx`**
- Remover constante `BUNGALOWS` hardcoded
- Popular dropdown com o hook

**4. `src/pages/admin/Gallery.tsx`**
- Filtro "Bangalô" também dinâmico (hook)
- Função `getBungalowLabel` resolve nome via hook (fallback: slug)

### Fora do escopo
- Migração de slugs antigos no banco (não foi pedido). Se houver fotos com slug `suite-*` salvas, podemos tratar em passo posterior se necessário.
- Botões "Upload Paneiro/Peneira/Tipiti" (legado de seed) permanecem como estão.
