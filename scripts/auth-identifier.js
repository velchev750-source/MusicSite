export function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "");
}

export function usernameToAuthEmail(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return "";
  }

  return `${normalized}@arteplus.local`;
}

export function identifierToEmail(identifier) {
  const raw = String(identifier || "").trim();
  if (!raw) {
    return "";
  }

  if (raw.includes("@")) {
    return raw.toLowerCase();
  }

  return usernameToAuthEmail(raw);
}
