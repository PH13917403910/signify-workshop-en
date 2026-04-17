import { PDFDocument, rgb, PDFFont, PDFPage, Color } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, existsSync } from "fs";
import path from "path";

/* ── premium color palette ── */
const DEEP_NAVY = rgb(0.08, 0.12, 0.22);
const GOLD = rgb(0.78, 0.6, 0.24);
const LIGHT_GOLD = rgb(0.9, 0.77, 0.48);
const PALE_GOLD = rgb(0.95, 0.9, 0.78);
const TEXT_GRAY = rgb(0.36, 0.4, 0.48);
const LIGHT_LINE = rgb(0.84, 0.86, 0.89);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.15, 0.55, 0.3);
const LINK_BLUE = rgb(0.3, 0.55, 0.85);

const W = 595.28;
const H = 841.89;
const M = 50;
const CW = W - M * 2;
const CX = W / 2;

const FONT_PATH = path.join(process.cwd(), "public", "fonts", "LXGWWenKai-Regular.ttf");
let fontCache: Uint8Array | null = null;
function loadFont(): Uint8Array {
  if (fontCache) return fontCache;
  if (!existsSync(FONT_PATH)) throw new Error(`Font not found: ${FONT_PATH}`);
  fontCache = new Uint8Array(readFileSync(FONT_PATH));
  return fontCache;
}

/* ── drawing helpers ── */

function center(page: PDFPage, text: string, f: PDFFont, s: number, y: number, c: Color = DEEP_NAVY) {
  const tw = f.widthOfTextAtSize(text, s);
  page.drawText(text, { x: (W - tw) / 2, y, size: s, font: f, color: c });
}

function hLine(page: PDFPage, y: number, w: number, t: number, c: Color) {
  page.drawLine({ start: { x: CX - w / 2, y }, end: { x: CX + w / 2, y }, thickness: t, color: c });
}

function dot(page: PDFPage, x: number, y: number, r: number, c: Color) {
  page.drawEllipse({ x, y, xScale: r, yScale: r, color: c });
}

function wrapLines(text: string, f: PDFFont, s: number, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    let cur = "";
    for (let i = 0; i < para.length; i++) {
      const ch = para[i];
      const test = cur + ch;
      let tw: number;
      try { tw = f.widthOfTextAtSize(test, s); } catch { continue; }
      if (tw > maxW && cur.length > 0) {
        if (/[a-zA-Z0-9]/.test(ch)) {
          const sp = cur.lastIndexOf(" ");
          if (sp > cur.length * 0.3) { lines.push(cur.substring(0, sp)); cur = cur.substring(sp + 1) + ch; continue; }
        }
        lines.push(cur); cur = ch;
      } else { cur = test; }
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

function drawWrapped(page: PDFPage, text: string, f: PDFFont, s: number, x: number, sy: number, maxW: number, lh: number, c: Color = DEEP_NAVY): number {
  let y = sy;
  for (const ln of wrapLines(text, f, s, maxW)) {
    if (!ln) { y -= lh * 0.5; continue; }
    page.drawText(ln, { x, y, size: s, font: f, color: c }); y -= lh;
  }
  return y;
}

function drawFilledStar(page: PDFPage, cx: number, cy: number, R: number, color: Color) {
  const r = R * 0.382;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = i * (Math.PI / 5);
    const rad = i % 2 === 0 ? R : r;
    const x = +(rad * Math.sin(a)).toFixed(2);
    const y = +(-rad * Math.cos(a)).toFixed(2);
    pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  page.drawSvgPath(pts.join(" ") + " Z", { x: cx, y: cy, color });
}

/* ── Page 1 : Certificate ── */

function drawCertificate(p: PDFPage, f: PDFFont, name: string, date: string) {
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });

  const B = 24;
  p.drawRectangle({ x: B, y: B, width: W - B * 2, height: H - B * 2, borderColor: GOLD, borderWidth: 1.2 });
  p.drawRectangle({ x: B + 5, y: B + 5, width: W - (B + 5) * 2, height: H - (B + 5) * 2, borderColor: PALE_GOLD, borderWidth: 0.4 });

  p.drawRectangle({ x: B, y: H - B - 2.5, width: W - B * 2, height: 2.5, color: GOLD });
  p.drawRectangle({ x: B, y: B, width: W - B * 2, height: 2.5, color: GOLD });

  const cd = B + 14;
  for (const [cx, cy] of [[cd, H - cd], [W - cd, H - cd], [cd, cd], [W - cd, cd]] as const)
    dot(p, cx, cy, 2.2, GOLD);

  let y = H - 95;

  center(p, "S I G N I F Y", f, 14, y, GOLD);
  y -= 20;
  center(p, "Supply Chain AI Transformation Workshop", f, 8.5, y, TEXT_GRAY);
  y -= 34;

  hLine(p, y, 220, 0.5, LIGHT_GOLD);
  y -= 50;

  const starR = 7;
  const starGap = 30;
  const sx = CX - 2 * starGap;
  for (let i = 0; i < 5; i++) drawFilledStar(p, sx + i * starGap, y, starR, GOLD);
  const flankLen = 50;
  p.drawLine({ start: { x: sx - starR - 14, y }, end: { x: sx - starR - 14 - flankLen, y }, thickness: 0.5, color: LIGHT_GOLD });
  dot(p, sx - starR - 14 - flankLen - 3, y, 1.5, LIGHT_GOLD);
  p.drawLine({ start: { x: sx + 4 * starGap + starR + 14, y }, end: { x: sx + 4 * starGap + starR + 14 + flankLen, y }, thickness: 0.5, color: LIGHT_GOLD });
  dot(p, sx + 4 * starGap + starR + 14 + flankLen + 3, y, 1.5, LIGHT_GOLD);
  y -= 54;

  center(p, "CERTIFICATE OF COMPLETION", f, 20, y, DEEP_NAVY);
  y -= 26;
  center(p, "Official Record", f, 14, y, TEXT_GRAY);
  y -= 40;

  hLine(p, y, 60, 2, GOLD);
  dot(p, CX - 37, y, 2, GOLD);
  dot(p, CX + 37, y, 2, GOLD);
  y -= 52;

  center(p, name, f, 28, y, DEEP_NAVY);
  y -= 34;

  center(p, "Supply Chain AI Pioneer", f, 12, y, GOLD);
  y -= 18;
  center(p, "Signify Workshop Graduate", f, 9, y, TEXT_GRAY);
  y -= 44;

  hLine(p, y, 220, 0.5, LIGHT_LINE);
  y -= 34;

  center(p, "Completed the Signify Greater China Supply Chain AI Transformation Workshop", f, 9, y, TEXT_GRAY);
  y -= 15;
  center(p, "Covered: decision framing · prompting · Agent orchestration · portfolio prioritization", f, 8, y, TEXT_GRAY);
  y -= 44;

  center(p, date, f, 10, y, DEEP_NAVY);
  y -= 46;

  center(p, "SIGNIFY GC SCM", f, 9, y + 12, DEEP_NAVY);
  hLine(p, y, 130, 0.5, TEXT_GRAY);
  y -= 14;
  center(p, "Workshop Facilitator", f, 7.5, y, TEXT_GRAY);
}

/* ── Page 2 : Knowledge Summary ── */

function drawKnowledgeSummary(p: PDFPage, f: PDFFont) {
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });

  p.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: GOLD });

  let y = H - 52;

  p.drawText("Your AI decision system", { x: M, y, size: 18, font: f, color: DEEP_NAVY });
  y -= 7;
  p.drawLine({ start: { x: M, y }, end: { x: M + 175, y }, thickness: 2, color: GOLD });
  y -= 28;

  const steps = ["Frame decision", "Data pipe", "Human+AI", "Prioritize"];
  const bw = 100, bh = 34, gap = 20;
  const total = steps.length * bw + (steps.length - 1) * gap;
  const bsx = (W - total) / 2;

  for (let i = 0; i < steps.length; i++) {
    const x = bsx + i * (bw + gap);
    p.drawRectangle({ x, y: y - bh, width: bw, height: bh, borderColor: GOLD, borderWidth: 0.8, color: rgb(1, 0.99, 0.96) });
    const sl = `Step ${i + 1}`;
    const slw = f.widthOfTextAtSize(sl, 7);
    p.drawText(sl, { x: x + (bw - slw) / 2, y: y - 11, size: 7, font: f, color: GOLD });
    const nw = f.widthOfTextAtSize(steps[i], 9.5);
    p.drawText(steps[i], { x: x + (bw - nw) / 2, y: y - 26, size: 9.5, font: f, color: DEEP_NAVY });
    if (i < steps.length - 1) {
      const ax = x + bw + gap / 2;
      p.drawText("\u2192", { x: ax - 5, y: y - bh / 2 - 4, size: 12, font: f, color: LIGHT_GOLD });
    }
  }
  y -= bh + 30;

  const cps = [
    { t: "Checkpoint 1 — Frame the decision", b: "Before any AI tool, write: what decision, what options, what evidence would change my mind? If blank, you are not ready." },
    { t: "Checkpoint 2 — Validate data pipes", b: "Ask IT: is data hours old or days old? Stale inputs make every downstream chart a lie." },
    { t: "Checkpoint 3 — Review AI output", b: "Polish is a warning sign. Ask: would I sign this if an intern wrote it?" },
    { t: "Checkpoint 4 — Prioritize", b: "Do not only ask what a project wins. Ask: if we do nothing, where are we in six months? Inaction often costs more than a wrong bet." },
  ];

  for (let i = 0; i < cps.length; i++) {
    const c = cps[i];
    dot(p, M + 10, y - 1, 9, GOLD);
    const ns = `${i + 1}`;
    const nw = f.widthOfTextAtSize(ns, 10);
    p.drawText(ns, { x: M + 10 - nw / 2, y: y - 5, size: 10, font: f, color: WHITE });
    p.drawText(c.t, { x: M + 26, y, size: 10, font: f, color: GOLD });
    y -= 16;
    y = drawWrapped(p, c.b, f, 9, M + 26, y, CW - 26, 14, TEXT_GRAY);
    y -= 14;
  }

  y -= 2;
  p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LIGHT_LINE });
  y -= 22;

  p.drawText("Your first experiment", { x: M, y, size: 14, font: f, color: GREEN });
  y -= 6;
  p.drawLine({ start: { x: M, y }, end: { x: M + 115, y }, thickness: 2, color: GREEN });
  y -= 20;

  y = drawWrapped(
    p,
    "Next Monday, open the report you run most often. Prompt it with CCF and let AI draft a pass.\n\nCompare three things:\n· Where is AI faster than you?\n· Where did AI get it wrong?\n· Where must you add judgment?\n\nTen minutes of this beats ten blog posts.",
    f, 9.5, M, y, CW, 15, DEEP_NAVY,
  );
  y -= 18;

  p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LIGHT_LINE });
  y -= 20;

  p.drawText("Keep exploring", { x: M, y, size: 12, font: f, color: DEEP_NAVY });
  y -= 20;

  const res = [
    { t: "Google Gemini", u: "gemini.google.com/app", d: " — try a real workflow with CCF" },
    { t: "Intro to LLMs (1hr)", u: "youtube.com/watch?v=zjkBMFhNj_g", d: " — Andrej Karpathy on LLM fundamentals" },
    { t: "ChatGPT", u: "chatgpt.com", d: " — another capable assistant" },
  ];
  for (const r of res) {
    const tw = f.widthOfTextAtSize(r.t, 9);
    p.drawText(r.t, { x: M, y, size: 9, font: f, color: GOLD });
    p.drawText(r.d, { x: M + tw, y, size: 9, font: f, color: TEXT_GRAY });
    y -= 14;
    p.drawText(r.u, { x: M + 8, y, size: 7.5, font: f, color: LINK_BLUE });
    y -= 18;
  }

  y -= 6;
  p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LIGHT_LINE });
  y -= 16;

  y = drawWrapped(p, "The best way to learn is to teach. Explain today's \"AI decision system\" to a colleague—you will see how deep your understanding really is.", f, 8.5, M, y, CW, 14, TEXT_GRAY);
  y -= 12;

  p.drawText("Signify Greater China · Supply Chain AI Transformation Workshop 2026", { x: M, y, size: 7.5, font: f, color: LIGHT_LINE });
}

/* ── main export ── */

export async function generateCertificatePDF(name: string, date: string): Promise<Buffer> {
  const fontBytes = loadFont();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fontBytes, { subset: true });

  const p1 = doc.addPage([W, H]);
  drawCertificate(p1, font, name, date);

  const p2 = doc.addPage([W, H]);
  drawKnowledgeSummary(p2, font);

  doc.setTitle("Signify AI Workshop Certificate");
  doc.setAuthor("Signify Supply Chain AI Workshop");
  doc.setSubject(`Certificate for ${name}`);

  return Buffer.from(await doc.save());
}
