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
  userId,
  appName,
  appId,
  portalUrl,
}: {
  adminEmails: string[];
  userName: string;
  userEmail: string;
  userId: string;
  appName: string;
  appId: string;
  portalUrl: string;
}) {
  const resend = getResend();
  if (!resend || adminEmails.length === 0) return;

  const manageUrl = `${portalUrl}/admin/users`;
  const grantUrl = `${portalUrl}/admin/users?q=${encodeURIComponent(userEmail)}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmails,
    subject: `[${APP_NAME}] Demande d'accès : ${userName} → ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Demande d'accès</h2>
        <p><strong>${userName}</strong> a demandé l'accès à l'application <strong>${appName}</strong>.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 4px;"><strong>Utilisateur :</strong> ${userName}</p>
          <p style="margin: 0 0 4px;"><strong>Email :</strong> ${userEmail}</p>
          <p style="margin: 0;"><strong>Application :</strong> ${appName}</p>
        </div>
        <div style="margin: 24px 0;">
          <a href="${manageUrl}" style="display: inline-block; padding: 10px 20px; background: #e62a34; color: white; text-decoration: none; border-radius: 9999px; font-weight: 500; margin-right: 12px;">Gérer les accès</a>
          <a href="${grantUrl}" style="display: inline-block; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 9999px; font-weight: 500;">Accorder l'accès</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME} — fiduciaire | révision | management</p>
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

export async function sendDocumentStatusNotification({
  clientEmail,
  clientName,
  documentName,
  status,
  notes,
  portalUrl,
}: {
  clientEmail: string;
  clientName: string;
  documentName: string;
  status: "approved" | "rejected";
  notes?: string | null;
  portalUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const isApproved = status === "approved";
  const statusLabel = isApproved ? "approuvé" : "rejeté";
  const statusColor = isApproved ? "#16a34a" : "#dc2626";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [clientEmail],
    subject: `[${APP_NAME}] Document ${statusLabel} : ${documentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Document ${statusLabel}</h2>
        <p>Bonjour <strong>${clientName}</strong>,</p>
        <p>Votre document <strong>${documentName}</strong> a été <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span>.</p>
        ${notes ? `<div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0;"><p style="margin: 0; color: #666;"><strong>Note :</strong> ${notes}</p></div>` : ""}
        <p><a href="${portalUrl}/client/documents" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Voir mes documents</a></p>
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

export async function sendSignatureRequestNotification({
  clientEmail,
  clientName,
  documentName,
  requesterName,
  portalUrl,
}: {
  clientEmail: string;
  clientName: string;
  documentName: string;
  requesterName: string;
  portalUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [clientEmail],
    subject: `[${APP_NAME}] Signature requise : ${documentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Signature requise</h2>
        <p>Bonjour <strong>${clientName}</strong>,</p>
        <p><strong>${requesterName}</strong> vous demande de signer le document suivant :</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold;">${documentName}</p>
        </div>
        <p><a href="${portalUrl}/client/documents" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Signer le document</a></p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME}</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail({
  email,
  fullName,
  invitedBy,
  role,
  entity,
  portalUrl,
}: {
  email: string;
  fullName: string | null;
  invitedBy: string;
  role: string;
  entity: string | null;
  portalUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const entityLabel = entity === "gsl_fiduciaire" ? "GSL Fiduciaire" : entity === "gsl_revision" ? "GSL Révision" : entity === "both" ? "GSL Fiduciaire & GSL Révision" : null;
  const greeting = fullName ? `Bonjour <strong>${fullName}</strong>,` : "Bonjour,";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: `[${APP_NAME}] Votre accès GSL Apps est prêt`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 24px 0;">
          <h1 style="color: #e62a34; font-size: 24px; margin: 0;">GSL Apps</h1>
        </div>
        <h2 style="color: #1a1a1a;">Bienvenue sur le portail GSL</h2>
        <p>${greeting}</p>
        <p><strong>${invitedBy}</strong> vous a créé un accès au portail GSL Apps en tant que <strong>${role}</strong>${entityLabel ? ` pour <strong>${entityLabel}</strong>` : ""}.</p>
        <p>Vous allez recevoir un email de Supabase avec un lien pour activer votre compte et choisir votre mot de passe.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">Vos informations :</p>
          <p style="margin: 0; color: #666;">Email : <strong>${email}</strong></p>
          <p style="margin: 4px 0 0; color: #666;">Rôle : <strong>${role}</strong></p>
          ${entityLabel ? `<p style="margin: 4px 0 0; color: #666;">Entité : <strong>${entityLabel}</strong></p>` : ""}
        </div>
        <p><a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background: #e62a34; color: white; text-decoration: none; border-radius: 9999px; font-weight: 500;">Accéder au portail GSL Apps</a></p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME} — fiduciaire | révision | management</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  email,
  fullName,
  resetUrl,
  portalUrl,
}: {
  email: string;
  fullName: string | null;
  resetUrl: string;
  portalUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const greeting = fullName ? `Bonjour <strong>${fullName}</strong>,` : "Bonjour,";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: `[${APP_NAME}] Réinitialisation de votre mot de passe`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Réinitialisation de mot de passe</h2>
        <p>${greeting}</p>
        <p>Un administrateur a demandé la réinitialisation de votre mot de passe sur ${APP_NAME}.</p>
        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #e62a34; color: white; text-decoration: none; border-radius: 9999px; font-weight: 500;">Réinitialiser mon mot de passe</a></p>
        <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 24 heures.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">${APP_NAME} — fiduciaire | révision | management</p>
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
