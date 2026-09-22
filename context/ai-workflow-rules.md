# Health-Chain — AI Workflow Rules

1. Read all context files before implementing a new unit.
2. Work on exactly one build-plan unit at a time.
3. Implement only the scope defined by the active spec.
4. Do not invent requirements when a requirement is missing.
5. If a missing decision blocks implementation, ask for clarification or choose the smallest MVP-safe option and document it.
6. Do not add paid services.
7. Do not add production infrastructure.
8. Do not store raw health data on-chain.
9. Do not expose secrets in source code.
10. Keep frontend, backend, and blockchain responsibilities separated.
11. Add or update tests when changing backend or smart-contract behavior.
12. Run the relevant verification commands before marking a unit complete.
13. Update `context/progress-tracker.md` after each meaningful unit.
14. If architecture changes, update `context/architecture.md` before continuing.
15. Avoid unrelated refactoring while implementing a feature.
16. Prefer a working simple implementation over premature abstraction.
17. Do not silently replace mock data with paid or authenticated external APIs.
