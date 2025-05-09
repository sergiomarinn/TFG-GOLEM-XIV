import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromSession } from '@/app/lib/session'
 
// 1. Specify protected and public routes
const publicRoutes = ['/login', '/register']
 
export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)
 
  // 3. Decrypt the session from the cookie
  const token = await getTokenFromSession()
 
  // 4. Redirect to /login if the user is not authenticated
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
 
  // 5. Redirect to / if the user is authenticated
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }
 
  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}