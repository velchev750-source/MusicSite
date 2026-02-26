import { supabase } from "./supabaseClient.js";
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

    const { data, error } = await supabase.functions.invoke("admin-media-upload", {
      body: { fileName: file.name },
    });

    if (error || data?.error) {
      showAdminMessage("adminMediaMessage", data?.error || error?.message || "Failed to prepare upload.", true);
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
