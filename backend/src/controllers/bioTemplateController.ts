import { Request, Response } from "express";
import { prisma } from "../config/db.js";

const QUESTIONS = [
	{ key: "role", prompt: "What's your primary role? (e.g. React developer, UI/UX designer, full-stack engineer)" },
	{ key: "yearsExp", prompt: "How many years of experience do you have?" },
	{ key: "specialty", prompt: "What's your main specialty or the type of work you love most?" },
];

// GET /api/bio-template/questions — returns the 3 guided questions
export const getQuestions = (_req: Request, res: Response) => {
	res.json({ success: true, data: QUESTIONS });
};

// POST /api/bio-template/generate — takes 3 answers, returns a composed bio string
// No AI: pure template composition so it works offline with no API keys
export const generateBio = async (req: Request & { userId?: string }, res: Response) => {
	try {
		const { role, yearsExp, specialty } = req.body;

		if (!role?.trim() || !yearsExp || !specialty?.trim()) {
			return res.status(400).json({ success: false, message: "All three answers are required" });
		}

		const years = parseInt(yearsExp, 10);
		const experiencePhrase =
			years >= 10
				? `${years}+ years of experience`
				: years === 1
				? "1 year of experience"
				: `${years} years of experience`;

		const bio = `${role.trim()} with ${experiencePhrase}. Specialising in ${specialty.trim()}. I help clients turn ideas into polished, production-ready products — on time and without surprises.`;

		// Optionally auto-save to profile if authenticated
		if (req.userId) {
			await prisma.profile.updateMany({
				where: { userId: req.userId },
				data: { bio },
			});
		}

		res.json({ success: true, data: { bio } });
	} catch (error) {
		console.error("generateBio error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
