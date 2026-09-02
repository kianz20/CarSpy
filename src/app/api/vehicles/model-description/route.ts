import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { vehicleModelDescriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const make = request.nextUrl.searchParams.get("make");
  const model = request.nextUrl.searchParams.get("model");

  if (!make || !model) {
    return NextResponse.json(
      { error: "Missing make or model parameter" },
      { status: 400 }
    );
  }

  try {
    const description = await db
      .select()
      .from(vehicleModelDescriptions)
      .where(
        and(
          eq(vehicleModelDescriptions.make, make),
          eq(vehicleModelDescriptions.model, model)
        )
      )
      .limit(1);

    if (description.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(description[0]);
  } catch (error) {
    console.error("Error fetching model description:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
