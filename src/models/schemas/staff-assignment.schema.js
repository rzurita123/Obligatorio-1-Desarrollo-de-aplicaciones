const mongoose = require("mongoose");

/**
 * Mozo u otro staff asignado a un negocio (un usuario employee puede tener varios negocios).
 */
const staffAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

staffAssignmentSchema.index({ userId: 1, businessId: 1 }, { unique: true });

module.exports = staffAssignmentSchema;
