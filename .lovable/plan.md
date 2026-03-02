

# Corrigir botão "Avaliar no Google" bloqueado no desktop

## Problema

O `<a target="_blank">` para `search.google.com` é bloqueado pelo iframe de preview do Lovable no desktop. No celular funciona porque o comportamento de navegação é diferente.

**No site publicado** (`pousada-arara-azul.lovable.app`) o link funciona normalmente — o bloqueio é apenas no preview.

## Solução

Trocar o `<a>` por um `<button>` com `onClick` que usa `window.open()`, forçando a abertura em nova aba mesmo dentro do iframe:

```tsx
<button
  type="button"
  onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
  className="inline-flex items-center justify-center gap-3 ..."
>
```

### Arquivo alterado
- `src/components/LeaveReviewSection.tsx` — trocar `<a href={reviewUrl} target="_blank">` por `<button onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}>` mantendo todo o estilo atual.

