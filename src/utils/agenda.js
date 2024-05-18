const Agenda = require("agenda");
const Medication = require("../models/Medication");
const mongoose = require("mongoose");
const scheduleReminders = require("./reminderScheduler");
const cancelReminders = require("./cancelReminders");

require("dotenv").config();

const MONGO_URL = `mongodb+srv://jordannwabuike:${process.env.REMEDICUE_DB_PW}@cluster0.jz5vxdm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Set up Agenda
const agenda = new Agenda({ db: { address: MONGO_URL } });

// Define job for sending medication reminders
agenda.define("send medication", async (job) => {
  const { medicationId, time } = job.attrs.data;

  try {
    const medication = await Medication.findById(medicationId).populate("user");

    if (!medication) {
      console.error(`Medication with ID ${medicationId} not found.`);
      return;
    }

    console.log(
      `Reminder: It's time to take your medication ${medication.name} at ${time}`
    );

    // Add logic to send notification to the user
    // For example, you can send an email or a push notification
    console.log(`Notification sent to ${medication.user.email}`);

    // Decrement the remaining doses
    if (medication.remainingDoses > 0) {
      medication.remainingDoses -= 1;
    }

    // If no remaining doses, mark the medication as finished
    if (medication.remainingDoses === 0) {
      medication.isFinished = true;
    }

    // Save the updated medication
    await medication.save();
    console.log(
      `Updated medication ID: ${medicationId} with remaining doses: ${medication.remainingDoses}`
    );
  } catch (e) {
    console.error(
      `Error sending reminder for medication ID: ${medicationId}`,
      error
    );
  }
});

// Define job for sending reminders
agenda.define("send reminder", async (job) => {
  const { medicationId, time } = job.attrs.data;

  try {
    const medication = await Medication.findById(medicationId).populate("user");

    if (!medication) {
      console.error(`Medication with ID ${medicationId} not found.`);
      return;
    }

    console.log(
      `Reminder: It's time to take your medication ${medication.name} at ${time}`
    );

    // Add logic to send notification to the user
    // For example, you can send an email or a push notification
    console.log(`Notification sent to ${medication.user.email}`);
  } catch (e) {
    console.error(
      `Error sending reminder for medication ID: ${medicationId}`,
      error
    );
  }
});

// Define job for resetting remaining doses
agenda.define("reset daily doses", async (job) => {
  try {
    const medications = await Medication.find({
      isCompleted: false,
    });

    for (let med of medications) {
      if (med.frequency === "once_daily") {
        med.remainingDoses = 1;
      } else if (med.frequency === "twice_daily") {
        med.remainingDoses = 2;
      } else if (med.frequency === "thrice_daily") {
        med.remainingDoses = 3;
      }

      med.isFinished = false;

      // Save the updated medication
      await med.save();

      // Cancel existing reminders for the medication
      await cancelReminders(med._id);

      // Reschedule reminders for the updated medication
      await scheduleReminders(med);
    }

    console.log("Midnight job completed successfully.");
  } catch (error) {
    console.error("Error in midnight job:", error);
    throw error;
  }
});

module.exports = agenda;
