import { AiOutlineLoading } from 'react-icons/ai'
import { Button } from '../catalyst/button'

export function ActionButton({
  children,
  onClick,
  className = '',
  isLoading,
  disabled = false,
  color = 'dark',
  ...props
}: any) {
  const buttonDisabled = isLoading || disabled

  return (
    <Button {...{ onClick, className, disabled: buttonDisabled, color, ...props }}>
      {isLoading ? <LoadingCircle /> : children}
    </Button>
  )

  // return (
  //   <button {...{ onClick: onClick, className: className, disabled: buttonDisabled, ...props }}>
  //     {isLoading ? <LoadingCircle /> : children}
  //   </button>
  // )
}

function LoadingCircle({ size, color }: { size?: number; color?: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/*<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 duration-100"></div>*/}
      <div className={`rounded-full ring-2 ring-${color ?? 'zinc-500/50'}`}>
        <AiOutlineLoading className={`z-50 -m-0.5 h-full animate-spin text-white`} />
      </div>
    </div>
  )
}
