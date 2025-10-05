const {
  detectLanguage,
  translateText,
  getSouthAfricanLanguages,
} = require("../helpers/language");

const {
  convertTextToSpeech,
  convertTextToSpeechFile,
  isAzureTTSConfigured,
  getTTSInfo,
} = require("../helpers/textToSpeech");

// Test endpoint for assistant
const testAssistant = (req, res) => {
  res.json({
    message: "Language Assistant API is working!",
    supportedLanguages: getSouthAfricanLanguages(),
    ttsInfo: getTTSInfo(),
    endpoints: {
      test: "GET /assistant/",
      message: "POST /assistant/message",
      messageWithAudio: "POST /assistant/message-audio",
      messageWithAudioFile: "POST /assistant/message-audio-file",
      detect: "POST /assistant/detect",
      languages: "GET /assistant/languages",
      ttsStatus: "GET /assistant/tts-status",
    },
  });
};

// Send message endpoint - main functionality (text only)
const sendMessage = async (req, res) => {
  // Body: { message: "user text here" }
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Processing message:", message);

    // Detect the language of input message
    const detectedLanguage = await detectLanguage(message);
    console.log("Detected language:", detectedLanguage);

    // Generate response in the same language
    const response = await generateResponseInLanguage(
      message,
      detectedLanguage
    );

    res.json({
      success: true,
      inputMessage: message,
      detectedLanguage: detectedLanguage,
      detectedLanguageName:
        getSouthAfricanLanguages()[detectedLanguage] || "Unknown",
      response: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Language processing error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process message",
      details: error.message,
    });
  }
};

// Send message endpoint with audio response
const sendMessageWithAudio = async (req, res) => {
  // Body: {
  //   message: "user text here",
  //   voiceGender: "female|male" (optional, default: "female"),
  //   includeTextResponse: true|false (optional, default: true)
  // }
  try {
    const {
      message,
      voiceGender = "female",
      includeTextResponse = true,
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Processing message with audio:", message);

    // Check if TTS is configured
    if (!isAzureTTSConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Text-to-Speech service is not configured",
        fallback: "Use /assistant/message endpoint for text-only responses",
      });
    }

    // Detect the language of input message
    const detectedLanguage = await detectLanguage(message);
    console.log("Detected language:", detectedLanguage);

    // Generate response in the same language
    const textResponse = await generateResponseInLanguage(
      message,
      detectedLanguage
    );

    // Convert response to audio
    const audioBuffer = await convertTextToSpeech(
      textResponse,
      detectedLanguage,
      { voiceGender }
    );

    // Convert audio buffer to base64 for JSON response
    const audioBase64 = audioBuffer.toString("base64");

    const responseData = {
      success: true,
      inputMessage: message,
      detectedLanguage: detectedLanguage,
      detectedLanguageName:
        getSouthAfricanLanguages()[detectedLanguage] || "Unknown",
      audio: {
        data: audioBase64,
        format: "mp3",
        encoding: "base64",
        language: detectedLanguage,
      },
      timestamp: new Date().toISOString(),
    };

    // Optionally include text response
    if (includeTextResponse) {
      responseData.response = textResponse;
    }

    res.json(responseData);
  } catch (error) {
    console.error("Language processing with TTS error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process message with audio",
      details: error.message,
    });
  }
};

// Send message endpoint with audio file download
const sendMessageWithAudioFile = async (req, res) => {
  // Body: {
  //   message: "user text here",
  //   voiceGender: "female|male" (optional, default: "female")
  // }
  // Returns: Audio file stream with headers containing text response info

  let tempFilePath = null;

  try {
    const { message, voiceGender = "female" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Processing message with audio file:", message);

    // Check if TTS is configured
    if (!isAzureTTSConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Text-to-Speech service is not configured",
      });
    }

    // Detect the language of input message
    const detectedLanguage = await detectLanguage(message);
    console.log("Detected language:", detectedLanguage);

    // Generate response in the same language
    const textResponse = await generateResponseInLanguage(
      message,
      detectedLanguage
    );

    // Convert response to audio file
    tempFilePath = await convertTextToSpeechFile(
      textResponse,
      detectedLanguage,
      { voiceGender }
    );

    // Set headers for file download
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="response_${Date.now()}.mp3"`
    );
    res.setHeader("X-Response-Text", encodeURIComponent(textResponse));
    res.setHeader("X-Detected-Language", detectedLanguage);
    res.setHeader(
      "X-Detected-Language-Name",
      encodeURIComponent(
        getSouthAfricanLanguages()[detectedLanguage] || "Unknown"
      )
    );

    // Stream the audio file
    const fs = require("fs");
    const audioStream = fs.createReadStream(tempFilePath);

    audioStream.pipe(res);

    // Clean up temp file after streaming
    audioStream.on("end", () => {
      const { cleanupTempFile } = require("../helpers/textToSpeech");
      setTimeout(() => cleanupTempFile(tempFilePath), 1000); // Delay cleanup slightly
    });
  } catch (error) {
    console.error("Language processing with TTS file error:", error);

    // Clean up temp file on error
    if (tempFilePath) {
      const { cleanupTempFile } = require("../helpers/textToSpeech");
      cleanupTempFile(tempFilePath);
    }

    res.status(500).json({
      success: false,
      error: "Failed to process message with audio file",
      details: error.message,
    });
  }
};

// Helper function to generate response in detected language
const generateResponseInLanguage = async (text, languageCode) => {
  try {
    // Create a contextual response message
    const responseMessages = [
      "Thank you for your message. How can I assist you today?",
      "I have received your message and I'm here to help.",
      "Hello! I understand you've sent me a message. What would you like to know?",
      "I've processed your message successfully. How may I help you?",
      "I'm here to assist you. What information do you need?",
      "Your message has been received. How can I support you today?",
    ];

    // Pick a random response
    const randomResponse =
      responseMessages[Math.floor(Math.random() * responseMessages.length)];

    // If detected language is not English, translate the response
    if (languageCode !== "en") {
      const translatedResponse = await translateText(
        randomResponse,
        languageCode
      );
      return translatedResponse;
    }

    return randomResponse;
  } catch (error) {
    console.error("Response generation error:", error);
    // Fallback response
    return `I received your message: "${text}". Thank you for reaching out!`;
  }
};

// Additional endpoint for language detection only
const detectOnly = async (req, res) => {
  // Body: { text: "text to detect" }
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const detectedLanguage = await detectLanguage(text);

    res.json({
      success: true,
      text: text,
      detectedLanguage: detectedLanguage,
      detectedLanguageName:
        getSouthAfricanLanguages()[detectedLanguage] || "Unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Language detection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to detect language",
      details: error.message,
    });
  }
};

// Get supported languages
const getSupportedLanguages = (req, res) => {
  try {
    const languages = getSouthAfricanLanguages();
    const ttsInfo = getTTSInfo();

    res.json({
      success: true,
      supportedLanguages: languages,
      count: Object.keys(languages).length,
      ttsSupported: ttsInfo.configured,
      ttsInfo: ttsInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch supported languages",
      details: error.message,
    });
  }
};

// Get TTS status and configuration
const getTTSStatus = (req, res) => {
  try {
    const ttsInfo = getTTSInfo();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...ttsInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get TTS status",
      details: error.message,
    });
  }
};

module.exports = {
  testAssistant,
  sendMessage,
  sendMessageWithAudio,
  sendMessageWithAudioFile,
  detectOnly,
  getSupportedLanguages,
  getTTSStatus,
};
