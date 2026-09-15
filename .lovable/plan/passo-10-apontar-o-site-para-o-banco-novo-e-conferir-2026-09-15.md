# Passo 10 — Apontar o site para o banco novo e conferir

## O que preciso de você antes de virar

1. **Confirmar o projeto novo.** As imagens foram copiadas para o projeto de referência `srewrvfdwwemjrhsxlun`. Confirme que é esse o projeto onde você rodou os scripts SQL (01 a 09).
2. **Chave pública (anon / publishable) do projeto novo.** É a chave que o site usa no navegador. Está no painel do projeto novo em Project Settings → API → `anon` / `publishable`. Pode colar aqui: não é secreta.

Sem esses dois itens não é possível virar o site — eu não tenho acesso ao painel do projeto novo.

## Ponto importante sobre a virada

Hoje o site está ligado ao banco gerenciado pela Lovable, e o arquivo de configuração que guarda o endereço do banco é gerado automaticamente por ela — eu não posso reescrevê-lo à mão. Para o site passar a usar o banco externo é preciso **trocar a conexão do projeto**: desligar o banco gerenciado e conectar o Supabase externo. Isso é feito por você no painel da Lovable (Settings → Cloud/Supabase), porque envolve autorizar a sua conta Supabase. Eu te guio na tela, passo a passo, e faço todo o resto (ajustes de código e conferências).

Alternativa, se preferir não trocar a conexão agora: eu preparo a virada e a gente testa primeiro no ambiente de pré-visualização, sem mexer no site publicado.

## Sequência da virada

1. Conectar o Supabase externo (endereço, chave pública e identificador do projeto passam a ser os do projeto novo).
2. Recarregar o site e confirmar que ele já lê o banco novo.
3. Conferir se as chaves de integração (passo 7) e as funções publicadas (passo 8) estão no lugar — se faltar alguma, pagamento, e-mails e FNRH falham.

## Conferências que farei depois da virada

Baseline do banco atual: **14 reservas reais** (nenhuma de teste), 9 bangalôs, 15 experiências, 4 pacotes, 33 imagens da galeria, 4 usuários administrativos.

- Página inicial, `/bangalos` e `/experiencias` carregando textos e fotos.
- Login administrativo com um dos usuários (senha provisória `Arara@2026!Trocar`).
- `/admin/calendario-reservas`: as 14 reservas aparecendo nos bangalôs e nos meses corretos.
- `/admin/reservations`: mesma contagem, com documento, nascimento, nacionalidade e gênero visíveis.
- `/admin/fnrh` (fichas e hóspedes): status de pré-check-in correto por reserva.
- Formulário de pré-chegada abrindo por link válido.
- Console e rede sem erros de permissão.

Vou registrar o resultado item por item e apontar qualquer diferença em relação ao baseline.

## Se algo vier vazio

- Tabela vazia mas com dados no banco → falta permissão de acesso (passo 3 do guia) naquela tabela.
- Erro de login → usuários do passo 5 não criados, ou endereços de redirecionamento não configurados.
- Fotos sem aparecer → depósito `gallery` sem leitura pública.

Nesses casos eu identifico a causa e te digo exatamente qual arquivo do guia reexecutar.

## Pendências que continuam abertas

- Vídeo do carrossel (~100 MB) ainda não copiado: o limite de envio do projeto novo é de 50 MB. Enquanto isso, o carrossel usa as imagens.
- O painel de credenciais FNRH do projeto novo começa vazio — precisa ser preenchido em `/admin/fnrh` depois da virada.
