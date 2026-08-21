# Painel de credenciais FNRH (produção) no admin

## Objetivo
Permitir que você atualize, salve e teste as credenciais oficiais da FNRH (usuário, senha de API e CPF do solicitante) direto no painel administrativo, sempre no ambiente de **produção**, com validação de formato e teste de conexão antes e depois de salvar.

## O que será construído

### 1. Nova aba "Credenciais" em /admin/fnrh
- Formulário com três campos: Usuário da API, Senha/Chave da API, CPF do solicitante (CADASTUR).
- Ambiente fixo em **Produção** (`https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v2`), exibido apenas como informação.
- Campos de senha com opção de mostrar/ocultar; nenhum valor salvo é devolvido para a tela.
- Painel de status mostrando somente metadados: se está configurado, tamanho do usuário/senha, presença de espaços ou quebras de linha, validade do CPF, data da última atualização e quem atualizou.
- Dois botões:
  - **Testar sem salvar**: valida os valores digitados contra a API oficial e mostra o veredito.
  - **Salvar credenciais**: grava e, em seguida, executa o teste automaticamente exibindo o resultado.
- Resultado do teste mostrado com veredito legível (Credenciais aceitas / Credencial recusada / Sem permissão / Indisponível / Timeout), HTTP status, mensagem oficial da FNRH e duração.

### 2. Validação de formato (conforme a documentação anexada)
A API usa Basic Authentication (RFC 7617) com `Base64(usuario:senha)` e exige o header `cpf_solicitante`. Portanto:
- Usuário: obrigatório, sem espaços internos, sem quebras de linha, sem `:` (quebraria a concatenação Basic), 3–200 caracteres.
- Senha/Chave: obrigatória, sem espaços nem quebras de linha, 6–500 caracteres.
- CPF do solicitante: 11 dígitos, validado por dígito verificador (usa o validador de CPF já existente no projeto).
- Aparo automático de espaços nas pontas antes de validar e salvar.
- Erros exibidos campo a campo, em português.

### 3. Armazenamento seguro
As credenciais deixam de depender de atualização manual de secrets e passam a ficar em uma tabela de configuração de integração acessível **somente pelo backend**:
- Tabela singleton com os campos de credencial, ambiente, `updated_at` e `updated_by`.
- RLS habilitada sem nenhuma política para usuários finais e privilégios concedidos apenas ao papel de serviço: nem admin logado nem visitante conseguem ler os valores pela API pública.
- A leitura acontece apenas dentro das Edge Functions da FNRH, que continuam sendo as únicas a montar o header `Authorization`.
- Compatibilidade: se a tabela estiver vazia, o backend continua usando os secrets atuais (`FNRH_API_USER`, `FNRH_API_PASSWORD`, `FNRH_CPF_SOLICITANTE`), sem quebrar nada do que já funciona.

### 4. Backend
- Nova função `fnrh-credenciais` com três operações, restritas a administrador autenticado:
  - `status`: devolve só metadados (nunca os valores).
  - `salvar`: valida novamente no servidor e grava.
  - `testar`: dispara uma chamada real e autenticada à API oficial de produção, usando os valores enviados (teste sem salvar) ou os valores em vigor.
- Ajuste no cliente compartilhado da FNRH para buscar as credenciais na tabela e cair nos secrets como reserva; todas as funções existentes (criar reserva, check-in, check-out, fichas, domínios, reprocessar) passam a usar automaticamente as credenciais salvas no painel.
- Logs continuam sanitizados: apenas endpoint, status, duração e metadados de forma; nunca usuário, senha ou Base64.

## Detalhes técnicos
- Tabela: `public.fnrh_credentials` (id fixo, `api_user text`, `api_password text`, `cpf_solicitante text`, `env text default 'producao'`, `updated_at`, `updated_by uuid`), RLS ON, `GRANT ALL ... TO service_role` e nenhum grant para `anon`/`authenticated`.
- Autorização das operações: `has_role(auth.uid(), 'super_admin')` ou `'admin'`, seguindo o padrão de autenticação interna já usado nas funções FNRH.
- Teste de conexão reaproveita a lógica de veredito de `fnrh-diagnostico` (401 = credencial recusada, 400/422 = credencial aceita, 403 = sem permissão CADASTUR, 5xx = indisponível).
- Frontend: nova aba em `src/pages/admin/Fnrh.tsx` com componente dedicado, validação por zod e textos em pt/en/es/fr nos arquivos de i18n.
- `authHeader` do cliente compartilhado passa a ser assíncrono com cache curto em memória por instância, para não consultar o banco a cada chamada.

## Fora do escopo
- Nenhuma alteração nas telas públicas, no fluxo de reserva ou nas regras de negócio existentes.
- O painel não resolve uma recusa vinda do SERPRO: se o usuário/chave não estiver habilitado em produção, o teste continuará retornando 401 com a mensagem oficial — agora com diagnóstico imediato na tela.
