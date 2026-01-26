/**
 * Централизованная логика расчета экономики IP
 */

const IP_PER_HOUR = 0.1;
const STORAGE_LIMIT = 10;

/**
 * Вычисляет текущее значение хранилища в реальном времени
 * @param baseStorage Значение storage из БД
 * @param lastIncomeAt Время последнего обновления из БД (TIMESTAMPTZ)
 * @param now Текущее время (для реактивности)
 * @returns Округленное значение до 2 знаков
 */
export const calculateLiveStorage = (
  baseStorage: number = 0, 
  lastIncomeAt: string | null,
  now: number = Date.now()
) => {
  if (!lastIncomeAt) return Math.min(STORAGE_LIMIT, baseStorage);

  const lastIncomeDate = new Date(lastIncomeAt).getTime();
  const diffInHours = (now - lastIncomeDate) / (1000 * 60 * 60);
  const earned = diffInHours * IP_PER_HOUR;
  
  const total = Math.min(STORAGE_LIMIT, baseStorage + earned);
  return Math.round(total * 100) / 100;
};
