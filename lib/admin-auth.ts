export function checkAdmin(password: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && password === expected;
}
