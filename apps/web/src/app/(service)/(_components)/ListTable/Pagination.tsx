'use client'

import cx from 'clsx'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const TRUNCATE_SIZE = 2

export default function Pagination({ size, totalCount }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const page = parseInt(searchParams?.get('page') ?? '1')
  const maxPage = Math.floor((totalCount - 1) / size) + 1
  const truncateArray = [...Array(TRUNCATE_SIZE)].map((v, i) => i)

  const middleArray = [...Array(TRUNCATE_SIZE * 2 + 1)].map((v, i) => page + i - TRUNCATE_SIZE)

  const isLowPageTruncated = page > TRUNCATE_SIZE * 2 + 1
  const isHighPageTruncated = page < maxPage - TRUNCATE_SIZE * 2

  const isPrevDisabled = page <= 1
  const isNextDisabled = page >= maxPage

  function handleSetPage(newPage: number) {
    if (!searchParams) return

    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 lg:px-8">
      {/* <div className="flex flex-1 justify-between md:hidden">
        <a
          href="#"
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Previous
        </a>
        <a
          href="#"
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Next
        </a>
      </div> */}
      <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            총 <span className="font-medium">{totalCount}</span> 개의 항목이 있습니다.
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => {
                if (isPrevDisabled) return

                handleSetPage(page - 1)
              }}
              className={cx(
                { 'opacity-25': isPrevDisabled },
                'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
              )}>
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* Current: "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600", Default: "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0" */}
            {truncateArray.map((v, i) => {
              const basePage = 1
              const currentPage = basePage + i

              if (currentPage > maxPage) return null

              return (
                <button
                  key={i}
                  onClick={() => handleSetPage(currentPage)}
                  aria-current="page"
                  className={cx({
                    'relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600':
                      currentPage === page,
                    'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0':
                      currentPage !== page,
                  })}>
                  {currentPage}
                </button>
              )
            })}
            {isLowPageTruncated && (
              <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                ...
              </button>
            )}
            {middleArray.map((v, i) => {
              if (v < TRUNCATE_SIZE + 1 || v > maxPage - TRUNCATE_SIZE) return null
              return (
                <button
                  key={i}
                  onClick={() => handleSetPage(v)}
                  aria-current="page"
                  className={cx({
                    'relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600':
                      v === page,
                    'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0':
                      v !== page,
                  })}>
                  {v}
                </button>
              )
            })}
            {isHighPageTruncated && (
              <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                ...
              </button>
            )}
            {truncateArray.map((v, i) => {
              const basePage = maxPage + 1 - TRUNCATE_SIZE
              const currentPage = basePage + i

              if (currentPage <= TRUNCATE_SIZE) return null

              return (
                <button
                  key={i}
                  onClick={() => handleSetPage(currentPage)}
                  aria-current="page"
                  className={cx({
                    'relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600':
                      currentPage === page,
                    'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0':
                      currentPage !== page,
                  })}>
                  {currentPage}
                </button>
              )
            })}
            <button
              onClick={() => {
                if (isNextDisabled) return

                handleSetPage(page + 1)
              }}
              className={cx(
                { 'opacity-25': isNextDisabled },
                'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
              )}>
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
