# Integração completa da API FNRH v2

O projeto já tem uma base FNRH funcionando (cliente HTTP central, credenciais em secrets + painel admin, registro de hospedagem, check-in/check-out individual, domínios, listagem de fichas, diagnóstico). Este plano completa a cobertura de endpoints pedida, corrige divergências com a documentação e adiciona as regras de formato/validação — sem tocar em nada fora do escopo FNRH.

## Situação atual (verificada no código)

- `supabase/functions/_shared/fnrh.ts`: cliente único com Basic Auth (`btoa(user:senha)`), timeout, log estruturado sem segredos, mensagens amigáveis por status, `maskDoc` para documentos. Credenciais vêm da tabela `fnrh_credentials` (painel) com fallback para os secrets `FNRH_API_USER` / `FNRH_API_PASSWORD` / `FNRH_CPF_SOLICITANTE`.
- URLs base estão **fixas no código** (homologação `homlowcode.serpro.gov.br`, produção `fnrh.turismo.serpro.gov.br`), sem variável de ambiente.
- Caminhos de domínios usados hoje (`/dominios/meios-transporte`, `/dominios/generos`, …) **não** batem com os da documentação (`/dominios/fnrh/meios_transporte`, `/dominios/pessoas/generos`, …).
- Já existem funções: `fnrh-client` (proxy genérico), `fnrh-dominios`, `fnrh-criar-reserva`, `fnrh-reprocessar-reserva`, `fnrh-checkin`, `fnrh-checkout`, `fnrh-listar-fichas`, `fnrh-credenciais`, `fnrh-diagnostico`.
- Não existe cobertura para: CRUD de reservas, cancelar, hóspedes da reserva, check-in/out/no-show em lote, vincular hóspede, `GET /hospedes/{id}`, pré-check-ins, no-show individual, `POST /pessoas`, `GET /pessoas/{id}`, busca por documento, `GET /fichas` com todos os filtros documentados.

## O que será feito

### 1. URL base configurável
Ler `FNRH_API_BASE_URL` como override; se ausente, manter o comportamento atual por ambiente (`FNRH_ENV`). Aviso registrado: **a URL oficial de produção precisa ser confirmada com o SERPRO** — a doc cita duas (`fnrh.turismo.serpro.gov.br` e `api.fnrh.gov.br`). Nada será escolhido arbitrariamente; a variável permite trocar sem alterar código.

### 2. Domínios com os caminhos da documentação
Reescrever o mapa de `fnrh-dominios` com os 10 domínios pedidos (transporte, motivos de viagem, situações de hóspede/reserva/ficha, gêneros, opção e tipos de deficiência, raças, tipos de documento), cache de 1h, e uma chave extra `todos` para carregar tudo de uma vez (usado pela validação de IDs no front). Os nomes antigos de `tipo` continuam aceitos como alias para não quebrar os painéis atuais.

### 3. Novas Edge Functions de operação
Todas com autenticação interna (admin/super_admin), validação Zod, CORS padrão e uso do cliente central:
- `fnrh-reservas`: listar (paginação/filtros), criar, detalhar, atualizar, excluir, cancelar.
- `fnrh-reserva-hospedes`: listar/adicionar hóspedes, check-in/check-out/no-show em lote, vincular hóspede.
- `fnrh-hospedes`: detalhe, pré-check-ins com filtros, check-in/check-out/no-show individual (as funções `fnrh-checkin`/`fnrh-checkout` atuais continuam intactas).
- `fnrh-pessoas`: registrar, detalhar, buscar por documento — sempre com header `cpf_solicitante`.
- `fnrh-fichas`: `GET /fichas` com status, tipo/número de documento e intervalo de datas (a `fnrh-listar-fichas` atual permanece para não quebrar a tela existente).

### 4. Regras de formato e validação
Novo módulo compartilhado `supabase/functions/_shared/fnrh-format.ts`: datas `YYYY-MM-DD`, datetimes ISO UTC com `Z`, país ISO alpha-2 (`PaisNacionalidade_id` e `PaisResidencia_id` separados), documento só dígitos, CEP 8 dígitos, `page_number` mínimo 1. Aplicado nos schemas Zod das novas funções.

### 5. Painel admin
Nova aba na página FNRH existente para consultar reservas, pré-check-ins e fichas, com os selects de ID alimentados pelos domínios (validação client-side antes de enviar). Um hook `useFnrhDomains` faz cache dos domínios no cliente.

### 6. Erros e privacidade
Mantém o tratamento atual (401 = erro de configuração logado, não exposto cru; 400 mostra a mensagem de validação da API; 403/404/500 genéricos) e estende `maskDoc` para mascarar nome, CPF e endereço antes de qualquer log.

## Detalhes técnicos

- Arquivos novos: `_shared/fnrh-format.ts`, `fnrh-reservas/`, `fnrh-reserva-hospedes/`, `fnrh-hospedes/`, `fnrh-pessoas/`, `fnrh-fichas/`, `src/hooks/useFnrhDomains.ts`, componentes de consulta em `src/components/admin/fnrh/`.
- Arquivos alterados: `_shared/fnrh.ts` (base URL por env + máscara ampliada), `fnrh-dominios/index.ts` (caminhos corretos + alias), `src/pages/admin/Fnrh.tsx` (nova aba).
- Variáveis de ambiente: `FNRH_API_USER`, `FNRH_API_PASSWORD`, `FNRH_CPF_SOLICITANTE` já existem como secrets; será adicionada `FNRH_API_BASE_URL` (opcional). O painel de credenciais continua tendo prioridade sobre os secrets.
- Nada de tabela nova; nenhuma migração de banco.
- No fim: build e lint. Sem publicação — você revisa antes.

## Observação importante

As chamadas de produção seguem retornando **401** com as credenciais atuais (já diagnosticado antes). A integração ficará completa em código, mas o teste real depende de credenciais habilitadas pelo SERPRO e da confirmação da URL oficial de produção.
