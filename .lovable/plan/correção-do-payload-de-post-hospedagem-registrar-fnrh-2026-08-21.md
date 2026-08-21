# Correção do payload de POST /hospedagem/registrar (FNRH)

## Diagnóstico (verificado no código e nos logs)

O payload NÃO tem placeholders no nosso código — não existe nenhum `"1900-01-01"`, `numero_reserva || ""` nem `new Date()` sem argumento em `supabase/functions/_shared/fnrh-reserva.ts`. A causa é **nome de campo divergente**:

- Nós enviamos (em `buildRegistrarPayload`): `{ reserva: { dataEntrada, dataSaida, quantidadeHospedeAdulto, quantidadeHospedeMenor, codigoReservaMeioHospedagem }, hospede: {...} }` — camelCase.
- A API FNRH v2 espera snake_case: `numero_reserva`, `data_entrada`, `data_saida`, `quantidade_hospede_adulto`, `quantidade_hospede_menor`.

Como nenhuma chave é reconhecida, o SERPRO monta o objeto com os **defaults dele** e devolve exatamente o eco do log (`numero_reserva: ""`, datas `1900-01-01`, quantidades `0`) com 400 "numero_reserva obrigatório". Os dados da reserva local estão corretos (confirmado: `check_in`, `check_out`, `guests`, `quantidade_hospede_adulto/menor` existem em `reservations`).

Ponto adicional: não existe coluna `reservation_number` no banco. O número visível ao hóspede (`PAA-XXXXXX`) é derivado do `id` (lógica hoje só em `ReservationSuccess.tsx`), e hoje mandamos o UUID cru como código de reserva.

## O que será alterado

### 1. `_shared/fnrh-reserva.ts` — montagem do payload (mudança principal)
- Reescrever `buildRegistrarPayload` para snake_case conforme a API v2: `numero_reserva`, `data_entrada`, `data_saida`, `quantidade_hospede_adulto`, `quantidade_hospede_menor`, e o bloco de hóspede com `nome`, `tipo_documento`, `numero_documento`, `pais_nacionalidade`, `data_nascimento`, `genero`, contatos.
- `numero_reserva`: usar `channel_reference_id` quando existir; senão o número canônico `PAA-XXXXXX` derivado do `id` (mesma regra da tela de sucesso, extraída para helper compartilhado para não duplicar lógica).
- **Sem fallbacks silenciosos**: se `numero_reserva`, `data_entrada`, `data_saida` ou `quantidade_hospede_adulto` vierem vazios/inválidos, `buildRegistrarPayload` lança `FnrhError` com mensagem específica e o POST não acontece. Nenhum `1900-01-01` ou `""` é aceito.
- Normalizar datas para `YYYY-MM-DD` e validar (`toDateOnly` + regra de `data_saida > data_entrada`) usando o módulo já existente `_shared/fnrh-format.ts`.
- Estender `validateForFnrh` com as mesmas checagens (número da reserva, datas plausíveis — nada anterior a 2000 —, adultos ≥ 1), para que o erro apareça como "Dados incompletos" em vez de 400 da API.

### 2. Log de depuração
No log estruturado de `registrarHospedagem`, incluir `numero_reserva`, `data_entrada`, `data_saida` e as quantidades (dados não sensíveis) para conferir na próxima tentativa que o payload real foi enviado. Documento e nome continuam mascarados.

### 3. Validação client-side antes do envio
Na tela FNRH (`src/pages/admin/Fnrh.tsx`) e no botão "Tentar novamente"/reprocessar: antes de chamar a função, checar `check_in`/`check_out` presentes e válidos e adultos ≥ 1. Se falhar, bloquear o envio com toast específico ("Reserva sem número/datas válidas — verifique o cadastro") em vez de deixar a API responder genericamente.

### 4. Escopo
Nada além disso: `fnrh-criar-reserva`, `fnrh-reprocessar-reserva`, credenciais, domínios, consultas e o resto do sistema ficam intactos — eles apenas passam a receber o payload correto.

## Verificação
- Typecheck/build.
- Reprocessar a hospedagem em erro pelo botão "Tentar novamente" e ler os logs da função para confirmar que o payload enviado traz `numero_reserva` e as datas reais. Se o SERPRO responder 400 com outro campo, ajusto o mapeamento no mesmo ciclo.
- Diff completo apresentado antes de qualquer publicação.

## Observação
As chamadas de produção vinham retornando 401 em testes anteriores; os logs recentes mostram 400 (autenticação passando, validação de payload falhando), o que é consistente com este diagnóstico.
