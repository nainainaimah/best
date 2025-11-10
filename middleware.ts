import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const pathname = request.nextUrl.pathname
    const locale = pathname.split('/')[1] || 'en'

    // Skip middleware for share routes (public, no auth needed)
    if (pathname.includes('/share/')) {
      return response
    }

    const protectedRoutes = ['/dashboard', '/grid', '/calendar', '/post', '/onboarding', '/admin', '/profile']
    const publicRoutes = ['/auth', '/pricing']
    const isProtectedRoute = protectedRoutes.some(route => pathname.includes(route))
    const isPublicRoute = publicRoutes.some(route => pathname.includes(route))
    const adminRoutes = ['/admin']
    const isAdminRoute = adminRoutes.some(route => pathname.includes(route))

    // Only check auth for protected routes
    if (!isProtectedRoute) {
      return response
    }

    // Get user with timeout protection
    const { data: { user }, error: authError } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null }, error: any }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null }, error: new Error('Auth timeout') }), 3000)
      )
    ])

    if (authError || !user) {
      console.error('Middleware auth error:', authError)
      return NextResponse.redirect(new URL(`/${locale}/auth`, request.url))
    }

    // Admin route check (no DB query needed)
    if (isAdminRoute) {
      const adminEmails = (process.env.ADMIN_EMAILS || 'naimakunambi@gmail.com').split(',').map(e => e.trim())
      if (!adminEmails.includes(user.email || '')) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
      }
    }

    // Check onboarding completion (except for onboarding and pricing pages)
    if (!pathname.includes('/onboarding') && !pathname.includes('/pricing')) {
      try {
        const { data: profile, error: profileError } = await Promise.race([
          supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('user_id', user.id)
            .single(),
          new Promise<{ data: null, error: any }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('Profile timeout') }), 2000)
          )
        ])

        if (profileError) {
          console.error('Middleware profile error:', profileError)
          // Allow through on error to avoid blocking users
          return response
        }

        if (profile && !profile.onboarding_complete) {
          return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url))
        }
      } catch (error) {
        console.error('Middleware profile check failed:', error)
        // Allow through on error
        return response
      }
    }

    // Subscription check for main app routes (not onboarding, pricing, or admin)
    if (!pathname.includes('/onboarding') && !pathname.includes('/pricing') && !isAdminRoute) {
      try {
        const { data: subscriptions, error: subError } = await Promise.race([
          supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1),
          new Promise<{ data: null, error: any }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('Subscription timeout') }), 2000)
          )
        ])

        if (subError) {
          console.error('Middleware subscription error:', subError)
          // Allow through on error to avoid blocking users
          return response
        }

        if (!subscriptions || subscriptions.length === 0) {
          return NextResponse.redirect(new URL(`/${locale}/pricing`, request.url))
        }
      } catch (error) {
        console.error('Middleware subscription check failed:', error)
        // Allow through on error
        return response
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Return response on any error to avoid blocking the app
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)']
}
