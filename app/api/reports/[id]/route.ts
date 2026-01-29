import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// GET /api/reports/[id] - Get a single report with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServerClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (reportError) throw reportError;

    // Fetch texts
    const { data: texts, error: textsError } = await supabase
      .from("report_texts")
      .select("*")
      .eq("report_id", id)
      .order("order_index");

    if (textsError) throw textsError;

    // Fetch samples
    const textIds = (texts || []).map((t: { id: string }) => t.id);
    let samples: unknown[] = [];
    if (textIds.length > 0) {
      const { data: samplesData, error: samplesError } = await supabase
        .from("audio_samples")
        .select("*")
        .in("report_text_id", textIds);

      if (samplesError) throw samplesError;
      samples = samplesData || [];
    }

    // Fetch critique
    const { data: critique, error: critiqueError } = await supabase
      .from("critique_results")
      .select("*")
      .eq("report_id", id)
      .single();

    return NextResponse.json({
      success: true,
      report,
      texts: texts || [],
      samples,
      critique: critiqueError ? null : critique,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServerClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete report (cascades to related tables)
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Update a report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServerClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, winner, elevenlabs_model } = body;

    // Build update object dynamically
    const updateData: { status?: string; winner?: string; elevenlabs_model?: string } = {};
    if (status) updateData.status = status;
    if (winner !== undefined) updateData.winner = winner;
    if (elevenlabs_model) updateData.elevenlabs_model = elevenlabs_model;

    const { data: report, error } = await supabase
      .from("reports")
      .update(updateData as Record<string, unknown>)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
