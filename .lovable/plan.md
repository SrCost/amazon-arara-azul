# Correção dos gráficos do Painel Administrativo

## O problema (confirmado nos dados)

Os gráficos "Reservas Recentes" e "Receita Mensal" deveriam mostrar os últimos 6 meses (Mar a Ago/2026), mas aparece uma coluna extra "Fev" depois de "Ago".

Causa confirmada: a consulta busca reservas a partir de "hoje menos 6 meses" (21/02/2026) sem limite final e agrupa os meses apenas pelo **nome** ("Fev", "Mar", ...). Uma reserva de fevereiro/2026 cai dentro desse recorte, cria um balde "Fev" fora da sequência e ele é desenhado no fim do gráfico. O registro do sistema confirma 7 pontos no gráfico quando deveriam ser 6.

Dados reais atuais (reservas válidas, sem teste e sem canceladas):

```text
2026-01 -> 1 reserva   R$ 9.440,02
2026-02 -> 3 reservas  R$ 7.956,00
2026-07 -> 4 reservas  R$ 37.630,88
2026-08 -> 4 reservas  R$ 36.484,96
```

Portanto, a janela correta de 6 meses deve exibir: Mar 0, Abr 0, Mai 0, Jun 0, Jul 4, Ago 4 — sem nenhuma coluna de fevereiro.

## O que será feito

1. Delimitar a janela do gráfico ao primeiro dia de 6 meses atrás e ao último dia do mês atual, para nenhum mês de fora (passado distante ou futuro) entrar no gráfico.
2. Agrupar por ano+mês em vez de só nome do mês, eliminando a mistura entre meses iguais de anos diferentes.
3. Ordenar os pontos cronologicamente e rotular como "Jul/26", "Ago/26", deixando claro o ano e impedindo rótulos repetidos.
4. Manter as regras já existentes de dados: excluir reservas de teste e canceladas, receita somada pelo valor total da reserva no mês do check-in.
5. Validar após a correção: confirmar 6 pontos, valores iguais aos números reais acima e nenhuma coluna fora de ordem.

## Detalhes técnicos

- Arquivo: `src/hooks/useDashboardStats.ts` (bloco "FETCH MONTHLY DATA FOR CHARTS").
- Substituir `subMonths(new Date(), 6)` por `startOfMonth(subMonths(now, 5))` e adicionar filtro `lte("check_in", endOfMonth(now))`.
- Trocar a chave do `Map` de `format(date, "MMM")` para `format(date, "yyyy-MM")`, guardando o rótulo de exibição (`format(date, "MMM/yy", { locale: ptBR })`) separadamente; ignorar chaves não inicializadas.
- Gerar `chartData` a partir das chaves ordenadas (`sort()` da chave `yyyy-MM`).
- Nenhuma mudança de schema, de dados no banco ou nos componentes de gráfico (`src/pages/admin/Dashboard.tsx` continua igual).
