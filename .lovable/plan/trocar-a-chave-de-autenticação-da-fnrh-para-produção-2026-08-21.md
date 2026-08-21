# Trocar a chave de autenticação da FNRH para produção

## Objetivo
Substituir com segurança a credencial (usuário/chave) usada pela integração FNRH e confirmar que o ambiente de produção está ativo.

## Etapas
1. Abrir o formulário seguro para você digitar os novos valores de `FNRH_API_USER` e `FNRH_API_PASSWORD`. Os valores não passam pelo chat, não vão para o código e não aparecem em logs.
2. Garantir que `FNRH_ENV` esteja em `producao` e que o CPF do solicitante (CADASTUR) siga configurado.
3. Reassociar os secrets às funções da FNRH para que as novas execuções recebam os valores atualizados.
4. Rodar o teste de conexão do painel (`/admin/fnrh` → Testar conexão) contra a API oficial e ler o resultado:
   - credenciais aceitas: confirmar veredito OK;
   - recusa: informar o código e a mensagem oficial (401/403) sem revelar dados sensíveis.
5. Se o teste passar, reprocessar uma ficha pendente para validar o envio real e conferir o status no painel.

## Observações
- Nenhuma tabela, política, tela ou regra de negócio será alterada.
- O teste fala com a API oficial; o reprocessamento do item 5 pode criar/atualizar uma ficha real na FNRH.
- Se preferir apenas trocar a credencial sem enviar ficha real, paramos no item 4.
