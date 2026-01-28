# TTS Comparison Platform

Compare Pixa and ElevenLabs Text-to-Speech quality with Gemini-powered multi-language analysis.

## Features

- **Multi-language Text Generation**: Uses Gemini Flash to generate challenging text samples containing English, Hinglish (Hindi in Roman script), and Hindi (Devanagari)
- **Dual TTS Synthesis**: Generates 10 audio samples each from Pixa (Neha voice) and ElevenLabs (Devi voice)
- **AI-Powered Critique**: Gemini Pro analyzes all 20 samples for:
  - Pronunciation errors
  - Accent inconsistencies (e.g., Hindi words spoken with English accent)
  - Audio artifacts (clicks, pops, unnatural pauses)
  - Cross-sample consistency
  - Overall quality scores

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
# Google AI API Key (for Gemini models)
# Get your key from: https://aistudio.google.com/apikey
GOOGLE_AI_API_KEY=your_google_ai_key_here

# ElevenLabs API Key
# Get your key from: https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Generate Text**: Click "Generate Text" to create a challenging multi-language text sample
2. **Generate Audio**: Click "Generate Audio Samples" to synthesize 10 samples from each provider
3. **Listen & Compare**: Play individual samples to hear the differences
4. **Generate Critique**: Click "Generate Critique" for a detailed AI analysis

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **TTS Providers**:
  - Pixa (Voice: Neha)
  - ElevenLabs (Voice: Devi, Model: v2.5-turbo)
- **AI Analysis**:
  - Gemini 3 Flash Preview (text generation)
  - Gemini 3 Pro Preview (audio critique)

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate-text` | POST | Generate challenging multi-language text |
| `/api/synthesize/heypixa` | POST | Generate Pixa TTS samples |
| `/api/synthesize/elevenlabs` | POST | Generate ElevenLabs TTS samples |
| `/api/critique` | POST | Generate Gemini Pro critique report |

## Project Structure

```
eleven-luna/
├── app/
│   ├── page.tsx                      # Main comparison UI
│   ├── layout.tsx                    # Root layout
│   └── api/
│       ├── generate-text/route.ts    # Gemini Flash text generation
│       ├── synthesize/
│       │   ├── heypixa/route.ts      # Pixa TTS
│       │   └── elevenlabs/route.ts   # ElevenLabs TTS
│       └── critique/route.ts         # Gemini Pro critique
├── components/
│   ├── ComparisonPanel.tsx           # Main comparison interface
│   ├── AudioSampleCard.tsx           # Individual audio player
│   ├── CritiqueReport.tsx            # Critique report display
│   └── ui/                           # shadcn components
├── lib/
│   ├── config.ts                     # API configuration & types
│   ├── gemini.ts                     # Gemini API client
│   ├── heypixa.ts                    # Pixa TTS client
│   └── elevenlabs.ts                 # ElevenLabs TTS client
└── .env.local                        # API keys (not committed)
```

## License

MIT
