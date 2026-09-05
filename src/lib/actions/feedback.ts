"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminEmail, getAdminEmails } from "@/lib/auth/admin";
import { submitFeedback, markAllFeedbackRead } from "@/lib/feedback";
import { sendEmail } from "@/lib/email/send";
import { feedbackAlertHtml } from "@/lib/email/templates";

export type SubmitFeedbackState = { error?: string; success?: boolean };

export async function submitFeedbackAction(
  _prevState: SubmitFeedbackState,
  formData: FormData,
): Promise<SubmitFeedbackState> {
  const message = String(formData.get("message") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const pageUrl = String(formData.get("pageUrl") ?? "").trim();

  if (!message) return { error: "Enter some feedback before sending" };
  if (message.length > 4000) return { error: "That's a bit long — please keep it under 4000 characters" };

  const user = await getCurrentUser();

  await submitFeedback({
    userId: user?.id,
    email: email || undefined,
    message,
    pageUrl: pageUrl || undefined,
  });

  // Best-effort — a submitter's feedback is already saved (and visible in
  // the admin feedback list) regardless of whether this alert goes out, so
  // a Resend hiccup here shouldn't turn into an error the submitter sees.
  const fromEmail = user?.email || email || undefined;
  await Promise.all(
    getAdminEmails().map((to) =>
      sendEmail({
        to,
        subject: "New feedback submitted",
        html: feedbackAlertHtml(message, fromEmail, pageUrl || undefined),
      }).catch((err) => console.error("[error] feedback alert email failed —", err)),
    ),
  );

  return { success: true };
}

export async function markAllFeedbackReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return;
  await markAllFeedbackRead();
  revalidatePath("/feedback");
}
