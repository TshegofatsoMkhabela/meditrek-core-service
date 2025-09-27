const dotenv = require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { mongoose } = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const app = express();

// Database Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to Database"))
  .catch((error) => console.log("Database not connected", error));

const allowedOrigins = [process.env.CORS_ORIGIN, "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: "10mb" })); // Increased limit for audio data
app.use(cookieParser());
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Create temp directory for TTS files if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("Created temp directory for TTS files");
}

// Serve static files from temp directory (optional - for direct file access)
app.use("/temp", express.static(tempDir));

// All API routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/medications", require("./routes/medicationRoutes"));
app.use("/hospital", require("./routes/pharmacyRoutes"));
app.use("/assistant", require("./routes/languageRoutes"));

// Health check endpoint
app.get("/health", (req, res) => {
  const { isAzureTTSConfigured } = require("./helpers/textToSpeech");
  const { isAzureConfigured } = require("./helpers/language");

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      database:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      azureTranslator: isAzureConfigured() ? "Configured" : "Not configured",
      azureTTS: isAzureTTSConfigured() ? "Configured" : "Not configured",
    },
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Global error handler for audio processing
app.use((error, req, res, next) => {
  if (error && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "File too large",
      message: "Audio data exceeds maximum size limit",
    });
  }

  console.error("Global error handler:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error.message,
  });
});

// Cleanup temp files on server shutdown
process.on("SIGINT", () => {
  console.log("Cleaning up temp files...");
  try {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach((file) => {
        if (file.startsWith("tts_") && file.endsWith(".mp3")) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      });
      console.log("Temp files cleaned up");
    }
  } catch (error) {
    console.error("Error cleaning up temp files:", error);
  }
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);

  // Log service configuration status
  const { isAzureTTSConfigured } = require("./helpers/textToSpeech");
  const { isAzureConfigured } = require("./helpers/language");

  console.log("Service Status:");
  console.log(
    `- Azure Translator: ${
      isAzureConfigured() ? "✓ Configured" : "✗ Not configured"
    }`
  );
  console.log(
    `- Azure Text-to-Speech: ${
      isAzureTTSConfigured() ? "✓ Configured" : "✗ Not configured"
    }`
  );
});
