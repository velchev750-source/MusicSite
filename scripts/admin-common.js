import { supabase } from "./supabaseClient.js";
import { initAuthUi, requireAuthenticatedUser } from "./auth-common.js";

export async function requireAdmin() {
  await initAuthUi();

  const session = await requireAuthenticatedUser("index.html");
  if (!session) {
    return null;
  }

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !data) {
    window.location.replace("account.html");
    return null;
  }

  return session;
}

export function showAdminMessage(elementId, text, isError = false) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }

  element.textContent = text;
  element.classList.toggle("admin-message-error", isError);
}
