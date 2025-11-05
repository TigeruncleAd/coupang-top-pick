import { hash } from 'bcryptjs'
import { prisma } from '@repo/database'

async function updatePassword() {
  try {
    const accountId = '1'
    const newPassword = 'qwqw1212!!'
    
    console.log(`[update-password] Updating password for accountId: ${accountId}`)
    
    // 패스워드 해싱
    const hashedPassword = await hash(newPassword, 10)
    console.log(`[update-password] Password hashed successfully`)
    
    // 사용자 업데이트
    const updatedUser = await prisma.user.update({
      where: {
        accountId: accountId,
      },
      data: {
        password: hashedPassword,
      },
    })
    
    console.log(`[update-password] ✅ Password updated successfully for accountId: ${accountId}`)
    console.log(`[update-password] User ID: ${updatedUser.id}`)
    console.log(`[update-password] User Name: ${updatedUser.name}`)
    
    // Prisma 클라이언트 종료
    await prisma.$disconnect()
  } catch (error) {
    console.error(`[update-password] ❌ Error updating password:`, error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

updatePassword()

