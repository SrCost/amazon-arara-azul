

# Plano: Seção "Nossa Família Anfitriã" na Página de Sustentabilidade

## Visão Geral

Adicionar uma nova seção visualmente impactante na página `/sustentabilidade` apresentando a família ribeirinha que recebe os hóspedes na Pousada Arara Azul.

## Localização na Página

A seção será inserida **após a seção "Nosso Impacto em Números"** e **antes da seção "Nossa Missão"**, criando uma transição natural entre os números de impacto social e a missão da pousada.

## Design Visual Proposto

### Layout
- Fundo com gradiente sutil verde/terra para destacar a seção
- Layout em duas colunas no desktop (foto à esquerda, texto à direita)
- Layout empilhado no mobile (foto em cima, texto embaixo)

### Efeitos Visuais
1. **Animação de entrada**: Fade-in-up ao entrar na viewport
2. **Foto com moldura decorativa**: Borda arredondada com sombra suave e pequeno detalhe decorativo
3. **Hover na foto**: Leve zoom e aumento de sombra
4. **Ícone decorativo**: Coração ou ícone de família no título
5. **Aspas decorativas**: Citação estilizada para destacar parte do texto
6. **Linha decorativa**: Separador visual com gradiente verde

### Estrutura do Texto

```
🏠 Nossa Família Anfitriã

[Parágrafo 1 - Introdução]
Na Pousada Arara Azul, você é recebido por uma verdadeira família ribeirinha...

[Parágrafo 2 - Conhecimento]
Eles conhecem cada canto dos lagos de Acajatuba...

[Parágrafo 3 - Experiência - em destaque como citação]
"Cada hóspede se torna parte da história da família..."
```

---

## Detalhes Técnicos

### Arquivo a Modificar
| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Sustainability.tsx` | Adicionar nova seção com foto e texto |

### Arquivo de Imagem
| Arquivo | Ação |
|---------|------|
| `src/assets/familia-anfitria.jpg` | Copiar a imagem enviada pelo usuário |

### Componente da Nova Seção

```tsx
{/* Host Family Section */}
<section className="mt-16 sm:mt-20 relative overflow-hidden">
  {/* Background decorativo */}
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
  
  <div className="relative bg-card rounded-2xl shadow-strong p-6 sm:p-10 md:p-16">
    {/* Título com ícone */}
    <div className="text-center mb-8 sm:mb-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-forest mb-4">
        <Home className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">
        Nossa Família Anfitriã
      </h2>
      {/* Linha decorativa */}
      <div className="w-24 h-1 bg-gradient-forest mx-auto mt-4 rounded-full" />
    </div>

    {/* Grid: Foto + Texto */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      {/* Foto com moldura */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-forest rounded-2xl opacity-20 
                        group-hover:opacity-30 transition-opacity blur-xl" />
        <img
          src={familiaAnfitria}
          alt="Família anfitriã ribeirinha da Pousada Arara Azul"
          className="relative w-full rounded-xl shadow-strong object-cover 
                     aspect-[4/5] sm:aspect-[3/4] 
                     group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>

      {/* Texto */}
      <div className="space-y-6">
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Na Pousada Arara Azul, você é recebido por uma verdadeira família ribeirinha...
        </p>
        
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Eles conhecem cada canto dos lagos de Acajatuba...
        </p>

        {/* Citação em destaque */}
        <blockquote className="relative pl-6 border-l-4 border-primary 
                               bg-primary/5 py-4 pr-4 rounded-r-lg">
          <p className="text-base sm:text-lg text-foreground italic leading-relaxed">
            "Cada hóspede se torna parte da história da família..."
          </p>
        </blockquote>
      </div>
    </div>
  </div>
</section>
```

---

## Resumo das Alterações

| Item | Descrição |
|------|-----------|
| **Imagem** | Copiar foto da família para `src/assets/familia-anfitria.jpg` |
| **Import** | Adicionar import da imagem e ícone `Home` |
| **Seção** | Nova seção entre "Impacto em Números" e "Nossa Missão" |
| **Efeitos** | Gradiente de fundo, moldura com glow, hover com zoom, blockquote estilizado |
| **Responsivo** | Grid adaptativo (1 coluna mobile, 2 colunas desktop) |

---

## Resultado Visual Esperado

- Seção que se destaca visualmente do resto da página
- Foto da família com efeito de "glow" suave ao redor
- Texto bem organizado em parágrafos com citação em destaque
- Transição suave de hover que convida à interação
- Design consistente com o estilo "amazônico verde" do resto do site

