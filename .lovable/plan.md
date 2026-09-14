# Migração para o Supabase externo — continuação (a partir de onde parou)

O que já está pronto:
- Passos 1 a 6 do SQL Editor (estrutura, funções, permissões, usuários e conteúdo) — executados.
- Cópia das imagens: 65 de 66 arquivos já copiados por mim para o projeto novo (`srewrvfdwwemjrhsxlun`), com os mesmos caminhos.

## Próximos passos, em ordem

### 1. Confirmar o projeto novo
O endereço que você me enviou era de um projeto diferente do da chave. Usei o projeto da chave (onde o depósito `gallery` foi criado hoje). Confirme que é esse mesmo antes de seguir.

### 2. Passo 7 — Gatilhos
No SQL Editor do projeto novo, execute `docs/migracao-supabase/05-gatilhos.sql` (deve terminar com "Success").

### 3. Passo 8 — Rotinas automáticas
Execute `06-agendamentos.sql`, antes trocando no arquivo:
- `<SEU-PROJETO>` pelo ref do projeto novo
- `<SUA-SERVICE-ROLE-KEY>` pela chave service role do projeto novo

### 4. Passo 9 — Imagens: falta só 1 arquivo
O vídeo do carrossel (`hero/desktop_1781455693704_lv_0_20260611183341.mp4`, ~100 MB) não foi copiado porque o limite de upload do projeto novo está em 50 MB (padrão do plano gratuito).

Duas opções:
- **A:** aumentar o limite em Storage → Settings → Upload file size limit (exige plano Pro) e eu copio o arquivo em seguida;
- **B:** seguir sem o vídeo por enquanto — a página inicial passa a usar a imagem de capa até o vídeo ser copiado.

### 5. Passo 10 — Conferência
Execute `10-verificacao-final.sql` e me envie o resultado (ou um print) para eu conferir as colunas "esperado" x "atual".

### 6. Configurações do projeto novo (painel do Supabase)
- Authentication → Providers: ativar E-mail (e Google, se usar login social).
- Authentication → URL Configuration: Site URL `https://pousadararazul.com`; redirecionamentos `https://pousadararazul.com/**` e a URL de pré-visualização.
- Authentication: ativar proteção contra senhas vazadas; manter confirmação de e-mail sem autoconfirmação.
- Authentication → Emails: reconfigurar remetente/domínio.

### 7. Chaves de integração (secrets das funções)
Recadastrar no projeto novo com exatamente estes nomes: `FNRH_API_USER`, `FNRH_API_PASSWORD`, `FNRH_CPF_SOLICITANTE`, `FNRH_ENV`, `GOOGLE_API_KEY`, `GOOGLE_PLACE_ID`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SITE_URL`, `VITE_MERCADO_PAGO_PUBLIC_KEY`.
A tabela `fnrh_credentials` fica vazia — preencher depois pelo painel em `/admin/fnrh`.

### 8. Publicar as 37 funções de servidor
Requer Node.js no seu computador:
```bash
npx supabase login
npx supabase link --project-ref <REF-DO-PROJETO-NOVO>
npx supabase functions deploy
```
Se preferir, eu preparo um guia detalhado dessa etapa.

### 9. Webhooks
Atualizar os endereços de retorno no Mercado Pago e no Resend para o projeto novo.

### 10. Apontar o site para o banco novo
Eu faço esta parte: troco `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` no ambiente do site. Depois publicamos e testamos juntos (página inicial, /bangalos, /experiencias, uma reserva de teste com PIX, login administrativo, calendário, painel FNRH e pré-chegada).

## Lembretes
- Não apague o projeto atual por pelo menos 30 dias — ele é sua cópia de segurança.
- Se algo falhar em qualquer passo, pare e me envie o erro antes de continuar.
