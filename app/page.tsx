"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ── Scroll-triggered fade-in hook ── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, className: `transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}` };
}

/* ── Typing animation for hero IDE ── */
function useTypingEffect(text: string, speed = 40, delay = 1000) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);
  return displayed;
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const smoothScroll = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Fade-in refs for sections
  const problemFade = useFadeIn();
  const howFade = useFadeIn();
  const featuresFade = useFadeIn();
  const statsFade = useFadeIn();
  const pricingFade = useFadeIn();
  const ctaFade = useFadeIn();

  return (
    <div className="min-h-screen font-body" style={{ background: "#0e1117", color: "#e6edf3" }}>
      {/* ═══ 1. NAVIGATION ═══ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 md:px-12 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(14,17,23,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(42,49,66,0.5)" : "1px solid transparent",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #a371f7)" }}>
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="font-display text-base font-semibold">buildscore</span>
        </Link>
        <div className="flex items-center gap-6">
          <a href="#features" onClick={smoothScroll("features")} className="hidden md:block text-sm transition-colors" style={{ color: "#7d8590" }}>Features</a>
          <a href="#pricing" onClick={smoothScroll("pricing")} className="hidden md:block text-sm transition-colors" style={{ color: "#7d8590" }}>Pricing</a>
          <Link href="/login" className="text-sm font-medium px-4 py-1.5 rounded-lg transition-colors" style={{ color: "#e6edf3", border: "1px solid #2a3142" }}>Log In</Link>
          <Link href="/login" className="hidden md:block text-sm font-semibold px-4 py-1.5 rounded-lg text-white" style={{ background: "#3b82f6" }}>Get Started</Link>
        </div>
      </nav>

      {/* ═══ 2. HERO ═══ */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #e6edf3 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              Technical interviews for the{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #a371f7)" }}>
                AI era
              </span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: "#7d8590" }}>
              Stop testing if candidates can invert a binary tree. Start evaluating how they build with AI — in a real codebase, with a real copilot, solving real problems.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Link href="/login" className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "#3b82f6" }}>
                Start Free
              </Link>
              <a href="#how-it-works" onClick={smoothScroll("how-it-works")} className="rounded-lg px-6 py-3 text-sm font-medium transition-colors" style={{ color: "#e6edf3", border: "1px solid #2a3142" }}>
                See How It Works
              </a>
            </div>
            <p className="text-xs" style={{ color: "#484f58" }}>No credit card required &bull; 5 free sessions/month</p>
          </div>

          {/* Hero IDE Mockup */}
          <HeroIDEMockup />
        </div>
      </section>

      {/* ═══ 3. PROBLEM / SOLUTION ═══ */}
      <section className="py-20 px-6 md:px-12" ref={problemFade.ref}>
        <div className={`max-w-6xl mx-auto ${problemFade.className}`}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="rounded-2xl p-6 md:p-8" style={{ background: "#13161d", border: "1px solid #1e2330" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#484f58" }}>The Problem</div>
              <h3 className="font-display text-xl font-semibold mb-4" style={{ color: "#7d8590" }}>Interviews stuck in 2015</h3>
              <div className="rounded-lg p-4 mb-4 font-mono text-xs" style={{ background: "#0a0c10", border: "1px solid #1a1e28", color: "#484f58" }}>
                <div><span style={{ color: "#484f58" }}>1</span>  <span style={{ color: "#555" }}>{"// Reverse a linked list"}</span></div>
                <div><span style={{ color: "#484f58" }}>2</span>  <span style={{ color: "#666" }}>function</span> <span style={{ color: "#777" }}>reverse</span>(head) {"{"}</div>
                <div><span style={{ color: "#484f58" }}>3</span>    <span style={{ color: "#555" }}>{"// your code here..."}</span></div>
                <div><span style={{ color: "#484f58" }}>4</span>  {"}"}</div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#484f58" }}>
                Single-file algorithm puzzles that test memorization, not real-world skills.
              </p>
            </div>

            {/* After */}
            <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden" style={{ background: "#161b22", border: "1px solid #2a3142" }}>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-20" style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
              <div className="relative">
                <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#3b82f6" }}>Buildscore</div>
                <h3 className="font-display text-xl font-semibold mb-4">Interviews built for 2026</h3>
                <div className="rounded-lg p-4 mb-4 font-mono text-xs" style={{ background: "#0e1117", border: "1px solid #2a3142" }}>
                  <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: "1px solid #2a3142" }}>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>TS</span>
                    <span style={{ color: "#7d8590" }}>orderService.ts</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(163,113,247,0.15)", color: "#a371f7" }}>AI Copilot</span>
                  </div>
                  <div><span style={{ color: "#484f58" }}>1</span>  <span style={{ color: "#ff7b72" }}>import</span> {"{ "}<span style={{ color: "#79c0ff" }}>OrderRepository</span>{" }"} <span style={{ color: "#ff7b72" }}>from</span> <span style={{ color: "#a5d6ff" }}>&apos;./repos&apos;</span></div>
                  <div><span style={{ color: "#484f58" }}>2</span>  <span style={{ color: "#ff7b72" }}>import</span> {"{ "}<span style={{ color: "#79c0ff" }}>NotificationAdapter</span>{" }"} <span style={{ color: "#ff7b72" }}>from</span> <span style={{ color: "#a5d6ff" }}>&apos;./adapters&apos;</span></div>
                  <div><span style={{ color: "#484f58" }}>3</span></div>
                  <div><span style={{ color: "#484f58" }}>4</span>  <span style={{ color: "#ff7b72" }}>export class</span> <span style={{ color: "#ffa657" }}>OrderService</span> {"{"}</div>
                  <div><span style={{ color: "#484f58" }}>5</span>    <span style={{ color: "#d2a8ff" }}>async</span> <span style={{ color: "#d2a8ff" }}>processOrder</span>(id: <span style={{ color: "#79c0ff" }}>string</span>) {"{"}</div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#7d8590" }}>
                  Real codebases, AI tools, and pair programming that mirror actual work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 px-6 md:px-12" ref={howFade.ref}>
        <div className={`max-w-6xl mx-auto ${howFade.className}`}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Three steps to better interviews</h2>
          <p className="text-center mb-12" style={{ color: "#7d8590" }}>From setup to hiring decision in under an hour.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                title: "Create",
                desc: "Choose from our template library or import your own codebase. Define the task, set the rubric, pick a duration.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                ),
              },
              {
                num: "2",
                title: "Share",
                desc: "Send your candidate a single link. No account needed — they click and they're in a full IDE with an AI copilot ready to go.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                ),
              },
              {
                num: "3",
                title: "Evaluate",
                desc: "Review the session timeline, AI usage analytics, and code diffs. Score with a structured rubric. Make confident hiring decisions.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div
                key={step.num}
                className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ background: "#161b22", border: "1px solid #2a3142" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a3142")}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(163,113,247,0.15))", color: "#3b82f6" }}>
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs font-semibold" style={{ color: "#484f58" }}>0{step.num}</span>
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7d8590" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5. FEATURES GRID ═══ */}
      <section id="features" className="py-20 px-6 md:px-12" ref={featuresFade.ref}>
        <div className={`max-w-6xl mx-auto ${featuresFade.className}`}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Everything you need to evaluate AI builders</h2>
          <p className="text-center mb-12" style={{ color: "#7d8590" }}>Built for the way engineers actually work today.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "{ }", title: "Real Codebases", desc: "50-200+ file projects, not toy problems. TypeScript, Python, Java, Go — your stack, your complexity." },
              { icon: "AI", title: "Built-in AI Copilot", desc: "Chat-based assistance plus inline code suggestions. Candidates use AI the way they actually work." },
              { icon: ">>", title: "Live Pair Programming", desc: "Real-time collaborative editing with shared cursors. Work together like you would on the job." },
              { icon: "~>", title: "AI Usage Analytics", desc: "See what candidates asked the AI, how they prompted, whether they verified output. Measure AI fluency." },
              { icon: "||", title: "Session Replay", desc: "Scrub through the full timeline: every edit, every AI query, every file opened. Nothing gets missed.", badge: "Coming Soon" },
              { icon: "=5", title: "Custom Rubrics", desc: "Define what matters for your team. Score on problem-solving, AI usage, code quality, communication." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                style={{ background: "#161b22", border: "1px solid #2a3142" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2a3142")}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-8 w-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                    {f.icon}
                  </span>
                  {f.badge && (
                    <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: "rgba(163,113,247,0.15)", color: "#a371f7" }}>{f.badge}</span>
                  )}
                </div>
                <h3 className="font-display text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#7d8590" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6. STATS ═══ */}
      <section className="py-16 px-6 md:px-12" ref={statsFade.ref}>
        <div className={`max-w-4xl mx-auto ${statsFade.className}`}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "45 min", label: "Average session duration" },
              { value: "3", label: "Ready-to-use codebase templates" },
              { value: "100%", label: "AI-native from day one" },
            ].map((s) => (
              <div key={s.label} className="text-center py-6">
                <div className="font-display text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #a371f7)" }}>
                  {s.value}
                </div>
                <div className="text-xs md:text-sm" style={{ color: "#7d8590" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. PRICING ═══ */}
      <section id="pricing" className="py-20 px-6 md:px-12" ref={pricingFade.ref}>
        <div className={`max-w-6xl mx-auto ${pricingFade.className}`}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-center mb-12" style={{ color: "#7d8590" }}>Start free, scale when you need to.</p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <PricingCard
              name="Free"
              price="$0"
              period="/month"
              features={["5 sessions/month", "3 codebase templates", "AI copilot (standard)", "7-day session history"]}
              cta="Get Started"
              ctaHref="/login"
            />
            {/* Pro */}
            <PricingCard
              name="Pro"
              price="$99"
              period="/month"
              features={["50 sessions/month", "Unlimited templates", "AI copilot (Claude Sonnet)", "Unlimited session history", "Custom rubrics", "Team members (up to 10)", "Priority support"]}
              cta="Start Pro Trial"
              ctaHref="/login"
              highlighted
            />
            {/* Enterprise */}
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              features={["Unlimited everything", "SSO / SAML", "Custom AI model selection", "ATS integrations", "Dedicated support", "White-label option"]}
              cta="Contact Sales"
              ctaHref="mailto:sales@buildscore.dev"
            />
          </div>
        </div>
      </section>

      {/* ═══ 8. CTA BANNER ═══ */}
      <section className="py-20 px-6 md:px-12" ref={ctaFade.ref}>
        <div className={`max-w-4xl mx-auto ${ctaFade.className}`}>
          <div className="rounded-2xl px-8 py-14 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #3b82f6, #a371f7)" }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="relative">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">Ready to interview like it&apos;s 2026?</h2>
              <Link href="/login" className="inline-block rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 mb-3" style={{ background: "white", color: "#0e1117" }}>
                Start Free
              </Link>
              <p className="text-sm text-white/70">Set up your first interview in under 5 minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 9. FOOTER ═══ */}
      <footer className="py-10 px-6 md:px-12" style={{ borderTop: "1px solid #2a3142" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #a371f7)" }}>
              <span className="text-white text-[9px] font-bold">B</span>
            </div>
            <span className="text-xs" style={{ color: "#484f58" }}>&copy; 2026 Buildscore. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            {["Product", "Pricing", "Documentation", "Blog"].map((l) => (
              <a key={l} href="#" className="text-xs transition-colors hover:text-white" style={{ color: "#7d8590" }}>{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="GitHub" style={{ color: "#7d8590" }}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
            <a href="#" aria-label="Twitter" style={{ color: "#7d8590" }}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            <a href="#" aria-label="LinkedIn" style={{ color: "#7d8590" }}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══ Hero IDE Mockup Component ═══ */
function HeroIDEMockup() {
  const aiResponse = useTypingEffect(
    "The processOrder method should validate the order exists, check inventory, then dispatch a notification. Here's the implementation:",
    30,
    1500
  );

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Glow effect */}
      <div className="absolute -inset-4 opacity-20 blur-3xl" style={{ background: "linear-gradient(135deg, #3b82f6, #a371f7)" }} />

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "#161b22",
          border: "1px solid #2a3142",
          transform: "perspective(1200px) rotateX(2deg)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#0e1117", borderBottom: "1px solid #2a3142" }}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f85149" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#d29922" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3fb950" }} />
            </div>
            <span className="text-[11px] font-medium ml-2" style={{ color: "#7d8590" }}>Buildscore — Order Service Challenge</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: "#3fb950" }}>44:32</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>Active</span>
          </div>
        </div>

        <div className="flex" style={{ height: "280px" }}>
          {/* File explorer */}
          <div className="hidden sm:block w-40 shrink-0 py-2" style={{ borderRight: "1px solid #2a3142", background: "#0e1117" }}>
            <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#484f58" }}>Explorer</div>
            {["src/", "  orderService.ts", "  orderRepo.ts", "  types.ts", "test/", "  order.test.ts", "package.json"].map((f, i) => (
              <div key={i} className="px-3 py-0.5 text-[11px] truncate" style={{ color: i === 1 ? "#e6edf3" : "#7d8590", background: i === 1 ? "rgba(59,130,246,0.1)" : "transparent" }}>
                {f.startsWith("  ") ? (
                  <><span style={{ color: "#3b82f6" }} className="text-[9px] font-mono font-bold mr-1">{f.trim().endsWith(".ts") ? "TS" : "{}"}</span>{f.trim()}</>
                ) : (
                  <span style={{ color: "#d29922" }}>{f}</span>
                )}
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 py-3 px-4 font-mono text-[11px] leading-5 overflow-hidden" style={{ background: "#0e1117" }}>
            <div><span style={{ color: "#484f58" }}>1 </span><span style={{ color: "#ff7b72" }}>import</span> {"{ "}<span style={{ color: "#79c0ff" }}>Order</span>, <span style={{ color: "#79c0ff" }}>OrderStatus</span>{" }"} <span style={{ color: "#ff7b72" }}>from</span> <span style={{ color: "#a5d6ff" }}>&apos;./types&apos;</span></div>
            <div><span style={{ color: "#484f58" }}>2 </span><span style={{ color: "#ff7b72" }}>import</span> {"{ "}<span style={{ color: "#79c0ff" }}>OrderRepository</span>{" }"} <span style={{ color: "#ff7b72" }}>from</span> <span style={{ color: "#a5d6ff" }}>&apos;./orderRepo&apos;</span></div>
            <div><span style={{ color: "#484f58" }}>3 </span></div>
            <div><span style={{ color: "#484f58" }}>4 </span><span style={{ color: "#ff7b72" }}>export class</span> <span style={{ color: "#ffa657" }}>OrderService</span> {"{"}</div>
            <div><span style={{ color: "#484f58" }}>5 </span>  <span style={{ color: "#ff7b72" }}>private</span> repo: <span style={{ color: "#79c0ff" }}>OrderRepository</span></div>
            <div><span style={{ color: "#484f58" }}>6 </span></div>
            <div><span style={{ color: "#484f58" }}>7 </span>  <span style={{ color: "#d2a8ff" }}>async</span> <span style={{ color: "#d2a8ff" }}>processOrder</span>(id: <span style={{ color: "#79c0ff" }}>string</span>): <span style={{ color: "#79c0ff" }}>Promise</span>{"<"}<span style={{ color: "#79c0ff" }}>Order</span>{">"} {"{"}</div>
            <div><span style={{ color: "#484f58" }}>8 </span>    <span style={{ color: "#ff7b72" }}>const</span> order = <span style={{ color: "#ff7b72" }}>await</span> <span style={{ color: "#79c0ff" }}>this</span>.repo.<span style={{ color: "#d2a8ff" }}>findById</span>(id)</div>
            <div><span style={{ color: "#484f58" }}>9 </span>    <span style={{ color: "#ff7b72" }}>if</span> (!order) <span style={{ color: "#ff7b72" }}>throw new</span> <span style={{ color: "#ffa657" }}>Error</span>(<span style={{ color: "#a5d6ff" }}>&apos;Not found&apos;</span>)</div>
            <div><span style={{ color: "#484f58" }}>10</span>    <span style={{ color: "#8b949e" }}>{"// TODO: check inventory"}</span></div>
            <div><span style={{ color: "#484f58" }}>11</span>    <span className="animate-pulse inline-block w-1.5 h-3.5 ml-0.5" style={{ background: "#58a6ff" }} /></div>
          </div>

          {/* AI Chat Panel */}
          <div className="w-56 shrink-0 flex flex-col py-2" style={{ borderLeft: "1px solid #2a3142", background: "#161b22" }}>
            <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#a371f7", borderBottom: "1px solid #2a3142" }}>
              AI Copilot
            </div>
            <div className="flex-1 overflow-hidden p-2 space-y-2">
              {/* User message */}
              <div className="rounded-lg px-2 py-1.5 text-[10px]" style={{ background: "rgba(59,130,246,0.1)", color: "#58a6ff" }}>
                How should I implement processOrder?
              </div>
              {/* AI response */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-3 h-3 rounded flex items-center justify-center text-[7px] font-bold text-white" style={{ background: "linear-gradient(135deg, #a371f7, #f778ba)" }}>AI</span>
                  <span className="text-[8px]" style={{ color: "#484f58" }}>summary</span>
                </div>
                <div className="rounded-lg px-2 py-1.5 text-[10px] leading-relaxed" style={{ background: "#1c2230", color: "#7d8590" }}>
                  {aiResponse}<span className="inline-block w-1 h-2.5 ml-0.5 animate-pulse" style={{ background: "#a371f7" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ Pricing Card Component ═══ */
function PricingCard({ name, price, period, features, cta, ctaHref, highlighted }: {
  name: string; price: string; period: string; features: string[]; cta: string; ctaHref: string; highlighted?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{
        background: highlighted ? "#161b22" : "#161b22",
        border: highlighted ? "1px solid #3b82f6" : "1px solid #2a3142",
        boxShadow: highlighted ? "0 0 30px rgba(59,130,246,0.1)" : "none",
      }}
    >
      {highlighted && (
        <div className="text-[10px] font-semibold rounded-full px-2 py-0.5 self-start mb-3" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
          Recommended
        </div>
      )}
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7d8590" }}>{name}</div>
      <div className="font-display text-3xl font-bold mb-1">
        {price}<span className="text-sm font-normal" style={{ color: "#484f58" }}>{period}</span>
      </div>
      <ul className="flex-1 space-y-2 my-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#7d8590" }}>
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#3fb950" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className="block text-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          background: highlighted ? "#3b82f6" : "transparent",
          color: highlighted ? "white" : "#e6edf3",
          border: highlighted ? "none" : "1px solid #2a3142",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
