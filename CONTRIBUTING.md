# Contributing to UniMove

## Development setup

Use Node.js 22 and npm. MongoDB can run locally or through Docker.

```bash
cd backend
npm ci
npm run dev
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Copy each `.env.example` to `.env` and replace placeholder values before starting.

## Before opening a pull request

Run the same checks as CI:

```bash
cd frontend
npm run lint
npm run type-check
npm run test
npm run build

cd ../backend
npm run lint
npm run type-check
npm run test
npm run build
```

Keep pull requests focused, describe the user-visible impact, and include tests for changed behavior.
