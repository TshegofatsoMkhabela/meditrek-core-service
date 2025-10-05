const mongoose = require("mongoose");
const { Schema } = mongoose;

// Subdocument schema for medication stock
const stockSchema = new Schema({
  medicationName: { type: String, required: true },
  quantity: { type: Number, required: true },
});

// Main Hospital (Pharmacy) schema
const hospitalSchema = new Schema({
  name: { type: String, required: true }, // Pharmacy name
  address: { type: String, required: true }, // Physical address
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  stock: [stockSchema], // Array of medication stock
});

// Create a 2dsphere index for geospatial queries
hospitalSchema.index({ location: "2dsphere" });

// Create the model
const Hospital = mongoose.model("Hospital", hospitalSchema);

module.exports = Hospital;
