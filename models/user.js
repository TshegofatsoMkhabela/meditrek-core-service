const mongoose = require("mongoose");
const { Schema } = mongoose;

// Subdocument schema for medications
const medicationSchema = new Schema({
  medicationName: { type: String, required: true }, // e.g. "Panado"
  dosage: { type: String, required: true }, // e.g. "500mg"
  frequency: { type: String, required: true }, // e.g. "2 per day"
  reminders: { type: [String], default: [] }, // e.g. ["08:00", "20:00"]
  createdAt: { type: Date, default: Date.now },
});

// Define the structure (schema) for a user document
const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  idNumber: { type: String, unique: true, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, default: "" },
  password: { type: String, required: true },
  medications: { type: [medicationSchema], default: [] },
});

// Create a model based on the schema
const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
