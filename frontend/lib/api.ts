const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3003";

export async function apiRequest(
	endpoint: string,
	options: RequestInit = {},
	token?: string
) {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string> || {}),
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${BACKEND_URL}${endpoint}`, {
		...options,
		headers,
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "Request failed");
	}

	return data;
}

// ─── Profile API ──────────────────────────────────────────────────────────
export const profileApi = {
	get: (token: string) => apiRequest("/api/profile", { method: "GET" }, token),

	create: (data: {
		username: string;
		displayName: string;
		bio?: string;
		font?: string;
		avatar?: string;
		backgroundImage?: string;
		colors?: Record<string, string>;
	}, token: string) => apiRequest("/api/profile", { method: "POST", body: JSON.stringify(data) }, token),

	update: (data: Record<string, unknown>, token: string) =>
		apiRequest("/api/profile", { method: "PUT", body: JSON.stringify(data) }, token),

	checkUsername: (username: string) =>
		apiRequest(`/api/profile/check/username?username=${encodeURIComponent(username)}`, { method: "GET" }),

	getPublic: (username: string) =>
		apiRequest(`/api/profile/${username}`, { method: "GET" }),

	trackView: (username: string, payload?: { sessionId?: string; referrer?: string; durationMs?: number; projectsOpened?: string[] }) =>
		apiRequest(`/api/profile/${username}/view`, { method: "POST", body: JSON.stringify(payload ?? {}) }),

	submitBrief: (username: string, data: {
		fromName: string;
		fromEmail: string;
		fromCompany?: string;
		budgetMin?: number;
		budgetMax?: number;
		currency?: string;
		timeline?: string;
		scope: string;
	}) => apiRequest(`/api/profile/${username}/brief`, { method: "POST", body: JSON.stringify(data) }),

	getPublicTestimonials: (username: string) =>
		apiRequest(`/api/profile/${username}/testimonials`, { method: "GET" }),
};

// ─── Link API ─────────────────────────────────────────────────────────────
export const linkApi = {
	getAll: (token: string) => apiRequest("/api/links", { method: "GET" }, token),

	create: (data: {
		title: string;
		url?: string;
		description?: string;
		techStack?: string[];
		role?: "Frontend" | "Backend" | "Full Stack";
		githubUrl?: string;
	}, token: string) => apiRequest("/api/links", { method: "POST", body: JSON.stringify(data) }, token),

	update: (id: string, data: Record<string, unknown>, token: string) =>
		apiRequest(`/api/links/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),

	delete: (id: string, token: string) =>
		apiRequest(`/api/links/${id}`, { method: "DELETE" }, token),

	validate: (id: string, token: string) =>
		apiRequest(`/api/links/${id}/validate`, { method: "POST" }, token),

	getPublic: (username: string) =>
		apiRequest(`/api/links/public/${username}`, { method: "GET" }),

	getPublicOne: (username: string, id: string) =>
		apiRequest(`/api/links/public/${username}/${id}`, { method: "GET" }),

	track: (id: string) =>
		apiRequest(`/api/links/track/${id}`, { method: "GET" }),
};

// ─── GitHub API ───────────────────────────────────────────────────────────
export const githubApi = {
	fetch: (githubUrl: string, token: string) =>
		apiRequest("/api/github/fetch", { method: "POST", body: JSON.stringify({ githubUrl }) }, token),
};

// ─── Upload API ───────────────────────────────────────────────────────────
export const uploadApi = {
	upload: async (file: File, type: "avatar" | "background", token: string) => {
		const formData = new FormData();
		formData.append("image", file);

		const response = await fetch(`${BACKEND_URL}/api/upload?type=${type}`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: formData,
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.message || "Upload failed");
		return data;
	},

	delete: (url: string, token: string) =>
		apiRequest("/api/upload", { method: "DELETE", body: JSON.stringify({ url }) }, token),
};

// ─── Testimonial API ──────────────────────────────────────────────────────
export const testimonialApi = {
	request: (requestedFor: string, token: string) =>
		apiRequest("/api/testimonials/request", { method: "POST", body: JSON.stringify({ requestedFor }) }, token),

	getAll: (token: string) => apiRequest("/api/testimonials", { method: "GET" }, token),

	approve: (id: string, token: string) =>
		apiRequest(`/api/testimonials/${id}/approve`, { method: "PATCH" }, token),

	delete: (id: string, token: string) =>
		apiRequest(`/api/testimonials/${id}`, { method: "DELETE" }, token),

	getSubmitForm: (token: string) =>
		apiRequest(`/api/testimonials/submit/${token}`, { method: "GET" }),

	submit: (token: string, data: {
		quote: string;
		authorName: string;
		authorRole?: string;
		authorCompany?: string;
		authorAvatar?: string;
		authorLinkedIn?: string;
	}) => apiRequest(`/api/testimonials/submit/${token}`, { method: "POST", body: JSON.stringify(data) }),
};

// ─── Brief API ────────────────────────────────────────────────────────────
export const briefApi = {
	getAll: (token: string) => apiRequest("/api/briefs", { method: "GET" }, token),
	markRead: (id: string, token: string) => apiRequest(`/api/briefs/${id}/read`, { method: "PATCH" }, token),
	archive: (id: string, token: string) => apiRequest(`/api/briefs/${id}/archive`, { method: "PATCH" }, token),
	delete: (id: string, token: string) => apiRequest(`/api/briefs/${id}`, { method: "DELETE" }, token),
};

// ─── Engagement API ───────────────────────────────────────────────────────
export const engagementApi = {
	overview: (token: string) => apiRequest("/api/engagement/overview", { method: "GET" }, token),
};

// ─── Bio Template API ─────────────────────────────────────────────────────
export const bioTemplateApi = {
	questions: () => apiRequest("/api/bio-template/questions", { method: "GET" }),
	generate: (answers: { role: string; yearsExp: string; specialty: string }, token?: string) =>
		apiRequest("/api/bio-template/generate", { method: "POST", body: JSON.stringify(answers) }, token),
};
