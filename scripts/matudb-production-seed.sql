-- MatuSMS system seed — run after schema

INSERT INTO users (
  id, email, api_key, timezone, subscription_name,
  notification_message_status_enabled,
  notification_webhook_enabled,
  notification_heartbeat_enabled,
  notification_newsletter_enabled,
  created_at, updated_at
) VALUES (
  'system-user-id',
  'system@matusms.com',
  'system-user-api-key',
  'UTC',
  'free',
  false, false, false, false,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
