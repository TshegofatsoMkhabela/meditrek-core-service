const express = require("express");
const router = express.Router();
const cors = require("cors");
const {
  testAssistant,
  sendMessage,
  sendMessageWithAudio,
  sendMessageWithAudioFile,
  detectOnly,
  getSupportedLanguages,
  getTTSStatus,
} = require("../controllers/languageController");

// Enable CORS for this route
router.use(cors());

// assistant/ - Test endpoint
router.get("/", testAssistant);

// Text-only response
router.post("/message", sendMessage);

// Text response with audio (base64 in JSON)
router.post("/message-audio", sendMessageWithAudio);

// Audio file download response
router.post("/message-audio-file", sendMessageWithAudioFile);

// Detect language of user text
router.post("/detect", detectOnly);

// Get supported languages and TTS info
router.get("/languages", getSupportedLanguages);

// Get TTS service status and configuration
router.get("/tts-status", getTTSStatus);

module.exports = router;
