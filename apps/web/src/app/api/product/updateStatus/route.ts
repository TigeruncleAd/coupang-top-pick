import { NextRequest, NextResponse } from 'next/server'
import { updateProductStatus } from '@/serverActions/product/product.action'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, status, vendorInventoryId } = body

    console.log('[API /updateStatus] 📝 Received request')
    console.log('[API /updateStatus] Body:', body)
    console.log('[API /updateStatus] ProductId:', productId)
    console.log('[API /updateStatus] Status:', status)
    console.log('[API /updateStatus] VendorInventoryId:', vendorInventoryId)
    console.log('[API /updateStatus] VendorInventoryId type:', typeof vendorInventoryId)

    if (!productId || !status) {
      return NextResponse.json({ ok: false, error: 'Missing productId or status' }, { status: 400 })
    }

    if (status !== 'READY' && status !== 'UPLOADED_RAW') {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
    }

    const finalVendorInventoryId = vendorInventoryId ? String(vendorInventoryId) : undefined
    console.log('[API /updateStatus] Final VendorInventoryId to pass:', finalVendorInventoryId)

    await updateProductStatus(BigInt(productId), status, finalVendorInventoryId)

    console.log('[API /updateStatus] ✅ Update successful')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating product status:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
