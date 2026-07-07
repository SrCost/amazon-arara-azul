Ajustar a ordem das seções na homepage para que "Nossos bangalôs" fique logo abaixo dos cards de diferenciais e "O que nossos hóspedes dizem" siga logo em seguida.

### Contexto
Atualmente a homepage exibe a ordem:
1. Hero
2. Busca
3. Diferenciais (cards)
4. Depoimentos (Google Reviews)
5. CTA secundário
6. Nossos bangalôs
7. CTA WhatsApp
8. Deixar avaliação
9. Como chegar
10. CTA final

### Objetivo
Reordenar para:
1. Hero
2. Busca
3. Diferenciais (cards)
4. **Nossos bangalôs** (subir para logo após os cards)
5. **O que nossos hóspedes dizem** (seguir logo abaixo dos bangalôs)
6. CTA secundário
7. CTA WhatsApp
8. Deixar avaliação
9. Como chegar
10. CTA final

### O que será alterado
- `src/pages/Index.tsx`: apenas mover os blocos `<section>` de "Lodges Section" e `<GoogleReviewsCarousel />` para a nova ordem. Nenhum componente interno será modificado; nenhuma rota, store, contexto, hook, consulta ou card será tocado.

### O que NÃO será alterado
- Componentes internos (`BungalowCarousel`, `GoogleReviewsCarousel`, `LodgeCard`, `CTASection`, `SearchBar`, `HeroVideoSection`, etc.).
- Lógica de dados, props, hooks ou queries.
- Estilos, textos, imagens, funcionalidades.

### Validação
- Verificar visualmente a nova ordem das seções no preview.
- Confirmar que os carrosséis (bangalôs e Google Reviews) continuam funcionando normalmente.