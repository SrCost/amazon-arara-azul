
# Plano: Adicionar Banner de Páscoa ao Carrossel da Página Inicial

## Diagnóstico do Carrossel Atual

O `HeroCarousel.tsx` usa:
- **Imagens atuais**: 1920x1080 (panorama largo)
- **Array de imagens**: Hardcoded com `heroBungalow1` e `heroBungalow2`
- **Renderização**: Cada imagem usa `object-cover` que corta a imagem para preencher o container
- **Altura do hero**: Responsiva: 400px (mobile) → 550px (sm) → 650px (md) → 700px (lg)
- **Taxa de aspecto**: Aproximadamente 16:9 (1920÷1080 = 1.78)

## Problema com a Imagem de Páscoa

Sua imagem tem dimensões **1200x628**, o que resulta em:
- **Taxa de aspecto**: 1200÷628 = **1.91** (mais panorâmica que 16:9)
- **Comportamento com `object-cover`**: A imagem será **cortada horizontalmente** ou **verticalmente** dependendo do viewport, ocultando informações da campanha

## Solução Proposta

### Opção 1: Adicionar a Imagem com `object-contain` Seletivo (Recomendado)
- Detectar qual imagem está sendo exibida
- Para a imagem de Páscoa: usar `object-contain` (mostra a imagem inteira, pode ter letterboxing)
- Para as outras: manter `object-cover` (preenche o container)
- Adicionar fundo colorido (azul escuro, como na imagem) para o letterboxing

### Opção 2: Redimensionar a Imagem em Edição (Mais Simples)
- Redimensionar a imagem para 1920x1080 em uma ferramenta de edição (mantendo a proporção ou adicionando background)
- Adicionar ao carrossel normalmente com `object-cover`
- ✅ Mais simples, sem lógica adicional
- ❌ Requer edição externa

### Opção 3: Usar Container Flex com Background Dinâmico
- Manter a imagem em `object-contain` para não cortar
- Usar um background dinâmico baseado na imagem (azul para Páscoa)
- Criar um componente mais sofisticado

## Implementação Recomendada (Opção 1)

### Estrutura de Dados
```typescript
interface CarouselImage {
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain';
  backgroundColor?: string; // Para letterboxing
}

const images: CarouselImage[] = [
  {
    src: heroBungalow1,
    alt: "Pousada Arara Azul - Bangalô",
    objectFit: 'cover',
  },
  {
    src: heroBungalow2,
    alt: "Pousada Arara Azul - Bangalô 2",
    objectFit: 'cover',
  },
  {
    src: pascoapacoteImage,
    alt: "Pacote Páscoa - Pousada Arara Azul",
    objectFit: 'contain', // Mostra a imagem inteira
    backgroundColor: 'rgb(30, 58, 140)', // Azul da campanha
  },
];
```

### Renderização Atualizada
```tsx
<div
  key={index}
  className={`absolute inset-0 transition-opacity duration-1000 ${
    index === currentIndex ? "opacity-100" : "opacity-0"
  }`}
  style={{
    backgroundColor: images[index].backgroundColor || 'transparent',
  }}
>
  <img
    src={images[index].src}
    alt={images[index].alt}
    width={1920}
    height={1080}
    loading={index === 0 ? "eager" : "lazy"}
    decoding={index === 0 ? "sync" : "async"}
    fetchPriority={index === 0 ? "high" : "auto"}
    className={`absolute inset-0 w-full h-full ${
      images[index].objectFit === 'cover' ? 'object-cover' : 'object-contain'
    }`}
  />
  <div className="absolute inset-0 bg-black/20" />
</div>
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/assets/` | Copiar `CAMPANHA-PACOTE-PASCOASITE.png` como `pascoa-pacote-banner.png` |
| `src/components/HeroCarousel.tsx` | Refatorar para array de objetos com metadados de imagem, usar `object-contain` para Páscoa |

## Benefícios da Solução

✅ **Sem corte de informações**: A imagem de Páscoa será exibida inteira
✅ **Responsivo**: Funciona em todos os tamanhos de tela
✅ **Flexível**: Fácil adicionar mais imagens com diferentes comportamentos
✅ **Visual coeso**: Background azul combina com o design da campanha
✅ **Performance**: Mesmo carregamento de imagens (lazy loading mantido)

## Resultado Final

- Carrossel rotacionará entre:
  1. Bangalô 1 (object-cover)
  2. Bangalô 2 (object-cover)
  3. Pacote Páscoa (object-contain com fundo azul)
- Cada imagem será exibida por 5 segundos
- Navegação por setas e indicadores funcionará normalmente
