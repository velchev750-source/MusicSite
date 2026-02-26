import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabaseClient.js";
import { requireAdmin, showAdminMessage } from "./admin-common.js";

type MediaType = "" | "photo" | "audio" | "video";
type VideoEmbedRow = {
  id: string;
  video_url: string;
  is_active: boolean;
  created_at: string;
};

function isValidMediaType(type: string): type is Exclude<MediaType, ""> {
  return type === "photo" || type === "audio" || type === "video";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

window.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const form = document.getElementById("adminMediaForm");
  const fileInput = document.getElementById("adminMediaFile");
  const mediaTypeSelect = document.getElementById("adminMediaType");
  const videoUrlGroup = document.getElementById("adminMediaVideoUrlGroup");
  const videoUrlInput = document.getElementById("adminMediaVideoUrl");
  const submitButton = document.getElementById("adminMediaSubmit");
  const embedList = document.getElementById("adminEmbedList");
  const embedMessage = document.getElementById("adminEmbedMessage");

  if (
    !(form instanceof HTMLFormElement) ||
    !(fileInput instanceof HTMLInputElement) ||
    !(mediaTypeSelect instanceof HTMLSelectElement) ||
    !(videoUrlGroup instanceof HTMLElement) ||
    !(videoUrlInput instanceof HTMLInputElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(embedList instanceof HTMLElement) ||
    !(embedMessage instanceof HTMLElement)
  ) {
    return;
  }

  let isSubmitting = false;

  function getSelectedType(): MediaType {
    const selected = mediaTypeSelect.value.trim().toLowerCase();
    return isValidMediaType(selected) ? selected : "";
  }

  function clearStatus() {
    showAdminMessage("adminMediaMessage", "");
  }

  function setEmbedMessage(text: string, isError = false) {
    embedMessage.textContent = text;
    embedMessage.classList.toggle("account-history-message-error", isError);
  }

  function renderEmbeds(rows: VideoEmbedRow[]) {
    if (!rows.length) {
      embedList.innerHTML = "";
      setEmbedMessage("No video embeds saved yet.");
      return;
    }

    setEmbedMessage("");

    embedList.innerHTML = rows
      .map((row) => {
        const status = row.is_active ? "Active" : "Inactive";
        const statusClass = row.is_active ? "account-booking-status-confirmed" : "account-booking-status-cancelled";

        return `
          <article class="account-booking-item">
            <div class="account-booking-row">
              <h3>Video Embed</h3>
              <span class="account-booking-status ${statusClass}">${status}</span>
            </div>
            <p class="mb-2"><a href="${escapeHtml(row.video_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.video_url)}</a></p>
            ${
              row.is_active
                ? `<button type="button" class="btn account-cancel-btn" data-embed-action="deactivate" data-id="${row.id}">Deactivate</button>`
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  async function loadEmbeds() {
    const { data, error } = await supabase
      .from("media_video_embeds")
      .select("id, video_url, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setEmbedMessage("Could not load video embeds.", true);
      return;
    }

    renderEmbeds((data ?? []) as VideoEmbedRow[]);
  }

  function syncFields() {
    const mediaType = getSelectedType();
    const file = fileInput.files?.[0] ?? null;
    const videoUrl = videoUrlInput.value.trim();

    if (mediaType === "video") {
      videoUrlGroup.classList.remove("d-none");
      fileInput.required = false;
    } else {
      videoUrlGroup.classList.add("d-none");
      videoUrlInput.value = "";
      fileInput.required = mediaType !== "";
    }

    const hasRequiredFields =
      mediaType !== "" && (mediaType === "video" ? Boolean(videoUrl) || Boolean(file) : Boolean(file));

    submitButton.disabled = !hasRequiredFields || isSubmitting;
  }

  mediaTypeSelect.addEventListener("change", () => {
    clearStatus();
    syncFields();
  });

  fileInput.addEventListener("change", () => {
    clearStatus();
    syncFields();
  });

  videoUrlInput.addEventListener("input", () => {
    clearStatus();
    syncFields();
  });

  embedList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.embedAction !== "deactivate") {
      return;
    }

    const embedId = target.dataset.id;
    if (!embedId) {
      return;
    }

    target.setAttribute("disabled", "true");
    setEmbedMessage("Updating...");

    const { error } = await supabase
      .from("media_video_embeds")
      .update({ is_active: false })
      .eq("id", embedId)
      .eq("is_active", true);

    if (error) {
      setEmbedMessage("Could not deactivate embed.", true);
      target.removeAttribute("disabled");
      return;
    }

    await loadEmbeds();
  });

  syncFields();
  await loadEmbeds();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mediaType = getSelectedType();
    const file = fileInput.files?.[0] ?? null;
    const videoUrl = videoUrlInput.value.trim();

    if (!mediaType || (mediaType !== "video" && !file) || (mediaType === "video" && !file && !videoUrl)) {
      syncFields();
      return;
    }

    if (file) {
      const hasValidType =
        (mediaType === "photo" && file.type.startsWith("image/")) ||
        (mediaType === "audio" && file.type.startsWith("audio/")) ||
        (mediaType === "video" && file.type.startsWith("video/"));

      if (!hasValidType) {
        showAdminMessage("adminMediaMessage", "Invalid file type for selected media category.", true);
        syncFields();
        return;
      }
    }

    if (mediaType === "video" && videoUrl) {
      try {
        new URL(videoUrl);
      } catch {
        showAdminMessage("adminMediaMessage", "Please enter a valid video URL.", true);
        return;
      }

      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession?.user?.id) {
        showAdminMessage("adminMediaMessage", "Your session expired. Please log in again.", true);
        return;
      }

      const { error: saveError } = await supabase.from("media_video_embeds").insert({
        video_url: videoUrl,
        created_by: authSession.user.id,
      });

      if (saveError) {
        showAdminMessage("adminMediaMessage", "Could not save video URL right now.", true);
        return;
      }

      showAdminMessage("adminMediaMessage", "Video URL saved successfully.");
      form.reset();
      syncFields();
      await loadEmbeds();
      return;
    }

    if (!file) {
      syncFields();
      return;
    }

    isSubmitting = true;
    syncFields();
    showAdminMessage("adminMediaMessage", "Uploading...");

    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession?.access_token) {
        showAdminMessage("adminMediaMessage", "Your session expired. Please log in again.", true);
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-media-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      let data: {
        error?: string;
        path?: string;
        token?: string;
        publicUrl?: string;
      } | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || data?.error || !data?.path || !data?.token || !data?.publicUrl) {
        showAdminMessage("adminMediaMessage", data?.error || `Failed to prepare upload (${response.status}).`, true);
        return;
      }

      const uploadResult = await supabase.storage.from("media").uploadToSignedUrl(data.path, data.token, file);

      if (uploadResult.error) {
        showAdminMessage("adminMediaMessage", uploadResult.error.message, true);
        return;
      }

      showAdminMessage("adminMediaMessage", `Upload complete: ${data.publicUrl}`);
      form.reset();
      syncFields();
    } finally {
      isSubmitting = false;
      syncFields();
    }
  });
});