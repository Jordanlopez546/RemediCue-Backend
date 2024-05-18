const agenda = require("../utils/agenda");
const Reminder = require("../models/Reminder");

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

function setReminderTime(baseDate, hours, minutes) {
  const reminderTime = new Date(baseDate);
  reminderTime.setHours(hours);
  reminderTime.setMinutes(minutes);
  reminderTime.setSeconds(0);
  reminderTime.setMilliseconds(0);
  return reminderTime;
}

module.exports = scheduleReminders;
