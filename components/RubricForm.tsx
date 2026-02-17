"use client";

export function RubricForm({ sessionId }: { sessionId: string }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const scores = {
      repo_understanding: Number(data.get("repo_understanding")),
      requirement_clarity: Number(data.get("requirement_clarity")),
      delivery_quality: Number(data.get("delivery_quality")),
      architecture_tradeoffs: Number(data.get("architecture_tradeoffs")),
      ai_usage_quality: Number(data.get("ai_usage_quality")),
    };
    await fetch("/api/rubric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, scores, comments: data.get("comments") }),
    });
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
      {[
        ["repo_understanding", "Repo understanding"],
        ["requirement_clarity", "Requirement clarification notes"],
        ["delivery_quality", "Delivery quality"],
        ["architecture_tradeoffs", "Architecture tradeoffs"],
        ["ai_usage_quality", "AI usage quality"],
      ].map(([key, label]) => (
        <label key={key} className="text-sm text-slate-600">
          {label}
          <input name={key} type="number" min={1} max={5} defaultValue={3} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1" />
        </label>
      ))}
      <label className="text-sm text-slate-600 md:col-span-2">
        Comments
        <textarea name="comments" className="mt-1 w-full rounded-md border border-slate-200 p-2" />
      </label>
      <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
        Save Rubric
      </button>
    </form>
  );
}
