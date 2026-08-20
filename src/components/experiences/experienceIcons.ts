import { Bird, Compass, Users, UtensilsCrossed, Leaf, type LucideIcon } from "lucide-react";

/**
 * Ícone da experiência derivado da categoria cadastrada (funciona também
 * para categorias novas criadas pelo admin, com fallback neutro).
 */
export const getExperienceIcon = (category: string): LucideIcon => {
  const value = (category || "").toLowerCase();
  if (/(rio|river|río|fleuve|fluss|wild|selvagem|faune|tier)/.test(value)) return Bird;
  if (/(cultura|culture|kultur|comunidad|comunidade|riverside|riveraine|gemeinde)/.test(value)) return Users;
  if (/(aventura|adventure|abenteuer|natureza|nature|natur)/.test(value)) return Compass;
  if (/(gastro|sabor|food|cozinha|cuisine)/.test(value)) return UtensilsCrossed;
  return Leaf;
};
