import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMadridHour, currentHourStartIndex } from '../src/lib/madridTime.ts';

test('formatMadridHour labels the current hour in Europe/Madrid', () => {
  // Winter (UTC+1): 13:30 UTC -> 14:30 in Madrid -> hour label 14:00
  assert.equal(formatMadridHour(new Date('2026-01-15T13:30:00Z')), '2026-01-15T14:00');
  // Summer (UTC+2): 15:45 UTC -> 17:45 in Madrid -> hour label 17:00
  assert.equal(formatMadridHour(new Date('2026-07-15T15:45:00Z')), '2026-07-15T17:00');
});

test('currentHourStartIndex trims a midnight-based axis to the current hour', () => {
  const times = [];
  for (let h = 0; h < 48; h++) times.push(`2026-01-15T${String(h % 24).padStart(2, '0')}:00`);
  // 2026-01-15T13:30Z -> Madrid 14:00 -> the forecast must begin at 14:00
  assert.equal(currentHourStartIndex(times, new Date('2026-01-15T13:30:00Z')), 14);
  const trimmed = times.slice(currentHourStartIndex(times, new Date('2026-01-15T13:30:00Z')));
  assert.equal(trimmed[0], '2026-01-15T14:00');
});

test('currentHourStartIndex falls back to 0 for empty arrays or fully past horizons', () => {
  assert.equal(currentHourStartIndex([], new Date('2026-01-15T13:30:00Z')), 0);
  const past = ['2026-01-14T00:00', '2026-01-14T01:00'];
  assert.equal(currentHourStartIndex(past, new Date('2026-01-15T13:30:00Z')), 0);
});