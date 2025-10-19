import { IoMdInformationCircleOutline } from 'react-icons/io'

//display info when hover
export default function InfoIcon({ info }) {
  return (
    <div className="group relative w-fit">
      <div className="w-fit">
        <div className="text-gray-400">
          <IoMdInformationCircleOutline className="h-4 w-4" />
        </div>
        <div className="absolute -top-3 left-5 hidden h-fit w-96 rounded-md bg-black px-2 py-2 opacity-80 transition-opacity duration-300 group-hover:block">
          <div className="w-full min-w-fit whitespace-pre-wrap text-sm text-white">{info}</div>
        </div>
      </div>
    </div>
  )
}
