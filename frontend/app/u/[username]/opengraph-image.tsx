import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3003";

export default async function OGImage({ params }: { params: { username: string } }) {
	let profile: any = null;
	try {
		const r = await fetch(`${BACKEND_URL}/api/profile/${params.username}`);
		const data = await r.json();
		profile = data?.data?.profile;
	} catch {}

	const displayName = profile?.displayName ?? params.username;
	const bio = profile?.bio ?? "Developer portfolio on DevTree";
	const headline = profile?.headline ?? "";
	const avail = profile?.availabilityStatus;
	const availText = avail === "available" ? "✅ Available for work" : avail === "booked" ? "🔴 Fully booked" : "";

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					background: "linear-gradient(135deg, #050a08 0%, #0a1410 50%, #0f1c16 100%)",
					padding: 64,
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Background glow */}
				<div
					style={{
						position: "absolute",
						top: -100,
						left: "50%",
						transform: "translateX(-50%)",
						width: 600,
						height: 400,
						borderRadius: "50%",
						background: "radial-gradient(ellipse, rgba(16,185,129,0.3) 0%, transparent 70%)",
					}}
				/>

				{/* Logo */}
				<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
					{/* Icon box */}
					<div
						style={{
							width: 44, height: 44, borderRadius: 12,
							background: "linear-gradient(145deg, #071d12, #0d2318)",
							border: "1px solid rgba(16,185,129,0.38)",
							display: "flex", alignItems: "center", justifyContent: "center",
							boxShadow: "0 2px 14px rgba(16,185,129,0.22)",
						}}
					>
						{/* Tree SVG inline — next/og cannot import components */}
						<svg width="26" height="29" viewBox="0 0 36 40" fill="none">
							<path d="M18 15 L1.5 31.5 L34.5 31.5 Z" fill="#059669" />
							<path d="M18 8 L5 22.5 L31 22.5 Z" fill="#10b981" />
							<path d="M18 2 L10.5 14 L25.5 14 Z" fill="#6ee7b7" />
							<rect x="15" y="31.5" width="6" height="6.5" rx="1.5" fill="#047857" />
						</svg>
					</div>
					{/* Wordmark */}
					<div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
						<span style={{ color: "rgba(158,200,180,0.75)", fontSize: 22, fontWeight: 400, letterSpacing: "-0.03em" }}>Dev</span>
						<span style={{ color: "#6ee7b7", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>Tree</span>
					</div>
				</div>

				{/* Avatar initials circle */}
				<div
					style={{
						width: 84, height: 84, borderRadius: 22,
						background: "linear-gradient(135deg, #0a1a12, #0d2318)",
						border: "2px solid rgba(16,185,129,0.45)",
						boxShadow: "0 0 32px rgba(16,185,129,0.3)",
						display: "flex", alignItems: "center", justifyContent: "center",
						color: "#6ee7b7", fontSize: 36, fontWeight: 900,
						marginBottom: 24,
					}}
				>
					{displayName[0].toUpperCase()}
				</div>

				{/* Name */}
				<div style={{ color: "#ecfff5", fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 8 }}>
					{displayName}
				</div>

				{/* Headline */}
				{headline && (
					<div style={{ color: "#6ee7b7", fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
						{headline}
					</div>
				)}

				{/* Bio */}
				<div style={{ color: "rgba(236,255,245,0.6)", fontSize: 20, lineHeight: 1.5, maxWidth: 800, marginBottom: 24 }}>
					{bio.length > 120 ? bio.slice(0, 120) + "…" : bio}
				</div>

				{/* Availability badge */}
				{availText && (
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							padding: "8px 20px",
							borderRadius: 9999,
							border: "1px solid rgba(16,185,129,0.4)",
							background: "rgba(16,185,129,0.15)",
							color: "#6ee7b7",
							fontSize: 16,
							fontWeight: 600,
						}}
					>
						{availText}
					</div>
				)}

				{/* Bottom URL */}
				<div
					style={{
						position: "absolute",
						bottom: 48,
						right: 64,
						color: "rgba(236,255,245,0.4)",
						fontSize: 18,
					}}
				>
					devtree.so/u/{params.username}
				</div>
			</div>
		),
		{ ...size }
	);
}
