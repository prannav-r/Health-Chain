# Unit 04: Smart Contract

## Goal

Create and test a Solidity contract that stores health-record hashes, consent, simple policies, claims, and wellness points.

## Implementation

The contract should support:

- `addHealthRecord`
- `getHealthRecord`
- `grantConsent`
- `revokeConsent`
- `hasConsent`
- `createPolicy`
- `calculatePremium`
- `submitClaim`
- `approveClaim`
- `rejectClaim`
- `addRewardPoints`
- `getRewardPoints`

Emit events for important state changes.

Premium rules:
- Base: 10000
- Steps >= 10000: 10% discount
- Sleep >= 7 hours: 5% discount

No actual money transfer is required.

## Verify when done

- [ ] Contract compiles.
- [ ] Unit tests cover health records.
- [ ] Unit tests cover consent.
- [ ] Unit tests cover premium calculation.
- [ ] Unit tests cover claims.
- [ ] Unit tests cover rewards.
- [ ] No raw health data is stored.
