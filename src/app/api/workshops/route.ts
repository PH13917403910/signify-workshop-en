import { NextResponse } from "next/server";
import { listWorkshops } from "@/lib/db";

export async function GET() {
  try {
    const workshops = listWorkshops();
    return NextResponse.json({ workshops });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
