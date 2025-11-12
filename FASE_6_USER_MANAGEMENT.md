# FASE 6 - Gerenciamento de Usuários: Implementação Completa

## Resumo
Esta fase implementa o sistema completo de gerenciamento de usuários administrativos com criação segura via Edge Functions, listagem com realtime updates, edição de roles, e propagação imediata de privilégios.

---

## 1. Edge Functions para Operações Administrativas

### 1.1 Edge Function: `create-user`
**Arquivo:** `supabase/functions/create-user/index.ts`

**Funcionalidade:**
- Criação segura de usuários usando Supabase Admin API
- Validação de permissões (apenas super_admin)
- Atribuição de roles no momento da criação
- Auto-confirmação de email
- Logging completo de operações

**Segurança:**
- Requer `SUPABASE_SERVICE_ROLE_KEY`
- Verifica token de autenticação
- Valida role do requisitante (deve ser super_admin)
- Validação de entrada (email, password, full_name, role)

**Fluxo:**
1. Valida autenticação e role do requisitante
2. Valida dados de entrada
3. Cria usuário com `supabaseAdmin.auth.admin.createUser()`
4. Trigger `handle_new_user()` cria profile e role padrão
5. Se role != 'user', atualiza role na tabela `user_roles`
6. Retorna dados do usuário criado

### 1.2 Edge Function: `delete-user`
**Arquivo:** `supabase/functions/delete-user/index.ts`

**Funcionalidade:**
- Exclusão segura de usuários via Admin API
- Proteções contra auto-exclusão e exclusão de super_admins
- Cascade delete automático para profiles e roles

**Segurança:**
- Requer `SUPABASE_SERVICE_ROLE_KEY`
- Verifica token de autenticação
- Valida role do requisitante (deve ser super_admin)
- Impede exclusão do próprio usuário
- Impede exclusão de outros super_admins

**Fluxo:**
1. Valida autenticação e role do requisitante
2. Verifica se não é auto-exclusão
3. Verifica se target não é super_admin
4. Deleta usuário com `supabaseAdmin.auth.admin.deleteUser()`
5. Cascade delete remove profile e roles automaticamente

---

## 2. Frontend: Página `/admin/users`

### 2.1 Funcionalidades Implementadas

**Listagem de Usuários:**
- Query completa de profiles com joins de roles
- Ordenação por `created_at DESC`
- Busca por nome ou email
- Exibição de: Nome, Email, Role, Data de Cadastro

**Criação de Usuário:**
- Modal com formulário completo
- Campos: Nome, Email, Role, Senha
- Validação cliente:
  - Todos campos obrigatórios
  - Senha mínima 6 caracteres
- Chamada segura à Edge Function `create-user`
- Toast de sucesso/erro

**Edição de Role:**
- Select inline na tabela
- Mudança imediata via `supabase.from('user_roles').update()`
- Proteção: não pode mudar própria role
- Toast informativo sobre propagação de privilégios

**Exclusão de Usuário:**
- Botão com confirmação
- Chamada segura à Edge Function `delete-user`
- Toast de sucesso/erro

### 2.2 Realtime Updates

**Implementação de dois canais:**

```typescript
// Canal 1: Mudanças em profiles
const profilesChannel = supabase
  .channel('profiles-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'profiles'
  }, () => fetchUsers())
  .subscribe();

// Canal 2: Mudanças em user_roles (NOVO)
const rolesChannel = supabase
  .channel('user-roles-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_roles'
  }, () => {
    console.log('Role changed - refreshing users list');
    fetchUsers();
  })
  .subscribe();
```

**Benefício:**
- Mudanças de role propagam imediatamente para todos admins visualizando a lista
- Não precisa refresh manual
- Auditoria em tempo real

### 2.3 Controle de Acesso

**Verificação de Super Admin:**
```typescript
const { data } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id)
  .maybeSingle();

const isSuper = data?.role === 'super_admin';
```

**UI condicional:**
- Se não for super_admin: exibe mensagem "Acesso Restrito"
- Se for super_admin: exibe interface completa de gerenciamento

---

## 3. Backend: Triggers e RLS Policies

### 3.1 Audit Logging para `profiles`

**Triggers criados:**
```sql
CREATE TRIGGER trg_audit_profiles_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_profiles_delete
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();
```

**Registro automático de:**
- Atualizações de perfil
- Exclusões de usuário
- Timestamp, user_id, user_email, metadata

### 3.2 Audit Logging para `user_roles`

**Triggers criados:**
```sql
CREATE TRIGGER trg_audit_user_roles_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_user_roles_update
AFTER UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_user_roles_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();
```

**Registro automático de:**
- Criação de roles (novos usuários)
- Mudanças de role
- Remoção de roles
- Rastreamento completo de escalação de privilégios

### 3.3 RLS Policies para `user_roles`

**Policies implementadas:**

1. **Super admins can insert roles**
   ```sql
   CREATE POLICY "Super admins can insert roles"
   ON public.user_roles
   FOR INSERT
   TO authenticated
   WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
   ```

2. **Super admins can update roles**
   ```sql
   CREATE POLICY "Super admins can update roles"
   ON public.user_roles
   FOR UPDATE
   TO authenticated
   USING (has_role(auth.uid(), 'super_admin'::app_role))
   WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
   ```

3. **Super admins can delete roles**
   ```sql
   CREATE POLICY "Super admins can delete roles"
   ON public.user_roles
   FOR DELETE
   TO authenticated
   USING (has_role(auth.uid(), 'super_admin'::app_role));
   ```

### 3.4 RLS Policies para `profiles`

**Policies implementadas:**

1. **Admins can view all profiles**
   ```sql
   CREATE POLICY "Admins can view all profiles"
   ON public.profiles
   FOR SELECT
   TO authenticated
   USING (
     has_role(auth.uid(), 'super_admin'::app_role) OR 
     has_role(auth.uid(), 'admin'::app_role) OR 
     auth.uid() = id
   );
   ```
   - Super admins veem todos
   - Admins veem todos
   - Usuários veem apenas próprio perfil

2. **Super admins can manage all profiles**
   ```sql
   CREATE POLICY "Super admins can manage all profiles"
   ON public.profiles
   FOR ALL
   TO authenticated
   USING (has_role(auth.uid(), 'super_admin'::app_role))
   WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
   ```
   - Apenas super_admins podem INSERT/UPDATE/DELETE profiles

---

## 4. Propagação Imediata de Privilégios

### 4.1 Como Funciona

**Verificação de Role:**
- Cada requisição usa `has_role(auth.uid(), role)` nas policies
- Função `has_role()` é `SECURITY DEFINER` e consulta diretamente `user_roles`
- Mudanças em `user_roles` refletem imediatamente nas próximas queries

**Realtime Refresh:**
- Canal `user-roles-changes` detecta mudanças
- Trigger refresh automático da lista de usuários
- Admin vê mudança propagada em tempo real

### 4.2 Fluxo de Mudança de Role

1. Super admin muda role via UI
2. `UPDATE user_roles SET role = newRole WHERE user_id = userId`
3. Trigger `trg_audit_user_roles_update` registra em audit_log
4. Realtime channel notifica todos listeners
5. UI atualiza lista automaticamente
6. Próxima ação do usuário afetado já usa novo role (RLS policies checam `has_role()`)

### 4.3 Limitações e Considerações

**Sessão ativa do usuário afetado:**
- Token JWT do usuário **não é revogado** automaticamente
- Permissões refletem na **próxima requisição** (queries com RLS)
- Se precisar forçar re-login: implementar revogação de token via Admin API

**Recomendação para casos críticos:**
- Rebaixamento de super_admin → admin: considerar forçar logout
- Implementar via Edge Function adicional se necessário
- Atual implementação já protege com RLS imediato

---

## 5. Arquivos Modificados/Criados

### Backend (Supabase)
- `supabase/functions/create-user/index.ts` - Edge Function criação
- `supabase/functions/delete-user/index.ts` - Edge Function exclusão
- Migration: triggers audit em `profiles` e `user_roles`
- Migration: RLS policies para `profiles` e `user_roles`

### Frontend
- `src/pages/admin/Users.tsx` - Interface de gerenciamento
  - Adicionado realtime para `user_roles`
  - Proteção contra mudança própria role
  - Mensagem sobre propagação de privilégios

### Documentação
- `FASE_6_USER_MANAGEMENT.md` - Este documento

---

## 6. Fluxo de Dados

### Criação de Usuário
```
[UI: Modal Create User] 
  → POST /functions/v1/create-user
  → [Edge Function: Valida super_admin]
  → supabaseAdmin.auth.admin.createUser()
  → [Trigger: handle_new_user()] → INSERT profiles, INSERT user_roles
  → [Edge Function: UPDATE user_roles se role != 'user']
  → [Trigger: trg_audit_user_roles_insert] → INSERT activity_log
  → [Realtime: user-roles-changes] → Notifica UI
  → [UI: Refresh lista]
```

### Mudança de Role
```
[UI: Select Role Change]
  → supabase.from('user_roles').update({ role: newRole })
  → [RLS: Verifica has_role(auth.uid(), 'super_admin')]
  → UPDATE user_roles
  → [Trigger: trg_audit_user_roles_update] → INSERT activity_log
  → [Realtime: user-roles-changes] → Notifica todos admins
  → [UI: Refresh lista em todos browsers]
  → [Usuário afetado: próxima ação usa novo role via RLS]
```

### Exclusão de Usuário
```
[UI: Delete Button + Confirm]
  → POST /functions/v1/delete-user
  → [Edge Function: Valida super_admin, impede auto-delete, impede delete super_admin]
  → supabaseAdmin.auth.admin.deleteUser()
  → [Cascade DELETE: profiles, user_roles]
  → [Triggers: trg_audit_profiles_delete, trg_audit_user_roles_delete] → INSERT activity_log
  → [Realtime: profiles-changes, user-roles-changes] → Notifica UI
  → [UI: Refresh lista]
```

---

## 7. Testes Recomendados

### 7.1 Criação de Usuário
- [ ] Super admin pode criar usuário com role 'user'
- [ ] Super admin pode criar usuário com role 'admin'
- [ ] Super admin pode criar usuário com role 'super_admin'
- [ ] Admin comum **não pode** criar usuários (acesso negado)
- [ ] Validação: email inválido → erro
- [ ] Validação: senha < 6 chars → erro
- [ ] Validação: campos vazios → erro
- [ ] Criação registrada em audit_log
- [ ] Novo usuário aparece na lista imediatamente (realtime)

### 7.2 Mudança de Role
- [ ] Super admin pode mudar role de 'user' para 'admin'
- [ ] Super admin pode mudar role de 'admin' para 'super_admin'
- [ ] Super admin pode rebaixar 'admin' para 'user'
- [ ] Super admin **não pode** mudar própria role (UI bloqueia)
- [ ] Admin comum **não pode** mudar roles (acesso negado)
- [ ] Mudança registrada em audit_log
- [ ] Mudança aparece imediatamente em todos browsers abertos (realtime)
- [ ] Usuário afetado tem novas permissões na próxima ação

### 7.3 Exclusão de Usuário
- [ ] Super admin pode excluir usuário 'user'
- [ ] Super admin pode excluir usuário 'admin'
- [ ] Super admin **não pode** excluir outro 'super_admin' (Edge Function impede)
- [ ] Super admin **não pode** excluir a si mesmo (Edge Function impede)
- [ ] Admin comum **não pode** excluir usuários (acesso negado)
- [ ] Confirmação antes de excluir
- [ ] Exclusão registrada em audit_log
- [ ] Usuário removido da lista imediatamente (realtime)

### 7.4 Realtime Updates
- [ ] Abrir /admin/users em dois browsers
- [ ] Criar usuário no browser 1 → aparece no browser 2 automaticamente
- [ ] Mudar role no browser 1 → atualiza no browser 2 automaticamente
- [ ] Excluir usuário no browser 1 → remove no browser 2 automaticamente
- [ ] Console.log mostra "Role changed - refreshing users list"

### 7.5 Audit Log
- [ ] Cada criação de usuário gera 2 entradas: INSERT profiles, INSERT user_roles
- [ ] Cada mudança de role gera 1 entrada: UPDATE user_roles
- [ ] Cada exclusão gera 2 entradas: DELETE profiles, DELETE user_roles
- [ ] Entradas contêm: user_id, user_email, action, entity_type, metadata

---

## 8. Notas de Segurança

### 8.1 Proteções Implementadas
- ✅ Edge Functions usam `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- ✅ Validação de role do requisitante (has_role check)
- ✅ RLS policies impedem operações não autorizadas
- ✅ Triggers audit registram todas mudanças
- ✅ Proteção contra auto-exclusão
- ✅ Proteção contra exclusão de super_admins
- ✅ Proteção contra mudança própria role
- ✅ Função `has_role()` é `SECURITY DEFINER` (bypass RLS seguro)

### 8.2 Hierarquia de Roles
```
super_admin  → pode tudo (criar, editar, excluir usuários e roles)
admin        → pode ver usuários, gerenciar reservas/pagamentos/mensagens
user         → acesso limitado (apenas próprios dados)
```

### 8.3 Propagação de Privilégios
- Mudanças de role refletem **imediatamente** via RLS policies
- Cada query usa `has_role(auth.uid(), role)` diretamente
- Não depende de cache ou refresh manual
- Token JWT não é revogado (considerar implementar se necessário)

---

## 9. Melhorias Futuras

### 9.1 Revogação de Sessão
- Implementar Edge Function para revogar tokens JWT
- Forçar re-login quando role é rebaixado
- Exemplo: `supabaseAdmin.auth.admin.signOut(userId)`

### 9.2 Notificações por Email
- Enviar email quando usuário é criado (com link para definir senha)
- Notificar quando role é alterado
- Notificar quando usuário é excluído

### 9.3 Histórico de Mudanças
- Dashboard visual do audit_log filtrado por usuário
- Timeline de mudanças de role
- Quem fez, quando, e qual mudança

### 9.4 Bulk Operations
- Importar múltiplos usuários via CSV
- Mudança de role em lote
- Exclusão múltipla com confirmação

### 9.5 Filtros Avançados
- Filtrar por role
- Filtrar por data de cadastro
- Ordenação por múltiplas colunas

---

## 10. Conclusão

A FASE 6 implementa um sistema robusto e seguro de gerenciamento de usuários com:
- ✅ Criação segura via Edge Functions
- ✅ Listagem completa com realtime
- ✅ Edição de roles com propagação imediata
- ✅ Exclusão protegida contra abusos
- ✅ Audit logging completo
- ✅ RLS policies rigorosas
- ✅ UI intuitiva e responsiva

Todos os objetivos da FASE 6 foram alcançados com segurança e qualidade.
