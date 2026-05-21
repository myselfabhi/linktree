import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import crypto from "crypto";

// POST /api/testimonials/request — owner requests a testimonial from someone
export const requestTestimonial = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const { requestedFor } = req.body;

		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const requestToken = crypto.randomBytes(20).toString("hex");

		const testimonial = await prisma.testimonial.create({
			data: {
				profileId: profile.id,
				quote: "",
				authorName: "",
				requestToken,
				requestedFor: requestedFor || null,
			},
		});

		res.status(201).json({
			success: true,
			data: { requestToken, testimonialId: testimonial.id },
		});
	} catch (error) {
		console.error("requestTestimonial error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// GET /api/testimonials/submit/:token — public; fetch the request details
export const getSubmitForm = async (req: Request, res: Response) => {
	try {
		const { token } = req.params;

		const testimonial = await prisma.testimonial.findUnique({
			where: { requestToken: token },
			include: { profile: { select: { username: true, displayName: true, avatar: true } } },
		});

		if (!testimonial) return res.status(404).json({ success: false, message: "Invalid or expired token" });
		if (testimonial.approved || testimonial.quote) {
			return res.status(410).json({ success: false, message: "Testimonial already submitted" });
		}

		res.json({ success: true, data: { profile: testimonial.profile, requestedFor: testimonial.requestedFor } });
	} catch (error) {
		console.error("getSubmitForm error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// POST /api/testimonials/submit/:token — public; submit the testimonial
export const submitTestimonial = async (req: Request, res: Response) => {
	try {
		const { token } = req.params;
		const { quote, authorName, authorRole, authorCompany, authorAvatar, authorLinkedIn } = req.body;

		if (!quote?.trim() || !authorName?.trim()) {
			return res.status(400).json({ success: false, message: "Quote and author name are required" });
		}

		const testimonial = await prisma.testimonial.findUnique({ where: { requestToken: token } });
		if (!testimonial) return res.status(404).json({ success: false, message: "Invalid or expired token" });
		if (testimonial.quote) return res.status(410).json({ success: false, message: "Already submitted" });

		const updated = await prisma.testimonial.update({
			where: { requestToken: token },
			data: {
				quote: quote.trim(),
				authorName: authorName.trim(),
				authorRole: authorRole?.trim() || null,
				authorCompany: authorCompany?.trim() || null,
				authorAvatar: authorAvatar || null,
				authorLinkedIn: authorLinkedIn || null,
				submittedAt: new Date(),
			},
		});

		res.json({ success: true, data: updated });
	} catch (error) {
		console.error("submitTestimonial error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// GET /api/testimonials — owner gets all their testimonials (pending + approved)
export const getMyTestimonials = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const testimonials = await prisma.testimonial.findMany({
			where: { profileId: profile.id },
			orderBy: { submittedAt: "desc" },
		});

		res.json({ success: true, data: testimonials });
	} catch (error) {
		console.error("getMyTestimonials error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// PATCH /api/testimonials/:id/approve — owner approves a testimonial
export const approveTestimonial = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const { id } = req.params;
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const testimonial = await prisma.testimonial.findFirst({ where: { id, profileId: profile.id } });
		if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });

		const updated = await prisma.testimonial.update({
			where: { id },
			data: { approved: true, approvedAt: new Date() },
		});

		res.json({ success: true, data: updated });
	} catch (error) {
		console.error("approveTestimonial error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// DELETE /api/testimonials/:id — owner deletes a testimonial
export const deleteTestimonial = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const { id } = req.params;
		const profile = await prisma.profile.findUnique({ where: { userId: req.userId! } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const testimonial = await prisma.testimonial.findFirst({ where: { id, profileId: profile.id } });
		if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });

		await prisma.testimonial.delete({ where: { id } });

		res.json({ success: true, message: "Deleted" });
	} catch (error) {
		console.error("deleteTestimonial error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// GET /api/public/:username/testimonials — public approved testimonials
export const getPublicTestimonials = async (req: Request, res: Response) => {
	try {
		const { username } = req.params;

		const profile = await prisma.profile.findUnique({ where: { username } });
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const testimonials = await prisma.testimonial.findMany({
			where: { profileId: profile.id, approved: true },
			orderBy: { approvedAt: "desc" },
			select: {
				id: true,
				quote: true,
				authorName: true,
				authorRole: true,
				authorCompany: true,
				authorAvatar: true,
				authorLinkedIn: true,
				verified: true,
				verifiedVia: true,
				approvedAt: true,
			},
		});

		res.json({ success: true, data: testimonials });
	} catch (error) {
		console.error("getPublicTestimonials error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
