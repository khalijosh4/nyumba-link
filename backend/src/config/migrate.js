require('dotenv').config({ path: require('path').join(__dirname,'../../.env') });
const { pool } = require('./database');
const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant','landlord','caretaker','admin')),
  is_verified BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
  verification_token VARCHAR(255), verification_token_expires TIMESTAMPTZ,
  reset_password_token VARCHAR(255), reset_password_expires TIMESTAMPTZ,
  avatar_url TEXT, bio TEXT, location VARCHAR(120),
  access_paid BOOLEAN DEFAULT FALSE, access_paid_at TIMESTAMPTZ, access_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL, description TEXT,
  room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('single_room','bedsitter','one_bedroom','two_bedroom','three_bedroom','studio','four_bedroom_plus')),
  floor_number INTEGER DEFAULT 0, area VARCHAR(100) NOT NULL, street VARCHAR(200),
  landmark VARCHAR(300), directions TEXT, lat DECIMAL(10,8), lng DECIMAL(11,8),
  monthly_rent INTEGER NOT NULL, deposit INTEGER NOT NULL, extra_fees TEXT,
  available_from DATE, minimum_lease VARCHAR(30) DEFAULT '1 Month', is_negotiable BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','active','expired','rented','suspended')),
  is_featured BOOLEAN DEFAULT FALSE, views INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW()+INTERVAL '5 days'),
  published_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL, public_id VARCHAR(255),
  category VARCHAR(50) NOT NULL CHECK (category IN ('exterior','compound','bedroom','kitchen','washroom','living_room','other')),
  sort_order INTEGER DEFAULT 0, is_primary BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS listing_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE, amenity VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewing_date DATE NOT NULL, viewing_time VARCHAR(50) NOT NULL, message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  landlord_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id,tenant_id,viewing_date)
);
CREATE TABLE IF NOT EXISTS favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id,listing_id)
);
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('tenant_access','listing_fee','listing_renewal')),
  amount INTEGER NOT NULL, phone VARCHAR(20) NOT NULL,
  mpesa_checkout_request_id VARCHAR(100), mpesa_merchant_request_id VARCHAR(100),
  mpesa_transaction_id VARCHAR(50), mpesa_receipt_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','cancelled','timeout')),
  result_code INTEGER, result_desc TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, title VARCHAR(200) NOT NULL, message TEXT NOT NULL,
  data JSONB, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS search_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area VARCHAR(100), room_type VARCHAR(50), min_rent INTEGER, max_rent INTEGER,
  is_active BOOLEAN DEFAULT TRUE, last_notified_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email VARCHAR(255) NOT NULL, recipient_name VARCHAR(160), type VARCHAR(80) NOT NULL,
  subject VARCHAR(300), status VARCHAR(20) DEFAULT 'sent', mailersend_message_id VARCHAR(200),
  error_message TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_area     ON listings(area);
CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_rent     ON listings(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_listings_expires  ON listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_landlord ON listings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant   ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_landlord ON bookings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_payments_user     ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout ON payments(mpesa_checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$ language 'plpgsql';
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_users_upd') THEN CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_listings_upd') THEN CREATE TRIGGER trg_listings_upd BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_bookings_upd') THEN CREATE TRIGGER trg_bookings_upd BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_payments_upd') THEN CREATE TRIGGER trg_payments_upd BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); END IF;
END $$;
`;
async function migrate(){
  const c=await pool.connect();
  try { console.log('Running migrations...'); await c.query(sql); console.log('✅ Migrations done'); }
  finally { c.release(); await pool.end(); }
}
migrate().catch(e=>{ console.error('Migration failed:',e.message); process.exit(1); });
