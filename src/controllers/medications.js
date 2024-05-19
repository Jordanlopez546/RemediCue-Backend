const Medication = require("../models/Medication");
const { scheduleReminders, cancelReminders } = require("../utils/agenda");

// Get all medications that is not completed or cancelled
const getAllMedications = async (req, res) => {
  try {
    const userData = req.userData;
    const userId = userData.userId;

    const allMedications = await Medication.find({ user: userId });

    if (allMedications.length <= 0) {
      return res.status(404).json({ message: "No medications present." });
    }

    return res.status(200).json(allMedications);
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

// Get all completed medications
const getAllCompletedMedications = async (req, res) => {
  try {
    const userData = req.userData;
    const userId = userData.userId;

    const allMedications = await Medication.find({
      user: userId,
      isCompleted: true,
    });

    if (allMedications.length <= 0) {
      return res
        .status(404)
        .json({ message: "No completed medications present." });
    }

    return res.status(200).json(allMedications);
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

// Get a single medication
const getMedication = async (req, res) => {
  try {
    const userData = req.userData;
    const userId = userData.userId;
    const medicationId = req.params.medicationId;

    if (!medicationId) {
      return res.status(400).json({
        message: "Medication id not provided.",
      });
    }

    const medication = await Medication.findById(medicationId, {
      user: userId,
    });

    if (!medication) {
      return res.status(404).json({
        message: "Medication not found.",
      });
    }

    return res.status(200).json(medication);
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

// Create a medication
const createMedication = async (req, res) => {
  try {
    const userData = req.userData;
    const userId = userData.userId;

    const { name, dosage, frequency } = req.body;

    if (!name || !dosage || !frequency) {
      return res.status(400).json({
        message: "Invalid inputs.",
      });
    }

    const medicationExist = await Medication.findOne({ name: name });

    if (medicationExist) {
      return res.status(400).json({
        message: "Medication already exists.",
      });
    }

    const medication = await Medication.create({
      user: userId,
      name: name,
      dosage: dosage,
      frequency: frequency,
    });

    const savedMedication = await medication.save();

    if (!savedMedication) {
      return res.status(400).json({
        message: "Medication not created.",
      });
    }

    // Schedule reminders for the newly created medication
    await scheduleReminders(savedMedication);

    return res.status(201).json({
      message: "Medication created and scheduled successfully.",
      medication: savedMedication,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

// Edit a medication
const editMedication = async (req, res) => {
  try {
    // What you're going to do is to delete the medication,
    // cancel the job, delete the reminder, and then create a new one

    const userData = req.userData;
    const userId = userData.userId;
    const medicationId = req.params.medicationId;

    const { name, dosage, frequency } = req.body;

    if (!name || !dosage || !frequency) {
      return res.status(400).json({
        message: "Invalid inputs.",
      });
    }

    const medicationExist = await Medication.findOne({ name: name });
    const medicationExist2 = await Medication.findById(medicationId);

    // Ensure the medication exists before trying to access its properties
    if (!medicationExist2) {
      return res.status(404).json({
        message: "Medication not found.",
      });
    }

    if (
      medicationExist &&
      medicationExist._id.toString() !== medicationExist2._id.toString()
    ) {
      return res.status(400).json({
        message: "Medication with this name already exists.",
      });
    }

    // Cancel all existing reminders for this medication
    await cancelReminders(medicationExist2._id);

    await Medication.findByIdAndDelete(medicationExist2._id);

    const medication = await Medication.create({
      user: userId,
      name: name,
      dosage: dosage,
      frequency: frequency,
    });

    const savedMedication = await medication.save();

    if (!savedMedication) {
      return res.status(400).json({
        message: "Medication not created.",
      });
    }

    // Schedule reminders for the newly created medication
    await scheduleReminders(savedMedication);

    return res.status(201).json({
      message: "Medication updated successfully.",
      medication: savedMedication,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

// Delete a medication
const deleteMedication = async (req, res) => {
  try {
    const userData = req.userData;
    const userId = userData.userId;
    const medicationId = req.params.medicationId;

    // Find the medication to ensure it belongs to the user
    const medication = await Medication.findOne({
      _id: medicationId,
      user: userId,
    });

    if (!medication) {
      return res.status(404).json({
        message: "Medication not found or user does not own the medication.",
      });
    }

    const deleteMed = await Medication.findByIdAndDelete(medicationId);

    if (!deleteMed) {
      return res.status(400).json({ message: "Medication not deleted." });
    }

    // Cancel all existing reminders for this medication
    await cancelReminders(deleteMed._id);

    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

// Complete a medication
const completeMedication = async (req, res) => {
  try {
    const userData = req.userData;
    const userId = userData.userId;
    const medicationId = req.params.medicationId;

    // Find the medication to ensure it belongs to the user
    const medication = await Medication.findOne({
      _id: medicationId,
      user: userId,
      isCompleted: false,
    });

    if (!medication) {
      return res.status(400).json({
        message:
          "Medication is completed already or it doesn't belong to the user.",
      });
    }

    const completeMed = await Medication.findByIdAndUpdate(medicationId, {
      isCompleted: true,
      remainingDoses: 0,
    });

    if (!completeMed) {
      return res
        .status(400)
        .json({ message: "Medication not completed successfully." });
    }

    // Cancel all existing reminders for this medication
    await cancelReminders(completeMed._id);

    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

module.exports = {
  getAllMedications,
  getMedication,
  createMedication,
  editMedication,
  deleteMedication,
  getAllCompletedMedications,
  completeMedication,
};
