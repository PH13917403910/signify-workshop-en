export interface CertificateEmailParams {
  name: string;
  date: string;
}

export function generateCertificateEmail({
  name,
  date,
}: CertificateEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Signify AI Workshop Certificate</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

<!-- ===== SCREEN 1: THE HOOK ===== -->
<tr><td style="padding:40px 32px 24px;text-align:center;">
  <p style="margin:0 0 24px;font-size:42px;line-height:1;">&#127942;</p>
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
    ${name}, you made a decision today.
  </h1>
  <p style="margin:0;font-size:15px;line-height:1.7;color:#94a3b8;">
    Four hours ago, AI might have felt like a buzzword.<br/>
    Now you know something most people still do not:
  </p>
  <p style="margin:20px 0 0;font-size:17px;font-weight:700;line-height:1.6;color:#f97316;">
    AI's value is not what it can do<br/>&mdash;it is what decisions it helps you make.
  </p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px;">
  <div style="height:1px;background:linear-gradient(to right,transparent,#f9731640,transparent);"></div>
</td></tr>

<!-- ===== SCREEN 2: THE SYSTEM MAP ===== -->
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 20px;font-size:13px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:0.12em;">
    &#128506; Your AI decision system
  </h2>

  <!-- Flow arrow -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="text-align:center;padding:8px 4px;">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 6px;">
        <p style="margin:0;font-size:11px;color:#94a3b8;">Step 1</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#ffffff;">Frame the decision</p>
      </div>
    </td>
    <td style="text-align:center;width:20px;color:#475569;font-size:14px;">&#8594;</td>
    <td style="text-align:center;padding:8px 4px;">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 6px;">
        <p style="margin:0;font-size:11px;color:#94a3b8;">Step 2</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#ffffff;">Data plumbing</p>
      </div>
    </td>
    <td style="text-align:center;width:20px;color:#475569;font-size:14px;">&#8594;</td>
    <td style="text-align:center;padding:8px 4px;">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 6px;">
        <p style="margin:0;font-size:11px;color:#94a3b8;">Step 3</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#ffffff;">Human + AI</p>
      </div>
    </td>
    <td style="text-align:center;width:20px;color:#475569;font-size:14px;">&#8594;</td>
    <td style="text-align:center;padding:8px 4px;">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 6px;">
        <p style="margin:0;font-size:11px;color:#94a3b8;">Step 4</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#ffffff;">Prioritize bets</p>
      </div>
    </td>
  </tr>
  </table>

  <!-- Checkpoints -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:10px 14px;background:#1e293b;border-radius:10px 10px 0 0;border-bottom:1px solid #0a0f1a;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:18px;">&#127993;</td>
        <td>
          <p style="margin:0;font-size:12px;font-weight:700;color:#f97316;">Checkpoint 1 &mdash; Frame the decision</p>
          <p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#cbd5e1;">Before opening any AI tool, write: <strong style="color:#ffffff;">What decision am I making? What options exist? What evidence would change my mind?</strong> If you cannot answer, you are not ready for AI.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:10px 14px;background:#1e293b;border-bottom:1px solid #0a0f1a;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:18px;">&#128267;</td>
        <td>
          <p style="margin:0;font-size:12px;font-weight:700;color:#f97316;">Checkpoint 2 &mdash; Validate the data pipe</p>
          <p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#cbd5e1;">Ask IT one question: <strong style="color:#ffffff;">Is the data AI sees hours old or days old?</strong> If it is stale, every analysis sits on sand.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:10px 14px;background:#1e293b;border-bottom:1px solid #0a0f1a;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:18px;">&#9888;&#65039;</td>
        <td>
          <p style="margin:0;font-size:12px;font-weight:700;color:#f97316;">Checkpoint 3 &mdash; Review AI output</p>
          <p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#cbd5e1;">The prettier the deck, the more you should verify. Whisper: <strong style="color:#ffffff;">If an intern handed me this, would I sign it?</strong></p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:10px 14px;background:#1e293b;border-radius:0 0 10px 10px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:18px;">&#128640;</td>
        <td>
          <p style="margin:0;font-size:12px;font-weight:700;color:#f97316;">Checkpoint 4 &mdash; Prioritize</p>
          <p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#cbd5e1;">Do not only ask what a project delivers. Ask: <strong style="color:#ffffff;">If we do nothing, where are we in six months?</strong> Inaction is often costlier than a wrong bet.</p>
        </td>
      </tr></table>
    </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px;">
  <div style="height:1px;background:linear-gradient(to right,transparent,#f9731640,transparent);"></div>
</td></tr>

<!-- ===== SCREEN 3: CERTIFICATE ===== -->
<tr><td style="padding:32px;text-align:center;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1207 0%,#1e293b 40%,#1a1a07 100%);border:1px solid #f9731630;border-radius:16px;">
  <tr><td style="padding:32px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3em;">Certificate of Completion</p>
    <p style="margin:0 0 12px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
      ${name}
    </p>
    <div style="margin:16px auto;width:200px;height:1px;background:linear-gradient(to right,transparent,#f9731650,transparent);"></div>
    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffffff;">&#127941; Supply Chain AI Pioneer</p>
    <p style="margin:0;font-size:11px;color:#64748b;">
      Signify Supply Chain AI Transformation Workshop<br/>${date}
    </p>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px;">
  <div style="height:1px;background:linear-gradient(to right,transparent,#f9731640,transparent);"></div>
</td></tr>

<!-- ===== SCREEN 4: THE ONE EXPERIMENT ===== -->
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 16px;font-size:13px;font-weight:700;color:#22c55e;text-transform:uppercase;letter-spacing:0.12em;">
    &#129514; Your first experiment
  </h2>
  <div style="background:#0f2a1a;border:1px solid #16a34a30;border-radius:12px;padding:20px;">
    <p style="margin:0;font-size:14px;line-height:1.8;color:#d1d5db;">
      <strong style="color:#ffffff;">Next Monday</strong>, pick the report you run most often.<br/>
      Write one CCF prompt and let AI draft a version.<br/><br/>
      Then compare three things:<br/>
      &#10004;&#65039; Where is AI <strong style="color:#22c55e;">faster</strong> than you?<br/>
      &#10060; Where did AI <strong style="color:#ef4444;">get it wrong</strong>?<br/>
      &#128161; Where do you need to add <strong style="color:#f97316;">business judgment</strong>?<br/><br/>
      <span style="color:#94a3b8;">Ten minutes of this beats ten blog posts.</span>
    </p>
  </div>
</td></tr>

<!-- ===== SCREEN 5: GOING DEEPER ===== -->
<tr><td style="padding:0 32px 32px;">
  <h2 style="margin:0 0 12px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;">
    &#128218; Go deeper
  </h2>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:8px 0;">
      <a href="https://gemini.google.com/app" style="color:#60a5fa;font-size:13px;font-weight:600;text-decoration:none;">Google Gemini &#8594;</a>
      <span style="color:#64748b;font-size:12px;"> &mdash; Try a real workflow with CCF</span>
    </td></tr>
    <tr><td style="padding:8px 0;">
      <a href="https://www.youtube.com/watch?v=zjkBMFhNj_g" style="color:#60a5fa;font-size:13px;font-weight:600;text-decoration:none;">Intro to LLMs (1hr) &#8594;</a>
      <span style="color:#64748b;font-size:12px;"> &mdash; Andrej Karpathy on how LLMs work</span>
    </td></tr>
    <tr><td style="padding:8px 0;">
      <a href="https://chatgpt.com" style="color:#60a5fa;font-size:13px;font-weight:600;text-decoration:none;">ChatGPT &#8594;</a>
      <span style="color:#64748b;font-size:12px;"> &mdash; Another strong assistant&mdash;compare with Gemini</span>
    </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px;">
  <div style="height:1px;background:linear-gradient(to right,transparent,#f9731640,transparent);"></div>
</td></tr>

<!-- ===== P.S. ===== -->
<tr><td style="padding:24px 32px 8px;text-align:center;">
  <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;font-style:italic;">
    The best way to learn is to teach.<br/>
    Explain today's \"AI decision system\" to a colleague&mdash;you will understand it more deeply than you expect.
  </p>
</td></tr>

<!-- ===== FOOTER ===== -->
<tr><td style="padding:24px 32px 40px;text-align:center;">
  <p style="margin:0;font-size:11px;color:#475569;letter-spacing:0.05em;">
    Signify Greater China &middot; Supply Chain AI Transformation Workshop 2026
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function generateCertificateText({ name, date }: CertificateEmailParams): string {
  return `Hi ${name},

Congratulations on completing the Signify Supply Chain AI Transformation Workshop!

Attached is your certificate (PDF), including a one-page recap of the AI decision system from today.

Your next step:
Next Monday, take the report you run most often, prompt it with CCF, and compare where AI is faster, where it is wrong, and where your judgment must land. Ten minutes beats ten articles.

Go deeper:
· Google Gemini — https://gemini.google.com/app
· ChatGPT — https://chatgpt.com
· Intro to LLMs (Andrej Karpathy, 1hr) — https://www.youtube.com/watch?v=zjkBMFhNj_g

${name}, the best way to learn is to teach. Try explaining the \"AI decision system\" to a teammate—you will see how much you retained.

Signify Greater China · Supply Chain AI Transformation Workshop
${date}`;
}
