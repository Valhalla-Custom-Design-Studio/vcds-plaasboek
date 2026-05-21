# Plaasboek™

> Part of the VCDS™ Wave 1 Launch — June 1, 2026

## Stack
- **Mobile**: React Native (Expo ~52)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 16
- **Payments**: Payfast (ZAR subscriptions)
- **Auth**: JWT + bcrypt
- **State**: Zustand + React Query

## Quick Start (Local Dev)

```bash
# 1. Clone and install
npm install

# 2. Start backend + DB
docker-compose up -d

# 3. Run migrations
npm run migrate

# 4. Start mobile app
npm start
```

## Environment Variables
Copy `.env.development` to `.env` for local dev.
See `.env.example` for all required variables.
**Never commit `.env.production`.**

## Branch Strategy
- `main` — production only (June 1, 2026 launch)
- `develop` — integration branch
- `feat/KAN-XX-*` — feature branches
- `qa/KAN-XX-*` — QA branches

## Commit Format
```
feat(KAN-XX): description — AGENT-ID
fix(KAN-XX): description — AGENT-ID
test(KAN-XX): description — AGENT-ID
```

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/users/me` | JWT | User profile |
| PATCH | `/api/users/me` | JWT | Update profile |
| POST | `/api/payments/initiate` | JWT | Start Payfast payment |
| POST | `/api/payments/notify` | None | Payfast ITN webhook |
| GET | `/api/payments/tiers` | None | Available tiers |
| GET | `/api/subscriptions/me` | JWT | Current subscription |
| GET | `/health` | None | Health check |

## Payfast Integration
- **Sandbox**: `https://sandbox.payfast.co.za/eng/process`
- **Production**: `https://www.payfast.co.za/eng/process`
- ITN webhook: `POST /api/payments/notify`

---
*VCDS™ — Valhalla Custom Design Studios | ODIN™ CTO/COO*
