"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// Legacy URL — redirect to /u/[username]
export default function LegacyProfileRedirect() {
	const { username } = useParams<{ username: string }>();
	const router = useRouter();
	useEffect(() => { router.replace(`/u/${username}`); }, [username, router]);
	return null;
}
