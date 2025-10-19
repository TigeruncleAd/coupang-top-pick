'use client'

import DashboardUserProfile from './DashboardUserProfile'
import DashboardNotice from './DashboardNotice'
import DashboardSellerCenters from './DashboardSellerCenters'
// import DashboardProduct from './DashboardProduct'

export default function Dashboard() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DashboardUserProfile />
        </div>
        <div className="lg:col-span-2">
          <DashboardNotice />
        </div>
      </div>
      <div className="w-full">
        <DashboardSellerCenters />
      </div>
      {/* <DashboardProduct /> */}
    </div>
  )
}
