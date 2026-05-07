const mongoose = require("mongoose");

const assignmentLineSchema = new mongoose.Schema(
  {
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

/**
 * Consumo cargado en la mesa. Reparto opcional vía `assignments`.
 */
const itemSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    /** Monto total de la línea (moneda mínima, ej. centavos o unidad entera acordada). */
    amount: { type: Number, required: true, min: 0 },
    assignments: { type: [assignmentLineSchema], default: [] },
  },
  { timestamps: true }
);

itemSchema.index({ tableId: 1, createdAt: 1 });

module.exports = itemSchema;
