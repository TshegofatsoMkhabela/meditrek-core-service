const User = require("../models/user");

// Add a medication to the logged-in user
const addMedication = async (req, res) => {
  try {
    const { medicationName, dosage, frequency, reminders } = req.body;

    // Get userId from JWT middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: no user" });
    }

    // Validate required fields
    if (!medicationName || !dosage || !frequency) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const medication = {
      medicationName,
      dosage,
      frequency,
      reminders: reminders || [],
      createdAt: new Date(),
    };

    user.medications.push(medication);
    await user.save();

    res.json({ message: "Medication added", medication });
  } catch (error) {
    console.error("Error adding medication:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all medications for logged-in user
const getMedications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: no user" });
    }

    const user = await User.findById(userId).select("medications");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.medications);
  } catch (error) {
    console.error("Error fetching medications:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  addMedication,
  getMedications,
};
