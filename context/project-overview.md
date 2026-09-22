# Health-Chain — Project Overview

## Overview

Health-Chain is a free-to-run MVP demonstrating how fitness/health data can be validated, hashed, recorded on Ethereum, and used by a simple insurance workflow. Health data is generated locally to simulate a Fitbit/IoT source. The MVP demonstrates patient consent, tamper-evident health records, simple premium calculation, insurance claims, multi-source validation, and wellness rewards.

This is a college/capstone prototype, not a production healthcare or insurance system.

## Goals

1. Demonstrate an end-to-end health-data-to-blockchain workflow.
2. Simulate fitness API data without paid external APIs.
3. Store raw health data off-chain and only store hashes/metadata on-chain.
4. Demonstrate patient consent and insurance access.
5. Automate a simple insurance premium calculation with a Solidity contract.
6. Demonstrate claim submission and approval.
7. Demonstrate multi-source health-data validation.
8. Demonstrate wellness rewards.
9. Keep the entire MVP free to run locally, using Ethereum Sepolia only if blockchain deployment is desired.

## Core User Flow

1. Open the application.
2. Select a demo patient.
3. View generated health data.
4. Validate the patient's data against multiple mock sources.
5. Generate a hash for the validated health record.
6. Record the hash on the Ethereum testnet through the smart contract.
7. Patient grants or revokes insurance access.
8. Insurance dashboard displays authorized patient information.
9. Smart contract calculates a simple premium.
10. Patient/insurer submits an insurance claim.
11. Claim is approved or rejected according to simple policy rules.
12. Wellness rules award points for healthy activity.

## Features

### Patient
- Demo patient selection
- Health metrics dashboard
- Multi-source validation result
- Blockchain record/hash display
- Grant/revoke insurance consent
- Wellness points

### Insurance
- Authorized patient list
- Premium calculation
- Policy view
- Claim submission
- Claim status

### Blockchain
- Health-record hash storage
- Timestamp and source metadata
- Consent status
- Policy/premium information
- Claim status
- Wellness reward event/data

## In Scope

- React frontend
- Node.js + Express backend
- Local JSON data storage
- Generated mock health data
- Solidity smart contract
- Hardhat development setup
- ethers.js integration
- Ethereum Sepolia testnet support
- MetaMask connection
- Simple rule-based validation
- Simple premium rules
- Simple claims workflow
- Wellness points

## Out of Scope

- Real medical diagnosis
- Real insurance payouts
- Real patient medical records
- Real Fitbit OAuth/API integration
- HIPAA/GDPR certification
- Production security
- Paid cloud services
- Paid APIs
- Custom blockchain network
- Real cryptocurrency/token economics
- ML-based medical risk prediction
- Hospital integration
- Production deployment

## Success Criteria

- The app starts locally with documented commands.
- Demo health data can be viewed in the patient dashboard.
- Three mock sources can be compared and validated.
- A validated record produces a deterministic hash.
- The hash can be written to the deployed/test smart contract.
- Consent can be granted and revoked.
- A premium can be calculated from defined rules.
- A claim can be submitted and its status changed.
- Wellness points can be calculated.
- The main workflows can be demonstrated without paid services.
