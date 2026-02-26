import { supabase } from "./supabase-client.js";

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function redirectIfAuthenticated(targetPath = "account.html") {
  const session = await getCurrentSession();
  if (session) {
    window.location.replace(targetPath);
  }
  return session;
}

export async function requireAuthenticatedUser(redirectPath = "index.html") {
  const session = await getCurrentSession();
  if (!session) {
    window.location.replace(redirectPath);
    return null;
  }
  return session;
}

export async function signOutAndRedirect(redirectPath = "index.html") {
  await supabase.auth.signOut();
  window.location.replace(redirectPath);
}

function toggleElements(selector, shouldShow) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    if (shouldShow) {
      element.classList.remove("d-none");
    } else {
      element.classList.add("d-none");
    }
  });
}

function setUserLabels(user) {
  const userLabel = user?.user_metadata?.username || user?.email || "User";
  const elements = document.querySelectorAll("[data-user-email]");
  elements.forEach((element) => {
    element.textContent = userLabel;
  });
}

export async function initAuthUi() {
  const session = await getCurrentSession();
  const isAuthenticated = Boolean(session);

  toggleElements("[data-auth-only]", isAuthenticated);
  toggleElements("[data-guest-only]", !isAuthenticated);
  setUserLabels(session?.user);

  const logoutButtons = document.querySelectorAll("[data-logout]");
  logoutButtons.forEach((button) => {
    if (button.dataset.logoutBound === "true") {
      return;
    }

    button.dataset.logoutBound = "true";
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      await signOutAndRedirect("index.html");
    });
  });
}
