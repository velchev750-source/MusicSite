import { supabase } from "./supabase-client.js";
import { initAuthUi, redirectIfAuthenticated } from "./auth-common.js";

function showMessage(message, isError = false) {
  const messageBox = document.getElementById("signup-message");
  if (!messageBox) {
    return;
  }

  messageBox.textContent = message;
  messageBox.className = `auth-message ${isError ? "auth-message-error" : "auth-message-success"}`;
}

window.addEventListener("DOMContentLoaded", async () => {
  await initAuthUi();
  await redirectIfAuthenticated("account.html");

  const form = document.getElementById("signup-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const username = document.getElementById("signup-username")?.value.trim() || "";
    const password = document.getElementById("signup-password")?.value || "";
    const email = document.getElementById("signup-email")?.value.trim() || "";
    const telephone = document.getElementById("signup-phone")?.value.trim() || "";

    if (submitButton) {
      submitButton.disabled = true;
    }

    showMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          telephone: telephone || null,
        },
      },
    });

    if (submitButton) {
      submitButton.disabled = false;
    }

    if (error) {
      showMessage(error.message, true);
      return;
    }

    if (data.session) {
      window.location.replace("account.html");
      return;
    }

    showMessage("Sign up successful. Please check your email to confirm your account.");
  });
});
