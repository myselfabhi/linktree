export type LinkStatus = "live" | "down" | "slow" | "unknown";
export type LinkRole = "Frontend" | "Backend" | "Full Stack";
export type AvailabilityStatus = "available" | "available_from" | "booked" | "not_specified";

export interface ProjectLink {
	id: string;
	profileId: string;
	title: string;
	url?: string | null;
	description?: string | null;
	order: number;
	clicks: number;
	techStack: string[];
	role: LinkRole;
	githubUrl?: string | null;
	status: LinkStatus;
	lastCheckedAt?: string | null;
	screenshotUrl?: string | null;
	githubStars?: number | null;
	lastCommitDate?: string | null;
	lastCommitMessage?: string | null;
	lighthousePerformance?: number | null;
	lighthouseAccessibility?: number | null;
	lighthouseBestPractices?: number | null;
	lighthouseSEO?: number | null;
	lighthouseLastRun?: string | null;
	createdAt: string;
	updatedAt: string;
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

export interface PublicProfile {
	id: string;
	username: string;
	displayName: string;
	bio?: string | null;
	avatar?: string | null;
	theme?: Record<string, unknown> | null;
	colors?: Record<string, string> | null;
	font?: string | null;
	backgroundImage?: string | null;
	views: number;
	createdAt: string;
	// Hire-me
	headline?: string | null;
	location?: string | null;
	timezone?: string | null;
	availabilityStatus: AvailabilityStatus;
	availableFrom?: string | null;
	hourlyRateMin?: number | null;
	hourlyRateMax?: number | null;
	projectRateMin?: number | null;
	projectRateMax?: number | null;
	currency?: string | null;
	calendlyUrl?: string | null;
	contactEmail?: string | null;
	servicesOffered: string[];
	// Socials
	twitterUrl?: string | null;
	linkedinUrl?: string | null;
	githubUrl?: string | null;
	websiteUrl?: string | null;
}

export interface Testimonial {
	id: string;
	quote: string;
	authorName: string;
	authorRole?: string | null;
	authorCompany?: string | null;
	authorAvatar?: string | null;
	authorLinkedIn?: string | null;
	verified: boolean;
	verifiedVia?: string | null;
	approvedAt?: string | null;
}
