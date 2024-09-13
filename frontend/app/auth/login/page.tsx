'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            setError(result.error);
        } else {
            try {
                const res = await fetch('/api/auth/session');
                const session = await res.json();
                console.log("User's role is", session?.user?.role);

                if (session?.user?.role === 'ADMIN') {
                    console.log("User's role is", session?.user?.role);
                    console.log("going to admin dashboard");
                    router.push('/admin/dashboard');
                } else if (session?.user?.role === 'TENANT') {
                    console.log("User's role is", session?.user?.role);
                    console.log("going to tenant dashboard");
                    router.push('/tenant/dashboard');
                } else {
                    setError('Unknown user role');
                }
            } catch (err) {
                console.error("Error fetching session:", err);
                setError('Failed to fetch user role');
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-semibold mb-4">Login</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="bg-green-500 hover:bg-blue-700 rounded focus:outline-none focus:shadow-outline text-white font-bold cursor-pointer px-6 py-2"
                >
                    Login Here
                </button>
            </form>
        </div>
    );
}
