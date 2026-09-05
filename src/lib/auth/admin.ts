// A small allowlist rather than a DB column: it works the moment this
// person logs in with this email, with no migration or manual row update
// needed first (unlike a stored `isAdmin` flag, which would need the user
// row to already exist before anyone could set it).
const ADMIN_EMAILS = new Set(["kianja02@gmail.com"]);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

/** Where to send admin-facing notifications (e.g. new feedback alerts) —
 * everyone in the allowlist above, not just whoever's currently logged in. */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}
