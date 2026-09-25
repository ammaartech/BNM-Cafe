import { createClient } from '@supabase/supabase-js'

/**
 * Anon client for public, cacheable reads on the server (the menu). It holds
 * no session, so it only ever sees what RLS grants to everyone.
 */
export function createPublicClient() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
