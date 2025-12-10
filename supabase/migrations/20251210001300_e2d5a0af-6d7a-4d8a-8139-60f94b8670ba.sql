-- Update max_guests to 4 for all active rooms
UPDATE rooms 
SET max_guests = 4 
WHERE is_active = true;