import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const res = await fetch(`${process.env.BACKEND_URL}/api/v1/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Error signing up' }, { status: res.status })
  }
}