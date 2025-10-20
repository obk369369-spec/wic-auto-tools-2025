// =============================
// File: lib/mailer.ts
// 기능: SendGrid API를 이용한 이메일 발송 유틸
// =============================

export async function sendEmail(
  { to, subject, text, html }:
  { to: string; subject: string; text: string; html?: string }
) {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  const from = Deno.env.get("FROM_EMAIL");
  if (!apiKey || !from) {
    console.log("[MAIL] 환경변수 누락 (SENDGRID_API_KEY, FROM_EMAIL)");
    return;
  }

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html", value: html ?? `<pre>${text}</pre>` },
    ],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log(`[MAIL] sent → ${res.status}`);
}
