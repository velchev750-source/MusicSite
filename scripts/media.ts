import { supabase } from "./supabaseClient.js";

function toEmbedUrl(input: string): string {
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.toString();
      }
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "");
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.replace(/^\//, "");
      if (id) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }

    return parsed.toString();
  } catch {
    return input;
  }
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
  const list = document.getElementById("videoEmbedList");
  const message = document.getElementById("videoEmbedsMessage");

  if (!(list instanceof HTMLElement) || !(message instanceof HTMLElement)) {
    return;
  }

  const { data, error } = await supabase
    .from("media_video_embeds")
    .select("id, video_url, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    message.textContent = "Video embeds are currently unavailable.";
    message.classList.add("account-history-message-error");
    return;
  }

  if (!data || data.length === 0) {
    message.textContent = "No video embeds published yet.";
    return;
  }

  message.textContent = "";
  message.classList.remove("account-history-message-error");

  list.innerHTML = data
    .map((row) => {
      const src = escapeHtml(toEmbedUrl(row.video_url));
      return `
        <div class="col-lg-6">
          <div class="video-embed-card">
            <div class="ratio ratio-16x9">
              <iframe src="${src}" title="Video embed" loading="lazy" allowfullscreen></iframe>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
});
