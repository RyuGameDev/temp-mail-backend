import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema(
  {
    mailboxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mailbox',
      required: true,
      index: true
    },
    messageId: {
      type: String,
      default: null,
      index: true
    },
    fromAddress: {
      type: String,
      required: true,
      trim: true
    },
    toAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    subject: {
      type: String,
      default: ''
    },
    textBody: {
      type: String,
      default: ''
    },
    htmlBody: {
      type: String,
      default: ''
    },
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

emailSchema.index({ mailboxId: 1, createdAt: -1 });

export const Email = mongoose.model('Email', emailSchema);
