
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  preferred_locale VARCHAR(5) DEFAULT 'af',
  tier VARCHAR(20) DEFAULT 'free',
  farm_name VARCHAR(100),
  vat_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  tier_name VARCHAR(20) NOT NULL CHECK (tier_name IN ('free','pro')),
  price_zar DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  next_billing_date TIMESTAMPTZ,
  payfast_subscription_token VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  amount_zar DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  payfast_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FARM RECORDS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farm_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount_zar DECIMAL(12,2) NOT NULL,
  vat_amount DECIMAL(12,2) DEFAULT 0,
  receipt_url TEXT,
  voice_transcript TEXT,
  ai_parsed BOOLEAN DEFAULT false,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tax_year INT,
  tags TEXT[],
  farm_section VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BUDGETS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  budget_amount DECIMAL(12,2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly',
  tax_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMMODITY ALERTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commodity_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commodity VARCHAR(50) NOT NULL,
  target_price DECIMAL(12,2) NOT NULL,
  direction VARCHAR(10) DEFAULT 'above',
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AGRIFINANCE SCORES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agrifinance_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  grade VARCHAR(5),
  income_stability DECIMAL(5,2),
  expense_ratio DECIMAL(5,2),
  profit_trend VARCHAR(20),
  recommendation TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_records_user ON farm_records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON farm_records(record_date);
CREATE INDEX IF NOT EXISTS idx_records_type ON farm_records(type);
CREATE INDEX IF NOT EXISTS idx_records_taxyear ON farm_records(tax_year);
