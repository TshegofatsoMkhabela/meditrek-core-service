# MediTrek API

A comprehensive medication management and multilingual health assistant API built with Node.js, Express, and MongoDB. This API provides medication tracking, pharmacy location services, and AI-powered language assistance supporting all 11 official South African languages.

## Features

### 🔐 User Authentication

- Secure user registration and login with JWT tokens
- Password hashing with bcrypt
- Profile management

### 💊 Medication Management

- Add and track medications with dosage and frequency
- Set custom medication reminders
- View medication history

### 🏥 Pharmacy Services

- Add pharmacy locations with geospatial data
- Manage pharmacy medication stock
- Search for medications at nearby pharmacies using location-based queries

### 🌍 Multilingual Assistant

- **Language Detection**: Automatically detects user's language
- **Translation**: Supports all 11 South African official languages (English, Afrikaans, Zulu, Xhosa, Sesotho, Setswana, Sepedi, siSwati, Tshivenda, isiNdebele, Xitsonga)
- **Text-to-Speech**: Azure-powered TTS in supported languages
- Three response modes:
  - Text-only responses
  - Text with base64 audio
  - Downloadable audio files

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt
- **AI Services**: Azure Cognitive Services (Translator & Text-to-Speech)
- **Geospatial**: MongoDB 2dsphere indexing

## Quick Setup

### Prerequisites

- Node.js (v14+)
- MongoDB instance
- Azure Cognitive Services account (for translation & TTS features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/TshegofatsoMkhabela/meditrek-core-service.git
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Server
   PORT=8000

   # Database
   MONGO_URL=mongodb://localhost:27017/

   # Authentication
   JWT_SECRET=your_secure_jwt_secret_key

   # CORS
   CORS_ORIGIN=http://localhost:5173

   # Azure Translator
   AZURE_TRANSLATOR_KEY=your_translator_key
   AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
   AZURE_TRANSLATOR_REGION=your_region

   # Azure Text-to-Speech
   AZURE_TTS_KEY=your_tts_key
   AZURE_TTS_REGION=your_region
   ```

4. **Start the server**

   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify setup**

   Visit `http://localhost:8000/health` to check service status

## API Endpoints

### Authentication (`/auth`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (requires auth)

### Medications (`/medications`)

- `POST /medications` - Add medication (requires auth)
- `GET /medications` - Get all medications (requires auth)

### Pharmacy (`/hospital`)

- `POST /hospital/pharmacies` - Add new pharmacy
- `POST /hospital/pharmacies/:id/stock` - Update pharmacy stock
- `GET /hospital/search/pill?medicine=X&lng=Y&lat=Z&maxDistance=M` - Search for medication

### Language Assistant (`/assistant`)

- `GET /assistant/` - API info and status
- `POST /assistant/message` - Send message (text response)
- `POST /assistant/message-audio` - Send message (with audio)
- `POST /assistant/message-audio-file` - Send message (audio file download)
- `POST /assistant/detect` - Detect language only
- `GET /assistant/languages` - Get supported languages
- `GET /assistant/tts-status` - Get TTS service status

## Project Structure

```
server/
├── controllers/          # Request handlers
│   ├── authController.js
│   ├── medicationController.js
│   ├── pharmacyController.js
│   └── languageController.js
├── models/              # Database schemas
│   ├── user.js
│   └── hospital.js
├── routes/              # API routes
├── helpers/             # Utility functions
│   ├── auth.js
│   ├── language.js
│   └── textToSpeech.js
├── middleware/          # Custom middleware
├── temp/               # Temporary TTS files
└── server.js           # Entry point
```

## Azure Services Setup (Optional)

The multilingual features require Azure Cognitive Services:

1. Create an Azure account at [portal.azure.com](https://portal.azure.com)
2. Create a **Translator** resource and get your key, endpoint, and region
3. Create a **Speech Services** resource for Text-to-Speech and get your key and region
4. Add credentials to `.env` file

_Note: The API will work without Azure services, but language features will be disabled_

## Example Usage

### Register a user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "idNumber": "1234567890123",
    "phoneNumber": "+27123456789",
    "address": "123 Main St, Pretoria",
    "password": "securepass123"
  }'
```

### Send multilingual message

```bash
curl -X POST http://localhost:8000/assistant/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Sawubona, ngicela usizo"}'
```
