const Hospital = require("../models/hospital");

/**
 * Add a new pharmacy (hospital)
 * Expects JSON body: { name, address, lng, lat }
 */
const addPharmacy = async (req, res) => {
  try {
    const { name, address, lng, lat } = req.body;

    if (!name || !address || lng == null || lat == null) {
      return res
        .status(400)
        .json({ error: "Name, address, and coordinates are required" });
    }

    const hospital = new Hospital({
      name,
      address,
      location: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      stock: [],
    });

    await hospital.save();
    res.status(201).json({ message: "Pharmacy added", hospital });
  } catch (error) {
    console.error("Error adding pharmacy:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Add or update stock for a specific pharmacy
 * Expects JSON body: [{ medicationName, quantity }, ...] OR { medicationName, quantity }
 * Uses :id in route params for pharmacy
 */
const addStock = async (req, res) => {
  try {
    const { id } = req.params;
    let stockItems = req.body;

    // Wrap single object in array if needed
    if (!Array.isArray(stockItems)) stockItems = [stockItems];

    const hospital = await Hospital.findById(id);
    if (!hospital) return res.status(404).json({ error: "Pharmacy not found" });

    stockItems.forEach(({ medicationName, quantity }) => {
      if (!medicationName || quantity == null) return;

      const existingIndex = hospital.stock.findIndex(
        (item) =>
          item.medicationName.toLowerCase() === medicationName.toLowerCase()
      );

      if (existingIndex >= 0) {
        hospital.stock[existingIndex].quantity = quantity;
      } else {
        hospital.stock.push({ medicationName, quantity });
      }
    });

    await hospital.save();
    res.json({ message: "Stock updated", stock: hospital.stock });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Search stock across all pharmacies near a location
 * Query parameters: ?medicine=XXX&lng=XXX&lat=XXX&maxDistance=YYY
 */
const searchStock = async (req, res) => {
  try {
    const { medicine, lng, lat, maxDistance } = req.query;

    if (!medicine || !lng || !lat || !maxDistance) {
      return res
        .status(400)
        .json({ error: "All query parameters are required" });
    }

    const pharmacies = await Hospital.find({
      stock: {
        $elemMatch: {
          medicationName: { $regex: `^${medicine}$`, $options: "i" }, // Case-insensitive match
        },
      },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(maxDistance),
        },
      },
    });

    if (!pharmacies.length) {
      return res.json({
        message: "No pharmacies found with this medication nearby",
      });
    }

    res.json(pharmacies);
  } catch (error) {
    console.error("Error searching stock:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  addPharmacy,
  addStock,
  searchStock,
};
