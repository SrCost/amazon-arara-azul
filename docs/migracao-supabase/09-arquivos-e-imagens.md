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

Use o script `transferir-arquivos.mjs` desta mesma pasta. Ele lê cada arquivo do
projeto atual e grava no novo com o mesmo caminho.

```bash
npm i @supabase/supabase-js
node transferir-arquivos.mjs
```

Antes de rodar, preencha no topo do arquivo:

- endereço e chave secreta (service role) do **projeto atual**
- endereço e chave secreta (service role) do **projeto novo**

O script mostra um resumo no final (copiados / já existentes / erros) e pode ser
executado novamente sem duplicar nada.

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
