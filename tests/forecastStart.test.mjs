import test from 'node:test';
import assert from 'node:assert/strict';
import { currentHourStartIndex } from '../src/lib/madridTime.ts';
import { buildSevenDayForecast } from '../src/lib/sevenDayForecast.ts';

// Simulate an Open-Meteo response: a 7-day hourly axis starting at 00:00 of
// "today" (Europe/Madrid), e.g. queried at 14:30 Madrid -> forecast begins 14:00.
const NOW = new Date('2026-01-15T13:30:00Z');

const rawTimes = [];
for (let day = 0; day < 7; day++) {
  for (let h = 0; h < 24; h++) {
    rawTimes.push(`2026-01-${String(15 + day).padStart(2, '0')}T${String(h).padStart(2, '0')}:00`);
  }
}
// temperature equals the absolute open-meteo hour index; 1.2mm of rain at
// 15:00 and 22:00 of the first day; constant wind; sky codes clear at 00:00
const rawTemp = rawTimes.map((_, i) => i);
const rawPrecip = rawTimes.map((_, i) => (i === 15 || i === 22 ? 1.2 : 0));
const rawWind = rawTimes.map(() => 10);
const rawCodes = rawTimes.map((_, i) => (i % 24 === 0 ? 0 : 3));

const startIdx = currentHourStartIndex(rawTimes, NOW);
assert.equal(startIdx, 14);

const omData = {
  daily: {
    time: Array.from({ length: 7 }, (_, idx) => `2026-01-${String(15 + idx).padStart(2, '0')}`),
    weather_code: [0, 1, 2, 3, 4, 5, 6],
  },
  hourly: {},
};

const forecast = buildSevenDayForecast(
  omData,
  rawTemp.slice(startIdx),
  rawTimes.slice(startIdx),
  rawPrecip.slice(startIdx),
  rawWind.slice(startIdx),
  rawCodes.slice(startIdx)
);

test('the 7-day forecast begins at the current hour, not at 00:00', () => {
  assert.equal(forecast.length, 7);
  assert.equal(forecast[0].isToday, true);
  assert.equal(forecast[0].hourly[0].time, '14:00');
  assert.equal(forecast[0].hourly[0].temp, 14);
  assert.equal(forecast[0].hourly.length, 10); // 14:00..23:00
  assert.equal(forecast[0].tempMin, 14);
  assert.equal(forecast[0].tempMax, 23);
});

test('partial first day does not shift the rest: later days stay aligned to midnight', () => {
  assert.equal(forecast[1].hourly.length, 24);
  assert.equal(forecast[1].hourly[0].time, '00:00');
  assert.equal(forecast[1].hourly[0].temp, 24); // first hour of day 2 on the raw axis
  assert.equal(forecast[1].hourly[0].code, 0); // clear at 00:00
  assert.equal(forecast[6].hourly.length, 24);
  assert.equal(forecast[6].hourly[0].temp, 144); // 2026-01-21T00:00 raw index
});

test('precipitation sums only cover the remaining hours of today', () => {
  // 1.2mm at 15:00 and 22:00 of day 0, both >= 14:00, sum = 2.4
  assert.equal(forecast[0].precipitationSum, 2.4);
  assert.equal(forecast[1].precipitationSum, 0);
});