import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import blockchainService, { BlockchainService } from '../src/blockchainService.js';

test('Unit 05 Blockchain Integration Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // Mock contract for deterministic integration testing
  const mockStorage = {
    records: {},
    consents: {},
    rewards: {},
    policies: {},
    claims: {},
    nextClaimId: 1
  };

  const mockContract = {
    VERSION: async () => '1.0.0',
    BASE_PREMIUM: async () => 10000n,
    calculatePremium: async (steps, sleepHours) => {
      let discount = 0;
      if (Number(steps) >= 10000) discount += 1000;
      if (Number(sleepHours) >= 7) discount += 500;
      return BigInt(10000 - discount);
    },
    addHealthRecord: async (patientId, date, dataHash, source) => {
      mockStorage.records[`${patientId}_${date}`] = {
        dataHash,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        source,
        exists: true
      };
      return {
        hash: '0xmocktxhash1234567890abcdef',
        wait: async () => ({ blockNumber: 42 })
      };
    },
    getHealthRecord: async (patientId, date) => {
      const rec = mockStorage.records[`${patientId}_${date}`];
      if (rec) {
        return [rec.dataHash, rec.timestamp, rec.source, true];
      }
      return ['', 0n, '', false];
    },
    grantConsent: async (patientId, entity) => {
      mockStorage.consents[`${patientId}_${entity}`] = true;
      return {
        hash: '0xmocktxconsentgrant123',
        wait: async () => ({ blockNumber: 43 })
      };
    },
    revokeConsent: async (patientId, entity) => {
      mockStorage.consents[`${patientId}_${entity}`] = false;
      return {
        hash: '0xmocktxconsentrevoke123',
        wait: async () => ({ blockNumber: 44 })
      };
    },
    hasConsent: async (patientId, entity) => {
      return Boolean(mockStorage.consents[`${patientId}_${entity}`]);
    },
    addRewardPoints: async (patientId, date, points) => {
      const key = `${patientId}_${date}`;
      if (mockStorage.rewards[key]) {
        throw new Error('Reward already awarded for this record');
      }
      mockStorage.rewards[key] = points;
      mockStorage.rewards[`${patientId}_total`] =
        (mockStorage.rewards[`${patientId}_total`] || 0) + Number(points);
      return {
        hash: '0xmocktxreward123',
        wait: async () => ({ blockNumber: 45 })
      };
    },
    getRewardPoints: async (patientId) => {
      return BigInt(mockStorage.rewards[`${patientId}_total`] || 0);
    }
  };

  // Inject mock contract into default singleton service for API routes
  blockchainService.contract = mockContract;
  blockchainService.isInitialized = true;

  await t.test('GET /api/blockchain/info returns contract operational info', async () => {
    const res = await fetch(`${baseUrl}/api/blockchain/info`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.version, '1.0.0');
    assert.ok(body.data.contractAddress);
  });

  await t.test('POST /api/health/:patientId/record rejects anomaly day without writing to blockchain', async () => {
    // 2026-09-20 has out-of-tolerance data for P001
    const res = await fetch(`${baseUrl}/api/health/P001/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-20' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('out-of-tolerance'));
    assert.ok(body.reasons.length > 0);

    // Verify it was NOT recorded in mock storage
    assert.strictEqual(mockStorage.records['P001_2026-09-20'], undefined);
  });

  await t.test('POST /api/health/:patientId/record writes validated canonical hash on-chain', async () => {
    // 2026-09-22 is consistent data for P001
    const res = await fetch(`${baseUrl}/api/health/P001/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-22' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.txHash);
    assert.ok(body.data.canonicalHash);
    assert.strictEqual(body.data.consensusMetrics.steps, 10427);

    // Verify stored on-chain
    assert.ok(mockStorage.records['P001_2026-09-22']);
    assert.strictEqual(mockStorage.records['P001_2026-09-22'].dataHash, body.data.canonicalHash);
  });

  await t.test('GET /api/health/:patientId/record-onchain retrieves hash from blockchain', async () => {
    const res = await fetch(`${baseUrl}/api/health/P001/record-onchain?date=2026-09-22`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.exists, true);
    assert.strictEqual(body.data.source, 'consensus-v1');
    assert.ok(body.data.dataHash.length > 0);
  });

  await t.test('POST /api/consent grants and revokes consent on-chain', async () => {
    const entity = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

    // Grant consent
    const grantRes = await fetch(`${baseUrl}/api/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: 'P001', entityAddress: entity, granted: true })
    });
    assert.strictEqual(grantRes.status, 200);
    const grantBody = await grantRes.json();
    assert.strictEqual(grantBody.success, true);
    assert.strictEqual(grantBody.data.consent, true);

    // Query consent
    const checkRes = await fetch(`${baseUrl}/api/consent/P001?entity=${entity}`);
    assert.strictEqual(checkRes.status, 200);
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.data.hasConsent, true);

    // Revoke consent
    const revokeRes = await fetch(`${baseUrl}/api/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: 'P001', entityAddress: entity, granted: false })
    });
    assert.strictEqual(revokeRes.status, 200);
    const revokeBody = await revokeRes.json();
    assert.strictEqual(revokeBody.data.consent, false);

    // Query consent again
    const checkRevoked = await fetch(`${baseUrl}/api/consent/P001?entity=${entity}`);
    const revokedBody = await checkRevoked.json();
    assert.strictEqual(revokedBody.data.hasConsent, false);
  });

  await t.test('BlockchainService calculates premium directly via contract', async () => {
    const standard = await blockchainService.calculatePremium(5000, 6);
    assert.strictEqual(standard, 10000);

    const discounted = await blockchainService.calculatePremium(10500, 7.5);
    assert.strictEqual(discounted, 8500);
  });
});
