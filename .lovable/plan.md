# Migração para o Supabase externo — passos restantes, detalhados

## Sobre as diferenças que você viu na conferência

Estão certas — o problema é a lista de "esperado", não o seu banco novo:

- **29 funções e 38 gatilhos é o número correto.** A linha "30 funções / 51 gatilhos" do arquivo de conferência contou errado: o banco antigo lista o mesmo gatilho uma vez para cada operação (inserir, editar, apagar), inflando o total. Os arquivos de migração criam exatamente 29 funções e 38 gatilhos — foi o que apareceu no seu projeto novo. Vou corrigir os números esperados no arquivo `10-verificacao-final.sql`.
- **65 arquivos no armazenamento** é exatamente o esperado por ora: falta só o vídeo do carrossel (~100 MB), barrado pelo limite de 50 MB do plano gratuito.

Ação: nenhuma. Essas duas divergências não são erro.

## Passo 6 — "reconfigurar remetente/domínio" (pode pular)

Isso **não** se configura na Hostinger. É a tela de e-mails do próprio Supabase, e só importa se você quiser que os e-mails de login/redefinição de senha saiam com o seu domínio.

Hoje seus e-mails para hóspedes saem pelo Resend (chave `RESEND_API_KEY`), não pelo Supabase. Então:

- **Pode deixar como está.** Os e-mails de recuperação de senha do painel sairão pelo remetente padrão do Supabase, o que funciona.
- Se quiser depois personalizar: no projeto novo, Authentication → Emails → Settings → SMTP Settings, informando os dados do Resend (host `smtp.resend.com`, porta `465`, usuário `resend`, senha = a chave do Resend).

## Passo 7 — Onde cadastrar as chaves de integração

O print que você mandou é a tela **Integrations** — não é ali. O caminho é:

1. No projeto novo, menu lateral: **Project Settings** (engrenagem, no rodapé do menu).
2. Seção **Edge Functions** → **Secrets** (em alguns painéis aparece como "Functions → Secrets", ou "Edge Functions → Manage secrets").
3. Botão **Add new secret** e cadastre um por um, com o nome exatamente igual:

`FNRH_API_USER`, `FNRH_API_PASSWORD`, `FNRH_CPF_SOLICITANTE`, `FNRH_ENV`, `GOOGLE_API_KEY`, `GOOGLE_PLACE_ID`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SITE_URL`, `VITE_MERCADO_PAGO_PUBLIC_KEY`

Os valores são os mesmos que você já usa hoje (Mercado Pago, Resend, Google Cloud, FNRH). `SITE_URL` = `https://pousadararazul.com`. As chaves `SUPABASE_*` não precisam ser cadastradas — o próprio projeto já as fornece.

Importante: essa etapa precisa vir **antes** do passo 8, senão as funções sobem sem credenciais.

## Passo 8 — Publicar as funções de servidor, em detalhe

Não é dentro da pasta `docs/migracao-supabase/`. É na **pasta do projeto do site inteiro**, porque o comando lê a pasta `supabase/functions`.

Como fazer (Windows ou Mac):

1. Instale o **Node.js** em <https://nodejs.org> (botão LTS).
2. Baixe o código do site: no Lovable, canto superior direito → GitHub → e clone/baixe o repositório como ZIP; descompacte, por exemplo em `C:\arara-site`.
3. Abra o terminal **dentro dessa pasta** (a que tem os arquivos `package.json` e a pasta `supabase`).
4. Rode, um por vez:

```bash
npx supabase login
npx supabase link --project-ref <REF-DO-PROJETO-NOVO>
npx supabase functions deploy
```

- O `login` abre o navegador para você autorizar.
- `<REF-DO-PROJETO-NOVO>` é o pedaço do endereço antes de `.supabase.co`.
- Ele vai pedir a senha do banco do projeto novo no `link`.
- O `deploy` sobe as 37 funções de uma vez e mostra a lista ao final.

Se preferir não mexer em terminal, existe alternativa: manter o site no Lovable Cloud (banco atual) e usar o projeto externo só como cópia. Me diga se quiser avaliar esse caminho.

## Passo 9 — Endereços dos webhooks

Troque `<REF-NOVO>` pela referência do projeto novo:

- **Mercado Pago** (painel do MP → Suas integrações → sua aplicação → Webhooks / Notificações):
  `https://<REF-NOVO>.supabase.co/functions/v1/mp-webhook`
- **Resend** (painel do Resend → Webhooks → Add endpoint):
  `https://<REF-NOVO>.supabase.co/functions/v1/resend-webhook`

Antes de trocar, confira nos painéis do Mercado Pago e do Resend qual endereço está configurado hoje: se o atual terminar em `/mercado-pago-webhook` em vez de `/mp-webhook`, mantenha o mesmo final, só mudando o começo do endereço.

Só faça isso depois do passo 8 — os endereços só respondem quando as funções estiverem publicadas. E lembre: no momento em que você trocar, as notificações de pagamento passam a chegar no banco novo, então essa é a hora de virar o site também (passo 10).

## Passo 10 — Virada e conferência final

1. Eu troco no site o endereço e a chave pública do projeto novo.
2. Publicamos.
3. Testamos juntos: página inicial, /bangalos, /experiencias, uma reserva de teste com PIX, login do painel, calendário de reservas, painel FNRH e formulário de pré-chegada.
4. Você roda `10-verificacao-final.sql` (já com os números corrigidos) para o registro final.

## O que eu faço nesta etapa

- Corrigir os números esperados em `10-verificacao-final.sql` (29 funções, 38 gatilhos) e a nota sobre os 65/66 arquivos.
- Detalhar no `00-LEIA-ME.md` os passos 7, 8 e 9 com o conteúdo acima (onde cadastrar as chaves, de onde rodar o deploy, quais endereços de webhook).
- Deixar registrado que a configuração de remetente de e-mail é opcional.

Nada do código do site é alterado agora — a troca do endereço do banco fica para o passo 10, quando você autorizar.

## Pendências suas
- Confirmar que o projeto novo é o mesmo em que copiei as imagens.
- Decidir sobre o vídeo do carrossel (aumentar o limite de upload ou seguir sem ele por ora).
