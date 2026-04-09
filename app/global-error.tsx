"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#0d1117",
          color: "#e6edf3",
          padding: "2rem",
        }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#7d8590", marginBottom: "1.5rem", textAlign: "center", maxWidth: "400px" }}>
            An unexpected error occurred. Please try again or contact support if the issue persists.
          </p>
          {error.digest && (
            <p style={{ color: "#484f58", fontSize: "0.75rem", marginBottom: "1rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              background: "#238636",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
