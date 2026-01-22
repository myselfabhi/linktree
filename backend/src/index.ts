import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import linkRoutes from "./routes/link.js";
import uploadRoutes from "./routes/upload.js";
import githubRoutes from "./routes/github.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check: verify MongoDB connection
app.get("/health", async (_req, res) => {
	const ts = new Date().toISOString();
	try {
		const dbOk = mongoose.connection.readyState === 1;
		if (!dbOk) {
			res.status(503).json({
				status: "degraded",
				db: "disconnected",
				readyState: mongoose.connection.readyState,
				timestamp: ts,
			});
			return;
		}
		res.json({ status: "ok", db: "ok", timestamp: ts });
	} catch (e) {
		logger.error({ err: e, health: "check" }, "Health check failed");
		res.status(503).json({
			status: "error",
			db: "error",
			timestamp: ts,
		});
	}
});

// API routes
app.get("/api", (req, res) => {
	res.json({ message: "Linktree Backend API" });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// GitHub routes
if (githubRoutes) {
	app.use("/api/github", githubRoutes);
	logger.info("GitHub routes registered at /api/github");
} else {
	logger.error("GitHub routes module is undefined");
}

// Profile routes
app.use("/api/profile", profileRoutes);

// Link routes
app.use("/api/links", linkRoutes);

// Upload routes
app.use("/api/upload", uploadRoutes);

// Connect to MongoDB and start server
connectDB()
	.then(() => {
		app.listen(PORT, () => {
			logger.info({ port: PORT }, "Backend server running");
		});
	})
	.catch((err) => {
		logger.fatal({ err }, "Failed to connect to MongoDB");
		process.exit(1);
	});

