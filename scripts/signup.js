import { supabase } from "./supabaseClient.js";
import { initAuthUi, redirectIfAuthenticated } from "./auth-common.js";
import { normalizeUsername, usernameToAuthEmail } from "./auth-identifier.js";

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
    const usernameRaw = document.getElementById("signup-username")?.value.trim() || "";
    const password = document.getElementById("signup-password")?.value || "";
    const username = normalizeUsername(usernameRaw);
    const email = usernameToAuthEmail(usernameRaw);

    if (!username || !password) {
      showMessage("Username and password are required.", true);
      return;
    }

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
        },
      },
    });

    if (submitButton) {
      submitButton.disabled = false;
    }

    if (error) {
      if ((error.message || "").toLowerCase().includes("already registered")) {
        showMessage("This username is already taken.", true);
        return;
      }
      showMessage(error.message, true);
      return;
    }

    if (data.session) {
      window.location.replace("account.html");
      return;
    }

    showMessage("Sign up successful. You can now log in with your username and password.");
  });
});
