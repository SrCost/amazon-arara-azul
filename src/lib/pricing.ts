/**
 * Multiplicadores de preço por quantidade de hóspedes
 * Baseados na proporção relativa entre os valores originais
 */
export const GUEST_MULTIPLIERS: Record<number, number> = {
  1: 1.0,      // Base price
  2: 1.596,   // 2394 / 1500
  3: 2.0748,  // 3112.20 / 1500
  4: 2.6972,  // 4045.86 / 1500
};

/**
 * Preço base padrão (fallback quando não há preço do banco)
 */
export const DEFAULT_BASE_PRICE = 1500.00;

/**
 * Obtém o valor da diária baseado na quantidade de hóspedes
 * @param guests - Número de hóspedes
 * @param basePrice - Preço base do banco de dados (opcional)
 */
export const getDailyRate = (guests: number, basePrice?: number): number => {
  const base = basePrice || DEFAULT_BASE_PRICE;
  const multiplier = GUEST_MULTIPLIERS[guests] || GUEST_MULTIPLIERS[2];
  return base * multiplier;
};

/**
 * Formata o preço da diária para exibição
 */
export const formatDailyRate = (guests: number, basePrice?: number): string => {
  const rate = getDailyRate(guests, basePrice);
  return rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Calcula o número de noites entre duas datas
 */
export const calculateNights = (checkIn: Date, checkOut: Date): number => {
  return Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
};

/**
 * Calcula o total da reserva
 * Se pacote selecionado (com preço > 0), usa preço do pacote
 * Caso contrário, calcula dinamicamente: diária × noites
 */
export const calculateReservationTotal = (
  guests: number,
  checkIn: Date,
  checkOut: Date,
  packagePrice?: number,
  basePrice?: number
): number => {
  // Se tem pacote com preço definido, retorna preço do pacote
  if (packagePrice && packagePrice > 0) {
    return packagePrice;
  }
  
  // Cálculo dinâmico: diária por hóspedes × noites
  const nights = calculateNights(checkIn, checkOut);
  const dailyRate = getDailyRate(guests, basePrice);
  return dailyRate * nights;
};

/**
 * Retorna o preço mínimo (1 pessoa) para exibição
 */
export const getMinimumPrice = (basePrice?: number): number => {
  return basePrice || DEFAULT_BASE_PRICE;
};

/**
 * Retorna o preço mínimo formatado
 */
export const getMinimumPriceFormatted = (basePrice?: number): string => {
  return getMinimumPrice(basePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
