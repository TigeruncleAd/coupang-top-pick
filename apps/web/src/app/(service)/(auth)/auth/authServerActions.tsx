'use server'

import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'
import { successServerAction, throwServerAction } from '@repo/utils'
import { prisma } from '@repo/database'
import { getServerUser } from '../../../../../lib/utils/server/getServerUser'

export async function editUser({ name, password }) {
  try {
    const user = await getServerUser()
    const hashedPassword = password ? await hash(password, 10) : undefined
    const edited = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
        password: hashedPassword,
      },
    })
    revalidatePath('mypage')
    return successServerAction('수정되었습니다.')
  } catch (e) {
    console.log(e)
    return throwServerAction('수정에 실패했습니다.')
  }
}

export async function revalidateAction(path) {
  revalidatePath(path)
  return true
}

export async function signUp({ form }) {
  try {
    const { accountId, password, name } = form
    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        accountId,
        name,
        password: hashedPassword,
        status: 'ACTIVE',
      },
    })
    return successServerAction('회원가입에 성공했습니다.')
  } catch (e) {
    return throwServerAction('회원가입에 실패했습니다.')
  }
}

export async function findId({ name, email }) {}

export async function findPw({ accountId, email }) {
  //   const user = await prisma.user.findFirst({
  //     where: {
  //       accountId,
  //       email,
  //     },
  //     select: {
  //       id: true,
  //       meta: true,
  //     },
  //   })
  //   if (!user) {
  //     await new Promise(resolve => setTimeout(resolve, 2000))
  //     return throwServerAction('일치하는 회원 정보가 없습니다.')
  //   }
  //
  //   const pwVerificationCode = Math.floor(Math.random() * 1000000)
  //   const newMeta = { ...(user.meta as any), pwVerificationCode }
  //
  //   const verificationString = `${accountId} ${pwVerificationCode}`
  //   const encodedVerificationString = Buffer.from(verificationString).toString('base64')
  //   const href = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/resetpassword/${encodedVerificationString}`
  //
  //   try {
  //     await sendMail({
  //       to: email,
  //       subject: 'iSTEP 비밀번호 재설정 링크입니다.',
  //       html: `<p>아래 링크를 클릭하여 비밀번호를 재설정해주세요.<br/><a href='${href}'>비밀번호 재설정하기</a></p>`,
  //     })
  //     await prisma.user.update({
  //       where: {
  //         id: user.id,
  //       },
  //       data: {
  //         meta: newMeta,
  //       },
  //     })
  //   } catch (e) {
  //     console.log(e)
  //     return throwServerAction('메일 전송에 실패했습니다.')
  //   }
  //   return { status: 'success' }
  // }
  //
  // export async function checkPassword({ password }) {
  //   const user = await getServerUserFromToken()
  //   const me = await prisma.user.findFirst({
  //     where: {
  //       id: user.id,
  //     },
  //   })
  //
  //   if (!me) return false
  //   const isMatch = await compare(password, me.password)
  //   return isMatch
  // }
  //
  // export async function deleteMe({ password }) {
  //   try {
  //     //wait 500ms
  //     await new Promise(resolve => setTimeout(resolve, 500))
  //     const valid = await checkPassword({ password })
  //     if (!valid) return throwServerAction('비밀번호가 일치하지 않습니다.')
  //     const user = await getServerUser()
  //     await prisma.user.update({
  //       where: {
  //         id: user.id,
  //       },
  //       data: {
  //         status: 'INACTIVE',
  //         meta: {},
  //         phone: '',
  //         hrStudents: {
  //           set: [],
  //         },
  //         hrTeachers: {
  //           set: [],
  //         },
  //         managed: {
  //           set: [],
  //         },
  //         managers: {
  //           set: [],
  //         },
  //       },
  //     })
  //     return successServerAction('회원 탈퇴에 성공했습니다.')
  //   } catch (e) {
  //     console.log(e)
  //     return throwServerAction('회원 탈퇴에 실패했습니다.')
  //   }
}
