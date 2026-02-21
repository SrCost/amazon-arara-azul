

# Manter imagens padrao e adicionar midias do banco no carrossel

## Problema atual

O carrossel funciona em modo "ou/ou": se existem slides no banco de dados, as imagens padrao (hero-bungalow-1, hero-bungalow-2) desaparecem completamente. Alem disso, os botoes "Reservar Agora" e "Nossa Missao" aparecem sobre as midias inseridas pelo admin, atrapalhando a visualizacao.

## Solucao

Combinar as imagens padrao (fallback) com os slides do banco em uma unica lista. As imagens padrao sempre aparecem primeiro, e os slides do banco sao adicionados em seguida. Para os slides do banco, o overlay com botoes sera sempre ocultado automaticamente.

## Alteracoes tecnicas

### 1. `src/components/HeroCarousel.tsx`

Mudar a logica de "ou fallback ou banco" para "fallback + banco combinados":

- Criar uma lista unificada de slides com um tipo comum (ex: `type: "fallback" | "db"`)
- As imagens padrao sempre aparecem (indices 0 e 1)
- Os slides do banco sao concatenados depois
- O `totalSlides` sera `FALLBACK_IMAGES.length + slides.length`
- No callback `onSlideChange`:
  - Para slides fallback: `hideOverlay = false` (botoes aparecem normalmente)
  - Para slides do banco: `hideOverlay = true` (botoes sempre ocultos, independente do campo `hide_overlay` do banco)
- A funcao `renderSlide` verifica se o indice corresponde a um fallback ou a um slide do banco e renderiza de acordo

### Logica simplificada

```
Slides finais = [fallback1, fallback2, ...slidesDB]

Ao trocar de slide:
  - Se indice < 2 (fallback) -> mostra overlay com botoes
  - Se indice >= 2 (do banco) -> oculta overlay com botoes
```

### 2. Nenhuma alteracao no admin (`/admin/carrossel`)

O painel de gerenciamento continua funcionando da mesma forma. O campo `hide_overlay` permanece disponivel para controle futuro, mas no frontend os slides do banco sempre terao os botoes ocultos.

## Resultado esperado

- As 2 fotos padrao dos bangalos continuam aparecendo no carrossel com os botoes "Reservar Agora" e "Nossa Missao" visiveis
- Qualquer midia adicionada pelo admin aparece JUNTO com as fotos padrao, sem os botoes sobrepostos
- A ordem e: imagens padrao primeiro, depois as midias do banco ordenadas por `display_order`

