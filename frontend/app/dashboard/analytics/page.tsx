"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
// Engagement analytics are now on the main dashboard page
export default function AnalyticsRedirect() {
	const router = useRouter();
	useEffect(() => { router.replace("/dashboard"); }, [router]);
	return null;
}
