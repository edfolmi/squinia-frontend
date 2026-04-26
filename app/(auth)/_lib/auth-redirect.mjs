export function loginRedirectPath(currentPath) {
  const current = String(currentPath || "");
  if (!current || current === "/login" || current.startsWith("/login?")) return "/login";
  return `/login?next=${encodeURIComponent(current)}`;
}
