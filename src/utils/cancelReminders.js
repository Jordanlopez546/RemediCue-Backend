const Reminder = require("../models/Reminder");
const agenda = require("../utils/agenda");

// Helper function to cancel all reminders for a medication
const cancelReminders = async (medicationId) => {
  try {
    // Delete all reminders associated with the medication
    await Reminder.deleteMany({ medication: medicationId });

    // Cancel all agenda jobs associated with the medication
    await agenda.cancel({ "data.medicationId": medicationId });

    console.log("Reminders cancelled and deleted successfully.");
  } catch (error) {
    console.error("Error cancelling reminders:", error);
    throw error;
  }
};

module.exports = cancelReminders;
