"use client";

import { useEffect } from "react";

// Last-resort error boundary — replaces the root layout entirely when it
// crashes, so it must provide its own <html>/<body> and cannot rely on the
// app's stylesheet or components. Everything here is intentionally inline.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: "100dvh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "0 24px",
                    backgroundColor: "#f8f9fa",
                    color: "#1a1c1e",
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
            >
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
                    Something went wrong
                </h1>
                <p style={{ color: "#5f6368", maxWidth: 320, margin: "0 0 32px" }}>
                    B.N.M Cafe hit an unexpected error. Please try again.
                </p>
                <button
                    onClick={reset}
                    style={{
                        height: 48,
                        padding: "0 32px",
                        borderRadius: 12,
                        border: "none",
                        backgroundColor: "#154b23",
                        color: "#ffffff",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    Try Again
                </button>
                {error.digest && (
                    <p style={{ fontSize: 12, color: "#9aa0a6", marginTop: 32 }}>
                        Error code: {error.digest}
                    </p>
                )}
            </body>
        </html>
    );
}
