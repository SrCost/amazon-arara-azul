## Mudanças em `src/components/landing/HeroVideoSection.tsx`

### 1. Correção do segundo botão
- Substituir botão WhatsApp por **"Nossa Missão"**.
- Remover imports `MessageCircle` e `createWhatsAppLink` (não usados aqui).
- Usar `<Link to="/sustentabilidade">` (rota interna existente) em vez do domínio absoluto — mantém SPA navigation e funciona em preview/produção. Ícone: `Leaf` ou `Sprout` do lucide-react (alinhado com tema Verde Bandeira).
- Adicionar chaves i18n `hero.ourMission` em pt/en/es/fr (`Nossa Missão` / `Our Mission` / `Nuestra Misión` / `Notre Mission`).

### 2. Revelação por scroll (texto + botões)
- Remover as classes `animate-fade-in-up` do bloco de conteúdo (título, subtítulo, CTAs).
- Adicionar `useState` para `scrollY` + listener `window.scroll` (passivo) com cleanup.
- Calcular `progress = clamp(scrollY / 280, 0, 1)` (revela completa ao chegar ~280px de scroll, sensação suave em mobile e desktop).
- Aplicar via `style`:
  - Wrapper do conteúdo: `opacity: progress`, `transform: translateY(${(1 - progress) * 24}px)`, `transition: opacity 0.2s linear, transform 0.2s linear`.
- Aplicar stagger leve usando multiplicadores por elemento:
  - Título: revela a partir de `progress > 0` (mapeado 0→0.6).
  - Subtítulo: 0.15→0.75.
  - Botões: 0.3→1.0.
- Respeitar `prefers-reduced-motion`: se ativo, mostrar tudo opaco sem transform (estado final estático).
- Estado inicial (scroll = 0): conteúdo invisível, somente vídeo + overlay + navbar visíveis — combina com o pedido "ocultos enquanto o vídeo está rodando".

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/components/landing/HeroVideoSection.tsx` | Editar: trocar CTA, adicionar scroll reveal |
| `src/i18n/locales/{pt,en,es,fr}.json` | Adicionar chave `hero.ourMission` |

Sem alterações em `LandingNavbar`, `useVideoMenuSync`, `Index.tsx` ou outros componentes.
