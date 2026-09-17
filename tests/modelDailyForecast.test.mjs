import test from 'node:test';
import assert from 'node:assert/strict';
import { buildModelDailyForecast } from '../src/lib/modelDailyForecast.ts';

const HOURS = 48;
const times = Array.from({ length: HOURS }, (_, h) => {
  const day = h < 24 ? '10' : '11';
  return `2026-09-${day}T${String(h % 24).padStart(2, '0')}:00`;
});

const hourly = (temp, code = 1) => ({
  temperature: Array.from({ length: HOURS }, (_, h) => temp + (h % 24) * 0.5),
  precipitation: Array.from({ length: HOURS }, () => 0),
  precipitation_probability: [],
  wind_speed: Array.from({ length: HOURS }, () => 10),
  wind_direction: Array.from({ length: HOURS }, () => 180),
  weather_code: Array.from({ length: HOURS }, () => code),
});

test('groups hourly series into daily cards with min/max', () => {
  const days = buildModelDailyForecast(times, hourly(10));
  assert.equal(days.length, 2);
  assert.equal(days[0].isToday, true);
  assert.equal(days[1].isToday, false);
  // 10..10+23*0.5 = 10..21.5
  assert.equal(days[0].tempMin, 10);
  assert.equal(days[0].tempMax, 21.5);
  assert.equal(days[0].hasData, true);
  assert.equal(days[0].hourly.length, 24);
  assert.equal(days[0].hourly[0].time, '00:00');
  assert.equal(days[0].weatherCode, 1);
});

test('days without any model hours are flagged without data', () => {
  // Short-horizon model (e.g. AROME): only the first 24 hours present
  const short = { ...hourly(10), temperature: hourly(10).temperature.slice(0, 24) };
  const days = buildModelDailyForecast(times, short);
  assert.equal(days.length, 2);
  assert.equal(days[0].hasData, true);
  assert.equal(days[1].hasData, false);
  assert.equal(days[1].tempMax, null);
  assert.equal(days[1].tempMin, null);
  assert.equal(days[1].hourly.length, 0);
});

test('empty or missing series yield no usable days', () => {
  assert.deepEqual(buildModelDailyForecast([], hourly(10)), []);
  assert.deepEqual(buildModelDailyForecast(times, undefined), []);
  const days = buildModelDailyForecast(times, { ...hourly(10), temperature: [] });
  assert.equal(days.length, 2);
  assert.ok(days.every((d) => d.hasData === false));
});

test('dominant weather code wins the day', () => {
  const h = hourly(10);
  h.weather_code = [...Array(18).fill(3), ...Array(6).fill(61), ...Array(24).fill(3)];
  const days = buildModelDailyForecast(times, h);
  assert.equal(days[0].weatherCode, 3);
});
