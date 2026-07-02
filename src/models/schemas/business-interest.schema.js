const mongoose = require("mongoose");

const businessInterestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
      index: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
  },
  { timestamps: true }
);

businessInterestSchema.index({ createdAt: -1 });

module.exports = businessInterestSchema;
