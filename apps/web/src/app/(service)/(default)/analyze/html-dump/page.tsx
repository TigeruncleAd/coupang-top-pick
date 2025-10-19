'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import { CheckCircle } from 'lucide-react'
import NaverBestDumper from './(_components)/NaverBestDumper'

export default function HTMLDumpPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">네이버 베스트 키워드 덤프</h1>
            <p className="text-muted-foreground mt-2">
              네이버 쇼핑 베스트 키워드 페이지의 HTML을 덤프하여 키워드 데이터를 수집합니다.
            </p>
          </div>
        </div>

        {/* 네이버 베스트 키워드 덤프 섹션 */}
        <NaverBestDumper />

        {/* 사용법 안내 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">사용법</h4>
                <ul className="mt-1 space-y-1 text-sm text-blue-800">
                  <li>• 네이버 베스트 키워드 덤프: 네이버 쇼핑 베스트 키워드 페이지를 덤프합니다</li>
                  <li>• 전체 및 카테고리별 키워드 데이터를 수집할 수 있습니다</li>
                  <li>• 덤프된 HTML 파일은 debug-html 폴더에 저장됩니다</li>
                  <li>• 수집된 키워드 데이터는 DB에 저장되어 분석에 활용됩니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
