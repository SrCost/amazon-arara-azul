

# Corrigir Permissoes de Admin no Calendario de Reservas

## Problema Identificado

A tabela `user_roles` possui apenas politicas RLS que permitem SELECT para `super_admin`. Quando um usuario com role `admin` faz login, o `AuthContext` consulta diretamente a tabela `user_roles` para verificar o papel do usuario, mas a politica RLS bloqueia a leitura -- retornando resultado vazio. Isso faz com que `isAdmin = false`, escondendo todos os botoes de edicao ("Nova Reserva", "Bloquear Datas", "Modo arrastar") e impedindo cliques nas celulas do calendario.

## Usuarios Afetados

- **laracabral@pousadararazul.com** (role: admin)
- **teste2@gmail.com** (role: admin)

Os usuarios `super_admin` nao sao afetados porque a politica existente ja permite SELECT para eles.

## Solucao

Adicionar uma politica RLS na tabela `user_roles` que permita cada usuario autenticado ver **seus proprios** registros de role.

## Detalhes Tecnicos

### Migracao SQL

```sql
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

Esta politica e simples e segura:
- Cada usuario so ve seus proprios roles (filtro por `user_id`)
- Nao expoe roles de outros usuarios
- Aplica-se apenas a usuarios autenticados (`TO authenticated`)
- Nenhuma alteracao de codigo e necessaria -- o `AuthContext` ja faz a query correta, so precisa que o RLS permita a leitura

### Nenhuma alteracao de codigo

O fluxo existente no `AuthContext.checkUserRole()` ja funciona corretamente:
1. Consulta `user_roles` filtrando por `user_id`
2. Extrai os roles retornados
3. Define `isAdmin` e `isSuperAdmin` conforme encontrado

O unico problema e que a query retorna vazio para admins por causa do RLS. Com a nova politica, a query retornara o role correto e tudo funcionara automaticamente.
