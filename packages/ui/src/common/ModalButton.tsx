'use client'
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

export function ModalButton({
  children,
  modalContent,
  modalClassName,
  defaultCloseButton = true,
  closeRef,
  ...props
}: {
  children: React.ReactNode
  modalContent: any
  modalClassName?: string
  defaultCloseButton?: boolean
  closeRef?: React.MutableRefObject<(() => void) | undefined>
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isOpen, setIsOpen] = useState(false)
  if (closeRef) closeRef.current = () => setIsOpen(false)
  const defaultModalClassName =
    'w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-4 sm:p-6 text-left shadow-xl transition-all relative'

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ui-ease-out ui-duration-300"
            enterFrom="ui-opacity-0"
            enterTo="ui-ui-opacity-100"
            leave="ui-ease-in duration-200"
            leaveFrom="ui-opacity-100"
            leaveTo="ui-opacity-0">
            <div className="ui-fixed ui-inset-0 ui-bg-black ui-bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center text-center sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95">
                <Dialog.Panel className={modalClassName ?? defaultModalClassName}>
                  {defaultCloseButton && (
                    <button onClick={() => setIsOpen(false)} className="absolute right-3 top-3 z-50">
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {modalContent}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <button onClick={() => setIsOpen(true)} type={'button'} {...props}>
        {children}
      </button>
    </>
  )
}
