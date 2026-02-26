import { supabase } from "./supabaseClient.js";
import { initAuthUi, redirectIfAuthenticated } from "./auth-common.js";
import { identifierToEmail } from "./auth-identifier.js";

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
    const identifier = document.getElementById("login-identifier")?.value.trim() || "";
    const email = identifierToEmail(identifier);
    const password = document.getElementById("login-password")?.value || "";

    if (!identifier || !password) {
      showMessage("Username and password are required.", true);
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    showMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (submitButton) {
      submitButton.disabled = false;
    }

    if (error) {
      const lower = (error.message || "").toLowerCase();
      if (lower.includes("invalid login credentials")) {
        showMessage("Invalid email or password.", true);
      } else if (lower.includes("email not confirmed")) {
        showMessage("Please confirm your email before logging in.", true);
      } else {
        showMessage(error.message, true);
      }
      return;
    }

    window.location.replace("account.html");
  });
});
