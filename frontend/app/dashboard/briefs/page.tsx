"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Archive, Trash2, Check, DollarSign, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { briefApi } from "@/lib/api";

interface Brief {
	id: string;
	fromName: string;
	fromEmail: string;
	fromCompany?: string | null;
	budgetMin?: number | null;
	budgetMax?: number | null;
	currency?: string | null;
	timeline?: string | null;
	scope: string;
	read: boolean;
	archived: boolean;
	createdAt: string;
}

function BriefCard({ brief, onRead, onArchive, onDelete }: {
	brief: Brief;
	onRead: (id: string) => void;
	onArchive: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	const [open, setOpen] = useState(!brief.read);

	const handleOpen = () => {
		setOpen(o => !o);
		if (!brief.read) onRead(brief.id);
	};

	return (
		<motion.div layout className={`card overflow-hidden ${!brief.read ? "border-[var(--accent-primary)]/40" : ""}`}>
			<button onClick={handleOpen} className="w-full text-left p-5 flex items-start justify-between gap-4">
				<div className="flex items-start gap-3 min-w-0">
					{!brief.read && <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />}
					<div className="min-w-0">
						<p className="font-semibold text-sm">{brief.fromName}
							{brief.fromCompany && <span className="text-[var(--text-muted)] font-normal"> · {brief.fromCompany}</span>}
						</p>
						<p className="text-xs text-[var(--text-muted)]">{brief.fromEmail} · {new Date(brief.createdAt).toLocaleDateString()}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 shrink-0">
					{(brief.budgetMin || brief.budgetMax) && (
						<span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
							<DollarSign size={11} />
							{brief.currency ?? "USD"} {brief.budgetMin ?? "?"}{brief.budgetMax ? `–${brief.budgetMax}` : "+"}
						</span>
					)}
					{brief.timeline && (
						<span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
							<Clock size={11} />{brief.timeline}
						</span>
					)}
					{open ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
				</div>
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden"
					>
						<div className="px-5 pb-5 border-t border-[var(--card-border)]">
							<p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed whitespace-pre-line">{brief.scope}</p>
							<div className="flex gap-2 mt-5">
								<a href={`mailto:${brief.fromEmail}?subject=Re: Your project brief`} className="btn-primary text-xs px-4 py-2">
									Reply
								</a>
								<button onClick={() => onArchive(brief.id)} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1">
									<Archive size={13} /> Archive
								</button>
								<button onClick={() => onDelete(brief.id)} className="btn-secondary text-xs px-4 py-2 text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center gap-1">
									<Trash2 size={13} />
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export default function BriefsPage() {
	const { data: session } = useSession();
	const [briefs, setBriefs] = useState<Brief[]>([]);
	const [loading, setLoading] = useState(true);

	const token = session?.accessToken as string;

	useEffect(() => {
		if (!token) return;
		briefApi.getAll(token).then(r => setBriefs(r.data)).catch(console.error).finally(() => setLoading(false));
	}, [token]);

	const handleRead = async (id: string) => {
		await briefApi.markRead(id, token).catch(() => {});
		setBriefs(b => b.map(x => x.id === id ? { ...x, read: true } : x));
	};

	const handleArchive = async (id: string) => {
		await briefApi.archive(id, token).catch(() => {});
		setBriefs(b => b.filter(x => x.id !== id));
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this brief?")) return;
		await briefApi.delete(id, token).catch(() => {});
		setBriefs(b => b.filter(x => x.id !== id));
	};

	const unread = briefs.filter(b => !b.read).length;

	return (
		<div className="max-w-3xl">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
				<h1 className="text-2xl font-black mb-1 flex items-center gap-2">
					<MessageSquare size={22} className="text-[var(--accent-light)]" />
					Brief Inbox
					{unread > 0 && (
						<span className="badge bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white text-xs">{unread}</span>
					)}
				</h1>
				<p className="text-[var(--text-muted)] text-sm mb-8">Qualified project requests from visitors to your profile.</p>
			</motion.div>

			{loading ? (
				<div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" /></div>
			) : briefs.length === 0 ? (
				<div className="card p-12 text-center text-[var(--text-muted)]">
					<MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
					No briefs yet. Share your profile and clients can send you project requests.
				</div>
			) : (
				<div className="space-y-3">
					<AnimatePresence>
						{briefs.map(b => (
							<BriefCard key={b.id} brief={b} onRead={handleRead} onArchive={handleArchive} onDelete={handleDelete} />
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
}
