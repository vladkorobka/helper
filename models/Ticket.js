import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    // Status is computed from reportSent + invoiced — do not set manually
    status: {
      type: String,
      enum: ['waiting', 'sent', 'invoiced'],
      default: 'waiting',
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    email: { type: String, trim: true, default: '' },
    orderedBy: { type: String, trim: true, default: '' },
    duration: { type: Number, required: true, min: 0 }, // minutes
    description: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
    service_type: { type: String, required: true, trim: true },
    priceType: { type: Number, default: 0 },
    category: { type: String, required: true, trim: true },
    commute: { type: Boolean, default: false },
    needsInvoice: { type: Boolean, default: false }, // whether an invoice should be issued for this ticket
    // Irreversible flags that drive the status
    reportSent: { type: Boolean, default: false },   // email report sent to client — cannot be unset
    invoiced: { type: Boolean, default: false },     // invoice issued — cannot be unset
    executor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

// Compound indexes for common filter patterns
ticketSchema.index({ date: -1, status: 1 });
ticketSchema.index({ client: 1, date: -1 });
ticketSchema.index({ executor: 1, date: -1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ createdAt: -1 });

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
