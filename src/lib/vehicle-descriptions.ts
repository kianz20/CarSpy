export interface VehicleModelDescription {
  id: number;
  make: string;
  model: string;
  description: string;
  reliabilityIssues: string | null;
  notes: string | null;
}

export async function getModelDescription(
  make: string,
  model: string
): Promise<VehicleModelDescription | null> {
  try {
    const params = new URLSearchParams({
      make,
      model,
    });

    const response = await fetch(`/api/vehicles/model-description?${params}`, {
      cache: "force-cache",
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching model description:", error);
    return null;
  }
}
