/**
 * VCDS™ Rate Limit Config
 * Auth endpoints: 5 requests/minute (brute force protection)
 * General API: 100 requests/minute
 */
import { ThrottlerModule } from "@nestjs/throttler";

export const ThrottlerConfig = ThrottlerModule.forRoot([
  { name: "auth", ttl: 60000, limit: 5 },
  { name: "api",  ttl: 60000, limit: 100 },
]);
