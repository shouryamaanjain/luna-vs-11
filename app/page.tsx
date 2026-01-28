import { ComparisonPanel } from "@/components/ComparisonPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight">
            TTS Comparison Platform
          </h1>
          <p className="text-muted-foreground mt-2">
            Compare Pixa (Neha) vs ElevenLabs (Devi) Text-to-Speech quality with 
            Gemini-powered multi-language analysis
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ComparisonPanel />
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">How it works:</span> Gemini Flash generates 
              challenging Hindi/Hinglish/English text, both TTS providers synthesize 10 
              samples each, then Gemini Pro analyzes all 20 samples for pronunciation, 
              accent, and artifacts.
            </div>
            <div className="flex gap-4">
              <a
                href="https://hindi.heypixa.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Pixa
              </a>
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                ElevenLabs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
