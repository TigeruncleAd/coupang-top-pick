'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Store } from 'lucide-react'

const sellerCenters = [
  {
    title: '네이버 스마트스토어',
    link: 'https://sell.smartstore.naver.com/#/home/about',
    image: 'https://cdn.heyseller.kr/assets/images/market/icons/smartstore.png',
  },
  {
    title: '쿠팡',
    link: 'https://wing.coupang.com',
    image: 'https://cdn.heyseller.kr/assets/images/market/icons/coupang.png',
  },
  {
    title: '지마켓',
    link: 'https://www.esmplus.com/Member/SignIn/LogOn',
    image: 'https://cdn.heyseller.kr/assets/images/market/icons/gmarket.png',
  },
  {
    title: '옥션',
    link: 'https://www.esmplus.com/Member/SignIn/LogOn',
    image: 'https://cdn.heyseller.kr/assets/images/market/icons/auction.png',
  },
  {
    title: '11번가',
    link: 'https://login.11st.co.kr/auth/front/selleroffice/logincheck.tmall',
    image: 'https://cdn.heyseller.kr/assets/images/market/icons/st11.png',
  },
  // {
  //   title: '인터파크',
  //   link: 'https://seller.interpark.com/login',
  //   image: 'https://cdn.heyseller.kr/assets/images/market/icons/interpark.png',
  // },
  // {
  //   title: '롯데ON',
  //   link: 'https://store.lotteon.com/cm/main/login_SO.wsp',
  //   image: 'https://cdn.heyseller.kr/assets/images/market/icons/lotte_on_1.png',
  // },
]

{
  /* <div><a class="yvll7l1" href="https://sell.smartstore.naver.com/#/home/about" target="_blank" rel="noreferrer noopener"><div class="yvll7l3 yvll7l5"><img alt="" loading="lazy" decoding="async" data-nimg="fill" src="https://cdn.heyseller.kr/assets/images/market/icons/smartstore.png" style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: contain; color: transparent;"></div></a><a class="yvll7l1" href="https://login.11st.co.kr/auth/front/selleroffice/logincheck.tmall" target="_blank" rel="noreferrer noopener"><div class="yvll7l3 yvll7l4"><img alt="" loading="lazy" decoding="async" data-nimg="fill" src="https://cdn.heyseller.kr/assets/images/market/icons/st11.png" style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: contain; color: transparent;"></div></a><a class="yvll7l1" href="https://wing.coupang.com" target="_blank" rel="noreferrer noopener"><div class="yvll7l3 yvll7l4"><img alt="" loading="lazy" decoding="async" data-nimg="fill" src="https://cdn.heyseller.kr/assets/images/market/icons/coupang.png" style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: contain; color: transparent;"></div></a><a class="yvll7l1" href="https://www.esmplus.com/Member/SignIn/LogOn" target="_blank" rel="noreferrer noopener"><div class="yvll7l3 yvll7l4"><img alt="" loading="lazy" decoding="async" data-nimg="fill" src="https://cdn.heyseller.kr/assets/images/market/icons/gmarket.png" style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: contain; color: transparent;"></div></a><a class="yvll7l1" href="https://www.esmplus.com/Member/SignIn/LogOn" target="_blank" rel="noreferrer noopener"><div class="yvll7l3 yvll7l4"><img alt="" loading="lazy" decoding="async" data-nimg="fill" src="https://cdn.heyseller.kr/assets/images/market/icons/auction.png" style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: contain; color: transparent;"></div></a><a class="yvll7l1" href="https://seller.interpark.com/login" target="_blank" rel="noreferrer noopener"><div class="yvll7l3 yvll7l5"><img alt="" loading="lazy" decoding="async" data-nimg="fill" src="https://cdn.heyseller.kr/assets/images/market/icons/interpark.png" style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: contain; color: transparent;"></div></a><a class="yvll7l1" href="https://store.lotteon.com/cm/main/login_SO.wsp" target="_blank" rel="noreferrer noopener"><span class="yvll7l2">Beta</span><div class="yvll7l3 yvll7l4"><img alt="" loading="lazy" decoding="async" data-nimg="fill" src="https://cdn.heyseller.kr/assets/images/market/icons/lotte_on_1.png" style="position: absolute; height: 100%; width: 100%; inset: 0px; object-fit: contain; color: transparent;"></div></a></div> */
}

export default function DashboardSellerCenters() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          판매자 센터 바로가기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {sellerCenters.map((center, index) => (
            <Button key={index} variant="outline" size="icon" className="h-16 w-16 p-0" asChild>
              <a href={center.link} target="_blank" rel="noopener noreferrer" title={center.title}>
                <img src={center.image} alt={center.title} className="h-10 w-10 object-contain" loading="lazy" />
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
