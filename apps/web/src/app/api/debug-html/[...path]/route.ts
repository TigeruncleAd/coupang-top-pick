import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params
  try {
    const filePath = params.path.join('/')
    const fullPath = join(process.cwd(), 'debug-html', filePath)

    // 보안을 위해 debug-html 폴더 내의 파일만 접근 가능하도록 제한
    const debugHtmlPath = join(process.cwd(), 'debug-html')
    if (!fullPath.startsWith(debugHtmlPath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const fileContent = await readFile(fullPath, 'utf-8')

    // 파일 확장자에 따라 적절한 Content-Type 설정
    const extension = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'text/plain'

    if (extension === 'html') {
      contentType = 'text/html; charset=utf-8'
    } else if (extension === 'json') {
      contentType = 'application/json; charset=utf-8'
    }

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('파일 읽기 실패:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
