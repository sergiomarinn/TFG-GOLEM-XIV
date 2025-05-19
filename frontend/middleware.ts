import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { SessionPayload } from '@/app/lib/definitions'
 
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

const publicRoutes = ['/login', '/register']

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | undefined> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch (error) {
    console.log('Failed to verify session')
    return undefined
  }
}
 
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)
 
  const session = req.cookies.get('session')?.value
 
  if (!session) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', req.nextUrl))
    }
    return NextResponse.next()
  }

  const payload = await decrypt(session)

  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', req.nextUrl))
    response.cookies.delete('session')
    return response
  }
 
  if (isPublicRoute && payload.token) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login/test-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${payload.token}`,
      'Accept': 'application/json',
    }
  })

  if (!apiRes.ok) {
    const res = NextResponse.redirect(new URL('/login', req.nextUrl))
    res.cookies.delete('session')
    return res
  }
 
  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}