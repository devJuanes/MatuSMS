-- MatuSMS production schema for MatuDB SQL editor
-- Run in MatuDB project SQL editor before seed

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  active_phone_id TEXT,
  subscription_name TEXT NOT NULL DEFAULT 'free',
  subscription_id TEXT,
  subscription_status TEXT,
  subscription_renews_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  notification_message_status_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_webhook_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_heartbeat_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_newsletter_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  fcm_token TEXT,
  messages_per_minute INTEGER NOT NULL DEFAULT 1,
  sim TEXT NOT NULL DEFAULT 'DEFAULT',
  message_send_schedule_id UUID,
  max_send_attempts INTEGER NOT NULL DEFAULT 2,
  message_expiration_seconds INTEGER NOT NULL DEFAULT 600,
  missed_call_auto_reply TEXT,
  unarchive_thread BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  contact TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT true,
  last_read_at TIMESTAMPTZ,
  color TEXT,
  status TEXT,
  last_message_id UUID,
  last_message_content TEXT,
  order_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, owner, contact)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  contact TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]',
  encrypted BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  sim TEXT DEFAULT 'DEFAULT',
  request_id TEXT,
  send_duration INTEGER,
  send_attempt_count INTEGER NOT NULL DEFAULT 0,
  max_send_attempts INTEGER NOT NULL DEFAULT 2,
  request_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempted_at TIMESTAMPTZ,
  scheduled_send_time TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  can_be_polled BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_messages_user_status ON messages(user_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_outstanding ON messages(user_id, owner, status) WHERE can_be_polled = true;
CREATE INDEX IF NOT EXISTS idx_threads_user ON message_threads(user_id, is_archived, order_timestamp DESC);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  signing_key TEXT NOT NULL,
  phone_numbers JSONB NOT NULL DEFAULT '[]',
  events JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phone_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_send_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  windows JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id TEXT,
  filename TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'online',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_phone ON heartbeats(phone_id, created_at DESC);

CREATE TABLE IF NOT EXISTS heartbeat_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period)
);
