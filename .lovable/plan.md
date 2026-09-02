# Permissões por módulo no cadastro de usuários

Hoje o acesso ao painel é definido apenas pelo cargo (user / admin / super_admin), o que é rígido: quem é "admin" vê todos os módulos avançados. A proposta é somar ao cargo um conjunto de botões liga/desliga por módulo, definidos na criação do usuário e editáveis depois.

## Como vai funcionar

Na tela Usuários, tanto no diálogo "Novo usuário" quanto no de edição, aparece uma lista de módulos com um interruptor cada:

Dashboard, Calendário, Reservas, Mensagens, Galeria, Carrossel, Automação, Formulários, FNRH, Pacotes, Bangalôs, Experiências, Pagamentos, Usuários, Histórico.

Regras:
- Super admin sempre tem todos os módulos (interruptores mostrados travados/ligados) — evita alguém se trancar fora do sistema.
- Ao criar um usuário, vêm ligados por padrão os módulos básicos (Dashboard, Calendário, Reservas, Mensagens); os demais desligados. Basta ligar o que o usuário precisa.
- O cargo continua valendo como teto: se o módulo exige admin e a pessoa é "user", o interruptor pode ser ligado, mas só passa a valer quando o cargo for elevado.
- Se um usuário não tem nenhuma permissão salva (usuários antigos), o comportamento atual por cargo é mantido — nada quebra.

Efeito no painel: o menu lateral mostra apenas os módulos habilitados, e o acesso direto pela URL de um módulo desabilitado é bloqueado com a mesma tela de acesso negado já existente.

## Detalhes técnicos

1. Nova tabela `public.user_module_permissions` (`user_id`, `module` text, `enabled` boolean, timestamps, único por user+module), com GRANTs, RLS: cada usuário lê as próprias linhas; super_admin lê e escreve todas (via `has_role`). Trigger de `updated_at`.
2. Catálogo único de módulos em `src/config/adminModules.ts` (chave, rótulo, rota, cargo mínimo, ícone) — usado pelo menu, pelas rotas e pela tela de Usuários, para não duplicar listas.
3. Hook `useModulePermissions` (permissões do usuário logado, com realtime como já é feito para `user_roles`) exposto via `AuthContext`.
4. `AdminLayout` monta o menu a partir do catálogo + permissões; `ProtectedRoute` recebe também `module` e nega se o módulo estiver desabilitado, mantendo a checagem de cargo atual.
5. `Users.tsx`: grade de `Switch` nos diálogos de criar/editar; ao salvar, faz upsert/delete das linhas de permissão. A criação continua via edge function `create-user`, que passa a aceitar a lista de módulos e gravá-la com service_role após validar que quem chamou é super_admin.
6. Sem backfill: ausência de linhas = fallback por cargo.
