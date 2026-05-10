import mongoose from 'mongoose';

const mailboxSchema = new mongoose.Schema(
  {
    localPart: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    domain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    deactivatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

mailboxSchema.index({ domain: 1, localPart: 1 }, { unique: true });

export const Mailbox = mongoose.model('Mailbox', mailboxSchema);
