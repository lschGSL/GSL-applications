const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

interface WebhookEvent {
  type: string;
  title: string;
  description: string;
  fields?: { label: string; value: string }[];
  color?: "good" | "warning" | "danger";
}

async function sendSlack(event: WebhookEvent) {
  if (!SLACK_WEBHOOK_URL) return;

  const color = event.color === "good" ? "#16a34a" : event.color === "danger" ? "#dc2626" : "#f59e0b";

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: event.title,
            text: event.description,
            fields: event.fields?.map((f) => ({
              title: f.label,
              value: f.value,
              short: true,
            })),
            footer: "GSL Portal",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });
  } catch {
    // Fire-and-forget
  }
}

async function sendTeams(event: WebhookEvent) {
  if (!TEAMS_WEBHOOK_URL) return;

  const color = event.color === "good" ? "Good" : event.color === "danger" ? "Attention" : "Warning";

  try {
    await fetch(TEAMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: event.color === "good" ? "16a34a" : event.color === "danger" ? "dc2626" : "f59e0b",
        summary: event.title,
        sections: [
          {
            activityTitle: event.title,
            activitySubtitle: "GSL Portal",
            facts: [
              { name: "Event", value: event.type },
              ...(event.fields?.map((f) => ({ name: f.label, value: f.value })) ?? []),
            ],
            text: event.description,
          },
        ],
      }),
    });
  } catch {
    // Fire-and-forget
  }
}

export async function sendWebhook(event: WebhookEvent) {
  await Promise.all([sendSlack(event), sendTeams(event)]);
}

// Pre-built event helpers

export async function webhookNewUser(name: string, email: string, role: string) {
  await sendWebhook({
    type: "user.created",
    title: "New user registered",
    description: `**${name || email}** joined the portal as **${role}**.`,
    fields: [
      { label: "Email", value: email },
      { label: "Role", value: role },
    ],
    color: "good",
  });
}

export async function webhookAccessRequest(userName: string, appName: string) {
  await sendWebhook({
    type: "access.requested",
    title: "Access request",
    description: `**${userName}** requested access to **${appName}**.`,
    fields: [
      { label: "User", value: userName },
      { label: "Application", value: appName },
    ],
    color: "warning",
  });
}

export async function webhookDocumentUploaded(clientName: string, docName: string) {
  await sendWebhook({
    type: "document.uploaded",
    title: "Document uploaded",
    description: `**${clientName}** uploaded **${docName}**.`,
    fields: [
      { label: "Client", value: clientName },
      { label: "Document", value: docName },
    ],
    color: "good",
  });
}

export async function webhookDocumentStatusChanged(clientName: string, docName: string, status: string) {
  await sendWebhook({
    type: `document.${status}`,
    title: `Document ${status}`,
    description: `Document **${docName}** for **${clientName}** was **${status}**.`,
    fields: [
      { label: "Client", value: clientName },
      { label: "Document", value: docName },
      { label: "Status", value: status },
    ],
    color: status === "approved" ? "good" : "danger",
  });
}

export async function webhookSecurityAlert(message: string, details?: Record<string, string>) {
  await sendWebhook({
    type: "security.alert",
    title: "Security Alert",
    description: message,
    fields: details ? Object.entries(details).map(([label, value]) => ({ label, value })) : undefined,
    color: "danger",
  });
}
