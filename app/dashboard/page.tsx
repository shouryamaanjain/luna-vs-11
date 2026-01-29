"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { ReportsList } from "@/components/ReportsList";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { LogOut, ArrowLeft } from "lucide-react";

type View = "list" | "new";

export default function DashboardPage() {
  const [view, setView] = useState<View>("list");
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleNewReport = () => {
    setView("new");
  };

  const handleBackToList = () => {
    setView("list");
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {view === "new" && (
                <Button variant="ghost" size="sm" onClick={handleBackToList}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  TTS Comparison Platform
                </h1>
                <p className="text-sm text-muted-foreground">
                  {view === "list"
                    ? "Compare Pixa vs ElevenLabs Text-to-Speech quality"
                    : "Create a new comparison report"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {view === "list" ? (
          <ReportsList onNewReport={handleNewReport} />
        ) : (
          <ComparisonPanel onComplete={handleBackToList} />
        )}
      </div>
    </main>
  );
}
