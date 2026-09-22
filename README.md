# Health-Chain 🏥⛓️
> **Decentralized, Privacy-Preserving Health Data Validation & Dynamic Insurance Platform**

[![Tests](https://img.shields.io/badge/Tests-62%2F62%20Passing-brightgreen.svg)](#automated-testing-suite)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg?logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20Express-black.svg?logo=node.js)](https://expressjs.com/)
[![Ethers](https://img.shields.io/badge/Web3-Ethers.js%20v6-blue.svg)](https://docs.ethers.org/v6/)
[![Hardhat](https://img.shields.io/badge/Blockchain-Hardhat-yellow.svg)](https://hardhat.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Table of Contents
1. [Executive Summary & Problem Statement](#executive-summary--problem-statement)
2. [Core Architecture & Privacy Invariants](#core-architecture--privacy-invariants)
3. [Feature Guide: What You See on the Screen](#feature-guide-what-you-see-on-the-screen)
4. [Prerequisites & Windows Setup Notice](#prerequisites--windows-setup-notice)
5. [Quickstart: How to Run the Project](#quickstart-how-to-run-the-project)
6. [12-Step Evaluation & Presentation Walkthrough](#12-step-evaluation--presentation-walkthrough)
7. [Automated Testing Suite (62 Tests)](#automated-testing-suite)
8. [Complete REST API Reference](#complete-rest-api-reference)
9. [Troubleshooting & FAQs](#troubleshooting--faqs)
10. [Repository Structure](#repository-structure)

---

## Executive Summary & Problem Statement

Traditional healthcare and health insurance suffer from four critical challenges:

1. **Medical Privacy Violations**: Storing raw patient biometrics in centralized databases or on public blockchains creates severe data-leak risks and violates privacy laws (GDPR, HIPAA).
2. **Fitness Tracking Fraud**: When insurers reward policyholders for daily steps, users can easily spoof pedometers (e.g., shaking an isolated fitness band) to game discounts.
3. **Lack of Patient Sovereignty**: Patients have zero cryptographic control over which third parties, underwriters, or hospitals view their records.
4. **Static, Unfair Premiums**: Policyholders pay uniform high premiums regardless of their verified daily preventative wellness habits.

### The Health-Chain Solution
Health-Chain introduces an academic and industrial MVP proving how **off-chain multi-source consensus**, **deterministic SHA-256 cryptographic hashing**, and **Ethereum smart contracts** solve all four issues simultaneously:
- **Zero Raw Data On-Chain**: Raw vitals remain off-chain; only 64-character SHA-256 digests are committed to Ethereum.
- **Anti-Spoofing Cross-Verification**: Telemetry from 3 independent sources (*Fitbit, Smartwatch, Phone*) is evaluated using statistical tolerance thresholds (±10% steps, ±1.0h sleep) before hashing.
- **Smart Contract Access Control**: Insurers are blocked from viewing patient data until the patient explicitly signs an on-chain consent transaction.
- **Automated Dynamic Underwriting**: The Solidity contract evaluates verified wellness milestones to dynamically discount annual premiums (up to 15% savings) and distribute idempotent wellness tokens.

---

## Core Architecture & Privacy Invariants

```text
┌────────────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE (React 18 + Vite)                 │
│   • Patient Portal: Vitals, Consensus Status, On-Chain Recording, Rewards   │
│   • Insurer Portal: Consent Filter, Smart Premium Underwriting, Claims  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST API (Proxy: localhost:3000 -> 5000)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    BACKEND APPLICATION (Node.js + Express)             │
│   • Multi-Source Data Ingestion (Fitbit, Smartwatch, Phone)            │
│   • Statistical Tolerance Engine (Anomaly & Tamper Detection)          │
│   • Deterministic Canonical Serializer & SHA-256 Hasher                │
│   • Local Claims Store & In-Memory State Cache                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Ethers.js v6 JSON-RPC (localhost:8545)
┌───────────────────────────────────▼────────────────────────────────────┐
│                 ETHEREUM SMART CONTRACT (Solidity 0.8.24)              │
│   • HealthRecordHashes: Canonical digest ledger                        │
│   • ConsentManagement: Patient-directed entity permissions             │
│   • PremiumRules: Dynamic mathematical discount formula                │
│   • ClaimsLifecycle: Transparent State Machine (Pending/Approved/Reject)│
│   • WellnessRewards: Idempotent point minting (prevents double-claims) │
└────────────────────────────────────────────────────────────────────────┘
```

### The 4 Architectural Invariants
1. **The Privacy Invariant**: Raw medical measurements (steps, heart rate, sleep duration, calories) **NEVER** touch Ethereum. Only the deterministic SHA-256 hash of the canonical JSON record is saved on-chain.
2. **The Integrity Invariant**: If telemetry from any wearable device exceeds statistical tolerance limits (e.g. outlier steps), the backend classifies the day as an **Integrity Anomaly** and **strictly forbids** writing to the blockchain.
3. **The Consent Invariant**: An insurer cannot query a patient's policy or records unless `hasConsent(patientId, insurerAddress)` returns `true` on the smart contract.
4. **The Idempotency Invariant**: Wellness rewards use a deterministic key (`keccak256(patientId, date)`) ensuring a patient can only claim rewards once per valid calendar date.

---

## Feature Guide: What You See on the Screen

### Patient Portal (`http://localhost:3000`)

| UI Element | What It Represents | Real-World Purpose |
| :--- | :--- | :--- |
| **Demo Patient Selector** | Switch between `P001` (Aarav Sharma), `P002` (Priya Patel), and `P003` (Rohan Verma). | Simulates different policyholders with varying health metrics and wallet addresses. |
| **Date Switcher** | Select between `2026-09-22`, `2026-09-21`, or `2026-09-20 (Anomaly)`. | Demonstrates consistent normal days versus an anti-fraud anomaly test day. |
| **Daily Consensus Metrics** | Displays verified daily averages (e.g., 10,427 steps, 7.4h sleep). | Aggregated view synthesized across all active wearable devices. |
| **IoT Device Comparison Table** | Shows raw telemetry side-by-side: *Mock Fitbit*, *Mock Smartwatch*, *Mock Phone*. | Proves cross-device verification. If one device is spoofed or hacked, the discrepancy is exposed immediately. |
| **Integrity Anomaly Banner** *(on 2026-09-20)* | Bright red alert showing discrepancy percentages. | Demonstrates automated rejection of tampered fitness tracking data. |
| **Blockchain Cryptographic Proof** | Shows the 64-character canonical SHA-256 digest with **"Record Hash on Blockchain"** button. | Creates an immutable cryptographic proof on Ethereum without exposing private medical details. |
| **Smart Contract Access Consent** | Toggle button allowing the patient to **Grant** or **Revoke** insurer access on-chain. | Restores data sovereignty to the patient. Access is enforced by smart contract logic, not central servers. |
| **Wellness Rewards & Points** | Interactive widget showing total points and a **"Claim Points"** button. | Motivates preventative healthy habits with automated points that prevent duplicate claims. |

---

### Insurer Portal (`http://localhost:3000` -> Click "Insurer Portal" Top-Right)

| UI Element | What It Represents | Real-World Purpose |
| :--- | :--- | :--- |
| **Authorized Consenting Patients** | Dropdown listing only policyholders who granted active on-chain consent. | Insurers cannot view non-consenting patients (`P002` and `P003` are hidden until authorized). |
| **Smart Contract Premium Calculation** | Live underwriting card showing base premium (₹10,000) discounted to **₹8,500**. | Evaluates on-chain verified activity: -10% for steps $\ge$ 10,000 and -5% for sleep $\ge$ 7 hours. |
| **Policy Claims Adjudication Table** | Audit table showing claim ID, patient, amount, description, status, and action buttons. | Provides a transparent, tamper-proof audit trail for medical insurance reimbursement. |
| **"Submit New Claim" Modal** | Pop-up form enabling patients or clinics to submit reimbursement requests. | Adds claims with `Pending` status and broadcasts a `ClaimSubmitted` event on Ethereum. |
| **Approve / Reject Buttons** | Adjudicator actions requiring documented decision rationale. | Transitions claim status on-chain to `Approved` or `Rejected` with an immutable audit note. |

---

## Prerequisites & Windows Setup Notice

- **Node.js**: v18.x, v20.x, or v24.x installed.
- **npm**: v9.x or higher installed.

### ⚠️ Windows PowerShell Notice
On Windows, PowerShell restricts the execution of `.ps1` scripts by default. If typing `npm` or `npx` gives a red security error:
- **Solution A**: Use **`npm.cmd`** and **`npx.cmd`** in PowerShell.
- **Solution B**: Open standard **Command Prompt (`cmd.exe`)** or **Git Bash**, where standard `npm` and `npx` work without restrictions.
- **Solution C**: Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell once as Administrator.

---

## Quickstart: How to Run the Project

Follow these steps to launch the entire platform from scratch with a local Ethereum blockchain:

### Step 1: Install Dependencies (One-Time Setup)
Open your terminal in the root folder (`c:\Users\priya\Downloads\blockchain`):

```powershell
# 1. Install Blockchain dependencies
cd blockchain
npm.cmd install

# 2. Install Backend dependencies
cd ..\backend
npm.cmd install

# 3. Install Frontend dependencies
cd ..\frontend
npm.cmd install

# Return to root directory
cd ..
```

---

### Step 2: Start the System (4 Terminals)

Open **4 separate terminal windows or tabs** and run one command in each:

#### 🖥️ Terminal 1: Start Local Ethereum Node
```powershell
cd blockchain
npx.cmd hardhat node
```
*Starts a local JSON-RPC Ethereum blockchain at `http://127.0.0.1:8545` with 20 pre-funded test accounts.*

#### ⛓️ Terminal 2: Deploy Smart Contract
```powershell
cd blockchain
npx.cmd hardhat run scripts/deploy.cjs --network localhost
```
*Deploys `HealthChain.sol` and automatically exports the contract address (`0x5FbDB...`) and ABI to `backend/src/config/contractConfig.json`.*

#### 🚀 Terminal 3: Start Backend API Server
```powershell
cd backend
npm.cmd start
```
*Starts the Express REST API server listening on **http://localhost:5000**.*

#### 💻 Terminal 4: Start Frontend Dev Server
```powershell
cd frontend
npm.cmd run dev
```
*Starts the Vite React dev server on **http://localhost:3000**.*

---

### Step 3: Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** in Google Chrome, Microsoft Edge, or Firefox.

---

## 12-Step Evaluation & Presentation Walkthrough

Use this sequential 12-step flow when presenting the project for an evaluation or demonstration:

1. **Select Patient**: Select `P001` (*Aarav Sharma*) on date `2026-09-22`.
2. **Review IoT Consensus**: Observe that all 3 sources (*Mock Fitbit*, *Mock Smartwatch*, *Mock Phone*) agree within 10% tolerance $\rightarrow$ Green badge **"3/3 Sources Consistent"**.
3. **Demonstrate Anti-Spoofing Anomaly**: Switch date pill to `2026-09-20 (Anomaly)`. Show that the red banner highlights a 139.6% step discrepancy and blocks on-chain commitment.
4. **Return to Valid Day**: Switch back to `2026-09-22`.
5. **Record Hash On-Chain**: Click **"Record Hash on Blockchain"**. Observe the confirmed transaction hash and block number written to Ethereum.
6. **Grant Insurance Consent**: In the Smart Contract Access Consent card, click **"Grant Consent"**.
7. **Switch to Insurer Portal**: Click the **"Insurer Portal"** button in the header.
8. **Verify Access Control**: Note that only `P001: Aarav Sharma` appears in the authorized list; unconsented patients are completely hidden.
9. **Show Dynamic Premium Underwriting**: Point out the live discount calculation:
   - Base Premium: ₹10,000
   - 10,427 steps logged ($\ge$ 10,000): **-10% (-₹1,000)**
   - 7.4h sleep logged ($\ge$ 7.0h): **-5% (-₹500)**
   - **Final Dynamic Premium**: **₹8,500 (15% savings)**.
10. **Submit Reimbursement Claim**: Click **"+ New Claim"**. Enter Amount `4000` and Description `Diagnostic lab panel and specialist consult`.
11. **Adjudicate Claim**: In the claims table, click **"Approve"** (enter reason `Verified under preventative care benefits`). Observe status change to `Approved`.
12. **Claim Wellness Points**: Switch back to **Patient Portal**. Click **"Claim +150 Points"**. Note that points are awarded and the contract prevents duplicate claims for the same date.

---

## Automated Testing Suite

The repository features comprehensive automated test coverage across all architectural tiers:

### Run All 62 Tests from Root (One Command)
```powershell
npm.cmd test
```
*Executes both the Hardhat smart contract test suite and backend E2E integration test suite sequentially in ~4 seconds.*

### Run Subsystem Tests Independently
```powershell
# Run 18 Hardhat Smart Contract Unit Tests
cd blockchain
npx.cmd hardhat test

# Run 44 Backend Unit, Integration, and 12-Step E2E Tests
cd backend
npm.cmd test

# Build Frontend Production Bundle
cd frontend
npm.cmd run build
```

---

## Complete REST API Reference

The backend runs on `http://localhost:5000` (and is proxied transparently by Vite from `http://localhost:3000/api`):

| Endpoint | Method | Parameters | Description |
| :--- | :---: | :--- | :--- |
| `/api/health` | `GET` | — | System heartbeat and operational status |
| `/api/patients` | `GET` | — | Retrieve list of all demo patients (`P001`, `P002`, `P003`) |
| `/api/patients/:patientId` | `GET` | `patientId` | Retrieve single patient profile details |
| `/api/health/:patientId` | `GET` | `patientId`, `date?` | Retrieve patient health telemetry records |
| `/api/health/:patientId/sources` | `GET` | `patientId`, `date?` | Retrieve multi-source breakdown grouped by wearable device |
| `/api/health/:patientId/validation` | `GET` | `patientId`, `date?` | Perform statistical tolerance checks and compute SHA-256 hash |
| `/api/health/:patientId/record` | `POST` | `patientId`, `{ date }` | Validate telemetry and commit SHA-256 hash to blockchain |
| `/api/health/:patientId/record-onchain`| `GET` | `patientId`, `date` | Query on-chain health record digest and timestamp |
| `/api/consent` | `POST` | `{ patientId, entityAddress, granted }` | Grant or revoke entity access consent on smart contract |
| `/api/consent/:patientId` | `GET` | `patientId`, `entity` | Query whether an insurer address currently has consent |
| `/api/insurance/authorized-patients` | `GET` | `entity?` | Filter patients who have granted active on-chain consent |
| `/api/policies/:patientId` | `GET` | `patientId` | Retrieve policy and calculate live dynamic discounted premium |
| `/api/claims` | `GET` | — | Retrieve all insurance claims |
| `/api/claims/:patientId` | `GET` | `patientId` | Retrieve claims filtered by patient |
| `/api/claims` | `POST` | `{ policyId, patientId, amount, description }` | Submit a new claim and broadcast to blockchain |
| `/api/claims/:claimId/approve` | `POST` | `claimId`, `{ reason }` | Approve insurance claim on-chain |
| `/api/claims/:claimId/reject` | `POST` | `claimId`, `{ reason }` | Reject insurance claim on-chain |
| `/api/rewards/:patientId` | `GET` | `patientId` | Query total accumulated wellness reward points |
| `/api/rewards/:patientId/status` | `GET` | `patientId`, `date` | Check daily reward eligibility and on-chain claim status |
| `/api/rewards/:patientId/claim` | `POST` | `patientId`, `{ date }` | Award daily wellness reward points on Ethereum |
| `/api/blockchain/info` | `GET` | — | Retrieve blockchain connection info and contract address |

---

## Troubleshooting & FAQs

#### Q1: Why does PowerShell say `npm.ps1 cannot be loaded`?
**A**: Windows PowerShell execution policy restricts script execution. Use `npm.cmd` and `npx.cmd` instead, or run Command Prompt (`cmd.exe`).

#### Q2: What port does each service run on?
- **Hardhat Blockchain Node**: `http://127.0.0.1:8545`
- **Express Backend API**: `http://localhost:5000`
- **React Frontend UI**: `http://localhost:3000`

#### Q3: Why is my patient hidden in the Insurer Portal?
**A**: This is intentional! The insurer portal strictly queries `hasConsent()` on the smart contract. Go to the **Patient Portal**, choose that patient, and click **"Grant Consent"**. Return to the Insurer Portal and the patient will immediately appear.

#### Q4: Why can't I record data for `2026-09-20` on the blockchain?
**A**: `2026-09-20` has a deliberate discrepancy (one wearable logged an outlier). Health-Chain strictly rejects committing unvalidated or inconsistent data to protect blockchain data integrity.

---

## Repository Structure

```text
blockchain/
├── backend/                              # Express REST API
│   ├── src/
│   │   ├── app.js                        # API routes & endpoint definitions
│   │   ├── server.js                     # HTTP server entry (port 5000)
│   │   ├── blockchainService.js          # Ethers.js v6 smart contract service wrapper
│   │   ├── dataLoader.js                 # File access & mock data store
│   │   ├── validation.js                 # Tolerance engine & SHA-256 canonical hasher
│   │   ├── rewards.js                    # Daily wellness reward calculation engine
│   │   └── config/contractConfig.json    # Deployed contract address & ABI
│   └── test/                             # 44 automated backend & E2E tests
├── blockchain/                           # Hardhat Ethereum Workspace
│   ├── contracts/
│   │   └── HealthChain.sol               # Core Solidity smart contract
│   ├── scripts/
│   │   └── deploy.cjs                    # Contract deployment script & ABI exporter
│   ├── test/                             # 18 Hardhat/Chai unit tests
│   └── hardhat.config.cjs                # Hardhat configuration (Solidity 0.8.24)
├── frontend/                             # React 18 + Vite Single Page App
│   ├── src/
│   │   ├── components/                   # UI components (Metrics, Claims, Consent, Rewards)
│   │   ├── App.jsx                       # Dual-role portal switcher & layout
│   │   └── index.css                     # Custom responsive dark-mode styling
│   └── vite.config.js                    # Vite dev server configuration (port 3000)
├── data/                                 # Seed datasets
│   ├── patients.json                     # Demo patient profiles (P001, P002, P003)
│   ├── health-records.json               # Multi-device IoT records (Fitbit, Smartwatch, Phone)
│   ├── policies.json                     # Health insurance policy definitions
│   └── claims.json                       # Insurance reimbursement claims
└── context/                              # Architectural specification docs
```

---

## License

This project is licensed under the **MIT License** — free and open for educational and evaluation purposes.
