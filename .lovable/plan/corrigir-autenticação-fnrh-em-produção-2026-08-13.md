# Corrigir autenticação FNRH em produção

## Conferência já feita
O Base64 de `usuario:chave` com as credenciais que você enviou é exatamente:

```text
OWU2NzAzMDktYWI2My00NzUzLWJmMTYtNTY0ZGM0NmU5MjRiOjJVQmZ6dUdlb0M5V09QbktoVmVs
```

Confere com o valor esperado, e o caractere após o "W" é a letra "O" maiúscula. Ou seja: a concatenação/encoding do nosso código já está correta — o que muda agora são os valores gravados.

Importante: as credenciais foram colocadas no chat. Vou gravá-las no cofre de segredos (nunca no código) e recomendo que você as rotacione no portal do SERPRO depois do teste.

## Etapas

1. **Gravar as credenciais como dois campos separados**
   Atualizar os segredos `FNRH_API_USER` e `FNRH_API_PASSWORD` com os valores enviados (nada fica no código nem no frontend). Confirmar que `FNRH_ENV` segue `producao` e que `FNRH_CPF_SOLICITANTE` tem 11 dígitos sem pontuação.

2. **Reassociar os segredos às funções FNRH**
   Garantir que as funções já publicadas passem a ler os novos valores.

3. **Log de diagnóstico controlado**
   Na função de diagnóstico, incluir (somente quando explicitamente solicitado no teste e apenas em log de backend, nunca no navegador nem em produção normal): comprimento e prefixo/sufixo do usuário e da chave, o Base64 gerado, o header Authorization montado, além de status HTTP e corpo completo da resposta oficial. O log será removido/desligado assim que a autenticação passar.

4. **Chamada de teste em produção**
   Base: `https://fnrh.turismo.serpro.gov.br/FNRH_API/rest/v2` (o domínio `api.fnrh.gov.br` não é usado em nenhum ponto do projeto). Testar autenticação em um endpoint leve e depois `POST /hospedagem/registrar` reprocessando a reserva de teste (Flávio Costa).

5. **Interpretação do resultado**
   - Base64 igual ao esperado + 200: sucesso, ficha sai de "Erro de sincronização".
   - Base64 igual + 401: a recusa é da credencial/ambiente no lado do Ministério; te mostro o corpo oficial da resposta para levar ao suporte.

6. **Origem da chamada (CORS)**
   Confirmar por evidência de log que a chamada sai da Edge Function (servidor), não do navegador — portanto CORS não se aplica a esta integração. Nada será chamado do frontend direto.

## Detalhes técnicos
- Cliente HTTP: `supabase/functions/_shared/fnrh.ts` (já monta `Basic btoa(user:senha)` com `trim`).
- Diagnóstico: `supabase/functions/fnrh-diagnostico/index.ts` (ganha o log detalhado temporário).
- Reprocessamento: `fnrh-criar-reserva` / `fnrh-reprocessar-reserva`.
- Sem mudanças de schema, tabelas, políticas ou telas públicas.
