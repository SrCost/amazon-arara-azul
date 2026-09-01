# Sincronizar documento e dados FNRH em todo o fluxo de reservas

Hoje o CPF/passaporte é gravado no site e no cadastro manual, mas nascimento, nacionalidade, gênero, tipo de documento e quantidade de adultos ficam vazios na maioria das reservas, e nenhum desses campos aparece em /admin/reservations nem no calendário. Além disso, o modal "Completar dados FNRH" abre sempre em branco, o que obriga a digitar de novo o que já existe.

## 1. Gravar todos os dados na criação da reserva

- Fluxo público do site: além de CPF/passaporte e nascimento (já gravados), passar a gravar nacionalidade também para brasileiros, tipo de documento (CPF ou Passaporte), gênero (novo campo opcional) e quantidade de adultos/menores derivada dos hóspedes informados.
- Novo seletor opcional de gênero (Masculino / Feminino / Não informado) na etapa de dados do hóspede, com tradução em pt/en/es/fr/de.
- Cadastro manual (calendário): gravar também tipo de documento e quantidade de adultos/menores, que hoje ficam nulos.

## 2. Exibir e editar no admin

- /admin/reservations: mostrar no detalhe da reserva um bloco "Dados do hóspede (FNRH)" com documento (tipo + número), data de nascimento, nacionalidade, gênero e adultos/menores, sinalizando o que está faltando.
- Modal de edição do calendário: os mesmos campos passam a ser editáveis, salvando direto na reserva.

## 3. Eliminar o retrabalho no painel FNRH

- O modal "Completar dados FNRH" passa a abrir pré-preenchido com o que já existe na reserva e no formulário de pré-check-in do hóspede (documento, nome, nascimento, nacionalidade, endereço), pedindo apenas o que realmente falta.
- Quantidade de adultos passa a usar o valor da reserva quando já informado.

## 4. Correção dos dados históricos

- Preencher, para reservas existentes, o tipo de documento a partir do CPF/passaporte já cadastrado, a quantidade de adultos a partir do número de hóspedes e a nacionalidade "BR" quando a reserva tem CPF válido e não é estrangeira. Nascimento e gênero não são inventados — continuam sinalizados como faltantes.

## Detalhes técnicos

- Front: `src/components/ReservationFlow.tsx`, `src/components/reservation/GuestInfoForm.tsx` (campo gênero), `src/pages/admin/Reservations.tsx` (bloco de detalhe), `src/components/admin/calendar/NewReservationModal.tsx` e `EditReservationModal.tsx`, `src/components/admin/fnrh/CompletarDadosFnrhModal.tsx` (pré-preenchimento).
- Backend: `supabase/functions/create-pix-payment/index.ts` e `create-card-payment/index.ts` gravam `documento_tipo`, `genero`, `nationality`, `quantidade_hospede_adulto/menor` (validados server-side); a resolução em `_shared/fnrh-reserva.ts` continua a fonte de verdade do FNRH.
- Backfill de dados históricos por atualização de dados (sem alteração de estrutura, sem novas tabelas).
- Nenhum deploy automático: as mudanças ficam para revisão antes de publicar.
