import { Request, Response } from "express";
import { prisma } from "../config/db.js";

// POST /api/public/:username/brief — public; visitor submits a project brief
export const submitBrief = async (req: Request, res: Response) => {
	try {
		const { username } = req.params;
		const { fromName, fromEmail, fromCompany, budgetMin, budgetMax, currency, timeline, scope } = req.body;

		if (!fromName?.trim() || !fromEmail?.trim() || !scope?.trim()) {
			return res.status(400).json({ success: false, message: "Name, email, and scope are required" });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(fromEmail)) {
			return res.status(400).json({ success: false, message: "Invalid email address" });
		}

		const profile = await prisma.profile.findUnique({ where: { username } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const brief = await prisma.projectBrief.create({
			data: {
				profileId: profile.id,
				fromName: fromName.trim(),
				fromEmail: fromEmail.trim().toLowerCase(),
				fromCompany: fromCompany?.trim() || null,
				budgetMin: budgetMin ? Number(budgetMin) : null,
				budgetMax: budgetMax ? Number(budgetMax) : null,
				currency: currency || "USD",
				timeline: timeline?.trim() || null,
				scope: scope.trim(),
			},
		});

		res.status(201).json({ success: true, data: { id: brief.id } });
	} catch (error) {
		console.error("submitBrief error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// GET /api/briefs — owner fetches their briefs (unread first)
export const getMyBriefs = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const briefs = await prisma.projectBrief.findMany({
			where: { profileId: profile.id, archived: false },
			orderBy: [{ read: "asc" }, { createdAt: "desc" }],
		});

		res.json({ success: true, data: briefs });
	} catch (error) {
		console.error("getMyBriefs error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// PATCH /api/briefs/:id/read — mark a brief as read
export const markBriefRead = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const { id } = req.params;
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const brief = await prisma.projectBrief.findFirst({ where: { id, profileId: profile.id } });
		if (!brief) return res.status(404).json({ success: false, message: "Brief not found" });

		await prisma.projectBrief.update({ where: { id }, data: { read: true } });
		res.json({ success: true });
	} catch (error) {
		console.error("markBriefRead error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// PATCH /api/briefs/:id/archive — archive a brief
export const archiveBrief = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const { id } = req.params;
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const brief = await prisma.projectBrief.findFirst({ where: { id, profileId: profile.id } });
		if (!brief) return res.status(404).json({ success: false, message: "Brief not found" });

		await prisma.projectBrief.update({ where: { id }, data: { archived: true, read: true } });
		res.json({ success: true });
	} catch (error) {
		console.error("archiveBrief error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// DELETE /api/briefs/:id — permanently delete a brief
export const deleteBrief = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const { id } = req.params;
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const brief = await prisma.projectBrief.findFirst({ where: { id, profileId: profile.id } });
		if (!brief) return res.status(404).json({ success: false, message: "Brief not found" });

		await prisma.projectBrief.delete({ where: { id } });
		res.json({ success: true });
	} catch (error) {
		console.error("deleteBrief error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
