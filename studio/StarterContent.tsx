import { useState } from "react";
import { useClient, type Tool } from "sanity";
import defaults from "../content/defaults.json";

export function StarterContent() {
  const client = useClient({ apiVersion: "2026-01-01" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function importContent() {
    setBusy(true);
    setStatus("Checking existing content…");
    try {
      const transaction = client.transaction();
      // createIfNotExists preserves edits on repeat imports.
      transaction.createIfNotExists(defaults.settings);
      transaction.createIfNotExists(defaults.page);
      await transaction.commit();
      setStatus(
        "Starter content is ready. Existing documents were preserved. Open Content → Home or Site settings to edit.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Import failed. Check your project permissions.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      style={{
        padding: "48px 24px",
        maxWidth: 700,
        margin: "auto",
        fontFamily: "system-ui",
        lineHeight: 1.65,
      }}
    >
      <h1>Welcome to Nufa Media</h1>
      <p>
        Start with the website’s editable copy and content blocks. This imports
        the Home page and Site settings into this project. Existing documents
        are never overwritten.
      </p>
      <p>
        Sign in with a Sanity account that has Editor or Administrator access to
        the Nufa Media project. Review the starter content and replace the
        studio concepts with your own work.
      </p>
      <button
        disabled={busy}
        onClick={importContent}
        style={{
          padding: "14px 22px",
          background: "#25d366",
          color: "#010306",
          border: 0,
          borderRadius: 4,
          fontSize: 15,
          fontWeight: 600,
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {busy ? "Importing…" : "Import starter content"}
      </button>
      <p role="status">{status}</p>
      <p>
        Contact email, WhatsApp, and telephone are in{" "}
        <strong>Site settings</strong>. Add, remove, or drag blocks in{" "}
        <strong>Home → Content blocks</strong>. Publish your edits to update the
        website.
      </p>
    </div>
  );
}
export const starterTool: Tool = {
  name: "starter-content",
  title: "Starter content",
  component: StarterContent,
};
