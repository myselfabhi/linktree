"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
	LayoutDashboard, FolderKanban, MessageSquare,
	Shield, BarChart3, Settings, LogOut, ExternalLink,
	Menu, X, Loader2,
} from "lucide-react";
import { profileApi } from "@/lib/api";

const NAV = [
	{ href: "/dashboard",              icon: LayoutDashboard, label: "Overview" },
	{ href: "/dashboard/links",        icon: FolderKanban,    label: "Projects" },
	{ href: "/dashboard/testimonials", icon: Shield,          label: "Testimonials" },
	{ href: "/dashboard/briefs",       icon: MessageSquare,   label: "Brief Inbox" },
	{ href: "/dashboard/analytics",    icon: BarChart3,       label: "Engagement" },
	{ href: "/dashboard/profile",      icon: Settings,        label: "Profile Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const pathname = usePathname();
	const [profile, setProfile] = useState<{ username: string; displayName: string; avatar?: string } | null>(null);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		if (status === "unauthenticated") router.replace("/");
	}, [status, router]);

	useEffect(() => {
		if (session?.accessToken) {
			profileApi.get(session.accessToken as string)
				.then(r => setProfile(r.data.profile))
				.catch(() => {});
		}
	}, [session]);

	if (status === "loading") {
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
				<Loader2 className="animate-spin text-[var(--accent-primary)]" size={28} />
			</div>
		);
	}

	const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
		<aside className={`flex flex-col h-full ${mobile ? "p-6" : "p-5"}`}>
			{/* Logo */}
			<Link href="/" className="flex items-center gap-2 font-bold text-lg mb-8 shrink-0">
				<span className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-black">D</span>
				<span className="text-[var(--text-primary)]">DevTree</span>
			</Link>

			{/* Nav */}
			<nav className="flex-1 space-y-1">
				{NAV.map(({ href, icon: Icon, label }) => {
					const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
					return (
						<Link
							key={href}
							href={href}
							onClick={() => setMobileOpen(false)}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
								active
									? "bg-[var(--accent-primary)]/15 text-[var(--accent-light)] border border-[var(--accent-primary)]/25"
									: "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
							}`}
						>
							<Icon size={17} />
							{label}
						</Link>
					);
				})}
			</nav>

			{/* Profile strip + signout */}
			<div className="mt-6 pt-4 border-t border-[var(--card-border)] space-y-2 shrink-0">
				{profile && (
					<Link href={`/u/${profile.username}`} target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
						{profile.avatar
							? <img src={profile.avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
							: <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-black">{profile.displayName[0]}</span>
						}
						<span className="truncate">@{profile.username}</span>
						<ExternalLink size={13} className="shrink-0 ml-auto" />
					</Link>
				)}
				<button
					onClick={() => signOut({ callbackUrl: "/" })}
					className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/8 transition-all"
				>
					<LogOut size={17} />
					Sign out
				</button>
			</div>
		</aside>
	);

	return (
		<div className="min-h-screen bg-[var(--bg-primary)] flex">
			{/* Desktop sidebar */}
			<div className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--card-border)]/60 bg-[var(--bg-secondary)] sticky top-0 h-screen overflow-y-auto">
				<Sidebar />
			</div>

			{/* Mobile nav bar */}
			<div className="md:hidden fixed top-0 inset-x-0 z-20 h-14 bg-[var(--bg-secondary)]/90 backdrop-blur border-b border-[var(--card-border)]/40 flex items-center justify-between px-4">
				<Link href="/" className="flex items-center gap-2 font-bold text-base">
					<span className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-black">D</span>
					DevTree
				</Link>
				<button onClick={() => setMobileOpen(o => !o)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
					{mobileOpen ? <X size={22} /> : <Menu size={22} />}
				</button>
			</div>

			{/* Mobile sidebar drawer */}
			<AnimatePresence>
				{mobileOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
							className="md:hidden fixed inset-0 bg-black/60 z-30"
							onClick={() => setMobileOpen(false)}
						/>
						<motion.div
							initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
							className="md:hidden fixed top-0 left-0 bottom-0 w-64 z-40 bg-[var(--bg-secondary)] border-r border-[var(--card-border)]/60"
						>
							<Sidebar mobile />
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Main content */}
			<main className="flex-1 min-w-0 md:p-8 p-4 pt-18 md:pt-8 overflow-y-auto">
				{children}
			</main>
		</div>
	);
}
