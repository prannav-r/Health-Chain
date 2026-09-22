import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

test('Unit 02 Mock Health Data Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  await t.test('GET /api/patients returns all demo patients', async () => {
    const res = await fetch(`${baseUrl}/api/patients`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 3, 'Should have at least 3 demo patients');

    const ids = body.data.map((p) => p.id);
    assert.ok(ids.includes('P001'));
    assert.ok(ids.includes('P002'));
    assert.ok(ids.includes('P003'));
  });

  await t.test('GET /api/patients/:patientId returns patient or 404', async () => {
    const resSuccess = await fetch(`${baseUrl}/api/patients/P001`);
    assert.strictEqual(resSuccess.status, 200);
    const patient = await resSuccess.json();
    assert.strictEqual(patient.data.id, 'P001');
    assert.strictEqual(patient.data.name, 'Aarav Sharma');

    const res404 = await fetch(`${baseUrl}/api/patients/P999`);
    assert.strictEqual(res404.status, 404);
  });

  await t.test('GET /api/health/:patientId returns health records', async () => {
    const res = await fetch(`${baseUrl}/api/health/P001`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.count >= 3);
    assert.ok(body.data.every((r) => r.patientId === 'P001'));
  });

  await t.test('GET /api/health/:patientId/sources returns 3 mock sources per date', async () => {
    const res = await fetch(`${baseUrl}/api/health/P001/sources?date=2026-09-22`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 1);

    const daySources = body.data[0].sources;
    assert.strictEqual(daySources.length, 3);
    const sourceNames = daySources.map((s) => s.source);
    assert.ok(sourceNames.includes('Mock Fitbit'));
    assert.ok(sourceNames.includes('Mock Smartwatch'));
    assert.ok(sourceNames.includes('Mock Phone'));

    // Check data schema
    daySources.forEach((s) => {
      assert.ok(typeof s.steps === 'number');
      assert.ok(typeof s.heartRate === 'number');
      assert.ok(typeof s.sleepHours === 'number');
      assert.ok(typeof s.calories === 'number');
    });
  });
});
