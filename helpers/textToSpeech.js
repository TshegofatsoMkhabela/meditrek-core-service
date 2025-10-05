const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Voice mappings for South African languages
const VOICE_MAPPINGS = {
  af: "af-ZA-AdriNeural", // Afrikaans
  en: "en-ZA-LeahNeural", // English (South African)
  zu: "zu-ZA-ThandomNeural", // Zulu
  // For languages without specific SA voices, use closest alternatives
  xh: "en-ZA-LeahNeural", // Xhosa (fallback to English SA)
  st: "en-ZA-LeahNeural", // Sesotho (fallback to English SA)
  tn: "en-ZA-LeahNeural", // Setswana (fallback to English SA)
  nso: "en-ZA-LeahNeural", // Northern Sotho (fallback to English SA)
  ss: "en-ZA-LeahNeural", // Swati (fallback to English SA)
  ve: "en-ZA-LeahNeural", // Venda (fallback to English SA)
  nr: "en-ZA-LeahNeural", // Southern Ndebele (fallback to English SA)
  ts: "en-ZA-LeahNeural", // Tsonga (fallback to English SA)
};

// Alternative voices for variety
const ALTERNATIVE_VOICES = {
  af: ["af-ZA-AdriNeural", "af-ZA-WillemNeural"],
  en: ["en-ZA-LeahNeural", "en-ZA-LukeNeural"],
  zu: ["zu-ZA-ThandomNeural"],
};

/**
 * Convert text to speech using Azure Cognitive Services
 * @param {string} text - Text to convert to speech
 * @param {string} languageCode - Language code (e.g., 'en', 'af', 'zu')
 * @param {object} options - Additional options
 * @returns {Promise<Buffer>} Audio buffer
 */
const convertTextToSpeech = async (text, languageCode = "en", options = {}) => {
  try {
    console.log(
      `Converting text to speech: ${text.substring(0, 50)}... (${languageCode})`
    );

    // Check if Azure TTS is configured
    if (!isAzureTTSConfigured()) {
      throw new Error("Azure Text-to-Speech is not properly configured");
    }

    // Create speech config
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_TTS_KEY,
      process.env.AZURE_TTS_REGION
    );

    // Set voice based on language
    const voice = getVoiceForLanguage(languageCode, options.voiceGender);
    speechConfig.speechSynthesisVoiceName = voice;

    // Set output format
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Create synthesizer
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log(`TTS synthesis completed for ${languageCode}`);
            const audioBuffer = Buffer.from(result.audioData);
            synthesizer.close();
            resolve(audioBuffer);
          } else {
            console.error("TTS synthesis failed:", result.errorDetails);
            synthesizer.close();
            reject(new Error(`TTS synthesis failed: ${result.errorDetails}`));
          }
        },
        (error) => {
          console.error("TTS synthesis error:", error);
          synthesizer.close();
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error("Text-to-speech conversion error:", error);
    throw error;
  }
};

/**
 * Convert text to speech and save as temporary file
 * @param {string} text - Text to convert
 * @param {string} languageCode - Language code
 * @param {object} options - Options
 * @returns {Promise<string>} Path to audio file
 */
const convertTextToSpeechFile = async (
  text,
  languageCode = "en",
  options = {}
) => {
  try {
    const audioBuffer = await convertTextToSpeech(text, languageCode, options);

    // Create temporary file
    const fileName = `tts_${uuidv4()}.mp3`;
    const filePath = path.join(__dirname, "../temp", fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write audio buffer to file
    fs.writeFileSync(filePath, audioBuffer);

    console.log(`TTS audio saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error saving TTS audio file:", error);
    throw error;
  }
};

/**
 * Get appropriate voice for language
 * @param {string} languageCode - Language code
 * @param {string} gender - Preferred gender ('male' or 'female')
 * @returns {string} Voice name
 */
const getVoiceForLanguage = (languageCode, gender = "female") => {
  // Check if we have alternative voices for this language
  if (ALTERNATIVE_VOICES[languageCode]) {
    const voices = ALTERNATIVE_VOICES[languageCode];

    // Try to select based on gender preference
    if (gender === "male") {
      const maleVoice = voices.find(
        (v) => v.includes("Male") || v.includes("Willem") || v.includes("Luke")
      );
      if (maleVoice) return maleVoice;
    }

    // Return first available voice or random selection
    return voices[Math.floor(Math.random() * voices.length)];
  }

  // Return mapped voice or default
  return VOICE_MAPPINGS[languageCode] || VOICE_MAPPINGS["en"];
};

/**
 * Get available voices for a language
 * @param {string} languageCode - Language code
 * @returns {array} Array of available voices
 */
const getAvailableVoicesForLanguage = (languageCode) => {
  return (
    ALTERNATIVE_VOICES[languageCode] || [
      VOICE_MAPPINGS[languageCode] || VOICE_MAPPINGS["en"],
    ]
  );
};

/**
 * Check if Azure TTS is properly configured
 * @returns {boolean} Configuration status
 */
const isAzureTTSConfigured = () => {
  return !!(process.env.AZURE_TTS_KEY && process.env.AZURE_TTS_REGION);
};

/**
 * Clean up temporary audio files
 * @param {string} filePath - Path to file to delete
 */
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    console.error("Error cleaning up temp file:", error);
  }
};

/**
 * Get TTS configuration info
 * @returns {object} Configuration information
 */
const getTTSInfo = () => {
  return {
    configured: isAzureTTSConfigured(),
    supportedLanguages: Object.keys(VOICE_MAPPINGS),
    voiceMappings: VOICE_MAPPINGS,
    alternativeVoices: ALTERNATIVE_VOICES,
  };
};

module.exports = {
  convertTextToSpeech,
  convertTextToSpeechFile,
  getVoiceForLanguage,
  getAvailableVoicesForLanguage,
  isAzureTTSConfigured,
  cleanupTempFile,
  getTTSInfo,
};
