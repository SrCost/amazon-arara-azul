

# Correção: 404 na página `/checkin` no site publicado

## Diagnóstico

A rota `/checkin` **existe corretamente** no `App.tsx` (linha 62). O problema é que o site publicado precisa de um arquivo `_redirects` no diretório `public/` para que o servidor saiba redirecionar todas as rotas para `index.html` (comportamento SPA). Sem isso, acessar diretamente `/checkin?token=...` retorna 404 do servidor.

## Solução

Criar o arquivo `public/_redirects` com a regra de fallback SPA:

```
/*    /index.html   200
```

Isso garante que qualquer rota (incluindo `/checkin`, `/checkout`, etc.) seja servida pelo `index.html`, permitindo que o React Router resolva a navegação no cliente.

### Arquivo a criar
- `public/_redirects`

Após criar, o site precisa ser **republicado** para a correção entrar em vigor.

