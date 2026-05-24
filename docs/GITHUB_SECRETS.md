# GitHub Secrets Required for CI/CD

Set these in: GitHub → vcds-plaasboek → Settings → Secrets and variables → Actions

## Railway (API Deployment)
| Secret | Value |
|--------|-------|
| `RAILWAY_TOKEN` | `20cf5237-e65b-4c66-afb9-d916a004b816` |
| `RAILWAY_SERVICE_ID` | Get from Railway dashboard → Plaasboek service |

## Slack (Notifications)
| Secret | Value |
|--------|-------|
| `SLACK_BOT_TOKEN` | `xoxb-11164134193687-11190636862594-a6nrAYyF1s3l5q1jSrgZNxPt` |
| `SLACK_CHANNEL_ID` | Get from Slack → #vcds-ops → channel details |

## Environment Variables (set in Railway dashboard, NOT GitHub)
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `JWT_SECRET` | Generate: `openssl rand -hex 32` |
| `PAYFAST_MERCHANT_ID` | `11910323` |
| `PAYFAST_MERCHANT_KEY` | `f61uspt7vtdta` |
| `PAYFAST_PASSPHRASE` | `ValhallaCustoms1986` |
| `PAYFAST_SANDBOX` | `false` |
| `R2_ACCOUNT_ID` | `5aad73a7b1178f7db26f220ec21ac13e` |
| `R2_ACCESS_KEY_ID` | `7532f99b1f600b12f1def4926108acf3` |
| `R2_SECRET_ACCESS_KEY` | `84f58a1447b7c9de505cb216b12bbafc7b3e7a2e7c9b01d8083b366dbccc8627` |
| `R2_BUCKET` | `lingering-glade-2094` |
| `R2_PUBLIC_URL` | `https://pub-lingering-glade-2094.r2.dev` |
| `APP_ORIGIN` | `plaasboek://` |
| `API_URL` | `https://plaasboek-api.railway.app/api` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
