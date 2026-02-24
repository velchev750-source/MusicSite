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

  function addDaysUtc(date, days) {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
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

  const occupiedDates = [
    normalizeDate(addDaysUtc(today, 5)),
    normalizeDate(addDaysUtc(today, 12)),
    normalizeDate(addDaysUtc(today, 23)),
  ];

  function handleDateSelection(dayDiv) {
    const pickedDate = new Date(`${dayDiv.dataset.date}T00:00:00Z`);
    if (occupiedDates.includes(normalizeDate(pickedDate))) {
      window.alert("This date is already booked.");
      return;
    }

    selectedDate = pickedDate;
    updateCalendar();
  }

  function updateCalendar() {
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

      if (dayDate < today) {
        dayDiv.classList.add("disabled");
      }

      if (occupiedDates.includes(dateStr)) {
        dayDiv.classList.add("full", "disabled");
      }

      if (selectedDate && normalizeDate(selectedDate) === dateStr) {
        dayDiv.classList.add("selected");
      }

      if (selectedDate && dayDate < today) {
        dayDiv.classList.add("disabled");
      }

      dayDiv.addEventListener("click", () => handleDateSelection(dayDiv));
      calendar.appendChild(dayDiv);
    }

  }

  prevMonthBtn.addEventListener("click", () => {
    currentMonth -= 1;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    }

    updateCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth += 1;

    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }

    updateCalendar();
  });

  const dialog = document.getElementById("bookingDialog");
  const openModalBtn = document.getElementById("openBookingDialog");
  const closeDialogBtn = document.getElementById("closeDialog");
  const bookingForm = document.getElementById("bookingForm");
  const selectedBookingDate = document.getElementById("selectedBookingDate");

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

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!selectedDate) {
      return;
    }

    occupiedDates.push(normalizeDate(selectedDate));
    selectedDate = null;
    selectedBookingDate.textContent = "—";

    closeBookingDialog();
    bookingForm.reset();
    updateCalendar();
  });

  updateCalendar();
})();
