const mongoose = require("mongoose");

/**
 * Participante en una mesa (usuario registrado o guest con nombre).
 * JWT de participante referencia este documento.
 */
const participantSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = participantSchema;
