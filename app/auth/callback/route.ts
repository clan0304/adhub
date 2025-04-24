// app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Get the user's session to check if profile is complete
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if profile is already set up
  if (session?.user?.user_metadata?.profile_completed) {
    // If profile is complete, redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  } else {
    // If profile is not complete, redirect to profile setup
    return NextResponse.redirect(new URL('/profile-setup', request.url));
  }
}
