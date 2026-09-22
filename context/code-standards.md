# Health-Chain — Code Standards

## General

- Prefer simple code over abstractions that are not needed by the MVP.
- Use clear descriptive names.
- Keep functions small and single-purpose.
- Avoid duplicated business rules.
- Do not add dependencies without a concrete need.

## JavaScript

- Use modern ES modules where supported.
- Use `async/await` for asynchronous operations.
- Validate API input before processing.
- Handle expected errors with useful HTTP status codes.
- Keep blockchain calls isolated in a service module.

## React

- Use functional components.
- Keep reusable UI components small.
- Keep API access separate from presentation components.
- Show loading, success, and error states.
- Do not put private blockchain credentials in frontend code.

## Solidity

- Keep contracts intentionally small.
- Add events for important state changes.
- Validate required inputs.
- Write tests for each public state-changing function.
- Do not store unnecessary strings or raw health data on-chain.

## API

Use JSON REST endpoints.

Suggested routes:

```text
GET  /api/health/:patientId
GET  /api/health/:patientId/validation
POST /api/health/:patientId/record
GET  /api/patients
POST /api/consent
GET  /api/policies/:patientId
POST /api/claims
GET  /api/claims/:patientId
GET  /api/rewards/:patientId
```

## Git

Use small feature branches:

```text
feat/01-foundation
feat/02-health-data
feat/03-validation
feat/04-blockchain
feat/05-insurance
feat/06-rewards
```

Commit messages should describe the change clearly.
