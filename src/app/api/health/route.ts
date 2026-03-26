import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const start = Date.now();

  try {
    const supabase = await createServiceClient();

    // Check DB connection
    const { error: dbError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const dbOk = !dbError;
    const latency = Date.now() - start;

    if (!dbOk) {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          latency_ms: latency,
          checks: { database: { status: "fail", error: dbError.message } },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      latency_ms: latency,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
      checks: { database: { status: "ok" } },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - start,
        checks: { database: { status: "fail", error: "Connection failed" } },
      },
      { status: 503 }
    );
  }
}
