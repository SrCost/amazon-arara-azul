# Módulo de Experiências (público + admin)

Nova seção de experiências vendidas como atividades avulsas, alimentada pelo banco, com módulo de gerenciamento no dashboard. Nada do que existe hoje é removido: o hero 3D, os 6 cards atuais e a galeria completa de /experiencias continuam iguais, e a nova seção entra abaixo dos cards atuais.

## 1. Banco de dados

Nova tabela `experiences` (multilíngue, seguindo o padrão de `rooms`):

- `id`, `slug` (único), `category_pt/en/es/fr/de`
- `name_pt/en/es/fr/de`
- `short_description_*` (card) e `full_description_*` (detalhe)
- `duration_label_*`, `what_to_wear_*`, `what_to_bring_*`, `operational_notes_*`
- `base_price_per_person` (numeric), `photos` (text[]), `display_order`, `is_active`, `created_at`, `updated_at`
- RLS: leitura pública apenas de ativos; escrita restrita a admin/super_admin, com GRANTs para `anon`, `authenticated` e `service_role`

Bucket público de Storage `experiences` para as fotos.

## 2. Seed das 15 experiências

Inserção das 15 experiências informadas (boto, casa de farinha, cheiro da floresta, aldeia Kubewa, praia de água doce, pescaria de piranha, focagem de jacarés, encontro das águas, nascer do sol, samaúma, caminhada na selva, horta da vovó Vânia, Anavilhanas, cachoeira do Arara, doce amazônico), com preço base, duração, o que vestir/levar e observações operacionais, traduzidas para os 5 idiomas. `photos` vazio no seed — os cards exibem placeholder neutro (degradê verde + ícone da categoria) até a pousada subir as fotos pelo admin. Os itens fora de escopo não entram no seed e podem ser cadastrados pelo admin sem código.

## 3. Preço calculado

Utilitário `src/lib/experiencePricing.ts` com `calculateExperiencePrice(basePrice, groupSize)` aplicando o desconto por faixa (1: 0%, 2: 20%, 3: 30%, 4: 40%, 5: 50%). Nada de valores derivados gravados no banco. Reaproveitável no futuro fluxo de reserva.

## 4. Página pública (nova seção em /experiencias)

Abaixo dos 6 cards atuais, nova seção "Experiências exclusivas para contratar":

- Título curto + subtítulo explicando que são vivências que podem ser somadas à hospedagem
- Grid 1/2/3 colunas (mobile/tablet/desktop): foto (primeira do array) ou placeholder, nome, badge de categoria, resumo, duração e "a partir de R$X por pessoa"
- Sem botão de ação; o card inteiro abre um modal de detalhe
- Modal: carrossel de fotos com swipe, descrição completa, duração, blocos "O que vestir" / "O que levar" com ícones, aviso sutil para observações operacionais e tabela de preços de 1 a 5 pessoas calculada dinamicamente
- Animações de entrada em fade + slide-up escalonado e hover discreto, reaproveitando `useInViewAnimation`; respeita `prefers-reduced-motion`
- Mobile como prioridade: coluna única, texto legível, botão de fechar acessível ao polegar
- Paleta, tipografia e componentes já existentes no site; textos vindos do banco no idioma ativo, rótulos fixos nos arquivos de i18n

## 5. Módulo Admin

Nova rota `/admin/experiencias` (acesso admin), item no menu do dashboard, seguindo o padrão visual de Bangalôs/Carrossel:

- Listagem em tabela: miniatura, nome, categoria, preço base, ordem e status, com toggle rápido de ativo/inativo e reordenação por campo de ordem com setas
- Criar/editar em dialog com todos os campos, abas por idioma para os textos traduzíveis
- Upload múltiplo de fotos para o bucket `experiences`, com preview, remoção e reordenação (a primeira é a capa)
- Excluir com confirmação (`AlertDialog`), removendo também os arquivos do Storage
- Prévia do card ao lado do formulário, como já aparece em outras telas do dashboard

## Detalhes técnicos

- Migração cria tabela + GRANTs + RLS + policies + trigger `update_updated_at_column`; seed em migração separada e idempotente por `slug`
- Hooks `useExperiences` (público, só ativos) e `useExperiencesAdmin` (todos), no padrão de `useHeroSlides`
- Componentes novos: `src/components/experiences/ExperienceOfferCard.tsx`, `ExperienceDetailModal.tsx`, `ExperiencePriceTable.tsx`, `src/pages/admin/Experiencias.tsx`
- Rota registrada em `App.tsx` acima do catch-all; nenhum arquivo existente da página pública é reescrito, apenas a inclusão da nova seção em `src/pages/Experiencias.tsx`
