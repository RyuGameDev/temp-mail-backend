import { Router } from 'express';
import {
  createMailbox,
  createRandomMailbox,
  deleteEmail,
  deleteMailbox,
  getActiveDomain,
  getMailboxEmail,
  getMailboxByAddress,
  getMailboxById,
  listDomains,
  listEmails,
  markEmailRead,
  setMailboxActive,
  touchMailbox
} from '../db/queries.js';
import { mailboxSchema, randomMailboxSchema } from '../validators.js';

export const publicRouter = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

publicRouter.get('/domains', asyncRoute(async (_req, res) => {
  const domains = await listDomains();
  res.json({ domains: domains.filter((domain) => domain.active) });
}));

publicRouter.post('/mailboxes/random', asyncRoute(async (req, res) => {
  const parsed = randomMailboxSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  try {
    return res.status(201).json({ mailbox: await createRandomMailbox(parsed.data.domain) });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}));

publicRouter.post('/mailboxes/custom', asyncRoute(async (req, res) => {
  const parsed = mailboxSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  if (!(await getActiveDomain(parsed.data.domain))) {
    return res.status(404).json({ error: 'DOMAIN_NOT_FOUND' });
  }

  try {
    return res.status(201).json({ mailbox: await createMailbox(parsed.data) });
  } catch (error) {
    if (error.code === 11000) {
      const existingMailbox = await getMailboxByAddress(`${parsed.data.localPart}@${parsed.data.domain}`);
      if (existingMailbox) {
        const mailbox = existingMailbox.active
          ? existingMailbox
          : await setMailboxActive(existingMailbox.id, true);

        return res.json({ mailbox });
      }

      return res.status(409).json({ error: 'MAILBOX_ALREADY_EXISTS' });
    }

    return res.status(400).json({ error: 'MAILBOX_CREATE_FAILED' });
  }
}));

publicRouter.get('/mailboxes/by-address/:address', asyncRoute(async (req, res) => {
  const mailbox = await getMailboxByAddress(req.params.address);
  if (!mailbox) {
    return res.status(404).json({ error: 'MAILBOX_NOT_FOUND' });
  }

  await touchMailbox(mailbox.id);
  return res.json({ mailbox });
}));

publicRouter.get('/mailboxes/:id', asyncRoute(async (req, res) => {
  const mailbox = await getMailboxById(req.params.id);
  if (!mailbox) {
    return res.status(404).json({ error: 'MAILBOX_NOT_FOUND' });
  }

  await touchMailbox(mailbox.id);
  return res.json({ mailbox });
}));

publicRouter.patch('/mailboxes/:id/active', asyncRoute(async (req, res) => {
  const active = Boolean(req.body.active);
  const mailbox = await setMailboxActive(req.params.id, active);
  if (!mailbox) {
    return res.status(404).json({ error: 'MAILBOX_NOT_FOUND' });
  }

  return res.json({ mailbox });
}));

publicRouter.delete('/mailboxes/:id', asyncRoute(async (req, res) => {
  const mailbox = await deleteMailbox(req.params.id);
  if (!mailbox) {
    return res.status(404).json({ error: 'MAILBOX_NOT_FOUND' });
  }

  return res.json({ ok: true, mailbox });
}));

publicRouter.get('/mailboxes/:id/emails', asyncRoute(async (req, res) => {
  const mailbox = await getMailboxById(req.params.id);
  if (!mailbox) {
    return res.status(404).json({ error: 'MAILBOX_NOT_FOUND' });
  }

  await touchMailbox(mailbox.id);
  return res.json({ emails: await listEmails(req.params.id) });
}));

publicRouter.get('/mailboxes/:id/emails/:emailId', asyncRoute(async (req, res) => {
  const email = await getMailboxEmail(req.params.id, req.params.emailId);
  if (!email) {
    return res.status(404).json({ error: 'EMAIL_NOT_FOUND' });
  }

  await touchMailbox(req.params.id);
  return res.json({ email });
}));

publicRouter.patch('/mailboxes/:id/emails/:emailId/read', asyncRoute(async (req, res) => {
  const email = await markEmailRead(req.params.id, req.params.emailId, req.body.read !== false);
  if (!email) {
    return res.status(404).json({ error: 'EMAIL_NOT_FOUND' });
  }

  await touchMailbox(req.params.id);
  return res.json({ email });
}));

publicRouter.delete('/mailboxes/:id/emails/:emailId', asyncRoute(async (req, res) => {
  const email = await deleteEmail(req.params.id, req.params.emailId);
  if (!email) {
    return res.status(404).json({ error: 'EMAIL_NOT_FOUND' });
  }

  await touchMailbox(req.params.id);
  return res.json({ ok: true, email });
}));
