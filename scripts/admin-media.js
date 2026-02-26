import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabaseClient.js";
import { requireAdmin, showAdminMessage } from "./admin-common.js";

window.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const form = document.getElementById("adminMediaForm");
  const fileInput = document.getElementById("adminMediaFile");

  if (!form || !(fileInput instanceof HTMLInputElement)) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = fileInput.files?.[0];
    if (!file) {
      showAdminMessage("adminMediaMessage", "Please choose a file.", true);
      return;
    }

    showAdminMessage("adminMediaMessage", "Uploading...");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      showAdminMessage("adminMediaMessage", "Your session expired. Please log in again.", true);
      return;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-media-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ fileName: file.name }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || data?.error) {
      showAdminMessage("adminMediaMessage", data?.error || `Failed to prepare upload (${response.status}).`, true);
      return;
    }

    const uploadResult = await supabase.storage
      .from("media")
      .uploadToSignedUrl(data.path, data.token, file);

    if (uploadResult.error) {
      showAdminMessage("adminMediaMessage", uploadResult.error.message, true);
      return;
    }

    showAdminMessage("adminMediaMessage", `Upload complete: ${data.publicUrl}`);
    form.reset();
  });
});
