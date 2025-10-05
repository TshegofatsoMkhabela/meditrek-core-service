const express = require("express");
const router = express.Router();
const {
  addPharmacy,
  addStock,
  searchStock,
} = require("../controllers/pharmacyController");

// Add a new pharmacy (hospital)
router.post("/pharmacies", addPharmacy);

// Add or update stock for a hospital by its dbName
router.post("/pharmacies/:id/stock", addStock);

// Search for a pill across hospitals (optionally provide lng/lat)
router.get("/search/pill", searchStock);

module.exports = router;
