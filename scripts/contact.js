import { supabase } from "./supabaseClient.js";

function setMessage(text, isError = false) {
  const box = document.getElementById("contact-message-box");
  if (!box) {
    return;
  }

  box.textContent = text;
  box.className = `auth-message ${isError ? "auth-message-error" : "auth-message-success"}`;
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("contact-name")?.value.trim() || "";
    const email = document.getElementById("contact-email")?.value.trim() || "";
    const message = document.getElementById("contact-message")?.value.trim() || "";

    if (!name || !email || !message) {
      setMessage("Please fill all fields.", true);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.from("contact_messages").insert({
      user_id: session?.user?.id || null,
      name,
      email,
      message,
    });

    if (error) {
      setMessage("Could not send message right now.", true);
      return;
    }

    setMessage("Message sent successfully.");
    form.reset();
  });
});
