import PageTitle from '../../(_components)/PageTitle'
import SettingsView from './SettingsView'
// async function getMe() {
//   const me = await getServerUser()
//   if (me.license !== 'S') return notFound()
//   const marketSetting = await prisma.marketSetting.findUnique({
//     where: {
//       userId: me.id,
//     },
//   })
//   return {
//     ...me,
//     marketSetting: marketSetting ?? ({} as MarketSetting),
//   }
// }

export default async function MyPage() {
  // const me = await getMe()
  return (
    <div className="w-full">
      <PageTitle title="설정" />
      <SettingsView />
      {/* <MyPageView me={me} /> */}
    </div>
  )
}
