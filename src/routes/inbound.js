import { Router } from 'express';
import { insertInboundEmail } from '../db/queries.js';
import { requireInboundSecret } from '../middleware/auth.js';
import { inboundEmailSchema } from '../validators.js';

export function createInboundRouter(io) {
  const router = Router();
  const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

  router.post('/email', requireInboundSecret, asyncRoute(async (req, res) => {
    const parsed = inboundEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
    }

    const result = await insertInboundEmail(parsed.data);
    if (result.stored) {
      io.to(`mailbox:${result.mailbox.id}`).emit('email:new', result.email);
      return res.status(201).json({ ok: true, stored: true, emailId: result.email.id });
    }

    return res.status(202).json({ ok: true, stored: false, reason: result.reason });
  }));

  return router;
}
