"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Check, Sparkles, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/api";
import Logo from "@/components/ui/Logo";

interface Props {
	mode: "signin" | "signup";
	onClose: () => void;
	onSwitch: (mode: "signin" | "signup") => void;
}

export default function AuthModal({ mode, onClose, onSwitch }: Props) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (mode === "signup") {
				const res = await apiRequest("/api/auth/signup", {
					method: "POST",
					body: JSON.stringify({ name, email, password }),
				});
				if (!res.success) throw new Error(res.message);

				const result = await signIn("credentials", { email, password, redirect: false });
				if (result?.error) throw new Error("Registration succeeded but sign-in failed");
				setSuccess(true);
				setTimeout(() => { onClose(); router.push("/dashboard"); router.refresh(); }, 800);
			} else {
				const result = await signIn("credentials", { email, password, redirect: false });
				if (result?.error) throw new Error("Invalid email or password");
				setSuccess(true);
				setTimeout(() => { onClose(); router.push("/dashboard"); router.refresh(); }, 600);
			}
		} catch (err: any) {
			setError(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const isSignUp = mode === "signup";

	return (
		<>
			{/* Heavy backdrop — much stronger so content behind is fully muted */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
				className="fixed inset-0 z-40"
				style={{ background: "rgba(2,2,8,0.85)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
				onClick={onClose}
			/>

			<motion.div
				initial={{ opacity: 0, scale: 0.92, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.92, y: 20 }}
				transition={{ type: "spring", stiffness: 320, damping: 28 }}
				className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
			>
				<div className="card-modal w-full max-w-md pointer-events-auto p-8 relative">
					{/* Soft inner glow */}
					<div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(16,185,129,0.18),transparent)] pointer-events-none" />

					{/* Close */}
					<button
						onClick={onClose}
						aria-label="Close"
						className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
					>
						<X size={18} />
					</button>

					{/* Logo + free badge */}
					<div className="relative flex items-center justify-between mb-6">
						<Logo iconSize={34} />
						{isSignUp && (
							<div className="badge text-[10px] tracking-wide">
								<Sparkles size={10} /> 100% free
							</div>
						)}
					</div>

					<h2 className="relative text-2xl font-black text-[var(--text-primary)] tracking-tight mb-1">
						{isSignUp ? "Create your account" : "Welcome back"}
					</h2>
					<p className="relative text-[var(--text-muted)] text-sm mb-6">
						{isSignUp
							? "Free forever — no credit card needed."
							: "Sign in to manage your portfolio."}
					</p>

					<form onSubmit={handleSubmit} className="relative space-y-3">
						{isSignUp && (
							<div className="relative">
								<User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
								<input
									className="input pl-9"
									placeholder="Full name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									autoFocus
								/>
							</div>
						)}

						<div className="relative">
							<Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
							<input
								className="input pl-9"
								type="email"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoFocus={!isSignUp}
							/>
						</div>

						<div className="relative">
							<Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
							<input
								className="input pl-9 pr-10"
								type={showPw ? "text" : "password"}
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={6}
							/>
							<button
								type="button"
								onClick={() => setShowPw(!showPw)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
								tabIndex={-1}
							>
								{showPw ? <EyeOff size={15} /> : <Eye size={15} />}
							</button>
						</div>

						{error && (
							<motion.div
								initial={{ opacity: 0, y: -6 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex items-center gap-2 text-red-300 text-xs bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2"
							>
								<AlertCircle size={13} />
								{error}
							</motion.div>
						)}

						<button
							type="submit"
							disabled={loading || success}
							className="btn-primary w-full mt-2 disabled:opacity-70"
						>
							{success ? (
								<><Check size={16} /> Done</>
							) : loading ? (
								<Loader2 size={16} className="animate-spin" />
							) : isSignUp ? (
								<>Create my portfolio <ArrowRight size={14} /></>
							) : (
								"Sign in"
							)}
						</button>
					</form>

					<p className="relative text-center text-xs text-[var(--text-muted)] mt-5">
						{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
						<button
							onClick={() => onSwitch(isSignUp ? "signin" : "signup")}
							className="text-[var(--accent-light)] hover:underline font-semibold"
						>
							{isSignUp ? "Sign in" : "Sign up free"}
						</button>
					</p>

					{isSignUp && (
						<p className="relative text-center text-[10px] text-[var(--text-muted)] mt-3 leading-relaxed">
							By signing up you agree to our terms.
							<br />Cancel anytime — nothing to cancel, it's free.
						</p>
					)}
				</div>
			</motion.div>
		</>
	);
}
