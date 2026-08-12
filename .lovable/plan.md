# Diagnóstico do erro 401 da FNRH (não é CORS)

## Conclusão sobre CORS
CORS não pode ser a causa. A chamada à FNRH é feita **de servidor para servidor**, dentro das Edge Functions (`_shared/fnrh.ts`), com Basic Auth. O navegador só fala com o nosso próprio backend, que já responde com os cabeçalhos CORS corretos. Além disso, um bloqueio de CORS nunca produz um `401` com mensagem de "usuário ou senha inválidos" — esse corpo de resposta vem da própria API oficial, o que prova que a conexão de rede foi estabelecida.

## O que o log mostra hoje
- Requisição sai da Edge Function, chega ao endpoint de produção da FNRH.
- Resposta: HTTP 401 com mensagem de credenciais inválidas.
- A reserva do Flávio Costa fica salva localmente com `ERRO_SINCRONIZACAO` (nenhum dado é perdido).

## Passos propostos

1. **Prova de conexão isolada**
   Criar uma rota de diagnóstico interna (`fnrh-diagnostico`, só admin) que:
   - resolve o host da FNRH e mede o tempo de resposta;
   - faz uma chamada a um endpoint público de domínios;
   - devolve status HTTP, tempo e mensagem da API — sem nunca expor usuário/senha.
   Isso confirma em tela que rede e TLS estão OK e que o problema é apenas de credencial.

2. **Verificação do formato da credencial**
   Sem revelar valores, a função reporta apenas: comprimento do usuário, se há espaços/quebras de linha, e se o CPF do solicitante está presente e com 11 dígitos. Erros de colagem (espaço no fim, senha do portal em vez da senha de API) são a causa mais comum de 401.

3. **Teste dos dois ambientes**
   Repetir a mesma chamada contra homologação e produção para identificar em qual ambiente o usuário está habilitado.

4. **Painel FNRH**
   Trocar a mensagem genérica de erro por um texto que explique que a recusa vem da API oficial e o que verificar, com um botão "Rodar diagnóstico".

## Detalhes técnicos
- Nova Edge Function `supabase/functions/fnrh-diagnostico/index.ts`, autenticação interna via `getInternalAuth` (admin/super_admin), sem gravar nada no banco.
- Nenhuma credencial em logs, respostas ou tela: apenas metadados de forma.
- Alteração de UI restrita a `src/pages/admin/Fnrh.tsx`.
- Nenhuma mudança de schema.

## O que provavelmente será preciso do lado do Ministério
Se o diagnóstico confirmar conexão OK + 401, o desbloqueio depende de confirmar com o suporte da FNRH/SERPRO: usuário habilitado em produção, senha específica de integração (diferente da do portal) e CPF do solicitante vinculado ao CADASTUR do meio de hospedagem.
