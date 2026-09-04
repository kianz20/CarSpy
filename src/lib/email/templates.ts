// Mirrors the site's own look (see globals.css): the purple→cyan accent
// gradient, card surface with a soft border/shadow, and the page's off-white
// background — inlined since email clients don't load external stylesheets.
// No dark-mode variant: email client support for prefers-color-scheme is too
// inconsistent to rely on, so these always render in the site's light theme.
const ACCENT = "#6d5bff";
const ACCENT_2 = "#22d3ee";
const FOREGROUND = "#14141f";
const MUTED = "#6b6b80";
const BORDER = "rgba(20, 20, 31, 0.08)";
const PAGE_BG = "#f7f7fb";
const SURFACE = "#ffffff";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function button(label: string, link: string): string {
  return `
    <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_2}); color: #ffffff; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 999px;">
      ${label}
    </a>
  `;
}

function wrapper(heading: string, bodyHtml: string): string {
  return `
    <div style="background: ${PAGE_BG}; padding: 40px 16px; font-family: ${FONT_STACK};">
      <div style="max-width: 480px; margin: 0 auto; background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 16px; box-shadow: 0 8px 24px -12px rgba(20, 20, 31, 0.18); padding: 32px;">
        <div style="font-size: 17px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 28px;">
          <span style="color: ${ACCENT}; background: linear-gradient(90deg, ${ACCENT}, ${ACCENT_2}); -webkit-background-clip: text; background-clip: text;">CarSpy NZ</span>
        </div>
        <h1 style="font-size: 20px; font-weight: 800; letter-spacing: -0.01em; color: ${FOREGROUND}; margin: 0 0 14px;">${heading}</h1>
        ${bodyHtml}
      </div>
      <p style="max-width: 480px; margin: 20px auto 0; text-align: center; font-size: 11px; color: ${MUTED}; font-family: ${FONT_STACK};">
        CarSpy NZ · carspy.co.nz
      </p>
    </div>
  `;
}

function paragraph(text: string): string {
  return `<p style="font-size: 14px; line-height: 1.6; color: ${FOREGROUND}; margin: 0 0 16px;">${text}</p>`;
}

function footnote(text: string): string {
  return `<p style="font-size: 12px; line-height: 1.5; color: ${MUTED}; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid ${BORDER};">${text}</p>`;
}

export function verifyEmailHtml(link: string): string {
  return wrapper(
    "Verify your email",
    `
      ${paragraph("Thanks for signing up for CarSpy NZ. Click below to verify your email address and finish creating your account.")}
      <p style="margin: 24px 0;">${button("Verify email", link)}</p>
      ${footnote("This link expires in 24 hours. If you didn't create a CarSpy NZ account, you can ignore this email.")}
    `,
  );
}

export function resetPasswordHtml(link: string): string {
  return wrapper(
    "Reset your password",
    `
      ${paragraph("We received a request to reset your CarSpy NZ password. Click below to choose a new one.")}
      <p style="margin: 24px 0;">${button("Reset password", link)}</p>
      ${footnote("This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.")}
    `,
  );
}

export function passwordChangedHtml(forgotPasswordLink: string): string {
  return wrapper(
    "Your password was changed",
    `
      ${paragraph("This is a confirmation that your CarSpy NZ account password was just changed.")}
      ${paragraph("If this was you, no action is needed. If it wasn't, reset your password immediately:")}
      <p style="margin: 24px 0;">${button("Reset password", forgotPasswordLink)}</p>
    `,
  );
}
