import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined in environment variables");
}

interface SignupBody {
	email: string;
	password: string;
	name: string;
}

interface LoginBody {
	email: string;
	password: string;
}

export const signup = async (req: Request<{}, {}, SignupBody>, res: Response) => {
	try {
		const { email, password, name } = req.body;

		if (!email || !password || !name) {
			return res.status(400).json({
				success: false,
				message: "Email, password, and name are required",
			});
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: "Invalid email format",
			});
		}

		if (password.length < 8) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 8 characters long",
			});
		}

		const normalizedEmail = email.toLowerCase();

		const existingUser = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		});
		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: "User with this email already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				email: normalizedEmail,
				password: hashedPassword,
				name: name.trim(),
			},
		});

		const token = jwt.sign(
			{ userId: user.id, email: user.email },
			JWT_SECRET,
			{ expiresIn: "7d" }
		);

		res.status(201).json({
			success: true,
			message: "User created successfully",
			data: {
				user: { id: user.id, email: user.email, name: user.name },
				token,
			},
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return res.status(409).json({
				success: false,
				message: "User with this email already exists",
			});
		}
		console.error("Signup error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Email and password are required",
			});
		}

		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		const token = jwt.sign(
			{ userId: user.id, email: user.email },
			JWT_SECRET,
			{ expiresIn: "7d" }
		);

		res.status(200).json({
			success: true,
			message: "Login successful",
			data: {
				user: { id: user.id, email: user.email, name: user.name },
				token,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const getCurrentUser = async (req: Request, res: Response) => {
	try {
		const userId = (req as any).userId;

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, name: true },
		});
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			data: { user },
		});
	} catch (error) {
		console.error("Get current user error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
