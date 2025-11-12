# FASE 4 - /admin/messages: Status Updates, Storage and Audit

## Objetivo
Corrigir erro ao atualizar status das mensagens e garantir registro de respostas e exclusões.

## ✅ Implementações Concluídas

### Frontend (/admin/messages)

#### 1. Listagem de Mensagens
- ✅ Recuperação de mensagens do Supabase com status (new, read, replied)
- ✅ Real-time updates via Supabase channel
- ✅ Filtro de busca por nome, email ou mensagem
- ✅ Tabela responsiva com todas as informações

#### 2. Atualização de Status
- ✅ Toggle de status via Select component (new → read / replied)
- ✅ Atualização via `supabase.from('contact_messages').update()`
- ✅ Toast de sucesso/erro após atualização
- ✅ Badges coloridos para cada status

#### 3. Responder Mensagem
- ✅ Botões para responder via Email (mailto:)
- ✅ Botões para responder via WhatsApp (wa.me)
- ✅ Status automaticamente alterado para 'replied' ao responder
- ✅ Abertura em nova aba com target="_blank"

#### 4. Visualizar Mensagem
- ✅ Modal de detalhes completo
- ✅ Marca mensagem como 'read' ao abrir se status for 'new'
- ✅ Exibe todas as informações (nome, email, telefone, mensagem, data)

#### 5. Excluir Mensagem
- ✅ Modal de confirmação antes da exclusão
- ✅ Mensagem clara com detalhes da mensagem a ser excluída
- ✅ Exclusão via `supabase.from('contact_messages').delete()`
- ✅ Toast de sucesso/erro
- ✅ Registro automático no audit_log (via trigger)

### Backend (Supabase)

#### 1. RLS Policies (contact_messages)
```sql
-- SELECT: Admins e Super Admins podem visualizar todas as mensagens
CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- INSERT: Qualquer pessoa pode criar mensagens (formulário público)
CREATE POLICY "Anyone can create contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: Apenas Admins e Super Admins podem atualizar mensagens
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- DELETE: Apenas Admins e Super Admins podem excluir mensagens
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
```

#### 2. Audit Logging (Triggers)
```sql
-- Trigger para registrar UPDATEs em contact_messages
CREATE TRIGGER trg_audit_messages_update
AFTER UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();

-- Trigger para registrar DELETEs em contact_messages
CREATE TRIGGER trg_audit_messages_delete
AFTER DELETE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION log_audit_activity();
```

#### 3. Real-time
- ✅ Tabela habilitada para real-time updates
- ✅ Canal Supabase configurado para INSERT, UPDATE e DELETE

## Estrutura da Tabela contact_messages

```sql
contact_messages (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- 'new', 'read', 'replied'
  created_at TIMESTAMPTZ DEFAULT now()
)
```

## Fluxo de Trabalho Admin

1. **Mensagem chega** (status: 'new')
   - Badge vermelho "Nova"
   - Admin recebe notificação via real-time

2. **Admin visualiza** (status: 'new' → 'read')
   - Ao clicar em "View", status muda automaticamente
   - Badge amarelo "Lida"

3. **Admin responde** (status: 'read' → 'replied')
   - Clica em "Email" ou "WhatsApp"
   - Status muda para 'replied'
   - Badge verde "Respondida"
   - Ação registrada no audit_log

4. **Admin exclui** (se necessário)
   - Confirmação modal
   - Exclusão definitiva
   - Ação registrada no audit_log

## Status Badges

- **Nova** (new): Badge vermelho
- **Lida** (read): Badge amarelo
- **Respondida** (replied): Badge verde

## Segurança

✅ RLS habilitado em contact_messages
✅ Apenas admins/super_admins podem UPDATE/DELETE
✅ Usuários anônimos podem apenas INSERT (formulário público)
✅ Audit logging para todas as operações administrativas
✅ Função has_role() com SECURITY DEFINER para evitar recursão RLS

## Observação sobre Aviso de Segurança

O aviso sobre "Leaked Password Protection Disabled" é uma configuração geral do Supabase Auth e não está relacionado com as alterações da FASE 4. Esta configuração pode ser habilitada posteriormente nas configurações de autenticação do projeto Lovable Cloud.

## Próximos Passos

- Considerar implementar notificações push/email para novas mensagens
- Adicionar filtros por status e data
- Implementar paginação para grandes volumes de mensagens
- Adicionar templates de resposta rápida
