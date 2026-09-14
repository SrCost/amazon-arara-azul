# Opção B — eu copio as 66 imagens para o novo projeto

Você não precisa instalar nada nem rodar comandos. Eu executo a transferência daqui, lendo as imagens do banco atual do site e gravando no seu projeto novo, com os mesmos caminhos (para os links já salvos continuarem funcionando).

## O que preciso de você

Duas informações do **projeto novo** (o que você está configurando):

1. O endereço do projeto, algo como `https://xxxxxxxx.supabase.co`
2. A chave secreta *service role* — no painel do novo projeto: Project Settings → API → em "service_role", clicar em "Reveal" e copiar

A chave secreta será solicitada por um formulário seguro (não cole no chat). Depois da cópia, ela pode ser removida.

## Antes de eu rodar, confirme no projeto novo

- O depósito `gallery` já foi criado e está marcado como **público** (Passo 1 do arquivo 09)
- As 3 regras de acesso do Passo 2 já foram executadas

Se ainda não fez, faça isso primeiro — sem o depósito criado, a cópia falha.

## O que eu faço

1. Listo todos os arquivos do depósito `gallery` do projeto atual (66 arquivos, ~161 MB).
2. Copio cada um para o projeto novo mantendo exatamente o mesmo caminho, em lotes, ignorando o que já existir.
3. Confiro no final: contagem de arquivos no destino e comparação com os registros da galeria (33 registros / 66 arquivos).
4. Te informo o resumo (copiados / já existiam / erros) e, se algum falhar, repito só os que faltaram.

## Ajuste no guia

Também atualizo `docs/migracao-supabase/09-arquivos-e-imagens.md` para deixar claro:

- Quem é o "projeto atual" (o banco que o site usa hoje) e quem é o "projeto novo" (o que você criou)
- Que o Passo 3 pode ser feito por mim (Opção B, recomendada) ou no seu computador (Opção A, com o passo a passo de instalação do Node.js e onde abrir o terminal)

## Detalhes técnicos

- Script executado no sandbox usando `@supabase/supabase-js` com service_role de origem (projeto Lovable Cloud) e destino, `upsert: false`, preservando `contentType` e `storage_path`.
- Service role do destino guardada como secret do projeto (ex.: `MIGRACAO_DESTINO_SERVICE_ROLE`), lida por variável de ambiente; nunca impressa em logs.
- Verificação final: `SELECT count(*) FROM storage.objects WHERE bucket_id='gallery'` no destino.
- Nenhuma alteração no código do site nem no banco atual.
