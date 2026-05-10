import { Router } from 'express';
import { createDomain, deactivateInactiveMailboxes, listDomains } from '../db/queries.js';
import { requireApiKey } from '../middleware/auth.js';
import { domainSchema } from '../validators.js';

export const adminRouter = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

adminRouter.use(requireApiKey);

adminRouter.get('/domains', asyncRoute(async (_req, res) => {
  res.json({ domains: await listDomains() });
}));

adminRouter.post('/domains', asyncRoute(async (req, res) => {
  const parsed = domainSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  try {
    return res.status(201).json({ domain: await createDomain(parsed.data.name) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'DOMAIN_ALREADY_EXISTS' });
    }

    return res.status(400).json({ error: 'DOMAIN_CREATE_FAILED' });
  }
}));

adminRouter.post('/maintenance/deactivate-inactive', asyncRoute(async (req, res) => {
  const days = req.body.days ? Number(req.body.days) : undefined;
  res.json({ result: await deactivateInactiveMailboxes(days) });
}));
