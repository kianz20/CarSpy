import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getWatchlistListings } from "@/lib/watchlist";
import { estimate3YearOwnershipCost } from "@/lib/ownership";
import { ListingCard } from "@/components/listing-card";
import { Disclaimer } from "@/components/disclaimer";

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const listings = await getWatchlistListings(user.id);

  return (
    <div className="mx-auto w-full max-w-[1700px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-6 flex flex-col gap-2 lg:mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your watchlist</h1>
        <p className="max-w-2xl text-sm text-muted">
          Listings you&apos;ve starred, shown with default finance/insurance assumptions — open a
          listing to tweak them.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <Disclaimer />

        {listings.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <div className="text-3xl">☆</div>
            <p className="text-sm font-medium">Your watchlist is empty</p>
            <p className="text-xs text-muted">Star a listing from search results to save it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                detailHref={`/listing/${listing.id}`}
                isWatchlisted
                ownershipCost={estimate3YearOwnershipCost(
                  {
                    make: listing.make,
                    year: listing.year ?? undefined,
                    bodyType: listing.bodyType ?? undefined,
                    powertrain: listing.powertrain ?? undefined,
                    engine: listing.engine ?? undefined,
                    price: listing.price,
                    mileageKm: listing.mileageKm ?? undefined,
                  },
                  { depositFraction: 1 },
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
