# Múltiplos bangalôs — Partes 4, 5 e 6

Entrega em três etapas, uma finalizada e comunicada antes de iniciar a próxima. Nada do fluxo atual de reserva única muda de comportamento.

---

## PARTE 4 — Seleção de múltiplos bangalôs no site (fluxo público)

### O que o hóspede verá
1. Escolhe datas como hoje (bangalô da página atual = acomodação principal).
2. Novo bloco "Acomodações" com botão **+ Adicionar outro bangalô**: escolhe o bangalô e a quantidade de hóspedes daquela unidade.
3. Cada linha mostra disponibilidade em tempo real; bangalô indisponível nas datas escolhidas aparece desabilitado com o motivo ("indisponível nas datas selecionadas").
4. Capacidade máxima respeitada por bangalô (limite vem de `rooms.max_guests`); bangalô repetido é bloqueado; limite de 10 acomodações por reserva (regra já existente no banco).
5. Resumo e etapa de revisão passam a listar todas as acomodações com hóspedes e valor de cada uma.

### Regras de disponibilidade (sem overbooking)
- **Frontend**: validação imediata sobre reservas ativas + bloqueios administrativos, considerando também reservas que ocupam o bangalô como acomodação adicional.
- **Servidor (fonte da verdade)**: revalidação de todas as acomodações no momento de criar a reserva/gerar o pagamento; se qualquer uma estiver ocupada, nada é criado e o site devolve o erro atual `dates_unavailable`, já tratado na interface (volta para a escolha de datas).
- **Antes de confirmar o pagamento**: nova checagem final; se algo foi ocupado no intervalo, a reserva não é confirmada e o hóspede é avisado.

### Detalhes técnicos
- Ampliar a função de disponibilidade pública (`get_room_availability` e `get_room_availability_with_blocks`) para considerar `reservation_rooms`, não só `reservations.room_id`. Hoje uma acomodação adicional não apareceria como ocupada no calendário público — essa é a principal brecha de overbooking a fechar.
- `ReservationFlow.tsx`: novo estado `extraRooms` (`room_id` + `guests`), enviado no payload como `extra_rooms`.
- `create-pix-payment` e `create-card-payment`: aceitar `extra_rooms` (validado com Zod), montar a lista completa de acomodações, checar conflitos de reservas **e** de `blocked_dates` para cada bangalô, gravar `reservations` (bangalô principal espelhado, `guests` = soma) e `reservation_rooms` na mesma operação.
- `check-payment-status` / confirmação: revalidar acomodações antes de marcar `confirmed`.
- FNRH continua disparando **uma única vez** por reserva, somando adultos/menores de todas as acomodações — nenhum ponto novo de chamada.

---

## PARTE 5 — Cálculo de valores

- Reutiliza `src/lib/pricing.ts` (`getDailyRate`, `calculateNights`) sem alteração da tabela de preços nem multiplicadores.
- Total = soma, por acomodação, de `diária(hóspedes daquela unidade, preço do bangalô) × noites`, mais pacote/valores aplicáveis quando houver.
- Diária do pacote continua com a lógica atual; acomodações adicionais entram como diárias somadas, sem duplicar o valor do bangalô principal.
- Cada item de `reservation_rooms` guarda sua diária e subtotal; `reservations.total_price` guarda o total da reserva.
- O servidor recalcula o total a partir dos preços do banco e ignora o valor enviado pelo cliente, para o pagamento nunca sair de um valor manipulado no navegador.

---

## PARTE 6 — Dashboard `/admin/reservations`

Mantendo o layout atual, apenas ajustando conteúdo das colunas e do painel de detalhes:

- Coluna de acomodação passa a mostrar o resumo (ex.: "Peneira, 2 × Tipiti") com contagem de unidades.
- Nova informação na linha: total de hóspedes da reserva e quantidade de acomodações.
- No detalhe da reserva, tabela das acomodações: bangalô, hóspedes, diária e subtotal, seguida do valor total.
- Pagamento, status operacional, check-in e check-out seguem como hoje.
- Coluna **Pré-Chegada**: reservada na tabela e exibindo "—" enquanto o módulo da PARTE 7 não existir; passa a mostrar o status real quando a Pré-Chegada for implementada.

> A PARTE 7 (módulo de Pré-Chegada) ainda não foi especificada. A coluna fica preparada, e implemento o status assim que você enviar a PARTE 7.
