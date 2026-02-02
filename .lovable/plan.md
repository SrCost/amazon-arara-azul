

## Plano: Correção de Build + Logo Oficial Airbnb

### Problema 1: Erro de Build - `package_id` faltando

**Arquivo:** `src/hooks/useCalendarReservations.ts`

A interface `CalendarReservation` inclui `package_id: string | null` (linha 25), mas a query do Supabase (linhas 79-98) não inclui esse campo na seleção.

**Correção:**
Adicionar `package_id` à query de reservations:

```typescript
// Linha 97 - Adicionar após special_requests
const { data: reservationsData } = await supabase
  .from("reservations")
  .select(`
    id,
    room_id,
    room_name,
    guest_name,
    guest_email,
    guest_phone,
    guests,
    check_in,
    check_out,
    status,
    payment_status,
    operational_status,
    total_price,
    daily_rate,
    reservation_source,
    operational_notes,
    special_requests,
    created_at,
    package_id          // <-- ADICIONAR
  `)
```

---

### Problema 2: Logo Oficial do Airbnb

**Arquivo:** `src/components/FindUsSection.tsx`

O SVG atual é uma aproximação do logo. Vou substituir pelo símbolo "Bélo" oficial do Airbnb.

**Logo oficial Airbnb (Bélo):**

```svg
<svg viewBox="0 0 32 32" fill="currentColor">
  <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415.001.228c0 4.062-2.877 6.478-6.357 6.478-2.224 0-4.556-1.258-6.709-3.386l-.257-.26-.172-.179h-.104l-.257.26c-2.106 2.175-4.39 3.416-6.607 3.564l-.274.002c-3.48 0-6.358-2.416-6.358-6.479 0-1.070.218-2.127.85-3.594l.155-.354c.986-2.296 5.146-11.005 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.239 0-2.053.539-2.987 2.21l-.523 1.008c-1.926 3.776-6.06 12.43-7.031 14.692l-.137.318c-.499 1.146-.655 1.893-.655 2.772 0 2.665 1.765 4.479 4.357 4.479 1.603 0 3.489-.966 5.313-2.901l.376-.405.236-.263.236.263c1.793 1.98 3.73 3.075 5.376 3.297l.313.009c2.592 0 4.358-1.814 4.358-4.479 0-.879-.156-1.626-.655-2.772l-.137-.319c-.97-2.26-5.105-10.916-7.031-14.691l-.523-1.008C18.053 3.539 17.239 3 16 3zm0 7c2.485 0 4.5 2.015 4.5 4.5S18.485 19 16 19s-4.5-2.015-4.5-4.5S13.515 10 16 10zm0 2c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/>
</svg>
```

Este é o símbolo "Bélo" oficial que representa o Airbnb - um A estilizado que simboliza pertencimento.

---

### Resumo das Alterações

| Arquivo | Linha(s) | Alteração |
|---------|----------|-----------|
| `useCalendarReservations.ts` | 97 | Adicionar `package_id` à query SELECT |
| `FindUsSection.tsx` | 29-35 | Substituir SVG pelo logo oficial Bélo |

---

### Resultado Esperado

1. **Build corrigido**: O TypeScript não reclamará mais pois `package_id` será retornado pela query
2. **Logo Airbnb oficial**: O ícone será reconhecível como o símbolo oficial da marca

