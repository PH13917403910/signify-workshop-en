import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateCertificateText } from "@/lib/email-template";
import { generateCertificatePDF } from "@/lib/pdf-certificate";

interface Participant {
  name: string;
  email: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Email service not configured" },
      { status: 500 },
    );
  }

  let body: { participants: Participant[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { participants } = body;
  if (!Array.isArray(participants) || participants.length === 0) {
    return NextResponse.json(
      { success: false, error: "No participants provided" },
      { status: 400 },
    );
  }

  if (participants.length > 20) {
    return NextResponse.json(
      { success: false, error: "Too many participants (max 20)" },
      { status: 400 },
    );
  }

  for (const p of participants) {
    if (!p.name?.trim() || !p.email?.trim()) {
      return NextResponse.json(
        { success: false, error: `Missing fields for participant: ${p.name || "unknown"}` },
        { status: 400 },
      );
    }
    if (!isValidEmail(p.email)) {
      return NextResponse.json(
        { success: false, error: `Invalid email: ${p.email}` },
        { status: 400 },
      );
    }
  }

  const resend = new Resend(apiKey);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const p of participants) {
    const name = p.name.trim();
    const text = generateCertificateText({ name, date });

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateCertificatePDF(name, date);
    } catch (err) {
      results.push({
        email: p.email,
        success: false,
        error: `PDF generation failed: ${err instanceof Error ? err.message : "unknown"}`,
      });
      continue;
    }

    try {
      const { error } = await resend.emails.send({
        from: "Signify AI Workshop <workshop@jpfamilies.com>",
        replyTo: "workshop@jpfamilies.com",
        to: p.email.trim(),
        subject: `${name}, congratulations on completing the Signify Supply Chain AI Workshop!`,
        text,
        attachments: [
          {
            filename: "Signify-AI-Workshop-Certificate.pdf",
            content: pdfBuffer,
          },
        ],
        headers: {
          "List-Unsubscribe": "<mailto:workshop@jpfamilies.com?subject=unsubscribe>",
        },
      });

      if (error) {
        results.push({ email: p.email, success: false, error: error.message });
      } else {
        results.push({ email: p.email, success: true });
      }
    } catch (err) {
      results.push({
        email: p.email,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const allSuccess = results.every((r) => r.success);
  return NextResponse.json({
    success: allSuccess,
    results,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  });
}
