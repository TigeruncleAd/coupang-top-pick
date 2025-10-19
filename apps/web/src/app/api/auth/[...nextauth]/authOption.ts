import { NextAuthOptions } from 'next-auth'

import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@repo/database'
import { compare } from 'bcryptjs'
import { kdayjs } from '@repo/utils'
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        accountId: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials) throw Error('NO_CREDENTIALS')
        const { accountId, password } = credentials ?? {}

        const user = await prisma.user.findUnique({
          where: {
            accountId: accountId,
          },
        })
        if (!user) throw Error('USER_NOT_FOUND')
        if (user.status === 'INACTIVE') throw Error('INACTIVE_USER')
        // if (kdayjs(user.expiredAt).isBefore(kdayjs().toDate())) throw Error('EXPIRED_USER')
        // if (user.status === USER_STATUS.INACTIVE) throw Error('INACTIVE_USER')

        const isPasswordValid = await compare(password, user.password)
        if (!isPasswordValid) {
          throw Error('INVALID_PASSWORD')
        }

        // await revalidateServerAction('/')

        return {
          id: user.id.toString(),
          name: user.name,
          role: user.role,
          // status: user.status,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      if (account?.provider === 'credentials') {
        return {
          ...token,
          id: user.id.toString(),
          name: (user as any).name,
          role: (user as any).role,
          // status: (user as any).status,
        }
      }

      return token
    },
    async session({ session, token }) {
      const { role, id, status } = token
      return {
        ...session,
        user: {
          ...session.user,
          role,
          id,
          // status,
        },
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: '/auth/signin',
  },
}
