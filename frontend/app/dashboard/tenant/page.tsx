"use client";
import { useSession } from "next-auth/react";

export default function TenantDashboardPage() {
    const { data: session } = useSession();

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome, Tenant!</h2>
            {session?.user ? (
                <div>
                    <p><strong>Name:</strong> {session.user.name}</p>
                    <p><strong>Email:</strong> {session.user.email}</p>
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt="Profile"
                            className="w-16 h-16 rounded-full mt-2"
                        />
                    )}
                </div>
            ) : (
                <p className="text-red-500">You are not logged in.</p>
            )}
            {/* Add more owner dashboard features here */}
        </div>
    );
}