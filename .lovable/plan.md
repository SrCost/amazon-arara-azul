# Plano — Internacionalização Profissional Completa

## Objetivo
Eliminar mistura PT/EN, traduzir profissionalmente todo o conteúdo público + fluxo de reserva, adicionar **alemão (DE)** e exibir banner discreto sugerindo o idioma detectado do navegador.

---

## 1. Adicionar Alemão (DE) como 5º idioma

- Criar `src/i18n/locales/de.json` espelhando a estrutura do `pt.json` (357 linhas, mesmas chaves).
- Registrar `de` em `src/i18n/config.ts` no objeto `resources`.
- Adicionar opção `{ code: "de", label: "Deutsch" }` em:
  - `src/components/Navigation.tsx` (dropdown desktop + grid mobile passa de 2x2 para 2x3 ou 3x2).
  - Qualquer outro seletor de idioma (footer, etc. — verificar).
- Adicionar `<link rel="alternate" hreflang="de" ... />` em `index.html`.

## 2. Auditoria e remoção de texto hardcoded

Páginas que **não** usam `useTranslation` ou usam parcialmente, a serem 100% i18n:

**Públicas:**
- `src/pages/Sustainability.tsx` (0 usos hoje — todo o conteúdo é PT hardcoded, incluindo os 6 cards de iniciativas, números de impacto, seção família anfitriã com a citação grande, missão).
- `src/pages/HowToGetThere.tsx` (0 usos).
- `src/pages/Contact.tsx` (1 uso — formulário, toasts, info de contato).
- `src/pages/LodgeDetail.tsx` (parcial — descrições, comodidades, política).
- `src/pages/Lodges.tsx` (parcial).
- `src/pages/Packages.tsx` (parcial — completar inclusões/highlights restantes).
- `src/pages/Experiencias.tsx` (parcial).
- `src/pages/Index.tsx` (parcial — completar seções restantes).
- `src/pages/ReservationSuccess.tsx`.
- `src/pages/FAQ.tsx`, `src/pages/NotFound.tsx`, `src/pages/Auth.tsx`.

**Fluxo de reserva (componentes):**
- `src/components/ReservationFlow.tsx`.
- `src/components/reservation/*` (DateSelection, GuestInfoForm, PackageSelection, PaymentStep, PixPayment, CreditCardPayment, ReviewStep, ReservationSummary, StepProgress).
- `src/pages/Checkin.tsx`, `src/pages/Checkout.tsx` (formulários FNRH, validações, toasts).

**Componentes globais:**
- `src/components/Footer.tsx`, `CTASection.tsx`, `FloatingSupportButton.tsx`, `HeroCarousel.tsx`, `HeroVideo.tsx`, `SearchBar.tsx`, `LeaveReviewSection.tsx`, `FindUsSection.tsx`, `LodgeCard.tsx`, `PackageCard.tsx`, `GoogleReviewsCarousel.tsx`, `AvailabilityCalendar.tsx`.

**Não traduzir nesta rodada:** `src/pages/admin/**` (uso interno, equipe PT) — registrado no escopo aprovado.

### Estratégia
1. Para cada arquivo, extrair toda string visível (texto entre tags, `placeholder=`, `aria-label=`, `alt=`, `title=`, `toast.success/error`, mensagens de validação Zod).
2. Criar chave em `pt.json` agrupada por contexto (ex.: `sustainability.familyHost.quote`).
3. Substituir literal por `{t("…")}` ou `t("…")`.
4. Para textos com variáveis, usar interpolação i18next (`{{var}}`).
5. Para listas/arrays inline (ex.: `initiatives` em Sustainability), mapear `key` para o JSON em vez de objeto literal com strings.

## 3. Tradução profissional (não automática)

- **PT** = idioma fonte, revisão de consistência (sempre "Bangalô", nunca "Pousada/Suíte" para unidades).
- **EN, ES, FR, DE** = tradução adaptada, **não literal**, com terminologia turística:
  - "Passeios de canoa" → EN "Canoe tours along the Amazon rivers" / DE "Kanutouren auf den Amazonas-Flüssen".
  - "Observação de aves" → EN "Guided birdwatching experiences" / DE "Geführte Vogelbeobachtung".
  - "Visita a comunidades ribeirinhas" → EN "Cultural visits to local riverside communities" / DE "Kulturbesuche in Flussufer-Gemeinschaften".
  - "Pensão completa" → EN "Full board" / DE "Vollpension".
  - "Transfer fluvial" → EN "River transfer" / DE "Flusstransfer".
- Manter nomes próprios sem tradução: "Bangalô", "Pacote Japiim/Uirapuru/Araraúna/Gavião Panema", "Rio Negro", "Manacapuru", "Acajatuba", "PIX".
- Para DE: usar tom formal "Sie".
- Política de cancelamento e textos legais: tradução cuidadosa, mantendo significado jurídico.

## 4. Banner de sugestão de idioma

Novo componente `src/components/LanguageSuggestionBanner.tsx`:

- Detecta `navigator.language` no mount.
- Se idioma detectado ∈ {pt, en, es, fr, de} **e** diferente do `i18n.language` atual **e** usuário ainda não dispensou (flag `langSuggestionDismissed` em localStorage):
  - Mostra banner discreto no topo (abaixo do `Navigation`, não fixo) com:
    - "We noticed you speak English. Switch to English?" (texto na língua detectada).
    - Botão "Switch" / "Trocar" + botão fechar (X).
- Ao clicar Switch: `i18n.changeLanguage(detected)` + grava preferência.
- Ao fechar: grava dismissed em localStorage (não reaparece na sessão).
- Montar em `src/App.tsx` ou `Layout` global.

## 5. Atualização de meta/SEO multilíngue

- `usePageMeta` deve aceitar chaves de tradução para `title`/`description`. Cada página passa chaves; o hook resolve via `i18n.t` e atualiza no `useEffect` quando o idioma muda.
- Adicionar `<html lang>` dinâmico via `i18n.on('languageChanged')` em `i18n/config.ts`.

## 6. Validações e toasts

- Centralizar mensagens Zod e `toast.*` sob `pt.json → "validation"` e `"toast"`.
- Substituir literais nos handlers (Contact, ReservationFlow, Checkin, Auth).

---

## Arquivos a criar
- `src/i18n/locales/de.json`
- `src/components/LanguageSuggestionBanner.tsx`

## Arquivos a editar (principais)
- `src/i18n/config.ts`, `src/i18n/locales/{pt,en,es,fr}.json` (expansão massiva)
- `src/components/Navigation.tsx`, `Footer.tsx`, `CTASection.tsx`, `FloatingSupportButton.tsx`, `HeroCarousel.tsx`, `HeroVideo.tsx`, `SearchBar.tsx`, `LeaveReviewSection.tsx`, `FindUsSection.tsx`, `LodgeCard.tsx`, `PackageCard.tsx`, `GoogleReviewsCarousel.tsx`, `AvailabilityCalendar.tsx`, `ReservationFlow.tsx`
- `src/components/reservation/*` (8 arquivos)
- `src/pages/{Index,Sustainability,HowToGetThere,Contact,Lodges,LodgeDetail,Packages,Experiencias,FAQ,NotFound,Auth,Checkin,Checkout,ReservationSuccess}.tsx`
- `src/hooks/usePageMeta.ts`
- `src/App.tsx` (montar banner)
- `index.html` (hreflang DE)

## Garantias
- Zero strings PT em código fora dos JSON.
- Mesma estrutura de chaves nos 5 idiomas (sem chaves órfãs).
- Sem mistura PT/EN visível ao usuário.
- Painel admin permanece em PT (fora do escopo aprovado).
- Memória `mem://i18n/comprehensive-site-translation-priority` será atualizada incluindo DE.
