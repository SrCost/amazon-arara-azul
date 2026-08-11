# PASSO 0 — Auditoria do banco atual (nada foi alterado)

## 1. Tabelas de reserva

**`reservations`** (tabela única de reservas; 60+ colunas). Relevantes:
- Datas/ocupação: `check_in` (date), `check_out` (date), `guests` (int), `daily_rate`, `total_price`
- Responsável: `guest_name`, `guest_email`, `guest_phone`, `user_id` (nullable)
- Documentos/pessoais já existentes: `cpf` (text), `passport` (text), `birth_date` (date), `nationality` (text), `country` (text), `is_foreign` (bool), `address` (text)
- Status: `status`, `operational_status`, `payment_status`, `checkin_completed` (bool), `checkout_completed` (bool)
- Origem/controle: `reservation_source`, `channel_reference_id`, `is_test`, `created_at`, `updated_at`
- Não existe: divisão adultos/menores, gênero, tipo de documento explícito, nenhum campo de sincronização externa.

Apoio: `rooms`, `packages`, `blocked_dates`, `payments`, `payment_logs`.

## 2. Tabelas de hóspede/cliente
- **`profiles`** — só usuários com login (id, email, full_name, phone, preferred_language). Não é hóspede de reserva.
- **`booking_checkins`** — ficha de check-in digital preenchida pelo hóspede: `reservation_id`, `full_name`, `document`, `birth_date`, `nationality`, `city_state`, `address`, `transport_mode`, `travel_reason`, `accepted_terms`. É append-only (as regras de acesso proíbem alteração e exclusão) e hoje grava **uma ficha por reserva**, não uma por pessoa.
- **`booking_checkouts`** — avaliação pós-estadia.

## 3. Registro por hóspede individual?
Não. O sistema guarda **um responsável por reserva** (em `reservations`) e, opcionalmente, **uma ficha de check-in por reserva** (`booking_checkins`). Acompanhantes só existem como número (`guests`).

## 4. Documento / nascimento / nacionalidade / gênero
- `reservations`: `cpf`, `passport`, `birth_date`, `nationality`, `country`, `is_foreign` — **existem**
- `booking_checkins`: `document`, `birth_date`, `nationality` — existem
- **Gênero: não existe em nenhuma tabela.**

---

# Mapeamento proposto (sem criar tabelas novas)

Tudo por `ALTER TABLE ... ADD COLUMN`, nullable, nada renomeado ou removido.

## `reservations` — dados da reserva + hóspede principal
Reaproveitando o que já existe:

| Campo FNRH | Coluna usada |
|---|---|
| data entrada / saída | `check_in` / `check_out` (existentes) |
| nome do hóspede principal | `guest_name` (existente) |
| documento número | `cpf` ou `passport` (existentes) |
| país de nacionalidade | `country` / `nationality` (existentes) |
| data de nascimento | `birth_date` (existente) |
| e-mail / telefone | `guest_email` / `guest_phone` (existentes) |
| número da reserva | `id` (uuid) — sem coluna nova |
| check-in/check-out feitos | `checkin_completed` / `checkout_completed` (existentes) |

Colunas novas necessárias:
- `quantidade_hospede_adulto` (int) e `quantidade_hospede_menor` (int) — hoje só existe o total `guests`
- `genero` (text) — não existe em nenhum lugar
- `documento_tipo` (text: CPF | PASSAPORTE) — hoje é inferido por `is_foreign`; a FNRH exige explícito
- `reserva_id_fnrh` (uuid), `hospede_id_fnrh` (uuid), `pessoa_id_fnrh` (uuid)
- `situacao_fnrh` (text), `link_precheckin` (text), `erro_sincronizacao_fnrh` (text)
- `fnrh_checkin_em` (timestamptz), `fnrh_checkout_em` (timestamptz) — prefixadas para não confundir com o check-in digital do site

## `booking_checkins` — nada a alterar
Fica como está (append-only, ficha do site). O controle FNRH não vive aqui exatamente porque a tabela não permite atualização.

## Por que nenhuma tabela nova agora
Como a FNRH, nesta primeira fase, exige a ficha do **hóspede principal** por reserva, e a relação é 1 reserva → 1 hóspede principal, os campos de controle cabem em `reservations`. Zero tabela nova, zero duplicação.

**Ponto que preciso decidir com você:** se a pousada precisar registrar na FNRH **cada acompanhante individualmente** (nome, documento, nascimento, gênero de cada pessoa), aí sim não há estrutura reaproveitável — `booking_checkins` é uma ficha por reserva e imutável. Nesse caso proporia uma única tabela nova mínima `reserva_hospedes` (reservation_id, nome, documento_tipo, documento_numero, data_nascimento, genero, pais_nacionalidade, is_principal, ids/situação FNRH, checkin_em, checkout_em), substituindo os campos de hóspede acima. Preciso da sua confirmação sobre qual caminho seguir.

## Acesso (RLS)
`reservations` já é restrita a administração autenticada; as colunas novas herdam essa proteção. As Edge Functions gravam com identidade de serviço. Hóspede final continua sem acesso direto — usa o link oficial do governo.

---

# Depois da sua confirmação (não faço nada disso agora)
1. **Passo 1** — `fnrh-client` + módulo `_shared/fnrh.ts`: base URL por `FNRH_ENV`, Basic Auth via secrets, timeout, erros 400/401/404/5xx traduzidos, log estruturado sem senha.
2. **Passo 2** — a migração com exatamente as colunas aprovadas acima.
3. **Passo 3** — `fnrh-dominios`, `fnrh-criar-reserva`, `fnrh-checkin`, `fnrh-checkout`, `fnrh-reprocessar-reserva`, `fnrh-listar-fichas`.
4. **Passos 4 e 5** — painel `/admin/fnrh`, link de pré-checkin no fluxo de reserva, observabilidade.

Secrets a pedir quando começarmos o Passo 1: `FNRH_API_USER`, `FNRH_API_PASSWORD`, `FNRH_CPF_SOLICITANTE` (`FNRH_ENV` começa em `homologacao`).
