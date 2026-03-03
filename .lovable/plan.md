

# Atualizar status da reserva ao concluir checkout

## Situação atual
A função `submit_checkout` no banco de dados marca `checkout_completed = true` e invalida o token, mas **não altera o campo `status`** da reserva. Ele permanece como estava (ex: "confirmed").

## Correção
Alterar a função `submit_checkout` via migration para incluir `status = 'finished'` no UPDATE da reserva, junto com `checkout_completed = true`.

### SQL da migration:
```sql
CREATE OR REPLACE FUNCTION public.submit_checkout(
  p_reservation_id uuid, p_rating integer, p_comment text, p_issues text, p_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO booking_checkouts (reservation_id, rating, comment, issues)
  VALUES (p_reservation_id, p_rating, p_comment, p_issues);

  UPDATE reservations 
  SET checkout_completed = true, 
      status = 'finished',
      updated_at = now()
  WHERE id = p_reservation_id;

  IF p_token IS NOT NULL THEN
    UPDATE booking_tokens SET used = true WHERE token = p_token;
  END IF;

  RETURN true;
END;
$$;
```

Nenhum arquivo de código frontend precisa ser alterado — a página `/checkout` já chama `supabase.rpc("submit_checkout", ...)` e a mudança é toda no banco.

