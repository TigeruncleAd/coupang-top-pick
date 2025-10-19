import { NextResponse } from 'next/server'

export async function GET() {
  //get version from package.json 123
  return NextResponse.json({ version: '1.0.1' })
}
