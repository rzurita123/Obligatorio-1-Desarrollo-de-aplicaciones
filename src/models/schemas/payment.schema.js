const mongoose = require("mongoose");

/**
 * Pago simulado. `clientPaymentId` para idempotencia.
 */
const paymentSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    /** Si se envía, no debe duplicarse por mesa (índice compuesto único). */
    clientPaymentId: { type: String, trim: true },
    status: {
      type: String,
      enum: ["COMPLETED"],
      default: "COMPLETED",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ tableId: 1, createdAt: -1 });

paymentSchema.index(
  { tableId: 1, clientPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientPaymentId: { $exists: true, $type: "string", $ne: "" },
    },
  }
);

module.exports = paymentSchema;
