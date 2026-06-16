# Rodapé compacto em 2 colunas (mobile/tablet)

## Objetivo
Reduzir a altura do rodapé em mobile/tablet exibindo os blocos de links lado a lado, em vez de empilhados em coluna única.

## Mudanças em `src/components/Footer.tsx`

1. **Grid principal**
   - Atual: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-4` com o bloco "Brand + Contato" ocupando `col-span-2` no mobile e o bloco "Sobre/Legal" também `col-span-2` no mobile — o que faz tudo empilhar.
   - Novo: manter `grid-cols-2 lg:grid-cols-4`, mas **remover** os `col-span-2` dos blocos de links, para que "Links rápidos" (Início, Bangalôs, Pacotes, Experiências, Como Chegar) e "Sobre Nós" (Contato, FAQ, Privacidade, Termos, Cancelamento) fiquem **lado a lado** no mobile/tablet.
   - Bloco "Brand + Contato" continua em `col-span-2` (largura total) ficando acima das duas colunas de links.

2. **Alinhamento e espaçamento**
   - Reduzir `gap` em mobile (`gap-3`) para encaixar duas colunas em telas de 360–390px sem overflow.
   - Garantir `min-w-0` e `break-words` nos itens para evitar quebra de layout em strings longas (ex.: "Política de Cancelamento").
   - Manter tamanhos de fonte `text-xs sm:text-sm` e área de toque `min-h-[36px]`.

3. **Sem mudanças** em: CTA superior, redes sociais, bottom bar (copyright/admin/credit do desenvolvedor), traduções, ou em qualquer outra página.

## Resultado esperado
```text
Mobile/Tablet:
┌─────────────────────────────┐
│ Pousada Arara Azul          │  ← brand + contato (col-span-2)
│ 📍 ☎ ✉  IG FB              │
├──────────────┬──────────────┤
│ Início       │ Sobre Nós    │
│ • Início     │ • Contato    │
│ • Bangalôs   │ • FAQ        │
│ • Pacotes    │ • Privacid.  │
│ • Experiênc. │ • Termos     │
│ • Como Chegar│ • Cancelam.  │
└──────────────┴──────────────┘

Desktop (lg): 4 colunas como hoje.
```
