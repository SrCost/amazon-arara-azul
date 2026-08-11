# Integração FNRH (Ministério do Turismo) — Passos 1 a 3

Entrega desta etapa: apenas a base técnica (proxy seguro, banco e funções de negócio). As telas (Passos 4 e 5) só depois da sua confirmação.

## Segurança
- Credenciais ficam apenas como secrets do backend: `FNRH_API_USER`, `FNRH_API_PASSWORD`, `FNRH_ENV` (inicia em `homologacao`), `FNRH_CPF_SOLICITANTE`.
- Nenhuma chamada direta do site à API do governo: o site sempre fala com nossas funções de backend.
- Senha nunca aparece em log. Documento é logado apenas mascarado (últimos dígitos).

## Passo 1 — Cliente/proxy seguro
Módulo compartilhado `_shared/fnrh.ts` + função `fnrh-client`:
- Base URL conforme `FNRH_ENV` (homologação: `homlowcode.serpro.gov.br`, produção: `fnrh.turismo.serpro.gov.br`).
- Header `Authorization: Basic base64(usuario:senha)` montado no servidor.
- Aceita método, path, query params e body; timeout de 20s (AbortController).
- Erros traduzidos: 401 (credenciais/ambiente), 400 (validação, repassando a mensagem da API), 404, 5xx, timeout.
- Log estruturado por chamada: endpoint, status, duração, timestamp — sem segredos.
- As demais funções importam esse módulo; nenhuma duplica autenticação.

## Passo 2 — Banco de dados
Tabelas novas `reservas_fnrh` e `hospedes_fnrh` exatamente com os campos que você listou (a de hóspedes referenciando a de reservas), com timestamps e trigger de `atualizado_em`.

Acesso:
- Somente pessoal interno autenticado (administração e recepção) pode ler e escrever; hóspede final nunca acessa essas tabelas — ele usa o link oficial do governo.
- Hoje o projeto tem os papéis `super_admin`, `admin` e `user`. Vou acrescentar o papel `recepcao` para atender a regra, mantendo `admin`/`super_admin` com acesso total.
- As funções de backend gravam com identidade de serviço.

## Passo 3 — Funções de negócio
- `fnrh-dominios` — GET com `tipo` (transporte, motivo_viagem, genero, raca, deficiencia, tipo_deficiencia, tipo_documento); cache em memória por 24h.
- `fnrh-criar-reserva` — chama `POST /hospedagem/registrar` com header `cpf_solicitante`; grava reserva + hóspede principal localmente e devolve o `link_precheckin`. Em falha externa, grava localmente com `situacao = ERRO_SINCRONIZACAO` e o motivo em `erro_ultima_sincronizacao`, sem travar a reserva.
- `fnrh-checkin` — recebe `hospede_local_id`, chama `PATCH /hospedes/{id}/checkin` com data/hora atual e atualiza o registro local.
- `fnrh-checkout` — mesma lógica com `PATCH /hospedes/{id}/checkout`.
- `fnrh-reprocessar-reserva` — reenvia os dados salvos das reservas com `ERRO_SINCRONIZACAO`.
- `fnrh-listar-fichas` — GET com filtros opcionais de data e status, lendo a base local (fonte já sincronizada) para alimentar o painel da recepção.

Todas validam a entrada (Zod) e exigem sessão interna válida, exceto `fnrh-criar-reserva` quando disparada pelo fluxo público de reserva.

## Detalhes técnicos
- Migração única: enum `recepcao`, duas tabelas, GRANTs, RLS baseada em função de verificação de papel, trigger de `atualizado_em`.
- Edge functions em `supabase/functions/fnrh-*`, com CORS padrão do projeto.
- Nada do fluxo atual de reservas/pagamentos é alterado neste passo.

## O que preciso de você
Antes de codar, vou pedir os secrets `FNRH_API_USER`, `FNRH_API_PASSWORD` e `FNRH_CPF_SOLICITANTE` (usuário/senha do SERPRO de homologação e o CPF do responsável no CADASTUR). `FNRH_ENV` começa em `homologacao`.

Ao final do Passo 3 eu paro e aguardo sua confirmação para as telas.
