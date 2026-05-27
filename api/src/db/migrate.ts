import { pool } from './pool';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        "farmName" TEXT,
        role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer','admin')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
        tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro')),
        language TEXT NOT NULL DEFAULT 'af' CHECK (language IN ('af','en')),
        "plotNumber" TEXT,
        "gateLatitude" DOUBLE PRECISION,
        "gateLongitude" DOUBLE PRECISION,
        "nearestTown" TEXT,
        "alertRadiusKm" INTEGER DEFAULT 10,
        "bloodType" TEXT,
        allergies TEXT,
        "chronicConditions" TEXT,
        medications TEXT,
        "medicalAidName" TEXT,
        "medicalAidNumber" TEXT,
        "nearestHospital" TEXT,
        "doctorName" TEXT,
        "doctorPhone" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        tier_name TEXT NOT NULL CHECK (tier_name IN ('free','pro')),
        price_zar NUMERIC(10,2) NOT NULL DEFAULT 0,
        features JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES plans(id),
        payfast_payment_id TEXT,
        payfast_pf_payment_id TEXT,
        amount_gross NUMERIC(10,2),
        amount_fee NUMERIC(10,2),
        amount_net NUMERIC(10,2),
        item_name TEXT,
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','complete','failed','cancelled')),
        m_payment_id TEXT,
        custom_str1 TEXT,
        raw_itn JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES plans(id),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT,
        mood TEXT CHECK (mood IN ('great','good','neutral','bad','terrible')),
        weather TEXT,
        tags TEXT[],
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        r2_key TEXT NOT NULL,
        caption TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rainfall_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        mm NUMERIC(6,2) NOT NULL,
        gauge_id TEXT,
        notes TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS camps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        size_ha NUMERIC(10,2),
        camp_type TEXT,
        notes TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS livestock_changes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        camp_id UUID REFERENCES camps(id) ON DELETE SET NULL,
        animal_type TEXT NOT NULL,
        change_type TEXT NOT NULL CHECK (change_type IN ('birth','death','purchase','sale','transfer','treatment')),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC(10,2),
        notes TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vet_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        animal_type TEXT NOT NULL,
        treatment TEXT NOT NULL,
        vet_name TEXT,
        cost NUMERIC(10,2),
        visit_date DATE NOT NULL,
        next_due_date DATE,
        notes TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        receipt_r2_key TEXT,
        notes TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        id_number TEXT,
        role TEXT,
        phone TEXT,
        start_date DATE,
        daily_rate NUMERIC(10,2),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS worker_daily_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        hours_worked NUMERIC(4,2) NOT NULL DEFAULT 8,
        task TEXT,
        notes TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        relationship TEXT,
        phone TEXT NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sos_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual','dms','fall')),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','acknowledged','stood_down')),
        message TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sos_acknowledgements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sos_id UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
        responder_id UUID REFERENCES users(id) ON DELETE SET NULL,
        responder_name TEXT,
        responder_phone TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS dead_mans_switches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_armed BOOLEAN NOT NULL DEFAULT false,
        interval_minutes INTEGER NOT NULL DEFAULT 60,
        last_heartbeat TIMESTAMPTZ,
        trigger_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','armed','triggered')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        platform TEXT CHECK (platform IN ('ios','android')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        r2_key TEXT NOT NULL,
        original_name TEXT,
        mime_type TEXT,
        size_bytes INTEGER,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Seed default plans
    await client.query(`
      INSERT INTO plans (name, tier_name, price_zar, features) VALUES
        ('Free', 'free', 0, '["Journal (10 entries/month)","Rainfall tracking","Basic livestock","Emergency contacts"]'),
        ('Pro', 'pro', 149, '["Unlimited journal entries","Full livestock management","Worker management","Expense tracking & CSV export","SOS system","Dead Man Switch","R2 photo uploads","Priority support"]')
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
} catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
