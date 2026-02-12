

# Remover Faixa Azul no Rodape do Banner de Pascoa (Mobile)

## Problema

O slide do banner de Pascoa usa `backgroundColor: "rgb(30, 58, 140)"` (azul escuro). Como a imagem quadrada nao preenche toda a altura do container com `object-contain`, o fundo azul aparece nas bordas -- especialmente na parte inferior, criando uma faixa azul visivel entre o banner e a secao de busca.

## Solucao

Alterar a cor de fundo do slide do banner de Pascoa para coincidir com o fundo da pagina (`hsl(120, 15%, 97%)` -- branco esverdeado). Assim o espaco vazio se confunde com o fundo da pagina, tornando a transicao invisivel.

## Alteracao Tecnica

### `src/components/HeroCarousel.tsx` (linha 28)

**De:**
```
backgroundColor: "rgb(30, 58, 140)"
```

**Para:**
```
backgroundColor: "hsl(120, 15%, 97%)"
```

Nota: O desktop continuara usando `object-contain` com a mesma cor de fundo. Como o banner panoramico do desktop tem fundo proprio azul escuro na imagem, a cor do container fica quase toda coberta. Se necessario, podemos manter o azul apenas no desktop com uma abordagem CSS mais granular, mas a mudanca simples ja resolve o problema principal no mobile.

