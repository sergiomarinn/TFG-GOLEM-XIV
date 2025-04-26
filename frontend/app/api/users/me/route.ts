import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/app/lib/definitions'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  const res = await fetch(`${process.env.BACKEND_URL}/api/v1/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: res.status })
  }

  const user: User = await res.json()

  return NextResponse.json(user)
}