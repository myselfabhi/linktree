import { Request, Response } from "express";
import Link from "../models/Link.js";
import Profile from "../models/Profile.js";
import { validateUrl } from "../services/urlValidationService.js";
import { captureScreenshot } from "../services/screenshotService.js";
import { fetchGitHubMetrics } from "../services/githubMetricsService.js";
import { runLighthouseAudit } from "../services/lighthouseService.js";
import { logger } from "../utils/logger.js";

interface CreateLinkBody {
	title: string;
	url?: string;
	description?: string;
	techStack?: string[];
	role?: "Frontend" | "Backend" | "Full Stack";
	githubUrl?: string;
}

interface UpdateLinkBody {
	title?: string;
	url?: string;
	description?: string;
	techStack?: string[];
	role?: "Frontend" | "Backend" | "Full Stack";
	githubUrl?: string;
}

const isValidUrl = (url: string): boolean => {
	try {
		const urlObj = new URL(url);
		return urlObj.protocol === "http:" || urlObj.protocol === "https:";
	} catch {
		return false;
	}
};

export const createLink = async (
	req: Request<{}, {}, CreateLinkBody>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const { title, url, description, techStack, role, githubUrl } = req.body;

		if (!title) {
			return res.status(400).json({
				success: false,
				message: "Title is required",
			});
		}

		if (url && !isValidUrl(url)) {
			return res.status(400).json({
				success: false,
				message: "Invalid URL format. Must start with http:// or https://",
			});
		}

		if (techStack && !Array.isArray(techStack)) {
			return res.status(400).json({
				success: false,
				message: "techStack must be an array",
			});
		}

		if (role && !["Frontend", "Backend", "Full Stack"].includes(role)) {
			return res.status(400).json({
				success: false,
				message: "role must be one of: Frontend, Backend, Full Stack",
			});
		}

		if (githubUrl && !isValidUrl(githubUrl)) {
			return res.status(400).json({
				success: false,
				message: "Invalid GitHub URL format. Must start with http:// or https://",
			});
		}

		// Get user's profile
		const profile = await Profile.findOne({ userId });
		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found. Create a profile first.",
			});
		}

		const maxOrderLink = await Link.findOne({ profileId: profile._id })
			.sort({ order: -1 })
			.limit(1);

		const nextOrder = maxOrderLink ? maxOrderLink.order + 1 : 0;

		const link = new Link({
			profileId: profile._id,
			title: title.trim(),
			url: url?.trim(),
			description: description?.trim(),
			techStack: techStack?.map((tech) => tech.trim()).filter(Boolean) || [],
			role: role || "Full Stack",
			githubUrl: githubUrl?.trim(),
			status: "unknown",
			order: nextOrder,
			clicks: 0,
		});

		await link.save();

		if (url && url.trim()) {
			const urlToProcess = url.trim();
			const linkId = link._id.toString();

			captureScreenshot(urlToProcess)
				.then((screenshotUrl) => {
					Link.findByIdAndUpdate(link._id, { screenshotUrl }).catch((err) => {
						logger.error(
							{ err, linkId, url: urlToProcess, task: "screenshot_update" },
							"Failed to update screenshot URL",
						);
					});
				})
				.catch((err) => {
					logger.error(
						{ err, linkId, url: urlToProcess, task: "screenshot_capture" },
						"Failed to capture screenshot",
					);
				});

			runLighthouseAudit(urlToProcess)
				.then((scores) => {
					if (scores) {
						Link.findByIdAndUpdate(link._id, {
							lighthousePerformance: scores.performance,
							lighthouseAccessibility: scores.accessibility,
							lighthouseBestPractices: scores.bestPractices,
							lighthouseSEO: scores.seo,
							lighthouseLastRun: new Date(),
						}).catch((err) => {
							logger.error(
								{ err, linkId, url: urlToProcess, task: "lighthouse_update" },
								"Failed to update Lighthouse scores",
							);
						});
					}
				})
				.catch((err) => {
					logger.error(
						{ err, linkId, url: urlToProcess, task: "lighthouse_audit" },
						"Failed to run Lighthouse audit",
					);
				});
		}

		if (githubUrl && githubUrl.trim()) {
			const ghUrl = githubUrl.trim();
			const linkId = link._id.toString();

			fetchGitHubMetrics(ghUrl)
				.then((metrics) => {
					if (metrics) {
						Link.findByIdAndUpdate(link._id, {
							githubStars: metrics.stars,
							lastCommitDate: metrics.lastCommitDate,
							lastCommitMessage: metrics.lastCommitMessage,
						}).catch((err) => {
							logger.error(
								{ err, linkId, githubUrl: ghUrl, task: "github_update" },
								"Failed to update GitHub metrics",
							);
						});
					}
				})
				.catch((err) => {
					logger.error(
						{ err, linkId, githubUrl: ghUrl, task: "github_metrics" },
						"Failed to fetch GitHub metrics",
					);
				});
		}

		res.status(201).json({
			success: true,
			message: "Link created successfully",
			data: { link },
		});
	} catch (error) {
		logger.error({ err: error, handler: "createLink" }, "Create link error");
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const getLinks = async (req: Request, res: Response) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		// Get user's profile
		const profile = await Profile.findOne({ userId });
		
		// If no profile exists, return empty array (expected state for new users)
		// This prevents 404 errors when user hasn't created a profile yet
		if (!profile) {
			return res.status(200).json({
				success: true,
				data: { links: [] },
			});
		}

		// Get all links for this profile, sorted by order
		const links = await Link.find({ profileId: profile._id }).sort({ order: 1 });

		res.status(200).json({
			success: true,
			data: { links },
		});
	} catch (error) {
		logger.error({ err: error, handler: "getLinks" }, "Get links error");
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const updateLink = async (
	req: Request<{ id: string }, {}, UpdateLinkBody>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const { id } = req.params;
		const { title, url, description, techStack, role, githubUrl } = req.body;

		// Get user's profile
		const profile = await Profile.findOne({ userId });
		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found",
			});
		}

		// Find link and verify it belongs to user's profile
		const link = await Link.findOne({
			_id: id,
			profileId: profile._id,
		});

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Update fields
		if (title !== undefined) {
			link.title = title.trim();
		}
		const urlChanged = url !== undefined && url.trim() !== link.url;
		
		if (url !== undefined) {
			if (url && !isValidUrl(url)) {
				return res.status(400).json({
					success: false,
					message: "Invalid URL format. Must start with http:// or https://",
				});
			}
			link.url = url?.trim();
		}
		if (description !== undefined) {
			link.description = description.trim() || undefined;
		}
		if (techStack !== undefined) {
			if (!Array.isArray(techStack)) {
				return res.status(400).json({
					success: false,
					message: "techStack must be an array",
				});
			}
			link.techStack = techStack.map((tech) => tech.trim()).filter(Boolean);
		}
		if (role !== undefined) {
			if (!["Frontend", "Backend", "Full Stack"].includes(role)) {
				return res.status(400).json({
					success: false,
					message: "role must be one of: Frontend, Backend, Full Stack",
				});
			}
			link.role = role;
		}
		if (githubUrl !== undefined) {
			if (githubUrl && !isValidUrl(githubUrl)) {
				return res.status(400).json({
					success: false,
					message: "Invalid GitHub URL format. Must start with http:// or https://",
				});
			}
			link.githubUrl = githubUrl?.trim() || undefined;
		}

		if (urlChanged) {
			link.screenshotUrl = undefined;
		}

		await link.save();

		if (urlChanged && url && url.trim()) {
			const urlToProcess = url.trim();
			const linkId = link._id.toString();

			captureScreenshot(urlToProcess)
				.then((screenshotUrl) => {
					Link.findByIdAndUpdate(link._id, { screenshotUrl }).catch((err) => {
						logger.error(
							{ err, linkId, url: urlToProcess, task: "screenshot_update" },
							"Failed to update screenshot URL",
						);
					});
				})
				.catch((err) => {
					logger.error(
						{ err, linkId, url: urlToProcess, task: "screenshot_capture" },
						"Failed to capture screenshot",
					);
				});

			runLighthouseAudit(urlToProcess)
				.then((scores) => {
					if (scores) {
						Link.findByIdAndUpdate(link._id, {
							lighthousePerformance: scores.performance,
							lighthouseAccessibility: scores.accessibility,
							lighthouseBestPractices: scores.bestPractices,
							lighthouseSEO: scores.seo,
							lighthouseLastRun: new Date(),
						}).catch((err) => {
							logger.error(
								{ err, linkId, url: urlToProcess, task: "lighthouse_update" },
								"Failed to update Lighthouse scores",
							);
						});
					}
				})
				.catch((err) => {
					logger.error(
						{ err, linkId, url: urlToProcess, task: "lighthouse_audit" },
						"Failed to run Lighthouse audit",
					);
				});
		}

		const githubUrlChanged = githubUrl !== undefined && githubUrl?.trim() !== link.githubUrl;

		if (githubUrlChanged && githubUrl && githubUrl.trim()) {
			const ghUrl = githubUrl.trim();
			const linkId = link._id.toString();

			fetchGitHubMetrics(ghUrl)
				.then((metrics) => {
					if (metrics) {
						Link.findByIdAndUpdate(link._id, {
							githubStars: metrics.stars,
							lastCommitDate: metrics.lastCommitDate,
							lastCommitMessage: metrics.lastCommitMessage,
						}).catch((err) => {
							logger.error(
								{ err, linkId, githubUrl: ghUrl, task: "github_update" },
								"Failed to update GitHub metrics",
							);
						});
					}
				})
				.catch((err) => {
					logger.error(
						{ err, linkId, githubUrl: ghUrl, task: "github_metrics" },
						"Failed to fetch GitHub metrics",
					);
				});
		}

		res.status(200).json({
			success: true,
			message: "Link updated successfully",
			data: { link },
		});
	} catch (error) {
		logger.error({ err: error, handler: "updateLink" }, "Update link error");
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const deleteLink = async (req: Request<{ id: string }>, res: Response) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const { id } = req.params;

		// Get user's profile
		const profile = await Profile.findOne({ userId });
		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found",
			});
		}

		// Find link and verify it belongs to user's profile
		const link = await Link.findOne({
			_id: id,
			profileId: profile._id,
		});

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Delete link
		await Link.deleteOne({ _id: id });

		// Reorder remaining links to fill gaps
		const remainingLinks = await Link.find({ profileId: profile._id }).sort({
			order: 1,
		});
		for (let i = 0; i < remainingLinks.length; i++) {
			remainingLinks[i].order = i;
			await remainingLinks[i].save();
		}

		res.status(200).json({
			success: true,
			message: "Link deleted successfully",
		});
	} catch (error) {
		logger.error({ err: error, handler: "deleteLink" }, "Delete link error");
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const validateLink = async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const { id } = req.params;

		const profile = await Profile.findOne({ userId });
		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found",
			});
		}

		const link = await Link.findOne({
			_id: id,
			profileId: profile._id,
		});

		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		if (!link.url || !link.url.trim()) {
			return res.status(400).json({
				success: false,
				message: "Link does not have a URL to validate",
			});
		}

		const validationResult = await validateUrl(link.url);

		link.status = validationResult.status;
		link.lastCheckedAt = new Date();
		await link.save();

		res.json({
			success: true,
			message: "Link validated successfully",
			data: {
				status: link.status,
				lastCheckedAt: link.lastCheckedAt,
				responseTime: validationResult.responseTime,
				statusCode: validationResult.statusCode,
			},
		});
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Failed to validate link";
		logger.error({ err: error, handler: "validateLink" }, "Validate link error");
		res.status(500).json({
			success: false,
			message: msg,
		});
	}
};

export const getPublicLinks = async (req: Request, res: Response) => {
	try {
		const { username } = req.params;

		if (!username) {
			return res.status(400).json({
				success: false,
				message: "Username is required",
			});
		}

		// Get profile by username
		const profile = await Profile.findOne({
			username: username.toLowerCase(),
		});

		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found",
			});
		}

		// Get all links for this profile, sorted by order
		const links = await Link.find({ profileId: profile._id })
			.sort({ order: 1 })
			.select("-clicks"); // Don't expose click count in public API

		res.status(200).json({
			success: true,
			data: { links },
		});
	} catch (error) {
		logger.error({ err: error, handler: "getPublicLinks" }, "Get public links error");
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const trackLinkClick = async (req: Request<{ id: string }>, res: Response) => {
	try {
		const { id } = req.params;

		// Find link
		const link = await Link.findById(id);
		if (!link) {
			return res.status(404).json({
				success: false,
				message: "Link not found",
			});
		}

		// Increment click count
		link.clicks += 1;
		await link.save();

		// Return the URL to redirect to
		res.status(200).json({
			success: true,
			data: {
				url: link.url,
			},
		});
	} catch (error) {
		logger.error({ err: error, handler: "trackLinkClick" }, "Track link click error");
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};



