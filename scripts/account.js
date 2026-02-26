import { initAuthUi, requireAuthenticatedUser, signOutAndRedirect } from "./auth-common.js";

window.addEventListener("DOMContentLoaded", async () => {
  await initAuthUi();

  const session = await requireAuthenticatedUser("index.html");
  if (!session) {
    return;
  }

  const emailElement = document.getElementById("account-email");
  const usernameElement = document.getElementById("account-username");

  if (emailElement) {
    emailElement.textContent = session.user.email || "-";
  }

  if (usernameElement) {
    usernameElement.textContent = session.user.user_metadata?.username || "-";
  }

  const logoutButton = document.getElementById("account-logout");
  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async () => {
    await signOutAndRedirect("index.html");
  });
});
