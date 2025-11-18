# Guia: Vídeo Cinematográfico Hero da Home

## 📍 Localização dos Arquivos de Vídeo

Os vídeos devem ser colocados em:

```
public/
└── media/
    ├── home-hero-video.mp4          # Versão desktop (1080p)
    ├── home-hero-video-mobile.mp4   # Versão mobile (720p)
    └── (opcionais .webm para melhor compressão)
```

## 🎬 Especificações Técnicas do Vídeo

### Duração e Formato
- **Duração**: 20-30 segundos
- **Formato**: MP4 (H.264) ou WebM (VP9)
- **Loop**: Sim (automático)
- **Áudio**: Opcional (será mutado por padrão)

### Resoluções
- **Desktop**: 1920x1080px (1080p) otimizado
- **Mobile**: 1280x720px (720p) otimizado

### Compressão
- **Taxa de bits**: 3-5 Mbps (desktop), 1.5-2.5 Mbps (mobile)
- **Codec de vídeo**: H.264 (MP4) ou VP9 (WebM)
- **Tamanho final**: ~5-10 MB (desktop), ~2-5 MB (mobile)

## 🎨 Conteúdo do Vídeo

### Cenas Necessárias (em sequência sugerida):

#### Fauna Amazônica
1. **Arara azul** voando em câmera lenta
2. **Botos cor-de-rosa** nadando
3. **Macacos do Ariaú** em movimento natural
4. **Jacaré** em focagem noturna (olhos brilhando)
5. **Peixes regionais** sob luz natural (piranha, tambaqui)

#### Flora e Paisagens
6. **Rio Amazonas** com reflexo do céu
7. **Floresta densa** (mata fechada, movimento de câmera entre árvores)
8. **Áreas alagadas** (igapó)
9. **Nascer do sol** no rio
10. **Pôr do sol** com luz dourada
11. **Vitória-régia** em plano cinematográfico

#### Cultura Amazônica
12. **Comunidade ribeirinha** (sem rostos explícitos, foco em atividades)
13. **Canoeiros** navegando lentamente
14. **Fogueira** à beira do rio (plano noturno)
15. **Produção artesanal** (paneiro, tipiti, farinha)
16. **Barco regional** no pôr do sol

#### Experiências da Pousada
17. **Caminhada na selva** (trilha)
18. **Canoagem** em águas calmas
19. **Observação de aves** (binóculos, guia)
20. **Bar/jungle bar** com iluminação natural
21. **Praia de água doce** (rio, areia branca)

## 🎥 Direção de Arte e Estilo

### Movimentos de Câmera
- Slow pan (panorâmica lenta)
- Dolly in/out (aproximação/afastamento suave)
- Drone pass (passagem aérea)
- Movimento estabilizado (sem tremores)

### Paleta de Cores
- **Tons principais**: Verdes profundos, azuis naturais, dourado (luz solar)
- **Pôr do sol**: Laranjas, rosas, roxos suaves
- **Noite**: Azuis escuros, luz de fogueira

### Iluminação
- Luz natural predominante
- Golden hour (luz dourada do amanhecer/entardecer)
- Luz difusa na floresta
- Contrastes suaves

### Áudio (opcional)
- Sons ambiente: água corrente, pássaros, folhas
- Trilha ambiente minimalista
- Sem diálogos

## 🛠️ Onde Obter o Vídeo

### Opção 1: Serviços de IA para Geração de Vídeo
**Runway ML** (Recomendado)
- Site: https://runwayml.com/
- Modelo: Gen-3 Alpha
- Permite gerar vídeos de alta qualidade com prompts
- Custo: ~$12/100 créditos (1 crédito = 5 segundos)

**Exemplo de prompt para Runway:**
```
Cinematic slow-motion shot of a blue macaw flying through the Amazon rainforest, 
golden hour lighting, lush green canopy background, professional wildlife photography style, 
ultra realistic, 4K quality
```

**Pika Labs**
- Site: https://pika.art/
- Bom para cenas curtas
- Interface mais simples

**Stable Video Diffusion**
- Através do Replicate API
- Mais técnico, mas gratuito/open source

### Opção 2: Vídeo Stock (Mais Rápido)
**Artlist** (Recomendado para qualidade)
- Site: https://artlist.io/
- Buscar: "Amazon rainforest", "Amazon wildlife", "river boat sunset"
- Licença ilimitada
- Custo: ~$29/mês

**Pexels** (Gratuito)
- Site: https://www.pexels.com/videos/
- Filtros: Amazon, rainforest, wildlife, river
- Licença livre

**Envato Elements**
- Site: https://elements.envato.com/video
- Grande variedade
- Custo: ~$16.50/mês

### Opção 3: Contratar Videomaker
- Plataformas: Upwork, Fiverr, 99designs
- Custo estimado: $50-200 USD para um vídeo de 30 segundos
- Vantagem: Totalmente personalizado

## 📦 Preparação do Vídeo

### Ferramenta de Compressão Recomendada
**HandBrake** (Gratuito)
- Site: https://handbrake.fr/
- Preset: "Web" → "Gmail 1080p30" (desktop)
- Preset: "Web" → "Gmail 720p30" (mobile)

### Configurações HandBrake:
```
Formato: MP4
Codec: H.264
Taxa de bits: 3000 kbps (desktop), 1500 kbps (mobile)
Framerate: 30 fps
Áudio: AAC 128 kbps (ou remover se não necessário)
```

### FFmpeg (Linha de Comando)
```bash
# Desktop (1080p)
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -b:v 3M -c:a aac -b:a 128k output-desktop.mp4

# Mobile (720p)
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -b:v 1.5M -c:a aac -b:a 128k output-mobile.mp4

# WebM (alternativa)
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libvpx-vp9 -b:v 2M output.webm
```

## 🚀 Instalação no Site

1. Coloque os arquivos de vídeo em `public/media/`
2. O componente `HeroVideo` já está integrado na home
3. O vídeo iniciará automaticamente (autoplay, muted, loop)
4. Fallback automático para imagem estática caso o vídeo não carregue

### Estrutura Atual
```tsx
// src/pages/Index.tsx
<HeroVideo>
  {/* Conteúdo sobreposto (texto, botões) */}
</HeroVideo>
```

## ✅ Checklist Final

- [ ] Vídeo tem 20-30 segundos
- [ ] Formato MP4 H.264
- [ ] Versão desktop (1080p) ~5-10 MB
- [ ] Versão mobile (720p) ~2-5 MB
- [ ] Testado em Chrome, Firefox, Safari
- [ ] Testado em mobile (iOS/Android)
- [ ] Overlay de texto legível em todos os frames
- [ ] Loop é suave (início/fim se conectam)

## 🎯 Prompts Sugeridos para IA

### Para Runway ML / Pika:

**Cena 1 - Arara Azul:**
```
Cinematic slow-motion shot of a vibrant blue hyacinth macaw in flight, 
Amazon rainforest background, golden hour lighting, shallow depth of field, 
professional wildlife cinematography, ultra realistic 4K
```

**Cena 2 - Rio Amazonas:**
```
Aerial drone shot slowly descending over the Amazon River at sunset, 
mirror-like reflections, golden and pink sky, lush green forest on both sides, 
cinematic color grading, 4K ultra HD
```

**Cena 3 - Fogueira:**
```
Close-up cinematic shot of a campfire by the riverside at night, 
warm orange glow, silhouettes of trees, calm water reflection, 
atmospheric smoke, professional cinematography, 4K
```

**Cena 4 - Canoa:**
```
Wide shot of a traditional wooden canoe gliding through calm Amazon waters, 
sunrise golden light, mist over water, rainforest in background, 
peaceful atmosphere, cinematic 4K
```

## 📞 Suporte

Se precisar de ajuda para obter ou preparar o vídeo:
1. Runway ML Tutorial: https://help.runwayml.com/
2. Artlist Stock Video: https://help.artlist.io/
3. HandBrake Guide: https://handbrake.fr/docs/

---

**Nota**: O componente `HeroVideo` já está implementado e funcional. Basta adicionar os arquivos de vídeo no local indicado!
