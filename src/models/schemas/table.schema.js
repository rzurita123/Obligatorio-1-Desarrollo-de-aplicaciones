const mongoose = require("mongoose");
const { SPLIT_TYPE_VALUES } = require("../../constants/split-type.constant");

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
    splitType: {
      type: String,
      enum: SPLIT_TYPE_VALUES,
      default: null,
    },
    splitConfig: { type: mongoose.Schema.Types.Mixed, default: null },
    splitAppliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

tableSchema.index({ businessId: 1, label: 1 }, { unique: true });
tableSchema.index({ businessId: 1, qrCode: 1 }, { unique: true });
tableSchema.index({ businessId: 1, createdAt: -1 });

module.exports = tableSchema;
