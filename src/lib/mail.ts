import { ApprovalEmail } from "@/emails/approval-email";
import { NotifySubmissionEmail } from "@/emails/notify-submission-to-admin";
import { NotifySubmissionToUserEmail } from "@/emails/notify-submission-to-user";
import { PaymentSuccessEmail } from "@/emails/payment-success";
import RejectionEmail from "@/emails/rejection-email";
import { ResetPasswordEmail } from "@/emails/reset-password";
import VerifyEmail from "@/emails/verify-email";
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL;

// Fail loudly instead of silently dropping verification / reset emails.
const isResendConfigured = Boolean(
  process.env.RESEND_API_KEY &&
    !process.env.RESEND_API_KEY.startsWith("re_placeholder"),
);

async function sendEmail(
  payload: Parameters<typeof resend.emails.send>[0],
): Promise<void> {
  if (!isResendConfigured) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  const { error } = await resend.emails.send(payload);
  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}

export const sendPasswordResetEmail = async (
  userName: string,
  email: string,
  token: string,
) => {
  const resetLink = `${SITE_URL}/auth/new-password?token=${token}`;

  await sendEmail({
    from: process.env.RESEND_EMAIL_FROM,
    to: email,
    subject: "Reset your password",
    react: ResetPasswordEmail({ userName, resetLink: resetLink }),
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${SITE_URL}/auth/new-verification?token=${token}`;

  await sendEmail({
    from: process.env.RESEND_EMAIL_FROM,
    to: email,
    subject: "Confirm your email",
    react: VerifyEmail({ confirmLink }),
  });
};

export const sendNotifySubmissionEmail = async (
  userName: string,
  userEmail: string,
  itemName: string,
  statusLink: string,
  reviewLink: string,
) => {
  // console.log(`sendNotifySubmissionEmail,
  //   userName: ${userName},
  //   userEmail: ${userEmail},
  //   itemName: ${itemName},
  //   reviewLink: ${reviewLink},
  //   statusLink: ${statusLink}`);

  await sendEmail({
    from: process.env.RESEND_EMAIL_FROM,
    to: userEmail,
    subject: "Thank you for your submission",
    react: NotifySubmissionToUserEmail({
      userName,
      itemName,
      statusLink,
    }),
  });

  await sendEmail({
    from: process.env.RESEND_EMAIL_FROM,
    to: process.env.RESEND_EMAIL_ADMIN,
    subject: "New submission",
    react: NotifySubmissionEmail({ itemName, reviewLink }),
  });
};

export const sendPaymentSuccessEmail = async (
  userName: string,
  email: string,
  itemLink: string,
) => {
  // console.log(`sendPaymentSuccessEmail,
  //   email: ${email},
  //   userName: ${userName},
  //   itemLink: ${itemLink}`);

  await sendEmail({
    from: process.env.RESEND_EMAIL_FROM,
    to: email,
    subject: "Thank your for your submission",
    react: PaymentSuccessEmail({ userName, itemLink }),
  });
};

export const sendApprovalEmail = async (
  userName: string,
  email: string,
  itemLink: string,
) => {
  await sendEmail({
    from: process.env.RESEND_EMAIL_FROM,
    to: email,
    subject: "Your submission has been approved",
    react: ApprovalEmail({ userName, itemLink }),
  });
};

export const sendRejectionEmail = async (
  userName: string,
  email: string,
  dashboardLink: string,
) => {
  await sendEmail({
    from: process.env.RESEND_EMAIL_FROM,
    to: email,
    subject: "Please check your submission",
    react: RejectionEmail({ userName, dashboardLink }),
  });
};
