import { NextRequest, NextResponse } from 'next/server'
import { updateProductStatus } from '@/serverActions/product/product.action'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, status } = body

    if (!productId || !status) {
      return NextResponse.json({ ok: false, error: 'Missing productId or status' }, { status: 400 })
    }

    if (status !== 'READY' && status !== 'UPLOADED_RAW') {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
    }

    await updateProductStatus(BigInt(productId), status)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating product status:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
