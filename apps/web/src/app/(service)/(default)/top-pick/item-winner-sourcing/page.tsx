import PageTitle from '../../(_components)/PageTitle'
import { getExtensionId } from '@/serverActions/extension/extension.action'
import Client from './view'

export default async function ItemWinnerSourcingPage() {
  const extensionId = await getExtensionId()
  return (
    <div className="w-full">
      <PageTitle title="아이템 위너 소싱" />
      <Client extensionId={extensionId ?? ''} />
    </div>
  )
}
