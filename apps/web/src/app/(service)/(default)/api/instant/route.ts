import { hash } from 'bcryptjs'
import { prisma } from '@repo/database'

export async function GET(request: Request) {
  try {
    const accountId = '1'
    const newPassword = 'qwqw1212!!'

    console.log(`[instant/route] Updating password for accountId: ${accountId}`)

    // 패스워드 해싱
    const hashedPassword = await hash(newPassword, 10)
    console.log(`[instant/route] Password hashed successfully`)

    // 사용자 업데이트
    const updatedUser = await prisma.user.update({
      where: {
        id: BigInt(1),
      },
      data: {
        password: hashedPassword,
      },
    })

    console.log(`[instant/route] ✅ Password updated successfully for accountId: ${accountId}`)

    return Response.json({
      success: true,
      message: 'Password updated successfully',
      accountId: updatedUser.accountId,
      userId: updatedUser.id.toString(),
      userName: updatedUser.name,
    })
  } catch (error) {
    console.error(`[instant/route] ❌ Error updating password:`, error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
