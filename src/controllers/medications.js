const Medication = require("../models/Medication");

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
      return res.status(401).json({
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

    return res.status(201).json(savedMedication);
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

const editMedication = async (req, res) => {
  try {
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
      return res.status(401).json({
        message: "Medication with this name already exists.",
      });
    }

    const medication = await Medication.findByIdAndUpdate(
      medicationId,
      { user: userId, name: name, dosage: dosage, frequency: frequency },
      { new: true }
    );

    if (!medication) {
      return res.status(400).json({
        message: "Medication not updated.",
      });
    }

    return res.status(201).json(medication);
  } catch (err) {
    return res.status(500).json({
      message: "Error occured.",
      error: err.message,
    });
  }
};

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

    const deleteMedication = await Medication.findByIdAndDelete(medicationId);

    if (!deleteMedication) {
      return res.status(400).json({ message: "Medication not deleted." });
    }

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
};
