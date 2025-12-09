/**
 * Tabela de preços dinâmicos por quantidade de hóspedes
 * Diária com pensão completa + transfer incluso
 */
export const PRICING_TABLE: Record<number, number> = {
  1: 1500.00,
  2: 2394.00,
  3: 3112.20,
  4: 4045.86,
};

/**
 * Obtém o valor da diária baseado na quantidade de hóspedes
 */
export const getDailyRate = (guests: number): number => {
  return PRICING_TABLE[guests] || PRICING_TABLE[2]; // Default: 2 pessoas
};

/**
 * Formata o preço da diária para exibição
 */
export const formatDailyRate = (guests: number): string => {
  const rate = getDailyRate(guests);
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
  packagePrice?: number
): number => {
  // Se tem pacote com preço definido, retorna preço do pacote
  if (packagePrice && packagePrice > 0) {
    return packagePrice;
  }
  
  // Cálculo dinâmico: diária por hóspedes × noites
  const nights = calculateNights(checkIn, checkOut);
  const dailyRate = getDailyRate(guests);
  return dailyRate * nights;
};

/**
 * Retorna o preço mínimo (1 pessoa) para exibição
 */
export const getMinimumPrice = (): number => {
  return PRICING_TABLE[1];
};

/**
 * Retorna o preço mínimo formatado
 */
export const getMinimumPriceFormatted = (): string => {
  return getMinimumPrice().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
