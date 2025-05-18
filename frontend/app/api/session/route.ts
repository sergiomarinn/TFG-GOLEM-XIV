import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession, getTokenFromSession, updateUserInSession } from '@/app/lib/session';

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    await updateUserInSession(body);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}