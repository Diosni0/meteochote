// Iberian (Europe/Madrid) time helpers. Open-Meteo is queried with
// timezone=Europe/Madrid and its hourly axis always starts at 00:00 of the
// current day, so we need the current hour label (in Madrid) to trim every
// hourly array so the forecast begins "now" (index 0 = "ahora").

export const formatMadridHour = (date: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:00`;
};

// Returns the index of the first hour `>=` the current hour in Madrid, so all
// hourly arrays can be sliced from there.
export const currentHourStartIndex = (times: string[], date: Date = new Date()): number => {
  if (!times.length) return 0;
  const nowLabel = formatMadridHour(date);
  const idx = times.findIndex((t) => t >= nowLabel);
  return idx === -1 ? 0 : idx;
};