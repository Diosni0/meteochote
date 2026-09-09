import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolateWeather, weatherColor, WEATHER_SCALES } from '../src/services/weatherLayers.ts';

test('exact station values, including negative temperatures and zero rain, are preserved', () => {
  for (const value of [-8, 0, 32]) {
    assert.deepEqual(interpolateWeather([{ lat: 40, lon: -3, value }], 40, -3), { value, coverage: 1 });
  }
});

test('interpolation blends nearby points without inventing data outside coverage', () => {
  const points = [{ lat: 40, lon: -4, value: 10 }, { lat: 40, lon: -2, value: 30 }];
  assert.equal(interpolateWeather(points, 40, -3).value, 20);
  assert.equal(interpolateWeather(points, 28, -16), null);
  assert.equal(interpolateWeather([], 40, -3), null);
  assert.equal(interpolateWeather([{ lat: 40, lon: -3, value: NaN }], 40, -3), null);
});

test('Canary Islands have their own coverage, fading toward its edge', () => {
  const points = [{ lat: 28, lon: -16, value: 24 }];
  assert.equal(interpolateWeather(points, 28.1, -16).value, 24);
  assert.ok(interpolateWeather(points, 30, -16).coverage < 1);
  assert.equal(interpolateWeather(points, 40, -3), null);
});

test('fixed palettes clamp extremes and preserve physical thresholds', () => {
  for (const variable of Object.keys(WEATHER_SCALES)) {
    const { stops } = WEATHER_SCALES[variable];
    for (const stop of stops) assert.deepEqual(weatherColor(variable, stop.value).slice(0, 3), stop.color);
    assert.deepEqual(weatherColor(variable, -100).slice(0, 3), stops[0].color);
    assert.deepEqual(weatherColor(variable, 1000).slice(0, 3), stops.at(-1).color);
  }
  assert.notDeepEqual(weatherColor('temperature', -5), weatherColor('temperature', 5));
  assert.notDeepEqual(weatherColor('wind_speed', 10), weatherColor('wind_speed', 60));
});

test('dry areas are transparent and light rain fades in', () => {
  assert.equal(weatherColor('precipitation', 0)[3], 0);
  assert.ok(weatherColor('precipitation', 0.1)[3] > 0);
  assert.ok(weatherColor('precipitation', 0.1)[3] < 255);
  assert.equal(weatherColor('precipitation', 1)[3], 255);
});
