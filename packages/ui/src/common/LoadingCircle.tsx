import { AiOutlineLoading } from 'react-icons/ai'

export function LoadingCircle({ size = 64, topMargin = true }) {
  return (
    <div className={`relative ${topMargin ? 'mt-12' : ''} flex h-full w-full items-center justify-center`}>
      {/*<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 duration-100"></div>*/}
      <div className="rounded-full ring-2 ring-blue-500/50">
        <AiOutlineLoading className={'z-50 -m-0.5 animate-spin text-white'} style={{ width: size, height: size }} />
      </div>
    </div>
  )
}
