"use client";

import { useState } from "react";

interface MarketingFaqProps {
  question: string;
  answer: string;
}

export function MarketingFAQ({ question, answer }: MarketingFaqProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {question}
        </span>
        <span
          className={`text-sm transition-transform ${open ? "rotate-45" : ""}`}
          style={{ color: "var(--accent-cyan)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
