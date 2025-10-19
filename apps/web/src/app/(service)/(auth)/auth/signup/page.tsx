'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormRender } from '@repo/ui'
import { useServerAction } from '@repo/utils'
import { signUp } from '../authServerActions'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'

export default function SignupForm() {
  const router = useRouter()
  const { execute, isLoading } = useServerAction(signUp, {
    onSuccess: () => {
      const res = signIn(
        'credentials',
        { accountId: form.accountId, password: form.password, redirect: false },
        { type: 'SIGNIN' },
      )
      router.push('/')
    },
    onError: ({ message }) => {
      toast.error(message || '회원가입에 실패하였습니다.')
    },
  })

  const [form, setForm] = useState({
    accountId: '',
    password: '',
    name: '',
  })

  async function handleSubmit(e) {
    execute({ form })
  }
  return <div />
  // return (
  //   <>
  //     <div className="flex flex-1 flex-col justify-center sm:mt-20">
  //       <div className="mx-auto w-full max-w-md px-5 pb-24 pt-14 md:px-12 ">
  //         <div className="mb-8 flex flex-col items-center justify-center gap-2">
  //           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
  //             <path
  //               fillRule="evenodd"
  //               d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
  //               clipRule="evenodd"
  //             />
  //           </svg>
  //
  //           <h1 className="text-base font-black">HENRY UI</h1>
  //         </div>
  //         <div className="text-gray3 mb-16 text-center text-[28px] font-bold leading-tight tracking-tight">
  //           회원 가입
  //         </div>
  //         <div className="mb:rounded-lg bg-white">
  //           <FormRender form={form} setForm={setForm} onSubmit={handleSubmit} className="space-y-6">
  //             <FormRender.Text label={'아이디'} itemKey={'accountId'} placeholder={'아이디를 입력해주세요.'} required />
  //             <FormRender.Text label={'이름'} itemKey={'name'} placeholder={'이름을 입력해주세요.'} required />
  //             <FormRender.Text
  //               label={'비밀번호'}
  //               itemKey={'password'}
  //               type={'password'}
  //               placeholder={'비밀번호를 입력해주세요.'}
  //               required
  //             />
  //             <div className="mt-6">
  //               <button
  //                 type="submit"
  //                 className="w-full rounded-md bg-gray-500 px-3 py-[18px] text-lg font-semibold leading-none text-white hover:opacity-80">
  //                 회원 가입
  //               </button>
  //             </div>
  //           </FormRender>
  //
  //           {/* <div>
  //             관리자 - ID: admin, PW: 1234 <br />
  //             총판 - ID:총판, PW: 1234 <br />
  //             대행사 - ID: 대행사, PW: 1234
  //           </div> */}
  //
  //           {/*<div className="text-grayC mt-5 flex items-center justify-center gap-3 text-sm font-medium leading-tight underline">*/}
  //           {/*  <ModalButton modalContent={<FindId />} type={'button'}>*/}
  //           {/*    아이디 찾기*/}
  //           {/*  </ModalButton>*/}
  //           {/*  <ModalButton modalContent={<FindPw />} type={'button'}>*/}
  //           {/*    비밀번호 찾기*/}
  //           {/*  </ModalButton>*/}
  //           {/*</div>*/}
  //         </div>
  //       </div>
  //     </div>
  //   </>
  // )
}
