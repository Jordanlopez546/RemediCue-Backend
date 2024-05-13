const mongoose = require("mongoose");

const ReminderModel = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medication",
    required: true,
  },
  reminderTime: {
    type: Date,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const Reminder = mongoose.model("Reminder", ReminderModel);

module.exports = Reminder;
