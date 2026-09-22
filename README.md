# Health-Chain MVP

A decentralized, privacy-preserving healthcare and dynamic insurance platform. Health-Chain validates multi-source wearable and biometric records off-chain, commits deterministic SHA-256 proofs to an Ethereum smart contract, enforces patient-governed access consent, calculates dynamic premium discounts based on verified wellness metrics, adjudicates insurance claims, and distributes wellness reward points.

---

## Key Principles & Architecture

- **Zero Raw Health Data On-Chain**: Wearable activity data, heart rates, and sleep durations remain strictly off-chain. Only cryptographic SHA-256 digests of canonical records are stored on the blockchain.
- **Multi-Source Tolerance Validation**: Cross-checks data from three independent sources (Mock Fitbit, Mock Smartwatch, Mock Phone) using statistical tolerance thresholds before allowing on-chain commitment.
- **Smart Contract Access Governance**: Insurers cannot access patient profiles unless the patient explicitly grants on-chain consent on the `HealthChain` smart contract.
- **Deterministic Dynamic Premium**: Smart contract calculates insurance premiums deterministically based on verified metrics (Base ₹10,000; -10% for steps ≥ 10,000; -5% for sleep ≥ 7h; up to 15% combined discount).
- **Claims State Machine**: Transparent submission and adjudication (`Pending` → `Approved` / `Rejected`) with on-chain audit trail.
- **Wellness Rewards & Idempotency**: Automated wellness points (up to 150 pts/day) with smart-contract duplicate claim prevention via unique record hashing (`keccak256(patientId, date)`).
- **100% Free & Demo-Friendly**: Requires no paid cloud APIs, external subscriptions, or real cryptocurrency. Runs locally via Hardhat or on the Ethereum Sepolia testnet.

```text
┌─────────────────────────────────────────────────────────────┐
│                      Frontend UI (React + Vite)             │
│   • Patient Dashboard (Metrics, Hashes, Consent, Rewards)   │
│   • Insurer Portal (Consent Filter, Dynamic Premium, Claims)│
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend API (Node.js + Express)          │
│   • Multi-Source Data Loader & Anomaly Detection            │
│   • Deterministic Canonical Hasher (SHA-256)                │
│   • Rewards & Dynamic Premium Calculation Engine            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Ethers.js v6
┌──────────────────────────────▼──────────────────────────────┐
│                 Ethereum Smart Contract (Solidity)          │
│   • HealthRecordHashes: Canonical hash proofs               │
│   • ConsentManagement: Patient-directed entity permissions  │
│   • PremiumRules: Dynamic mathematical formula              │
│   • ClaimsAdjudication: Transparent claims workflow         │
│   • WellnessRewards: Idempotent point distribution          │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
blockchain/
├── backend/                       # Node.js Express REST API
│   ├── src/
│   │   ├── app.js                 # Express application & API routes
│   │   ├── server.js              # HTTP server entry point (port 5000)
│   │   ├── blockchainService.js   # Ethers.js smart contract service
│   │   ├── dataLoader.js          # Mock data loader & file storage
│   │   ├── validation.js          # Multi-source tolerance validator & SHA-256 hasher
│   │   ├── rewards.js             # Daily wellness rewards calculation engine
│   │   └── config/contractConfig.json # Contract address & ABI exported from deploy
│   └── test/                      # 44 automated unit, integration & E2E tests
├── blockchain/                    # Hardhat Ethereum workspace
│   ├── contracts/
│   │   └── HealthChain.sol        # HealthChain core Solidity smart contract
│   ├── scripts/
│   │   └── deploy.cjs             # Automated deployment script with ABI export
│   ├── test/                      # 18 Hardhat unit tests
│   └── hardhat.config.cjs         # Hardhat configuration (Solidity 0.8.24)
├── frontend/                      # React 18 + Vite Single Page App
│   ├── src/
│   │   ├── components/            # UI components (Consent, Metrics, Claims, Rewards)
│   │   ├── App.jsx                # Dual-role dashboard (Patient / Insurer)
│   │   └── index.css              # Custom responsive stylesheet
│   └── vite.config.js             # Vite development configuration
├── data/                          # Seed datasets
│   ├── patients.json              # Demo patient profiles (P001, P002, P003)
│   ├── health-records.json        # Multi-source daily records (Fitbit, Smartwatch, Phone)
│   ├── policies.json              # Demo insurance policies
│   └── claims.json                # Insurance reimbursement claims
└── context/                       # Architectural specifications & progress tracker
```

---

## Prerequisites

- **Node.js**: v18.x, v20.x, or v24.x
- **npm**: v9.x or higher
- **Windows PowerShell Note**: If PowerShell script execution policy restricts `npm` or `npx`, use `npm.cmd` and `npx.cmd`.

---

## Quickstart Setup & Installation

Clone the repository and install dependencies in all three workspaces:

```bash
# 1. Install Blockchain dependencies
cd blockchain
npm install

# 2. Install Backend dependencies
cd ../backend
npm install

# 3. Install Frontend dependencies
cd ../frontend
npm install
```

---

## Running the Complete System Locally

To run the complete interactive platform with live local Ethereum blockchain:

### Terminal 1: Start Local Hardhat Blockchain Node
```bash
cd blockchain
npx hardhat node
```
*Starts a local Ethereum JSON-RPC node at `http://127.0.0.1:8545` with 20 pre-funded test accounts.*

### Terminal 2: Deploy Smart Contract
```bash
cd blockchain
npx hardhat run scripts/deploy.cjs --network localhost
```
*Deploys `HealthChain.sol` to the local network and automatically exports the contract address and ABI directly to `backend/src/config/contractConfig.json`.*

### Terminal 3: Start Backend API Server
```bash
cd backend
npm start
```
*Backend API server starts listening on `http://localhost:5000`.*

### Terminal 4: Start Frontend Application
```bash
cd frontend
npm run dev
```
*Vite dev server starts on `http://localhost:5173` (or configured local port).*

Open **http://localhost:5173** in your browser to view and interact with the application.

---

## 12-Step Evaluation & Demo Flow

The system comes pre-configured with a complete 12-step evaluation flow that can be executed interactively in the UI or verified via automated tests:

1. **Patient Selection**: Select demo patient `P001` (*Aarav Sharma*).
2. **View Multi-Source Health Records**: Inspect data from 3 independent sources (*Mock Fitbit*, *Mock Smartwatch*, *Mock Phone*) across steps, sleep hours, heart rate, and calories.
3. **Multi-Source Data Validation**:
   - For `2026-09-22`: All 3 sources fall within allowed statistical tolerances (±10% steps, ±1.0h sleep) → **Validated: True**.
   - For `2026-09-20`: Outlier detection catches a discrepant Smartwatch recording (3,000 steps vs ~10,400) → **Validated: False** (Anomaly flagged).
4. **Generate SHA-256 Hash**: The system computes a deterministic SHA-256 canonical hash of the validated consensus metrics.
5. **Write Hash to Blockchain**:
   - Anomaly days are strictly blocked from on-chain commitment.
   - Valid days write the 64-character SHA-256 hash to the blockchain ledger, returning a transaction hash and block confirmation.
6. **Grant Insurance Consent**: Patient toggles consent on-chain for the Insurer entity address (`0x3C44...`).
7. **Access Insurer Portal**: Switch the top navigation to **Insurer Portal**. The authorized patient selector dynamically filters only patients who have active on-chain consent.
8. **Dynamic Premium Calculation**: View patient policy `POL-1001`. The smart contract evaluates verified wellness metrics:
   - Base Premium: ₹10,000
   - Steps ≥ 10,000: -10% discount
   - Sleep ≥ 7h: -5% discount
   - **Final Dynamic Premium**: **₹8,500** (15% savings).
9. **Submit Claim**: Submit an insurance reimbursement claim (e.g., ₹15,000 for Preventive Health Evaluation). The claim is created with `Pending` status.
10. **Adjudicate Claim**: Insurer reviews and approves or rejects the claim on-chain with documented rationale.
11. **Award Wellness Rewards**:
    - Patient claims daily wellness reward (+150 points for achieving daily steps and sleep targets).
    - Contract validates eligibility and prevents duplicate claims for the same record via `keccak256(patientId, date)`.
12. **Verify Final Integrated State**: Review the live synchronization across on-chain record hashes, claim statuses, active consent, and accumulated wellness points.

---

## Automated Test Suites

The codebase includes full test coverage across all architectural layers:

### Run Backend Unit, Integration & E2E Tests
```bash
cd backend
npm test
```
*Executes 44 tests in `node:test` covering data loading, tolerance validation, canonical hashing, blockchain service, consent management, policy calculation, claims adjudication, wellness rewards, and the full 12-step end-to-end integration flow.*

### Run Blockchain Smart Contract Tests
```bash
cd blockchain
npx hardhat test
```
*Executes 18 Hardhat/Chai unit tests covering deployment, health record hashes, consent grant/revoke, dynamic premium formulas, claims lifecycle, and wellness rewards duplicate prevention.*

### Build Frontend Production Bundle
```bash
cd frontend
npm run build
```
*Compiles the complete React 18 production bundle cleanly in under 1 second.*

---

## API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/patients` | `GET` | Retrieve list of all demo patients |
| `/api/patients/:patientId` | `GET` | Retrieve single patient profile |
| `/api/health/:patientId` | `GET` | Retrieve patient health records |
| `/api/health/:patientId/sources` | `GET` | Retrieve multi-source breakdown grouped by date |
| `/api/health/:patientId/validation` | `GET` | Perform statistical tolerance validation & generate SHA-256 hash |
| `/api/health/:patientId/record` | `POST` | Validate and write canonical SHA-256 hash to blockchain |
| `/api/health/:patientId/record-onchain` | `GET` | Query on-chain health record hash by date |
| `/api/consent` | `POST` | Grant or revoke entity access consent on-chain |
| `/api/consent/:patientId` | `GET` | Query on-chain consent status for an entity address |
| `/api/insurance/authorized-patients` | `GET` | Filter patients who have granted on-chain insurer consent |
| `/api/policies/:patientId` | `GET` | Retrieve policy & calculate live smart-contract dynamic premium |
| `/api/claims` | `GET` / `POST` | Retrieve all claims or submit a new claim |
| `/api/claims/:claimId/approve` | `POST` | Approve insurance claim on-chain |
| `/api/claims/:claimId/reject` | `POST` | Reject insurance claim on-chain |
| `/api/rewards/:patientId` | `GET` | Query accumulated wellness reward points |
| `/api/rewards/:patientId/status` | `GET` | Check daily reward eligibility & on-chain claim status |
| `/api/rewards/:patientId/claim` | `POST` | Claim daily reward points on blockchain (idempotent) |
| `/api/blockchain/info` | `GET` | Query blockchain network connection and smart contract metadata |

---

## License

MIT License. Designed and built as a free, demonstration-ready academic MVP.
