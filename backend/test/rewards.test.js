import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import blockchainService from '../src/blockchainService.js';
import { calculateWellnessReward } from '../src/rewards.js';

test('Unit 08 Wellness Rewards Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const mockRewardStorage = {
    processed: {},
    totals: {}
  };

  const mockContract = {
    VERSION: async () => '1.0.0',
    isRewardProcessed: async (patientId, date) => {
      return Boolean(mockRewardStorage.processed[`${patientId}_${date}`]);
    },
    getRewardPoints: async (patientId) => {
      return BigInt(mockRewardStorage.totals[patientId] || 0);
    },
    addRewardPoints: async (patientId, date, points) => {
      const key = `${patientId}_${date}`;
      if (mockRewardStorage.processed[key]) {
        throw new Error('Reward already awarded for this record');
      }
      mockRewardStorage.processed[key] = true;
      mockRewardStorage.totals[patientId] =
        (mockRewardStorage.totals[patientId] || 0) + Number(points);
      return {
        hash: '0xmockrewardtx999',
        wait: async () => ({ blockNumber: 60 })
      };
    }
  };

  blockchainService.contract = mockContract;
  blockchainService.isInitialized = true;

  await t.test('calculateWellnessReward calculates exact rule-based points', () => {
    // Both goals met
    const bothMet = {
      validated: true,
      consensusMetrics: { steps: 11000, sleepHours: 7.5 }
    };
    const resBoth = calculateWellnessReward(bothMet);
    assert.strictEqual(resBoth.points, 150);
    assert.strictEqual(resBoth.eligible, true);
    assert.strictEqual(resBoth.breakdown.stepsBonus, 100);
    assert.strictEqual(resBoth.breakdown.sleepBonus, 50);

    // Only steps met
    const stepsOnly = {
      validated: true,
      consensusMetrics: { steps: 10500, sleepHours: 6.2 }
    };
    const resSteps = calculateWellnessReward(stepsOnly);
    assert.strictEqual(resSteps.points, 100);
    assert.strictEqual(resSteps.breakdown.stepsBonus, 100);
    assert.strictEqual(resSteps.breakdown.sleepBonus, 0);

    // Only sleep met
    const sleepOnly = {
      validated: true,
      consensusMetrics: { steps: 6000, sleepHours: 8.0 }
    };
    const resSleep = calculateWellnessReward(sleepOnly);
    assert.strictEqual(resSleep.points, 50);
    assert.strictEqual(resSleep.breakdown.stepsBonus, 0);
    assert.strictEqual(resSleep.breakdown.sleepBonus, 50);

    // Anomaly / invalid data
    const anomaly = {
      validated: false,
      reasons: ['Steps discrepancy exceeds tolerance']
    };
    const resAnomaly = calculateWellnessReward(anomaly);
    assert.strictEqual(resAnomaly.points, 0);
    assert.strictEqual(resAnomaly.eligible, false);
  });

  await t.test('GET /api/rewards/:patientId/status returns eligibility and claim status', async () => {
    const res = await fetch(`${baseUrl}/api/rewards/P001/status?date=2026-09-22`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.points, 150);
    assert.strictEqual(body.eligible, true);
    assert.strictEqual(body.isClaimed, false);
  });

  await t.test('POST /api/rewards/:patientId/claim awards points and rejects duplicate claim', async () => {
    // 1. First claim succeeds
    const claimRes = await fetch(`${baseUrl}/api/rewards/P001/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-22' })
    });
    assert.strictEqual(claimRes.status, 200);
    const claimBody = await claimRes.json();
    assert.strictEqual(claimBody.success, true);
    assert.ok(claimBody.data.txHash);
    assert.strictEqual(claimBody.data.pointsAwarded, 150);
    assert.strictEqual(claimBody.data.totalPoints, 150);

    // 2. Duplicate claim attempt for the same date is rejected
    const dupRes = await fetch(`${baseUrl}/api/rewards/P001/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-22' })
    });
    assert.strictEqual(dupRes.status, 400);
    const dupBody = await dupRes.json();
    assert.strictEqual(dupBody.success, false);
    assert.ok(dupBody.error.includes('already awarded'));
  });

  await t.test('POST /api/rewards/:patientId/claim rejects claiming on anomaly day', async () => {
    const res = await fetch(`${baseUrl}/api/rewards/P001/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-20' })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('does not qualify'));
  });
});
