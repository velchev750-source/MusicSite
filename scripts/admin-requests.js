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

function formatDate(dateValue, timeValue) {
  const parsedDate = new Date(`${dateValue}T${String(timeValue).slice(0, 5)}:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return `${dateValue} ${timeValue}`;
  }

  return parsedDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function render(list, data) {
  if (!list) {
    return;
  }

  if (!data.length) {
    list.innerHTML = "";
    showAdminMessage("adminRequestsMessage", "No booking inquiries yet.");
    return;
  }

  showAdminMessage("adminRequestsMessage", "");

  list.innerHTML = data
    .map(
      (row) => `
      <article class="account-booking-item">
        <div class="account-booking-row">
          <h3>${escapeHtml(row.event_type)}</h3>
          <span class="account-booking-status account-booking-status-${escapeHtml((row.status || "pending").toLowerCase())}">
            ${escapeHtml(row.status)}
          </span>
        </div>
        <p class="mb-1"><strong>User:</strong> ${escapeHtml(row.user_id)}</p>
        <p class="mb-1"><strong>Date:</strong> ${escapeHtml(formatDate(row.event_date, row.event_time))}</p>
        <p class="mb-2"><strong>Duration:</strong> ${escapeHtml(row.desired_duration)}</p>
        ${
          (row.status || "pending") === "pending"
            ? `<div class="d-flex gap-2"><button type="button" class="btn account-cancel-btn" data-admin-action="confirm" data-id="${row.id}">Confirm</button><button type="button" class="btn account-cancel-btn" data-admin-action="deny" data-id="${row.id}">Deny</button></div>`
            : ""
        }
      </article>
    `
    )
    .join("");
}

async function loadInquiries() {
  const { data, error } = await supabase
    .from("booking_inquiries")
    .select("id, user_id, event_type, event_date, event_time, desired_duration, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    showAdminMessage("adminRequestsMessage", "Failed to load booking inquiries.", true);
    return;
  }

  render(document.getElementById("adminRequestsList"), data || []);
}

window.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAdmin();
  if (!session) {
    return;
  }

  await loadInquiries();

  const list = document.getElementById("adminRequestsList");
  if (!list) {
    return;
  }

  list.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.adminAction;
    const inquiryId = target.dataset.id;
    if (!action || !inquiryId) {
      return;
    }

    target.setAttribute("disabled", "true");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      showAdminMessage("adminRequestsMessage", "Your session expired. Please log in again.", true);
      target.removeAttribute("disabled");
      return;
    }

    const { data, error } = await supabase.functions.invoke("admin-review-booking", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        inquiryId,
        action,
      },
    });

    if (error || data?.error) {
      showAdminMessage("adminRequestsMessage", data?.error || error?.message || "Action failed.", true);
      target.removeAttribute("disabled");
      return;
    }

    await loadInquiries();
  });
});
