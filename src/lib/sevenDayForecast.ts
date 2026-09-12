// Builds the 7-day daily cards + expandable hourly breakdowns from a *trimmed*
// hourly axis (already sliced to begin at the current hour, see madridTime.ts).
// Day boundaries are located by the date prefix of each hourly timestamp, so a
// partial first day (current hour -> 23:00) keeps the rest of the days aligned
// to midnight.

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const num = (value: any, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

export const buildSevenDayForecast = (
  omData: any,
  consensusTemp: number[],
  times: string[],
  precip: number[],
  wind: number[],
  codes: number[]
) => {
  const dailyRaw = omData.daily || {};
  const dailyDates = dailyRaw.time || [];
  return dailyDates.slice(0, 7).map((dateStr: string, idx: number) => {
    const dateObj = new Date(dateStr);
    const dayName = dayNames[dateObj.getDay()];
    const dayFormatted = `${dateObj.getDate()} de ${dateObj.toLocaleString('es-ES', { month: 'short' })}`;

    // Day boundaries within the trimmed (current-hour onwards) hourly axis
    const startH = times.findIndex((t) => t.slice(0, 10) === dateStr);
    let endH = times.findIndex((t) => t.slice(0, 10) > dateStr);
    if (endH === -1) endH = times.length;
    const dayTemps = startH === -1 ? [] : consensusTemp.slice(startH, endH).filter((v) => Number.isFinite(v));

    const maxTemp = dayTemps.length ? Math.max(...dayTemps) : num(dailyRaw.temperature_2m_max?.[idx], 25);
    const minTemp = dayTemps.length ? Math.min(...dayTemps) : num(dailyRaw.temperature_2m_min?.[idx], 15);
    const totalPrecip = startH === -1 ? 0 : Number(precip.slice(startH, endH).filter((v) => Number.isFinite(v)).reduce((acc: number, v: number) => acc + v, 0).toFixed(1));
    const precipProb = num(dailyRaw.precipitation_probability_max?.[idx], 0);
    const weatherCode = num(dailyRaw.weather_code?.[idx], 0);

    const hourlyDetail = startH === -1 ? [] : times.slice(startH, endH).map((t: string, hIndex: number) => ({
      time: t.slice(11, 16),
      temp: num(consensusTemp[startH + hIndex], 20),
      precip: num(precip[startH + hIndex], 0),
      wind: num(wind[startH + hIndex], 10),
      code: num(codes[startH + hIndex], weatherCode),
    }));

    return {
      date: dateStr,
      dayName,
      dayFormatted,
      isToday: idx === 0,
      tempMax: maxTemp,
      tempMin: minTemp,
      precipitationSum: totalPrecip,
      precipitationProbability: precipProb,
      windSpeedMax: num(dailyRaw.wind_speed_10m_max?.[idx], 18),
      weatherCode,
      hourly: hourlyDetail,
    };
  });
};