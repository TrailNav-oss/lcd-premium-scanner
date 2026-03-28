import { NextRequest, NextResponse } from 'next/server'
import { fetchDVFForZone } from '@/lib/dvf/client'

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get('zone')

  if (!zone) {
    return NextResponse.json({ error: 'Missing zone parameter' }, { status: 400 })
  }

  const transactions = await fetchDVFForZone(zone)

  const avgPrixM2 = transactions.length > 0
    ? Math.round(transactions.reduce((s, t) => s + t.prix_m2, 0) / transactions.length)
    : null

  return NextResponse.json({
    zone,
    count: transactions.length,
    avgPrixM2,
    transactions,
  })
}
