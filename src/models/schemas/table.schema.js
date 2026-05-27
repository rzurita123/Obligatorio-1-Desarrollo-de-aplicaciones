const mongoose = require("mongoose");

/**
 * Mesa del restaurante. Pertenece a un `Business`.
 * `label` y `qrCode` únicos por negocio (índices compuestos).
 */
const tableSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    qrCode: {
      type: String,
      required: true,
      trim: true,
    },
    label: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    tipMode: {
      type: String,
      enum: ["none", "percent", "fixed"],
      default: "none",
    },
    tipValue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

tableSchema.index({ businessId: 1, label: 1 }, { unique: true });
tableSchema.index({ businessId: 1, qrCode: 1 }, { unique: true });
tableSchema.index({ businessId: 1, createdAt: -1 });

module.exports = tableSchema;
