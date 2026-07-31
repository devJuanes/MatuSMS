import { env } from './config.js';

const apiKeySecurity = [{ apiKey: [] }, { bearerAuth: [] }];

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'MatuSMS API',
    version: '1.1.0',
    description:
      'MatuSMS convierte un teléfono Android en pasarela SMS. Envía mensajes transaccionales y códigos OTP (login, registro, recuperación de contraseña) vía API REST.\n\n' +
      'Documentación extendida: [docs/api-saas-messaging.md](https://github.com/MatuStudio/MatuSMS/blob/main/docs/api-saas-messaging.md)',
    contact: {
      name: 'MatuSMS Support',
      email: 'support@matusms.com',
    },
  },
  servers: [
    { url: `http://localhost:${env.PORT}`, description: 'Local development' },
    { url: 'https://api.sms.matubyte.com', description: 'Production' },
  ],
  tags: [
    { name: 'Health', description: 'Estado del servicio' },
    { name: 'Auth', description: 'Turnstile y autenticación auxiliar' },
    { name: 'Users', description: 'Perfil y API key de usuario' },
    { name: 'Phones', description: 'Teléfonos vinculados (gateway Android)' },
    { name: 'Messages', description: 'Envío y consulta de SMS' },
    { name: 'Verifications', description: 'OTP / códigos de verificación SaaS' },
    { name: 'Threads', description: 'Conversaciones' },
    { name: 'Webhooks', description: 'Eventos HTTP salientes' },
    { name: 'Schedules', description: 'Ventanas de envío' },
    { name: 'Bulk', description: 'Envío masivo' },
    { name: 'Heartbeats', description: 'Estado online del gateway' },
    { name: 'Billing', description: 'Uso y facturación' },
    { name: 'Attachments', description: 'Adjuntos MMS' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/messages/send': {
      post: {
        tags: ['Messages'],
        summary: 'Enviar SMS (async, 202)',
        description:
          'Envía un SMS de texto libre o con plantilla `{{variables}}`. Ideal para notificaciones personalizadas. Para OTP con verificación automática usa `/v1/verifications`.',
        security: apiKeySecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SendMessage' },
              examples: {
                plain: {
                  summary: 'SMS simple',
                  value: { to: '+573001234567', content: 'Tu pedido fue confirmado.' },
                },
                template: {
                  summary: 'Plantilla con variables',
                  value: {
                    to: '+573001234567',
                    content: 'Hola {{nombre}}, tu código es {{codigo}}.',
                    variables: { nombre: 'Juan', codigo: '482910' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Mensaje aceptado y en cola',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/v1/verifications': {
      post: {
        tags: ['Verifications'],
        summary: 'Crear y enviar código OTP',
        description:
          'Genera un código, lo almacena con TTL en Redis y envía el SMS vía tu gateway Android. `purpose` define el texto por defecto (login, register, password_reset, etc.).',
        security: apiKeySecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateVerification' },
              examples: {
                login: {
                  summary: 'Confirmación de inicio de sesión',
                  value: { to: '+573001234567', purpose: 'login', locale: 'es' },
                },
                register: {
                  summary: 'Registro — código de verificación',
                  value: { to: '+573001234567', purpose: 'register', locale: 'es' },
                },
                passwordReset: {
                  summary: 'Olvido de contraseña',
                  value: { to: '+573001234567', purpose: 'password_reset', locale: 'es' },
                },
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Verificación creada y SMS en cola',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerificationResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/v1/verifications/verify': {
      post: {
        tags: ['Verifications'],
        summary: 'Verificar código OTP',
        description:
          'Compara el código ingresado por el usuario. Máximo 5 intentos; el código expira según `expires_in_seconds` (default 600 s).',
        security: apiKeySecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyCode' },
              example: {
                to: '+573001234567',
                purpose: 'login',
                code: '482910',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Código válido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyCodeResult' },
              },
            },
          },
          '401': {
            description: 'Código incorrecto, expirado o sin intentos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/v1/verifications/{id}': {
      get: {
        tags: ['Verifications'],
        summary: 'Consultar estado de verificación',
        security: apiKeySecurity,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Estado de la verificación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerificationResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/v1/messages/outstanding': {
      get: {
        tags: ['Messages'],
        summary: 'Poll outstanding messages (MatuSMS app)',
        security: [{ phoneApiKey: [] }],
        responses: { '200': { description: 'Message list' } },
      },
    },
    '/v1/messages/bulk-send': {
      post: { tags: ['Bulk'], summary: 'Bulk send CSV/JSON (202)', security: apiKeySecurity },
    },
    '/v1/messages/search': {
      get: { tags: ['Messages'], summary: 'Search messages and threads', security: apiKeySecurity },
    },
    '/v1/webhooks': {
      get: { tags: ['Webhooks'], summary: 'List webhooks', security: apiKeySecurity },
      post: { tags: ['Webhooks'], summary: 'Create webhook', security: apiKeySecurity },
    },
    '/v1/schedules': {
      get: { tags: ['Schedules'], summary: 'List send schedules', security: apiKeySecurity },
      post: { tags: ['Schedules'], summary: 'Create schedule', security: apiKeySecurity },
    },
    '/v1/billing/usage': {
      get: { tags: ['Billing'], summary: 'Monthly usage', security: apiKeySecurity },
    },
    '/v1/attachments': {
      post: { tags: ['Attachments'], summary: 'Upload attachment (max 5MB)', security: apiKeySecurity },
    },
    '/v1/auth/verify-turnstile': {
      post: { tags: ['Auth'], summary: 'Verify Cloudflare Turnstile token' },
    },
    '/v1/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Perfil del usuario (incluye api_key)',
        security: apiKeySecurity,
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key', description: 'User API key' },
      phoneApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Phone API key (gateway Android)',
      },
    },
    schemas: {
      SendMessage: {
        type: 'object',
        required: ['to', 'content'],
        properties: {
          to: { type: 'string', example: '+573001234567' },
          content: { type: 'string', maxLength: 1600 },
          phone_id: { type: 'string', format: 'uuid' },
          from: { type: 'string', description: 'Número E.164 de la SIM emisora' },
          variables: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          request_id: { type: 'string' },
        },
      },
      CreateVerification: {
        type: 'object',
        required: ['to', 'purpose'],
        properties: {
          to: { type: 'string', example: '+573001234567' },
          purpose: {
            type: 'string',
            enum: ['login', 'register', 'password_reset', 'transaction', 'custom'],
          },
          locale: { type: 'string', enum: ['es', 'en'], default: 'es' },
          phone_id: { type: 'string', format: 'uuid' },
          template: {
            type: 'string',
            description: 'Plantilla opcional con {{codigo}} y {{minutos}}',
          },
          code_length: { type: 'integer', minimum: 4, maximum: 8, default: 6 },
          expires_in_seconds: { type: 'integer', minimum: 60, maximum: 3600, default: 600 },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
      VerifyCode: {
        type: 'object',
        required: ['to', 'purpose', 'code'],
        properties: {
          to: { type: 'string' },
          purpose: {
            type: 'string',
            enum: ['login', 'register', 'password_reset', 'transaction', 'custom'],
          },
          code: { type: 'string', minLength: 4, maxLength: 8 },
        },
      },
      Verification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          to: { type: 'string' },
          purpose: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'verified', 'expired', 'failed'] },
          locale: { type: 'string' },
          message_id: { type: 'string', format: 'uuid', nullable: true },
          expires_at: { type: 'string', format: 'date-time' },
          verified_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      VerificationResponse: {
        type: 'object',
        properties: { data: { $ref: '#/components/schemas/Verification' } },
      },
      VerifyCodeResult: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              verified: { type: 'boolean' },
              verification_id: { type: 'string', format: 'uuid' },
              purpose: { type: 'string' },
              to: { type: 'string' },
            },
          },
        },
      },
      MessageResponse: {
        type: 'object',
        properties: { data: { type: 'object', additionalProperties: true } },
      },
      ApiError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Solicitud inválida',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      Unauthorized: {
        description: 'API key inválida o código OTP incorrecto',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      },
    },
  },
};
