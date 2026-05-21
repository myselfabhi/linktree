import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import crypto from "crypto";

// POST /api/public/:username/view — public; track a profile view (called once per session)
export const trackView = async (req: Request, res: Response) => {
	try {
		const { username } = req.params;
		const { sessionId, referrer, durationMs, projectsOpened } = req.body;

		const profile = await prisma.profile.findUnique({ where: { username } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const sid = sessionId || crypto.randomBytes(12).toString("hex");
		const userAgent = req.headers["user-agent"] || null;

		// Upsert: if same sessionId exists, update duration + projects; else create
		const existing = await prisma.profileView.findFirst({ where: { profileId: profile.id, sessionId: sid } });

		if (existing) {
			await prisma.profileView.update({
				where: { id: existing.id },
				data: {
					durationMs: durationMs ?? existing.durationMs,
					projectsOpened: projectsOpened ?? existing.projectsOpened,
				},
			});
		} else {
			await prisma.profileView.create({
				data: {
					profileId: profile.id,
					sessionId: sid,
					referrer: referrer || null,
					userAgent: typeof userAgent === "string" ? userAgent : null,
					durationMs: durationMs || null,
					projectsOpened: projectsOpened || [],
				},
			});

			// Increment the denormalized view counter
			await prisma.profile.update({
				where: { id: profile.id },
				data: { views: { increment: 1 } },
			});
		}

		res.json({ success: true, sessionId: sid });
	} catch (error) {
		console.error("trackView error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// GET /api/engagement/overview — owner's engagement summary
export const getEngagementOverview = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		const [totalViews, last30Views, linkClicks, unreadBriefs, pendingTestimonials, topProjects] =
			await prisma.$transaction([
				prisma.profileView.count({ where: { profileId: profile.id } }),
				prisma.profileView.count({ where: { profileId: profile.id, createdAt: { gte: thirtyDaysAgo } } }),
				prisma.link.aggregate({ where: { profileId: profile.id }, _sum: { clicks: true } }),
				prisma.projectBrief.count({ where: { profileId: profile.id, read: false, archived: false } }),
				prisma.testimonial.count({ where: { profileId: profile.id, approved: false, quote: { not: "" } } }),
				prisma.link.findMany({
					where: { profileId: profile.id },
					orderBy: { clicks: "desc" },
					take: 5,
					select: { id: true, title: true, clicks: true },
				}),
			]);

		// Views per day for the last 30 days (raw query for grouping by date)
		const viewsTimeline = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
			SELECT DATE("createdAt")::text AS date, COUNT(*)::bigint AS count
			FROM profile_views
			WHERE "profileId" = ${profile.id}
			  AND "createdAt" >= ${thirtyDaysAgo}
			GROUP BY DATE("createdAt")
			ORDER BY date ASC
		`;

		// Referrer breakdown
		const referrers = await prisma.$queryRaw<{ referrer: string | null; count: bigint }[]>`
			SELECT referrer, COUNT(*)::bigint AS count
			FROM profile_views
			WHERE "profileId" = ${profile.id}
			  AND "createdAt" >= ${thirtyDaysAgo}
			GROUP BY referrer
			ORDER BY count DESC
			LIMIT 10
		`;

		res.json({
			success: true,
			data: {
				totalViews,
				last30Views,
				totalClicks: Number(linkClicks._sum.clicks ?? 0),
				unreadBriefs,
				pendingTestimonials,
				topProjects,
				viewsTimeline: viewsTimeline.map((r) => ({ date: r.date, count: Number(r.count) })),
				referrers: referrers.map((r) => ({ referrer: r.referrer || "Direct", count: Number(r.count) })),
			},
		});
	} catch (error) {
		console.error("getEngagementOverview error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
