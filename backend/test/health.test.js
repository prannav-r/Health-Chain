import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

test('GET /api/health returns ok status', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;

  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.message, 'Health-Chain API is running');
    assert.ok(data.timestamp);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
