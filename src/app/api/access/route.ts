import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  const expected = process.env.SITE_ACCESS_CODE || "SIGNIFY2026";

  if (code?.toUpperCase().trim() === expected.toUpperCase().trim()) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("workshop-access", "granted", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return res;
  }

  return NextResponse.json({ success: false, error: "Invalid access code" }, { status: 401 });
}
