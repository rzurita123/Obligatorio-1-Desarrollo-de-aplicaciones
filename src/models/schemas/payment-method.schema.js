const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      trim: true,
      default: "mock",
    },
    type: {
      type: String,
      enum: ["card"],
      default: "card",
    },
    brand: {
      type: String,
      trim: true,
      required: true,
    },
    last4: {
      type: String,
      trim: true,
      required: true,
      match: /^\d{4}$/,
    },
    expMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },
    expYear: {
      type: Number,
      min: 2000,
      max: 3000,
      default: null,
    },
    tokenRef: {
      type: String,
      trim: true,
      required: true,
    },
    alias: {
      type: String,
      trim: true,
      default: "",
      maxlength: 80,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ userId: 1, active: 1, createdAt: -1 });

module.exports = paymentMethodSchema;
