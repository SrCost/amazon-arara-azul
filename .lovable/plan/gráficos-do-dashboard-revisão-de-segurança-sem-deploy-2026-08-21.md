# Gráficos do dashboard + revisão de segurança (sem deploy)

## Parte 1 — Receita "zerada" nos meses anteriores

O que os dados mostram (consultado agora no banco):

- Reservas agrupadas por **data de check-in**: Jan/26 R$ 9.440 · Fev/26 R$ 7.956 · Mar–Jun/26 **nenhuma reserva** · Jul/26 R$ 37.630,88 (4) · Ago/26 R$ 36.484,96 (4).
- As mesmas reservas agrupadas por **data em que foram criadas** (quando entrou a venda): Jan R$ 15.990 (2) · Fev R$ 7.956 (3) · Mai R$ 10.590 (1) · Jun R$ 11.382 (1) · Jul R$ 52.143,84 (6).

Ou seja: houve movimentação financeira em Mai e Jun, mas o gráfico atual soma pela data de hospedagem (check-in), e essas vendas de Mai/Jun têm check-in em Jul/Ago. Por isso Mar–Jun aparecem em zero.

Correção proposta em `src/hooks/useDashboardStats.ts` + `src/pages/admin/Dashboard.tsx`:

- Adicionar um seletor (dois botões) acima dos gráficos: **"Por venda (data da reserva)"** e **"Por estadia (check-in)"**, com **"Por venda" como padrão** — é a visão de movimentação financeira.
- Manter a janela de 6 meses já corrigida, a ordenação por `yyyy-MM` e os rótulos com ano (Mar/26 … Ago/26).
- Manter o filtro `is_test = false` e excluir `cancelled` da receita (hoje a reserva cancelada de Fev de R$ 6.550 já não entra — vai continuar fora).
- Nenhuma alteração de dados no banco.

## Parte 2 — Dependências (nada será atualizado sem seu OK)

Versões instaladas conferidas e comparadas com o último release da mesma linha major:

| Pacote | Instalado | Última na mesma major | Ação |
| --- | --- | --- | --- |
| jspdf | 3.0.4 | 3.0.4 | já na mais recente da 3.x — nada a fazer |
| lodash | 4.17.21 | 4.17.21 | última versão publicada — nada a fazer |
| ws | 8.18.3 | 8.18.3 | última da 8.x — nada a fazer |
| dompurify | 3.3.1 | 3.3.1 | última da 3.x — nada a fazer |
| @remix-run/router | 1.23.0 | 1.23.0 | preso à linha do react-router 6 — nada a fazer |
| react-router / react-router-dom | 6.30.1 | 6.30.1 | correção só existe na 7.x — **PARADO, aguardando sua decisão** |

Sobre o react-router 7 (não vou aplicar): mudaria o pacote principal (`react-router-dom` passa a reexportar `react-router`), exige revisão de todas as rotas do app (público + `/admin`, rotas protegidas, `useNavigate`/`Navigate`, lazy routes) e é o risco mais alto de quebrar produção. Se quiser, faço isso em um passo separado e isolado.

Conclusão: **nenhum bump de dependência entra neste plano.** Assim não há como um upgrade quebrar build/lint.

## Parte 3 — Segredo "exposto"

Verifiquei o código-fonte inteiro (fora `node_modules`): **não existe JWT hardcoded em nenhum arquivo `.ts`/`.tsx`**. O único JWT do projeto está em `.env` como `VITE_SUPABASE_PUBLISHABLE_KEY` — é a chave **publicável/anon**, projetada para ir no bundle do navegador; a proteção dos dados é feita por RLS. Não é uma credencial secreta e não deve ser removida nem trocada por variável de servidor (o app quebra sem ela).

Ação: nenhuma alteração de código. Não há segredo real a rotacionar por esse achado. As credenciais realmente sensíveis (FNRH, Mercado Pago access token, Resend) já vivem apenas como secrets usados em Edge Functions — confirmado.

## Parte 4 — Findings do Semgrep

- **Random insegura**: o único `Math.random()` do projeto está em `src/components/ui/sidebar.tsx` (largura aleatória do skeleton de carregamento) — uso puramente visual, não sensível. Pelas suas regras, **não alterar**. Todos os tokens e chaves de idempotência das Edge Functions já usam `crypto.randomUUID()`.
- **Tags sem `integrity`** em `index.html`: adicionar `crossorigin="anonymous"` onde faltar nos recursos externos. Observação importante: Google Fonts e o script do Google Tag Manager são servidos com conteúdo dinâmico/variável, então `integrity` fixo **quebraria** o carregamento. Vou aplicar `integrity` apenas se houver recurso de CDN com versão fixa; caso contrário, documento o motivo de não aplicar em vez de arriscar quebrar fontes e analytics.
- **Format string**: nenhum padrão com risco real de injeção encontrado — nenhuma alteração.

## Parte 5 — Verificação

Depois das mudanças: rodar build e lint (o projeto não tem suíte de testes configurada — `package.json` só tem `dev`, `build`, `lint`, `preview`). Se algo falhar, reverto a mudança específica e aviso qual arquivo causou.

Nada será publicado: sem deploy, sem merge. As alterações ficam no preview para sua revisão.

## Resumo do que será alterado

- `src/hooks/useDashboardStats.ts` — agrupamento por data de venda ou check-in.
- `src/pages/admin/Dashboard.tsx` — seletor de base dos gráficos.
- `index.html` — ajustes de `crossorigin`/`integrity` onde for seguro.
- Nenhuma dependência, nenhuma migração de banco, nenhum arquivo de credencial tocado.
