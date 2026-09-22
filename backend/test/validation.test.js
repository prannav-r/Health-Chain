import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import {
  validateSources,
  stringifyCanonical,
  generateCanonicalRecord,
  computeCanonicalHash,
  DEFAULT_TOLERANCES
} from '../src/validation.js';

test('Unit 03 Health Validation Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  await t.test('Identical input produces the exact same hash (deterministic hashing)', () => {
    const recordA = {
      patientId: 'P001',
      date: '2026-09-22',
      metrics: { steps: 10427, heartRate: 72, sleepHours: 7.4, calories: 2350 },
      sources: ['Mock Fitbit', 'Mock Phone', 'Mock Smartwatch']
    };

    // recordB has keys in different order
    const recordB = {
      sources: ['Mock Fitbit', 'Mock Phone', 'Mock Smartwatch'],
      date: '2026-09-22',
      patientId: 'P001',
      metrics: { calories: 2350, steps: 10427, sleepHours: 7.4, heartRate: 72 }
    };

    const hashA = computeCanonicalHash(recordA);
    const hashB = computeCanonicalHash(recordB);

    assert.strictEqual(hashA, hashB, 'Hashes must match regardless of object property insertion order');
    assert.strictEqual(hashA.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
  });

  await t.test('Modified input produces a completely different hash', () => {
    const recordOriginal = {
      patientId: 'P001',
      date: '2026-09-22',
      metrics: { steps: 10427, heartRate: 72, sleepHours: 7.4, calories: 2350 },
      sources: ['Mock Fitbit', 'Mock Phone', 'Mock Smartwatch']
    };

    const recordModified = {
      patientId: 'P001',
      date: '2026-09-22',
      metrics: { steps: 10428, heartRate: 72, sleepHours: 7.4, calories: 2350 }, // 1 step difference
      sources: ['Mock Fitbit', 'Mock Phone', 'Mock Smartwatch']
    };

    const hash1 = computeCanonicalHash(recordOriginal);
    const hash2 = computeCanonicalHash(recordModified);

    assert.notStrictEqual(hash1, hash2, 'Changing 1 step must produce a completely different SHA-256 digest');
  });

  await t.test('Valid multi-source records within tolerance are accepted', () => {
    const validSources = [
      { source: 'Mock Fitbit', steps: 10450, heartRate: 72, sleepHours: 7.5, calories: 2350 },
      { source: 'Mock Smartwatch', steps: 10320, heartRate: 74, sleepHours: 7.3, calories: 2320 },
      { source: 'Mock Phone', steps: 10510, heartRate: 71, sleepHours: 7.5, calories: 2380 }
    ];

    const result = validateSources(validSources);
    assert.strictEqual(result.validated, true);
    assert.strictEqual(result.reasons.length, 0);
    assert.ok(result.consensusMetrics);
    assert.strictEqual(result.consensusMetrics.steps, 10427);
  });

  await t.test('Out-of-tolerance multi-source records are rejected with descriptive reasons', () => {
    const anomalousSources = [
      { source: 'Mock Fitbit', steps: 5100, heartRate: 70, sleepHours: 7.2, calories: 1850 },
      { source: 'Mock Smartwatch', steps: 5200, heartRate: 71, sleepHours: 7.1, calories: 1870 },
      { source: 'Mock Phone', steps: 18500, heartRate: 130, sleepHours: 3.0, calories: 3900 }
    ];

    const result = validateSources(anomalousSources);
    assert.strictEqual(result.validated, false);
    assert.ok(result.reasons.length >= 3, 'Should list reasons for steps, HR, sleep, and/or calories');
    assert.strictEqual(result.consensusMetrics, null);
  });

  await t.test('Missing required source is rejected', () => {
    const incompleteSources = [
      { source: 'Mock Fitbit', steps: 10450, heartRate: 72, sleepHours: 7.5, calories: 2350 },
      { source: 'Mock Smartwatch', steps: 10320, heartRate: 74, sleepHours: 7.3, calories: 2320 }
    ];

    const result = validateSources(incompleteSources);
    assert.strictEqual(result.validated, false);
    assert.ok(result.reasons.some((r) => r.includes('Missing required source(s): Mock Phone')));
  });

  await t.test('GET /api/health/:patientId/validation returns validation and hash for consistent day', async () => {
    const res = await fetch(`${baseUrl}/api/health/P001/validation?date=2026-09-22`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const day = body.data[0];
    assert.strictEqual(day.date, '2026-09-22');
    assert.strictEqual(day.validated, true);
    assert.ok(day.canonicalHash);
    assert.strictEqual(day.canonicalHash.length, 64);
    assert.ok(day.consensusMetrics);
  });

  await t.test('GET /api/health/:patientId/validation flags anomaly day as validated=false', async () => {
    const res = await fetch(`${baseUrl}/api/health/P001/validation?date=2026-09-20`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const day = body.data[0];
    assert.strictEqual(day.date, '2026-09-20');
    assert.strictEqual(day.validated, false);
    assert.strictEqual(day.canonicalHash, null);
    assert.ok(day.reasons.length > 0);
  });
});
