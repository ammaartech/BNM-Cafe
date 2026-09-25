"use client";

import { useEffect, useRef } from "react";
import { supabase } from "./client";

export type TableChange = {
    table: string;
    event?: "*" | "INSERT" | "UPDATE" | "DELETE";
    /** A single-column realtime filter, e.g. `user_id=eq.<uuid>`. */
    filter?: string;
};

let channelSeq = 0;

/**
 * Calls `onChange` (debounced) whenever one of `changes` happens in the
 * database, and again whenever the page may have missed events: after the
 * realtime socket reconnects, when the tab becomes visible, and when the
 * network comes back. Pass `null` to stay unsubscribed (e.g. before sign-in).
 *
 * Each call gets its own channel topic. Reusing a fixed topic across remounts
 * hands back the already-subscribed channel, which rejects new listeners — the
 * listener silently never fires.
 */
export function useRealtime(
    name: string,
    changes: TableChange[] | null,
    onChange: () => void,
    { debounceMs = 300 }: { debounceMs?: number } = {}
) {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Callers usually pass an inline array; key the effect on its contents.
    const spec = changes ? JSON.stringify(changes) : null;

    useEffect(() => {
        if (!spec) return;
        const list: TableChange[] = JSON.parse(spec);

        let timer: ReturnType<typeof setTimeout> | undefined;
        const fire = () => {
            clearTimeout(timer);
            timer = setTimeout(() => onChangeRef.current(), debounceMs);
        };

        const channel = supabase.channel(`${name}:${++channelSeq}`);
        for (const c of list) {
            channel.on(
                "postgres_changes",
                {
                    event: (c.event ?? "*") as "*",
                    schema: "public",
                    table: c.table,
                    ...(c.filter ? { filter: c.filter } : {}),
                },
                fire
            );
        }

        let subscribedBefore = false;
        channel.subscribe((status) => {
            if (status !== "SUBSCRIBED") return;
            // A re-subscribe means the socket dropped; whatever changed in
            // between was never delivered. Resync.
            if (subscribedBefore) fire();
            subscribedBefore = true;
        });

        let lastResync = 0;
        const resync = () => {
            const now = Date.now();
            if (now - lastResync < 3_000) return;
            lastResync = now;
            fire();
        };
        const onVisible = () => {
            if (document.visibilityState === "visible") resync();
        };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("online", resync);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("online", resync);
            supabase.removeChannel(channel);
        };
    }, [name, spec, debounceMs]);
}
