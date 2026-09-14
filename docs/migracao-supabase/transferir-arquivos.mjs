/**
 * Copia todos os arquivos do armazenamento (bucket "gallery") do projeto
 * atual para o novo projeto Supabase, preservando exatamente os mesmos
 * caminhos — para que os links já gravados no banco continuem válidos.
 *
 * Como usar:
 *   npm i @supabase/supabase-js
 *   node transferir-arquivos.mjs
 *
 * Pode ser executado mais de uma vez: arquivos já copiados são ignorados.
 */
import { createClient } from '@supabase/supabase-js';

// ----------------------- PREENCHA AQUI -----------------------
const ORIGEM_URL = 'https://<PROJETO-ATUAL>.supabase.co';
const ORIGEM_SERVICE_ROLE = '<SERVICE-ROLE-DO-PROJETO-ATUAL>';

const DESTINO_URL = 'https://<PROJETO-NOVO>.supabase.co';
const DESTINO_SERVICE_ROLE = '<SERVICE-ROLE-DO-PROJETO-NOVO>';

const BUCKET = 'gallery';
// -------------------------------------------------------------

const origem = createClient(ORIGEM_URL, ORIGEM_SERVICE_ROLE, { auth: { persistSession: false } });
const destino = createClient(DESTINO_URL, DESTINO_SERVICE_ROLE, { auth: { persistSession: false } });

/** Lista recursivamente todos os arquivos do bucket. */
async function listarTudo(prefixo = '') {
  const encontrados = [];
  let pagina = 0;
  const tamanhoPagina = 100;

  for (;;) {
    const { data, error } = await origem.storage.from(BUCKET).list(prefixo, {
      limit: tamanhoPagina,
      offset: pagina * tamanhoPagina,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`Falha ao listar "${prefixo}": ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id === null) {
        encontrados.push(...(await listarTudo(caminho))); // é uma "pasta"
      } else {
        encontrados.push({ caminho, tipo: item.metadata?.mimetype, tamanho: item.metadata?.size });
      }
    }

    if (data.length < tamanhoPagina) break;
    pagina += 1;
  }

  return encontrados;
}

const arquivos = await listarTudo();
console.log(`Encontrados ${arquivos.length} arquivos em "${BUCKET}".\n`);

let copiados = 0;
let existentes = 0;
const erros = [];

for (const arquivo of arquivos) {
  const { data: blob, error: erroDownload } = await origem.storage.from(BUCKET).download(arquivo.caminho);
  if (erroDownload || !blob) {
    erros.push(`${arquivo.caminho} (leitura: ${erroDownload?.message ?? 'sem conteúdo'})`);
    continue;
  }

  const conteudo = Buffer.from(await blob.arrayBuffer());
  const { error: erroUpload } = await destino.storage.from(BUCKET).upload(arquivo.caminho, conteudo, {
    contentType: arquivo.tipo || blob.type || 'application/octet-stream',
    upsert: false,
  });

  if (erroUpload) {
    if (/exists/i.test(erroUpload.message)) {
      existentes += 1;
      console.log(`= já existia   ${arquivo.caminho}`);
    } else {
      erros.push(`${arquivo.caminho} (gravação: ${erroUpload.message})`);
      console.log(`x erro        ${arquivo.caminho}`);
    }
    continue;
  }

  copiados += 1;
  console.log(`+ copiado     ${arquivo.caminho}`);
}

console.log('\n----------------------------------------');
console.log(`Copiados:      ${copiados}`);
console.log(`Já existiam:   ${existentes}`);
console.log(`Erros:         ${erros.length}`);
if (erros.length) {
  console.log('\nArquivos com erro:');
  for (const e of erros) console.log(' - ' + e);
  process.exitCode = 1;
}
