/**
 * One-time migration: copies User / Profile / Link from MongoDB → Postgres.
 *
 * Usage:
 *   1. Ensure DATABASE_URL points at the new Postgres and `prisma migrate dev` has run.
 *   2. Ensure MONGODB_URI is reachable.
 *   3. npx tsx src/scripts/migrateFromMongo.ts
 *
 * The script is idempotent on email/username conflicts (skips and logs).
 * ObjectIds are remapped to UUIDs; relations are preserved via in-memory maps.
 */

import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { LinkRole, LinkStatus, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
	console.error("MONGODB_URI not set");
	process.exit(1);
}

const prisma = new PrismaClient();
const mongo = new MongoClient(MONGODB_URI);

const roleMap: Record<string, LinkRole> = {
	Frontend: LinkRole.Frontend,
	Backend: LinkRole.Backend,
	"Full Stack": LinkRole.FullStack,
};

const statusMap: Record<string, LinkStatus> = {
	live: LinkStatus.live,
	down: LinkStatus.down,
	slow: LinkStatus.slow,
	unknown: LinkStatus.unknown,
};

async function main() {
	await mongo.connect();
	const dbName = new URL(MONGODB_URI!).pathname.replace(/^\//, "") || "test";
	const db = mongo.db(dbName);

	const userIdMap = new Map<string, string>();
	const profileIdMap = new Map<string, string>();

	// Users
	const users = await db.collection("users").find().toArray();
	console.log(`Found ${users.length} users`);
	for (const u of users) {
		const newId = randomUUID();
		try {
			await prisma.user.create({
				data: {
					id: newId,
					email: String(u.email).toLowerCase(),
					password: String(u.password),
					name: String(u.name),
					createdAt: u.createdAt ?? new Date(),
					updatedAt: u.updatedAt ?? new Date(),
				},
			});
			userIdMap.set((u._id as ObjectId).toString(), newId);
		} catch (e: any) {
			console.warn(`Skipping user ${u.email}: ${e.message}`);
		}
	}

	// Profiles
	const profiles = await db.collection("profiles").find().toArray();
	console.log(`Found ${profiles.length} profiles`);
	for (const p of profiles) {
		const newUserId = userIdMap.get((p.userId as ObjectId).toString());
		if (!newUserId) {
			console.warn(`Skipping profile ${p.username}: parent user not migrated`);
			continue;
		}
		const newId = randomUUID();
		try {
			await prisma.profile.create({
				data: {
					id: newId,
					userId: newUserId,
					username: String(p.username).toLowerCase(),
					displayName: String(p.displayName),
					bio: p.bio ?? null,
					avatar: p.avatar ?? null,
					theme: p.theme ?? undefined,
					colors: p.colors ?? undefined,
					font: p.font ?? null,
					backgroundImage: p.backgroundImage ?? null,
					views: typeof p.views === "number" ? p.views : 0,
					createdAt: p.createdAt ?? new Date(),
					updatedAt: p.updatedAt ?? new Date(),
				},
			});
			profileIdMap.set((p._id as ObjectId).toString(), newId);
		} catch (e: any) {
			console.warn(`Skipping profile ${p.username}: ${e.message}`);
		}
	}

	// Links
	const links = await db.collection("links").find().toArray();
	console.log(`Found ${links.length} links`);
	let linksInserted = 0;
	for (const l of links) {
		const newProfileId = profileIdMap.get((l.profileId as ObjectId).toString());
		if (!newProfileId) {
			console.warn(`Skipping link ${l.title}: parent profile not migrated`);
			continue;
		}
		try {
			await prisma.link.create({
				data: {
					id: randomUUID(),
					profileId: newProfileId,
					title: String(l.title),
					url: l.url ?? null,
					description: l.description ?? null,
					order: typeof l.order === "number" ? l.order : 0,
					clicks: typeof l.clicks === "number" ? l.clicks : 0,
					techStack: Array.isArray(l.techStack) ? l.techStack : [],
					role: roleMap[l.role as string] ?? LinkRole.FullStack,
					githubUrl: l.githubUrl ?? null,
					status: statusMap[l.status as string] ?? LinkStatus.unknown,
					lastCheckedAt: l.lastCheckedAt ?? null,
					screenshotUrl: l.screenshotUrl ?? null,
					githubStars: typeof l.githubStars === "number" ? l.githubStars : null,
					lastCommitDate: l.lastCommitDate ?? null,
					lastCommitMessage: l.lastCommitMessage ?? null,
					lighthousePerformance:
						typeof l.lighthousePerformance === "number" ? l.lighthousePerformance : null,
					lighthouseAccessibility:
						typeof l.lighthouseAccessibility === "number"
							? l.lighthouseAccessibility
							: null,
					lighthouseBestPractices:
						typeof l.lighthouseBestPractices === "number"
							? l.lighthouseBestPractices
							: null,
					lighthouseSEO: typeof l.lighthouseSEO === "number" ? l.lighthouseSEO : null,
					lighthouseLastRun: l.lighthouseLastRun ?? null,
					createdAt: l.createdAt ?? new Date(),
					updatedAt: l.updatedAt ?? new Date(),
				},
			});
			linksInserted++;
		} catch (e: any) {
			console.warn(`Skipping link ${l.title}: ${e.message}`);
		}
	}

	console.log(
		`Done — users: ${userIdMap.size}/${users.length}, profiles: ${profileIdMap.size}/${profiles.length}, links: ${linksInserted}/${links.length}`,
	);
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(async () => {
		await mongo.close();
		await prisma.$disconnect();
	});
