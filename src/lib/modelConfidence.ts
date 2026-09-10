// Model confidence / convergence factor. Measures how much the forecast models
// (AIFS, AIGFS, WeatherNext 2, AROME) agree hour by hour: the smaller the
// temperature spread and the more they agree on rain, the higher the confidence.
// Returns a 0-100 score and a label, so the forecast can be read as "highly
// likely" (~100) vs "very uncertain" (~0).

export interface ModelSeriesLike {
  temperature: number[];
  precipitation: number[];
}

export interface ConfidenceRange {
  score: number | null;
  models: number;
}

export interface ConfidenceDay {
  score: number | null;
  models: number;
}

export interface ModelConfidence {
  overall: number | null;
  short: ConfidenceRange;
  mid: ConfidenceRange;
  long: ConfidenceRange;
  daily: ConfidenceDay[];
  avgSpread24h: number | null;
  label: string;
  forecastHours: number;
}

const HOURS = 168;
const WET_MM_PER_HOUR = 0.1;
const TEMP_SPREAD_PER_POINT = 12;
const TEMP_WEIGHT = 0.6;
const PRECIP_WEIGHT = 0.4;

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const hourTemperatureSpread = (models: readonly ModelSeriesLike[], idx: number): number | null => {
  const temps = models.map((m) => m.temperature[idx]).filter(isFiniteNumber);
  if (temps.length < 2) return null;
  return Math.max(...temps) - Math.min(...temps);
};

const hourModelsCount = (models: readonly ModelSeriesLike[], idx: number): number =>
  models.filter((m) => isFiniteNumber(m.temperature[idx])).length;

// Score (0-100) for a single hour: 60% temperature agreement + 40% rain agreement.
const hourScore = (models: readonly ModelSeriesLike[], idx: number): number | null => {
  const spread = hourTemperatureSpread(models, idx);
  if (spread === null) return null;

  const tempScore = clamp(Math.round(100 - spread * TEMP_SPREAD_PER_POINT), 10, 100);

  const precips = models.map((m) => m.precipitation[idx]).filter(isFiniteNumber);
  let precipScore = 100;
  if (precips.length >= 2) {
    // Agreement is maximal when all models say "wet" or all say "dry".
    const wet = precips.filter((p) => p > WET_MM_PER_HOUR).length;
    const wetFraction = wet / precips.length;
    const agreement = Math.max(wetFraction, 1 - wetFraction);
    precipScore = Math.round((agreement - 0.5) * 200);
  }

  return Math.round(tempScore * TEMP_WEIGHT + precipScore * PRECIP_WEIGHT);
};

const rangeScore = (models: readonly ModelSeriesLike[], from: number, to: number): ConfidenceRange => {
  const scores: number[] = [];
  let maxModels = 0;
  for (let idx = from; idx < to && idx < HOURS; idx++) {
    const score = hourScore(models, idx);
    if (score !== null) {
      scores.push(score);
      maxModels = Math.max(maxModels, hourModelsCount(models, idx));
    }
  }
  return {
    score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    models: maxModels,
  };
};

const averageSpreadNext24h = (models: readonly ModelSeriesLike[]): number | null => {
  const spreads: number[] = [];
  for (let idx = 0; idx < 24; idx++) {
    const spread = hourTemperatureSpread(models, idx);
    if (spread !== null) spreads.push(spread);
  }
  if (!spreads.length) return null;
  return Number((spreads.reduce((a, b) => a + b, 0) / spreads.length).toFixed(1));
};

export const confidenceLabel = (score: number | null): string => {
  if (score === null) return 'Sin datos';
  if (score >= 85) return 'Muy alta';
  if (score >= 70) return 'Alta';
  if (score >= 50) return 'Moderada';
  if (score >= 30) return 'Baja';
  return 'Muy baja';
};

export const computeModelConfidence = (models: readonly ModelSeriesLike[]): ModelConfidence => {
  const short = rangeScore(models, 0, 24);
  const mid = rangeScore(models, 24, 48);
  const long = rangeScore(models, 48, HOURS);

  const overallScores: number[] = [];
  for (let idx = 0; idx < HOURS; idx++) {
    const score = hourScore(models, idx);
    if (score !== null) overallScores.push(score);
  }
  const overall = overallScores.length
    ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
    : null;

  const daily: ConfidenceDay[] = [];
  for (let day = 0; day < 7; day++) {
    const dayRange = rangeScore(models, day * 24, (day + 1) * 24);
    daily.push({ score: dayRange.score, models: dayRange.models });
  }

  return {
    overall,
    short,
    mid,
    long,
    daily,
    avgSpread24h: averageSpreadNext24h(models),
    label: confidenceLabel(overall),
    forecastHours: HOURS,
  };
};