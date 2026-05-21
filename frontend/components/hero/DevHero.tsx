"use client";

/* ─────────────────────────────────────────────────────────────────────────
   DevHero — animated developer-at-desk illustration
   Pure CSS animations, no external deps.
───────────────────────────────────────────────────────────────────────── */

function NotifBubble({
  emoji,
  text,
  delayClass,
  style,
}: {
  emoji: string;
  text: string;
  delayClass?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`notif-bubble ${delayClass ?? ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(7,21,16,0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(16,185,129,0.45)",
        borderRadius: 12,
        padding: "8px 14px",
        fontSize: "0.76rem",
        fontWeight: 600,
        color: "#ecfff5",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.08)",
        pointerEvents: "none",
        ...style,
      }}
    >
      <span style={{ fontSize: "1rem", lineHeight: 1 }}>{emoji}</span>
      {text}
    </div>
  );
}

export default function DevHero() {
  return (
    <div className="relative w-full max-w-[540px] mx-auto select-none" aria-hidden="true">

      {/* ── Notification bubbles ──────────────────────────────────────────── */}
      <div className="absolute z-10" style={{ top: "4%", right: "-6%" }}>
        <NotifBubble emoji="🎉" text="New project brief" />
      </div>
      <div className="absolute z-10" style={{ top: "38%", left: "-8%" }}>
        <NotifBubble emoji="⭐" text="Testimonial verified" delayClass="notif-bubble-2" />
      </div>
      <div className="absolute z-10" style={{ bottom: "26%", right: "-5%" }}>
        <NotifBubble emoji="📊" text="47 profile views today" delayClass="notif-bubble-3" />
      </div>

      {/* ── SVG illustration ───────────────────────────────────────────────── */}
      <div className="dev-illustration">
        <svg
          viewBox="0 0 540 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full drop-shadow-2xl"
        >
          <defs>
            <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="deskGlow" cx="50%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Floor shadow ──────────────────────────────────────── */}
          <ellipse cx="270" cy="390" rx="210" ry="18" fill="rgba(0,0,0,0.3)" />

          {/* ── Desk surface ──────────────────────────────────────── */}
          <rect x="22" y="272" width="496" height="18" rx="9" fill="#10241a" stroke="#1f3a2d" strokeWidth="1" />
          <rect x="22" y="272" width="496" height="18" rx="9" fill="url(#deskGlow)" />

          {/* ── Desk legs ─────────────────────────────────────────── */}
          <rect x="60"  y="290" width="10" height="80" rx="5" fill="#0d1f17" />
          <rect x="470" y="290" width="10" height="80" rx="5" fill="#0d1f17" />

          {/* ── Chair ─────────────────────────────────────────────── */}
          <rect x="196" y="280" width="88" height="10" rx="5" fill="#0a1a12" />
          <line x1="208" y1="290" x2="200" y2="370" stroke="#0a1a12" strokeWidth="6" strokeLinecap="round" />
          <line x1="272" y1="290" x2="280" y2="370" stroke="#0a1a12" strokeWidth="6" strokeLinecap="round" />
          <line x1="208" y1="370" x2="200" y2="370" stroke="#0a1a12" strokeWidth="5" strokeLinecap="round" />
          <line x1="272" y1="370" x2="280" y2="370" stroke="#0a1a12" strokeWidth="5" strokeLinecap="round" />

          {/* ── Laptop base / keyboard ────────────────────────────── */}
          <rect x="122" y="250" width="224" height="26" rx="8" fill="#0d1f17" stroke="#1f3a2d" strokeWidth="1" />
          {/* Key rows */}
          <rect x="134" y="257" width="110" height="3" rx="1.5" fill="#1a3329" opacity="0.8" />
          <rect x="250" y="257" width="68" height="3" rx="1.5" fill="#1a3329" opacity="0.6" />
          <rect x="143" y="265" width="178" height="2.5" rx="1.2" fill="#1a3329" opacity="0.5" />
          {/* Trackpad */}
          <rect x="210" y="260" width="48" height="10" rx="3" fill="#0a1810" opacity="0.6" />

          {/* ── Laptop screen frame (bezel) ───────────────────────── */}
          <rect
            x="134"
            y="118"
            width="200"
            height="136"
            rx="10"
            fill="#071510"
            stroke="#234633"
            strokeWidth="1.5"
            filter="url(#softGlow)"
            className="dev-screen-glow"
          />

          {/* Camera dot */}
          <circle cx="234" cy="125" r="2.5" fill="#1a3a2c" />

          {/* ── Screen glass ──────────────────────────────────────── */}
          <rect x="145" y="130" width="178" height="116" rx="6" fill="#040d0a" />
          {/* Screen ambient glow */}
          <rect x="145" y="130" width="178" height="116" rx="6" fill="url(#screenGlow)" />

          {/* ── Code on screen ────────────────────────────────────── */}
          {/* Line 1 — function keyword + name */}
          <rect x="156" y="143" width="34" height="4.5" rx="2" fill="#10b981" opacity="0.9" />
          <rect x="194" y="143" width="52" height="4.5" rx="2" fill="#6ee7b7" opacity="0.75" />
          <rect x="250" y="143" width="12" height="4.5" rx="2" fill="#5eead4" opacity="0.6" />
          <rect x="266" y="143" width="36" height="4.5" rx="2" fill="#14b8a6" opacity="0.7" />
          {/* Line 2 */}
          <rect x="166" y="156" width="20" height="4" rx="2" fill="#5eead4" opacity="0.65" />
          <rect x="190" y="156" width="60" height="4" rx="2" fill="#6ee7b7" opacity="0.55" />
          <rect x="255" y="156" width="38" height="4" rx="2" fill="#10b981" opacity="0.7" />
          {/* Line 3 */}
          <rect x="166" y="169" width="92" height="4" rx="2" fill="#34d399" opacity="0.55" />
          {/* Line 4 */}
          <rect x="166" y="182" width="68" height="4" rx="2" fill="#6ee7b7" opacity="0.7" />
          <rect x="238" y="182" width="30" height="4" rx="2" fill="#10b981" opacity="0.8" />
          {/* Line 5 */}
          <rect x="156" y="195" width="44" height="4" rx="2" fill="#5eead4" opacity="0.6" />
          {/* Line 6 */}
          <rect x="156" y="208" width="76" height="4" rx="2" fill="#10b981" opacity="0.85" />
          <rect x="236" y="208" width="22" height="4" rx="2" fill="#6ee7b7" opacity="0.6" />
          {/* Line 7 — active / typing */}
          <rect x="156" y="221" width="56" height="4.5" rx="2" fill="#10b981" opacity="0.95" />
          {/* Blinking cursor */}
          <rect x="216" y="219" width="4" height="10" rx="1.5" fill="#6ee7b7" className="cursor-blink" />

          {/* Screen reflection sheen */}
          <rect x="145" y="130" width="178" height="28" rx="6" fill="white" opacity="0.015" />

          {/* ── Person ────────────────────────────────────────────── */}

          {/* Left arm */}
          <path
            d="M218,240 Q192,255 168,270"
            stroke="#c4956a"
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right arm */}
          <path
            d="M262,240 Q288,255 312,270"
            stroke="#c4956a"
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left hand on keyboard */}
          <ellipse cx="165" cy="272" rx="17" ry="9" fill="#c4956a" />
          {/* Right hand on keyboard */}
          <ellipse cx="315" cy="272" rx="17" ry="9" fill="#c4956a" />

          {/* Torso */}
          <rect x="210" y="224" width="60" height="56" rx="14" fill="#1e3a2c" />
          {/* Hoodie / collar detail */}
          <path
            d="M226,224 L240,240 L254,224"
            stroke="#2d5544"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hoodie pocket */}
          <rect x="224" y="254" width="32" height="18" rx="6" fill="#1a3326" stroke="#234633" strokeWidth="1" />

          {/* Neck */}
          <rect x="233" y="212" width="14" height="16" rx="6" fill="#c4956a" />

          {/* Head */}
          <ellipse cx="240" cy="190" rx="34" ry="37" fill="#c4956a" />

          {/* ── Hair ─────────────────────────────────────────────── */}
          <path
            d="M207,183 Q210,150 240,148 Q270,148 273,183 Q265,162 240,166 Q215,162 207,183Z"
            fill="#2d1810"
          />
          {/* Ear bits covered by hair */}
          <path
            d="M207,183 Q205,197 209,210"
            stroke="#2d1810"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M273,183 Q275,197 271,210"
            stroke="#2d1810"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />

          {/* ── Headphones ───────────────────────────────────────── */}
          <path
            d="M208,184 Q207,162 240,162 Q273,162 272,184"
            stroke="#0a1a12"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="203" y="182" width="11" height="16" rx="5.5" fill="#10b981" />
          <rect x="266" y="182" width="11" height="16" rx="5.5" fill="#10b981" />
          {/* Headphone light dot */}
          <circle cx="208.5" cy="188" r="2.5" fill="#6ee7b7" opacity="0.8" />
          <circle cx="271.5" cy="188" r="2.5" fill="#6ee7b7" opacity="0.8" />

          {/* ── Face ─────────────────────────────────────────────── */}
          {/* Eyes */}
          <ellipse cx="228" cy="188" rx="6" ry="6.5" fill="white" />
          <ellipse cx="252" cy="188" rx="6" ry="6.5" fill="white" />
          <circle cx="229" cy="189" r="4" fill="#1a0a04" />
          <circle cx="253" cy="189" r="4" fill="#1a0a04" />
          {/* Pupils */}
          <circle cx="230" cy="188" r="1.8" fill="#000" />
          <circle cx="254" cy="188" r="1.8" fill="#000" />
          {/* Eye gleam */}
          <circle cx="231" cy="186.5" r="1.2" fill="white" opacity="0.9" />
          <circle cx="255" cy="186.5" r="1.2" fill="white" opacity="0.9" />

          {/* Eyebrows (slightly raised — focused look) */}
          <path
            d="M221,180 Q228,176.5 235,179"
            stroke="#2d1810"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M245,179 Q252,176.5 259,180"
            stroke="#2d1810"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Smile */}
          <path
            d="M229,203 Q240,213 251,203"
            stroke="#b07860"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Small cheek blush */}
          <ellipse cx="218" cy="198" rx="7" ry="4" fill="#e07050" opacity="0.18" />
          <ellipse cx="262" cy="198" rx="7" ry="4" fill="#e07050" opacity="0.18" />

          {/* ── Coffee mug ───────────────────────────────────────── */}
          <rect x="390" y="240" width="48" height="36" rx="7" fill="#1a3a2c" stroke="#234633" strokeWidth="1" />
          <path
            d="M438,249 Q454,249 454,258 Q454,267 438,269"
            stroke="#234633"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Coffee surface */}
          <ellipse cx="414" cy="241" rx="21" ry="5" fill="#070e0a" />
          {/* Mug label */}
          <text
            x="399"
            y="264"
            fontSize="11"
            fill="#10b981"
            opacity="0.7"
            fontFamily="monospace"
          >
            {"</>"}
          </text>
          {/* Steam lines */}
          <path
            d="M406,237 Q404,228 406,220"
            stroke="#5eead4"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="steam-1"
          />
          <path
            d="M414,236 Q412,226 414,218"
            stroke="#5eead4"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="steam-2"
          />
          <path
            d="M422,237 Q424,228 422,220"
            stroke="#5eead4"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="steam-3"
          />

          {/* ── Plant (DevTree!) ──────────────────────────────────── */}
          {/* Pot */}
          <path d="M56,273 L62,290 L90,290 L96,273Z" fill="#1a3a2c" stroke="#234633" strokeWidth="1" />
          <rect x="54" y="270" width="44" height="7" rx="3.5" fill="#234633" />
          {/* Soil */}
          <ellipse cx="76" cy="270" rx="19" ry="4.5" fill="#0a1410" />
          {/* Main stem */}
          <line x1="76" y1="269" x2="76" y2="238" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          {/* Left leaf */}
          <path d="M76,258 Q58,244 46,237 Q62,246 76,258Z" fill="#10b981" />
          {/* Right leaf */}
          <path d="M76,252 Q94,238 104,231 Q90,242 76,252Z" fill="#059669" />
          {/* Lower-left leaf */}
          <path d="M76,264 Q60,252 52,245 Q66,252 76,264Z" fill="#34d399" opacity="0.7" />
          {/* Top bud — a heart shape (DevTree heart) */}
          <path
            d="M76,237 Q73,230 68,231 Q63,232 64,237 Q65,242 76,248 Q87,242 88,237 Q89,232 84,231 Q79,230 76,237Z"
            fill="#10b981"
          />
        </svg>
      </div>
    </div>
  );
}
