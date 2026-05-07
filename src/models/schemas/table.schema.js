const mongoose = require("mongoose");

/**
 * Mesa del restaurante. `qrCode` único para acceso.
 */
const tableSchema = new mongoose.Schema(
  {
    qrCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    label: { type: String, required: true, trim: true, unique: true },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = tableSchema;
