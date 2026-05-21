"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
	MapPin, Clock, DollarSign, Calendar, ExternalLink, Github,
	Twitter, Linkedin, Globe, Star, GitCommit, CheckCircle,
	ChevronRight, MessageSquare, Shield, Send, Sparkles, Share2, Check,
} from "lucide-react";
import Link from "next/link";
import { profileApi, linkApi } from "@/lib/api";
import { LogoIcon } from "@/components/ui/Logo";
import type { PublicProfile, ProjectLink, Testimonial, AvailabilityStatus } from "@/app/types/profile";

// ─── helpers ───────────────────────────────────────────────────────────────
function perfGrade(score?: number | null): { grade: string; cls: string } | null {
	if (score == null) return null;
	if (score >= 90) return { grade: "A", cls: "perf-A" };
	if (score >= 70) return { grade: "B", cls: "perf-B" };
	if (score >= 50) return { grade: "C", cls: "perf-C" };
	return { grade: "D", cls: "perf-D" };
}

function statusDot(status: string) {
	const map: Record<string, string> = {
		live: "bg-green-400",
		slow: "bg-yellow-400",
		down: "bg-red-400",
		unknown: "bg-gray-500",
	};
	return map[status] ?? "bg-gray-500";
}

const AVAIL: Record<AvailabilityStatus, { text: string; dot: string; tone: string } | null> = {
	available:      { text: "Available for work", dot: "bg-green-400 dot-pulse",  tone: "text-green-300" },
	available_from: { text: "Available soon",     dot: "bg-amber-400 dot-pulse",  tone: "text-amber-300" },
	booked:         { text: "Fully booked",       dot: "bg-red-400",              tone: "text-red-300"   },
	not_specified:  null,
};

// ─── Brief modal ──────────────────────────────────────────────────────────
function BriefModal({ username, onClose }: { username: string; onClose: () => void }) {
	const [form, setForm] = useState({ fromName: "", fromEmail: "", fromCompany: "", scope: "", budgetMin: "", budgetMax: "", timeline: "" });
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [err, setErr] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErr(""); setLoading(true);
		try {
			await profileApi.submitBrief(username, {
				fromName: form.fromName,
				fromEmail: form.fromEmail,
				fromCompany: form.fromCompany || undefined,
				scope: form.scope,
				budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
				budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
				timeline: form.timeline || undefined,
			});
			setSent(true);
		} catch (e: any) {
			setErr(e.message);
		} finally {
			setLoading(false);
		}
	};

	const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setForm(f => ({ ...f, [k]: e.target.value }));

	return (
		<>
			<motion.div
				initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
				className="fixed inset-0 z-40"
				style={{ background: "rgba(2,2,8,0.85)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
				onClick={onClose}
			/>
			<motion.div
				initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
				transition={{ type: "spring", stiffness: 320, damping: 28 }}
				className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
			>
				<div className="card-modal w-full max-w-lg pointer-events-auto p-8 max-h-[90vh] overflow-y-auto">
					{sent ? (
						<div className="text-center py-6">
							<div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
								<CheckCircle size={32} className="text-green-400" />
							</div>
							<h3 className="text-xl font-bold mb-1">Brief sent</h3>
							<p className="text-[var(--text-secondary)] text-sm mb-6">You'll hear back soon.</p>
							<button onClick={onClose} className="btn-primary px-8">Done</button>
						</div>
					) : (
						<>
							<h2 className="text-xl font-bold mb-1">Send a project brief</h2>
							<p className="text-[var(--text-muted)] text-sm mb-6">Share what you're building. Straight to their inbox — no spam.</p>
							<form onSubmit={handleSubmit} className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<input className="input" placeholder="Your name *" value={form.fromName} onChange={set("fromName")} required />
									<input className="input" type="email" placeholder="Email *" value={form.fromEmail} onChange={set("fromEmail")} required />
								</div>
								<input className="input" placeholder="Company (optional)" value={form.fromCompany} onChange={set("fromCompany")} />
								<textarea className="input resize-none h-24" placeholder="Project scope *" value={form.scope} onChange={set("scope")} required />
								<div className="grid grid-cols-2 gap-3">
									<input className="input" type="number" placeholder="Budget min ($)" value={form.budgetMin} onChange={set("budgetMin")} />
									<input className="input" type="number" placeholder="Budget max ($)" value={form.budgetMax} onChange={set("budgetMax")} />
								</div>
								<input className="input" placeholder="Timeline (e.g. 4 weeks)" value={form.timeline} onChange={set("timeline")} />
								{err && <p className="text-red-400 text-sm">{err}</p>}
								<button type="submit" disabled={loading} className="btn-primary w-full">
									{loading ? "Sending…" : <><Send size={14} /> Send brief</>}
								</button>
							</form>
						</>
					)}
				</div>
			</motion.div>
		</>
	);
}

// ─── Share button ─────────────────────────────────────────────────────────
function ShareButton({ username, displayName }: { username: string; displayName: string }) {
	const [copied, setCopied] = useState(false);
	const handle = async () => {
		const url = typeof window !== "undefined" ? window.location.href : "";
		if (navigator.share) {
			try { await navigator.share({ title: `${displayName} on DevTree`, url }); return; } catch {}
		}
		try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
	};
	return (
		<button
			onClick={handle}
			aria-label="Share profile"
			className="w-9 h-9 rounded-full border border-[var(--card-border)] bg-[var(--bg-secondary)]/70 backdrop-blur flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
		>
			{copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
		</button>
	);
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
	const { username } = useParams<{ username: string }>();
	const [profile, setProfile] = useState<PublicProfile | null>(null);
	const [links, setLinks] = useState<ProjectLink[]>([]);
	const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
	const [loading, setLoading] = useState(true);
	const [showBrief, setShowBrief] = useState(false);
	const [roleFilter, setRoleFilter] = useState<string>("All");
	const sessionId = useRef(Math.random().toString(36).slice(2));
	const startTime = useRef(Date.now());
	const openedProjects = useRef<string[]>([]);

	useEffect(() => {
		Promise.all([
			profileApi.getPublic(username),
			linkApi.getPublic(username),
			profileApi.getPublicTestimonials(username),
		]).then(([p, l, t]) => {
			setProfile(p.data.profile);
			setLinks(l.data.links ?? []);
			setTestimonials(t.data ?? []);
		}).catch(console.error).finally(() => setLoading(false));

		return () => {
			profileApi.trackView(username, {
				sessionId: sessionId.current,
				referrer: document.referrer || undefined,
				durationMs: Date.now() - startTime.current,
				projectsOpened: openedProjects.current,
			}).catch(() => {});
		};
	}, [username]);

	const trackOpen = (id: string) => {
		if (!openedProjects.current.includes(id)) openedProjects.current.push(id);
	};

	const roles = ["All", ...Array.from(new Set(links.map(l => l.role)))];
	const filtered = roleFilter === "All" ? links : links.filter(l => l.role === roleFilter);

	if (loading) {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
				<div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
				<p className="text-2xl font-bold">Profile not found</p>
				<Link href="/" className="text-[var(--accent-light)] hover:underline">Go home</Link>
			</div>
		);
	}

	const avail = AVAIL[profile.availabilityStatus];
	const hasSocials = profile.twitterUrl || profile.linkedinUrl || profile.githubUrl || profile.websiteUrl;

	return (
		<div className="min-h-screen bg-[var(--bg-primary)] relative overflow-x-hidden">
			{/* Layered backgrounds */}
			<div className="fixed inset-0 bg-grid pointer-events-none opacity-50" />
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-emerald-700/15 rounded-full blur-3xl" />
				<div className="absolute top-[40%] right-[-200px] w-[420px] h-[420px] bg-teal-700/10 rounded-full blur-3xl" />
			</div>

			{/* Top utility bar */}
			<div className="relative max-w-xl mx-auto px-5 pt-5 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
					<LogoIcon size={22} />
					<span className="text-xs font-semibold tracking-tight">
						<span style={{ fontWeight: 400, color: "rgba(158,200,180,0.7)" }}>Dev</span>
						<span
							style={{
								fontWeight: 700,
								background: "linear-gradient(90deg,#6ee7b7,#5eead4)",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
								backgroundClip: "text",
							}}
						>Tree</span>
					</span>
				</Link>
				<ShareButton username={username} displayName={profile.displayName} />
			</div>

			<div className="relative max-w-xl mx-auto px-5 pt-8 pb-20">

				{/* ── PROFILE HEADER (centered card) ───────────────── */}
				<div className="text-center mb-8 animate-fade-in-up">
					{/* Avatar with animated halo */}
					<div className="relative inline-block mb-5">
						<div className="avatar-halo rounded-full">
							{profile.avatar ? (
								<img
									src={profile.avatar}
									alt={profile.displayName}
									className="w-28 h-28 rounded-full object-cover border-[3px] border-[var(--bg-primary)]"
								/>
							) : (
								<div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl font-black border-[3px] border-[var(--bg-primary)]">
									{profile.displayName[0].toUpperCase()}
								</div>
							)}
						</div>
					</div>

					{/* Name */}
					<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
						{profile.displayName}
					</h1>
					<p className="text-[var(--text-muted)] text-sm font-mono mt-0.5">@{profile.username}</p>

					{/* Headline */}
					{profile.headline && (
						<p className="text-[var(--accent-light)] font-semibold mt-3 text-sm">
							{profile.headline}
						</p>
					)}

					{/* Availability pill — clear of avatar */}
					{avail && (
						<div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-secondary)]/70 border border-[var(--card-border)] backdrop-blur text-xs">
							<span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
							<span className={avail.tone}>{avail.text}</span>
						</div>
					)}

					{/* Bio */}
					{profile.bio && (
						<p className="text-[var(--text-secondary)] text-sm mt-4 leading-relaxed max-w-md mx-auto">
							{profile.bio}
						</p>
					)}

					{/* Location / timezone */}
					{(profile.location || profile.timezone) && (
						<div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
							{profile.location && <span className="flex items-center gap-1"><MapPin size={11} />{profile.location}</span>}
							{profile.timezone && <span className="flex items-center gap-1"><Clock size={11} />{profile.timezone}</span>}
						</div>
					)}

					{/* Socials */}
					{hasSocials && (
						<div className="flex justify-center gap-2 mt-5">
							{profile.twitterUrl && (
								<a href={profile.twitterUrl} target="_blank" rel="noopener" className="w-9 h-9 rounded-full border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:border-[var(--accent-primary)] transition-all">
									<Twitter size={15} />
								</a>
							)}
							{profile.linkedinUrl && (
								<a href={profile.linkedinUrl} target="_blank" rel="noopener" className="w-9 h-9 rounded-full border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:border-[var(--accent-primary)] transition-all">
									<Linkedin size={15} />
								</a>
							)}
							{profile.githubUrl && (
								<a href={profile.githubUrl} target="_blank" rel="noopener" className="w-9 h-9 rounded-full border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:border-[var(--accent-primary)] transition-all">
									<Github size={15} />
								</a>
							)}
							{profile.websiteUrl && (
								<a href={profile.websiteUrl} target="_blank" rel="noopener" className="w-9 h-9 rounded-full border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:border-[var(--accent-primary)] transition-all">
									<Globe size={15} />
								</a>
							)}
						</div>
					)}
				</div>

				{/* ── HIRE-ME STRIP ─────────────────────────────────────── */}
				{(profile.hourlyRateMin || profile.servicesOffered.length > 0 || profile.calendlyUrl) && (
					<div
						className="mb-6 card-modal p-4 animate-fade-in-up"
						style={{ animationDelay: "0.1s", animationFillMode: "both" }}
					>
						{profile.hourlyRateMin && (
							<div className="flex items-center justify-between mb-2">
								<span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Rate</span>
								<span className="font-bold text-[var(--text-primary)] text-sm">
									{profile.currency ?? "USD"} {profile.hourlyRateMin}
									{profile.hourlyRateMax && `–${profile.hourlyRateMax}`}
									<span className="text-[var(--text-muted)] font-normal">/hr</span>
								</span>
							</div>
						)}
						{profile.servicesOffered.length > 0 && (
							<div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--card-border)]/60">
								{profile.servicesOffered.map(s => (
									<span key={s} className="badge text-[10px]">{s}</span>
								))}
							</div>
						)}
					</div>
				)}

				{/* ── PRIMARY CTAs (stacked Linktree-style) ─────────────── */}
				<div
					className="space-y-3 mb-10 animate-fade-in-up"
					style={{ animationDelay: "0.15s", animationFillMode: "both" }}
				>
					{profile.calendlyUrl && (
						<a
							href={profile.calendlyUrl}
							target="_blank" rel="noopener"
							className="link-tile flex items-center gap-3 group"
						>
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
								<Calendar size={18} className="text-white" />
							</div>
							<div className="flex-1 text-left">
								<div className="font-bold text-[var(--text-primary)]">Book a call</div>
								<div className="text-xs text-[var(--text-muted)]">Free 15-min intro</div>
							</div>
							<ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-light)] group-hover:translate-x-0.5 transition-all" />
						</a>
					)}

					<button
						onClick={() => setShowBrief(true)}
						className="link-tile flex items-center gap-3 group w-full"
					>
						<div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--card-border)] flex items-center justify-center shrink-0">
							<MessageSquare size={18} className="text-[var(--accent-light)]" />
						</div>
						<div className="flex-1 text-left">
							<div className="font-bold text-[var(--text-primary)]">Send a project brief</div>
							<div className="text-xs text-[var(--text-muted)]">Describe what you need</div>
						</div>
						<ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-light)] group-hover:translate-x-0.5 transition-all" />
					</button>
				</div>

				{/* ── PROJECTS SECTION HEADING ──────────────────────── */}
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)]">
						Featured projects
					</h2>
					<span className="text-xs text-[var(--text-muted)]">{links.length} live</span>
				</div>

				{/* ── ROLE FILTER ─────────────────────────────────── */}
				{roles.length > 2 && (
					<div className="flex gap-1.5 mb-5 flex-wrap">
						{roles.map(r => (
							<button
								key={r}
								onClick={() => setRoleFilter(r)}
								className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
									roleFilter === r
										? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-lg shadow-emerald-500/30"
										: "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
								}`}
							>
								{r}
							</button>
						))}
					</div>
				)}

				{/* ── PROJECT TILES ──────────────────────────────── */}
				<div className="space-y-3 mb-12">
					<AnimatePresence mode="popLayout">
						{filtered.map((link, i) => {
							const pg = perfGrade(link.lighthousePerformance);
							const hasCaseStudy = !!(link.problemStatement || link.outcomeSummary || link.caseStudyBody);

							return (
								<motion.div
									key={link.id}
									layout
									initial={{ opacity: 0, y: 16 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.96 }}
									transition={{ delay: i * 0.05, duration: 0.4 }}
									className="link-tile group p-0 overflow-hidden"
									onClick={() => trackOpen(link.id)}
								>
									{/* Screenshot */}
									{link.screenshotUrl && (
										<div className="relative h-36 overflow-hidden bg-[var(--bg-tertiary)]">
											<img src={link.screenshotUrl} alt={link.title} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
											<div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] via-transparent to-transparent" />
											<div className="absolute top-3 right-3 flex gap-1.5">
												{pg && (
													<span className={`badge text-[10px] font-mono backdrop-blur-md ${pg.cls}`} title="Lighthouse performance">
														{pg.grade}
													</span>
												)}
												<span className="badge text-[10px] backdrop-blur-md">{link.role}</span>
											</div>
										</div>
									)}

									<div className="p-5">
										<div className="flex items-center gap-2 mb-2">
											<span className={`w-2 h-2 rounded-full shrink-0 ${statusDot(link.status)}`} />
											<h3 className="font-bold text-[var(--text-primary)] truncate flex-1">{link.title}</h3>
										</div>

										{link.description && (
											<p className="text-[var(--text-secondary)] text-sm mb-3 line-clamp-2 leading-relaxed">{link.description}</p>
										)}

										{link.techStack.length > 0 && (
											<div className="flex flex-wrap gap-1.5 mb-3">
												{link.techStack.slice(0, 6).map(t => (
													<span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-[var(--text-muted)] font-mono">{t}</span>
												))}
											</div>
										)}

										<div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)] mb-3">
											{link.githubStars != null && (
												<span className="flex items-center gap-1"><Star size={11} />{link.githubStars}</span>
											)}
											{link.lastCommitDate && (
												<span className="flex items-center gap-1"><GitCommit size={11} />{new Date(link.lastCommitDate).toLocaleDateString()}</span>
											)}
										</div>

										<div className="flex gap-2">
											{link.url && (
												<a
													href={link.url}
													target="_blank"
													rel="noopener"
													onClick={(e) => { e.stopPropagation(); linkApi.track(link.id).catch(() => {}); }}
													className="btn-primary text-xs px-4 py-2 flex-1 justify-center"
												>
													<ExternalLink size={12} /> Visit
												</a>
											)}
											{link.githubUrl && (
												<a href={link.githubUrl} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="btn-secondary text-xs px-3 py-2" aria-label="GitHub">
													<Github size={13} />
												</a>
											)}
											{hasCaseStudy && (
												<Link
													href={`/u/${username}/projects/${link.id}`}
													onClick={() => trackOpen(link.id)}
													className="btn-secondary text-xs px-4 py-2 flex items-center gap-1"
												>
													Case study <ChevronRight size={12} />
												</Link>
											)}
										</div>
									</div>
								</motion.div>
							);
						})}
					</AnimatePresence>

					{filtered.length === 0 && (
						<div className="text-center py-12 text-[var(--text-muted)] text-sm">No projects yet.</div>
					)}
				</div>

				{/* ── TESTIMONIALS ────────────────────────────────── */}
				{testimonials.length > 0 && (
					<motion.section
						initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
						className="mb-12"
					>
						<h2 className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-4 flex items-center gap-2">
							<Shield size={14} className="text-[var(--accent-light)]" />
							What clients say
						</h2>
						<div className="space-y-3">
							{testimonials.map((t) => (
								<div key={t.id} className="card-modal p-5">
									<p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3 italic">"{t.quote}"</p>
									<div className="flex items-center gap-3 pt-3 border-t border-[var(--card-border)]/60">
										{t.authorAvatar ? (
											<img src={t.authorAvatar} className="w-8 h-8 rounded-full" alt="" />
										) : (
											<div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
												{t.authorName[0]}
											</div>
										)}
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold flex items-center gap-1.5">
												<span className="truncate">{t.authorName}</span>
												{t.verified && <span title="Verified"><CheckCircle size={13} className="text-green-400 shrink-0" /></span>}
											</p>
											{(t.authorRole || t.authorCompany) && (
												<p className="text-[11px] text-[var(--text-muted)] truncate">
													{[t.authorRole, t.authorCompany].filter(Boolean).join(" · ")}
												</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</motion.section>
				)}

				{/* ── FOOTER — DevTree attribution ─────────────────── */}
				<div className="text-center pt-6 border-t border-[var(--card-border)]/40">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
					>
						<LogoIcon size={18} />
						<span>Build your own portfolio — free on </span>
						<span
							style={{
								fontWeight: 700,
								background: "linear-gradient(90deg,#6ee7b7,#5eead4)",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
								backgroundClip: "text",
							}}
						>DevTree</span>
					</Link>
				</div>
			</div>

			{/* Brief modal */}
			<AnimatePresence>
				{showBrief && <BriefModal username={username} onClose={() => setShowBrief(false)} />}
			</AnimatePresence>
		</div>
	);
}
