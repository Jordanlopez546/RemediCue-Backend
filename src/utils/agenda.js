const Agenda = require("agenda");
const Medication = require("../models/Medication");
const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");

require("dotenv").config();

const MONGO_URL = `mongodb+srv://jordannwabuike:${process.env.REMEDICUE_DB_PW}@cluster0.jz5vxdm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Set up Agenda
const agenda = new Agenda({ db: { address: MONGO_URL } });

// Helper function to set reminder time
function setReminderTime(baseDate, hours, minutes) {
  const reminderTime = new Date(baseDate);
  reminderTime.setHours(hours);
  reminderTime.setMinutes(minutes);
  reminderTime.setSeconds(0);
  reminderTime.setMilliseconds(0);
  return reminderTime;
}

// Function to schedule reminders
const scheduleReminders = async function (medication) {
  if (medication && !medication.isCompleted && !medication.isFinished) {
    const now = new Date();
    const reminderTimes = [];
    let missedDoses = 0;

    // Helper function to add reminder if the time has not passed
    const addReminderIfNotPassed = (hours, minutes, reminderOffset) => {
      const medicationTime = setReminderTime(now, hours, minutes);

      if (medicationTime > now) {
        reminderTimes.push({ medicationTime, reminderOffset });
      } else {
        missedDoses++;
      }
    };

    // Check if there are remaining doses
    if (medication.remainingDoses > 0) {
      // For once daily medication
      if (medication.frequency === "once_daily") {
        addReminderIfNotPassed(14, 0, 10);
      }

      // For twice daily medication
      else if (medication.frequency === "twice_daily") {
        addReminderIfNotPassed(9, 0, 10);
        addReminderIfNotPassed(20, 0, 10);
      }

      // For thrice daily medication
      else if (medication.frequency === "thrice_daily") {
        addReminderIfNotPassed(9, 0, 10);
        addReminderIfNotPassed(14, 0, 10);
        addReminderIfNotPassed(20, 0, 10);
      }

      // Update remaining doses based on missed doses
      medication.remainingDoses -= missedDoses;

      // If no reminders were scheduled, it means all doses were missed
      if (reminderTimes.length <= 0) {
        medication.remainingDoses = 0;
        medication.isFinished = true;
        console.log(
          `All doses were missed for medication ID: ${medication._id}`
        );
      } else {
        // Schedule the reminders
        for (const { medicationTime, reminderOffset } of reminderTimes) {
          const reminderTime = new Date(
            medicationTime.getTime() - reminderOffset * 60 * 1000
          );

          // Schedule the 10-minute before reminder
          await agenda.schedule(reminderTime, "send reminder", {
            medicationId: medication._id,
            time: reminderTime,
          });

          // Schedule the actual medication time reminder
          await agenda.schedule(medicationTime, "send medication", {
            medicationId: medication._id,
            time: medicationTime,
          });

          // Create reminder entry
          try {
            const reminder = await Reminder.create({
              user: medication.user,
              medication: medication._id,
              reminderTime: medicationTime,
            });
            await reminder.save();
            console.log(
              `Reminder created for medication ID: ${medication._id} at time: ${medicationTime}`
            );
          } catch (error) {
            console.error(
              `Error creating reminder for medication ID: ${medication._id}`,
              error
            );
          }
        }
      }

      // Save the medication state after processing
      await medication.save();
      console.log(
        `Medication saved with updated remaining doses: ${medication.remainingDoses}`
      );
    }
  }
};

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

// Start agenda instance
(async function () {
  try {
    await agenda.start();
    console.log("Agenda has started running and has been initialized!!");

    // Execute the reset remaining doses
    agenda.every("0 0 * * *", "reset daily doses");
    console.log("Agenda is running reset daily doses.");
  } catch (error) {
    console.error("Error starting Agenda:", error);
  }
})();

module.exports = { agenda, scheduleReminders, cancelReminders };
