"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Code2, BarChart3, Shield, Zap, Star, Quote,
  ArrowRight, ChevronDown, Github, Linkedin, Globe,
  Briefcase, MessageSquare, LayoutDashboard, Check, Sparkles,
  ExternalLink, Users, FileText, TrendingUp,
} from "lucide-react";
import Logo, { LogoIcon } from "@/components/ui/Logo";

const NodeGraph  = dynamic(() => import("@/components/hero/NodeGraph"),  { ssr: false });
const DevHero    = dynamic(() => import("@/components/hero/DevHero"),    { ssr: false });
const AuthModal  = dynamic(() => import("@/components/auth/AuthModal"),  { ssr: false });

// ── Reliable CSS fade — immune to session re-render resets ───────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

// ── Feature list ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Code2,
    title: "Case Study Mode",
    desc: "Turn any project into a rich case study — problem, outcome, tech stack, video walkthrough. Clients read the story behind the code.",
  },
  {
    icon: BarChart3,
    title: "Engagement Timeline",
    desc: "See who viewed your profile, which projects they opened and how long they stayed — all in your private dashboard.",
  },
  {
    icon: Briefcase,
    title: "Hire-Me Panel",
    desc: "Show availability, rates and services. Let clients book a call directly with your Calendly link.",
  },
  {
    icon: MessageSquare,
    title: "Project Brief Inbox",
    desc: "Visitors fill in a structured brief. You wake up to qualified leads instead of vague DMs.",
  },
  {
    icon: Shield,
    title: "Verified Testimonials",
    desc: "Send a magic link to a past client. Their quote shows up with a ✓ verified badge — no faking it.",
  },
  {
    icon: Zap,
    title: "Live Health Checks",
    desc: "Each project link is auto-pinged. A colour chip shows clients your site is up and fast.",
  },
];

// ── Pain points ───────────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    emoji: "😩",
    title: "The proposal link problem",
    body: "You paste a GitHub README into your proposal email. The client opens a wall of markdown — and moves on to the next dev.",
  },
  {
    emoji: "🤷",
    title: "Impact is invisible",
    body: "You shipped something great. But without context, clients see code — not the 40% conversion lift you delivered.",
  },
  {
    emoji: "📭",
    title: "The follow-up ghost",
    body: "You sent three follow-up emails. No testimonial, no referral, no next project. Just silence.",
  },
];

// ── Testimonials ──────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Three clients reached out in the first week after I added a case study. The brief inbox is a game-changer.",
    author: "Riya Mehta",
    role: "Frontend Engineer",
    avatar: "RM",
  },
  {
    quote: "I dropped my Notion portfolio link in favour of DevTree. It just looks so much more professional.",
    author: "Carlos Ruiz",
    role: "Full-Stack Developer",
    avatar: "CR",
  },
  {
    quote: "The Lighthouse grade chip next to my project URL did more for my credibility than anything else.",
    author: "Priya Kapoor",
    role: "UI/UX Engineer",
    avatar: "PK",
  },
];

// ── Stats ─────────────────────────────────────────────────────────────────
const STATS = [
  { value: "2.4k+", label: "Developers" },
  { value: "18k+",  label: "Project views" },
  { value: "340+",  label: "Briefs received" },
  { value: "4.9★",  label: "Avg. rating" },
];

// ── How it works ──────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Create your profile", body: "Pick a username, write your bio with our 3-question wizard, set your availability." },
  { n: "02", title: "Add your projects",   body: "Paste a URL. We auto-screenshot it, ping GitHub for stars, and run a Lighthouse audit." },
  { n: "03", title: "Fill in the story",   body: "Problem, solution, outcome. Give clients the narrative, not just the code." },
  { n: "04", title: "Share one link",      body: "devtree.so/u/yourname — in proposals, emails, and your email signature." },
];

// ─────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.prefetch("/dashboard");
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-6 md:px-12 h-16">
        {/* Backdrop */}
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            background: "rgba(5,10,8,0.88)",
            borderBottom: "1px solid rgba(16,185,129,0.14)",
            boxShadow: "0 1px 0 rgba(16,185,129,0.06)",
          }}
        />

        <Logo href="/" iconSize={30} className="relative" />

        <nav className="relative hidden md:flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          {[
            { href: "#story",        label: "Story" },
            { href: "#features",     label: "Features" },
            { href: "#testimonials", label: "Reviews" },
            { href: "#pricing",      label: "Pricing" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-4 py-2 rounded-lg hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="relative flex items-center gap-3">
          {status === "authenticated" ? (
            <Link href="/dashboard">
              <button className="btn-primary py-2 px-5 text-sm">
                <LayoutDashboard size={14} /> Dashboard
              </button>
            </Link>
          ) : (
            <>
              <button
                onClick={() => setAuthMode("signin")}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2"
              >
                Sign in
              </button>
              <button
                onClick={() => setAuthMode("signup")}
                className="btn-primary py-2 px-5 text-sm"
              >
                Get started free
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="canvas-hero opacity-40">
          <NodeGraph />
        </div>
        {/* Main radial glow — comes from where the illustration is */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_65%_45%,rgba(16,185,129,0.18),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_60%,rgba(16,185,129,0.08),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-8 items-center min-h-[calc(100vh-8rem)]">

            {/* ── Left: copy ───────────────────────────────────────── */}
            <div className="flex flex-col justify-center animate-fade-in-up">
              <div className="badge mb-5 w-fit">
                <Sparkles size={11} /> Free forever · For freelance developers
              </div>

              <h1 className="text-[2.8rem] sm:text-5xl lg:text-[3.5rem] font-black leading-[1.06] tracking-tight mb-5">
                You build{" "}
                <span className="gradient-text">great things.</span>
                <br />
                Now let the right<br className="hidden sm:block" /> people{" "}
                <span className="relative inline-block">
                  find you.
                  {/* Underline squiggle */}
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none">
                    <path d="M0,4 Q25,0 50,4 Q75,8 100,4 Q125,0 150,4 Q175,8 200,4" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <p className="text-base md:text-[1.05rem] text-[var(--text-secondary)] max-w-lg mb-7 leading-relaxed">
                Your work speaks for itself — but only if clients can hear it.
                DevTree is the Linktree-style portfolio that turns your projects
                into case studies, collects verified testimonials, and sends
                qualified briefs straight to your inbox.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={() => setAuthMode("signup")}
                  className="btn-primary text-base px-7 py-3"
                >
                  Claim devtree.so/u/yourname <ArrowRight size={16} />
                </button>
                <a href="#story" className="btn-secondary text-base px-7 py-3">
                  See the story
                </a>
              </div>

              {/* Trust micro-copy */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Up in 5 minutes</span>
                <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Always free</span>
              </div>
            </div>

            {/* ── Right: illustration ────────────────────────────── */}
            <div
              className="flex items-center justify-center animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <DevHero />
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <a
          href="#story"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          style={{ animation: "fadeInUp 0.5s 1.4s both" }}
        >
          <ChevronDown size={24} className="animate-bounce" />
        </a>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="relative py-14 border-y border-[var(--card-border)]/40 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08} className="text-center">
              <p className="text-3xl md:text-4xl font-black gradient-text">{s.value}</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">{s.label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── STORY — "Sound familiar?" ─────────────────────────────────── */}
      <section id="story" className="py-28 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">

          {/* Section opener */}
          <FadeIn className="text-center mb-4">
            <span className="badge mb-4">The problem</span>
          </FadeIn>
          <FadeIn delay={0.05} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Sound familiar?
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
              Every freelance developer has lived these moments.
              You're good at what you do — but the story never makes it to the client.
            </p>
          </FadeIn>

          {/* Pain point cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {PAIN_POINTS.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.1}>
                <div className="card-glass p-6 h-full flex flex-col gap-4 group hover:border-[rgba(16,185,129,0.4)] transition-colors">
                  <span className="text-4xl">{p.emoji}</span>
                  <h3 className="font-bold text-[var(--text-primary)] text-lg">{p.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1">{p.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Transition beat */}
          <FadeIn delay={0.3}>
            <div className="relative text-center">
              {/* Horizontal rule with glow */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--card-border)] to-transparent" />
                <span className="text-[var(--text-muted)] text-sm font-medium">then you found DevTree</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--card-border)] to-transparent" />
              </div>

              <div className="card-modal max-w-2xl mx-auto p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.2),transparent)] pointer-events-none" />
                <div className="relative">
                  <p className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-3 leading-snug">
                    "I set it up on a Friday afternoon.
                    By Monday I had{" "}
                    <span className="gradient-text">two new project briefs.</span>"
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm">
                    — Anjali Sharma, React developer, Mumbai
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES — "What DevTree gives you" ──────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="badge mb-4">Features</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Everything a freelancer needs
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Built from the ground up for the developer–client handoff. No bloat. No upsell.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -6, boxShadow: "0 16px 48px rgba(16,185,129,0.22)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="card p-6 group cursor-default h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <f.icon size={18} className="text-[var(--accent-light)]" />
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-2">{f.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="badge mb-4">How it works</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              From zero to clients in{" "}
              <span className="gradient-text">5 minutes</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto">
              No designer needed. No copywriter. Just your projects and honest answers.
            </p>
          </FadeIn>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.1}>
                <div className="flex gap-6 items-start group">
                  <span className="text-4xl font-black gradient-text shrink-0 w-12 leading-none pt-1">
                    {step.n}
                  </span>
                  <div className="card-glass p-5 flex-1 group-hover:border-[rgba(16,185,129,0.4)] transition-colors">
                    <h3 className="font-bold text-[var(--text-primary)] mb-1">{step.title}</h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / PROFILE PREVIEW STRIP ─────────────────────── */}
      <section className="py-20 px-6 border-y border-[var(--card-border)]/40">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10">
            <p className="text-[var(--text-muted)] text-sm uppercase tracking-widest font-semibold">
              Real profiles, real results
            </p>
          </FadeIn>

          {/* Fake profile cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Alex Chen",   role: "Full-Stack · 8 projects",   avail: "✅ Available",  views: "212 views",  briefs: "5 briefs",  initials: "AC" },
              { name: "Riya Mehta",  role: "Frontend · 6 projects",     avail: "🟡 From Jun 10", views: "178 views",  briefs: "3 briefs",  initials: "RM" },
              { name: "Jordan Park", role: "DevOps · 5 projects",       avail: "🔴 Booked",      views: "301 views",  briefs: "8 briefs",  initials: "JP" },
            ].map((profile, i) => (
              <FadeIn key={profile.name} delay={i * 0.1}>
                <div className="card-glass p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {profile.initials}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)] text-sm">{profile.name}</p>
                      <p className="text-[var(--text-muted)] text-xs">{profile.role}</p>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-medium">{profile.avail}</div>
                  <div className="flex gap-3 pt-1">
                    <span className="badge text-[10px]"><TrendingUp size={9} /> {profile.views}</span>
                    <span className="badge text-[10px]"><FileText size={9} /> {profile.briefs}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section id="testimonials" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="badge mb-4">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-black">
              Freelancers who got their{" "}
              <span className="gradient-text">story back</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.author} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="card-glass p-6 flex flex-col gap-4 h-full"
                >
                  <Quote size={20} className="text-[var(--accent-primary)] shrink-0" />
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--card-border)]/40">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-emerald-300 font-black text-xs shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)] text-sm">{t.author}</p>
                      <p className="text-[var(--text-muted)] text-xs">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING (FREE) ────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6 bg-[var(--bg-secondary)]">
        <FadeIn>
          <div className="max-w-2xl mx-auto">
            <div className="card-modal p-10 md:p-14 relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(16,185,129,0.17),transparent)] pointer-events-none" />

              <div className="relative">
                <div className="badge mb-5 mx-auto w-fit">
                  <Sparkles size={11} /> Pricing
                </div>

                <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
                  Free.{" "}
                  <span className="gradient-text">Always.</span>
                </h2>
                <p className="text-[var(--text-secondary)] mb-3">
                  No tiers. No credit card. No upsell.
                </p>
                <p className="text-[var(--text-muted)] text-sm mb-8 max-w-sm mx-auto">
                  We believe every developer deserves a professional presence — regardless
                  of whether they can afford a $29/month SaaS subscription.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 max-w-md mx-auto text-left text-sm">
                  {[
                    "Unlimited projects",
                    "Verified testimonials",
                    "Engagement analytics",
                    "Brief inbox + email alerts",
                    "Custom hire-me panel",
                    "Lighthouse perf scores",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Check size={14} className="text-emerald-400 shrink-0" /> {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setAuthMode("signup")}
                  className="btn-primary text-base px-10 py-3"
                >
                  Create your portfolio <ArrowRight size={16} />
                </button>
                <p className="text-[var(--text-muted)] text-xs mt-4">
                  Set up in 5 minutes · No credit card · Cancel nothing (it's free)
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--card-border)]/40 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo iconSize={26} />
          <p className="text-[var(--text-muted)] text-sm">© 2025 DevTree. Built with ❤️ for freelancers.</p>
          <div className="flex items-center gap-4 text-[var(--text-muted)]">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors"><Github size={18} /></a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors"><Linkedin size={18} /></a>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors"><Globe size={18} /></a>
          </div>
        </div>
      </footer>

      {/* ── AUTH MODAL ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSwitch={(m) => setAuthMode(m)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
