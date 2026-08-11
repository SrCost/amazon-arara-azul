# Parte 11 — Entrega e validação final

Nenhuma nova funcionalidade será criada nesta etapa. O objetivo é fechar a entrega: rodar as verificações finais (com foco em regressão FNRH), corrigir apenas o que aparecer de fato quebrado e entregar o resumo consolidado.

## Já verificado (leitura, sem alterações)

- TypeScript/build: verificação de tipos passa sem erros.
- Domínio oficial: todas as Edge Functions que montam links usam `SITE_URL` com fallback `https://pousadararazul.com` e removem barra final. Nenhum uso de domínio com trailing slash.
- Funções FNRH existentes intactas: `fnrh-client`, `fnrh-criar-reserva`, `fnrh-checkin`, `fnrh-checkout`, `fnrh-listar-fichas`, `fnrh-dominios`, `fnrh-reprocessar-reserva`.
- Correções pendentes da Parte 10 já aplicadas: resumo de Pré-Chegada (bangalô/datas/hóspedes) na lista de reservas e função `submit_pre_arrival` sem ambiguidade de coluna.

## O que será feito

1. **Teste 16 — regressão FNRH (prioridade)**
   - Criar uma reserva de teste marcada como `is_test` com 1 bangalô e dados completos (nome, CPF, data de nascimento, gênero, documento) e confirmar que a sincronização FNRH ocorre uma única vez, gravando `reserva_id_fnrh` / `situacao_fnrh` sem erro.
   - Repetir com dados incompletos e confirmar que a situação fica em pendência com mensagem de erro persistida e o botão de reprocessar funciona.
   - Conferir os logs das funções FNRH em busca de erro de autenticação ou payload.
   - Confirmar que reserva multi-bangalô continua enviando uma única ficha com a soma de hóspedes.

2. **Console e erros de runtime**
   - Percorrer as rotas afetadas pelas Partes 3–10 (`/admin/calendario-reservas`, `/admin/reservations`, `/admin/fnrh`, `/pre-chegada`, fluxo público de reserva) e registrar erros de console.
   - Corrigir apenas erros reais; avisos conhecidos do React Router ficam documentados.

3. **Banco, RLS e segurança**
   - Rodar o linter do banco e o scan de segurança e revisar somente achados ligados às tabelas novas (`reservation_rooms`, `pre_arrival_responses`, `booking_tokens`).
   - Nenhuma migration nova prevista. Se algum achado exigir ajuste de política, ele é apresentado antes de aplicar.

4. **E-mails**
   - Conferir apenas que os templates de Pré-Chegada e check-in/check-out apontam para o domínio oficial e que os links de token são gerados corretamente. Sem novos templates.

5. **Limpeza e resumo**
   - Remover os dados de teste criados nesta etapa.
   - Entregar o resumo objetivo pedido: arquivos alterados, tabelas, Edge Functions (destacando explicitamente o que toca FNRH e como), políticas RLS, e-mails, rotas, componentes, testes realizados com o resultado do Teste 16 e pontos que exigem configuração manual.

## Regra de segurança combinada

Qualquer inconsistência de arquitetura com risco de regressão — em especial na FNRH — será reportada com explicação e aguardará sua confirmação. Nenhuma alteração destrutiva automática, nenhuma mudança na lógica de autenticação da FNRH e nada fora do escopo acima.

## Notas técnicas

- A credencial FNRH permanece exclusivamente em secrets, usada só via `fnrh-client`; nenhuma função será reescrita para mudar esse caminho.
- Testes usam reservas com `is_test = true` e são removidas ao final para não poluir métricas do dashboard.
- Correções eventuais tendem a ficar restritas a componentes de apresentação no admin; qualquer necessidade de mudar regra de negócio será levantada antes.
