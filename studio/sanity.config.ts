import { studioConfig } from "./config";
export default studioConfig(
  process.env.SANITY_STUDIO_PROJECT_ID || "2bndbdfg",
  process.env.SANITY_STUDIO_DATASET || "production",
);
