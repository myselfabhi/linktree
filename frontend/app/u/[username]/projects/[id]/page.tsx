"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
	ArrowLeft, ExternalLink, Github, Users, Play,
	Target, TrendingUp, Wrench, User2, Star, GitCommit, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { linkApi } from "@/lib/api";
import type { ProjectLink } from "@/app/types/profile";

function perfGrade(score?: number | null) {
	if (score == null) return null;
	if (score >= 90) return { grade: "A", cls: "perf-A" };
	if (score >= 70) return { grade: "B", cls: "perf-B" };
	if (score >= 50) return { grade: "C", cls: "perf-C" };
	return { grade: "D", cls: "perf-D" };
}

export default function ProjectDetailPage() {
	const { username, id } = useParams<{ username: string; id: string }>();
	const [link, setLink] = useState<ProjectLink | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		linkApi.getPublicOne(username, id)
			.then(r => setLink(r.data.link))
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [username, id]);

	if (loading) {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
				<div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
			</div>
		);
	}

	if (!link) {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
				<p className="text-xl font-bold">Project not found</p>
				<Link href={`/u/${username}`} className="text-[var(--accent-light)] hover:underline">← Back to profile</Link>
			</div>
		);
	}

	const pg = perfGrade(link.lighthousePerformance);

	return (
		<div className="min-h-screen bg-[var(--bg-primary)]">
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-700/8 rounded-full blur-3xl" />
			</div>

			<div className="relative max-w-3xl mx-auto px-4 py-12">
				{/* Back */}
				<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
					<Link href={`/u/${username}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
						<ArrowLeft size={14} /> Back to {username}'s profile
					</Link>
				</motion.div>

				{/* Hero screenshot */}
				{link.screenshotUrl && (
					<motion.div
						initial={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="rounded-2xl overflow-hidden mb-10 ring-1 ring-[var(--card-border)]"
					>
						<img src={link.screenshotUrl} alt={link.title} className="w-full object-cover" />
					</motion.div>
				)}

				{/* Title + meta */}
				<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
					<div className="flex flex-wrap items-start justify-between gap-4 mb-4">
						<h1 className="text-3xl md:text-4xl font-black">{link.title}</h1>
						<div className="flex gap-2 flex-wrap">
							{pg && <span className={`badge font-mono text-sm ${pg.cls}`} title="Lighthouse performance">Perf {pg.grade}</span>}
							<span className="badge">{link.role}</span>
						</div>
					</div>

					{link.description && (
						<p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">{link.description}</p>
					)}

					{/* Tech stack */}
					{link.techStack.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-6">
							{link.techStack.map(t => (
								<span key={t} className="text-sm px-3 py-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-[var(--text-secondary)]">{t}</span>
							))}
						</div>
					)}

					{/* Action buttons */}
					<div className="flex flex-wrap gap-3 mb-10">
						{link.url && (
							<a
								href={link.url}
								target="_blank"
								rel="noopener"
								onClick={() => linkApi.track(link.id).catch(() => {})}
								className="btn-primary px-6 py-2.5"
							>
								<ExternalLink size={14} /> View live site
							</a>
						)}
						{link.githubUrl && (
							<a href={link.githubUrl} target="_blank" rel="noopener" className="btn-secondary px-6 py-2.5">
								<Github size={14} /> Source code
							</a>
						)}
						{link.walkthroughUrl && (
							<a href={link.walkthroughUrl} target="_blank" rel="noopener" className="btn-secondary px-6 py-2.5">
								<Play size={14} /> Watch walkthrough
							</a>
						)}
					</div>
				</motion.div>

				{/* Stats row */}
				{(link.githubStars != null || link.teamSize || link.clientCompany || link.lastCommitDate) && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15 }}
						className="card-glass p-4 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
					>
						{link.githubStars != null && (
							<div>
								<p className="text-2xl font-black gradient-text flex items-center justify-center gap-1"><Star size={16} />{link.githubStars}</p>
								<p className="text-xs text-[var(--text-muted)] mt-0.5">GitHub stars</p>
							</div>
						)}
						{link.teamSize && (
							<div>
								<p className="text-2xl font-black gradient-text flex items-center justify-center gap-1"><Users size={16} />{link.teamSize}</p>
								<p className="text-xs text-[var(--text-muted)] mt-0.5">Team size</p>
							</div>
						)}
						{link.clientCompany && (
							<div>
								<p className="text-sm font-bold text-[var(--text-primary)] truncate">{link.clientCompany}</p>
								<p className="text-xs text-[var(--text-muted)] mt-0.5">Client</p>
							</div>
						)}
						{link.lastCommitDate && (
							<div>
								<p className="text-sm font-bold text-[var(--text-primary)]">
									{new Date(link.lastCommitDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
								</p>
								<p className="text-xs text-[var(--text-muted)] mt-0.5">Last commit</p>
							</div>
						)}
					</motion.div>
				)}

				{/* Lighthouse panel */}
				{(link.lighthousePerformance != null || link.lighthouseAccessibility != null) && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="card p-5 mb-8"
					>
						<h2 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-4">Lighthouse scores</h2>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							{[
								["Performance", link.lighthousePerformance],
								["Accessibility", link.lighthouseAccessibility],
								["Best Practices", link.lighthouseBestPractices],
								["SEO", link.lighthouseSEO],
							].map(([label, score]) => score != null && (
								<div key={label as string} className="text-center">
									<div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl font-black mx-auto mb-1 ${perfGrade(score as number)?.cls ?? ""}`}>
										{score}
									</div>
									<p className="text-xs text-[var(--text-muted)]">{label}</p>
								</div>
							))}
						</div>
					</motion.div>
				)}

				{/* Case study sections */}
				<div className="space-y-6">
					{link.problemStatement && (
						<motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
							<h2 className="flex items-center gap-2 font-bold text-[var(--text-primary)] mb-3">
								<Target size={16} className="text-[var(--accent-light)]" /> Problem
							</h2>
							<p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">{link.problemStatement}</p>
						</motion.div>
					)}

					{link.myContribution && (
						<motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
							<h2 className="flex items-center gap-2 font-bold text-[var(--text-primary)] mb-3">
								<Wrench size={16} className="text-[var(--accent-light)]" /> My contribution
							</h2>
							<p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">{link.myContribution}</p>
						</motion.div>
					)}

					{(link.outcomeSummary || link.outcomeMetric) && (
						<motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
							<h2 className="flex items-center gap-2 font-bold text-[var(--text-primary)] mb-3">
								<TrendingUp size={16} className="text-[var(--accent-light)]" /> Outcome
							</h2>
							{link.outcomeMetric && (
								<p className="text-3xl font-black gradient-text mb-2">{link.outcomeMetric}</p>
							)}
							{link.outcomeSummary && (
								<p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">{link.outcomeSummary}</p>
							)}
						</motion.div>
					)}

					{link.caseStudyBody && (
						<motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
							<h2 className="flex items-center gap-2 font-bold text-[var(--text-primary)] mb-3">
								<ChevronRight size={16} className="text-[var(--accent-light)]" /> Full case study
							</h2>
							<div className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">{link.caseStudyBody}</div>
						</motion.div>
					)}
				</div>

				{/* Back to profile */}
				<div className="mt-12 text-center">
					<Link href={`/u/${username}`} className="text-[var(--text-muted)] hover:text-[var(--accent-light)] text-sm transition-colors inline-flex items-center gap-1">
						<ArrowLeft size={13} /> Back to {username}'s profile
					</Link>
				</div>
			</div>
		</div>
	);
}
