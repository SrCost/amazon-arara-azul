

# Botão "Avaliar no Google" — Plano

O componente `LeaveReviewSection.tsx` já existe e faz quase tudo pedido. O plano é aprimorá-lo com um visual mais premium e adicionar um ícone SVG do Google.

## Alterações

### 1. Atualizar `LeaveReviewSection.tsx`

- Substituir o ícone `Star` do lucide pelo ícone SVG oficial do Google (inline, colorido)
- Estilizar o botão com visual premium: fundo branco, borda verde Google (`#34A853`), texto escuro, hover suave com sombra
- Garantir responsividade: `w-full sm:w-auto`, altura confortável (`h-14`)
- Adicionar transição/animação leve no hover (scale + shadow)

### 2. Manter tudo mais intacto

- Não alterar `Index.tsx` — a seção já está inserida abaixo do carrossel de reviews
- Manter a variável `VITE_GOOGLE_PLACE_ID` com fallback para `ChIJIZ49U-RjbJIRfRcHewbwWdE`
- Link continua abrindo em `target="_blank"` com `rel="noopener noreferrer"`

