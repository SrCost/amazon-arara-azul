

# Plano: Dashboard com Dados Reais e Validados

## Diagnóstico do Problema Atual

Analisando o código do Dashboard e os dados do banco:

| Elemento | Status Atual | Problema |
|----------|--------------|----------|
| **Cards de estatísticas** | Consulta banco | ✅ Funciona, mas filtra `is_test` parcialmente |
| **Tendências (trends)** | Hardcoded | ❌ Valores fixos "+12.5%", "-3.1%" não são reais |
| **Gráfico de Reservas** | Dados mockados | ❌ Array estático `monthlyData` com valores fictícios |
| **Gráfico de Receita** | Dados mockados | ❌ Mesmo array estático com receitas falsas |
| **Taxa de Ocupação** | Cálculo simplista | ⚠️ Não considera período de hospedagem real |

### Dados Reais no Banco

| Métrica | Valor Real |
|---------|------------|
| Total de reservas | **25** (23 teste + 2 reais) |
| Reservas reais (is_test=false) | **2** |
| Quartos ativos | **3** |
| Mensagens novas | **0** (1 lida) |
| Receita do ano (real) | **R$ 9.440** (Jan/2026) |

---

## Solução Proposta

### 1. Substituir Gráficos Mockados por Dados Reais

Criar consultas que busquem dados mensais reais:

```typescript
// Buscar dados mensais dos últimos 6 meses
const fetchMonthlyData = async () => {
  const { data } = await supabase.rpc('get_monthly_dashboard_stats');
  // ou consulta direta com agregação
};
```

**Nova consulta SQL** para dados mensais:
```sql
SELECT 
  TO_CHAR(check_in, 'Mon') as month,
  COUNT(*) as reservations,
  COALESCE(SUM(total_price), 0) as revenue
FROM reservations
WHERE is_test = false
  AND status NOT IN ('cancelled')
  AND check_in >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', check_in), TO_CHAR(check_in, 'Mon')
ORDER BY DATE_TRUNC('month', check_in)
```

### 2. Calcular Tendências Reais

Comparar período atual com período anterior:

```typescript
// Tendência = ((valor_atual - valor_anterior) / valor_anterior) * 100
const calculateTrend = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const trend = ((current - previous) / previous) * 100;
  return `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
};
```

### 3. Melhorar Cálculo de Taxa de Ocupação

A taxa atual é incorreta. O cálculo correto considera **quarto-noites**:

```
Taxa de Ocupação = (Noites Ocupadas / Noites Disponíveis) × 100

Onde:
- Noites Disponíveis = Quartos Ativos × Dias no Período
- Noites Ocupadas = Soma das noites de cada reserva confirmada
```

Para o mês atual (Fevereiro/2026):
- 3 quartos × 28 dias = 84 noites disponíveis
- 0 noites ocupadas (reservas reais)
- Taxa = 0%

### 4. Garantir Filtro `is_test = false`

Todas as consultas devem excluir dados de teste:

```typescript
// Sempre usar este filtro
.eq("is_test", false)
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/Dashboard.tsx` | Refatorar para buscar dados reais, calcular tendências e ocupação corretamente |

---

## Detalhes da Implementação

### Dashboard.tsx - Nova Estrutura

```typescript
interface MonthlyStats {
  month: string;
  reservations: number;
  revenue: number;
}

interface DashboardStats {
  totalReservations: number;
  occupancyRate: number;
  pendingPayments: number;
  newMessages: number;
  totalRevenue: number;
}

interface Trends {
  reservations: string;
  occupancy: string;
  payments: string;
  messages: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({...});
  const [trends, setTrends] = useState<Trends>({...});
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  
  // Buscar dados mensais reais
  const fetchMonthlyStats = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data } = await supabase
      .from("reservations")
      .select("check_in, total_price, status")
      .eq("is_test", false)
      .neq("status", "cancelled")
      .gte("check_in", sixMonthsAgo.toISOString());
    
    // Agrupar por mês no frontend
    const grouped = groupByMonth(data);
    setMonthlyData(grouped);
  };
  
  // Calcular ocupação real
  const calculateOccupancy = async () => {
    const { data: reservations } = await supabase
      .from("reservations")
      .select("check_in, check_out, room_id")
      .eq("is_test", false)
      .in("status", ["confirmed", "pending", "hosted"]);
    
    const { count: roomsCount } = await supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    
    const daysInMonth = new Date(
      new Date().getFullYear(), 
      new Date().getMonth() + 1, 
      0
    ).getDate();
    
    const totalNightsAvailable = roomsCount * daysInMonth;
    const occupiedNights = calculateOccupiedNights(reservations);
    
    return Math.round((occupiedNights / totalNightsAvailable) * 100);
  };
  
  // Calcular tendências comparando com mês anterior
  const calculateTrends = async () => {
    // Mês atual vs mês anterior
    const currentMonth = await getMonthStats(0);
    const previousMonth = await getMonthStats(-1);
    
    setTrends({
      reservations: calculateTrend(currentMonth.reservations, previousMonth.reservations),
      occupancy: calculateTrend(currentMonth.occupancy, previousMonth.occupancy),
      payments: calculateTrend(currentMonth.pendingPayments, previousMonth.pendingPayments),
      messages: calculateTrend(currentMonth.messages, previousMonth.messages),
    });
  };
};
```

### Visualização dos Cards com Tendências Reais

```typescript
const statCards = [
  {
    title: t("admin.totalReservations"),
    value: loading ? "..." : stats.totalReservations.toString(),
    icon: CalendarCheck,
    trend: trends.reservations, // Calculado dinamicamente
  },
  // ... outros cards com trends calculados
];
```

### Gráficos com Dados Reais

Os gráficos usarão o state `monthlyData` que é preenchido com dados do banco:

```typescript
<LineChart data={monthlyData}> {/* Dados reais, não mockados */}
```

---

## Estado Final dos Dados

Após implementação, se não houver reservas reais suficientes, os gráficos mostrarão:

- **Meses sem dados**: Não aparecerão no gráfico (ou aparecerão com valor 0)
- **Tendências**: Mostrarão "0%" ou "-" quando não há dados suficientes
- **Taxa de ocupação**: Cálculo preciso baseado em noites-quarto

---

## Considerações Importantes

1. **Dados Escassos**: Com apenas 2 reservas reais, os gráficos ficarão "vazios" - isso é **correto e verdadeiro**
2. **Período dos Gráficos**: Buscar últimos 6 meses com dados reais
3. **Fallback Visual**: Mostrar mensagem "Dados insuficientes" se não houver reservas no período
4. **Performance**: Usar consultas otimizadas com agregação no banco quando possível

---

## Resumo das Alterações

| Componente | De | Para |
|------------|-----|------|
| Gráfico de Reservas | Array estático mockado | Consulta real agrupada por mês |
| Gráfico de Receita | Array estático mockado | Soma de `total_price` por mês |
| Trends dos Cards | Valores hardcoded | Cálculo comparativo mês atual vs anterior |
| Taxa de Ocupação | `confirmados / quartos` | `noites_ocupadas / (quartos × dias)` |
| Filtro is_test | Parcial | Aplicado em todas as consultas |

