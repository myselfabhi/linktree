import { Request, Response } from "express";
import { Prisma, AvailabilityStatus } from "@prisma/client";
import { prisma } from "../config/db.js";

interface CreateProfileBody {
	username: string;
	displayName: string;
	bio?: string;
	avatar?: string;
	font?: string;
	backgroundImage?: string;
	colors?: Record<string, unknown>;
}

interface UpdateProfileBody {
	username?: string;
	displayName?: string;
	bio?: string;
	avatar?: string;
	theme?: Record<string, unknown>;
	colors?: Record<string, unknown>;
	font?: string;
	backgroundImage?: string;
	// Hire-me panel
	headline?: string;
	location?: string;
	timezone?: string;
	availabilityStatus?: AvailabilityStatus;
	availableFrom?: string | null;
	hourlyRateMin?: number | null;
	hourlyRateMax?: number | null;
	projectRateMin?: number | null;
	projectRateMax?: number | null;
	currency?: string;
	calendlyUrl?: string | null;
	contactEmail?: string | null;
	servicesOffered?: string[];
	// Socials
	twitterUrl?: string | null;
	linkedinUrl?: string | null;
	githubUrl?: string | null;
	websiteUrl?: string | null;
}

const USERNAME_REGEX = /^[a-z0-9_-]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

const validateUsername = (username: string): string | null => {
	if (username.length < USERNAME_MIN_LENGTH) {
		return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
	}
	if (username.length > USERNAME_MAX_LENGTH) {
		return `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
	}
	if (!USERNAME_REGEX.test(username)) {
		return "Username can only contain lowercase letters, numbers, hyphens, and underscores";
	}
	return null;
};

export const createProfile = async (
	req: Request<{}, {}, CreateProfileBody>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const { username, displayName, bio, avatar, font, backgroundImage, colors } = req.body;

		if (!username || !displayName) {
			return res.status(400).json({
				success: false,
				message: "Username and display name are required",
			});
		}

		const normalizedUsername = username.toLowerCase();
		const usernameError = validateUsername(normalizedUsername);
		if (usernameError) {
			return res.status(400).json({ success: false, message: usernameError });
		}

		const existingProfile = await prisma.profile.findUnique({ where: { userId } });
		if (existingProfile) {
			return res.status(409).json({
				success: false,
				message: "Profile already exists. Use PUT to update.",
			});
		}

		const usernameTaken = await prisma.profile.findUnique({
			where: { username: normalizedUsername },
		});
		if (usernameTaken) {
			return res.status(409).json({
				success: false,
				message: "Username is already taken",
			});
		}

		const profile = await prisma.profile.create({
			data: {
				userId,
				username: normalizedUsername,
				displayName: displayName.trim(),
				bio: bio?.trim() || null,
				avatar: avatar || null,
				font: font?.trim() || null,
				backgroundImage: backgroundImage || null,
				colors: (colors ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
			},
		});

		res.status(201).json({
			success: true,
			message: "Profile created successfully",
			data: { profile },
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return res.status(409).json({
				success: false,
				message: "Username is already taken",
			});
		}
		console.error("Create profile error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const getProfile = async (req: Request, res: Response) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const profile = await prisma.profile.findUnique({
			where: { userId },
			include: { user: { select: { email: true, name: true } } },
		});

		res.status(200).json({
			success: true,
			data: {
				profile: profile
					? { ...profile, views: profile.views ?? 0 }
					: null,
			},
		});
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const updateProfile = async (
	req: Request<{}, {}, UpdateProfileBody>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const existing = await prisma.profile.findUnique({ where: { userId } });
		if (!existing) {
			return res.status(404).json({
				success: false,
				message: "Profile not found. Create a profile first.",
			});
		}

		const {
			username, displayName, bio, avatar, theme, colors, font, backgroundImage,
			headline, location, timezone, availabilityStatus, availableFrom,
			hourlyRateMin, hourlyRateMax, projectRateMin, projectRateMax,
			currency, calendlyUrl, contactEmail, servicesOffered,
			twitterUrl, linkedinUrl, githubUrl, websiteUrl,
		} = req.body;

		const data: Prisma.ProfileUpdateInput = {};

		if (username) {
			const normalizedUsername = username.toLowerCase();
			const usernameError = validateUsername(normalizedUsername);
			if (usernameError) {
				return res.status(400).json({ success: false, message: usernameError });
			}

			const usernameTaken = await prisma.profile.findFirst({
				where: { username: normalizedUsername, NOT: { userId } },
			});
			if (usernameTaken) {
				return res.status(409).json({
					success: false,
					message: "Username is already taken",
				});
			}
			data.username = normalizedUsername;
		}

		if (displayName !== undefined) data.displayName = displayName.trim();
		if (bio !== undefined) data.bio = bio.trim() || null;
		if (avatar !== undefined) data.avatar = avatar || null;
		if (theme !== undefined) data.theme = (theme ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull;
		if (colors !== undefined) data.colors = (colors ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull;
		if (font !== undefined) data.font = font || null;
		if (backgroundImage !== undefined) data.backgroundImage = backgroundImage || null;

		// Hire-me panel
		if (headline !== undefined) data.headline = headline?.trim() || null;
		if (location !== undefined) data.location = location?.trim() || null;
		if (timezone !== undefined) data.timezone = timezone?.trim() || null;
		if (availabilityStatus !== undefined) data.availabilityStatus = availabilityStatus;
		if (availableFrom !== undefined) data.availableFrom = availableFrom ? new Date(availableFrom) : null;
		if (hourlyRateMin !== undefined) data.hourlyRateMin = hourlyRateMin ?? null;
		if (hourlyRateMax !== undefined) data.hourlyRateMax = hourlyRateMax ?? null;
		if (projectRateMin !== undefined) data.projectRateMin = projectRateMin ?? null;
		if (projectRateMax !== undefined) data.projectRateMax = projectRateMax ?? null;
		if (currency !== undefined) data.currency = currency || "USD";
		if (calendlyUrl !== undefined) data.calendlyUrl = calendlyUrl || null;
		if (contactEmail !== undefined) data.contactEmail = contactEmail || null;
		if (servicesOffered !== undefined) data.servicesOffered = servicesOffered;

		// Socials
		if (twitterUrl !== undefined) data.twitterUrl = twitterUrl || null;
		if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl || null;
		if (githubUrl !== undefined) data.githubUrl = githubUrl || null;
		if (websiteUrl !== undefined) data.websiteUrl = websiteUrl || null;

		const profile = await prisma.profile.update({
			where: { userId },
			data,
		});

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			data: { profile },
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return res.status(409).json({
				success: false,
				message: "Username is already taken",
			});
		}
		console.error("Update profile error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const getPublicProfile = async (req: Request, res: Response) => {
	try {
		const { username } = req.params;

		if (!username) {
			return res.status(400).json({ success: false, message: "Username is required" });
		}

		const profile = await prisma.profile.findUnique({
			where: { username: username.toLowerCase() },
		});

		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		res.status(200).json({
			success: true,
			data: {
				profile: {
					id: profile.id,
					username: profile.username,
					displayName: profile.displayName,
					bio: profile.bio,
					avatar: profile.avatar,
					theme: profile.theme,
					colors: profile.colors,
					font: profile.font,
					backgroundImage: profile.backgroundImage,
					views: profile.views ?? 0,
					createdAt: profile.createdAt,
					// Hire-me
					headline: profile.headline,
					location: profile.location,
					timezone: profile.timezone,
					availabilityStatus: profile.availabilityStatus,
					availableFrom: profile.availableFrom,
					hourlyRateMin: profile.hourlyRateMin,
					hourlyRateMax: profile.hourlyRateMax,
					projectRateMin: profile.projectRateMin,
					projectRateMax: profile.projectRateMax,
					currency: profile.currency,
					calendlyUrl: profile.calendlyUrl,
					contactEmail: profile.contactEmail,
					servicesOffered: profile.servicesOffered,
					// Socials
					twitterUrl: profile.twitterUrl,
					linkedinUrl: profile.linkedinUrl,
					githubUrl: profile.githubUrl,
					websiteUrl: profile.websiteUrl,
				},
			},
		});
	} catch (error) {
		console.error("Get public profile error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const checkUsernameAvailability = async (req: Request, res: Response) => {
	try {
		const { username } = req.query;

		if (!username || typeof username !== "string") {
			return res.status(400).json({ success: false, message: "Username is required" });
		}

		const normalizedUsername = username.toLowerCase();
		const usernameError = validateUsername(normalizedUsername);
		if (usernameError) {
			return res.status(400).json({
				success: false,
				message: usernameError,
				available: false,
			});
		}

		const existing = await prisma.profile.findUnique({
			where: { username: normalizedUsername },
			select: { id: true },
		});

		res.status(200).json({
			success: true,
			data: { username: normalizedUsername, available: !existing },
		});
	} catch (error) {
		console.error("Check username availability error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const trackProfileView = async (req: Request, res: Response) => {
	try {
		const { username } = req.params;

		if (!username) {
			return res.status(400).json({ success: false, message: "Username is required" });
		}

		try {
			const profile = await prisma.profile.update({
				where: { username: username.toLowerCase() },
				data: { views: { increment: 1 } },
				select: { views: true },
			});
			res.status(200).json({ success: true, data: { views: profile.views } });
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
				return res.status(404).json({ success: false, message: "Profile not found" });
			}
			throw e;
		}
	} catch (error) {
		console.error("Track profile view error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};
