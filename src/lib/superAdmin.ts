/** El super admin es el email de SUPER_ADMIN_EMAIL (solo servidor). Sin la variable, no hay super admin. */
export function esSuperAdmin(email: unknown): boolean {
  const admin = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(admin) && typeof email === "string" && email.trim().toLowerCase() === admin;
}

export function rutaSuperAdmin(pathname: string): boolean {
  return ["/admin", "/api/admin"].some((r) => pathname === r || pathname.startsWith(`${r}/`));
}
