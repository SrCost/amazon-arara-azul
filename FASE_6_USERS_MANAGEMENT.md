# FASE 6 — /admin/users: Gerenciamento Completo de Usuários

## Objetivo
Implementar sistema completo de gerenciamento de usuários com criação segura via Edge Functions, listagem de profiles, alteração de roles e propagação imediata de privilégios.

## Implementações Realizadas

### 1. Edge Functions para Operações Administrativas

#### create-user (supabase/functions/create-user/index.ts)
Edge Function segura para criação de usuários:
- **Autenticação**: Valida token JWT do super_admin requisitante
- **Autorização**: Verifica se usuário tem role `super_admin`
- **Criação Atômica**: 
  - Cria usuário no auth.users via Admin API
  - Trigger `handle_new_user` cria profile automaticamente
  - Atualiza role em `user_roles` se diferente de 'user'
- **Validação**: Email, senha (mín. 6 caracteres), nome completo e role
- **Auto-confirmação**: Email confirmado automaticamente (`email_confirm: true`)
- **Logging**: Todas operações registradas em audit_log via trigger

```typescript
// Exemplo de chamada:
POST /functions/v1/create-user
Headers: { Authorization: Bearer <super_admin_token> }
Body: {
  email: "user@example.com",
  password: "senha123",
  full_name: "Nome Completo",
  role: "admin"
}
```

#### delete-user (supabase/functions/delete-user/index.ts)
Edge Function segura para exclusão de usuários:
- **Proteções**:
  - Super_admin não pode se auto-deletar
  - Super_admin não pode deletar outros super_admins
- **Cascade Delete**: 
  - Remove usuário de auth.users
  - Cascade deleta profile e user_roles automaticamente
- **Audit Logging**: Exclusão registrada via trigger

### 2. Interface Frontend (/admin/users)

#### Listagem Completa
- **Query**: Busca todos profiles ordenados por `created_at DESC`
- **Join**: Combina profiles com user_roles para exibir role atual
- **Realtime**: Duas subscriptions simultâneas:
  ```typescript
  // Profiles changes
  supabase.channel('profiles-changes')
    .on('postgres_changes', { table: 'profiles' })
    
  // User roles changes (IMMEDIATE PROPAGATION)
  supabase.channel('user-roles-changes')
    .on('postgres_changes', { table: 'user_roles' })
  ```

#### Criação de Usuários
- **Modal**: Campos para nome, email, senha e role
- **Validação Client-side**:
  - Email válido
  - Senha mínima 6 caracteres
  - Todos campos obrigatórios
- **Chamada Segura**: POST para Edge Function create-user
- **Feedback**: Toast de sucesso/erro

#### Edição de Roles
- **UI**: Select dropdown inline na tabela
- **Atualização**: 
  ```typescript
  supabase
    .from("user_roles")
    .update({ role: newRole })
    .eq("user_id", userId)
  ```
- **Propagação Imediata**:
  - Trigger de audit registra mudança
  - Realtime channel atualiza UI instantaneamente
  - Próxima ação do usuário afetado reflete nova role (via RLS has_role())

#### Exclusão de Usuários
- **Confirmação**: Modal de confirmação antes da exclusão
- **Chamada Segura**: POST para Edge Function delete-user
- **Proteções**: Backend valida se pode deletar

### 3. Banco de Dados

#### Triggers de Audit
```sql
-- Profiles
CREATE TRIGGER trg_audit_profiles_update
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_profiles_delete
AFTER DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_activity();

-- User Roles (CRÍTICO para rastreabilidade)
CREATE TRIGGER trg_audit_user_roles_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_user_roles_update
AFTER UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION log_audit_activity();

CREATE TRIGGER trg_audit_user_roles_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
```

#### RLS Policies

**user_roles:**
- `Super admins can insert roles`: Permite criar roles
- `Super admins can update roles`: Permite atualizar roles
- `Super admins can delete roles`: Permite deletar roles
- `Super admins can view all roles`: Visualização (já existente)

**profiles:**
- `Admins can view all profiles`: Admins e super_admins veem todos, usuários veem o próprio
- `Super admins can manage all profiles`: Super_admins têm controle total
- `Users can update their own profile`: Usuários editam próprio perfil (já existente)

### 4. Propagação Imediata de Privilégios

#### Como Funciona
1. **Mudança de Role**: Super_admin altera role via UI
2. **Update Database**: Role atualizado em `user_roles`
3. **Trigger Audit**: Mudança registrada em `activity_log`
4. **Realtime Broadcast**: Supabase notifica todos clientes subscribed
5. **UI Update**: Interface reflete mudança instantaneamente
6. **RLS Enforcement**: Próxima ação do usuário usa `has_role()` que consulta `user_roles`
   - Não depende de cache
   - Sempre pega valor atual do banco
   - Mudança é imediata e automática

#### Security Definer Function
```sql
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;
```
- **STABLE**: Resultados consistentes na mesma transação
- **SECURITY DEFINER**: Executa com privilégios do owner (bypass RLS)
- Chamada em toda policy RLS que verifica permissões

#### Sem Necessidade de Re-login
- Mudanças refletidas na próxima consulta ao banco
- JWT continua válido (não armazena role)
- RLS policies verificam role atual em tempo real

## Fluxo de Dados

### Criação de Usuário
```
Frontend (Super Admin) 
  → POST /functions/v1/create-user
  → Edge Function valida super_admin
  → supabaseAdmin.auth.admin.createUser()
  → Trigger handle_new_user:
      - INSERT profiles
      - INSERT user_roles (default 'user')
  → Edge Function atualiza role se necessário
  → Trigger trg_audit_user_roles_insert
  → INSERT activity_log
  → Realtime broadcast
  → Frontend atualiza lista
```

### Mudança de Role
```
Frontend (Super Admin)
  → SELECT change role via dropdown
  → UPDATE user_roles SET role = 'admin'
  → Trigger trg_audit_user_roles_update
  → INSERT activity_log
  → Realtime broadcast
  → Frontend atualiza UI
  → Usuário afetado: próxima ação usa has_role() → nova role
```

### Exclusão de Usuário
```
Frontend (Super Admin)
  → Confirm delete
  → POST /functions/v1/delete-user
  → Edge Function valida:
      - É super_admin?
      - Não está se deletando?
      - Target não é super_admin?
  → supabaseAdmin.auth.admin.deleteUser()
  → Cascade DELETE profiles, user_roles
  → Triggers audit (delete)
  → INSERT activity_log
  → Realtime broadcast
  → Frontend atualiza lista
```

## Arquivos Modificados

### Backend
- `supabase/functions/create-user/index.ts` - Criação segura de usuários
- `supabase/functions/delete-user/index.ts` - Exclusão segura de usuários
- `supabase/config.toml` - Configuração das Edge Functions
- Migrations:
  - Triggers de audit para `profiles` e `user_roles`
  - RLS policies para `user_roles` (INSERT, UPDATE, DELETE)
  - RLS policies para `profiles` (SELECT para admins)

### Frontend
- `src/pages/admin/Users.tsx` - Interface completa de gerenciamento:
  - Listagem com realtime
  - Modal de criação
  - Edição inline de roles
  - Exclusão com confirmação

## Segurança

### Validações Backend
- ✅ Token JWT verificado em cada Edge Function
- ✅ Role super_admin validado server-side
- ✅ RLS policies impedem bypass via client
- ✅ SECURITY DEFINER function para has_role()
- ✅ Proteções contra auto-delete e delete de super_admins

### Validações Frontend
- ✅ UI bloqueada se não for super_admin
- ✅ Validação de campos antes de enviar
- ✅ Confirmações para ações destrutivas
- ✅ Feedback claro de erros

### Audit Trail Completo
- ✅ Criação de usuários registrada
- ✅ Mudanças de role registradas
- ✅ Exclusões registradas
- ✅ Todas com user_id, email, timestamp e metadata

## Testes Recomendados

### Criação
1. ✅ Criar usuário com role 'user'
2. ✅ Criar usuário com role 'admin'
3. ✅ Criar usuário com role 'super_admin'
4. ✅ Tentar criar com email duplicado (deve falhar)
5. ✅ Tentar criar sem ser super_admin (deve falhar)

### Edição de Roles
1. ✅ Alterar user → admin
2. ✅ Alterar admin → super_admin
3. ✅ Verificar que usuário afetado tem novas permissões imediatamente
4. ✅ Verificar registro em audit_log
5. ✅ Verificar realtime update na UI

### Exclusão
1. ✅ Deletar usuário comum
2. ✅ Tentar deletar super_admin (deve falhar)
3. ✅ Tentar auto-delete (deve falhar)
4. ✅ Verificar cascade delete de profiles e roles
5. ✅ Verificar registro em audit_log

### Realtime
1. ✅ Abrir dois navegadores com mesmo super_admin
2. ✅ Em um, criar usuário → deve aparecer no outro
3. ✅ Alterar role → deve atualizar em ambos
4. ✅ Deletar → deve remover em ambos

## Notas de Segurança

1. **Senhas**: Nunca armazenadas no frontend, apenas transmitidas via HTTPS para Edge Function
2. **Service Role Key**: Apenas disponível nas Edge Functions (server-side)
3. **RLS**: Todas operações validadas server-side via policies
4. **Audit**: Mudanças rastreáveis com user_id, email e timestamp
5. **Propagação**: Imediata via has_role() sem depender de cache ou re-login

## Integração Futura

### Notificações
- Email ao criar usuário (welcome email)
- Notificação ao mudar role
- Alerta ao super_admin quando role é alterado

### Dashboard de Atividades
- Visualizar criações/edições/exclusões em tempo real
- Filtrar por tipo de ação
- Exportar audit_log

### Gestão de Sessões
- Forçar logout ao mudar role (opcional)
- Visualizar sessões ativas
- Invalidar sessões específicas
