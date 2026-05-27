const mongoose = require("mongoose");

/**
 * Restaurante / bar (tenant). Las mesas pertenecen a un negocio (`Business`).
 */
const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 80,
      sparse: true,
      unique: true,
    },
    address: { type: String, trim: true, maxlength: 240, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

businessSchema.index({ name: 1 });

module.exports = businessSchema;
