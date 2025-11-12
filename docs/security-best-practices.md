# Segurança e Boas Práticas - Amazon Arara Azul

## Resumo

Este documento consolida todas as práticas de segurança implementadas no sistema Amazon Arara Azul, cobrindo RLS policies, gestão de tokens, validação de entrada, e práticas de código seguro.

---

## 1. Row Level Security (RLS) Policies

### 1.1 Princípios Fundamentais

**RLS é a primeira linha de defesa:**
- ✅ Toda tabela com dados sensíveis DEVE ter RLS habilitado
- ✅ Policies DEVEM ser testadas para todos os roles (super_admin, admin, user, anon)
- ✅ Princípio do menor privilégio: conceder apenas acesso necessário
- ✅ Usar `SECURITY DEFINER` functions para evitar recursão RLS

**Verificar RLS habilitado:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- rowsecurity deve ser TRUE para todas tabelas críticas
```

### 1.2 Tabelas com RLS Implementado

#### ✅ activity_log (Audit Log)
```sql
-- SELECT: apenas super_admin
CREATE POLICY "Super admins can view all activity logs"
ON activity_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- INSERT: qualquer autenticado (triggers precisam inserir)
CREATE POLICY "System can insert activity logs"
ON activity_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE/DELETE: PROIBIDO (logs são imutáveis)
```

**Justificativa:**
- Logs de auditoria não podem ser alterados ou deletados
- Apenas super_admins veem histórico completo
- INSERT via triggers para registrar ações

#### ✅ profiles
```sql
-- SELECT: admins veem todos, usuários veem apenas próprio
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() = id
);

-- UPDATE: apenas próprio perfil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- ALL: super_admin full control
CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
```

**Justificativa:**
- Admins precisam ver perfis para gestão de usuários
- Usuários comuns editam apenas próprio perfil
- Super_admins gerenciam todos perfis (criar/editar/deletar)

#### ✅ user_roles
```sql
-- SELECT: super_admin vê todos
CREATE POLICY "Super admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- INSERT/UPDATE/DELETE: apenas super_admin
CREATE POLICY "Super admins can insert roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
```

**Justificativa:**
- Escalação de privilégios é crítica, apenas super_admin pode alterar
- Impede admin comum de se promover a super_admin
- `USING` verifica quem está fazendo a ação, `WITH CHECK` valida dados inseridos

#### ✅ reservations
```sql
-- SELECT: admins veem todas, usuários veem próprias
CREATE POLICY "Admins can view all reservations"
ON reservations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own reservations"
ON reservations FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])
  )) OR 
  (auth.uid() = user_id) OR 
  ((user_id IS NULL) AND (guest_email = get_current_user_email()))
);

-- INSERT: qualquer um pode criar reserva (público)
CREATE POLICY "Anyone can create reservations"
ON reservations FOR INSERT
WITH CHECK ((user_id IS NULL) OR (user_id = auth.uid()));

-- UPDATE/DELETE: apenas admins
CREATE POLICY "Admins can update reservations"
ON reservations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reservations"
ON reservations FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
```

**Justificativa:**
- Reservas podem ser feitas por anônimos (guest_email)
- Usuários logados veem próprias reservas
- Admins gerenciam todas reservas

#### ✅ payments
```sql
-- SELECT: admins veem todos, usuários veem pagamentos de suas reservas
CREATE POLICY "Admins can manage all payments"
ON payments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM reservations
  WHERE reservations.id = payments.reservation_id 
  AND reservations.user_id = auth.uid()
));
```

**Justificativa:**
- Usuários veem apenas pagamentos de suas reservas (via JOIN)
- Admins gerenciam todos pagamentos (mudar status, gerar comprovantes)
- UPDATE via admin, não via usuário (evita fraude)

#### ✅ contact_messages
```sql
-- SELECT: admins veem todas, usuários não veem (privacidade)
CREATE POLICY "Admins can view all contact messages"
ON contact_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- INSERT: qualquer um pode enviar mensagem (público)
CREATE POLICY "Anyone can create contact messages"
ON contact_messages FOR INSERT
WITH CHECK (true);

-- UPDATE/DELETE: apenas admins
CREATE POLICY "Admins can update contact messages"
ON contact_messages FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact messages"
ON contact_messages FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
```

**Justificativa:**
- Mensagens de contato são públicas (formulário sem auth)
- Apenas admins veem/editam mensagens
- Usuários comuns não veem mensagens de outros

#### ✅ rooms
```sql
-- SELECT: qualquer um vê quartos ativos (público)
CREATE POLICY "Anyone can view active rooms"
ON rooms FOR SELECT
USING (is_active = true);

-- ALL: apenas admins gerenciam quartos
CREATE POLICY "Admins can manage rooms"
ON rooms FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
```

**Justificativa:**
- Quartos disponíveis são públicos (landing page)
- Apenas admins ativam/desativam/editam quartos

### 1.3 Função has_role() - Evitando Recursão RLS

**Problema comum:**
```sql
-- ❌ ERRADO: Causa recursão infinita
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
);
-- Erro: infinite recursion detected in policy
```

**Solução: SECURITY DEFINER function**
```sql
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ✅ CORRETO: Policy usa função
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id);
```

**Por que funciona:**
- `SECURITY DEFINER`: executa com privilégios do owner (bypassa RLS)
- `STABLE`: Postgres pode cachear resultado durante query
- `SET search_path = public`: previne privilege escalation via search_path

---

## 2. Gestão de Tokens e Autenticação

### 2.1 JWT Tokens (Supabase Auth)

**Como funcionam:**
1. Usuário faz login → Supabase gera `access_token` (JWT) e `refresh_token`
2. `access_token` expira em 1 hora
3. `refresh_token` válido por 30 dias, usado para gerar novo `access_token`
4. Tokens armazenados em `localStorage` (auto-gerenciado pelo Supabase client)

**Estrutura do JWT:**
```json
{
  "aud": "authenticated",
  "exp": 1700000000,
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "iss": "https://PROJECT_ID.supabase.co/auth/v1"
}
```

**RLS usa `auth.uid()`:**
- `auth.uid()` extrai `sub` (user ID) do JWT
- Supabase valida assinatura do JWT automaticamente
- Token inválido/expirado → `auth.uid()` retorna NULL → RLS bloqueia acesso

### 2.2 Armazenamento Seguro de Tokens

**✅ Implementação atual (Supabase):**
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage, // Tokens em localStorage
    persistSession: true, // Manter sessão entre refreshes
    autoRefreshToken: true, // Refresh automático antes de expirar
  }
});
```

**Por que localStorage é seguro aqui:**
- ✅ Tokens são JWT assinados (não podem ser forjados)
- ✅ Supabase valida assinatura em toda requisição
- ✅ Tokens expiram automaticamente
- ✅ XSS é mitigado (ver seção 4.3)

**❌ O que NÃO fazer:**
```typescript
// ❌ NUNCA: Não armazene service role key no cliente
const supabase = createClient(URL, SERVICE_ROLE_KEY); // PERIGOSO!

// ❌ NUNCA: Não armazene senhas ou secrets
localStorage.setItem('password', password); // PÉSSIMO!
```

### 2.3 Refresh Token Flow

**Fluxo automático (Supabase):**
```
1. access_token expira (1h)
2. Supabase client detecta expiração
3. Usa refresh_token para chamar /auth/v1/token?grant_type=refresh_token
4. Recebe novo access_token e refresh_token
5. Atualiza localStorage automaticamente
6. Retenta requisição original
```

**Manual refresh (se necessário):**
```typescript
const { data, error } = await supabase.auth.refreshSession();
if (error) {
  // Refresh falhou, forçar logout
  await supabase.auth.signOut();
  window.location.href = '/auth';
}
```

### 2.4 Logout Seguro

**Logout completo:**
```typescript
await supabase.auth.signOut();
// - Remove tokens de localStorage
// - Invalida refresh_token no servidor
// - Redireciona para /auth
```

**Logout em todos dispositivos (admin pode forçar):**
```typescript
// Via Edge Function com service role
const { error } = await supabaseAdmin.auth.admin.signOut(userId);
// Invalida todas sessões do usuário
```

---

## 3. Edge Functions: Operações Privilegiadas

### 3.1 Quando Usar Edge Functions

**✅ Usar Edge Function quando:**
- Criar/deletar usuários (requer Admin API)
- Processar pagamentos (Banco Caixa webhook)
- Enviar emails (API keys)
- Gerar PDFs server-side
- Validar dados sensíveis

**❌ NÃO usar Edge Function quando:**
- Simples CRUD com RLS (Supabase client é mais rápido)
- UI rendering (fazer no frontend)
- Operações já protegidas por RLS

### 3.2 Service Role Key vs Anon Key

**SUPABASE_ANON_KEY (público):**
- ✅ Pode ser exposto no frontend
- ✅ RLS policies aplicam automaticamente
- ✅ Usa para CRUD de usuário comum
- ❌ NÃO pode criar/deletar usuários
- ❌ NÃO bypassa RLS

**SUPABASE_SERVICE_ROLE_KEY (privado):**
- ❌ NUNCA expor no frontend
- ✅ Bypassa RLS (acesso total)
- ✅ Pode criar/deletar usuários via Admin API
- ✅ Usar apenas em Edge Functions

**Exemplo seguro:**
```typescript
// supabase/functions/create-user/index.ts
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // ✅ Server-side apenas
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Verificar role antes de executar
const token = req.headers.get('authorization')?.replace('Bearer ', '');
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

const { data: roleData } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .maybeSingle();

if (roleData?.role !== 'super_admin') {
  throw new Error('Only super administrators can create users');
}
```

### 3.3 CORS e Validação de Origem

**Sempre incluir CORS headers:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // ⚠️ Considerar restringir a domínios específicos
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle OPTIONS (preflight)
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

**Produção: Restringir origins:**
```typescript
const ALLOWED_ORIGINS = [
  'https://arara-azul.com',
  'https://www.arara-azul.com',
  'http://localhost:5173' // Dev only
];

const origin = req.headers.get('origin');
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 4. Validação de Entrada (Input Validation)

### 4.1 Princípios

**Defense in depth:**
1. ✅ **Client-side validation:** UX (feedback imediato)
2. ✅ **Server-side validation:** Segurança (nunca confiar no cliente)
3. ✅ **Database constraints:** Última linha de defesa

**Sempre validar:**
- Tipo de dados (string, number, email)
- Tamanho (min/max length)
- Formato (regex para email, telefone, etc)
- Whitelist de valores permitidos (roles: 'admin', 'user', não aceitar qualquer string)

### 4.2 Validação com Zod (Frontend)

**Exemplo: Criar usuário**
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email muito longo" }),
  
  password: z.string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" })
    .max(72, { message: "Senha muito longa" }), // bcrypt limita 72 chars
  
  full_name: z.string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .max(100, { message: "Nome muito longo" }),
  
  role: z.enum(['super_admin', 'admin', 'user'], {
    errorMap: () => ({ message: "Role inválida" })
  })
});

// Uso
try {
  const validatedData = createUserSchema.parse({
    email: formData.email,
    password: formData.password,
    full_name: formData.full_name,
    role: formData.role
  });
  
  // Enviar para Edge Function
  await fetch('/functions/v1/create-user', {
    method: 'POST',
    body: JSON.stringify(validatedData)
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      toast.error(err.message);
    });
  }
}
```

### 4.3 Validação Server-Side (Edge Functions)

**Validar novamente no servidor:**
```typescript
// supabase/functions/create-user/index.ts
interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'user';
}

serve(async (req) => {
  const body: CreateUserRequest = await req.json();
  
  // Validação de entrada
  if (!body.email || !body.password || !body.full_name || !body.role) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Validar email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email format' }),
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Validar password length
  if (body.password.length < 6 || body.password.length > 72) {
    return new Response(
      JSON.stringify({ error: 'Password must be 6-72 characters' }),
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Validar role whitelist
  if (!['super_admin', 'admin', 'user'].includes(body.role)) {
    return new Response(
      JSON.stringify({ error: 'Invalid role' }),
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Sanitizar nome (remover caracteres especiais perigosos)
  const sanitizedName = body.full_name.replace(/[<>]/g, '');
  
  // Proceder com criação...
});
```

### 4.4 SQL Injection Prevention

**✅ Usar Prepared Statements (automático com Supabase):**
```typescript
// ✅ SEGURO: Supabase client usa prepared statements
const { data, error } = await supabase
  .from('reservations')
  .select('*')
  .eq('guest_email', userInput); // Escapado automaticamente
```

**❌ NUNCA concatenar SQL:**
```typescript
// ❌ PERIGOSO: SQL injection
const query = `SELECT * FROM reservations WHERE guest_email = '${userInput}'`;
// Se userInput = "'; DROP TABLE reservations; --"
// Executa: SELECT * FROM reservations WHERE guest_email = ''; DROP TABLE reservations; --'
```

**Edge Functions: NUNCA executar SQL raw:**
```typescript
// ❌ PROIBIDO em Edge Functions
await supabaseAdmin.rpc('execute_raw_sql', { query: userInput });

// ✅ SEMPRE usar client methods
await supabaseAdmin.from('table').select().eq('column', userInput);
```

### 4.5 XSS Prevention

**React escapa automaticamente:**
```typescript
// ✅ SEGURO: React escapa HTML
<p>{userInput}</p>
// userInput = "<script>alert('xss')</script>"
// Renderiza: &lt;script&gt;alert('xss')&lt;/script&gt;
```

**❌ dangerouslySetInnerHTML:**
```typescript
// ❌ PERIGOSO: Permite HTML arbitrário
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// userInput = "<img src=x onerror=alert('xss')>"
// Executa script!
```

**✅ Se precisar HTML, sanitizar:**
```typescript
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
  ALLOWED_ATTR: ['href']
});

<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### 4.6 URL/Link Validation

**Validar links externos (WhatsApp, email):**
```typescript
// ❌ PERIGOSO: Permite javascript: URLs
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

// ✅ SEGURO: Validar e encodar
const sanitizePhoneNumber = (phone: string): string => {
  // Remove tudo exceto dígitos e +
  return phone.replace(/[^\d+]/g, '');
};

const encodeMessage = (msg: string): string => {
  // Limitar tamanho e encodar
  return encodeURIComponent(msg.substring(0, 1000));
};

const phoneNumber = sanitizePhoneNumber(userInput);
const message = encodeMessage(userMessage);

// Verificar se começa com +55 (Brasil)
if (!phoneNumber.startsWith('+55')) {
  throw new Error('Número de telefone inválido');
}

const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
```

---

## 5. Segurança de Secrets

### 5.1 Variáveis de Ambiente

**✅ No Lovable Cloud (Supabase):**
```bash
# .env (auto-gerenciado, não editar)
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc... # ✅ Público, pode expor
VITE_SUPABASE_PROJECT_ID=PROJECT_ID
```

**❌ NUNCA expor:**
```bash
# Secrets server-only (apenas em Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # ❌ NUNCA no frontend
OPENAI_API_KEY=sk-... # ❌ NUNCA no frontend
STRIPE_SECRET_KEY=sk_live_... # ❌ NUNCA no frontend
```

### 5.2 Acessar Secrets em Edge Functions

```typescript
// supabase/functions/my-function/index.ts
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // ✅ Server-side
const openaiKey = Deno.env.get('OPENAI_API_KEY'); // ✅ Server-side

// Verificar se secret existe
if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}
```

### 5.3 Logging Seguro

**❌ NUNCA logar secrets:**
```typescript
// ❌ PERIGOSO
console.log('User created:', { email, password, token }); // Loga senha!

// ✅ SEGURO
console.log('User created:', { email, userId }); // Sem dados sensíveis
```

**❌ NUNCA logar tokens completos:**
```typescript
// ❌ PERIGOSO
console.log('Authorization:', req.headers.get('authorization'));

// ✅ SEGURO (apenas primeiros caracteres)
const token = req.headers.get('authorization');
console.log('Authorization:', token?.substring(0, 20) + '...');
```

---

## 6. Auditoria e Compliance

### 6.1 Logs Imutáveis

**activity_log não pode ser alterado:**
- ✅ Nenhuma policy permite UPDATE ou DELETE
- ✅ Apenas INSERT via triggers (automatizado)
- ✅ SELECT restrito a super_admins
- ✅ Retenção de 15 dias (LGPD compliance)

**Verificar imutabilidade:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'activity_log';
-- Deve ter apenas: SELECT (super_admin), INSERT (authenticated)
-- Não deve ter: UPDATE, DELETE
```

### 6.2 LGPD / GDPR Compliance

**Dados pessoais coletados:**
- Perfis: nome, email, telefone
- Reservas: nome, email, telefone, requests especiais
- Mensagens: nome, email, telefone, mensagem
- Audit log: user_email, ações realizadas

**Direitos do usuário:**
1. **Acesso:** Usuário pode ver próprios dados (RLS policy)
2. **Retificação:** Usuário pode editar próprio perfil
3. **Exclusão:** Super admin pode deletar usuário (cascade delete em profiles, reservations, payments, audit_log)
4. **Portabilidade:** Exportar dados via SQL query ou UI

**Implementar exportação de dados:**
```typescript
// Edge Function: export-user-data
const { data: profile } = await supabase.from('profiles').select().eq('id', userId).single();
const { data: reservations } = await supabase.from('reservations').select().eq('user_id', userId);
const { data: payments } = await supabase.from('payments').select().eq('reservation_id', reservations.map(r => r.id));

const exportData = {
  profile,
  reservations,
  payments,
  exported_at: new Date().toISOString()
};

return new Response(JSON.stringify(exportData, null, 2), {
  headers: {
    'Content-Type': 'application/json',
    'Content-Disposition': `attachment; filename="user-data-${userId}.json"`
  }
});
```

---

## 7. Checklist de Segurança

### 7.1 RLS Policies
- [x] Todas tabelas críticas têm RLS habilitado
- [x] Policies testadas para todos roles
- [x] `has_role()` function implementada (SECURITY DEFINER)
- [x] Princípio do menor privilégio aplicado
- [ ] **TODO:** Testar policies com usuários reais em staging

### 7.2 Autenticação e Tokens
- [x] JWT tokens gerenciados por Supabase
- [x] Refresh token flow automático
- [x] Logout invalida tokens
- [x] Service role key nunca exposto no frontend
- [ ] **TODO:** Implementar 2FA (TOTP) para super_admins

### 7.3 Edge Functions
- [x] Service role key apenas em Edge Functions
- [x] CORS headers configurados
- [x] Validação de role antes de operações privilegiadas
- [x] Validação de entrada em todos endpoints
- [ ] **TODO:** Rate limiting (ex: 100 req/min por IP)

### 7.4 Validação de Entrada
- [x] Zod schemas no frontend
- [x] Validação server-side em Edge Functions
- [x] SQL injection prevenido (Supabase client)
- [x] XSS prevenido (React auto-escape)
- [x] URL validation para links externos
- [ ] **TODO:** Implementar sanitização de uploads de arquivos (se implementado)

### 7.5 Auditoria
- [x] activity_log imutável (nenhum UPDATE/DELETE)
- [x] Triggers em todas tabelas críticas
- [x] Retenção de 15 dias (pg_cron cleanup)
- [x] SELECT restrito a super_admins
- [ ] **TODO:** Alertas automáticos para ações críticas

### 7.6 Compliance
- [x] Retenção de logs documentada (15 dias)
- [x] Usuários podem ver próprios dados (RLS)
- [x] Super admin pode deletar usuário (LGPD/GDPR)
- [ ] **TODO:** Implementar exportação de dados via UI
- [ ] **TODO:** Política de privacidade atualizada

---

## 8. Incidentes e Resposta

### 8.1 Procedimento em Caso de Breach

**1. Detectar:**
- Monitorar activity_log para ações suspeitas
- Alertas automáticos (ex: múltiplas falhas de login)
- Verificar logs de Edge Functions

**2. Conter:**
```sql
-- Revogar todas sessões de um usuário comprometido
-- Via Edge Function com service role
await supabaseAdmin.auth.admin.signOut(compromisedUserId);

-- Desabilitar usuário (soft delete)
UPDATE profiles SET is_active = false WHERE id = compromisedUserId;
```

**3. Investigar:**
```sql
-- Ver ações do usuário comprometido
SELECT * FROM activity_log 
WHERE user_id = compromisedUserId 
ORDER BY created_at DESC;

-- Ver logins recentes
SELECT * FROM auth.audit_log_entries
WHERE user_id = compromisedUserId
AND payload->>'action' = 'login'
ORDER BY created_at DESC;
```

**4. Remediar:**
- Forçar reset de senha para usuário afetado
- Revogar tokens
- Auditar dados acessados/modificados
- Notificar usuários afetados (se aplicável)

**5. Documentar:**
- Registrar incidente em documento separado
- Lições aprendidas
- Medidas de prevenção implementadas

### 8.2 Monitoramento Contínuo

**Métricas de segurança:**
- Falhas de autenticação (ex: >5 falhas em 10 min)
- Mudanças de role (especialmente para super_admin)
- Exclusões em massa (ex: >10 reservas deletadas em 1 min)
- Acessos fora de horário (ex: admin login às 3 AM)

**Implementar alertas:**
```sql
-- Trigger para alertar mudanças de super_admin
CREATE OR REPLACE FUNCTION alert_super_admin_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'super_admin' THEN
    -- Enviar alerta via Edge Function
    PERFORM net.http_post(
      url := 'https://PROJECT_ID.supabase.co/functions/v1/send-alert',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'type', 'super_admin_change',
        'user_id', NEW.user_id,
        'changed_by', auth.uid()
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_alert_super_admin_change
AFTER INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION alert_super_admin_change();
```

---

## 9. Recursos e Referências

**Supabase Security:**
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Common RLS Patterns](https://supabase.com/docs/guides/auth/row-level-security#common-patterns)

**OWASP:**
- [Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

**Compliance:**
- [LGPD Brasil](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [GDPR Europa](https://gdpr.eu/)

---

**Última atualização:** 2025-11-12  
**Próxima revisão:** 2025-05-12 (6 meses)  
**Responsável:** Equipe de Desenvolvimento Amazon Arara Azul
