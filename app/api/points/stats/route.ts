import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getPointsBalance, getStreakInfo } from '@/lib/services/points-service'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const [balance, streakInfo] = await Promise.all([
      getPointsBalance(session.user.id),
      getStreakInfo(session.user.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        balance,
        streak: streakInfo,
      },
    })
  } catch (error) {
    console.error('Error fetching points stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points stats' },
      { status: 500 }
    )
  }
}
