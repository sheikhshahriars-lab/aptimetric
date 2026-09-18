import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_REQUIRED = ['/dashboard', '/test', '/results', '/certificate', '/admin', '/recruiter']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const needsAuth = AUTH_REQUIRED.some((p) => path.startsWith(p))

  if (!user && needsAuth) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }

  if (user) {
    if (
      path.startsWith('/login') ||
      path.startsWith('/signup')
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (path.startsWith('/admin') || path.startsWith('/recruiter')) {
      const { data } = await supabase.rpc('app_role')
      const role = data as string | null
      if (path.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      if (path.startsWith('/recruiter') && role !== 'recruiter' && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/test',
    '/results/:path*',
    '/certificate/:path*',
    '/admin/:path*',
    '/recruiter/:path*',
    '/login',
    '/signup',
  ],
}