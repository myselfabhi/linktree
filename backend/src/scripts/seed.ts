import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── credentials ──────────────────────────────────────────────────────────
  const EMAIL    = "alex@devtree.demo";
  const PASSWORD = "demo1234";
  const USERNAME = "alexchen";

  // wipe any previous demo run
  const existing = await prisma.user.findUnique({ where: { email: EMAIL }, include: { profile: true } });
  if (existing?.profile) {
    await prisma.profile.delete({ where: { id: existing.profile.id } });
  }
  if (existing) await prisma.user.delete({ where: { id: existing.id } });

  const hash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      password: hash,
      name: "Alex Chen",
      profile: {
        create: {
          username: USERNAME,
          displayName: "Alex Chen",
          bio: "Full-stack engineer with 6 years building SaaS products that scale. I obsess over clean APIs and pixel-perfect UIs. Currently open to new contracts.",
          headline: "Full-Stack React / Node.js Engineer",
          location: "San Francisco, CA",
          timezone: "PST (UTC-8)",
          availabilityStatus: "available",
          hourlyRateMin: 95,
          hourlyRateMax: 150,
          projectRateMin: 4000,
          projectRateMax: 12000,
          currency: "USD",
          calendlyUrl: "https://calendly.com/alexchen",
          contactEmail: "alex@devtree.demo",
          servicesOffered: ["Web App Development", "API Design", "Technical Consulting", "Code Review"],
          twitterUrl: "https://twitter.com/alexchendev",
          linkedinUrl: "https://linkedin.com/in/alexchendev",
          githubUrl: "https://github.com/alexchendev",
          websiteUrl: "https://alexchen.dev",
          views: 312,
        },
      },
    },
    include: { profile: true },
  });

  const profileId = user.profile!.id;
  console.log(`✓ User created  →  ${EMAIL} / ${PASSWORD}`);
  console.log(`  Public profile →  http://localhost:3002/u/${USERNAME}`);

  // ── projects ──────────────────────────────────────────────────────────────
  const links = await prisma.link.createManyAndReturn({
    data: [
      {
        profileId,
        order: 0,
        title: "FlowBoard — SaaS Project Tracker",
        url: "https://flowboard.app",
        description: "Real-time Kanban boards with WebSocket sync, role-based permissions, and Slack notifications for 500+ remote teams.",
        role: "FullStack",
        techStack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "WebSockets"],
        githubUrl: "https://github.com/alexchendev/flowboard",
        githubStars: 847,
        status: "live",
        screenshotUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1280&q=80",
        lighthousePerformance: 94,
        lighthouseAccessibility: 98,
        lighthouseBestPractices: 92,
        lighthouseSEO: 96,
        lighthouseLastRun: new Date("2026-05-10"),
        lastCommitDate: new Date("2026-05-18"),
        lastCommitMessage: "feat: add CSV export for sprint reports",
        clientName: "Priya Sharma",
        clientCompany: "Nomad Labs",
        teamSize: 3,
        problemStatement: "Nomad Labs was running 4 different tools—Trello, Notion, Slack, and a Google Sheet—just to track one sprint. Context switching was eating 90 minutes per engineer per day.",
        myContribution: "Architected the entire backend (Express + PostgreSQL), designed the real-time sync layer using Redis pub/sub + WebSockets, and built the React dashboard. Also led the Slack integration.",
        outcomeSummary: "Shipped v1 in 6 weeks. After 3 months, the team reported 40% fewer missed deadlines and eliminated their Notion subscription.",
        outcomeMetric: "40% fewer missed deadlines",
        caseStudyBody: `## The Problem\n\nNomad Labs had a classic SaaS startup pain: their tooling had grown organically and nobody owned the process. When a task moved from design to dev to QA, it touched 3 different apps and someone always missed a ping.\n\n## What I Built\n\nA unified Kanban board with real-time updates powered by WebSockets and Redis pub/sub. Every board change broadcasts instantly to all connected clients — no polling, no page refresh. Drag-and-drop is optimistic on the client and reconciled server-side.\n\n**Key technical decisions:**\n- PostgreSQL for relational task/project data (ACID matters for state machines)\n- Redis as both a pub/sub broker and a short-lived session cache\n- Row-level security so each team only sees their own data\n- Slack webhook integration with a configurable rule engine (e.g. "notify #dev when a P0 ticket is blocked")\n\n## The Result\n\nAfter 90 days in production: 40% reduction in missed deadlines, 0 data loss incidents, and the team cancelled their Notion Business plan (saving $600/mo).`,
      },
      {
        profileId,
        order: 1,
        title: "Pricewise — AI Pricing Intelligence",
        url: "https://pricewise.io",
        description: "Competitor price monitoring with ML anomaly detection. Scrapes 200k+ product pages daily and alerts e-commerce teams to pricing shifts within minutes.",
        role: "FullStack",
        techStack: ["Next.js", "Python", "FastAPI", "PostgreSQL", "Puppeteer", "OpenAI"],
        githubUrl: "https://github.com/alexchendev/pricewise",
        githubStars: 213,
        status: "live",
        screenshotUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&q=80",
        lighthousePerformance: 89,
        lighthouseAccessibility: 95,
        lighthouseBestPractices: 88,
        lighthouseSEO: 91,
        lighthouseLastRun: new Date("2026-05-12"),
        lastCommitDate: new Date("2026-05-15"),
        lastCommitMessage: "fix: handle 429 rate-limits from Amazon scraper",
        clientName: "Marcus Obi",
        clientCompany: "RetailEdge Inc.",
        teamSize: 2,
        problemStatement: "RetailEdge's pricing analysts were manually checking 300 competitor SKUs in a spreadsheet every morning. By the time they repriced, competitors had already moved.",
        myContribution: "Built the Node.js scraping orchestrator (Puppeteer cluster + proxy rotation), the FastAPI anomaly detection service, and the Next.js dashboard with real-time alert feed.",
        outcomeSummary: "Automated monitoring cut analyst time from 3 hours/day to 15 minutes. The team caught a competitor flash-sale 4 minutes after it launched and matched pricing in time.",
        outcomeMetric: "12× faster response to competitor pricing changes",
        caseStudyBody: `## Background\n\nRetailEdge competes in a category where prices change multiple times per day. Their existing process was a Google Sheet updated each morning — by definition, always stale.\n\n## Architecture\n\nI built a scraping cluster using Puppeteer in a worker-pool pattern with rotating residential proxies. Each run fans out across 200k URLs in under 4 hours. Price data feeds into PostgreSQL with a time-series table; an anomaly detection model (simple Z-score on a 7-day rolling window, served via FastAPI) flags unexpected changes.\n\nThe frontend is a Next.js app with SSE for live alert pushes — no polling.\n\n## Outcome\n\nResponse time to competitor moves dropped from 3–4 hours to under 15 minutes. In the first month alone the team identified and matched a flash-sale that would have cost an estimated $80k in lost revenue.`,
      },
      {
        profileId,
        order: 2,
        title: "DevPulse — Developer Analytics API",
        url: "https://devpulse.dev",
        description: "Open-source REST + GraphQL API that aggregates GitHub, Linear, and Jira activity into a unified developer productivity dashboard.",
        role: "Backend",
        techStack: ["Node.js", "GraphQL", "PostgreSQL", "Docker", "GitHub OAuth"],
        githubUrl: "https://github.com/alexchendev/devpulse",
        githubStars: 1204,
        status: "live",
        screenshotUrl: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1280&q=80",
        lighthousePerformance: 97,
        lighthouseAccessibility: 100,
        lighthouseBestPractices: 96,
        lighthouseSEO: 98,
        lighthouseLastRun: new Date("2026-05-14"),
        lastCommitDate: new Date("2026-05-19"),
        lastCommitMessage: "docs: add Linear integration quickstart",
        teamSize: 1,
        problemStatement: "Engineering managers had no single view of team output — GitHub metrics lived in one dashboard, Linear velocity in another, and Jira burn-down in a third. Prep for a weekly eng review took 45 minutes of copy-pasting.",
        myContribution: "Designed and built the entire API — OAuth flows for all three services, a unified data model, a GraphQL schema with DataLoader batching, and a Docker Compose dev setup.",
        outcomeSummary: "1,200+ GitHub stars in 3 months. 40+ companies using it in production. Weekly review prep time cut from 45 minutes to under 5.",
        outcomeMetric: "1,204 GitHub stars · 40+ production installs",
        caseStudyBody: `## Why I Built This\n\nI kept seeing the same problem at every company I contracted with: three dashboards open in three tabs, all telling a slightly different story. I decided to build a unified API rather than another dashboard — let teams bring their own UI.\n\n## Design Decisions\n\n- **GraphQL over REST** for this use case: clients can request exactly the shape they need (a dashboard widget vs. a full sprint report are very different queries)\n- **DataLoader** to batch N+1 queries across GitHub/Linear/Jira calls\n- **Webhook-first** sync: instead of polling APIs every minute, I register webhooks where available (GitHub, Linear) for near-real-time data\n- Full Docker Compose setup so any engineer can run it locally in < 2 minutes\n\n## Traction\n\nReleased it open-source on GitHub. Hit 500 stars in week one from a HN post, grew organically to 1,200+ since. 40+ companies have forked or self-hosted it based on GitHub Discussions activity.`,
      },
      {
        profileId,
        order: 3,
        title: "CartKit — Headless Checkout SDK",
        url: "https://cartkit.io",
        description: "Drop-in headless checkout for Next.js storefronts. Handles cart state, discount codes, address validation, and Stripe/PayPal with 3 lines of code.",
        role: "Frontend",
        techStack: ["React", "TypeScript", "Stripe", "Zustand", "Tailwind CSS"],
        githubUrl: "https://github.com/alexchendev/cartkit",
        githubStars: 389,
        status: "live",
        screenshotUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1280&q=80",
        lighthousePerformance: 92,
        lighthouseAccessibility: 96,
        lighthouseBestPractices: 90,
        lighthouseSEO: 94,
        lighthouseLastRun: new Date("2026-05-08"),
        lastCommitDate: new Date("2026-05-11"),
        lastCommitMessage: "feat: add PayPal express checkout support",
        clientName: "Sophie Reeves",
        clientCompany: "Bloom Goods",
        teamSize: 2,
        problemStatement: "Bloom Goods had a beautiful Figma design for their checkout but couldn't afford a full Shopify rebuild. They needed a custom checkout on their existing Next.js site without rebuilding payment logic from scratch.",
        myContribution: "Built the CartKit SDK as a reusable React component library. Implemented Stripe Payment Element, Zustand cart store, discount code validation, and address autocomplete via Google Places.",
        outcomeSummary: "Checkout conversion rate went from 61% to 79% after launch. The SDK was open-sourced and picked up 389 stars from the Next.js community.",
        outcomeMetric: "79% checkout conversion (+18pp)",
      },
    ],
  });

  console.log(`✓ ${links.length} projects seeded`);

  // ── testimonials (pre-approved) ───────────────────────────────────────────
  await prisma.testimonial.createMany({
    data: [
      {
        profileId,
        quote: "Alex delivered FlowBoard in 6 weeks, on budget, and it's been rock-solid in production for 8 months. Every standup he showed up with the exact questions I needed to answer as a founder. Genuinely the best engineer I've worked with at this stage.",
        authorName: "Priya Sharma",
        authorRole: "Co-founder & CEO",
        authorCompany: "Nomad Labs",
        authorLinkedIn: "https://linkedin.com/in/priyasharma",
        verified: true,
        verifiedVia: "linkedin",
        approved: true,
        approvedAt: new Date("2026-04-15"),
        submittedAt: new Date("2026-04-14"),
      },
      {
        profileId,
        quote: "I hired Alex for what I thought would be a 2-week scraping project. Three months later we have a full pricing intelligence platform. He has a rare ability to understand the business problem before writing a single line of code.",
        authorName: "Marcus Obi",
        authorRole: "Head of E-Commerce",
        authorCompany: "RetailEdge Inc.",
        authorLinkedIn: "https://linkedin.com/in/marcusobi",
        verified: true,
        verifiedVia: "linkedin",
        approved: true,
        approvedAt: new Date("2026-03-20"),
        submittedAt: new Date("2026-03-19"),
      },
      {
        profileId,
        quote: "Our checkout conversion went from 61% to 79% after Alex rebuilt it. The code is clean enough that our in-house team could maintain it on day one. Highly recommended for any serious e-commerce work.",
        authorName: "Sophie Reeves",
        authorRole: "Founder",
        authorCompany: "Bloom Goods",
        verified: true,
        verifiedVia: "linkedin",
        approved: true,
        approvedAt: new Date("2026-02-28"),
        submittedAt: new Date("2026-02-27"),
      },
    ],
  });

  console.log(`✓ 3 testimonials seeded`);

  // ── engagement views (fake history for the analytics chart) ───────────────
  const sessionSuffixes = ["a1b2", "c3d4", "e5f6", "g7h8", "i9j0", "k1l2", "m3n4", "o5p6", "q7r8", "s9t0"];
  const referrers = ["direct", "twitter.com", "linkedin.com", "github.com", null, "hackernews.com", null, "direct"];
  const viewRows = [];
  for (let d = 30; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const count = d % 7 === 0 ? 12 : d % 3 === 0 ? 7 : 3;
    for (let i = 0; i < count; i++) {
      viewRows.push({
        profileId,
        sessionId: `demo-${d}-${sessionSuffixes[i % sessionSuffixes.length]}-${i}`,
        referrer: referrers[i % referrers.length],
        durationMs: Math.floor(Math.random() * 180_000) + 30_000,
        projectsOpened: i % 3 === 0 ? [links[0].id] : i % 5 === 0 ? [links[0].id, links[1].id] : [],
        createdAt: date,
      });
    }
  }
  await prisma.profileView.createMany({ data: viewRows });
  console.log(`✓ ${viewRows.length} engagement views seeded (30-day history)`);

  // ── summary ───────────────────────────────────────────────────────────────
  console.log("\n┌─────────────────────────────────────────────────────────┐");
  console.log("│  DEMO CREDENTIALS                                       │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log(`│  Email    : ${EMAIL.padEnd(45)}│`);
  console.log(`│  Password : ${PASSWORD.padEnd(45)}│`);
  console.log(`│  Username : ${USERNAME.padEnd(45)}│`);
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log(`│  Profile  : http://localhost:3002/u/${USERNAME.padEnd(29)}│`);
  console.log(`│  Dashboard: http://localhost:3002/dashboard             │`);
  console.log("└─────────────────────────────────────────────────────────┘");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
