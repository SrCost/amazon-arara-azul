
# Substituir Imagem Mobile/Tablet do Banner de Páscoa

## Estado Atual

O componente `HeroCarousel.tsx` já está corretamente configurado para usar imagens responsivas:
- `src` (desktop): banner panorâmico com `object-contain`
- `mobileSrc` (mobile/tablet até 1023px): imagem vertical com `object-cover object-top lg:hidden`
- A configuração técnica está pronta, apenas a imagem precisa ser atualizada

## Nova Imagem Redimensionada

A imagem enviada (`user-uploads://image-15.png`) é uma versão otimizada para mobile/tablet com:
- Layout vertical (story 9:16)
- Logo "Arara Azul" bem posicionado no topo
- "Pacote Páscoa" em destaque (caixa amarela)
- Fundo com céu (melhor aproveitamento visual)
- "15% OFF" em amarelo bem visível
- Textos descritivos claros
- CTA "Faça sua reserva" no rodapé
- Enquadramento otimizado para evitar cortes indesejados

## Solução

### Substituir o asset `src/assets/pascoa-pacote-banner-mobile.png`

Copiar `user-uploads://image-15.png` para `src/assets/pascoa-pacote-banner-mobile.png`, substituindo a versão anterior.

**Nenhuma alteração no código TypeScript é necessária** - o componente já está configurado corretamente para:
- Exibir a imagem mobile com `object-cover object-top` em dispositivos até 1023px
- Manter o banner panorâmico no desktop (1024px+)
- Preservar o fundo azul no desktop

## Resultado Esperado

- **Mobile (400px)**: Imagem preenche toda a área com melhor enquadramento, logo e texto bem visíveis
- **Tablet (550-650px)**: Aproveitamento máximo do espaço vertical, sem cortes críticos
- **Desktop (1024px+)**: Banner panorámico sem mudança (mantém fundo azul)

