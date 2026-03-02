

# Correcao Definitiva — Dominio, SEO e Seguranca

## Problema critico encontrado
O dominio oficial e `pousadararazul.com`, mas **index.html**, **sitemap.xml** e **robots.txt** usam o dominio errado `pousadaararaazul.com` (com "a" extra). Alem disso, o webhook do Mercado Pago ainda usa `pousada-arara-azul.lovable.app` como fallback.

## O que ja esta correto
- Edge functions de check-in e check-out ja usam `SITE_URL` com fallback `pousadararazul.com`
- Token: 48h de expiracao, uso unico, validacao server-side via RPCs
- `_redirects` para SPA routing ja existe
- SSL/HTTPS e HSTS sao gerenciados automaticamente pela plataforma
- Rate limiting ja implementado na tabela `rate_limits`
- Email logs ja registram cada envio com status

## Itens nao aplicaveis (gerenciados pela plataforma)
- Redirect 301 de `lovable.app` para dominio custom (gerenciado pela infraestrutura do Lovable ao configurar dominio custom)
- HSTS e certificado SSL (automatico)
- Headers de seguranca (ja configurados via vercel.json conforme memoria do projeto)
- `NEXT_PUBLIC_*` / `process.env` (projeto usa Vite, nao Next.js)

---

## Alteracoes a implementar

### 1. Corrigir dominio em index.html
Substituir todas as 20+ ocorrencias de `pousadaararaazul.com` por `pousadararazul.com` em:
- Canonical URL
- Hreflang tags
- Open Graph tags (og:url, og:image)
- Twitter tags
- Schema.org JSON-LD (url, @id, email, image, logo, urlTemplate)

### 2. Corrigir dominio em sitemap.xml
Substituir todas as ocorrencias de `pousadaararaazul.com` por `pousadararazul.com` nas 7 URLs + hreflang alternates.

### 3. Corrigir dominio em robots.txt
Atualizar a linha Sitemap de `pousadaararaazul.com` para `pousadararazul.com`.

### 4. Corrigir fallback no webhook Mercado Pago
Em `supabase/functions/mercado-pago-webhook/index.ts` linha 120, trocar `pousada-arara-azul.lovable.app` por `pousadararazul.com`.

### 5. Atualizar usePageMeta para canonical dinamico
Estender o hook para atualizar a tag `<link rel="canonical">` dinamicamente com base na rota atual, usando `https://pousadararazul.com` como base.

### 6. Bloquear paginas privadas no robots.txt
Adicionar `Disallow: /checkin` e `Disallow: /checkout` para evitar indexacao dessas rotas privadas.

### 7. Corrigir window.location.origin em AuthContext
O signup usa `window.location.origin` para redirect — isso e aceitavel para auth redirects (funciona em qualquer dominio). Nenhuma alteracao necessaria.

### Arquivos a editar
- `index.html` — corrigir dominio (20+ substituicoes)
- `public/sitemap.xml` — corrigir dominio
- `public/robots.txt` — corrigir dominio + adicionar disallow
- `supabase/functions/mercado-pago-webhook/index.ts` — corrigir fallback
- `src/hooks/usePageMeta.ts` — adicionar canonical dinamico

