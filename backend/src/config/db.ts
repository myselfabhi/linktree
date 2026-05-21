import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

declare global {
	// eslint-disable-next-line no-var
	var __prisma: PrismaClient | undefined;
}

export const prisma =
	global.__prisma ??
	new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	global.__prisma = prisma;
}

async function connectDB(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		throw new Error("Please define DATABASE_URL in your .env file");
	}
	await prisma.$connect();
	logger.info("Connected to PostgreSQL");
}

export default connectDB;
