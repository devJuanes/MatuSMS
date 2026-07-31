import { z } from 'zod';

export const simSchema = z.enum(['SIM1', 'SIM2', 'DEFAULT']);
export type Sim = z.infer<typeof simSchema>;

export const messageTypeSchema = z.enum([
  'mobile-terminated',
  'mobile-originated',
  'call/missed',
]);
export type MessageType = z.infer<typeof messageTypeSchema>;

export const messageStatusSchema = z.enum([
  'pending',
  'scheduled',
  'sending',
  'sent',
  'received',
  'failed',
  'delivered',
  'expired',
  'deleted',
]);
export type MessageStatus = z.infer<typeof messageStatusSchema>;

export const subscriptionNameSchema = z.enum([
  'free',
  'pro-monthly',
  'pro-yearly',
  'ultra-monthly',
  'ultra-yearly',
  '20k-monthly',
  '20k-yearly',
]);
export type SubscriptionName = z.infer<typeof subscriptionNameSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  api_key: z.string(),
  timezone: z.string().default('America/New_York'),
  active_phone_id: z.string().nullable().optional(),
  subscription_name: subscriptionNameSchema.default('free'),
  subscription_id: z.string().nullable().optional(),
  subscription_status: z.string().nullable().optional(),
  subscription_renews_at: z.string().nullable().optional(),
  subscription_ends_at: z.string().nullable().optional(),
  notification_message_status_enabled: z.boolean().default(true),
  notification_webhook_enabled: z.boolean().default(true),
  notification_heartbeat_enabled: z.boolean().default(true),
  notification_newsletter_enabled: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const phoneSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  phone_number: z.string(),
  fcm_token: z.string().nullable().optional(),
  messages_per_minute: z.number().int().positive().default(1),
  sim: simSchema.default('DEFAULT'),
  message_send_schedule_id: z.string().uuid().nullable().optional(),
  max_send_attempts: z.number().int().positive().default(2),
  message_expiration_seconds: z.number().int().positive().default(600),
  missed_call_auto_reply: z.string().nullable().optional(),
  unarchive_thread: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Phone = z.infer<typeof phoneSchema>;

export const messageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  owner: z.string(),
  contact: z.string(),
  content: z.string(),
  attachments: z.array(z.string()).default([]),
  encrypted: z.boolean().default(false),
  type: messageTypeSchema,
  status: messageStatusSchema,
  sim: simSchema.optional(),
  request_id: z.string().nullable().optional(),
  send_duration: z.number().nullable().optional(),
  send_attempt_count: z.number().int().default(0),
  max_send_attempts: z.number().int().default(2),
  request_received_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  order_timestamp: z.string(),
  last_attempted_at: z.string().nullable().optional(),
  scheduled_send_time: z.string().nullable().optional(),
  sent_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  expired_at: z.string().nullable().optional(),
  failed_at: z.string().nullable().optional(),
  received_at: z.string().nullable().optional(),
  can_be_polled: z.boolean().default(true),
});
export type Message = z.infer<typeof messageSchema>;

export const messageThreadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  owner: z.string(),
  contact: z.string(),
  is_archived: z.boolean().default(false),
  is_read: z.boolean().default(true),
  last_read_at: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  last_message_id: z.string().uuid().nullable().optional(),
  last_message_content: z.string().nullable().optional(),
  order_timestamp: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type MessageThread = z.infer<typeof messageThreadSchema>;

export const webhookSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  url: z.string().url(),
  signing_key: z.string(),
  phone_numbers: z.array(z.string()).default([]),
  events: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Webhook = z.infer<typeof webhookSchema>;

export const phoneApiKeySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  phone_id: z.string().uuid(),
  api_key: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PhoneApiKey = z.infer<typeof phoneApiKeySchema>;

export const scheduleWindowSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_minute: z.number().int().min(0).max(1439),
  end_minute: z.number().int().min(0).max(1439),
});

export const messageSendScheduleSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  name: z.string(),
  timezone: z.string(),
  windows: z.array(scheduleWindowSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type MessageSendSchedule = z.infer<typeof messageSendScheduleSchema>;

export const heartbeatSchema = z.object({
  id: z.string().uuid(),
  phone_id: z.string().uuid(),
  user_id: z.string(),
  status: z.enum(['online', 'offline']),
  created_at: z.string(),
});
export type Heartbeat = z.infer<typeof heartbeatSchema>;

// Request / response DTOs
export const createPhoneSchema = z.object({
  phone_number: z.string().min(8),
  sim: simSchema.optional(),
  messages_per_minute: z.number().int().positive().optional(),
  max_send_attempts: z.number().int().positive().optional(),
  message_expiration_seconds: z.number().int().positive().optional(),
  missed_call_auto_reply: z.string().nullable().optional(),
  unarchive_thread: z.boolean().optional(),
});
export type CreatePhoneInput = z.infer<typeof createPhoneSchema>;

export const updatePhoneSchema = createPhoneSchema.partial().extend({
  message_send_schedule_id: z.string().uuid().nullable().optional(),
});
export type UpdatePhoneInput = z.infer<typeof updatePhoneSchema>;

export const createWebhookSchema = z.object({
  url: z.string().url(),
  phone_numbers: z.array(z.string()).default([]),
  events: z.array(z.string()).default([]),
});
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = createWebhookSchema.partial();
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;

export const createScheduleSchema = z.object({
  name: z.string().min(1),
  timezone: z.string().min(1),
  windows: z.array(scheduleWindowSchema).default([]),
});
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = createScheduleSchema.partial();
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const bulkSendItemSchema = z.object({
  to: z.string().min(8),
  content: z.string().min(1).max(1600).optional(),
  variables: z.record(z.string()).optional(),
});
export const bulkSendSchema = z
  .object({
    phone_id: z.string().uuid().optional(),
    request_id: z.string().optional(),
    filename: z.string().optional(),
    /** Plantilla común con {{variables}} por fila */
    template: z.string().min(1).max(1600).optional(),
    messages: z.array(bulkSendItemSchema).min(1).max(1000),
  })
  .superRefine((data, ctx) => {
    if (data.template) return;
    data.messages.forEach((m, i) => {
      if (!m.content?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'content es obligatorio si no usas template',
          path: ['messages', i, 'content'],
        });
      }
    });
  });
export type BulkSendInput = z.infer<typeof bulkSendSchema>;

export const bulkMessageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  request_id: z.string().nullable().optional(),
  filename: z.string().nullable().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  total_count: z.number().int(),
  success_count: z.number().int(),
  failed_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type BulkMessage = z.infer<typeof bulkMessageSchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const billingUsageSchema = z.object({
  user_id: z.string(),
  period: z.string(),
  message_count: z.number().int(),
});
export type BillingUsage = z.infer<typeof billingUsageSchema>;

export const sendMessageSchema = z.object({
  to: z.string().min(8),
  content: z.string().min(1).max(1600),
  from: z.string().optional(),
  phone_id: z.string().uuid().optional(),
  request_id: z.string().optional(),
  encrypted: z.boolean().optional(),
  sim: simSchema.optional(),
  scheduled_send_time: z.string().datetime().optional(),
  attachments: z.array(z.string()).optional(),
  /** Variables para plantillas: {{nombre}}, {{codigo}}, etc. */
  variables: z.record(z.string()).optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const receiveMessageSchema = z.object({
  from: z.string().min(8),
  content: z.string().min(1),
  received_at: z.string().datetime().optional(),
  attachments: z.array(z.string()).optional(),
});
export type ReceiveMessageInput = z.infer<typeof receiveMessageSchema>;

export const messageEventSchema = z.object({
  event: z.enum(['SENT', 'DELIVERED', 'FAILED']),
  send_duration: z.number().optional(),
  error: z.string().optional(),
});
export type MessageEventInput = z.infer<typeof messageEventSchema>;

export const linkDeviceSchema = z.object({
  sim1_number: z.string().min(8),
  sim2_number: z.string().min(8).optional().nullable(),
  fcm_token: z.string().min(1).optional(),
});
export type LinkDeviceInput = z.infer<typeof linkDeviceSchema>;

export const linkedPhoneCredentialSchema = z.object({
  id: z.string().uuid(),
  sim: simSchema,
  phone_number: z.string(),
  api_key: z.string(),
});
export type LinkedPhoneCredential = z.infer<typeof linkedPhoneCredentialSchema>;

export const linkDeviceResponseSchema = z.object({
  phones: z.array(linkedPhoneCredentialSchema),
  primary_phone_id: z.string().uuid(),
});
export type LinkDeviceResponse = z.infer<typeof linkDeviceResponseSchema>;

export const updateUserSchema = z.object({
  timezone: z.string().optional(),
  active_phone_id: z.string().uuid().nullable().optional(),
  notification_message_status_enabled: z.boolean().optional(),
  notification_webhook_enabled: z.boolean().optional(),
  notification_heartbeat_enabled: z.boolean().optional(),
  notification_newsletter_enabled: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const verificationPurposeSchema = z.enum([
  'login',
  'register',
  'password_reset',
  'transaction',
  'custom',
]);
export type VerificationPurpose = z.infer<typeof verificationPurposeSchema>;

export const verificationLocaleSchema = z.enum(['es', 'en']);
export type VerificationLocale = z.infer<typeof verificationLocaleSchema>;

export const verificationStatusSchema = z.enum(['pending', 'verified', 'expired', 'failed']);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const createVerificationSchema = z.object({
  to: z.string().min(8),
  purpose: verificationPurposeSchema,
  locale: verificationLocaleSchema.default('es'),
  phone_id: z.string().uuid().optional(),
  from: z.string().optional(),
  /** Plantilla personalizada con {{codigo}} y {{minutos}}. */
  template: z.string().min(1).max(1600).optional(),
  code_length: z.number().int().min(4).max(8).optional(),
  expires_in_seconds: z.number().int().min(60).max(3600).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateVerificationInput = z.infer<typeof createVerificationSchema>;

export const verifyCodeSchema = z.object({
  to: z.string().min(8),
  purpose: verificationPurposeSchema,
  code: z.string().min(4).max(8),
});
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const verificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  to: z.string(),
  purpose: verificationPurposeSchema,
  status: verificationStatusSchema,
  locale: verificationLocaleSchema,
  message_id: z.string().uuid().nullable().optional(),
  expires_at: z.string(),
  verified_at: z.string().nullable().optional(),
  created_at: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type Verification = z.infer<typeof verificationSchema>;

export const verifyCodeResultSchema = z.object({
  verified: z.boolean(),
  verification_id: z.string().uuid(),
  purpose: verificationPurposeSchema,
  to: z.string(),
});
export type VerifyCodeResult = z.infer<typeof verifyCodeResultSchema>;

export const webhookEventTypes = [
  'message.phone.sent',
  'message.phone.delivered',
  'message.phone.failed',
  'message.phone.received',
  'message.send.expired',
  'verification.sent',
  'verification.verified',
  'verification.failed',
  'verification.expired',
  'phone.heartbeat.offline',
  'phone.heartbeat.online',
  'phone.updated',
] as const;
export type WebhookEventType = (typeof webhookEventTypes)[number];

export const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiDataSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({ data: dataSchema });
