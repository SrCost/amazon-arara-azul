-- 05-gatilhos.sql : gatilhos automaticos
-- ATENCAO: rode este arquivo somente DEPOIS de carregar os dados (07 e 08).

CREATE TRIGGER update_blocked_dates_updated_at BEFORE UPDATE ON public.blocked_dates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_contact_messages AFTER UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_messages_delete AFTER DELETE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_messages_update AFTER UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_experiences AFTER INSERT OR DELETE OR UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_gallery_images AFTER INSERT OR DELETE OR UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_gallery_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_packages AFTER INSERT OR DELETE OR UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tg_sync_payment_to_reservation AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION sync_payment_to_reservation();
CREATE TRIGGER trg_audit_payments AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_payments_delete AFTER DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_payments_insert AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_payments_update AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_sync_payment_status AFTER UPDATE OF status ON public.payments FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION sync_payment_status_to_reservation();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pre_arrival_responses_updated_at BEFORE UPDATE ON public.pre_arrival_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_profiles AFTER DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_profiles_delete AFTER DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_profiles_update AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservation_experiences_updated_at BEFORE UPDATE ON public.reservation_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE CONSTRAINT TRIGGER trg_reservation_rooms_limit AFTER INSERT ON public.reservation_rooms DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_reservation_rooms_limit();
CREATE TRIGGER update_reservation_rooms_updated_at BEFORE UPDATE ON public.reservation_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_reservations AFTER INSERT OR DELETE OR UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_reservations_delete AFTER DELETE ON public.reservations FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_reservations_insert AFTER INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_reservations_update AFTER UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_auto_generate_reservation_token AFTER INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION auto_generate_reservation_token();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_module_permissions_updated_at BEFORE UPDATE ON public.user_module_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_audit_user_roles AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_user_roles_delete AFTER DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_user_roles_insert AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION log_audit_activity();
CREATE TRIGGER trg_audit_user_roles_update AFTER UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION log_audit_activity();

-- Gatilho de criacao de perfil ao cadastrar usuario (schema auth)
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
