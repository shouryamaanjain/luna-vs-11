"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Report } from "@/lib/database.types";
import { Trash2, Eye, RefreshCw, Plus } from "lucide-react";

interface ReportsListProps {
  onNewReport: () => void;
}

export function ReportsList({ onNewReport }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (id: string) => {
    router.push(`/report/${id}`);
  };

  const getStatusBadge = (status: string, winner: string | null) => {
    if (status === "completed") {
      const winnerColors: Record<string, string> = {
        heypixa: "bg-emerald-100 text-emerald-700",
        elevenlabs: "bg-violet-100 text-violet-700",
        tie: "bg-gray-100 text-gray-700",
      };
      return (
        <Badge className={winnerColors[winner || "tie"]}>
          {winner === "heypixa" ? "Pixa Leads" : winner === "elevenlabs" ? "ElevenLabs Leads" : "Tie"}
        </Badge>
      );
    }
    if (status === "generating") {
      return <Badge className="bg-yellow-100 text-yellow-700">Generating...</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
  };

  const getModelName = (modelId: string) => {
    const models: Record<string, string> = {
      eleven_v3: "V3",
      eleven_flash_v2_5: "Flash",
      eleven_turbo_v2_5: "Turbo",
    };
    return models[modelId] || modelId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Reports</h2>
        <Button onClick={onNewReport} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t created any reports yet.
            </p>
            <Button onClick={onNewReport} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    Report - {new Date(report.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardTitle>
                  {getStatusBadge(report.status, report.winner)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      ElevenLabs Model:{" "}
                      <span className="font-medium text-foreground">
                        {getModelName(report.elevenlabs_model)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(report.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      disabled={deletingId === report.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
