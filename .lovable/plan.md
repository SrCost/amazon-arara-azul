## Objetivo
Substituir as fotos exibidas nos 6 cards da seção "Experiências exclusivas" (em `/experiencias`) pelas imagens que você anexou, casando cada card pelo nome do arquivo.

## Mapeamento card → imagem
| Card | Arquivo enviado |
|---|---|
| Trilhas Guiadas | `trilhas_guiadas.jpg` |
| Observação de Aves | `Observação_de_aves.jpeg` |
| Passeios de Canoa | `passeio_de_canoa.png` |
| Visitas às Comunidades | `Visitas_as_comunidades.jpg` |
| Pôr do Sol no Rio | `por_do_sol.jpeg` |
| Fotografia de Natureza | `fotografias_de_natureza.jpg` |

## Como será feito
1. Subir cada uma das 6 imagens para o CDN via `lovable-assets` (a partir de `/mnt/user-uploads/…`), gerando pointers em `src/assets/experiences/*.asset.json`. Isso mantém o repositório leve.
2. Em `src/pages/Experiencias.tsx`:
   - Importar os 6 pointers.
   - Criar um array fixo `cardImage` com o par `{ src, alt }` correspondente a cada experiência.
   - Passar `image={cardImage[index]}` para o `<ExperienceCard>` em vez de `galleryImages[index]`.
   - Manter o hero, a galeria completa (`IrregularGallery`) e o lightbox exatamente como estão hoje — o lightbox continua abrindo as imagens da galeria (`galleryImages`), sem misturar com as fotos dos cards.
3. Nenhum outro arquivo é alterado. Sem mudanças em i18n, dados, banco ou lógica de reserva.

## Observações
- As imagens aparecem só nos cards; se depois você quiser que elas também façam parte da galeria completa e do hero, isso é um passo separado (envolve subir para o storage `gallery` via Admin → Galeria).
- Alt-text de cada card usará o título já traduzido da experiência (ex.: "Trilhas Guiadas").
