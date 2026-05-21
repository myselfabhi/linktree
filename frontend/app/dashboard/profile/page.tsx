"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2, Settings, User, Briefcase, Link2, Bot } from "lucide-react";
import { profileApi, bioTemplateApi } from "@/lib/api";

const AVAILABILITY_OPTIONS = [
	{ value: "available",      label: "Available for work" },
	{ value: "available_from", label: "Available soon" },
	{ value: "booked",         label: "Fully booked" },
	{ value: "not_specified",  label: "Not specified" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR"];

export default function ProfileSettingsPage() {
	const { data: session } = useSession();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [tab, setTab] = useState<"identity" | "hireme" | "socials">("identity");

	// Bio template wizard
	const [wizardOpen, setWizardOpen] = useState(false);
	const [wizardAnswers, setWizardAnswers] = useState({ role: "", yearsExp: "", specialty: "" });
	const [generatingBio, setGeneratingBio] = useState(false);

	const [form, setForm] = useState({
		username: "", displayName: "", bio: "", font: "",
		// Hire-me
		headline: "", location: "", timezone: "",
		availabilityStatus: "not_specified",
		hourlyRateMin: "", hourlyRateMax: "",
		projectRateMin: "", projectRateMax: "",
		currency: "USD",
		calendlyUrl: "", contactEmail: "",
		servicesOffered: [] as string[],
		// Socials
		twitterUrl: "", linkedinUrl: "", githubUrl: "", websiteUrl: "",
	});
	const [serviceInput, setServiceInput] = useState("");

	const token = session?.accessToken as string;

	useEffect(() => {
		if (!token) return;
		profileApi.get(token).then(r => {
			const p = r.data.profile;
			if (!p) { router.push("/dashboard"); return; }
			setForm({
				username: p.username ?? "",
				displayName: p.displayName ?? "",
				bio: p.bio ?? "",
				font: p.font ?? "",
				headline: p.headline ?? "",
				location: p.location ?? "",
				timezone: p.timezone ?? "",
				availabilityStatus: p.availabilityStatus ?? "not_specified",
				hourlyRateMin: p.hourlyRateMin?.toString() ?? "",
				hourlyRateMax: p.hourlyRateMax?.toString() ?? "",
				projectRateMin: p.projectRateMin?.toString() ?? "",
				projectRateMax: p.projectRateMax?.toString() ?? "",
				currency: p.currency ?? "USD",
				calendlyUrl: p.calendlyUrl ?? "",
				contactEmail: p.contactEmail ?? "",
				servicesOffered: p.servicesOffered ?? [],
				twitterUrl: p.twitterUrl ?? "",
				linkedinUrl: p.linkedinUrl ?? "",
				githubUrl: p.githubUrl ?? "",
				websiteUrl: p.websiteUrl ?? "",
			});
		}).catch(console.error).finally(() => setLoading(false));
	}, [token, router]);

	const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
		setForm(f => ({ ...f, [k]: e.target.value }));

	const handleSave = async () => {
		setSaving(true); setSaved(false);
		try {
			const payload: Record<string, unknown> = {
				username: form.username,
				displayName: form.displayName,
				bio: form.bio,
				font: form.font,
				headline: form.headline,
				location: form.location,
				timezone: form.timezone,
				availabilityStatus: form.availabilityStatus,
				hourlyRateMin: form.hourlyRateMin ? Number(form.hourlyRateMin) : null,
				hourlyRateMax: form.hourlyRateMax ? Number(form.hourlyRateMax) : null,
				projectRateMin: form.projectRateMin ? Number(form.projectRateMin) : null,
				projectRateMax: form.projectRateMax ? Number(form.projectRateMax) : null,
				currency: form.currency,
				calendlyUrl: form.calendlyUrl || null,
				contactEmail: form.contactEmail || null,
				servicesOffered: form.servicesOffered,
				twitterUrl: form.twitterUrl || null,
				linkedinUrl: form.linkedinUrl || null,
				githubUrl: form.githubUrl || null,
				websiteUrl: form.websiteUrl || null,
			};
			await profileApi.update(payload, token);
			setSaved(true);
			setTimeout(() => setSaved(false), 2500);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setSaving(false);
		}
	};

	const handleGenerateBio = async () => {
		setGeneratingBio(true);
		try {
			const r = await bioTemplateApi.generate(wizardAnswers, token);
			setForm(f => ({ ...f, bio: r.data.bio }));
			setWizardOpen(false);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setGeneratingBio(false);
		}
	};

	const addService = () => {
		const s = serviceInput.trim();
		if (s && !form.servicesOffered.includes(s)) {
			setForm(f => ({ ...f, servicesOffered: [...f.servicesOffered, s] }));
		}
		setServiceInput("");
	};

	const removeService = (s: string) => setForm(f => ({ ...f, servicesOffered: f.servicesOffered.filter(x => x !== s) }));

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
			</div>
		);
	}

	const TABS = [
		{ id: "identity" as const, label: "Identity", icon: User },
		{ id: "hireme" as const, label: "Hire Me", icon: Briefcase },
		{ id: "socials" as const, label: "Socials", icon: Link2 },
	];

	return (
		<div className="max-w-2xl">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
				<h1 className="text-2xl font-black mb-1 flex items-center gap-2">
					<Settings size={22} className="text-[var(--accent-light)]" />
					Profile Settings
				</h1>
				<p className="text-[var(--text-muted)] text-sm mb-8">Manage your public profile and hire-me panel.</p>
			</motion.div>

			{/* Tabs */}
			<div className="flex gap-1 mb-6 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--card-border)]">
				{TABS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						onClick={() => setTab(id)}
						className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
							tab === id
								? "bg-[var(--accent-primary)] text-white"
								: "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
						}`}
					>
						<Icon size={15} />{label}
					</button>
				))}
			</div>

			{/* Identity tab */}
			{tab === "identity" && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Username</label>
							<input className="input" value={form.username} onChange={set("username")} placeholder="yourname" />
						</div>
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Display name</label>
							<input className="input" value={form.displayName} onChange={set("displayName")} placeholder="Your Name" />
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1">
							<label className="text-xs text-[var(--text-muted)]">Bio</label>
							<button onClick={() => setWizardOpen(!wizardOpen)} className="text-xs text-[var(--accent-light)] hover:underline flex items-center gap-1">
								<Bot size={12} /> 3-question wizard
							</button>
						</div>

						{wizardOpen && (
							<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="card-glass p-4 mb-3 space-y-3">
								<input className="input text-sm" placeholder="Your primary role (e.g. React developer)" value={wizardAnswers.role} onChange={e => setWizardAnswers(w => ({ ...w, role: e.target.value }))} />
								<input className="input text-sm" placeholder="Years of experience" value={wizardAnswers.yearsExp} onChange={e => setWizardAnswers(w => ({ ...w, yearsExp: e.target.value }))} />
								<input className="input text-sm" placeholder="Your specialty (e.g. e-commerce builds)" value={wizardAnswers.specialty} onChange={e => setWizardAnswers(w => ({ ...w, specialty: e.target.value }))} />
								<button onClick={handleGenerateBio} disabled={generatingBio} className="btn-primary w-full text-sm">
									{generatingBio ? <Loader2 size={14} className="animate-spin" /> : "Generate bio"}
								</button>
							</motion.div>
						)}

						<textarea className="input resize-none h-28" value={form.bio} onChange={set("bio")} placeholder="A short bio…" />
					</div>

					<div>
						<label className="text-xs text-[var(--text-muted)] mb-1 block">Font preference</label>
						<input className="input" value={form.font} onChange={set("font")} placeholder="Inter, Mono, etc." />
					</div>
				</motion.div>
			)}

			{/* Hire me tab */}
			{tab === "hireme" && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
					<div>
						<label className="text-xs text-[var(--text-muted)] mb-1 block">Headline</label>
						<input className="input" value={form.headline} onChange={set("headline")} placeholder="Full-Stack React / Node.js developer" />
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Location</label>
							<input className="input" value={form.location} onChange={set("location")} placeholder="London, UK" />
						</div>
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Timezone</label>
							<input className="input" value={form.timezone} onChange={set("timezone")} placeholder="GMT+0" />
						</div>
					</div>

					<div>
						<label className="text-xs text-[var(--text-muted)] mb-1 block">Availability</label>
						<select className="input" value={form.availabilityStatus} onChange={set("availabilityStatus")}>
							{AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Hourly min</label>
							<input className="input" type="number" value={form.hourlyRateMin} onChange={set("hourlyRateMin")} placeholder="50" />
						</div>
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Hourly max</label>
							<input className="input" type="number" value={form.hourlyRateMax} onChange={set("hourlyRateMax")} placeholder="150" />
						</div>
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Currency</label>
							<select className="input" value={form.currency} onChange={set("currency")}>
								{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Calendly URL</label>
							<input className="input" value={form.calendlyUrl} onChange={set("calendlyUrl")} placeholder="https://calendly.com/you" />
						</div>
						<div>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">Contact email</label>
							<input className="input" type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="hello@you.com" />
						</div>
					</div>

					<div>
						<label className="text-xs text-[var(--text-muted)] mb-1 block">Services offered</label>
						<div className="flex gap-2">
							<input
								className="input flex-1"
								value={serviceInput}
								onChange={e => setServiceInput(e.target.value)}
								onKeyDown={e => e.key === "Enter" && addService()}
								placeholder="e.g. Web Development"
							/>
							<button onClick={addService} className="btn-secondary px-4 text-sm shrink-0">Add</button>
						</div>
						<div className="flex flex-wrap gap-2 mt-2">
							{form.servicesOffered.map(s => (
								<span key={s} className="badge cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors" onClick={() => removeService(s)}>
									{s} ×
								</span>
							))}
						</div>
					</div>
				</motion.div>
			)}

			{/* Socials tab */}
			{tab === "socials" && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
					{[
						{ key: "twitterUrl" as const, label: "Twitter / X URL" },
						{ key: "linkedinUrl" as const, label: "LinkedIn URL" },
						{ key: "githubUrl" as const, label: "GitHub URL" },
						{ key: "websiteUrl" as const, label: "Personal website" },
					].map(({ key, label }) => (
						<div key={key}>
							<label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
							<input className="input" value={form[key]} onChange={set(key)} placeholder="https://…" />
						</div>
					))}
				</motion.div>
			)}

			{/* Save */}
			<div className="mt-8 flex justify-end">
				<button onClick={handleSave} disabled={saving} className="btn-primary px-8">
					{saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><Check size={16} /> Saved</> : "Save changes"}
				</button>
			</div>
		</div>
	);
}
