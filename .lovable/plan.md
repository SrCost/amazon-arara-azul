

# Correção: Check-in/Check-out — Bug `useState` e sanitização de URL

## Problema
1. **Bug React**: `Checkin.tsx` (linha 54) e `Checkout.tsx` (linha 43) usam `useState(() => {...})` para executar lógica no mount. Isso é incorreto — `useState` não aceita callback com side-effects. Deve ser `useEffect`.
2. **Barra dupla na URL**: Se o secret `SITE_URL` tiver trailing slash, gera `//checkin`. Precisa sanitizar nas edge functions.

## Alterações

### 1. `src/pages/Checkin.tsx`
- Adicionar `import { useEffect }` 
- Substituir `useState(() => { if (tokenFromUrl) validateToken(tokenFromUrl); })` por `useEffect(() => { if (tokenFromUrl) validateToken(tokenFromUrl); }, [])`

### 2. `src/pages/Checkout.tsx`
- Adicionar `import { useEffect }` 
- Substituir `useState(() => { if (tokenFromUrl) validateToken(tokenFromUrl); })` por `useEffect(() => { if (tokenFromUrl) validateToken(tokenFromUrl); }, [])`

### 3. `supabase/functions/send-checkin-email/index.ts` (linha 44)
- Sanitizar trailing slash: `const siteUrl = (Deno.env.get("SITE_URL") || "https://pousadararazul.com").replace(/\/+$/, "");`

### 4. `supabase/functions/send-checkout-email/index.ts` (linha 42)
- Mesma sanitização de trailing slash

### 5. Atualizar secret `SITE_URL`
- Garantir valor `https://pousadararazul.com` (sem barra final)

