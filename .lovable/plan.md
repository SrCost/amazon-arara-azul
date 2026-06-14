## Objetivo

Trocar o hero atual da home (carrossel de imagens) por uma hero fullscreen com **vídeo de fundo em loop**, navbar que escurece ao rolar, e um efeito sutil em que o fundo dos botões do menu acompanha o progresso do vídeo. A URL do vídeo é configurável pelo admin (sem upload de arquivo, conforme escolhido).

Tudo será encapsulado em componentes novos, sem mexer no `Navigation` global, no `HeroCarousel` atual, nem em outras rotas.

## Escopo

### Vai mudar
- `src/pages/Index.tsx` — substituir o bloco `<section>` do hero (HeroCarousel + overlay + SearchBar) por `<HeroVideoSection />`. Resto da home (features, reviews, lodges, CTAs, footer) **permanece igual**.
- Nova entrada no admin para configurar a URL do vídeo.

### Não vai mudar
- `Navigation.tsx`, `HeroCarousel.tsx`, demais páginas, fluxo de reservas, i18n existente (apenas acréscimos).

## Componentes e arquivos novos

| Arquivo | Função |
|---|---|
| `src/components/landing/HeroVideoSection.tsx` | Hero 100vw × 100vh: `<video>` de fundo (`autoplay muted loop playsInline`, `object-fit: cover`), overlay `bg-black/45`, título + subtítulo + 2 CTAs centralizados, animação `animate-fade-in-up`. Renderiza internamente o `LandingNavbar`. |
| `src/components/landing/LandingNavbar.tsx` | Navbar fixo, transparente no topo → sólido `bg-foreground/95` (verde escuro do tema) após 60px de scroll, transição 0.3s. Logo à esquerda, links à direita, CTA "Reservar agora". Mobile: hambúrguer (reaproveita o `Sheet` do shadcn). Recebe `menuBgStyle` para aplicar nos itens. |
| `src/hooks/useVideoMenuSync.ts` | Recebe `videoRef`, escuta `timeupdate`/`loadedmetadata`/`pause`. Retorna `menuBgStyle = { background, transition }`. Mapeia `progress` em 3 faixas (whites translúcidos 0.05 / 0.15 / 0.25). Sem efeito colateral quando o vídeo não está disponível ou pausado. |

## Configuração da URL do vídeo (sem upload)

Como não há endpoint de upload de vídeo e a escolha foi "URL fixa configurável", uso a tabela existente `hero_slides` (que já tem `media_type` e `desktop_image_url`):

- Convenção: o slide com `media_type = 'video'` e `is_active = true` de menor `display_order` define a URL do vídeo da home.
- `HeroVideoSection` faz `select` direto desse registro. Se nenhum existir, faz fallback para um poster image (primeiro slide de imagem ativo) sem vídeo, para não quebrar a home.
- No admin (`src/pages/admin/HeroCarousel.tsx`), garantir que já é possível criar um slide com `media_type = 'video'` colando a URL pública (mp4/webm). Se o form atual não expõe esse campo claramente, adiciono um toggle "Vídeo de fundo da home" no editor — única alteração mínima no admin, sem mexer na lógica de upload de imagens.

Sem novas tabelas, sem migration, sem bucket novo.

## Conteúdo (i18n)

Adicionar nas 4 línguas (`pt`, `en`, `es`, `fr`) sob a chave `landing.hero`:

- `title`: "Viva a Amazônia em estado puro"
- `subtitle`: "Bangalôs sustentáveis às margens do Rio Negro, com experiências guiadas pela comunidade local."
- `ctaPrimary`: "Reservar agora" → `/bangalos`
- `ctaSecondary`: "Falar no WhatsApp" → usa helper existente `src/lib/whatsapp.ts` com mensagem contextual da landing.
- Itens do menu: reaproveitam chaves já existentes em `nav.*`.

## Design system

- Cores via tokens semânticos do tema Verde Bandeira (sem hex avulsos):
  - Navbar sólido: `bg-primary/95` ou `bg-background/95` (decidido na implementação para garantir contraste).
  - CTA primário: `bg-gradient-forest text-primary-foreground` (mesmo gradiente já usado em outros CTAs).
  - CTA secundário: `border border-white/60 text-white bg-white/10 backdrop-blur`.
- Tipografia: `font-display` para o título, escala com `clamp()` via classes utilitárias inline (`text-[clamp(2.5rem,6vw,5rem)]`).
- Animações: classes `animate-fade-in-up` já presentes no projeto. Sem adicionar framer-motion (não está instalado).

## Responsividade

- `< 768px`: título reduz via `clamp`, CTAs em coluna, links viram hambúrguer (`Sheet`).
- `≥ 768px`: layout horizontal padrão.
- iOS: `<video playsInline muted autoPlay loop preload="metadata">`.

## Acessibilidade e performance

- `aria-label` nos botões do hambúrguer e CTAs.
- `<video>` com `poster` (imagem de fallback do hero) para LCP rápido.
- Respeita `prefers-reduced-motion`: se ativo, não toca o vídeo e mostra apenas o poster.

## Validação

1. Home `/` carrega com hero em vídeo fullscreen, navbar transparente.
2. Ao rolar > 60px, navbar fica sólido com transição suave.
3. Fundo dos itens do menu muda de opacidade conforme o vídeo avança (visível principalmente em desktop).
4. CTA primário leva a `/bangalos`; secundário abre WhatsApp com mensagem da landing.
5. Mobile (375px): hambúrguer abre, CTAs em coluna, vídeo cobre a tela.
6. Sem vídeo configurado: home mostra poster estático e segue funcional.
7. Restante da home (features, Google reviews, lodges, footer) inalterado.

## Detalhes técnicos

```text
src/
├─ components/landing/
│  ├─ HeroVideoSection.tsx   // <video> + overlay + conteúdo + <LandingNavbar/>
│  └─ LandingNavbar.tsx      // scroll behavior + menuBgStyle nos links
├─ hooks/
│  └─ useVideoMenuSync.ts    // timeupdate → faixas 0.05/0.15/0.25
└─ pages/Index.tsx            // troca <section> do hero por <HeroVideoSection/>
```

Hook (esqueleto):
```ts
export function useVideoMenuSync(ref: RefObject<HTMLVideoElement>) {
  const [opacity, setOpacity] = useState(0.05);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const onTime = () => {
      if (v.paused || !v.duration) return;
      const p = v.currentTime / v.duration;
      setOpacity(p < 0.33 ? 0.05 : p < 0.66 ? 0.15 : 0.25);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [ref]);
  return { background: `rgba(255,255,255,${opacity})`, transition: "background 0.6s ease" };
}
```

## Fora de escopo (explicitamente)

- Upload de vídeo (descartado nesta iteração — escolhido "URL fixa configurável").
- Nova rota `/landing` separada (escolha foi substituir o hero da home).
- Alterações no `Navigation` global, no fluxo de reservas ou em qualquer outra página.
