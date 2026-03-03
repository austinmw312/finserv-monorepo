import { Notification, NotificationType } from "@finserv/common";

interface RenderedNotification {
  subject: string;
  body: string;
}

const TEMPLATES: Record<
  NotificationType,
  { subject: string; body: string }
> = {
  [NotificationType.TRADE_EXECUTED]: {
    subject: "Trade Executed: {{symbol}}",
    body: "Your {{side}} order for {{quantity}} shares of {{symbol}} at ${{price}} has been executed. Total: ${{total}}.",
  },
  [NotificationType.TRADE_FAILED]: {
    subject: "Trade Failed: {{symbol}}",
    body: "Your {{side}} order for {{quantity}} shares of {{symbol}} has failed. Please check your account and try again.",
  },
  [NotificationType.KYC_APPROVED]: {
    subject: "KYC Verification Approved",
    body: "Your identity verification has been approved. You now have full access to all trading features.",
  },
  [NotificationType.KYC_REJECTED]: {
    subject: "KYC Verification Rejected",
    body: "Your identity verification has been rejected. Reason: {{reason}}. Please resubmit your documents.",
  },
  [NotificationType.BALANCE_LOW]: {
    subject: "Low Balance Alert",
    body: "Your account balance is below ${{threshold}}. Current balance: ${{balance}}. Please deposit funds to continue trading.",
  },
  [NotificationType.SECURITY_ALERT]: {
    subject: "Security Alert: {{alertType}}",
    body: "We detected {{alertType}} on your account. If this wasn't you, please contact support immediately.",
  },
};

function interpolate(
  template: string,
  variables: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

export function renderTemplate(notification: Notification): RenderedNotification {
  const template = TEMPLATES[notification.type];
  if (!template) {
    return { subject: notification.subject, body: notification.body };
  }

  const variables = (notification.metadata || {}) as Record<string, unknown>;

  return {
    subject: interpolate(template.subject, variables),
    body: interpolate(template.body, variables),
  };
}
