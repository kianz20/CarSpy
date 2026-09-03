// Minimal inline-styled HTML — no templating library for two short emails.
function wrapper(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h1 style="font-size: 18px; margin-bottom: 16px;">${heading}</h1>
      ${bodyHtml}
      <p style="font-size: 12px; color: #888; margin-top: 32px;">CarSpy NZ</p>
    </div>
  `;
}

export function verifyEmailHtml(link: string): string {
  return wrapper(
    "Verify your email",
    `
      <p style="font-size: 14px; line-height: 1.5;">Thanks for signing up for CarSpy NZ. Click below to verify your email address and finish creating your account.</p>
      <p style="margin: 24px 0;"><a href="${link}" style="background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Verify email</a></p>
      <p style="font-size: 12px; color: #888;">This link expires in 24 hours. If you didn't create a CarSpy NZ account, you can ignore this email.</p>
    `,
  );
}

export function resetPasswordHtml(link: string): string {
  return wrapper(
    "Reset your password",
    `
      <p style="font-size: 14px; line-height: 1.5;">We received a request to reset your CarSpy NZ password. Click below to choose a new one.</p>
      <p style="margin: 24px 0;"><a href="${link}" style="background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Reset password</a></p>
      <p style="font-size: 12px; color: #888;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
    `,
  );
}
