import { createClient } from "@sanity/client";
import { readFile } from "node:fs/promises";
const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error(
    "Set SANITY_WRITE_TOKEN in your local environment, or use the Starter content tab in /studio after signing in. Never commit a token.",
  );
  process.exit(1);
}
const projectId = process.env.SANITY_PROJECT_ID || "2bndbdfg";
const dataset = process.env.SANITY_DATASET || "production";
const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-01-01",
  token,
  useCdn: false,
});
const defaults = JSON.parse(
  await readFile(new URL("../content/defaults.json", import.meta.url), "utf8"),
);
await client
  .transaction()
  .createIfNotExists(defaults.settings)
  .createIfNotExists(defaults.page)
  .commit();
console.log(
  `Starter content imported into ${projectId}/${dataset}. Existing documents preserved.`,
);
