import { supabase } from "./scripts/supabaseClient.js";

(() => {
  const calendar = document.getElementById("bookCalendar");
  const currentMonthYear = document.getElementById("currentMonthYear");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");

  if (!calendar || !currentMonthYear || !prevMonthBtn || !nextMonthBtn) {
    return;
  }

  function normalizeDate(date) {
    return date.toISOString().split("T")[0];
  }

  const today = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    )
  );

  let currentMonth = today.getUTCMonth();
  let currentYear = today.getUTCFullYear();
  let selectedDate = null;

  const blockedDates = new Set();

  function toDateKey(dateValue) {
    return dateValue.toISOString().split("T")[0];
  }

  async function loadBlockedDatesForVisibleMonth() {
    const monthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 1));

    blockedDates.clear();

    const { data, error } = await supabase
      .from("bookings")
      .select("start_at, end_at")
      .lt("start_at", monthEnd.toISOString())
      .gt("end_at", monthStart.toISOString());

    if (error) {
      return;
    }

    (data || []).forEach((booking) => {
      if (!booking.start_at || !booking.end_at) {
        return;
      }

      const start = new Date(booking.start_at);
      const end = new Date(booking.end_at);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return;
      }

      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

      while (cursor <= last) {
        blockedDates.add(toDateKey(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    });
  }

  function handleDateSelection(dayDiv) {
    const pickedDate = new Date(`${dayDiv.dataset.date}T00:00:00Z`);
    if (blockedDates.has(normalizeDate(pickedDate))) {
      window.alert("This date is unavailable.");
      return;
    }

    selectedDate = pickedDate;
    updateCalendar();
  }

  async function updateCalendar() {
    await loadBlockedDatesForVisibleMonth();

    calendar.innerHTML = "";

    const firstDay = new Date(Date.UTC(currentYear, currentMonth, 1));
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

    currentMonthYear.textContent = `${firstDay.toLocaleString("default", {
      month: "long",
    })} ${currentYear}`;

    prevMonthBtn.disabled =
      currentYear === today.getUTCFullYear() && currentMonth === today.getUTCMonth();

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";

      const span = document.createElement("span");
      span.textContent = dayNumber;

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
        dayNumber
      ).padStart(2, "0")}`;

      dayDiv.dataset.date = dateStr;
      dayDiv.appendChild(span);

      const dayDate = new Date(`${dateStr}T00:00:00Z`);
      const isPastDate = dayDate < today;
      const isBookedDate = blockedDates.has(dateStr);

      if (isPastDate) {
        dayDiv.classList.add("past", "disabled");
      }

      if (isBookedDate) {
        dayDiv.classList.add("full", "unavailable", "disabled");
        dayDiv.title = "Already booked";
        dayDiv.setAttribute("aria-label", `${dayNumber}, Already booked`);
      }

      if (selectedDate && normalizeDate(selectedDate) === dateStr) {
        dayDiv.classList.add("selected");
      }

      if (!isPastDate && !isBookedDate) {
        dayDiv.classList.add("selectable");
        dayDiv.addEventListener("click", () => handleDateSelection(dayDiv));
      }
      calendar.appendChild(dayDiv);
    }

  }

  prevMonthBtn.addEventListener("click", async () => {
    currentMonth -= 1;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    }

    await updateCalendar();
  });

  nextMonthBtn.addEventListener("click", async () => {
    currentMonth += 1;

    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }

    await updateCalendar();
  });

  const dialog = document.getElementById("bookingDialog");
  const openModalBtn = document.getElementById("openBookingDialog");
  const closeDialogBtn = document.getElementById("closeDialog");
  const bookingForm = document.getElementById("bookingForm");
  const selectedBookingDate = document.getElementById("selectedBookingDate");
  const bookingFormFeedback = document.getElementById("bookingFormFeedback");

  const eventTypeField = document.getElementById("name");
  const eventHourField = document.getElementById("eventHour");
  const eventMinuteField = document.getElementById("eventMinute");
  const durationField = document.getElementById("phone");

  function setFormFeedback(type, message, withCheckIcon = false) {
    if (!bookingFormFeedback) {
      return;
    }

    bookingFormFeedback.classList.remove("is-error", "is-success");
    bookingFormFeedback.textContent = "";

    if (!message) {
      return;
    }

    bookingFormFeedback.classList.add(type === "success" ? "is-success" : "is-error");

    if (withCheckIcon) {
      bookingFormFeedback.innerHTML = `<span class="booking-form-feedback-icon" aria-hidden="true">✓</span>${message}`;
      return;
    }

    bookingFormFeedback.textContent = message;
  }

  let scrollTop = 0;

  function disableScroll() {
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    window.onscroll = () => {
      window.scrollTo(0, scrollTop);
    };
  }

  function enableScroll() {
    window.onscroll = null;
  }

  function closeBookingDialog() {
    if (!dialog || !dialog.open) {
      enableScroll();
      return;
    }

    dialog.classList.remove("show");
    dialog.classList.add("hide");

    setTimeout(() => {
      if (dialog.open) {
        dialog.close();
      }
      dialog.classList.remove("hide");
      enableScroll();
    }, 300);
  }

  openModalBtn.addEventListener("click", () => {
    if (!selectedDate) {
      window.alert("Please select a date.");
      return;
    }

    disableScroll();

    selectedBookingDate.textContent = normalizeDate(selectedDate);
    setFormFeedback("error", "");

    dialog.classList.remove("hide", "show");
    dialog.showModal();
    dialog.classList.add("hide");

    setTimeout(() => {
      dialog.classList.remove("hide");
      dialog.classList.add("show");
    }, 10);
  });

  closeDialogBtn.addEventListener("click", closeBookingDialog);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeBookingDialog();
    }
  });

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!selectedDate || !eventTypeField || !eventHourField || !eventMinuteField || !durationField) {
      setFormFeedback("error", "Please complete all required booking details.");
      return;
    }

    const eventType = eventTypeField.value || "";
    const eventHour = eventHourField.value || "";
    const eventMinute = eventMinuteField.value || "";
    const desiredDuration = durationField.value || "";
    const eventTime = eventHour && eventMinute ? `${eventHour}:${eventMinute}` : "";

    if (!eventType || !eventTime || !desiredDuration) {
      setFormFeedback("error", "Please fill all required fields before sending.");
      return;
    }

    setFormFeedback("error", "");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      window.alert("Please log in before sending a booking request.");
      window.location.href = "login.html";
      return;
    }

    const { error } = await supabase.from("booking_inquiries").insert({
      user_id: session.user.id,
      event_type: eventType,
      event_date: normalizeDate(selectedDate),
      event_time: eventTime,
      desired_duration: desiredDuration,
      status: "pending",
    });

    if (error) {
      window.alert(error.message || "Could not save booking request. Please try again.");
      return;
    }

    setFormFeedback("success", "Request sent successfully", true);

    selectedDate = null;

    setTimeout(async () => {
      selectedBookingDate.textContent = "—";
      closeBookingDialog();
      bookingForm.reset();
      setFormFeedback("error", "");
      await updateCalendar();
    }, 900);
  });

  updateCalendar();
})();
