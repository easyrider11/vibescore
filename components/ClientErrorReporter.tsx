"use client";

import { useEffect } from "react";

// Client-side observability hook. Catches unhandled errors + promise
// rejections and POSTs them to /api/client-error, which forwards to
// the configured observability webhook.

export function ClientErrorReporter() {
  useEffect(() => {
    function report(payload: Record<string, unknown>) {
      // Best-effort; never block.
      fetch("/api/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      }).catch(() => {});
    }

    function onError(event: ErrorEvent) {
      report({
        type: "error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      report({
        type: "unhandled_rejection",
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
