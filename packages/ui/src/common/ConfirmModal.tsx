'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

export function ConfirmModal({ handleConfirm, isOpen, handleClose, description, title }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div
            className="fixed inset-0"
            style={{
              background: 'black',
              opacity: '25%',
            }}
          />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95">
              <Dialog.Panel
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                style={{
                  padding: '16px',
                }}>
                <Dialog.Title as="h3" className="text-center text-lg font-semibold leading-6">
                  {title || '확인해 주세요'}
                </Dialog.Title>
                <Dialog.Description className="mt-2 whitespace-pre-wrap text-center text-sm">
                  {description}
                </Dialog.Description>
                <div className="mt-6 flex w-full gap-4">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-indigo-500 px-8 py-2 text-sm font-medium text-white opacity-80 hover:opacity-100"
                    onClick={handleConfirm}>
                    확인
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-zinc-500 px-8 py-2 text-sm font-medium text-white opacity-80 hover:opacity-100"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                    }}
                    onClick={handleClose}>
                    취소
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
