// components/TenantDashboard.tsx
import { Appbar } from "@/app/components/Appbar";
import React from "react";

const TenantDashboard = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Appbar />
            <nav className="bg-blue-600 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-white text-xl font-bold">Tenant Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <button className="text-white">Home</button>
                        <button className="text-white">Payments</button>
                        <button className="text-white">Apartment Info</button>
                        <button className="text-white">Support</button>
                        <button className="text-white">Logout</button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto p-6">
                {/* Welcome Section */}
                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-2">Welcome, [Tenant Name]!</h2>
                    <p className="text-gray-600">Here’s your apartment info and payment status.</p>
                </section>

                {/* Apartment and Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Apartment Info */}
                    <div className="bg-white p-4 shadow-md rounded-md">
                        <h3 className="text-xl font-semibold mb-2">Apartment Information</h3>
                        <p>Building: [Building Name]</p>
                        <p>Apartment Number: [Apartment Number]</p>
                    </div>

                    {/* Rent and Payment Status */}
                    <div className="bg-white p-4 shadow-md rounded-md">
                        <h3 className="text-xl font-semibold mb-2">Rent Due</h3>
                        <p>Amount: ₹XX,XXX</p>
                        <p>Status: [Pending/Completed]</p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Make Payment</button>
                    </div>
                </div>

                {/* Payment History */}
                <section className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Payment History</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border">Date</th>
                                    <th className="py-2 px-4 border">Amount</th>
                                    <th className="py-2 px-4 border">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Example Row */}
                                <tr>
                                    <td className="py-2 px-4 border">01-09-2024</td>
                                    <td className="py-2 px-4 border">₹15,000</td>
                                    <td className="py-2 px-4 border">Completed</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Support Section */}
                <section>
                    <h3 className="text-xl font-semibold mb-2">Support</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Open New Ticket</button>
                </section>
            </div>
        </div>
    );
};

export default TenantDashboard;
