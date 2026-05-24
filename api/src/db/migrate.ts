import { pool } from './pool';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // USERS — extended with all spec fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        "farmName" TEXT,
        role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer','worker','admin')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
        "farmerId" UUID REFERENCES users(id) ON DELETE SET NULL,
        "sosRadius" INT DEFAULT 10,
        latitude FLOAT,
        longitude FLOAT,
        language TEXT DEFAULT 'af',
        "plotNumber" TEXT,
        "gateLatitude" FLOAT,
        "gateLongitude" FLOAT,
        "nearestTown" TEXT,
        "alertRadiusKm" INT DEFAULT 10,
        "bloodType" TEXT,
        allergies TEXT,
        "chronicConditions" TEXT,
        medications TEXT,
        "medicalAidName" TEXT,
        "medicalAidNumber" TEXT,
        "nearestHospital" TEXT,
        "doctorName" TEXT,
        "doctorPhone" TEXT,
        tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro')),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        weather TEXT,
        "rainfallMm" FLOAT,
        activities TEXT,
        notes TEXT,
        "entryDate" TIMESTAMPTZ NOT NULL,
        "entryTime" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries("userId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries("entryDate")`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "journalEntryId" UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        cloud_storage_path TEXT NOT NULL,
        "isPublic" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rainfall_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        "amountMm" FLOAT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("userId", date)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS camps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        "currentCount" INT DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS livestock_changes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "campId" UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('addition','removal')),
        reason TEXT NOT NULL CHECK (reason IN ('birth','purchase','sale','death','theft')),
        quantity INT NOT NULL,
        notes TEXT,
        date TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('fuel','feed','vet','fencing','labour','equipment','other')),
        description TEXT NOT NULL,
        date DATE NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "farmerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        "idNumber" TEXT NOT NULL,
        position TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS worker_daily_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workerId" UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
        "farmerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        present BOOLEAN NOT NULL DEFAULT true,
        "hoursWorked" FLOAT,
        tasks TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("workerId", date)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vet_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "animalId" TEXT NOT NULL,
        treatment TEXT NOT NULL,
        medication TEXT NOT NULL,
        dosage TEXT NOT NULL,
        "withdrawalDays" INT NOT NULL DEFAULT 0,
        "visitDate" DATE NOT NULL,
        "safeDate" DATE NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        relationship TEXT,
        priority INT DEFAULT 0,
        "isDefault" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sos_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "farmName" TEXT NOT NULL,
        "sosType" TEXT NOT NULL DEFAULT 'general' CHECK ("sosType" IN ('attack','medical','fire','general')),
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        resolved BOOLEAN DEFAULT false,
        "resolvedBy" UUID REFERENCES users(id) ON DELETE SET NULL,
        "resolvedAt" TIMESTAMPTZ,
        "cancelledBySender" BOOLEAN DEFAULT false,
        "notifiedCount" INT DEFAULT 0,
        "smsCount" INT DEFAULT 0,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sos_acknowledgements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "sosEventId" UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "acknowledgedAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("sosEventId","userId")
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS dead_mans_switches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        armed BOOLEAN DEFAULT false,
        enabled BOOLEAN DEFAULT false,
        latitude FLOAT,
        longitude FLOAT,
        "timeoutMinutes" INT DEFAULT 60,
        "gracePeriodMinutes" INT DEFAULT 5,
        "intervalMinutes" INT DEFAULT 60,
        "armedAt" TIMESTAMPTZ,
        "lastHeartbeat" TIMESTAMPTZ,
        "firedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        "deviceType" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('[PLAASBOEK] Migrations complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PLAASBOEK] Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
