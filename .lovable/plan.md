# Corrigir o erro do passo 07 (perfis sem usuários de login)

## O que aconteceu

O arquivo `07-dados-tabela-por-tabela.sql` carrega os 4 perfis administrativos, e cada perfil
está amarrado a um usuário de login com o mesmo identificador. No projeto novo esses usuários
ainda não existem, então o banco recusa a carga:

```text
Key (id)=(631d2468-...) is not present in table "users"
```

O arquivo `08-usuarios-de-acesso.sql` é justamente esse passo anterior, mas ele não roda no
SQL Editor: só traz o script em comentário para ser executado no computador. Provavelmente
ele foi aberto, "rodou" sem criar nada, e o passo 07 seguiu sem os usuários.

Além dos perfis, as tabelas de cargos, permissões por módulo, auditoria, bloqueios de datas e
galeria também apontam para os usuários — todas falhariam pelo mesmo motivo.

## Como resolver

Passo a passo a ser adicionado ao pacote de migração:

1. Reescrever `08-usuarios-de-acesso.sql` para ser um arquivo **executável no SQL Editor**, que
   cria os 4 usuários de login com o mesmo identificador de hoje e uma senha provisória, e
   ignora quem já existir.
2. Manter no mesmo arquivo, como alternativa, o script para o computador (opção B) e a
   consulta de conferência dos 4 usuários criados.
3. Atualizar `00-LEIA-ME.md`: deixar explícito que o passo 5 (usuários) precisa ser executado
   e conferido **antes** do passo 6 (conteúdo), com a consulta de verificação e o aviso de que
   o erro `profiles_id_fkey` significa exatamente que os usuários não foram criados.
4. Adicionar no início de `07-dados-tabela-por-tabela.sql` uma checagem que interrompe a carga
   com uma mensagem clara em português caso os 4 usuários não estejam presentes, em vez de
   deixar aparecer o erro técnico.

Depois disso, você roda o novo `08`, confere os 4 usuários e roda o `07` novamente — ele ignora
o que já foi carregado, então pode ser executado sem medo.

## Detalhes técnicos

- Novo `08`: `INSERT INTO auth.users` com `id` fixo, `instance_id` zerado, `aud`/`role` =
  `authenticated`, `email_confirmed_at = now()`, `encrypted_password = crypt(<senha>, gen_salt('bf'))`
  (pgcrypto já é habilitado no arquivo 01), `raw_app_meta_data = {"provider":"email","providers":["email"]}`,
  `raw_user_meta_data` com `full_name`, `created_at`/`updated_at` = `now()`, e
  `ON CONFLICT (id) DO NOTHING`. Em seguida `INSERT INTO auth.identities` com
  `provider = 'email'`, `provider_id = email`, `identity_data` contendo `sub` e `email`,
  também com `ON CONFLICT DO NOTHING`, para que o login por e-mail funcione.
- O arquivo 08 deve rodar antes de `05-gatilhos.sql`, senão o gatilho `handle_new_user` cria
  perfis duplicados — a ordem atual do guia (08 → 07 → 05) já garante isso.
- Guarda no topo do 07: bloco `DO $$ ... RAISE EXCEPTION` comparando
  `count(*) FROM auth.users WHERE id IN (...)` com 4.
- Senha provisória documentada no arquivo; cada pessoa troca por "Esqueci minha senha".
- Nenhum código do site é alterado — apenas os arquivos em `docs/migracao-supabase/`.
