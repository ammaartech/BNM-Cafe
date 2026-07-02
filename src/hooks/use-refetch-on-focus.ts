"use client";

import { useEffect, useRef } from "react";

/**
 * Re-runs `refetch` when the tab becomes visible again, the window regains
 * focus, or the network comes back online.
 *
 * Browsers throttle/suspend background tabs, which can silently drop the
 * Supabase realtime websocket. Events that fire while the tab is hidden are
 * then lost, leaving pages stale ("frozen") until a manual reload. Refetching
 * on visibility/focus/online closes that gap.
 *
 * Calls are throttled so rapid focus/visibility flapping (e.g. alt-tabbing)
 * doesn't spam the database.
 */
export function useRefetchOnFocus(refetch: () => void, throttleMs = 3000) {
    const refetchRef = useRef(refetch);
    refetchRef.current = refetch;

    const lastRunRef = useRef(0);

    useEffect(() => {
        const run = () => {
            const now = Date.now();
            if (now - lastRunRef.current < throttleMs) return;
            lastRunRef.current = now;
            refetchRef.current();
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") run();
        };

        window.addEventListener("focus", run);
        window.addEventListener("online", run);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("focus", run);
            window.removeEventListener("online", run);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [throttleMs]);
}
