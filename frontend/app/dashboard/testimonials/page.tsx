"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, Trash2, Link2, Copy, CheckCircle, Clock, Loader2 } from "lucide-react";
import { testimonialApi } from "@/lib/api";

interface Testimonial {
	id: string;
	quote: string;
	authorName: string;
	authorRole?: string | null;
	authorCompany?: string | null;
	approved: boolean;
	verified: boolean;
	requestToken?: string | null;
	requestedFor?: string | null;
	submittedAt: string;
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3003";

export default function TestimonialsPage() {
	const { data: session } = useSession();
	const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
	const [loading, setLoading] = useState(true);
	const [requestFor, setRequestFor] = useState("");
	const [requesting, setRequesting] = useState(false);
	const [newToken, setNewToken] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const token = session?.accessToken as string;

	useEffect(() => {
		if (!token) return;
		testimonialApi.getAll(token).then(r => setTestimonials(r.data)).catch(console.error).finally(() => setLoading(false));
	}, [token]);

	const handleRequest = async () => {
		if (!requestFor.trim()) return;
		setRequesting(true);
		try {
			const r = await testimonialApi.request(requestFor.trim(), token);
			setNewToken(r.data.requestToken);
			setRequestFor("");
		} catch (e: any) {
			alert(e.message);
		} finally {
			setRequesting(false);
		}
	};

	const handleApprove = async (id: string) => {
		await testimonialApi.approve(id, token);
		setTestimonials(t => t.map(x => x.id === id ? { ...x, approved: true } : x));
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this testimonial?")) return;
		await testimonialApi.delete(id, token);
		setTestimonials(t => t.filter(x => x.id !== id));
	};

	const copyLink = (t: string) => {
		const url = `${window.location.origin}/t/${t}`;
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const pending   = testimonials.filter(t => !t.approved && t.quote);
	const approved  = testimonials.filter(t => t.approved);
	const requested = testimonials.filter(t => !t.quote && t.requestToken);

	return (
		<div className="max-w-3xl">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
				<h1 className="text-2xl font-black mb-1 flex items-center gap-2">
					<Shield size={22} className="text-[var(--accent-light)]" />
					Testimonials
				</h1>
				<p className="text-[var(--text-muted)] text-sm mb-8">Request and manage verified client testimonials.</p>
			</motion.div>

			{/* Request form */}
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6 mb-8">
				<h2 className="font-bold mb-3">Request a testimonial</h2>
				<p className="text-sm text-[var(--text-muted)] mb-4">Enter your client's name or email so you remember who you sent it to. We'll give you a link to share.</p>
				<div className="flex gap-3">
					<input
						className="input flex-1"
						placeholder="Client name or email"
						value={requestFor}
						onChange={e => setRequestFor(e.target.value)}
						onKeyDown={e => e.key === "Enter" && handleRequest()}
					/>
					<button onClick={handleRequest} disabled={requesting || !requestFor.trim()} className="btn-primary px-5 shrink-0">
						{requesting ? <Loader2 size={16} className="animate-spin" /> : <><Link2 size={14} /> Generate link</>}
					</button>
				</div>

				{newToken && (
					<motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
						<CheckCircle size={16} className="text-green-400 shrink-0" />
						<code className="text-sm text-green-300 flex-1 break-all">{window.location.origin}/t/{newToken}</code>
						<button onClick={() => copyLink(newToken)} className="shrink-0 text-green-400 hover:text-green-300">
							{copied ? <Check size={16} /> : <Copy size={16} />}
						</button>
					</motion.div>
				)}
			</motion.div>

			{loading ? (
				<div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" /></div>
			) : (
				<>
					{/* Pending approval */}
					{pending.length > 0 && (
						<section className="mb-8">
							<h2 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
								<Clock size={14} /> Awaiting your approval ({pending.length})
							</h2>
							<div className="space-y-3">
								<AnimatePresence>
									{pending.map(t => (
										<motion.div key={t.id} layout exit={{ opacity: 0, height: 0 }} className="card p-5">
											<p className="text-sm text-[var(--text-secondary)] mb-3 italic">"{t.quote}"</p>
											<p className="text-sm font-semibold">{t.authorName}</p>
											{(t.authorRole || t.authorCompany) && (
												<p className="text-xs text-[var(--text-muted)]">{[t.authorRole, t.authorCompany].filter(Boolean).join(" · ")}</p>
											)}
											<div className="flex gap-2 mt-4">
												<button onClick={() => handleApprove(t.id)} className="btn-primary text-xs px-4 py-2">
													<Check size={13} /> Approve
												</button>
												<button onClick={() => handleDelete(t.id)} className="btn-secondary text-xs px-4 py-2 hover:text-red-400">
													<Trash2 size={13} />
												</button>
											</div>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						</section>
					)}

					{/* Approved */}
					{approved.length > 0 && (
						<section className="mb-8">
							<h2 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
								<CheckCircle size={14} className="text-green-400" /> Published ({approved.length})
							</h2>
							<div className="space-y-3">
								{approved.map(t => (
									<div key={t.id} className="card-glass p-4 flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0">
											<p className="text-sm text-[var(--text-secondary)] mb-1 italic line-clamp-2">"{t.quote}"</p>
											<p className="text-xs font-semibold">{t.authorName}{t.authorCompany ? ` · ${t.authorCompany}` : ""}</p>
										</div>
										<button onClick={() => handleDelete(t.id)} className="text-[var(--text-muted)] hover:text-red-400 shrink-0 transition-colors">
											<Trash2 size={15} />
										</button>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Pending submission (sent but not yet filled) */}
					{requested.length > 0 && (
						<section>
							<h2 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-3">Sent, awaiting response ({requested.length})</h2>
							<div className="space-y-2">
								{requested.map(t => (
									<div key={t.id} className="card-glass p-3 flex items-center justify-between gap-4">
										<span className="text-sm text-[var(--text-muted)] truncate">{t.requestedFor || "Anonymous"}</span>
										<div className="flex gap-2">
											<button onClick={() => copyLink(t.requestToken!)} className="text-xs text-[var(--accent-light)] hover:underline flex items-center gap-1">
												<Copy size={12} /> Copy link
											</button>
											<button onClick={() => handleDelete(t.id)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
												<Trash2 size={14} />
											</button>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{testimonials.length === 0 && (
						<div className="text-center py-12 text-[var(--text-muted)]">
							No testimonials yet. Generate a link and send it to a past client.
						</div>
					)}
				</>
			)}
		</div>
	);
}
