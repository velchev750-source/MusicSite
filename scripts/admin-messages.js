import { supabase } from "./supabaseClient.js";
import { requireAdmin, showAdminMessage } from "./admin-common.js";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

  function isMissingTelephoneColumn(error) {
    if (!error) {
      return false;
    }

    const errorText = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
    return errorText.includes("telephone") && errorText.includes("column");
  }

function renderMessages(items) {
  const list = document.getElementById("adminMessagesList");
  if (!list) {
    return;
  }

  if (!items.length) {
    list.innerHTML = "";
    showAdminMessage("adminMessagesMessage", "No messages yet.");
    return;
  }

  showAdminMessage("adminMessagesMessage", "");

  list.innerHTML = items
    .map(
      (message) => `
      <article class="account-booking-item">
        <div class="account-booking-row">
          <h3>${escapeHtml(message.name)}</h3>
          <span class="account-booking-status">${new Date(message.created_at).toLocaleString()}</span>
        </div>
        <p class="mb-1"><strong>Email:</strong> ${escapeHtml(message.email)}</p>
        ${message.telephone ? `<p class="mb-1"><strong>Telephone:</strong> ${escapeHtml(message.telephone)}</p>` : ""}
        <p class="mb-0">${escapeHtml(message.message)}</p>
      </article>
    `
    )
    .join("");
}

window.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

    let { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, telephone, message, created_at")
      .order("created_at", { ascending: false });

    if (error && isMissingTelephoneColumn(error)) {
      const retryResult = await supabase
        .from("contact_messages")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false });

      data = retryResult.data;
      error = retryResult.error;
    }

  if (error) {
    showAdminMessage("adminMessagesMessage", "Failed to load messages.", true);
    return;
  }

  renderMessages(data || []);
});
