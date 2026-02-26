import { supabase } from "./supabase-client.js";
import { initAuthUi, redirectIfAuthenticated } from "./auth-common.js";

function showMessage(message, isError = false) {
  const messageBox = document.getElementById("login-message");
  if (!messageBox) {
    return;
  }

  messageBox.textContent = message;
  messageBox.className = `auth-message ${isError ? "auth-message-error" : "auth-message-success"}`;
}

window.addEventListener("DOMContentLoaded", async () => {
  await initAuthUi();
  await redirectIfAuthenticated("account.html");

  const form = document.getElementById("login-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const username = document.getElementById("login-username")?.value.trim() || "";
    const password = document.getElementById("login-password")?.value || "";

    if (submitButton) {
      submitButton.disabled = true;
    }

    showMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (submitButton) {
      submitButton.disabled = false;
    }

    if (error) {
      showMessage(error.message, true);
      return;
    }

    window.location.replace("account.html");
  });
});
