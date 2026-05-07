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
    label: { type: String, trim: true },
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
