"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, MousePointer, MessageSquare, Shield, TrendingUp, ExternalLink, ArrowRight } from "lucide-react";
import { engagementApi, profileApi } from "@/lib/api";

interface Overview {
	totalViews: number;
	last30Views: number;
	totalClicks: number;
	unreadBriefs: number;
	pendingTestimonials: number;
	topProjects: { id: string; title: string; clicks: number }[];
	viewsTimeline: { date: string; count: number }[];
	referrers: { referrer: string; count: number }[];
}

function StatCard({ icon: Icon, label, value, sub, href, color = "text-[var(--accent-light)]" }: {
	icon: React.FC<{ size?: number; className?: string }>;
	label: string;
	value: number | string;
	sub?: string;
	href?: string;
	color?: string;
}) {
	const content = (
		<motion.div whileHover={href ? { y: -3 } : {}} className={`card p-5 flex items-start gap-4 ${href ? "cursor-pointer" : ""}`}>
			<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/25 flex items-center justify-center shrink-0">
				<Icon size={18} className={color} />
			</div>
			<div>
				<p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
				<p className="text-sm text-[var(--text-muted)]">{label}</p>
				{sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
			</div>
			{href && <ArrowRight size={14} className="ml-auto text-[var(--text-muted)] self-center" />}
		</motion.div>
	);
	return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardOverview() {
	const { data: session } = useSession();
	const [overview, setOverview] = useState<Overview | null>(null);
	const [profile, setProfile] = useState<{ username: string; displayName: string } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!session?.accessToken) return;
		Promise.all([
			engagementApi.overview(session.accessToken as string),
			profileApi.get(session.accessToken as string),
		]).then(([e, p]) => {
			setOverview(e.data);
			setProfile(p.data.profile);
		}).catch(console.error).finally(() => setLoading(false));
	}, [session]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
				<h1 className="text-2xl font-black mb-1">
					{profile ? `Hey, ${profile.displayName.split(" ")[0]} 👋` : "Dashboard"}
				</h1>
				{profile && (
					<p className="text-[var(--text-muted)] text-sm mb-8">
						Your link:{" "}
						<Link href={`/u/${profile.username}`} target="_blank" className="text-[var(--accent-light)] hover:underline inline-flex items-center gap-1">
							/u/{profile.username} <ExternalLink size={11} />
						</Link>
					</p>
				)}
			</motion.div>

			{overview ? (
				<>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
						<StatCard icon={Eye}           label="Total views"    value={overview.totalViews}   sub={`${overview.last30Views} last 30d`} />
						<StatCard icon={MousePointer}  label="Link clicks"    value={overview.totalClicks} />
						<StatCard icon={MessageSquare} label="New briefs"     value={overview.unreadBriefs} href="/dashboard/briefs" color="text-yellow-400" />
						<StatCard icon={Shield}        label="Pending testimonials" value={overview.pendingTestimonials} href="/dashboard/testimonials" color="text-green-400" />
					</div>

					{overview.topProjects.length > 0 && (
						<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 mb-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="font-bold">Top projects by clicks</h2>
								<Link href="/dashboard/links" className="text-xs text-[var(--accent-light)] hover:underline flex items-center gap-1">
									All <ArrowRight size={12} />
								</Link>
							</div>
							<div className="space-y-3">
								{overview.topProjects.map((p, i) => (
									<div key={p.id} className="flex items-center gap-3">
										<span className="text-sm font-mono text-[var(--text-muted)] w-4 shrink-0">{i + 1}</span>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">{p.title}</p>
											<div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full mt-1 overflow-hidden">
												<div
													className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
													style={{ width: `${Math.min(100, (p.clicks / Math.max(...overview.topProjects.map(x => x.clicks))) * 100)}%` }}
												/>
											</div>
										</div>
										<span className="text-sm font-bold shrink-0">{p.clicks}</span>
									</div>
								))}
							</div>
						</motion.div>
					)}

					{overview.viewsTimeline.length > 0 && (
						<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 mb-6">
							<h2 className="font-bold mb-4 flex items-center gap-2">
								<TrendingUp size={16} className="text-[var(--accent-light)]" />
								Views — last 30 days
							</h2>
							<div className="flex items-end gap-0.5 h-20">
								{overview.viewsTimeline.map(({ date, count }) => {
									const max = Math.max(...overview.viewsTimeline.map(v => v.count), 1);
									return (
										<div
											key={date}
											title={`${date}: ${count}`}
											className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-sm opacity-80 hover:opacity-100 transition-opacity cursor-default min-w-0"
											style={{ height: `${Math.max(4, (count / max) * 80)}px` }}
										/>
									);
								})}
							</div>
						</motion.div>
					)}

					{overview.referrers.length > 0 && (
						<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
							<h2 className="font-bold mb-4">Top referrers</h2>
							<div className="space-y-2">
								{overview.referrers.slice(0, 6).map(r => (
									<div key={r.referrer} className="flex justify-between text-sm">
										<span className="text-[var(--text-secondary)] truncate">{r.referrer}</span>
										<span className="font-medium shrink-0 ml-4">{r.count}</span>
									</div>
								))}
							</div>
						</motion.div>
					)}
				</>
			) : (
				<div className="card p-8 text-center text-[var(--text-muted)]">
					No engagement data yet — share your profile link to get started.
				</div>
			)}
		</div>
	);
}
