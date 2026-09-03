import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export type OwnershipDefaults = {
  ownershipYears: number;
  annualKm: number;
  financeEnabled: boolean;
  deposit?: number;
};

export const HARDCODED_DEFAULTS: OwnershipDefaults = {
  ownershipYears: 1,
  annualKm: 12000,
  financeEnabled: false,
};

// Logged-out visitors have no user row to key a DB setting on, so their
// saved defaults live in a plain cookie instead — read/written server-side
// only (search/listing pages are Server Components), so this never needs a
// client-side storage API.
const GUEST_SETTINGS_COOKIE = "ownership_defaults";
const GUEST_SETTINGS_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function clampOwnershipYears(value: number): number {
  return Math.min(Math.max(Math.round(value), 1), 5);
}

/** The defaults to fall back on wherever the search/listing pages don't
 * already have an explicit value from the URL — the signed-in user's saved
 * row, the anonymous cookie, or the app's hardcoded defaults, in that order. */
export async function getEffectiveDefaults(): Promise<OwnershipDefaults> {
  const user = await getCurrentUser();

  if (user) {
    const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));
    if (!row) return HARDCODED_DEFAULTS;
    return {
      ownershipYears: clampOwnershipYears(row.ownershipYears),
      annualKm: row.annualKm,
      financeEnabled: row.financeEnabled,
      deposit: row.deposit !== null ? parseFloat(row.deposit) : undefined,
    };
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(GUEST_SETTINGS_COOKIE)?.value;
  if (!raw) return HARDCODED_DEFAULTS;

  try {
    const parsed = JSON.parse(raw) as Partial<OwnershipDefaults>;
    return {
      ownershipYears:
        typeof parsed.ownershipYears === "number"
          ? clampOwnershipYears(parsed.ownershipYears)
          : HARDCODED_DEFAULTS.ownershipYears,
      annualKm: typeof parsed.annualKm === "number" ? parsed.annualKm : HARDCODED_DEFAULTS.annualKm,
      financeEnabled: parsed.financeEnabled === true,
      deposit: typeof parsed.deposit === "number" ? parsed.deposit : undefined,
    };
  } catch {
    // Malformed/tampered cookie — fall back rather than throwing.
    return HARDCODED_DEFAULTS;
  }
}

export async function saveUserDefaults(userId: number, defaults: OwnershipDefaults): Promise<void> {
  await db
    .insert(userSettings)
    .values({
      userId,
      ownershipYears: defaults.ownershipYears,
      annualKm: defaults.annualKm,
      financeEnabled: defaults.financeEnabled,
      deposit: defaults.deposit?.toFixed(2),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        ownershipYears: defaults.ownershipYears,
        annualKm: defaults.annualKm,
        financeEnabled: defaults.financeEnabled,
        deposit: defaults.deposit?.toFixed(2),
        updatedAt: new Date(),
      },
    });
}

export async function saveGuestDefaults(defaults: OwnershipDefaults): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_SETTINGS_COOKIE, JSON.stringify(defaults), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_SETTINGS_MAX_AGE,
  });
}
