# Experiências — rodada 2

Ajustes na página pública, no admin e nova etapa opcional de experiências no fluxo de reserva, com cobrança junto ao pagamento.

## 1. Tabela de valores sai da página pública

- Remover o bloco "Valores de referência" do modal público de detalhe.
- Manter no modal apenas "a partir de R$X por pessoa" (mesma linha simples já usada no card).
- `base_price_per_person` e `calculateExperiencePrice` permanecem no código — usados no admin e no fluxo de reserva.
- No admin (`/admin/experiencias`), a mesma tabela de 1 a 5 pessoas passa a aparecer dentro do formulário como card "Prévia de preços", somente leitura, recalculando ao digitar o preço base.

## 2. /experiencias: carrosséis por categoria

- Agrupar as experiências ativas por categoria (Rio & Vida Selvagem, Cultura & Comunidades Ribeirinhas, Aventura & Natureza, Gastronomia), na ordem de `display_order`.
- Cada categoria vira uma seção com título e um carrossel horizontal estilo streaming: scroll com snap, swipe nativo no mobile, setas nas laterais no desktop (aparecem no hover e desabilitam nos extremos).
- Cards compactos: imagem 4:3, largura fixa (~270px desktop / ~210px mobile, mostrando ~2,2 cards no mobile), nome, duração com ícone e badge pequena de categoria. Sem resumo longo e sem preço.
- O card inteiro continua abrindo o modal de detalhe.
- Grid vertical antigo de ofertas é substituído por essa estrutura. O hero 3D, os 6 cards institucionais e a galeria continuam como estão.
- Animação de entrada por seção (fade + slide-up escalonado), respeitando `prefers-reduced-motion`.

## 3. Nova etapa no fluxo de reserva

Etapa opcional "Experiências para sua estadia" inserida entre Datas e Dados (nova etapa 3; Dados passa a 4, Pagamento 5, Confirmação 6).

- Lista vertical simples das experiências ativas: foto pequena, nome, duração, resumo curto e checkbox de seleção.
- O número de participantes usa automaticamente o total de hóspedes da reserva; nenhum seletor extra.
- Cada item selecionado mostra apenas o valor final já calculado (ex.: "Interação com Boto Cor-de-Rosa — R$ 688,00"), mais um subtotal de experiências. Nenhuma tabela ou percentual de desconto aparece para o hóspede.
- Sem nada selecionado, "Continuar" segue normalmente.
- O resumo da reserva passa a listar as experiências escolhidas e somá-las ao total.

## 4. Cobrança e persistência

As experiências selecionadas entram no valor cobrado (PIX e cartão). Como o total é sempre recalculado no servidor, a soma é feita no backend a partir dos dados da tabela `experiences` — o valor enviado pelo navegador continua sendo ignorado.

- Nova tabela `reservation_experiences` (reserva, experiência, nome no momento da compra, nº de participantes, preço base, total calculado), com escrita restrita ao servidor e leitura para administradores.
- As funções de pagamento recebem apenas a lista de IDs de experiências; recalculam o preço com o preço base do banco e o nº de hóspedes da reserva, gravam as linhas e incluem o subtotal no `total_price` e no valor cobrado.
- O dashboard de reservas exibe as experiências contratadas junto aos detalhes da reserva.

## Detalhes técnicos

- Público: `ExperienceOfferCard.tsx` reduzido (sem descrição/preço); nova `ExperienceCategoryRow.tsx` com carrossel por scroll-snap; `ExperienceDetailModal.tsx` sem `ExperiencePriceTable`, com a linha "a partir de".
- Admin: `ExperiencePriceTable` reaproveitada dentro do dialog de `src/pages/admin/Experiencias.tsx`.
- Reserva: novo `src/components/reservation/ExperiencesStep.tsx`; `ReservationFlow.tsx` ganha estado `selectedExperiences`, novo passo em `steps`, ajuste dos índices de validação/renderização e `calculateTotal` somando as experiências; `ReservationSummary.tsx` recebe a lista.
- Backend: migração criando `reservation_experiences` com GRANTs, RLS e políticas; helper compartilhado `_shared/experiences.ts` usado por `create-pix-payment`, `create-card-payment` e demais funções que gravam o total.
- Rótulos novos nos 5 arquivos de i18n (pt, en, es, fr, de).
