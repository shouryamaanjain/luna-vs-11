# TTS Comparison Platform

Compare Pixa and ElevenLabs Text-to-Speech quality with AI-powered analysis.

## Features

- **User Authentication**: Sign up and sign in to save and manage your reports
- **Multi-category Text Generation**: Generates challenging Hindi (Devanagari) text samples across categories:
  - Names & Places
  - Currencies
  - Date & Time
  - Custom text input
- **Dual TTS Synthesis**: Generates 3 audio samples per text from both Pixa (Neha voice) and ElevenLabs (Devi voice)
- **Model Selection**: Choose from 3 ElevenLabs models (V3, Flash V2.5, Turbo V2.5)
- **AI-Powered Critique**: Analyzes all samples for:
  - Pronunciation errors
  - Accent inconsistencies
  - Audio artifacts (clicks, pops, unnatural pauses)
  - Cross-sample consistency
  - Overall quality scores
- **Report Management**: Save, view, delete, and regenerate comparison reports

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file with your API keys:

```env
# Google AI API Key (for text generation and critique)
GOOGLE_AI_API_KEY=your_google_ai_key_here

# ElevenLabs API Key
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Supabase Database

Run the SQL schema in your Supabase project:
- Go to your Supabase dashboard
- Navigate to SQL Editor
- Run the contents of `supabase-schema.sql`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Create an account or sign in
2. **Create Report**: Click "New Report" from the dashboard
3. **Select Model**: Choose an ElevenLabs model
4. **Generate Text**: Generate category-specific Hindi text samples
5. **Add Custom Text**: Optionally add your own text
6. **Generate Audio**: Synthesize audio samples from both providers
7. **Generate Critique**: Get detailed AI analysis
8. **View Reports**: Access your saved reports from the dashboard

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **TTS Providers**:
  - Pixa (Voice: Neha)
  - ElevenLabs (Voice: Devi)

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate-text` | POST | Generate category-specific Hindi text |
| `/api/synthesize/heypixa` | POST | Generate Pixa TTS samples |
| `/api/synthesize/elevenlabs` | POST | Generate ElevenLabs TTS samples |
| `/api/critique` | POST | Generate critique report |
| `/api/reports` | GET/POST | List/create reports |
| `/api/reports/[id]` | GET/PUT/DELETE | Manage individual reports |

## Project Structure

```
luna-vs-11/
├── app/
│   ├── page.tsx                      # Landing/redirect page
│   ├── login/page.tsx                # Authentication page
│   ├── dashboard/page.tsx            # Reports dashboard
│   ├── report/[id]/page.tsx          # Individual report view
│   ├── layout.tsx                    # Root layout with AuthProvider
│   └── api/
│       ├── generate-text/route.ts    # Text generation
│       ├── synthesize/
│       │   ├── heypixa/route.ts      # Pixa TTS
│       │   └── elevenlabs/route.ts   # ElevenLabs TTS
│       ├── critique/route.ts         # Critique generation
│       └── reports/                  # Reports CRUD
├── components/
│   ├── AuthProvider.tsx              # Authentication context
│   ├── ComparisonPanel.tsx           # Main comparison interface
│   ├── AudioSampleCard.tsx           # Individual audio player
│   ├── CritiqueReport.tsx            # Critique report display
│   ├── ModelSelector.tsx             # ElevenLabs model selector
│   └── ui/                           # shadcn components
├── lib/
│   ├── config.ts                     # API configuration & types
│   ├── supabase.ts                   # Supabase client
│   ├── database.types.ts             # Database types
│   ├── gemini.ts                     # AI client
│   ├── heypixa.ts                    # Pixa TTS client
│   └── elevenlabs.ts                 # ElevenLabs TTS client
├── middleware.ts                     # Route protection
└── supabase-schema.sql               # Database schema
```

## License

MIT
