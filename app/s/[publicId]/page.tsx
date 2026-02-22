"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

export default function CandidateWorkspace() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId || "";
  const [session, setSession] = useState<any>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [aiMode, setAiMode] = useState<string>("summary");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [aiHistory, setAiHistory] = useState<Array<{ question: string; response: string }>>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<{ path: string; line: number; preview: string }>>([]);
  const [testOutput, setTestOutput] = useState<string>("");
  const [clarificationNotes, setClarificationNotes] = useState<string>("");
  const [started, setStarted] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!publicId) return;
      const res = await fetch(`/api/sessions/${publicId}`);
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
      setStarted(true);
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: publicId, type: "START_SESSION", payload: { time: new Date().toISOString() } }),
      });
    }
    load();
  }, [publicId]);

  const editorExtensions = useMemo(() => {
    const lang = session?.scenario?.slug === "feature-add" ? "javascript" : "javascript";
    if (lang === "javascript") return [javascript()];
    return [python()];
  }, [session]);

  async function openFile(path: string) {
    setActiveFile(path);
    const res = await fetch(`/api/workspace?token=${publicId}&path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setContent(data.content || "");
  }

  async function saveFile() {
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, path: activeFile, content }),
    });
    setStatus("Saved.");
  }

  async function runTests() {
    const res = await fetch("/api/run-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId }),
    });
    const data = await res.json();
    setStatus(`${data.stdout} (exit ${data.exitCode})`);
    setTestOutput(data.stdout || "");
  }

  async function askAI() {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, question, context: content, mode: aiMode }),
    });
    const data = await res.json();
    setAiResponse(data.response);
    setAiHistory((prev) => [...prev, { question, response: data.response }]);
  }

  async function searchRepo() {
    if (!searchQuery.trim()) return;
    const res = await fetch(`/api/workspace/search?token=${publicId}&q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.results || []);
  }

  async function submitSnapshot() {
    await saveFile();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, type: "CLARIFICATION_NOTES", payload: { notes: clarificationNotes } }),
    });
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, clarificationNotes }),
    });
    if (res.ok) setStatus("Submitted snapshot.");
  }

  if (!session) return <main className="p-10 text-sm text-slate-600">{status || "Loading..."}</main>;

  const aiModes = session.scenario.aiPolicy?.allowedModes || ["summary", "explain", "tests", "review"];

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold">{session.scenario.title}</h1>
        <p className="text-sm text-slate-600">{session.scenario.description}</p>
        <p className="text-xs text-slate-500">Time limit: {session.scenario.timeLimitMin || "N/A"} min</p>
        <div className="text-xs text-slate-600 whitespace-pre-wrap">{session.scenario.background}</div>
        <ul className="text-xs text-slate-500 list-disc pl-4">
          {session.scenario.tasks.map((task: string) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </div>

      <section className="grid gap-6 lg:grid-cols-[240px,1fr,320px]">
        <div className="card p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Files</h2>
            <div className="mt-2 flex flex-col gap-1">
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
          </div>

          <div>
            <h3 className="text-xs font-semibold">Search</h3>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
              placeholder="search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="mt-2 rounded-md bg-slate-100 px-2 py-1 text-xs" onClick={searchRepo}>
              Find
            </button>
            <div className="mt-2 text-xs text-slate-600 space-y-1 max-h-32 overflow-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={`${result.path}-${idx}`}
                  className="text-left"
                  onClick={() => openFile(result.path)}
                >
                  {result.path}:{result.line} — {result.preview}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold">Hints</h3>
            <ul className="mt-1 text-xs text-slate-500 list-disc pl-4">
              {session.scenario.hints.map((hint: string) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>
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
          {testOutput && (
            <div className="mt-2 rounded-md bg-slate-900 p-3 text-xs text-white whitespace-pre-wrap">
              {testOutput}
            </div>
          )}
        </div>

        <div className="card p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">AI Assistant</h2>
            <label className="text-xs text-slate-500">Mode</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value)}
            >
              {aiModes.map((mode: string) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
            <textarea
              className="mt-2 h-20 w-full rounded-md border border-slate-200 p-2 text-xs"
              placeholder="Ask: summarize repo, suggest tests, review patch..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="mt-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white" onClick={askAI}>
              Ask AI
            </button>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs whitespace-pre-wrap">
              {aiResponse || "AI responses appear here."}
            </div>
            <div className="text-xs text-slate-500">{aiHistory.length} AI interactions logged.</div>
          </div>

          <div>
            <h3 className="text-xs font-semibold">Requirement Clarification Notes</h3>
            <textarea
              className="mt-1 h-20 w-full rounded-md border border-slate-200 p-2 text-xs"
              placeholder="Clarify requirements, acceptance criteria, assumptions..."
              value={clarificationNotes}
              onChange={(e) => setClarificationNotes(e.target.value)}
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold">Evaluation Points</h3>
            <ul className="mt-1 text-xs text-slate-500 list-disc pl-4">
              {session.scenario.evaluationPoints.map((point: string) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
