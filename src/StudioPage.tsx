import { Studio } from "sanity";
import { studioConfig } from "../studio/config";
const config = studioConfig(
  import.meta.env.VITE_SANITY_PROJECT_ID || "2bndbdfg",
  import.meta.env.VITE_SANITY_DATASET || "production",
  "/studio",
);
export default function StudioPage() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <Studio config={config} />
    </div>
  );
}
