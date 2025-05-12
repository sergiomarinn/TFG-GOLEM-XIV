import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession, getTokenFromSession } from '@/app/lib/session';

export async function GET(request: NextRequest) {
  try {
    // Extract the action from the URL
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'user') {
      const user = await getUserFromSession();
      return NextResponse.json({ user });
    } 
    else if (action === 'token') {
      const token = await getTokenFromSession();
      return NextResponse.json({ token });
    }
    else {
      // Default: return both user and authentication status
      const user = await getUserFromSession();
      return NextResponse.json({ 
        user, 
        authenticated: !!user 
      });
    }
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ 
      error: 'Session error' 
    }, { status: 500 });
  }
}