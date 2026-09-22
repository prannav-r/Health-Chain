# Health-Chain — UI Context

## Design Direction

Clean healthcare dashboard with a technical blockchain feel. The interface should look like a student-built product MVP rather than a medical production system.

## Colors

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#F5F7FA` | Page background |
| `--surface` | `#FFFFFF` | Cards and panels |
| `--text` | `#172033` | Primary text |
| `--muted` | `#667085` | Secondary text |
| `--primary` | `#2563EB` | Primary actions |
| `--success` | `#16A34A` | Verified/success |
| `--warning` | `#D97706` | Pending/warning |
| `--danger` | `#DC2626` | Error/rejected |
| `--border` | `#E5E7EB` | Borders |

## Typography

Use a system sans-serif stack.

- Page title: 28–32px
- Section title: 18–22px
- Body: 14–16px
- Metadata: 12–13px

## Layout

- Desktop: centered dashboard with optional sidebar.
- Mobile: single-column cards.
- Use consistent spacing of 8px increments.
- Cards should use 10–12px border radius.
- Avoid excessive gradients and decorative elements.

## Components

Required reusable components:
- MetricCard
- StatusBadge
- DataTable
- ConsentToggle
- ClaimCard
- PremiumCard
- BlockchainRecord
- SourceComparison

## States

Every asynchronous operation should show:
- Loading
- Success
- Error

Blockchain transaction states should show:
- Wallet disconnected
- Awaiting signature
- Transaction submitted
- Transaction confirmed
- Transaction failed
