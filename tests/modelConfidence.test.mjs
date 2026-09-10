import test from 'node:test';
import assert from 'node:assert/strict';
import { computeModelConfidence, confidenceLabel } from '../src/lib/modelConfidence.ts';

const series = (fill, length = 168) => Array.from({ length }, () => fill);
const model = (tempFill, precipFill = 0, tempLength = 168) => ({
  temperature: series(tempFill, tempLength),
  precipitation: series(precipFill, tempLength),
});

test('perfect agreement across models gives 100% confidence', () => {
  const confidence = computeModelConfidence([model(20), model(20), model(20), model(20)]);
  assert.equal(confidence.overall, 100);
  assert.equal(confidence.short.score, 100);
  assert.equal(confidence.mid.score, 100);
  assert.equal(confidence.long.score, 100);
  assert.equal(confidence.avgSpread24h, 0);
  assert.equal(confidence.label, 'Muy alta');
  assert.equal(confidence.daily.length, 7);
});

test('no data results in a null confidence', () => {
  const confidence = computeModelConfidence([model(undefined, 0, 0), model(undefined, 0, 0)]);
  assert.equal(confidence.overall, null);
  assert.equal(confidence.short.score, null);
  assert.equal(confidence.long.score, null);
  assert.equal(confidence.label, 'Sin datos');
  assert.ok(confidence.daily.every((day) => day.score === null));
});

test('diverging temperatures and mixed rain lower the confidence', () => {
  const tight = computeModelConfidence([model(20), model(20.5), model(20.8), model(21)]);
  const loose = computeModelConfidence([
    { temperature: series(15), precipitation: series(0) },
    { temperature: series(20), precipitation: series(0) },
    { temperature: series(25), precipitation: series(2) },
    { temperature: series(28), precipitation: series(3) },
  ]);
  assert.ok(tight.overall !== null && loose.overall !== null);
  assert.ok(tight.overall > loose.overall);
  assert.equal(tight.label, 'Muy alta');
  assert.ok(['Muy baja', 'Baja'].includes(loose.label));
});

test('confidence tends to drop further into the horizon', () => {
  const models = [0, 1, 2, 3].map((m) => ({
    temperature: Array.from({ length: 168 }, (_, idx) => (idx < 48 ? 20 + m * 0.5 : 16 + m * 6)),
    precipitation: Array.from({ length: 168 }, () => 0),
  }));
  const confidence = computeModelConfidence(models);
  assert.ok(confidence.short.score !== null);
  assert.ok(confidence.long.score !== null);
  assert.ok(confidence.short.score > confidence.long.score);
});

test('a shorter-lead model (AROME) reduces the model count later without breaking the score', () => {
  const aromeLimited = {
    temperature: Array.from({ length: 168 }, (_, idx) => (idx < 48 ? 20 : undefined)),
    precipitation: Array.from({ length: 168 }, (_, idx) => (idx < 48 ? 0 : undefined)),
  };
  const confidence = computeModelConfidence([model(20), model(20), model(20), aromeLimited]);
  assert.equal(confidence.daily[0].models, 4);
  assert.equal(confidence.daily[6].models, 3);
  assert.notEqual(confidence.overall, null);
  assert.notEqual(confidence.long.score, null);
});

test('confidenceLabel maps scores to Spanish levels', () => {
  assert.equal(confidenceLabel(95), 'Muy alta');
  assert.equal(confidenceLabel(78), 'Alta');
  assert.equal(confidenceLabel(55), 'Moderada');
  assert.equal(confidenceLabel(40), 'Baja');
  assert.equal(confidenceLabel(15), 'Muy baja');
  assert.equal(confidenceLabel(null), 'Sin datos');
});

test('average temperature spread over the next 24h is reported', () => {
  const confidence = computeModelConfidence([model(18), model(20), model(22)]);
  assert.equal(confidence.avgSpread24h, 4);
});