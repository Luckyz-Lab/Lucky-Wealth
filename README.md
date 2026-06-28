# Lucky Wealth

Professional calculator hub for Thai personal finance and tax filing preparation. The React app is the maintained source of truth; `personal-wealth-hub.html` is kept only as a legacy standalone demo.

## Current Scope

- Dashboard for income, expenses, assets, debts, liquidity, DTI, savings rate, and net worth
- Tax estimator for PND-style personal income planning with deduction inputs
- Loan payoff and refinance scenarios
- Retirement projection with adjustable assumptions
- Document checklist and JSON backup/import with validation
- Local rule-based advisor; no direct LLM API call from the browser

Tax results are estimates only. Do not treat the app as a verified tax filing system until the formulas are checked against official Revenue Department rules for the target tax year and covered by golden test cases.

## React Project

```bash
cd react-project
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Tests:

```bash
npm test
```

## Architecture

```text
src/
  components/
    layout/        AppShell, Sidebar, MobileNav, PageHeader
    ui/            Button, Card, MetricCard, Badge, inputs, tabs, table, progress, dialog
  domain/          finance, tax, loans, retirement, advisor, formatting
  features/        dashboard, tax, loans, retirement, vault, ai
  hooks/           persistent localStorage state, migration, import validation
  lib/             default state and compatibility exports
  types.ts         app data and result types
```

## Data And Security Notes

- Data is stored in `localStorage` under `lucky_wealth_state_v2`
- Import validates the minimum app shape before replacing state
- Export downloads a JSON backup
- The advisor runs locally. If LLM integration is added later, use a backend proxy with key management and explicit user consent before sending portfolio data out.

## Repository Notes

This folder is now intended to be its own Git repository and should point at:

```bash
git remote add origin https://github.com/Luckyz-Lab/Lucky-Wealth.git
```
