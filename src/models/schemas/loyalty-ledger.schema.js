const mongoose = require("mongoose");

const loyaltyLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["EARN", "REDEEM", "ADJUSTMENT"],
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    sourceType: {
      type: String,
      enum: ["PAYMENT", "MANUAL", "REWARD"],
      default: "MANUAL",
    },
    sourceId: {
      type: String,
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 240,
    },
  },
  { timestamps: true }
);

loyaltyLedgerSchema.index({ userId: 1, createdAt: -1 });
loyaltyLedgerSchema.index(
  { userId: 1, type: 1, sourceType: 1, sourceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceId: { $exists: true, $type: "string", $ne: "" },
    },
  }
);

module.exports = loyaltyLedgerSchema;
