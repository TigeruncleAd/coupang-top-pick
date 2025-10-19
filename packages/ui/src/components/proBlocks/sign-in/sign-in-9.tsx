'use client'

import { Logo } from '@repo/ui/components/proBlocks/logo'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import Link from 'next/link'

export function SignIn9() {
  return (
    <div className="bg-background min-h-screen gap-x-6 md:p-16">
      {/* Content wrapper */}
      <div className="items-top flex w-full justify-center">
        {/* Sign-in form container */}
        <div className="w-full max-w-sm px-6 py-16 md:p-0 ">
          {/* Logo and header section */}
          <div className="mb-6 flex flex-col items-center space-y-6">
            <Logo className="h-8 w-8" />
            <div className="flex flex-col gap-y-3 text-center">
              <h1 className="text-2xl font-bold md:text-3xl">Sign in</h1>
              <p className="text-muted-foreground text-sm">
                Log in to unlock tailored content and stay connected with your community.
              </p>
            </div>
          </div>
          {/* Input fields section */}
          <div className="mb-6 space-y-4">
            <div className="space-y-2">
              <Input id="email" placeholder="Email or username" type="email" />
              <Input id="password" placeholder="Password" type="password" />
            </div>
          </div>
          {/* Sign-in button and sign-up link section */}
          <div className="flex flex-col space-y-6">
            <Button className="w-full">Sign in</Button>
            {/* Forgot password link */}
            <div className="flex justify-center">
              <Link className="text-muted-foreground hover:text-foreground text-sm underline" href="#">
                Forgot password?
              </Link>
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Don't have an account?{' '}
              <Link className="text-foreground underline" href="#">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
