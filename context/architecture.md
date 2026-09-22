# Health-Chain — Architecture

## Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React + Vite | Patient and insurance dashboards |
| Backend | Node.js + Express | API, validation, hashing, orchestration |
| Data | JSON files | MVP health/patient/policy/claim data |
| Blockchain | Ethereum Sepolia | Public testnet for immutable records |
| Smart contract | Solidity | Health records, consent, policy/claim/reward logic |
| Blockchain tooling | Hardhat | Compile, test, deploy |
| Web3 | ethers.js | Backend/frontend blockchain interaction |
| Wallet | MetaMask | Testnet transaction signing |
| Styling | Plain CSS | Simple, dependency-light UI |

## System Boundaries

### `frontend/`
Owns:
- Pages
- Components
- Dashboard state
- API calls
- Wallet connection UI

Must not contain:
- Private keys
- Blockchain business rules that belong in Solidity
- Direct file-system access

### `backend/`
Owns:
- Mock health-data loading
- Multi-source validation
- Hash generation
- REST API
- Blockchain service integration
- Input validation

### `blockchain/`
Owns:
- Solidity contract
- Hardhat configuration
- Contract tests
- Deployment scripts

### `data/`
Owns:
- Mock patients
- Mock health measurements
- Policies
- Claims

No real personal health information should be committed.

## Data Model

### Health Record

```text
patientId
date
steps
heartRate
sleepHours
calories
source
```

### Validation Result

```text
patientId
date
sources[]
validated
reason
canonicalHash
```

### On-Chain Record

```text
patientIdHash
dataHash
timestamp
source
```

## Blockchain Rules

- Raw health data is never stored on-chain.
- Only hashes and minimal metadata are stored on-chain.
- Sepolia is used instead of Ethereum mainnet.
- No real-money transactions are required.
- Demo transactions may use faucet-provided test ETH.

## Premium Rules

Starting premium: ₹10,000.

- Steps >= 10,000: 10% discount
- Sleep >= 7 hours: 5% discount
- Otherwise no discount

The MVP should make these rules explicit and deterministic.

## Multi-Source Validation

Generate three mock sources:

- Mock Fitbit
- Mock Smartwatch
- Mock Phone

A record is valid when the three sources are within a configurable tolerance for the comparable metric. The backend produces the validation result and canonical hash.

This is application-level multi-source validation, not a new blockchain consensus protocol.

## Authentication

No real authentication is required for the MVP.

The demo uses:
- Demo patient IDs
- MetaMask wallet connection for blockchain transactions

Do not implement passwords or OAuth unless explicitly added to scope.

## Invariants

1. Never store raw health/medical data on-chain.
2. Never commit private keys, seed phrases, or `.env` secrets.
3. Never use mainnet for the MVP.
4. Backend validation must happen before a health record is written to blockchain.
5. Hashing must use a deterministic canonical representation.
6. Premium and reward rules must be explicit and testable.
7. Do not introduce paid services or dependencies.
8. Do not claim the prototype provides real medical or insurance decisions.
