# Esclarecer e facilitar o Passo 3 (transferência das imagens)

O usuário não sabe **onde** rodar o script `transferir-arquivos.mjs` nem qual é o "projeto atual". Ajustar `docs/migracao-supabase/09-arquivos-e-imagens.md` para explicar de forma acessível a não programadores:

## Esclarecimentos a incluir no arquivo 09

1. **Onde executar:** no computador do próprio usuário (Windows/Mac), não no painel do Supabase nem no site. Passo a passo:
   - Instalar o Node.js (link nodejs.org, botão LTS, instalar com padrões).
   - Baixar a pasta `docs/migracao-supabase/` do repositório do site (ou copiar o arquivo `transferir-arquivos.mjs` para uma pasta nova no computador, ex.: `C:\migracao` ou `~/migracao`).
   - Abrir o Terminal/Prompt de Comando nessa pasta (Windows: Shift + botão direito → "Abrir no Terminal"; Mac: Terminal + `cd` até a pasta).
   - Rodar `npm i @supabase/supabase-js` uma vez, depois `node transferir-arquivos.mjs`.
2. **Quem é "projeto atual" vs "projeto novo":**
   - **Projeto atual (origem)** = o banco de dados que o site usa hoje (o gerenciado pelo Lovable). A service role dele é obtida via comando do Lovable (`lovable supabase ...`) ou, se indisponível, explicar como obter. Endereço: o mesmo que aparece nas configurações do site.
   - **Projeto novo (destino)** = o projeto externo que ele está configurando agora; endereço e service role aparecem no painel do novo projeto (Project Settings → API → service_role, botão "Reveal").
3. **Pré-requisito:** o bucket `gallery` (Passo 1) e as regras de acesso (Passo 2) precisam já existir no projeto novo antes de rodar o script.
4. **Resultado esperado:** resumo final "Copiados / Já existiam / Erros" com 66 arquivos; rodar de novo é seguro (não duplica).

## Alternativa a oferecer no plano

- Opção B: eu mesmo executar a transferência por aqui (tenho acesso ao projeto atual), bastando o usuário fornecer o endereço e a service role do projeto novo — sensível, pois ele colaria uma chave secreta no chat; o arquivo 09 permanece como caminho principal e autônomo.

## Detalhes técnicos

- Único arquivo alterado: `docs/migracao-supabase/09-arquivos-e-imagens.md` (reescrever o Passo 3 com instruções passo a passo em linguagem simples).
- Nenhum código do site ou banco é alterado.
