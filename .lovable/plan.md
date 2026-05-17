## Objetivo

No PMS (`/admin/calendario-reservas`), ao selecionar o pacote **Gavião Panema** em uma reserva manual (nova ou edição), as datas de check-in e check-out devem ficar **livres para edição**, sem travamento nem auto-ajuste baseado na duração do pacote — comportamento que continua valendo para os demais pacotes (Uirapuru, Japiim, Araraúna).

## Como identificar o pacote customizável

Reaproveitar a mesma heurística já usada no fluxo público (`PackageSelection.tsx`):

```ts
const isCustomizablePackage = (pkg) =>
  pkg.price === 0 ||
  pkg.name?.toLowerCase().includes("gavião") ||
  pkg.name?.toLowerCase().includes("panema");
```

## Arquivos a alterar

### 1. `src/components/admin/calendar/NewReservationModal.tsx`
- Em `handlePackageChange` (linha ~157): se for pacote customizável, **não** alterar `check_out` nem forçar `guests`; apenas registrar `selectedPackage` e `package_id`.
- No botão de check-out (linha ~527) e no `onSelect` do check-in (linha ~492-500): substituir `selectedPackage` por `selectedPackage && !isCustomizable` para liberar edição e remover o auto-ajuste.

### 2. `src/components/admin/calendar/EditReservationModal.tsx`
- Mesma lógica em `handlePackageChange` (linha ~199): pular auto-ajuste de `check_out`/`guests` quando customizável.
- Nos triggers `disabled={!!selectedPackage}` (linhas 429 e 579) e no `onSelect` do check-in (linha 549-555): usar `selectedPackage && !isCustomizable`.
- Manter o cálculo de preço por pacote intacto — Gavião Panema tem price 0, então a tarifa diária manual continua aplicável.

### 3. Indicador visual (opcional, leve)
Quando o pacote selecionado for Gavião Panema, trocar o aviso "Pacote selecionado: X pessoas, Y noites" por algo como "Pacote personalizado — datas e tarifas livres" para deixar claro ao operador.

## Fora do escopo
- Fluxo público de reserva (já trata Gavião Panema via WhatsApp).
- Mudanças em schema, edge functions ou cálculo de preço.
- Tradução i18n (modais do PMS são em PT-BR).
