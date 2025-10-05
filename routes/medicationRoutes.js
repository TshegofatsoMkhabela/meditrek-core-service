const express = require("express");
const router = express.Router();
const {
  addMedication,
  getMedications,
} = require("../controllers/medicationController");
const requireAuth = require("../middleware/authMiddleware");

// Add a new medication
router.post("/", requireAuth, addMedication);

// Get all medications for logged-in user
router.get("/", requireAuth, getMedications);

module.exports = router;
