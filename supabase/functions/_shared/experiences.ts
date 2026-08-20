/**
 * Experiências avulsas contratadas junto da hospedagem.
 * O total é sempre recalculado no servidor com o preço base do banco.
 */

const GROUP_DISCOUNTS: Record<number, number> = { 1: 0, 2: 0.2, 3: 0.3, 4: 0.4, 5: 0.5 };
const MAX_GROUP = 5;

export interface ReservationExperience {
  experience_id: string;
  experience_name: string;
  participants: number;
  base_price_per_person: number;
  total_price: number;
}

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** IDs de experiências enviados pelo cliente, sanitizados. */
export function parseExperienceIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(isUuid))].slice(0, 20);
}

export function getExperienceDiscount(groupSize: number): number {
  if (!Number.isFinite(groupSize) || groupSize < 1) return 0;
  const size = Math.floor(groupSize);
  return size >= MAX_GROUP ? GROUP_DISCOUNTS[MAX_GROUP] : GROUP_DISCOUNTS[size] ?? 0;
}

export function calculateExperiencePrice(basePrice: number, groupSize: number): number {
  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;
  const size = Math.max(1, Math.floor(groupSize || 1));
  return Math.round(basePrice * size * (1 - getExperienceDiscount(size)) * 100) / 100;
}

/**
 * Busca as experiências ativas no banco e calcula o valor de cada uma
 * usando o número de hóspedes da reserva.
 */
export async function buildReservationExperiences(
  supabase: any,
  experienceIds: string[],
  participants: number
): Promise<{ items: ReservationExperience[]; total: number }> {
  if (experienceIds.length === 0) return { items: [], total: 0 };

  const people = Math.max(1, Math.floor(participants || 1));

  const { data, error } = await supabase
    .from("experiences")
    .select("id, name_pt, base_price_per_person, is_active")
    .in("id", experienceIds)
    .eq("is_active", true);

  if (error) {
    console.error("Erro ao carregar experiências:", error);
    return { items: [], total: 0 };
  }

  const items: ReservationExperience[] = (data ?? []).map((row: any) => {
    const basePrice = Number(row.base_price_per_person) || 0;
    return {
      experience_id: row.id,
      experience_name: String(row.name_pt ?? "Experiência"),
      participants: people,
      base_price_per_person: basePrice,
      total_price: calculateExperiencePrice(basePrice, people),
    };
  });

  const total =
    Math.round(items.reduce((sum, item) => sum + item.total_price, 0) * 100) / 100;

  return { items, total };
}

/** Regrava as experiências da reserva (idempotente). */
export async function persistReservationExperiences(
  supabase: any,
  reservationId: string,
  items: ReservationExperience[]
): Promise<void> {
  await supabase.from("reservation_experiences").delete().eq("reservation_id", reservationId);

  if (items.length === 0) return;

  const { error } = await supabase.from("reservation_experiences").insert(
    items.map((item) => ({ reservation_id: reservationId, ...item }))
  );

  if (error) {
    console.error("Erro ao gravar reservation_experiences:", error);
  }
}
