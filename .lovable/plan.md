# Crédito do Desenvolvedor — Rodapé + Página Contato

## Objetivo
Exibir discretamente o crédito "Site desenvolvido por Flávio A. Costa" em todo o site (rodapé) e em uma seção dedicada na página `/contato`. Ambos abrem o mesmo modal elegante com informações de contato do desenvolvedor.

## O que será criado/alterado

### 1. Novo componente: `src/components/DeveloperCreditModal.tsx`
Componente reutilizável que encapsula:
- Um **trigger** customizável (children como gatilho — ex.: texto do rodapé ou botão "Saiba mais")
- O **modal** (usando `Dialog` do shadcn, já presente no projeto) com:
  - Título: **Flávio A. Costa**
  - Subtítulo curto: "Desenvolvedor do site"
  - Descrição: *"Transformo ideias em experiências digitais. Do planejamento ao lançamento, desenvolvo sites e soluções web para negócios de todos os segmentos e nichos — com foco em performance, design e resultado."*
  - E-mail clicável (`mailto:flavio.cost@live.com`) com ícone `Mail`
  - LinkedIn clicável (`https://www.linkedin.com/in/flavio-cost/`, `target="_blank"`, `rel="noopener noreferrer"`) com ícone `Linkedin`
  - Botão "Fechar" (usa `DialogClose`)
- Visual alinhado ao design system: tokens semânticos (`bg-background`, `text-foreground`, `text-primary`, gradiente `bg-gradient-forest` no cabeçalho do card interno), tipografia `font-display` no nome, totalmente responsivo.

### 2. `src/components/Footer.tsx`
Na "Bottom Bar" (logo após o copyright/CNPJ), adicionar uma linha discreta centralizada:
```
Site desenvolvido por Flávio A. Costa
```
- Texto pequeno (`text-[10px]` ou `text-xs`), `opacity-70`, sublinhado sutil no hover.
- Envolto no `<DeveloperCreditModal>` como trigger clicável.
- Posicionado de forma a não competir com os botões existentes (Admin/Login).

### 3. `src/pages/Contact.tsx`
Adicionar uma nova seção **"Desenvolvedor do Site"** após o grid principal de contato (antes do `<Footer />`):
- Card simples e elegante (consistente com os outros `<Card>` da página) contendo:
  - Pequeno ícone/avatar discreto
  - Nome **Flávio A. Costa**
  - Breve descrição (uma linha resumida)
  - Botão sutil **"Saiba mais"** (`variant="link"` ou `outline` pequeno) que abre o modal
- Toda a área do nome/descrição também é clicável e abre o mesmo modal.

### 4. Traduções (i18n)
Adicionar chaves nos 5 locales (`pt`, `en`, `es`, `fr`, `de`):
- `footer.developedBy` → "Site desenvolvido por {{name}}"
- `developer.modalTitle`, `developer.role`, `developer.description`, `developer.emailLabel`, `developer.linkedinLabel`, `developer.close`, `developer.learnMore`, `developer.sectionTitle`

## Detalhes técnicos
- Reutilizar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogClose` de `@/components/ui/dialog`.
- Ícones: `Mail`, `Linkedin`, `ExternalLink` do `lucide-react`.
- Sem mudanças de backend, rotas ou lógica de negócio — apenas apresentação.
- Sem novas dependências.

## Arquivos tocados
- **Novo:** `src/components/DeveloperCreditModal.tsx`
- **Editado:** `src/components/Footer.tsx`
- **Editado:** `src/pages/Contact.tsx`
- **Editado:** `src/i18n/locales/{pt,en,es,fr,de}.json`
