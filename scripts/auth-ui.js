import { initAuthUi } from "./auth-common.js";

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await initAuthUi();
  } catch (error) {
    console.error("Auth UI initialization failed:", error);
  }
});
