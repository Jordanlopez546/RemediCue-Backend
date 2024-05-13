const mongoose = require("mongoose");

const MedicationModel = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    enum: ["once_daily", "twice_daily", "thrice_daily"],
    required: true,
  },
  quantity: {
    type: String,
    required: false,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  remainingDoses: {
    type: Number,
    required: true,
    default: function () {
      if (this.frequency === "once_daily") return 1;
      else if (this.frequency === "twice_daily") return 2;
      else if (this.frequency === "thrice_daily") return 3;
    },
  },
  isFinished: {
    type: Boolean,
    required: true,
    default: false,
  },
  lastTakenDate: {
    type: Date,
    required: false,
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

MedicationModel.methods.takeDose = function () {
  if (!this.isFinished) {
    this.remainingDoses--;
    if (this.remainingDoses === 0) this.isFinished = true;
    this.lastTakenDate = new Date();
  }
};

const Medication = mongoose.model("Medication", MedicationModel);

module.exports = Medication;
