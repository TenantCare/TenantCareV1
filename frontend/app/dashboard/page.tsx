"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;
        if (!session?.user) {
            router.push("/"); // Not logged in
        } else if (session.user.role === "OWNER") {
            router.push("/dashboard/owner");
        } else if (session.user.role === "TENANT") {
            router.push("/dashboard/tenant");
        } else {
            router.push("/"); // Default fallback
        }
    }, [session, status, router]);

    return <div>Redirecting...</div>;
}