
## Plano: Correção da Lógica de Conflito de Datas e Campos Editáveis de Preços

### Problema Principal: Conflito Falso-Positivo

A função `checkConflict` está detectando conflito quando não deveria. Exemplo identificado nos logs:

| Reserva Existente | Reserva Sendo Editada | Resultado |
|------------------|----------------------|-----------|
| Check-in: 31/01, Check-out: 02/02 | Check-in: 01/02, Check-out: 05/02 | ❌ Conflito falso |

**Por que é falso?** Na hotelaria, quando uma reserva faz **check-out dia 02/02**, o quarto está **disponível para check-in no mesmo dia 02/02**. A lógica atual está bloqueando incorretamente essa situação.

### Causa Raiz

Na função `checkConflict` em `useCalendarReservations.ts`:

```typescript
const hasConflict = 
  (checkInStr >= res.check_in && checkInStr < res.check_out) ||  // ❌ Muito restritivo
  (checkOutStr > res.check_in && checkOutStr <= res.check_out) ||
  (checkInStr <= res.check_in && checkOutStr >= res.check_out);
```

O problema está na **primeira condição**: `checkInStr < res.check_out` não permite check-in no dia do check-out de outra reserva.

### Solução: Ajustar Lógica de Conflito

```typescript
const hasConflict = 
  (checkInStr >= res.check_in && checkInStr < res.check_out) ||
  (checkOutStr > res.check_in && checkOutStr <= res.check_out) ||
  (checkInStr < res.check_in && checkOutStr > res.check_out);
```

**Mudança na terceira condição**: `checkOutStr >= res.check_out` → `checkOutStr > res.check_out`

Isso permite:
- Check-in no dia de check-out de outra reserva (comportamento padrão hoteleiro)
- Preserva detecção de sobreposições reais

---

### Problema Secundário: Campos de Preço Editáveis

O usuário solicitou botões minimalistas para editar os campos:
- Tarifa Base
- Diária Calculada
- Total

Atualmente, esses campos estão:
1. **Tarifa Base**: Input editável (já funciona quando não há pacote)
2. **Diária Calculada**: Texto estático (calculado automaticamente)
3. **Total**: Texto estático (calculado automaticamente)

### Solução: Modo de Edição Manual

Adicionar um toggle que permita sobrescrever os valores calculados:

1. Botão de edição ao lado de cada campo estático
2. Ao clicar, campo vira input editável
3. Total pode ser sobrescrito manualmente
4. Indicador visual de "valor manual" vs "valor calculado"

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useCalendarReservations.ts` | Corrigir lógica de conflito na função `checkConflict` |
| `src/components/admin/calendar/EditReservationModal.tsx` | Adicionar campos editáveis com botão toggle para preços |

### Detalhes Técnicos

#### 1. Correção do `checkConflict`

```typescript
// ANTES (incorreto)
(checkInStr <= res.check_in && checkOutStr >= res.check_out)

// DEPOIS (correto - permite contiguidade)
(checkInStr < res.check_in && checkOutStr > res.check_out)
```

#### 2. Estado para edição manual de preços

```typescript
const [manualPricing, setManualPricing] = useState(false);
const [manualDailyRate, setManualDailyRate] = useState<number | null>(null);
const [manualTotal, setManualTotal] = useState<number | null>(null);
```

#### 3. Campos editáveis no formulário

```typescript
<div className="space-y-1 relative">
  <div className="flex items-center gap-2">
    <p className="text-sm font-medium">Total</p>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-5 w-5"
      onClick={() => setManualPricing(!manualPricing)}
    >
      <Pencil className="h-3 w-3" />
    </Button>
  </div>
  {manualPricing ? (
    <Input
      type="number"
      value={manualTotal ?? totalPrice}
      onChange={(e) => setManualTotal(Number(e.target.value))}
    />
  ) : (
    <p className="text-2xl font-bold text-primary">
      R$ {totalPrice.toLocaleString("pt-BR")}
    </p>
  )}
</div>
```

### Resultado Esperado

1. **Edição de reservas funcionando**: Sem falsos conflitos de data
2. **CRUD completo**: Criar, Ler, Atualizar e Excluir reservas funcionais
3. **Campos de preço editáveis**: Administradores podem sobrescrever valores calculados
4. **Interface limpa**: Botões minimalistas que não poluem a interface
