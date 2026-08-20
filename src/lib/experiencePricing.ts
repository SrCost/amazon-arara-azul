/**
 * Descontos fixos por tamanho de grupo nas experiências avulsas.
 * 1 pessoa: 0% | 2: 20% | 3: 30% | 4: 40% | 5: 50%
 */
export const EXPERIENCE_GROUP_DISCOUNTS: Record<number, number> = {
  1: 0,
  2: 0.2,
  3: 0.3,
  4: 0.4,
  5: 0.5,
};

export const MAX_EXPERIENCE_GROUP_SIZE = 5;

/**
 * Retorna o desconto aplicável (0 a 1) para o tamanho de grupo informado.
 * Grupos maiores que 5 mantêm o desconto máximo da tabela.
 */
export const getExperienceDiscount = (groupSize: number): number => {
  if (!Number.isFinite(groupSize) || groupSize < 1) return 0;
  const size = Math.floor(groupSize);
  if (size >= MAX_EXPERIENCE_GROUP_SIZE) {
    return EXPERIENCE_GROUP_DISCOUNTS[MAX_EXPERIENCE_GROUP_SIZE];
  }
  return EXPERIENCE_GROUP_DISCOUNTS[size] ?? 0;
};

/**
 * Valor total da experiência: preço base por pessoa x nº de pessoas x (1 - desconto).
 */
export const calculateExperiencePrice = (
  basePrice: number,
  groupSize: number
): number => {
  if (!Number.isFinite(basePrice) || basePrice <= 0) return 0;
  const size = Math.max(1, Math.floor(groupSize || 1));
  const total = basePrice * size * (1 - getExperienceDiscount(size));
  return Math.round(total * 100) / 100;
};

/**
 * Valor por pessoa já com o desconto de grupo aplicado.
 */
export const calculateExperiencePricePerPerson = (
  basePrice: number,
  groupSize: number
): number => {
  const size = Math.max(1, Math.floor(groupSize || 1));
  return Math.round((calculateExperiencePrice(basePrice, size) / size) * 100) / 100;
};

export const formatBRL = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export interface ExperiencePriceRow {
  people: number;
  discount: number;
  total: number;
  perPerson: number;
}

/**
 * Tabela de referência de 1 a 5 pessoas, derivada apenas do preço base.
 */
export const buildExperiencePriceTable = (
  basePrice: number
): ExperiencePriceRow[] =>
  Array.from({ length: MAX_EXPERIENCE_GROUP_SIZE }, (_, i) => {
    const people = i + 1;
    return {
      people,
      discount: getExperienceDiscount(people),
      total: calculateExperiencePrice(basePrice, people),
      perPerson: calculateExperiencePricePerPerson(basePrice, people),
    };
  });
