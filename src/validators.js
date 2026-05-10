import { z } from 'zod';

export const domainSchema = z.object({
  name: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)
});

export const mailboxSchema = z.object({
  localPart: z.string().trim().toLowerCase().min(1).max(48).regex(/^[a-z0-9][a-z0-9._-]*$/),
  domain: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)
});

export const randomMailboxSchema = z.object({
  domain: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)
});

export const inboundEmailSchema = z.object({
  messageId: z.string().optional(),
  fromAddress: z.string().email(),
  toAddress: z.string().email().transform((value) => value.toLowerCase()),
  subject: z.string().optional(),
  textBody: z.string().optional(),
  htmlBody: z.string().optional(),
  headers: z.record(z.string()).optional()
});
