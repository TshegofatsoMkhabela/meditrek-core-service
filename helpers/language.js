const axios = require("axios");

// South African official languages with Azure Translator codes
const SOUTH_AFRICAN_LANGUAGES = {
  af: "Afrikaans",
  en: "English",
  nr: "Southern Ndebele",
  nso: "Northern Sotho (Pedi)",
  ss: "Swati (siSwati)",
  st: "Southern Sotho (Sesotho)",
  tn: "Tswana (Setswana)",
  ve: "Venda (Tshivenda)",
  xh: "Xhosa (isiXhosa)",
  zu: "Zulu (isiZulu)",
  ts: "Tsonga (Xitsonga)",
};

const detectLanguage = async (text) => {
  try {
    console.log("Detecting language for text:", text.substring(0, 50));

    const response = await axios({
      method: "post",
      url: `${process.env.AZURE_TRANSLATOR_ENDPOINT}/detect?api-version=3.0`,
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json",
      },
      data: [
        {
          text: text,
        },
      ],
      timeout: 5000, // 5 second timeout
    });

    const detectedLang = response.data[0].language;
    const confidence = response.data[0].score;

    console.log(
      `Detected language: ${detectedLang} (confidence: ${confidence})`
    );

    // Check if detected language is a South African language
    if (SOUTH_AFRICAN_LANGUAGES[detectedLang]) {
      return detectedLang;
    }

    // For some languages, Azure might return different codes
    // Map common variations
    const languageMapping = {
      "zu-ZA": "zu",
      "af-ZA": "af",
      "xh-ZA": "xh",
      "en-ZA": "en",
    };

    if (languageMapping[detectedLang]) {
      return languageMapping[detectedLang];
    }

    // Default to English if not a SA language or if confidence is low
    return "en";
  } catch (error) {
    console.error("Language detection error:", error.message);

    // Fallback language detection using simple patterns
    if (
      text.toLowerCase().includes("sawubona") ||
      text.toLowerCase().includes("ngiyabonga")
    ) {
      return "zu"; // Zulu
    }
    if (
      text.toLowerCase().includes("hallo") ||
      text.toLowerCase().includes("dankie")
    ) {
      return "af"; // Afrikaans
    }
    if (
      text.toLowerCase().includes("molo") ||
      text.toLowerCase().includes("enkosi")
    ) {
      return "xh"; // Xhosa
    }

    return "en"; // Default to English
  }
};

const translateText = async (text, targetLanguage) => {
  try {
    console.log(`Translating to ${targetLanguage}:`, text.substring(0, 50));

    const response = await axios({
      method: "post",
      url: `${process.env.AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${targetLanguage}`,
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json",
      },
      data: [
        {
          text: text,
        },
      ],
      timeout: 10000, // 10 second timeout
    });

    const translatedText = response.data[0].translations[0].text;
    console.log("Translation successful:", translatedText.substring(0, 50));

    return translatedText;
  } catch (error) {
    console.error("Translation error:", error.message);

    // Return original text if translation fails
    throw new Error(`Translation failed: ${error.message}`);
  }
};

const translateToMultipleLanguages = async (text, targetLanguages) => {
  try {
    const toParam = targetLanguages.join("&to=");

    const response = await axios({
      method: "post",
      url: `${process.env.AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${toParam}`,
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json",
      },
      data: [
        {
          text: text,
        },
      ],
      timeout: 15000,
    });

    const translations = {};
    response.data[0].translations.forEach((translation) => {
      const langName =
        SOUTH_AFRICAN_LANGUAGES[translation.to] || translation.to;
      translations[langName] = translation.text;
    });

    return translations;
  } catch (error) {
    console.error("Multi-language translation error:", error);
    throw error;
  }
};

const getSouthAfricanLanguages = () => {
  return SOUTH_AFRICAN_LANGUAGES;
};

const getLanguageName = (code) => {
  return SOUTH_AFRICAN_LANGUAGES[code] || code;
};

const isAzureConfigured = () => {
  return !!(
    process.env.AZURE_TRANSLATOR_KEY &&
    process.env.AZURE_TRANSLATOR_ENDPOINT &&
    process.env.AZURE_TRANSLATOR_REGION
  );
};

module.exports = {
  detectLanguage,
  translateText,
  translateToMultipleLanguages,
  getSouthAfricanLanguages,
  getLanguageName,
  isAzureConfigured,
};
