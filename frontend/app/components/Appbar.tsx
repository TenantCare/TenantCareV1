"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { PrimaryButton } from "./Button";

export const Appbar = () => {
    const { data: session } = useSession();
    return (
        <div className="border-b px-2 py-2 flex justify-between items-center">
            <div className="px-2 text-xl font-bold justify-center flex">
                TenantCare
            </div>
            <div>
                {session ? (
                    <button
                        onClick={() => signOut({ callbackUrl: "/", redirect: true })}
                        className="px-2 py-1 bg-black text-white rounded-md"
                    >
                        Sign Out
                    </button>
                ) : (
                    <button
                        onClick={() => signIn(undefined,{callbackUrl: "/dashboard"})}
                        className="px-2 py-1 bg-black text-white rounded-md"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </div>
    );
};