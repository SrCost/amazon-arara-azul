# Corrigir Pré-Chegada e ativar FNRH em produção

## Objetivo
Corrigir a marca para **Pousada Arara Azul**, eliminar a perda de foco nos campos do questionário, adequar as perguntas ao modelo solicitado e migrar a integração FNRH do ambiente de homologação indisponível para produção.

## Alterações previstas

### 1. Questionário de Pré-Chegada
- Estabilizar os componentes estruturais e as etapas do formulário para que a digitação não recrie o campo a cada caractere nem perca o foco.
- Ajustar a apresentação inicial para “Questionário de Pré-Chegada — Pousada Arara Azul”, mantendo os dados reais já carregados da reserva: responsável, período, hóspedes e bangalôs.
- Reorganizar as perguntas nas seções solicitadas:
  - **Alimentação:** Não, vegetariano, vegano, intolerância à lactose, doença celíaca/glúten, alergia alimentar, diabético e outra; campo para alimentos evitados.
  - **Saúde e Bem-estar:** condição de saúde; limitação física/mobilidade com Não/Sim e detalhe; medicação contínua com Não/Sim e detalhe.
  - **Crianças:** informação relevante para a equipe.
  - **Ocasião especial:** Não, aniversário, lua de mel, bodas e outro, com detalhe quando aplicável.
  - **Informações adicionais:** solicitação especial ou observação final.
- Remover a etapa “Transporte e Chegada”, conforme decidido.
- Preservar o fluxo em etapas, revisão/edição, limites de texto, salvamento, atualização posterior, auditoria e proteção dos dados sensíveis já existentes.
- Reutilizar as colunas atuais do backend; não criar tabela nova. Os valores de Não/Sim e detalhes serão normalizados nos campos já existentes para permanecerem compatíveis com o painel administrativo.

### 2. Marca e comunicações
- Substituir “Pousada Rará Azul” e “Rará Azul” por **Pousada Arara Azul** no formulário, título da página, mensagens de sucesso e traduções.
- Corrigir também os e-mails de convite e a notificação interna de Pré-Chegada, incluindo assunto, remetente visível, rodapé e texto alternativo do logotipo.
- Atualizar as traduções em português, inglês, espanhol, francês e alemão para manter o suporte multilíngue do projeto.

### 3. FNRH
- Alterar a configuração segura `FNRH_ENV` para `producao`, sem expor ou modificar usuário, senha ou CPF solicitante.
- Manter as chamadas exclusivamente nas funções do backend, com autenticação interna, validação, timeout, mascaramento de documentos e persistência de falhas para reprocessamento.
- Melhorar a mensagem operacional do painel para distinguir indisponibilidade de rede de recusas da API, preservando o retorno real sem revelar credenciais.
- Reprocessar uma ficha com erro após a troca e conferir o resultado no banco e nos logs. Não repetir em lote até validar a primeira resposta da produção.

## Validação
- Testar no navegador a digitação contínua em todos os campos de texto sem perda de foco.
- Percorrer todas as etapas, revisar, voltar para editar e enviar; confirmar persistência e atualização pelo mesmo link.
- Conferir o questionário em viewport desktop e mobile e validar que não há textos “Rará Azul” nos pontos afetados.
- Validar os e-mails/funções atualizados e a exibição administrativa das respostas, incluindo restrição de saúde por papel e auditoria.
- Confirmar conectividade FNRH de produção e executar uma única sincronização controlada; registrar claramente sucesso ou eventual rejeição de credencial/payload retornada pelo serviço oficial.

## Detalhes técnicos
- A perda de foco está confirmada em `PreArrival.tsx`: `Shell` e `Section` são definidos dentro do componente e, com cada atualização de estado, suas identidades mudam, remontando a árvore e o campo ativo.
- O erro FNRH está confirmado nos registros das reservas como falha de conexão. O código usa `FNRH_ENV` para escolher o host; o host atual de homologação não resolve no DNS, enquanto o host de produção responde por HTTPS.
- Não haverá alteração de schema ou de políticas RLS nesta correção.
