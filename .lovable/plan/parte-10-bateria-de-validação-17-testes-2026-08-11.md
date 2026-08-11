# Parte 10 — Bateria de validação (17 testes)

Objetivo: executar os 17 testes, registrar o resultado de cada um e corrigir apenas o que falhar. Nada é reescrito preventivamente.

## Como cada teste será verificado

Três métodos, escolhidos por tipo de teste:

- **Navegador automatizado** (abre a aplicação de verdade, clica e tira print): testes 1, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 17.
- **Consulta ao banco** (confirma o que foi realmente gravado): testes 2, 3, 4, 9, 10, 16.
- **Logs das funções de servidor** (confirma quantas chamadas saíram e para onde): testes 2, 11, 12, 13, 16.

## Dados de teste

Uma reserva de teste será criada com a marcação `is_test = true` (já existente no projeto) para não poluir relatórios, e removida no fim da bateria. O e-mail usado nos testes de envio será informado por você antes de eu rodar os testes 11 e 13.

## Roteiro

### Bloco A — Reservas (1 a 5, 16)
1. Abrir uma reserva antiga (1 bangalô) no painel e confirmar que detalhes, edição e calendário seguem normais.
2. Criar reserva com 1 bangalô; confirmar gravação e uma única chamada de criação na integração oficial de check-in.
3. Criar reserva com 2 bangalôs (Peneira + Tipiti); confirmar 1 reserva com 2 acomodações.
4. Criar reserva com 3 bangalôs (Peneira + Tipiti + Paneiro); confirmar 1 reserva com 3 acomodações e valor somado.
5. Tentar reservar bangalô já ocupado no período; confirmar bloqueio tanto no painel quanto no site público.
16. **Crítico**: reserva de teste com 3 bangalôs e 5 hóspedes (2+2+1). Verificar nos logs que houve **uma única** chamada de criação, que os totais de adultos/menores somam 5, e que o link oficial de pré-checkin retornado é diferente do link de Pré-Chegada da mesma reserva.

### Bloco B — Pré-Chegada, acesso e tokens (6 a 10)
6. Abrir o link de pré-chegada sem estar logado; formulário carrega em etapas.
7. Alterar o token na URL; deve aparecer a tela de link inválido.
8. Simular token vencido (validade atual: até o dia seguinte ao check-out); deve aparecer a tela amigável de link expirado.
9. Enviar o formulário; status na lista de reservas passa a **Respondido**.
10. Reabrir o mesmo link e reenviar; a resposta anterior é substituída, status passa a **Atualizado** e continua existindo apenas **um** registro de resposta por reserva.

### Bloco C — Envios automáticos e manuais (11 a 13)
11. Reserva pendente a 3 dias do check-in: rodar a rotina automática duas vezes seguidas e confirmar que o lembrete sai **uma única vez** (existem duas travas: contador na resposta e registro no log de e-mails).
12. Reserva cancelada: rodar a rotina e confirmar que nenhum lembrete é enviado.
13. Envio manual pelo administrador: confirmar e-mail enviado e registro no log de atividades.

### Bloco D — Idiomas e mobile (14, 15)
14. Abrir o formulário em PT, EN, ES e FR e conferir textos das etapas, revisão e telas de erro; conferir também o e-mail em cada idioma.
15. Conferir o formulário e a coluna de Pré-Chegada do painel em larguras de celular (390px) e tablet (820px).

### Bloco E — Dados sensíveis (17)
17. Acessar as respostas com um usuário administrativo comum e confirmar que a seção **Saúde e Bem-Estar** não aparece, enquanto as demais seções continuam visíveis. A regra hoje é aplicada no servidor (somente o administrador principal recebe esses campos), o que será confirmado na prática.

## Entrega

Relatório com os 17 testes marcados como OK / corrigido / bloqueado, prints das telas relevantes e a lista de correções aplicadas. Se algum teste exigir mudança de comportamento e não apenas correção de defeito, eu paro e aviso antes de mexer.

## Observação técnica

Os testes 11 e 12 dependem de datas: para não esperar dias, uso a reserva de teste com check-in ajustado para 3 dias à frente e depois revertido. Nenhum e-mail será disparado para hóspedes reais.
