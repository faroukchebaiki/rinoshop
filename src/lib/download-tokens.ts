import crypto from 'node:crypto'

type DownloadTokenPayload = {
  userId: string
  productId: string
  exp: number
}

const getSecret = () =>
  process.env.DOWNLOAD_TOKEN_SECRET || null

const encode = (value: string) =>
  Buffer.from(value, 'utf8').toString('base64url')

const decode = (value: string) =>
  Buffer.from(value, 'base64url').toString('utf8')

const signPayload = (payload: string, secret: string) =>
  crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')

export const createDownloadToken = ({
  userId,
  productId,
  expiresInSeconds = 60 * 60 * 2,
}: {
  userId: string
  productId: string
  expiresInSeconds?: number
}) => {
  const secret = getSecret()
  if (!secret) return null

  const payload: DownloadTokenPayload = {
    userId,
    productId,
    exp: Date.now() + expiresInSeconds * 1000,
  }

  const payloadString = JSON.stringify(payload)
  const signature = signPayload(payloadString, secret)

  return `${encode(payloadString)}.${signature}`
}

export const verifyDownloadToken = (token: string) => {
  const secret = getSecret()
  if (!secret) return null

  const [payloadPart, signature] = token.split('.')

  if (!payloadPart || !signature) return null

  const payloadString = decode(payloadPart)
  const expectedSignature = signPayload(payloadString, secret)

  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(payloadString) as DownloadTokenPayload

    if (!payload?.productId || !payload?.userId) {
      return null
    }

    if (Date.now() > payload.exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
