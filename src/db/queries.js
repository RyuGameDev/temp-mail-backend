import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';
import { config } from '../config.js';
import { Domain } from './models/Domain.js';
import { Email } from './models/Email.js';
import { Mailbox } from './models/Mailbox.js';

const randomLocalPart = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', config.randomLength);

function normalizeDomain(domain) {
  if (!domain) return null;

  return {
    name: domain.name,
    active: Boolean(domain.active),
    createdAt: domain.createdAt
  };
}

function normalizeMailbox(mailbox) {
  if (!mailbox) return null;

  return {
    id: mailbox._id.toString(),
    localPart: mailbox.localPart,
    domain: mailbox.domain,
    address: mailbox.address,
    active: Boolean(mailbox.active),
    createdAt: mailbox.createdAt,
    lastSeenAt: mailbox.lastSeenAt,
    deactivatedAt: mailbox.deactivatedAt
  };
}

function normalizeEmail(email) {
  if (!email) return null;

  return {
    id: email._id.toString(),
    mailboxId: email.mailboxId.toString(),
    messageId: email.messageId,
    fromAddress: email.fromAddress,
    toAddress: email.toAddress,
    subject: email.subject,
    textBody: email.textBody,
    htmlBody: email.htmlBody,
    rawHeaders: JSON.stringify(email.headers || {}),
    receivedAt: email.createdAt,
    readAt: email.readAt
  };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function listDomains() {
  const domains = await Domain.find({}).sort({ name: 1 }).lean();
  return domains.map(normalizeDomain);
}

export async function getActiveDomain(name) {
  const domain = await Domain.findOne({ name: name.toLowerCase(), active: true }).lean();
  return normalizeDomain(domain);
}

export async function createDomain(name) {
  const domain = await Domain.create({ name: name.trim().toLowerCase(), active: true });
  return normalizeDomain(domain);
}

export async function createMailbox({ localPart, domain }) {
  const normalizedDomain = domain.trim().toLowerCase();
  const normalizedLocal = localPart.trim().toLowerCase();
  const address = `${normalizedLocal}@${normalizedDomain}`;
  const mailbox = await Mailbox.create({
    localPart: normalizedLocal,
    domain: normalizedDomain,
    address,
    active: true,
    lastSeenAt: new Date()
  });

  return normalizeMailbox(mailbox);
}

export async function createRandomMailbox(domain) {
  const activeDomain = await getActiveDomain(domain);
  if (!activeDomain) {
    throw new Error('DOMAIN_NOT_FOUND');
  }

  for (let index = 0; index < 10; index += 1) {
    try {
      return await createMailbox({ localPart: randomLocalPart(), domain });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  throw new Error('MAILBOX_GENERATION_FAILED');
}

export async function getMailboxById(id) {
  if (!isValidObjectId(id)) {
    return null;
  }

  const mailbox = await Mailbox.findById(id).lean();
  return normalizeMailbox(mailbox);
}

export async function getMailboxByAddress(address) {
  const mailbox = await Mailbox.findOne({ address: address.toLowerCase() }).lean();
  return normalizeMailbox(mailbox);
}

export async function deleteMailbox(id) {
  if (!isValidObjectId(id)) {
    return null;
  }

  const mailbox = await Mailbox.findByIdAndDelete(id).lean();
  if (!mailbox) {
    return null;
  }

  await Email.deleteMany({ mailboxId: id });
  return normalizeMailbox(mailbox);
}

export async function setMailboxActive(id, active) {
  if (!isValidObjectId(id)) {
    return null;
  }

  const mailbox = await Mailbox.findByIdAndUpdate(
    id,
    {
      active,
      lastSeenAt: new Date(),
      deactivatedAt: active ? null : new Date()
    },
    { new: true }
  ).lean();

  return normalizeMailbox(mailbox);
}

export async function touchMailbox(id) {
  if (!isValidObjectId(id)) {
    return;
  }

  await Mailbox.updateOne({ _id: id }, { $set: { lastSeenAt: new Date() } });
}

export async function deactivateInactiveMailboxes(days = config.mailboxInactivityDays) {
  const cutoff = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
  const result = await Mailbox.updateMany(
    {
      active: true,
      lastSeenAt: { $lte: cutoff }
    },
    {
      $set: {
        active: false,
        deactivatedAt: new Date()
      }
    }
  );

  return { deactivated: result.modifiedCount, days: Number(days) };
}

export async function listEmails(mailboxId) {
  if (!isValidObjectId(mailboxId)) {
    return [];
  }

  const emails = await Email.find({ mailboxId }).sort({ createdAt: -1 }).lean();
  return emails.map(normalizeEmail);
}

export async function getEmail(id) {
  if (!isValidObjectId(id)) {
    return null;
  }

  const email = await Email.findById(id).lean();
  return normalizeEmail(email);
}

export async function getMailboxEmail(mailboxId, emailId) {
  if (!isValidObjectId(mailboxId) || !isValidObjectId(emailId)) {
    return null;
  }

  const email = await Email.findOne({ _id: emailId, mailboxId }).lean();
  return normalizeEmail(email);
}

export async function markEmailRead(mailboxId, emailId, read = true) {
  if (!isValidObjectId(mailboxId) || !isValidObjectId(emailId)) {
    return null;
  }

  const email = await Email.findOneAndUpdate(
    { _id: emailId, mailboxId },
    { $set: { readAt: read ? new Date() : null } },
    { new: true }
  ).lean();

  return normalizeEmail(email);
}

export async function deleteEmail(mailboxId, emailId) {
  if (!isValidObjectId(mailboxId) || !isValidObjectId(emailId)) {
    return null;
  }

  const email = await Email.findOneAndDelete({ _id: emailId, mailboxId }).lean();
  return normalizeEmail(email);
}

export async function insertInboundEmail(payload) {
  const mailbox = await getMailboxByAddress(payload.toAddress);
  if (!mailbox || !mailbox.active) {
    return { stored: false, reason: mailbox ? 'MAILBOX_INACTIVE' : 'MAILBOX_NOT_FOUND', mailbox };
  }

  const email = await Email.create({
    mailboxId: mailbox.id,
    messageId: payload.messageId || null,
    fromAddress: payload.fromAddress,
    toAddress: payload.toAddress,
    subject: payload.subject || '',
    textBody: payload.textBody || '',
    htmlBody: payload.htmlBody || '',
    headers: payload.headers || {}
  });

  return { stored: true, mailbox, email: normalizeEmail(email) };
}
