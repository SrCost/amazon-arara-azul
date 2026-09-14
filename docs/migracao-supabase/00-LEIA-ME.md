# Migração do banco para um Supabase externo — guia completo

Este pacote recria, num projeto Supabase novo, **exatamente** o banco de dados atual da
Pousada Arara Azul: 26 tabelas, 30 funções, 51 gatilhos, 73 regras de segurança,
3 rotinas automáticas, os 4 usuários administrativos, todo o conteúdo já cadastrado
e as 66 imagens do armazenamento.

## Antes de começar

Tenha em mãos, do **projeto novo**:

- Endereço do projeto (`https://xxxx.supabase.co`)
- Chave pública (anon / publishable)
- Chave secreta (service role) — usada só nos scripts e nas funções de servidor

E do **projeto atual**: a chave secreta (service role), necessária apenas para copiar as imagens.

> Recomendação: faça a migração num horário de baixo movimento e evite receber reservas
> novas durante o processo, para não perder dados criados no meio do caminho.

## Ordem de execução (importante)

Rode os arquivos no **SQL Editor** do novo projeto, um por vez, nesta ordem:

| # | Arquivo | O que faz |
|---|---------|-----------|
| 1 | `01-extensoes-e-tipos.sql` | Extensões e tipos próprios (cargos, origem da reserva) |
| 2 | `02-tabelas.sql` | Cria as 26 tabelas, chaves, validações, ligações e índices |
| 3 | `04-funcoes.sql` | Cria as 30 funções (as regras de segurança dependem delas) |
| 4 | `03-permissoes-e-regras-de-acesso.sql` | Liberações de acesso + proteção por linha + 73 regras |
| 5 | `08-usuarios-de-acesso.sql` | Cria os 4 usuários administrativos com o mesmo identificador |
| 6 | `07-dados-tabela-por-tabela.sql` | Carrega todo o conteúdo atual |
| 7 | `05-gatilhos.sql` | Cria os gatilhos automáticos |
| 8 | `06-agendamentos.sql` | Cria as 3 rotinas diárias |
| 9 | `09-arquivos-e-imagens.md` | Copia as imagens do armazenamento |
| 10 | `10-verificacao-final.sql` | Confere se tudo chegou certo |

**Por que os gatilhos vêm depois dos dados:** o banco registra automaticamente toda
alteração numa trilha de auditoria e gera token de acesso a cada reserva nova. Se os
gatilhos existissem durante a carga, o histórico ficaria poluído com centenas de
registros falsos e tokens duplicados.

**Por que os usuários vêm antes dos dados:** os perfis, cargos e permissões estão
ligados aos usuários de login. Criando primeiro os usuários com o mesmo identificador,
tudo se conecta sozinho.

## Passo a passo

### 1. Criar o projeto novo
No painel do Supabase, crie o projeto na região **South America (São Paulo)** e guarde
a senha do banco. Prefira a versão mais recente do Postgres oferecida.

### 2. Estrutura e conteúdo
Abra o SQL Editor e execute os arquivos 1 a 6 da tabela acima, nessa ordem. Cada arquivo
deve terminar com "Success". Se algum passo falhar, corrija antes de seguir — não pule.

### 3. Senhas dos usuários
Os usuários são criados com senha provisória. Cada pessoa entra em `/auth` e usa
"Esqueci minha senha", ou você envia convite por e-mail (instruções no arquivo 08).

### 4. Gatilhos e rotinas
Execute `05-gatilhos.sql` e depois `06-agendamentos.sql`. No arquivo 06 troque
`<SEU-PROJETO>` e `<SUA-SERVICE-ROLE-KEY>` pelos dados do projeto novo.

### 5. Imagens e arquivos
Siga o arquivo `09-arquivos-e-imagens.md`: crie o depósito público `gallery`, recrie as
3 regras de acesso e rode `transferir-arquivos.mjs`. Os caminhos precisam ficar iguais,
senão as fotos do site quebram.

### 6. Configurações do projeto novo (painel do Supabase)

- **Authentication → Providers**: ativar E-mail; ativar Google se for usar login social.
- **Authentication → URL Configuration**: Site URL `https://pousadararazul.com`;
  redirecionamentos permitidos: `https://pousadararazul.com/**` e a URL de pré-visualização.
- **Authentication → Policies/Protection**: ativar a proteção contra senhas vazadas
  (estava ativa no projeto atual).
- **Authentication → Emails**: reconfigurar remetente e domínio de e-mail.
- Confirmação de e-mail: manter o mesmo comportamento atual (sem autoconfirmação).

### 7. Chaves de integração (secrets das funções de servidor)
Cadastre novamente, no projeto novo, com **exatamente estes nomes**:

`FNRH_API_USER`, `FNRH_API_PASSWORD`, `FNRH_CPF_SOLICITANTE`, `FNRH_ENV`,
`GOOGLE_API_KEY`, `GOOGLE_PLACE_ID`, `MERCADO_PAGO_ACCESS_TOKEN`,
`MERCADO_PAGO_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SITE_URL`,
`VITE_MERCADO_PAGO_PUBLIC_KEY`

As chaves do próprio Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`) são preenchidas pelo próprio projeto.

> As credenciais da FNRH **não** foram exportadas por segurança. A tabela
> `fnrh_credentials` é criada vazia; depois da migração, preencha pelo painel
> administrativo em `/admin/fnrh`.

### 8. Publicar as funções de servidor
As 37 funções da pasta `supabase/functions` precisam ser publicadas no projeto novo:

```bash
npx supabase login
npx supabase link --project-ref <REF-DO-PROJETO-NOVO>
npx supabase functions deploy
```

Depois atualize os endereços de retorno (webhooks) no Mercado Pago e no Resend para
apontarem para o novo projeto.

### 9. Apontar o site para o banco novo
No arquivo de ambiente do site, troque o endereço e a chave pública do projeto
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`),
publique e teste.

### 10. Conferir
Execute `10-verificacao-final.sql` e compare as colunas "esperado" e "atual". Depois
teste na prática: página inicial, `/bangalos`, `/experiencias`, uma reserva de teste com
PIX, o login administrativo, o calendário de reservas, o painel FNRH e o formulário de
pré-chegada.

## Boas práticas

- **Não apague o projeto atual** por pelo menos 30 dias após a virada; mantenha-o como
  cópia de segurança (pode ficar pausado).
- **Faça a migração primeiro num projeto de teste**, valide, e só então repita no
  definitivo — os scripts podem ser executados quantas vezes for necessário.
- **Recarga dos dados**: se precisar recarregar o conteúdo, apague os gatilhos, rode o
  arquivo 07 novamente (ele ignora registros repetidos) e recrie os gatilhos.
- **Dados novos criados durante a virada**: se entrarem reservas no projeto antigo depois
  da exportação, gere de novo apenas o arquivo 07 e recarregue.
- **Cuidado com as chaves secretas**: a service role dá acesso total, ignorando as regras
  de segurança. Use somente nos scripts locais e nas funções de servidor, nunca no site.
- **Trilha de auditoria**: a limpeza automática apaga registros com mais de 15 dias.
  Se quiser guardar o histórico completo, exporte `activity_log` antes.

## O que não é migrado (e por quê)

| Item | Motivo |
|------|--------|
| `fnrh_credentials` (conteúdo) | Contém senha de integração; recadastre no painel |
| `rate_limits` (conteúdo) | Cache temporário de limite de requisições; recria-se sozinho |
| Senhas dos usuários | O Supabase não exporta senhas; cada pessoa redefine a sua |
| Imagens em `src/assets` e PDFs em `public/docs` | Fazem parte do código do site |
