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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const locale = pathname.split('/')[1]

  const protectedRoutes = ['/dashboard', '/grid', '/post', '/onboarding', '/admin', '/profile']
  const publicRoutes = ['/auth', '/pricing']
  const isProtectedRoute = protectedRoutes.some(route => pathname.includes(route))
  const isPublicRoute = publicRoutes.some(route => pathname.includes(route))
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => pathname.includes(route))

  // Check authentication for protected routes
  if (isProtectedRoute) {
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/auth`, request.url))
    }

    // Check onboarding completion (except for onboarding and pricing pages)
    if (!pathname.includes('/onboarding') && !pathname.includes('/pricing')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .single()

      if (!profile?.onboarding_complete) {
        return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url))
      }
    }

    // Admin route check
    if (isAdminRoute) {
      const adminEmails = (process.env.ADMIN_EMAILS || 'naimakunambi@gmail.com').split(',').map(e => e.trim())
      if (!adminEmails.includes(user.email || '')) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
      }
    }

    // Subscription check for main app routes (not onboarding, pricing, or admin)
    if (!pathname.includes('/onboarding') && !pathname.includes('/pricing') && !isAdminRoute) {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)

      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.redirect(new URL(`/${locale}/pricing`, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
}
