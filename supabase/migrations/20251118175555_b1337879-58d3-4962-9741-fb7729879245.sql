-- Update RLS policies to ensure proper access for all user roles

-- Ensure user role can read reservations and messages
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reservations' 
    AND policyname = 'Users can view assigned reservations'
  ) THEN
    CREATE POLICY "Users can view assigned reservations"
      ON public.reservations
      FOR SELECT
      TO authenticated
      USING (
        has_role(auth.uid(), 'user'::app_role) OR
        has_role(auth.uid(), 'admin'::app_role) OR
        has_role(auth.uid(), 'super_admin'::app_role)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'contact_messages' 
    AND policyname = 'Users can view messages'
  ) THEN
    CREATE POLICY "Users can view messages"
      ON public.contact_messages
      FOR SELECT
      TO authenticated
      USING (
        has_role(auth.uid(), 'user'::app_role) OR
        has_role(auth.uid(), 'admin'::app_role) OR
        has_role(auth.uid(), 'super_admin'::app_role)
      );
  END IF;
END $$;

-- Add comments for clarity
COMMENT ON POLICY "Users can view assigned reservations" ON public.reservations IS 'Allows users, admins, and super_admins to view reservations';
COMMENT ON POLICY "Users can view messages" ON public.contact_messages IS 'Allows users, admins, and super_admins to view contact messages';