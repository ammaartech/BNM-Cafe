"use client";

import type { ReactNode } from "react";
import { SWRConfig, type Cache, type SWRConfiguration } from "swr";

/**
 * Keys whose data survives a reload. Only user-scoped keys belong here: they
 * stay null until auth resolves after hydration, so a restored value can never
 * disagree with the server-rendered HTML. Public data (the menu) is rendered
 * on the server instead, and staff screens are always read live.
 */
const PERSISTED = ["cart", "favorites", "orders", "order", "order-ready", "my-feedback"];
const STORAGE_KEY = "bnm:swr-cache:v1";

let cacheMap: Map<string, any> | null = null;

function isPersisted(key: string) {
    // SWR serialises array keys as `@"cart","<uid>",`
    return PERSISTED.some((name) => key.startsWith(`@"${name}"`));
}

function persist() {
    if (!cacheMap) return;
    try {
        const entries: [string, { data: unknown }][] = [];
        cacheMap.forEach((state, key) => {
            if (isPersisted(key) && state?.data !== undefined) entries.push([key, { data: state.data }]);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Storage full or blocked (private mode): the cache just won't persist.
    }
}

function localStorageProvider(): Cache {
    if (typeof window === "undefined") return new Map();

    let entries: [string, unknown][] = [];
    try {
        entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        entries = [];
    }
    cacheMap = new Map(entries);

    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") persist();
    });
    return cacheMap;
}

/** Drops every cached value, in memory and on disk. Called on sign-out. */
export function clearPersistedCache() {
    cacheMap?.clear();
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

const config: SWRConfiguration = {
    provider: localStorageProvider,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    focusThrottleInterval: 5_000,
    dedupingInterval: 4_000,
    errorRetryInterval: 3_000,
    errorRetryCount: 4,
};

export function SWRProvider({ children }: { children: ReactNode }) {
    return <SWRConfig value={config}>{children}</SWRConfig>;
}
