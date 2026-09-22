# Unit 03: Health Validation

## Goal

Validate the three mock health sources and generate a deterministic hash for a validated health record.

## Implementation

For each selected date/patient:
1. Load the three source records.
2. Compare steps, heart rate, sleep, and calories using reasonable tolerances.
3. Return `validated: true/false`.
4. Create a canonical JSON representation.
5. Generate a SHA-256 hash.
6. Return the validation result and hash.

## Verify when done

- [ ] Identical input produces the same hash.
- [ ] Modified input produces a different hash.
- [ ] Out-of-tolerance source data is rejected.
- [ ] Valid data is accepted.
- [ ] Raw data is not sent to blockchain code.
