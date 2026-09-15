# Migração final: projeto novo com banco externo

Objetivo: ter o site rodando exatamente como hoje, mas usando o banco novo (`srewrvfdwwemjrhsxlun`), que já está com estrutura, conteúdo e imagens conferidos.

Este projeto atual continua intacto e no ar durante todo o processo. A virada de domínio é o último passo.

## Etapa 1 — Enviar o código para o GitHub (aqui)

1. No menu de mais opções, GitHub → Conectar projeto, autorizando sua conta.
2. Criar o repositório (sugestão de nome: `pousada-arara-azul`).
3. Confirmar que o repositório aparece com todas as pastas do site.

## Etapa 2 — Criar o projeto novo no Lovable

1. Novo projeto → importar do GitHub → escolher o repositório criado.
2. Importante: **não** ativar o banco interno (Lovable Cloud) nesse projeto novo. A opção de conectar um banco externo só existe enquanto nenhum banco interno estiver ativo.

## Etapa 3 — Conectar o banco externo

1. No projeto novo, Conectores → Supabase → autorizar sua conta.
2. Escolher o projeto `srewrvfdwwemjrhsxlun` (região São Paulo).
3. A conexão preenche automaticamente endereço, chave pública e identificador do projeto. A chave pública que você me enviou serve de conferência.

## Etapa 4 — Chaves e funções no projeto novo

1. Conferir as 11 chaves de integração já cadastradas no banco novo (FNRH, Mercado Pago, Resend, Google, endereço do site).
2. Publicar as funções do servidor pelo projeto novo (a publicação é automática ao conectar; se algo falhar eu corrijo).
3. Preencher as credenciais FNRH pelo painel interno (/admin/fnrh), já que essa tabela foi criada vazia de propósito.

## Etapa 5 — Testes antes da virada

No endereço de pré-visualização do projeto novo, conferimos juntos:

- Início, /bangalos, /experiencias (imagens e vídeo)
- Reserva completa com PIX (e depois apagamos a reserva de teste)
- Login administrativo (senha provisória `Arara@2026!Trocar`, depois trocar)
- Calendário com as 14 reservas reais
- /admin/reservations, painel FNRH e formulário de pré-chegada
- E-mails automáticos (confirmação e pré-check-in)

## Etapa 6 — Apontar o domínio

1. Publicar o projeto novo.
2. Remover `pousadararazul.com` deste projeto atual.
3. Adicionar o mesmo domínio no projeto novo e aguardar a propagação (normalmente minutos, até 24h).
4. Conferir o site no domínio, com atenção a reservas e e-mails.

## Depois da virada

- Manter este projeto e o banco antigo por pelo menos 30 dias como retorno seguro.
- O vídeo do carrossel (cerca de 100 MB) segue pendente: só entra no banco novo se o limite de envio for aumentado (requer plano pago). Sem ele, o carrossel usa as imagens.

## Pontos que dependem de você

- Autorizar GitHub e Supabase nas etapas 1 e 3.
- Não ativar o banco interno no projeto novo.
- Decidir sobre o vídeo.

## Detalhes técnicos

- O projeto novo usa `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` preenchidos pela conexão externa, não editados à mão.
- As 22 funções listadas em `supabase/config.toml` já estão limpas das duas obsoletas; o deploy deve terminar sem erros.
- Agendamentos (`pg_cron`) e webhook do Resend já apontam para o projeto novo; Mercado Pago não precisa de mudança, pois o endereço de aviso é informado em cada cobrança.
