import dotenv from 'dotenv';

dotenv.config();

const parseDomains = (value) =>
  String(value || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || process.env.BACKEND_PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ryudev_tempmail',
  apiKey: process.env.API_KEY || 'change-this-public-api-key',
  inboundWebhookSecret: process.env.INBOUND_WEBHOOK_SECRET || 'change-this-worker-secret',
  randomLength: Number(process.env.MAILBOX_RANDOM_LENGTH || 10),
  mailboxInactivityDays: Number(process.env.MAILBOX_INACTIVITY_DAYS || 30),
  defaultDomains: parseDomains(process.env.DEFAULT_DOMAINS || 'ryudev.site')
};
