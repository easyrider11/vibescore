"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { HocuspocusProvider as HocuspocusProviderType } from "@hocuspocus/provider";
import type { MonacoBinding as MonacoBindingType } from "y-monaco";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const DiffEditor = dynamic(() => import("@monaco-editor/react").then((m) => ({ default: m.DiffEditor })), { ssr: false });

/* ── Types ──────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  mode?: string;
  contextFiles?: string[];
  timestamp: Date;
  streaming?: boolean;
}

type ContextTag = "codebase" | "current-file" | "selection";

/* ── Helpers ────────────────────────────────────────────── */
const fileIcon = (name: string) => {
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return { icon: "TS", color: "text-accent-blue" };
  if (name.endsWith(".js") || name.endsWith(".jsx")) return { icon: "JS", color: "text-accent-orange" };
  if (name.endsWith(".py")) return { icon: "PY", color: "text-accent-green" };
  if (name.endsWith(".json")) return { icon: "{}", color: "text-accent-purple" };
  if (name.endsWith(".md")) return { icon: "MD", color: "text-ide-text-secondary" };
  if (name.endsWith(".css") || name.endsWith(".scss")) return { icon: "#", color: "text-accent-pink" };
  return { icon: "~", color: "text-ide-text-tertiary" };
};

const langFromFile = (name: string) => {
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "typescript";
  if (name.endsWith(".js") || name.endsWith(".jsx")) return "javascript";
  if (name.endsWith(".py")) return "python";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".html")) return "html";
  return "plaintext";
};

function parseCodeBlocks(text: string): Array<{ type: "text" | "code"; content: string; lang?: string }> {
  const parts: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    parts.push({ type: "code", content: match[2], lang: match[1] || undefined });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", content: text.slice(lastIndex) });
  return parts.length === 0 ? [{ type: "text", content: text }] : parts;
}

/* ── Component ──────────────────────────────────────────── */
export default function CandidateWorkspace() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId || "";

  /* Session state */
  const [session, setSession] = useState<any>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [clarificationNotes, setClarificationNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [sessionEnded, setSessionEnded] = useState(false);

  /* AI Copilot state */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiMode, setAiMode] = useState("summary");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "tasks">("chat");
  const [activeContexts, setActiveContexts] = useState<Set<ContextTag>>(new Set(["current-file"]));
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* Collaborative editing (Yjs) */
  const yjsProviderRef = useRef<HocuspocusProviderType | null>(null);
  const monacoBindingRef = useRef<MonacoBindingType | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [collabConnected, setCollabConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<Array<{ name: string; color: string; filePath?: string }>>([]);

  /* Search */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ path: string; line: number; preview: string }>>([]);
  const [showSearch, setShowSearch] = useState(false);

  /* Timer — countdown */
  const [startTime, setStartTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number>(45);

  useEffect(() => {
    if (!startTime || !durationMin) return;
    const totalSecs = durationMin * 60;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rem = Math.max(0, totalSecs - elapsed);
      setRemaining(rem);
      if (rem === 0 && !sessionEnded) {
        // Auto-end session when timer expires
        fetch(`/api/sessions/${publicId}/end`, { method: "POST" });
        setSessionEnded(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, durationMin, publicId, sessionEnded]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const timerColor = remaining === null ? "text-ide-text-secondary"
    : remaining > 600 ? "text-accent-green"
      : remaining > 300 ? "text-accent-orange" : "text-accent-red";

  /* Load session */
  useEffect(() => {
    async function load() {
      if (!publicId) return;
      const res = await fetch(`/api/sessions/${publicId}`);
      if (!res.ok) { setStatus("Invalid session link"); return; }
      const data = await res.json();
      setSession(data);
      setFiles(data.files || []);
      setDurationMin(data.scenario.timeLimitMin || 45);

      if (data.files?.length) {
        const first = data.files[0];
        setOpenTabs([first]);
        loadFile(first);
        setActiveFile(first);
      }

      // Start the session
      await fetch(`/api/sessions/${publicId}/start`, { method: "POST" });
      setStartTime(Date.now());

      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: publicId, type: "START_SESSION", payload: { time: new Date().toISOString() } }),
      });
    }
    load();
  }, [publicId]);

  /* ── Yjs Collaboration Provider ── */
  useEffect(() => {
    if (!session || !publicId) return;

    const collabUrl = process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:3002";
    let destroyed = false;

    (async () => {
      try {
        const { HocuspocusProvider } = await import("@hocuspocus/provider");

        if (destroyed) return;

        const provider = new HocuspocusProvider({
          url: collabUrl,
          name: publicId, // room name = session token
          token: publicId,
          onConnect() {
            setCollabConnected(true);
          },
          onDisconnect() {
            setCollabConnected(false);
          },
          onAwarenessUpdate({ states }) {
            const users: Array<{ name: string; color: string; filePath?: string }> = [];
            states.forEach((state: any) => {
              if (state.user) {
                users.push({
                  name: state.user.name || "Unknown",
                  color: state.user.color || "#3b82f6",
                  filePath: state.cursor?.filePath,
                });
              }
            });
            setRemoteUsers(users);
          },
        });

        // Set local awareness
        provider.awareness?.setLocalStateField("user", {
          name: session.candidateName || "Candidate",
          color: "#3b82f6",
          role: "candidate",
        });

        yjsProviderRef.current = provider;
      } catch {
        // Collab server not available — continue without collaboration
      }
    })();

    return () => {
      destroyed = true;
      if (yjsProviderRef.current) {
        yjsProviderRef.current.destroy();
        yjsProviderRef.current = null;
      }
    };
  }, [session, publicId]);

  /* Update awareness when switching files */
  useEffect(() => {
    if (yjsProviderRef.current?.awareness && activeFile) {
      yjsProviderRef.current.awareness.setLocalStateField("cursor", {
        filePath: activeFile,
      });
    }
  }, [activeFile]);

  /* Bind Yjs to Monaco editor when file changes */
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !yjsProviderRef.current || !activeFile) return;

    // Dispose old binding
    if (monacoBindingRef.current) {
      monacoBindingRef.current.destroy();
      monacoBindingRef.current = null;
    }

    const ydoc = yjsProviderRef.current.document;
    if (!ydoc) return;

    const ytext = ydoc.getText(`file:${activeFile}`);
    const model = editorRef.current.getModel();
    if (!model) return;

    let cancelled = false;
    (async () => {
      try {
        const { MonacoBinding } = await import("y-monaco");
        if (cancelled) return;
        const binding = new MonacoBinding(
          ytext,
          model,
          new Set([editorRef.current]),
          yjsProviderRef.current!.awareness
        );
        monacoBindingRef.current = binding;
      } catch {
        // Binding failed — continue without collab for this file
      }
    })();

    return () => {
      cancelled = true;
      if (monacoBindingRef.current) {
        monacoBindingRef.current.destroy();
        monacoBindingRef.current = null;
      }
    };
  }, [activeFile, collabConnected]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* File operations */
  async function loadFile(path: string) {
    if (fileContents[path] !== undefined) return; // already loaded
    const res = await fetch(`/api/workspace?token=${publicId}&path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setFileContents((prev) => ({ ...prev, [path]: data.content || "" }));
  }

  async function openFile(path: string) {
    setActiveFile(path);
    if (!openTabs.includes(path)) setOpenTabs((prev) => [...prev, path]);
    await loadFile(path);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, type: "OPEN_FILE", payload: { path } }),
    });
  }

  function closeTab(path: string) {
    const newTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(newTabs);
    if (activeFile === path && newTabs.length > 0) openFile(newTabs[newTabs.length - 1]);
  }

  const content = fileContents[activeFile] ?? "";
  const setContent = useCallback((val: string) => {
    setFileContents((prev) => ({ ...prev, [activeFile]: val }));
  }, [activeFile]);

  const saveFile = useCallback(async () => {
    setSaving(true);
    await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, path: activeFile, content: fileContents[activeFile] ?? "" }),
    });
    setSaving(false);
    setStatus("Saved");
    setTimeout(() => setStatus(""), 2000);
  }, [publicId, activeFile, fileContents]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); saveFile(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "`") { e.preventDefault(); setShowTerminal((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile]);

  async function runTests() {
    setShowTerminal(true);
    setTestOutput("Running tests...\n");
    const res = await fetch("/api/run-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId }),
    });
    const data = await res.json();
    setTestOutput(data.stdout || "");
    setStatus(`Tests: exit ${data.exitCode}`);
  }

  /* ── AI Copilot with Streaming ── */
  function toggleContext(ctx: ContextTag) {
    setActiveContexts((prev) => {
      const next = new Set(prev);
      if (next.has(ctx)) next.delete(ctx); else next.add(ctx);
      return next;
    });
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || aiLoading) return;

    // Abort previous stream if any
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const contextFiles = activeContexts.has("current-file") ? [activeFile] : [];
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "user", content: chatInput, mode: aiMode, contextFiles, timestamp: new Date(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId, role: "assistant", content: "", mode: aiMode, timestamp: new Date(), streaming: true,
    };

    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
    setChatInput("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: publicId, question: chatInput, context: content, mode: aiMode, contextFiles, stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "delta") {
              setChatMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: m.content + event.text } : m)
              );
            } else if (event.type === "done") {
              setChatMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m)
              );
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setChatMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: m.content || "Failed to get response.", streaming: false } : m)
        );
      }
    }

    setAiLoading(false);
    abortRef.current = null;
  }

  /* ── Diff View State ── */
  const [diffView, setDiffView] = useState<{ original: string; modified: string; code: string } | null>(null);

  function showDiffView(code: string) {
    // Build modified content by replacing current file content with the AI suggestion
    const original = fileContents[activeFile] ?? "";
    setDiffView({ original, modified: code, code });
  }

  function acceptDiff() {
    if (!diffView) return;
    setContent(diffView.modified);
    setDiffView(null);
    setStatus("Applied AI suggestion");
    setTimeout(() => setStatus(""), 2000);
    // Log acceptance
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, type: "AI_CODE_APPLIED", payload: { filePath: activeFile } }),
    });
  }

  function rejectDiff() {
    setDiffView(null);
    // Log rejection
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: publicId, type: "AI_CODE_REJECTED", payload: { filePath: activeFile } }),
    });
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
    if (res.ok) setStatus("Submitted!");
  }

  /* ── Inline suggestion status ── */
  const [inlineSuggestionVisible, setInlineSuggestionVisible] = useState(false);

  /* ── Monaco configuration ── */
  function handleEditorMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Custom dark theme matching design doc
    monaco.editor.defineTheme("buildscore-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0e1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#ffffff08",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#7d8590",
        "editor.selectionBackground": "#3b82f640",
        "editorCursor.foreground": "#58a6ff",
        "editor.inactiveSelectionBackground": "#3b82f620",
        "editorIndentGuide.background": "#2a3142",
        "editorIndentGuide.activeBackground": "#484f58",
        "editorWidget.background": "#161b22",
        "editorWidget.border": "#2a3142",
        "editorSuggestWidget.background": "#161b22",
        "editorSuggestWidget.border": "#2a3142",
        "editorSuggestWidget.selectedBackground": "#1c2230",
        "minimap.background": "#0e1117",
      },
    });
    monaco.editor.setTheme("buildscore-dark");

    // Track cursor position
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    // Ctrl+S save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });

    // ── Inline AI Suggestions (ghost text) ──
    let inlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let inlineAbortController: AbortController | null = null;

    const allLanguages = monaco.languages.getLanguages().map((l: any) => l.id);
    for (const langId of allLanguages) {
      monaco.languages.registerInlineCompletionsProvider(langId, {
        provideInlineCompletions: async (model: any, position: any, _context: any, token: any) => {
          // Debounce: wait 1.5s after last keystroke
          if (inlineDebounceTimer) clearTimeout(inlineDebounceTimer);
          if (inlineAbortController) inlineAbortController.abort();

          return new Promise((resolve) => {
            inlineDebounceTimer = setTimeout(async () => {
              if (token.isCancellationRequested) { resolve({ items: [] }); return; }

              inlineAbortController = new AbortController();
              try {
                const res = await fetch("/api/ai/inline-suggest", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    token: publicId,
                    filePath: activeFile,
                    fileContent: model.getValue(),
                    cursorLine: position.lineNumber,
                    cursorColumn: position.column,
                  }),
                  signal: inlineAbortController.signal,
                });

                if (!res.ok || token.isCancellationRequested) {
                  resolve({ items: [] });
                  return;
                }

                const data = await res.json();
                if (data.completion) {
                  setInlineSuggestionVisible(true);
                  resolve({
                    items: [{
                      insertText: data.completion,
                      range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                      },
                    }],
                  });
                } else {
                  resolve({ items: [] });
                }
              } catch {
                resolve({ items: [] });
              }
            }, 1500);
          });
        },
        freeInlineCompletions: () => {
          setInlineSuggestionVisible(false);
        },
      });
    }

    // Log suggestion acceptance/rejection
    editor.onDidChangeModelContent(() => {
      if (inlineSuggestionVisible) {
        setInlineSuggestionVisible(false);
        // Log acceptance event
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: publicId, type: "AI_SUGGESTION_ACCEPTED", payload: {} }),
        });
      }
    });
  }

  /* ── Loading state ── */
  if (!session) {
    return (
      <main className="flex h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-center">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent mx-auto" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{status || "Loading workspace..."}</p>
        </div>
      </main>
    );
  }

  const aiModes = session.scenario.aiPolicy?.allowedModes || ["summary", "explain", "tests", "review"];

  /* ── Render ── */
  return (
    <div className="flex h-screen flex-col overflow-hidden font-body" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Session ended overlay */}
      {sessionEnded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(14,17,23,0.9)" }}>
          <div className="text-center rounded-xl p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="text-2xl font-display font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Session Ended</div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              The interview session has ended. Your work has been saved.
            </p>
          </div>
        </div>
      )}

      {/* Diff View Modal */}
      {diffView && (
        <div className="absolute inset-0 z-40 flex flex-col" style={{ background: "rgba(14,17,23,0.95)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <div className="flex items-center gap-3">
              <span className="font-display text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Review Changes</span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{activeFile}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={rejectDiff} className="rounded-md px-4 py-1.5 text-xs font-medium transition-colors" style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
                Reject
              </button>
              <button onClick={acceptDiff} className="rounded-md px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--accent-green)" }}>
                Accept Changes
              </button>
            </div>
          </div>
          <div className="flex-1">
            <DiffEditor
              original={diffView.original}
              modified={diffView.modified}
              language={langFromFile(activeFile)}
              theme="buildscore-dark"
              options={{
                readOnly: true,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderSideBySide: true,
              }}
            />
          </div>
        </div>
      )}

      {/* ═══ Top Bar ═══ */}
      <header className="flex h-11 shrink-0 items-center justify-between px-4" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-semibold text-accent-blue">buildscore</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>|</span>
          <span className="text-xs truncate max-w-[300px]" style={{ color: "var(--text-primary)" }}>{session.scenario.title}</span>
          <div className="flex items-center gap-1 ml-2">
            <div className="presence-avatar" style={{ background: "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))" }}>
              <span className="text-white text-[9px]">{(session.candidateName || "C")[0].toUpperCase()}</span>
              <span className="presence-dot" style={{ background: "var(--status-active)" }} />
            </div>
            {remoteUsers.map((u, i) => (
              <div key={i} className="presence-avatar" style={{ background: u.color }} title={`${u.name}${u.filePath ? ` — viewing ${u.filePath}` : ""}`}>
                <span className="text-white text-[9px]">{u.name[0]?.toUpperCase()}</span>
                <span className="presence-dot" style={{ background: "var(--status-active)" }} />
              </div>
            ))}
            {collabConnected && (
              <span className="text-[9px] ml-1" style={{ color: "var(--accent-green)" }}>Live</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status && <span className="text-xs text-accent-green">{status}</span>}
          <div className={`flex items-center gap-1.5 font-mono text-xs ${timerColor}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            {remaining !== null ? formatTime(remaining) : "--:--"}
          </div>
          <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium" style={{ background: sessionEnded ? "rgba(248,81,73,0.15)" : "rgba(63,185,80,0.15)", color: sessionEnded ? "var(--status-error)" : "var(--status-active)" }}>
            {sessionEnded ? "Ended" : "Active"}
          </div>
          <button onClick={runTests} disabled={sessionEnded} className="rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40" style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
            Run Tests
          </button>
          <button onClick={submitSnapshot} disabled={sessionEnded} className="rounded-md bg-accent-blue px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
            Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ Left — File Explorer ═══ */}
        <aside className="flex w-56 shrink-0 flex-col" style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-default)" }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Explorer</span>
            <button onClick={() => setShowSearch(!showSearch)} className="text-xs transition-colors" style={{ color: "var(--text-tertiary)" }}>
              {showSearch ? "Files" : "Search"}
            </button>
          </div>
          {showSearch ? (
            <div className="p-2 space-y-2">
              <input className="w-full rounded-md px-2 py-1 text-xs focus:outline-none font-mono" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} placeholder="Search in files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchRepo()} />
              <div className="space-y-0.5 max-h-[calc(100vh-200px)] overflow-auto ide-scrollbar">
                {searchResults.map((r, i) => (
                  <button key={`${r.path}-${i}`} className="w-full text-left rounded px-2 py-1 text-[11px] truncate" style={{ color: "var(--text-secondary)" }} onClick={() => { openFile(r.path); setShowSearch(false); }}>
                    <span className="text-accent-blue">{r.path}</span><span style={{ color: "var(--text-tertiary)" }}>:{r.line}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <nav className="flex-1 overflow-auto p-1 ide-scrollbar">
              {files.map((file) => {
                const fi = fileIcon(file);
                return (
                  <button key={file} className="w-full text-left rounded px-2 py-1 text-xs truncate transition-colors flex items-center gap-1.5" style={{ color: file === activeFile ? "var(--text-primary)" : "var(--text-secondary)", background: file === activeFile ? "rgba(59,130,246,0.1)" : "transparent", borderLeft: file === activeFile ? "2px solid var(--accent-blue)" : "2px solid transparent" }} onClick={() => openFile(file)}>
                    <span className={`text-[10px] font-mono font-semibold ${fi.color}`}>{fi.icon}</span>{file}
                  </button>
                );
              })}
            </nav>
          )}
          <div className="p-3 space-y-2 max-h-48 overflow-auto ide-scrollbar" style={{ borderTop: "1px solid var(--border-default)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Tasks</span>
            <ul className="space-y-1">
              {session.scenario.tasks.map((task: string, i: number) => (
                <li key={i} className="text-[11px] leading-tight" style={{ color: "var(--text-secondary)" }}>
                  <span className="text-accent-blue mr-1">{i + 1}.</span>{task}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ═══ Center — Monaco Editor ═══ */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex h-9 items-center overflow-x-auto ide-scrollbar" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-default)" }}>
            {openTabs.map((tab) => {
              const fi = fileIcon(tab);
              return (
                <div key={tab} className="group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer shrink-0 transition-colors" style={{ background: tab === activeFile ? "var(--bg-primary)" : "transparent", color: tab === activeFile ? "var(--text-primary)" : "var(--text-secondary)", borderRight: "1px solid var(--border-default)", borderBottom: tab === activeFile ? "2px solid var(--accent-blue)" : "2px solid transparent" }} onClick={() => openFile(tab)}>
                  <span className={`text-[9px] font-mono font-semibold ${fi.color}`}>{fi.icon}</span>
                  <span>{tab.split("/").pop()}</span>
                  {saving && tab === activeFile && <span className="text-[9px] text-accent-orange">...</span>}
                  <button onClick={(e) => { e.stopPropagation(); closeTab(tab); }} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" style={{ color: "var(--text-tertiary)" }}>x</button>
                </div>
              );
            })}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              language={langFromFile(activeFile)}
              value={content}
              onChange={(val) => setContent(val ?? "")}
              onMount={handleEditorMount}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 22,
                minimap: { enabled: true, size: "proportional" },
                bracketPairColorization: { enabled: true },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                renderWhitespace: "selection",
                padding: { top: 8 },
                readOnly: sessionEnded,
              }}
            />
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-default)" }}>
              <div className="flex items-center justify-between px-3 py-1" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-tertiary)" }}>Terminal</span>
                <button onClick={() => setShowTerminal(false)} className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Close</button>
              </div>
              <pre className="max-h-36 overflow-auto p-3 text-xs font-mono whitespace-pre-wrap ide-scrollbar" style={{ color: "var(--text-primary)" }}>
                {testOutput || "No output yet. Run tests to see output here."}
              </pre>
            </div>
          )}

          {/* Status bar */}
          <div className="status-bar">
            <div className="flex items-center gap-4">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>{langFromFile(activeFile)}</span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-4">
              {inlineSuggestionVisible && <span className="text-accent-cyan">AI suggestion available (Tab to accept)</span>}
              {aiLoading && <span className="text-accent-purple">AI Streaming...</span>}
              <span className={collabConnected ? "text-accent-green" : "text-accent-orange"}>
                {collabConnected ? "Collaborative" : "Solo"}
              </span>
            </div>
          </div>
        </main>

        {/* ═══ Right — AI Copilot Panel ═══ */}
        <aside className="flex w-[380px] shrink-0 flex-col" style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border-default)" }}>
          <div className="flex h-9 items-center" style={{ borderBottom: "1px solid var(--border-default)" }}>
            {(["chat", "notes", "tasks"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors" style={{ color: activeTab === tab ? "var(--accent-blue)" : "var(--text-tertiary)", borderBottom: activeTab === tab ? "2px solid var(--accent-blue)" : "2px solid transparent" }}>
                {tab === "chat" ? "AI Copilot" : tab === "notes" ? "Notes" : "Task Brief"}
              </button>
            ))}
          </div>

          {activeTab === "chat" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Mode:</span>
                {aiModes.map((mode: string) => (
                  <button key={mode} onClick={() => setAiMode(mode)} className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors" style={{ background: aiMode === mode ? "rgba(163,113,247,0.2)" : "transparent", color: aiMode === mode ? "var(--accent-purple)" : "var(--text-tertiary)" }}>
                    {mode}
                  </button>
                ))}
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-auto p-3 space-y-3 ide-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}>
                      <span className="text-white font-semibold text-lg">AI</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Your AI copilot is ready. Ask about the codebase, get explanations, or generate tests.
                    </p>
                    <div className="mt-4 space-y-1.5 w-full">
                      {["Summarize this codebase", "Explain the current file", "Suggest tests for this code", "Review my changes"].map((s) => (
                        <button key={s} onClick={() => setChatInput(s)} className="block w-full text-left rounded-lg px-3 py-2 text-[11px] transition-colors" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[90%]">
                      {msg.role === "user" ? (
                        <div className="rounded-xl px-3 py-2 text-xs leading-relaxed" style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent-cyan)" }}>
                          {msg.contextFiles?.length ? <span className="mb-1 block text-[9px]" style={{ color: "var(--text-tertiary)" }}>@{msg.contextFiles.join(", @")}</span> : null}
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          <span className="mt-1 block text-[9px]" style={{ color: "var(--text-tertiary)" }}>{msg.timestamp.toLocaleTimeString()}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}>AI</span>
                            <span className="text-[9px] font-semibold uppercase" style={{ color: "var(--text-tertiary)" }}>{msg.mode}</span>
                            {msg.streaming && <span className="text-[9px] text-accent-purple animate-pulse">streaming...</span>}
                          </div>
                          <div className="rounded-xl px-3 py-2 text-xs leading-relaxed" style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)" }}>
                            {!msg.streaming ? parseCodeBlocks(msg.content).map((block, bi) =>
                              block.type === "code" ? (
                                <div key={bi} className="ai-code-block my-2">
                                  <div className="code-header">
                                    <span>{block.lang || "code"}</span>
                                    <div className="flex gap-2">
                                      <button onClick={() => navigator.clipboard.writeText(block.content)} className="hover:text-accent-blue transition-colors">Copy</button>
                                      <button onClick={() => showDiffView(block.content)} className="hover:text-accent-green transition-colors">Apply</button>
                                    </div>
                                  </div>
                                  <pre>{block.content}</pre>
                                </div>
                              ) : (
                                <span key={bi} className="whitespace-pre-wrap">{block.content}</span>
                              )
                            ) : (
                              <span className="whitespace-pre-wrap">{msg.content}<span className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse" style={{ background: "var(--accent-purple)" }} /></span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {aiLoading && chatMessages[chatMessages.length - 1]?.content === "" && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-3 py-2" style={{ background: "var(--bg-surface-alt)" }}>
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--accent-purple)", animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--accent-purple)", animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--accent-purple)", animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Context pills + input */}
              <div className="p-3" style={{ borderTop: "1px solid var(--border-default)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>Context:</span>
                  {(["current-file", "codebase", "selection"] as ContextTag[]).map((ctx) => (
                    <button key={ctx} onClick={() => toggleContext(ctx)} className={`context-pill ${activeContexts.has(ctx) ? "active" : ""}`}>@{ctx}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea className="flex-1 resize-none rounded-lg px-3 py-2 text-xs focus:outline-none font-body" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} placeholder="Ask about the codebase, request code, or get help..." rows={2} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }} disabled={sessionEnded} />
                  <button onClick={sendChatMessage} disabled={aiLoading || !chatInput.trim() || sessionEnded} className="self-end rounded-lg bg-accent-blue px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity">
                    Send
                  </button>
                </div>
                <p className="mt-1 text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                  Enter to send, Shift+Enter for newline. {chatMessages.filter((m) => m.role === "user").length} queries used.
                </p>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="flex flex-1 flex-col p-3 gap-3">
              <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Document your assumptions and questions.</p>
              <textarea className="flex-1 resize-none rounded-lg p-3 text-xs focus:outline-none font-body" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} placeholder={"Write your clarification notes here...\n\n- What assumptions did you make?\n- What trade-offs did you consider?"} value={clarificationNotes} onChange={(e) => setClarificationNotes(e.target.value)} />
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="flex flex-1 flex-col p-3 gap-4 overflow-auto ide-scrollbar">
              <div><span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Scenario</span><p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{session.scenario.description}</p></div>
              <div><span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Background</span><p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{session.scenario.background}</p></div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Tasks</span>
                <ul className="mt-1 space-y-1.5">
                  {session.scenario.tasks.map((task: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded" style={{ border: "1px solid var(--border-default)" }} />{task}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Hints</span>
                <ul className="mt-1 space-y-1">{session.scenario.hints.map((h: string, i: number) => <li key={i} className="text-xs" style={{ color: "var(--text-tertiary)" }}><span className="text-accent-orange mr-1">hint:</span>{h}</li>)}</ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
