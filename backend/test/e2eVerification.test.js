import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import blockchainService from '../src/blockchainService.js';
import { generateCanonicalRecord, computeCanonicalHash } from '../src/validation.js';

import fs from 'fs/promises';
import path from 'path';

test('Unit 09 End-to-End Verification: Complete 12-Step Demo Flow', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const claimsPath = path.resolve(process.cwd(), '../data/claims.json');
  let originalClaimsData = '';
  try {
    originalClaimsData = await fs.readFile(claimsPath, 'utf-8');
  } catch {}

  t.after(async () => {
    if (originalClaimsData) {
      try {
        await fs.writeFile(claimsPath, originalClaimsData, 'utf-8');
      } catch {}
    }
    await new Promise((resolve) => server.close(resolve));
  });

  // Mock ledger storage for the complete E2E workflow
  const mockStorage = {
    records: {},
    consents: {},
    rewards: {},
    rewardProcessed: {},
    claims: {},
    nextClaimId: 1
  };

  const insurerEntity = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

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
        hash: '0xe2e_tx_add_health_record_001',
        wait: async () => ({ blockNumber: 101 })
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
        hash: '0xe2e_tx_grant_consent_001',
        wait: async () => ({ blockNumber: 102 })
      };
    },

    revokeConsent: async (patientId, entity) => {
      mockStorage.consents[`${patientId}_${entity}`] = false;
      return {
        hash: '0xe2e_tx_revoke_consent_001',
        wait: async () => ({ blockNumber: 103 })
      };
    },

    hasConsent: async (patientId, entity) => {
      return Boolean(mockStorage.consents[`${patientId}_${entity}`]);
    },

    submitClaim: async () => ({
      hash: '0xe2e_tx_submit_claim_001',
      wait: async () => ({ blockNumber: 104 })
    }),

    approveClaim: async () => ({
      hash: '0xe2e_tx_approve_claim_001',
      wait: async () => ({ blockNumber: 105 })
    }),

    rejectClaim: async () => ({
      hash: '0xe2e_tx_reject_claim_001',
      wait: async () => ({ blockNumber: 106 })
    }),

    isRewardProcessed: async (patientId, date) => {
      return Boolean(mockStorage.rewardProcessed[`${patientId}_${date}`]);
    },

    getRewardPoints: async (patientId) => {
      return BigInt(mockStorage.rewards[patientId] || 0);
    },

    addRewardPoints: async (patientId, date, points) => {
      const key = `${patientId}_${date}`;
      if (mockStorage.rewardProcessed[key]) {
        throw new Error('Reward already awarded for this record');
      }
      mockStorage.rewardProcessed[key] = true;
      mockStorage.rewards[patientId] = (mockStorage.rewards[patientId] || 0) + Number(points);
      return {
        hash: '0xe2e_tx_reward_points_001',
        wait: async () => ({ blockNumber: 107 })
      };
    }
  };

  blockchainService.contract = mockContract;
  blockchainService.isInitialized = true;

  let computedRecordHash = '';
  let submittedClaimId = null;

  await t.test('Step 1: Patient Selection (P001 - Aarav Sharma)', async () => {
    const res = await fetch(`${baseUrl}/api/patients`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 3);

    const p001 = body.data.find((p) => p.id === 'P001');
    assert.ok(p001, 'Patient P001 must exist');
    assert.strictEqual(p001.name, 'Aarav Sharma');
    assert.strictEqual(p001.age, 29);
  });

  await t.test('Step 2: View Multi-Source Health Records (Fitbit, Smartwatch, Phone)', async () => {
    const res = await fetch(`${baseUrl}/api/health/P001/sources?date=2026-09-22`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.patientId, 'P001');
    assert.ok(body.data.length >= 1);

    const daySources = body.data[0].sources;
    assert.strictEqual(daySources.length, 3);
    const sourceNames = daySources.map((s) => s.source);
    assert.ok(sourceNames.includes('Mock Fitbit'));
    assert.ok(sourceNames.includes('Mock Smartwatch'));
    assert.ok(sourceNames.includes('Mock Phone'));
  });

  await t.test('Step 3: Multi-Source Data Validation & Anomaly Detection', async () => {
    // 2026-09-22 is consistent across all 3 sources
    const validRes = await fetch(`${baseUrl}/api/health/P001/validation?date=2026-09-22`);
    assert.strictEqual(validRes.status, 200);
    const validBody = await validRes.json();
    assert.strictEqual(validBody.success, true);
    assert.strictEqual(validBody.data.length, 1);
    const validDay = validBody.data[0];
    assert.strictEqual(validDay.validated, true);
    assert.strictEqual(validDay.consensusMetrics.steps, 10427);
    assert.strictEqual(validDay.consensusMetrics.sleepHours, 7.4);

    // 2026-09-20 has a deliberate anomaly (Smartwatch recorded 3000 steps vs ~10400)
    const anomalyRes = await fetch(`${baseUrl}/api/health/P001/validation?date=2026-09-20`);
    assert.strictEqual(anomalyRes.status, 200);
    const anomalyBody = await anomalyRes.json();
    assert.strictEqual(anomalyBody.success, true);
    assert.strictEqual(anomalyBody.data.length, 1);
    const anomalyDay = anomalyBody.data[0];
    assert.strictEqual(anomalyDay.validated, false);
    assert.ok(anomalyDay.reasons.length > 0);
  });

  await t.test('Step 4: Generate Deterministic SHA-256 Health Data Hash', async () => {
    const validRes = await fetch(`${baseUrl}/api/health/P001/validation?date=2026-09-22`);
    const validBody = await validRes.json();
    const validDay = validBody.data[0];
    computedRecordHash = validDay.canonicalHash;

    assert.ok(computedRecordHash, 'Canonical record hash must be returned');
    assert.strictEqual(computedRecordHash.length, 64, 'SHA-256 hash must be 64 hex characters');

    // Verify hash matches independent canonical calculation
    const sourcesRes = await fetch(`${baseUrl}/api/health/P001/sources?date=2026-09-22`);
    const sourcesBody = await sourcesRes.json();
    const daySources = sourcesBody.data[0].sources;

    const canonicalRecord = generateCanonicalRecord(
      'P001',
      '2026-09-22',
      validDay.consensusMetrics,
      daySources
    );
    const independentHash = computeCanonicalHash(canonicalRecord);
    assert.strictEqual(computedRecordHash, independentHash);
  });

  await t.test('Step 5: Write Hash to Blockchain (with Anomaly Rejection Invariant)', async () => {
    // Out-of-tolerance anomaly date MUST be rejected
    const rejectRes = await fetch(`${baseUrl}/api/health/P001/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-20' })
    });
    assert.strictEqual(rejectRes.status, 400);
    const rejectBody = await rejectRes.json();
    assert.strictEqual(rejectBody.success, false);
    assert.ok(rejectBody.error.includes('out-of-tolerance'));

    // Valid date MUST succeed and commit canonical hash
    const recordRes = await fetch(`${baseUrl}/api/health/P001/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-22' })
    });
    assert.strictEqual(recordRes.status, 200);
    const recordBody = await recordRes.json();
    assert.strictEqual(recordBody.success, true);
    assert.strictEqual(recordBody.data.canonicalHash, computedRecordHash);
    assert.strictEqual(recordBody.data.txHash, '0xe2e_tx_add_health_record_001');

    // Verify verified state on-chain
    const onChainRes = await fetch(`${baseUrl}/api/health/P001/record-onchain?date=2026-09-22`);
    assert.strictEqual(onChainRes.status, 200);
    const onChainBody = await onChainRes.json();
    assert.strictEqual(onChainBody.success, true);
    assert.strictEqual(onChainBody.data.exists, true);
    assert.strictEqual(onChainBody.data.dataHash, computedRecordHash);
  });

  await t.test('Step 6: Grant Insurance Consent on Smart Contract', async () => {
    const grantRes = await fetch(`${baseUrl}/api/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'P001',
        entityAddress: insurerEntity,
        granted: true
      })
    });
    assert.strictEqual(grantRes.status, 200);
    const grantBody = await grantRes.json();
    assert.strictEqual(grantBody.success, true);
    assert.strictEqual(grantBody.data.consent, true);

    // Verify consent check endpoint
    const checkRes = await fetch(`${baseUrl}/api/consent/P001?entity=${insurerEntity}`);
    assert.strictEqual(checkRes.status, 200);
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.data.hasConsent, true);
  });

  await t.test('Step 7: Open Insurance Dashboard & Verify Authorized Patients Filter', async () => {
    const authRes = await fetch(`${baseUrl}/api/insurance/authorized-patients`);
    assert.strictEqual(authRes.status, 200);
    const authBody = await authRes.json();
    assert.strictEqual(authBody.success, true);

    const authorizedIds = authBody.data.map((p) => p.id);
    assert.ok(authorizedIds.includes('P001'), 'Consented patient P001 must appear in authorized list');
    assert.ok(!authorizedIds.includes('P002'), 'Unconsented patient P002 must not appear');
  });

  await t.test('Step 8: Calculate Smart-Contract Dynamic Premium (Base 10,000 -> 8,500)', async () => {
    const policyRes = await fetch(`${baseUrl}/api/policies/P001?date=2026-09-22`);
    assert.strictEqual(policyRes.status, 200);
    const policyBody = await policyRes.json();
    assert.strictEqual(policyBody.success, true);
    assert.strictEqual(policyBody.data.policyId, 'POL-1001');
    assert.strictEqual(policyBody.data.basePremium, 10000);
    // Steps >= 10,000 (-10%) and Sleep >= 7h (-5%) -> 15% discount
    assert.strictEqual(policyBody.data.discountPercent, 15);
    assert.strictEqual(policyBody.data.finalPremium, 8500);
  });

  await t.test('Step 9: Submit Insurance Claim', async () => {
    const claimRes = await fetch(`${baseUrl}/api/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyId: 'POL-1001',
        patientId: 'P001',
        amount: 15000,
        description: 'Comprehensive Annual Wellness & Physical Evaluation'
      })
    });
    assert.strictEqual(claimRes.status, 200);
    const claimBody = await claimRes.json();
    assert.strictEqual(claimBody.success, true);
    assert.strictEqual(claimBody.data.status, 'Pending');
    assert.strictEqual(claimBody.data.amount, 15000);
    assert.ok(claimBody.data.id);
    submittedClaimId = claimBody.data.id;
  });

  await t.test('Step 10: Adjudicate & Approve Claim On-Chain', async () => {
    const approveRes = await fetch(`${baseUrl}/api/claims/${submittedClaimId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Verified preventive care under policy benefits' })
    });
    assert.strictEqual(approveRes.status, 200);
    const approveBody = await approveRes.json();
    assert.strictEqual(approveBody.success, true);
    assert.strictEqual(approveBody.data.status, 'Approved');
    assert.strictEqual(approveBody.data.decisionReason, 'Verified preventive care under policy benefits');
  });

  await t.test('Step 11: Award Wellness Points with Duplicate Claim Prevention', async () => {
    // Check eligibility
    const statusRes = await fetch(`${baseUrl}/api/rewards/P001/status?date=2026-09-22`);
    assert.strictEqual(statusRes.status, 200);
    const statusBody = await statusRes.json();
    assert.strictEqual(statusBody.success, true);
    assert.strictEqual(statusBody.eligible, true);
    assert.strictEqual(statusBody.points, 150);
    assert.strictEqual(statusBody.isClaimed, false);

    // First claim: Should succeed
    const claimRes = await fetch(`${baseUrl}/api/rewards/P001/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-22' })
    });
    assert.strictEqual(claimRes.status, 200);
    const claimBody = await claimRes.json();
    assert.strictEqual(claimBody.success, true);
    assert.strictEqual(claimBody.data.pointsAwarded, 150);
    assert.strictEqual(claimBody.data.totalPoints, 150);
    assert.strictEqual(claimBody.data.txHash, '0xe2e_tx_reward_points_001');

    // Duplicate claim: Must be rejected idempotently
    const duplicateRes = await fetch(`${baseUrl}/api/rewards/P001/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-22' })
    });
    assert.strictEqual(duplicateRes.status, 400);
    const duplicateBody = await duplicateRes.json();
    assert.strictEqual(duplicateBody.success, false);
    assert.ok(duplicateBody.error.includes('already awarded') || duplicateBody.error.includes('already processed'));
  });

  await t.test('Step 12: Verify Blockchain Record & Final Integrated State', async () => {
    // Contract info
    const infoRes = await fetch(`${baseUrl}/api/blockchain/info`);
    assert.strictEqual(infoRes.status, 200);
    const infoBody = await infoRes.json();
    assert.strictEqual(infoBody.data.version, '1.0.0');

    // Total rewards
    const rewardRes = await fetch(`${baseUrl}/api/rewards/P001`);
    assert.strictEqual(rewardRes.status, 200);
    const rewardBody = await rewardRes.json();
    assert.strictEqual(rewardBody.rewardPoints, 150);

    // On-chain record
    const recordRes = await fetch(`${baseUrl}/api/health/P001/record-onchain?date=2026-09-22`);
    assert.strictEqual(recordRes.status, 200);
    const recordBody = await recordRes.json();
    assert.strictEqual(recordBody.data.exists, true);
    assert.strictEqual(recordBody.data.dataHash, computedRecordHash);

    // Claims list
    const claimsRes = await fetch(`${baseUrl}/api/claims`);
    assert.strictEqual(claimsRes.status, 200);
    const claimsBody = await claimsRes.json();
    const verifiedClaim = claimsBody.data.find((c) => c.id === submittedClaimId);
    assert.ok(verifiedClaim);
    assert.strictEqual(verifiedClaim.status, 'Approved');
  });
});
