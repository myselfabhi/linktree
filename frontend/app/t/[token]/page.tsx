"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Star, Quote } from "lucide-react";
import { testimonialApi } from "@/lib/api";

interface FormData {
	profile: { username: string; displayName: string; avatar?: string };
	requestedFor?: string;
}

export default function TestimonialSubmissionPage() {
	const { token } = useParams<{ token: string }>();
	const [meta, setMeta] = useState<FormData | null>(null);
	const [loadError, setLoadError] = useState("");
	const [loading, setLoading] = useState(true);

	const [form, setForm] = useState({
		quote: "", authorName: "", authorRole: "", authorCompany: "", authorLinkedIn: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [submitError, setSubmitError] = useState("");

	useEffect(() => {
		testimonialApi.getSubmitForm(token)
			.then(r => setMeta(r.data))
			.catch(e => setLoadError(e.message))
			.finally(() => setLoading(false));
	}, [token]);

	const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setForm(f => ({ ...f, [k]: e.target.value }));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true); setSubmitError("");
		try {
			await testimonialApi.submit(token, form);
			setSubmitted(true);
		} catch (err: any) {
			setSubmitError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
				<Loader2 size={28} className="animate-spin text-[var(--accent-primary)]" />
			</div>
		);
	}

	if (loadError || !meta) {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4 px-4 text-center">
				<div className="text-5xl mb-2">😕</div>
				<h1 className="text-xl font-bold">This link is invalid or has already been used</h1>
				<p className="text-[var(--text-muted)] text-sm">{loadError}</p>
			</div>
		);
	}

	if (submitted) {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4 px-4 text-center">
				<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
					<CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
					<h1 className="text-2xl font-black mb-2">Testimonial submitted!</h1>
					<p className="text-[var(--text-secondary)] text-sm max-w-sm">
						{meta.profile.displayName} will review it and publish it to their profile. Thank you!
					</p>
				</motion.div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-16">
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-700/10 rounded-full blur-3xl" />
			</div>

			<motion.div
				initial={{ opacity: 0, y: 24 }}
				animate={{ opacity: 1, y: 0 }}
				className="card-glass w-full max-w-md p-8 relative"
			>
				{/* Profile info */}
				<div className="flex items-center gap-3 mb-6">
					{meta.profile.avatar ? (
						<img src={meta.profile.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
					) : (
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl font-black">
							{meta.profile.displayName[0]}
						</div>
					)}
					<div>
						<p className="font-bold">{meta.profile.displayName}</p>
						<p className="text-xs text-[var(--text-muted)]">@{meta.profile.username} · requests your testimonial</p>
					</div>
				</div>

				{meta.requestedFor && (
					<p className="text-sm text-[var(--text-muted)] mb-5 italic">
						Sent to: {meta.requestedFor}
					</p>
				)}

				<div className="badge mb-5">
					<Quote size={11} /> Your words will be shown with a verified badge
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="text-xs text-[var(--text-muted)] mb-1 block">Your testimonial *</label>
						<textarea
							className="input resize-none h-28"
							placeholder="Share your experience working with them…"
							value={form.quote}
							onChange={set("quote")}
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Your name *</label>
							<input className="input" placeholder="Jane Smith" value={form.authorName} onChange={set("authorName")} required />
						</div>
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Your role</label>
							<input className="input" placeholder="Product Manager" value={form.authorRole} onChange={set("authorRole")} />
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Company</label>
							<input className="input" placeholder="Acme Inc." value={form.authorCompany} onChange={set("authorCompany")} />
						</div>
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">LinkedIn URL</label>
							<input className="input" placeholder="https://linkedin.com/in/…" value={form.authorLinkedIn} onChange={set("authorLinkedIn")} />
						</div>
					</div>

					{submitError && (
						<p className="text-red-400 text-sm">{submitError}</p>
					)}

					<button type="submit" disabled={submitting} className="btn-primary w-full">
						{submitting ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={15} /> Submit testimonial</>}
					</button>
				</form>

				<p className="text-center text-xs text-[var(--text-muted)] mt-4">
					Your testimonial will only appear after {meta.profile.displayName} approves it.
				</p>
			</motion.div>
		</div>
	);
}
