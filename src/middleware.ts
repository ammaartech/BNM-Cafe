
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserProfile } from '@/lib/types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Rule: /staff/** requires authentication
  if (!session) {
    return NextResponse.redirect(new URL('/staff/login', req.url))
  }

  // Fetch user profile from the database to check their role
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role, station_id')
    .eq('id', session.user.id)
    .single<Pick<UserProfile, 'role' | 'station_id'>>()

  // If we can't find a profile, something is wrong. Redirect to login.
  if (profileError || !userProfile) {
    return NextResponse.redirect(new URL('/staff/login?error=profile_not_found', req.url))
  }

  // Rule: admin → unrestricted access to all staff pages
  if (userProfile.role === 'admin') {
    return res
  }

  // Rule: staff → access only their assigned station
  if (userProfile.role === 'staff') {
    // If a staff member has no station assigned, block them from specific dashboards.
    if (!userProfile.station_id) {
        if(req.nextUrl.pathname.startsWith('/staff/station/')) {
            return NextResponse.redirect(new URL('/staff/station?error=no_station_assigned', req.url))
        }
        return res; // Allow access to the main selection page to see the error.
    }
    
    // Fetch the station code assigned to this staff member.
    const { data: assignedStation } = await supabase
      .from('stations')
      .select('code')
      .eq('id', userProfile.station_id)
      .single<{ code: string }>()

    if (!assignedStation) {
      // This staff member's assigned station doesn't exist. Block access.
      return NextResponse.redirect(new URL('/staff/station?error=station_not_found', req.url))
    }
    
    const path = req.nextUrl.pathname
    
    // Check if they are trying to access a specific station dashboard page.
    if (path.startsWith('/staff/station/')) {
      const requestedStationCode = path.split('/')[3]
      
      // If the requested station code does not match their assigned one, deny access by redirecting them to their own dashboard.
      if (requestedStationCode !== assignedStation.code) {
        return NextResponse.redirect(new URL(`/staff/station/${assignedStation.code}`, req.url))
      }
    }
    
    // If we've reached here, the staff member is accessing their own dashboard, the main selection page, or the admin KOT page (which they will be denied from on the page level). Allow the request to proceed.
    return res
  }

  // Rule: If user is not admin or staff, deny access to all /staff routes.
  return NextResponse.redirect(new URL('/', req.url))
}

// Configure the middleware to run only on staff-related pages.
export const config = {
  matcher: [
    '/staff/station/:path*',
    '/staff/admin/:path*',
  ],
}
