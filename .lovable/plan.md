

## Plano: Correção da Exclusão de Reservas

### Problema Identificado

Ao tentar excluir uma reserva, o banco de dados retorna o erro:
```
update or delete on table "reservations" violates foreign key constraint 
"payment_logs_reservation_id_fkey" on table "payment_logs"
```

### Causa Raiz

A tabela `payment_logs` possui uma foreign key para `reservations` **sem regra de deleção** (NO ACTION), o que impede a exclusão de reservas que tenham logs de pagamento associados.

**Análise das Foreign Keys atuais:**

| Tabela | Foreign Key | Comportamento | Status |
|--------|-------------|---------------|--------|
| `payments` | `reservation_id` | ON DELETE CASCADE | ✅ OK |
| `reservation_access_tokens` | `reservation_id` | ON DELETE CASCADE | ✅ OK |
| `email_logs` | `reservation_id` | ON DELETE SET NULL | ✅ OK |
| `payment_logs` | `reservation_id` | NO ACTION | ❌ **Problema** |

### Solução Proposta

#### 1. Alterar a Foreign Key (Migration SQL)

Modificar a constraint `payment_logs_reservation_id_fkey` para usar `ON DELETE SET NULL`, mantendo o histórico de logs mesmo após exclusão da reserva:

```sql
-- Remover constraint antiga
ALTER TABLE public.payment_logs 
DROP CONSTRAINT payment_logs_reservation_id_fkey;

-- Adicionar constraint com ON DELETE SET NULL
ALTER TABLE public.payment_logs 
ADD CONSTRAINT payment_logs_reservation_id_fkey 
FOREIGN KEY (reservation_id) 
REFERENCES public.reservations(id) 
ON DELETE SET NULL;
```

**Por que SET NULL em vez de CASCADE?**
- `payment_logs` é uma tabela de auditoria/histórico
- Ao excluir a reserva, o log permanece para fins de auditoria
- O campo `reservation_id` passa a ser NULL, indicando reserva excluída
- Mantém rastreabilidade de operações históricas

#### 2. Melhorar Feedback no Frontend

Atualizar `handleDelete` em `EditReservationModal.tsx` para:
- Exibir mensagem de erro mais clara se ainda ocorrer falha
- Confirmar visualmente o perfil do usuário antes de permitir exclusão

```typescript
const handleDelete = async () => {
  if (!reservation) return;
  
  // Verificação extra de permissão (já existe RLS, mas reforça UX)
  if (!isAdmin && !isSuperAdmin) {
    toast.error("Apenas administradores podem excluir reservas.");
    return;
  }

  setIsDeleting(true);
  try {
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservation.id);

    if (error) {
      // Mensagem específica para erro de FK
      if (error.code === "23503") {
        toast.error("Não foi possível excluir: existem registros vinculados a esta reserva.");
      } else {
        throw error;
      }
      return;
    }

    toast.success("Reserva excluída com sucesso!");
    onSuccess();
    onOpenChange(false);
  } catch (error: any) {
    console.error("Error deleting reservation:", error);
    toast.error(error.message || "Erro ao excluir reserva");
  } finally {
    setIsDeleting(false);
  }
};
```

### Resumo das Alterações

| Tipo | Local | Alteração |
|------|-------|-----------|
| **Database** | Migration | Alterar FK `payment_logs_reservation_id_fkey` para `ON DELETE SET NULL` |
| **Frontend** | `EditReservationModal.tsx` | Melhorar mensagens de erro e verificação de permissão |

### Permissões de Exclusão

As permissões já estão corretamente configuradas via RLS:

```sql
-- Política existente (verificada)
Policy Name: admins_delete_reservations_v2
Command: DELETE
Using Expression: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
```

Apenas usuários com role `admin` ou `super_admin` podem excluir reservas.

### Resultado Esperado

1. **Exclusão funcional**: Reservas podem ser excluídas sem erro de FK
2. **Histórico preservado**: Logs de pagamento são mantidos com `reservation_id = NULL`
3. **Segurança mantida**: Apenas admin/super_admin podem excluir (RLS)
4. **Feedback melhorado**: Mensagens de erro mais claras em caso de falha

