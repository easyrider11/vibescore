"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

interface LiveEvent {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
}

interface AiChat {
  id: string;
  mode: string;
  question: string;
  response: string;
  createdAt: string;
}

interface LiveSubmission {
  id: string;
  clarificationNotes: string | null;
  diffText: string;
  createdAt: string;
}

export default function InterviewerLivePage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id || "";

  const [publicToken, setPublicToken] = useState("");
  const [scenario, setScenario] = useState<any>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [aiChat, setAiChat] = useState<AiChat[]>([]);
  const [currentFiles, setCurrentFiles] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<LiveSubmission[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"ai" | "timeline" | "analytics" | "submissions">("ai");

  const eventsEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSession() {
      const res = await fetch(`/api/sessions/lookup?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setPublicToken(data.publicToken);
      }
    }
    fetchSession();
  }, [sessionId]);

  const poll = useCallback(async () => {
    if (!publicToken) return;
    try {
      const url = lastUpdate
        ? `/api/sessions/${publicToken}/live?since=${encodeURIComponent(lastUpdate)}`
        : `/api/sessions/${publicToken}/live`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      setScenario(data.scenario);
      setConnected(true);

      if (!lastUpdate) {
        setEvents(data.events);
      } else if (data.events.length > 0) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = data.events.filter((e: LiveEvent) => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      }

      setAiChat(data.aiChat);
      setCurrentFiles(data.currentFiles);
      setSubmissions(data.submissions);
      setLastUpdate(data.serverTime);

      if (!activeFile && Object.keys(data.currentFiles).length > 0) {
        setActiveFile(Object.keys(data.currentFiles)[0]);
      }
    } catch {
      setConnected(false);
    }
  }, [publicToken, lastUpdate, activeFile]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => { eventsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [events]);
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiChat]);

  const fileList = Object.keys(currentFiles);
  const currentContent = currentFiles[activeFile] || "";

  /* AI Analytics computations */
  const aiModeBreakdown = aiChat.reduce<Record<string, number>>((acc, c) => {
    acc[c.mode] = (acc[c.mode] || 0) + 1;
    return acc;
  }, {});
  const totalAiQueries = aiChat.length;
  const fileOpenEvents = events.filter((e) => e.type === "OPEN_FILE");
  const editEvents = events.filter((e) => e.type === "EDIT_FILE");
  const uniqueFilesViewed = new Set(fileOpenEvents.map((e) => e.payload?.path)).size;
  const sessionStart = events.find((e) => e.type === "START_SESSION")?.createdAt;
  const lastEvent = events[events.length - 1]?.createdAt;
  const sessionDurationMin = sessionStart && lastEvent
    ? Math.round((new Date(lastEvent).getTime() - new Date(sessionStart).getTime()) / 60000)
    : 0;

  const eventTypeConfig: Record<string, { color: string; icon: string }> = {
    START_SESSION: { color: "var(--accent-green)", icon: ">>" },
    OPEN_FILE: { color: "var(--accent-blue)", icon: "[]" },
    EDIT_FILE: { color: "var(--accent-orange)", icon: "//" },
    AI_CHAT: { color: "var(--accent-purple)", icon: "AI" },
    RUN_TESTS: { color: "var(--accent-cyan)", icon: ">#" },
    SUBMIT: { color: "var(--accent-blue)", icon: "OK" },
    CLARIFICATION_NOTES: { color: "var(--accent-orange)", icon: "??" },
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden font-body" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Top Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between px-4" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <a href="/app" className="font-display text-sm font-semibold text-accent-blue hover:opacity-80 transition-opacity">
            buildscore
          </a>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>|</span>
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Live Observation</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>|</span>
          <span className="text-xs truncate max-w-[300px]" style={{ color: "var(--text-secondary)" }}>
            {scenario?.title || "Loading…"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs">
            <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse" : ""}`} style={{ background: connected ? "var(--status-active)" : "var(--status-error)" }} />
            <span style={{ color: connected ? "var(--status-active)" : "var(--status-error)" }}>
              {connected ? "Live" : "Disconnected"}
            </span>
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{events.length} events</span>
          <a href={`/app/sessions/${sessionId}`} className="rounded-md px-3 py-1 text-xs font-medium transition-colors" style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}>
            Review & Score
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — File Explorer */}
        <aside className="flex w-48 shrink-0 flex-col" style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-default)" }}>
          <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Candidate Files
            </span>
          </div>
          <nav className="flex-1 overflow-auto p-1 ide-scrollbar">
            {fileList.map((file) => (
              <button
                key={file}
                className="w-full text-left rounded px-2 py-1 text-xs truncate transition-colors"
                style={{
                  color: file === activeFile ? "var(--text-primary)" : "var(--text-secondary)",
                  background: file === activeFile ? "rgba(59,130,246,0.1)" : "transparent",
                  borderLeft: file === activeFile ? "2px solid var(--accent-blue)" : "2px solid transparent",
                }}
                onClick={() => setActiveFile(file)}
              >
                {file}
              </button>
            ))}
            {fileList.length === 0 && (
              <p className="px-2 py-4 text-[10px]" style={{ color: "var(--text-tertiary)" }}>Waiting for candidate...</p>
            )}
          </nav>
        </aside>

        {/* Center — Live Code View */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-9 items-center px-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{activeFile || "No file selected"}</span>
            <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(210,153,34,0.15)", color: "var(--accent-orange)" }}>
              READ-ONLY
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeMirror
              value={currentContent}
              height="100%"
              editable={false}
              extensions={[javascript()]}
              theme={oneDark}
              className="h-full"
            />
          </div>
        </main>

        {/* Right — Observation Panels */}
        <aside className="flex w-[420px] shrink-0 flex-col" style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border-default)" }}>
          <div className="flex h-9 items-center" style={{ borderBottom: "1px solid var(--border-default)" }}>
            {(["ai", "analytics", "timeline", "submissions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePanel(tab)}
                className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{
                  color: activePanel === tab ? "var(--accent-blue)" : "var(--text-tertiary)",
                  borderBottom: activePanel === tab ? "2px solid var(--accent-blue)" : "2px solid transparent",
                }}
              >
                {tab === "ai" ? `Chat (${aiChat.length})`
                  : tab === "analytics" ? "Analytics"
                    : tab === "timeline" ? `Events (${events.length})`
                      : `Diffs (${submissions.length})`}
              </button>
            ))}
          </div>

          {/* AI Chat Panel */}
          {activePanel === "ai" && (
            <div className="flex-1 overflow-auto p-3 space-y-3 ide-scrollbar">
              {aiChat.length === 0 ? (
                <p className="text-center text-xs py-8" style={{ color: "var(--text-tertiary)" }}>
                  No AI interactions yet.
                </p>
              ) : (
                aiChat.map((chat) => (
                  <div key={chat.id} className="rounded-lg p-3 space-y-2" style={{ background: "var(--bg-surface-alt)" }}>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(163,113,247,0.2)", color: "var(--accent-purple)" }}>
                        {chat.mode}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(chat.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-accent-cyan">{chat.question}</div>
                    <div className="text-xs whitespace-pre-wrap leading-relaxed pt-2" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-default)" }}>
                      {chat.response}
                    </div>
                  </div>
                ))
              )}
              <div ref={aiEndRef} />
            </div>
          )}

          {/* AI Analytics Panel */}
          {activePanel === "analytics" && (
            <div className="flex-1 overflow-auto p-3 space-y-4 ide-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "AI Queries", value: totalAiQueries, color: "var(--accent-purple)" },
                  { label: "Files Viewed", value: uniqueFilesViewed, color: "var(--accent-blue)" },
                  { label: "Edit Events", value: editEvents.length, color: "var(--accent-orange)" },
                  { label: "Duration (min)", value: sessionDurationMin, color: "var(--accent-green)" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg p-3" style={{ background: "var(--bg-surface-alt)" }}>
                    <div className="text-xl font-semibold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  AI Mode Breakdown
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(aiModeBreakdown).map(([mode, count]) => (
                    <div key={mode} className="flex items-center justify-between rounded px-2 py-1.5" style={{ background: "var(--bg-surface-alt)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--accent-purple)" }}>{mode}</span>
                      <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{count}</span>
                    </div>
                  ))}
                  {Object.keys(aiModeBreakdown).length === 0 && (
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No data yet.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Prompt Patterns
                </h3>
                <div className="space-y-1">
                  {aiChat.slice(-5).map((chat) => (
                    <div key={chat.id} className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                      <span className="text-accent-purple mr-1">[{chat.mode}]</span>
                      {chat.question}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Event Timeline Summary
                </h3>
                <div className="space-y-1">
                  {Object.entries(
                    events.reduce<Record<string, number>>((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {})
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span style={{ color: eventTypeConfig[type]?.color || "var(--text-secondary)" }}>{type}</span>
                      <span className="font-mono" style={{ color: "var(--text-tertiary)" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Panel */}
          {activePanel === "timeline" && (
            <div className="flex-1 overflow-auto p-3 ide-scrollbar">
              {events.length === 0 ? (
                <p className="text-center text-xs py-8" style={{ color: "var(--text-tertiary)" }}>
                  No events yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {events.map((event) => {
                    const cfg = eventTypeConfig[event.type] || { color: "var(--text-secondary)", icon: "--" };
                    return (
                      <div key={event.id} className="flex items-start gap-2 rounded px-2 py-1.5 transition-colors" style={{ background: "transparent" }}>
                        <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium" style={{ color: cfg.color }}>{event.type}</span>
                            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                              {new Date(event.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {event.payload && Object.keys(event.payload).length > 0 && (
                            <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                              {event.type === "OPEN_FILE" && event.payload.path}
                              {event.type === "AI_CHAT" && `[${event.payload.mode}] ${event.payload.question}`}
                              {event.type === "RUN_TESTS" && `exit: ${event.payload.exitCode}`}
                              {event.type === "CLARIFICATION_NOTES" && event.payload.notes?.slice(0, 80)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={eventsEndRef} />
            </div>
          )}

          {/* Submissions Panel */}
          {activePanel === "submissions" && (
            <div className="flex-1 overflow-auto p-3 space-y-3 ide-scrollbar">
              {submissions.length === 0 ? (
                <p className="text-center text-xs py-8" style={{ color: "var(--text-tertiary)" }}>
                  No submissions yet.
                </p>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="rounded-lg p-3 space-y-2" style={{ background: "var(--bg-surface-alt)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent-blue">Submission</span>
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(sub.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {sub.clarificationNotes && (
                      <div className="text-xs italic" style={{ color: "var(--text-secondary)" }}>
                        Notes: {sub.clarificationNotes}
                      </div>
                    )}
                    {sub.diffText && (
                      <pre className="mt-1 max-h-48 overflow-auto rounded p-2 text-[10px] font-mono whitespace-pre-wrap" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}>
                        {sub.diffText.split("\n").map((line, i) => (
                          <span key={i} style={{ color: line.startsWith("+") ? "var(--accent-green)" : line.startsWith("-") ? "var(--accent-red)" : undefined }}>
                            {line}{"\n"}
                          </span>
                        ))}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
