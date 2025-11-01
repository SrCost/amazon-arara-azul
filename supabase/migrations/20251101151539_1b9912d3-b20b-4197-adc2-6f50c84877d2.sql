-- Permitir que reservas sejam criadas sem user_id (para clientes não logados)
ALTER TABLE reservations ALTER COLUMN user_id DROP NOT NULL;

-- Inserir acomodações (rooms) primeiro para cálculo de taxa de ocupação
INSERT INTO rooms (id, name_pt, name_en, name_es, name_fr, description_pt, description_en, description_es, description_fr, max_guests, price_per_night, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Chalé Floresta', 'Forest Cabin', 'Cabaña del Bosque', 'Chalet Forêt', 'Chalé aconchegante em meio à floresta amazônica', 'Cozy cabin in the Amazon rainforest', 'Cabaña acogedora en la selva amazónica', 'Chalet confortable dans la forêt amazonienne', 4, 500.00, true),
('22222222-2222-2222-2222-222222222222', 'Bangalô Rio', 'River Bungalow', 'Bungaló del Río', 'Bungalow Rivière', 'Bangalô com vista privilegiada para o rio', 'Bungalow with privileged river view', 'Bungaló con vista privilegiada al río', 'Bungalow avec vue privilégiée sur la rivière', 3, 600.00, true),
('33333333-3333-3333-3333-333333333333', 'Suite Arara', 'Macaw Suite', 'Suite Guacamayo', 'Suite Ara', 'Suite luxuosa com decoração temática', 'Luxury suite with thematic decoration', 'Suite de lujo con decoración temática', 'Suite de luxe avec décoration thématique', 2, 700.00, true),
('44444444-4444-4444-4444-444444444444', 'Quarto Palmeira', 'Palm Room', 'Habitación Palmera', 'Chambre Palmier', 'Quarto confortável com varanda', 'Comfortable room with balcony', 'Habitación cómoda con balcón', 'Chambre confortable avec balcon', 2, 450.00, true),
('55555555-5555-5555-5555-555555555555', 'Chalé Vitória Régia', 'Water Lily Cabin', 'Cabaña Victoria Regia', 'Chalet Nénuphar', 'Chalé especial próximo ao lago', 'Special cabin near the lake', 'Cabaña especial cerca del lago', 'Chalet spécial près du lac', 4, 550.00, true);

-- Inserir dados fictícios de reservas para testes (usando payment_status corretos: pending, paid, refunded)
INSERT INTO reservations (room_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_price, status, payment_status, payment_method, special_requests, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'João Silva', 'joao@email.com', '+55 11 98765-4321', '2025-11-15', '2025-11-20', 2, 2500.00, 'confirmed', 'paid', 'credit_card', 'Quarto com vista para o rio', NOW() - INTERVAL '5 days'),
('22222222-2222-2222-2222-222222222222', 'Maria Santos', 'maria@email.com', '+55 11 98765-1234', '2025-11-18', '2025-11-22', 3, 3200.00, 'confirmed', 'pending', 'pix', 'Chegada após às 18h', NOW() - INTERVAL '3 days'),
('33333333-3333-3333-3333-333333333333', 'Pedro Costa', 'pedro@email.com', '+55 11 98765-5678', '2025-11-20', '2025-11-25', 2, 2800.00, 'pending', 'pending', 'bank_transfer', NULL, NOW() - INTERVAL '2 days'),
('44444444-4444-4444-4444-444444444444', 'Ana Oliveira', 'ana@email.com', '+55 11 98765-9999', '2025-11-10', '2025-11-14', 4, 3600.00, 'confirmed', 'paid', 'credit_card', 'Preciso de berço para bebê', NOW() - INTERVAL '10 days'),
('55555555-5555-5555-5555-555555555555', 'Carlos Ferreira', 'carlos@email.com', '+55 11 98765-0000', '2025-11-25', '2025-11-30', 2, 2900.00, 'confirmed', 'pending', 'pix', NULL, NOW() - INTERVAL '1 day');

-- Inserir pagamentos correspondentes às reservas
INSERT INTO payments (reservation_id, amount, payment_method, status, payment_date)
SELECT id, total_price, payment_method, 
  CASE 
    WHEN payment_status = 'paid' THEN 'completed'
    ELSE 'pending'
  END as status,
  created_at
FROM reservations WHERE guest_email IN ('joao@email.com', 'maria@email.com', 'pedro@email.com', 'ana@email.com', 'carlos@email.com');

-- Inserir mensagens de contato para testes
INSERT INTO contact_messages (name, email, phone, message, status, created_at) VALUES
('Beatriz Lima', 'beatriz@email.com', '+55 11 99999-1111', 'Gostaria de saber mais sobre as atividades disponíveis na pousada.', 'new', NOW() - INTERVAL '2 hours'),
('Ricardo Mendes', 'ricardo@email.com', '+55 11 99999-2222', 'Vocês aceitam pets? Tenho um cachorro pequeno.', 'new', NOW() - INTERVAL '5 hours'),
('Fernanda Alves', 'fernanda@email.com', '+55 11 99999-3333', 'Qual é a política de cancelamento?', 'read', NOW() - INTERVAL '1 day'),
('Gustavo Souza', 'gustavo@email.com', NULL, 'Há transfer do aeroporto disponível?', 'replied', NOW() - INTERVAL '3 days');