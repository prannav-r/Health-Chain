# Health-Chain Build Plan

The units are ordered by dependency and should be implemented one at a time.

| Unit | Name | Builds | Dependencies |
|---|---|---|---|
| 01 | Project Foundation | React, Express, Hardhat structure and scripts | None |
| 02 | Mock Health Data | Patient and health-data JSON plus API | 01 |
| 03 | Health Validation | Multi-source validation and hashing API | 02 |
| 04 | Smart Contract | Solidity contract and tests | 01 |
| 05 | Blockchain Integration | Deploy contract and connect backend/frontend | 03, 04 |
| 06 | Patient Dashboard | Patient health, validation, consent, blockchain UI | 02, 03, 05 |
| 07 | Insurance Workflow | Policy, premium, claims dashboard | 05, 06 |
| 08 | Wellness Rewards | Rule-based reward calculation and UI | 06, 07 |
| 09 | End-to-End Verification | Demo flow, error handling, documentation | 01–08 |

## Definition of Done

Every unit must:
- Stay within its system boundary.
- Have no unrelated feature changes.
- Pass its verification checklist.
- Leave the application runnable.
- Update the progress tracker.
