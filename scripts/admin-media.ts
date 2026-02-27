import { supabase } from "./supabaseClient.js";
import { requireAdmin, showAdminMessage } from "./admin-common.js";

type MediaType = "" | "photo" | "audio" | "video";
type UploadFolder = "photos" | "audio" | "thumbs";

function isValidMediaType(type: string): type is Exclude<MediaType, ""> {
  return type === "photo" || type === "audio" || type === "video";
}

function folderForType(type: Exclude<MediaType, "">): UploadFolder {
  return type === "photo" ? "photos" : "audio";
}

function buildUploadPath(folder: UploadFolder, originalName: string): string {
  const extension = originalName.includes(".") ? originalName.split(".").pop() ?? "bin" : "bin";
  const safeBase = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${folder}/${safeBase || "file"}-${suffix}.${extension.toLowerCase()}`;
}

async function uploadFileToFolder(file: File, folder: UploadFolder): Promise<string> {
  const path = buildUploadPath(folder, file.name);
  const { error } = await supabase.storage.from("media").upload(path, file, {
    upsert: false,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message || "Failed to upload file.");
  }

  return path;
}

window.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  const form = document.getElementById("adminMediaForm");
  const mediaTypeSelect = document.getElementById("adminMediaType");
  const titleInput = document.getElementById("adminMediaTitle");
  const subtitleInput = document.getElementById("adminMediaSubtitle");
  const sortOrderInput = document.getElementById("adminMediaSortOrder");
  const publishedInput = document.getElementById("adminMediaPublished");
  const videoUrlGroup = document.getElementById("adminMediaVideoUrlGroup");
  const videoUrlInput = document.getElementById("adminMediaVideoUrl");
  const fileGroup = document.getElementById("adminMediaFileGroup");
  const fileInput = document.getElementById("adminMediaFile");
  const thumbInput = document.getElementById("adminMediaThumb");
  const submitButton = document.getElementById("adminMediaSubmit");

  if (
    !(form instanceof HTMLFormElement) ||
    !(mediaTypeSelect instanceof HTMLSelectElement) ||
    !(titleInput instanceof HTMLInputElement) ||
    !(subtitleInput instanceof HTMLInputElement) ||
    !(sortOrderInput instanceof HTMLInputElement) ||
    !(publishedInput instanceof HTMLInputElement) ||
    !(videoUrlGroup instanceof HTMLElement) ||
    !(videoUrlInput instanceof HTMLInputElement) ||
    !(fileGroup instanceof HTMLElement) ||
    !(fileInput instanceof HTMLInputElement) ||
    !(thumbInput instanceof HTMLInputElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  const mediaTypeSelectEl = mediaTypeSelect;
  const titleInputEl = titleInput;
  const subtitleInputEl = subtitleInput;
  const sortOrderInputEl = sortOrderInput;
  const publishedInputEl = publishedInput;
  const videoUrlGroupEl = videoUrlGroup;
  const videoUrlInputEl = videoUrlInput;
  const fileGroupEl = fileGroup;
  const fileInputEl = fileInput;
  const thumbInputEl = thumbInput;
  const submitButtonEl = submitButton;
  const formEl = form;

  let isSubmitting = false;

  function getSelectedType(): MediaType {
    const selected = mediaTypeSelectEl.value.trim().toLowerCase();
    return isValidMediaType(selected) ? selected : "";
  }

  function clearStatus() {
    showAdminMessage("adminMediaMessage", "");
  }

  function syncFields() {
    const type = getSelectedType();
    const title = titleInputEl.value.trim();
    const videoUrl = videoUrlInputEl.value.trim();
    const mainFile = fileInputEl.files?.[0] ?? null;
    const thumbFile = thumbInputEl.files?.[0] ?? null;

    if (type === "video") {
      videoUrlGroupEl.classList.remove("d-none");
      fileGroupEl.classList.add("d-none");
      fileInputEl.required = false;
    } else {
      videoUrlGroupEl.classList.add("d-none");
      videoUrlInputEl.value = "";
      fileGroupEl.classList.remove("d-none");
      fileInputEl.required = type !== "";
    }

    const hasBaseFields = type !== "" && title.length > 0;
    const hasTypeFields =
      type === "video" ? videoUrl.length > 0 && Boolean(thumbFile) : Boolean(mainFile);

    submitButtonEl.disabled = !hasBaseFields || !hasTypeFields || isSubmitting;
  }

  mediaTypeSelectEl.addEventListener("change", () => {
    clearStatus();
    syncFields();
  });

  [titleInputEl, subtitleInputEl, sortOrderInputEl, videoUrlInputEl].forEach((input) => {
    input.addEventListener("input", () => {
      clearStatus();
      syncFields();
    });
  });

  [fileInputEl, thumbInputEl, publishedInputEl].forEach((input) => {
    input.addEventListener("change", () => {
      clearStatus();
      syncFields();
    });
  });

  syncFields();

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();

    const type = getSelectedType();
    const title = titleInputEl.value.trim();
    const subtitle = subtitleInputEl.value.trim();
    const sortOrder = Number.parseInt(sortOrderInputEl.value, 10);
    const isPublished = publishedInputEl.checked;
    const videoUrl = videoUrlInputEl.value.trim();
    const mainFile = fileInputEl.files?.[0] ?? null;
    const thumbFile = thumbInputEl.files?.[0] ?? null;

    if (!type || !title) {
      syncFields();
      return;
    }

    if (type === "video") {
      if (!videoUrl) {
        showAdminMessage("adminMediaMessage", "Video URL is required for video items.", true);
        return;
      }

      if (!thumbFile) {
        showAdminMessage("adminMediaMessage", "Thumbnail is required for video items.", true);
        return;
      }

      try {
        new URL(videoUrl);
      } catch {
        showAdminMessage("adminMediaMessage", "Please enter a valid video URL.", true);
        return;
      }
    } else {
      if (!mainFile) {
        showAdminMessage("adminMediaMessage", "Main file is required for photo and audio items.", true);
        return;
      }

      const validMainType =
        (type === "photo" && mainFile.type.startsWith("image/")) ||
        (type === "audio" && mainFile.type.startsWith("audio/"));

      if (!validMainType) {
        showAdminMessage("adminMediaMessage", "Invalid file type for selected media category.", true);
        return;
      }
    }

    if (thumbFile && !thumbFile.type.startsWith("image/")) {
      showAdminMessage("adminMediaMessage", "Thumbnail must be an image file.", true);
      return;
    }

    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();

    if (!authSession) {
      showAdminMessage("adminMediaMessage", "Your session expired. Please log in again.", true);
      return;
    }

    isSubmitting = true;
    syncFields();
    showAdminMessage("adminMediaMessage", "Saving media item...");

    try {
      let filePath: string | null = null;
      let thumbPath: string | null = null;

      if (mainFile && type !== "video") {
        filePath = await uploadFileToFolder(mainFile, folderForType(type));
      }

      if (thumbFile) {
        thumbPath = await uploadFileToFolder(thumbFile, "thumbs");
      }

      const payload = {
        type,
        title,
        subtitle: subtitle || null,
        external_url: type === "video" ? videoUrl : null,
        file_path: filePath,
        thumb_path: thumbPath,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        is_published: isPublished,
      };

      const { error } = await supabase.from("media_items").insert(payload);
      if (error) {
        showAdminMessage("adminMediaMessage", "Could not save media item.", true);
        return;
      }

      showAdminMessage("adminMediaMessage", "Media item saved successfully.");
      formEl.reset();
      sortOrderInputEl.value = "0";
      publishedInputEl.checked = true;
      syncFields();
    } catch (error) {
      showAdminMessage("adminMediaMessage", (error as Error).message || "Upload failed.", true);
    } finally {
      isSubmitting = false;
      syncFields();
    }
  });
});
