import { getEffectiveDefaults } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { SettingsForm } from "@/components/settings-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchAlertsList } from "@/components/search-alerts-list";
import { getSubscriptionsForUser } from "@/lib/search/subscriptions";

export default async function SettingsPage() {
  const [defaults, user] = await Promise.all([getEffectiveDefaults(), getCurrentUser()]);
  const subscriptions = user ? await getSubscriptionsForUser(user.id) : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div>
        <header className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Settings</h1>
        </header>

        <div className="card mb-6 p-6">
          <ThemeToggle />
        </div>

        <p className="mb-3 text-sm text-muted">
          Your defaults for ownership-cost estimates — applied to every search and listing unless a
          specific link overrides them. Saved to your account when you&apos;re logged in, or remembered
          on this browser otherwise.
        </p>

        <div className="card p-6">
          <SettingsForm defaults={defaults} />
        </div>
      </div>

      {user && (
        <div>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Change password</h2>
          <div className="card p-6">
            <ChangePasswordForm />
          </div>
        </div>
      )}

      {user && (
        <div>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Search alerts</h2>
          <div className="card p-6">
            <SearchAlertsList subscriptions={subscriptions} />
          </div>
        </div>
      )}
    </div>
  );
}
