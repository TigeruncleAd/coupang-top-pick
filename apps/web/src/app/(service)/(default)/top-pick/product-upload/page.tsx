import PageTitle from '../../(_components)/PageTitle'
import { getExtensionId } from '@/serverActions/extension/extension.action'
import Client from './view'

export default async function ProductUploadPage() {
  const extensionId = await getExtensionId()
  return (
    <div className="w-full">
      <PageTitle title="상품 업로드" />
      <Client extensionId={extensionId ?? ''} />
    </div>
  )
}
