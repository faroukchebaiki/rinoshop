import './neon-env'

const assertUrl = (
  value: string | undefined,
  name: string
) => {
  if (!value) {
    throw new Error(`${name} is missing`)
  }

  try {
    new URL(value)
  } catch {
    throw new Error(`Invalid ${name}: "${value}"`)
  }

  return value
}

export const getNeonAuthConfig = () => {
  const baseUrl = assertUrl(
    process.env.NEON_AUTH_URL,
    'NEON_AUTH_URL'
  )
  const jwksUrl = assertUrl(
    process.env.NEON_AUTH_JWKS_URL,
    'NEON_AUTH_JWKS_URL'
  )

  return { baseUrl, jwksUrl }
}
