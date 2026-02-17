"use client";

import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

export default function CandidateWorkspace({ params }: { params: { publicId: string } }) {
  const [session, setSession] = useState<any>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [aiHistory, setAiHistory] = useState<Array<{ question: string; response: string }>>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/sessions/${params.publicId}`);
      if (!res.ok) {
        setStatus("Invalid session link");
        return;
      }
      const data = await res.json();
      setSession(data);
      setFiles(data.files || []);
      if (data.files?.length) {
        openFile(data.files[0]);
      }
    }
    load();
  }, [params.publicId]);

  const editorExtensions = useMemo(() => {
    const lang = session?.scenario?.slug === "feature-add" ? "javascript" : "javascript";
    if (lang === "javascript") return [javascript()];
    return [python()];
  }, [session]);

  async function openFile(path: string) {
    setActiveFile(path);
    const res = await fetch(`/api/workspace?token=${params.publicId}&path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setContent(data.content || "");
  }

  async function saveFile() {
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.publicId, path: activeFile, content }),
    });
    setStatus("Saved.");
  }

  async function runTests() {
    const res = await fetch("/api/run-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.publicId }),
    });
    const data = await res.json();
    setStatus(`${data.stdout} (exit ${data.exitCode})`);
  }

  async function askAI() {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.publicId, question, context: content }),
    });
    const data = await res.json();
    setAiResponse(data.response);
    setAiHistory((prev) => [...prev, { question, response: data.response }]);
  }

  async function submitSnapshot() {
    await saveFile();
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.publicId }),
    });
    if (res.ok) setStatus("Submitted snapshot.");
  }

  if (!session) return <main className="p-10 text-sm text-slate-600">{status || "Loading..."}</main>;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold">{session.scenario.title}</h1>
        <p className="text-sm text-slate-600">{session.scenario.description}</p>
        <ul className="text-xs text-slate-500 list-disc pl-4">
          {session.scenario.tasks.map((task: string) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </div>

      <section className="grid gap-6 lg:grid-cols-[220px,1fr,320px]">
        <div className="card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Files</h2>
          {files.map((file) => (
            <button
              key={file}
              className={`text-left text-xs ${file === activeFile ? "font-semibold" : ""}`}
              onClick={() => openFile(file)}
            >
              {file}
            </button>
          ))}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{activeFile}</h2>
            <div className="flex gap-2">
              <button className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold" onClick={saveFile}>
                Save
              </button>
              <button className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold" onClick={runTests}>
                Run Tests
              </button>
              <button className="rounded-md bg-ink px-3 py-1 text-xs font-semibold text-white" onClick={submitSnapshot}>
                Submit Snapshot
              </button>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border">
            <CodeMirror
              value={content}
              height="420px"
              extensions={editorExtensions}
              theme={oneDark}
              onChange={(value) => setContent(value)}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{status}</p>
        </div>

        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">AI Assistant</h2>
          <textarea
            className="h-24 w-full rounded-md border border-slate-200 p-2 text-xs"
            placeholder="Ask: summarize repo, suggest tests, review patch..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white" onClick={askAI}>
            Ask AI
          </button>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs whitespace-pre-wrap">
            {aiResponse || "AI responses appear here."}
          </div>
          <div className="text-xs text-slate-500">{aiHistory.length} AI interactions logged.</div>
        </div>
      </section>
    </main>
  );
}
