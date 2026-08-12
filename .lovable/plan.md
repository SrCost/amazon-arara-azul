# Correções: FNRH "Não autorizado" e formulário de chegada de resposta única

## 1. Erro ao carregar fichas em /admin/fnrh

O que já foi verificado: a função `fnrh-listar-fichas` está no ar (boot normal, sem erros nos logs) e devolve `401 Não autorizado` apenas quando a validação interna de sessão/permissão falha (`requireInternalUser`): sem cabeçalho `Bearer`, token inválido/expirado, ou usuário sem papel `admin`/`super_admin`.

Qual dos três casos ocorreu ainda não está confirmado, então o primeiro passo é diagnóstico, não conserto às cegas:

1. Adicionar logs de diagnóstico (sem expor tokens) em `requireInternalUser` distinguindo: ausência de sessão, token inválido/expirado, papel insuficiente. Reproduzir a chamada e ler os logs para identificar a causa exata.
2. Corrigir conforme o resultado:
   - Sessão ausente/expirada: garantir que a página envie a sessão atual e tente renovar antes de chamar as funções; se não houver sessão válida, redirecionar para login em vez de mostrar erro genérico.
   - Papel insuficiente: ajustar a verificação de papel (ou o vínculo do usuário) para incluir corretamente os papéis administrativos.
3. Melhorar a mensagem na tela: em vez de "Não autorizado", exibir "Sua sessão expirou. Entre novamente para carregar as fichas." com ação de login, aplicando o mesmo tratamento a todas as ações FNRH da página (criar reserva, check-in, check-out, reprocessar), que usam a mesma validação.

## 2. Formulário de chegada preenchido apenas uma vez

Regra nova: depois do primeiro envio, o hóspede não pode reenviar nem editar as respostas pelo link.

Aplicação da regra no servidor (não só na tela):

- `submit_pre_arrival`: se a reserva já tiver resposta registrada (`answered_at` preenchido), rejeitar o envio com erro próprio (`JA_RESPONDIDO`), sem alterar os dados existentes.
- Após o primeiro envio bem-sucedido, marcar o token de pré-chegada como usado.
- `get_pre_arrival_by_token`: passar a informar que a reserva já foi respondida e deixar de devolver as respostas anteriores para preenchimento, evitando reedição pelo link.

Na página `/pre-chegada`:

- Link de uma reserva já respondida passa a mostrar uma tela final de agradecimento ("Já recebemos suas informações"), com data do envio e botão de WhatsApp para qualquer ajuste, sem formulário editável.
- Remover o aviso/fluxo atual de "atualização" das respostas e o texto de sucesso que convida a atualizar depois.
- Se o hóspede tentar enviar em uma aba antiga, tratar o erro `JA_RESPONDIDO` exibindo a mesma tela de agradecimento em vez de erro técnico.

O painel administrativo continua podendo reenviar o e-mail, mas o link só exibirá a tela de "já respondido" — as respostas ficam preservadas e visíveis apenas no dashboard.

## Detalhes técnicos

- Migração: `CREATE OR REPLACE` de `submit_pre_arrival` e `get_pre_arrival_by_token` (mantendo assinaturas atuais, sem novas tabelas).
- Front-end: `src/pages/PreArrival.tsx` (estados de bloqueio) e arquivos de tradução `pt/en/es/fr/de`.
- Edge functions: `supabase/functions/_shared/internal.ts` (logs de diagnóstico) e `src/pages/admin/Fnrh.tsx` (mensagem/ação de sessão expirada).
