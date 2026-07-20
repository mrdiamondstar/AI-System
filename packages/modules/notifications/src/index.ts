import { scopedLogger } from "@dstarix/shared";

const log = scopedLogger("notifications");

/**
 * Email dispatch (doc 07 §7). Provider-abstracted: LogEmailProvider is the
 * test-credential mode (writes to logs, always active without RESEND_API_KEY);
 * ResendProvider activates purely via env. Callers never touch a provider SDK.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ id: string }>;
}

class LogEmailProvider implements EmailProvider {
  readonly name = "log";
  send(message: EmailMessage): Promise<{ id: string }> {
    log.info({ to: message.to, subject: message.subject }, "email (log provider)");
    return Promise.resolve({ id: `log-${Date.now()}` });
  }
}

class ResendProvider implements EmailProvider {
  readonly name = "resend";
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<{ id: string }> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Resend error ${response.status}`);
    const data = (await response.json()) as { id: string };
    return { id: data.id };
  }
}

let provider: EmailProvider | undefined;

function resolveProvider(): EmailProvider {
  if (!provider) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? "DStarix <hello@dstarix.com>";
    provider = apiKey ? new ResendProvider(apiKey, from) : new LogEmailProvider();
    log.info({ provider: provider.name }, "email provider resolved");
  }
  return provider;
}

export async function sendEmail(message: EmailMessage): Promise<{ id: string }> {
  return resolveProvider().send(message);
}

/** Double-opt-in confirmation email for newsletter (doc 07 §7). */
export async function sendNewsletterConfirmation(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Confirm your DStarix subscription",
    text: "Welcome to DStarix. Confirm your subscription to start receiving the AI decisions newsletter.",
  });
}
