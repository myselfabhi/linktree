/* ─────────────────────────────────────────────────────────────────────────
   DevTree — Logo system
   Three exports:
     TreeMark   — raw SVG tree (no container)
     LogoIcon   — tree inside a dark rounded-square container
     Logo       — full logo: icon + "Dev Tree" wordmark  (default)
───────────────────────────────────────────────────────────────────────── */

import Link from "next/link";

// ── Raw SVG tree mark (36 × 40 viewBox) ──────────────────────────────────
// Three layered triangular tiers: lightest on top, darkest at base.
// Rendered back→front so each upper tier paints over the one below.
export function TreeMark({
  width = 20,
  className = "",
}: {
  width?: number;
  className?: string;
}) {
  const height = Math.round(width * 40 / 36);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Tier 1 — bottom, widest, darkest (drawn first = behind) */}
      <path d="M18 15 L1.5 31.5 L34.5 31.5 Z" fill="#059669" />

      {/* Tier 2 — middle (drawn second, covers Tier 1's apex area) */}
      <path d="M18 8 L5 22.5 L31 22.5 Z" fill="#10b981" />

      {/* Tier 3 — top, narrowest, lightest (drawn last = in front) */}
      <path d="M18 2 L10.5 14 L25.5 14 Z" fill="#6ee7b7" />

      {/* Trunk */}
      <rect x="15" y="31.5" width="6" height="6.5" rx="1.5" fill="#047857" />
    </svg>
  );
}

// ── Icon box: tree in a dark rounded-square ───────────────────────────────
export function LogoIcon({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const radius = Math.round(size * 0.28); // ~10px at 36px
  return (
    <div
      className={`shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "linear-gradient(145deg, #071d12 0%, #0d2318 100%)",
        border: "1px solid rgba(16,185,129,0.38)",
        boxShadow:
          "0 2px 14px rgba(16,185,129,0.22), inset 0 1px 0 rgba(110,231,183,0.07)",
        flexShrink: 0,
      }}
    >
      <TreeMark width={Math.round(size * 0.6)} />
    </div>
  );
}

// ── Full logo: icon + wordmark ────────────────────────────────────────────
export default function Logo({
  iconSize = 32,
  className = "",
  href,
}: {
  iconSize?: number;
  className?: string;
  /** Wrap the logo in a Next.js Link if provided */
  href?: string;
}) {
  const textSize = Math.max(14, Math.round(iconSize * 0.55));

  const inner = (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ lineHeight: 1 }}>
      <LogoIcon size={iconSize} />
      <span style={{ fontSize: textSize, letterSpacing: "-0.03em", fontWeight: 800 }}>
        {/* "Dev" — lighter weight & colour */}
        <span
          style={{
            fontWeight: 500,
            color: "rgba(158,200,180,0.8)", // muted emerald
          }}
        >
          Dev
        </span>
        {/* "Tree" — bold gradient */}
        <span
          style={{
            fontWeight: 800,
            background: "linear-gradient(90deg,#6ee7b7,#5eead4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Tree
        </span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
