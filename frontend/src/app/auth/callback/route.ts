import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth callback route — handles OAuth redirects from Supabase.
 *
 * After Google (or other OAuth) login, Supabase redirects here with
 * either a `code` param (PKCE flow) or hash fragments (implicit flow).
 *
 * Since the Supabase JS client on the browser handles session storage
 * automatically when it detects the URL params, we just need to serve
 * a page that loads the Supabase client. Instead of a server-side route,
 * we redirect to a client-side page that lets the Supabase JS client
 * pick up the session from the URL.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type');

  // If Supabase returned an error, redirect to login with the error info
  if (error) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('auth_error', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  // For code exchange (PKCE flow), redirect to a client-side page
  // that will handle the exchange using the Supabase JS client
  if (code) {
    const callbackPageUrl = new URL('/auth/callback/exchange', request.url);
    callbackPageUrl.searchParams.set('code', code);
    if (type) callbackPageUrl.searchParams.set('type', type);
    return NextResponse.redirect(callbackPageUrl);
  }

  // Redirect based on flow type
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
