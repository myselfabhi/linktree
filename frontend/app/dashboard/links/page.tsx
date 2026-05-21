"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Plus, Trash2, ExternalLink, Github, ChevronDown, ChevronUp,
	FolderKanban, CheckCircle, AlertCircle, Clock, Zap, Star, Loader2, Save,
} from "lucide-react";
import { linkApi } from "@/lib/api";
import type { ProjectLink } from "@/app/types/profile";

const ROLE_OPTIONS = ["Full Stack", "Frontend", "Backend"] as const;
const TECH_SUGGESTIONS = ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Tailwind", "Prisma", "Docker", "AWS", "Vercel"];

function statusIcon(status: string) {
	if (status === "live")    return <CheckCircle size={14} className="text-green-400" />;
	if (status === "down")    return <AlertCircle size={14} className="text-red-400" />;
	if (status === "slow")    return <Clock size={14} className="text-yellow-400" />;
	return <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />;
}

function perfGrade(score?: number | null) {
	if (score == null) return null;
	if (score >= 90) return { grade: "A", cls: "perf-A" };
	if (score >= 70) return { grade: "B", cls: "perf-B" };
	if (score >= 50) return { grade: "C", cls: "perf-C" };
	return { grade: "D", cls: "perf-D" };
}

interface EditState {
	title: string; url: string; description: string; githubUrl: string;
	role: string; techStack: string[];
	problemStatement: string; outcomeSummary: string; outcomeMetric: string;
	clientName: string; clientCompany: string; teamSize: string;
	myContribution: string; walkthroughUrl: string; caseStudyBody: string;
}

function emptyEdit(link?: ProjectLink): EditState {
	return {
		title: link?.title ?? "",
		url: link?.url ?? "",
		description: link?.description ?? "",
		githubUrl: link?.githubUrl ?? "",
		role: link?.role ?? "Full Stack",
		techStack: link?.techStack ?? [],
		problemStatement: link?.problemStatement ?? "",
		outcomeSummary: link?.outcomeSummary ?? "",
		outcomeMetric: link?.outcomeMetric ?? "",
		clientName: link?.clientName ?? "",
		clientCompany: link?.clientCompany ?? "",
		teamSize: link?.teamSize?.toString() ?? "",
		myContribution: link?.myContribution ?? "",
		walkthroughUrl: link?.walkthroughUrl ?? "",
		caseStudyBody: link?.caseStudyBody ?? "",
	};
}

export default function ProjectsPage() {
	const { data: session } = useSession();
	const [links, setLinks] = useState<ProjectLink[]>([]);
	const [loading, setLoading] = useState(true);
	const [expanded, setExpanded] = useState<string | null>(null);
	const [edits, setEdits] = useState<Record<string, EditState>>({});
	const [saving, setSaving] = useState<string | null>(null);
	const [validating, setValidating] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [addOpen, setAddOpen] = useState(false);
	const [addForm, setAddForm] = useState({ title: "", url: "", description: "", role: "Full Stack", githubUrl: "" });
	const [adding, setAdding] = useState(false);
	const [techInput, setTechInput] = useState<Record<string, string>>({});

	const token = session?.accessToken as string;

	useEffect(() => {
		if (!token) return;
		linkApi.getAll(token).then(r => {
			const ls = r.data.links ?? [];
			setLinks(ls);
			const init: Record<string, EditState> = {};
			ls.forEach((l: ProjectLink) => { init[l.id] = emptyEdit(l); });
			setEdits(init);
		}).catch(console.error).finally(() => setLoading(false));
	}, [token]);

	const toggle = (id: string) => setExpanded(e => e === id ? null : id);

	const setEdit = (id: string, k: keyof EditState, v: string | string[]) =>
		setEdits(e => ({ ...e, [id]: { ...e[id], [k]: v } }));

	const handleSave = async (id: string) => {
		setSaving(id);
		try {
			const e = edits[id];
			const payload: Record<string, unknown> = {
				...e,
				teamSize: e.teamSize ? Number(e.teamSize) : null,
				url: e.url || undefined,
				githubUrl: e.githubUrl || undefined,
			};
			const r = await linkApi.update(id, payload, token);
			setLinks(ls => ls.map(l => l.id === id ? { ...l, ...r.data.link } : l));
		} catch (e: any) {
			alert(e.message);
		} finally {
			setSaving(null);
		}
	};

	const handleValidate = async (id: string) => {
		setValidating(id);
		try {
			const r = await linkApi.validate(id, token);
			setLinks(ls => ls.map(l => l.id === id ? { ...l, status: r.data.status, lastCheckedAt: r.data.lastCheckedAt } : l));
		} catch {}
		setValidating(null);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this project?")) return;
		setDeleting(id);
		await linkApi.delete(id, token).catch(() => {});
		setLinks(ls => ls.filter(l => l.id !== id));
		setDeleting(null);
	};

	const handleAdd = async () => {
		if (!addForm.title.trim()) return;
		setAdding(true);
		try {
			const r = await linkApi.create({ ...addForm, role: addForm.role as any }, token);
			const newLink = r.data.link;
			setLinks(ls => [...ls, newLink]);
			setEdits(e => ({ ...e, [newLink.id]: emptyEdit(newLink) }));
			setAddOpen(false);
			setAddForm({ title: "", url: "", description: "", role: "Full Stack", githubUrl: "" });
		} catch (e: any) {
			alert(e.message);
		} finally {
			setAdding(false);
		}
	};

	const addTech = (id: string) => {
		const v = (techInput[id] ?? "").trim();
		if (v && !edits[id]?.techStack.includes(v)) {
			setEdit(id, "techStack", [...(edits[id]?.techStack ?? []), v]);
		}
		setTechInput(t => ({ ...t, [id]: "" }));
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
			</div>
		);
	}

	return (
		<div className="max-w-3xl">
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
				<div>
					<h1 className="text-2xl font-black flex items-center gap-2 mb-1">
						<FolderKanban size={22} className="text-[var(--accent-light)]" />
						Projects
					</h1>
					<p className="text-[var(--text-muted)] text-sm">{links.length} project{links.length !== 1 ? "s" : ""}</p>
				</div>
				<button onClick={() => setAddOpen(!addOpen)} className="btn-primary text-sm px-5">
					<Plus size={15} /> Add project
				</button>
			</motion.div>

			{/* Add form */}
			<AnimatePresence>
				{addOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden mb-6"
					>
						<div className="card p-6 space-y-3">
							<h2 className="font-bold text-sm">New project</h2>
							<div className="grid grid-cols-2 gap-3">
								<input className="input" placeholder="Title *" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
								<input className="input" placeholder="Live URL" value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								<input className="input" placeholder="GitHub URL" value={addForm.githubUrl} onChange={e => setAddForm(f => ({ ...f, githubUrl: e.target.value }))} />
								<select className="input" value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
									{ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
								</select>
							</div>
							<textarea className="input resize-none h-20" placeholder="Short description" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
							<div className="flex justify-end gap-2">
								<button onClick={() => setAddOpen(false)} className="btn-secondary text-sm px-4">Cancel</button>
								<button onClick={handleAdd} disabled={adding} className="btn-primary text-sm px-6">
									{adding ? <Loader2 size={14} className="animate-spin" /> : "Add project"}
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Project list */}
			<div className="space-y-3">
				<AnimatePresence>
					{links.map(link => {
						const e = edits[link.id];
						const isOpen = expanded === link.id;
						const pg = perfGrade(link.lighthousePerformance);

						return (
							<motion.div key={link.id} layout className="card overflow-hidden">
								{/* Header */}
								<button onClick={() => toggle(link.id)} className="w-full text-left p-4 flex items-center gap-3">
									<span className="shrink-0">{statusIcon(link.status)}</span>
									<span className="font-semibold flex-1 truncate">{link.title}</span>
									<div className="flex items-center gap-2 shrink-0">
										{pg && <span className={`badge font-mono text-xs ${pg.cls}`}>{pg.grade}</span>}
										{link.githubStars != null && (
											<span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Star size={11} />{link.githubStars}</span>
										)}
										{isOpen ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
									</div>
								</button>

								{/* Expanded edit panel */}
								<AnimatePresence>
									{isOpen && e && (
										<motion.div
											initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
											className="overflow-hidden border-t border-[var(--card-border)]"
										>
											<div className="p-5 space-y-4">
												{/* Basic fields */}
												<div className="grid grid-cols-2 gap-3">
													<div>
														<label className="text-xs text-[var(--text-muted)] mb-1 block">Title</label>
														<input className="input" value={e.title} onChange={ev => setEdit(link.id, "title", ev.target.value)} />
													</div>
													<div>
														<label className="text-xs text-[var(--text-muted)] mb-1 block">Role</label>
														<select className="input" value={e.role} onChange={ev => setEdit(link.id, "role", ev.target.value)}>
															{ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
														</select>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-3">
													<div>
														<label className="text-xs text-[var(--text-muted)] mb-1 block">Live URL</label>
														<input className="input" value={e.url} onChange={ev => setEdit(link.id, "url", ev.target.value)} />
													</div>
													<div>
														<label className="text-xs text-[var(--text-muted)] mb-1 block">GitHub URL</label>
														<input className="input" value={e.githubUrl} onChange={ev => setEdit(link.id, "githubUrl", ev.target.value)} />
													</div>
												</div>
												<div>
													<label className="text-xs text-[var(--text-muted)] mb-1 block">Description</label>
													<textarea className="input resize-none h-20" value={e.description} onChange={ev => setEdit(link.id, "description", ev.target.value)} />
												</div>

												{/* Tech stack */}
												<div>
													<label className="text-xs text-[var(--text-muted)] mb-1 block">Tech stack</label>
													<div className="flex gap-2">
														<input
															className="input flex-1 text-sm"
															placeholder="Add tech…"
															value={techInput[link.id] ?? ""}
															onChange={ev => setTechInput(t => ({ ...t, [link.id]: ev.target.value }))}
															onKeyDown={ev => ev.key === "Enter" && addTech(link.id)}
															list={`tech-${link.id}`}
														/>
														<datalist id={`tech-${link.id}`}>{TECH_SUGGESTIONS.map(t => <option key={t} value={t} />)}</datalist>
														<button onClick={() => addTech(link.id)} className="btn-secondary text-xs px-3 shrink-0">Add</button>
													</div>
													<div className="flex flex-wrap gap-1.5 mt-2">
														{e.techStack.map(t => (
															<span
																key={t}
																onClick={() => setEdit(link.id, "techStack", e.techStack.filter(x => x !== t))}
																className="badge cursor-pointer hover:bg-red-500/10 hover:text-red-400 text-xs"
															>{t} ×</span>
														))}
													</div>
												</div>

												{/* Case study section */}
												<div className="border-t border-[var(--card-border)] pt-4">
													<h3 className="font-bold text-sm mb-3 text-[var(--accent-light)]">Case Study</h3>
													<div className="space-y-3">
														<div>
															<label className="text-xs text-[var(--text-muted)] mb-1 block">Problem statement</label>
															<textarea className="input resize-none h-20 text-sm" value={e.problemStatement} onChange={ev => setEdit(link.id, "problemStatement", ev.target.value)} placeholder="What problem were you solving?" />
														</div>
														<div className="grid grid-cols-2 gap-3">
															<div>
																<label className="text-xs text-[var(--text-muted)] mb-1 block">Outcome metric</label>
																<input className="input text-sm" value={e.outcomeMetric} onChange={ev => setEdit(link.id, "outcomeMetric", ev.target.value)} placeholder="e.g. 40% faster load" />
															</div>
															<div>
																<label className="text-xs text-[var(--text-muted)] mb-1 block">Team size</label>
																<input className="input text-sm" type="number" value={e.teamSize} onChange={ev => setEdit(link.id, "teamSize", ev.target.value)} placeholder="2" />
															</div>
														</div>
														<div>
															<label className="text-xs text-[var(--text-muted)] mb-1 block">Outcome summary</label>
															<textarea className="input resize-none h-16 text-sm" value={e.outcomeSummary} onChange={ev => setEdit(link.id, "outcomeSummary", ev.target.value)} placeholder="What was the result?" />
														</div>
														<div className="grid grid-cols-2 gap-3">
															<div>
																<label className="text-xs text-[var(--text-muted)] mb-1 block">Client name</label>
																<input className="input text-sm" value={e.clientName} onChange={ev => setEdit(link.id, "clientName", ev.target.value)} />
															</div>
															<div>
																<label className="text-xs text-[var(--text-muted)] mb-1 block">Client company</label>
																<input className="input text-sm" value={e.clientCompany} onChange={ev => setEdit(link.id, "clientCompany", ev.target.value)} />
															</div>
														</div>
														<div>
															<label className="text-xs text-[var(--text-muted)] mb-1 block">My contribution</label>
															<textarea className="input resize-none h-16 text-sm" value={e.myContribution} onChange={ev => setEdit(link.id, "myContribution", ev.target.value)} placeholder="What did you specifically build?" />
														</div>
														<div>
															<label className="text-xs text-[var(--text-muted)] mb-1 block">Video walkthrough URL</label>
															<input className="input text-sm" value={e.walkthroughUrl} onChange={ev => setEdit(link.id, "walkthroughUrl", ev.target.value)} placeholder="https://loom.com/share/…" />
														</div>
														<div>
															<label className="text-xs text-[var(--text-muted)] mb-1 block">Full case study body</label>
															<textarea className="input resize-none h-32 text-sm" value={e.caseStudyBody} onChange={ev => setEdit(link.id, "caseStudyBody", ev.target.value)} placeholder="Full narrative (markdown supported)…" />
														</div>
													</div>
												</div>

												{/* Actions */}
												<div className="flex items-center justify-between pt-2">
													<div className="flex gap-2">
														{link.url && (
															<a href={link.url} target="_blank" rel="noopener" className="btn-secondary text-xs px-3 py-2">
																<ExternalLink size={12} />
															</a>
														)}
														<button
															onClick={() => handleValidate(link.id)}
															disabled={!link.url || validating === link.id}
															className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
														>
															{validating === link.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
															Check
														</button>
													</div>
													<div className="flex gap-2">
														<button
															onClick={() => handleDelete(link.id)}
															disabled={deleting === link.id}
															className="btn-secondary text-xs px-3 py-2 text-red-400 border-red-500/20 hover:bg-red-500/10"
														>
															{deleting === link.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
														</button>
														<button
															onClick={() => handleSave(link.id)}
															disabled={saving === link.id}
															className="btn-primary text-xs px-5 py-2"
														>
															{saving === link.id ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} /> Save</>}
														</button>
													</div>
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>

			{links.length === 0 && (
				<div className="card p-12 text-center text-[var(--text-muted)]">
					<FolderKanban size={32} className="mx-auto mb-3 opacity-30" />
					No projects yet. Add your first one above.
				</div>
			)}
		</div>
	);
}
