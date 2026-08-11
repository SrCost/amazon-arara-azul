# Corrigir o erro ao clicar em "Enviar" no painel FNRH

## O que está acontecendo

O erro genérico "Edge Function returned a non-2xx status code" não é uma falha de credencial nem da API da FNRH. Ao consultar as reservas, todas as fichas listadas estão **sem data de nascimento** (e sem gênero/nacionalidade). A função de envio valida esses campos obrigatórios antes de chamar a FNRH e responde 400 com a lista de campos faltantes — mas o painel descarta esse detalhe e mostra apenas a mensagem genérica do SDK.

Ou seja: dois problemas somados.

1. Falta de dados obrigatórios nas reservas (data de nascimento é exigida pela FNRH).
2. O painel não mostra o motivo real da recusa.

## O que vou fazer

### 1. Mostrar o motivo real do erro
No painel FNRH, ler o corpo da resposta mesmo quando o status é 4xx e exibir no toast a mensagem e a lista de campos pendentes (ex.: "Data de nascimento é obrigatória"), em vez de "Falha na operação".

### 2. Modal "Completar dados da ficha"
Quando o envio for recusado por dados incompletos, abrir um modal com apenas os campos que faltam, já pré-preenchidos com o que existe:

- Tipo de documento (CPF / Passaporte) + número
- Data de nascimento
- Nacionalidade (país)
- Gênero (Masculino / Feminino / Não informado)
- Adultos e menores

Ao confirmar, reenviar a ficha. Os dados informados são salvos na reserva, então na próxima vez o envio já passa direto.

### 3. Situação visível quando falha
Registrar a recusa por validação na própria reserva, para que a coluna "Situação FNRH" mostre "Dados incompletos" em vez de continuar como "Não sincronizada" sem explicação.

## Detalhes técnicos

- `src/pages/admin/Fnrh.tsx`: usar `supabase.functions.invoke` com leitura do corpo de erro (`error.context.json()` / fetch direto) para expor `code` e `details`; novo componente de modal para completar dados; reenvio usando o campo `hospede` que a função `fnrh-criar-reserva` já aceita.
- `supabase/functions/fnrh-criar-reserva/index.ts`: gravar `situacao_fnrh = 'DADOS_INCOMPLETOS'` e `erro_sincronizacao_fnrh` quando a validação local falhar (hoje retorna 400 sem persistir nada).
- Nenhuma alteração de schema; os campos já existem em `reservations`.
