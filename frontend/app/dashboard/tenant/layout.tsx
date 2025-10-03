"use client";
import { ReactNode } from "react";

export default function TenantDashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-blue-600 text-white px-6 py-4 text-2xl font-bold">
                Tenant Dashboard
            </header>
            <main className="p-6">
                {children}
            </main>
        </div>
    );
}