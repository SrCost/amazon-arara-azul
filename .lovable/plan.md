## 1. Banco de dados (migration)

Adicionar coluna `beds` em `public.rooms`:
- Tipo: `jsonb` `NOT NULL DEFAULT '[]'`
- Estrutura: `[{ "type": "Casal" | "Solteiro" | "Rede" | string, "quantity": number }]`
- Sem CHECK constraint (regra validada no app). RLS já existente cobre updates de admin.

Refinar `max_guests`:
- Manter `integer NOT NULL`.
- Adicionar `CHECK (max_guests BETWEEN 1 AND 10)` (limite estático, imutável → ok).

## 2. Admin — `src/pages/admin/Bangalos.tsx`

### Capacidade (max_guests)
- Input `type="number"` com `min={1} max={10} step={1}`.
- Validação no submit: número inteiro entre 1 e 10 (toast de erro caso contrário).

### Camas (novo bloco no formulário)
- Estado no formData: `beds: Array<{ type: string; quantity: number }>`.
- UI: lista editável de linhas, cada linha com:
  - `Select` de tipo (opções fixas: **Solteiro, Casal, Rede** + opção **"Personalizado"** que troca para um `Input` de texto livre).
  - `Input number` quantidade (min 1, max 10).
  - Botão remover (ícone X).
- Botão "+ Adicionar cama" abaixo da lista.
- Validação: tipo não vazio, qtd ≥ 1; permitido lista vazia.

### Listagem (cards admin)
- Mostrar resumo curto, ex.: "1 casal · 2 solteiros · 1 rede".
- Manter contador de comodidades existente.

## 3. Exibição pública

### `src/pages/LodgeDetail.tsx`
- Carregar `beds` do registro.
- Nova seção "Acomodação" (acima de Comodidades ou ao lado de Capacidade) com ícone `BedDouble`/`Bed` da `lucide-react` e lista formatada usando i18n (pluralização simples: "1 cama de casal", "2 camas de solteiro", "1 rede").
- Se `beds` vazio, ocultar seção.

### `src/components/LodgeCard.tsx`
- Adicionar prop `beds` opcional.
- Linha compacta abaixo da capacidade: ícone + resumo curto (ex.: "1 casal, 2 solteiros").

### `src/pages/Lodges.tsx`
- Passar `beds` ao `LodgeCard` quando buscar bangalôs.

## 4. i18n

Novas chaves em `pt/en/es/fr`:
- `lodge.beds.title` → "Acomodação" / "Accommodation" / "Alojamiento" / "Hébergement"
- `lodge.beds.couple` / `single` / `hammock` (singular)
- `lodge.beds.couplePlural` / `singlePlural` / `hammockPlural`
- `admin.bangalos.beds.label` / `addBed` / `bedType` / `quantity` / `customType`

## 5. Arquivos afetados

| Arquivo | Ação |
|---|---|
| migration (nova) | adicionar `beds` jsonb + CHECK em `max_guests` |
| `src/pages/admin/Bangalos.tsx` | UI editor de camas + validação capacidade |
| `src/pages/LodgeDetail.tsx` | exibir seção Acomodação |
| `src/components/LodgeCard.tsx` | exibir resumo de camas |
| `src/pages/Lodges.tsx` | passar `beds` ao card |
| `src/i18n/locales/{pt,en,es,fr}.json` | novas chaves |

Tipos do Supabase serão regenerados após a migration aprovada.

## Fora de escopo
- Reservas/PMS (não usam camas para lógica de disponibilidade).
- Emails de confirmação (não mencionam camas).
- Tradução do campo `type` salvo no banco (armazenado em PT; UI traduz quando bater com os 3 tipos canônicos, fallback exibe valor literal).
