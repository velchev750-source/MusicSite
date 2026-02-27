import { supabase } from "./supabaseClient.js";

function setMessage(text, isError = false) {
  const box = document.getElementById("contact-message-box");
  if (!box) {
    return;
  }

  box.textContent = text;
  box.className = `auth-message ${isError ? "auth-message-error" : "auth-message-success"}`;
}

function isMissingTelephoneColumn(error) {
  if (!error) {
    return false;
  }

  const errorText = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  return errorText.includes("telephone") && errorText.includes("column");
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const telephoneInput = document.getElementById("contact-telephone");
  const messageInput = document.getElementById("contact-message");
  const authHint = document.getElementById("contact-auth-hint");

  if (!(nameInput instanceof HTMLInputElement) || !(emailInput instanceof HTMLInputElement) || !(telephoneInput instanceof HTMLInputElement) || !(messageInput instanceof HTMLTextAreaElement)) {
    return;
  }

  const nameField = nameInput.closest(".col-md-6");
  const emailField = emailInput.closest(".col-md-6");

  let isAuthenticatedUser = false;
  let resolvedName = "";
  let resolvedEmail = "";

  async function syncContactFields() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    isAuthenticatedUser = Boolean(session?.user);

    if (isAuthenticatedUser) {
      const user = session.user;
      resolvedName =
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Authenticated user";
      resolvedEmail = user.user_metadata?.contact_email || user.email || "";

      nameInput.value = resolvedName;
      emailInput.value = resolvedEmail;
      nameInput.required = false;
      emailInput.required = false;
      nameInput.disabled = true;
      emailInput.disabled = true;
      nameField?.classList.add("d-none");
      emailField?.classList.add("d-none");
      if (authHint instanceof HTMLElement) {
        authHint.textContent = `Sending as: ${resolvedName}${resolvedEmail ? ` (${resolvedEmail})` : ""}`;
        authHint.classList.remove("d-none");
      }
      return;
    }

    resolvedName = "";
    resolvedEmail = "";
    nameInput.required = true;
    emailInput.required = true;
    nameInput.disabled = false;
    emailInput.disabled = false;
    nameField?.classList.remove("d-none");
    emailField?.classList.remove("d-none");
    if (authHint instanceof HTMLElement) {
      authHint.textContent = "";
      authHint.classList.add("d-none");
    }
  }

  syncContactFields();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    await syncContactFields();

    const message = messageInput.value.trim();
    const name = isAuthenticatedUser ? resolvedName : nameInput.value.trim();
    const email = isAuthenticatedUser ? resolvedEmail : emailInput.value.trim();
    const telephone = telephoneInput.value.trim();

    if (!message || (!isAuthenticatedUser && (!name || !email))) {
      setMessage("Please fill all fields.", true);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const payloadWithTelephone = {
      user_id: session?.user?.id || null,
      name,
      email,
      telephone: telephone || null,
      message,
    };

    const payloadWithoutTelephone = {
      user_id: session?.user?.id || null,
      name,
      email,
      message,
    };

    let { error } = await supabase.from("contact_messages").insert(payloadWithTelephone);

    if (error && isMissingTelephoneColumn(error)) {
      const retryResult = await supabase.from("contact_messages").insert(payloadWithoutTelephone);
      error = retryResult.error;
    }

    if (error) {
      setMessage("Could not send message right now.", true);
      return;
    }

    setMessage("Message sent successfully.");

    if (isAuthenticatedUser) {
      messageInput.value = "";
    } else {
      form.reset();
    }
  });
});
