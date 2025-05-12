'use client';

import { User } from '@/app/lib/definitions';

export async function getUserFromClient(): Promise<User | null> {
  try {
    const res = await fetch('/api/session?action=user');
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error('Error getting user from client:', error);
    return null;
  }
}

export async function getTokenFromClient(): Promise<string | null> {
  try {
    const res = await fetch('/api/session?action=token');
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.token;
  } catch (error) {
    console.error('Error getting token from client:', error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const res = await fetch('/api/session');
    
    if (!res.ok) {
      return false;
    }
    
    const data = await res.json();
    return data.authenticated || false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}