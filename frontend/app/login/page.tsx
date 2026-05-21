"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Auth is now modal-based on the landing page
export default function LoginRedirect() {
	const router = useRouter();
	useEffect(() => { router.replace("/"); }, [router]);
	return null;
}
