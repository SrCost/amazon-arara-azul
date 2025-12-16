-- Função que retorna disponibilidade de um quarto para todos (inclusive anônimos)
CREATE OR REPLACE FUNCTION get_room_availability(p_room_id UUID)
RETURNS TABLE (
  check_in DATE,
  check_out DATE,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT r.check_in, r.check_out, r.status
  FROM reservations r
  WHERE r.room_id = p_room_id
    AND r.status IN ('pending', 'confirmed')
    AND r.check_out >= CURRENT_DATE;
END;
$$;

-- Permitir execução para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION get_room_availability(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_room_availability(UUID) TO authenticated;