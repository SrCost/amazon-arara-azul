

## Plano: Correção Completa da Exclusão de Reservas

### Problema Identificado

O fluxo de exclusão de reservas está sendo bloqueado por **duas** foreign keys na tabela `payment_logs`:

| Constraint | Referencia | Estado Atual | Estado Desejado |
|------------|------------|--------------|-----------------|
| `payment_logs_reservation_id_fkey` | `reservations.id` | ✅ SET NULL (corrigido) | ✅ OK |
| `payment_logs_payment_id_fkey` | `payments.id` | ❌ NO ACTION | 🔧 SET NULL |

### Cadeia de Exclusão

Quando uma reserva é excluída:
```
reservations (DELETE)
    └── payments (CASCADE) ← Tenta excluir
           └── payment_logs.payment_id (NO ACTION) ← BLOQUEIA!
```

### Solução Proposta

#### Migration SQL

Modificar a constraint `payment_logs_payment_id_fkey` para `ON DELETE SET NULL`:

```sql
-- Remover constraint antiga do payment_id
ALTER TABLE public.payment_logs 
DROP CONSTRAINT IF EXISTS payment_logs_payment_id_fkey;

-- Adicionar constraint com ON DELETE SET NULL
ALTER TABLE public.payment_logs 
ADD CONSTRAINT payment_logs_payment_id_fkey 
FOREIGN KEY (payment_id) 
REFERENCES public.payments(id) 
ON DELETE SET NULL;
```

### Resultado Esperado

Após a correção, o fluxo de exclusão funcionará assim:

```
reservations (DELETE)
    ├── payments (CASCADE) → Excluídos
    │      └── payment_logs.payment_id → SET NULL (preserva log)
    ├── payment_logs.reservation_id → SET NULL (preserva log)
    └── reservation_access_tokens (CASCADE) → Excluídos
```

**Benefícios:**
1. ✅ Reservas podem ser excluídas sem erros
2. ✅ Logs de pagamento são preservados para auditoria
3. ✅ Campos `reservation_id` e `payment_id` ficam NULL indicando registros excluídos
4. ✅ Apenas admin/super_admin podem excluir (protegido por RLS)

### Arquivos a Modificar

| Tipo | Arquivo | Alteração |
|------|---------|-----------|
| **Database** | Nova migration | Alterar FK `payment_logs_payment_id_fkey` para `ON DELETE SET NULL` |

### Impacto

- **Mínimo** - Apenas altera comportamento de exclusão
- **Segurança** - RLS já garante que só admin/super_admin excluem
- **Auditoria** - Logs preservados com referências nulas

