

# Implementação Google Tag Manager - GTM-T3BX6WPJ

## Objetivo
Implementar o Google Tag Manager seguindo **exatamente** o padrão oficial do Google, com o container ID `GTM-T3BX6WPJ`.

## Estrutura da Implementação

### 1. Script no `<head>` (alta prioridade de carregamento)
Inserir **imediatamente após** a tag de abertura `<head>` na linha 3 do `index.html`:
- Código JavaScript do GTM loader
- Inicializa o `dataLayer`
- Carrega o script do GTM de forma assíncrona

### 2. Fallback `<noscript>` no `<body>`
Inserir **imediatamente após** a tag de abertura `<body>` na linha 124 do `index.html`:
- Iframe invisível para browsers sem JavaScript
- Garante que o GTM funcione mesmo com JS desabilitado

## Códigos Oficiais (sem adaptações)

**Script para `<head>`:**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T3BX6WPJ');</script>
<!-- End Google Tag Manager -->
```

**Noscript para `<body>`:**
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T3BX6WPJ"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

## Arquivo a Modificar
- `index.html` — único arquivo HTML da aplicação React SPA

## Posicionamento Exato
| Código | Linha | Posição |
|--------|-------|---------|
| GTM Script | Após linha 3 | Logo após `<head>` |
| GTM Noscript | Após linha 124 | Logo após `<body>` |

## Garantias
- Código carrega **uma única vez** por página (SPA carrega `index.html` uma vez)
- Sem duplicatas
- Sem conflitos com scripts existentes (SEO, Schema.org)
- Funciona desktop e mobile
- Pronto para Google Analytics 4 e pixels de marketing

