# Health-Chain — AI Build Context

Read these files before implementing or making architectural decisions:

1. `context/project-overview.md` — product definition, goals, features, scope
2. `context/architecture.md` — system structure, storage, blockchain, boundaries
3. `context/ui-context.md` — visual language and component conventions
4. `context/code-standards.md` — implementation rules
5. `context/ai-workflow-rules.md` — development workflow and scoping rules
6. `context/progress-tracker.md` — current project state
7. `context/specs/00-build-plan.md` — implementation order

Rules:
- Work on one spec unit at a time.
- Do not add features outside the current spec.
- Do not introduce paid services.
- Do not store raw health data on-chain.
- Update `context/progress-tracker.md` after meaningful implementation changes.
- If implementation changes architecture or scope, update the relevant context file first.
