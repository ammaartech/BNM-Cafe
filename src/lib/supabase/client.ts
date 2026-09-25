import { createClient, processLock } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or anon key. Check your .env file.')
}

// A request that never answers (a dropped mobile connection, a suspended tab)
// would otherwise hang its caller forever. Abort it so SWR can retry instead.
const REQUEST_TIMEOUT_MS = 15_000

const fetchWithTimeout: typeof fetch = (input, init) => {
    // Hand-rolled rather than AbortSignal.any/timeout, which iOS < 17.4 lacks.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), REQUEST_TIMEOUT_MS)
    const outer = init?.signal
    if (outer) {
        if (outer.aborted) controller.abort(outer.reason)
        else outer.addEventListener('abort', () => controller.abort(outer.reason), { once: true })
    }
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // The default navigator.locks lock can be left held when the browser
        // freezes a background tab, and every later request then queues behind
        // it until it times out — the "app hangs after tabbing back" bug. This
        // app runs one client per tab, so an in-process lock is all it needs.
        lock: processLock,
    },
    global: { fetch: fetchWithTimeout },
    realtime: {
        // Browsers throttle timers in background tabs, which starves the
        // realtime heartbeat until the server drops the socket. Running the
        // heartbeat in a Web Worker keeps it on schedule.
        worker: true,
    },
})

