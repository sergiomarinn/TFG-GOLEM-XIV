import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const body = await req.json()

	const formBody = new URLSearchParams()
	formBody.append('grant_type', 'password')
	formBody.append('username', body.username)
	formBody.append('password', body.password)

	const res = await fetch(`${process.env.BACKEND_URL}/api/v1/login/access-token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
		},
		body: formBody.toString(),
	})

	if (!res.ok) {
		return NextResponse.json({ error: 'Invalid credentials' }, { status: res.status })
	}

	const data = await res.json()
	return NextResponse.json(data)
}