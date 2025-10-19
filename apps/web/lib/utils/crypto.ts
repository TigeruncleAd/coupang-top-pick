import * as ServerCrypto from 'crypto'

export async function decryptAesGcmBase64(payloadBase64: string, secret: string): Promise<string> {
  if (!payloadBase64) {
    return ''
  }
  const payload = base64ToUint8Array(payloadBase64)
  const iv = payload.slice(0, 12)
  const tag = payload.slice(12, 28) // 16 bytes
  const cipher = payload.slice(28)
  // SubtleCrypto expects tag appended to the end of ciphertext
  const cipherWithTag = new Uint8Array(cipher.length + tag.length)
  cipherWithTag.set(cipher, 0)
  cipherWithTag.set(tag, cipher.length)

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(secret))
  const cryptoKey = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['decrypt'])

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, cryptoKey, cipherWithTag)
  const dec = new TextDecoder()
  return dec.decode(decrypted)
}

// Helper: base64 decode to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// Add AES-256-GCM encryption helper so the client can decrypt with the shared secret
export function encryptTextWithAesGcm(plainText: string, secret: string) {
  if (!plainText) {
    return ''
  }
  const ENCRYPTION_KEY_BUFFER = ServerCrypto.createHash('sha256').update(secret).digest()
  const iv = ServerCrypto.randomBytes(12)
  const key = ENCRYPTION_KEY_BUFFER
  if (!key) {
    throw new Error('Encryption key is missing')
  }
  const cipher = ServerCrypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // payload layout: [iv(12)][tag(16)][ciphertext]
  const payload = Buffer.concat([iv, authTag, encrypted]).toString('base64')
  return payload
}
