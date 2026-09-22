import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import blockchainService from '../src/blockchainService.js';

test('Unit 07 Insurance Workflow Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const mockStorage = {
    consents: {
      'P001_0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': true,
      'P003_0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': false
    }
  };

  const mockContract = {
    VERSION: async () => '1.0.0',
    calculatePremium: async (steps, sleepHours) => {
      let discount = 0;
      if (Number(steps) >= 10000) discount += 1000;
      if (Number(sleepHours) >= 7) discount += 500;
      return BigInt(10000 - discount);
    },
    hasConsent: async (patientId, entity) => {
      return Boolean(mockStorage.consents[`${patientId}_${entity}`]);
    },
    submitClaim: async () => ({
      hash: '0xmockclaimtx111',
      wait: async () => ({ blockNumber: 50 })
    }),
    approveClaim: async () => ({
      hash: '0xmockapprovetx222',
      wait: async () => ({ blockNumber: 51 })
    }),
    rejectClaim: async () => ({
      hash: '0xmockrejecttx333',
      wait: async () => ({ blockNumber: 52 })
    })
  };

  blockchainService.contract = mockContract;
  blockchainService.isInitialized = true;

  await t.test('GET /api/insurance/authorized-patients returns only consented patients', async () => {
    const res = await fetch(`${baseUrl}/api/insurance/authorized-patients`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const authorizedIds = body.data.map((p) => p.id);

    // P001 has consent -> authorized
    assert.ok(authorizedIds.includes('P001'), 'Consented patient P001 must be authorized');
    // P003 lacks consent -> not authorized
    assert.ok(!authorizedIds.includes('P003'), 'Non-consented patient P003 must be excluded');
  });

  await t.test('GET /api/policies/:patientId returns policy with smart-contract discounted premium', async () => {
    const res = await fetch(`${baseUrl}/api/policies/P001`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.policyId, 'POL-1001');
    assert.strictEqual(body.data.basePremium, 10000);
    // P001 on 2026-09-22 has >10000 steps and >=7h sleep -> finalPremium 8500
    assert.strictEqual(body.data.finalPremium, 8500);
    assert.strictEqual(body.data.discountPercent, 15);
  });

  await t.test('POST /api/claims submits claim with Pending status', async () => {
    const res = await fetch(`${baseUrl}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyId: 'POL-1001',
        patientId: 'P001',
        amount: 2500,
        description: 'Sports physical therapy reimbursement'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'Pending');
    assert.strictEqual(body.data.amount, 2500);

    const claimId = body.data.id;

    // Approve claim
    const approveRes = await fetch(`${baseUrl}/api/claims/${claimId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Verified treatment documentation' })
    });
    assert.strictEqual(approveRes.status, 200);
    const approvedBody = await approveRes.json();
    assert.strictEqual(approvedBody.data.status, 'Approved');
    assert.strictEqual(approvedBody.data.decisionReason, 'Verified treatment documentation');
  });

  await t.test('POST /api/claims/:claimId/reject rejects claim with reason', async () => {
    const res = await fetch(`${baseUrl}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyId: 'POL-1001',
        patientId: 'P001',
        amount: 8000,
        description: 'Cosmetic elective dental'
      })
    });

    const body = await res.json();
    const claimId = body.data.id;

    const rejectRes = await fetch(`${baseUrl}/api/claims/${claimId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Cosmetic procedures excluded from coverage' })
    });

    assert.strictEqual(rejectRes.status, 200);
    const rejectedBody = await rejectRes.json();
    assert.strictEqual(rejectedBody.data.status, 'Rejected');
    assert.strictEqual(rejectedBody.data.decisionReason, 'Cosmetic procedures excluded from coverage');
  });
});
