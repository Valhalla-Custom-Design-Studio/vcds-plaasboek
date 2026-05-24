CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  farm_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'farmer' CHECK (role IN ('farmer','worker','admin')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sos_radius INT DEFAULT 10,
  latitude FLOAT,
  longitude FLOAT,
  language VARCHAR(5) DEFAULT 'af',
  plot_number VARCHAR(100),
  gate_latitude FLOAT,
  gate_longitude FLOAT,
  nearest_town VARCHAR(255),
  alert_radius_km INT DEFAULT 10,
  blood_type VARCHAR(10),
  allergies TEXT,
  chronic_conditions TEXT,
  medications TEXT,
  medical_aid_name VARCHAR(255),
  medical_aid_number VARCHAR(100),
  nearest_hospital VARCHAR(255),
  doctor_name VARCHAR(255),
  doctor_phone VARCHAR(20),
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free','pro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_farmer_id ON users(farmer_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);

-- ─── JOURNAL ENTRIES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weather VARCHAR(50),
  rainfall_mm FLOAT,
  activities TEXT,
  notes TEXT,
  entry_date DATE NOT NULL,
  entry_time VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, entry_date);

-- ─── JOURNAL PHOTOS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  cloud_storage_path TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_photos_entry ON journal_photos(journal_entry_id);

-- ─── RAINFALL ENTRIES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rainfall_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_mm FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_rainfall_user_id ON rainfall_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_rainfall_date ON rainfall_entries(date);

-- ─── CAMPS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS camps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  current_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_camps_user_id ON camps(user_id);

-- ─── LIVESTOCK CHANGES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS livestock_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camp_id UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('addition','removal')),
  reason VARCHAR(20) NOT NULL CHECK (reason IN ('birth','purchase','sale','death','theft')),
  quantity INT NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_livestock_camp_id ON livestock_changes(camp_id);
CREATE INDEX IF NOT EXISTS idx_livestock_user_id ON livestock_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_livestock_date ON livestock_changes(date);

-- ─── EXPENSES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('fuel','feed','vet','fencing','labour','equipment','other')),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);

-- ─── WORKERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  id_number VARCHAR(13) NOT NULL,
  position VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workers_farmer_id ON workers(farmer_id);

-- ─── WORKER DAILY LOGS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS worker_daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  hours_worked FLOAT,
  tasks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, date)
);
CREATE INDEX IF NOT EXISTS idx_worker_logs_worker_id ON worker_daily_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_logs_farmer_id ON worker_daily_logs(farmer_id);
CREATE INDEX IF NOT EXISTS idx_worker_logs_date ON worker_daily_logs(date);

-- ─── VET VISITS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vet_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  animal_id VARCHAR(100) NOT NULL,
  treatment TEXT NOT NULL,
  medication VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  withdrawal_days INT NOT NULL DEFAULT 0,
  visit_date DATE NOT NULL,
  safe_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vet_visits_user_id ON vet_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_vet_visits_visit_date ON vet_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_vet_visits_safe_date ON vet_visits(safe_date);

-- ─── EMERGENCY CONTACTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('saps','ambulance','fire','neighbourhood','friend','security','farmwatch','medical','family','other')),
  relationship VARCHAR(100),
  priority INT DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_category ON emergency_contacts(category);

-- ─── SOS EVENTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_name VARCHAR(255) NOT NULL,
  sos_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (sos_type IN ('attack','medical','fire','general')),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  cancelled_by_sender BOOLEAN DEFAULT false,
  notified_count INT DEFAULT 0,
  sms_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sos_events_sender_id ON sos_events(sender_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_timestamp ON sos_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_sos_events_resolved ON sos_events(resolved);
CREATE INDEX IF NOT EXISTS idx_sos_events_type ON sos_events(sos_type);
CREATE INDEX IF NOT EXISTS idx_sos_events_location ON sos_events(latitude, longitude);

-- ─── SOS ACKNOWLEDGEMENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sos_event_id UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sos_event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_sos_ack_event_id ON sos_acknowledgements(sos_event_id);
CREATE INDEX IF NOT EXISTS idx_sos_ack_user_id ON sos_acknowledgements(user_id);

-- ─── DEAD MAN'S SWITCHES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dead_mans_switches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  armed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT false,
  latitude FLOAT,
  longitude FLOAT,
  timeout_minutes INT DEFAULT 60,
  grace_period_minutes INT DEFAULT 5,
  interval_minutes INT DEFAULT 60,
  armed_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dms_armed ON dead_mans_switches(armed);

-- ─── PUSH TOKENS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  device_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
