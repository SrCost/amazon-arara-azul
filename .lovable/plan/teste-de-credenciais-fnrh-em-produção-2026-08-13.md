# Teste de credenciais FNRH em produção

## Objetivo
Ter um botão no painel FNRH que testa usuário/senha na API oficial e mostra o status detalhado, além de atualizar as credenciais de produção que você já obteve.

## Etapas

1. **Atualizar as credenciais**
   Abrir o formulário seguro para gravar novos valores de `FNRH_API_USER`, `FNRH_API_PASSWORD` e (se mudou) `FNRH_CPF_SOLICITANTE`. Nada é digitado no chat nem gravado no código. `FNRH_ENV` permanece `producao`.

2. **Nova rota de diagnóstico (backend)**
   Edge Function `fnrh-diagnostico`, restrita a admin/super_admin, que:
   - faz uma chamada leve autenticada à API oficial (endpoint de domínios) em produção;
   - devolve: ambiente, status HTTP, tempo de resposta em ms, mensagem oficial da API e um veredito (`OK`, `CREDENCIAL_RECUSADA`, `SEM_PERMISSAO`, `INDISPONIVEL`, `TIMEOUT`);
   - devolve também metadados de forma das credenciais, sem revelar valores: comprimento do usuário/senha, se há espaços ou quebras de linha, e se o CPF do solicitante tem 11 dígitos.
   Opcionalmente permite testar homologação para comparar em qual ambiente o usuário está habilitado.
   Nenhuma gravação no banco, nenhum segredo em log ou resposta.

3. **Botão no painel**
   Em `/admin/fnrh`, adicionar "Testar conexão FNRH" com um cartão de resultado: verde para autenticação aceita, vermelho para recusa, com status HTTP, tempo, mensagem oficial e as dicas de verificação (usuário habilitado em produção, senha de API, CPF vinculado ao CADASTUR).

4. **Reteste da reserva**
   Com o diagnóstico verde, reprocessar a reserva de teste (Flávio Costa) em produção e confirmar que a ficha sai de "Erro de sincronização".

## Detalhes técnicos
- Nova função: `supabase/functions/fnrh-diagnostico/index.ts`, autenticação via `getInternalAuth`, CORS padrão do projeto.
- Reutiliza `supabase/functions/_shared/fnrh.ts` (já faz `trim` das credenciais e trata 401/403/timeout).
- Alteração de UI apenas em `src/pages/admin/Fnrh.tsx`.
- Sem mudanças de schema, tabelas ou políticas.
