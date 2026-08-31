# Hóspedes dentro do painel FNRH + status correto de preenchimento

## Objetivo

Consolidar a tela "Hóspedes" dentro de `/admin/fnrh`, como um painel de detalhes de recebimento (o que o hóspede preencheu) e envio (e-mail de pré-check-in enviado / sincronização), e garantir que o status seja atualizado corretamente logo após o hóspede enviar o formulário.

## O que muda

### 1. Painel "Recebimento e envio" no FNRH

- A tabela de hóspedes por reserva passa a ser um componente aberto por um botão no cabeçalho de `/admin/fnrh` (ao lado de "Credenciais" e "Consultas API"), no mesmo padrão de abrir/fechar já usado lá.
- Conteúdo mantido: código da reserva, hóspede, estadia, nascimento, nacionalidade, documento, status do pré check-in, dados faltantes, filtros Todos/Pendentes/Concluídos, busca e botão Atualizar.
- Acréscimo na coluna de status, para ficar claro "recebimento x envio":
  - Envio: e-mail de pré-check-in enviado (com data) ou não enviado.
  - Recebimento: data/hora do formulário recebido e do questionário de pré-chegada respondido.
- O item "Hóspedes" sai do menu lateral (a informação vive dentro de FNRH). A rota `/admin/hospedes` passa a redirecionar para `/admin/fnrh` para não quebrar links salvos.

### 2. Correção do status após o preenchimento

Verificado no banco: reservas com formulário já recebido ficam com `checkin_completed = true`, mas a situação FNRH permanece em branco ou como "pré-check-in pendente", porque o envio do formulário não atualiza esse campo. Correções:

- Ao enviar o formulário de check-in, a reserva passa a ser marcada como "pré-check-in realizado" (sem sobrescrever situações mais avançadas como check-in/check-out realizado, cancelado ou erro).
- Ao responder o questionário de pré-chegada, o mesmo tratamento é aplicado.
- Ajuste retroativo das reservas que já têm formulário recebido e continuam sem a situação correta.

## Detalhes técnicos

- Novo componente `src/components/admin/fnrh/HospedesPanel.tsx` a partir de `src/pages/admin/Hospedes.tsx` (mesmas consultas a `reservations` e `booking_checkins`, mais `pre_arrival_responses` para as datas de resposta), renderizado condicionalmente em `src/pages/admin/Fnrh.tsx`.
- `src/pages/admin/AdminLayout.tsx`: remover o item "Hóspedes".
- `src/App.tsx`: `/admin/hospedes` → `<Navigate to="/admin/fnrh" replace />`; remover o import da página e o arquivo `src/pages/admin/Hospedes.tsx`.
- Migração: atualizar `public.submit_checkin` (ambas as assinaturas) e `public.submit_pre_arrival` para gravar `situacao_fnrh = 'PRECHECKIN_REALIZADO'` quando a situação atual for nula, `NAO_SINCRONIZADA`, `PRECHECKIN_PENDENTE` ou `DADOS_INCOMPLETOS`; mais um `UPDATE` de correção dos registros históricos com a mesma condição.
- Sem novas tabelas e sem alteração no fluxo público de check-in/pré-chegada.
