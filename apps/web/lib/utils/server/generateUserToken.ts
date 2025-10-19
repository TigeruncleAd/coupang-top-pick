import jwt from 'jsonwebtoken'

export async function generateUserToken({ userId }) {
  if (!userId) return null
  const token = jwt.sign({ id: userId.toString() }, process.env.NEXTAUTH_SECRET, {
    expiresIn: '1d',
  })
  return token
}
