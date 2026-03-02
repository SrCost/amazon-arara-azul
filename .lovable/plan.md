

# Atualizar Google Place ID

O Place ID atual (`ChIJN1t_tDeuEmsRUsoyG83frY4`) é um placeholder incorreto. O correto é `ChIJIZ49U-RjbJIRfRcHewbwWdE`.

## Alterações

### 1. Atualizar fallback no frontend (2 arquivos)

**`src/components/LeaveReviewSection.tsx`** (linha 4) e **`src/pages/Checkout.tsx`** (linha 14):
- Trocar `"ChIJN1t_tDeuEmsRUsoyG83frY4"` por `"ChIJIZ49U-RjbJIRfRcHewbwWdE"`

### 2. Atualizar secret no backend

Usar a ferramenta de secrets para atualizar o valor de `GOOGLE_PLACE_ID` para `ChIJIZ49U-RjbJIRfRcHewbwWdE` (usado pela edge function `fetch-google-reviews`).

