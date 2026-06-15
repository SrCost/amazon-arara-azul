## Problema

No `SearchBar` (página inicial), o dropdown "Bangalôs" está com opções **hardcoded** (Peneira, Paneiro, Tipiti). Por isso novos bangalôs cadastrados no dashboard (ex: Abano) não aparecem.

## Correção

**Arquivo:** `src/components/SearchBar.tsx`

1. Importar o hook existente `useRoomsList` (`src/hooks/useRoomsList.ts`), que já busca os rooms ativos do banco (id, slug, name_pt).
2. Substituir os `<SelectItem>` fixos por um `map` sobre o resultado do hook, usando `slug` como `value` e `name_pt` como label.
3. Manter a opção "Todos" (`value="all"`) como primeira opção.
4. Enquanto carrega, manter "Todos" selecionável (sem skeleton extra — UX mínima).

Assim, qualquer bangalô novo cadastrado no admin aparece automaticamente no dropdown, sem precisar editar código.

## Observação

A lógica de busca (`handleSearch`) já consulta a tabela `rooms` dinamicamente, então não precisa de ajuste — só o dropdown estava estático.
