import { db } from "../db/client";
import { listings, vehicleModelDescriptions } from "../db/schema";
import { sql, count, and, eq } from "drizzle-orm";
import { Anthropic } from "@anthropic-ai/sdk";

const BATCH_SIZE = 30;

async function generateModelDescriptions() {
  console.log("Finding missing model descriptions...\n");

  // Get top popular models that don't have descriptions
  const popularModels = await db
    .select({
      make: listings.make,
      model: listings.model,
      count: count(),
    })
    .from(listings)
    .where(sql`${listings.make} IS NOT NULL AND ${listings.model} IS NOT NULL`)
    .groupBy(listings.make, listings.model)
    .orderBy(sql`count(*) DESC`)
    .limit(200); // Get more to filter for missing ones

  const missingModels = [];

  for (const model of popularModels) {
    const description = await db
      .select()
      .from(vehicleModelDescriptions)
      .where(
        and(
          eq(vehicleModelDescriptions.make, model.make || ""),
          eq(vehicleModelDescriptions.model, model.model || ""),
        ),
      );

    if (description.length === 0) {
      missingModels.push(model);
    }
  }

  const topMissing = missingModels.slice(0, BATCH_SIZE);

  if (topMissing.length === 0) {
    console.log("No missing descriptions found!");
    return;
  }

  console.log(`Found ${topMissing.length} models missing descriptions:`);
  topMissing.forEach((m) => {
    console.log(`  ${m.make} ${m.model} (${m.count} listings)`);
  });
  console.log("\nGenerating descriptions using Claude...\n");

  const client = new Anthropic();
  let inserted = 0;
  let failed = 0;

  for (const model of topMissing) {
    try {
      const message = await client.messages.create({
        model: "claude-opus-4-1",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Generate a brief, informative vehicle model description for the ${model.make} ${model.model}.

Include:
1. A one-sentence overview of what this vehicle is known for
2. Key characteristics (body type, practicality, performance, etc.)
3. Suitability for different buyers

Keep it concise (2-3 sentences total).

Format your response as valid JSON with these exact fields:
{
  "description": "overview and characteristics",
  "reliabilityIssues": "common issues and reliability concerns, or null if generally reliable",
  "notes": "additional info like popular variants, features, etc."
}`,
          },
        ],
      });

      let responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`  ✗ ${model.make} ${model.model}: No JSON found in response`);
        failed++;
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Insert into database
      await db.insert(vehicleModelDescriptions).values({
        make: model.make || "",
        model: model.model || "",
        description: parsed.description,
        reliabilityIssues: parsed.reliabilityIssues || null,
        notes: parsed.notes || null,
      });

      console.log(`  ✓ ${model.make} ${model.model}`);
      inserted++;
    } catch (error) {
      console.error(
        `  ✗ ${model.make} ${model.model}:`,
        error instanceof Error ? error.message : String(error),
      );
      failed++;
    }
  }

  console.log(
    `\n✓ Generated and inserted ${inserted} descriptions, ${failed} failed`,
  );
}

generateModelDescriptions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
