# Migração para o Supabase externo — respostas e correções

## 1. Passo 7 — as chaves: onde pegar cada valor

Eu não consigo ler o conteúdo das chaves guardadas (elas são gravadas de forma cifrada e nem eu tenho acesso). O que posso fazer é dizer, uma por uma, de onde tirar o valor:

| Nome (copie exatamente) | Onde pegar o valor |
|---|---|
| `SITE_URL` | Já sei: `https://pousadararazul.com` |
| `FNRH_ENV` | Já sei: `producao` |
| `MERCADO_PAGO_ACCESS_TOKEN` | Mercado Pago → sua aplicação → **Credenciais de produção** → "Access token" |
| `VITE_MERCADO_PAGO_PUBLIC_KEY` | Mesma tela → "Public key" |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Mercado Pago → Webhooks → **Configurar notificações** → "Assinatura secreta" (botão de revelar) |
| `RESEND_API_KEY` | Resend → API Keys (se não puder revelar a atual, crie uma nova e use a nova) |
| `GOOGLE_API_KEY` | Google Cloud Console → APIs e Serviços → Credenciais → sua chave de API |
| `GOOGLE_PLACE_ID` | É o identificador do Google Maps da pousada; posso recuperar e te passar |
| `FNRH_API_USER` | Usuário do cadastro da pousada no sistema FNRH/Ministério do Turismo |
| `FNRH_API_PASSWORD` | Senha do mesmo cadastro |
| `FNRH_CPF_SOLICITANTE` | CPF do responsável cadastrado na FNRH |

Se você não tiver mais em mãos alguma delas, eu consigo recuperar as informações não sigilosas (como `GOOGLE_PLACE_ID` e o CPF cadastrado, se estiver no banco) e te aviso quais precisam ser geradas de novo no painel do fornecedor.

## 2. Passo 8 — o erro do terminal (e a correção)

O deploy funcionou: todas as funções subiram. As duas linhas em vermelho são de **duas funções que não existem mais** no projeto — `generate-receipt-pdf` e `payment-webhook`. Elas continuam listadas num arquivo de configuração antigo, então a ferramenta tenta publicá-las e não encontra o arquivo.

**Correção que eu faço:** remover essas duas entradas obsoletas do arquivo `supabase/config.toml`.

Depois disso, baixe o código atualizado e rode `npx supabase functions deploy` de novo — vai terminar sem erro. As 37 funções reais já estão publicadas; nada ficou faltando.

## 3. Passo 9 — o Mercado Pago realmente não precisa de mudança

Você está certo. O endereço de aviso de pagamento **não** vem do painel: o próprio site informa ao Mercado Pago, em cada cobrança, o endereço do banco que está em uso naquele momento. Ou seja, ao virar o site para o banco novo (passo 10), os avisos passam a chegar no lugar certo automaticamente.

A "URL configurada" que aparece no seu print (`https://pousadararazul.com/`) é só o endereço genérico da aplicação e não interfere. Único ajuste a conferir lá: se você gerar uma nova **assinatura secreta** de webhook, ela precisa ser cadastrada como `MERCADO_PAGO_WEBHOOK_SECRET` no projeto novo (item do passo 7).

O Resend, que você já configurou, era o que de fato precisava do endereço novo. Bom.

## 4. O que eu vou fazer nesta etapa

- Remover de `supabase/config.toml` os dois blocos obsoletos (`generate-receipt-pdf` e `payment-webhook`), que é a causa do erro em vermelho.
- Corrigir os números esperados em `docs/migracao-supabase/10-verificacao-final.sql`: 29 funções e 38 gatilhos (não 30/51), e 65 arquivos enquanto o vídeo não for copiado.
- Atualizar `docs/migracao-supabase/00-LEIA-ME.md` com: onde cadastrar as chaves (Project Settings → Edge Functions → Secrets), de qual pasta rodar o deploy, a nota de que o Mercado Pago não precisa de alteração de endereço e que a configuração de remetente de e-mail no Supabase é opcional.

## 5. Depois disso, o que falta

1. Você cadastra as 11 chaves no projeto novo (passo 7).
2. Roda o deploy novamente com o código corrigido (passo 8) — deve terminar limpo.
3. Passo 10: eu troco o endereço e a chave pública do site para o projeto novo, publicamos e testamos juntos (página inicial, /bangalos, /experiencias, uma reserva de teste com PIX, login do painel, calendário, painel FNRH e pré-chegada).
4. Você roda a conferência final para registro.

Pendências suas: confirmar que o projeto novo é o mesmo onde copiei as imagens, e decidir sobre o vídeo do carrossel (aumentar o limite de upload no plano pago ou seguir sem ele por ora).
