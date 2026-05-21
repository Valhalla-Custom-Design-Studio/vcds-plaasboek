# Plaasboek™ — Pre-Launch Deployment Checklist
## Target: June 1, 2026

### Infrastructure
- [ ] PostgreSQL instance provisioned (Railway / Supabase / AWS RDS)
- [ ] DATABASE_URL set in production environment
- [ ] API server deployed (Railway / Render / AWS EC2)
- [ ] Domain configured: api.vcds.co.za
- [ ] SSL certificate active

### Payfast
- [ ] Live merchant credentials set in production env
- [ ] PAYFAST_NOTIFY_URL points to live API: https://api.vcds.co.za/api/payments/notify
- [ ] PAYFAST_RETURN_URL: https://app.vcds.co.za/payment/success
- [ ] PAYFAST_CANCEL_URL: https://app.vcds.co.za/payment/cancel
- [ ] ITN tested end-to-end in sandbox
- [ ] Live payment test completed (R1 test transaction)

### Security
- [ ] JWT_SECRET is strong random string (min 64 chars)
- [ ] .env.production NOT in git
- [ ] CORS restricted to app domain
- [ ] Helmet headers active
- [ ] Rate limiting added to auth routes

### Database
- [ ] Schema migrations run on production DB
- [ ] DB backups configured (daily)
- [ ] Connection pool sized correctly

### Mobile App
- [ ] API_URL points to production: https://api.vcds.co.za
- [ ] Expo build generated (EAS Build)
- [ ] App Store / Play Store submission ready

### QA Sign-off
- [ ] All KAN-XX QA tickets closed
- [ ] Regression pass complete
- [ ] Payment flow tested end-to-end
- [ ] Auth flow tested
- [ ] Subscription activation tested

### IP
- [ ] IP audit complete (IP-3 sign-off)
- [ ] No unprotected novel features in public build

---
*ODIN™ | VCDS™ | Wave 1 Sprint*
