import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, getTokenFromSession } from '@/app/lib/session'
 
// 1. Specify protected and public routes
const publicRoutes = ['/login', '/register']
 
export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)
 
  // 3. Decrypt the session from the cookie
  const token = await getTokenFromSession()
 
  // 4. Redirect to /login if the user is not authenticated
  if (!token) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', req.nextUrl))
    }
    return NextResponse.next()
  }
 
  // 5. Redirect to home page if the user is authenticated
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login/test-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  })

  if (!res.ok) {
    await deleteSession();
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
 
  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}