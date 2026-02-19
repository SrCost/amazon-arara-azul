

# Corrigir Calculo de Precos e Adicionar Edicao Manual no Modal de Nova Reserva

## Problemas Identificados

1. **Formatacao incorreta**: Os valores de "Diaria Calculada" e "Total" exibem 3 casas decimais (ex: R$ 2.393,936) em vez de 2 casas (R$ 2.393,94). O calculo aplica o multiplicador de hospedes (1.596) sobre a tarifa base (1499,96) sem arredondar o resultado.

2. **Sem edicao manual**: Os campos "Diaria Calculada" e "Total" sao somente leitura, sem opcao de sobrescrita manual pelo administrador.

## Solucao

### Arquivo: `src/components/admin/calendar/NewReservationModal.tsx`

1. **Arredondar valores calculados** para 2 casas decimais usando `Math.round(value * 100) / 100`

2. **Adicionar estados de override manual** (`manualDailyRate` e `manualTotalPrice`) que, quando ativados, permitem ao admin digitar valores customizados nos campos

3. **Adicionar botoes de edicao (icone de lapis)** ao lado dos labels "Diaria Calculada" e "Total" que alternam entre modo calculado automatico e modo manual

4. **Indicador visual "(manual)"** quando o valor foi sobrescrito manualmente, similar ao que ja existe no modal de edicao de reserva (conforme memoria do projeto)

5. **Ao salvar**, usar os valores manuais quando definidos, caso contrario usar os calculados (arredondados)

### Detalhes tecnicos das alteracoes

- Importar icone `Pencil` do lucide-react
- Adicionar estados: `isManualDailyRate`, `manualDailyRateValue`, `isManualTotalPrice`, `manualTotalPriceValue`
- Arredondar `dailyRate` e `totalPrice` com `Math.round(x * 100) / 100`
- Substituir os `<div>` de exibicao de "Diaria Calculada" e "Total" por componentes que alternam entre texto (calculado) e `<Input type="number">` (manual) conforme o estado
- Adicionar botao com icone de lapis ao lado de cada label para ativar/desativar modo manual
- No `onSubmit`, usar `isManualDailyRate ? manualDailyRateValue : dailyRate` para `daily_rate` e equivalente para `total_price`
- Resetar os estados de override manual quando o modal abre ou quando o pacote muda

