# Migração do banco para um Supabase externo

Objetivo: gerar um pacote completo de arquivos SQL e um guia passo a passo para recriar, num novo projeto Supabase, exatamente a mesma estrutura e o mesmo conteúdo do banco atual — incluindo usuários, permissões, regras de acesso, funções, gatilhos e as 66 imagens/arquivos guardados hoje (cerca de 160 MB).

## O que será entregue

Uma nova pasta `docs/migracao-supabase/` com arquivos numerados, feitos para serem executados em ordem:

- `00-LEIA-ME.md` — guia completo passo a passo (o documento principal).
- `01-extensoes-e-tipos.sql` — extensões necessárias e o tipo de cargos (`super_admin`, `admin`, `user`) e demais tipos usados.
- `02-tabelas.sql` — criação das 26 tabelas com todos os campos, valores padrão, chaves primárias, ligações entre tabelas e índices.
- `03-permissoes-e-regras-de-acesso.sql` — liberações de acesso e todas as regras de segurança por linha (quem pode ver, criar, editar e apagar cada informação).
- `04-funcoes.sql` — as 30 funções do banco (disponibilidade, tokens de hóspede, pré-chegada, auditoria, limites de uso etc.).
- `05-gatilhos.sql` — os gatilhos automáticos (auditoria, atualização de datas, geração de token de reserva, sincronização de pagamento, criação de perfil ao cadastrar usuário).
- `06-agendamentos.sql` — as rotinas automáticas diárias (limpeza de registros antigos, atualização das avaliações do Google).
- `07-dados-tabela-por-tabela.sql` — todo o conteúdo atual, na ordem correta das dependências: 9 bangalôs, 15 experiências, pacotes, 33 imagens da galeria, slide do carrossel, 14 reservas com seus quartos/experiências/formulários, pagamentos, 129 registros de e-mail, 220 registros de auditoria, 4 perfis e seus cargos e permissões de módulos.
- `08-usuarios-de-acesso.sql` — recriação dos 4 usuários administrativos com os mesmos identificadores, para que perfis, cargos e permissões continuem ligados corretamente.
- `09-arquivos-e-imagens.md` — como transferir o conteúdo do armazenamento (pasta pública de imagens) e recriar suas regras de acesso.
- `10-verificacao-final.sql` — consultas de conferência: contagem de registros por tabela e checagem de que nada ficou faltando.
- `transferir-arquivos.mjs` — script pronto para copiar todas as imagens do armazenamento antigo para o novo, preservando os mesmos caminhos (para que os links do site continuem funcionando).

## Decisões aplicadas

- Os dados serão exportados como comandos de inserção prontos, com todos os campos preenchidos e as ligações entre tabelas preservadas.
- As senhas e chaves de integração (FNRH, Mercado Pago, Resend, Google) **não** vão nos arquivos. O guia lista quais precisam ser cadastradas novamente no novo projeto, com o nome exato de cada uma.
- A tabela de credenciais FNRH será criada vazia, com instrução para você preencher pelo painel administrativo depois da migração.
- Os 4 usuários administrativos serão recriados com o mesmo identificador interno e uma senha provisória, e o guia explica como cada pessoa redefine a própria senha no primeiro acesso.
- O guia também cobre o que ajustar no site depois da troca: endereço do novo projeto e chave pública, republicação das 37 funções de servidor e reconfiguração de e-mail, login e domínio.

## Detalhes técnicos

Estrutura extraída do banco atual via consultas ao catálogo (`information_schema`, `pg_policies`, `pg_proc`, `pg_trigger`, `pg_indexes`, `cron.job`) para garantir fidelidade byte a byte às definições em produção, em vez de reaproveitar os 79 arquivos históricos de migração (que contêm alterações sobrepostas e não refletem o estado final).

- Ordem de execução respeita dependências: tipos → tabelas → GRANT → RLS/policies → funções → triggers → cron → dados.
- Inserções com `ON CONFLICT DO NOTHING` e triggers de auditoria temporariamente desativados durante a carga, para não gerar registros falsos em `activity_log`.
- Usuários criados via `auth.admin.createUser` com `id` fixo (script no guia), pois `auth.users` não deve receber `INSERT` direto; o gatilho `handle_new_user` será criado **após** a carga de perfis para evitar duplicidade.
- Sequências não se aplicam (todas as chaves são `uuid` com `gen_random_uuid()`); serão validadas as extensões `pgcrypto` (usada por `generate_reservation_token`) e `pg_cron`.
- Transferência de arquivos via API de armazenamento com `service_role` nos dois projetos, mantendo `storage_path` idêntico ao registrado em `gallery_images`.

Nenhum código do site em produção será alterado nesta etapa — apenas criação dos arquivos de migração e do guia.
