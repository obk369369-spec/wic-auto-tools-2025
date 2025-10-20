// lib/mailer.ts  (신규)
// Env: SENDGRID_API_KEY, FROM_EMAIL
export async function sendEmail(
  { to, subject, text, html }:
  { to: string; subject: string; text: string; html?: string }
) {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  const from = Deno.env.get("FROM_EMAIL");
  if (!apiKey || !from) throw new Error("MAIL_NOT_CONFIGURED");
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html ?? `<pre>${text}</pre>` },
      ],
    }),
  });
}
