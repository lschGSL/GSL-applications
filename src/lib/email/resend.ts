import { Resend } from "resend";

// Initialize Resend only when API key is available
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "GSL Portal <noreply@gsl.lu>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GSL Portal";

export async function sendAccessRequestNotification({
  adminEmails,
  userName,
  userEmail,
  appName,
}: {
  adminEmails: string[];
  userName: string;
  userEmail: string;
  appName: string;
}) {
  const resend = getResend();
  if (!resend || adminEmails.length === 0) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmails,
    subject: `[${APP_NAME}] Access request: ${userName} → ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Access Request</h2>
        <p><strong>${userName}</strong> (${userEmail}) has requested access to <strong>${appName}</strong>.</p>
        <p>Please review this request in the admin panel.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME}</p>
      </div>
    `,
  });
}

export async function sendAccessGrantedNotification({
  userEmail,
  userName,
  appName,
  appUrl,
}: {
  userEmail: string;
  userName: string;
  appName: string;
  appUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [userEmail],
    subject: `[${APP_NAME}] Access granted: ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Access Granted</h2>
        <p>Hello ${userName || "there"},</p>
        <p>You now have access to <strong>${appName}</strong>.</p>
        ${appUrl ? `<p><a href="${appUrl}" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Open ${appName}</a></p>` : ""}
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME}</p>
      </div>
    `,
  });
}

export async function sendAccessRevokedNotification({
  userEmail,
  userName,
  appName,
}: {
  userEmail: string;
  userName: string;
  appName: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [userEmail],
    subject: `[${APP_NAME}] Access revoked: ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Access Revoked</h2>
        <p>Hello ${userName || "there"},</p>
        <p>Your access to <strong>${appName}</strong> has been revoked.</p>
        <p>If you believe this is an error, please contact your administrator.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME}</p>
      </div>
    `,
  });
}

export async function sendDocumentRequestNotification({
  clientEmail,
  clientName,
  requesterName,
  title,
  description,
  dueDate,
  portalUrl,
}: {
  clientEmail: string;
  clientName: string;
  requesterName: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  portalUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString("fr-FR") : null;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [clientEmail],
    subject: `[${APP_NAME}] Document demandé : ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Document demandé</h2>
        <p>Bonjour <strong>${clientName}</strong>,</p>
        <p><strong>${requesterName}</strong> vous a demandé de fournir le document suivant :</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold;">${title}</p>
          ${description ? `<p style="margin: 8px 0 0; color: #666;">${description}</p>` : ""}
          ${dueDateStr ? `<p style="margin: 8px 0 0; color: #e62a34;"><strong>Date limite :</strong> ${dueDateStr}</p>` : ""}
        </div>
        <p><a href="${portalUrl}/client/documents" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Accéder à mes documents</a></p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME}</p>
      </div>
    `,
  });
}

export async function sendInvitationEmail({
  email,
  invitedBy,
  role,
  entity,
  signupUrl,
}: {
  email: string;
  invitedBy: string;
  role: string;
  entity?: string | null;
  signupUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const entityLabel = entity === "gsl_fiduciaire" ? "GSL Fiduciaire" : entity === "gsl_revision" ? "GSL Révision" : entity === "both" ? "GSL Fiduciaire & GSL Révision" : null;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: `[${APP_NAME}] You've been invited`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">You're Invited to ${APP_NAME}</h2>
        <p><strong>${invitedBy}</strong> has invited you to join ${APP_NAME} as a <strong>${role}</strong>${entityLabel ? ` for <strong>${entityLabel}</strong>` : ""}.</p>
        <p><a href="${signupUrl}" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${signupUrl}</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME}</p>
      </div>
    `,
  });
}
