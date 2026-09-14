# 09 — Arquivos e imagens (armazenamento)

O projeto guarda hoje **66 arquivos (~161 MB)** em um único depósito público chamado `gallery`.
São as fotos dos bangalôs, das experiências e do carrossel da página inicial.

Os caminhos dos arquivos estão gravados na coluna `storage_path` da tabela `gallery_images`
e também nos endereços salvos em `hero_slides`. **Por isso os caminhos precisam ser
idênticos no novo projeto** — senão as imagens do site aparecem quebradas.

## Passo 1 — criar o depósito no novo projeto

No painel do novo Supabase: **Storage → New bucket**

- Nome: `gallery`
- Público: **sim**
- Sem limite de tamanho e sem restrição de tipo de arquivo (igual ao atual)

## Passo 2 — recriar as regras de acesso do depósito

Rode no SQL Editor do novo projeto (depois do arquivo `04-funcoes.sql`, pois usa `has_role`):

```sql
CREATE POLICY "Public can view gallery images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Admins can delete gallery images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery'
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );
```

## Passo 3 — copiar os arquivos

Quem é quem:

- **Projeto atual (origem)** = o banco que o site usa hoje, gerenciado pelo Lovable.
- **Projeto novo (destino)** = o projeto do Supabase que você acabou de criar.

### Opção B (recomendada) — a cópia é feita pelo Lovable

Você não instala nem roda nada. Basta informar, num formulário seguro, o endereço
(`https://xxxxxxxx.supabase.co`) e a chave secreta *service role* do **projeto novo**
(painel do projeto novo: Project Settings → API → "service_role" → "Reveal").
O Lovable lê os arquivos da origem e grava no destino com os mesmos caminhos,
mostrando no final quantos foram copiados.

> Atenção: o endereço e a chave precisam ser do **mesmo** projeto. Se o endereço for de
> um projeto e a chave de outro, a gravação falha com "Invalid API key".

### Opção A — rodar no seu computador

1. Instale o Node.js em <https://nodejs.org> (botão LTS, instalação padrão).
2. Copie o arquivo `transferir-arquivos.mjs` para uma pasta nova, por exemplo
   `C:\migracao` (Windows) ou `~/migracao` (Mac).
3. Abra o terminal **nessa pasta**: no Windows, Shift + botão direito dentro da pasta →
   "Abrir no Terminal"; no Mac, abra o Terminal e digite `cd ~/migracao`.
4. Preencha no topo do arquivo o endereço e a chave secreta (service role) do projeto
   atual e do projeto novo.
5. Rode os dois comandos:

```bash
npm i @supabase/supabase-js
node transferir-arquivos.mjs
```

O script mostra um resumo no final (copiados / já existentes / erros) e pode ser
executado novamente sem duplicar nada.

### Limite de tamanho de arquivo

O vídeo do carrossel (`hero/desktop_1781455693704_lv_0_20260611183341.mp4`) tem ~100 MB.
Se o projeto novo estiver com o limite de upload em 50 MB (padrão do plano gratuito), a
cópia dele falha com "The object exceeded the maximum allowed size". Ajuste em
**Storage → Settings → Upload file size limit** no projeto novo (é preciso plano Pro para
passar de 50 MB) e rode a cópia novamente — os arquivos já copiados são ignorados.

## Passo 4 — conferir

1. No painel do novo projeto: **Storage → gallery** deve listar 66 arquivos.
2. No SQL Editor, confirme que todo registro da galeria tem arquivo correspondente:

```sql
SELECT count(*) AS registros_galeria FROM public.gallery_images;   -- esperado: 33
SELECT count(*) AS arquivos FROM storage.objects WHERE bucket_id = 'gallery';  -- esperado: 66
```

3. Abra o site apontando para o novo projeto e verifique a página inicial, `/bangalos`
   e `/experiencias`.

> Observação: existem mais arquivos no depósito do que registros na galeria porque
> algumas imagens são usadas diretamente pelo carrossel e por versões antigas. Copie
> tudo — o script já faz isso.

## Arquivos que **não** estão no armazenamento

As imagens de layout e os PDFs (guia de pré-check-in, políticas) fazem parte do
código do site (`src/assets` e `public/docs`) e vão junto com o deploy — não precisam
de migração.
