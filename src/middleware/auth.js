import { config } from '../config.js';

export function requireApiKey(req, res, next) {
  const headerKey = req.get('x-api-key');
  if (headerKey !== config.apiKey) {
    return res.status(401).json({ error: 'INVALID_API_KEY' });
  }

  return next();
}

export function requireInboundSecret(req, res, next) {
  const secret = req.get('x-inbound-secret');
  if (secret !== config.inboundWebhookSecret) {
    return res.status(401).json({ error: 'INVALID_INBOUND_SECRET' });
  }

  return next();
}
