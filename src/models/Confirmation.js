const mongoose = require("mongoose");

const ConfirmationModel = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
      required: true,
    },
    confirmationTime: {
      type: Date,
      default: Date.now,
    },
    confirmationPrompt: {
      type: String,
      required: true,
    },
    confirmationResponse: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Confirmation = mongoose.model("Confirmation", ConfirmationModel);

module.exports = Confirmation;
