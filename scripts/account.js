import { initAuthUi, requireAuthenticatedUser, signOutAndRedirect } from "./auth-common.js";
import { supabase } from "./supabaseClient.js";

const ONGOING_STATUSES = ["pending", "confirmed"];

function formatDateTime(dateValue, timeValue) {
  if (!dateValue) {
    return "-";
  }

  const parsedDate = new Date(`${dateValue}T${timeValue || "00:00"}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setHistoryMessage(text, isError = false) {
  const messageElement = document.getElementById("bookingHistoryMessage");
  if (!messageElement) {
    return;
  }

  messageElement.textContent = text;
  messageElement.classList.toggle("account-history-message-error", isError);
}

function renderBookingHistory(bookings) {
  const listElement = document.getElementById("bookingHistoryList");
  if (!listElement) {
    return;
  }

  if (!bookings.length) {
    listElement.innerHTML = "";
    setHistoryMessage("You haven\'t done booking request yet.");
    return;
  }

  setHistoryMessage("");

  listElement.innerHTML = bookings
    .map((booking) => {
      const status = (booking.status || "pending").toLowerCase();
      const canCancel = ONGOING_STATUSES.includes(status);

      return `
        <article class="account-booking-item">
          <div class="account-booking-row">
            <h3>${escapeHtml(booking.event_type)}</h3>
            <span class="account-booking-status account-booking-status-${status}">${escapeHtml(status)}</span>
          </div>
          <p class="mb-1"><strong>Date:</strong> ${escapeHtml(formatDateTime(booking.event_date, booking.event_time))}</p>
          <p class="mb-2"><strong>Duration:</strong> ${escapeHtml(booking.desired_duration)}</p>
          ${
            canCancel
              ? `<button type="button" class="btn account-cancel-btn" data-cancel-booking="${booking.id}">Cancel request</button>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

async function loadBookingHistory(userId) {
  const { data, error } = await supabase
    .from("booking_requests")
    .select("id, event_type, event_date, event_time, desired_duration, status, created_at")
    .eq("user_id", userId)
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false });

  if (error) {
    setHistoryMessage("Unable to load booking history right now.", true);
    return;
  }

  renderBookingHistory(data || []);
}

async function cancelBookingRequest(bookingId, userId) {
  const { error } = await supabase
    .from("booking_requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .in("status", ONGOING_STATUSES);

  if (error) {
    setHistoryMessage("Could not cancel this request. Please try again.", true);
    return;
  }

  await loadBookingHistory(userId);
}

window.addEventListener("DOMContentLoaded", async () => {
  await initAuthUi();

  const session = await requireAuthenticatedUser("index.html");
  if (!session) {
    return;
  }

  const userId = session.user.id;

  const emailElement = document.getElementById("account-email");
  const usernameElement = document.getElementById("account-username");

  if (emailElement) {
    emailElement.value = session.user.email || "-";
  }

  if (usernameElement) {
    usernameElement.value = session.user.user_metadata?.username || "-";
  }

  await loadBookingHistory(userId);

  const historyList = document.getElementById("bookingHistoryList");
  if (historyList) {
    historyList.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const bookingId = target.dataset.cancelBooking;
      if (!bookingId) {
        return;
      }

      target.setAttribute("disabled", "true");
      await cancelBookingRequest(bookingId, userId);
    });
  }

  const logoutButton = document.getElementById("account-logout");
  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async () => {
    await signOutAndRedirect("index.html");
  });
});
