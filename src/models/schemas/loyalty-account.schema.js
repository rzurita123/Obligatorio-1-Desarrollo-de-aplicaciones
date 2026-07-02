const mongoose = require("mongoose");

const loyaltyAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    pointsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ["BASIC", "SILVER", "GOLD"],
      default: "BASIC",
    },
  },
  { timestamps: true }
);

module.exports = loyaltyAccountSchema;
