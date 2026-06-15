# Crédito do desenvolvedor em `/contato` — versão minimalista

## Mudança
Substituir o card grande "Desenvolvedor do Site" por uma única linha discreta, alinhada à direita, ocupando muito pouco espaço vertical.

## Como ficará
- Uma linha simples, separada do formulário apenas por um espaço (`mt-6`), sem card, sem borda, sem ícone grande, sem botão.
- Texto pequeno (`text-xs text-muted-foreground`), centralizado no mobile e alinhado à direita no desktop.
- Formato:
  `Site desenvolvido por Flávio A. Costa`
  Apenas o nome **Flávio A. Costa** é clicável (sublinhado sutil no hover, cor `text-primary` no hover) e abre o mesmo `<DeveloperCreditModal>` já existente.
- Sem alteração no modal nem no rodapé.

## Arquivo tocado
- `src/pages/Contact.tsx` — substituir o bloco atual (Card + ícone + botão "Saiba mais") por uma linha de texto com `<DeveloperCreditModal>` envolvendo apenas o nome. Remover o import não utilizado de `Code2`.
- Adicionar chave i18n `developer.developedByPrefix` ("Site desenvolvido por") nos 5 locales (pt, en, es, fr, de) para manter o padrão de tradução.
