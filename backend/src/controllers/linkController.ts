import { Request, Response } from "express";
import { Prisma, LinkRole, LinkStatus } from "@prisma/client";
import { prisma } from "../config/db.js";
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
	// Case study
	problemStatement?: string | null;
	outcomeSummary?: string | null;
	outcomeMetric?: string | null;
	clientName?: string | null;
	clientCompany?: string | null;
	teamSize?: number | null;
	myContribution?: string | null;
	walkthroughUrl?: string | null;
	caseStudyBody?: string | null;
}

const isValidUrl = (url: string): boolean => {
	try {
		const urlObj = new URL(url);
		return urlObj.protocol === "http:" || urlObj.protocol === "https:";
	} catch {
		return false;
	}
};

const roleToEnum = (role?: string): LinkRole => {
	switch (role) {
		case "Frontend":
			return LinkRole.Frontend;
		case "Backend":
			return LinkRole.Backend;
		default:
			return LinkRole.FullStack;
	}
};

const roleToString = (role: LinkRole): "Frontend" | "Backend" | "Full Stack" =>
	role === LinkRole.Frontend ? "Frontend" : role === LinkRole.Backend ? "Backend" : "Full Stack";

const formatLink = <T extends { role: LinkRole }>(link: T) => ({
	...link,
	role: roleToString(link.role),
});

export const createLink = async (
	req: Request<{}, {}, CreateLinkBody>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const { title, url, description, techStack, role, githubUrl } = req.body;

		if (!title) {
			return res.status(400).json({ success: false, message: "Title is required" });
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

		const profile = await prisma.profile.findUnique({
			where: { userId },
			select: { id: true },
		});
		if (!profile) {
			return res.status(404).json({
				success: false,
				message: "Profile not found. Create a profile first.",
			});
		}

		const maxOrderLink = await prisma.link.findFirst({
			where: { profileId: profile.id },
			orderBy: { order: "desc" },
			select: { order: true },
		});
		const nextOrder = maxOrderLink ? maxOrderLink.order + 1 : 0;

		const link = await prisma.link.create({
			data: {
				profileId: profile.id,
				title: title.trim(),
				url: url?.trim() || null,
				description: description?.trim() || null,
				techStack: techStack?.map((tech) => tech.trim()).filter(Boolean) ?? [],
				role: roleToEnum(role),
				githubUrl: githubUrl?.trim() || null,
				status: LinkStatus.unknown,
				order: nextOrder,
				clicks: 0,
			},
		});

		if (url && url.trim()) {
			const urlToProcess = url.trim();
			const linkId = link.id;

			captureScreenshot(urlToProcess)
				.then((screenshotUrl) => {
					prisma.link
						.update({ where: { id: linkId }, data: { screenshotUrl } })
						.catch((err) => {
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
						prisma.link
							.update({
								where: { id: linkId },
								data: {
									lighthousePerformance: scores.performance,
									lighthouseAccessibility: scores.accessibility,
									lighthouseBestPractices: scores.bestPractices,
									lighthouseSEO: scores.seo,
									lighthouseLastRun: new Date(),
								},
							})
							.catch((err) => {
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
			const linkId = link.id;

			fetchGitHubMetrics(ghUrl)
				.then((metrics) => {
					if (metrics) {
						prisma.link
							.update({
								where: { id: linkId },
								data: {
									githubStars: metrics.stars,
									lastCommitDate: metrics.lastCommitDate,
									lastCommitMessage: metrics.lastCommitMessage,
								},
							})
							.catch((err) => {
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
			data: { link: formatLink(link) },
		});
	} catch (error) {
		logger.error({ err: error, handler: "createLink" }, "Create link error");
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const getLinks = async (req: Request, res: Response) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const profile = await prisma.profile.findUnique({
			where: { userId },
			select: { id: true },
		});

		if (!profile) {
			return res.status(200).json({ success: true, data: { links: [] } });
		}

		const links = await prisma.link.findMany({
			where: { profileId: profile.id },
			orderBy: { order: "asc" },
		});

		res.status(200).json({
			success: true,
			data: { links: links.map(formatLink) },
		});
	} catch (error) {
		logger.error({ err: error, handler: "getLinks" }, "Get links error");
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const updateLink = async (
	req: Request<{ id: string }, {}, UpdateLinkBody>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const { id } = req.params;
		const {
			title, url, description, techStack, role, githubUrl,
			problemStatement, outcomeSummary, outcomeMetric,
			clientName, clientCompany, teamSize, myContribution,
			walkthroughUrl, caseStudyBody,
		} = req.body;

		const profile = await prisma.profile.findUnique({
			where: { userId },
			select: { id: true },
		});
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		const existing = await prisma.link.findFirst({
			where: { id, profileId: profile.id },
		});

		if (!existing) {
			return res.status(404).json({ success: false, message: "Link not found" });
		}

		const data: Prisma.LinkUpdateInput = {};

		if (title !== undefined) data.title = title.trim();

		const trimmedUrl = url?.trim();
		const urlChanged = url !== undefined && trimmedUrl !== (existing.url ?? undefined);

		if (url !== undefined) {
			if (url && !isValidUrl(url)) {
				return res.status(400).json({
					success: false,
					message: "Invalid URL format. Must start with http:// or https://",
				});
			}
			data.url = trimmedUrl || null;
		}

		if (description !== undefined) data.description = description.trim() || null;

		if (techStack !== undefined) {
			if (!Array.isArray(techStack)) {
				return res.status(400).json({
					success: false,
					message: "techStack must be an array",
				});
			}
			data.techStack = techStack.map((tech) => tech.trim()).filter(Boolean);
		}

		if (role !== undefined) {
			if (!["Frontend", "Backend", "Full Stack"].includes(role)) {
				return res.status(400).json({
					success: false,
					message: "role must be one of: Frontend, Backend, Full Stack",
				});
			}
			data.role = roleToEnum(role);
		}

		const trimmedGithubUrl = githubUrl?.trim();
		const githubUrlChanged =
			githubUrl !== undefined && trimmedGithubUrl !== (existing.githubUrl ?? undefined);

		if (githubUrl !== undefined) {
			if (githubUrl && !isValidUrl(githubUrl)) {
				return res.status(400).json({
					success: false,
					message: "Invalid GitHub URL format. Must start with http:// or https://",
				});
			}
			data.githubUrl = trimmedGithubUrl || null;
		}

		if (urlChanged) {
			data.screenshotUrl = null;
		}

		// Case study fields
		if (problemStatement !== undefined) data.problemStatement = problemStatement ?? null;
		if (outcomeSummary !== undefined) data.outcomeSummary = outcomeSummary ?? null;
		if (outcomeMetric !== undefined) data.outcomeMetric = outcomeMetric ?? null;
		if (clientName !== undefined) data.clientName = clientName ?? null;
		if (clientCompany !== undefined) data.clientCompany = clientCompany ?? null;
		if (teamSize !== undefined) data.teamSize = teamSize ?? null;
		if (myContribution !== undefined) data.myContribution = myContribution ?? null;
		if (walkthroughUrl !== undefined) data.walkthroughUrl = walkthroughUrl ?? null;
		if (caseStudyBody !== undefined) data.caseStudyBody = caseStudyBody ?? null;

		const link = await prisma.link.update({ where: { id }, data });

		if (urlChanged && trimmedUrl) {
			const urlToProcess = trimmedUrl;
			const linkId = link.id;

			captureScreenshot(urlToProcess)
				.then((screenshotUrl) => {
					prisma.link
						.update({ where: { id: linkId }, data: { screenshotUrl } })
						.catch((err) => {
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
						prisma.link
							.update({
								where: { id: linkId },
								data: {
									lighthousePerformance: scores.performance,
									lighthouseAccessibility: scores.accessibility,
									lighthouseBestPractices: scores.bestPractices,
									lighthouseSEO: scores.seo,
									lighthouseLastRun: new Date(),
								},
							})
							.catch((err) => {
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

		if (githubUrlChanged && trimmedGithubUrl) {
			const ghUrl = trimmedGithubUrl;
			const linkId = link.id;

			fetchGitHubMetrics(ghUrl)
				.then((metrics) => {
					if (metrics) {
						prisma.link
							.update({
								where: { id: linkId },
								data: {
									githubStars: metrics.stars,
									lastCommitDate: metrics.lastCommitDate,
									lastCommitMessage: metrics.lastCommitMessage,
								},
							})
							.catch((err) => {
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
			data: { link: formatLink(link) },
		});
	} catch (error) {
		logger.error({ err: error, handler: "updateLink" }, "Update link error");
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const deleteLink = async (req: Request<{ id: string }>, res: Response) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const { id } = req.params;

		const profile = await prisma.profile.findUnique({
			where: { userId },
			select: { id: true },
		});
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		const link = await prisma.link.findFirst({
			where: { id, profileId: profile.id },
			select: { id: true },
		});

		if (!link) {
			return res.status(404).json({ success: false, message: "Link not found" });
		}

		await prisma.$transaction(async (tx) => {
			await tx.link.delete({ where: { id } });
			const remaining = await tx.link.findMany({
				where: { profileId: profile.id },
				orderBy: { order: "asc" },
				select: { id: true },
			});
			for (let i = 0; i < remaining.length; i++) {
				await tx.link.update({ where: { id: remaining[i].id }, data: { order: i } });
			}
		});

		res.status(200).json({ success: true, message: "Link deleted successfully" });
	} catch (error) {
		logger.error({ err: error, handler: "deleteLink" }, "Delete link error");
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const validateLink = async (
	req: Request<{ id: string }>,
	res: Response
) => {
	try {
		const userId = req.userId;
		if (!userId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const { id } = req.params;

		const profile = await prisma.profile.findUnique({
			where: { userId },
			select: { id: true },
		});
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		const link = await prisma.link.findFirst({
			where: { id, profileId: profile.id },
		});

		if (!link) {
			return res.status(404).json({ success: false, message: "Link not found" });
		}

		if (!link.url || !link.url.trim()) {
			return res.status(400).json({
				success: false,
				message: "Link does not have a URL to validate",
			});
		}

		const validationResult = await validateUrl(link.url);
		const lastCheckedAt = new Date();

		const updated = await prisma.link.update({
			where: { id },
			data: {
				status: validationResult.status as LinkStatus,
				lastCheckedAt,
			},
		});

		res.json({
			success: true,
			message: "Link validated successfully",
			data: {
				status: updated.status,
				lastCheckedAt: updated.lastCheckedAt,
				responseTime: validationResult.responseTime,
				statusCode: validationResult.statusCode,
			},
		});
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Failed to validate link";
		logger.error({ err: error, handler: "validateLink" }, "Validate link error");
		res.status(500).json({ success: false, message: msg });
	}
};

export const getPublicLinks = async (req: Request, res: Response) => {
	try {
		const { username } = req.params;

		if (!username) {
			return res.status(400).json({ success: false, message: "Username is required" });
		}

		const profile = await prisma.profile.findUnique({
			where: { username: username.toLowerCase() },
			select: { id: true },
		});

		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		const links = await prisma.link.findMany({
			where: { profileId: profile.id },
			orderBy: { order: "asc" },
		});

		res.status(200).json({
			success: true,
			data: { links: links.map(formatLink) },
		});
	} catch (error) {
		logger.error({ err: error, handler: "getPublicLinks" }, "Get public links error");
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

// GET /api/links/public/:username/:id — single project detail for case study page
export const getPublicLink = async (req: Request, res: Response) => {
	try {
		const { username, id } = req.params;

		const profile = await prisma.profile.findUnique({
			where: { username: username.toLowerCase() },
			select: { id: true },
		});
		if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

		const link = await prisma.link.findFirst({ where: { id, profileId: profile.id } });
		if (!link) return res.status(404).json({ success: false, message: "Project not found" });

		res.json({ success: true, data: { link: formatLink(link) } });
	} catch (error) {
		logger.error({ err: error, handler: "getPublicLink" }, "Get public link error");
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

export const trackLinkClick = async (req: Request<{ id: string }>, res: Response) => {
	try {
		const { id } = req.params;

		try {
			const link = await prisma.link.update({
				where: { id },
				data: { clicks: { increment: 1 } },
				select: { url: true },
			});
			res.status(200).json({ success: true, data: { url: link.url } });
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
				return res.status(404).json({ success: false, message: "Link not found" });
			}
			throw e;
		}
	} catch (error) {
		logger.error({ err: error, handler: "trackLinkClick" }, "Track link click error");
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};
