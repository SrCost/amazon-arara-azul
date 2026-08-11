# Trocar credenciais da FNRH e testar em produção

## Objetivo
Substituir com segurança o usuário e a senha usados pela integração FNRH e validar novamente o envio no ambiente oficial de produção.

## Etapas
1. Abrir o formulário seguro para atualizar os secrets `FNRH_API_USER` e `FNRH_API_PASSWORD`; as credenciais não serão gravadas no código nem exibidas em logs.
2. Manter `FNRH_ENV` configurado como `producao` e preservar o CPF do solicitante já configurado.
3. Reassociar as credenciais atualizadas às funções FNRH, se necessário, para garantir que as novas instâncias recebam os valores atuais.
4. Executar um teste controlado de autenticação e sincronização em produção com uma reserva escolhida para teste.
5. Conferir a resposta e os logs sanitizados:
   - sucesso: confirmar identificadores e situação retornados pela FNRH;
   - nova rejeição: informar código e mensagem oficial sem revelar dados sensíveis.
6. Confirmar no painel que a ficha deixou o estado “Erro de sincronização” e passou ao estado retornado pela API oficial.

## Segurança e impacto
- Nenhuma credencial será enviada pelo chat ou adicionada ao frontend.
- O teste chama a API oficial e pode criar/atualizar uma ficha real na FNRH.
- Não haverá alteração de tabelas, políticas, telas ou regras de negócio.
