# Atualização da seção de experiências no detalhe do bangalô

## Mudança
Em `src/pages/LodgeDetail.tsx`, na seção atualmente intitulada "Experiências Incluídas":
- Alterar o título para **"Experiências exclusivas"**
- Adicionar logo abaixo do título o subtítulo: *"Selecione as atividades desejadas durante a reserva."*
- Manter a lista de experiências exatamente como está (mesmas opções, mesmo layout, mesmos ícones).

## i18n
Atualizar as 4 línguas (`pt`, `en`, `es`, `fr`) em `src/i18n/locales/*.json`:
- `lodge.experiences.title` → "Experiências exclusivas" / "Exclusive experiences" / "Experiencias exclusivas" / "Expériences exclusives"
- Nova chave `lodge.experiences.subtitle` → "Selecione as atividades desejadas durante a reserva." (+ traduções equivalentes)

## Fora de escopo
- Lógica de seleção das experiências no fluxo de reserva (somente texto/UI nesta tarefa).
- Card de listagem `/bangalos` (não exibe esse bloco).
