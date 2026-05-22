# Documentation screenshots

## Accounts (built into script; override via `.env.docs-screenshots.local`)

| Role | Username | Used for |
|------|----------|----------|
| ADMIN | admin | Dashboard, attendance, leaves, overtime-manage, man-hours approval, employees, payroll admin, calendar, users, settings, notifications, profile |
| EMPLOYEE | emp50 | My overtime, my man hours, employee payroll |
| HR_ADMIN | emp27 | Fallback only if ADMIN cannot open a page |

**2FA must be off** for login during capture (`enable_2fa_login_email` in Settings).

## Run

```bash
cd Frontend
npm install
npm run docs:screenshots:install   # once
npm run dev                        # terminal 1
# backend already on :3003
npm run docs:screenshots           # terminal 2
```

Screenshots save to `public/docs/screenshots/{section-id}.png` with red highlight rings and arrows on key UI areas.

Console output marks each file `✓ SUCCESS` or `✗ FAILED`. Exit code 1 if any capture is missing.
