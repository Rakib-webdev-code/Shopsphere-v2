/**
 * Tiny email helper.
 *
 * - With RESEND_API_KEY set, mail is sent through Resend's REST API.
 * - Without it, the message is printed to the server console in development,
 *   so sign-up verification and password reset links still work locally.
 */
type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text link printed to the console when no provider is configured. */
  consoleLink?: string;
};

export async function sendEmail({ to, subject, html, consoleLink }: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[email] RESEND_API_KEY is not set; "${subject}" to ${to} was not sent.`,
      );
      return;
    }

    console.info(`[email] ${subject} -> ${to}${consoleLink ? `\n${consoleLink}` : ""}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "ShopSphere <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    console.error("[email] Resend rejected the message", response.status);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function actionEmailHtml(options: {
  heading: string;
  body: string;
  buttonLabel: string;
  url: string;
}) {
  const heading = escapeHtml(options.heading);
  const body = escapeHtml(options.body);
  const buttonLabel = escapeHtml(options.buttonLabel);
  const url = escapeHtml(options.url);

  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14181b">
<h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 20px">${body}</p>
<a href="${url}" style="display:inline-block;background:#0e6b4f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">${buttonLabel}</a>
<p style="font-size:12px;color:#6b7280;margin:24px 0 0">If the button does not work, copy this link into your browser:<br>${url}</p>
</div>`;
}
