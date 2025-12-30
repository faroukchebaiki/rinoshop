const baseUrl =
  process.env.NEON_AUTH_URL ??
  process.env.NEON_AUTH_BASE_URL

if (baseUrl) {
  if (!process.env.NEON_AUTH_URL) {
    process.env.NEON_AUTH_URL = baseUrl
  }

  if (!process.env.NEON_AUTH_BASE_URL) {
    process.env.NEON_AUTH_BASE_URL = baseUrl
  }
}
